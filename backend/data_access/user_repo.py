# BACKEND
from database import db


def create(name, email, password_hash, role, phone, location):
    return db.execute("INSERT INTO users(name,email,password_hash,role,phone,location) VALUES(?,?,?,?,?,?)",
                      (name, email.lower(), password_hash, role, phone, location))


def get_by_id(uid):
    return db.fetch_one("SELECT * FROM users WHERE id=?", (uid,))


def get_by_email(email):
    return db.fetch_one("SELECT * FROM users WHERE email=?", (str(email).strip().lower(),))


def update(uid, name, phone, location, bio, avatar=None):
    """avatar None = leave unchanged, '' = remove, otherwise a data URL."""
    if avatar is None:
        db.execute("UPDATE users SET name=?, phone=?, location=?, bio=? WHERE id=?", (name, phone, location, bio, uid))
    else:
        db.execute("UPDATE users SET name=?, phone=?, location=?, bio=?, avatar=? WHERE id=?",
                   (name, phone, location, bio, avatar, uid))
