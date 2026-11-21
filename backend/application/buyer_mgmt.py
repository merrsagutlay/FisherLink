# BACKEND
"""Buyer requirement management."""
from application import auth, matching
from application.validation import FRESHNESS, breakdown, choice, number, text
from data_access import buyer_repo, match_repo


def _clean(d):
    return {"species": text(d, "species", "Species", maxlen=40).title(),
            "quantity_kg": number(d, "quantity_kg", "Quantity"),
            "max_price_per_kg": number(d, "max_price_per_kg", "Highest price per kg"),
            "location": text(d, "location", "Location", maxlen=80),
            "min_freshness": choice(d, "min_freshness", "Freshness", FRESHNESS, "good")}


def submit_requirement(user, d):
    auth.require_role(user, "buyer")
    rid = buyer_repo.create(user["id"], _clean(d))
    return buyer_repo.get(rid)


def list_requirements(user):
    auth.require_role(user, "buyer")
    return buyer_repo.list_by_buyer(user["id"])


def cancel_requirement(user, rid):
    auth.require_role(user, "buyer")
    r = buyer_repo.get(rid)
    if not r:
        raise LookupError("Requirement not found.")
    if r["buyer_id"] != user["id"]:
        raise auth.Forbidden("That requirement belongs to another account.")
    buyer_repo.delete(rid)
    return {"ok": True}


def stats(user):
    auth.require_role(user, "buyer")
    reqs = [r for r in buyer_repo.list_by_buyer(user["id"]) if r["status"] == "active"]
    ms = match_repo.list_for_buyer(user["id"])
    covered = len(set(m["requirement_id"] for m in ms))
    return {"active": len(reqs), "kg": round(sum(r["quantity_kg"] for r in reqs), 1),
            "avg_price": round(sum(r["max_price_per_kg"] for r in reqs) / len(reqs), 2) if reqs else 0,
            "by_species": breakdown(reqs, "species"), "by_location": breakdown(reqs, "location", 2),
            "covered_n": covered, "covered_of": len(reqs),
            "covered": round(100.0 * covered / len(reqs)) if reqs else 0,
            "people": len(set(m["fisher_name"] for m in ms))}
