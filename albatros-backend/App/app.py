import os
from datetime import date, timedelta
from functools import wraps
from dotenv import load_dotenv
from flask import Flask, request, jsonify, render_template, redirect, url_for, flash
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from flask_mail import Mail, Message
import tempfile

from db import db
from models import *
from helpers import *
from quiz_service import *
from data.courses_data import courses

load_dotenv()

basedir = os.path.abspath(os.path.dirname(__file__))
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-key-change-me')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'users.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = 'no-reply@albatros.com'

mail = Mail(app)

db.init_app(app)
CORS(app, origins=["http://localhost:5173"], supports_credentials=True)
jwt = JWTManager(app)

login_manager = LoginManager(app)
login_manager.login_view = 'login'
login_manager.login_message = "Veuillez vous connecter."

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

def role_required(*allowed_roles):
    def decorator(f):
        @wraps(f)
        @login_required
        def decorated_function(*args, **kwargs):
            if current_user.role not in allowed_roles:
                flash('Accès non autorisé.', 'danger')
                return redirect(url_for('student_dashboard'))
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def jwt_role_required(*allowed_roles):
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def decorated_function(*args, **kwargs):
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            if not user or user.role not in allowed_roles:
                return jsonify({'msg': 'Accès non autorisé'}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

@app.route('/')
def index():
    return redirect(url_for('login'))

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        massar = request.form['massar']
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']

        if User.query.filter((User.massar == massar) | (User.username == username) | (User.email == email)).first():
            flash('Massar, nom ou email déjà utilisé.', 'danger')
            return redirect(url_for('register'))

        if PendingUser.query.filter((PendingUser.massar == massar) | (PendingUser.username == username) | (PendingUser.email == email)).first():
            flash('Une demande d’inscription est déjà en attente.', 'danger')
            return redirect(url_for('register'))

        pending = PendingUser(massar=massar, username=username, email=email, role='student')
        pending.set_password(password)
        db.session.add(pending)
        db.session.commit()
        flash('Inscription en attente de validation. Vous recevrez un email une fois approuvé.', 'success')
        return redirect(url_for('login'))
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        massar = request.form['massar']
        password = request.form['password']
        user = User.query.filter_by(massar=massar).first()
        if user and user.check_password(password):
            update_streak_and_rewards(user)
            login_user(user)
            flash(f'Bienvenue {user.username}', 'success')
            if user.role == 'admin':
                return redirect(url_for('admin_dashboard'))
            elif user.role == 'teacher':
                return redirect(url_for('teacher_dashboard'))
            else:
                return redirect(url_for('student_dashboard'))
        else:
            flash('Massar ou mot de passe incorrect.', 'danger')
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Déconnecté.', 'info')
    return redirect(url_for('login'))

@app.route('/api/auth/register', methods=['POST'])
def api_register():
    data = request.get_json()
    massar = data.get('massar')
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    if not all([massar, username, email, password]):
        return jsonify({'msg': 'Champs manquants'}), 400

    if User.query.filter((User.massar == massar) | (User.username == username) | (User.email == email)).first():
        return jsonify({'msg': 'Massar, nom ou email déjà utilisé'}), 400

    if PendingUser.query.filter((PendingUser.massar == massar) | (PendingUser.username == username) | (PendingUser.email == email)).first():
        return jsonify({'msg': 'Une demande d’inscription est déjà en attente'}), 400

    pending = PendingUser(massar=massar, username=username, email=email, role='student')
    pending.set_password(password)
    db.session.add(pending)
    db.session.commit()
    return jsonify({'msg': 'Inscription en attente de validation. Vous recevrez un email une fois approuvé.'}), 201

@app.route('/api/auth/login', methods=['POST'])
def api_login():
    data = request.get_json()
    massar = data.get('massar')
    password = data.get('password')
    user = User.query.filter_by(massar=massar).first()
    if not user or not user.check_password(password):
        return jsonify({'msg': 'Identifiants incorrects'}), 401
    update_streak_and_rewards(user)
    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        'access_token': access_token,
        'user': user.to_dict()
    }), 200

@app.route('/api/user/me', methods=['GET'])
@jwt_required()
def api_user_me():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    return jsonify(user.to_dict()), 200


@app.route('/api/courses', methods=['GET'])
def api_get_courses():
    return jsonify(courses), 200

