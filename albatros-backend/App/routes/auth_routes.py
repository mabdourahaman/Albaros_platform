from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from db import db
from helpers import update_streak_and_rewards
from flask import current_app
from flask_mail import Message
from models import User, PendingUser, PasswordReset   # ajoutez PasswordReset

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
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

@auth_bp.route('/login', methods=['POST'])
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


@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    data = request.get_json()
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    
    if not current_password or not new_password:
        return jsonify({'msg': 'Missing passwords'}), 400
    if not user.check_password(current_password):
        return jsonify({'msg': 'Current password is incorrect'}), 401
    
    user.set_password(new_password)
    db.session.commit()
    
    # Envoyer un email à l'utilisateur
    try:
        mail = current_app.extensions.get('mail')
        if mail:
            msg = Message("Your Albatros password has been changed", recipients=[user.email])
            msg.body = f"Hello {user.username},\n\nYour password has been successfully changed. If you did not perform this action, please contact support immediately.\n\nBest regards,\nThe Albatros team"
            mail.send(msg)
    except Exception as e:
        print(f"Email error: {e}")
    
    return jsonify({'msg': 'Password changed successfully'}), 200

import random
from datetime import datetime, timedelta

# Demande de changement (étape 1)
@auth_bp.route('/request-password-change', methods=['POST'])
@jwt_required()
def request_password_change():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    data = request.get_json()
    current_password = data.get('current_password')
    
    if not current_password:
        return jsonify({'msg': 'Current password required'}), 400
    if not user.check_password(current_password):
        return jsonify({'msg': 'Current password is incorrect'}), 401
    
    # Générer un code à 6 chiffres
    code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    
    # Supprimer les anciens codes non utilisés pour cet utilisateur
    PasswordReset.query.filter_by(user_id=user_id, used=False).delete()
    
    # Enregistrer le nouveau code
    reset = PasswordReset(
        user_id=user_id,
        code=code,
        expires_at=datetime.utcnow() + timedelta(minutes=10),
        used=False
    )
    db.session.add(reset)
    db.session.commit()
    
    # Envoyer l'email avec le code
    try:
        mail = current_app.extensions.get('mail')
        if mail:
            msg = Message("Password change verification code", recipients=[user.email])
            msg.body = f"Hello {user.username},\n\nYour verification code is: {code}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nThe Albatros team"
            mail.send(msg)
    except Exception as e:
        print(f"Email error: {e}")
        return jsonify({'msg': 'Failed to send verification email'}), 500
    
    return jsonify({'msg': 'Verification code sent to your email'}), 200

# Vérification et changement (étape 2)
@auth_bp.route('/verify-and-change-password', methods=['POST'])
@jwt_required()
def verify_and_change_password():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    data = request.get_json()
    code = data.get('code')
    new_password = data.get('new_password')
    
    if not code or not new_password:
        return jsonify({'msg': 'Missing code or new password'}), 400
    
    # Chercher le code non utilisé et non expiré
    reset = PasswordReset.query.filter_by(user_id=user_id, code=code, used=False).first()
    if not reset:
        return jsonify({'msg': 'Invalid verification code'}), 400
    if reset.expires_at < datetime.utcnow():
        return jsonify({'msg': 'Verification code has expired'}), 400
    
    # Changer le mot de passe
    user.set_password(new_password)
    reset.used = True
    db.session.commit()
    
    # Envoyer un email de confirmation
    try:
        mail = current_app.extensions.get('mail')
        if mail:
            msg = Message("Your Albatros password has been changed", recipients=[user.email])
            msg.body = f"Hello {user.username},\n\nYour password has been successfully changed. If you did not perform this action, please contact support immediately.\n\nBest regards,\nThe Albatros team"
            mail.send(msg)
    except Exception as e:
        print(f"Email error: {e}")
    
    return jsonify({'msg': 'Password changed successfully'}), 200