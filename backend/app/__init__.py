import os

from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

# Load .env before anything reads the environment. Searches up from the working directory,
# so it finds the repo-root .env whether the app starts from the root or from backend/.
load_dotenv()

from .routes import chat_bp, core_bp, dashboard_bp, feed_bp, products_bp  # noqa: E402


def create_app(config_name: str | None = None) -> Flask:
    app = Flask(__name__)
    config_name = config_name or os.getenv("APP_CONFIG", "Dev")
    app.config.from_object(f"app.config.{config_name}Config")

    CORS(app, resources={r"/api/*": {"origins": app.config["ALLOWED_ORIGINS"]}})

    app.register_blueprint(core_bp)
    app.register_blueprint(products_bp, url_prefix="/api/products")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
    app.register_blueprint(feed_bp, url_prefix="/api/feed")
    app.register_blueprint(chat_bp, url_prefix="/api")

    @app.errorhandler(HTTPException)
    def http_error(exc: HTTPException):
        return jsonify(error=exc.description), exc.code

    @app.errorhandler(Exception)
    def unhandled(exc: Exception):
        app.logger.exception("Unhandled error: %r", exc)
        return jsonify(error="Something went wrong on the server. Try again in a moment."), 500

    return app
