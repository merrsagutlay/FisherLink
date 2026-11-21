# BACKEND
"""Authentication, Account Validation, Role-Based Access Control."""
import hashlib
import hmac
import os
import re
import secrets
import time

from application.validation import text
from data_access import device_repo, user_repo

ROLES = ("fisherfolk", "buyer")
SESSION_TTL = 7 * 24 * 3600
DEVICE_TTL = 30 * 24 * 3600  # a saved login on a device lasts 30 days
_sessions = {}  # token -> (user_id, expires_at)


class AuthError(Exception):
    """Not logged in / wrong credentials -> HTTP 401."""


class Forbidden(Exception):
    """Logged in but not allowed -> HTTP 403."""


def _hash(password, salt):
    return hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), 120000).hex()


def hash_password(password):
    salt = os.urandom(16).hex()
    return salt + "$" + _hash(password, salt)


def verify_password(password, stored):
    salt, digest = stored.split("$")
    return hmac.compare_digest(_hash(password, salt), digest)


def public(user):
    return {k: v for k, v in user.items() if k != "password_hash"}


# ---- Account Validation ----
def validate_account(d):
    email = text(d, "email", "Email", maxlen=120).lower()
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        raise ValueError("Enter a valid email address.")
    password = str(d.get("password") or "")
    if len(password) < 6:
        raise ValueError("Password must be at least 6 characters.")
    role = str(d.get("role") or "").strip()
    if role not in ROLES:
        raise ValueError("Choose whether you are a fisherfolk or a fish buyer.")
    phone = text(d, "phone", "Mobile number", maxlen=30)
    if len(re.sub(r"\D", "", phone)) < 7:
        raise ValueError("Enter a valid mobile number.")
    return {"name": text(d, "name", "Name", maxlen=80), "email": email, "password": password,
            "role": role, "phone": phone, "location": text(d, "location", "Location", maxlen=80)}


# ---- Authentication ----
def _new_session(user_id):
    token = secrets.token_urlsafe(32)
    _sessions[token] = (user_id, time.time() + SESSION_TTL)
    return token


def register(d):
    c = validate_account(d)
    if user_repo.get_by_email(c["email"]):
        raise ValueError("That email is already registered. Try logging in.")
    uid = user_repo.create(c["name"], c["email"], hash_password(c["password"]), c["role"], c["phone"], c["location"])
    return _new_session(uid), public(user_repo.get_by_id(uid))


def login(email, password):
    user = user_repo.get_by_email(email or "")
    if not user or not verify_password(str(password or ""), user["password_hash"]):
        raise AuthError("Wrong email or password.")
    return _new_session(user["id"]), public(user)


# ---- Saved logins ("recent logins" on this device) ----
def _dhash(token):
    return hashlib.sha256(str(token or "").encode()).hexdigest()


def remember_device(user_id):
    """Return a new device token. The browser keeps it; the database keeps only its hash."""
    device_repo.delete_expired(time.time())
    token = secrets.token_urlsafe(32)
    device_repo.create(user_id, _dhash(token), time.time() + DEVICE_TTL)
    return token


def login_saved(token):
    row = device_repo.get(_dhash(token))
    if row and row["expires_at"] < time.time():
        device_repo.delete(row["token_hash"])
        row = None
    user = user_repo.get_by_id(row["user_id"]) if row else None
    if not user:
        raise AuthError("Your saved login expired. Please log in again.")
    return _new_session(user["id"]), public(user)


def forget_device(token):
    if token:
        device_repo.delete(_dhash(token))


def user_from_token(token):
    s = _sessions.get(token)
    if not s:
        return None
    if s[1] < time.time():
        _sessions.pop(token, None)
        return None
    user = user_repo.get_by_id(s[0])
    return public(user) if user else None


def logout(token):
    _sessions.pop(token, None)


# ---- Role-Based Access Control ----
def require_role(user, role):
    if not user:
        raise AuthError("Please log in.")
    if user["role"] != role:
        raise Forbidden("Only %s accounts can do this." % ("fisherfolk" if role == "fisherfolk" else "buyer"))
