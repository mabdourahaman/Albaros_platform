# models.py
from datetime import datetime
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from db import db
from sqlalchemy.orm import relationship

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    massar = db.Column(db.Integer, unique=True, nullable=False)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='student')
    flame = db.Column(db.Integer, default=0)
    last_active_date = db.Column(db.Date, nullable=True)
    gems = db.Column(db.Integer, default=0)
    total_xp = db.Column(db.Integer, default=0)
    
    # Relations
    inventory = relationship('InventoryItem', backref='user', lazy='dynamic')
    activities = relationship('UserActivity', backref='user', lazy='dynamic')
    quest_progress = relationship('UserQuestProgress', backref='user', lazy='dynamic')
    sent_friend_requests = relationship('Friend', foreign_keys='Friend.user_id', backref='from_user', lazy='dynamic')
    received_friend_requests = relationship('Friend', foreign_keys='Friend.friend_id', backref='to_user', lazy='dynamic')
    quiz_results = relationship('QuizResult', backref='user', lazy='dynamic')
    gaps = relationship('Gap', backref='user', lazy='dynamic')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'massar': self.massar,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'flame': self.flame,
            'gems': self.gems,
            'total_xp': self.total_xp
        }

class InventoryItem(db.Model):
    __tablename__ = 'inventory_items'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    item_type = db.Column(db.String(50))
    quantity = db.Column(db.Integer, default=0)

class UserActivity(db.Model):
    __tablename__ = 'user_activities'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    activity_date = db.Column(db.Date, nullable=False)
    xp_earned = db.Column(db.Integer, default=0)
    used_flame_freeze = db.Column(db.Boolean, default=False)

class Quest(db.Model):
    __tablename__ = 'quests'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(200))
    objective_type = db.Column(db.String(50))
    objective_target = db.Column(db.Integer)
    reward_gems = db.Column(db.Integer, default=0)
    reward_xp = db.Column(db.Integer, default=0)
    is_weekly = db.Column(db.Boolean, default=True)

    # Relation inverse (optionnelle)
    user_progresses = relationship('UserQuestProgress', back_populates='quest', lazy='dynamic')

class UserQuestProgress(db.Model):
    __tablename__ = 'user_quest_progress'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    quest_id = db.Column(db.Integer, db.ForeignKey('quests.id'))
    progress = db.Column(db.Integer, default=0)
    completed = db.Column(db.Boolean, default=False)
    claimed = db.Column(db.Boolean, default=False)
    week_start_date = db.Column(db.Date)

    # Relation cruciale pour accéder à l'objet Quest
    quest = relationship('Quest', back_populates='user_progresses')

class Friend(db.Model):
    __tablename__ = 'friends'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    friend_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    status = db.Column(db.String(20), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# ---------------- Modules pédagogiques ----------------
class Subject(db.Model):
    __tablename__ = 'subjects'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(200))

class Course(db.Model):
    __tablename__ = 'courses'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id'))
    teacher_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    difficulty = db.Column(db.String(20))
    content_url = db.Column(db.String(300))
    subject = relationship('Subject', backref='courses')
    tags = db.Column(db.String(200))

class Exercise(db.Model):
    __tablename__ = 'exercises'
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'))
    question_text = db.Column(db.Text, nullable=False)
    correct_answer = db.Column(db.String(200), nullable=False)
    explanation = db.Column(db.Text)
    difficulty = db.Column(db.String(20))
    tags = db.Column(db.String(200))

class Quiz(db.Model):
    __tablename__ = 'quizzes'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200))
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id'))
    difficulty = db.Column(db.String(20))
    teacher_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)   # ← AJOUT


class Question(db.Model):
    __tablename__ = 'questions'
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quizzes.id'))
    text = db.Column(db.Text, nullable=False)
    option1 = db.Column(db.String(200))
    option2 = db.Column(db.String(200))
    option3 = db.Column(db.String(200))
    option4 = db.Column(db.String(200))
    correct_option = db.Column(db.Integer)
    concept = db.Column(db.String(100))

class QuizResult(db.Model):
    __tablename__ = 'quiz_results'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    quiz_id = db.Column(db.Integer, db.ForeignKey('quizzes.id'))
    score = db.Column(db.Float)
    answers_json = db.Column(db.Text)
    gaps_json = db.Column(db.Text)
    date_taken = db.Column(db.DateTime, default=datetime.utcnow)

class Gap(db.Model):
    __tablename__ = 'gaps'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    concept = db.Column(db.String(100))
    mastery_level = db.Column(db.Float, default=0.0)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)