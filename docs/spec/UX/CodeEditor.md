# Spécifications : Éditeur de Code Principal (`CodeEditor.jsx`)

**Fichier source** : `src/components/CodeEditor.jsx` (955 lignes)

Ce document décrit le composant visuel et fonctionnel `CodeEditor` (rendu, windowing, modes visuels, gutter). Pour les couches de contrôle, voir :
- Le [Contrôleur de la Zone Centrale (zone-centrale-code-editor.md)](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/zone-centrale-code-editor.md)
- Le [Contrôleur du Débogueur (SmartDebugger.md)](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/modal/SmartDebugger.md)

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
- Affiche le texte chargé par le bouton "import" ou "open".
- L'affichage est construit de balises `<div>` (non éditables).
- Sélection du texte autorisée (`select-text`, `user-select: text`).
- Le diffing intra-ligne et les heatmaps sont pleinement opérationnels.
- **Logo central (Filigrane) en arrière-plan** :
  - **Fichier source** : `_brand/rogue_cherry-GHB.svg` (alias `logoGhb`).
  - **Transparence** : Fixée à **30%** (`opacity-30`).
  - **Taille** : Largeur automatique, limitée à un maximum de **80% de la largeur** de la zone d'édition et **50% de sa hauteur** (`max-w-[80%] max-h-[50%]`).
  - **Position** : Parfaitement centré horizontalement et verticalement dans la zone d'édition.
  - **Mécanique de Scroll fixe (CSS Layering)** : Le conteneur du logo est positionné en absolu (`absolute inset-0`) avec un `zIndex` de `0`. La couche d'affichage du texte du code (`editorWrapperRef`) est positionnée en superposition absolue (`absolute inset-0`) avec un `zIndex` de `1` et gère le défilement (`overflow: auto`). Le logo reste donc fixe à l'écran tandis que le code défile au premier plan.
  - **Gestion de mémoire** : Le logo est entièrement déchargé du DOM (pas simplement masqué) dès que le mode d'édition ou l'affichage des invisibles est activé.

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
- **Mise à l'échelle (Zoom synchrone)** : La gouttière hérite dynamiquement de la taille de police active de l'éditeur (`fontSize` ou `searchFontSize`) via `style={{ fontSize: 'inherit' }}`. Elle s'agrandit et se rétrécit ainsi en parfaite synchronisation avec le texte. Les badges intérieurs de modification utilisent des dimensions relatives (`em`) pour s'adapter fidèlement.
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
- Pour la Global Search : la durée de mise en évidence est de **30 secondes** (timer long) et persiste **même après la fermeture, l'effacement ou le masquage de la recherche globale** (permettant à l'utilisateur de garder le repère visuel de la ligne trouvée même si la recherche n'est plus active ou visible). Elle s'efface uniquement si une nouvelle recherche globale est lancée.

---

## 5. Mode Invisibles (`showInvisibles`)

- Toggle via l'icône œil `EyeIcon` dans la barre de statut. (l'icone peu se trouver a différents endroits suivant qu'on est dans la modale de debug ou sur la fenetre principale)
- Quand actif, les caractères spéciaux dans `renderLineContent` reçoivent des classes CSS :
  - **Espaces** → `<span className="hc-space">` (point médian gris visible)
  - **Tabulations** → `<span className="hc-tab">` (chevron gris visible)
  - **Fin de ligne** → `<span className="hc-nl">` (pilcrow `¶` gris)

---

## 6. Fusion des Sources de Marqueurs

Le CodeEditor fusionne deux sources de surbrillance :
1. **`marks`** : Marqueurs d'historique ou du Find dynamique DraftSearch (SidebarLeft). Colorisent le texte modifié en vert/jaune/violet selon le type de delta.
2. **`globalSearchMarks`** : Marqueurs de la recherche globale DraftSearch (bandeau supérieur, via la Lightmap DraftSearch).

Les deux sources sont combinées dans `renderLineContent` via le système `char-map` (chaque caractère accumule un `Set()` de classes CSS). Un caractère appartenant à deux marques affiche l'union de leurs classes.

> **Priorité** : Si les deux marqueurs se chevauchent sur le même caractère, les deux classes CSS sont appliquées. Tailwind et les CSS spécifiques de Rogue Cherry gèrent les priorités visuelles via l'ordre des classes.

---

## 7. Barre de Recherche Globale (Intégrée dans CodeEditor)

### 7.1 Zone de Texte Extensible
- `<textarea>` auto-redimensionnable verticalement, **max 25% de `window.innerHeight`**.
- Au-delà, une gouttière de numéros de lignes et une scrollbar interne apparaissent.
- Zoom indépendant : `Ctrl+Molette` ajuste `searchFontSize` (entre 10 et 30px selon le mode mono/multi-ligne). La gouttière de la barre de recherche multiline suit cette même taille de police (`searchFontSize`) de sorte à zoomer et dézoomer de manière synchronisée avec le champ de saisie.

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

---

## 9. Charte Colorimétrique et Systèmes de Surlignage

L'éditeur de code principal gère une couche sophistiquée de marquages (calques superposés) utilisant des classes CSS spécifiques configurées dans Tailwind et `index.css`.

