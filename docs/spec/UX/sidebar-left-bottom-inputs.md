# Sidebar Gauche — Zone Inférieure : Zones de Texte

## Vue d'ensemble

La zone inférieure de la sidebar gauche (`SidebarLeft.jsx`) contient les zones de saisie textuelle utilisées pour éditer et configurer la requête active. Elle comprend trois champs principaux : la zone commentaire, le champ de recherche (1) FIND et le champ de remplacement (2) REPLACE. Ces champs intègrent des mécanismes d'affichage avancés (double calque pour visualiser les caractères cachés et les diffs en temps réel), des contrôles de zoom interactifs, et un comportement responsive auto-adaptatif.

---

## Zones de texte

### 1. Zone de texte Commentaire (Optionnel)

- **Rôle** : Permet de saisir une note explicative associée à la requête active (ex: "Refactorisation de la validation"). Ce texte est sauvegardé dans l'historique et stocké dans le tag `##Commentaire##` lors de l'export de la requête brute.
- **En-tête** :
  - À gauche : Label "Commentaire (Optionnel)" en taille très réduite (xxs, `#aaa`, gras, majuscules) et bouton chevron (▶ / ▼) pour enrouler ou dérouler le champ.
  - À droite : Indicateur `REQ : [label]` en jaune et blanc si un label (`currentLabel`) est actif, sinon masqué.Cela permet de différencier les cas où le texte ci-dessous est le fruit d'un import depuis une requête, de ceux où l'ensemble des éléments a été écrit manuellement par l'utilisateur, auquel cas il n'y a pas de requête particulière. 
- **Champ de saisie** : Textarea de hauteur initiale réduite, utilisant une police à pas fixe (`font-mono`) et une couleur de texte jaune vif (`text-hl-yellow`).
- **Comportement automatique (Auto-Collapse)** :
  - Pour préserver l'espace de saisie des champs FIND/REPLACE, la boîte de commentaire se replie automatiquement si la hauteur disponible pour la section inférieure scrollable descend en dessous de **180 px**.
  - L'espace disponible est calculé par la formule : `window.innerHeight - topHeight - bottomReserved` (où `bottomReserved` représente la hauteur physique de la barre de validation basse, soit **220 px** si le mode MULTI est actif avec occurrences, ou **160 px** sinon).
  - Un clic manuel sur le chevron de repli active le flag `isCommentBoxCollapsedByUser` et verrouille l'état choisi par l'utilisateur pour le reste de la session : Conséquemment, contrairement au cas où l'utilisateur n'aurait pas replié lui-même la zone, lorsque l'espace est à nouveau suffisant pour déplier automatiquement la zone de commentaire, celle-ci ne se déplie alors pas.

---

### 2. Zone de texte principale : Recherche (1) FIND

- **Rôle** : Reçoit le texte exact à rechercher dans le document source.
- **Agencement de l'En-tête** :
  Le titre « Texte à chercher (1) » partage sa ligne avec l'ensemble des boutons de contrôle rapide. Cette ligne d'en-tête unique comprend :
  - **À gauche** : Le label titre « Texte à chercher (1) » suivi immédiatement du **bouton d'invisibilité** (icône œil).
  - **À droite** : Le bouton **SMART** suivi immédiatement du bouton/badge **FIND**.

- **Charte Visuelle et États du Bouton SMART** :
  Le bouton **SMART** dispose d'un curseur main-bouton (`cursor-pointer`) et se décline en deux états :
  - **État non validé (Inactif)** : Fond gris sombre (`bg-[#555]`), texte gris clair (`text-[#ccc]`). Au survol, il passe à un gris légèrement plus clair (`hover:bg-[#666]`).
  - **État validé (Actif)** : Fond vert brillant (`bg-[#4caf50]`) avec un effet de lueur.
  - **Double-clic** : Un double-clic sur le bouton SMART permet de sauvegarder son état actuel comme la valeur par défaut pour l'utilisateur.
