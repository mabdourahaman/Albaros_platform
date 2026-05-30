# recommender.py

def segmenter_cours(cours_texte: str) -> list:
    """Découpe le cours en sections basées sur les doubles retours à la ligne."""
    sections = cours_texte.split("\n\n")
    return [s.strip() for s in sections if len(s.strip()) > 50]

def recommander_chapitres(cours_texte: str, niveau_utilisateur: float) -> list:
    """Retourne les chapitres avec difficulté croissante."""
    sections = segmenter_cours(cours_texte)
    chapitres = []
    for idx, section in enumerate(sections[:5]):  # seulement les 5 premières sections
        # Difficulté basée sur l'ordre (premier chapitre plus facile)
        difficulte = min(20, idx * 2 + 1)
        chapitres.append({
            "titre": f"Chapitre {idx+1}",
            "contenu": section[:300],
            "difficulte": round(difficulte, 1)
        })
    return chapitres