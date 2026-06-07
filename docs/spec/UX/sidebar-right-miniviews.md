# Sidebar Droite — Zone Basse : Mini-Views AVANT / APRÈS

## Vue d'ensemble

Le panneau inférieur de la sidebar droite (`SidebarRight.jsx`) héberge les Mini-Views comparatives AVANT (FIND) et APRÈS (REPLACE). Ces miniatures offrent un aperçu visuel instantané et coloré de la modification correspondant à la version sélectionnée dans le tableau d'historique, permettant à l'utilisateur d'inspecter les lignes modifiées sans avoir à faire défiler l'éditeur de code principal.

---

## Contenu selon l'enregistrement sélectionné

Le comportement et l'affichage des deux blocs de prévisualisation s'adaptent selon la nature de l'enregistrement actif (`activeRecordDetails`) :

| Type de version | Contenu de la Mini-View AVANT (FIND) | Contenu de la Mini-View APRÈS (REPLACE) |
|---|---|---|
| **Aucune Sélection (`none`)** | Message grisé "Aucune sélection". | Message grisé "Aucune sélection". |
| **Snapshot Initial (`snapshot`)** | Message rouge d'avertissement : `--- SNAPSHOT DE DÉPART ---`. | Prévisualisation des 300 premiers caractères du texte d'origine importé. |
| **Modification (`replace`)** | Texte FIND de la requête, colorisé avec les marques de suppression (`marksT1`). | Texte REPLACE de la requête, colorisé avec les marques d'insertion (`marksT2`). |

---

## Colorisation DraftSurge intra-ligne (`renderDiffSegment`)

Pour afficher les différences au caractère près (DraftSurge unitaire), l'application utilise l'algorithme suivant :

1. **Cartographie des caractères** : Un tableau temporaire de la taille du texte est créé, associant à chaque caractère un ensemble (`Set`) de classes CSS de surlignage.
2. **Application des marques** : L'algorithme parcourt les marques de diffing (`marks`) et injecte les classes CSS correspondantes (ex: `hl-line-mod`, `hl-word-mod`) sur les index de caractères concernés. Les marques de longueur 0 (curseurs d'insertion/suppression pure) sont ignorées visuellement dans cette vue.
3. **Fusion et rendu HTML** : L'algorithme regroupe les caractères consécutifs possédant exactement le même ensemble de classes pour générer un nombre minimal de balises HTML `<mark className="...">` imbriquées, limitant ainsi la surcharge du DOM et évitant les décalages de rendu.

---

## Défilement synchronisé bidirectionnel (Scroll-Sync)

- **Activation** : Actif si le bouton de liaison affiche l'icône de chaîne (🔗, `isSyncScroll === true`).
- **Fonctionnement** : Un écouteur d'événement (`scroll`) est attaché aux deux conteneurs (`beforeScrollRef` et `afterScrollRef`). Lorsque l'utilisateur fait défiler (horizontalement ou verticalement) l'une des deux miniatures, la position de défilement (`scrollTop` et `scrollLeft`) est instantanément recopiée sur la miniature opposée.
- **Verrou anti-boucle (`isSyncingRef`)** : Pour empêcher que l'événement de scroll de la miniature A ne déclenche une boucle infinie d'événements de scroll croisés avec B, un indicateur de référence (`isSyncingRef = true`) verrouille temporairement les écouteurs pendant la recopie de la position.

---

## Zoom indépendant

- Chaque miniature dispose de son propre hook de zoom (`useZoomable`) attaché à son conteneur.
- Cela permet d'ajuster la taille de police indépendamment de l'autre vue en cas de besoin de lecture de longs blocs de code denses, sans affecter le niveau de zoom global de la zone centrale.
- La taille de police par défaut est de **14 px** (`font-mono`).

---

## Chargement dynamique du commentaire et des métadonnées (Textbox au-dessus des boutons)

