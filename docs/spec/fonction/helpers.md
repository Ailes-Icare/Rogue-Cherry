# Spécifications : Utilitaires et Rendu des Invisibles (`helpers.js`)

**Fichier source** : `src/utils/helpers.js` (95 lignes)

Ce module fournit des fonctions utilitaires générales pour la sécurisation HTML, la normalisation des sauts de ligne multi-plateformes, la génération de marques temporelles et le rendu haute performance des caractères invisibles (invisibles windowing).

---

## 1. `escapeHtml(unsafe)` → `string`

**Rôle** : Échappe de manière sécurisée les caractères HTML réservés afin de prévenir les injections de code lors de l'affichage dans les backdrops de l'éditeur ou les diffs.

**Mécanisme d'optimisation (Fast Path)** :
- Utilise une Regex statique `_ESCAPE_HTML_RE = /[&<>]/g` et une table de correspondance rapide `_ESCAPE_HTML_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;' }`.
- **Coupe-circuit** : Avant d'effectuer le remplacement, l'algorithme teste la présence de ces caractères via `_ESCAPE_HTML_RE.test(unsafe)`. S'il n'y a aucun caractère à échapper, le texte original est retourné immédiatement sans allocation mémoire supplémentaire ni opération de remplacement.
- L'état de la Regex est réinitialisé après le test (`_ESCAPE_HTML_RE.lastIndex = 0`).

---

## 2. `normalizeText(text)` → `string`

**Rôle** : Standardise les fins de ligne pour éviter les divergences syntaxiques provoquées par les différences de systèmes d'exploitation (sauts de ligne Windows `\r\n` vs Unix `\n`).
- Remplace toutes les occurrences de `\r\n` par `\n`.
- Assure la cohérence des calculs d'index de lignes dans les diffs et la heatmap.

---

## 3. Génération de Marques Temporelles

### 3.1 `getFullTimestamp()` → `string`
- Génère la date et l'heure locale complète au format français (`fr-FR`).
- Format de sortie : `JJ/MM/AAAA HH:MM:SS` (ex: `"23/05/2026 18:54:12"`).
- Utilisé pour dater les snapshots physiques et les branches.

### 3.2 `getTimeTimestamp()` → `string`
- Génère uniquement l'heure locale au format français (`fr-FR`).
- Format de sortie : `HH:MM:SS` (ex: `"18:54:12"`).
- Utilisé pour l'affichage léger et compact de la colonne Heure dans la table d'historique.

---

## 4. `renderInvisiblesHtml(text, showInvisibles, visibleRange)` → `string`

**Rôle** : Convertit un texte brut en HTML échappé tout en insérant les balises CSS permettant l'affichage des symboles invisibles (espaces `·`, tabulations `→` et sauts de ligne `↵`).

### A. Remplacement Standard (Textes Courts / Backdrops)
Si `visibleRange` est `null` ou non fourni :
- Le texte complet est échappé via `escapeHtml`.
- Les caractères suivants sont convertis en balises stylisées :
  - Les tabulations (`\t`) sont enveloppées par `<span class="hc-tab">\t</span>`.
  - Les espaces (` `) sont enveloppées par `<span class="hc-space"> </span>`.
  - Les sauts de ligne (`\n`) sont remplacés par `<span class="hc-nl"></span>\n`.

### B. Algorithme de Windowing pour les Textes Volumineux
Sur des fichiers de code géants (ex: > 10 000 lignes), effectuer un remplacement de caractères sur l'intégralité du document provoquerait des blocages du thread principal de rendu de React. Pour pallier cela, l'algorithme applique un **Windowing (fenêtrage)** :
1. Le texte source est découpé par ligne (`text.split('\n')`).
2. Les bornes visibles sont récupérées via `visibleRange = [startLine, endLine]`.
3. L'algorithme itère sur chaque ligne du tableau :
   - Si l'index de la ligne se trouve **en dehors de la fenêtre visible** : la ligne est simplement échappée via `escapeHtml` (aucun span injecté).
   - Si la ligne est **dans la fenêtre visible** (`i >= start && i <= end`) : les espaces, tabulations et retours chariots sont convertis en spans de caractères invisibles (`hc-space`, `hc-tab`, `hc-nl`).
4. Rejoint le tableau de lignes avec le séparateur `\n` pour renvoyer le HTML final.

**Impact performance** : Cet algorithme limite le travail de rendu de caractères complexes au seul viewport affiché à l'écran, maintenant une fluidité parfaite (60 FPS) même sur les fichiers de plusieurs mégaoctets.

---

## 5. Dépendances et références

- Voir [CodeEditor.md](../UX/CodeEditor.md) pour la description de l'éditeur qui consomme le rendu des invisibles.
- Voir [diffEngine.md](diffEngine.md) pour les calculs de diffs qui s'appuient sur ces utilitaires de texte.
