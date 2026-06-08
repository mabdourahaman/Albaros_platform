# create_gap.py
from app import app, db
from models import Gap, User

with app.app_context():
    alice = User.query.filter_by(username='alice').first()
    if alice:
        gap = Gap(user_id=alice.id, concept="fractions", mastery_level=30.0)
        db.session.add(gap)
        db.session.commit()
        print("✅ Lacune créée pour Alice sur 'fractions'")