import os


def _origins(value: str | None) -> list[str] | str:
    if not value or value.strip() == "*":
        return "*"
    return [o.strip() for o in value.split(",") if o.strip()]


class BaseConfig:
    JSON_SORT_KEYS = False
    # Comma-separated origins allowed to call the API, or "*".
    ALLOWED_ORIGINS = _origins(os.getenv("ALLOWED_ORIGINS"))
    # Shared secret for the brand studio (product writes). Unset means writes are off in production.
    ADMIN_TOKEN = os.getenv("ADMIN_TOKEN") or None
    CHAT_REQUESTS_PER_MINUTE = int(os.getenv("CHAT_REQUESTS_PER_MINUTE", "8"))


class DevConfig(BaseConfig):
    DEBUG = True


class ProdConfig(BaseConfig):
    DEBUG = False


class TestConfig(BaseConfig):
    TESTING = True
    DEBUG = False
    ALLOWED_ORIGINS = "*"
    ADMIN_TOKEN = "test-token"
    CHAT_REQUESTS_PER_MINUTE = 3
