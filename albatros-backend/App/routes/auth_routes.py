from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from db import db
from models import User, PendingUser, PasswordReset
from helpers import (
    update_streak_and_rewards,
    generate_code,
    code_is_valid,
    send_email_code,
    send_simple_email
)
import random
from datetime import datetime, timedelta

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


# ========== INSCRIPTION AVEC VÉRIFICATION EMAIL ==========
@auth_bp.route('/register', methods=['POST'])
def api_register():
    data = request.get_json()
    account_type = data.get('account_type', 'student')
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    massar = data.get('massar')
    level = data.get('level')
    subject = data.get('subject')

    if account_type not in ['student', 'teacher']:
        return jsonify({'msg': 'Type de compte invalide'}), 400
    if not username or not email or not password:
        return jsonify({'msg': 'Nom, email et mot de passe obligatoires'}), 400

    username = str(username).strip()
    email = str(email).strip().lower()
    password = str(password)
    if massar:
        massar = str(massar).strip().upper()
    if level:
        level = str(level).strip()
    if subject:
        subject = str(subject).strip()

    if len(password) < 6:
        return jsonify({'msg': 'Le mot de passe doit contenir au moins 6 caractères'}), 400

    if account_type == 'student':
        if not massar:
            return jsonify({'msg': 'Le code Massar est obligatoire pour les élèves'}), 400
        if not level:
            return jsonify({'msg': 'Le niveau scolaire est obligatoire pour les élèves'}), 400

    if account_type == 'teacher' and not subject:
        return jsonify({'msg': 'La matière est obligatoire pour les enseignants'}), 400

    # Vérifier les doublons dans User
    if User.query.filter_by(email=email).first():
        return jsonify({'msg': 'Email déjà utilisé'}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({'msg': 'Nom complet déjà utilisé'}), 400
    if account_type == 'student' and User.query.filter_by(massar=massar).first():
        return jsonify({'msg': 'Massar déjà utilisé'}), 400

    # Vérifier les doublons dans PendingUser
    existing_pending_email = PendingUser.query.filter_by(email=email).first()
    if existing_pending_email:
        if existing_pending_email.status == 'email_pending':
            # Renvoyer un nouveau code
            code = generate_code()
            existing_pending_email.username = username
            existing_pending_email.role = account_type
            existing_pending_email.massar = massar if account_type == 'student' else None
            existing_pending_email.level = level if account_type == 'student' else None
            existing_pending_email.subject = subject if account_type == 'teacher' else None
            existing_pending_email.verification_code = code
            existing_pending_email.verification_code_created_at = datetime.utcnow()
            existing_pending_email.email_verified = False
            existing_pending_email.set_password(password)
            db.session.commit()
            send_email_code(existing_pending_email.email, "Code de vérification Albatros", code)
            return jsonify({
                'msg': 'Un nouveau code de vérification a été envoyé à votre email.',
                'requires_email_verification': True,
                'email': existing_pending_email.email
            }), 200
        elif existing_pending_email.status == 'pending':
            return jsonify({'msg': 'Une demande avec cet email attend déjà la validation de l’administrateur'}), 400
        elif existing_pending_email.status == 'approved':
            return jsonify({'msg': 'Ce compte est déjà approuvé. Vous pouvez vous connecter.'}), 400
        elif existing_pending_email.status == 'rejected':
            db.session.delete(existing_pending_email)
            db.session.commit()

    if account_type == 'student' and massar:
        existing_pending_massar = PendingUser.query.filter_by(massar=massar).first()
        if existing_pending_massar and existing_pending_massar.status != 'rejected':
            return jsonify({'msg': 'Une demande avec ce Massar existe déjà'}), 400
        if existing_pending_massar and existing_pending_massar.status == 'rejected':
            db.session.delete(existing_pending_massar)
            db.session.commit()

    existing_pending_username = PendingUser.query.filter_by(username=username).first()
    if existing_pending_username and existing_pending_username.status != 'rejected':
        return jsonify({'msg': 'Ce nom complet est déjà utilisé dans une demande en attente'}), 400
    if existing_pending_username and existing_pending_username.status == 'rejected':
        db.session.delete(existing_pending_username)
        db.session.commit()

    code = generate_code()
    pending = PendingUser(
        massar=massar if account_type == 'student' else None,
        username=username,
        email=email,
        role=account_type,
        level=level if account_type == 'student' else None,
        subject=subject if account_type == 'teacher' else None,
        status='email_pending',
        email_verified=False,
        verification_code=code,
        verification_code_created_at=datetime.utcnow()
    )
    pending.set_password(password)
    db.session.add(pending)
    db.session.commit()
    send_email_code(email, "Code de vérification Albatros", code)
    return jsonify({
        'msg': 'Code de vérification envoyé à votre email.',
        'requires_email_verification': True,
        'email': email
    }), 201


@auth_bp.route('/verify-email', methods=['POST'])
def verify_email():
    data = request.get_json()
    email = data.get('email')
    code = data.get('code')
    if not email or not code:
        return jsonify({'msg': 'Email et code obligatoires'}), 400
    email = str(email).strip().lower()
    code = str(code).strip()
    pending = PendingUser.query.filter_by(email=email).first()
    if not pending:
        return jsonify({'msg': 'Demande introuvable'}), 404
    if pending.status != 'email_pending':
        return jsonify({'msg': 'Email déjà vérifié ou demande déjà traitée'}), 400
    if pending.verification_code != code:
        return jsonify({'msg': 'Code incorrect'}), 400
    if not code_is_valid(pending.verification_code_created_at):
        return jsonify({'msg': 'Code expiré'}), 400
    pending.email_verified = True
    pending.status = 'pending'
    pending.verification_code = None
    pending.verification_code_created_at = None
    db.session.commit()
    return jsonify({'msg': 'Email confirmé. Votre inscription attend maintenant la validation de l’administrateur.'}), 200


@auth_bp.route('/resend-code', methods=['POST'])
def resend_register_code():
    data = request.get_json()
    email = data.get('email')
    if not email:
        return jsonify({'msg': 'Email obligatoire'}), 400
    email = str(email).strip().lower()
    pending = PendingUser.query.filter_by(email=email).first()
    if not pending:
        return jsonify({'msg': 'Demande introuvable'}), 404
    if pending.status != 'email_pending':
        return jsonify({'msg': 'Cet email est déjà confirmé'}), 400
    code = generate_code()
    pending.verification_code = code
    pending.verification_code_created_at = datetime.utcnow()
    db.session.commit()
    send_email_code(email, "Code de vérification Albatros", code)
    return jsonify({'msg': 'Code renvoyé à votre email'}), 200


# ========== CONNEXION (avec 2FA) ==========
@auth_bp.route('/login', methods=['POST'])
def api_login():
    data = request.get_json()
    identifier = data.get('identifier')
    password = data.get('password')
    if not identifier or not password:
        return jsonify({'msg': 'Identifiant et mot de passe requis'}), 400
    identifier = str(identifier).strip()
    user = None
    if '@' in identifier:
        user = User.query.filter_by(email=identifier.lower()).first()
    else:
        user = User.query.filter_by(massar=identifier).first()
    if not user or not user.check_password(password):
        return jsonify({'msg': 'Identifiants incorrects'}), 401
    if user.two_factor_enabled:
        code = generate_code()
        user.two_factor_code = code
        user.two_factor_code_created_at = datetime.utcnow()
        db.session.commit()
        send_email_code(user.email, "Code de connexion Albatros", code)
        return jsonify({
            'msg': 'Code 2FA envoyé',
            'requires_2fa': True,
            'user_id': user.id
        }), 200
    update_streak_and_rewards(user)
    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        'access_token': access_token,
        'user': user.to_dict()
    }), 200


