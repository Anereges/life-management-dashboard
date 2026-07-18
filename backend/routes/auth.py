# backend/routes/auth.py
from flask import Blueprint, request, jsonify
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db, User
from datetime import datetime, timedelta
import traceback

auth_bp = Blueprint('auth', __name__)
bcrypt = Bcrypt()

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        if not data.get('username') or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Username, email, and password are required'}), 400
        
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 400
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 400
        
        hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
        
        user = User(
            username=data['username'],
            email=data['email'],
            password_hash=hashed_password,
            full_name=data.get('full_name', data['username'])
        )
        
        db.session.add(user)
        db.session.commit()
        
        print(f"✅ User registered: {user.username} (ID: {user.id})")
        
        return jsonify({
            'message': 'User created successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'full_name': user.full_name
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        print(f"❌ Registration error: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data.get('username') or not data.get('password'):
            return jsonify({'error': 'Username and password are required'}), 400
        
        user = User.query.filter_by(username=data['username']).first()
        
        if not user or not bcrypt.check_password_hash(user.password_hash, data['password']):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # IMPORTANT: Convert user.id to string for JWT subject
        access_token = create_access_token(
            identity=str(user.id),  # <-- Convert to string
            expires_delta=timedelta(hours=24)
        )
        
        print(f"✅ Login successful: {user.username} (ID: {user.id})")
        print(f"   Token created with identity: {str(user.id)}")
        
        return jsonify({
            'access_token': access_token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'full_name': user.full_name
            }
        }), 200
    except Exception as e:
        print(f"❌ Login error: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def profile():
    try:
        user_id = get_jwt_identity()
        print(f"Profile request for user_id: {user_id} (type: {type(user_id)})")
        
        # user_id is now a string, convert to int for database query
        if isinstance(user_id, str):
            try:
                user_id = int(user_id)
            except ValueError:
                return jsonify({'error': 'Invalid user ID format'}), 400
        
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'full_name': user.full_name,
            'created_at': user.created_at.isoformat()
        })
    except Exception as e:
        print(f"❌ Profile error: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    try:
        user_id = get_jwt_identity()
        
        if isinstance(user_id, str):
            try:
                user_id = int(user_id)
            except ValueError:
                return jsonify({'error': 'Invalid user ID format'}), 400
        
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        if data.get('full_name'):
            user.full_name = data['full_name']
        
        if data.get('email'):
            existing = User.query.filter_by(email=data['email']).first()
            if existing and existing.id != user_id:
                return jsonify({'error': 'Email already taken'}), 400
            user.email = data['email']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'full_name': user.full_name
            }
        })
    except Exception as e:
        db.session.rollback()
        print(f"❌ Update profile error: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500