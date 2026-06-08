import os
import random
from datetime import date, datetime, timedelta
from functools import wraps
from dotenv import load_dotenv
from flask import Flask, request, jsonify, redirect, flash
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from flask_mail import Mail, Message

from db import db
from models import *
from helpers import *
from quiz_service import *
from data.courses_data import courses as static_courses

basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, ".env"))
FRONTEND_URL = "http://localhost:5173"

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-key-change-me")
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + os.path.join(basedir, "users.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

app.config["MAIL_SERVER"] = os.environ.get("MAIL_SERVER", "sandbox.smtp.mailtrap.io")
app.config["MAIL_PORT"] = int(os.environ.get("MAIL_PORT", 2525))
app.config["MAIL_USE_TLS"] = os.environ.get("MAIL_USE_TLS", "true").lower() in ["true", "1", "yes", "on"]
app.config["MAIL_USE_SSL"] = os.environ.get("MAIL_USE_SSL", "false").lower() in ["true", "1", "yes", "on"]
app.config["MAIL_USERNAME"] = os.environ.get("MAIL_USERNAME")
app.config["MAIL_PASSWORD"] = os.environ.get("MAIL_PASSWORD")
app.config["MAIL_DEFAULT_SENDER"] = os.environ.get("MAIL_DEFAULT_SENDER", "albatros@example.com")
app.config["EMAIL_DEBUG_TO_TERMINAL"] = os.environ.get("EMAIL_DEBUG_TO_TERMINAL", "true").lower() in ["true", "1", "yes", "on"]

mail = Mail(app)
print("MAIL_SERVER =", app.config["MAIL_SERVER"])
print("MAIL_PORT =", app.config["MAIL_PORT"])
print("MAIL_USERNAME EXISTS =", bool(app.config["MAIL_USERNAME"]))
print("MAIL_PASSWORD EXISTS =", bool(app.config["MAIL_PASSWORD"]))
print("MAIL_DEFAULT_SENDER =", app.config["MAIL_DEFAULT_SENDER"])
from datetime import timedelta
from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from db import db
from helpers import init_default_quests
from models import User

# Import des blueprints
from routes.auth_routes import auth_bp
from routes.student_routes import student_bp
from routes.teacher_routes import teacher_bp
from routes.admin_routes import admin_bp
from routes.common_routes import common_bp

load_dotenv()

basedir = os.path.abspath(os.path.dirname(__file__))
app = Flask(__name__)

# Config
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-key-change-me')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'users.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Upload
app.config['UPLOAD_FOLDER'] = os.path.join(basedir, 'course_files')
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024

# Mail
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = 'no-reply@albatros.com'

mail = Mail(app)
app.extensions['mail'] = mail   # pour y accéder dans les blueprints

# Extensions
db.init_app(app)
CORS(app, origins=[FRONTEND_URL], supports_credentials=True)
jwt = JWTManager(app)
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

login_manager = LoginManager(app)
login_manager.login_view = None
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
                flash("Accès non autorisé.", "danger")
                return redirect(FRONTEND_URL)
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def jwt_role_required(*allowed_roles):
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def decorated_function(*args, **kwargs):
            user_id = get_jwt_identity()
            user = User.query.get(int(user_id))

            if not user or user.role not in allowed_roles:
                return jsonify({"msg": "Accès non autorisé"}), 403

            return f(*args, **kwargs)
        return decorated_function
    return decorator


def generate_code():
    return str(random.randint(100000, 999999))


def code_is_valid(created_at, minutes=10):
    if not created_at:
        return False

    return datetime.utcnow() <= created_at + timedelta(minutes=minutes)


def get_mail_sender():
    return app.config.get("MAIL_DEFAULT_SENDER") or app.config.get("MAIL_USERNAME")


def mail_config_is_ready():
    return bool(
        app.config.get("MAIL_SERVER")
        and app.config.get("MAIL_PORT")
        and app.config.get("MAIL_USERNAME")
        and app.config.get("MAIL_PASSWORD")
        and get_mail_sender()
    )


def send_email_code(email, subject, code):
    email = str(email).strip().lower()

    if not mail_config_is_ready():
        print("Email config missing. Check MAIL_USERNAME, MAIL_PASSWORD and MAIL_DEFAULT_SENDER in .env")

        if app.config.get("EMAIL_DEBUG_TO_TERMINAL"):
            print(f"Verification code for {email}: {code}")

        return False

    try:
        msg = Message(
            subject=subject,
            sender=get_mail_sender(),
            recipients=[email]
        )

        msg.body = (
            f"Bonjour,\n\n"
            f"Votre code de vérification Albatros est : {code}\n\n"
            f"Ce code expire dans 10 minutes.\n\n"
            f"Cordialement,\n"
            f"L'équipe Albatros"
        )

        mail.send(msg)
        print(f"Email sent to {email}")
        return True

    except Exception as e:
        print(f"Email send failed for {email}")
        print(f"Error: {e}")

        if app.config.get("EMAIL_DEBUG_TO_TERMINAL"):
            print(f"Verification code for {email}: {code}")

        return False


def send_simple_email(email, subject, body):
    email = str(email).strip().lower()

    if not mail_config_is_ready():
        print("Email config missing. Check MAIL_USERNAME, MAIL_PASSWORD and MAIL_DEFAULT_SENDER in .env")
        return False

    try:
        msg = Message(
            subject=subject,
            sender=get_mail_sender(),
            recipients=[email]
        )

        msg.body = body

        mail.send(msg)
        print(f"Email sent to {email}")
        return True

    except Exception as e:
        print(f"Email send failed for {email}")
        print(f"Error: {e}")
        return False


def create_default_subjects():
    defaults = [
        ("Mathematics", "Mathematics courses and exercises"),
        ("French", "French language courses and exercises"),
        ("English", "English language courses and exercises"),
        ("Informatics", "Computer science and digital skills"),
    ]

    for name, description in defaults:
        subject = Subject.query.filter_by(name=name).first()

        if not subject:
            db.session.add(Subject(name=name, description=description))

    db.session.commit()


@app.route("/")
def index():
    return jsonify({
        "msg": "Albatros backend is running",
        "frontend": FRONTEND_URL
    }), 200


@app.route("/register", methods=["GET", "POST"])
def register():
    return redirect(f"{FRONTEND_URL}/register")


@app.route("/login", methods=["GET", "POST"])
def login():
    return redirect(f"{FRONTEND_URL}/login")


@app.route("/logout")
def logout():
    logout_user()
    return redirect(FRONTEND_URL)


@app.route("/api/auth/register", methods=["POST"])
def api_register():
    data = request.get_json() or {}

    account_type = data.get("account_type", "student")
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    massar = data.get("massar")
    level = data.get("level")
    subject = data.get("subject")

    if account_type not in ["student", "teacher"]:
        return jsonify({"msg": "Type de compte invalide"}), 400

    if not username or not email or not password:
        return jsonify({"msg": "Nom, email et mot de passe obligatoires"}), 400

    username = str(username).strip()
    email = str(email).strip().lower()
    password = str(password)
    massar = str(massar).strip().upper() if massar else None
    level = str(level).strip() if level else None
    subject = str(subject).strip() if subject else None

    if len(password) < 6:
        return jsonify({"msg": "Le mot de passe doit contenir au moins 6 caractères"}), 400

    if account_type == "student":
        if not massar:
            return jsonify({"msg": "Le code Massar est obligatoire pour les élèves"}), 400

        if not level:
            return jsonify({"msg": "Le niveau scolaire est obligatoire pour les élèves"}), 400

    if account_type == "teacher" and not subject:
        return jsonify({"msg": "La matière est obligatoire pour les enseignants"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"msg": "Email déjà utilisé"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"msg": "Nom complet déjà utilisé"}), 400

    if account_type == "student" and User.query.filter_by(massar=massar).first():
        return jsonify({"msg": "Massar déjà utilisé"}), 400

    existing_pending_email = PendingUser.query.filter_by(email=email).first()

    if existing_pending_email:
        if existing_pending_email.status == "email_pending":
            code = generate_code()

            existing_pending_email.username = username
            existing_pending_email.role = account_type
            existing_pending_email.massar = massar if account_type == "student" else None
            existing_pending_email.level = level if account_type == "student" else None
            existing_pending_email.subject = subject if account_type == "teacher" else None
            existing_pending_email.verification_code = code
            existing_pending_email.verification_code_created_at = datetime.utcnow()
            existing_pending_email.email_verified = False
            existing_pending_email.set_password(password)

            db.session.commit()

            send_email_code(existing_pending_email.email, "Code de vérification Albatros", code)

            return jsonify({
                "msg": "Un nouveau code de vérification a été envoyé à votre email.",
                "requires_email_verification": True,
                "email": existing_pending_email.email
            }), 200

        if existing_pending_email.status == "pending":
            return jsonify({"msg": "Une demande avec cet email attend déjà la validation de l’administrateur"}), 400

        if existing_pending_email.status == "approved":
            return jsonify({"msg": "Ce compte est déjà approuvé. Vous pouvez vous connecter."}), 400

        if existing_pending_email.status == "rejected":
            db.session.delete(existing_pending_email)
            db.session.commit()

    if account_type == "student" and massar:
        existing_pending_massar = PendingUser.query.filter_by(massar=massar).first()

        if existing_pending_massar:
            if existing_pending_massar.status == "email_pending":
                return jsonify({"msg": "Une demande avec ce Massar existe déjà. Vérifiez l'email utilisé pour cette demande."}), 400

            if existing_pending_massar.status == "pending":
                return jsonify({"msg": "Une demande avec ce Massar attend déjà la validation de l’administrateur"}), 400

            if existing_pending_massar.status == "approved":
                return jsonify({"msg": "Ce Massar est déjà approuvé"}), 400

            if existing_pending_massar.status == "rejected":
                db.session.delete(existing_pending_massar)
                db.session.commit()

    existing_pending_username = PendingUser.query.filter_by(username=username).first()

    if existing_pending_username and existing_pending_username.status in ["email_pending", "pending"]:
        return jsonify({"msg": "Ce nom complet est déjà utilisé dans une demande en attente"}), 400

    code = generate_code()

    pending = PendingUser(
        massar=massar if account_type == "student" else None,
        username=username,
        email=email,
        role=account_type,
        level=level if account_type == "student" else None,
        subject=subject if account_type == "teacher" else None,
        status="email_pending",
        email_verified=False,
        verification_code=code,
        verification_code_created_at=datetime.utcnow()
    )

    pending.set_password(password)

    db.session.add(pending)
    db.session.commit()

    send_email_code(email, "Code de vérification Albatros", code)

    return jsonify({
        "msg": "Code de vérification envoyé à votre email.",
        "requires_email_verification": True,
        "email": email
    }), 201


@app.route("/api/auth/verify-email", methods=["POST"])
def verify_email():
    data = request.get_json() or {}

    email = data.get("email")
    code = data.get("code")

    if not email or not code:
        return jsonify({"msg": "Email et code obligatoires"}), 400

    email = str(email).strip().lower()
    code = str(code).strip()

    pending = PendingUser.query.filter_by(email=email).first()

    if not pending:
        return jsonify({"msg": "Demande introuvable"}), 404

    if pending.status != "email_pending":
        return jsonify({"msg": "Email déjà vérifié ou demande déjà traitée"}), 400

    if pending.verification_code != code:
        return jsonify({"msg": "Code incorrect"}), 400

    if not code_is_valid(pending.verification_code_created_at):
        return jsonify({"msg": "Code expiré"}), 400

    pending.email_verified = True
    pending.status = "pending"
    pending.verification_code = None
    pending.verification_code_created_at = None

    db.session.commit()

    return jsonify({
        "msg": "Email confirmé. Votre inscription attend maintenant la validation de l’administrateur."
    }), 200


@app.route("/api/auth/resend-code", methods=["POST"])
def resend_register_code():
    data = request.get_json() or {}
    email = data.get("email")

    if not email:
        return jsonify({"msg": "Email obligatoire"}), 400

    email = str(email).strip().lower()
    pending = PendingUser.query.filter_by(email=email).first()

    if not pending:
        return jsonify({"msg": "Demande introuvable"}), 404

    if pending.status != "email_pending":
        return jsonify({"msg": "Cet email est déjà confirmé"}), 400

    code = generate_code()
    pending.verification_code = code
    pending.verification_code_created_at = datetime.utcnow()

    db.session.commit()

    send_email_code(email, "Code de vérification Albatros", code)

    return jsonify({"msg": "Code renvoyé à votre email"}), 200


@app.route("/api/auth/login", methods=["POST"])
def api_login():
    data = request.get_json() or {}

    identifier = data.get("identifier")
    password = data.get("password")

    if not identifier or not password:
        return jsonify({"msg": "Identifiant et mot de passe obligatoires"}), 400

    identifier = str(identifier).strip()

    if "@" in identifier:
        user = User.query.filter_by(email=identifier.lower()).first()
    else:
        user = User.query.filter_by(massar=identifier).first()

    if not user or not user.check_password(password):
        return jsonify({"msg": "Identifiants incorrects"}), 401

    if user.two_factor_enabled:
        code = generate_code()
        user.two_factor_code = code
        user.two_factor_code_created_at = datetime.utcnow()
        db.session.commit()

        send_email_code(user.email, "Code de connexion Albatros", code)

        return jsonify({
            "msg": "Code 2FA envoyé à votre email",
            "requires_2fa": True,
            "user_id": user.id
        }), 200

    update_streak_and_rewards(user)

    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        "access_token": access_token,
        "user": user.to_dict()
    }), 200


