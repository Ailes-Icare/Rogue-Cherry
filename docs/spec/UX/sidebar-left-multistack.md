# Sidebar Gauche — Zone Multi-Stack (Pile de Requêtes)

## Vue d'ensemble

La zone multi-stack occupe la partie intermédiaire haute de la sidebar gauche (`SidebarLeft.jsx`), située juste en dessous de l'Assistant format requête et directement au-dessus du groupe de boutons d'action. Elle héberge la liste des requêtes unitaires en attente d'application (pile Multistack), permettant à l'utilisateur de les visualiser, d'observer leur statut d'évaluation, et de restaurer ou modifier individuellement chaque requête de la pile.

---

## Affichage du tableau

### Caractère optionnel

- L'affichage de la pile de requêtes est **entièrement conditionnel** : la zone n'est visible que si le tableau des requêtes en attente (`pendingRequests`) n'est pas vide et contient au moins une requête.
- Un contrôle rapide de suppression globale (bouton 🗑️) ainsi qu'un bouton de copie globale (bouton 📋, proposé comme amélioration future) permettent de vider ou de récupérer la pile complète.
- Lorsque la pile est vide ou supprimée, la zone multi-stack est masquée de l'interface, libérant tout son espace vertical pour l'Assistant format requête.

### Structure du tableau

