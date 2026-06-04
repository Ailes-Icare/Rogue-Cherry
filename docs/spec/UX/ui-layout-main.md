# UI Layout Principal — Règles Générales

## Vue d'ensemble

Ce document définit les règles d'agencement global de l'interface utilisateur de Rogue Cherry. Il spécifie la répartition de l'écran en colonnes horizontales, le comportement réactif (responsive design) lors du redimensionnement de la fenêtre, ainsi que la structure interne verticale de la sidebar gauche pilotée par son splitter horizontal.

---

## Structure Tripartite Horizontale

L'interface de l'application est divisée horizontalement en trois colonnes principales, séparées par des séparateurs de redimensionnement verticaux (`Splitter.jsx`) :

```text
+----------------------+-----------------------------------+----------------------+
|                      |                                   |                      |
|   PANNEAU GAUCHE     |           ZONE CENTRALE           |    PANNEAU DROIT     |
|   (SidebarLeft)      |     (Code Editor / Onglets)       |    (SidebarRight)    |
|                      |                                   |                      |
+----------------------+-----------------------------------+----------------------+
```

1. **Panneau Gauche (`SidebarLeft.jsx`)** : Assistant syntaxique, pile multistack, zones de recherche FIND / REPLACE, options STRICT/MULTI, et panneau de Cherry-Picking.
2. **Zone Centrale** : En-tête de contrôle principal, bandeau de recherche globale, onglets multi-fichiers, éditeur de code source (`CodeEditor.jsx`) et barre de statut.
3. **Panneau Droit (`SidebarRight.jsx`)** : Contrôleur d'historique (Time-Travel), importation/exportation de projets, et mini-views comparatives.

### Ratios et Contraintes de Largeur

- **Proportions Initiales (Par défaut)** :
  - Panneau Gauche : **25 %** de la largeur de l'écran (`window.innerWidth * 0.25`).
  - Panneau Droit : **25 %** de la largeur de l'écran (`window.innerWidth * 0.25`).
  - Zone Centrale : **50 %** de la largeur restante de l'écran.
- **Limites de Largeur Physique (Min-Width)** :
  - Panneaux Gauche et Droit : Largeur minimale de **280 px** (`min-w-[280px]`).
  - Zone Centrale : Largeur minimale de **450 px** (`min-w-[450px]`).

### Comportement Réactif Global (Responsive)

En cas de réduction de la largeur de la fenêtre du navigateur :
1. **Étape 1 (Priorité Centrale)** : Les panneaux latéraux (Gauche et Droit) absorbent en priorité le delta négatif de largeur en se réduisant de manière équitable.
2. **Étape 2 (Butées Latérales)** : Les panneaux latéraux continuent de rétrécir jusqu'à atteindre leur largeur minimale absolue de **280 px**.
3. **Étape 3 (Réduction Centrale)** : Ce n'est qu'une fois les deux panneaux latéraux bloqués à 280px que la zone centrale commence elle-même à se réduire en deçà de 50%.
4. **Étape 4 (Débordement)** : La zone centrale se bloque à **450 px**. Si la fenêtre rétrécit encore, un défilement horizontal global (`overflow-x-auto`) est appliqué à l'application.

---

## Structure Verticale de la Sidebar Gauche

La sidebar gauche est structurée verticalement en 5 zones distinctes, réparties de part et d'autre d'un splitter horizontal glissant :

| Zone | Fichier de spécification associé | Type de hauteur |
|---|---|---|
| **1. Bandeau de Requête (Assistant)** | [sidebar-left-top-band.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/sidebar-left-top-band.md) | Adaptative (Complet / Replié) |
| **2. Pile de requêtes (Multistack)** | [sidebar-left-multistack.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/sidebar-left-multistack.md) | Flexible (Défilement interne) |
| **3. Boutons d'Action Principaux** | [sidebar-left-center.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/sidebar-left-center.md) | **Fixe et Incompressible** |
| *--- SPLITTER HORIZONTAL ---* | *Séparateur interactif* | - |
| **4. Zones de saisie (textes)** | [sidebar-left-bottom-inputs.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/sidebar-left-bottom-inputs.md) | Flexible (Défilement/Zoom) |
| **5. Barre Basse (Options & Cherry-Picking)** | [sidebar-left-bottom-bar.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/sidebar-left-bottom-bar.md) | **Fixe et Incompressible** |

### Comportement de Superposition et Empilement (Layers & Clipping) de la Sidebar Gauche

La section supérieure de la sidebar gauche (située au-dessus du splitter) est divisée en deux couches fonctionnelles :
1. **Conteneur de flux principal** (Assistant format requête + Pile Multistack) :
   - Ces deux éléments sont positionnés de manière **solidaire** dans le flux vertical (`flex flex-col`).
   - Ils se **poussent mutuellement** et ne peuvent pas se chevaucher ou glisser l'un sous l'autre. La pile Multistack s'étend en poussant le bas de l'assistant, et l'assistant se replie sans passer sous la pile.
2. **Panneau des Boutons d'Action Principaux** :
   - Ce panneau est positionné sur une **couche supérieure** (`z-index: 10`) avec un fond opaque identique à la couleur de fond de la sidebar (`bg-bg-panel`).
   - **Cinématique lors de la remontée du splitter** (réduction de `topHeight`) :
     - *Phase de poussée responsive* : En remontant le splitter, l'espace disponible diminue. Les boutons d'action fixes forcent d'abord la pile Multistack à réduire sa hauteur (défilement interne via scrollbar), puis forcent le repli (Auto-Collapse) de l'assistant.
     - *Phase de superposition (Overlap)* : Une fois l'assistant replié à sa hauteur minimale et la pile multistack écrasée, si le splitter continue de remonter, le panneau des boutons d'action (grâce à son `z-index: 10` et son opacité) **glisse visuellement par-dessus** la pile Multistack, puis par-dessus l'Assistant format requête, les masquant par le bas (effet de rognage/clipping géré par l'overflow-hidden du conteneur).

