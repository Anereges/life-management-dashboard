import sys
import os

# Add backend folder to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app import create_app
from models import db, User
from flask_bcrypt import Bcrypt

# Create app with database context
app = create_app('development')
bcrypt = Bcrypt()

with app.app_context():
    print("🔍 Checking for users...")
    
    # Check if user exists
    user = User.query.filter_by(username='aman').first()
    if user:
        print(f"✅ User already exists: {user.username}")
        print(f"   ID: {user.id}")
        print(f"   Email: {user.email}")
    else:
        # Create user
        hashed = bcrypt.generate_password_hash('password123').decode('utf-8')
        new_user = User(
            username='aman',
            email='aman@email.com',
            password_hash=hashed,
            full_name='Aman'
        )
        db.session.add(new_user)
        db.session.commit()
        print("✅ User created successfully!")
        print(f"   Username: {new_user.username}")
        print(f"   ID: {new_user.id}")
        print(f"   Email: {new_user.email}")
    
    # List all users
    all_users = User.query.all()
    print(f"\n📋 All users in database: {[u.username for u in all_users]}")