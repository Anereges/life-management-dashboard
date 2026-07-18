import sys
import os

# Add backend folder to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app import create_app
from models import db

# Create app with database context
app = create_app('development')

with app.app_context():
    print("📦 Creating database tables...")
    db.create_all()
    print("✅ Database tables created successfully!")
    
    # List all tables
    from sqlalchemy import inspect
    inspector = inspect(db.engine)
    tables = inspector.get_table_names()
    print(f"📋 Tables created: {tables}")