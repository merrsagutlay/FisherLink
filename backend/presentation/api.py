# BACKEND
"""Presentation layer: JSON API + the single-page web interface. Calls only go downward to application/."""
import json
import os
import re
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from application import auth, buyer_mgmt, fish_mgmt, matching, user_mgmt

# the FRONTEND folder sits next to backend/
STATIC = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "frontend")
STATIC_FILES = {"/style.css": "text/css", "/app.js": "application/javascript",
                "/logo.png": "image/png", "/logo-light.png": "image/png", "/favicon.png": "image/png"}
COOKIE = "fm_session"
ROUTES = []


class Ctx:
    def __init__(self, user, body, args, token):
        self.user, self.body, self.args, self.token = user, body, args, token
        self.new_token, self.clear = None, False


def route(method, pattern, needs_login=True):
    def deco(fn):
        ROUTES.append((method, re.compile("^" + pattern + "$"), needs_login, fn))
        return fn
    return deco


def _is_fisher(c):
    return c.user["role"] == "fisherfolk"


@route("POST", "/api/register", False)
def _register(c):
    c.new_token, user = auth.register(c.body)
    return 201, user


@route("POST", "/api/login", False)
def _login(c):
    c.new_token, user = auth.login(c.body.get("email"), c.body.get("password"))
    if c.body.get("remember") is True:  # "Save my login on this device"
        user = dict(user, device_token=auth.remember_device(user["id"]))
    return 200, user


@route("POST", "/api/login/saved", False)
def _login_saved(c):
    c.new_token, user = auth.login_saved(c.body.get("token"))
    return 200, user


@route("POST", "/api/login/forget", False)
def _login_forget(c):
    auth.forget_device(c.body.get("token"))
    return 200, {"ok": True}


@route("POST", "/api/logout", False)
def _logout(c):
    auth.logout(c.token)
    c.clear = True
    return 200, {"ok": True}


@route("GET", "/api/me", False)
def _me(c):
    return 200, {"user": c.user}


@route("PUT", "/api/me")
def _update_me(c):
    return 200, user_mgmt.update_profile(c.user, c.body)


@route("GET", "/api/stats")
def _stats(c):
    return 200, (fish_mgmt if _is_fisher(c) else buyer_mgmt).stats(c.user)


@route("GET", "/api/listings")
def _my_listings(c):
    return 200, fish_mgmt.my_listings(c.user)


@route("POST", "/api/listings")
def _post_listing(c):
    return 201, fish_mgmt.post_listing(c.user, c.body)


@route("GET", r"/api/listings/(\d+)")
def _listing(c):
    return 200, fish_mgmt.get_details(c.user, int(c.args[0]))


@route("PUT", r"/api/listings/(\d+)")
def _edit_listing(c):
    return 200, fish_mgmt.update_listing(c.user, int(c.args[0]), c.body)


@route("GET", "/api/market")
def _market(c):
    return 200, fish_mgmt.market(c.user)


@route("POST", r"/api/listings/(\d+)/sold")
def _sold(c):
    return 200, fish_mgmt.mark_sold(c.user, int(c.args[0]))


@route("DELETE", r"/api/listings/(\d+)")
def _del_listing(c):
    return 200, fish_mgmt.delete_listing(c.user, int(c.args[0]))


@route("GET", "/api/requirements")
def _reqs(c):
    return 200, buyer_mgmt.list_requirements(c.user)


@route("POST", "/api/requirements")
def _submit_req(c):
    req = buyer_mgmt.submit_requirement(c.user, c.body)
    found = matching.run_matching(c.user)
    return 201, {"requirement": req, "matches": len([m for m in found if m["requirement_id"] == req["id"]])}


@route("DELETE", r"/api/requirements/(\d+)")
def _cancel_req(c):
    return 200, buyer_mgmt.cancel_requirement(c.user, int(c.args[0]))


@route("POST", "/api/match")
def _match(c):
    auth.require_role(c.user, "buyer")
    return 200, matching.run_matching(c.user)


@route("GET", "/api/matches")
def _matches(c):
    return 200, (matching.for_owner if _is_fisher(c) else matching.for_buyer)(c.user)


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def _send(self, code, body, ctype="application/json", cookie=None):
        data = body if isinstance(body, bytes) else json.dumps(body, default=str).encode()
        self.send_response(code)
        self.send_header("Content-Type", ctype if ctype.startswith("image/") else ctype + "; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        if cookie:
            self.send_header("Set-Cookie", cookie)
        self.end_headers()
        self.wfile.write(data)

    def _token(self):
        c = SimpleCookie(self.headers.get("Cookie") or "")
        return c[COOKIE].value if COOKIE in c else None

    def _dispatch(self, method):
        path = self.path.split("?")[0]
        if not path.startswith("/api/"):
            name, ctype = ("index.html", "text/html") if path not in STATIC_FILES else (path.lstrip("/"), STATIC_FILES[path])
            with open(os.path.join(STATIC, name), "rb") as f:
                return self._send(200, f.read(), ctype)
        match = None
        for m, rx, needs_login, fn in ROUTES:
            found = rx.match(path) if m == method else None
            if found:
                match = (needs_login, fn, found.groups())
                break
        if not match:
            return self._send(404, {"error": "Not found."})
        needs_login, fn, args = match
        token = self._token()
        try:
            if method != "GET" and self.headers.get("X-Requested-With") != "fishmatch":
                raise auth.Forbidden("Request blocked.")
            body = {}
            n = int(self.headers.get("Content-Length") or 0)
            if n:
                if n > 700000:
                    raise ValueError("Request too large.")
                body = json.loads(self.rfile.read(n).decode("utf-8"))
                if not isinstance(body, dict):
                    raise ValueError("Bad request.")
            user = auth.user_from_token(token)
            if needs_login and not user:
                raise auth.AuthError("Please log in.")
            ctx = Ctx(user, body, args, token)
            code, data = fn(ctx)
            cookie = None
            if ctx.new_token:
                cookie = "%s=%s; HttpOnly; Path=/; SameSite=Lax; Max-Age=%d" % (COOKIE, ctx.new_token, auth.SESSION_TTL)
            elif ctx.clear:
                cookie = "%s=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0" % COOKIE
            return self._send(code, data, cookie=cookie)
        except auth.AuthError as e:
            return self._send(401, {"error": str(e)})
        except auth.Forbidden as e:
            return self._send(403, {"error": str(e)})
        except LookupError as e:
            return self._send(404, {"error": str(e.args[0] if e.args else "Not found.")})
        except (ValueError, UnicodeDecodeError) as e:
            return self._send(400, {"error": str(e)})

    def do_GET(self):
        self._dispatch("GET")

    def do_POST(self):
        self._dispatch("POST")

    def do_PUT(self):
        self._dispatch("PUT")

    def do_DELETE(self):
        self._dispatch("DELETE")


def make_server(host, port):
    return ThreadingHTTPServer((host, port), Handler)