@app.route('/api/courses/<int:course_id>', methods=['GET'])
def api_get_course(course_id):
    course = next((c for c in courses if c["id"] == course_id), None)

    if course is None:
        return jsonify({'msg': 'Course not found'}), 404

    return jsonify(course), 200

@app.route('/api/student/gaps', methods=['GET'])
@jwt_required()
def api_student_gaps():
    user_id = get_jwt_identity()
    return jsonify(get_gaps(user_id)), 200

@app.route('/api/student/exercises', methods=['GET'])
@jwt_required()
def api_student_exercises():
    user_id = get_jwt_identity()
    exercises = generate_personalized_exercises(user_id)
    return jsonify(exercises), 200

@app.route('/api/student/calendar', methods=['GET'])
@jwt_required()
def api_student_calendar():
    user_id = get_jwt_identity()
    today = date.today()
    start_date = today - timedelta(days=60)
    activities = UserActivity.query.filter(
        UserActivity.user_id == user_id,
        UserActivity.activity_date >= start_date
    ).all()
    activity_map = {act.activity_date: act for act in activities}
    calendar_data = []
    for i in range(35):
        d = today - timedelta(days=34 - i)
        act = activity_map.get(d)
        calendar_data.append({
            'date': d.isoformat(),
            'active': act is not None,
            'xp': act.xp_earned if act else 0,
            'used_freeze': act.used_flame_freeze if act else False
        })
    return jsonify(calendar_data), 200

@app.route('/api/student/courses', methods=['GET'])
@jwt_required()
def get_student_courses():
    user_id = get_jwt_identity()
    courses = Course.query.all()
    result = []
    for course in courses:
        quizzes = Quiz.query.filter_by(subject_id=course.subject_id).all()
        quiz_ids = [q.id for q in quizzes]
        if quiz_ids:
            quiz_results = QuizResult.query.filter(
                QuizResult.user_id == user_id,
                QuizResult.quiz_id.in_(quiz_ids)
            ).all()
            user_score = round(sum(r.score for r in quiz_results) / len(quiz_results)) if quiz_results else 0
        else:
            user_score = 0
        result.append({
            "id": course.id,
            "title": course.title,
            "description": course.description,
            "user_score": user_score
        })
    return jsonify(result), 200

@app.route('/api/student/results', methods=['GET'])
@jwt_required()
def api_student_results():
    user_id = get_jwt_identity()
    results = QuizResult.query.filter_by(user_id=user_id).order_by(QuizResult.date_taken.desc()).all()
    return jsonify([{
        "quiz_id": r.quiz_id,
        "score": r.score,
        "date": r.date_taken.isoformat()
    } for r in results]), 200

@app.route('/api/student/recommendations', methods=['GET'])
@jwt_required()
def api_student_recommendations():
    user_id = get_jwt_identity()
    exercises = generate_personalized_exercises(user_id, limit=4)
    recommendations = []
    for ex in exercises:
        recommendations.append({
            "id": ex["id"],
            "title": f"Exercise {ex['id']}",
            "type": "Exercises",
            "subject": ex["difficulty"].capitalize() if ex["difficulty"] else "General",
            "description": ex["question"][:100],
        })
    return jsonify(recommendations), 200

@app.route('/api/student/quests', methods=['GET'])
@jwt_required()
def api_student_quests():
    user_id = get_jwt_identity()
    create_weekly_quests_for_user(user_id)
    quests = get_weekly_quests(user_id)
    return jsonify(quests), 200

@app.route('/api/student/claim_quest/<int:progress_id>', methods=['POST'])
@jwt_required()
def api_claim_quest(progress_id):
    user_id = get_jwt_identity()
    prog = UserQuestProgress.query.get_or_404(progress_id)
    if prog.user_id != user_id or not prog.completed or prog.claimed:
        return jsonify({'msg': 'Action non autorisée'}), 400
    user = User.query.get(user_id)
    user.gems += prog.quest.reward_gems
    user.total_xp += prog.quest.reward_xp
    prog.claimed = True
    db.session.commit()
    return jsonify({'msg': 'Récompense obtenue', 'gems': user.gems, 'xp': user.total_xp}), 200

