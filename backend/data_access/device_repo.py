# BACKEND
"""Saved logins on a device (like Facebook's "recent logins"). Only a hash of the token is stored."""
from database import db


def create(user_id, token_hash, expires_at):
    db.execute("INSERT INTO device_tokens(user_id,token_hash,expires_at) VALUES(?,?,?)", (user_id, token_hash, expires_at))


def get(token_hash):
    return db.fetch_one("SELECT * FROM device_tokens WHERE token_hash=?", (token_hash,))


def delete(token_hash):
    db.execute("DELETE FROM device_tokens WHERE token_hash=?", (token_hash,))


def delete_expired(now):
    db.execute("DELETE FROM device_tokens WHERE expires_at<?", (now,))
