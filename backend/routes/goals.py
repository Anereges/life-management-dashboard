# backend/routes/goals.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Goal
from datetime import datetime
import json
import traceback

goals_bp = Blueprint('goals', __name__)

def get_int_user_id():
    """Helper function to safely get user_id as integer from JWT"""
    try:
        user_id = get_jwt_identity()
        print(f"🔍 get_int_user_id - raw: {user_id} (type: {type(user_id)})")
        
        if user_id is None:
            print("❌ user_id is None")
            return None
        
        # If it's already an int, return it
        if isinstance(user_id, int):
            print(f"✅ Already int: {user_id}")
            return user_id
        
        # If it's a string, try to convert to int
        if isinstance(user_id, str):
            try:
                int_id = int(user_id)
                print(f"✅ Converted string to int: {int_id}")
                return int_id
            except ValueError:
                print(f"❌ Cannot convert '{user_id}' to int")
                return None
        
        # If it's a dict, try to extract id
        if isinstance(user_id, dict):
            user_id = user_id.get('id') or user_id.get('sub')
            if user_id:
                try:
                    return int(user_id)
                except:
                    return None
        
        print(f"❌ Unknown user_id type: {type(user_id)}")
        return None
    except Exception as e:
        print(f"❌ Error getting user_id: {e}")
        traceback.print_exc()
        return None