@app.route('/api/quizzes', methods=['GET'])
@jwt_required()
def get_quizzes():
    quizzes = Quiz.query.all()
    return jsonify([{"id": q.id, "title": q.title, "difficulty": q.difficulty} for q in quizzes]), 200

@app.route('/api/quiz/<int:quiz_id>/questions', methods=['GET'])
@jwt_required()
def get_quiz_questions(quiz_id):
    questions = Question.query.filter_by(quiz_id=quiz_id).all()
    return jsonify([{
        "id": q.id,
        "text": q.text,
        "option1": q.option1,
        "option2": q.option2,
        "option3": q.option3,
        "option4": q.option4,
    } for q in questions]), 200

@app.route('/api/quiz/<int:quiz_id>/submit', methods=['POST'])
@jwt_required()
def api_submit_quiz(quiz_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    answers = data.get('answers', {})
    result = evaluate_quiz(user_id, quiz_id, answers)
    return jsonify(result), 200

@app.route('/api/admin/users', methods=['GET'])
@jwt_role_required('admin')
def admin_users():
    users = User.query.all()
    return jsonify([{
        'id': u.id,
        'massar': u.massar,
        'username': u.username,
        'email': u.email,
        'role': u.role
    } for u in users]), 200

@app.route('/api/admin/stats/users', methods=['GET'])
@jwt_role_required('admin')
def admin_stats_users():
    return jsonify({
        'total': User.query.count(),
        'students': User.query.filter_by(role='student').count(),
        'teachers': User.query.filter_by(role='teacher').count(),
        'admins': User.query.filter_by(role='admin').count()
    }), 200

@app.route('/api/admin/stats/subjects', methods=['GET'])
@jwt_role_required('admin')
def admin_stats_subjects():
    return jsonify({'count': Subject.query.count()}), 200

@app.route('/api/admin/stats/content', methods=['GET'])
@jwt_role_required('admin')
def admin_stats_content():
    courses = Course.query.count()
    exercises = Exercise.query.count()
    quizzes = Quiz.query.count()
    return jsonify({
        'total': courses + exercises + quizzes,
        'courses': courses,
        'exercises': exercises,
        'quizzes': quizzes
    }), 200

@app.route('/api/admin/pending_users', methods=['GET'])
@jwt_role_required('admin')
def admin_pending_users():
    pendings = PendingUser.query.filter_by(status='pending').all()
    return jsonify([{
        'id': p.id,
        'massar': p.massar,
        'username': p.username,
        'email': p.email,
        'role': p.role,
        'created_at': p.created_at.isoformat()
    } for p in pendings]), 200

@app.route('/api/admin/approve_user/<int:pending_id>', methods=['POST'])
@jwt_role_required('admin')
def admin_approve_user(pending_id):
    pending = PendingUser.query.get_or_404(pending_id)
    if pending.status != 'pending':
        return jsonify({'msg': 'Utilisateur déjà traité'}), 400

    new_user = User(
        massar=pending.massar,
        username=pending.username,
        email=pending.email,
        role=pending.role
    )
    new_user.password_hash = pending.password_hash
    db.session.add(new_user)
    db.session.flush()

    pending.status = 'approved'
    pending.user_id = new_user.id
    db.session.commit()

    try:
        msg = Message("Votre compte Albatros a été approuvé", recipients=[pending.email])
        msg.body = f"Bonjour {pending.username},\n\nVotre inscription a été validée par l'administrateur. Vous pouvez maintenant vous connecter avec votre Massar ({pending.massar}) et le mot de passe que vous avez choisi.\n\nCordialement,\nL'équipe Albatros"
        mail.send(msg)
    except Exception as e:
        print(f"Erreur d'envoi d'email: {e}")

    return jsonify({'msg': 'Utilisateur approuvé et email envoyé'}), 200

@app.route('/api/admin/reject_user/<int:pending_id>', methods=['POST'])
@jwt_role_required('admin')
def admin_reject_user(pending_id):
    pending = PendingUser.query.get_or_404(pending_id)
    if pending.status != 'pending':
        return jsonify({'msg': 'Utilisateur déjà traité'}), 400

    pending.status = 'rejected'
    db.session.commit()

    try:
        msg = Message("Votre inscription sur Albatros n'a pas été retenue", recipients=[pending.email])
        msg.body = f"Bonjour {pending.username},\n\nDésolé, votre inscription n'a pas été validée par l'administrateur. Contactez-nous pour plus d'informations.\n\nCordialement,\nL'équipe Albatros"
        mail.send(msg)
    except Exception as e:
        print(f"Erreur d'envoi d'email: {e}")

    return jsonify({'msg': 'Inscription rejetée et email envoyé'}), 200

@app.route('/api/teacher/stats', methods=['GET'])
@jwt_role_required('teacher', 'admin')
def teacher_stats():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    courses_count = Course.query.filter_by(teacher_id=user_id).count()
    exercises_count = Exercise.query.join(Course).filter(Course.teacher_id == user_id).count()
    students_count = User.query.filter_by(role='student').count()
    return jsonify({
        'courses': courses_count,
        'exercises': exercises_count,
        'students': students_count
    }), 200

@app.route('/api/teacher/courses', methods=['GET'])
@jwt_role_required('teacher', 'admin')
def get_teacher_courses():
    user_id = get_jwt_identity()
    courses = Course.query.filter_by(teacher_id=user_id).all()
    return jsonify([{
        "id": c.id,
        "title": c.title,
        "description": c.description,
        "subject_id": c.subject_id,
        "difficulty": c.difficulty
    } for c in courses]), 200

@app.route('/api/teacher/courses/<int:course_id>', methods=['DELETE'])
@jwt_role_required('teacher', 'admin')
def delete_course(course_id):
    user_id = get_jwt_identity()
    course = Course.query.get_or_404(course_id)
    if course.teacher_id != user_id:
        return jsonify({'msg': 'Unauthorized'}), 403
    db.session.delete(course)
    db.session.commit()
    return jsonify({'msg': 'Course deleted'}), 200

@app.route('/api/teacher/exercises', methods=['GET'])
@jwt_role_required('teacher', 'admin')
def get_teacher_exercises():
    user_id = get_jwt_identity()
    exercises = Exercise.query.join(Course).filter(Course.teacher_id == user_id).all()
    return jsonify([{
        "id": e.id,
        "course_id": e.course_id,
        "question_text": e.question_text,
        "difficulty": e.difficulty,
        "tags": e.tags
    } for e in exercises]), 200

@app.route('/api/teacher/exercises', methods=['POST'])
@jwt_role_required('teacher', 'admin')
def create_exercise():
    user_id = get_jwt_identity()
    data = request.get_json()
    course = Course.query.get(data.get('course_id'))
    if not course or course.teacher_id != user_id:
        return jsonify({'msg': 'Unauthorized'}), 403
    exercise = Exercise(
        course_id=data['course_id'],
        question_text=data['question_text'],
        correct_answer=data['correct_answer'],
        explanation=data.get('explanation', ''),
        difficulty=data.get('difficulty', 'easy'),
        tags=data.get('tags', '')
    )
    db.session.add(exercise)
    db.session.commit()
    return jsonify({'msg': 'Exercise created', 'id': exercise.id}), 201

@app.route('/api/teacher/progress', methods=['GET'])
@jwt_role_required('teacher', 'admin')
def teacher_progress():
    data = [
        {"day": "Mon", "score": 55},
        {"day": "Tue", "score": 62},
        {"day": "Wed", "score": 70},
        {"day": "Thu", "score": 68},
        {"day": "Fri", "score": 78},
        {"day": "Sat", "score": 84},
    ]
    return jsonify(data), 200

@app.route('/api/teacher/students', methods=['GET'])
@jwt_role_required('teacher', 'admin')
def teacher_students():
    students = User.query.filter_by(role='student').all()
    result = []
    for student in students:
        results = QuizResult.query.filter_by(user_id=student.id).all()
        progress = round(sum(r.score for r in results) / len(results)) if results else 0
        result.append({
            'id': student.id,
            'username': student.username,
            'email': student.email,
            'progress': progress
        })
    return jsonify(result), 200


@app.route('/api/friends/add', methods=['POST'])
@jwt_required()
def api_add_friend():
    user_id = get_jwt_identity()
    data = request.get_json()
    friend_massar = data.get('massar')
    friend = User.query.filter_by(massar=friend_massar).first()
    if not friend or friend.id == user_id:
        return jsonify({'msg': 'Utilisateur non trouvé'}), 404
    existing = Friend.query.filter(
        ((Friend.user_id == user_id) & (Friend.friend_id == friend.id)) |
        ((Friend.user_id == friend.id) & (Friend.friend_id == user_id))
    ).first()
    if existing:
        return jsonify({'msg': 'Demande déjà envoyée ou déjà ami'}), 400
    friendship = Friend(user_id=user_id, friend_id=friend.id, status='pending')
    db.session.add(friendship)
    db.session.commit()
    return jsonify({'msg': 'Demande envoyée'}), 201

@app.route('/api/friends/accept/<int:friendship_id>', methods=['POST'])
@jwt_required()
def api_accept_friend(friendship_id):
    user_id = get_jwt_identity()
    friendship = Friend.query.get_or_404(friendship_id)
    if friendship.friend_id != user_id or friendship.status != 'pending':
        return jsonify({'msg': 'Action non autorisée'}), 400
    friendship.status = 'accepted'
    db.session.commit()
    return jsonify({'msg': 'Ami ajouté'}), 200

@app.route('/api/leaderboard', methods=['GET'])
@jwt_required()
def api_leaderboard():
    user_id = get_jwt_identity()
    friends = Friend.query.filter(
        ((Friend.user_id == user_id) | (Friend.friend_id == user_id)),
        Friend.status == 'accepted'
    ).all()
    friend_ids = {user_id}
    for f in friends:
        friend_ids.add(f.user_id if f.friend_id == user_id else f.friend_id)
    users = User.query.filter(User.id.in_(friend_ids)).order_by(User.total_xp.desc()).all()
    return jsonify([u.to_dict() for u in users]), 200

@app.route('/student/dashboard')
@login_required
def student_dashboard():
    return render_template('student_dashboard.html', user=current_user)

@app.route('/teacher/dashboard')
@role_required('teacher', 'admin')
def teacher_dashboard():
    return render_template('teacher_dashboard.html', user=current_user)

@app.route('/admin/dashboard')
@role_required('admin')
def admin_dashboard():
    return render_template('admin_dashboard.html', user=current_user)

@app.route('/admin/add_teacher', methods=['GET', 'POST'])
@role_required('admin')
def add_teacher():
    if request.method == 'POST':
        massar = request.form['massar']
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        if User.query.filter((User.massar == massar) | (User.username == username) | (User.email == email)).first():
            flash('Massar, nom ou email déjà utilisé.', 'danger')
            return redirect(url_for('add_teacher'))
        user = User(massar=massar, username=username, email=email, role='teacher')
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        flash('Enseignant créé.', 'success')
        return redirect(url_for('admin_dashboard'))
    return render_template('add_teacher.html')

@app.route('/admin/create_admin', methods=['GET', 'POST'])
@role_required('admin')
def create_admin():
    admin_count = User.query.filter_by(role='admin').count()
    if admin_count >= 2:
        flash('Limite de 2 administrateurs atteinte.', 'danger')
        return redirect(url_for('admin_dashboard'))
    if request.method == 'POST':
        massar = request.form['massar']
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        if User.query.filter((User.massar == massar) | (User.username == username) | (User.email == email)).first():
            flash('Massar, nom ou email déjà utilisé.', 'danger')
            return redirect(url_for('create_admin'))
        user = User(massar=massar, username=username, email=email, role='admin')
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        flash('Administrateur créé.', 'success')
        return redirect(url_for('admin_dashboard'))
    return render_template('create_admin.html')

@app.route('/buy_flame_freeze')
@login_required
def buy_flame_freeze():
    if current_user.gems >= 20:
        current_user.gems -= 20
        item = InventoryItem.query.filter_by(user_id=current_user.id, item_type='flame_freeze').first()
        if not item:
            item = InventoryItem(user_id=current_user.id, item_type='flame_freeze', quantity=0)
            db.session.add(item)
        item.quantity += 1
        db.session.commit()
        flash('Gel acheté !')
    else:
        flash('Pas assez de gems.')
    return redirect(url_for('student_dashboard'))

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        init_default_quests()
        if User.query.filter_by(role='admin').count() == 0:
            admin = User(massar=999999, username='admin', email='admin@example.com', role='admin')
            admin.set_password('admin123')
            db.session.add(admin)
            db.session.commit()
            print("Admin créé: massar=999999, password=admin123")
    app.run(debug=True)