from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, KnowledgeEntry
from datetime import datetime, date

knowledge_bp = Blueprint('knowledge', __name__)

@knowledge_bp.route('/', methods=['GET'])
@jwt_required()
def get_knowledge():
    user_id = get_jwt_identity()
    type_filter = request.args.get('type')
    
    query = KnowledgeEntry.query.filter_by(user_id=user_id)
    
    if type_filter:
        query = query.filter_by(type=type_filter)
    
    entries = query.order_by(KnowledgeEntry.completed_date.desc()).all()
    
    return jsonify([{
        'id': k.id,
        'title': k.title,
        'type': k.type,
        'notes': k.notes,
        'rating': k.rating,
        'completed_date': k.completed_date.isoformat() if k.completed_date else None,
        'certificate_url': k.certificate_url,
        'created_at': k.created_at.isoformat()
    } for k in entries])

@knowledge_bp.route('/', methods=['POST'])
@jwt_required()
def create_knowledge():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    entry = KnowledgeEntry(
        user_id=user_id,
        title=data['title'],
        type=data.get('type'),
        notes=data.get('notes'),
        rating=data.get('rating'),
        completed_date=datetime.fromisoformat(data['completed_date']).date() if data.get('completed_date') else date.today(),
        certificate_url=data.get('certificate_url')
    )
    
    db.session.add(entry)
    db.session.commit()
    
    return jsonify({
        'id': entry.id,
        'message': 'Knowledge entry created successfully'
    }), 201

@knowledge_bp.route('/<int:entry_id>', methods=['PUT'])
@jwt_required()
def update_knowledge(entry_id):
    user_id = get_jwt_identity()
    entry = KnowledgeEntry.query.filter_by(id=entry_id, user_id=user_id).first_or_404()
    
    data = request.get_json()
    
    entry.title = data.get('title', entry.title)
    entry.type = data.get('type', entry.type)
    entry.notes = data.get('notes', entry.notes)
    entry.rating = data.get('rating', entry.rating)
    entry.certificate_url = data.get('certificate_url', entry.certificate_url)
    
    if data.get('completed_date'):
        entry.completed_date = datetime.fromisoformat(data['completed_date']).date()
    
    db.session.commit()
    
    return jsonify({'message': 'Knowledge entry updated successfully'})

@knowledge_bp.route('/<int:entry_id>', methods=['DELETE'])
@jwt_required()
def delete_knowledge(entry_id):
    user_id = get_jwt_identity()
    entry = KnowledgeEntry.query.filter_by(id=entry_id, user_id=user_id).first_or_404()
    
    db.session.delete(entry)
    db.session.commit()
    
    return jsonify({'message': 'Knowledge entry deleted successfully'})