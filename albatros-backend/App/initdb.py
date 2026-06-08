# initdb.py – Version fusionnée avec 3 quiz de base + 15 quiz supplémentaires
from app import app, db
from models import User, Subject, Course, Exercise, Quiz, Question, Gap
from quiz_service import get_or_create_gaps_course

# -------------------------------------------------------------------
# 1. Fonctions utilitaires (création des données de base)
# -------------------------------------------------------------------

def create_user(massar, username, email, password, role):
    existing = User.query.filter((User.massar == massar) | (User.email == email)).first()
    if existing:
        print(f"⚠️ User {username} already exists, skipping.")
        return existing
    user = User(
        massar=massar,
        username=username,
        email=email,
        role=role,
        flame=0,
        gems=0,
        total_xp=0
    )
    user.set_password(password)
    db.session.add(user)
    db.session.flush()
    print(f"✅ {role.capitalize()} created: {username} (massar={massar})")
    return user

def create_subject(name, description, teacher):
    existing = Subject.query.filter_by(name=name).first()
    if existing:
        print(f"⚠️ Subject '{name}' already exists, skipping.")
        return existing
    subject = Subject(name=name, description=description, teacher_id=teacher.id)
    db.session.add(subject)
    db.session.flush()
    print(f"✅ Subject created: {name} (teacher: {teacher.username})")
    return subject

def create_course(title, description, subject, teacher, difficulty="medium", tags="", content="", examples=""):
    existing = Course.query.filter_by(title=title, teacher_id=teacher.id).first()
    if existing:
        print(f"⚠️ Course '{title}' already exists, skipping.")
        return existing
    course = Course(
        title=title,
        description=description,
        subject_id=subject.id,
        teacher_id=teacher.id,
        difficulty=difficulty,
        tags=tags,
        content=content,
        examples=examples
    )
    db.session.add(course)
    db.session.flush()
    print(f"✅ Course added: {title}")
    return course

def create_exercise(course, question, correct_answer, explanation, difficulty="easy", tags=""):
    """Crée un exercice classique (une seule question)."""
    exercise = Exercise(
        course_id=course.id,
        question_text=question,
        correct_answer=correct_answer,
        explanation=explanation,
        difficulty=difficulty,
        tags=tags
    )
    db.session.add(exercise)
    db.session.flush()
    return exercise

def create_multi_question_exercise(course, questions_list, difficulty="easy", tags="", xp_reward=20):
    """Crée un exercice multi‑questions (champ JSON)."""
    exercise = Exercise(
        course_id=course.id,
        difficulty=difficulty,
        tags=tags,
        xp_reward=xp_reward,
        questions=questions_list
    )
    db.session.add(exercise)
    db.session.flush()
    return exercise

def create_quiz(title, subject_id, difficulty, questions_data):
    """
    Crée un quiz générique (sans enseignant attribué) à partir d'un subject_id.
    questions_data : liste de dicts avec 'text', 'option1'...'option4', 'correct_option', etc.
    """
    existing = Quiz.query.filter_by(title=title, subject_id=subject_id).first()
    if existing:
        print(f"⚠️ Quiz '{title}' already exists, skipping.")
        return existing
    quiz = Quiz(
        title=title,
        subject_id=subject_id,
        difficulty=difficulty,
        teacher_id=None
    )
    db.session.add(quiz)
    db.session.flush()
    for q in questions_data:
        question = Question(
            quiz_id=quiz.id,
            text=q['text'],
            option1=q['option1'],
            option2=q['option2'],
            option3=q.get('option3', ''),
            option4=q.get('option4', ''),
            correct_option=q['correct_option'],
            concept=q.get('concept', 'seed')
        )
        db.session.add(question)
    db.session.commit()
    print(f"✅ Quiz created: '{title}' (difficulty: {difficulty})")
    return quiz

# -------------------------------------------------------------------
# 2. Création de toutes les tables
# -------------------------------------------------------------------

