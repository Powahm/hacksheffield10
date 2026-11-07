from flask import Blueprint, jsonify, request

import catalogue

products_bp = Blueprint("products", __name__)


@products_bp.get("")
@products_bp.get("/")
def list_products():
    return jsonify(catalogue.list_products())


@products_bp.get("/<int:product_id>")
def get_product(product_id: int):
    product = catalogue.get_product(product_id)
    if product is None:
        return jsonify(error="No product with that id."), 404
    return jsonify(product)


@products_bp.get("/search")
def search_products():
    query = request.args.get("q", "").strip()
    if not query:
        return jsonify(error="Add a search term with ?q="), 400
    results = catalogue.search(query[:100])
    return jsonify(products=results, count=len(results))
