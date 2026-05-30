# docx_parser.py

import docx
import re
from typing import Dict

def extraire_texte_docx(chemin_fichier: str) -> str:
    doc = docx.Document(chemin_fichier)
    return "\n\n".join([para.text for para in doc.paragraphs])

def separer_cours_exercices(texte: str) -> Dict[str, str]:
    pattern = r'(?i)(?:exercice|question|problème).*?(?:\n|$)'
    sections = re.split(pattern, texte, maxsplit=1)
    if len(sections) >= 2:
        return {"cours": sections[0].strip(), "exercices": "Exercice/Question" + sections[1].strip()}
    return {"cours": texte.strip(), "exercices": ""}