import requests
import re
from typing import List, Dict

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "phi3:mini"

def call_ollama(prompt: str, temperature: float = 0.7, max_tokens: int = 2000, timeout: int = 180) -> str:
    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False,
        "format": "json",
        "options": {"temperature": temperature, "num_predict": max_tokens}
    }
    try:
        r = requests.post(OLLAMA_URL, json=payload, timeout=timeout)
        r.raise_for_status()
        return r.json().get("response", "")
    except Exception as e:
        print(f"❌ Erreur Ollama : {e}")
        return ""

def parser_questions_robuste(raw: str) -> List[Dict]:
    """Parse les questions au format '1. Question : ...' ou 'Question: ...'"""
    questions = []
    lines = raw.split('\n')
    question_text = ""
    options = {}
    answer = ""

    for line in lines:
        line = line.strip()
        # Détecte le début d'une question : soit "1. Question", soit "Question 1", soit "Question:"
        if re.match(r'^\d+\.\s*Question', line, re.IGNORECASE) or \
           re.match(r'^Question\s*\d*', line, re.IGNORECASE):
            # Sauvegarder la question précédente
            if question_text and options and answer:
                questions.append({
                    "texte": question_text,
                    "options": options,
                    "reponse_correcte": options.get(answer, ""),
                    "difficulte": 3
                })
            # Nettoyer la ligne pour ne garder que le texte de la question
            # Supprime "1. Question :" ou "Question 1 :"
            temp = re.sub(r'^\d+\.\s*', '', line, flags=re.IGNORECASE)
            temp = re.sub(r'^Question\s*\d*\s*[:.]?\s*', '', temp, flags=re.IGNORECASE)
            question_text = temp
            options = {}
            answer = ""
        # Capture les options : A) texte, B) texte, etc.
        elif re.match(r'^[A-D][\)\.]\s+', line):
            lettre = line[0].upper()
            opt_texte = line[3:].strip()
            options[lettre] = opt_texte
        # Capture la réponse : "Réponse: B"
        elif re.match(r'^Réponse\s*:', line, re.IGNORECASE):
            match_ans = re.search(r'([A-D])', line, re.IGNORECASE)
            if match_ans:
                answer = match_ans.group(1).upper()

    # Dernière question
    if question_text and options and answer:
        questions.append({
            "texte": question_text,
            "options": options,
            "reponse_correcte": options.get(answer, ""),
            "difficulte": 3
        })
    return questions