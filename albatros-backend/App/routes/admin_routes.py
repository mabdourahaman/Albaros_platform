import os
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_mail import Message
from db import db
from models import User, PendingUser, Subject, Course, Exercise, Quiz, InventoryItem, Question
from decorators import jwt_role_required

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')


# ========== GESTION DES UTILISATEURS ==========
@admin_bp.route('/users', methods=['GET'])
@jwt_role_required('admin')
def admin_users():
    users = User.query.all()
    return jsonify([{
        'id': u.id,
        'massar': u.massar,
        'username': u.username,
        'email': u.email,
        'role': u.role,
        'level': u.level,
        'subject': u.subject,
        'email_verified': u.email_verified,
        'two_factor_enabled': u.two_factor_enabled,
    } for u in users]), 200

@admin_bp.route('/create_user', methods=['POST'])
@jwt_role_required('admin')
def admin_create_user():
    data = request.get_json()
    massar = data.get('massar')
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'student')

    if not all([massar, username, email, password]):
        return jsonify({'msg': 'Missing fields: massar, username, email, password'}), 400

    # Vérifier les doublons
    if User.query.filter((User.massar == massar) | (User.username == username) | (User.email == email)).first():
        return jsonify({'msg': 'Massar, username or email already used'}), 400

    # Création de l'utilisateur
    user = User(massar=massar, username=username, email=email, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.flush()

    # Offrir un objet 'flame_freeze' par défaut
    freeze_item = InventoryItem(user_id=user.id, item_type='flame_freeze', quantity=1)
    db.session.add(freeze_item)
    db.session.commit()

    return jsonify({'msg': f'{role.capitalize()} created successfully'}), 201


@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@jwt_role_required('admin')
def admin_update_user(user_id):
    data = request.get_json()
    user = User.query.get_or_404(user_id)

    if 'massar' in data:
        existing = User.query.filter(User.massar == data['massar'], User.id != user_id).first()
        if existing:
            return jsonify({'msg': 'Massar already used'}), 400
        user.massar = data['massar']

    if 'username' in data:
        existing = User.query.filter(User.username == data['username'], User.id != user_id).first()
        if existing:
            return jsonify({'msg': 'Username already taken'}), 400
        user.username = data['username']

    if 'email' in data:
        existing = User.query.filter(User.email == data['email'], User.id != user_id).first()
        if existing:
            return jsonify({'msg': 'Email already used'}), 400
        user.email = data['email']

    if 'role' in data and data['role'] in ['student', 'teacher', 'admin']:
        user.role = data['role']

    if 'level' in data:
        user.level = data['level']
    if 'subject' in data:
        user.subject = data['subject']

    if 'password' in data and data['password']:
        user.set_password(data['password'])

    db.session.commit()
    return jsonify({'msg': 'User updated', 'user': user.to_dict()}), 200


@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_role_required('admin')
def admin_delete_user(user_id):
    current_user_id = int(get_jwt_identity())
    if current_user_id == user_id:
        return jsonify({'msg': 'You cannot delete your own account'}), 400

    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({'msg': 'User deleted'}), 200


# ========== STATISTIQUES ==========
@admin_bp.route('/stats/users', methods=['GET'])
@jwt_role_required('admin')
def admin_stats_users():
    return jsonify({
        'total': User.query.count(),
        'students': User.query.filter_by(role='student').count(),
        'teachers': User.query.filter_by(role='teacher').count(),
        'admins': User.query.filter_by(role='admin').count()
    }), 200


@admin_bp.route('/stats/subjects', methods=['GET'])
@jwt_role_required('admin')
def admin_stats_subjects():
    return jsonify({'count': Subject.query.count()}), 200


@admin_bp.route('/stats/content', methods=['GET'])
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


# ========== INSCRIPTIONS EN ATTENTE ==========
@admin_bp.route('/pending_users', methods=['GET'])
@jwt_role_required('admin')
def admin_pending_users():
    # Seulement les demandes ayant terminé la vérification email (status = 'pending')
    pendings = PendingUser.query.filter_by(status='pending').all()
    return jsonify([{
        'id': p.id,
        'massar': p.massar,
        'username': p.username,
        'email': p.email,
        'role': p.role,
        'level': p.level,
        'subject': p.subject,
        'created_at': p.created_at.isoformat()
    } for p in pendings]), 200


@admin_bp.route('/approve_user/<int:pending_id>', methods=['POST'])
@jwt_role_required('admin')
def admin_approve_user(pending_id):
    pending = PendingUser.query.get_or_404(pending_id)
    if pending.status != 'pending':
        return jsonify({'msg': 'User already processed or email not verified'}), 400
    if not pending.email_verified:
        return jsonify({'msg': 'Email not verified yet'}), 400

    new_user = User(
        massar=pending.massar,
        username=pending.username,
        email=pending.email,
        role=pending.role,
        level=pending.level,
        subject=pending.subject,
        email_verified=True
    )
    new_user.password_hash = pending.password_hash
    db.session.add(new_user)
    db.session.flush()

    freeze_item = InventoryItem(user_id=new_user.id, item_type='flame_freeze', quantity=1)
    db.session.add(freeze_item)

    pending.status = 'approved'
    pending.user_id = new_user.id
    db.session.commit()

    try:
        mail = current_app.extensions.get('mail')
        if mail:
            msg = Message("Your Albatros account has been approved", recipients=[pending.email])
            msg.body = f"Hello {pending.username},\n\nYour registration has been validated. You can now log in with your {'Massar' if pending.role == 'student' else 'email'} and password.\n\nBest regards,\nThe Albatros team"
            mail.send(msg)
    except Exception as e:
        print(f"Email error: {e}")

    return jsonify({'msg': 'User approved and email sent'}), 200


@admin_bp.route('/reject_user/<int:pending_id>', methods=['POST'])
@jwt_role_required('admin')
def admin_reject_user(pending_id):
    pending = PendingUser.query.get_or_404(pending_id)
    if pending.status not in ['pending', 'email_pending']:
        return jsonify({'msg': 'User already processed'}), 400

    pending.status = 'rejected'
    db.session.commit()

    try:
        mail = current_app.extensions.get('mail')
        if mail:
            msg = Message("Your Albatros registration has not been accepted", recipients=[pending.email])
            msg.body = f"Hello {pending.username},\n\nSorry, your registration was not validated by the administrator.\n\nBest regards,\nThe Albatros team"
            mail.send(msg)
    except Exception as e:
        print(f"Email error: {e}")

    return jsonify({'msg': 'Registration rejected and email sent'}), 200


# ========== CRÉATION D'UTILISATEURS PAR ADMIN (directe) ==========
@admin_bp.route('/users/teacher', methods=['POST'])
@jwt_role_required('admin')
def admin_add_teacher():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    subject = data.get('subject')

    if not username or not email or not password or not subject:
        return jsonify({'msg': 'Missing fields'}), 400

    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({'msg': 'Username or email already used'}), 400

    teacher = User(
        massar=None,
        username=username,
        email=email,
        role='teacher',
        subject=subject,
        email_verified=True
    )
    teacher.set_password(password)
    db.session.add(teacher)
    db.session.flush()

    freeze_item = InventoryItem(user_id=teacher.id, item_type='flame_freeze', quantity=1)
    db.session.add(freeze_item)
    db.session.commit()

    return jsonify({'msg': 'Teacher created successfully', 'user': teacher.to_dict()}), 201


@admin_bp.route('/users/student', methods=['POST'])
@jwt_role_required('admin')
def admin_add_student():
    data = request.get_json()
    massar = data.get('massar')
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    level = data.get('level')

    if not massar or not username or not email or not password or not level:
        return jsonify({'msg': 'Missing fields'}), 400

    if User.query.filter((User.massar == massar) | (User.username == username) | (User.email == email)).first():
        return jsonify({'msg': 'Massar, username or email already used'}), 400

    student = User(
        massar=massar,
        username=username,
        email=email,
        role='student',
        level=level,
        email_verified=True
    )
    student.set_password(password)
    db.session.add(student)
    db.session.flush()

    freeze_item = InventoryItem(user_id=student.id, item_type='flame_freeze', quantity=1)
    db.session.add(freeze_item)
    db.session.commit()

    return jsonify({'msg': 'Student created successfully', 'user': student.to_dict()}), 201


# ========== GESTION DES MATIÈRES ==========
@admin_bp.route('/subjects', methods=['GET'])
@jwt_role_required('admin')
def admin_get_subjects():
    subjects = Subject.query.all()
    result = []
    for s in subjects:
        result.append({
            'id': s.id,
            'name': s.name,
            'description': s.description,
            'teacher_id': s.teacher_id,
            'teacher_name': s.teacher.username if s.teacher else None
        })
    return jsonify(result), 200


@admin_bp.route('/subjects', methods=['POST'])
@jwt_role_required('admin')
def admin_create_subject():
    data = request.get_json()
    name = data.get('name')
    description = data.get('description', '')
    teacher_id = data.get('teacher_id')

    if not name:
        return jsonify({'msg': 'Name is required'}), 400

    if teacher_id:
        teacher = User.query.get(teacher_id)
        if not teacher or teacher.role != 'teacher':
            return jsonify({'msg': 'Invalid teacher ID'}), 400

    new_subject = Subject(name=name, description=description, teacher_id=teacher_id)
    db.session.add(new_subject)
    db.session.commit()
    return jsonify({'msg': 'Subject created', 'id': new_subject.id}), 201


@admin_bp.route('/subjects/<int:subject_id>', methods=['PUT'])
@jwt_role_required('admin')
def admin_update_subject(subject_id):
    subject = Subject.query.get_or_404(subject_id)
    data = request.get_json()
    subject.name = data.get('name', subject.name)
    subject.description = data.get('description', subject.description)
    teacher_id = data.get('teacher_id')
    if teacher_id is not None:
        if teacher_id:
            teacher = User.query.get(teacher_id)
            if not teacher or teacher.role != 'teacher':
                return jsonify({'msg': 'Invalid teacher ID'}), 400
        subject.teacher_id = teacher_id
    db.session.commit()
    return jsonify({'msg': 'Subject updated'}), 200


@admin_bp.route('/subjects/<int:subject_id>', methods=['DELETE'])
@jwt_role_required('admin')
def admin_delete_subject(subject_id):
    subject = Subject.query.get_or_404(subject_id)
    db.session.delete(subject)
    db.session.commit()
    return jsonify({'msg': 'Subject deleted'}), 200


# ========== GESTION DES COURS (admin - lecture et suppression uniquement) ==========
@admin_bp.route('/all_courses', methods=['GET'])
@jwt_role_required('admin')
def admin_all_courses():
    courses = Course.query.all()
    result = []
    for c in courses:
        result.append({
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "subject_id": c.subject_id,
            "teacher_id": c.teacher_id,
            "teacher_name": c.teacher.username if c.teacher else None,
            "difficulty": c.difficulty,
            "tags": c.tags,
            "file_path": c.file_path
        })
    return jsonify(result), 200


@admin_bp.route('/courses/<int:course_id>', methods=['DELETE'])
@jwt_role_required('admin')
def admin_delete_course(course_id):
    course = Course.query.get_or_404(course_id)
    if course.file_path:
        abs_path = os.path.join(current_app.root_path, course.file_path)
        if os.path.exists(abs_path):
            os.remove(abs_path)
    db.session.delete(course)
    db.session.commit()
    return jsonify({'msg': 'Course deleted'}), 200


# ========== GESTION DES EXERCICES (admin - lecture et suppression uniquement) ==========
@admin_bp.route('/all_exercises', methods=['GET'])
@jwt_role_required('admin')
def admin_all_exercises():
    exercises = Exercise.query.all()
    result = []
    for e in exercises:
        result.append({
            "id": e.id,
            "course_id": e.course_id,
            "question_text": e.question_text,
            "correct_answer": e.correct_answer,
            "explanation": e.explanation,
            "difficulty": e.difficulty,
            "tags": e.tags
        })
    return jsonify(result), 200


@admin_bp.route('/exercises/<int:exercise_id>', methods=['DELETE'])
@jwt_role_required('admin')
def admin_delete_exercise(exercise_id):
    exercise = Exercise.query.get_or_404(exercise_id)
    db.session.delete(exercise)
    db.session.commit()
    return jsonify({'msg': 'Exercise deleted'}), 200


# ========== GESTION DES QUIZ (admin - lecture et suppression uniquement) ==========
@admin_bp.route('/all_quizzes', methods=['GET'])
@jwt_role_required('admin')
def admin_all_quizzes():
    quizzes = Quiz.query.all()
    result = []
    for q in quizzes:
        question_count = Question.query.filter_by(quiz_id=q.id).count()
        result.append({
            "id": q.id,
            "title": q.title,
            "subject_id": q.subject_id,
            "difficulty": q.difficulty,
            "question_count": question_count
        })
    return jsonify(result), 200


@admin_bp.route('/quizzes/<int:quiz_id>', methods=['DELETE'])
@jwt_role_required('admin')
def admin_delete_quiz(quiz_id):
    Question.query.filter_by(quiz_id=quiz_id).delete()
    quiz = Quiz.query.get_or_404(quiz_id)
    db.session.delete(quiz)
    db.session.commit()
    return jsonify({'msg': 'Quiz deleted'}), 200