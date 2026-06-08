# check_quizzes_data.py
import sqlite3
import os

DB_PATH = "users.db"  # adaptez si votre base s'appelle différemment

def main():
    if not os.path.exists(DB_PATH):
        print(f"❌ La base {DB_PATH} n'existe pas.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Vérifier les matières
    print("\n📚 Matières (subjects) :")
    print("-" * 40)
    cursor.execute("SELECT id, name FROM subjects;")
    subjects = cursor.fetchall()
    if subjects:
        for row in subjects:
            print(f"  id: {row[0]} | name: {row[1]}")
    else:
        print("  Aucune matière trouvée.")

    # 2. Vérifier les quiz
    print("\n📝 Quiz (quizzes) :")
    print("-" * 40)
    cursor.execute("SELECT id, title, subject_id FROM quizzes;")
    quizzes = cursor.fetchall()
    if quizzes:
        for row in quizzes:
            print(f"  id: {row[0]} | title: {row[1]} | subject_id: {row[2]}")
    else:
        print("  Aucun quiz trouvé.")

    # 3. Vérifier les correspondances (optionnel)
    print("\n🔗 Correspondances sujet ↔ quiz :")
    print("-" * 40)
    if subjects and quizzes:
        subject_ids = {s[0] for s in subjects}
        for quiz in quizzes:
            quiz_id, title, subj_id = quiz
            if subj_id in subject_ids:
                print(f"  ✅ Quiz '{title}' (id {quiz_id}) -> sujet id {subj_id}")
            else:
                print(f"  ❌ Quiz '{title}' (id {quiz_id}) -> sujet id {subj_id} INTROUVABLE")
    else:
        print("  Données manquantes pour vérifier les correspondances.")

    conn.close()

if __name__ == "__main__":
    main()