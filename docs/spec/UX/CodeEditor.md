# Spécifications : Éditeur de Code Principal (`CodeEditor.jsx`)

**Fichier source** : `src/components/CodeEditor.jsx` (955 lignes)

Zone centrale de l'application affichant le texte source. Composant le plus sensible aux performances car il gère potentiellement des dizaines de milliers de lignes avec plusieurs couches de surbrillance simultanées.

---

## 1. Props d'Entrée

| Prop | Type | Rôle |
|---|---|---|
| `text` | `string` | Le texte source complet (extrait de `currentText` du store) |
| `marks` | `Array` | Marqueurs de surbrillance (historique + recherche Find) |
| `activeOccIndex` | `number` | Index de l'occurrence actuellement focalisée (Base-0) |
| `isEditable` | `bool` | Active le Mode Édition Libre (Mode Cadenas) |
| `fontSize` | `number` | Taille de police en px (zoom via Ctrl+Molette) |
| `scrollTargetIndex` | `number\|null` | Ligne à scroller automatiquement (suite à un Find ou un saut) |
| `globalSearchBarText` | `string` | Texte de la barre de recherche globale |
| `globalSearchMarks` | `Array` | Marqueurs produits par la recherche globale |
| `globalSearchOccIndex` | `number` | Occurrence active de la recherche globale (Base-0) |
| `isGlobalEscapeHatchActive` | `bool` | Bloque la recherche si le document est trop grand |

---

## 2. Moteur de Rendu Optimisé (Windowing / Virtualisation)

### 2.1 `CodeLine` — Composant Mémoïsé

Chaque ligne est encapsulée dans `CodeLine = React.memo(...)`. Une `CodeLine` ne se re-rend **que si** l'une de ces props change : `text`, `marks`, `isTargeted`, `showInvisibles`, `isOccLine`, `isActiveOccLine`.

> **Règle critique** : Toute modification du rendu qui n'est pas dans ces props (ex: ajout d'une nouvelle prop ou d'un état parent) **ne déclenchera pas** de re-rendu des lignes existantes. Penser à passer les nouvelles données comme prop pour forcer la mise à jour.

### 2.2 Windowing Visuel (`visibleRange`)

Le CodeEditor **ne rend pas toutes les lignes** dans le DOM :

1. Un `onScroll` sur le conteneur calcule :
   ```js
   const lineHeight = 1.5 * fontSize; // ex: 14px * 1.5 = 21px
   const startLine = Math.floor(scrollTop / lineHeight);
   const endLine = Math.floor((scrollTop + clientHeight) / lineHeight);
   setVisibleRange([startLine - 100, endLine + 100]);
   ```
2. React ne monte des `<CodeLine>` que pour `[startLine - 100, endLine + 100]`.
3. Les zones non rendues sont remplacées par des `<div style={{ height: N * lineHeight }}/>` maintenant la barre de défilement native à la bonne taille (`paddingTop`, `paddingBottom`).

**Conséquence** : Sur un fichier de 50 000 lignes, seules ~350 lignes (fenêtre visible + marges) sont dans le DOM à tout moment.

**Recalcul du windowing** : Déclenché aussi lors du toggle de `showInvisibles` (via `useEffect`) pour éviter que le changement de rendu des caractères invisibles ne crée un freeze.

---

## 3. Modes d'Interaction

### 3.1 Mode Lecture Seule (Default)
- L'affichage est construit de balises `<div>` (non éditables).
- Sélection du texte autorisée (`select-text`, `user-select: text`).
- Le diffing intra-ligne et les heatmaps sont pleinement opérationnels.

### 3.2 Mode Édition Libre (Mode Cadenas — `isEditable = true`)
- L'éditeur bascule vers un unique `<textarea>` natif remplissant la zone centrale.
- Le windowing complexe est suspendu (le textarea gère lui-même son rendu).
- Le mode invisibles est **inopérant** dans ce mode (textarea standard).
- Synchronisation de scroll entre le `textarea` et une `gutterRef` (gouttière des numéros de lignes côte à côte).
- **Sortie du mode** : Déclenche `computeGhostDelta(textAvantEdition, nouvelleValeur)` dans `App.jsx`. Les modifications manuelles sont transformées en delta(s) FIND/REPLACE et ajoutés à l'historique silencieusement.

