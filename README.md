# FishMatch – Fish Buyer Matching Platform

Needs only Python 3.8+ (standard library, no installs).

```
fishmatch/
├── frontend/          FRONTEND  what the user sees in the browser
│   ├── index.html       page shell
│   ├── style.css        all design (teal theme, login, dashboard, profile)
│   ├── logo.png         FishMatch logo (for light backgrounds)
│   ├── logo-light.png   same logo, light version for the dark teal panels
│   ├── favicon.png      browser tab icon
│   └── app.js           pages, forms, search, profile, calls the backend
├── app.py, seed.py, run.bat, run.sh   shortcuts to start the backend
├── backend/           BACKEND   the server, rules and database
│   ├── app.py           start the server
│   ├── seed.py          optional demo accounts and sample fish
│   ├── presentation/    api.py: the /api routes, also serves the frontend files
│   ├── application/     auth, profile, fish, requirements, matching
│   ├── data_access/     reads and writes the tables
│   ├── database/        SQLite schema (db.py)
│   └── tests/           smoke_test.py
└── fishmatch.db       created on first run
```

## Run it

Open Command Prompt / Terminal **inside the `fishmatch` folder** (the one that has `backend` and `frontend`), then:

```bash
python seed.py      # optional: demo accounts and sample fish
python app.py       # then open http://127.0.0.1:8000
```

Windows: you can also just double-click `run.bat`. Mac/Linux: `./run.sh` (use `python3` if `python` is not found).
It also works from inside the `backend` folder (`cd backend`, then the same two commands).

Demo logins (after seeding), password `demo123`: `fisher@demo.com`, `fisher2@demo.com`, `buyer@demo.com`.

Run the tests: `cd backend` then `python tests/smoke_test.py`

## Features

- Fisherfolk post fish with a photo, source (wild or farmed), delivery option and minimum order, then edit, mark sold or delete. Buyers browse and search all active fish.
- Profile: every user can add a profile picture and a short bio. They are saved in the database (`users.avatar`, `users.bio`), so they are still there at the next login. Sellers' pictures show on Browse fish and listing details. 
- Saved logins (like Facebook): when logging in, "Save my login on this device" is checked by default. Next time the login page shows **Recent logins** with the profile picture and name, and one click logs in. Each card has an x to remove it, and **Log in to another account** opens the normal form. Inside the app, **Switch account** lets you jump to another saved account, add another one, **Log out**, or **Log out and forget this device** (for shared computers). The browser keeps a random token (30 days) and the database keeps only its hash (`device_tokens` table); passwords are never saved on the device.
- Search: fish and location boxes are searchable dropdowns (type to filter, or type your own text). Manage listings, Manage requirements and Matching results have a fish + location search bar.

## How the backend is layered

Calls only go downward: presentation → application → data access → database.

| Layer | Folder | Job |
|---|---|---|
| Presentation | `backend/presentation/` | `api.py` routes, serves `frontend/` |
| Application | `backend/application/` | Authentication, Account Validation, Role-Based Access Control, profile, fish, requirements, matching |
| Data Access | `backend/data_access/` | `user_repo`, `fish_repo`, `buyer_repo`, `match_repo` |
| Database | `backend/database/db.py` | users, fish_listings, buyer_requirements, match_results (SQLite) |

## Weighted matching

Score out of 100 = species 40 + price 25 + quantity 15 + location 10 + freshness 10.
A listing must be the requested species and score at least 50. Change `WEIGHTS` and `MIN_SCORE` in `backend/application/matching.py`.

## Prototype limits (before real use)

- Sessions are HttpOnly cookies that expire after 7 days and are kept in memory (restarting the server logs everyone out). State-changing requests need an `X-Requested-With` header as basic CSRF protection. Add HTTPS before deploying.
- Location matching is text-based (exact = full points, partial text = half).
- No messaging or ordering yet; buyers see the fisherfolk's phone and email on the details page.
