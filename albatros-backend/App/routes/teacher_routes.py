import os
import tempfile
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from db import db
from models import Course, Exercise, User, QuizResult, Subject, Quiz, Question
from decorators import jwt_role_required
from docx_parser import extraire_texte_docx, extraire_exercices_depuis_texte
from content_manager import charger_document_et_creer_quiz

teacher_bp = Blueprint('teacher', __name__, url_prefix='/api/teacher')

ALLOWED_EXTENSIONS = {'pdf', 'docx', 'pptx'}
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@teacher_bp.route('/stats', methods=['GET'])
@jwt_role_required('teacher', 'admin')
def teacher_stats():
    user_id = int(get_jwt_identity())
    courses_count = Course.query.filter_by(teacher_id=user_id).count()
    exercises_count = Exercise.query.join(Course).filter(Course.teacher_id == user_id).count()
    students_count = User.query.filter_by(role='student').count()
    return jsonify({
        'courses': courses_count,
        'exercises': exercises_count,
        'students': students_count
    }), 200

@teacher_bp.route('/courses/with_file', methods=['POST'])
@jwt_role_required('teacher', 'admin')
def api_create_course_with_file():
    user_id = int(get_jwt_identity())
    title = request.form.get('title')
    description = request.form.get('description', '')
    subject_id = request.form.get('subject_id', type=int)
    difficulty = request.form.get('difficulty', 'medium')
    tags = request.form.get('tags', '')

    if not title or not subject_id:
        return jsonify({'msg': 'Missing title or subject_id'}), 400

    subject = Subject.query.get(subject_id)
    if not subject:
        return jsonify({'msg': 'Invalid subject_id'}), 400

    file = request.files.get('file')
    if not file or file.filename == '':
        return jsonify({'msg': 'No file provided'}), 400

    if not allowed_file(file.filename):
        return jsonify({'msg': 'File type not allowed'}), 400

    course = Course(
        title=title,
        description=description,
        subject_id=subject_id,
        teacher_id=user_id,
        difficulty=difficulty,
        tags=tags
    )

    db.session.add(course)
    db.session.flush()

    filename = secure_filename(f"course_{course.id}_{file.filename}")
    relative_path = os.path.join('course_files', filename)
    absolute_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)

    try:
        file.save(absolute_path)
    except Exception as e:
        db.session.rollback()
        return jsonify({'msg': f'File save error: {str(e)}'}), 500

    course.file_path = relative_path
    db.session.commit()

    return jsonify({'msg': 'Course created with file', 'id': course.id}), 201

@teacher_bp.route('/courses', methods=['GET'])
@jwt_role_required('teacher', 'admin')
def get_teacher_courses():
    user_id = int(get_jwt_identity())
    courses = Course.query.filter_by(teacher_id=user_id).all()
    return jsonify([{
        "id": c.id,
        "title": c.title,
        "description": c.description,
        "subject_id": c.subject_id,
        "difficulty": c.difficulty,
        "has_file": bool(c.file_path),
        "file_path": c.file_path 
    } for c in courses]), 200

