import os
from collections.abc import Iterable

from google.genai import types

from services.gemini_client import get_client

EMBEDDING_MODEL = os.getenv("GEMINI_EMBED_MODEL", "gemini-embedding-001")
# gemini-embedding-001 defaults to 3072 dimensions; 768 keeps rows small and matches the catalogue.
EMBED_DIM = int(os.getenv("GEMINI_EMBED_DIM", "768"))


class EmbeddingError(RuntimeError):
    """Raised when embedding generation fails."""


def build_product_text(product: dict) -> str:
    """Concatenate the descriptive product fields into one string to embed."""
    parts: list[str] = []
    if product.get("name"):
        parts.append(f"Name: {product['name']}")
    if product.get("category"):
        parts.append(f"Category: {product['category']}")
    if product.get("description"):
        parts.append(f"Description: {product['description']}")
    tags = product.get("tags")
    if isinstance(tags, Iterable) and not isinstance(tags, str):
        tag_list = [str(tag) for tag in tags if tag]
        if tag_list:
            parts.append("Tags: " + ", ".join(tag_list))
    return "\n".join(parts).strip()


def create_embedding(text: str) -> list[float]:
    if not text:
        raise EmbeddingError("Cannot embed empty text.")
    try:
        response = get_client().models.embed_content(
            model=EMBEDDING_MODEL,
            contents=text,
            config=types.EmbedContentConfig(
                output_dimensionality=EMBED_DIM, task_type="SEMANTIC_SIMILARITY"
            ),
        )
        return list(response.embeddings[0].values)
    except Exception as exc:  # noqa: BLE001
        raise EmbeddingError(f"Failed to create embedding: {exc}") from exc


def embed_product(product: dict) -> list[float]:
    return create_embedding(build_product_text(product))