@auth_bp.route('/verify-2fa', methods=['POST'])
def verify_2fa():
    data = request.get_json()
    user_id = data.get('user_id')
    code = data.get('code')
    if not user_id or not code:
        return jsonify({'msg': 'Utilisateur et code obligatoires'}), 400
    user = User.query.get(user_id)
    if not user:
        return jsonify({'msg': 'Utilisateur introuvable'}), 404
    if not user.two_factor_enabled:
        return jsonify({'msg': '2FA non activée'}), 400
    if user.two_factor_code != str(code).strip():
        return jsonify({'msg': 'Code incorrect'}), 400
    if not code_is_valid(user.two_factor_code_created_at):
        return jsonify({'msg': 'Code expiré'}), 400
    user.two_factor_code = None
    user.two_factor_code_created_at = None
    update_streak_and_rewards(user)
    db.session.commit()
    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        'access_token': access_token,
        'user': user.to_dict()
    }), 200


# ========== CHANGEMENT DE MOT DE PASSE SÉCURISÉ (2 étapes) ==========
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
    code = generate_code()
    PasswordReset.query.filter_by(user_id=user_id, used=False).delete()
    reset = PasswordReset(
        user_id=user_id,
        code=code,
        expires_at=datetime.utcnow() + timedelta(minutes=10),
        used=False
    )
    db.session.add(reset)
    db.session.commit()
    send_email_code(user.email, "Password change verification code", code)
    return jsonify({'msg': 'Verification code sent to your email'}), 200


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
    reset = PasswordReset.query.filter_by(user_id=user_id, code=code, used=False).first()
    if not reset:
        return jsonify({'msg': 'Invalid verification code'}), 400
    if reset.expires_at < datetime.utcnow():
        return jsonify({'msg': 'Verification code has expired'}), 400
    user.set_password(new_password)
    reset.used = True
    db.session.commit()
    send_simple_email(user.email, "Your Albatros password has been changed",
                      f"Hello {user.username},\n\nYour password has been successfully changed.\n\nBest regards,\nThe Albatros team")
    return jsonify({'msg': 'Password changed successfully'}), 200