@app.route("/api/auth/verify-2fa", methods=["POST"])
def verify_2fa():
    data = request.get_json() or {}

    user_id = data.get("user_id")
    code = data.get("code")

    if not user_id or not code:
        return jsonify({"msg": "Utilisateur et code obligatoires"}), 400

    user = User.query.get(user_id)

    if not user:
        return jsonify({"msg": "Utilisateur introuvable"}), 404

    if not user.two_factor_enabled:
        return jsonify({"msg": "2FA non activée"}), 400

    if user.two_factor_code != str(code).strip():
        return jsonify({"msg": "Code incorrect"}), 400

    if not code_is_valid(user.two_factor_code_created_at):
        return jsonify({"msg": "Code expiré"}), 400

    user.two_factor_code = None
    user.two_factor_code_created_at = None

    update_streak_and_rewards(user)

    db.session.commit()

    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        "access_token": access_token,
        "user": user.to_dict()
    }), 200


@app.route("/api/user/me", methods=["GET"])
@jwt_required()
def api_user_me():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    if not user:
        return jsonify({"msg": "Utilisateur introuvable"}), 404

    return jsonify(user.to_dict()), 200


@app.route("/api/account/change-password", methods=["POST"])
@jwt_required()
def change_password():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    data = request.get_json() or {}

    current_password = data.get("current_password")
    new_password = data.get("new_password")

    if not current_password or not new_password:
        return jsonify({"msg": "Mot de passe actuel et nouveau mot de passe obligatoires"}), 400

    if not user.check_password(current_password):
        return jsonify({"msg": "Mot de passe actuel incorrect"}), 400

    if len(new_password) < 6:
        return jsonify({"msg": "Le nouveau mot de passe doit contenir au moins 6 caractères"}), 400

    user.set_password(new_password)

    db.session.commit()

    return jsonify({"msg": "Mot de passe modifié avec succès"}), 200


