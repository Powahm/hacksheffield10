# TrendSwipe

Swipe through clothes. The feed learns what you keep.

Drag a card right to keep it or left to pass. Every swipe moves the next pick closer to your taste, and each card's tag says why it was picked: "87% similar to the shirt you kept". A stylist chat answers questions about the piece in front of you, using what you have kept.

Built at HackSheffield 10, where it won the Grafana Labs prize. Rebuilt afterwards with a stateless recommender, a new interface and tests.

## How the recommender works

1. Every product is embedded with Gemini (`gemini-embedding-001`, 768 dimensions) from its name, category, description and tags.
2. The browser keeps the visitor's swipe history and sends it with each request. The server keeps no per-user state, so any instance can answer any request and visitors never share a profile.
3. Taste is an exponential moving average of the unit embeddings: plus for a kept piece, minus for a pass, recent swipes weighted more.
4. The next card is the unseen product with the highest cosine similarity to that taste vector. With no taste yet, or 15% of the time, it picks from the least-seen category instead, so the feed does not collapse into one look.
5. The whole catalogue is scored in memory with NumPy behind a five-minute cache, one database read per cache window.

The code is in `backend/helpers/recommender.py`, and it is a pure function, tested in `backend/tests/test_recommender.py`.

## Stack

- **Frontend:** React 18, Vite, React Router, Zustand (swipe history and bag in local storage), Framer Motion for the swipe physics.
- **Backend:** Flask app factory with blueprints, Supabase (Postgres) for the catalogue, Gemini for embeddings and the stylist.
- **Tests:** pytest for the recommender and every API route.

## API

| Method | Path | What it does |
|---|---|---|
| GET | `/api/health` | Liveness check |
| GET | `/api/products` | The catalogue, without embeddings |
| GET | `/api/products/<id>` | One product |
| GET | `/api/products/search?q=` | Match on name, description, category or tag |
| POST | `/api/feed/next` | `{"swipes": [{"id": 12, "kept": true}]}` returns the next pick, why it was picked, and how many are left |
| POST | `/api/chat` | `{"message", "history", "product_id", "kept_ids"}` returns the stylist's reply. Rate limited per client. |
| POST, PUT, DELETE | `/api/dashboard/products` | Brand studio edits. Need the `X-Admin-Token` header; off in production when no token is set. |

## Run it locally

You need Python 3.13, Node 20 or later, a Supabase project with a `products` table, and a Gemini API key.

```bash
cp .env.example .env          # fill in SUPABASE_URL, SUPABASE_KEY, GEMINI_API_KEY
python -m venv .venv
.venv/Scripts/activate        # macOS or Linux: source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt

cd backend
python -m flask --app wsgi run --debug --port 5000
```

In a second terminal:

```bash
cd frontend
npm install
npm run dev                   # http://localhost:5173, proxies /api to Flask
```

Run the tests from `backend/` with `python -m pytest`.

To re-embed the catalogue after changing the embedding model, or to load more products from DummyJSON, run `python -m scripts.seed_catalogue` from `backend/` for a dry run, then add `--apply`. It backs up every row first.

## Credits

Built by the HackSheffield 10 team. Product data and photos from [DummyJSON](https://dummyjson.com). The shop is a demo: prices are DummyJSON's and nothing can be bought.
