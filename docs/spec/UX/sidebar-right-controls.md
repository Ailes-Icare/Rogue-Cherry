# Sidebar Droite — Zone Basse : Contrôles de Version & Actions

## Vue d'ensemble

La zone inférieure de la sidebar droite (`SidebarRight.jsx`) est située juste sous le tableau d'historique. Elle regroupe les outils de lecture des commentaires de versions, les badges d'états de requêtes passées, la barre de navigation pas-à-pas (Time-Travel), le bouton de ramification (New Branch), les micro-actions de requêtes (copie, annulation inversée, compression, suppression), ainsi que le panneau d'activation des mini-views comparatives.Elle est située entre le textbox de commentaires de l'action, qui se trouve directement sous la sidebar horizontale, et les textboxes avant et après qui se retrouvent en dessous. 

---

## Zone Commentaire de l'action sélectionnée

- **Affichage** : Zone de texte en lecture seule (`readOnly`) qui affiche le commentaire saisi par l'utilisateur (ou généré par l'IA) pour l'enregistrement sélectionné dans le tableau d'historique (`history[selectedIndex].comment`).Voir plus d'informations dans le fichier **"Sidebar right miniview.md"**.
- **Style** : Police sans-serif, texte en italique de couleur `#d4d4d4`, fond `#1e1e1e` (bg-dark) et hauteur fixe de 35px.
- **Badges d'en-tête (Informations de requête)** : À droite de l'en-tête "Commentaire de l'action", des badges colorés s'affichent dynamiquement selon la configuration de la version sélectionnée :
  - **Badge Violet `CHERRY-PICK [1, 3]`** : S'affiche si la version a été appliquée avec le mode `multiMode === true`. Il liste les index des occurrences sélectionnées.
    - *Note* : Les index stockés en BASE-0 dans le JSON sont convertis en **BASE-1** (ex: `0, 2` devient `[1, 3]`) dans le badge pour correspondre à la lecture humaine.
  - **Badge Bleu `SMART`** : S'affiche si l'option de tolérance aux espaces et à la casse (`ignoreSpaces === true`) était active lors de l'évaluation de cette version.

---

## Barre de boutons de navigation et d'actions (Hauteur `h-12`)

Cette ligne de contrôles permet de manipuler l'historique et de générer des requêtes :

- **Navigation pas-à-pas (Agencement Vertical)** :
  - Les boutons de navigation "Précédent" et "Suivant" sont positionnés l'un au-dessus de l'autre dans une unique colonne flex verticale de largeur fixe (`w-10 flex-shrink-0 h-12`).
  - **Bouton du haut (▲)** : Recule d'une version dans l'historique (Précédent, `selectedIndex - 1`). Désactivé si on se trouve sur la version de départ (index 0).
  - **Bouton du bas (▼)** : Avance d'une version dans l'historique (Suivant, `selectedIndex + 1`). Désactivé si on se trouve sur la dernière version.
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
- **Copier Requête (📋)** : Copie la requête unitaire Rogue Cherry brute correspondant à cette version dans le presse-papier (`onCopyAsRequest`).Cette requête est complète et comportera également les attributs label, commentaire, smart et multilignes. 
  - *Activation* : Désactivé si l'élément sélectionné est un snapshot initial ou une ligne d'information.