@app.route("/api/account/change-email/request", methods=["POST"])
@jwt_required()
def request_email_change():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    data = request.get_json() or {}

    new_email = data.get("new_email")

    if not new_email:
        return jsonify({"msg": "Nouvel email obligatoire"}), 400

    if user.role != "teacher":
        return jsonify({"msg": "Seuls les enseignants peuvent modifier leur email"}), 403

    new_email = str(new_email).strip().lower()

    if User.query.filter(User.email == new_email, User.id != user.id).first():
        return jsonify({"msg": "Email déjà utilisé"}), 400

    if PendingUser.query.filter_by(email=new_email).first():
        return jsonify({"msg": "Email déjà utilisé dans une demande en attente"}), 400

    code = generate_code()

    user.pending_email = new_email
    user.pending_email_code = code
    user.pending_email_code_created_at = datetime.utcnow()

    db.session.commit()

    send_email_code(new_email, "Confirmation du nouvel email Albatros", code)

    return jsonify({"msg": "Code de confirmation envoyé au nouvel email"}), 200


@app.route("/api/account/change-email/confirm", methods=["POST"])
@jwt_required()
def confirm_email_change():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    data = request.get_json() or {}

    code = data.get("code")

    if user.role != "teacher":
        return jsonify({"msg": "Seuls les enseignants peuvent modifier leur email"}), 403

    if not code:
        return jsonify({"msg": "Code obligatoire"}), 400

    if not user.pending_email:
        return jsonify({"msg": "Aucune demande de changement d'email"}), 400

    if user.pending_email_code != str(code).strip():
        return jsonify({"msg": "Code incorrect"}), 400

    if not code_is_valid(user.pending_email_code_created_at):
        return jsonify({"msg": "Code expiré"}), 400

    user.email = user.pending_email
    user.pending_email = None
    user.pending_email_code = None
    user.pending_email_code_created_at = None

    db.session.commit()

    return jsonify({
        "msg": "Email modifié avec succès",
        "user": user.to_dict()
    }), 200


