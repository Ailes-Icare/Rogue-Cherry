import re
from pathlib import Path
from _mcp_utils import collecter_fichiers_react

def dependances_react(dossier: str) -> str:
    """Affiche le graphe d'imports internes (qui importe quel composant).
    
    Args:
        dossier: Chemin absolu du dossier à analyser.
    """
    fichiers = collecter_fichiers_react(dossier)
    resultats = []

    # Regex pour matcher: import X from './MonComposant'
    # ou import { Y } from '../features/MonFichier'
    pattern_import = re.compile(r'import\s+.*?\s+from\s+[\'"]([^\'"]+)[\'"]')

    for chemin in fichiers:
        try:
            with open(chemin, 'r', encoding='utf-8') as f:
                contenu = f.read()
            
            imports = pattern_import.findall(contenu)
            imports_internes = [imp for imp in imports if imp.startswith('.')]
            
            if imports_internes:
                rel_path = chemin.relative_to(dossier)
                resultats.append(f"📄 {rel_path} importe :")
                for imp in imports_internes:
                    resultats.append(f"  🔗 {imp}")
                resultats.append("") # Ligne vide pour aérer
        except Exception:
            pass

    if not resultats:
        return "✅ Aucune dépendance interne trouvée (ou aucun fichier)."

    return "🕸️ Graphe des dépendances internes (Imports locaux) :\n\n" + "\n".join(resultats)
