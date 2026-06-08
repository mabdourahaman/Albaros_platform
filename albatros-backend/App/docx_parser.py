# docx_parser.py

import docx
import re
from typing import List, Dict, Union

def extraire_texte_docx(chemin_fichier: str) -> str:
    doc = docx.Document(chemin_fichier)
    return "\n\n".join([para.text for para in doc.paragraphs])

def separer_cours_exercices(texte: str) -> Dict[str, str]:
    pattern = r'(?i)(?:exercice|question|problème).*?(?:\n|$)'
    sections = re.split(pattern, texte, maxsplit=1)
    if len(sections) >= 2:
        return {"cours": sections[0].strip(), "exercices": "Exercice/Question" + sections[1].strip()}
    return {"cours": texte.strip(), "exercices": ""}


def extraire_exercices_depuis_texte(texte: str) -> List[Dict]:
    """
    Extrait les exercices (QCM ou question/réponse) depuis le texte brut d'un fichier DOCX.
    Retourne une liste d'exercices avec leur format détecté.
    """
    lignes = texte.split('\n')
    exercices = []
    i = 0
    while i < len(lignes):
        ligne = lignes[i].strip()
        if not ligne:
            i += 1
            continue
        
        # --- Détection d'une question (simple ou début de QCM) ---
        # Patterns possibles : "Question : ...", "1. ...", "Q1 ...", etc.
        match_question = re.match(r'^(?:Question\s*[:.]?\s*|(\d+)[\.\s]+)', ligne, re.IGNORECASE)
        if match_question:
            # Nettoyer le texte de la question
            question_text = re.sub(r'^(?:Question\s*[:.]?\s*|\d+[\.\s]+)', '', ligne, flags=re.IGNORECASE).strip()
            if not question_text:
                # La question peut être sur la ligne suivante
                i += 1
                if i < len(lignes):
                    question_text = lignes[i].strip()
            
            # Regarder les lignes suivantes pour détecter le type d'exercice
            options = {}
            answer = None
            j = i + 1
            # On avance pour collecter les options ou la réponse
            while j < len(lignes):
                next_line = lignes[j].strip()
                if not next_line:
                    j += 1
                    continue
                
                # Détection d'option QCM : A) texte, A. texte, etc.
                opt_match = re.match(r'^([A-D])[\)\.]\s+(.*)', next_line, re.IGNORECASE)
                if opt_match:
                    lettre = opt_match.group(1).upper()
                    opt_texte = opt_match.group(2).strip()
                    options[lettre] = opt_texte
                    j += 1
                    continue
                
                # Détection de réponse : "Réponse : X" ou "Answer: X"
                rep_match = re.match(r'^(?:Réponse|Answer)\s*[:.]?\s*(.*)', next_line, re.IGNORECASE)
                if rep_match:
                    rep_brut = rep_match.group(1).strip()
                    # Si c'est une lettre (A, B, C, D) et qu'on a des options, c'est un QCM
                    if len(rep_brut) == 1 and rep_brut.upper() in 'ABCD' and options:
                        answer = rep_brut.upper()
                    else:
                        # Sinon, c'est une réponse textuelle (question simple)
                        answer = rep_brut
                    j += 1
                    break
                
                # Si on rencontre une nouvelle question, on arrête
                if re.match(r'^(?:Question\s*[:.]?\s*|\d+[\.\s]+)', next_line, re.IGNORECASE):
                    break
                
                # Sinon, on avance (par exemple si la réponse est sur plusieurs lignes)
                j += 1
            
            # Déterminer le type d'exercice
            if options and answer and answer in options:
                # QCM valide
                exercices.append({
                    "type": "qcm",
                    "question": question_text,
                    "options": [options.get("A", ""), options.get("B", ""), options.get("C", ""), options.get("D", "")],
                    "correct_answer": options[answer],
                    "correct_letter": answer
                })
            elif answer:
                # Question simple avec réponse textuelle
                exercices.append({
                    "type": "simple",
                    "question": question_text,
                    "correct_answer": answer
                })
            else:
                # Fallback : on stocke quand même la question sans réponse connue
                exercices.append({
                    "type": "unknown",
                    "question": question_text,
                    "correct_answer": None
                })
            
            i = j  # continuer après l'exercice
        else:
            i += 1
    
    return exercices