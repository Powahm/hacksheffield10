from flask import Blueprint, current_app, jsonify, request

import catalogue
from app.security import chat_limiter, rate_limited
from services.gemini_client import chat_with_gemini

chat_bp = Blueprint("chat", __name__)

MAX_MESSAGE = 500
MAX_TURNS = 10


def _describe(product: dict) -> str:
    return f"{product.get('name')} ({product.get('category')}, ${product.get('price')})"


@chat_bp.post("/chat")
@rate_limited(chat_limiter, "CHAT_REQUESTS_PER_MINUTE")
def chat():
    """Body: {message, history?: [{role, content}], product_id?, kept_ids?: [int]}."""
    data = request.get_json(silent=True) or {}
    message = str(data.get("message", "")).strip()
    if not message:
        return jsonify(error="Type a question for the stylist."), 400
    if len(message) > MAX_MESSAGE:
        return jsonify(error=f"Keep questions under {MAX_MESSAGE} characters."), 400

    history = [
        {"role": t.get("role"), "content": str(t.get("content", ""))[:MAX_MESSAGE]}
        for t in (data.get("history") or [])[-MAX_TURNS:]
        if isinstance(t, dict)
    ]

    lines = []
    product_id = data.get("product_id")
    if isinstance(product_id, int):
        current = catalogue.get_product(product_id)
        if current:
            lines.append("Looking at: " + _describe(current))
    kept_ids = [i for i in (data.get("kept_ids") or [])[:20] if isinstance(i, int)]
    kept = [p for p in (catalogue.get_product(i) for i in kept_ids) if p]
    if kept:
        lines.append("Kept: " + "; ".join(_describe(p) for p in kept))

    try:
        reply = chat_with_gemini(message, history, "\n".join(lines))
    except Exception as exc:  # noqa: BLE001
        current_app.logger.warning("Stylist chat failed: %r", exc)
        return jsonify(error="The stylist is unavailable right now. Try again shortly."), 502
    return jsonify(reply=reply)
