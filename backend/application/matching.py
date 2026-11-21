# BACKEND
"""Matching Processing + Weighted Matching Algorithm.

Score out of 100 = species 40 + price 25 + quantity 15 + location 10 + freshness 10.
A listing must be the requested species and score at least MIN_SCORE.
"""
from data_access import buyer_repo, fish_repo, match_repo

WEIGHTS = {"species": 40, "price": 25, "quantity": 15, "location": 10, "freshness": 10}
MIN_SCORE = 50
_RANK = {"fair": 1, "good": 2, "fresh": 3}


def score_listing(req, listing):
    """Return (score, breakdown). Score is 0 when the species differs."""
    if req["species"].strip().lower() != listing["species"].strip().lower():
        return 0.0, {}
    parts = {"species": WEIGHTS["species"]}

    price, cap = listing["price_per_kg"], req["max_price_per_kg"]
    if price <= cap:
        parts["price"] = WEIGHTS["price"]
    else:
        over = (price - cap) / cap
        parts["price"] = max(0.0, WEIGHTS["price"] * (1 - over / 0.2))  # 0 points once 20% over budget

    parts["quantity"] = WEIGHTS["quantity"] * min(listing["quantity_kg"] / req["quantity_kg"], 1.0)

    a, b = listing["location"].strip().lower(), req["location"].strip().lower()
    parts["location"] = WEIGHTS["location"] if a == b else (WEIGHTS["location"] / 2 if (a in b or b in a) else 0)

    have, need = _RANK.get(listing["freshness"], 1), _RANK.get(req["min_freshness"], 1)
    parts["freshness"] = WEIGHTS["freshness"] if have >= need else (WEIGHTS["freshness"] / 2 if have == need - 1 else 0)

    return round(sum(parts.values()), 1), parts


def _match_requirement(req, listings):
    pairs = []
    for l in listings:
        s, _ = score_listing(req, l)
        if s >= MIN_SCORE:
            pairs.append((l["id"], s))
    match_repo.replace_for_requirement(req["id"], req["buyer_id"], pairs)
    return len(pairs)


def run_matching(buyer):
    listings = fish_repo.list_active()
    for req in buyer_repo.list_by_buyer(buyer["id"]):
        if req["status"] == "active":
            _match_requirement(req, listings)
    return match_repo.list_for_buyer(buyer["id"])


def rematch_all():
    listings = fish_repo.list_active()
    for req in buyer_repo.list_active_all():
        _match_requirement(req, listings)


def for_buyer(user):
    return match_repo.list_for_buyer(user["id"])


def for_owner(user):
    return match_repo.list_for_owner(user["id"])
