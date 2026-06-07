# Sidebar Droite — Zone Haute : Gestion de Projet & Onglets

## Vue d'ensemble

La zone haute de la sidebar droite (`SidebarRight.jsx`) est une section à hauteur fixe dédiée au cycle de vie des projets. Elle permet d'importer et d'exporter des configurations au format JSON, de réinitialiser l'application, et de gérer les onglets de projets multiples lors de la bascule vers le mode multi-projet (V9).

---

## Éléments du bandeau supérieur

Le bandeau supérieur de gestion est divisé horizontalement en deux blocs distincts occupant la largeur disponible :

### 1. Cadre Bleu "Gestion de Projet" (Occupe le reste de la largeur disponible, soit ~75%)

- **Style** : Conteneur bleu VSCode (`#007acc`), arrondi, contenant un titre à gauche et une boîte intérieure grise.
- **Comportement responsive (Flexbox)** : Le cadre bleu est configuré avec un comportement élastique (`flex-1`) pour s'adapter à la largeur disponible de la sidebar.
  - **Titre à gauche** : Contraint horizontalement à une largeur fixe confortable de **70 px** (`w-[70px] flex-shrink-0`). Le texte "Gestion\nde projet" (14px, extra-gras, interligne serré `leading-[1.1]`) est centré verticalement et écrit sur exactement deux lignes sans retour automatique parasite (`whitespace-nowrap`).
    - **Bascule en texte vertical ("PROJET")** : Si la largeur de la sidebar descend sous **301 px** (soit une largeur disponible pour les barres inférieure à 281px), la Blue Card se réduit et le titre horizontal est automatiquement remplacé par une version verticale lettre-par-lettre épelant `"PROJET"` en taille compacte (10px, gras, lettres empilées). Cela libère l'espace horizontal nécessaire pour conserver la taille des boutons d'actions et du Reset.
  - **Cadre intérieur gris (`#1e1e1e`)** : Prend tout le reste de la largeur disponible (`flex-1`) et regroupe trois boutons d'action de taille égale disposés en ligne (gaps de 8px `gap-2` et paddings de 6px `p-[6px]`) :
    - **Importer (📂)** : Charge un fichier JSON de projet Rogue Cherry (voir [json-project-schema-v8.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/fonction/json-project-schema-v8.md) pour la structure V8 attendue, et [json-project-v9-specs.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/fonction/json-project-v9-specs.md) pour la conversion automatique en V9 multi-fichier).
      - *État* : Couleur bleue vive (`btn-active-blue`) si aucun projet n'est chargé, gris discret (`btn-disabled-clickable`) si un projet est déjà ouvert.
    - **Sauvegarder (💾)** : Persiste l'historique complet, les fichiers et l'état actuel dans un fichier JSON unique (voir [json-project-schema-v8.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/fonction/json-project-schema-v8.md) pour la structure de stockage).
      - *État* : Vert vif (`btn-active`) si le projet contient des modifications non enregistrées (`isProjectDirty === true`), gris inactif sinon. Désactivé si aucun projet n'est ouvert.
    - **Fermer (❌)** : Décharge le projet courant de la mémoire de l'application et redirige l'utilisateur vers le SplashScreen d'accueil.
      - *État* : Actif si un projet est ouvert, désactivé sinon.
  - **Dimensions et comportement responsive des Boutons** :
    - **Hauteur physique assignée** : Les boutons s'étirent verticalement (`items-stretch`) pour occuper toute la hauteur disponible dans le cadre intérieur gris, soit une hauteur nette fixe de **48 px** (dérivée de la hauteur de 72px du bandeau supérieur moins les paddings cumulés du cadre bleu et de la boîte grise).
    - **Largeur minimale/maximale** : Chaque bouton (📂, 💾, ❌) dispose d'un comportement flex (`flex-1`) bridé par des limites physiques strictes de largeur pour préserver le rendu visuel :
      - Largeur minimale : **42 px** (`min-w-[42px]`)
      - Largeur maximale : **120 px** (`max-w-[120px]`)
      - Taille de police fixe : `text-xl` (~20 px)
      - Les trois boutons intérieurs sont **sanctuarisés** à leur largeur minimale de 42 px et ne doivent jamais rétrécir plus bas.
    - **Évolution future (Affichage sur 2 lignes)** :
      > [!NOTE]
      > **Option d'agencement intégrée pour l'avenir** : Si l'évolution de l'application amène à afficher plus de 3 boutons dans ce cadre (par exemple lors de l'intégration de nouvelles actions de cycle de vie en V9) et que la largeur de la sidebar ne permet plus un affichage correct sur une seule ligne :
      > - Le conteneur passera d'une disposition en ligne simple à une disposition multi-ligne (`flex-wrap`).
      > - La hauteur des boutons sera réduite en échelle (principalement en hauteur, passant de **48 px** à **22 px** par ligne).
      > - La taille de police ou d'icône sera également ajustée à la baisse.
      > - Cet agencement permettra d'organiser les boutons sur deux lignes superposées, permettant d'accueillir jusqu'à **6 boutons maximum** dans le même espace physique de 72px de haut, sans clipping.

### 2. Bouton RESET (Occupe ~25% de la largeur)

- **Style** : Bouton rouge cerise (`bg-cherry-red`), séparé du cadre bleu avec un espacement fixe de 8px (`gap-2` sur le conteneur).
- **Rôle** : Réinitialise complètement l'application (suppression de tout l'historique, fermeture de tous les fichiers et projets, et nettoyage du texte de l'éditeur de code) après confirmation explicite de l'utilisateur via une MessageBox.
- **Comportement responsive flexible** :
  - **Zone Standard (Largeur cible à 25%)** : Le bouton RESET occupe 25% de la largeur tandis que la Blue Card occupe 75%.
  - **Zone de Butée Horizontale** : Quand les boutons de la Blue Card atteignent leur taille minimale (bloquant la Blue Card à une largeur minimale de 235px avec titre horizontal de 70px), le bouton RESET commence à diminuer en pourcentage de largeur en dessous de 25% pour absorber toute la réduction.
  - **Zone de Butée Verticale** : Sous une largeur de sidebar de 301px, le titre de la Blue Card bascule en vertical, ramenant sa taille minimale absolue à 196px. La Blue Card shrinking alors vers 196px, et le bouton RESET continue d'absorber la réduction jusqu'à son minimum absolu de 42px.
  - **Comportement d'agencement du texte RESET** : Le bouton RESET est surveillé par un observateur de redimensionnement qui affecte sa largeur courante `resetBtnWidth` dans l'état local. Le composant ajuste dynamiquement son agencement et sa taille de police (zoom/dezoom) selon les paliers algorithmiques suivants :
    - **Palier A (Largeur >= 100 px) - Mode Horizontal Standard** :
      - Disposition : Côte à côte (texte "RESET" à gauche, icône 🔄 à droite).
      - Zoom fixe : Police du texte fixée à **18 px**, icône fixée à **30 px** (`text-3xl`).
    - **Palier B (Largeur entre 70 px et 100 px) - Mode Horizontal Dynamique** :
      - Disposition : Côte à côte (texte "RESET" à gauche, icône 🔄 à droite).
      - Facteur de zoom progressif :
        - *Police du texte* : `12 + 6 * ((w - 70) / 30)` px (varie continûment de **12 px** à **18 px**).
        - *Taille de l'icône* : `24 + 12 * ((w - 70) / 30)` px (varie continûment de **24 px** à **36 px**).
    - **Palier C (Largeur entre 50 px et 70 px) - Mode Vertical Dynamique** :
      - Disposition : Alignement vertical (icône 🔄 au-dessus, texte "RESET" en dessous).
      - Facteur de zoom progressif :
        - *Police du texte* : Fixée à **10 px** avec une marge supérieure de 4px (`mt-1`).
        - *Taille de l'icône* : `24 + 12 * ((w - 50) / 20)` px (varie continûment de **24 px** à **36 px**).
    - **Palier D (Largeur < 50 px) - Mode Vertical Minimal** :
      - Disposition : Alignement vertical (icône 🔄 au-dessus, texte "RESET" en dessous).
      - Zoom minimal fixe :
        - *Police du texte* : Fixée à **9 px**.
        - *Taille de l'icône* : Fixée à **20 px` (`text-xl`).
- **Activation** : Désactivé et semi-transparent (`opacity-30`) si aucun projet n'est ouvert (`isProjectEmpty === true`).

### 3. Indicateur de taille JSON

- Si le projet contient des données (`projectSizeBytes > 0`), un label de texte gris s'affiche en taille 10px en police à pas fixe sous le bandeau : `Taille export JSON : [Taille]`.
- Le formatage de la taille est adaptatif : octets ("o") si < 1024, Kilo-octets ("Ko") si < 1 Mo, Méga-octets ("Mo") au-delà (avec 2 décimales).

---

## Barre d'onglets Projets (Spécifications V9 — Multi-Projet)

Lorsque l'utilisateur travaille sur plusieurs projets distincts en parallèle, une barre d'onglets dédiée aux projets est insérée sous le bandeau de gestion et au-dessus de l'historique.

### Caractère optionnel et affichage

- **Mono-projet (Par défaut)** : Si un seul projet JSON est chargé, la barre d'onglets projets est **totalement masquée** de l'interface pour économiser l'espace vertical.
- **Multi-projet** : Si l'utilisateur clique sur "Créer un nouveau projet" lors de l'importation d'un second fichier, la barre d'onglets projets s'ouvre automatiquement.
- Chaque onglet représente un projet JSON indépendant (contenant son propre historique et son propre set de fichiers).

### Actions sur les onglets projets

- **Bascule** : Cliquer sur un onglet de projet charge instantanément son historique de versions dans la table de la sidebar droite et son fichier actif dans la zone centrale.
- **Fermeture** : Une petite croix permet de fermer un projet. Si le projet contient des modifications non enregistrées, une modale de confirmation demande la sauvegarde avant fermeture.
- **Sauvegarde globale** : Une fonction globale "sauvegarder tous les projets" permet de persister tous les projets ouverts en une seule action.

---

## Division des boutons en mode Multi-Fichiers (Spécifications V9)

Dès qu'un projet ouvert contient **2 fichiers internes ou plus**, les boutons de sauvegarde (💾) et d'export (présents dans la barre de contrôles d'action) se divisent verticalement pour introduire des sous-boutons (voir [json-project-v9-specs.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/fonction/json-project-v9-specs.md) pour les détails techniques de l'arborescence et de l'export) :

- **Sauvegarder TOUT** :
  - Déclenche un prompt MessageBox demandant à l'utilisateur de choisir entre :
    1. *Sauvegarder le JSON unique* : Exporte un fichier JSON global contenant tous les fichiers et l'historique commun (voir [json-project-v9-specs.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/fonction/json-project-v9-specs.md#51-sauvegarde-unique-en-fichier-json-global)).
    2. *Sauvegarder chaque fichier* : Écrit séparément chaque fichier sur le disque. Utilise l'API *File System Access* (via le pointeur `fileHandle` conservé en mémoire) pour écraser silencieusement les fichiers d'origine sans ouvrir de boîte de dialogue système répétitive (voir [json-project-v9-specs.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/fonction/json-project-v9-specs.md#52-sauvegarde-physique-individuelle-des-fichiers-sur-le-disque)).
- **Exporter TOUT** :
  - Génère un JSON simplifié contenant l'état final de tous les fichiers du projet, avec leurs métadonnées (nom de fichier, chemin relatif, et suffixe unique si collision de nom).
  - Enregistre ce JSON d'export directement dans le dossier de téléchargement sous le nom standardisé `nom projet - version - allexport.json` avec un en-tête d'explications destiné à guider une IA.

---

## Dépendances et références

- Voir [sidebar-right-history.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/sidebar-right-history.md) pour la table d'historique située immédiatement au-dessous.
- Voir [ui-layout-main.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/ui-layout-main.md) pour les règles générales d'agencement et de redimensionnement de la sidebar droite.
- Voir [zone-centrale-onglets.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/zone-centrale-onglets.md) pour la comparaison avec la barre d'onglets des fichiers de la zone centrale.
