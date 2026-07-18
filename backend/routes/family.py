# backend/routes/family.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import db, FamilyMember, FamilyMemory
from datetime import datetime, date
import json
import traceback
import logging

family_bp = Blueprint('family', __name__)
logger = logging.getLogger(__name__)

# ============================================
# MEMBER ROUTES
# ============================================

@family_bp.route('/members', methods=['GET'])
@jwt_required()
def get_family_members():
    """Get all family members for the current user"""
    try:
        logger.info("="*60)
        logger.info("GET /api/family/members")
        logger.info("="*60)
        
        # Get user_id from JWT
        user_id = get_jwt_identity()
        logger.info(f"user_id from JWT: {user_id} (type: {type(user_id)})")
        
        # Handle different types
        if user_id is None:
            # Try to get from JWT data
            jwt_data = get_jwt()
            user_id = jwt_data.get('sub')
            logger.info(f"Extracted from JWT data: {user_id}")
        
        # Convert to int
        if isinstance(user_id, str):
            try:
                user_id = int(user_id)
            except ValueError:
                return jsonify({'error': 'Invalid user ID format'}), 400
        
        if not isinstance(user_id, int):
            try:
                user_id = int(user_id)
            except:
                return jsonify({'error': 'Invalid user ID'}), 400
        
        logger.info(f"✅ Final user_id: {user_id}")
        
        # Query members
        members = FamilyMember.query.filter_by(user_id=user_id).all()
        result = [m.to_dict() for m in members]
        
        logger.info(f"Found {len(result)} members")
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"❌ Error: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@family_bp.route('/members', methods=['POST'])
@jwt_required()
def create_family_member():
    """Create a new family member"""
    try:
        logger.info("="*60)
        logger.info("POST /api/family/members")
        logger.info("="*60)
        
        # Get user_id from JWT
        user_id = get_jwt_identity()
        logger.info(f"user_id from JWT: {user_id} (type: {type(user_id)})")
        
        # Handle different types
        if user_id is None:
            jwt_data = get_jwt()
            user_id = jwt_data.get('sub')
            logger.info(f"Extracted from JWT data: {user_id}")
        
        # Convert to int
        if isinstance(user_id, str):
            try:
                user_id = int(user_id)
            except ValueError:
                return jsonify({'error': 'Invalid user ID format'}), 400
        
        if not isinstance(user_id, int):
            try:
                user_id = int(user_id)
            except:
                return jsonify({'error': 'Invalid user ID'}), 400
        
        logger.info(f"✅ Final user_id: {user_id}")
        
        # Get request data
        data = request.get_json()
        logger.info(f"Data received: {data}")
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        if not data.get('name'):
            return jsonify({'error': 'Name is required'}), 400
        
        # Parse birthday
        birthday = None
        if data.get('birthday'):
            try:
                birthday = datetime.strptime(data['birthday'], '%Y-%m-%d').date()
                logger.info(f"Parsed birthday: {birthday}")
            except Exception as e:
                logger.warning(f"Error parsing birthday: {e}")
        
        # Calculate age from birthday
        age = None
        if birthday:
            today = date.today()
            age = today.year - birthday.year - ((today.month, today.day) < (birthday.month, birthday.day))
            logger.info(f"Calculated age: {age}")
        elif data.get('age'):
            age = data['age']
        
        # Parse life_lessons
        life_lessons = data.get('life_lessons', [])
        if isinstance(life_lessons, str):
            try:
                life_lessons = json.loads(life_lessons)
            except:
                life_lessons = []
        
        # Create member
        member = FamilyMember(
            user_id=user_id,
            name=data['name'],
            relationship=data.get('relationship', 'Family Member'),
            age=age,
            birthday=birthday,
            favorite_quote=data.get('favorite_quote', 'Family is everything.'),
            story=data.get('story', ''),
            life_lessons=json.dumps(life_lessons),
            promise=data.get('promise', 'I promise to always be there for you.'),
            profile_photo=data.get('profile_photo'),
            cover_photo=data.get('cover_photo'),
            color=data.get('color', '#6C5CE7')
        )
        
        db.session.add(member)
        db.session.commit()
        
        logger.info(f"✅ Member created: ID={member.id}, Name={member.name}")
        
        return jsonify({
            'id': member.id,
            'message': f'Family member {member.name} created successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ ERROR: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@family_bp.route('/members/<int:member_id>', methods=['GET'])
@jwt_required()
def get_family_member(member_id):
    """Get a specific family member by ID"""
    try:
        user_id = get_jwt_identity()
        
        if user_id is None:
            jwt_data = get_jwt()
            user_id = jwt_data.get('sub')
        
        if isinstance(user_id, str):
            try:
                user_id = int(user_id)
            except:
                return jsonify({'error': 'Invalid user ID format'}), 400
        
        if not isinstance(user_id, int):
            try:
                user_id = int(user_id)
            except:
                return jsonify({'error': 'Invalid user ID'}), 400
        
        member = FamilyMember.query.filter_by(id=member_id, user_id=user_id).first()
        if not member:
            return jsonify({'error': 'Member not found'}), 404
        
        return jsonify(member.to_dict()), 200
        
    except Exception as e:
        logger.error(f"❌ Error: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@family_bp.route('/members/<int:member_id>', methods=['PUT'])
@jwt_required()
def update_family_member(member_id):
    """Update a family member"""
    try:
        user_id = get_jwt_identity()
        
        if user_id is None:
            jwt_data = get_jwt()
            user_id = jwt_data.get('sub')
        
        if isinstance(user_id, str):
            try:
                user_id = int(user_id)
            except:
                return jsonify({'error': 'Invalid user ID format'}), 400
        
        if not isinstance(user_id, int):
            try:
                user_id = int(user_id)
            except:
                return jsonify({'error': 'Invalid user ID'}), 400
        
        member = FamilyMember.query.filter_by(id=member_id, user_id=user_id).first()
        if not member:
            return jsonify({'error': 'Member not found'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Update fields
        if 'name' in data:
            member.name = data['name']
        if 'relationship' in data:
            member.relationship = data['relationship']
        if 'birthday' in data and data['birthday']:
            try:
                member.birthday = datetime.strptime(data['birthday'], '%Y-%m-%d').date()
                if member.birthday:
                    today = date.today()
                    member.age = today.year - member.birthday.year - ((today.month, today.day) < (member.birthday.month, member.birthday.day))
            except:
                pass
        if 'age' in data:
            member.age = data['age']
        if 'favorite_quote' in data:
            member.favorite_quote = data['favorite_quote']
        if 'story' in data:
            member.story = data['story']
        if 'life_lessons' in data:
            lessons = data['life_lessons']
            if isinstance(lessons, str):
                try:
                    lessons = json.loads(lessons)
                except:
                    lessons = []
            member.life_lessons = json.dumps(lessons)
        if 'promise' in data:
            member.promise = data['promise']
        if 'profile_photo' in data:
            member.profile_photo = data['profile_photo']
        if 'cover_photo' in data:
            member.cover_photo = data['cover_photo']
        if 'color' in data:
            member.color = data['color']
        
        db.session.commit()
        
        return jsonify({
            'message': f'{member.name} updated successfully',
            'id': member.id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Error: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@family_bp.route('/members/<int:member_id>', methods=['DELETE'])
@jwt_required()
def delete_family_member(member_id):
    """Delete a family member"""
    try:
        user_id = get_jwt_identity()
        
        if user_id is None:
            jwt_data = get_jwt()
            user_id = jwt_data.get('sub')
        
        if isinstance(user_id, str):
            try:
                user_id = int(user_id)
            except:
                return jsonify({'error': 'Invalid user ID format'}), 400
        
        if not isinstance(user_id, int):
            try:
                user_id = int(user_id)
            except:
                return jsonify({'error': 'Invalid user ID'}), 400
        
        member = FamilyMember.query.filter_by(id=member_id, user_id=user_id).first()
        if not member:
            return jsonify({'error': 'Member not found'}), 404
        
        # Delete associated memories
        FamilyMemory.query.filter_by(member_id=member_id).delete()
        
        db.session.delete(member)
        db.session.commit()
        
        return jsonify({'message': f'{member.name} deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Error: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ============================================
# MEMORY ROUTES
# ============================================

@family_bp.route('/members/<int:member_id>/memories', methods=['GET'])
@jwt_required()
def get_member_memories(member_id):
    """Get all memories for a family member"""
    try:
        user_id = get_jwt_identity()
        
        if user_id is None:
            jwt_data = get_jwt()
            user_id = jwt_data.get('sub')
        
        if isinstance(user_id, str):
            try:
                user_id = int(user_id)
            except:
                return jsonify({'error': 'Invalid user ID format'}), 400
        
        if not isinstance(user_id, int):
            try:
                user_id = int(user_id)
            except:
                return jsonify({'error': 'Invalid user ID'}), 400
        
        member = FamilyMember.query.filter_by(id=member_id, user_id=user_id).first()
        if not member:
            return jsonify({'error': 'Member not found'}), 404
        
        memories = FamilyMemory.query.filter_by(member_id=member_id).all()
        return jsonify([memory.to_dict() for memory in memories]), 200
        
    except Exception as e:
        logger.error(f"❌ Error: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@family_bp.route('/members/<int:member_id>/memories', methods=['POST'])
@jwt_required()
def add_member_memory(member_id):
    """Add a memory to a family member"""
    try:
        user_id = get_jwt_identity()
        
        if user_id is None:
            jwt_data = get_jwt()
            user_id = jwt_data.get('sub')
        
        if isinstance(user_id, str):
            try:
                user_id = int(user_id)
            except:
                return jsonify({'error': 'Invalid user ID format'}), 400
        
        if not isinstance(user_id, int):
            try:
                user_id = int(user_id)
            except:
                return jsonify({'error': 'Invalid user ID'}), 400
        
        member = FamilyMember.query.filter_by(id=member_id, user_id=user_id).first()
        if not member:
            return jsonify({'error': 'Member not found'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        memory_date = date.today()
        if data.get('date'):
            try:
                memory_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
            except:
                memory_date = date.today()
        
        memory = FamilyMemory(
            member_id=member_id,
            title=data.get('title', 'Untitled Memory'),
            description=data.get('description', ''),
            media_url=data.get('photo', data.get('media_url')),
            media_type=data.get('media_type', 'image'),
            date=memory_date
        )
        
        db.session.add(memory)
        db.session.commit()
        
        return jsonify({
            'id': memory.id,
            'message': 'Memory added successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Error: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@family_bp.route('/memories/<int:memory_id>', methods=['DELETE'])
@jwt_required()
def delete_memory(memory_id):
    """Delete a memory"""
    try:
        user_id = get_jwt_identity()
        
        if user_id is None:
            jwt_data = get_jwt()
            user_id = jwt_data.get('sub')
        
        if isinstance(user_id, str):
            try:
                user_id = int(user_id)
            except:
                return jsonify({'error': 'Invalid user ID format'}), 400
        
        if not isinstance(user_id, int):
            try:
                user_id = int(user_id)
            except:
                return jsonify({'error': 'Invalid user ID'}), 400
        
        memory = FamilyMemory.query.join(FamilyMember).filter(
            FamilyMemory.id == memory_id,
            FamilyMember.user_id == user_id
        ).first()
        
        if not memory:
            return jsonify({'error': 'Memory not found'}), 404
        
        db.session.delete(memory)
        db.session.commit()
        
        return jsonify({'message': 'Memory deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Error: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ============================================
# GALLERY ROUTES
# ============================================

@family_bp.route('/members/<int:member_id>/gallery', methods=['GET'])
@jwt_required()
def get_member_gallery(member_id):
    """Get all gallery photos for a family member"""
    try:
        user_id = get_jwt_identity()
        
        if user_id is None:
            jwt_data = get_jwt()
            user_id = jwt_data.get('sub')
        
        if isinstance(user_id, str):
            try:
                user_id = int(user_id)
            except:
                return jsonify({'error': 'Invalid user ID format'}), 400
        
        if not isinstance(user_id, int):
            try:
                user_id = int(user_id)
            except:
                return jsonify({'error': 'Invalid user ID'}), 400
        
        member = FamilyMember.query.filter_by(id=member_id, user_id=user_id).first()
        if not member:
            return jsonify({'error': 'Member not found'}), 404
        
        memories = FamilyMemory.query.filter_by(member_id=member_id).filter(
            FamilyMemory.media_url.isnot(None)
        ).all()
        
        return jsonify([memory.to_dict() for memory in memories]), 200
        
    except Exception as e:
        logger.error(f"❌ Error: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@family_bp.route('/members/<int:member_id>/gallery', methods=['POST'])
@jwt_required()
def add_gallery_photo(member_id):
    """Add a photo to the gallery"""
    try:
        user_id = get_jwt_identity()
        
        if user_id is None:
            jwt_data = get_jwt()
            user_id = jwt_data.get('sub')
        
        if isinstance(user_id, str):
            try:
                user_id = int(user_id)
            except:
                return jsonify({'error': 'Invalid user ID format'}), 400
        
        if not isinstance(user_id, int):
            try:
                user_id = int(user_id)
            except:
                return jsonify({'error': 'Invalid user ID'}), 400
        
        member = FamilyMember.query.filter_by(id=member_id, user_id=user_id).first()
        if not member:
            return jsonify({'error': 'Member not found'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        if not data.get('title'):
            return jsonify({'error': 'Title is required'}), 400
        
        if not data.get('photo'):
            return jsonify({'error': 'Photo data is required'}), 400
        
        memory_date = date.today()
        if data.get('date'):
            try:
                memory_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
            except:
                memory_date = date.today()
        
        memory = FamilyMemory(
            member_id=member_id,
            title=data['title'],
            description=data.get('description', ''),
            media_url=data['photo'],
            media_type='image',
            date=memory_date
        )
        
        db.session.add(memory)
        db.session.commit()
        
        return jsonify({
            'id': memory.id,
            'message': 'Photo added to gallery successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Error: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500