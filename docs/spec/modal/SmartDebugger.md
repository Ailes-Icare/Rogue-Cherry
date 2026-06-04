# Spécifications : Modale Débogueur Intelligent (`SmartDebugger.jsx`) — Agencement Visuel (UI)

**Fichier source** : `src/components/SmartDebugger.jsx` (1203 lignes)

Ce document définit l'agencement visuel, le squelette structurel et les contrôles de positionnement de la modale de débogage. Pour les spécifications logiques, voir :
- Le [Contrôleur de l'Éditeur Miroir (modal-debug-code-editor.md)](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/modal-debug-code-editor.md)
- Le [Contrôleur de Saisie et de Recherche (modal-debug-recherche.md)](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/modal-debug-recherche.md)

---

## 1. Cadre de la Modale et Triggers d'Ouverture

La modale s'affiche au-dessus de l'interface principale (fond d'assombrissement noir translucide `bg-black/80` avec un `zIndex` de `1000`).

### 1.1 Triggers Visuels
Elle s'ouvre de deux façons :
1.  **Ouverture automatique** : Suite à une erreur de syntaxe après collage ou application d'une requête IA.
2.  **Ouverture manuelle** : En cliquant sur le **Logo Cerises** du bandeau supérieur (quand un texte est chargé).

### 1.2 Styles du Cadre
- Le cadre principal de la modale prend une largeur de **90%** et une hauteur de **95%** de l'écran (`w-[90%] h-[95%]`).
- La bordure du cadre s'adapte dynamiquement selon la conformité syntaxique de la requête :
  - **Requête Conforme** : Bordure verte `rgb(0, 255, 127)` (`#00FF7F`) et lueur `shadow-[0_0_15px_rgba(0,255,127,0.25)]`.
  - **Syntaxe Invalide** : Bordure rouge cerise `rgb(209, 105, 105)` (`#d16969`) et lueur `shadow-[0_0_15px_rgba(209,105,105,0.25)]`.
- La modale est repositionnable manuellement (draggable) via un écouteur sur son en-tête.

---

## 2. Architecture Splitter Horizontal

La zone de travail sous l'en-tête est coupée en deux panneaux par un séparateur vertical dynamique (`Splitter.jsx` glissant horizontalement) :

-   **Panneau Gauche** : Réservé à l'analyse et à la correction de la requête (largeur initiale fixée par défaut à **40%**).
-   **Panneau Droit** : Réservé à la prévisualisation miroir du code source (largeur restante de **60%**).

---

## 3. Panneau Gauche : Édition et Décodage de la Requête

Ce panneau regroupe verticalement :
1.  **Entête "Requête Brute (Éditable)"** : Titre à gauche, bouton Smart Mode et **bouton œil de gauche** à droite.
2.  **Zone de Requête Brute** : Hauteur fixe de `160px` avec liseret pointillé bleu (`border-dashed border-primary-blue`), constitué d'un calque superposé `textarea` / `backdrop` pour la coloration syntaxique en temps réel.
3.  **Encart d'erreur** : S'affiche sous la requête brute en rouge cerise si la syntaxe est invalide.
4.  **Onglets de visualisations décodées** :
    -   Onglet **FIND** : Zone de texte en lecture seule affichant le texte recherché extrait.
    -   Onglet **REPLACE** : Zone de texte en lecture seule affichant le texte de remplacement extrait.

---

## 4. Panneau Droit : Miroir de Prévisualisation

Ce panneau regroupe verticalement :
1.  **Barre de Recherche Globale** : Un champ de recherche à hauteur extensible avec boutons d'occurrence.
2.  **Barre d'état de Conformité Heatmap** : Affiche le ratio de conformité en pourcentage.
3.  **Miroir du Texte Source** : Un conteneur d'affichage de code entouré d'un cadre sombre.
    -   **Entête du Miroir** : Titre à gauche ("Miroir de Prévisualisation du Texte Source") et **bouton œil de droite** à droite.
    -   **Zone de Code** : Zone de défilement affichant les lignes du code source (composant `MirrorLine` virtualisé).

---

## 5. Boutons de Visibilité des Caractères Invisibles (EyeIcons)

Pour préserver l'espace de la barre de statut principale, la modale intègre **deux boutons d'affichage des caractères invisibles (icônes œil) distincts** :

### 5.1 Bouton Œil Gauche (Saisie Requête)
-   **Position** : Situé tout en haut à droite du panneau gauche, dans la barre d'en-tête de la "Requête Brute (Éditable)".
-   **Action** : Active ou désactive l'affichage des espaces (`·`), tabulations (`→`) et retours à la ligne (`¶`/`↵`) dans les zones d'édition de gauche (Requête brute, FIND décodé, REPLACE décodé).

### 5.2 Bouton Œil Droite (Miroir de Code)
-   **Position** : Situé en haut à droite du panneau droit, dans la barre d'en-tête noire du "Miroir de Prévisualisation du Texte Source".
-   **Action** : Active ou désactive l'affichage des caractères invisibles spécifiquement dans la zone d'affichage du code miroir à droite.

*Ces deux contrôles fonctionnent sur le même principe visuel que le bouton œil de l'éditeur principal (voir [zone-centrale-bandeau-bas.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/zone-centrale-bandeau-bas.md)), mais agissent indépendamment sur leurs panneaux respectifs.*

---

## 6. Contrôles de Zoom Indépendants (Ctrl + Molette)

Pour optimiser la lisibilité du code et des requêtes, la modale intègre des mécanismes de zoom indépendants contrôlés par le raccourci `Ctrl + Molette` (via le hook `useZoomable`) :

### 6.1 Zoom des Zones de Saisie et de Décodage (Panneau Gauche)
- **Requête Brute, FIND et REPLACE** : Chacune de ces trois zones dispose de son propre conteneur zoomable indépendant (limites de **8 px** à **40 px**, valeur initiale **14 px**).
- Le zoom adapte dynamiquement la taille du texte tout en préservant l'alignement et la superposition des calques de coloration syntaxique et de caractères invisibles.

### 6.2 Zoom du Miroir de Prévisualisation (Panneau Droit)
- **Miroir du Texte Source** : Le conteneur du miroir dispose d'un zoom indépendant (limites de **8 px** à **40 px**, valeur initiale **10 px**).
- **Synchronisation de la Gouttière** : La gouttière de numérotation de ligne (`MirrorLine`) hérite de la taille de police active du miroir (`style={{ fontSize: 'inherit' }}`). Ainsi, la gouttière et ses indicateurs zooment et dézooment en parfaite synchronisation avec le texte du code source.

### 6.3 Zoom de la Barre de Recherche Globale
- En mode multiline, la zone de texte de recherche possède son propre zoom indépendant (`searchFontSize` de **8 px** à **40 px**), avec une gouttière de numéros de ligne multiline synchronisée qui s'ajuste également en temps réel.

