from pathlib import Path
from _mcp_utils import collecter_fichiers_react

def couverture_tests_react(dossier: str) -> str:
    """Vérifie si chaque composant majeur a un fichier de test associé.
    
    Args:
        dossier: Chemin absolu du dossier à analyser.
    """
    chemin_dossier = Path(dossier)
    fichiers = collecter_fichiers_react(dossier)
    
    # On cherche tous les fichiers .test.js ou .test.jsx dans le projet
    tous_les_fichiers = list(chemin_dossier.rglob("*.*"))
    fichiers_tests = [f.name for f in tous_les_fichiers if f.name.endswith('.test.js') or f.name.endswith('.test.jsx') or f.name.endswith('.test.ts') or f.name.endswith('.test.tsx')]
    
    resultats = []
    
    for chemin in fichiers:
        nom_base = chemin.stem # ex: Button.jsx -> Button
        
        # On vérifie si Button.test.jsx, Button.test.js, etc. existe
        test_trouve = False
        for ext in ['.test.js', '.test.jsx', '.test.ts', '.test.tsx', '.spec.js', '.spec.jsx']:
            if (nom_base + ext) in fichiers_tests:
                test_trouve = True
                break
                
        if not test_trouve:
            # Ne reporter que les composants (ceux qui commencent par une majuscule ou un hook useX)
            if nom_base[0].isupper() or nom_base.startswith('use'):
                rel_path = chemin.relative_to(dossier)
                resultats.append(f"  ❌ {rel_path} (Pas de test trouvé)")

    if not resultats:
        return "✅ Tous les composants et hooks ont un fichier de test associé !"

    return f"🛡️ Fichiers sans couverture de test apparente ({len(resultats)} éléments) :\n\n" + "\n".join(resultats)