@goals_bp.route('/', methods=['GET'])
@jwt_required()
def get_goals():
    try:
        user_id = get_int_user_id()
        if user_id is None:
            return jsonify({'error': 'Invalid user ID'}), 400
        
        print(f"✅ get_goals - user_id: {user_id}")
        
        category = request.args.get('category')
        status = request.args.get('status')
        is_legacy = request.args.get('is_legacy')
        
        query = Goal.query.filter_by(user_id=user_id)
        
        if category:
            query = query.filter_by(category=category)
        if status:
            query = query.filter_by(status=status)
        if is_legacy is not None:
            query = query.filter_by(is_legacy=is_legacy.lower() == 'true')
        
        goals = query.order_by(Goal.priority.desc(), Goal.deadline.asc()).all()
        
        return jsonify([g.to_dict() for g in goals])
    except Exception as e:
        print(f"❌ Error in get_goals: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@goals_bp.route('/', methods=['POST'])
@jwt_required()
def create_goal():
    try:
        user_id = get_int_user_id()
        if user_id is None:
            return jsonify({'error': 'Invalid user ID'}), 400
        
        print(f"✅ create_goal - user_id: {user_id}")
        
        data = request.get_json()
        print(f"Data received: {data}")
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        if not data.get('title'):
            return jsonify({'error': 'Title is required'}), 400
        
        # Parse deadline if provided
        deadline = None
        if data.get('deadline'):
            try:
                deadline = datetime.fromisoformat(data['deadline'])
            except:
                pass
        
        # Parse milestones if provided
        milestones = data.get('milestones')
        if milestones and isinstance(milestones, (list, str)):
            if isinstance(milestones, list):
                milestones = json.dumps(milestones)
        
        goal = Goal(
            user_id=user_id,
            title=data['title'],
            description=data.get('description', ''),
            category=data.get('category', 'General'),
            priority=data.get('priority', 1),
            deadline=deadline,
            is_legacy=data.get('is_legacy', False),
            parent_goal_id=data.get('parent_goal_id'),
            progress=data.get('progress', 0),
            milestones=milestones
        )
        
        db.session.add(goal)
        db.session.commit()
        
        print(f"✅ Goal created: ID={goal.id}, Title={goal.title}")
        
        return jsonify({
            'id': goal.id,
            'message': 'Goal created successfully'
        }), 201
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error creating goal: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@goals_bp.route('/<int:goal_id>', methods=['GET'])
@jwt_required()
def get_goal(goal_id):
    try:
        user_id = get_int_user_id()
        if user_id is None:
            return jsonify({'error': 'Invalid user ID'}), 400
        
        print(f"✅ get_goal - user_id: {user_id}, goal_id: {goal_id}")
        
        goal = Goal.query.filter_by(id=goal_id, user_id=user_id).first()
        if not goal:
            return jsonify({'error': 'Goal not found'}), 404
        
        return jsonify(goal.to_dict())
    except Exception as e:
        print(f"❌ Error in get_goal: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@goals_bp.route('/<int:goal_id>', methods=['PUT'])
@jwt_required()
def update_goal(goal_id):
    try:
        user_id = get_int_user_id()
        if user_id is None:
            return jsonify({'error': 'Invalid user ID'}), 400
        
        print(f"✅ update_goal - user_id: {user_id}, goal_id: {goal_id}")
        
        goal = Goal.query.filter_by(id=goal_id, user_id=user_id).first()
        if not goal:
            return jsonify({'error': 'Goal not found'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        print(f"Update data: {data}")
        
        if 'status' in data:
            goal.status = data['status']
            if data['status'] == 'completed':
                goal.completed_at = datetime.now()
            elif data['status'] == 'pending':
                goal.completed_at = None
        
        if 'title' in data:
            goal.title = data['title']
        if 'description' in data:
            goal.description = data['description']
        if 'priority' in data:
            goal.priority = data['priority']
        if 'category' in data:
            goal.category = data['category']
        if 'progress' in data:
            goal.progress = data['progress']
        
        if 'milestones' in data:
            if isinstance(data['milestones'], list):
                goal.milestones = json.dumps(data['milestones'])
            else:
                goal.milestones = data['milestones']
        
        if data.get('deadline'):
            try:
                goal.deadline = datetime.fromisoformat(data['deadline'])
            except:
                pass
        
        db.session.commit()
        
        print(f"✅ Goal updated: ID={goal.id}")
        
        return jsonify({
            'message': 'Goal updated successfully',
            'id': goal.id
        })
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error updating goal: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@goals_bp.route('/<int:goal_id>', methods=['DELETE'])
@jwt_required()
def delete_goal(goal_id):
    try:
        user_id = get_int_user_id()
        if user_id is None:
            return jsonify({'error': 'Invalid user ID'}), 400
        
        print(f"✅ delete_goal - user_id: {user_id}, goal_id: {goal_id}")
        
        goal = Goal.query.filter_by(id=goal_id, user_id=user_id).first()
        if not goal:
            return jsonify({'error': 'Goal not found'}), 404
        
        # Delete child goals first
        Goal.query.filter_by(parent_goal_id=goal_id).delete()
        
        db.session.delete(goal)
        db.session.commit()
        
        print(f"✅ Goal deleted: ID={goal_id}")
        
        return jsonify({'message': 'Goal deleted successfully'})
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error deleting goal: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@goals_bp.route('/dream-tree', methods=['GET'])
@jwt_required()
def get_dream_tree():
    try:
        user_id = get_int_user_id()
        if user_id is None:
            return jsonify({'error': 'Invalid user ID'}), 400
        
        print(f"✅ get_dream_tree - user_id: {user_id}")
        
        # Get all legacy goals
        goals = Goal.query.filter_by(user_id=user_id, is_legacy=True).all()
        
        # Build tree structure
        tree = build_goal_tree(goals)
        
        return jsonify(tree)
    except Exception as e:
        print(f"❌ Error in get_dream_tree: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


def build_goal_tree(goals):
    # Create dictionary of goals by id
    goal_dict = {}
    for g in goals:
        goal_dict[g.id] = {
            'id': g.id,
            'title': g.title,
            'status': g.status,
            'description': g.description,
            'progress': g.progress if hasattr(g, 'progress') else 0,
            'children': []
        }
    
    # Build tree
    root = []
    for g in goals:
        if g.parent_goal_id and g.parent_goal_id in goal_dict:
            goal_dict[g.parent_goal_id]['children'].append(goal_dict[g.id])
        elif not g.parent_goal_id:
            root.append(goal_dict[g.id])
    
    return root


@goals_bp.route('/categories', methods=['GET'])
@jwt_required()
def get_categories():
    try:
        user_id = get_int_user_id()
        if user_id is None:
            return jsonify({'error': 'Invalid user ID'}), 400
        
        print(f"✅ get_categories - user_id: {user_id}")
        
        categories = db.session.query(Goal.category).filter_by(user_id=user_id).distinct().all()
        
        return jsonify([cat[0] for cat in categories if cat[0]])
    except Exception as e:
        print(f"❌ Error in get_categories: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500