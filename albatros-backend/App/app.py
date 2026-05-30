# app.py
import os
from datetime import date, timedelta
from functools import wraps
from dotenv import load_dotenv
from flask import Flask, request, jsonify, render_template, redirect, url_for, flash
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from db import db
import tempfile

load_dotenv()

basedir = os.path.abspath(os.path.dirname(__file__))
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-key-change-me')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'users.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialisation des extensions
db.init_app(app)
CORS(app, origins=["http://localhost:5173"], supports_credentials=True)
jwt = JWTManager(app)

# Flask-Login
login_manager = LoginManager(app)
login_manager.login_view = 'login'
login_manager.login_message = "Veuillez vous connecter."

# Importer les modèles après initialisation de db
from models import *
from helpers import *
from quiz_service import *
from content_manager import *

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# --------------------- Décorateur de rôle ---------------------
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

# --------------------- Routes HTML (optionnelles) ---------------------
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
        user = User(massar=massar, username=username, email=email, role='student')
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        flash('Inscription réussie !', 'success')
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

@app.route('/')
def index():
    return redirect(url_for('login'))

# --------------------- Routes API ---------------------
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
    user = User(massar=massar, username=username, email=email, role='student')
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return jsonify({'msg': 'Inscription réussie'}), 201

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

@app.route('/api/student/gaps', methods=['GET'])
@jwt_required()
def api_student_gaps():
    user_id = get_jwt_identity()
    gaps = get_gaps(user_id)
    return jsonify(gaps), 200

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

@app.route('/api/quizzes', methods=['GET'])
@jwt_required()
def get_quizzes():
    quizzes = Quiz.query.all()
    return jsonify([{"id": q.id, "title": q.title, "difficulty": q.difficulty} for q in quizzes])

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
    } for q in questions])

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
    return jsonify(recommendations)

@app.route('/api/student/results', methods=['GET'])
@jwt_required()
def api_student_results():
    user_id = get_jwt_identity()
    results = QuizResult.query.filter_by(user_id=user_id).order_by(QuizResult.date_taken.desc()).all()
    return jsonify([{
        "quiz_id": r.quiz_id,
        "score": r.score,
        "date": r.date_taken.isoformat()
    } for r in results])

@app.route('/api/student/courses', methods=['GET'])
@jwt_required()
def get_student_courses():
    user_id = get_jwt_identity()
    courses = Course.query.all()
    result = []
    for course in courses:
        # Calcul du score personnel : moyenne des scores des quizzes dont le subject_id correspond au cours
        quizzes = Quiz.query.filter_by(subject_id=course.subject_id).all()
        quiz_ids = [q.id for q in quizzes]
        if quiz_ids:
            results = QuizResult.query.filter(QuizResult.user_id == user_id, QuizResult.quiz_id.in_(quiz_ids)).all()
            user_score = round(sum(r.score for r in results) / len(results)) if results else 0
        else:
            user_score = 0
        result.append({
            "id": course.id,
            "title": course.title,
            "description": course.description,
            "user_score": user_score
        })
    return jsonify(result)

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

@app.route('/api/quiz/<int:quiz_id>/submit', methods=['POST'])
@jwt_required()
def api_submit_quiz(quiz_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    answers = data.get('answers', {})
    result = evaluate_quiz(user_id, quiz_id, answers)
    return jsonify(result), 200

# --------------------- Routes enseignant ---------------------
@app.route('/api/teacher/stats', methods=['GET'])
@jwt_required()
def teacher_stats():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if user.role not in ['teacher', 'admin']:
        return jsonify({'msg': 'Unauthorized'}), 403
    courses_count = Course.query.filter_by(teacher_id=user_id).count()
    exercises_count = Exercise.query.join(Course).filter(Course.teacher_id == user_id).count()
    students_count = User.query.filter_by(role='student').count()
    return jsonify({
        'courses': courses_count,
        'exercises': exercises_count,
        'students': students_count
    })

@app.route('/api/teacher/courses', methods=['GET'])
@jwt_required()
def get_teacher_courses():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if user.role not in ['teacher', 'admin']:
        return jsonify({'msg': 'Unauthorized'}), 403
    courses = Course.query.filter_by(teacher_id=user_id).all()
    return jsonify([{
        "id": c.id,
        "title": c.title,
        "description": c.description,
        "subject_id": c.subject_id,
        "difficulty": c.difficulty
    } for c in courses])

@app.route('/api/teacher/courses/<int:course_id>', methods=['DELETE'])
@jwt_required()
def delete_course(course_id):
    user_id = get_jwt_identity()
    course = Course.query.get_or_404(course_id)
    if course.teacher_id != user_id:
        return jsonify({'msg': 'Unauthorized'}), 403
    db.session.delete(course)
    db.session.commit()
    return jsonify({'msg': 'Course deleted'}), 200

@app.route('/api/teacher/exercises', methods=['GET'])
@jwt_required()
def get_teacher_exercises():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if user.role not in ['teacher', 'admin']:
        return jsonify({'msg': 'Unauthorized'}), 403
    exercises = Exercise.query.join(Course).filter(Course.teacher_id == user_id).all()
    return jsonify([{
        "id": e.id,
        "course_id": e.course_id,
        "question_text": e.question_text,
        "difficulty": e.difficulty,
        "tags": e.tags
    } for e in exercises])

@app.route('/api/teacher/exercises', methods=['POST'])
@jwt_required()
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
@jwt_required()
def teacher_progress():
    # Exemple statique – à remplacer par une vraie logique de progression
    data = [
        {"day": "Mon", "score": 55},
        {"day": "Tue", "score": 62},
        {"day": "Wed", "score": 70},
        {"day": "Thu", "score": 68},
        {"day": "Fri", "score": 78},
        {"day": "Sat", "score": 84},
    ]
    return jsonify(data)

@app.route('/api/teacher/students', methods=['GET'])
@jwt_required()
def teacher_students():
    user_id = get_jwt_identity()
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
    return jsonify(result)

@app.route('/api/teacher/upload_course', methods=['POST'])
@jwt_required()
def api_teacher_upload_course():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if user.role not in ['teacher', 'admin']:
        return jsonify({'msg': 'Accès réservé aux professeurs'}), 403

    if 'file' not in request.files:
        return jsonify({'msg': 'Aucun fichier'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'msg': 'Nom de fichier vide'}), 400

    subject_id = request.form.get('subject_id', type=int, default=1)
    difficulty = request.form.get('difficulty', 'medium')
    quiz_title = request.form.get('title', f"Quiz généré depuis {file.filename}")

    with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as tmp:
        file.save(tmp.name)
        tmp_path = tmp.name

    try:
        quiz_id = charger_document_et_creer_quiz(
            chemin_fichier=tmp_path,
            titre_quiz=quiz_title,
            subject_id=subject_id,
            difficulte=difficulty,
            teacher_id=user.id
        )
        os.unlink(tmp_path)
        return jsonify({'quiz_id': quiz_id, 'message': 'Quiz créé avec succès'}), 201
    except Exception as e:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
        return jsonify({'msg': str(e)}), 500

# --------------------- Routes Amis / Leaderboard ---------------------
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

# --------------------- Routes dashboards HTML ---------------------
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

# --------------------- Lancement ---------------------
if __name__ == '__main__':
    app.run(debug=True)