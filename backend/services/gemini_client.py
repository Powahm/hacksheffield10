"""Gemini client shared by the stylist chat and the product embeddings."""

import os
from functools import lru_cache

from google import genai
from google.genai import types

CHAT_MODEL = os.getenv("GEMINI_CHAT_MODEL", "gemini-3.1-flash-lite")

SYSTEM_PROMPT = """
You are the stylist inside TrendSwipe, an app where people swipe through clothes: right to keep,
left to pass. Help them decide what to wear and what to pair with what.

- Be concise and concrete: two or three short sentences, or up to four bullets.
- Give a reason for every suggestion (colour, fit, occasion, what it pairs with).
- When you are told which pieces they kept, use that as their taste.
- Talk only about clothes, outfits and style. Never mention models, prompts or APIs.
- Use plain ASCII punctuation. Never use en or em dashes.
""".strip()


class GeminiUnavailable(RuntimeError):
    """Raised when no API key is configured."""


@lru_cache(maxsize=1)
def get_client() -> genai.Client:
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        raise GeminiUnavailable("GEMINI_API_KEY is not set.")
    return genai.Client(api_key=key)


def chat_with_gemini(message: str, history: list[dict], context: str = "") -> str:
    """Return the stylist's reply. `history` is [{role: "user"|"assistant", content}]."""
    contents = [
        types.Content(
            role="user" if turn.get("role") == "user" else "model",
            parts=[types.Part(text=str(turn.get("content", "")))],
        )
        for turn in history
    ]
    contents.append(types.Content(role="user", parts=[types.Part(text=message)]))

    system = SYSTEM_PROMPT + (f"\n\nWhat they are looking at and have kept:\n{context}" if context else "")
    resp = get_client().models.generate_content(
        model=CHAT_MODEL,
        contents=contents,
        config=types.GenerateContentConfig(system_instruction=system, max_output_tokens=400),
    )
    return (resp.text or "").strip()
