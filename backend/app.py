# backend/app.py
import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_migrate import Migrate
from models import db
from config import config
import logging

# Setup logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

bcrypt = Bcrypt()
jwt = JWTManager()
migrate = Migrate()

def create_app(config_name='development'):
    app = Flask(__name__, static_folder='../frontend', static_url_path='')
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)
    CORS(app, supports_credentials=True, origins=['http://127.0.0.1:3000', 'http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:5000'])
    migrate.init_app(app, db)
    
    # Create upload folder
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Register blueprints
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
    from routes.legacy_bot import legacy_bot_bp  # ADD THIS IMPORT
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(goals_bp, url_prefix='/api/goals')
    app.register_blueprint(tasks_bp, url_prefix='/api/tasks')
    app.register_blueprint(family_bp, url_prefix='/api/family')
    app.register_blueprint(journal_bp, url_prefix='/api/journal')
    app.register_blueprint(achievements_bp, url_prefix='/api/achievements')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(inspiration_bp, url_prefix='/api/inspiration')
    app.register_blueprint(timeline_bp, url_prefix='/api/timeline')
    app.register_blueprint(values_bp, url_prefix='/api/values')
    app.register_blueprint(knowledge_bp, url_prefix='/api/knowledge')
    app.register_blueprint(reflection_bp, url_prefix='/api/reflection')
    app.register_blueprint(legacy_bot_bp, url_prefix='/api/legacy_bot')  # ADD THIS REGISTRATION
    
    @app.route('/')
    def serve_frontend():
        return send_from_directory('../frontend', 'index.html')
    
    @app.route('/health')
    def health():
        return jsonify({'status': 'healthy', 'version': app.config['VERSION']})
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Not found'}), 404
    
    @app.errorhandler(422)
    def handle_unprocessable_entity(e):
        logger.error(f"422 Error: {str(e)}")
        return jsonify({'error': 'Unprocessable Entity', 'message': str(e)}), 422
    
    @app.errorhandler(500)
    def handle_internal_error(e):
        logger.error(f"500 Error: {str(e)}")
        return jsonify({'error': 'Internal Server Error', 'message': str(e)}), 500
    
    return app

if __name__ == '__main__':
    app = create_app('development')
    with app.app_context():
        db.create_all()
        logger.info("✅ Database tables created")
    logger.info("🚀 Starting Flask server on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)