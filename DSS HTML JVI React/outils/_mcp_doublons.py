import re
from pathlib import Path
from collections import defaultdict
from _mcp_utils import collecter_fichiers_react

def doublons_composants(dossier: str) -> str:
    """Détecte si deux composants ou custom hooks portent le même nom.
    
    Args:
        dossier: Chemin absolu du dossier à analyser.
    """
    fichiers = collecter_fichiers_react(dossier)
    # Dictionnaire { "NomDuComposant": ["chemin/fichier1.jsx", "chemin/fichier2.jsx"] }
    noms_trouves = defaultdict(list)

    pattern_composant = re.compile(r'^(?:export\s+)?(?:default\s+)?(?:const|function)\s+([A-Z][a-zA-Z0-9_]*|use[A-Z][a-zA-Z0-9_]*)\s*(?:=|=>|\()', re.MULTILINE)

    for chemin in fichiers:
        try:
            with open(chemin, 'r', encoding='utf-8') as f:
                contenu = f.read()
            
            elements = pattern_composant.findall(contenu)
            rel_path = chemin.relative_to(dossier)
            
            for elem in elements:
                noms_trouves[elem].append(str(rel_path))
        except Exception:
            pass

    doublons = {nom: chemins for nom, chemins in noms_trouves.items() if len(chemins) > 1}

    if not doublons:
        return "✅ Aucun composant ou hook en doublon détecté. Bonne réutilisation !"

    resultats = ["👯 Doublons détectés (Violation de la Règle #9) :\n"]
    for nom, chemins in doublons.items():
        type_elem = "Hook" if nom.startswith('use') else "Composant"
        resultats.append(f"⚠️ {type_elem} '{nom}' est défini dans {len(chemins)} fichiers :")
        for c in chemins:
            resultats.append(f"  - {c}")
        resultats.append("") # Aérer

    return "\n".join(resultats)
