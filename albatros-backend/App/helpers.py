# helpers.py
from datetime import date, timedelta
from db import db
from models import UserActivity, InventoryItem, Quest

def update_streak_and_rewards(user):
    today = date.today()
    yesterday = today - timedelta(days=1)
    last_activity = UserActivity.query.filter_by(user_id=user.id).order_by(UserActivity.activity_date.desc()).first()
    if last_activity and last_activity.activity_date == today:
        return
    missed_yesterday = False
    if last_activity and last_activity.activity_date < yesterday:
        missed_yesterday = True
    flame_freeze_item = InventoryItem.query.filter_by(user_id=user.id, item_type='flame_freeze').first()
    has_flame_freeze = flame_freeze_item and flame_freeze_item.quantity > 0
    if missed_yesterday and has_flame_freeze:
        flame_freeze_item.quantity -= 1
        db.session.add(flame_freeze_item)
        missed_activity = UserActivity(user_id=user.id, activity_date=yesterday, xp_earned=0, used_flame_freeze=True)
        db.session.add(missed_activity)
    elif missed_yesterday and not has_flame_freeze:
        user.flame = 0
    else:
        user.flame = (user.flame or 0) + 1
        xp_gain = 10 + min(user.flame // 7, 10) * 5
        gems_gain = 1 + (user.flame // 10)
        user.total_xp = (user.total_xp or 0) + xp_gain
        user.gems = (user.gems or 0) + gems_gain
        activity = UserActivity(user_id=user.id, activity_date=today, xp_earned=xp_gain)
        db.session.add(activity)
    user.last_active_date = today
    db.session.commit()

def get_week_start():
    today = date.today()
    return today - timedelta(days=today.weekday())

def init_default_quests():
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