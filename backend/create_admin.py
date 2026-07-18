from app import create_app
from models import db, User
from flask_bcrypt import Bcrypt


app = create_app()

bcrypt = Bcrypt()


with app.app_context():

    existing = User.query.filter_by(username="aman").first()

    if existing:
        print("User already exists")
    else:

        user = User(
            username="aman",
            email="aman@example.com",
            password_hash=bcrypt.generate_password_hash("password123").decode("utf-8"),
            full_name="Aman"
        )

        db.session.add(user)
        db.session.commit()

        print("✅ Admin user created")