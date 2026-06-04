import re
from pathlib import Path
from _mcp_utils import collecter_fichiers_react

def imports_inutiles_js(dossier: str) -> str:
    """Détecte les imports qui semblent inutilisés dans le fichier.
    Attention : basé sur des expressions régulières, peut produire de faux positifs.
    
    Args:
        dossier: Chemin absolu du dossier à analyser.
    """
    fichiers = collecter_fichiers_react(dossier)
    resultats = []

    # Regex pour extraire le nom des variables importées
    # ex: import React, { useState, useEffect } from 'react';
    pattern_import = re.compile(r'import\s+([\w\s{},*]+)\s+from\s+[\'"][^\'"]+[\'"]')

    for chemin in fichiers:
        try:
            with open(chemin, 'r', encoding='utf-8') as f:
                contenu = f.read()
                
            imports_matches = pattern_import.findall(contenu)
            if not imports_matches:
                continue
                
            variables_importees = []
            for match in imports_matches:
                # Nettoyer les accolades et séparer par virgule
                nettoye = match.replace('{', '').replace('}', '').replace('* as ', '')
                parts = [p.strip() for p in nettoye.split(',')]
                variables_importees.extend([p for p in parts if p and p != 'React']) # React est souvent importé mais pas utilisé explicitement en JSX modern
                
            erreurs = []
            # Chercher si la variable est utilisée ailleurs dans le texte (hors ligne d'import)
            # Pour faire simple, on compte les occurrences. Si = 1, alors c'est uniquement dans l'import.
            for var in variables_importees:
                # Éviter les variables trop courtes qui causeraient des faux positifs
                if len(var) < 3:
                    continue
                # Compter les occurrences exactes (comme mot entier)
                occurrences = len(re.findall(r'\b' + re.escape(var) + r'\b', contenu))
                if occurrences == 1:
                    erreurs.append(f"  ⚠️ L'import '{var}' semble ne jamais être utilisé.")
                    
            if erreurs:
                rel_path = chemin.relative_to(dossier)
                resultats.append(f"📄 {rel_path}:\n" + "\n".join(erreurs))

        except Exception:
            pass

    if not resultats:
        return "✅ Aucun import apparemment inutile détecté."

    return "🧹 Imports potentiellement inutilisés :\n\n" + "\n\n".join(resultats)
