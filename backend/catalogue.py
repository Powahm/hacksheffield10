"""Product catalogue: Supabase reads and writes behind a short in-memory cache.

The whole catalogue (tens of products, 768 floats each) fits comfortably in memory, so the
recommender scores it in-process instead of calling the database once per candidate.
"""

import json
import threading
import time

import numpy as np

from supabase_client import get_supabase

PUBLIC_FIELDS = "id, external_id, name, description, price, category, image_url, tags, created_at"
CACHE_SECONDS = 300

_lock = threading.Lock()
_cache: dict = {"at": 0.0, "products": None}


def parse_embedding(raw) -> np.ndarray | None:
    if raw is None:
        return None
    if isinstance(raw, str):
        try:
            raw = json.loads(raw)
        except ValueError:
            return None
    try:
        vec = np.asarray(raw, dtype=float)
    except (TypeError, ValueError):
        return None
    return vec if vec.ndim == 1 and vec.size else None


def _public(product: dict) -> dict:
    return {k: v for k, v in product.items() if k != "embedding"}


def load_with_embeddings(force: bool = False) -> list[dict]:
    """All products, each with a parsed `embedding` (np.ndarray or None). Cached."""
    with _lock:
        fresh = time.monotonic() - _cache["at"] < CACHE_SECONDS
        if _cache["products"] is not None and fresh and not force:
            return _cache["products"]
    rows = (
        get_supabase().table("products").select(PUBLIC_FIELDS + ", embedding").order("id").execute().data
        or []
    )
    for row in rows:
        row["embedding"] = parse_embedding(row.get("embedding"))
    with _lock:
        _cache.update(at=time.monotonic(), products=rows)
    return rows


def invalidate() -> None:
    with _lock:
        _cache.update(at=0.0, products=None)


def list_products() -> list[dict]:
    return [_public(p) for p in load_with_embeddings()]


def get_product(product_id: int) -> dict | None:
    for product in load_with_embeddings():
        if product["id"] == product_id:
            return _public(product)
    return None


def search(query: str) -> list[dict]:
    """Case-insensitive match on name, description, category or any tag."""
    q = query.lower()
    out = []
    for p in list_products():
        haystack = [p.get("name") or "", p.get("description") or "", p.get("category") or ""]
        haystack += [str(t) for t in (p.get("tags") or [])]
        if any(q in field.lower() for field in haystack):
            out.append(p)
    return out


def create(data: dict) -> dict | None:
    res = get_supabase().table("products").insert(data).execute()
    invalidate()
    return _public(res.data[0]) if res.data else None


def update(product_id: int, data: dict) -> dict | None:
    res = get_supabase().table("products").update(data).eq("id", product_id).execute()
    invalidate()
    return _public(res.data[0]) if res.data else None


def delete(product_id: int) -> dict | None:
    res = get_supabase().table("products").delete().eq("id", product_id).execute()
    invalidate()
    return _public(res.data[0]) if res.data else None
