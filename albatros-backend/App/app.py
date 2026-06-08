import os
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
CORS(app, origins=["http://localhost:5173"], supports_credentials=True)
jwt = JWTManager(app)
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

# Enregistrement des blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(student_bp)
app.register_blueprint(teacher_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(common_bp)

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