- **Titre de la zone** : "📦 PILE MULTISTACK".
- **Compteur de requêtes** : Affiché à droite du titre en turquoise `#20b2aa` (ex: "3 REQUÊTES"). Le bouton de copie (📋) et le bouton de suppression (🗑️) sont placés à droite du compteur.
- **Indicateur d'Annulation Intelligente** : Si le mode d'annulation intelligente est actif (`isSmartCancelActive === true`), la mention "— Annulation intelligente" s'affiche en jaune à côté du titre.
- **Lignes (Items de requêtes)** : Chaque requête de la pile apparaît sous forme d'une ligne interactive.
  - **Numérotation** : Chaque ligne commence par son index d'ordre `idx + 1 - ` (ex: "1 - ", "2 - ") en police à pas fixe.
  - **Nom (Label)** : Affiche le nom ou l'identifiant court défini dans la requête via l'attribut `[LABEL:nom-de-la-modif]` ou par défaut "Requête n° N".
  - **Commentaire** : Affiche le commentaire associé en texte italique discret à la suite du label.
  - **Sélection** : Un clic sur une ligne sélectionne et active la requête (voir [Effets et Mécanique de Sélection](#effets-et-mécanique-de-sélection-dune-requête) ci-dessous pour le détail des effets sur l'éditeur et la sidebar).
  - **Indicateur de position active** : La ligne active courante affiche la mention `< ACTIVE` en bleu sur son extrémité droite.

---

## Fonctions de modification

### Édition locale (Indicateur de crayon)

- Les requêtes de la pile peuvent être modifiées à la volée. Dès que l'utilisateur sélectionne une ligne et édite ses champs FIND, REPLACE, Commentaire, ou bien l'attribut multi, smart, ou les occurences séléctionnées dans la section inférieure de la sidebar, l'état de modification de la requête passe à `isModified = true`.
- Un symbole de **crayon orange (✎)** apparaît alors à côté du titre de la requête dans la liste pour indiquer la présence de modifications locales non appliquées.
- Si l'utilisateur passe par la modale de debug pour affiner la requête et pouvoir la voir dans un environnement dédié avec des outils améliorés, en cliquant sur l'icône Rogue Cherry dans le panneau central, dans ce cas-là l'effet est exactement le même. Une fois la modale de debug fermée, si elle a été fermée avec validation, alors les modifications apportées dans la modale de debug sont immédiatement répercutées sur les différents champs concernés, à savoir : commentaire, label, texte à chercher, texte à remplacer et la fonction Smart, et donnent lieu immédiatement à une sauvegarde.

**Nota bene :** lorsque la modale de debug est affichée sur initiative de l'utilisateur depuis la pile multi-stack, alors dans la modale de debug le bouton « Valider et appliquer » ne peut pas être cliqué, et seul le bouton « Valider et copier la requête » peut être activé. 

### Sauvegarde et application

- Les modifications locales sont stockées en mémoire dans l'état de la session courante.
- L'application de la requête (via le bouton **APPLIQUER**) ou de toute la pile (via le bouton **APPLIQUER PILE**) persiste ces modifications dans le document de code.

### Annulation et restauration (undo local)

- Un bouton **Restauration (⟲)** apparaît à l'extrémité droite de chaque ligne modifiée localement (`req.isModified === true`).
- Cliquer sur ce bouton annule immédiatement toutes les modifications locales effectuées par l'utilisateur et restaure les valeurs et critères initiaux de la requête d'origine de la pile.

### Suppression

- Un bouton rouge **Vider (🗑️)** situé dans l'en-tête de la zone permet de purger complètement la pile multistack.
- La suppression d'une ligne individuelle s'effectue en effaçant l'occurrence ou en vidant la pile.

---

## Effets et Mécanique de Sélection d'une Requête

Lorsqu'une requête est sélectionnée dans la pile Multistack (soit par un clic de l'utilisateur sur sa ligne, soit lors de l'activation séquentielle au cours de l'exécution de la pile) :

### 1. Chargement et Synchronisation des Champs de la Sidebar
- Le champ **Commentaire** est automatiquement peuplé avec le texte du commentaire de la requête.
- Le champ **Texte à chercher (1)** (FIND) charge le motif de recherche de la requête.
- Le champ **Texte à remplacer (2)** (REPLACE) charge le motif de remplacement de la requête.
- Les autres paramètres associés (cibles de Cherry-Picking, flags multi et smart, etc.) sont chargés (en mémoire et visuellement).

### 2. Comportement et Retours Visuels de l'Éditeur de Code Central
- **Déplacement et Centrage du Défilement (Scroll)** : L'éditeur de code de la zone centrale saute automatiquement à la ligne contenant le texte recherché s'il est trouvé. S'il s'agit d'occurrences multiples (Cherry-Picking), le défilement se centre verticalement sur la **première occurrence** trouvée du texte.
- **Surlignage et Indicateurs Visuels** :
  - Le texte recherché est mis en surbrillance en **jaune** dans le code principal.
  - De **petits marqueurs** apparaissent dans la goulotte (gouttière) du code principal pour indiquer visuellement toutes les lignes concernées par la recherche (que ce soit pour marquer individuellement chacune des occurrences trouvées, ou pour signaler l'étendue d'une recherche multiligne).
- **Affichage du Tableau d'Occurrences** : S'il y a une occurrence multiple du texte recherché, le tableau/panneau de Cherry-Picking s'affiche automatiquement afin de gérer in situ les cases à cocher.

### 3. Indicateur de Sélection sur les Boutons d'Action (Liseret Bleu)
- **Liseret Bleu sur le Bouton Cerise** : Dès qu'une requête multistack est sélectionnée (a le focus ou est active) dans la pile par un clic ou une sélection automatique, le bouton rouge cerise d'application unitaire (**APPLIQUER** ou **🗑️ SUPPRIMER L'OCCURRENCE**) de la zone centrale s'entoure d'un **liseret bleu** (`outline outline-2 outline-primary-blue outline-offset-1`).
- **Disparition du Liseret** : Dès qu'aucune requête n'est activement sélectionnée (perte de focus, réinitialisation de la pile ou fin de traitement de la pile multistack), ce liseret bleu disparaît instantanément.

### 4. Résolution Dynamique des Occurrences (Prévention des Bugs)
> [!IMPORTANT]
> **Règle algorithmique critique** : La recherche et l'indexation des occurrences dans le texte source doivent s'exécuter **dynamiquement au moment exact où l'on sélectionne ou active** la requête dans la pile.

#### Pourquoi ce scan dynamique à la volée est-il requis ? (Exemple illustratif)
Si l'application indexait les occurrences de toutes les requêtes une fois pour toutes au chargement initial de la pile, une désynchronisation grave se produirait :
1. *État initial* : Le code source contient **3 occurrences** de la chaîne `"ma-cible"`.
2. *Position dans la pile* : Une requête de Cherry-Picking (`multi = true`) ciblant `"ma-cible"` est placée en **4ème position** dans la pile Multistack.
3. *Action d'une requête antérieure* : La **1ère requête** de la pile est exécutée. Son application dans le code source insère une **4ème occurrence** de la chaîne `"ma-cible"`.
4. *Sélection / Activation de la 4ème requête* :
   - **Sans scan dynamique** : La 4ème requête utiliserait la liste d'occurrences figée initialement (qui n'en comptait que 3). Le Cherry-Picking validerait les 3 premières occurrences mais ignorerait complètement la 4ème occurrence nouvellement ajoutée, qui serait décoché.
   - **Avec scan dynamique (Comportement Requis)** : Au moment où la 4ème requête est sélectionnée, l'algorithme relance instantanément un scan du document courant. Il détecte ainsi les **4 occurrences** réelles, garantissant que le tableau des occurrences affiche les 4 cases à cocher à jour pour l'utilisateur. puisque le critère "multi" est à "true", et que on trouve maintenant non plus 3 occurence, mais 4, les 4 sont de facto coché et la requete continue a etre reconnue comme une requete "multi true" et non comme une requete cherry picking.

---

## Barre d'outils de la zone multi-stack

| Bouton / Contrôle | Action | Rôle visuel / Technique |
|---|---|---|
| **Ligne de requête** | Clic | Sélectionne et charge la requête comme active (`onSelectStackRequest(idx)`). |
| **Bouton ⟲** | Clic | Annule les modifications locales d'un item (`onRevertRequest(idx)`). |
| **Bouton 📋** | Clic | Copie la requête multistack reconstituée dans le presse-papier (Amélioration future). |
| **Bouton 🗑️** | Clic | Purge et détruit la pile multistack (`onClearStack()`). |

---

## Évaluation et Indicateurs de Statut

Chaque ligne affiche à son extrémité gauche une icône de statut colorée reflétant l'état de validation de la requête vis-à-vis du code source :

| Statut | Icône | Couleur du texte | Signification |
|---|---|---|---|
| **En attente** | ⬜ | Blanc | Requête non encore évaluée ou en attente d'application. |
| **Succès** | ✅ | Vert (`#4caf50`) | L'occurrence cible est identifiée à 100% dans le texte source ; prête pour le remplacement. |
| **Erreur** | ❌ | Rouge (`#f44336`) | L'occurrence cible est introuvable ou a été altérée par une modification précédente. |
| **Corrigée** | 🟡 | Orange (`#ff9800`) | Requête réparée suite à une correction manuelle ou via le débogueur. |

---

## Étape d'Exécution et Temporisation d'Animation

Lors du traitement ou de la lecture pas-à-pas des requêtes de la pile (ex: exécution d'une pile ou transition automatique) :
- **Temporisation de transition (Timer 500ms)** : Afin de permettre à l'utilisateur de suivre les modifications à l'écran, un délai d'attente de **500 ms** (0,5 seconde) est appliqué avant de déclencher le remplacement effectif de chaque étape de la pile (`handleReplace`). Ce délai permet d'observer brièvement la mise en valeur de la ligne cible et de fluidifier le rendu du live diff.

---

## Responsive et redimensionnement

- Si le nombre de requêtes empilées est élevé, le conteneur active un défilement vertical interne (`overflow-y-auto`) avec une barre de défilement personnalisée (`custom-scrollbar`).
- Si la hauteur disponible de la zone supérieure est réduite par le splitter horizontal, l'Assistant format requête supérieur se replie automatiquement en premier afin de maximiser l'espace vertical alloué à la liste Multistack.

## Comportement d'Empilement et de Rognage (Clipping)

La pile Multistack s'insère dans une hiérarchie de flux et de superposition précise :
- **Solidarité dans le flux avec l'Assistant** : La pile est positionnée dans le même conteneur vertical que l'Assistant format requête. Ils ne peuvent pas se chevaucher ou passer l'un sous l'autre. Si la pile s'agrandit, elle pousse l'assistant vers le haut.
- **Masquage par superposition (z-index)** : Le panneau des Boutons d'Action Principaux (situé immédiatement sous la pile) est positionné sur une couche supérieure (`z-index: 10`) avec un fond opaque.
  - Lorsque la hauteur de la zone supérieure diminue (splitter remonté), la pile Multistack réduit sa hauteur visible en priorité et active son défilement vertical interne.
  - Si la hauteur de la zone devient insuffisante pour afficher ne serait-ce que la pile compactée, le panneau des boutons d'action passe visuellement **par-dessus** la pile Multistack, la masquant du bas vers le haut.


---

## Fonctionnalité future : Copie et Rétro-ingénierie Globale de la Pile

> [!NOTE]
> Cette fonctionnalité n'est pas encore implémentée dans le code de l'application et est proposée comme amélioration future.

- **Bouton Copier (📋)** : Un petit bouton de type « Copier », placé à côté du bouton de suppression globale (🗑️) dans l'en-tête de la zone, permettant de copier dans le presse-papier la requête multiple complète reconstituée.
- **Moteur de Rétro-ingénierie** :
  - **Reconstruction Globale** : Le moteur est chargé de reconstruire la requête brute globale en assemblant les requêtes unitaires du tableau et les blocs de texte intermédiaires d'origine qui séparaient ces requêtes au moment du collage initial.
  - **Prise en compte des Modifications Utilisateur** : Chaque requête unitaire générée doit fidèlement refléter les éditions, corrections, ou améliorations locales apportées par l'utilisateur via les formulaires de saisie de la section inférieure (modifications de FIND, REPLACE, ou Commentaire).
  - **Paramètres de requête sérialisés** : La rétro-ingénierie doit prendre en compte les attributs configurés et les états de chaque requête :
    - L'état de l'option **smart** (sensibilité à la casse et aux espaces).
    - L'état de l'option **multi** (cherry-picking et indices ciblés).
    - Le **libellé (label)** de la requête.
    - Le **commentaire** rédigé.

---

## Dépendances et références

- Voir [sidebar-left-top-band.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/sidebar-left-top-band.md) pour la zone d'Assistant au-dessus.
- Voir [sidebar-left-center.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/sidebar-left-center.md) pour la zone de boutons d'action située immédiatement en dessous et les mécaniques d'application des consignes de la requete.
- Voir [ui-layout-main.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/ui-layout-main.md) pour les règles du splitter, du responsive et de la superposition.