### 9.1 Les Tonalités Violettes (Modifications et Diff)
*   **Violet Sombre / Prune (`.hl-line-mod` — `#59466D`)** : 
    *   *Rôle* : Arrière-plan de ligne modifiée.
    *   *Usage* : Appliqué à l'ensemble d'une ligne ayant subi des altérations par rapport au snapshot d'origine (DraftSurge).
*   **Violet Vif / Lavande (`.hl-word-mod` — `#9E67BA`)** : 
    *   *Rôle* : Surlignage de mot/caractères modifiés.
    *   *Usage* : Appliqué spécifiquement aux mots ou caractères ayant changé à l'intérieur d'une ligne modifiée.
*   **Violet Clair / Translucide (`.hl-linebg` — `rgba(198, 142, 255, 0.35)`)** : 
    *   *Rôle* : Surbrillance d'arrière-plan de ligne d'historique.
    *   *Usage* : Teinte subtilement la ligne contenant la modification active en cours de visualisation (Time-Travel).

### 9.2 Les Tonalités Jaunes et Or (Recherche et Conformité)
*   **Jaune Vif (`.hl-yellow` — `#FFD700`)** : 
    *   *Rôle* : Surlignage d'occurrence de recherche parfaite.
    *   *Usage* : Correspondances à 100% de la chaîne de recherche (recherche FIND de la sidebar et recherche globale).
*   **Jaune/Or Chaud (`.hl-find-80` — `#FFD700`)** : 
    *   *Rôle* : Surlignage de correspondance forte (similarité >= 80%).
    *   *Usage* : Utilisé par l'algorithme de recherche live pour les occurrences très proches du motif recherché.
*   **Jaune Clair avec Liseret Pointillé (`.hl-yellow-pale` — `rgba(255, 215, 0, 0.25)`)** : 
    *   *Rôle* : Marquage secondaire d'occurrence.
    *   *Usage* : Surlignage transparent souligné d'un liseret pointillé en jaune vif (`border-b 1px dashed #FFD700`).

### 9.3 Les Tonalités Roses et Vertes (Ajouts et Gouttière)
*   **Rose / Magenta (`.hl-ins` — `#FF007F`)** : 
    *   *Rôle* : Surlignage d'insertion de texte.
    *   *Usage* : Utilisé pour colorer le texte nouvellement inséré dans le calque REPLACE (DraftSurge).
*   **Turquoise Vif / Gouttière Modifiée (`.bg-gutter-mod` / `.gutter-mod-item` — `#00FF7F`)** : 
    *   *Rôle* : Signalement visuel de ligne modifiée.
    *   *Usage* : Teinte l'arrière-plan du numéro de ligne dans la gouttière avec écriture du numéro en noir et gras pour indiquer une modification.

### 9.4 Les Tonalités Rouges (Suppressions et Erreurs)
*   **Orange/Rouge (`.hl-find-50` — `#FF8C00`)** :
    *   *Rôle* : Surlignage de correspondance modérée (similarité >= 50%).
*   **Rouge Vif (`.hl-find-10` — `#FF4500` / `.hl-del` — `#FF0000`)** :
    *   *Rôle* : Surlignage de correspondance faible (similarité < 50%) ou suppression.
    *   *Usage* : Colore les correspondances médiocres en rouge ou génère une boîte rouge flottante contenant la croix de suppression `[✖]` (classe `.hl-del`) à l'emplacement exact d'une coupure de ligne.
*   **Gris Barré (`.hl-del-txt` — Texte couleur `#888` avec `line-through` + fond transparent)** :
    *   *Rôle* : Surlignage de texte supprimé.
    *   *Usage* : Rend le texte supprimé discret, barré et grisé dans le calque de prévisualisation (diff FIND).

---

## 10. Règles de Priorité, Persistance et Annulation (Reset)

### 10.1 Priorité de la Colorisation DraftSearch de Recherche (Jaune vs Violet/DraftSurge)

> [!NOTE]
> Cette logique de priorité dynamique n'est peut-être pas encore entièrement implémentée dans le code actuel.

- **Priorité Supérieure** : La colorisation temporaire issue d'une recherche active DraftSearch (surlignage jaune `.hl-yellow` issu du calcul de Lightmap DraftSearch) dispose d'un niveau de priorité supérieur à la colorisation DraftSurge (tonalités violettes, `.hl-line-mod` / `.hl-word-mod`).
- **Comportement de Survoltage** : Lorsqu'une ligne ou une portion de texte précédemment colorisée en violet se retrouve ciblée par une recherche DraftSearch (ou par la navigation d'une pile multistack), cette ligne doit passer au jaune.
- **Restauration de la Colorisation d'Origine** : Si l'application de la requête n'est pas confirmée, ou si l'utilisateur navigue ailleurs (effacement de la recherche DraftSearch, sélection d'une autre requête), la colorisation en jaune doit disparaître et la colorisation DraftSurge d'origine doit être restaurée.

### 10.2 Annulation de l'Empilement sur Changement de Version (Reset)

- **Reset de Version** : Tout changement de version du fichier (qu'il résulte d'un retour arrière/historique de type time-travel ou d'un checkout de branche) entraîne un reset complet de l'empilement des colorisations DraftSurge (lignes violettes). L'éditeur recalcule uniquement les marquages associés à la nouvelle version de référence, effaçant les résidus de modifications accumulées précédemment.

