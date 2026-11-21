# BACKEND
"""End-to-end check: python tests/smoke_test.py"""
import json
import os
import sys
import tempfile
import threading
import urllib.error
import urllib.request
from http.cookiejar import CookieJar

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ["FISHMATCH_DB"] = os.path.join(tempfile.mkdtemp(), "test.db")

from database.db import init_db  # noqa: E402
from presentation.api import make_server  # noqa: E402

init_db()
server = make_server("127.0.0.1", 0)
BASE = "http://127.0.0.1:%d" % server.server_address[1]
threading.Thread(target=server.serve_forever, daemon=True).start()


class Client:
    def __init__(self):
        self.op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(CookieJar()))

    def call(self, method, path, body=None):
        req = urllib.request.Request(BASE + path, method=method, data=json.dumps(body).encode() if body else None,
                                     headers={"Content-Type": "application/json", "X-Requested-With": "fishmatch"})
        try:
            r = self.op.open(req)
            return r.status, json.loads(r.read())
        except urllib.error.HTTPError as e:
            return e.code, json.loads(e.read())


def check(label, cond):
    print(("PASS  " if cond else "FAIL  ") + label)
    if not cond:
        sys.exit(1)


fisher, buyer, anon = Client(), Client(), Client()
reg = lambda n, e, role: {"name": n, "email": e, "password": "secret1", "role": role, "phone": "0917-111-2222", "location": "Batangas"}

check("register fisherfolk", fisher.call("POST", "/api/register", reg("Tonyo", "f@x.com", "fisherfolk"))[0] == 201)
check("register buyer", buyer.call("POST", "/api/register", reg("Bay Market", "b@x.com", "buyer"))[0] == 201)
check("duplicate email rejected", anon.call("POST", "/api/register", reg("X", "f@x.com", "buyer"))[0] == 400)
check("short password rejected", anon.call("POST", "/api/register", dict(reg("X", "n@x.com", "buyer"), password="123"))[0] == 400)
check("wrong password -> 401", anon.call("POST", "/api/login", {"email": "f@x.com", "password": "nope"})[0] == 401)
check("anonymous cannot read stats", anon.call("GET", "/api/stats")[0] == 401)
check("anonymous /api/me is null", anon.call("GET", "/api/me")[1]["user"] is None)
check("buyer cannot post fish (RBAC)", buyer.call("POST", "/api/listings", {"species": "Tilapia"})[0] == 403)

code, l = fisher.call("POST", "/api/listings", {"species": "tilapia", "quantity_kg": 120, "price_per_kg": 130,
                                                 "location": "Batangas", "freshness": "fresh"})
check("post listing", code == 201 and l["species"] == "Tilapia")
check("bad listing rejected", fisher.call("POST", "/api/listings", {"species": "Tuna", "quantity_kg": -1})[0] == 400)
fisher.call("POST", "/api/listings", {"species": "Tilapia", "quantity_kg": 10, "price_per_kg": 400, "location": "Cebu", "freshness": "fair"})

code, r = buyer.call("POST", "/api/requirements", {"species": "Tilapia", "quantity_kg": 100, "max_price_per_kg": 140,
                                                    "location": "Batangas", "min_freshness": "good"})
check("requirement matches only the good listing", code == 201 and r["matches"] == 1)
m = buyer.call("GET", "/api/matches")[1]
check("perfect match scores 100", len(m) == 1 and m[0]["score"] == 100)
check("fisher sees interested buyer", fisher.call("GET", "/api/matches")[1][0]["buyer_name"] == "Bay Market")
check("buyer sees seller contact", buyer.call("GET", "/api/listings/%d" % l["id"])[1]["owner"]["phone"] == "0917-111-2222")
s = fisher.call("GET", "/api/stats")[1]
check("fisher stats", s["active"] == 2 and s["people"] == 1)
check("serves web page", b"FishMatch" in urllib.request.urlopen(BASE + "/").read())
check("serves frontend css and js", b"teal theme" in urllib.request.urlopen(BASE + "/style.css").read() and b"FRONTEND" in urllib.request.urlopen(BASE + "/app.js").read())
PHOTO = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBD"
code, l2 = fisher.call("POST", "/api/listings", {"species": "Bangus", "quantity_kg": 50, "price_per_kg": 160, "location": "Batangas",
                                                  "source": "farmed", "delivery": "both", "min_order_kg": 5, "photo": PHOTO})
check("post with photo, source, delivery", code == 201 and l2["photo"] == PHOTO and l2["source"] == "farmed" and l2["min_order_kg"] == 5)
check("bad photo rejected", fisher.call("POST", "/api/listings", {"species": "Tuna", "quantity_kg": 5, "price_per_kg": 9, "location": "X", "photo": "<script>"})[0] == 400)
check("min order above quantity rejected", fisher.call("POST", "/api/listings", {"species": "Tuna", "quantity_kg": 5, "price_per_kg": 9, "location": "X", "min_order_kg": 50})[0] == 400)
code, e = fisher.call("PUT", "/api/listings/%d" % l2["id"], {"species": "Bangus", "quantity_kg": 40, "price_per_kg": 150, "location": "Batangas"})
check("edit keeps photo when none sent", code == 200 and e["price_per_kg"] == 150 and e["photo"] == PHOTO)
code, e = fisher.call("PUT", "/api/listings/%d" % l2["id"], {"species": "Bangus", "quantity_kg": 40, "price_per_kg": 150, "location": "Batangas", "photo": ""})
check("edit can remove photo", code == 200 and e["photo"] == "")
check("buyer cannot edit listing", buyer.call("PUT", "/api/listings/%d" % l2["id"], {"species": "x"})[0] == 403)
mk = buyer.call("GET", "/api/market")
check("buyer browses all active fish", mk[0] == 200 and len(mk[1]) == 3 and "fisher_name" in mk[1][0])
check("fisher cannot use marketplace", fisher.call("GET", "/api/market")[0] == 403)
check("mark sold removes match", fisher.call("POST", "/api/listings/%d/sold" % l["id"])[0] == 200 and buyer.call("GET", "/api/matches")[1] == [])
check("logout", buyer.call("POST", "/api/logout")[0] == 200 and buyer.call("GET", "/api/stats")[0] == 401)
# saved logins (recent accounts on this device)
dev = Client()
code, u = dev.call("POST", "/api/login", {"email": "f@x.com", "password": "secret1", "remember": True})
check("login with save returns a device token", code == 200 and len(u.get("device_token", "")) > 20)
tok = u["device_token"]
code, u2 = Client().call("POST", "/api/login/saved", {"token": tok})
check("saved login works without password", code == 200 and u2["email"] == "f@x.com" and "device_token" not in u2)
code, u3 = Client().call("POST", "/api/login", {"email": "f@x.com", "password": "secret1"})
check("normal login does not create a saved login", code == 200 and "device_token" not in u3)
check("bad saved token rejected", Client().call("POST", "/api/login/saved", {"token": "nope"})[0] == 401)
Client().call("POST", "/api/login/forget", {"token": tok})
check("forgotten saved login stops working", Client().call("POST", "/api/login/saved", {"token": tok})[0] == 401)
print("\nAll checks passed.")