- **Smart Undo (⚙️↩️) — Annulation Intelligente** :
  - *Rôle* : Génère et applique une requête d'annulation inverse (interchangeant FIND et REPLACE, et restaurant le contexte d'origine, via `onUndoStrict`) pour l'action sélectionnée.
  - *Activation* : Actif uniquement si la version sélectionnée est de type "Replace".
  - *Comportement technique détaillé* : (Voir la section dédiée [Fonctionnement détaillé de l'Annulation Intelligente (Smart Undo)](#fonctionnement-detaille-de-lannulation-intelligente-smart-undo) ci-dessous).

- **Compresser (🗜️) — Fusion de l'historique** :
  - *Rôle* : Condense l'historique à partir de l'index sélectionné (`onCompress`).
  - *Comportement* : L'application supprime définitivement tous les enregistrements d'historique antérieurs à l'index sélectionné (y compris les deltas intermédiaires) et les remplace par un unique **Snapshot de compression** initial contenant le texte source consolidé à cette étape. Les versions postérieures à l'index sélectionné restent intactes à la suite de ce nouveau snapshot de départ.
  - *Finalité* : Optimiser la taille du fichier d'exportation JSON du projet (en éliminant les versions obsolètes accumulées) et nettoyer l'arborescence des anciennes modifications de brouillon, tout en conservant le code source dans son état actuel exact.
  - *Différence avec le Smart Undo* : Contrairement au Smart Undo qui ajoute une nouvelle modification réparatrice à la fin de l'historique sans toucher au passé, la compression **altère physiquement le passé** de l'historique en fusionnant les deltas, rendant impossible tout Time-Travel vers les étapes ainsi supprimées.

- **Supprimer dernier (🗑️) — Rétractation physique** :
  - *Rôle* : Supprime définitivement la toute dernière version de la pile d'historique.
  - *Activation* : Actif uniquement si la version sélectionnée est la version la plus récente (`selectedIndex === history.length - 1`). Déclenche une boîte de confirmation.
  - *Comportement* : Retire physiquement le dernier enregistrement du tableau d'historique et restaure instantanément le code source à l'état de la version immédiatement précédente.
  - *Différence avec le Smart Undo* : La suppression physique du dernier élément **efface toute trace** de cette modification de l'historique, comme si elle n'avait jamais eu lieu (audit trail altéré). Le Smart Undo, à l'inverse, crée une nouvelle version positive d'annulation qui s'ajoute à la suite, conservant l'enregistrement de l'erreur et de sa correction. De plus, "Supprimer dernier" est limité strictement au sommet de la pile, alors que le Smart Undo peut cibler n'importe quelle version de type "Replace" située n'importe où dans le passé de l'historique.

---

## Fonctionnement détaillé de l'Annulation Intelligente (Smart Undo)

Le Smart Undo (`onUndoStrict`) résout le problème complexe de l'annulation ciblée d'une modification passée au sein d'un historique linéaire, tout en préservant le travail intermédiaire effectué depuis lors.

### 1. Conditions d'application et de réussite (Cas simple)
Pour qu'une annulation simple réussisse directement, l'application vérifie deux critères :
1. **Absence de conflit sémantique** : Aucune modification ultérieure (située entre la version ciblée et le sommet de l'historique) ne doit avoir modifié la même zone de texte ou s'appuyer sur le texte produit par l'action que l'utilisateur souhaite annuler.
2. **Présence du motif dans le code final** : Le texte issu du remplacement de la requête d'origine (`replaceStr`) doit toujours exister à l'identique dans le texte source actuel.
Si ces conditions sont remplies, l'application effectue l'inversion : elle interchange le `findStr` et le `replaceStr`, et injecte cette nouvelle requête d'annulation à la fin de l'historique.

### 2. Cas du Cherry-Picking (Compensations Multi)
Lors de l'annulation d'une requête appliquée en mode Cherry-Picking (`multiMode === true` avec sélection d'indices spécifiques `multiIndices`) :
- **Perte du ciblage d'origine** : L'inversion directe de la requête détruit le ciblage initial par indices. Les positions des occurrences dans le code final ont très probablement bougé ou le texte a été modifié.
- **Compensation par validation globale (`multi` = `true`)** : Pour compenser cette perte de repères et garantir que le remplacement inverse s'applique correctement sur tous les emplacements qui avaient été modifiés, la requête d'annulation intelligente générée force l'attribut `multiMode` à `true` mais réinitialise le tableau de sélection des occurrences (`multiIndices` = `[]`). 
- **Effet** : La requête se comporte donc comme une requête globale (sans Cherry-Picking restrictif), ce qui permet de rétablir le texte d'origine partout où le motif inversé est rencontré dans le document actuel.

### 3. Gestion des collisions et échecs (Génération d'échec d'annulation)
Si des requêtes ultérieures entrent en collision avec la zone concernée par l'annulation, le Smart Undo direct est impossible car il casserait les modifications intermédiaires. L'application gère cette situation comme suit :
1. **Identification des conflits** : L'algorithme scanne toutes les versions postérieures. Si le texte de recherche (`findStr`) d'une version ultérieure chevauche la zone du `replaceStr` (ou du `findStr`) de la version à annuler, un conflit est détecté.
2. **Création d'un rapport d'échec dans l'historique** : Au lieu d'appliquer l'annulation, le système génère et pousse dans le tableau d'historique un enregistrement spécial de type `info` :
   - **Label** : `❌ Échec Annul.`
   - **Commentaire** : `Conflit avec : [Labels des versions bloqueuses]`
   - **Méta-données de conflit** : Contient l'index cible (`conflictTarget`) et la liste des index bloqueurs (`conflictBlockers`).
3. **Mise en valeur visuelle** : Au clic sur ce rapport d'échec dans le tableau d'historique, les lignes correspondantes de la cible et des bloqueurs sont mises en valeur dans le tableau (surlignages bleu et rouge).
4. **Bouton Smart Cancel (⚙️)** : L'icône d'engrenage apparaît de manière permanente sur cette ligne d'échec. Un clic dessus déclenche le **moteur de résolution intelligent** qui génère une pile Multistack contenant les requêtes correctives intermédiaires nécessaires pour débloquer et appliquer l'annulation de manière ordonnée.

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