with app.app_context():
    db.create_all()

    # ---------- Enseignants ----------
    teacher_math = create_user(None, "teacher_math", "math@example.com", "123", "teacher")
    teacher_physics = create_user(None, "teacher_physics", "physics@example.com", "123", "teacher")
    teacher_english = create_user(None, "teacher_english", "english@example.com", "123", "teacher")

    # ---------- Matières ----------
    math_subj = create_subject("Mathématiques", "Cours de mathématiques", teacher_math)
    physics_subj = create_subject("Physique", "Cours de physique", teacher_physics)
    english_subj = create_subject("Anglais", "Cours d'anglais", teacher_english)

    # ---------- Cours ----------
    math_course = create_course(
        title="Algèbre et analyse",
        description="Introduction aux vecteurs, matrices, dérivées et intégrales",
        subject=math_subj,
        teacher=teacher_math,
        difficulty="medium",
        tags="algebra, calculus",
        content="""<h2>Les vecteurs</h2><p>Un vecteur est une flèche...</p>
        <h2>Dérivées</h2><p>La dérivée de x^n est n*x^(n-1).</p>
        <h2>Intégrales</h2><p>L'intégrale de x^n est x^(n+1)/(n+1).</p>""",
        examples="Exemple: (2,3)+(4,5)=(6,8). Dérivée de x^2 = 2x."
    )
    physics_course = create_course(
        title="Mécanique classique",
        description="Lois de Newton, énergie cinétique et potentielle",
        subject=physics_subj,
        teacher=teacher_physics,
        difficulty="medium",
        tags="mechanics, newton",
        content="""<h2>Première loi de Newton</h2><p>Principe d'inertie.</p>
        <h2>Deuxième loi</h2><p>F = m * a</p>
        <h2>Énergie cinétique</h2><p>Ec = 1/2 * m * v^2</p>""",
        examples="Calculez la force pour un objet de 10 kg accélérant à 5 m/s² -> F=50 N."
    )
    english_course = create_course(
        title="English Grammar and Vocabulary",
        description="Basic tenses, vocabulary, and sentence structure",
        subject=english_subj,
        teacher=teacher_english,
        difficulty="easy",
        tags="grammar, vocabulary",
        content="""<h2>Present Simple</h2><p>I go, you go, he goes...</p>
        <h2>Past Simple</h2><p>She went to school yesterday.</p>
        <h2>Future Simple</h2><p>I will learn English.</p>""",
        examples="She (go) to school every day -> goes."
    )

    # ---------- Exercices classiques (une question) ----------
    create_exercise(math_course,
        "Calculez la somme des vecteurs (2,3) et (4,5)",
        "(6,8)",
        "On additionne composante par composante : 2+4=6, 3+5=8",
        difficulty="easy", tags="vectors")
    create_exercise(math_course,
        "Quelle est la dérivée de f(x)=3x²+2x-1 ?",
        "f'(x)=6x+2",
        "Dérivée de x² est 2x, donc 3*2x = 6x; dérivée de 2x = 2; constante -> 0",
        difficulty="medium", tags="derivation")
    create_exercise(physics_course,
        "Un objet de masse 10 kg est soumis à une force de 50 N. Quelle est son accélération ?",
        "5 m/s²",
        "a = F/m = 50/10 = 5 m/s²",
        difficulty="easy", tags="newton")
    create_exercise(english_course,
        "What is the past tense of 'to eat'?",
        "ate",
        "Irregular verb: eat - ate - eaten",
        difficulty="easy", tags="verbs")

    # ---------- Exercices multi‑questions ----------
    math_multi_1 = [
        {"text": "Calculez 3 × 4", "correct_answer": "12", "explanation": "3 × 4 = 12"},
        {"text": "Calculez 15 ÷ 3", "correct_answer": "5", "explanation": "15 ÷ 3 = 5"},
        {"text": "Quelle est la racine carrée de 64 ?", "correct_answer": "8", "explanation": "√64 = 8"}
    ]
    create_multi_question_exercise(math_course, math_multi_1, difficulty="easy", tags="basic_ops", xp_reward=30)

    math_multi_2 = [
        {"text": "Résoudre 2x + 3 = 7", "correct_answer": "x = 2", "explanation": "2x = 4 → x = 2"},
        {"text": "Résoudre x² = 25", "correct_answer": "x = ±5", "explanation": "Racines carrées: 5 et -5"}
    ]
    create_multi_question_exercise(math_course, math_multi_2, difficulty="medium", tags="equations", xp_reward=40)

    physics_multi_1 = [
        {"text": "Quelle est la formule de la force (Newton) ?", "correct_answer": "F = m × a", "explanation": "Deuxième loi de Newton"},
        {"text": "Un objet de 5 kg accélère à 2 m/s². Quelle est la force ?", "correct_answer": "10 N", "explanation": "F = 5×2 = 10 N"}
    ]
    create_multi_question_exercise(physics_course, physics_multi_1, difficulty="easy", tags="newton", xp_reward=30)

    physics_multi_2 = [
        {"text": "Quelle est l'unité de l'énergie ?", "correct_answer": "Joule (J)", "explanation": "Joule, symbole J"},
        {"text": "Calculez l'énergie cinétique d'un objet de 2 kg à 3 m/s", "correct_answer": "9 J", "explanation": "Ec = ½ × 2 × 3² = 9 J"}
    ]
    create_multi_question_exercise(physics_course, physics_multi_2, difficulty="medium", tags="energy", xp_reward=35)

    english_multi_1 = [
        {"text": "What is the past tense of 'go'?", "correct_answer": "went", "explanation": "Irregular verb: go → went"},
        {"text": "What is the past participle of 'eat'?", "correct_answer": "eaten", "explanation": "eat → ate → eaten"}
    ]
    create_multi_question_exercise(english_course, english_multi_1, difficulty="easy", tags="irregular_verbs", xp_reward=25)

    english_multi_2 = [
        {"text": "Complete: 'She ____ to school every day.' (go)", "correct_answer": "goes", "explanation": "Present simple, 3rd person singular"},
        {"text": "Make negative: 'He likes coffee.'", "correct_answer": "He does not like coffee.", "explanation": "Auxiliaire does + not + base form"}
    ]
    create_multi_question_exercise(english_course, english_multi_2, difficulty="medium", tags="grammar", xp_reward=30)

    # ---------- 3 quiz de base ----------
    maths_questions = [
        {"text": "Quelle est la dérivée de x² ?", "option1": "x", "option2": "2x", "option3": "x²", "option4": "1", "correct_option": 2, "concept": "derivation"},
        {"text": "La somme des angles d'un triangle est :", "option1": "90°", "option2": "180°", "option3": "270°", "option4": "360°", "correct_option": 2, "concept": "geometry"},
        {"text": "Si f(x)=3x+2, que vaut f(2) ?", "option1": "6", "option2": "8", "option3": "10", "option4": "4", "correct_option": 2, "concept": "functions"}
    ]
    create_quiz("Quiz Mathématiques", math_subj.id, "medium", maths_questions)

    physics_questions = [
        {"text": "La force gravitationnelle varie en :", "option1": "1/r", "option2": "1/r²", "option3": "r", "option4": "r²", "correct_option": 2, "concept": "gravity"},
        {"text": "L'unité de la puissance électrique est :", "option1": "Volt", "option2": "Ampère", "option3": "Watt", "option4": "Joule", "correct_option": 3, "concept": "electricity"},
        {"text": "Quelle est la formule de l'énergie cinétique ?", "option1": "mv", "option2": "½mv²", "option3": "mgh", "option4": "½kx²", "correct_option": 2, "concept": "energy"}
    ]
    create_quiz("Quiz Physique", physics_subj.id, "medium", physics_questions)

    english_questions = [
        {"text": "What is the past tense of 'go'?", "option1": "Goed", "option2": "Went", "option3": "Gone", "option4": "Going", "correct_option": 2, "concept": "verbs"},
        {"text": "Which word is a synonym for 'happy'?", "option1": "Sad", "option2": "Joyful", "option3": "Angry", "option4": "Tired", "correct_option": 2, "concept": "vocabulary"},
        {"text": "Choose the correct sentence:", "option1": "She go to school.", "option2": "She goes to school.", "option3": "She going to school.", "option4": "She went to school yesterday.", "correct_option": 2, "concept": "grammar"}
    ]
    create_quiz("Quiz English", english_subj.id, "easy", english_questions)

    # ---------- Étudiants ----------
    student_data = [
        (1234, "alice", "alice@example.com", "123"),
        (2001, "bob", "bob@example.com", "123"),
        (2002, "carol", "carol@example.com", "123"),
        (2003, "dave", "dave@example.com", "123"),
    ]
    for massar, username, email, pwd in student_data:
        create_user(massar, username, email, pwd, "student")

    # ---------- Gap pour Alice ----------
    alice = User.query.filter_by(username="alice").first()
    if alice:
        if not Gap.query.filter_by(user_id=alice.id, concept="fractions").first():
            gap = Gap(user_id=alice.id, concept="fractions", mastery_level=30.0)
            db.session.add(gap)
            print("✅ Gap created for Alice on 'fractions'")
    else:
        print("⚠️ Alice not found, cannot create gap")

    # ---------- Cours Gaps Exercises ----------
    gaps_course = get_or_create_gaps_course()
    print(f"✅ Gaps course ready: {gaps_course.title}")

    db.session.commit()
    print("\n🎉 Base data (teachers, courses, exercises, 3 quizzes) created successfully!")

