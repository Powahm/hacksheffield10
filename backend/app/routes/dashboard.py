"""Brand studio: product CRUD. Reads are public, writes need the admin token."""

from flask import Blueprint, jsonify, request

import catalogue
from app.security import require_admin
from services.embedding_client import embed_product

dashboard_bp = Blueprint("dashboard", __name__)

EDITABLE = {"name", "description", "price", "category", "image_url", "tags"}


def _clean(body) -> tuple[dict | None, str | None]:
    if not isinstance(body, dict):
        return None, "Send the product as JSON."
    data = {k: v for k, v in body.items() if k in EDITABLE}
    if "price" in data:
        try:
            data["price"] = round(float(data["price"]), 2)
        except (TypeError, ValueError):
            return None, "Price must be a number."
        if data["price"] < 0:
            return None, "Price cannot be negative."
    if "tags" in data:
        tags = data["tags"]
        if isinstance(tags, str):
            tags = [t.strip() for t in tags.split(",")]
        if not isinstance(tags, list):
            return None, "Tags must be a list or a comma-separated string."
        data["tags"] = [str(t).strip() for t in tags if str(t).strip()][:12]
    for field in ("name", "description", "category", "image_url"):
        if field in data and data[field] is not None:
            data[field] = str(data[field]).strip()
    return data, None


@dashboard_bp.get("/products")
def list_products():
    return jsonify(catalogue.list_products())


@dashboard_bp.get("/products/<int:product_id>")
def fetch_one(product_id: int):
    product = catalogue.get_product(product_id)
    if not product:
        return jsonify(error="No product with that id."), 404
    return jsonify(product)


@dashboard_bp.post("/products")
@require_admin
def create():
    data, err = _clean(request.get_json(silent=True))
    if err:
        return jsonify(error=err), 400
    if not data.get("name") or "price" not in data:
        return jsonify(error="A product needs at least a name and a price."), 400
    data["embedding"] = embed_product(data)
    return jsonify(catalogue.create(data)), 201


@dashboard_bp.put("/products/<int:product_id>")
@require_admin
def update(product_id: int):
    data, err = _clean(request.get_json(silent=True))
    if err:
        return jsonify(error=err), 400
    if not data:
        return jsonify(error="Nothing to update."), 400
    existing = catalogue.get_product(product_id)
    if not existing:
        return jsonify(error="No product with that id."), 404
    data["embedding"] = embed_product({**existing, **data})
    return jsonify(catalogue.update(product_id, data))


@dashboard_bp.delete("/products/<int:product_id>")
@require_admin
def delete(product_id: int):
    record = catalogue.delete(product_id)
    if not record:
        return jsonify(error="No product with that id."), 404
    return jsonify(deleted=record)
