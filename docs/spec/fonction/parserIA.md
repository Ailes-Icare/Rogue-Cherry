# Spécifications : Moteur de Parsing IA (`textParser.js`)

**Fichier source** : `src/utils/textParser.js` (183 lignes)

Le `textParser.js` lit, découpe et interprète les textes bruts générés par un LLM et collés par l'utilisateur. Il expose deux fonctions exportées et une constante de configuration.

---

## 0. `DEFAULT_SYNTAX` — Configuration par Défaut

```js
export const DEFAULT_SYNTAX = {
  START: "##SYNTAX_COPIE##",
  FIND: "##FIND##",
  REPLACE: "##REPLACE##",
  END: "##END_COPIE##"
};
```

Cette configuration peut être remplacée par une configuration personnalisée (via la SettingsModal) ou overridée temporairement par le mode furtif `[REQMODIFIER]`.

---

## 1. `splitMultistackRequest(rawInput)` → `string[]`

**Finalité** : Permettre à l'IA d'envoyer plusieurs modifications indépendantes dans un seul bloc de texte via la balise Multistack.

**Algorithme** :
1. Normalise le texte (CRLF → LF via `normalizeText`).
2. Si le marqueur `##[MULTISTACK REQUEST]##` est détecté :
   - Découpe le flux via une Regex insensible à la casse : `/##\[MULTISTACK REQUEST\]##/gi`.
   - Chaque fragment est nettoyé (`trim()`) et filtré si vide.
   - Retourne un tableau de chaînes, chacune représentant une requête indépendante.
3. Si le marqueur est absent → retourne `[rawInput]` (tableau d'un seul élément).

**Note** : Cette fonction ne valide pas syntaxiquement les requêtes. Elle découpe seulement. La validation est effectuée par `parseSyntaxRequest` sur chaque fragment.

---

## 2. `parseSyntaxRequest(rawInput, customSyntax = DEFAULT_SYNTAX)` → `Object`

**Finalité** : Extraire tous les attributs utiles d'une requête IA unique. C'est la fonction la plus critique de l'application — son résultat détermine si Rogue Cherry peut traiter une modification ou doit ouvrir le SmartDebugger.

### A. Mode Furtif (`[REQMODIFIER]`) — Traitement Prioritaire

**Condition** : La première ligne du texte est EXACTEMENT `[REQMODIFIER]` (comparaison `=== "[REQMODIFIER]"` après `trim()`).

**Comportement** :
- Les **4 lignes suivantes** définissent les nouvelles balises : `START`, `FIND`, `REPLACE`, `END`.
- Ces balises remplacent la `customSyntax` pour le traitement de cette requête uniquement.
- Les 5 premières lignes (`[REQMODIFIER]` + 4 balises) sont **supprimées** du texte avant l'analyse via `lines.slice(5).join('\n')`.
- Permet à l'IA de modifier les propres fichiers de consignes de Rogue Cherry (DAT, prompts) sans collision avec les balises standard.

### B. Détection Rapide

Si `syntax.START` n'est pas trouvé dans le texte → `{ isSyntax: false }` (court-circuit immédiat, le texte n'est pas une requête Rogue Cherry).

### C. Extraction du LABEL (Avant Validation)

```js
const labelMatch = text.match(/\[LABEL:([^\]]+)\]/i);
```
Le label est extrait **avant même** la vérification de structure. Cela permet à l'interface d'afficher un nom d'erreur pertinent (ex: "Erreur dans 'Refactor loginForm'") si la requête est structurellement invalide.

### D. Validation Structurelle

Chaque balise (`START`, `FIND`, `REPLACE`, `END`) doit apparaître **exactement une fois** dans le texte.

Si ce n'est pas le cas → `{ isSyntax: true, isValid: false, error: "...", label }` est retourné.

### E. Extraction par Regex Principale

```js
const regexStr = `^[\s\S]*?${sStart}([\s\S]*?)[ \t]*${sFind}[ \t]*\n([\s\S]*?)\n[ \t]*${sReplace}[ \t]*\n([\s\S]*?)\n[ \t]*${sEnd}[\s\S]*$`;
```

Cette Regex tolère les espaces et tabulations en fin de ligne des balises, mais exige des retours à la ligne stricts entre les blocs FIND et REPLACE. Si ce dernier match échoue malgré la présence des balises → `isValid: false, error: "Structure interne incorrecte"`.

### F. Paramètres d'En-Tête Extraits

#### `[LABEL:xxx]` (Optionnel)
Identifiant court affiché dans l'historique. Si absent → l'historique affichera "User Input X".

#### `[MULTI:...]` (Optionnel)
Format reconnu via la Regex : `/\[MULTI:(TRUE|FALSE|NO\s+[\d\s,.-]+|[\d\s,.-]+)\]/i`

| Valeur | Comportement |
|---|---|
| `TRUE` | `multiMode = true`, toutes les occurrences |
| `FALSE` | `multiMode = false`, première occurrence seulement |
| `0,2,5` | Cherry-Picking. `multiIndices = [0, 2, 5]` **(BASE-0)** |
| `NO 1,3` | Cherry-Picking Inversé. `multiExclude = true`, `multiIndices = [1, 3]` (remplace TOUT sauf ces indices) |

Les indices sont séparables par virgule, point ou tiret. Les valeurs invalides (`NaN` ou `< 0`) sont filtrées.

#### `[SMART:TRUE]` (Optionnel)
Active le mode de correspondance floue dans `applyDeltaOnText` (insensible à la casse, tolérant aux espaces).

#### `##Commentaire##` ou `@@Commentaire@@` (Optionnel)
```js
/(?:##|@@)Commentaire(?:##|@@)?[ \t]*([\s\S]*)$/i
```
Capture tout le texte après ce tag jusqu'à la balise `FIND`. Texte multi-lignes possible. Stocké dans `comment` dans l'enregistrement d'historique.

---

## 3. Objet de Retour de `parseSyntaxRequest`

### Cas — Pas une requête Rogue Cherry
```js
{ isSyntax: false }
```

### Cas — Requête invalide (structure incorrecte)
```js
{
  isSyntax: true,
  isValid: false,
  error: "Message d'erreur",
  syntaxUsed: { START, FIND, REPLACE, END },
  label: "NomExtrait | null",
  rawText: "texte original"
}
```

### Cas — Requête valide
```js
{
  isSyntax: true,
  isValid: true,
  syntaxUsed: { START, FIND, REPLACE, END },
  findText: "texte à chercher",
  replaceText: "texte de remplacement",
  multiMode: true | false,
  multiIndices: [0, 2, 5], // BASE-0
  multiExclude: false | true, // Si [MULTI:NO ...]
  smartMode: false | true,
  label: "NomExtrait | null",
  comment: "Texte du commentaire | null",
  rawText: "texte original"
}
```

---

## 4. Règle Critique — Base-0 des Index Multi

> **⚠️ RÈGLE ABSOLUE NON NÉGOCIABLE** : Les indices du Cherry-Picking sont en **BASE-0**.
> - `[MULTI:0,2]` = 1ère et 3ème occurrences.
> - Le prompt IA généré par Rogue Cherry DOIT explicitement rappeler cette convention à l'IA.
> - Tout code manipulant ces indices (Audit IA, affichage dans SidebarLeft) DOIT soustraire ou ajouter `1` selon le contexte d'affichage (affichage humain = Base-1, traitement = Base-0).