- **Charte Visuelle et États du Bouton/Badge FIND** :
  Le bouton/badge **FIND** s'adapte dynamiquement selon son état d'activation et le résultat de la recherche :
  - **État 1 : Inactif (Find dynamique DraftSearch désactivé : `isFindActive = false`)** :
    - *Si occurrences trouvées > 0* : Fond gris sombre (`bg-[#555]`), texte vert-turquoise (`text-[#00FF7F]`). Curseur main-bouton (`cursor-pointer`).
    - *Si occurrences trouvées = 0* : Fond gris sombre (`bg-[#555]`), texte orange chaud (`text-[#FF8C00]`). Curseur main-bouton (`cursor-pointer`).
  - **État 2 : Actif mais aucun texte trouvé (`isFindActive = true` et 0 occurrence)** :
    - Fond orange chaud (`bg-[#FF8C00]`), texte noir (`text-black`). Curseur main-bouton (`cursor-pointer`).
  - **État 3 : Actif et un ou plusieurs textes trouvés (`isFindActive = true` et occurrences > 0)** :
    - Fond vert-turquoise vif (`bg-[#00FF7F]`) avec un effet de lueur (`shadow-[0_0_8px_rgba(0,255,127,0.6)]`), texte noir (`text-black`). Curseur main-bouton (`cursor-pointer`) avec flèches de navigation.
  - *Note de Verrouillage* : Si une recherche globale est active (`isGlobalSearching`) ou que le mode remplacement unitaire est en cours, le badge FIND est verrouillé/grisé avec fond sombre et texte atténué, accompagné du curseur de blocage (`cursor-not-allowed`).

- **Le Find Dynamique DraftSearch (`FindDynamic` / `isFindActive`)** :
  - **Bascule d'activation/désactivation** : Un double-clic sur le badge d'occurrences (ex: `1 / 3`) bascule l'état d'activation du Find dynamique DraftSearch (`isFindActive`).
  - **Find dynamique DraftSearch activé (`isFindActive = true`)** : 
    - Le système effectue une recherche en temps réel au fil de la saisie.
    - Il met en surbrillance jaune vif (classe `.hl-yellow` — `#FFD700`, via la colorisation in situ du calcul de Lightmap DraftSearch) toutes les occurrences trouvées dans le code editor.
    - L'éditeur de code principal fait défiler (scroll) immédiatement le document pour se centrer sur la première occurrence (ou sur l'occurrence active sélectionnée), fournissant un ciblage visuel instantané.
  - **Find dynamique DraftSearch désactivé (`isFindActive = false`)** : 
    - Le scan en temps réel et l'indexation dynamique sont bloqués au cours de la frappe.
    - Aucune surbrillance jaune n'est générée et l'éditeur ne scrolle pas pendant la saisie. Cela permet d'écrire ou d'éditer de longs motifs sans aucun lag d'interface sur des fichiers volumineux.

- **Comportement des occurrences multiples (Navigation et Sélection)** :
  - **Badge d'Occurrences** : Affiche la position de navigation sous la forme `◀ Index / Total ▶` (ex: `◀ 1 / 3 ▶`) uniquement si le Find dynamique DraftSearch est actif et que des correspondances existent.
  - **Flèches de Navigation** : Cliquer sur les flèches `◀` ou `▶` modifie l'occurrence active (`activeOccIndex`) et provoque un défilement doux (smooth scroll) de l'éditeur de code principal vers la ligne correspondante.
  - **Sélection rapide via Modale** : Un clic simple sur les chiffres du badge (ex: `1 / 3`) ouvre la modale de sélection de ligne `LineChoiceModal`, permettant à l'utilisateur de sauter instantanément à une occurrence précise en tapant son index.

