import re
from pathlib import Path
from _mcp_utils import collecter_fichiers_react

def rapport_composants(dossier: str) -> str:
    """Liste tous les Composants React et les Custom Hooks du projet.
    
    Args:
        dossier: Chemin absolu du dossier à analyser.
    """
    fichiers = collecter_fichiers_react(dossier)
    resultats = []

    # Regex pour trouver les composants fonctionnels React et les Hooks
    # ex: const MyComponent = () => { ... }
    # ou: function MyComponent() { ... }
    # ou: const useSomething = () => { ... }
    pattern_composant = re.compile(r'^(?:export\s+)?(?:default\s+)?(?:const|function)\s+([A-Z][a-zA-Z0-9_]*|use[A-Z][a-zA-Z0-9_]*)\s*(?:=|=>|\()', re.MULTILINE)

    for chemin in fichiers:
        try:
            with open(chemin, 'r', encoding='utf-8') as f:
                contenu = f.read()
            
            elements = pattern_composant.findall(contenu)
            if elements:
                rel_path = chemin.relative_to(dossier)
                resultats.append(f"\n📄 {rel_path}:")
                for elem in elements:
                    if elem.startswith('use'):
                        resultats.append(f"  🎣 {elem} (Custom Hook)")
                    else:
                        resultats.append(f"  ⚛️ {elem} (Composant)")
        except Exception:
            pass

    if not resultats:
        return "✅ Aucun composant React ou Hook détecté dans ce dossier."

    entete = "📋 Rapport des Composants et Hooks React :\n"
    return entete + "\n".join(resultats)
