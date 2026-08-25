# Spécifications : Flux de Projet & Historique (DÉPRÉCIÉ)

> [!IMPORTANT]
> **Ce fichier de spécification unique a été scindé et remplacé** pour offrir une structure modulaire et plus précise correspondant aux différentes zones de la sidebar droite (`SidebarRight.jsx`). 
> 
> Veuillez consulter les nouveaux fichiers de spécification dédiés :

1. **Zone Haute (Gestion de Projet & Onglets)** :
   - [sidebar-right-top-project.md](sidebar-right-top-project.md) — Décrit l'import/sauvegarde JSON, le bouton RESET responsive, et les futures fonctionnalités V9 d'onglets projets et de boutons de sauvegarde divisés "TOUT".
2. **Zone Centrale (Tableau d'Historique - Time-Travel)** :
   - [sidebar-right-history.md](sidebar-right-history.md) — Décrit la table d'historique, la navigation temporelle, les statuts colorés de versions, les surlignages d'échecs d'annulation, et les micro-actions (✏️, 🎯, ⚙️, ♻️).
3. **Barre de Contrôles & Actions** :
   - [sidebar-right-controls.md](sidebar-right-controls.md) — Décrit le cadre commentaire avec badges (SMART / CHERRY-PICK), la navigation Préc/Suiv, le bouton New Branch responsive, la copie de requête brute, et les boutons utilitaires (Smart Undo, compression, suppression).
4. **Mini-Views comparative (AVANT / APRÈS)** :
   - [sidebar-right-miniviews.md](sidebar-right-miniviews.md) — Décrit le contenu des miniatures, la colorisation DraftSurge intra-ligne (`renderDiffSegment`), le défilement synchronisé bidirectionnel (Scroll-Sync) et le zoom indépendant.

Pour les règles de layout global, de splitters et de priorités de repli réactif, référez-vous à :
- [ui-layout-main.md](ui-layout-main.md) — Document de référence du layout principal.
