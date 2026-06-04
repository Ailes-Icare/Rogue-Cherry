import re
from pathlib import Path
from _mcp_utils import collecter_fichiers_react

def detecter_anti_patterns(dossier: str) -> str:
    """Traque les anti-patterns React (CSS inline, manipulation directe du DOM).
    
    Args:
        dossier: Chemin absolu du dossier à analyser.
    """
    fichiers = collecter_fichiers_react(dossier)
    resultats = []

    # Regex pour les anti-patterns
    # 1. CSS Inline: style={{ ... }}
    pattern_style_inline = re.compile(r'style=\{\{.*?\}\}', re.DOTALL)
    # 2. Manipulation du DOM direct: document.getElementById ou document.querySelector
    pattern_dom = re.compile(r'document\.(getElementById|querySelector|getElementsByClassName)')

    for chemin in fichiers:
        try:
            with open(chemin, 'r', encoding='utf-8') as f:
                contenu = f.read()
                lignes = contenu.split('\n')
            
            rel_path = chemin.relative_to(dossier)
            erreurs_fichier = []

            # Recherche CSS Inline
            if pattern_style_inline.search(contenu):
                erreurs_fichier.append("  ⚠️ CSS Inline détecté (`style={{...}}`). Utilisez Tailwind CSS (`className=\"...\"`) à la place.")

            # Recherche Manipulation DOM
            for i, ligne in enumerate(lignes):
                if pattern_dom.search(ligne):
                    erreurs_fichier.append(f"  🛑 Manipulation directe du DOM ligne {i+1} (`document.getElement...`). Utilisez des `useRef` React.")

            if erreurs_fichier:
                resultats.append(f"📄 {rel_path}:\n" + "\n".join(erreurs_fichier))

        except Exception:
            pass

    if not resultats:
        return "✅ Aucun anti-pattern critique détecté (CSS inline ou Manipulation DOM)."

    return "🚨 Anti-patterns React détectés :\n\n" + "\n\n".join(resultats)
