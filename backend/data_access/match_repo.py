# BACKEND
from database import db


def replace_for_requirement(req_id, buyer_id, pairs):
    ops = [("DELETE FROM match_results WHERE requirement_id=?", (req_id,))]
    for listing_id, score in pairs:
        ops.append(("INSERT INTO match_results(requirement_id,listing_id,buyer_id,score) VALUES(?,?,?,?)",
                    (req_id, listing_id, buyer_id, score)))
    db.transaction(ops)


def list_for_buyer(buyer_id):
    return db.fetch_all(
        "SELECT m.id, m.score, m.requirement_id, l.id AS listing_id, l.species, l.quantity_kg, l.price_per_kg, "
        "l.location, l.freshness, l.catch_date, u.name AS fisher_name, u.phone AS fisher_phone "
        "FROM match_results m JOIN fish_listings l ON l.id=m.listing_id JOIN users u ON u.id=l.owner_id "
        "WHERE m.buyer_id=? AND l.status='active' ORDER BY m.score DESC", (buyer_id,))


def list_for_owner(owner_id):
    return db.fetch_all(
        "SELECT m.id, m.score, l.id AS listing_id, l.species, l.quantity_kg, l.price_per_kg, l.location, "
        "r.quantity_kg AS wanted_kg, r.max_price_per_kg, b.name AS buyer_name, b.phone AS buyer_phone, "
        "b.location AS buyer_location FROM match_results m "
        "JOIN fish_listings l ON l.id=m.listing_id JOIN buyer_requirements r ON r.id=m.requirement_id "
        "JOIN users b ON b.id=m.buyer_id WHERE l.owner_id=? AND l.status='active' ORDER BY m.score DESC",
        (owner_id,))
