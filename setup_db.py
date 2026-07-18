import sys
import os

# Add backend folder to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app import create_app
from models import db, User
from flask_bcrypt import Bcrypt
from sqlalchemy import inspect

def setup_database():
    """Create tables and add default user"""
    app = create_app('development')
    bcrypt = Bcrypt()
    
    with app.app_context():
        print("📦 Creating database tables...")
        db.create_all()
        
        # Show where the database is
        print(f"📁 Database: {app.config['SQLALCHEMY_DATABASE_URI']}")
        
        # Show tables
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        print(f"✅ Tables created: {tables}")
        
        print("\n🔍 Checking for users...")
        user = User.query.filter_by(username='aman').first()
        
        if user:
            print(f"✅ User already exists: {user.username}")
        else:
            hashed = bcrypt.generate_password_hash('password123').decode('utf-8')
            new_user = User(
                username='aman',
                email='aman@email.com',
                password_hash=hashed,
                full_name='Aman'
            )
            db.session.add(new_user)
            db.session.commit()
            print("✅ Default user created:")
            print(f"   Username: {new_user.username}")
            print(f"   Password: password123")
        
        # Show all users
        users = User.query.all()
        print(f"\n📋 Users in database: {[u.username for u in users]}")
        print("\n✅ Setup complete!")
        print("🔐 Login with: aman / password123")

if __name__ == "__main__":
    setup_database()