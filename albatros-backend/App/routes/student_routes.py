from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import date, datetime, timedelta
import os

from db import db
from models import User, QuizResult, UserExercise, UserQuestProgress, Exercise, Course, Quiz, UserActivity
from quiz_service import (
    get_gaps,
    generate_personalized_exercises,
    update_quest_progress,
    create_weekly_quests_for_user,
    map_difficulty_to_xp,
    get_weekly_quests
)
from helpers import update_streak_and_rewards

student_bp = Blueprint('student', __name__, url_prefix='/api/student')

@student_bp.route('/gaps', methods=['GET'])
@jwt_required()
def api_student_gaps():
    user_id = get_jwt_identity()
    return jsonify(get_gaps(user_id)), 200

@student_bp.route('/exercises', methods=['GET'])
@jwt_required()
def api_student_exercises():
    exercises = Exercise.query.order_by(Exercise.id.desc()).limit(20).all()
    result = []
    for e in exercises:
        subject_id = None
        if e.course and e.course.subject:
            subject_id = e.course.subject.id
        result.append({
            "id": e.id,
            "question": e.question_text,
            "difficulty": e.difficulty,
            "xp_reward": getattr(e, 'xp_reward', 20),
            "subject_id": subject_id   # ← AJOUT
        })
    return jsonify(result), 200

@student_bp.route('/recommendations', methods=['GET'])
@jwt_required()
def api_student_recommendations():
    user_id = get_jwt_identity()
    exercises = generate_personalized_exercises(user_id, limit=4)
    recommendations = []
    for ex in exercises:
        exercise = Exercise.query.get(ex["id"])
        subject_name = "General"
        if exercise:
            course = Course.query.get(exercise.course_id)  # ← correction
            if course and course.subject:
                subject_name = course.subject.name
        recommendations.append({
            "id": ex["id"],
            "title": f"Exercise {ex['id']}",
            "type": "Exercises",
            "subject": subject_name,
            "description": ex["question"][:100],
        })
    return jsonify(recommendations), 200

@student_bp.route('/calendar', methods=['GET'])
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

@student_bp.route('/courses', methods=['GET'])
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

        file_url = None
        file_extension = None
        if course.file_path:
            file_url = f"/courses/{course.id}/file"
            ext = os.path.splitext(course.file_path)[1].lower().replace('.', '')
            file_extension = ext if ext in ['pdf', 'docx', 'pptx'] else None

        result.append({
            "id": course.id,
            "title": course.title,
            "description": course.description,
            "user_score": user_score,
            "file_url": file_url,
            "file_extension": file_extension
        })
    return jsonify(result), 200

@student_bp.route('/results', methods=['GET'])
@jwt_required()
def api_student_results():
    user_id = get_jwt_identity()
    results = QuizResult.query.filter_by(user_id=user_id).order_by(QuizResult.date_taken.desc()).all()
    return jsonify([{
        "quiz_id": r.quiz_id,
        "score": r.score,
        "date": r.date_taken.isoformat()
    } for r in results]), 200

@student_bp.route('/quests', methods=['GET'])
@jwt_required()
def api_student_quests():
    user_id = get_jwt_identity()
    create_weekly_quests_for_user(user_id)
    quests = get_weekly_quests(user_id)
    return jsonify(quests), 200

@student_bp.route('/claim_quest/<int:progress_id>', methods=['POST'])
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

@student_bp.route('/exercises/revision', methods=['GET'])
@jwt_required()
def api_student_revision_exercises():
    user_id = get_jwt_identity()
    exercises_data = generate_personalized_exercises(user_id, limit=5, revision=True)
    # Récupérer les objets Exercise pour avoir subject_id
    exercises = Exercise.query.filter(Exercise.id.in_([ex["id"] for ex in exercises_data])).all()
    result = []
    for e in exercises:
        subject_id = None
        if e.course and e.course.subject:
            subject_id = e.course.subject.id
        result.append({
            "id": e.id,
            "question": e.question_text,
            "difficulty": e.difficulty,
            "xp_reward": getattr(e, 'xp_reward', 20),
            "subject_id": subject_id
        })
    return jsonify(result), 200

@student_bp.route('/exercises/<int:exercise_id>/submit', methods=['POST'])
@jwt_required()
def api_submit_exercise(exercise_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    user_answer = data.get('answer', '').strip()
    is_revision = data.get('is_revision', False)

    exercise = Exercise.query.get_or_404(exercise_id)
    is_correct = (user_answer.lower() == exercise.correct_answer.lower())

    base_xp = exercise.xp_reward if hasattr(exercise, 'xp_reward') else map_difficulty_to_xp(exercise.difficulty)

    if not is_revision:
        # Première tentative
        user_ex = UserExercise.query.filter_by(user_id=user_id, exercise_id=exercise_id).first()
        if user_ex and user_ex.completed:
            return jsonify({'msg': 'Exercise already completed'}), 400
        if not user_ex:
            user_ex = UserExercise(user_id=user_id, exercise_id=exercise_id)
            db.session.add(user_ex)

        if is_correct:
            user_ex.completed = True
            xp_reward = base_xp
            gems_reward = 2
        else:
            xp_reward = 5
            gems_reward = 0
    else:
        # Révision
        user_ex = UserExercise.query.filter_by(user_id=user_id, exercise_id=exercise_id).first()
        if not user_ex or not user_ex.completed:
            return jsonify({'msg': 'Exercise not completed yet, cannot revise'}), 400
        user_ex.revision_attempts = (user_ex.revision_attempts or 0) + 1
        user_ex.last_review_date = datetime.utcnow()
        if is_correct:
            xp_reward = 5
            gems_reward = 0
        else:
            xp_reward = 0
            gems_reward = 0

    user = User.query.get(user_id)
    user.total_xp = (user.total_xp or 0) + xp_reward
    user.gems = (user.gems or 0) + gems_reward
    db.session.commit()

    update_quest_progress(user_id, 'exercises', 1 if not is_revision and is_correct else 0)
    update_quest_progress(user_id, 'xp', xp_reward)
    update_streak_and_rewards(user)

    return jsonify({
        'correct': is_correct,
        'correct_answer': exercise.correct_answer,
        'explanation': exercise.explanation,
        'xp_earned': xp_reward,
        'gems_earned': gems_reward,
        'completed': user_ex.completed if not is_revision else True
    }), 200