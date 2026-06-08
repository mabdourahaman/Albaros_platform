# helpers.py - Version complète avec streak, rewards, quests, email, et similarité sémantique

from datetime import date, timedelta, datetime
import random
import unicodedata
import re
from db import db
from models import UserActivity, InventoryItem, Quest
from flask import current_app
from flask_mail import Message

# Tentative d'import de sentence-transformers
try:
    from sentence_transformers import SentenceTransformer, util
    SBERT_AVAILABLE = True
except ImportError:
    SBERT_AVAILABLE = False
    print("⚠️ sentence-transformers not installed. Falling back to string normalization.")

_sbert_model = None

def get_sbert_model():
    """Charge le modèle Sentence-BERT une seule fois (all-MiniLM-L6-v2)."""
    global _sbert_model
    if not SBERT_AVAILABLE:
        return None
    if _sbert_model is None:
        try:
            _sbert_model = SentenceTransformer('all-MiniLM-L6-v2')
            print("✅ Sentence-BERT model loaded")
        except Exception as e:
            print(f"❌ Failed to load Sentence-BERT: {e}")
            _sbert_model = False
    return _sbert_model if _sbert_model is not False else None

def normalize_string(s):
    """Normalise une chaîne : minuscules, sans accents, sans ponctuation, espaces uniques."""
    if not s:
        return ""
    s = s.lower()
    s = unicodedata.normalize('NFKD', s).encode('ASCII', 'ignore').decode('ascii')
    s = re.sub(r'[^\w\s]', '', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s

def compare_answers(user_answer, correct_answer, base_threshold=0.7, length_factor=0.05):
    """
    Compare deux réponses en ajustant le seuil selon la longueur de la réponse utilisateur.
    - base_threshold : seuil par défaut (ex: 0.7)
    - length_factor : incrément du seuil par mot manquant sous une longueur idéale
    """
    user_words = user_answer.split()
    correct_words = correct_answer.split()
    ideal_length = max(5, len(correct_words) // 2)  # longueur cible (ex: moitié de la réponse attendue)
    
    # Ajustement du seuil : plus la réponse est courte, plus le seuil est élevé
    if len(user_words) < ideal_length:
        penalty = (ideal_length - len(user_words)) * length_factor
        dynamic_threshold = min(0.95, base_threshold + penalty)
    else:
        dynamic_threshold = base_threshold
    
    model = get_sbert_model()
    if model is not None:
        emb1 = model.encode(user_answer, convert_to_tensor=True)
        emb2 = model.encode(correct_answer, convert_to_tensor=True)
        similarity = util.cos_sim(emb1, emb2).item()
        is_correct = similarity >= dynamic_threshold
        return is_correct, similarity
    else:
        # fallback
        norm_u = normalize_string(user_answer)
        norm_c = normalize_string(correct_answer)
        is_correct = (norm_u == norm_c)
        return is_correct, 1.0 if is_correct else 0.0

# ========== GESTION DE LA FLAMME (STREAK) ET RÉCOMPENSES ==========
def update_streak_and_rewards(user):
    from quiz_service import update_quest_progress

    today = date.today()
    yesterday = today - timedelta(days=1)
    last_activity = UserActivity.query.filter_by(user_id=user.id).order_by(UserActivity.activity_date.desc()).first()

    # Déjà actif aujourd'hui
    if last_activity and last_activity.activity_date == today:
        return

    missed_yesterday = False
    if last_activity and last_activity.activity_date < yesterday:
        missed_yesterday = True

    flame_freeze_item = InventoryItem.query.filter_by(user_id=user.id, item_type='flame_freeze').first()
    has_flame_freeze = flame_freeze_item and flame_freeze_item.quantity > 0

    if missed_yesterday and has_flame_freeze:
        # Utilisation d'un gel : on marque hier comme gelé, pas de XP, la série reste
        flame_freeze_item.quantity -= 1
        db.session.add(flame_freeze_item)
        missed_activity = UserActivity(user_id=user.id, activity_date=yesterday, xp_earned=0, used_flame_freeze=True)
        db.session.add(missed_activity)
        update_quest_progress(user.id, 'login_days', 1)
    elif missed_yesterday and not has_flame_freeze:
        # Série cassée : remise à zéro et XP de base pour aujourd'hui
        user.flame = 0
        base_xp = 10
        base_gems = 1
        user.total_xp = (user.total_xp or 0) + base_xp
        user.gems = (user.gems or 0) + base_gems
        activity = UserActivity(user_id=user.id, activity_date=today, xp_earned=base_xp)
        db.session.add(activity)
        update_quest_progress(user.id, 'login_days', 1)
    else:
        # Connexion normale consécutive
        user.flame = (user.flame or 0) + 1
        xp_gain = 10 + min(user.flame // 7, 10) * 5
        gems_gain = 1 + (user.flame // 10)
        user.total_xp = (user.total_xp or 0) + xp_gain
        user.gems = (user.gems or 0) + gems_gain
        activity = UserActivity(user_id=user.id, activity_date=today, xp_earned=xp_gain)
        db.session.add(activity)
        update_quest_progress(user.id, 'login_days', 1)
        update_quest_progress(user.id, 'streak', 1)

    user.last_active_date = today
    db.session.commit()

def init_default_quests():
    """Crée les quêtes hebdomadaires par défaut si aucune n'existe."""
    if Quest.query.count() == 0:
        quests_data = [
            ("Apprenti actif", "Termine 5 exercices", "exercises", 5, 10, 20),
            ("Flammèche", "Maintiens ta flamme 3 jours", "streak", 3, 15, 30),
            ("Collectionneur d'XP", "Gagne 100 XP cette semaine", "xp", 100, 20, 50),
            ("Assidu", "Connecte-toi 5 jours", "login_days", 5, 10, 40),
        ]
        for name, desc, obj_type, target, gems, xp in quests_data:
            q = Quest(name=name, description=desc, objective_type=obj_type,
                      objective_target=target, reward_gems=gems, reward_xp=xp, is_weekly=True)
            db.session.add(q)
        db.session.commit()


# ========== UTILITAIRES POUR EMAIL ET CODES DE VÉRIFICATION ==========
def generate_code():
    """Génère un code numérique à 6 chiffres aléatoire."""
    return str(random.randint(100000, 999999))

def code_is_valid(created_at, minutes=10):
    """Vérifie si un code a été créé il y a moins de 'minutes' minutes."""
    if not created_at:
        return False
    return datetime.utcnow() <= created_at + timedelta(minutes=minutes)

def send_email_code(email, subject, code):
    """Envoie un email contenant un code de vérification."""
    try:
        mail = current_app.extensions.get('mail')
        if mail:
            msg = Message(subject, recipients=[email])
            msg.body = f"Votre code de vérification Albatros est : {code}\nCe code expire dans 10 minutes."
            mail.send(msg)
            return True
        else:
            print("Mail extension non disponible.")
            return False
    except Exception as e:
        print(f"Erreur d'envoi d'email : {e}")
        return False

def send_simple_email(email, subject, body):
    """Envoie un email simple (sans code)."""
    try:
        mail = current_app.extensions.get('mail')
        if mail:
            msg = Message(subject, recipients=[email])
            msg.body = body
            mail.send(msg)
            return True
        else:
            print("Mail extension non disponible.")
            return False
    except Exception as e:
        print(f"Erreur d'envoi d'email : {e}")
        return False