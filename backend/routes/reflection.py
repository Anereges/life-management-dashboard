from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, DailyReflection
from datetime import datetime, date
import json

reflection_bp = Blueprint('reflection', __name__)

@reflection_bp.route('/', methods=['GET'])
@jwt_required()
def get_reflections():
    user_id = get_jwt_identity()
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    query = DailyReflection.query.filter_by(user_id=user_id)
    
    if start_date:
        query = query.filter(DailyReflection.date >= datetime.fromisoformat(start_date).date())
    if end_date:
        query = query.filter(DailyReflection.date <= datetime.fromisoformat(end_date).date())
    
    reflections = query.order_by(DailyReflection.date.desc()).all()
    
    return jsonify([{
        'id': r.id,
        'date': r.date.isoformat(),
        'what_went_well': r.what_went_well,
        'what_could_be_better': r.what_could_be_better,
        'gratitude': r.gratitude,
        'lesson_learned': r.lesson_learned,
        'ai_feedback': r.ai_feedback,
        'created_at': r.created_at.isoformat()
    } for r in reflections])

@reflection_bp.route('/', methods=['POST'])
@jwt_required()
def create_reflection():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    # Check if reflection exists for this date
    reflection_date = datetime.fromisoformat(data['date']).date() if data.get('date') else date.today()
    existing = DailyReflection.query.filter_by(user_id=user_id, date=reflection_date).first()
    
    if existing:
        # Update existing
        existing.what_went_well = data.get('what_went_well', existing.what_went_well)
        existing.what_could_be_better = data.get('what_could_be_better', existing.what_could_be_better)
        existing.gratitude = data.get('gratitude', existing.gratitude)
        existing.lesson_learned = data.get('lesson_learned', existing.lesson_learned)
        existing.ai_feedback = data.get('ai_feedback', existing.ai_feedback)
        db.session.commit()
        return jsonify({
            'id': existing.id,
            'message': 'Reflection updated successfully'
        })
    
    reflection = DailyReflection(
        user_id=user_id,
        date=reflection_date,
        what_went_well=data.get('what_went_well'),
        what_could_be_better=data.get('what_could_be_better'),
        gratitude=data.get('gratitude'),
        lesson_learned=data.get('lesson_learned'),
        ai_feedback=data.get('ai_feedback')
    )
    
    db.session.add(reflection)
    db.session.commit()
    
    return jsonify({
        'id': reflection.id,
        'message': 'Reflection created successfully'
    }), 201

@reflection_bp.route('/<int:reflection_id>', methods=['PUT'])
@jwt_required()
def update_reflection(reflection_id):
    user_id = get_jwt_identity()
    reflection = DailyReflection.query.filter_by(id=reflection_id, user_id=user_id).first_or_404()
    
    data = request.get_json()
    
    reflection.what_went_well = data.get('what_went_well', reflection.what_went_well)
    reflection.what_could_be_better = data.get('what_could_be_better', reflection.what_could_be_better)
    reflection.gratitude = data.get('gratitude', reflection.gratitude)
    reflection.lesson_learned = data.get('lesson_learned', reflection.lesson_learned)
    reflection.ai_feedback = data.get('ai_feedback', reflection.ai_feedback)
    
    db.session.commit()
    
    return jsonify({'message': 'Reflection updated successfully'})

@reflection_bp.route('/today', methods=['GET'])
@jwt_required()
def get_today_reflection():
    user_id = get_jwt_identity()
    today = date.today()
    
    reflection = DailyReflection.query.filter_by(user_id=user_id, date=today).first()
    
    if not reflection:
        return jsonify({'exists': False, 'message': 'No reflection for today'})
    
    return jsonify({
        'id': reflection.id,
        'date': reflection.date.isoformat(),
        'what_went_well': reflection.what_went_well,
        'what_could_be_better': reflection.what_could_be_better,
        'gratitude': reflection.gratitude,
        'lesson_learned': reflection.lesson_learned,
        'ai_feedback': reflection.ai_feedback
    })