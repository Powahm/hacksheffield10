from flask import Blueprint, jsonify, request

import catalogue
from helpers.recommender import recommend

feed_bp = Blueprint("feed", __name__)

MAX_SWIPES = 500


def _public(product: dict | None) -> dict | None:
    if product is None:
        return None
    return {k: v for k, v in product.items() if k != "embedding"}


def _parse_swipes(body) -> list[tuple[int, bool]] | None:
    raw = body.get("swipes") if isinstance(body, dict) else None
    if not isinstance(raw, list) or len(raw) > MAX_SWIPES:
        return None
    swipes = []
    for item in raw:
        if not isinstance(item, dict) or not isinstance(item.get("kept"), bool):
            return None
        try:
            swipes.append((int(item["id"]), item["kept"]))
        except (KeyError, TypeError, ValueError):
            return None
    return swipes


@feed_bp.post("/next")
def next_product():
    """Body: {"swipes": [{"id": 12, "kept": true}, ...]} oldest first. Returns the next pick."""
    swipes = _parse_swipes(request.get_json(silent=True) or {})
    if swipes is None:
        return jsonify(error=f"Send swipes as a list of up to {MAX_SWIPES} {{id, kept}} items."), 400

    products = catalogue.load_with_embeddings()
    pick = recommend(products, swipes)
    total = sum(1 for p in products if p.get("embedding") is not None)
    if pick is None:
        return jsonify(product=None, remaining=0, total=total)

    return jsonify(
        product=_public(pick.product),
        mode=pick.mode,
        score=round(pick.score, 3) if pick.score is not None else None,
        because=_public(pick.because),
        remaining=total - len({pid for pid, _ in swipes}),
        total=total,
    )
