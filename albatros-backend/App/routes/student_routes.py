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
from helpers import update_streak_and_rewards, compare_answers

student_bp = Blueprint('student', __name__, url_prefix='/api/student')

@student_bp.route('/gaps', methods=['GET'])
@jwt_required()
def api_student_gaps():
    user_id = get_jwt_identity()
    return jsonify(get_gaps(user_id)), 200

@student_bp.route('/exercises', methods=['GET'])
@jwt_required()
def api_student_exercises():
    user_id = get_jwt_identity()
    
    # Récupérer les IDs des exercices déjà complétés
    completed_ids = db.session.query(UserExercise.exercise_id).filter(
        UserExercise.user_id == user_id,
        UserExercise.completed == True
    ).all()
    completed_ids = [cid[0] for cid in completed_ids]
    
    query = Exercise.query
    if completed_ids:
        query = query.filter(Exercise.id.notin_(completed_ids))
    exercises = query.order_by(Exercise.id.desc()).limit(30).all()
    
    result = []
    for e in exercises:
        subject_id = None
        course = Course.query.get(e.course_id)
        if course and course.subject:
            subject_id = course.subject.id
        
        if e.questions:
            result.append({
                "id": e.id,
                "multi_question": True,
                "questions": e.questions,
                "difficulty": e.difficulty,
                "xp_reward": e.xp_reward,
                "subject_id": subject_id
            })
        else:
            result.append({
                "id": e.id,
                "multi_question": False,
                "question": e.question_text,
                "difficulty": e.difficulty,
                "xp_reward": e.xp_reward,
                "subject_id": subject_id
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
            course = Course.query.get(exercise.course_id)
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
    # exercises_data est une liste de dicts contenant "id"
    exercise_ids = [ex["id"] for ex in exercises_data]
    exercises = Exercise.query.filter(Exercise.id.in_(exercise_ids)).all()
    result = []
    for e in exercises:
        subject_id = None
        course = Course.query.get(e.course_id)
        if course and course.subject:
            subject_id = course.subject.id
        if e.questions:  # multi‑questions
            result.append({
                "id": e.id,
                "multi_question": True,
                "questions": e.questions,
                "difficulty": e.difficulty,
                "xp_reward": e.xp_reward,
                "subject_id": subject_id
            })
        else:
            result.append({
                "id": e.id,
                "multi_question": False,
                "question": e.question_text,
                "difficulty": e.difficulty,
                "xp_reward": e.xp_reward,
                "subject_id": subject_id
            })
    return jsonify(result), 200
@student_bp.route('/exercises/<int:exercise_id>/submit', methods=['POST'])
@jwt_required()
def api_submit_exercise(exercise_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    is_revision = data.get('is_revision', False)
    
    exercise = Exercise.query.get_or_404(exercise_id)
    
    # ---------- Multi‑questions ----------
    if exercise.questions:
        answers = data.get('answers', [])
        if len(answers) != len(exercise.questions):
            return jsonify({'msg': 'Invalid number of answers'}), 400
        
        correct_count = 0
        results = []
        
        for idx, q in enumerate(exercise.questions):
            user_ans = answers[idx].strip()
            is_correct, _ = compare_answers(user_ans, q['correct_answer'])
            results.append({
                'question': q['text'],
                'user_answer': user_ans,
                'correct': is_correct,
                'correct_answer': q['correct_answer'],
                'explanation': q.get('explanation', '')
            })
            if is_correct:
                correct_count += 1
        
        base_xp = exercise.xp_reward
        if correct_count == len(results):
            xp_earned = base_xp
            gems_earned = 2
            completed = True
        else:
            xp_earned = -3
            gems_earned = 0
            completed = False
        
        user_ex = UserExercise.query.filter_by(user_id=user_id, exercise_id=exercise_id).first()
        if not is_revision:
            if not user_ex:
                user_ex = UserExercise(user_id=user_id, exercise_id=exercise_id)
                db.session.add(user_ex)
            if not user_ex.completed and xp_earned > 0:
                user_ex.completed = True
        else:
            # En révision, on ne change pas le statut completed
            if xp_earned > 0:
                xp_earned = 5
                gems_earned = 0
        
        user = User.query.get(user_id)
        new_xp = (user.total_xp or 0) + xp_earned
        if new_xp < 0:
            new_xp = 0
        user.total_xp = new_xp
        user.gems = (user.gems or 0) + gems_earned
        db.session.commit()
        
        update_quest_progress(user_id, 'exercises', 1 if not is_revision and xp_earned > 0 else 0)
        if xp_earned > 0:
            update_quest_progress(user_id, 'xp', xp_earned)
        update_streak_and_rewards(user)
        
        return jsonify({
            'multi_question': True,
            'results': results,
            'xp_earned': xp_earned,
            'gems_earned': gems_earned,
            'completed': user_ex.completed if not is_revision else True,
            'total_correct': correct_count,
            'total_questions': len(results)
        }), 200
    
    # ---------- Format classique (une seule question) ----------
    else:
        user_answer = data.get('answer', '').strip()
        is_correct, _ = compare_answers(user_answer, exercise.correct_answer)
        base_xp = exercise.xp_reward if hasattr(exercise, 'xp_reward') else map_difficulty_to_xp(exercise.difficulty)
        
        user_ex = UserExercise.query.filter_by(user_id=user_id, exercise_id=exercise_id).first()
        
        if not is_revision:
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
                xp_reward = -3
                gems_reward = 0
        else:
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
        new_total_xp = (user.total_xp or 0) + xp_reward
        if new_total_xp < 0:
            new_total_xp = 0
        user.total_xp = new_total_xp
        user.gems = (user.gems or 0) + gems_reward
        db.session.commit()
        
        update_quest_progress(user_id, 'exercises', 1 if not is_revision and is_correct else 0)
        if xp_reward > 0:
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