# backend/models.py
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from flask_login import UserMixin
import json

db = SQLAlchemy()

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    full_name = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    goals = db.relationship('Goal', backref='user', lazy=True)
    tasks = db.relationship('Task', backref='user', lazy=True)
    family_members = db.relationship('FamilyMember', backref='user', lazy=True)
    journal_entries = db.relationship('JournalEntry', backref='user', lazy=True)
    achievements = db.relationship('Achievement', backref='user', lazy=True)
    values = db.relationship('Value', backref='user', lazy=True)
    timeline_events = db.relationship('TimelineEvent', backref='user', lazy=True)
    reflections = db.relationship('DailyReflection', backref='user', lazy=True)
    inspiration_images = db.relationship('InspirationImage', backref='user', lazy=True)
    knowledge_entries = db.relationship('KnowledgeEntry', backref='user', lazy=True)

class Goal(db.Model):
    __tablename__ = 'goals'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(50))
    status = db.Column(db.String(20), default='pending')
    priority = db.Column(db.Integer, default=1)
    deadline = db.Column(db.DateTime)
    parent_goal_id = db.Column(db.Integer, db.ForeignKey('goals.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    is_legacy = db.Column(db.Boolean, default=False)
    progress = db.Column(db.Integer, default=0)
    milestones = db.Column(db.Text)
    children = db.relationship('Goal', backref=db.backref('parent', remote_side=[id]))
    
    def to_dict(self):
        milestones_data = []
        if self.milestones:
            try:
                milestones_data = json.loads(self.milestones)
            except:
                milestones_data = []
        
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'category': self.category,
            'status': self.status,
            'priority': self.priority,
            'deadline': self.deadline.isoformat() if self.deadline else None,
            'parent_goal_id': self.parent_goal_id,
            'created_at': self.created_at.isoformat(),
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'is_legacy': self.is_legacy,
            'progress': self.progress or 0,
            'milestones': milestones_data
        }

class Task(db.Model):
    __tablename__ = 'tasks'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    priority = db.Column(db.Integer, default=1)
    difficulty = db.Column(db.Integer, default=1)
    estimated_time = db.Column(db.Integer)
    deadline = db.Column(db.DateTime)
    category = db.Column(db.String(50))
    reward = db.Column(db.String(200))
    status = db.Column(db.String(20), default='pending')
    goal_id = db.Column(db.Integer, db.ForeignKey('goals.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    progress = db.Column(db.Integer, default=0)
    subtasks = db.Column(db.Text)
    reminder = db.Column(db.Date)
    
    def to_dict(self):
        subtasks_data = []
        if self.subtasks:
            try:
                subtasks_data = json.loads(self.subtasks)
            except:
                subtasks_data = []
        
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'priority': self.priority,
            'difficulty': self.difficulty,
            'estimated_time': self.estimated_time,
            'deadline': self.deadline.isoformat() if self.deadline else None,
            'category': self.category,
            'reward': self.reward,
            'status': self.status,
            'goal_id': self.goal_id,
            'created_at': self.created_at.isoformat(),
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'progress': self.progress or 0,
            'subtasks': subtasks_data,
            'reminder': self.reminder.isoformat() if self.reminder else None
        }

class FamilyMember(db.Model):
    __tablename__ = 'family_members'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    relationship = db.Column(db.String(50))
    age = db.Column(db.Integer)
    birthday = db.Column(db.Date)
    favorite_quote = db.Column(db.Text)
    story = db.Column(db.Text)
    life_lessons = db.Column(db.Text)
    promise = db.Column(db.Text)
    profile_photo = db.Column(db.Text)
    cover_photo = db.Column(db.Text)
    color = db.Column(db.String(20), default='#6C5CE7')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    memories = db.relationship('FamilyMemory', backref='member', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        life_lessons = []
        if self.life_lessons:
            try:
                life_lessons = json.loads(self.life_lessons)
            except:
                life_lessons = []
        
        return {
            'id': self.id,
            'name': self.name,
            'relationship': self.relationship,
            'age': self.age,
            'birthday': self.birthday.isoformat() if self.birthday else None,
            'favorite_quote': self.favorite_quote,
            'story': self.story,
            'life_lessons': life_lessons,
            'promise': self.promise,
            'profile_photo': self.profile_photo,
            'cover_photo': self.cover_photo,
            'color': self.color,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'memories': [memory.to_dict() for memory in self.memories] if self.memories else []
        }

class FamilyMemory(db.Model):
    __tablename__ = 'family_memories'
    
    id = db.Column(db.Integer, primary_key=True)
    member_id = db.Column(db.Integer, db.ForeignKey('family_members.id'), nullable=False)
    title = db.Column(db.String(200))
    description = db.Column(db.Text)
    media_url = db.Column(db.Text)
    media_type = db.Column(db.String(20), default='image')
    date = db.Column(db.Date)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'media_url': self.media_url,
            'media_type': self.media_type,
            'date': self.date.isoformat() if self.date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class JournalEntry(db.Model):
    __tablename__ = 'journal_entries'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    content = db.Column(db.Text, nullable=False)
    photo_url = db.Column(db.Text)
    mood = db.Column(db.Integer)
    energy_level = db.Column(db.Integer)
    tags = db.Column(db.Text)
    is_favorite = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    ai_insight = db.Column(db.Text)
    
    def to_dict(self):
        tags_data = []
        if self.tags:
            try:
                tags_data = json.loads(self.tags)
            except:
                tags_data = []
        
        return {
            'id': self.id,
            'date': self.date.isoformat() if self.date else None,
            'content': self.content,
            'photo_url': self.photo_url,
            'mood': self.mood,
            'energy_level': self.energy_level,
            'tags': tags_data,
            'is_favorite': self.is_favorite,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'ai_insight': self.ai_insight
        }

class Achievement(db.Model):
    __tablename__ = 'achievements'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    date_earned = db.Column(db.Date)
    importance = db.Column(db.Integer, default=1)
    media_url = db.Column(db.Text)
    media_type = db.Column(db.String(20))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_hall_of_fame = db.Column(db.Boolean, default=False)
    category = db.Column(db.String(50))
    points = db.Column(db.Integer, default=10)
    badge = db.Column(db.String(20), default='bronze')
    is_favorite = db.Column(db.Boolean, default=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'date_earned': self.date_earned.isoformat() if self.date_earned else None,
            'importance': self.importance,
            'media_url': self.media_url,
            'media_type': self.media_type,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'is_hall_of_fame': self.is_hall_of_fame,
            'category': self.category,
            'points': self.points,
            'badge': self.badge,
            'is_favorite': self.is_favorite
        }

class Value(db.Model):
    __tablename__ = 'values'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    color = db.Column(db.String(7), default='#4A90D9')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'color': self.color,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class TimelineEvent(db.Model):
    __tablename__ = 'timeline_events'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    date = db.Column(db.Date, nullable=False)
    event_type = db.Column(db.String(50))
    media_url = db.Column(db.Text)
    media_type = db.Column(db.String(20))
    location = db.Column(db.String(200))
    is_highlight = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'date': self.date.isoformat() if self.date else None,
            'event_type': self.event_type,
            'media_url': self.media_url,
            'media_type': self.media_type,
            'location': self.location,
            'is_highlight': self.is_highlight,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class DailyReflection(db.Model):
    __tablename__ = 'daily_reflections'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    what_went_well = db.Column(db.Text)
    what_could_be_better = db.Column(db.Text)
    gratitude = db.Column(db.Text)
    lesson_learned = db.Column(db.Text)
    ai_feedback = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date.isoformat() if self.date else None,
            'what_went_well': self.what_went_well,
            'what_could_be_better': self.what_could_be_better,
            'gratitude': self.gratitude,
            'lesson_learned': self.lesson_learned,
            'ai_feedback': self.ai_feedback,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class InspirationImage(db.Model):
    __tablename__ = 'inspiration_images'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200))
    image_url = db.Column(db.Text)  # No NOT NULL constraint
    category = db.Column(db.String(50))
    description = db.Column(db.Text)
    color = db.Column(db.String(20), default='#6C5CE7')
    icon = db.Column(db.String(50), default='fa-star')
    is_favorite = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'image_url': self.image_url,
            'category': self.category,
            'description': self.description,
            'color': self.color,
            'icon': self.icon,
            'is_favorite': self.is_favorite,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class KnowledgeEntry(db.Model):
    __tablename__ = 'knowledge'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    type = db.Column(db.String(50))
    notes = db.Column(db.Text)
    rating = db.Column(db.Integer)
    completed_date = db.Column(db.Date)
    certificate_url = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'type': self.type,
            'notes': self.notes,
            'rating': self.rating,
            'completed_date': self.completed_date.isoformat() if self.completed_date else None,
            'certificate_url': self.certificate_url,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }