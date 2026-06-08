# content_manager.py - FIXED
import hashlib
import json
import tempfile
import os
from typing import List, Dict, Optional

from docx_parser import extraire_texte_docx, separer_cours_exercices
from ollama_utils import call_ollama, parser_questions_robuste

# FIX: import db correctly
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db import db
from models import Quiz, Question

def charger_document_et_creer_quiz(chemin_fichier: str, titre_quiz: str, subject_id: int,
                                   difficulte: str = "medium", teacher_id: Optional[int] = None) -> int:
    """
    Extrait le texte d'un fichier Word, génère des QCM via Ollama,
    crée un quiz et ses questions dans la base Flask.
    Retourne l'id du quiz créé.
    """
    # 1. Extraction du cours
    texte_complet = extraire_texte_docx(chemin_fichier)
    contenu = separer_cours_exercices(texte_complet)
    cours_texte = contenu["cours"]

    # 2. Génération des questions via Ollama
    prompt = f"""Génère 5 QCM en français à partir du cours ci-dessous.

Cours :
{cours_texte[:1500]}

Respecte ce format exact :

Question: [texte]
A) [option]
B) [option]
C) [option]
D) [option]
Réponse: [lettre]

Exemple :
Question: Qui a créé Python ?
A) Guido van Rossum
B) Dennis Ritchie
C) James Gosling
D) Brendan Eich
Réponse: A

Maintenant, génère 5 questions."""
    
    reponse = call_ollama(prompt, max_tokens=2000)
    if not reponse:
        raise Exception("Ollama n'a pas répondu")

    # Debug : on peut loguer la réponse brute (optionnel)
    # print("[DEBUG] Réponse brute :\n", reponse)

    questions_parsees = parser_questions_robuste(reponse)
    if not questions_parsees:
        raise Exception("Aucune question extraite du format attendu")

    # 3. Création du quiz dans la base principale
    new_quiz = Quiz(
        title=titre_quiz,
        subject_id=subject_id,
        difficulty=difficulte,
        teacher_id=teacher_id
    )
    db.session.add(new_quiz)
    db.session.flush()  # pour obtenir l'id sans commit

    # 4. Ajout des questions
    for q in questions_parsees:
        # q = {"texte": ..., "options": {"A":"...", ...}, "reponse_correcte": "..."}
        # Trouver la lettre de la bonne réponse
        correct_letter = None
        for letter, text in q["options"].items():
            if text == q["reponse_correcte"]:
                correct_letter = letter
                break
        if not correct_letter:
            # fallback : première option
            correct_letter = list(q["options"].keys())[0]

        correct_option_num = {"A": 1, "B": 2, "C": 3, "D": 4}.get(correct_letter, 1)

        question = Question(
            quiz_id=new_quiz.id,
            text=q["texte"],
            option1=q["options"].get("A", ""),
            option2=q["options"].get("B", ""),
            option3=q["options"].get("C", ""),
            option4=q["options"].get("D", ""),
            correct_option=correct_option_num,
            concept="généré_ia"
        )
        db.session.add(question)

    db.session.commit()
    return new_quiz.id