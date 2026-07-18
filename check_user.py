import sys
import os

# Add backend folder to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app import create_app
from models import db, User

app = create_app('development')

with app.app_context():
    print("📁 Database:", app.config['SQLALCHEMY_DATABASE_URI'])
    
    # Check all users
    users = User.query.all()
    print(f"📋 Users in database: {[u.username for u in users]}")
    
    if users:
        for user in users:
            print(f"   - {user.username} ({user.email})")
    else:
        print("❌ No users found!")