# seed_data.py
import os
import sys
from datetime import date, timedelta, datetime

# Se placer dans le même dossier que seed_data.py pour les imports
os.chdir(os.path.dirname(os.path.abspath(__file__)))

from app import app, db
from models import *

def init_database():
    """Crée les tables et les données initiales (à exécuter une seule fois)."""
    with app.app_context():
        # 1. Créer toutes les tables
        db.create_all()
        print("✅ Tables créées.")

        # 2. Vérifier si des données existent déjà (ex: utilisateur admin)
        if User.query.filter_by(email='admin@example.com').first():
            print("ℹ️ Les données existent déjà. Aucune insertion.")
            return

        # ========== 3. CRÉATION DES UTILISATEURS ==========
        admin = User(
            massar=999999,
            username="admin",
            email="admin@example.com",
            role="admin",
            flame=0,
            gems=0,
            total_xp=0
        )
        admin.set_password("admin123")

        teacher = User(
            massar=111111,
            username="teacher",
            email="teacher@example.com",
            role="teacher",
            flame=0,
            gems=0,
            total_xp=0
        )
        teacher.set_password("teacher123")

        alice = User(
            massar=123456,
            username="alice",
            email="alice@example.com",
            role="student",
            flame=0,
            gems=10,
            total_xp=0
        )
        alice.set_password("alice123")

        bob = User(
            massar=654321,
            username="bob",
            email="bob@example.com",
            role="student",
            flame=0,
            gems=5,
            total_xp=0
        )
        bob.set_password("bob123")

        db.session.add_all([admin, teacher, alice, bob])
        db.session.commit()
        print("✅ Utilisateurs créés : admin, teacher, alice, bob")

        # ========== 4. MATIÈRES ==========
        subjects = [
            Subject(name="Mathématiques", description="Cours de mathématiques"),
            Subject(name="Français", description="Cours de français et grammaire"),
            Subject(name="Anglais", description="Cours d'anglais")
        ]
        db.session.add_all(subjects)
        db.session.commit()
        print(f"✅ {len(subjects)} matières créées.")

        math_id = Subject.query.filter_by(name="Mathématiques").first().id
        francais_id = Subject.query.filter_by(name="Français").first().id

        # ========== 5. COURS ==========
        courses = [
            Course(
                title="Fractions pour débutants",
                description="Apprenez les bases des fractions",
                subject_id=math_id,
                teacher_id=teacher.id,
                difficulty="easy",
                tags="fractions,maths"
            ),
            Course(
                title="Équations simples",
                description="Résolvez des équations du premier degré",
                subject_id=math_id,
                teacher_id=teacher.id,
                difficulty="easy",
                tags="equations,algebre"
            ),
            Course(
                title="Conjugaison du présent",
                description="Maîtrisez les verbes au présent",
                subject_id=francais_id,
                teacher_id=teacher.id,
                difficulty="easy",
                tags="conjugaison,francais"
            ),
            Course(
                title="Calcul mental avancé",
                description="Techniques de calcul rapide",
                subject_id=math_id,
                teacher_id=teacher.id,
                difficulty="medium",
                tags="calcul,mental"
            ),
        ]
        db.session.add_all(courses)
        db.session.commit()
        print(f"✅ {len(courses)} cours créés.")

        # Récupération des IDs des cours
        cours_fractions = Course.query.filter_by(title="Fractions pour débutants").first()
        cours_equations = Course.query.filter_by(title="Équations simples").first()
        cours_conjugaison = Course.query.filter_by(title="Conjugaison du présent").first()
        cours_calcul = Course.query.filter_by(title="Calcul mental avancé").first()

        # ========== 6. EXERCICES ==========
        exercises = [
            Exercise(
                course_id=cours_fractions.id,
                question_text="Calculez 1/2 + 1/4",
                correct_answer="3/4",
                explanation="1/2 = 2/4, donc 2/4 + 1/4 = 3/4",
                difficulty="easy",
                tags="fractions"
            ),
            Exercise(
                course_id=cours_fractions.id,
                question_text="Simplifiez 6/8",
                correct_answer="3/4",
                explanation="Divisez le numérateur et le dénominateur par 2",
                difficulty="easy",
                tags="fractions"
            ),
            Exercise(
                course_id=cours_equations.id,
                question_text="Résolvez x + 5 = 12",
                correct_answer="7",
                explanation="x = 12 - 5 = 7",
                difficulty="easy",
                tags="equations"
            ),
            Exercise(
                course_id=cours_equations.id,
                question_text="Résolvez 2x = 10",
                correct_answer="5",
                explanation="x = 10 / 2 = 5",
                difficulty="easy",
                tags="equations"
            ),
            Exercise(
                course_id=cours_conjugaison.id,
                question_text="Conjuguez le verbe 'manger' au présent, première personne du singulier",
                correct_answer="je mange",
                explanation="Le verbe 'manger' se conjugue 'je mange' au présent",
                difficulty="easy",
                tags="conjugaison"
            ),
            Exercise(
                course_id=cours_calcul.id,
                question_text="Calculez 15 × 12",
                correct_answer="180",
                explanation="15 × 10 = 150, plus 15 × 2 = 30, total 180",
                difficulty="medium",
                tags="calcul"
            ),
        ]
        db.session.add_all(exercises)
        db.session.commit()
        print(f"✅ {len(exercises)} exercices créés.")

        # ========== 7. QUIZ ET QUESTIONS ==========
        quiz1 = Quiz(title="Quiz fractions", subject_id=math_id, difficulty="easy")
        quiz2 = Quiz(title="Quiz équations", subject_id=math_id, difficulty="easy")
        db.session.add_all([quiz1, quiz2])
        db.session.commit()
        print(f"✅ Quiz créés : {quiz1.title}, {quiz2.title}")

        questions_quiz1 = [
            Question(
                quiz_id=quiz1.id,
                text="1/2 + 1/3 = ?",
                option1="2/5", option2="3/5", option3="5/6", option4="1/5",
                correct_option=3, concept="fractions"
            ),
            Question(
                quiz_id=quiz1.id,
                text="Quelle fraction est équivalente à 0.5 ?",
                option1="1/3", option2="2/4", option3="3/5", option4="4/6",
                correct_option=2, concept="fractions"
            ),
            Question(
                quiz_id=quiz1.id,
                text="Simplifiez 8/12",
                option1="2/3", option2="4/6", option3="1/2", option4="3/4",
                correct_option=1, concept="fractions"
            ),
        ]
        questions_quiz2 = [
            Question(
                quiz_id=quiz2.id,
                text="Résoudre x + 7 = 15",
                option1="x=8", option2="x=22", option3="x=7", option4="x=15",
                correct_option=1, concept="equations"
            ),
            Question(
                quiz_id=quiz2.id,
                text="Résoudre 3x = 18",
                option1="x=6", option2="x=5", option3="x=15", option4="x=21",
                correct_option=1, concept="equations"
            ),
        ]
        db.session.add_all(questions_quiz1 + questions_quiz2)
        db.session.commit()
        print(f"✅ {len(questions_quiz1) + len(questions_quiz2)} questions créées.")

        # ========== 8. ACTIVITÉS POUR ALICE ==========
        today = date.today()
        activities = []
        for i in range(1, 5):
            act_date = today - timedelta(days=i)
            activities.append(UserActivity(
                user_id=alice.id,
                activity_date=act_date,
                xp_earned=10,
                used_flame_freeze=False
            ))
        db.session.add_all(activities)
        db.session.commit()
        print(f"✅ {len(activities)} activités créées pour Alice.")

        # ========== 9. LACUNES POUR ALICE ==========
        gaps = [
            Gap(user_id=alice.id, concept="fractions", mastery_level=30.0),
            Gap(user_id=alice.id, concept="equations", mastery_level=45.0),
        ]
        db.session.add_all(gaps)
        db.session.commit()
        print(f"✅ {len(gaps)} lacunes créées pour Alice.")

        # ========== 10. QUÊTES HEBDOMADAIRES ==========
        if Quest.query.count() == 0:
            quests_data = [
                ("Apprenti actif", "Termine 5 exercices", "exercises", 5, 10, 20),
                ("Flammèche", "Maintiens ta flamme 3 jours", "streak", 3, 15, 30),
                ("Collectionneur d'XP", "Gagne 100 XP cette semaine", "xp", 100, 20, 50),
                ("Assidu", "Connecte-toi 5 jours", "login_days", 5, 10, 40),
            ]
            for name, desc, obj_type, target, gems_reward, xp_reward in quests_data:
                db.session.add(Quest(
                    name=name,
                    description=desc,
                    objective_type=obj_type,
                    objective_target=target,
                    reward_gems=gems_reward,
                    reward_xp=xp_reward,
                    is_weekly=True
                ))
            db.session.commit()
            print(f"✅ {len(quests_data)} quêtes créées.")

        # ========== 11. AMITIÉ ENTRE ALICE ET BOB ==========
        friendship = Friend(
            user_id=alice.id,
            friend_id=bob.id,
            status="accepted",
            created_at=datetime.utcnow()
        )
        db.session.add(friendship)
        db.session.commit()
        print("✅ Relation d'amitié créée entre Alice et Bob.")

        # ========== RÉCAPITULATIF ==========
        print("\n🎉 Toutes les données initiales ont été insérées avec succès !")
        print("\n=== Comptes de test ===")
        print("Admin : massar=999999, password=admin123")
        print("Enseignant : massar=111111, password=teacher123")
        print("Élève Alice : massar=123456, password=alice123")
        print("Élève Bob : massar=654321, password=bob123")
        print("\nQuiz disponibles :")
        print(f"  - Quiz Fractions (ID: {quiz1.id})")
        print(f"  - Quiz Équations (ID: {quiz2.id})")

if __name__ == "__main__":
    init_database()