# BACKEND
from database import db

_FIELDS = ("species", "quantity_kg", "price_per_kg", "location", "freshness", "catch_date", "notes",
           "photo", "source", "delivery", "min_order_kg")


def create(owner_id, d):
    cols = ",".join(_FIELDS)
    return db.execute("INSERT INTO fish_listings(owner_id,%s) VALUES(?,%s)" % (cols, ",".join("?" * len(_FIELDS))),
                      (owner_id,) + tuple(d[k] for k in _FIELDS))


def update(lid, d):
    sets = ",".join("%s=?" % k for k in _FIELDS)
    db.execute("UPDATE fish_listings SET %s WHERE id=?" % sets, tuple(d[k] for k in _FIELDS) + (lid,))


def get(lid):
    return db.fetch_one("SELECT * FROM fish_listings WHERE id=?", (lid,))


def get_with_owner(lid):
    return db.fetch_one(
        "SELECT l.*, u.name AS owner_name, u.phone AS owner_phone, u.email AS owner_email, "
        "u.location AS owner_location, u.avatar AS owner_avatar, u.bio AS owner_bio FROM fish_listings l JOIN users u ON u.id=l.owner_id WHERE l.id=?", (lid,))


def list_by_owner(owner_id):
    return db.fetch_all("SELECT * FROM fish_listings WHERE owner_id=? ORDER BY id DESC", (owner_id,))


def list_active():
    return db.fetch_all("SELECT * FROM fish_listings WHERE status='active'")


def list_market(limit=200):
    return db.fetch_all(
        "SELECT l.*, u.name AS fisher_name, u.avatar AS fisher_avatar FROM fish_listings l JOIN users u ON u.id=l.owner_id "
        "WHERE l.status='active' ORDER BY l.id DESC LIMIT ?", (limit,))


def set_status(lid, status):
    db.execute("UPDATE fish_listings SET status=? WHERE id=?", (status, lid))


def delete(lid):
    db.execute("DELETE FROM fish_listings WHERE id=?", (lid,))
