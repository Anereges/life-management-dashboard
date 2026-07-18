from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, JournalEntry
from datetime import datetime, date

journal_bp = Blueprint('journal', __name__)

@journal_bp.route('/entries', methods=['GET'])
@jwt_required()
def get_entries():
    user_id = get_jwt_identity()
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    limit = request.args.get('limit', 50, type=int)
    
    query = JournalEntry.query.filter_by(user_id=user_id)
    
    if start_date:
        start = datetime.fromisoformat(start_date).date()
        query = query.filter(JournalEntry.date >= start)
    if end_date:
        end = datetime.fromisoformat(end_date).date()
        query = query.filter(JournalEntry.date <= end)
    
    entries = query.order_by(JournalEntry.date.desc()).limit(limit).all()
    
    return jsonify([{
        'id': e.id,
        'date': e.date.isoformat(),
        'content': e.content,
        'photo_url': e.photo_url,
        'mood': e.mood,
        'energy_level': e.energy_level,
        'ai_insight': e.ai_insight,
        'created_at': e.created_at.isoformat()
    } for e in entries])

@journal_bp.route('/entries', methods=['POST'])
@jwt_required()
def create_entry():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data.get('content'):
        return jsonify({'error': 'Content is required'}), 400
    
    # Check if entry exists for this date
    entry_date = datetime.fromisoformat(data['date']).date() if data.get('date') else date.today()
    existing = JournalEntry.query.filter_by(user_id=user_id, date=entry_date).first()
    
    if existing:
        # Update existing
        existing.content = data['content']
        existing.photo_url = data.get('photo_url', existing.photo_url)
        existing.mood = data.get('mood', existing.mood)
        existing.energy_level = data.get('energy_level', existing.energy_level)
        existing.ai_insight = data.get('ai_insight', existing.ai_insight)
        db.session.commit()
        return jsonify({
            'id': existing.id,
            'message': 'Journal entry updated successfully'
        })
    
    entry = JournalEntry(
        user_id=user_id,
        date=entry_date,
        content=data['content'],
        photo_url=data.get('photo_url'),
        mood=data.get('mood'),
        energy_level=data.get('energy_level'),
        ai_insight=data.get('ai_insight')
    )
    
    db.session.add(entry)
    db.session.commit()
    
    return jsonify({
        'id': entry.id,
        'message': 'Journal entry created successfully'
    }), 201

@journal_bp.route('/entries/<int:entry_id>', methods=['PUT'])
@jwt_required()
def update_entry(entry_id):
    user_id = get_jwt_identity()
    entry = JournalEntry.query.filter_by(id=entry_id, user_id=user_id).first_or_404()
    
    data = request.get_json()
    
    entry.content = data.get('content', entry.content)
    entry.photo_url = data.get('photo_url', entry.photo_url)
    entry.mood = data.get('mood', entry.mood)
    entry.energy_level = data.get('energy_level', entry.energy_level)
    entry.ai_insight = data.get('ai_insight', entry.ai_insight)
    
    db.session.commit()
    
    return jsonify({'message': 'Journal entry updated successfully'})

@journal_bp.route('/entries/<int:entry_id>', methods=['DELETE'])
@jwt_required()
def delete_entry(entry_id):
    user_id = get_jwt_identity()
    entry = JournalEntry.query.filter_by(id=entry_id, user_id=user_id).first_or_404()
    
    db.session.delete(entry)
    db.session.commit()
    
    return jsonify({'message': 'Journal entry deleted successfully'})

@journal_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_journal_stats():
    user_id = get_jwt_identity()
    
    total_entries = JournalEntry.query.filter_by(user_id=user_id).count()
    
    # Get mood stats
    moods = JournalEntry.query.with_entities(
        JournalEntry.mood
    ).filter_by(user_id=user_id).all()
    
    avg_mood = sum(m[0] for m in moods if m[0]) / len(moods) if moods else 0
    
    # Get streak
    streak = calculate_journal_streak(user_id)
    
    return jsonify({
        'total_entries': total_entries,
        'average_mood': round(avg_mood, 1),
        'streak_days': streak,
        'entries_this_month': JournalEntry.query.filter_by(user_id=user_id).filter(
            JournalEntry.date >= date.today().replace(day=1)
        ).count()
    })

def calculate_journal_streak(user_id):
    today = date.today()
    streak = 0
    current_date = today
    
    while True:
        entry = JournalEntry.query.filter_by(
            user_id=user_id,
            date=current_date
        ).first()
        
        if entry:
            streak += 1
            current_date = current_date.replace(day=current_date.day - 1)
        else:
            break
    
    return streak