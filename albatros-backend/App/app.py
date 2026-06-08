import os
import random
from datetime import datetime, timedelta
from functools import wraps

from dotenv import load_dotenv
from flask import Flask, jsonify, redirect, request   # ← request ajouté
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_login import LoginManager
from flask_mail import Mail

from db import db
from helpers import init_default_quests
from models import User, Subject

# Import des blueprints
from routes.auth_routes import auth_bp
from routes.student_routes import student_bp
from routes.teacher_routes import teacher_bp
from routes.admin_routes import admin_bp
from routes.common_routes import common_bp

load_dotenv()

basedir = os.path.abspath(os.path.dirname(__file__))
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")

app = Flask(__name__)

# Configurations
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-key-change-me")
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + os.path.join(basedir, "users.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Upload
app.config["UPLOAD_FOLDER"] = os.path.join(basedir, "course_files")
os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024

# Email
app.config["MAIL_SERVER"] = os.environ.get("MAIL_SERVER", "smtp.gmail.com")
app.config["MAIL_PORT"] = int(os.environ.get("MAIL_PORT", 587))
app.config["MAIL_USE_TLS"] = os.environ.get("MAIL_USE_TLS", "true").lower() in ["true", "1", "yes", "on"]
app.config["MAIL_USE_SSL"] = os.environ.get("MAIL_USE_SSL", "false").lower() in ["true", "1", "yes", "on"]
app.config["MAIL_USERNAME"] = os.environ.get("MAIL_USERNAME")
app.config["MAIL_PASSWORD"] = os.environ.get("MAIL_PASSWORD")
app.config["MAIL_DEFAULT_SENDER"] = os.environ.get("MAIL_DEFAULT_SENDER", "no-reply@albatros.com")
app.config["EMAIL_DEBUG_TO_TERMINAL"] = os.environ.get("EMAIL_DEBUG_TO_TERMINAL", "true").lower() in ["true", "1", "yes", "on"]

# JWT
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)

# Extensions
db.init_app(app)
CORS(app, origins=[FRONTEND_URL], supports_credentials=True)
jwt = JWTManager(app)
mail = Mail(app)
app.extensions["mail"] = mail

login_manager = LoginManager(app)
login_manager.login_view = None
login_manager.login_message = "Veuillez vous connecter."

# Blueprints
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(student_bp, url_prefix="/api/student")
app.register_blueprint(teacher_bp, url_prefix="/api/teacher")
app.register_blueprint(admin_bp, url_prefix="/api/admin")
app.register_blueprint(common_bp, url_prefix="/api")


# Routes simples
@app.route("/")
def index():
    return jsonify({
        "msg": "Albatros backend is running",
        "frontend": FRONTEND_URL
    }), 200

@app.route("/test-email", methods=["POST"])
def test_email():
    from helpers import generate_code, send_email_code
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
        "code": code if app.config["EMAIL_DEBUG_TO_TERMINAL"] else None
    }), 200

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        init_default_quests()

        # Création d'un admin par défaut s'il n'existe pas
        if User.query.filter_by(role="admin").count() == 0:
            admin = User(
                massar=None,
                username="admin",
                email="admin@albatros.ma",
                role="admin",
                email_verified=True
            )
            admin.set_password("123")
            db.session.add(admin)
            db.session.commit()
            print("Admin créé: email=admin@albatros.ma, password=123")

    app.run(debug=True)