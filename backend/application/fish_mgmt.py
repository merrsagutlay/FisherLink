# BACKEND
"""Fish listing management (fisherfolk) and the buyer marketplace."""
import re

from application import auth, matching
from application.validation import FRESHNESS, breakdown, choice, day, number, text
from data_access import fish_repo, match_repo


SOURCES = ("wild", "farmed")
DELIVERY = ("pickup", "delivery", "both")


def _photo(d):
    """None = leave unchanged, '' = remove, otherwise a validated image data URL."""
    v = d.get("photo")
    if v is None:
        return None
    v = str(v)
    if v == "":
        return ""
    if not re.match(r"^data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$", v):
        raise ValueError("Photo must be a JPG, PNG or WebP image.")
    if len(v) > 450000:
        raise ValueError("That photo is too large. Choose a smaller one.")
    return v


def _clean(d):
    qty = number(d, "quantity_kg", "Quantity")
    try:
        min_order = float(d.get("min_order_kg") or 0)
    except (TypeError, ValueError):
        raise ValueError("Minimum order must be a number.")
    if min_order < 0 or min_order > qty:
        raise ValueError("Minimum order cannot be more than the quantity you have.")
    return {"species": text(d, "species", "Species", maxlen=40).title(), "quantity_kg": qty,
            "price_per_kg": number(d, "price_per_kg", "Price per kg"),
            "location": text(d, "location", "Location", maxlen=80),
            "freshness": choice(d, "freshness", "Freshness", FRESHNESS, "fresh"),
            "catch_date": day(d, "catch_date"),
            "notes": text(d, "notes", "Notes", required=False, maxlen=300),
            "source": choice(d, "source", "Source", SOURCES, "wild"),
            "delivery": choice(d, "delivery", "Delivery", DELIVERY, "pickup"),
            "min_order_kg": min_order, "photo": _photo(d)}


def _owned(user, lid):
    auth.require_role(user, "fisherfolk")
    l = fish_repo.get(lid)
    if not l:
        raise LookupError("Listing not found.")
    if l["owner_id"] != user["id"]:
        raise auth.Forbidden("That listing belongs to another account.")
    return l


def post_listing(user, d):
    auth.require_role(user, "fisherfolk")
    c = _clean(d)
    c["photo"] = c["photo"] or ""
    lid = fish_repo.create(user["id"], c)
    matching.rematch_all()
    return fish_repo.get(lid)


def update_listing(user, lid, d):
    old = _owned(user, lid)
    c = _clean(d)
    if c["photo"] is None:
        c["photo"] = old["photo"]
    fish_repo.update(lid, c)
    matching.rematch_all()
    return fish_repo.get(lid)


def market(user):
    """Every active listing, for buyers to browse."""
    auth.require_role(user, "buyer")
    return fish_repo.list_market()


def my_listings(user):
    auth.require_role(user, "fisherfolk")
    return fish_repo.list_by_owner(user["id"])


def mark_sold(user, lid):
    _owned(user, lid)
    fish_repo.set_status(lid, "sold")
    return fish_repo.get(lid)


def delete_listing(user, lid):
    _owned(user, lid)
    fish_repo.delete(lid)
    return {"ok": True}


def get_details(user, lid):
    """Fisherfolk see their own listings; buyers see active listings plus the seller's contact."""
    if not user:
        raise auth.AuthError("Please log in.")
    l = fish_repo.get_with_owner(lid)
    if not l or (user["role"] == "buyer" and l["status"] != "active"):
        raise LookupError("Listing not found.")
    if user["role"] == "fisherfolk" and l["owner_id"] != user["id"]:
        raise auth.Forbidden("That listing belongs to another account.")
    owner = {"name": l.pop("owner_name"), "phone": l.pop("owner_phone"),
             "email": l.pop("owner_email"), "location": l.pop("owner_location"),
             "avatar": l.pop("owner_avatar"), "bio": l.pop("owner_bio")}
    l["owner"] = owner
    return l


def stats(user):
    auth.require_role(user, "fisherfolk")
    active = [l for l in fish_repo.list_by_owner(user["id"]) if l["status"] == "active"]
    ms = match_repo.list_for_owner(user["id"])
    covered = len(set(m["listing_id"] for m in ms))
    return {"active": len(active), "kg": round(sum(l["quantity_kg"] for l in active), 1),
            "avg_price": round(sum(l["price_per_kg"] for l in active) / len(active), 2) if active else 0,
            "by_species": breakdown(active, "species"), "by_location": breakdown(active, "location", 2),
            "covered_n": covered, "covered_of": len(active),
            "covered": round(100.0 * covered / len(active)) if active else 0,
            "people": len(set(m["buyer_name"] for m in ms))}
