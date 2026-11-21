# BACKEND
from database import db


def create(buyer_id, d):
    return db.execute(
        "INSERT INTO buyer_requirements(buyer_id,species,quantity_kg,max_price_per_kg,location,min_freshness) "
        "VALUES(?,?,?,?,?,?)",
        (buyer_id, d["species"], d["quantity_kg"], d["max_price_per_kg"], d["location"], d["min_freshness"]))


def get(rid):
    return db.fetch_one("SELECT * FROM buyer_requirements WHERE id=?", (rid,))


def list_by_buyer(buyer_id):
    return db.fetch_all("SELECT * FROM buyer_requirements WHERE buyer_id=? ORDER BY id DESC", (buyer_id,))


def list_active_all():
    return db.fetch_all("SELECT * FROM buyer_requirements WHERE status='active'")


def delete(rid):
    db.execute("DELETE FROM buyer_requirements WHERE id=?", (rid,))