---

## Structure Verticale de la Sidebar Droite

La sidebar droite est structurée verticalement en 4 zones principales, délimitées par un splitter horizontal :

| Zone | Fichier de spécification associé | Type de hauteur |
|---|---|---|
| **1. Gestion de Projet & Onglets** | [sidebar-right-top-project.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/sidebar-right-top-project.md) | **Fixe et Incompressible** (72px) |
| **2. Tableau d'Historique (Time-Travel)** | [sidebar-right-history.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/sidebar-right-history.md) | Flexible (géré par le splitter) |
| *--- SPLITTER HORIZONTAL ---* | *Séparateur interactif* | - |
| **3. Contrôles de Version & Actions** | [sidebar-right-controls.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/sidebar-right-controls.md) | **Fixe et Incompressible** |
| **4. Mini-Views AVANT / APRÈS** | [sidebar-right-miniviews.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/sidebar-right-miniviews.md) | Flexible (Redimensionnable, min 120px) |

---

## Les Séparateurs Horizontaux (Splitters)

Chaque panneau latéral (Gauche et Droit) dispose de son propre splitter horizontal permettant d'arbitrer l'allocation de la hauteur entre les éléments supérieurs et inférieurs :

### 1. Splitter Gauche
- **Rôle** : Sépare les actions rapides (Haut) des champs de saisie (Bas).
- **Butée Haute** : Bloqué à **100 px** du haut (sans pile) ou **140 px** (avec pile multistack active) pour laisser visible l'Assistant.
- **Butée Basse (`bottomReserved` de butée)** : Bloqué à **180 px** du bas (sans Cherry-picking actif) ou **240 px** (avec Cherry-picking actif).
  - *Nuance physique* : Cette butée logique de **180 px / 240 px** est calculée en ajoutant une marge de garde de 20 px sur la hauteur physique brute cumulée des composants du panneau bas (qui est de **160 px** sans Cherry-picking et de **220 px** avec le Cherry-picking actif) afin d'éviter le clipping visuel ou l'apparition de scrollbars parasites.
- **Ajustement Automatique** : Remontée automatique de la barre si le mode MULTI s'active alors que le splitter est trop bas.

### 2. Splitter Droit
- **Rôle** : Sépare le tableau d'historique de versions (Haut) des mini-views de comparaison (Bas).
- **Butée Haute** : Bloqué à **80 px** du haut de son conteneur parent (géré dans `handleHistoryResize`).
- **Butée Basse** : Bloqué à **200 px** du bas de l'écran pour sanctuariser l'espace des mini-views comparative.
- **Masquage** : Le splitter droit est masqué si les mini-views comparatives sont désactivées (`showMiniViews === false`). Le tableau d'historique s'étire alors à 100% de la hauteur.

---

## Règles de Priorité et de Visibilité Réactive

Lorsque l'espace vertical ou horizontal de l'application devient extrêmement contraint :

1. **Réduction de hauteur (Verticale)** :
   - Les boutons fixes et barres de contrôle supérieures/inférieures des deux sidebars restent toujours visibles.
   - Les textareas de saisie (gauche) et les mini-views (droite) réduisent leur hauteur en priorité en activant leur défilement interne.
   - La zone Commentaire gauche s'enroule si l'espace est < 180px.
   - L'Assistant format requête gauche s'enroule en mode réduit.
   - Les mini-views droite peuvent être masquées manuellement par l'utilisateur (`showMiniViews = false`) pour libérer 100% de la hauteur au tableau d'historique.
2. **Réduction de largeur (Horizontale)** :
   - Les boutons longs (ex: "New Branch" et "RESET" à droite, boutons d'action à gauche) réduisent leur taille de police et leurs marges.
   - En dessous de seuils critiques, les libellés sont remplacés par des icônes représentatives ou abrégés sous forme de sigles.
   - Les colonnes secondaires du tableau d'historique (Source, Heure) et les colonnes de la pile Multistack se compressent ou se cachent.

---

## Dépendances et références

Ce document sert de référence d'agencement global pour l'interface :
- **Sidebar Gauche** :
  - [sidebar-left-top-band.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/sidebar-left-top-band.md)
  - [sidebar-left-multistack.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/sidebar-left-multistack.md)
  - [sidebar-left-center.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/sidebar-left-center.md)
  - [sidebar-left-bottom-inputs.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/sidebar-left-bottom-inputs.md)
  - [sidebar-left-bottom-bar.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/sidebar-left-bottom-bar.md)
- **Sidebar Droite** :
  - [sidebar-right-top-project.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/sidebar-right-top-project.md)
  - [sidebar-right-history.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/sidebar-right-history.md)
  - [sidebar-right-controls.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/sidebar-right-controls.md)
  - [sidebar-right-miniviews.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/sidebar-right-miniviews.md)
- **Modifications Historiques** :
  - [UI-layout-principal.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/UI-layout-principal.md) (Notice de redirection historique)
- **Spécifications Fonctionnelles** :
  - [helpers.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/fonction/helpers.md) (Utilitaires de texte, rendu d'invisibles windowing)
  - [hooks.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/fonction/hooks.md) (Hooks useZoomable et useDraggable)