# ========== CHANGEMENT D'EMAIL (enseignant) ==========
@auth_bp.route('/change-email/request', methods=['POST'])
@jwt_required()
def request_email_change():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if user.role != 'teacher':
        return jsonify({'msg': 'Seuls les enseignants peuvent modifier leur email'}), 403
    data = request.get_json()
    new_email = data.get('new_email')
    if not new_email:
        return jsonify({'msg': 'Nouvel email obligatoire'}), 400
    new_email = new_email.strip().lower()
    if User.query.filter(User.email == new_email, User.id != user.id).first():
        return jsonify({'msg': 'Email déjà utilisé'}), 400
    if PendingUser.query.filter_by(email=new_email).first():
        return jsonify({'msg': 'Email déjà utilisé dans une demande en attente'}), 400
    code = generate_code()
    user.pending_email = new_email
    user.pending_email_code = code
    user.pending_email_code_created_at = datetime.utcnow()
    db.session.commit()
    send_email_code(new_email, "Confirmation du nouvel email Albatros", code)
    return jsonify({'msg': 'Code de confirmation envoyé au nouvel email'}), 200


@auth_bp.route('/change-email/confirm', methods=['POST'])
@jwt_required()
def confirm_email_change():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if user.role != 'teacher':
        return jsonify({'msg': 'Seuls les enseignants peuvent modifier leur email'}), 403
    data = request.get_json()
    code = data.get('code')
    if not code:
        return jsonify({'msg': 'Code obligatoire'}), 400
    if not user.pending_email:
        return jsonify({'msg': 'Aucune demande de changement d\'email'}), 400
    if user.pending_email_code != str(code).strip():
        return jsonify({'msg': 'Code incorrect'}), 400
    if not code_is_valid(user.pending_email_code_created_at):
        return jsonify({'msg': 'Code expiré'}), 400
    user.email = user.pending_email
    user.pending_email = None
    user.pending_email_code = None
    user.pending_email_code_created_at = None
    db.session.commit()
    send_simple_email(user.email, "Votre email a été modifié",
                      f"Bonjour {user.username},\n\nVotre adresse email a été mise à jour avec succès.\n\nCordialement,\nL'équipe Albatros")
    return jsonify({'msg': 'Email modifié avec succès', 'user': user.to_dict()}), 200