Lorsque l'utilisateur sélectionne un enregistrement dans le tableau d'historique (Time-Travel) :
1. **TextBox de Commentaire (Zone centrale, au-dessus des boutons)** : Le commentaire de la version sélectionnée (`history[selectedIndex].comment`) est dynamiquement chargé et affiché dans la zone de texte (`textarea` en lecture seule `readOnly`) située dans la zone centrale de la section basse de la sidebar droite, directement au-dessus de la ligne de boutons d'action et de navigation. Si la version sélectionnée ne possède pas de commentaire, le message par défaut `"Aucun commentaire."` est automatiquement affiché.
2. **Chargement et affichage des métadonnées et badges associés** : Juste au-dessus de cette TextBox (dans son en-tête), des badges de couleur sont chargés dynamiquement pour refléter la configuration et le ciblage de la version active :
   - **Badge violet `CHERRY-PICK` / `MULTI`** : S'affiche si l'enregistrement a été appliqué en mode multiple (`multiMode === true`), en listant les index des occurrences ciblées converties en base-1 (ex: `[1, 3]`).
   - **Badge bleu `SMART`** : S'affiche si la version a été générée avec la tolérance aux espaces et à la casse (`ignoreSpaces === true`).
3. **Mise à jour visuelle liée à la sélection** : L'état sélectionné (`selectedIndex`) déclenche instantanément la mise à jour de ces zones de la section basse de la sidebar droite pour refléter fidèlement l'opération cliquée, en parallèle du chargement des textes dans les miniatures comparatives.

---

## Pliabilité et masquage complet (showMiniViews)

Le panneau inférieur hébergeant les deux mini-views (AVANT / APRÈS) est entièrement pliable et dépliable pour optimiser l'utilisation de l'espace vertical disponible :
- **Déclencheur** : Un clic sur le bouton de bascule d'affichage ("Masquer ▲" / "Afficher ▼") situé à l'extrême droite de la barre de contrôles.
- **Comportement plié (`showMiniViews === false`)** :
  - Le panneau des mini-views comparatives est intégralement démonté (non affiché dans le DOM).
  - Le séparateur horizontal interactif (`Splitter.jsx`) situé au-dessus est masqué pour éviter toute manipulation inutile.
  - Le conteneur du tableau d'historique (`history-panel-root` / table d'historique) récupère tout l'espace disponible en s'étirant automatiquement jusqu'à **100% de la hauteur disponible** (`flex-1`).
- **Comportement déplié (`showMiniViews === true`)** :
  - Le séparateur horizontal est à nouveau visible et actif.
  - La hauteur du tableau d'historique est restreinte à la valeur fixée par le séparateur (`historyHeight`).
  - Le panneau inférieur des mini-views comparatives réapparaît en prenant la place restante (`flex-1`) avec une contrainte de hauteur minimale de **100 px** (`min-h-[100px]`) pour garantir la lisibilité des deux fenêtres.

---

## Règles réactives et comportement responsive (Layout)

L'agencement des mini-views AVANT et APRÈS s'adapte dynamiquement aux contraintes physiques de la sidebar droite :
1. **Empilement vertical systématique** : Contrairement aux zones de saisie gauche qui peuvent basculer de côte à côte, les deux mini-views comparatives conservent toujours une disposition verticale (`flex-col gap-2`). Les deux blocs sont empilés (AVANT au-dessus, APRÈS en dessous) pour préserver la lisibilité de la structure de code dans le bandeau droit dont la largeur minimale est de **280 px**.
2. **Hauteur adaptative et défilement interne** :
   - Chaque mini-view possède un style `flex-1 overflow-auto` et une hauteur minimale (`min-h-0`) pour forcer l'affichage de barres de défilement internes individuelles (horizontalement et verticalement) en cas de débordement du texte, empêchant ainsi le panneau d'historique de déborder de l'écran.
3. **Police fixe et échelle de zoom** : La taille de police par défaut est de **14 px** (`font-mono`) pour maximiser la lisibilité dans un espace contraint, et l'ajustement est rendu dynamique par le hook de zoom individuel.

---

## Dépendances et références

- Voir [sidebar-right-controls.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/sidebar-right-controls.md) pour la barre de boutons de contrôles de miniatures située immédiatement au-dessus.
- Voir [ui-layout-main.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/ui-layout-main.md) pour les règles de responsive et d'agencement.