@teacher_bp.route('/courses/<int:course_id>', methods=['DELETE'])
@jwt_role_required('teacher', 'admin')
def delete_course(course_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    course = Course.query.get_or_404(course_id)
    print(f"DEBUG: user_id={user_id}, teacher_id={course.teacher_id}, user.role={user.role}")  # ← ajout
    if user.role != 'admin' and course.teacher_id != user_id:
        return jsonify({'msg': 'Unauthorized'}), 403

    if course.file_path:
        abs_path = os.path.join(current_app.root_path, course.file_path)
        if os.path.exists(abs_path):
            os.remove(abs_path)

    db.session.delete(course)
    db.session.commit()
    return jsonify({'msg': 'Course deleted'}), 200

@teacher_bp.route('/exercises', methods=['GET'])
@jwt_role_required('teacher', 'admin')
def get_teacher_exercises():
    user_id = int(get_jwt_identity())
    exercises = Exercise.query.join(Course).filter(Course.teacher_id == user_id).all()
    return jsonify([{
        "id": e.id,
        "course_id": e.course_id,
        "question_text": e.question_text,
        "difficulty": e.difficulty,
        "tags": e.tags
    } for e in exercises]), 200

@teacher_bp.route('/exercises', methods=['POST'])
@jwt_role_required('teacher', 'admin')
def create_exercise():
    user_id = int(get_jwt_identity())
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

@teacher_bp.route('/progress', methods=['GET'])
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

@teacher_bp.route('/students', methods=['GET'])
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

@teacher_bp.route('/upload_exam', methods=['POST'])
@jwt_role_required('teacher', 'admin')
def api_upload_exam():
    if 'file' not in request.files:
        return jsonify({'msg': 'Aucun fichier fourni'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'msg': 'Nom de fichier vide'}), 400
    if not file.filename.endswith('.docx'):
        return jsonify({'msg': 'Seuls les fichiers .docx sont acceptés'}), 400

    with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as tmp:
        file.save(tmp.name)
        tmp_path = tmp.name

    try:
        texte_complet = extraire_texte_docx(tmp_path)
        exercices = extraire_exercices_depuis_texte(texte_complet)
        if not exercices:
            return jsonify({'msg': 'Aucun exercice détecté dans le fichier'}), 400
        return jsonify({'exercises': exercices, 'count': len(exercices)}), 200
    except Exception as e:
        return jsonify({'msg': f'Erreur lors du traitement : {str(e)}'}), 500
    finally:
        os.unlink(tmp_path)

@teacher_bp.route('/upload_docx_and_create_quiz', methods=['POST'])
@jwt_role_required('teacher', 'admin')
def api_upload_docx_create_quiz():
    user_id = int(get_jwt_identity())
    file_data = None
    if 'file' in request.files:
        file = request.files['file']
        if not file.filename.endswith('.docx'):
            return jsonify({'msg': 'Only .docx'}), 400
        file_data = file.read()
    elif request.is_json and 'file_base64' in request.json:
        import base64
        file_data = base64.b64decode(request.json['file_base64'])
    else:
        return jsonify({'msg': 'No file provided'}), 400

    if request.is_json:
        data = request.get_json()
        title = data.get('title', 'Quiz généré')
        subject_id = data.get('subject_id')
        difficulty = data.get('difficulty', 'medium')
    else:
        title = request.form.get('title', 'Quiz généré')
        subject_id = request.form.get('subject_id', type=int)
        difficulty = request.form.get('difficulty', 'medium')

    if not subject_id:
        return jsonify({'msg': 'subject_id required'}), 400

    with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as tmp:
        tmp.write(file_data)
        tmp_path = tmp.name

    try:
        quiz_id = charger_document_et_creer_quiz(
            chemin_fichier=tmp_path,
            titre_quiz=title,
            subject_id=subject_id,
            difficulte=difficulty,
            teacher_id=user_id
        )
        return jsonify({'msg': 'Quiz created', 'quiz_id': quiz_id}), 201
    except Exception as e:
        return jsonify({'msg': f'Error: {str(e)}'}), 500
    finally:
        os.unlink(tmp_path)

# ========== GESTION DES EXERCICES ==========
@teacher_bp.route('/exercises/<int:exercise_id>', methods=['DELETE'])
@jwt_role_required('teacher', 'admin')
def delete_exercise(exercise_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    exercise = Exercise.query.get_or_404(exercise_id)
    # Vérifier que l'exercice appartient à un cours de l'enseignant
    course = Course.query.get(exercise.course_id)
    if user.role != 'admin' and course.teacher_id != user_id:
        return jsonify({'msg': 'Unauthorized'}), 403
    db.session.delete(exercise)
    db.session.commit()
    return jsonify({'msg': 'Exercise deleted'}), 200

# ========== GESTION DES QUIZ ==========
@teacher_bp.route('/quizzes', methods=['GET'])
@jwt_role_required('teacher', 'admin')
def get_teacher_quizzes():
    user_id = int(get_jwt_identity())
    quizzes = Quiz.query.filter_by(teacher_id=user_id).all()
    result = []
    for q in quizzes:
        question_count = Question.query.filter_by(quiz_id=q.id).count()
        result.append({
            "id": q.id,
            "title": q.title,
            "subject_id": q.subject_id,
            "difficulty": q.difficulty,
            "question_count": question_count,
        })
    return jsonify(result), 200

@teacher_bp.route('/quizzes', methods=['POST'])
@jwt_role_required('teacher', 'admin')
def create_quiz():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    title = data.get('title')
    subject_id = data.get('subject_id')
    difficulty = data.get('difficulty', 'medium')
    questions_data = data.get('questions', [])

    if not title or not subject_id or not questions_data:
        return jsonify({'msg': 'Titre, matière et questions requis'}), 400

    quiz = Quiz(title=title, subject_id=subject_id, difficulty=difficulty, teacher_id=user_id)
    db.session.add(quiz)
    db.session.flush()

    for q in questions_data:
        question = Question(
            quiz_id=quiz.id,
            text=q['text'],
            option1=q.get('option1', ''),
            option2=q.get('option2', ''),
            option3=q.get('option3', ''),
            option4=q.get('option4', ''),
            correct_option=q.get('correct_option', 1),
            concept="manuel"
        )
        db.session.add(question)
    db.session.commit()
    return jsonify({'msg': 'Quiz créé', 'id': quiz.id}), 201

@teacher_bp.route('/quizzes/<int:quiz_id>', methods=['DELETE'])
@jwt_role_required('teacher', 'admin')
def delete_quiz(quiz_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    quiz = Quiz.query.get_or_404(quiz_id)
    if user.role != 'admin' and quiz.teacher_id != user_id:
        return jsonify({'msg': 'Unauthorized'}), 403
    # Supprimer les questions associées
    Question.query.filter_by(quiz_id=quiz_id).delete()
    db.session.delete(quiz)
    db.session.commit()
    return jsonify({'msg': 'Quiz deleted'}), 200

@teacher_bp.route('/quizzes/<int:quiz_id>', methods=['PUT'])
@jwt_role_required('teacher', 'admin')
def update_quiz(quiz_id):
    user_id = int(get_jwt_identity())
    quiz = Quiz.query.get_or_404(quiz_id)
    if quiz.teacher_id != user_id:
        return jsonify({'msg': 'Unauthorized'}), 403
    data = request.get_json()
    quiz.title = data.get('title', quiz.title)
    quiz.subject_id = data.get('subject_id', quiz.subject_id)
    quiz.difficulty = data.get('difficulty', quiz.difficulty)
    # Supprimer les anciennes questions
    Question.query.filter_by(quiz_id=quiz_id).delete()
    # Ajouter les nouvelles
    for q in data.get('questions', []):
        question = Question(
            quiz_id=quiz_id,
            text=q['text'],
            option1=q.get('option1', ''),
            option2=q.get('option2', ''),
            option3=q.get('option3', ''),
            option4=q.get('option4', ''),
            correct_option=q.get('correct_option', 1),
            concept="manuel"
        )
        db.session.add(question)
    db.session.commit()
    return jsonify({'msg': 'Quiz updated'}), 200

@teacher_bp.route('/quizzes/<int:quiz_id>', methods=['GET'])
@jwt_role_required('teacher', 'admin')
def get_quiz(quiz_id):
    user_id = int(get_jwt_identity())
    quiz = Quiz.query.get_or_404(quiz_id)
    user = User.query.get(user_id)
    if user.role != 'admin' and quiz.teacher_id != user_id:
        return jsonify({'msg': 'Unauthorized'}), 403
    questions = Question.query.filter_by(quiz_id=quiz_id).all()
    questions_data = [{
        'id': q.id,
        'text': q.text,
        'option1': q.option1,
        'option2': q.option2,
        'option3': q.option3,
        'option4': q.option4,
        'correct_option': q.correct_option,
        
    } for q in questions]
    return jsonify({
        'id': quiz.id,
        'title': quiz.title,
        'subject_id': quiz.subject_id,
        'difficulty': quiz.difficulty,
        'questions': questions_data
    }), 200

# Récupérer un exercice spécifique (pour édition)
@teacher_bp.route('/exercises/<int:exercise_id>', methods=['GET'])
@jwt_role_required('teacher', 'admin')
def get_exercise(exercise_id):
    user_id = int(get_jwt_identity())
    exercise = Exercise.query.get_or_404(exercise_id)
    course = Course.query.get(exercise.course_id)
    if course.teacher_id != user_id:
        return jsonify({'msg': 'Unauthorized'}), 403
    return jsonify({
        'id': exercise.id,
        'course_id': exercise.course_id,
        'question_text': exercise.question_text,
        'correct_answer': exercise.correct_answer,
        'explanation': exercise.explanation,
        'difficulty': exercise.difficulty,
        'tags': exercise.tags,
    }), 200

# Mettre à jour un exercice
@teacher_bp.route('/exercises/<int:exercise_id>', methods=['PUT'])
@jwt_role_required('teacher', 'admin')
def update_exercise(exercise_id):
    user_id = int(get_jwt_identity())
    exercise = Exercise.query.get_or_404(exercise_id)
    course = Course.query.get(exercise.course_id)
    if course.teacher_id != user_id:
        return jsonify({'msg': 'Unauthorized'}), 403

    data = request.get_json()
    exercise.question_text = data.get('question_text', exercise.question_text)
    exercise.correct_answer = data.get('correct_answer', exercise.correct_answer)
    exercise.explanation = data.get('explanation', exercise.explanation)
    exercise.difficulty = data.get('difficulty', exercise.difficulty)
    exercise.tags = data.get('tags', exercise.tags)
    # Si vous voulez permettre de changer le cours associé
    # exercise.course_id = data.get('course_id', exercise.course_id)
    db.session.commit()
    return jsonify({'msg': 'Exercise updated'}), 200

@teacher_bp.route('/courses/<int:course_id>', methods=['GET'])
@jwt_role_required('teacher', 'admin')
def get_course(course_id):
    user_id = int(get_jwt_identity())
    course = Course.query.get_or_404(course_id)
    if course.teacher_id != user_id:
        return jsonify({'msg': 'Unauthorized'}), 403
    return jsonify({
        'id': course.id,
        'title': course.title,
        'description': course.description,
        'subject_id': course.subject_id,
        'difficulty': course.difficulty,
        'tags': course.tags,
        'has_file': bool(course.file_path)
    }), 200