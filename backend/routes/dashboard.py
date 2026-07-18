from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Task, Goal, JournalEntry, Achievement
from datetime import datetime, timedelta

# Create blueprint with correct name
dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/summary', methods=['GET'])
@jwt_required()
def dashboard_summary():
    user_id = get_jwt_identity()
    today = datetime.now().date()
    
    # Tasks
    total_tasks = Task.query.filter_by(user_id=user_id).count()
    completed_tasks = Task.query.filter_by(user_id=user_id, status='completed').count()
    completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
    
    # Today's focus
    today_tasks = Task.query.filter_by(user_id=user_id).filter(
        Task.deadline == today,
        Task.status != 'completed'
    ).limit(5).all()
    
    # Streak
    streak = calculate_streak(user_id)
    
    # Goals progress
    total_goals = Goal.query.filter_by(user_id=user_id).count()
    completed_goals = Goal.query.filter_by(user_id=user_id, status='completed').count()
    goals_progress = (completed_goals / total_goals * 100) if total_goals > 0 else 0
    
    # Recent achievements
    recent_achievements = Achievement.query.filter_by(user_id=user_id).order_by(
        Achievement.date_earned.desc()
    ).limit(3).all()
    
    return jsonify({
        'greeting': get_greeting(),
        'date': today.isoformat(),
        'statistics': {
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'completion_rate': round(completion_rate, 1),
            'streak': streak,
            'goals_progress': round(goals_progress, 1)
        },
        'today_focus': [{
            'id': task.id,
            'title': task.title,
            'priority': task.priority,
            'status': task.status
        } for task in today_tasks],
        'recent_achievements': [{
            'id': ach.id,
            'title': ach.title,
            'date': ach.date_earned.isoformat() if ach.date_earned else None
        } for ach in recent_achievements]
    })

def get_greeting():
    hour = datetime.now().hour
    if hour < 12:
        return 'Good Morning'
    elif hour < 17:
        return 'Good Afternoon'
    else:
        return 'Good Evening'

def calculate_streak(user_id):
    today = datetime.now().date()
    streak = 0
    current_date = today
    
    while True:
        entry = JournalEntry.query.filter_by(
            user_id=user_id,
            date=current_date
        ).first()
        
        if entry:
            streak += 1
            current_date -= timedelta(days=1)
        else:
            break
    
    return streak