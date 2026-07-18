# backend/routes/tasks.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Task
from datetime import datetime
import json
import traceback

tasks_bp = Blueprint('tasks', __name__)

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

@tasks_bp.route('/', methods=['GET'])
@jwt_required()
def get_tasks():
    try:
        user_id = get_int_user_id()
        if user_id is None:
            return jsonify({'error': 'Invalid user ID'}), 400
        
        print(f"✅ get_tasks - user_id: {user_id}")
        
        category = request.args.get('category')
        status = request.args.get('status')
        goal_id = request.args.get('goal_id')
        
        query = Task.query.filter_by(user_id=user_id)
        
        if category:
            query = query.filter_by(category=category)
        if status:
            query = query.filter_by(status=status)
        if goal_id:
            query = query.filter_by(goal_id=goal_id)
        
        tasks = query.order_by(Task.priority.desc(), Task.deadline.asc()).all()
        
        return jsonify([t.to_dict() for t in tasks])
    except Exception as e:
        print(f"❌ Error in get_tasks: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@tasks_bp.route('/', methods=['POST'])
@jwt_required()
def create_task():
    try:
        user_id = get_int_user_id()
        if user_id is None:
            return jsonify({'error': 'Invalid user ID'}), 400
        
        print(f"✅ create_task - user_id: {user_id}")
        
        data = request.get_json()
        print(f"Data received: {data}")
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        if not data.get('title'):
            return jsonify({'error': 'Title is required'}), 400
        
        # Parse deadline
        deadline = None
        if data.get('deadline') and data.get('deadline') != 'Ongoing':
            try:
                deadline = datetime.fromisoformat(data['deadline'])
            except:
                pass
        
        # Parse subtasks
        subtasks = data.get('subtasks')
        if subtasks and isinstance(subtasks, (list, str)):
            if isinstance(subtasks, list):
                subtasks = json.dumps(subtasks)
        
        # Parse reminder
        reminder = None
        if data.get('reminder'):
            try:
                reminder = datetime.fromisoformat(data['reminder']).date()
            except:
                pass
        
        task = Task(
            user_id=user_id,
            title=data['title'],
            description=data.get('description', ''),
            priority=data.get('priority', 1),
            difficulty=data.get('difficulty', 1),
            estimated_time=data.get('estimated_time'),
            deadline=deadline,
            category=data.get('category', 'General'),
            reward=data.get('reward'),
            goal_id=data.get('goal_id'),
            progress=data.get('progress', 0),
            subtasks=subtasks,
            status=data.get('status', 'pending'),
            reminder=reminder
        )
        
        db.session.add(task)
        db.session.commit()
        
        print(f"✅ Task created: ID={task.id}, Title={task.title}")
        
        return jsonify({
            'id': task.id,
            'message': 'Task created successfully'
        }), 201
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error creating task: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@tasks_bp.route('/<int:task_id>', methods=['GET'])
@jwt_required()
def get_task(task_id):
    try:
        user_id = get_int_user_id()
        if user_id is None:
            return jsonify({'error': 'Invalid user ID'}), 400
        
        task = Task.query.filter_by(id=task_id, user_id=user_id).first()
        if not task:
            return jsonify({'error': 'Task not found'}), 404
        
        return jsonify(task.to_dict())
    except Exception as e:
        print(f"❌ Error in get_task: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@tasks_bp.route('/<int:task_id>', methods=['PUT'])
@jwt_required()
def update_task(task_id):
    try:
        user_id = get_int_user_id()
        if user_id is None:
            return jsonify({'error': 'Invalid user ID'}), 400
        
        task = Task.query.filter_by(id=task_id, user_id=user_id).first()
        if not task:
            return jsonify({'error': 'Task not found'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        print(f"Update data: {data}")
        
        if 'status' in data:
            task.status = data['status']
            if data['status'] == 'completed':
                task.completed_at = datetime.now()
            elif data['status'] == 'pending':
                task.completed_at = None
        
        if 'title' in data:
            task.title = data['title']
        if 'description' in data:
            task.description = data['description']
        if 'priority' in data:
            task.priority = data['priority']
        if 'difficulty' in data:
            task.difficulty = data['difficulty']
        if 'estimated_time' in data:
            task.estimated_time = data['estimated_time']
        if 'reward' in data:
            task.reward = data['reward']
        if 'category' in data:
            task.category = data['category']
        if 'progress' in data:
            task.progress = data['progress']
        if 'reminder' in data and data['reminder']:
            try:
                task.reminder = datetime.fromisoformat(data['reminder']).date()
            except:
                pass
        elif 'reminder' in data and data['reminder'] is None:
            task.reminder = None
        
        if 'subtasks' in data:
            if isinstance(data['subtasks'], list):
                task.subtasks = json.dumps(data['subtasks'])
            else:
                task.subtasks = data['subtasks']
        
        if data.get('deadline') and data.get('deadline') != 'Ongoing':
            try:
                task.deadline = datetime.fromisoformat(data['deadline'])
            except:
                pass
        elif data.get('deadline') == 'Ongoing':
            task.deadline = None
        
        db.session.commit()
        
        print(f"✅ Task updated: ID={task.id}")
        
        return jsonify({'message': 'Task updated successfully'})
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error updating task: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@tasks_bp.route('/<int:task_id>', methods=['DELETE'])
@jwt_required()
def delete_task(task_id):
    try:
        user_id = get_int_user_id()
        if user_id is None:
            return jsonify({'error': 'Invalid user ID'}), 400
        
        task = Task.query.filter_by(id=task_id, user_id=user_id).first()
        if not task:
            return jsonify({'error': 'Task not found'}), 404
        
        db.session.delete(task)
        db.session.commit()
        
        print(f"✅ Task deleted: ID={task_id}")
        
        return jsonify({'message': 'Task deleted successfully'})
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error deleting task: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@tasks_bp.route('/batch-status', methods=['POST'])
@jwt_required()
def batch_update_status():
    try:
        user_id = get_int_user_id()
        if user_id is None:
            return jsonify({'error': 'Invalid user ID'}), 400
        
        data = request.get_json()
        task_ids = data.get('task_ids', [])
        new_status = data.get('status')
        
        if not task_ids or not new_status:
            return jsonify({'error': 'Task IDs and status are required'}), 400
        
        tasks = Task.query.filter(Task.id.in_(task_ids), Task.user_id == user_id).all()
        
        for task in tasks:
            task.status = new_status
            if new_status == 'completed':
                task.completed_at = datetime.now()
            elif new_status == 'pending':
                task.completed_at = None
        
        db.session.commit()
        
        return jsonify({
            'message': f'{len(tasks)} tasks updated',
            'updated_count': len(tasks)
        })
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error in batch_update_status: {e}")
        return jsonify({'error': str(e)}), 500

@tasks_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_task_stats():
    try:
        user_id = get_int_user_id()
        if user_id is None:
            return jsonify({'error': 'Invalid user ID'}), 400
        
        total = Task.query.filter_by(user_id=user_id).count()
        pending = Task.query.filter_by(user_id=user_id, status='pending').count()
        in_progress = Task.query.filter_by(user_id=user_id, status='in_progress').count()
        completed = Task.query.filter_by(user_id=user_id, status='completed').count()
        
        return jsonify({
            'total': total,
            'pending': pending,
            'in_progress': in_progress,
            'completed': completed,
            'completion_rate': round((completed / total * 100), 1) if total > 0 else 0
        })
    except Exception as e:
        print(f"❌ Error in get_task_stats: {e}")
        return jsonify({'error': str(e)}), 500