@app.route("/api/account/2fa/enable", methods=["POST"])
@jwt_required()
def enable_2fa():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    user.two_factor_enabled = True

    db.session.commit()

    return jsonify({
        "msg": "2FA activée avec succès",
        "user": user.to_dict()
    }), 200


@app.route("/api/account/2fa/disable", methods=["POST"])
@jwt_required()
def disable_2fa():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    data = request.get_json() or {}

    password = data.get("password")

    if not password:
        return jsonify({"msg": "Mot de passe obligatoire"}), 400

    if not user.check_password(password):
        return jsonify({"msg": "Mot de passe incorrect"}), 400

    user.two_factor_enabled = False
    user.two_factor_code = None
    user.two_factor_code_created_at = None

    db.session.commit()

    return jsonify({
        "msg": "2FA désactivée avec succès",
        "user": user.to_dict()
    }), 200


@app.route("/api/courses", methods=["GET"])
def api_get_courses():
    return jsonify(static_courses), 200


@app.route("/api/courses/<int:course_id>", methods=["GET"])
def api_get_course(course_id):
    course = next((c for c in static_courses if c["id"] == course_id), None)

    if course is None:
        return jsonify({"msg": "Course not found"}), 404

    return jsonify(course), 200


@app.route("/api/student/gaps", methods=["GET"])
@jwt_required()
def api_student_gaps():
    user_id = get_jwt_identity()
    return jsonify(get_gaps(int(user_id))), 200


@app.route("/api/student/exercises", methods=["GET"])
@jwt_required()
def api_student_exercises():
    user_id = get_jwt_identity()
    exercises = generate_personalized_exercises(int(user_id))
    return jsonify(exercises), 200


@app.route("/api/student/calendar", methods=["GET"])
@jwt_required()
def api_student_calendar():
    user_id = get_jwt_identity()
    today = date.today()
    start_date = today - timedelta(days=60)

    activities = UserActivity.query.filter(
        UserActivity.user_id == int(user_id),
        UserActivity.activity_date >= start_date
    ).all()

    activity_map = {act.activity_date: act for act in activities}
    calendar_data = []

    for i in range(35):
        d = today - timedelta(days=34 - i)
        act = activity_map.get(d)

        calendar_data.append({
            "date": d.isoformat(),
            "active": act is not None,
            "xp": act.xp_earned if act else 0,
            "used_freeze": act.used_flame_freeze if act else False
        })

    return jsonify(calendar_data), 200


