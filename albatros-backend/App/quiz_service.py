# quiz_service.py
import json
from datetime import date
from db import db
from models import Gap, QuizResult, Question, UserQuestProgress, Quest, Exercise
from helpers import get_week_start

def evaluate_quiz(user_id, quiz_id, answers):
    questions = Question.query.filter_by(quiz_id=quiz_id).all()
    if not questions:
        return {"score": 0, "gaps": []}
    total = len(questions)
    correct = 0
    concept_correct = {}
    concept_total = {}
    for q in questions:
        user_answer = answers.get(str(q.id))
        if user_answer and int(user_answer) == q.correct_option:
            correct += 1
            concept_correct[q.concept] = concept_correct.get(q.concept, 0) + 1
        concept_total[q.concept] = concept_total.get(q.concept, 0) + 1
    score = (correct / total) * 100
    gaps_detected = []
    for concept, tot in concept_total.items():
        corr = concept_correct.get(concept, 0)
        if (corr / tot) < 0.5:
            gaps_detected.append(concept)
    for concept in gaps_detected:
        gap = Gap.query.filter_by(user_id=user_id, concept=concept).first()
        if not gap:
            gap = Gap(user_id=user_id, concept=concept, mastery_level=0.0)
            db.session.add(gap)
        gap.mastery_level = max(gap.mastery_level - 10, 0)
        gap.last_updated = date.today()
    db.session.commit()
    result = QuizResult(
        user_id=user_id,
        quiz_id=quiz_id,
        score=score,
        answers_json=json.dumps(answers),
        gaps_json=json.dumps(gaps_detected)
    )
    db.session.add(result)
    db.session.commit()
    return {"score": score, "gaps": gaps_detected}

def get_gaps(user_id):
    gaps = Gap.query.filter_by(user_id=user_id).all()
    return [{"concept": g.concept, "level": g.mastery_level} for g in gaps]

def generate_personalized_exercises(user_id, limit=5):
    gaps = Gap.query.filter_by(user_id=user_id).all()
    concepts = [g.concept for g in gaps]
    if not concepts:
        exercises = Exercise.query.filter_by(difficulty='easy').limit(limit).all()
    else:
        exercises = []
        for concept in concepts:
            # Recherche d'exercices dont le champ 'tags' contient le concept
            exos = Exercise.query.filter(Exercise.tags.like(f'%{concept}%')).limit(limit).all()
            exercises.extend(exos)
        # Éliminer les doublons
        seen = set()
        unique = []
        for ex in exercises:
            if ex.id not in seen:
                seen.add(ex.id)
                unique.append(ex)
        exercises = unique[:limit]
        if len(exercises) < limit:
            existing_ids = [e.id for e in exercises]
            additional = Exercise.query.filter(Exercise.id.notin_(existing_ids)).limit(limit - len(exercises)).all()
            exercises.extend(additional)
    return [{"id": e.id, "question": e.question_text, "difficulty": e.difficulty} for e in exercises]

def update_quest_progress(user_id, objective_type, increment=1):
    week_start = get_week_start()
    progresses = UserQuestProgress.query.join(Quest).filter(
        UserQuestProgress.user_id == user_id,
        UserQuestProgress.week_start_date == week_start,
        UserQuestProgress.completed == False,
        Quest.objective_type == objective_type
    ).all()
    for prog in progresses:
        prog.progress += increment
        if prog.progress >= prog.quest.objective_target:
            prog.completed = True
        db.session.add(prog)
    db.session.commit()

def get_weekly_quests(user_id):
    week_start = get_week_start()
    progresses = UserQuestProgress.query.join(Quest).filter(
        UserQuestProgress.user_id == user_id,
        UserQuestProgress.week_start_date == week_start
    ).all()
    return [{
        'id': p.id,
        'name': p.quest.name,
        'description': p.quest.description,
        'progress': p.progress,
        'target': p.quest.objective_target,
        'completed': p.completed,
        'claimed': p.claimed,
        'reward_gems': p.quest.reward_gems,
        'reward_xp': p.quest.reward_xp
    } for p in progresses]

def create_weekly_quests_for_user(user_id):
    week_start = get_week_start()
    existing = UserQuestProgress.query.filter_by(user_id=user_id, week_start_date=week_start).first()
    if existing:
        return
    quests = Quest.query.filter_by(is_weekly=True).all()
    if not quests:
        from helpers import init_default_quests
        init_default_quests()
        quests = Quest.query.filter_by(is_weekly=True).all()
    for quest in quests:
        prog = UserQuestProgress(user_id=user_id, quest_id=quest.id, week_start_date=week_start)
        db.session.add(prog)
    db.session.commit()