# llm_generator.py - Génération d'exercices personnalisés

from typing import List, Dict
from ollama_utils import call_ollama, parser_questions_robuste
import json

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

def generate_exercise_for_gap(concept, difficulty="medium"):
    prompt = f"""Génère un exercice de niveau {difficulty} sur le concept: "{concept}".
L'exercice doit être une question ouverte (pas QCM) avec une réponse textuelle courte (une ligne).
La question doit être précise et compréhensible sans contexte supplémentaire.
Réponds au format JSON strict, sans texte additionnel, comme ceci:
{{
    "question": "...",
    "correct_answer": "...",
    "explanation": "...",
    "difficulty": "{difficulty}"
}}
Assure-toi que le JSON est valide (pas de virgules en trop, pas de commentaires)."""
    
    response = call_ollama(prompt, max_tokens=500, temperature=0.7)
    if not response:
        return None

    # Nettoyer les éventuels backticks
    response = response.strip()
    if response.startswith("```json"):
        response = response[7:]
    if response.endswith("```"):
        response = response[:-3]
    response = response.strip()

    try:
        data = json.loads(response)
        # Vérifier les champs obligatoires
        for field in ['question', 'correct_answer', 'explanation']:
            if not data.get(field):
                raise ValueError(f"Missing {field}")
        # Limiter la longueur
        data['question'] = data['question'][:500]
        data['correct_answer'] = data['correct_answer'][:200]
        data['explanation'] = data['explanation'][:300]
        data['difficulty'] = difficulty
        return data
    except (json.JSONDecodeError, ValueError) as e:
        print(f"Erreur JSON: {e}\nRéponse brute: {response}")
        # Fallback : exercice minimal pour éviter de planter
        return {
            "question": f"Expliquer le concept : {concept}",
            "correct_answer": "Réponse dépend du cours",
            "explanation": "Cet exercice a été généré automatiquement suite à une erreur de format.",
            "difficulty": difficulty
        }