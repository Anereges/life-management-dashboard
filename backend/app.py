# backend/app.py

import os
import logging

from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_migrate import Migrate

from models import db
from config import config


# --------------------------------------------------
# Logging
# --------------------------------------------------

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# --------------------------------------------------
# Extensions
# --------------------------------------------------

bcrypt = Bcrypt()
jwt = JWTManager()
migrate = Migrate()


# --------------------------------------------------
# Create Application
# --------------------------------------------------

def create_app(config_name="production"):

    app = Flask(
        __name__,
        static_folder="../frontend",
        static_url_path=""
    )

    app.config.from_object(config[config_name])


    # --------------------------------------------------
    # Initialize Extensions
    # --------------------------------------------------

    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)


    # --------------------------------------------------
    # CORS Configuration
    # --------------------------------------------------

    CORS(
        app,
        origins=[
            "https://amanlms.vercel.app",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:5000",
            "http://127.0.0.1:5000",
        ],
        supports_credentials=True,
        allow_headers=[
            "Content-Type",
            "Authorization"
        ],
        methods=[
            "GET",
            "POST",
            "PUT",
            "DELETE",
            "OPTIONS"
        ]
    )


    # --------------------------------------------------
    # Upload Folder
    # --------------------------------------------------

    os.makedirs(
        app.config["UPLOAD_FOLDER"],
        exist_ok=True
    )


    # --------------------------------------------------
    # Import Routes
    # --------------------------------------------------

    from routes.auth import auth_bp
    from routes.dashboard import dashboard_bp
    from routes.goals import goals_bp
    from routes.tasks import tasks_bp
    from routes.family import family_bp
    from routes.journal import journal_bp
    from routes.achievements import achievements_bp
    from routes.analytics import analytics_bp
    from routes.inspiration import inspiration_bp
    from routes.timeline import timeline_bp
    from routes.values import values_bp
    from routes.knowledge import knowledge_bp
    from routes.reflection import reflection_bp
    from routes.legacy_bot import legacy_bot_bp



    # --------------------------------------------------
    # Register Routes
    # --------------------------------------------------

    app.register_blueprint(
        auth_bp,
        url_prefix="/api/auth"
    )

    app.register_blueprint(
        dashboard_bp,
        url_prefix="/api/dashboard"
    )

    app.register_blueprint(
        goals_bp,
        url_prefix="/api/goals"
    )

    app.register_blueprint(
        tasks_bp,
        url_prefix="/api/tasks"
    )

    app.register_blueprint(
        family_bp,
        url_prefix="/api/family"
    )

    app.register_blueprint(
        journal_bp,
        url_prefix="/api/journal"
    )

    app.register_blueprint(
        achievements_bp,
        url_prefix="/api/achievements"
    )

    app.register_blueprint(
        analytics_bp,
        url_prefix="/api/analytics"
    )

    app.register_blueprint(
        inspiration_bp,
        url_prefix="/api/inspiration"
    )

    app.register_blueprint(
        timeline_bp,
        url_prefix="/api/timeline"
    )

    app.register_blueprint(
        values_bp,
        url_prefix="/api/values"
    )

    app.register_blueprint(
        knowledge_bp,
        url_prefix="/api/knowledge"
    )

    app.register_blueprint(
        reflection_bp,
        url_prefix="/api/reflection"
    )

    app.register_blueprint(
        legacy_bot_bp,
        url_prefix="/api/legacy_bot"
    )


    # --------------------------------------------------
    # Health Check
    # --------------------------------------------------

    @app.route("/")
    def home():
        return jsonify({
            "message": "Life Management Dashboard API",
            "status": "running"
        })


    @app.route("/health")
    def health():
        return jsonify({
            "status": "healthy",
            "version": app.config["VERSION"]
        })


    # --------------------------------------------------
    # Error Handlers
    # --------------------------------------------------

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "error": "Not found"
        }), 404


    @app.errorhandler(500)
    def internal_error(error):
        logger.error(error)

        return jsonify({
            "error": "Internal Server Error",
            "message": str(error)
        }), 500


    # --------------------------------------------------
    # Create Database Tables
    # IMPORTANT FOR RENDER
    # --------------------------------------------------

    with app.app_context():
        db.create_all()
        logger.info(
            "✅ Database tables checked/created"
        )


    return app



# --------------------------------------------------
# Gunicorn Entry Point
# --------------------------------------------------

app = create_app("production")



# --------------------------------------------------
# Local Development
# --------------------------------------------------

if __name__ == "__main__":

    app = create_app("development")

    logger.info(
        "🚀 Starting Flask server on http://localhost:5000"
    )

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )