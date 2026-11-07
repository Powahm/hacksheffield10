import sys
from pathlib import Path

import numpy as np
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import create_app  # noqa: E402
from app.security import chat_limiter  # noqa: E402


def make_product(pid: int, category: str, vector: list[float], name: str | None = None) -> dict:
    return {
        "id": pid,
        "name": name or f"Item {pid}",
        "category": category,
        "price": 10.0 + pid,
        "description": "",
        "tags": [],
        "image_url": None,
        "embedding": np.asarray(vector, dtype=float),
    }


@pytest.fixture
def catalogue_items():
    # Two clusters: shirts point along x, dresses along y; one product has no embedding.
    items = [
        make_product(1, "mens-shirts", [1.0, 0.0, 0.0], "Blue shirt"),
        make_product(2, "mens-shirts", [0.9, 0.1, 0.0], "Linen shirt"),
        make_product(3, "womens-dresses", [0.0, 1.0, 0.0], "Black dress"),
        make_product(4, "womens-dresses", [0.1, 0.9, 0.0], "Red dress"),
        make_product(5, "sunglasses", [0.0, 0.0, 1.0], "Aviators"),
    ]
    items.append({**make_product(6, "tops", [0, 0, 0]), "embedding": None})
    return items


@pytest.fixture
def client(monkeypatch, catalogue_items):
    import catalogue

    monkeypatch.setattr(catalogue, "load_with_embeddings", lambda force=False: catalogue_items)
    chat_limiter.reset()
    app = create_app("Test")
    return app.test_client()
