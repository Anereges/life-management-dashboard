# backend/routes/achievements.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Achievement
from datetime import datetime, date
import json

achievements_bp = Blueprint('achievements', __name__)

def get_int_user_id():
    """Helper function to get user_id as integer from JWT"""
    try:
        user_id = get_jwt_identity()
        if isinstance(user_id, str):
            try:
                return int(user_id)
            except ValueError:
                return None
        return user_id
    except Exception as e:
        print(f"Error getting user_id: {e}")
        return None

@achievements_bp.route('/', methods=['GET'])
@jwt_required()
def get_achievements():
    try:
        user_id = get_int_user_id()
        if user_id is None:
            return jsonify({'error': 'Invalid user ID'}), 400
        
        hall_of_fame = request.args.get('hall_of_fame')
        
        query = Achievement.query.filter_by(user_id=user_id)
        
        if hall_of_fame is not None:
            query = query.filter_by(is_hall_of_fame=hall_of_fame.lower() == 'true')
        
        achievements = query.order_by(Achievement.date_earned.desc()).all()
        
        return jsonify([{
            'id': a.id,
            'title': a.title,
            'description': a.description,
            'date_earned': a.date_earned.isoformat() if a.date_earned else None,
            'importance': a.importance,
            'media_url': a.media_url,
            'media_type': a.media_type,
            'notes': a.notes,
            'is_hall_of_fame': a.is_hall_of_fame,
            'created_at': a.created_at.isoformat(),
            'category': a.category if hasattr(a, 'category') else 'General',
            'points': a.points if hasattr(a, 'points') else 10,
            'badge': a.badge if hasattr(a, 'badge') else 'bronze',
            'is_favorite': a.is_favorite if hasattr(a, 'is_favorite') else False
        } for a in achievements])
    except Exception as e:
        print(f"Error in get_achievements: {e}")
        return jsonify({'error': str(e)}), 500

@achievements_bp.route('/', methods=['POST'])
@jwt_required()
def create_achievement():
    try:
        user_id = get_int_user_id()
        if user_id is None:
            return jsonify({'error': 'Invalid user ID'}), 400
        
        data = request.get_json()
        
        if not data.get('title'):
            return jsonify({'error': 'Title is required'}), 400
        
        # Parse date
        date_earned = date.today()
        if data.get('date_earned'):
            try:
                date_earned = datetime.fromisoformat(data['date_earned']).date()
            except:
                pass
        
        achievement = Achievement(
            user_id=user_id,
            title=data['title'],
            description=data.get('description', ''),
            date_earned=date_earned,
            importance=data.get('importance', 1),
            media_url=data.get('media_url'),
            media_type=data.get('media_type'),
            notes=data.get('notes', ''),
            is_hall_of_fame=data.get('is_hall_of_fame', False),
            category=data.get('category', 'General'),
            points=data.get('points', 10),
            badge=data.get('badge', 'bronze'),
            is_favorite=data.get('is_favorite', False)
        )
        
        db.session.add(achievement)
        db.session.commit()
        
        return jsonify({
            'id': achievement.id,
            'message': 'Achievement created successfully'
        }), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error creating achievement: {e}")
        return jsonify({'error': str(e)}), 500

@achievements_bp.route('/<int:achievement_id>', methods=['PUT'])
@jwt_required()
def update_achievement(achievement_id):
    try:
        user_id = get_int_user_id()
        if user_id is None:
            return jsonify({'error': 'Invalid user ID'}), 400
        
        achievement = Achievement.query.filter_by(id=achievement_id, user_id=user_id).first()
        if not achievement:
            return jsonify({'error': 'Achievement not found'}), 404
        
        data = request.get_json()
        
        if 'title' in data:
            achievement.title = data['title']
        if 'description' in data:
            achievement.description = data['description']
        if 'importance' in data:
            achievement.importance = data['importance']
        if 'notes' in data:
            achievement.notes = data['notes']
        if 'is_hall_of_fame' in data:
            achievement.is_hall_of_fame = data['is_hall_of_fame']
        if 'category' in data:
            achievement.category = data['category']
        if 'points' in data:
            achievement.points = data['points']
        if 'badge' in data:
            achievement.badge = data['badge']
        if 'is_favorite' in data:
            achievement.is_favorite = data['is_favorite']
        
        if data.get('date_earned'):
            try:
                achievement.date_earned = datetime.fromisoformat(data['date_earned']).date()
            except:
                pass
        
        db.session.commit()
        
        return jsonify({'message': 'Achievement updated successfully'})
    except Exception as e:
        db.session.rollback()
        print(f"Error updating achievement: {e}")
        return jsonify({'error': str(e)}), 500

@achievements_bp.route('/<int:achievement_id>', methods=['DELETE'])
@jwt_required()
def delete_achievement(achievement_id):
    try:
        user_id = get_int_user_id()
        if user_id is None:
            return jsonify({'error': 'Invalid user ID'}), 400
        
        achievement = Achievement.query.filter_by(id=achievement_id, user_id=user_id).first()
        if not achievement:
            return jsonify({'error': 'Achievement not found'}), 404
        
        db.session.delete(achievement)
        db.session.commit()
        
        return jsonify({'message': 'Achievement deleted successfully'})
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting achievement: {e}")
        return jsonify({'error': str(e)}), 500

@achievements_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_achievement_stats():
    try:
        user_id = get_int_user_id()
        if user_id is None:
            return jsonify({'error': 'Invalid user ID'}), 400
        
        total = Achievement.query.filter_by(user_id=user_id).count()
        hall_of_fame = Achievement.query.filter_by(user_id=user_id, is_hall_of_fame=True).count()
        total_importance = db.session.query(db.func.sum(Achievement.importance)).filter_by(user_id=user_id).scalar() or 0
        
        return jsonify({
            'total_achievements': total,
            'hall_of_fame_count': hall_of_fame,
            'total_importance_score': total_importance,
            'average_importance': round(total_importance / total, 1) if total > 0 else 0
        })
    except Exception as e:
        print(f"Error in get_achievement_stats: {e}")
        return jsonify({'error': str(e)}), 500