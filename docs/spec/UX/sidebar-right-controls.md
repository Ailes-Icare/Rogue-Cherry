# Sidebar Droite — Zone Basse : Contrôles de Version & Actions

## Vue d'ensemble

La zone inférieure de la sidebar droite (`SidebarRight.jsx`) est située juste sous le tableau d'historique. Elle regroupe les outils de lecture des commentaires de versions, les badges d'états de requêtes passées, la barre de navigation pas-à-pas (Time-Travel), le bouton de ramification (New Branch), les micro-actions de requêtes (copie, annulation inversée, compression, suppression), ainsi que le panneau d'activation des mini-views comparatives.

---

## Zone Commentaire de l'action sélectionnée

- **Affichage** : Zone de texte en lecture seule (`readOnly`) qui affiche le commentaire saisi par l'utilisateur (ou généré par l'IA) pour l'enregistrement sélectionné dans le tableau d'historique (`history[selectedIndex].comment`).
- **Style** : Police sans-serif, texte en italique de couleur `#d4d4d4`, fond `#1e1e1e` (bg-dark) et hauteur fixe de 35px.
- **Badges d'en-tête (Informations de requête)** : À droite de l'en-tête "Commentaire de l'action", des badges colorés s'affichent dynamiquement selon la configuration de la version sélectionnée :
  - **Badge Violet `CHERRY-PICK [1, 3]`** : S'affiche si la version a été appliquée avec le mode `multiMode === true`. Il liste les index des occurrences sélectionnées.
    - *Note* : Les index stockés en BASE-0 dans le JSON sont convertis en **BASE-1** (ex: `0, 2` devient `[1, 3]`) dans le badge pour correspondre à la lecture humaine.
  - **Badge Bleu `SMART`** : S'affiche si l'option de tolérance aux espaces et à la casse (`ignoreSpaces === true`) était active lors de l'évaluation de cette version.

---

## Barre de boutons de navigation et d'actions (Hauteur `h-12`)

Cette ligne de contrôles permet de manipuler l'historique et de générer des requêtes :

- **Navigation pas-à-pas** :
  - **◀ Préc.** : Recule d'une version dans l'historique (`selectedIndex - 1`). Désactivé si on se trouve sur la version de départ (index 0).
  - **Suiv. ▶** : Avance d'une version dans l'historique (`selectedIndex + 1`). Désactivé si on se trouve sur la dernière version.
- **Bouton "New Branch"** :
  - *Rôle* : Ouvre la modale `VersionTagModal` en mode `branch` pour créer un nouveau point d'embranchement à partir de la version sélectionnée.
  - *Style* : Fond rouge cerise (`bg-cherry-red hover:bg-cherry-red-hover`), gras.
  - *Comportement responsive (`ResizeObserver`)* : Adapte son affichage selon sa largeur `branchBtnWidth` :
    - `>= 170 px` : Libellé "New Branch" + icône SVG de ramification.
    - `>= 110 px` : Texte et icône réduits proportionnellement.
    - `>= 85 px` : Texte sur deux lignes "New\nBranch" + icône.
    - `>= 60 px` : Texte sur deux lignes "New\nBranch" + icône très réduite.
    - `>= 40 px` : Texte seul "New\nBranch".
    - `< 40 px` : Icône SVG seule.
- **Copier Requête (📋)** : Copie la requête unitaire Rogue Cherry brute correspondant à cette version dans le presse-papier (`onCopyAsRequest`).
  - *Activation* : Désactivé si l'élément sélectionné est un snapshot initial ou une ligne d'information.
- **Smart Undo (⚙️↩️)** :
  - *Rôle* : Génère intelligemment une requête d'annulation inverse (interchangeant FIND et REPLACE, et restaurant le contexte d'origine, via `onUndoStrict`) pour l'action sélectionnée.
  - *Activation* : Actif uniquement si la version sélectionnée est de type "Replace".
- **Compresser (🗜️)** : Ouvre une boîte de dialogue demandant confirmation pour compresser et fusionner l'historique à partir de l'index sélectionné (`onCompress`).
- **Supprimer dernier (🗑️)** : Supprime définitivement la toute dernière version de la pile d'historique.
  - *Activation* : Actif uniquement si la version sélectionnée est la version la plus récente (`selectedIndex === history.length - 1`). Déclenche une MessageBox de confirmation.

---

## Contrôles des miniatures (Mini-Views)

À l'extrême droite de la barre de boutons, une section permet de piloter les miniatures de comparaison de code :

- **Bouton de liaison (🔗 / 🔓)** : Active ou désactive le défilement synchronisé bidirectionnel (`isSyncScroll`) entre la miniature AVANT et la miniature APRÈS.
- **Bouton d'affichage (Afficher ▼ / Masquer ▲)** : Active ou désactive l'état `showMiniViews`, masquant ou affichant l'intégralité du panneau comparatif inférieur pour libérer de l'espace vertical pour le tableau d'historique.

---

## Dépendances et références

- Voir [sidebar-right-history.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/sidebar-right-history.md) pour le tableau d'historique situé au-dessus.
- Voir [sidebar-right-miniviews.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/sidebar-right-miniviews.md) pour les miniatures AVANT/APRÈS situées au-dessous.
- Voir [ui-layout-main.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/ui-layout-main.md) pour les règles de responsive et d'agencement.
