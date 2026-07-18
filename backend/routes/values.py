from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Value
from datetime import datetime

values_bp = Blueprint('values', __name__)

@values_bp.route('/', methods=['GET'])
@jwt_required()
def get_values():
    user_id = get_jwt_identity()
    
    values = Value.query.filter_by(user_id=user_id).all()
    
    return jsonify([{
        'id': v.id,
        'name': v.name,
        'description': v.description,
        'color': v.color,
        'created_at': v.created_at.isoformat()
    } for v in values])

@values_bp.route('/', methods=['POST'])
@jwt_required()
def create_value():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    value = Value(
        user_id=user_id,
        name=data['name'],
        description=data.get('description'),
        color=data.get('color', '#4A90D9')
    )
    
    db.session.add(value)
    db.session.commit()
    
    return jsonify({
        'id': value.id,
        'message': 'Value created successfully'
    }), 201

@values_bp.route('/<int:value_id>', methods=['PUT'])
@jwt_required()
def update_value(value_id):
    user_id = get_jwt_identity()
    value = Value.query.filter_by(id=value_id, user_id=user_id).first_or_404()
    
    data = request.get_json()
    
    value.name = data.get('name', value.name)
    value.description = data.get('description', value.description)
    value.color = data.get('color', value.color)
    
    db.session.commit()
    
    return jsonify({'message': 'Value updated successfully'})

@values_bp.route('/<int:value_id>', methods=['DELETE'])
@jwt_required()
def delete_value(value_id):
    user_id = get_jwt_identity()
    value = Value.query.filter_by(id=value_id, user_id=user_id).first_or_404()
    
    db.session.delete(value)
    db.session.commit()
    
    return jsonify({'message': 'Value deleted successfully'})