# ========== 2FA : activation / désactivation ==========
@auth_bp.route('/2fa/enable', methods=['POST'])
@jwt_required()
def enable_2fa():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    user.two_factor_enabled = True
    db.session.commit()
    return jsonify({'msg': '2FA activée avec succès', 'user': user.to_dict()}), 200


@auth_bp.route('/2fa/disable', methods=['POST'])
@jwt_required()
def disable_2fa():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    data = request.get_json()
    password = data.get('password')
    if not password or not user.check_password(password):
        return jsonify({'msg': 'Mot de passe incorrect'}), 400
    user.two_factor_enabled = False
    user.two_factor_code = None
    user.two_factor_code_created_at = None
    db.session.commit()
    return jsonify({'msg': '2FA désactivée avec succès', 'user': user.to_dict()}), 200

# ========== RÉINITIALISATION DE MOT DE PASSE (sans session) ==========
@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Étape 1 : envoie un code de réinitialisation par email."""
    data = request.get_json()
    email = data.get('email')
    if not email:
        return jsonify({'msg': 'Email requis'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        # Sécurité : on ne révèle pas si l'email existe
        return jsonify({'msg': 'Si cet email existe, un code a été envoyé.'}), 200

    # Supprimer les anciens codes non utilisés
    PasswordReset.query.filter_by(user_id=user.id, used=False).delete()

    code = generate_code()
    reset = PasswordReset(
        user_id=user.id,
        code=code,
        expires_at=datetime.utcnow() + timedelta(minutes=10),
        used=False
    )
    db.session.add(reset)
    db.session.commit()

    send_email_code(user.email, "Réinitialisation de votre mot de passe Albatros", code)
    return jsonify({'msg': 'Un code de réinitialisation a été envoyé à votre adresse email.'}), 200


@auth_bp.route('/verify-reset-code', methods=['POST'])
def verify_reset_code():
    """Étape 2 : vérifie que le code est valide."""
    data = request.get_json()
    email = data.get('email')
    code = data.get('code')
    if not email or not code:
        return jsonify({'msg': 'Email et code requis'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'msg': 'Email invalide'}), 404

    reset = PasswordReset.query.filter_by(user_id=user.id, code=code, used=False).first()
    if not reset:
        return jsonify({'msg': 'Code invalide'}), 400
    if reset.expires_at < datetime.utcnow():
        return jsonify({'msg': 'Code expiré'}), 400

    return jsonify({'msg': 'Code valide'}), 200


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Étape 3 : change le mot de passe avec le code validé."""
    data = request.get_json()
    email = data.get('email')
    code = data.get('code')
    new_password = data.get('new_password')

    if not email or not code or not new_password:
        return jsonify({'msg': 'Email, code et nouveau mot de passe requis'}), 400

    if len(new_password) < 6:
        return jsonify({'msg': 'Le mot de passe doit contenir au moins 6 caractères'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'msg': 'Email invalide'}), 404

    reset = PasswordReset.query.filter_by(user_id=user.id, code=code, used=False).first()
    if not reset:
        return jsonify({'msg': 'Code invalide'}), 400
    if reset.expires_at < datetime.utcnow():
        return jsonify({'msg': 'Code expiré'}), 400

    user.set_password(new_password)
    reset.used = True
    db.session.commit()

    send_simple_email(user.email, "Votre mot de passe Albatros a été changé",
                      f"Bonjour {user.username},\n\nVotre mot de passe a été réinitialisé avec succès.\n\nCordialement,\nL'équipe Albatros")

    return jsonify({'msg': 'Mot de passe modifié avec succès'}), 200