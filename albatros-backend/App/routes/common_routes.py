from flask import Blueprint, request, jsonify, send_from_directory, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from db import db
from models import Course, Subject, Quiz, Question, User, Friend, InventoryItem
from quiz_service import evaluate_quiz
import os

common_bp = Blueprint('common', __name__, url_prefix='/api')

@common_bp.route('/subjects', methods=['GET'])
@jwt_required(optional=True)
def get_subjects():
    subjects = Subject.query.all()
    return jsonify([{
        'id': s.id,
        'name': s.name,
        'description': s.description,
        'teacher_id': s.teacher_id,
        'teacher_name': s.teacher.username if s.teacher else None
    } for s in subjects]), 200

@common_bp.route('/courses', methods=['GET'])
@jwt_required(optional=True)
def get_all_courses():
    courses = Course.query.all()
    result = []
    for c in courses:
        result.append({
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "subject_id": c.subject_id,
            "subject_name": c.subject.name if c.subject else None,
            "difficulty": c.difficulty,
            "teacher_id": c.teacher_id,
            "tags": c.tags,
            "has_file": bool(c.file_path)
        })
    return jsonify(result), 200

@common_bp.route('/courses/<int:course_id>', methods=['GET'])
@jwt_required(optional=True)
def get_course_details(course_id):
    course = Course.query.get_or_404(course_id)
    # Déterminer l'extension du fichier
    file_ext = None
    if course.file_path:
        ext = os.path.splitext(course.file_path)[1].lower().replace('.', '')
        file_ext = ext if ext in ['pdf', 'docx', 'pptx'] else None
    return jsonify({
        "id": course.id,
        "title": course.title,
        "description": course.description,
        "difficulty": course.difficulty,
        "subject_id": course.subject_id,
        "subject_name": course.subject.name if course.subject else None,
        "teacher_id": course.teacher_id,
        "tags": course.tags,
        "file_url": f"/api/courses/{course.id}/file" if course.file_path else None,
        "file_extension": file_ext,
        "content": course.content,
        "examples": course.examples
    }), 200

@common_bp.route('/courses/<int:course_id>/file', methods=['GET'])
@jwt_required(optional=True)
def get_course_file(course_id):
    course = Course.query.get_or_404(course_id)
    if not course.file_path:
        return jsonify({'msg': 'No file uploaded for this course'}), 404

    abs_path = os.path.join(current_app.root_path, course.file_path)
    if not os.path.exists(abs_path):
        return jsonify({'msg': 'File not found'}), 404

    # Determine file extension and MIME type
    ext = os.path.splitext(abs_path)[1].lower()
    mime = {
        '.pdf': 'application/pdf',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    }.get(ext, 'application/octet-stream')

    # Force inline for PDF, attachment otherwise
    disposition = 'inline' if ext == '.pdf' else 'attachment'

    directory = os.path.dirname(abs_path)
    filename = os.path.basename(abs_path)
    response = send_from_directory(directory, filename, as_attachment=False)
    response.headers['Content-Type'] = mime
    response.headers['Content-Disposition'] = f'{disposition}; filename="{filename}"'
    return response

@common_bp.route('/quizzes', methods=['GET'])
@jwt_required()
def get_quizzes():
    quizzes = Quiz.query.all()
    return jsonify([{"id": q.id, "title": q.title, "difficulty": q.difficulty} for q in quizzes]), 200

@common_bp.route('/quiz/<int:quiz_id>/questions', methods=['GET'])
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

@common_bp.route('/quiz/<int:quiz_id>/submit', methods=['POST'])
@jwt_required()
def api_submit_quiz(quiz_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    answers = data.get('answers', {})
    result = evaluate_quiz(user_id, quiz_id, answers)
    user = User.query.get(user_id)
    from helpers import update_streak_and_rewards
    update_streak_and_rewards(user)
    return jsonify(result), 200

@common_bp.route('/shop/buy', methods=['POST'])
@jwt_required()
def buy_item():
    user_id = get_jwt_identity()
    data = request.get_json()
    item_type = data.get('item_type')
    if item_type != 'flame_freeze':
        return jsonify({'msg': 'Invalid item'}), 400

    cost = 10
    user = User.query.get(user_id)
    if user.gems < cost:
        return jsonify({'msg': 'Not enough gems'}), 400

    user.gems -= cost
    item = InventoryItem.query.filter_by(user_id=user_id, item_type=item_type).first()
    if not item:
        item = InventoryItem(user_id=user_id, item_type=item_type, quantity=0)
        db.session.add(item)
    item.quantity += 1
    db.session.commit()
    return jsonify({'msg': 'Item purchased', 'gems_left': user.gems, 'quantity': item.quantity}), 200

@common_bp.route('/friends/add', methods=['POST'])
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

@common_bp.route('/friends/accept/<int:friendship_id>', methods=['POST'])
@jwt_required()
def api_accept_friend(friendship_id):
    user_id = get_jwt_identity()
    friendship = Friend.query.get_or_404(friendship_id)
    if friendship.friend_id != user_id or friendship.status != 'pending':
        return jsonify({'msg': 'Action non autorisée'}), 400
    friendship.status = 'accepted'
    db.session.commit()
    return jsonify({'msg': 'Ami ajouté'}), 200

@common_bp.route('/leaderboard', methods=['GET'])
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

@common_bp.route('/user/me', methods=['GET'])
@jwt_required()
def user_me():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    return jsonify(user.to_dict()), 200

@common_bp.route('/leaderboard/global', methods=['GET'])
@jwt_required()
def global_leaderboard():
    students = User.query.filter_by(role='student').order_by(User.total_xp.desc()).limit(20).all()
    return jsonify([{
        'id': s.id,
        'username': s.username,
        'total_xp': s.total_xp,
    } for s in students]), 200