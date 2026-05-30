# Spécifications : Gestionnaire d'Historique (`useHistoryStore.js`)

**Fichier source** : `src/hooks/useHistoryStore.js` (590 lignes)

Ce Hook React est la pièce centrale de l'application : il gère le cycle de vie complet du projet (Time-Travel, snapshots, deltas), expose `currentText` et `currentVersion` de façon réactive, et encapsule toute la logique de mutation de l'historique.

---

## 1. `applyDeltaOnText(text, findStr, replaceStr, multiMode, multiIndices, ignoreSpaces)` — Exportée

**Finalité** : Appliquer un delta unitaire (FIND/REPLACE) sur un texte. Fonction **pure** (pas d'effets de bord), exportée pour utilisation par `rebuildTextAt` et le SmartDebugger.

### A. Mode STRICT (`ignoreSpaces = false`)

**Single mode (`!multiMode`)** :
```js
text.replace(findStr, () => replaceStr)
```
⚠️ L'utilisation d'une **fonction fléchée** dans `.replace()` est **critique** : Elle empêche JavaScript d'interpréter accidentellement les patterns `$&`, `$'`, `` $` ``, `$1`... qui pourraient apparaître dans le code source et corrompre le remplacement.

**Multi mode (`multiMode = true`)** :
- Divise le texte en segments via `.split(findStr)`.
- Pour chaque segment, applique `replaceStr` ou `findStr` selon que l'index est dans `multiIndices` (Cherry-Picking).
- **Reverse Loop implicite** : Puisqu'on travaille sur un tableau de segments et qu'on reconstruit la chaîne dans l'ordre, l'Index Shifting est évité naturellement (chaque segment est isolé).

### B. Mode SMART (`ignoreSpaces = true`)
- Convertit `findStr` en Regex insensible à la casse, avec `\s+` à la place de chaque espace (`/mot1\s+mot2/gi`).
- **Ajustement Hybride de Casse** :
  - Si le nombre de mots trouvés = nombre de mots de remplacement → **préserve les espaces d'origine** et **la casse des mots non modifiés** (comparaison `toLowerCase`).
  - Sinon → Tente de préserver la casse des mots non modifiés, laisse les mots nouveaux avec leur casse native.

---

## 2. `rebuildTextAt(history, targetIndex)` — Interne

**Finalité** : Reconstruire le texte exact à n'importe quelle étape de l'historique (Time-Travel).

**Algorithme** :
1. Remonte dans l'historique depuis `targetIndex` vers l'index 0 pour trouver le **snapshot le plus proche** (`type === 'snapshot'`).
2. Lit `rawText` de ce snapshot.
3. Rejoue séquentiellement chaque enregistrement `type === 'replace'` depuis le snapshot jusqu'à `targetIndex` via `applyDeltaOnText`.
4. Retourne le texte reconstruit.

**Performance** : Sur un historique de 200 opérations depuis le dernier snapshot, 200 appels à `applyDeltaOnText` sont faits. En pratique, pour des projets standards, c'est invisible (<20ms). Pour des historiques très longs, `compressHistory` est conseillé.

---

## 3. Le Store Principal (`useHistoryStore`)

**Initialisation** : `useHistoryStore` initialise un state local `storeState = { history: [], selectedIndex: -1, versionConfig: DEFAULT_VERSION_CONFIG }`.

### 3.1 Propriétés Réactives (useMemo)

- **`currentText`** : Appelle `rebuildTextAt(history, selectedIndex)` à chaque changement de `selectedIndex` ou d'un enregistrement dans `history`.
- **`currentVersion`** : Lit `history[selectedIndex].version` directement (pas de reconstruction nécessaire).

### 3.2 `pushSnapshot(rawText, action, projectName, config, isSaved)`

- Crée un point d'ancrage **complet** (stockage du texte entier) dans l'historique.
- Réservé aux : import initial, création de version majeure, mode cadenas.
- Si `isSaved = true`, le snapshot est marqué bleu dans la SidebarRight.

### 3.3 `pushReplace({ findStr, replaceStr, multiMode, multiIndices, ignoreSpaces, comment, label })`

- Crée un enregistrement léger `type: 'replace'` (ne stocke pas le texte complet, seulement les paramètres du delta).
- **Embranchement Automatique** : Si `selectedIndex < history.length - 1` (l'utilisateur est dans le passé), **toute la future est purgée** : `history = history.slice(0, selectedIndex + 1)`. Rogue Cherry ne gère pas plusieurs lignes temporelles parallèles.
- La version est auto-incrémentée sur le rang `autoIncrementIndex` de la config.

### 3.4 `pushInfoRecord(action)` — Records Spéciaux

- Pousse un enregistrement `type: 'info'` purement métadonnée (ex: "Projet sauvegardé", "Export JSON effectué").
- **Protection Time-Travel** : Ces records sont **non-sélectionnables** dans la SidebarRight. Le clic sur un record `info` est ignoré par `setSelectedIndex`. L'utilisateur ne peut pas "revenir" à un état informationnel.
- Ils apparaissent grisés et en italique dans le tableau.

### 3.5 `createNewBranch(mode, targetRankIndex, newConfig, projectName, freezeArchive)`

Gère les mutations complexes de l'arbre des versions. Le paramètre `targetRankIndex` est polymorphe :

| Valeur | Comportement |
|---|---|
| Entier (0, 1, 2...) | Incrémente le rang N de la version et cascade-reset les rangs suivants |
| `'rename'` | Modifie le nom du projet sans toucher aux compteurs |
| `'changePattern'` | Remplace la configuration de numérotation entière |
| `-1` | Crée une branche (purge le futur depuis `selectedIndex`) |
| `'0'` | Rollback : clone la version de la source sans incrémenter |

### 3.6 `updateRecord(index, action, comment)` — Édition Métadonnée

- Modifie **directement** le label et le commentaire d'un enregistrement existant.
- Ne crée aucun nouvel enregistrement.
- Ne déclenche aucun recalcul de texte ni de diff.

### 3.7 `compressHistory(targetIndex)` — Optimisation Mémoire

- Écrase tout l'historique de l'index 0 jusqu'à `targetIndex - 1` en un unique snapshot initial.
- Le snapshot généré capture le `currentText` reconstruit à `targetIndex`, libérant tous les deltas intermédiaires de la RAM.
- **Irréversible** : L'utilisateur est averti par une `MessageBox` de confirmation.

---

## 4. Structure des Enregistrements d'Historique

### Type `snapshot` (Point d'Ancrage)
```js
{
  type: "snapshot",
  version: "V1.0.0",
  action: "IMPORT INITIAL",
  timestamp: "30/05/2026 14:32",
  rawText: "...", // Texte brut intégral
  isSaved: false,
  comment: "",
  source: ""
}
```

### Type `replace` (Delta Léger)
```js
{
  type: "replace",
  version: "V1.0.1",
  action: "Modification de X", // Extrait de [LABEL:...] ou auto-généré
  timestamp: "30/05/2026 14:35",
  findStr: "...",
  replaceStr: "...",
  multiMode: true,
  multiIndices: [0, 2], // Base-0 (l'occurrence 0 = 1ère)
  ignoreSpaces: false,
  comment: "",
  isSaved: false
}
```

### Type `info` (Enregistrement Non-Navigable)
```js
{
  type: "info",
  version: "V1.0.1", // Hérite de la version courante
  action: "Projet sauvegardé",
  timestamp: "30/05/2026 14:40"
}
```
