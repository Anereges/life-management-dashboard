# backend/routes/inspiration.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, InspirationImage
from datetime import datetime
import traceback
import random

inspiration_bp = Blueprint('inspiration', __name__)

def get_int_user_id():
    """Helper function to get user_id as integer from JWT"""
    try:
        user_id = get_jwt_identity()
        print(f"🔍 get_int_user_id - raw: {user_id} (type: {type(user_id)})")
        
        if user_id is None:
            print("❌ user_id is None")
            return None
        
        if isinstance(user_id, int):
            return user_id
        
        if isinstance(user_id, str):
            try:
                return int(user_id)
            except ValueError:
                print(f"❌ Cannot convert '{user_id}' to int")
                return None
        
        if isinstance(user_id, dict):
            user_id = user_id.get('id') or user_id.get('sub')
            if user_id:
                try:
                    return int(user_id)
                except:
                    return None
        
        return None
    except Exception as e:
        print(f"❌ Error getting user_id: {e}")
        return None

@inspiration_bp.route('/images', methods=['GET'])
@jwt_required()
def get_images():
    try:
        user_id = get_int_user_id()
        if user_id is None:
            return jsonify({'error': 'Invalid user ID'}), 400
        
        print(f"✅ get_images - user_id: {user_id}")
        
        category = request.args.get('category')
        
        query = InspirationImage.query.filter_by(user_id=user_id)
        
        if category:
            query = query.filter_by(category=category)
        
        images = query.order_by(InspirationImage.created_at.desc()).all()
        
        return jsonify([i.to_dict() for i in images]), 200
    except Exception as e:
        print(f"❌ Error in get_images: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@inspiration_bp.route('/images', methods=['POST'])
@jwt_required()
def create_image():
    try:
        user_id = get_int_user_id()
        if user_id is None:
            return jsonify({'error': 'Invalid user ID'}), 400
        
        print(f"✅ create_image - user_id: {user_id}")
        
        data = request.get_json()
        print(f"Data received: {data}")
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        if not data.get('title'):
            return jsonify({'error': 'Title is required'}), 400
        
        # Create image with all fields from the model
        image = InspirationImage(
            user_id=user_id,
            title=data['title'],
            image_url=data.get('image_url'),
            category=data.get('category', 'Other'),
            description=data.get('description', ''),
            color=data.get('color', '#6C5CE7'),
            icon=data.get('icon', 'fa-star'),
            is_favorite=data.get('is_favorite', False)
        )
        
        db.session.add(image)
        db.session.commit()
        
        print(f"✅ Image created: ID={image.id}, Title={image.title}")
        
        return jsonify({
            'id': image.id,
            'message': 'Inspiration image added successfully'
        }), 201
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error creating image: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@inspiration_bp.route('/images/<int:image_id>', methods=['PUT'])
@jwt_required()
def update_image(image_id):
    try:
        user_id = get_int_user_id()
        if user_id is None:
            return jsonify({'error': 'Invalid user ID'}), 400
        
        print(f"✅ update_image - user_id: {user_id}, image_id: {image_id}")
        
        image = InspirationImage.query.filter_by(id=image_id, user_id=user_id).first()
        if not image:
            return jsonify({'error': 'Image not found'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        print(f"Update data: {data}")
        
        if 'title' in data:
            image.title = data['title']
        if 'description' in data:
            image.description = data['description']
        if 'category' in data:
            image.category = data['category']
        if 'color' in data:
            image.color = data['color']
        if 'icon' in data:
            image.icon = data['icon']
        if 'is_favorite' in data:
            image.is_favorite = data['is_favorite']
        if 'image_url' in data:
            image.image_url = data['image_url']
        
        db.session.commit()
        
        print(f"✅ Image updated: ID={image_id}")
        
        return jsonify({'message': 'Image updated successfully'})
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error updating image: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@inspiration_bp.route('/images/<int:image_id>', methods=['DELETE'])
@jwt_required()
def delete_image(image_id):
    try:
        user_id = get_int_user_id()
        if user_id is None:
            return jsonify({'error': 'Invalid user ID'}), 400
        
        print(f"✅ delete_image - user_id: {user_id}, image_id: {image_id}")
        
        image = InspirationImage.query.filter_by(id=image_id, user_id=user_id).first()
        if not image:
            return jsonify({'error': 'Image not found'}), 404
        
        db.session.delete(image)
        db.session.commit()
        
        print(f"✅ Image deleted: ID={image_id}")
        
        return jsonify({'message': 'Image deleted successfully'})
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error deleting image: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@inspiration_bp.route('/rotate', methods=['GET'])
@jwt_required()
def get_random_image():
    try:
        user_id = get_int_user_id()
        if user_id is None:
            return jsonify({'error': 'Invalid user ID'}), 400
        
        print(f"✅ get_random_image - user_id: {user_id}")
        
        images = InspirationImage.query.filter_by(user_id=user_id).all()
        
        if not images:
            return jsonify({'error': 'No inspiration images found'}), 404
        
        image = random.choice(images)
        
        return jsonify(image.to_dict())
    except Exception as e:
        print(f"❌ Error in get_random_image: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500