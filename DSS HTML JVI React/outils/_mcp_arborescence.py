from pathlib import Path
import os

def arborescence_react(dossier: str) -> str:
    """Affiche l'arborescence du projet React et signale les fichiers trop longs (> 150 lignes).
    
    Args:
        dossier: Chemin absolu du dossier à analyser.
    """
    chemin = Path(dossier)
    if not chemin.exists() or not chemin.is_dir():
        return f"❌ Le dossier {dossier} n'existe pas ou n'est pas un répertoire."

    lignes_sortie = [f"📂 Arborescence de : {dossier}\n"]
    alertes = []
    total_fichiers = 0
    total_lignes = 0

    for racine, dirs, files in os.walk(dossier):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        if '.git' in dirs:
            dirs.remove('.git')
        if 'dist' in dirs:
            dirs.remove('dist')

        niveau = racine.replace(dossier, '').count(os.sep)
        indent = ' ' * 4 * niveau
        nom_dossier = Path(racine).name or chemin.name
        
        if niveau > 0:
            lignes_sortie.append(f"{indent}📁 {nom_dossier}/")

        for f in files:
            p = Path(racine) / f
            if p.suffix in {".js", ".jsx", ".ts", ".tsx", ".css"}:
                try:
                    with open(p, 'r', encoding='utf-8', errors='ignore') as fichier:
                        nb_lignes = sum(1 for _ in fichier)
                    
                    sub_indent = ' ' * 4 * (niveau + 1)
                    symbole = "📄"
                    if p.suffix in {".jsx", ".tsx"}:
                        symbole = "⚛️"
                        
                    lignes_sortie.append(f"{sub_indent}{symbole} {f} ({nb_lignes} L)")
                    
                    total_fichiers += 1
                    total_lignes += nb_lignes

                    # Alerte Frontend : Un composant ne devrait pas faire 300 lignes.
                    if nb_lignes > 150:
                        alertes.append(f"{p.relative_to(dossier)} ({nb_lignes} L)")

                except Exception:
                    pass

    resume = f"\n📊 Résumé : {total_fichiers} fichiers analysés, {total_lignes} lignes de code au total."
    
    if alertes:
        resume += "\n\n⚠️ ALERTES - Fichiers trop longs (> 150 lignes) :\n"
        for alerte in alertes:
            resume += f"  - {alerte} → À découper (Refactor)\n"
    else:
        resume += "\n\n✅ Aucun fichier ne dépasse 150 lignes. Bonne modularité !"

    return "\n".join(lignes_sortie) + "\n" + resume