# -------------------------------------------------------------------
# 3. Ajout des 15 quiz supplémentaires (à remplacer par vos propres données)
# -------------------------------------------------------------------

with app.app_context():
    # Récupérer à nouveau les matières (nécessaire pour avoir leurs id)
    math = Subject.query.filter_by(name='Mathématiques').first()
    physics = Subject.query.filter_by(name='Physique').first()
    english = Subject.query.filter_by(name='Anglais').first()
    
    if not math or not physics or not english:
        print("❌ Subjects missing, cannot add extra quizzes.")
    else:

        # ========== 5 quiz de Mathématiques ==========
        quizzes_data = [
            # Mathématiques - Facile
            {
                "title": "Opérations de base",
                "subject_id": math.id,
                "difficulty": "easy",
                "questions": [
                    {"text": "Combien font 12 + 7 ?", "option1": "18", "option2": "19", "option3": "20", "option4": "21", "correct_option": 2, "concept": "addition"},
                    {"text": "Quel est le résultat de 9 × 6 ?", "option1": "54", "option2": "56", "option3": "63", "option4": "48", "correct_option": 1, "concept": "multiplication"},
                    {"text": "Combien de minutes dans 2 heures ?", "option1": "60", "option2": "90", "option3": "120", "option4": "150", "correct_option": 3, "concept": "time"}
                ]
            },
            {
                "title": "Fractions simples",
                "subject_id": math.id,
                "difficulty": "medium",
                "questions": [
                    {"text": "Quelle fraction est équivalente à 0,5 ?", "option1": "1/3", "option2": "1/2", "option3": "2/3", "option4": "3/4", "correct_option": 2, "concept": "fractions"},
                    {"text": "Simplifiez 4/8", "option1": "1/4", "option2": "1/3", "option3": "1/2", "option4": "2/4", "correct_option": 3, "concept": "fractions"},
                    {"text": "Calculez 1/3 + 1/6", "option1": "1/9", "option2": "1/2", "option3": "2/6", "option4": "1/3", "correct_option": 2, "concept": "fractions"}
                ]
            },
            {
                "title": "Équations du premier degré",
                "subject_id": math.id,
                "difficulty": "hard",
                "questions": [
                    {"text": "Résoudre 2x + 5 = 13", "option1": "x=3", "option2": "x=4", "option3": "x=5", "option4": "x=6", "correct_option": 2, "concept": "equations"},
                    {"text": "Résoudre 3(x-2)=9", "option1": "x=3", "option2": "x=4", "option3": "x=5", "option4": "x=6", "correct_option": 3, "concept": "equations"},
                    {"text": "Résoudre 4x - 7 = 2x + 3", "option1": "x=2", "option2": "x=3", "option3": "x=4", "option4": "x=5", "correct_option": 4, "concept": "equations"}
                ]
            },
            {
                "title": "Géométrie de base",
                "subject_id": math.id,
                "difficulty": "easy",
                "questions": [
                    {"text": "Quelle est l'aire d'un carré de côté 4 cm ?", "option1": "8 cm²", "option2": "12 cm²", "option3": "16 cm²", "option4": "20 cm²", "correct_option": 3, "concept": "geometry"},
                    {"text": "La somme des angles d'un triangle est :", "option1": "90°", "option2": "180°", "option3": "270°", "option4": "360°", "correct_option": 2, "concept": "geometry"},
                    {"text": "Un rectangle a une longueur de 10 m et largeur 5 m. Quel est son périmètre ?", "option1": "20 m", "option2": "25 m", "option3": "30 m", "option4": "40 m", "correct_option": 3, "concept": "geometry"}
                ]
            },
            {
                "title": "Pourcentages",
                "subject_id": math.id,
                "difficulty": "medium",
                "questions": [
                    {"text": "20% de 150 est :", "option1": "20", "option2": "30", "option3": "40", "option4": "50", "correct_option": 2, "concept": "percentages"},
                    {"text": "Un article coûte 80€ et bénéficie d'une remise de 25%. Quel est le prix après remise ?", "option1": "60€", "option2": "65€", "option3": "70€", "option4": "75€", "correct_option": 1, "concept": "percentages"},
                    {"text": "Augmenter 200 de 15% donne :", "option1": "215", "option2": "220", "option3": "225", "option4": "230", "correct_option": 4, "concept": "percentages"}
                ]
            },
            
            # ========== 5 quiz de Physique ==========
            {
                "title": "Les unités de mesure",
                "subject_id": physics.id,
                "difficulty": "easy",
                "questions": [
                    {"text": "L'unité de la force est :", "option1": "Joule", "option2": "Watt", "option3": "Newton", "option4": "Pascal", "correct_option": 3, "concept": "units"},
                    {"text": "L'unité de l'énergie est :", "option1": "Watt", "option2": "Joule", "option3": "Newton", "option4": "Volt", "correct_option": 2, "concept": "units"},
                    {"text": "L'unité de la puissance est :", "option1": "Joule", "option2": "Watt", "option3": "Newton", "option4": "Ampère", "correct_option": 2, "concept": "units"}
                ]
            },
            {
                "title": "Lois de Newton",
                "subject_id": physics.id,
                "difficulty": "medium",
                "questions": [
                    {"text": "La première loi de Newton est aussi appelée :", "option1": "Principe d'inertie", "option2": "Principe fondamental", "option3": "Principe d'action-réaction", "option4": "Principe de conservation", "correct_option": 1, "concept": "newton"},
                    {"text": "La force est égale à :", "option1": "m × a", "option2": "m / a", "option3": "a / m", "option4": "m + a", "correct_option": 1, "concept": "newton"},
                    {"text": "Si on double la masse d'un objet, la force nécessaire pour la même accélération :", "option1": "double", "option2": "diminue de moitié", "option3": "reste identique", "option4": "quadruple", "correct_option": 1, "concept": "newton"}
                ]
            },
            {
                "title": "Électricité",
                "subject_id": physics.id,
                "difficulty": "hard",
                "questions": [
                    {"text": "La loi d'Ohm s'écrit :", "option1": "U = R × I", "option2": "R = U × I", "option3": "I = U × R", "option4": "U = I / R", "correct_option": 1, "concept": "electricity"},
                    {"text": "Une résistance de 10 Ω est traversée par un courant de 2 A. Quelle est la tension ?", "option1": "5 V", "option2": "12 V", "option3": "20 V", "option4": "2 V", "correct_option": 3, "concept": "electricity"},
                    {"text": "La puissance électrique se calcule par :", "option1": "P = U × I", "option2": "P = U / I", "option3": "P = R × I", "option4": "P = U² × R", "correct_option": 1, "concept": "electricity"}
                ]
            },
            {
                "title": "Énergie mécanique",
                "subject_id": physics.id,
                "difficulty": "medium",
                "questions": [
                    {"text": "L'énergie cinétique d'un objet dépend de :", "option1": "sa masse et sa vitesse", "option2": "sa masse et sa hauteur", "option3": "sa vitesse seulement", "option4": "sa masse seulement", "correct_option": 1, "concept": "energy"},
                    {"text": "Un objet de 2 kg se déplace à 3 m/s. Son énergie cinétique est :", "option1": "6 J", "option2": "9 J", "option3": "12 J", "option4": "18 J", "correct_option": 2, "concept": "energy"},
                    {"text": "L'énergie potentielle de pesanteur dépend de :", "option1": "masse et vitesse", "option2": "masse et hauteur", "option3": "hauteur seulement", "option4": "vitesse seulement", "correct_option": 2, "concept": "energy"}
                ]
            },
            {
                "title": "Thermodynamique",
                "subject_id": physics.id,
                "difficulty": "hard",
                "questions": [
                    {"text": "Le zéro absolu correspond à :", "option1": "0°C", "option2": "-273,15°C", "option3": "-100°C", "option4": "0 K", "correct_option": 2, "concept": "thermo"},
                    {"text": "La chaleur se mesure en :", "option1": "Joule", "option2": "Watt", "option3": "Newton", "option4": "Pascal", "correct_option": 1, "concept": "thermo"},
                    {"text": "La capacité calorifique de l'eau est environ :", "option1": "4184 J/kg·K", "option2": "1000 J/kg·K", "option3": "2000 J/kg·K", "option4": "5000 J/kg·K", "correct_option": 1, "concept": "thermo"}
                ]
            },
            
            # ========== 5 quiz d'Anglais ==========
            {
                "title": "Basic Vocabulary",
                "subject_id": english.id,
                "difficulty": "easy",
                "questions": [
                    {"text": "What is the English word for 'voiture' ?", "option1": "House", "option2": "Car", "option3": "Train", "option4": "Bike", "correct_option": 2, "concept": "vocabulary"},
                    {"text": "What is the opposite of 'hot' ?", "option1": "Warm", "option2": "Cool", "option3": "Cold", "option4": "Freezing", "correct_option": 3, "concept": "vocabulary"},
                    {"text": "Which word means 'rapide' in English ?", "option1": "Slow", "option2": "Fast", "option3": "Quickly", "option4": "Speed", "correct_option": 2, "concept": "vocabulary"}
                ]
            },
            {
                "title": "Present Simple",
                "subject_id": english.id,
                "difficulty": "easy",
                "questions": [
                    {"text": "She ___ to school every day.", "option1": "go", "option2": "goes", "option3": "going", "option4": "went", "correct_option": 2, "concept": "grammar"},
                    {"text": "They ___ playing football now.", "option1": "is", "option2": "am", "option3": "are", "option4": "be", "correct_option": 3, "concept": "grammar"},
                    {"text": "___ you like ice cream?", "option1": "Does", "option2": "Do", "option3": "Is", "option4": "Are", "correct_option": 2, "concept": "grammar"}
                ]
            },
            {
                "title": "Past Simple",
                "subject_id": english.id,
                "difficulty": "medium",
                "questions": [
                    {"text": "Yesterday, I ___ to the cinema.", "option1": "go", "option2": "went", "option3": "gone", "option4": "goes", "correct_option": 2, "concept": "grammar"},
                    {"text": "She ___ her homework last night.", "option1": "do", "option2": "did", "option3": "done", "option4": "does", "correct_option": 2, "concept": "grammar"},
                    {"text": "We ___ a great time at the party.", "option1": "have", "option2": "has", "option3": "had", "option4": "having", "correct_option": 3, "concept": "grammar"}
                ]
            },
            {
                "title": "Future Tense",
                "subject_id": english.id,
                "difficulty": "medium",
                "questions": [
                    {"text": "I think it ___ rain tomorrow.", "option1": "will", "option2": "is", "option3": "are", "option4": "going", "correct_option": 1, "concept": "grammar"},
                    {"text": "They ___ travel to London next week.", "option1": "will", "option2": "are going to", "option3": "is going to", "option4": "go to", "correct_option": 2, "concept": "grammar"},
                    {"text": "She ___ call you later.", "option1": "will", "option2": "is", "option3": "are", "option4": "going", "correct_option": 1, "concept": "grammar"}
                ]
            },
            {
                "title": "Conditional Sentences",
                "subject_id": english.id,
                "difficulty": "hard",
                "questions": [
                    {"text": "If I ___ rich, I would buy a car.", "option1": "am", "option2": "were", "option3": "was", "option4": "is", "correct_option": 2, "concept": "grammar"},
                    {"text": "If you heat water, it ___ .", "option1": "boils", "option2": "boil", "option3": "will boil", "option4": "would boil", "correct_option": 1, "concept": "grammar"},
                    {"text": "If they had studied, they ___ the exam.", "option1": "would pass", "option2": "will pass", "option3": "would have passed", "option4": "passed", "correct_option": 3, "concept": "grammar"}
                ]
            }
        ]

        for quiz_data in quizzes_data:
            create_quiz(
                title=quiz_data["title"],
                subject_id=quiz_data["subject_id"],
                difficulty=quiz_data["difficulty"],
                questions_data=quiz_data["questions"]
            )
        print("\n🎉 15 extra quizzes added successfully!")

print("\n✅ Database fully initialized.")