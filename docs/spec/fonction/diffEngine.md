# Spécifications : Moteur de Diff (`diffEngine.js`)

**Fichier source** : `src/utils/diffEngine.js` (503 lignes)

Le moteur de diff est le cœur analytique de Rogue Cherry. Il gère quatre fonctions majeures : la comparaison sémantique, la génération de deltas fantômes, la colorisation DraftSurge, et les Lightmaps/Heatmaps de recherche DraftSearch.

---

## 1. `getSimilarity(str1, str2)` → `Float [0..1]`

**Finalité** : Calculer un indice de similarité entre deux chaînes pour décider si une ligne a été *modifiée* (et mérite une colorisation DraftSurge intra-ligne) ou si elle a été *remplacée totalement* (deux lignes indépendantes).

**Algorithme** :
- Extrait les tokens (mots/identifiants) via la RegEx `/[a-zA-Z0-9\-_]+/g`.
- Calcule l'indice de **Jaccard** : `intersection.size / Math.max(s1.size, s2.size)`.
- Cas spéciaux : Si les deux ensembles sont vides → retourne `1`. Si l'un est vide → retourne `0`.

**Utilisation** :
- Seuil dans `computeLiveDiff` : Si `similarity >= 0.25` → État 3 (Modification), sinon État 1/2 (Suppression/Insertion pure).

---

## 2. `computeGhostDelta(oldText, newText)` → `Array<{findStr, replaceStr}> | null`

**Finalité** : Extraire chirurgicalement la (ou les) modification(s) entre deux versions complètes d'un texte, pour les exprimer sous forme de requête(s) FIND/REPLACE injectables dans l'historique. C'est le moteur du Mode Cadenas (édition manuelle libre).

**Constantes internes** :
- `GAP_THRESHOLD = 8` : Si deux modifications sont séparées par plus de 8 lignes non modifiées, elles forment deux deltas séparés.
- `CONTEXT_LINES = 2` : Chaque delta intègre 2 lignes de contexte au-dessus et en-dessous pour garantir l'unicité.

**Algorithme selon le cas** :

### Cas A — Nombre de lignes différent
- Déclenche `_buildSingleDelta()` : identifie le premier et le dernier écart entre les deux textes, construit un unique gros bloc FIND/REPLACE couvrant l'ensemble.
- Boucle d'extension du contexte : si le bloc FIND n'est pas unique (`indexOf !== lastIndexOf`), étend le contexte vers le haut ou le bas jusqu'à garantir l'unicité.

### Cas B — Nombre de lignes identique
1. **Identification** : Repère tous les indices de lignes différentes entre `oldText` et `newText`.
2. **Regroupement** : Fusionne les modifications proches (gap ≤ `GAP_THRESHOLD`) en groupes.
3. **Génération** : Pour chaque groupe, construit un `findStr` (lignes `oldText` + contexte) et un `replaceStr` (lignes `newText` + même contexte).
4. **Unicité Garantie** : Boucle d'extension progressive du contexte vers le haut (`expandStart--`) puis vers le bas (`expandEnd++`) si `findStr` apparaît plus d'une fois dans `oldText`.
5. Si plusieurs groupes → **retourne un tableau** de deltas (mode Multistack).

**Retour** : `null` si `oldText === newText`, sinon un tableau d'objets `{ findStr, replaceStr }`.

---

## 3. `computeLiveDiff(str1, str2, splitChars = false)` → `{ marksT1, marksT2 }`

**Finalité** : Produire les listes de marqueurs CSS pour visualiser les différences entre deux textes (FIND vs REPLACE), utilisées dans la SidebarLeft, la SidebarRight, et le SmartDebugger.

**Coupe-circuit de Sécurité (Anti-Freeze)** :
- Si `str1` ou `str2` dépasse **`DIFF_MAX_CHARS = 5000`**, le calcul LCS intra-ligne est abandonné.
- Dans ce cas, les marqueurs produits sont simples et grossiers (`hl-line-mod`, `hl-ins`), sans analyse au caractère.

**Algorithme en 3 passes (DraftSurge)** :

### Passe 1 — LCS des Lignes
- Compare ligne-par-ligne (en ignorant les espaces de début avec `trimStart()`).
- Algorithme de Programmation Dynamique (DP Table) pour trouver la Longest Common Subsequence.
- Produit une table d'alignements : quelles lignes sont communes, lesquelles ont été ajoutées/supprimées.

### Passe 2 — Analyse des Écarts (Similarité Sémantique)
- Pour chaque bloc de lignes désalignées entre `str1` et `str2`, tente d'apparier les lignes modifiées.
- Utilise `getSimilarity()` : Si `sim >= 0.25` → marque comme "Modifiée" (État 3).
- Les lignes sans pair avec similarité < seuil → "Supprimée" (État 1, T1) ou "Insérée" (État 2, T2).

### Passe 3 — Intra-Ligne LCS (`getIntraMarks`)
- Pour chaque paire de lignes "Modifiées", effectue un LCS au niveau des **tokens** (ou au **caractère** si `splitChars = true`).
- Produit des marqueurs très localisés : `hl-word-mod` (mots modifiés), `hl-del-txt` (supprimé), `hl-ins` (inséré).
- Un `trimBg` intelligent limite le fond coloré aux seules zones réellement modifiées.

**Mode `splitChars` (Moteur Strict)** :
- Si `true`, le LCS descend jusqu'au caractère individuel (très précis, légèrement plus lent).
- Si `false` (par défaut), le LCS opère sur les "tokens" (mots), ce qui est plus rapide et plus lisible visuellement.

---

## 4. `computeSearchHeatmap(sourceText, searchStr, ignoreSpaces = false)` → `{ marks, foundRatio }`

**Finalité** : Moteur de recherche floue DraftSearch (Fuzzy Search) produisant une Lightmap/Heatmap DraftSearch de correspondance. Utilisé par la barre de recherche globale (CodeEditor), la SidebarLeft, et le SmartDebugger.

**Mode SMART (`ignoreSpaces = true`)** :
- Convertit `searchStr` en un pattern `Regex` ignorant les espaces superflus et la casse.
- Les occurrences trouvées ont toutes `foundRatio = 1.0` et la classe `hl-yellow`.

**Mode Standard — Recherche Dichotomique** :
- Effectue une **recherche binaire** pour trouver la plus longue sous-chaîne de `searchStr` présente dans `sourceText`.
  - Itère de longueur = 100% jusqu'à trouver une occurrence.
  - Calcule `foundRatio = longueurTrouvée / longueur searchStr`.
- **Classes CSS selon le ratio** :

| Ratio | Classe CSS | Couleur |
|---|---|---|
| 100% | `hl-yellow` | Jaune vif |
| ≥ 80% | `hl-find-80` | Jaune/Or |
| ≥ 50% | `hl-find-50` | Orange |
| < 50% | `hl-find-10` | Rouge |

- Retourne **toutes les occurrences** de la `bestSub` trouvée (pas seulement la première), permettant la navigation entre plusieurs résultats.

**Limites de Sécurité** :
- Cette fonction n'est **pas** responsable des limites d'escape hatch. C'est à l'appelant (CodeEditor, SmartDebugger) de vérifier `isEscapeHatchActive` avant de l'invoquer.
- Le coût est `O(M * log(M))` où M = longueur de `searchStr`. Acceptable pour des recherches jusqu'à ~2000 caractères sur des textes volumineux.
