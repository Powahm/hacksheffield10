"""Stateless next-product recommender.

The client sends its own swipe history, so the server keeps no per-user state: any instance
(or any Lambda) can answer any request, and visitors never share a profile.

Taste is an exponential moving average of product embeddings: +e for a kept piece, -e for a
pass, recent swipes weighted more. The next pick is the unseen product with the highest cosine
similarity to that taste vector, with a small chance of a random pick so the feed does not
collapse into one category.
"""

import random
from collections import Counter
from dataclasses import dataclass

import numpy as np

ALPHA = 0.3  # weight of the newest swipe; higher adapts faster
EXPLORE_RATE = 0.15


@dataclass
class Pick:
    product: dict
    mode: str  # "start", "match" or "explore"
    score: float | None = None  # cosine similarity to the taste vector, for "match"
    because: dict | None = None  # the kept product it is closest to, for "match"


def _unit(v: np.ndarray) -> np.ndarray:
    norm = np.linalg.norm(v)
    return v / norm if norm else v


def taste_vector(swipes: list[tuple[int, bool]], vectors: dict[int, np.ndarray]) -> np.ndarray | None:
    taste = None
    for pid, kept in swipes:
        e = vectors.get(pid)
        if e is None:
            continue
        signed = _unit(e) if kept else -_unit(e)
        taste = signed if taste is None else (1 - ALPHA) * taste + ALPHA * signed
    return taste


def _least_seen_category(candidates: list[dict], seen_products: list[dict], rng: random.Random) -> dict:
    seen_counts = Counter(p.get("category") for p in seen_products)
    fewest = min(seen_counts.get(p.get("category"), 0) for p in candidates)
    pool = [p for p in candidates if seen_counts.get(p.get("category"), 0) == fewest]
    return rng.choice(pool)


def recommend(
    catalogue: list[dict],
    swipes: list[tuple[int, bool]],
    rng: random.Random | None = None,
    explore_rate: float = EXPLORE_RATE,
) -> Pick | None:
    """Return the next product for this swipe history, or None when everything has been seen.

    `catalogue` items carry an `embedding` np.ndarray (or None); `swipes` is ordered oldest first.
    """
    rng = rng or random.Random()
    by_id = {p["id"]: p for p in catalogue}
    vectors = {p["id"]: p["embedding"] for p in catalogue if p.get("embedding") is not None}
    swiped_ids = {pid for pid, _ in swipes}
    candidates = [p for p in catalogue if p["id"] not in swiped_ids and p["id"] in vectors]
    if not candidates:
        return None

    seen_products = [by_id[pid] for pid in swiped_ids if pid in by_id]
    kept_ids = [pid for pid, kept in swipes if kept and pid in vectors]
    taste = taste_vector(swipes, vectors)

    if taste is None or not kept_ids:
        return Pick(_least_seen_category(candidates, seen_products, rng), "start")

    if rng.random() < explore_rate:
        return Pick(_least_seen_category(candidates, seen_products, rng), "explore")

    taste_u = _unit(taste)
    matrix = np.stack([_unit(vectors[p["id"]]) for p in candidates])
    scores = matrix @ taste_u
    best = int(np.argmax(scores))
    choice = candidates[best]

    choice_u = matrix[best]
    nearest_kept = max(kept_ids, key=lambda pid: float(_unit(vectors[pid]) @ choice_u))
    return Pick(choice, "match", float(scores[best]), by_id[nearest_kept])
