# backend/config.py
import os
from dotenv import load_dotenv
from datetime import timedelta

load_dotenv()

# Get absolute path of the current file's directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class Config:
    # Use consistent secret keys - make sure these match!
    SECRET_KEY = os.environ.get(
    'SECRET_KEY',
    'dev-secret-key-change-this'
)
    
    # Create database directory if it doesn't exist
    DB_DIR = os.path.join(BASE_DIR, 'database')
    os.makedirs(DB_DIR, exist_ok=True)
    
    # Use absolute path for database
    DB_PATH = os.path.join(BASE_DIR, 'database', 'life.db')
    SQLALCHEMY_DATABASE_URI = f'sqlite:///{DB_PATH.replace(os.sep, "/")}'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static/uploads')
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024
    
    OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
    AI_MODEL = 'gpt-3.5-turbo'
    
    # JWT settings - use consistent secret key
    JWT_SECRET_KEY = 'jwt-secret-key-minimum-32-characters-long-1234567890'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    APP_NAME = "Life Management Dashboard"
    VERSION = "1.0.0"

class DevelopmentConfig(Config):
    DEBUG = True
    ENV = 'development'

class ProductionConfig(Config):
    DEBUG = False
    ENV = 'production'

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}