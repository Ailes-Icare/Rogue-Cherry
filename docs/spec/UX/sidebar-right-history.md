# Sidebar Droite — Zone Centrale : Tableau d'Historique (Time-Travel)

## Vue d'ensemble

La zone centrale de la sidebar droite (`SidebarRight.jsx`) contient le tableau de la pile d'historique de versions (moteur Time-Travel). Ce tableau affiche la liste ordonnée de toutes les actions, imports, modifications et tags appliqués depuis le début du projet. Cliquer sur un enregistrement permet de remonter le temps en rechargeant l'état exact du code source à cette version donnée.

---

## Structure du tableau

Le tableau est composé de 5 colonnes et d'un en-tête fixé en haut (`sticky top-0`) de couleur `#262626` (bg-panel) avec une bordure de séparation sombre :

1. **Ver. (Version)** : Affiche le numéro de version incrémenté (ex: `0`, `1.0`, `1.1`).
2. **Label (Action)** : Description synthétique de la nature de la modification (ex: `[Import]`, `Replace`, `[Tag: v1.0]`).
3. **Commentaire** : Note textuelle décrivant la modification.
4. **Source** : Fichier sur lequel porte la modification (ex: `Fichier : 📁` ou le nom logique du fichier ciblé).
5. **Heure (Timestamp)** : Date et heure de l'action, accueillant également les boutons d'actions rapides lors de la sélection.

---

## Time-Travel et sélection de ligne

- **Clic sur une ligne** : Déclenche l'action de sélection d'index (`onSelectIndex(index)`). Le contrôleur d'historique reconstruit l'état du code source à cette étape précise (`rebuildTextAt`) et met à jour dynamiquement le contenu du `CodeEditor` principal. Cette reconstruction s'effectue en rejouant les deltas légers depuis le snapshot le plus proche (voir l'algorithme détaillé dans [json-project-schema-v8.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/fonction/json-project-schema-v8.md#4-algorithme-de-reconstruction-temporelle-rebuildtextat)).
- **Règle Multi-Fichiers (V9)** : Si l'utilisateur clique sur une version de l'historique liée à un fichier spécifique, la zone centrale bascule automatiquement sur l'onglet de ce fichier (en le rouvrant s'il avait été fermé) pour afficher le code correspondant. Le routing et le calcul de l'arborescence à cet index sont décrits dans [json-project-v9-specs.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/fonction/json-project-v9-specs.md#3-algorithme-de-reconstruction-de-lespace-de-travail-v9).

---

## États visuels et couleurs des lignes

L'affichage des lignes s'adapte à leur type et statut pour offrir un repérage rapide. Chaque ligne de l'interface correspond à un enregistrement JSON de la pile d'historique (voir [json-project-schema-v8.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/fonction/json-project-schema-v8.md#2-structure-des-enregistrements-dhistorique-history) pour les structures et types précis) :

| Type de ligne / État | Couleur de fond | Couleur du texte | Règle / Signification |
|---|---|---|---|
| **Ligne Standard** | `#262626` (hover: `#1e1e1e`) | Blanc cassé (`#text-light`) | Modification classique de type `replace`, sélectionnable. |
| **Ligne Sélectionnée** | `#37373d` | Blanc pur (Gras) | Version active affichée à l'écran. Bordure gauche bleue de 4px (`border-l-4 border-primary-blue`). |
| **Ligne Sauvegardée (`isSaved`)** | Idem | Bleu ciel (`#87cefa`) | Enregistrement de type `snapshot` ou marqué comme point de sauvegarde physique (fichier JSON). |
| **Ligne Ignorée (`isIgnored`)** | `#1e1e1e` (opacité 50%) | Gris sombre (`#555`) | Modification annulée ou désactivée de l'arbre d'historique principal (ex: masquée après Time-Travel). |
| **Ligne Info (`isInfo` - Événements)** | `#1a1a1a` | Gris (`#666`) (Italique) | Événement système de type `info` (ex: import, tags). Non sélectionnable au clic. |

### Surlignage d'Échecs d'Annulation (Smart Cancel visual highlights)

Lorsqu'une ligne d'échec d'annulation ("❌ Échec Annul.") est sélectionnée par l'utilisateur, l'application applique un surlignage coloré contextuel sur les autres lignes du tableau pour identifier la source du conflit :
- **Cible du conflit (`conflictTarget`)** : La ligne d'historique à l'origine de la collision est colorée en fond bleu-gris (`bg-[#1a2b3d]`), texte bleu clair (`text-blue-300`) et bordure gauche bleue (`border-l-4 border-blue-500`).
- **Bloqueurs du conflit (`conflictBlockers`)** : Les lignes de modifications intermédiaires qui empêchent l'annulation automatique sont colorées en fond rouge-gris (`bg-[#3d1a1a]`), texte rouge clair (`text-red-300`) et bordure gauche rouge (`border-l-4 border-red-500`).

---

## Micro-actions sur la ligne active

Des boutons de raccourcis rapides apparaissent dans la cellule **Heure** selon le type de ligne sélectionnée :

- **✏️ (Éditer)** : Ouvre la modale `EditRecordModal` pour renommer le label ou modifier le commentaire associé à cette version.
  - *Disponibilité* : Visible uniquement sur la ligne active sélectionnée (hors snapshots de départ et lignes d'infos).
- **🎯 (Cibler)** : Centre l'éditeur de code principal et fait défiler le curseur vers la ligne de code exacte qui a été affectée par cette modification (`onGoToRecord`).
  - *Disponibilité* : Visible uniquement sur la ligne active sélectionnée.
- **⚙️ (Smart Cancel)** : Génère une pile de modifications d'annulation intelligente (`onGenerateMultistack`) pour réparer les conflits d'annulation détectés.
  - *Disponibilité* : Visible uniquement sur les lignes de statut "❌ Échec Annul.".
- **♻️ (Recharger)** : Recharge la requête FIND/REPLACE de cette action passée directement dans les formulaires de saisie de la sidebar gauche.
  - *Disponibilité* : Visible uniquement sur les lignes de type "Replace" qui ont été ignorées (`isIgnored === true`).

---

## Responsive et défilement

- Le tableau d'historique dispose d'une hauteur fixe allouée par le splitter horizontal (`historyHeight`, par défaut à 50% de la hauteur de l'écran, minimum de 250px).
- Si le tableau dépasse cette hauteur, un défilement vertical interne (`overflow-y-auto`) avec une scrollbar personnalisée est activé.
- Si le toggle des mini-views comparatives est désactivé (`showMiniViews === false`), le tableau d'historique s'étire pour occuper 100% de la hauteur restante de la sidebar.

---

## Dépendances et références

- Voir [sidebar-right-top-project.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/sidebar-right-top-project.md) pour les boutons de chargement de projet au-dessus.
- Voir [sidebar-right-controls.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/sidebar-right-controls.md) pour la barre d'outils de navigation située sous le tableau.
- Voir [ui-layout-main.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/ui-layout-main.md) pour les règles de dimensionnement et de Splitter.
