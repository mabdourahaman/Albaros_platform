# llm_generator.py - Génération d'exercices personnalisés

from typing import List, Dict
from ollama_utils import call_ollama, parser_questions_robuste

def generer_exercices_personnalises(niveau_utilisateur: float, themes: List[str], nb_questions: int = 3) -> List[Dict]:
    """Génère des QCM adaptés au niveau et aux thèmes donnés."""
    prompt = f"""Génère {nb_questions} QCM en français pour un étudiant de niveau {niveau_utilisateur:.1f}/20.
Thèmes : {', '.join(themes)}.

Respecte ce format exact :

Question: [texte]
A) [option]
B) [option]
C) [option]
D) [option]
Réponse: [lettre]

Exemple :
Question: Quelle est la capitale de la France ?
A) Berlin
B) Madrid
C) Paris
D) Londres
Réponse: C

Maintenant, génère {nb_questions} questions."""
    
    raw = call_ollama(prompt, temperature=0.8, max_tokens=1500)
    if not raw:
        return []
    
    questions = parser_questions_robuste(raw)
    # Ajuster la difficulté en fonction du niveau (personnalisation)
    for q in questions:
        q["difficulte"] = round(max(1.0, min(10.0, 10 - (niveau_utilisateur / 2))), 1)
    return questions