@app.route("/api/student/courses", methods=["GET"])
@jwt_required()
def get_student_courses():
    user_id = get_jwt_identity()
    db_courses = Course.query.all()
    result = []

    for course in db_courses:
        quizzes = Quiz.query.filter_by(subject_id=course.subject_id).all()
        quiz_ids = [q.id for q in quizzes]

        if quiz_ids:
            quiz_results = QuizResult.query.filter(
                QuizResult.user_id == int(user_id),
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


@app.route("/api/student/results", methods=["GET"])
@jwt_required()
def api_student_results():
    user_id = get_jwt_identity()

    results = QuizResult.query.filter_by(
        user_id=int(user_id)
    ).order_by(QuizResult.date_taken.desc()).all()

    return jsonify([{
        "quiz_id": r.quiz_id,
        "score": r.score,
        "date": r.date_taken.isoformat()
    } for r in results]), 200


@app.route("/api/student/recommendations", methods=["GET"])
@jwt_required()
def api_student_recommendations():
    user_id = get_jwt_identity()
    exercises = generate_personalized_exercises(int(user_id), limit=4)
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


@app.route("/api/student/quests", methods=["GET"])
@jwt_required()
def api_student_quests():
    user_id = get_jwt_identity()
    create_weekly_quests_for_user(int(user_id))
    quests = get_weekly_quests(int(user_id))
    return jsonify(quests), 200


@app.route("/api/student/claim_quest/<int:progress_id>", methods=["POST"])
@jwt_required()
def api_claim_quest(progress_id):
    user_id = get_jwt_identity()
    prog = UserQuestProgress.query.get_or_404(progress_id)

    if prog.user_id != int(user_id) or not prog.completed or prog.claimed:
        return jsonify({"msg": "Action non autorisée"}), 400

    user = User.query.get(int(user_id))

    user.gems += prog.quest.reward_gems
    user.total_xp += prog.quest.reward_xp
    prog.claimed = True

    db.session.commit()

    return jsonify({
        "msg": "Récompense obtenue",
        "gems": user.gems,
        "xp": user.total_xp
    }), 200


@app.route("/api/quizzes", methods=["GET"])
@jwt_required()
def get_quizzes():
    quizzes = Quiz.query.all()

    return jsonify([{
        "id": q.id,
        "title": q.title,
        "difficulty": q.difficulty
    } for q in quizzes]), 200


@app.route("/api/quiz/<int:quiz_id>/questions", methods=["GET"])
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


@app.route("/api/quiz/<int:quiz_id>/submit", methods=["POST"])
@jwt_required()
def api_submit_quiz(quiz_id):
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    answers = data.get("answers", {})
    result = evaluate_quiz(int(user_id), quiz_id, answers)

    return jsonify(result), 200


@app.route("/api/admin/users", methods=["GET"])
@jwt_role_required("admin")
def admin_users():
    users = User.query.all()

    return jsonify([{
        "id": u.id,
        "massar": u.massar,
        "username": u.username,
        "email": u.email,
        "role": u.role,
        "level": u.level,
        "subject": u.subject,
        "email_verified": u.email_verified,
        "two_factor_enabled": u.two_factor_enabled,
    } for u in users]), 200


@app.route("/api/admin/users/teacher", methods=["POST"])
@jwt_role_required("admin")
def admin_add_teacher():
    data = request.get_json() or {}

    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    subject = data.get("subject")

    if not username or not email or not password or not subject:
        return jsonify({"msg": "Nom, email, mot de passe et matière obligatoires"}), 400

    username = str(username).strip()
    email = str(email).strip().lower()
    subject = str(subject).strip()

    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({"msg": "Nom ou email déjà utilisé"}), 400

    if PendingUser.query.filter((PendingUser.username == username) | (PendingUser.email == email)).first():
        return jsonify({"msg": "Nom ou email déjà utilisé dans une demande en attente"}), 400

    teacher = User(
        massar=None,
        username=username,
        email=email,
        role="teacher",
        subject=subject,
        email_verified=True
    )

    teacher.set_password(password)

    db.session.add(teacher)
    db.session.commit()

    return jsonify({
        "msg": "Enseignant ajouté avec succès",
        "user": teacher.to_dict()
    }), 201


@app.route("/api/admin/users/student", methods=["POST"])
@jwt_role_required("admin")
def admin_add_student():
    data = request.get_json() or {}

    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    massar = data.get("massar")
    level = data.get("level")

    if not username or not email or not password or not massar:
        return jsonify({"msg": "Nom, email, mot de passe et Massar obligatoires"}), 400

    username = str(username).strip()
    email = str(email).strip().lower()
    massar = str(massar).strip()
    level = str(level).strip() if level else None

    if User.query.filter((User.username == username) | (User.email == email) | (User.massar == massar)).first():
        return jsonify({"msg": "Nom, email ou Massar déjà utilisé"}), 400

    if PendingUser.query.filter((PendingUser.username == username) | (PendingUser.email == email) | (PendingUser.massar == massar)).first():
        return jsonify({"msg": "Nom, email ou Massar déjà utilisé dans une demande en attente"}), 400

    student = User(
        massar=massar,
        username=username,
        email=email,
        role="student",
        level=level,
        email_verified=True
    )

    student.set_password(password)

    db.session.add(student)
    db.session.commit()

    return jsonify({
        "msg": "Élève ajouté avec succès",
        "user": student.to_dict()
    }), 201


@app.route("/api/admin/users/<int:user_id>", methods=["DELETE"])
@jwt_role_required("admin")
def admin_delete_user(user_id):
    current_id = int(get_jwt_identity())

    if user_id == current_id:
        return jsonify({"msg": "Vous ne pouvez pas supprimer votre propre compte"}), 400

    user = User.query.get_or_404(user_id)

    if user.role == "admin":
        return jsonify({"msg": "Impossible de supprimer un administrateur"}), 400

    QuizResult.query.filter_by(user_id=user.id).delete()
    Gap.query.filter_by(user_id=user.id).delete()
    InventoryItem.query.filter_by(user_id=user.id).delete()
    UserActivity.query.filter_by(user_id=user.id).delete()
    UserQuestProgress.query.filter_by(user_id=user.id).delete()
    Friend.query.filter((Friend.user_id == user.id) | (Friend.friend_id == user.id)).delete(synchronize_session=False)

    if user.role == "teacher":
        courses = Course.query.filter_by(teacher_id=user.id).all()

        for course in courses:
            Exercise.query.filter_by(course_id=course.id).delete()
            db.session.delete(course)

    db.session.delete(user)
    db.session.commit()

    return jsonify({"msg": "Utilisateur supprimé avec succès"}), 200


@app.route("/api/admin/stats/users", methods=["GET"])
@jwt_role_required("admin")
def admin_stats_users():
    return jsonify({
        "total": User.query.count(),
        "students": User.query.filter_by(role="student").count(),
        "teachers": User.query.filter_by(role="teacher").count(),
        "admins": User.query.filter_by(role="admin").count(),
        "pending": PendingUser.query.filter_by(status="pending").count()
    }), 200


@app.route("/api/admin/stats/subjects", methods=["GET"])
@jwt_role_required("admin")
def admin_stats_subjects():
    return jsonify({"count": Subject.query.count()}), 200


@app.route("/api/admin/stats/content", methods=["GET"])
@jwt_role_required("admin")
def admin_stats_content():
    courses_count = Course.query.count()
    exercises_count = Exercise.query.count()
    quizzes_count = Quiz.query.count()

    return jsonify({
        "total": courses_count + exercises_count + quizzes_count,
        "courses": courses_count,
        "exercises": exercises_count,
        "quizzes": quizzes_count
    }), 200


@app.route("/api/admin/pending_users", methods=["GET"])
@jwt_role_required("admin")
def admin_pending_users():
    pendings = PendingUser.query.filter_by(status="pending").all()

    return jsonify([p.to_dict() for p in pendings]), 200


@app.route("/api/admin/approve_user/<int:pending_id>", methods=["POST"])
@jwt_role_required("admin")
def admin_approve_user(pending_id):
    pending = PendingUser.query.get_or_404(pending_id)

    if pending.status != "pending":
        return jsonify({"msg": "Utilisateur déjà traité ou email non confirmé"}), 400

    if not pending.email_verified:
        return jsonify({"msg": "Email non confirmé"}), 400

    data = request.get_json() or {}
    role = data.get("role", pending.role)
    subject = data.get("subject", pending.subject)

    if role not in ["student", "teacher"]:
        return jsonify({"msg": "Rôle invalide"}), 400

    if role == "teacher" and not subject:
        return jsonify({"msg": "La matière est obligatoire pour un enseignant"}), 400

    if User.query.filter((User.username == pending.username) | (User.email == pending.email)).first():
        return jsonify({"msg": "Nom ou email déjà utilisé"}), 400

    if pending.massar and User.query.filter_by(massar=pending.massar).first():
        return jsonify({"msg": "Massar déjà utilisé"}), 400

    new_user = User(
        massar=pending.massar if role == "student" else None,
        username=pending.username,
        email=pending.email,
        role=role,
        level=pending.level if role == "student" else None,
        subject=subject if role == "teacher" else None,
        email_verified=True
    )

    new_user.password_hash = pending.password_hash

    db.session.add(new_user)
    db.session.flush()

    pending.status = "approved"
    pending.user_id = new_user.id

    db.session.commit()

    send_simple_email(
        pending.email,
        "Votre compte Albatros a été approuvé",
        (
            f"Bonjour {pending.username},\n\n"
            f"Votre compte Albatros a été approuvé.\n"
            f"Vous pouvez maintenant vous connecter.\n\n"
            f"Cordialement,\nL'équipe Albatros"
        )
    )

    return jsonify({"msg": "Utilisateur approuvé"}), 200


@app.route("/api/admin/reject_user/<int:pending_id>", methods=["POST"])
@jwt_role_required("admin")
def admin_reject_user(pending_id):
    pending = PendingUser.query.get_or_404(pending_id)

    if pending.status not in ["pending", "email_pending"]:
        return jsonify({"msg": "Utilisateur déjà traité"}), 400

    pending.status = "rejected"

    db.session.commit()

    send_simple_email(
        pending.email,
        "Votre inscription sur Albatros n'a pas été retenue",
        (
            f"Bonjour {pending.username},\n\n"
            f"Désolé, votre inscription n'a pas été validée par l'administrateur.\n\n"
            f"Cordialement,\nL'équipe Albatros"
        )
    )

    return jsonify({"msg": "Inscription rejetée"}), 200


@app.route("/api/teacher/stats", methods=["GET"])
@jwt_role_required("teacher", "admin")
def teacher_stats():
    user_id = get_jwt_identity()

    courses_count = Course.query.filter_by(teacher_id=int(user_id)).count()
    exercises_count = Exercise.query.join(Course).filter(Course.teacher_id == int(user_id)).count()
    students_count = User.query.filter_by(role="student").count()

    return jsonify({
        "courses": courses_count,
        "exercises": exercises_count,
        "students": students_count
    }), 200


@app.route("/api/teacher/courses", methods=["GET"])
@jwt_role_required("teacher", "admin")
def get_teacher_courses():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    if user.role == "admin":
        db_courses = Course.query.all()
    else:
        db_courses = Course.query.filter_by(teacher_id=int(user_id)).all()

    return jsonify([{
        "id": c.id,
        "title": c.title,
        "description": c.description,
        "subject_id": c.subject_id,
        "difficulty": c.difficulty,
        "tags": c.tags,
    } for c in db_courses]), 200


@app.route("/api/teacher/upload_course", methods=["POST"])
@jwt_role_required("teacher", "admin")
def upload_teacher_course():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    title = request.form.get("title")
    subject_id = request.form.get("subject_id")
    difficulty = request.form.get("difficulty", "medium")
    file = request.files.get("file")

    if not title or not file:
        return jsonify({"msg": "Titre et fichier obligatoires"}), 400

    if user.role == "teacher":
        if not user.subject:
            return jsonify({"msg": "Aucune matière assignée à cet enseignant"}), 400

        subject = Subject.query.filter_by(name=user.subject).first()

        if not subject:
            subject = Subject(name=user.subject, description=f"{user.subject} courses")
            db.session.add(subject)
            db.session.flush()

        subject_id = subject.id

    if not subject_id:
        return jsonify({"msg": "Matière obligatoire"}), 400

    course = Course(
        title=title,
        description=f"Course created from uploaded document: {file.filename}",
        subject_id=int(subject_id),
        teacher_id=int(user_id),
        difficulty=difficulty,
        content_url=file.filename,
        tags=difficulty,
    )

    db.session.add(course)
    db.session.commit()

    return jsonify({
        "msg": "Course created",
        "id": course.id
    }), 201


@app.route("/api/teacher/courses/<int:course_id>", methods=["DELETE"])
@jwt_role_required("teacher", "admin")
def delete_course(course_id):
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    course = Course.query.get_or_404(course_id)

    if user.role != "admin" and course.teacher_id != int(user_id):
        return jsonify({"msg": "Unauthorized"}), 403

    Exercise.query.filter_by(course_id=course.id).delete()

    db.session.delete(course)
    db.session.commit()

    return jsonify({"msg": "Course deleted"}), 200


@app.route("/api/teacher/exercises", methods=["GET"])
@jwt_role_required("teacher", "admin")
def get_teacher_exercises():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    if user.role == "admin":
        exercises = Exercise.query.all()
    else:
        exercises = Exercise.query.join(Course).filter(Course.teacher_id == int(user_id)).all()

    return jsonify([{
        "id": e.id,
        "course_id": e.course_id,
        "question_text": e.question_text,
        "difficulty": e.difficulty,
        "tags": e.tags
    } for e in exercises]), 200


@app.route("/api/teacher/exercises", methods=["POST"])
@jwt_role_required("teacher", "admin")
def create_exercise():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    data = request.get_json() or {}

    course = Course.query.get(data.get("course_id"))

    if not course:
        return jsonify({"msg": "Course not found"}), 404

    if user.role != "admin" and course.teacher_id != int(user_id):
        return jsonify({"msg": "Unauthorized"}), 403

    if not data.get("question_text") or not data.get("correct_answer"):
        return jsonify({"msg": "Question et réponse obligatoire"}), 400

    exercise = Exercise(
        course_id=data["course_id"],
        question_text=data["question_text"],
        correct_answer=data["correct_answer"],
        explanation=data.get("explanation", ""),
        difficulty=data.get("difficulty", "easy"),
        tags=data.get("tags", "")
    )

    db.session.add(exercise)
    db.session.commit()

    return jsonify({
        "msg": "Exercise created",
        "id": exercise.id
    }), 201


@app.route("/api/teacher/progress", methods=["GET"])
@jwt_role_required("teacher", "admin")
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


@app.route("/api/teacher/students", methods=["GET"])
@jwt_role_required("teacher", "admin")
def teacher_students():
    students = User.query.filter_by(role="student").all()
    result = []

    for student in students:
        results = QuizResult.query.filter_by(user_id=student.id).all()
        progress = round(sum(r.score for r in results) / len(results)) if results else 0

        result.append({
            "id": student.id,
            "username": student.username,
            "email": student.email,
            "progress": progress
        })

    return jsonify(result), 200


@app.route("/api/friends/add", methods=["POST"])
@jwt_required()
def api_add_friend():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    friend_massar = data.get("massar")

    friend = User.query.filter_by(massar=friend_massar).first()

    if not friend or friend.id == int(user_id):
        return jsonify({"msg": "Utilisateur non trouvé"}), 404

    existing = Friend.query.filter(
        ((Friend.user_id == int(user_id)) & (Friend.friend_id == friend.id)) |
        ((Friend.user_id == friend.id) & (Friend.friend_id == int(user_id)))
    ).first()

    if existing:
        return jsonify({"msg": "Demande déjà envoyée ou déjà ami"}), 400

    friendship = Friend(
        user_id=int(user_id),
        friend_id=friend.id,
        status="pending"
    )

    db.session.add(friendship)
    db.session.commit()

    return jsonify({"msg": "Demande envoyée"}), 201


@app.route("/api/friends/accept/<int:friendship_id>", methods=["POST"])
@jwt_required()
def api_accept_friend(friendship_id):
    user_id = get_jwt_identity()
    friendship = Friend.query.get_or_404(friendship_id)

    if friendship.friend_id != int(user_id) or friendship.status != "pending":
        return jsonify({"msg": "Action non autorisée"}), 400

    friendship.status = "accepted"

    db.session.commit()

    return jsonify({"msg": "Ami ajouté"}), 200


@app.route("/api/leaderboard", methods=["GET"])
@jwt_required()
def api_leaderboard():
    user_id = get_jwt_identity()

    friends = Friend.query.filter(
        ((Friend.user_id == int(user_id)) | (Friend.friend_id == int(user_id))),
        Friend.status == "accepted"
    ).all()

    friend_ids = {int(user_id)}

    for f in friends:
        friend_ids.add(f.user_id if f.friend_id == int(user_id) else f.friend_id)

    users = User.query.filter(User.id.in_(friend_ids)).order_by(User.total_xp.desc()).all()

    return jsonify([u.to_dict() for u in users]), 200


@app.route("/student/dashboard")
def student_dashboard():
    return redirect(f"{FRONTEND_URL}/student")


@app.route("/teacher/dashboard")
def teacher_dashboard():
    return redirect(f"{FRONTEND_URL}/teacher")


@app.route("/admin/dashboard")
def admin_dashboard():
    return redirect(f"{FRONTEND_URL}/admin")


@app.route("/admin/add_teacher", methods=["GET", "POST"])
def add_teacher():
    return redirect(f"{FRONTEND_URL}/admin/users")


@app.route("/admin/create_admin", methods=["GET", "POST"])
def create_admin():
    return redirect(f"{FRONTEND_URL}/admin/users")


@app.route("/buy_flame_freeze")
@login_required
def buy_flame_freeze():
    if current_user.gems >= 20:
        current_user.gems -= 20

        item = InventoryItem.query.filter_by(
            user_id=current_user.id,
            item_type="flame_freeze"
        ).first()

        if not item:
            item = InventoryItem(
                user_id=current_user.id,
                item_type="flame_freeze",
                quantity=0
            )
            db.session.add(item)

        item.quantity += 1

        db.session.commit()
        flash("Gel acheté !")
    else:
        flash("Pas assez de gems.")

    return redirect(f"{FRONTEND_URL}/student")
@app.route("/api/test-email", methods=["POST"])
def test_email():
    data = request.get_json() or {}
    email = data.get("email")

    if not email:
        return jsonify({"msg": "Email obligatoire"}), 400

    code = generate_code()
    sent = send_email_code(email, "Test code Albatros", code)

    return jsonify({
        "msg": "Test email executed",
        "sent": sent,
        "email": email,
        "code": code
    }), 200

if __name__ == "__main__":
# Enregistrement des blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(student_bp)
app.register_blueprint(teacher_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(common_bp)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        create_default_subjects()
        init_default_quests()

        if User.query.filter_by(role="admin").count() == 0:
            admin = User(
                massar=None,
                username="admin",
                email="admin@albatros.ma",
                role="admin",
                email_verified=True
            )

            admin.set_password("admin123")

            db.session.add(admin)
            db.session.commit()

            print("Admin créé: email=admin@albatros.ma, password=admin123")

    app.run(debug=True)