# Spécifications : Hooks de Comportement (`useZoomable.js` & `useDraggable.js`)

**Dossier source** : `src/hooks/`

Ce document décrit les hooks React personnalisés qui gouvernent les interactions utilisateur de bas niveau (zoom interactif et déplacement de fenêtres/modales).

---

## 1. Hook `useZoomable(initialSize = 14)`

**Rôle** : Rendre une zone de texte ou un conteneur HTML zoomable via la combinaison de touches **Ctrl + molette de défilement**.

**Signature** :
```js
export function useZoomable(initialSize = 14) -> callbackRef
```

### 1.1 Fonctionnement interne
- **Callback Ref** : Utilise une fonction de rappel en tant que ref (`callbackRef`) au lieu d'une ref standard (`useRef`). C'est une mécanique nécessaire pour détecter l'instant exact où l'élément est monté dans le DOM réel, en particulier pour les modales ou les volets secondaires dont le montage est conditionné par un état React.
- **Écouteur natif non passif** : L'écouteur d'événement `wheel` est attaché directement sur le nœud DOM avec l'option `{ passive: false }`. Cela permet de contourner les restrictions des navigateurs récents (comme Google Chrome) qui marquent les écouteurs de défilement comme `passive` par défaut et lèvent une exception lors de l'appel à `preventDefault()`.
- **Isolation du Zoom** : Lorsque l'événement est intercepté avec `e.ctrlKey === true` :
  - Appelle `e.preventDefault()` pour empêcher le navigateur de zoomer sur toute la page web.
  - Appelle `e.stopPropagation()` pour empêcher les conteneurs parents de recevoir l'événement, ce qui permet d'isoler chaque zone de zoom de façon indépendante.
- **Bornes physiques de zoom local** :
  - Incrémentation/décrémentation de la valeur en pixels via la molette.
  - La valeur est clampée de manière stricte entre **8 px** (minimum) et **40 px** (maximum).
  - La valeur locale est injectée sous forme de variable CSS `--zoom-size` directement dans le style inline de l'élément cible.
- **Intégration du Zoom Global** :
  - L'application dispose d'un décalage de zoom global (`--global-zoom-offset`) géré dans `App.jsx`.
  - Les conteneurs combinant les deux mécanismes utilisent un calcul hybride CSS pour adapter leur taille de manière réactive :
    `style={{ fontSize: 'calc(var(--zoom-size, 14px) + var(--global-zoom-offset, 0px))' }}`
  - Cela permet de conserver des zones avec un zoom indépendant fort (via `useZoomable`) tout en respectant le niveau de confort de base défini globalement par l'utilisateur.

---

## 2. Hook `useDraggable(options = {})`

**Rôle** : Permet de rendre n'importe quel conteneur (typiquement des fenêtres de dialogue ou des modales) déplaçable par cliquer-glisser sur son en-tête ou sa structure.

**Signature** :
```js
export function useDraggable(options = { disabled: false }) -> { position, isDragging, modalRef, dragHandlers, style }
```

### 2.1 Fonctionnement interne
- **Gestion des Événements Pointer** : Repose sur les handlers `onPointerDown`, `onPointerMove`, `onPointerUp` et `onPointerCancel`. Les événements Pointer unifient la gestion des clics de souris, des pressions tactiles et des stylets.
- **Filtrage des Zones Interactives** : L'algorithme vérifie la cible du clic (`e.target`). Le déplacement est ignoré si le clic provient :
  - D'une balise de saisie ou d'action : `INPUT`, `TEXTAREA`, `BUTTON`, `SELECT`, `OPTION`.
  - D'un conteneur parent ayant un rôle de bouton : `closest('button')`.
- **Capture du Pointeur (Pointer Capture)** : Lors du démarrage du drag, le hook déclenche `e.target.setPointerCapture(e.pointerId)`. Cela force le navigateur à continuer de rediriger tous les événements de mouvement vers l'élément initiateur, même si le curseur de l'utilisateur sort physiquement des limites du conteneur pendant un glissement rapide.
- **Algorithme de Butées Physiques du Viewport** :
  Pour éviter que l'utilisateur ne déplace la modale en dehors de l'écran visible et ne la perde définitivement, des contraintes sont appliquées dans `handlePointerMove` :
  - Récupère la position absolue du conteneur via `getBoundingClientRect()`.
  - **Sanctuarisation de la poignée supérieure** : Si le haut projeté de la modale passe au-dessus de la limite supérieure de la fenêtre (`projectedTop < 0`), le mouvement vertical est bloqué (`newY = position.y - rect.top`). L'utilisateur ne peut jamais glisser l'en-tête de la modale en dehors de l'écran en hauteur.
  - **Marges de bords** : Une marge de garde de **50 px** (`margin = 50`) est appliquée sur les bords gauche, droit et bas. L'utilisateur ne peut pas déplacer la modale de sorte qu'il reste moins de 50px visibles à l'écran.

---

## 3. Dépendances et références

- Les modales déplaçables (`VersionTagModal`, `MessageBox`) importent et s'appuient sur `useDraggable`.
- Les zones de texte à zoom indépendant (`CodeEditor`, `SidebarLeft`, `SmartDebugger`) importent et utilisent `useZoomable`.
- Voir [ui-layout-main.md](../UX/ui-layout-main.md) pour les règles d'agencement global.