---

## 4. Gouttière et Surbrillance de Ligne

### 4.1 Colonne Gauche (Numéros de Ligne)
- Largeur fixe `w-12` (48px), fond `#252526`, bordure droite.
- Deux indicateurs visuels dans la mini-gouttière (côté gauche du numéro) :
  - **`▶`** (carré bleu) : Occurrence **active** (actuellement focalisée par la navigation).
  - **`●`** (point) : Occurrence **trouvée mais pas active**. La couleur du point correspond à la classe CSS de l'occurrence (jaune si 100%, orange si fuzzy...).

### 4.2 Gouttière de Modification (Background)
- Si `isGutterModified = true` (calculé via `marks`), le numéro de ligne reçoit un fond coloré `bg-gutter-mod` (jaune-vert) avec le numéro en noir gras.

### 4.3 Mise en Évidence Active (`isTargeted`)
- La ligne cible d'un saut (Find, Global Search, ou `scrollTargetIndex`) reçoit :
  - Un `outline outline-1 outline-red-500` sur le numéro de ligne.
  - Un `shadow-[0_0_5px_rgba(239,68,68,0.8)]` (lueur rouge).
  - Duree : 1500ms puis auto-effacement via `targetHighlightTimerRef`.
- Pour la Global Search : la durée est étendue à **30 secondes** (timer long) et s'efface si la recherche est annulée.

---

## 5. Mode Invisibles (`showInvisibles`)

- Toggle via l'icône œil `EyeIcon` dans la barre de statut.
- Quand actif, les caractères spéciaux dans `renderLineContent` reçoivent des classes CSS :
  - **Espaces** → `<span className="hc-space">` (point médian gris visible)
  - **Tabulations** → `<span className="hc-tab">` (chevron gris visible)
  - **Fin de ligne** → `<span className="hc-nl">` (pilcrow `¶` gris)

---

## 6. Fusion des Sources de Marqueurs

Le CodeEditor fusionne deux sources de surbrillance :
1. **`marks`** : Marqueurs d'historique ou du Find Dynamique (SidebarLeft). Colorisent le texte modifié en vert/jaune/violet selon le type de delta.
2. **`globalSearchMarks`** : Marqueurs de la recherche globale (bandeau supérieur).

Les deux sources sont combinées dans `renderLineContent` via le système `char-map` (chaque caractère accumule un `Set()` de classes CSS). Un caractère appartenant à deux marques affiche l'union de leurs classes.

> **Priorité** : Si les deux marqueurs se chevauchent sur le même caractère, les deux classes CSS sont appliquées. Tailwind et les CSS spécifiques de Rogue Cherry gèrent les priorités visuelles via l'ordre des classes.

---

## 7. Barre de Recherche Globale (Intégrée dans CodeEditor)

### 7.1 Zone de Texte Extensible
- `<textarea>` auto-redimensionnable verticalement, **max 25% de `window.innerHeight`**.
- Au-delà, une gouttière de numéros de lignes et une scrollbar interne apparaissent.
- Zoom indépendant : `Ctrl+Molette` ajuste `searchFontSize` (entre 10 et 30px selon le mode mono/multi-ligne).

### 7.2 Badge de Résultats et Navigation
- Un double-clic sur le badge `x / y` ouvre la `LineChoiceModal` en Mode Occurrences :
  ```js
  callback: (val) => {
    const idx = parseInt(val, 10) - 1; // Conversion Base-1 (humain) → Base-0 (code)
    setGlobalSearchOccIndex(idx);
  }
  ```

### 7.3 Désactivation du Smart Mode (Timer 30s)
- Si `globalSearchBarText` est effacé mais que `globalSearchSmartMode = true`, un timer de 30 secondes désactive automatiquement le Smart Mode.
- Si le champ est re-rempli avant 30 secondes, le timer est annulé.

---

## 8. Barre de Statut (Status Bar)

- Affichée en bas du CodeEditor.
- Contenu : Nombre de lignes, nombre de caractères, et `statusBarInfo` (prop libre injectée par `App.jsx`, ex: "Version: V1.2.0").
- L'icône œil et le contrôle de zoom sont intégrés dans cette barre.