- **Ambiguïté et Paradoxe : Badge FIND vs Mode MULTI (Barre Basse)** :
  Il existe une distinction sémantique et comportementale critique entre le nombre d'occurrences trouvé par le Find et le bouton **MULTI** situé dans la barre de contrôle basse (voir [sidebar-left-bottom-bar.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/sidebar-left-bottom-bar.md)) :
  
  - **Le Badge FIND (Haut)** a un rôle **purement informatif et de navigation** géré par DraftSearch. Il indique simplement combien de fois la chaîne de caractères à chercher est présente dans le document. Même si 10 occurrences sont détectées (`1 / 10`), l'application par défaut reste unitaire : si l'utilisateur clique sur **APPLIQUER**, seule l'occurrence focalisée à l'écran (l'index actif) sera modifiée.
  - **Le Mode MULTI (Barre Basse)** a un rôle **décisionnel d'application**. Son activation (bouton MULTI allumé en violet) indique que la modification doit cibler plusieurs emplacements à la fois. Cela déclenche l'apparition sous les zones de texte du **tableau de multi-occurrences (Cherry-Picking)**. L'utilisateur peut y cocher/décocher des cases pour définir quelles occurrences appliquer (les sélectionnées passant en jaune vif et les exclues en jaune pâle avec liseret pointillé).
  
  En résumé : le Find en haut de zone *constate* et *navigue* parmi la multiplicité du texte via DraftSearch ; le bouton MULTI en bas *décide* d'activer le remplacement simultané et d'ouvrir l'interface de filtrage précis.

- **Marqueurs Visuels de Goulotte (Gutter) dans l'Éditeur Principal** :
  Lorsqu'une recherche active est en cours, les marqueurs suivants s'affichent dans la mini-gouttière à gauche des numéros de ligne :
  - **Toutes les occurrences trouvées (`●`)** : Un petit point de couleur (vert-jaune `.gutter-mod-item` si correspondance totale, orange si fuzzy, via le calcul de Lightmap DraftSearch) signale chaque ligne contenant une occurrence.
  - **Curseur actif (`▶`)** : Un carré bleu avec une flèche pointe vers l'occurrence activement focalisée.
  - **Cadre rouge de ciblage temporaire** : Un cadre de contour rouge (`outline outline-1 outline-red-500` avec liseret de lueur rouge `shadow-[0_0_5px_rgba(239,68,68,0.8)]`) entoure temporairement le numéro de la ligne cible pendant 1500 ms après un saut ou une navigation (ou 30 secondes pour une recherche globale).

- **Architecture à Double Calque (Backdrop & Overlay)** :
  - **Calque de fond (`backdrop-layer`)** : Rendu statique non interactif colorisant le texte et ses caractères invisibles en HTML (via `renderInvisiblesHtml`).
  - **Calque de premier plan (`overlay-layer`)** : Textarea transparente de saisie superposée. Les défilements horizontaux et verticaux sont synchronisés en temps réel (`onScroll` copiant `scrollTop` et `scrollLeft` du premier plan vers le fond).
- **Collage et Débogueur (Double-Clic)** :
  - Un double-clic dans la zone de texte FIND vide y colle le contenu du presse-papier.
  - Si la zone contient déjà du texte, le double-clic ouvre instantanément le débogueur `SmartDebugger` pré-peuplé avec la requête active.
- **Dispositif d'Évitement (Bandeau de Sécurité / Escape Hatch)** :
  - Ce dispositif s'applique si la recherche dynamique est active, mais que le texte saisi comporte **moins de 3 caractères** alors que le texte principal dépasse **500 lignes** (ou le seuil `maxLines` configuré).
  - Dans cette configuration, le système suspend automatiquement la recherche dynamique en temps réel pour éviter les traitements inutiles et le lag de saisie.
  - Un bandeau d'avertissement orange s'affiche : `"⚠️ Texte à chercher trop court dans un texte trop long (double-cliquez pour forcer)"`.
  - **Dialogue d'outrepassation (Double-clic)** : Un double-clic de l'utilisateur sur ce bandeau lance une procédure interactive via le système de boîtes de messages universelles (`MessageBox`) :
    1. **MessageBox de Mise en garde** :
       - **Titre** : `"Attention : Risque de ralentissement"`
       - **Message** : `"Forcer la recherche dynamique pour une occurrence courte dans un texte long risque de ralentir fortement l'application."`
       - **Boutons** :
         - `Annuler` (variante secondaire) : Ferme la boîte de dialogue, la recherche reste suspendue.
         - `Éditer les limites` (variante secondaire) : Ouvre le formulaire d'édition des limites (voir ci-dessous).
         - `Forcer la recherche` (variante principale) : Outrepasse la sécurité (active le flag `forceFindSearchOverride`) et force l'évaluation immédiate de la recherche dynamique.
    2. **MessageBox d'Édition des Limites** (déclenchée par l'option *Éditer les limites*) :
       - **Titre** : `"Éditer les limites de l'échappement"`
       - **Message** : `"Définissez les nouvelles limites pour la sécurité anti-lag de la recherche dynamique :"`
       - **Champs de saisie (Inputs)** :
         - `"maxLines"` (type numérique) : Nombre maximal de lignes tolérées dans le texte principal (valeur par défaut : la valeur courante de `maxLines`).
         - `"minChars"` (type numérique) : Nombre minimum de caractères requis pour lancer la recherche (valeur par défaut : la valeur courante de `minChars`).
       - **Boutons** :
         - `Annuler` (variante secondaire) : Ferme la boîte sans appliquer de changements.
         - `Valider` (variante principale) : Met à jour la configuration globale `searchLimits` avec les nouvelles valeurs (avec repli à 500 et 3 par défaut en cas de saisie invalide). La nouvelle configuration s'applique immédiatement pour toutes les recherches dynamiques de la session.

---

### 3. Zone de texte principale : Remplacement (2) REPLACE

