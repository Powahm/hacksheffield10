"""Request guards: the studio admin token and a small per-client rate limiter."""

import hmac
import threading
import time
from collections import defaultdict, deque
from functools import wraps

from flask import current_app, jsonify, request


def require_admin(view):
    """Allow product writes only with the right X-Admin-Token header.

    With no ADMIN_TOKEN configured, writes are allowed in debug (local dev) and refused
    everywhere else, so a deploy that forgets the secret fails closed.
    """

    @wraps(view)
    def wrapper(*args, **kwargs):
        expected = current_app.config.get("ADMIN_TOKEN")
        if not expected:
            if current_app.debug:
                return view(*args, **kwargs)
            return jsonify(error="Studio editing is turned off on this server."), 503
        given = request.headers.get("X-Admin-Token", "")
        if not hmac.compare_digest(given.encode(), expected.encode()):
            return jsonify(error="Studio key missing or wrong."), 401
        return view(*args, **kwargs)

    return wrapper


class RateLimiter:
    """Sliding one-minute window per client IP.

    In-process only: on Lambda each warm instance keeps its own window, so this caps a
    single client per instance. API Gateway throttling is the global limit.
    """

    def __init__(self):
        self._hits: dict[str, deque] = defaultdict(deque)
        self._lock = threading.Lock()

    def allow(self, key: str, per_minute: int, now: float | None = None) -> bool:
        now = time.monotonic() if now is None else now
        with self._lock:
            hits = self._hits[key]
            while hits and now - hits[0] > 60:
                hits.popleft()
            if len(hits) >= per_minute:
                return False
            hits.append(now)
            return True

    def reset(self):
        with self._lock:
            self._hits.clear()


chat_limiter = RateLimiter()


def client_ip() -> str:
    forwarded = request.headers.get("X-Forwarded-For", "")
    return forwarded.split(",")[0].strip() or request.remote_addr or "unknown"


def rate_limited(limiter: RateLimiter, config_key: str):
    def decorator(view):
        @wraps(view)
        def wrapper(*args, **kwargs):
            if not limiter.allow(client_ip(), current_app.config[config_key]):
                return jsonify(error="Too many messages. Wait a minute and try again."), 429
            return view(*args, **kwargs)

        return wrapper

    return decorator
