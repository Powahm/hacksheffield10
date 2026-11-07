"""Re-embed the catalogue with the current Gemini model and add the fashion categories it lacks.

Usage, from backend/:
    python -m scripts.seed_catalogue            # dry run: prints the plan
    python -m scripts.seed_catalogue --apply    # backs up, then writes

Every product must be embedded by the same model: vectors from different models are not
comparable, so mixing them silently breaks recommendations. This script re-embeds all rows.
Existing rows are matched by external_id, so running it twice adds nothing new.
"""

import argparse
import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from services.embedding_client import EMBED_DIM, EMBEDDING_MODEL, embed_product  # noqa: E402
from supabase_client import get_supabase  # noqa: E402

DUMMYJSON = "https://dummyjson.com/products/category/{}"
CATEGORIES = [
    "mens-shirts", "mens-shoes", "mens-watches", "tops", "womens-dresses",
    "womens-shoes", "womens-bags", "womens-jewellery", "womens-watches", "sunglasses",
]
BACKUP_DIR = Path(__file__).resolve().parent / "backups"


def fetch_category(slug: str) -> list[dict]:
    resp = requests.get(DUMMYJSON.format(slug), timeout=15)
    resp.raise_for_status()
    out = []
    for raw in resp.json().get("products", []):
        images = raw.get("images") or []
        out.append({
            "external_id": raw.get("id"),
            "name": raw.get("title"),
            "description": raw.get("description"),
            "price": raw.get("price"),
            "category": raw.get("category"),
            "tags": raw.get("tags") or [],
            "image_url": raw.get("thumbnail") or (images[0] if images else None),
        })
    return out


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="write to Supabase")
    args = parser.parse_args()

    db = get_supabase()
    existing = db.table("products").select("*").execute().data or []
    by_external = {row.get("external_id"): row for row in existing}

    incoming = [p for slug in CATEGORIES for p in fetch_category(slug)]
    new = [p for p in incoming if p["external_id"] not in by_external]
    print(f"Model {EMBEDDING_MODEL} at {EMBED_DIM} dims")
    print(f"{len(existing)} existing rows to re-embed, {len(new)} new products to add")
    if not args.apply:
        print("Dry run. Re-run with --apply to write.")
        return

    BACKUP_DIR.mkdir(exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    backup = BACKUP_DIR / f"products-{stamp}.json"
    backup.write_text(json.dumps(existing, default=str))
    print(f"Backed up {len(existing)} rows to {backup}")

    for row in existing:
        db.table("products").update({"embedding": embed_product(row)}).eq("id", row["id"]).execute()
        time.sleep(0.2)
    print(f"Re-embedded {len(existing)} rows")

    for product in new:
        db.table("products").insert({**product, "embedding": embed_product(product)}).execute()
        time.sleep(0.2)
    print(f"Added {len(new)} products")


if __name__ == "__main__":
    main()
