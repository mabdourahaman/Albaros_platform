# initdb.py - Version enrichie avec cours, exercices et quiz par matière
from app import app, db
from models import User, Subject, Course, Exercise, Quiz, Question, Gap
from quiz_service import get_or_create_gaps_course

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
    # On vérifie si le cours existe déjà (optionnel)
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

def create_quiz(title, subject, teacher, difficulty, questions_data):
    quiz = Quiz(
        title=title,
        subject_id=subject.id,
        difficulty=difficulty,
        teacher_id=teacher.id
    )
    db.session.add(quiz)
    db.session.flush()
    for qd in questions_data:
        question = Question(
            quiz_id=quiz.id,
            text=qd['text'],
            option1=qd['option1'],
            option2=qd['option2'],
            option3=qd.get('option3', ''),
            option4=qd.get('option4', ''),
            correct_option=qd['correct_option'],
            concept=qd.get('concept', 'seed')
        )
        db.session.add(question)
    db.session.flush()
    print(f"✅ Quiz created: {title}")
    return quiz

with app.app_context():
    # ---------- 1. Création des enseignants ----------
    teacher_math = create_user(massar=1111, username="teacher_math", email="math@example.com", password="teacher123", role="teacher")
    teacher_physics = create_user(massar=2222, username="teacher_physics", email="physics@example.com", password="teacher123", role="teacher")
    teacher_english = create_user(massar=3333, username="teacher_english", email="english@example.com", password="teacher123", role="teacher")

    # ---------- 2. Création des matières ----------
    math_subj = create_subject("Mathématiques", "Cours de mathématiques", teacher_math)
    physics_subj = create_subject("Physique", "Cours de physique", teacher_physics)
    english_subj = create_subject("Anglais", "Cours d'anglais", teacher_english)

    # ---------- 3. Création des cours (un par matière, avec contenu texte) ----------
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

    # ---------- 4. Création de 4 exercices par matière ----------
    # Exercices Maths
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
    create_exercise(math_course,
        "Calculez l'intégrale de 0 à 2 de (x+1) dx",
        "4",
        "Primitive: (x²/2 + x) entre 0 et 2 = (2+2) - 0 = 4",
        difficulty="hard", tags="integrals")
    create_exercise(math_course,
        "Résoudre 2x + 5 = 13",
        "x=4",
        "2x = 8 => x = 4",
        difficulty="easy", tags="equations")

    # Exercices Physique
    create_exercise(physics_course,
        "Un objet de masse 10 kg est soumis à une force de 50 N. Quelle est son accélération ?",
        "5 m/s²",
        "a = F/m = 50/10 = 5 m/s²",
        difficulty="easy", tags="newton")
    create_exercise(physics_course,
        "Calculez l'énergie cinétique d'un véhicule de 1000 kg roulant à 20 m/s",
        "200 000 J",
        "Ec = 1/2 * m * v² = 0.5 * 1000 * 400 = 200 000 J",
        difficulty="medium", tags="energy")
    create_exercise(physics_course,
        "La force gravitationnelle entre deux masses est-elle proportionnelle à 1/r ou 1/r² ?",
        "1/r²",
        "La loi de Newton dit F = G*m1*m2 / r²",
        difficulty="easy", tags="gravity")
    create_exercise(physics_course,
        "Un pendule simple de longueur 1 m a une période de ? (g≈10 m/s²)",
        "environ 2 s",
        "T = 2π√(L/g) ≈ 2*3.14*√(0.1) ≈ 1.98 s",
        difficulty="hard", tags="oscillations")

    # Exercices Anglais
    create_exercise(english_course,
        "What is the past tense of 'to eat'?",
        "ate",
        "Irregular verb: eat - ate - eaten",
        difficulty="easy", tags="verbs")
    create_exercise(english_course,
        "Complete the sentence: 'If I were rich, I ____ buy a car.' (use would)",
        "would",
        "Second conditional: If + past simple, would + base form",
        difficulty="medium", tags="conditionals")
    create_exercise(english_course,
        "Which word is a synonym for 'happy'?",
        "joyful",
        "Synonyms: joyful, delighted, cheerful",
        difficulty="easy", tags="vocabulary")
    create_exercise(english_course,
        "Rewrite the sentence in passive voice: 'The chef cooks the meal.'",
        "The meal is cooked by the chef.",
        "Passive: object + be + past participle + by + subject",
        difficulty="medium", tags="passive")

    # ---------- 5. Création des quiz (un par matière) avec 3 questions chacun ----------
    maths_questions = [
        {"text": "Quelle est la dérivée de x² ?", "option1": "x", "option2": "2x", "option3": "x²", "option4": "1", "correct_option": 2, "concept": "derivation"},
        {"text": "La somme des angles d'un triangle est :", "option1": "90°", "option2": "180°", "option3": "270°", "option4": "360°", "correct_option": 2, "concept": "geometry"},
        {"text": "Si f(x)=3x+2, que vaut f(2) ?", "option1": "6", "option2": "8", "option3": "10", "option4": "4", "correct_option": 2, "concept": "functions"}
    ]
    create_quiz("Quiz Mathématiques", math_subj, teacher_math, "medium", maths_questions)

    physics_questions = [
        {"text": "La force gravitationnelle varie en :", "option1": "1/r", "option2": "1/r²", "option3": "r", "option4": "r²", "correct_option": 2, "concept": "gravity"},
        {"text": "L'unité de la puissance électrique est :", "option1": "Volt", "option2": "Ampère", "option3": "Watt", "option4": "Joule", "correct_option": 3, "concept": "electricity"},
        {"text": "Quelle est la formule de l'énergie cinétique ?", "option1": "mv", "option2": "½mv²", "option3": "mgh", "option4": "½kx²", "correct_option": 2, "concept": "energy"}
    ]
    create_quiz("Quiz Physique", physics_subj, teacher_physics, "medium", physics_questions)

    english_questions = [
        {"text": "What is the past tense of 'go'?", "option1": "Goed", "option2": "Went", "option3": "Gone", "option4": "Going", "correct_option": 2, "concept": "verbs"},
        {"text": "Which word is a synonym for 'happy'?", "option1": "Sad", "option2": "Joyful", "option3": "Angry", "option4": "Tired", "correct_option": 2, "concept": "vocabulary"},
        {"text": "Choose the correct sentence:", "option1": "She go to school.", "option2": "She goes to school.", "option3": "She going to school.", "option4": "She went to school yesterday.", "correct_option": 2, "concept": "grammar"}
    ]
    create_quiz("Quiz English", english_subj, teacher_english, "easy", english_questions)

    # ---------- 6. Création de 4 étudiants ----------
    student_data = [
        (1234, "alice", "alice@example.com", "123"),
        (2001, "bob", "bob@example.com", "123"),
        (2002, "carol", "carol@example.com", "123"),
        (2003, "dave", "dave@example.com", "123"),
    ]
    for massar, username, email, pwd in student_data:
        create_user(massar, username, email, pwd, "student")

    # ---------- 7. Création d'un gap pour Alice (fractions) ----------
    alice = User.query.filter_by(username="alice").first()
    if alice:
        if not Gap.query.filter_by(user_id=alice.id, concept="fractions").first():
            gap = Gap(user_id=alice.id, concept="fractions", mastery_level=30.0)
            db.session.add(gap)
            print("✅ Gap created for Alice on 'fractions'")
    else:
        print("⚠️ Alice not found, cannot create gap")

    # ---------- 8. Création du cours "Gaps Exercises" (utilisé par l'IA) ----------
    gaps_course = get_or_create_gaps_course()
    print(f"✅ Gaps course ready: {gaps_course.title}")

    db.session.commit()
    print("\n🎉 Database seeding completed successfully!")