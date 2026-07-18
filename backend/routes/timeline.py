# backend/routes/timeline.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, TimelineEvent
from datetime import datetime, date
import traceback

timeline_bp = Blueprint('timeline', __name__)

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

@timeline_bp.route('/events', methods=['GET'])
@jwt_required()
def get_events():
    try:
        user_id = get_int_user_id()
        if user_id is None:
            return jsonify({'error': 'Invalid user ID'}), 400
        
        events = TimelineEvent.query.filter_by(user_id=user_id).order_by(TimelineEvent.date.desc()).all()
        
        return jsonify([{
            'id': e.id,
            'title': e.title,
            'description': e.description,
            'date': e.date.isoformat(),
            'event_type': e.event_type,
            'media_url': e.media_url,
            'media_type': e.media_type,
            'location': e.location,
            'created_at': e.created_at.isoformat(),
            'is_highlight': e.is_highlight if hasattr(e, 'is_highlight') else False
        } for e in events])
    except Exception as e:
        print(f"Error in get_events: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@timeline_bp.route('/events', methods=['POST'])
@jwt_required()
def create_event():
    try:
        user_id = get_int_user_id()
        if user_id is None:
            return jsonify({'error': 'Invalid user ID'}), 400
        
        data = request.get_json()
        
        if not data.get('title'):
            return jsonify({'error': 'Title is required'}), 400
        
        # Parse date
        event_date = date.today()
        if data.get('date'):
            try:
                event_date = datetime.fromisoformat(data['date']).date()
            except:
                pass
        
        event = TimelineEvent(
            user_id=user_id,
            title=data['title'],
            description=data.get('description', ''),
            date=event_date,
            event_type=data.get('event_type', 'life_event'),
            media_url=data.get('media_url'),
            media_type=data.get('media_type'),
            location=data.get('location', ''),
            is_highlight=data.get('is_highlight', False)
        )
        
        db.session.add(event)
        db.session.commit()
        
        return jsonify({
            'id': event.id,
            'message': 'Timeline event created successfully'
        }), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error creating event: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@timeline_bp.route('/events/<int:event_id>', methods=['PUT'])
@jwt_required()
def update_event(event_id):
    try:
        user_id = get_int_user_id()
        if user_id is None:
            return jsonify({'error': 'Invalid user ID'}), 400
        
        event = TimelineEvent.query.filter_by(id=event_id, user_id=user_id).first()
        if not event:
            return jsonify({'error': 'Event not found'}), 404
        
        data = request.get_json()
        
        if 'title' in data:
            event.title = data['title']
        if 'description' in data:
            event.description = data['description']
        if 'event_type' in data:
            event.event_type = data['event_type']
        if 'location' in data:
            event.location = data['location']
        if 'is_highlight' in data:
            event.is_highlight = data['is_highlight']
        
        if data.get('date'):
            try:
                event.date = datetime.fromisoformat(data['date']).date()
            except:
                pass
        
        db.session.commit()
        
        return jsonify({'message': 'Event updated successfully'})
    except Exception as e:
        db.session.rollback()
        print(f"Error updating event: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@timeline_bp.route('/events/<int:event_id>', methods=['DELETE'])
@jwt_required()
def delete_event(event_id):
    try:
        user_id = get_int_user_id()
        if user_id is None:
            return jsonify({'error': 'Invalid user ID'}), 400
        
        event = TimelineEvent.query.filter_by(id=event_id, user_id=user_id).first()
        if not event:
            return jsonify({'error': 'Event not found'}), 404
        
        db.session.delete(event)
        db.session.commit()
        
        return jsonify({'message': 'Event deleted successfully'})
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting event: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@timeline_bp.route('/years', methods=['GET'])
@jwt_required()
def get_years():
    try:
        user_id = get_int_user_id()
        if user_id is None:
            return jsonify({'error': 'Invalid user ID'}), 400
        
        years = db.session.query(
            func.extract('year', TimelineEvent.date).label('year')
        ).filter_by(user_id=user_id).distinct().order_by('year').all()
        
        return jsonify([int(year[0]) for year in years])
    except Exception as e:
        print(f"Error in get_years: {e}")
        return jsonify({'error': str(e)}), 500