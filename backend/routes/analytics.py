# backend/routes/analytics.py
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Task, Goal, JournalEntry, Achievement
from datetime import datetime, timedelta
from sqlalchemy import func, extract

analytics_bp = Blueprint('analytics', __name__)

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

@analytics_bp.route('/productivity', methods=['GET'])
@jwt_required()
def get_productivity():
    try:
        user_id = get_int_user_id()
        if user_id is None:
            return jsonify({'error': 'Invalid user ID'}), 400
        
        period = request.args.get('period', 'weekly')  # daily, weekly, monthly
        
        # Calculate date range
        end_date = datetime.now().date()
        if period == 'daily':
            start_date = end_date - timedelta(days=1)
        elif period == 'weekly':
            start_date = end_date - timedelta(days=7)
        elif period == 'monthly':
            start_date = end_date - timedelta(days=30)
        else:
            start_date = end_date - timedelta(days=7)
        
        # Tasks completed in period
        completed_tasks = Task.query.filter(
            Task.user_id == user_id,
            Task.status == 'completed',
            Task.completed_at >= start_date,
            Task.completed_at <= end_date
        ).count()
        
        total_tasks = Task.query.filter_by(user_id=user_id).count()
        completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        
        # Daily completion data
        daily_data = []
        current = start_date
        while current <= end_date:
            day_tasks = Task.query.filter(
                Task.user_id == user_id,
                func.date(Task.completed_at) == current,
                Task.status == 'completed'
            ).count()
            daily_data.append({
                'date': current.isoformat(),
                'completed': day_tasks
            })
            current += timedelta(days=1)
        
        return jsonify({
            'period': period,
            'completion_rate': round(completion_rate, 1),
            'completed_tasks': completed_tasks,
            'total_tasks': total_tasks,
            'daily_data': daily_data
        })
    except Exception as e:
        print(f"Error in get_productivity: {e}")
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/coding', methods=['GET'])
@jwt_required()
def get_coding_stats():
    try:
        user_id = get_int_user_id()
        if user_id is None:
            return jsonify({'error': 'Invalid user ID'}), 400
        
        # Get coding-related tasks and goals
        coding_tasks = Task.query.filter_by(user_id=user_id, category='Coding').count()
        coding_goals = Goal.query.filter_by(user_id=user_id, category='Coding').count()
        coding_achievements = Achievement.query.filter_by(user_id=user_id).filter(
            Achievement.title.ilike('%code%') | 
            Achievement.title.ilike('%program%') |
            Achievement.title.ilike('%develop%')
        ).count()
        
        return jsonify({
            'coding_tasks': coding_tasks,
            'coding_goals': coding_goals,
            'coding_achievements': coding_achievements,
            'total_coding_activities': coding_tasks + coding_goals + coding_achievements
        })
    except Exception as e:
        print(f"Error in get_coding_stats: {e}")
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/reading', methods=['GET'])
@jwt_required()
def get_reading_stats():
    try:
        user_id = get_int_user_id()
        if user_id is None:
            return jsonify({'error': 'Invalid user ID'}), 400
        
        # Get reading-related entries
        reading_tasks = Task.query.filter_by(user_id=user_id, category='Reading').count()
        reading_goals = Goal.query.filter_by(user_id=user_id, category='Reading').count()
        
        # Calculate reading streak from journal entries with reading mentions
        journal_entries = JournalEntry.query.filter_by(user_id=user_id).all()
        reading_mentions = sum(1 for entry in journal_entries if entry.content and 'read' in entry.content.lower())
        
        return jsonify({
            'reading_tasks': reading_tasks,
            'reading_goals': reading_goals,
            'reading_mentions': reading_mentions,
            'total_reading_activities': reading_tasks + reading_goals + reading_mentions
        })
    except Exception as e:
        print(f"Error in get_reading_stats: {e}")
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/fitness', methods=['GET'])
@jwt_required()
def get_fitness_stats():
    try:
        user_id = get_int_user_id()
        if user_id is None:
            return jsonify({'error': 'Invalid user ID'}), 400
        
        # Get fitness-related entries
        fitness_tasks = Task.query.filter_by(user_id=user_id, category='Fitness').count()
        fitness_goals = Goal.query.filter_by(user_id=user_id, category='Fitness').count()
        
        # Calculate exercise streak from journal entries
        journal_entries = JournalEntry.query.filter_by(user_id=user_id).all()
        exercise_mentions = sum(1 for entry in journal_entries if entry.content and ('exercise' in entry.content.lower() or 'workout' in entry.content.lower()))
        
        return jsonify({
            'fitness_tasks': fitness_tasks,
            'fitness_goals': fitness_goals,
            'exercise_mentions': exercise_mentions,
            'total_fitness_activities': fitness_tasks + fitness_goals + exercise_mentions
        })
    except Exception as e:
        print(f"Error in get_fitness_stats: {e}")
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/overview', methods=['GET'])
@jwt_required()
def get_overview():
    try:
        user_id = get_int_user_id()
        if user_id is None:
            return jsonify({'error': 'Invalid user ID'}), 400
        
        # Get all stats in one call
        total_tasks = Task.query.filter_by(user_id=user_id).count()
        completed_tasks = Task.query.filter_by(user_id=user_id, status='completed').count()
        total_goals = Goal.query.filter_by(user_id=user_id).count()
        completed_goals = Goal.query.filter_by(user_id=user_id, status='completed').count()
        total_achievements = Achievement.query.filter_by(user_id=user_id).count()
        total_journal_entries = JournalEntry.query.filter_by(user_id=user_id).count()
        
        # Get today's stats
        today = datetime.now().date()
        today_tasks = Task.query.filter(
            Task.user_id == user_id,
            func.date(Task.created_at) == today
        ).count()
        today_completed = Task.query.filter(
            Task.user_id == user_id,
            func.date(Task.completed_at) == today,
            Task.status == 'completed'
        ).count()
        
        return jsonify({
            'totals': {
                'tasks': total_tasks,
                'completed_tasks': completed_tasks,
                'goals': total_goals,
                'completed_goals': completed_goals,
                'achievements': total_achievements,
                'journal_entries': total_journal_entries
            },
            'today': {
                'tasks_created': today_tasks,
                'tasks_completed': today_completed,
                'completion_rate': round((today_completed / today_tasks * 100), 1) if today_tasks > 0 else 0
            },
            'task_completion_rate': round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0,
            'goal_completion_rate': round((completed_goals / total_goals * 100), 1) if total_goals > 0 else 0
        })
    except Exception as e:
        print(f"Error in get_overview: {e}")
        return jsonify({'error': str(e)}), 500