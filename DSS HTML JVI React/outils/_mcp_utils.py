import os
from pathlib import Path

# Les extensions de fichiers ciblées par notre analyseur Web
EXTENSIONS_JS = {".js", ".jsx", ".ts", ".tsx"}

def collecter_fichiers_react(dossier: str) -> list[Path]:
    """Retourne la liste de tous les fichiers JS/TS/JSX du projet, hors node_modules."""
    chemin_dossier = Path(dossier)
    fichiers = []
    
    if not chemin_dossier.exists() or not chemin_dossier.is_dir():
        return fichiers

    for racine, dirs, files in os.walk(dossier):
        # Exclure les dossiers ignorés
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        if '.git' in dirs:
            dirs.remove('.git')
        if 'dist' in dirs:
            dirs.remove('dist')
        if 'build' in dirs:
            dirs.remove('build')

        for f in files:
            p = Path(racine) / f
            if p.suffix in EXTENSIONS_JS and not p.name.endswith(".test.js") and not p.name.endswith(".test.jsx"):
                fichiers.append(p)

    return fichiers
