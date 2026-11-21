# BACKEND
"""Database layer: SQLite connection and schema (users, fish_listings, buyer_requirements, match_results)."""
import os
import sqlite3
from contextlib import closing

SCHEMA = """
CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('fisherfolk','buyer')),
  phone TEXT NOT NULL, location TEXT NOT NULL,
  avatar TEXT DEFAULT '', bio TEXT DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS fish_listings(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  species TEXT NOT NULL, quantity_kg REAL NOT NULL, price_per_kg REAL NOT NULL,
  location TEXT NOT NULL, freshness TEXT NOT NULL, catch_date TEXT NOT NULL, notes TEXT DEFAULT '',
  photo TEXT DEFAULT '', source TEXT NOT NULL DEFAULT 'wild', delivery TEXT NOT NULL DEFAULT 'pickup',
  min_order_kg REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS device_tokens(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE, expires_at REAL NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS buyer_requirements(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  species TEXT NOT NULL, quantity_kg REAL NOT NULL, max_price_per_kg REAL NOT NULL,
  location TEXT NOT NULL, min_freshness TEXT NOT NULL DEFAULT 'fair',
  status TEXT NOT NULL DEFAULT 'active', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS match_results(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  requirement_id INTEGER NOT NULL REFERENCES buyer_requirements(id) ON DELETE CASCADE,
  listing_id INTEGER NOT NULL REFERENCES fish_listings(id) ON DELETE CASCADE,
  buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score REAL NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(requirement_id, listing_id));
"""


def db_path():
    return os.environ.get("FISHMATCH_DB") or os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "fishmatch.db")


def connect():
    conn = sqlite3.connect(db_path())
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


NEW_LISTING_COLUMNS = [("photo", "TEXT DEFAULT ''"), ("source", "TEXT NOT NULL DEFAULT 'wild'"),
                       ("delivery", "TEXT NOT NULL DEFAULT 'pickup'"), ("min_order_kg", "REAL NOT NULL DEFAULT 0")]


NEW_USER_COLUMNS = [("avatar", "TEXT DEFAULT ''"), ("bio", "TEXT DEFAULT ''")]


def init_db():
    with closing(connect()) as c:
        c.executescript(SCHEMA)
        have_u = set(r[1] for r in c.execute("PRAGMA table_info(users)"))
        for name, decl in NEW_USER_COLUMNS:  # upgrade databases made before profiles existed
            if name not in have_u:
                c.execute("ALTER TABLE users ADD COLUMN %s %s" % (name, decl))
        have = set(r[1] for r in c.execute("PRAGMA table_info(fish_listings)"))
        for name, decl in NEW_LISTING_COLUMNS:  # upgrade databases made by an earlier version
            if name not in have:
                c.execute("ALTER TABLE fish_listings ADD COLUMN %s %s" % (name, decl))
        c.commit()


def fetch_all(sql, params=()):
    with closing(connect()) as c:
        return [dict(r) for r in c.execute(sql, params).fetchall()]


def fetch_one(sql, params=()):
    rows = fetch_all(sql, params)
    return rows[0] if rows else None


def execute(sql, params=()):
    with closing(connect()) as c:
        cur = c.execute(sql, params)
        c.commit()
        return cur.lastrowid


def transaction(ops):
    """Run [(sql, params), ...] atomically."""
    with closing(connect()) as c:
        for sql, params in ops:
            c.execute(sql, params)
        c.commit()
