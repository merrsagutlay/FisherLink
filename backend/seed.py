# BACKEND
"""Load demo accounts and sample data: python seed.py"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from application import auth, buyer_mgmt, fish_mgmt, matching  # noqa: E402
from data_access import user_repo  # noqa: E402
from database.db import init_db  # noqa: E402


def seed():
    init_db()
    if user_repo.get_by_email("fisher@demo.com"):
        print("Demo data already loaded.")
        return
    _, f1 = auth.register({"name": "Mang Tonyo", "email": "fisher@demo.com", "password": "demo123",
                           "role": "fisherfolk", "phone": "0917-111-2222", "location": "Batangas"})
    _, f2 = auth.register({"name": "Aling Rosa", "email": "fisher2@demo.com", "password": "demo123",
                           "role": "fisherfolk", "phone": "0918-333-4444", "location": "Cavite"})
    _, b = auth.register({"name": "Bay Fresh Market", "email": "buyer@demo.com", "password": "demo123",
                          "role": "buyer", "phone": "0920-555-6666", "location": "Batangas"})

    for owner, species, qty, price, loc, fresh in [
        (f1, "Tilapia", 120, 130, "Batangas", "fresh"),
        (f1, "Bangus", 80, 165, "Batangas", "good"),
        (f1, "Tuna", 60, 240, "Batangas", "fresh"),
        (f2, "Tilapia", 40, 150, "Cavite", "good"),
        (f2, "Squid", 30, 280, "Cavite", "fresh"),
    ]:
        fish_mgmt.post_listing(user_repo.get_by_id(owner["id"]), {
            "species": species, "quantity_kg": qty, "price_per_kg": price,
            "location": loc, "freshness": fresh, "catch_date": "2026-11-21"})

    buyer = user_repo.get_by_id(b["id"])
    buyer_mgmt.submit_requirement(buyer, {"species": "Tilapia", "quantity_kg": 100,
                                          "max_price_per_kg": 140, "location": "Batangas",
                                          "min_freshness": "good"})
    matching.run_matching(buyer)
    print("Demo data loaded.\n  fisher@demo.com / demo123\n  fisher2@demo.com / demo123\n  buyer@demo.com / demo123")


if __name__ == "__main__":
    seed()