- **Rôle** : Reçoit le texte de remplacement.
- **En-tête** : Affiche le titre "À remplacer par (2)" en xxs, `#aaa` gras.
- **Architecture à Double Calque (Diffing intra-ligne et Préfiguration)** :
  - **Calque de fond (`backdrop-layer`)** : Affiche un diff en temps réel comparant la chaîne REPLACE à la chaîne FIND via l'algorithme `computeLiveDiff`.
  - **Colorisation DraftSurge de Diffing** :
    - **Insertions (Nouveaux caractères/mots ajoutés)** : Sont surlignés en **Rose/Magenta vif** (classe `.hl-ins` — `#FF007F`).
    - **Remplacements (Caractères/mots modifiés)** : Sont surlignés en **Violet Vif / Lavande** (classe `.hl-word-mod` — `#9E67BA`).
    - **Suppressions (Caractères retirés)** : Sont barrés et grisés dans le calque FIND (classe `.hl-del-txt` — fond transparent, texte `#888` avec `line-through`), tandis qu'une croix rouge de suppression (classe `.hl-del` — `#FF0000`) signale l'emplacement exact dans la zone REPLACE.
  - **Préfiguration du Rendu Final** : Ce marquage intra-ligne de diffing préfigure directement l'affichage final qui sera injecté dans l'éditeur de code principal lors de l'application de la requête. À ce moment, la surbrillance jaune temporaire de la recherche sera entièrement balayée et remplacée par cette colorisation DraftSurge des modifications (lignes en Violet Sombre `.hl-line-mod` et mots modifiés en Violet Vif `.hl-word-mod`), consolidant ainsi l'historique visuel du projet.
  - **Calque de premier plan (`overlay-layer`)** : Textarea de saisie superposée à texte transparent, avec synchronisation de scroll identique au champ FIND.
- **Collage et Débogueur (Double-Clic)** :
  - Un double-clic dans la zone vide colle le presse-papier.
  - Un double-clic dans la zone non vide ouvre le `SmartDebugger` avec la requête complète.
---

## Fonctionnalité de zoom interactif (Ctrl+Molette)

Chacune des deux zones principales (FIND et REPLACE) dispose de son propre conteneur zoomable indépendant (`zoomRef1`, `zoomRef2`) :
- **Déclenchement** : L'utilisateur maintient la touche **Ctrl enfoncée et fait rouler la molette de la souris** au-dessus de la zone cible.
- **Comportement** : Modifie dynamiquement la variable CSS `--zoom-size` du conteneur, affectant simultanément la taille de police (`fontSize`) du calque de fond et de la textarea pour préserver la superposition.
- **Bornes physiques** :
  - Taille minimale : **8 px**
  - Taille maximale : **40 px** (correspondant aux bornes du hook useZoomable)
- **Réinitialisation** : Le raccourci clavier **Ctrl+0** (lorsque le focus est dans la zone) réinitialise la police à sa taille par défaut (**14 px**).

---

## Comportement responsive et valeurs minimales du splitter

Le splitter horizontal délimite la hauteur de la section supérieure (`topHeight`) et de la section inférieure. Lors du redimensionnement, les règles suivantes s'appliquent :

### Valeurs minimales du splitter (Hauteur de la section basse)

La hauteur de la section basse est sanctuarisée pour empêcher que les champs de saisie ou les contrôles ne soient masqués. Lors du redimensionnement vertical, le splitter horizontal est bloqué par une butée de hauteur minimale allouée à la zone basse (`bottomReserved`) :

| Contexte d'exécution | Hauteur minimale sanctuarisée (`bottomReserved` de butée) | Hauteur physique brute du panneau |
|---|---|---|
| **Mode MULTI désactivé (ou 0 occurrence)** | **180 px** (Valeur A) | **160 px** |
| **Mode MULTI actif et occurrences > 0** | **240 px** (Valeur B) | **220 px** |

- **Nuance de 20 px** : Les valeurs de butée du splitter (**180 px** et **240 px**) ajoutent une marge de garde de 20 px sur les hauteurs physiques brutes correspondantes (**160 px** et **220 px**). Cela permet d'inclure les marges intérieures, les paddings et d'éviter les scrollbars ou le clipping visuel lors du glissement maximal du séparateur.
- La valeur B (240 px de butée) est supérieure car la zone basse doit héberger le conteneur scrollable de Cherry-Picking.
- Si le mode MULTI s'active alors que le splitter est positionné trop bas, le système remonte automatiquement le splitter pour satisfaire la butée de 240px.

---

## Reset de la Colorisation DraftSurge sur Changement de Version

Dans l'expérience globale de saisie et d'application des requêtes, il est important de noter que tout **changement de version** du code source (comme l'utilisation de la navigation d'historique de type time-travel, ou un checkout de commit/branche) entraîne un **reset automatique et complet** de la colorisation DraftSurge accumulée (les lignes violettes). L'éditeur recharge le document à partir de sa nouvelle référence, remettant à zéro cet empilement.

---

## Dépendances et références

- Voir [sidebar-left-center.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/sidebar-left-center.md) pour la zone des boutons située au-dessus.
- Voir [sidebar-left-bottom-bar.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/sidebar-left-bottom-bar.md) pour les options de validation et le Cherry-Picking sous les textareas.
- Voir [ui-layout-main.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/ui-layout-main.md) pour les règles du splitter et du responsive global.
