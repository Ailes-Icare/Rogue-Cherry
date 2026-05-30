# Spécifications : Moteur de Versioning (`versionEngine.js`)

**Fichier source** : `src/utils/versionEngine.js` (91 lignes)

Le moteur de versioning manipule programmatiquement les labels de version sous forme d'un tableau de "rangs", permettant des versions aussi bien numériques (`V1.2.0`) qu'alphanumériques (`BETA V2.A.3`).

---

## 1. `DEFAULT_VERSION_CONFIG` — Configuration par Défaut

```js
export const DEFAULT_VERSION_CONFIG = {
  ranks: [
    { type: "fixed",   value: "V", separator: "" },
    { type: "numeric", value: 1,   separator: "" },
    { type: "numeric", value: 0,   separator: "." },
    { type: "numeric", value: 0,   separator: "." }
  ],
  autoIncrementIndex: 3
};
```

### Structure d'un Rang

| Champ | Type | Rôle |
|---|---|---|
| `type` | `'fixed' \| 'numeric' \| 'alpha'` | Nature du rang |
| `value` | `string \| number` | Valeur courante |
| `separator` | `string` | Caractère inséré **avant** ce rang lors du formatage (ex: `"."`) |

La configuration par défaut produit des versions de type **`V1.0.0`** et auto-incrémente le 3ème rang (index 3, Base-0) par défaut lors des modifications IA.

> **Note** : Le `separator` est sur le rang lui-même (pas entre deux rangs), ce qui signifie que le premier rang a toujours `separator: ""`.

---

## 2. `parseVersionStringToRanks(versionStr, configRanks)` → `ranks[]`

**Finalité** : Reconstruire un tableau de rangs avec les valeurs actuelles à partir d'une chaîne de version brute. Utilisé à l'ouverture de la `VersionTagModal` pour afficher les vraies valeurs courantes.

**Algorithme (Parsing Séquentiel)** :
1. Effectue une **deep copy** de `configRanks` via `JSON.parse(JSON.stringify(...))`.
2. Pour chaque rang, dans l'ordre :
   - Consomme le `separator` s'il est présent au début de `str` restant.
   - Consomme la valeur selon le `type` :
     - `fixed` : Vérifie `str.startsWith(r.value)`, consomme `r.value.length` caractères.
     - `numeric` : Regex `/^\d+/`, parse en `parseInt(match[0], 10)`.
     - `alpha` : Regex `/^[A-Za-z]+/`, extrait la chaîne.
3. Met à jour `r.value` dans la copie.

**Exemple** : `parseVersionStringToRanks("V2.1.7", DEFAULT_VERSION_CONFIG.ranks)` → `[{type:"fixed", value:"V"}, {type:"numeric", value:2}, {type:"numeric", value:1}, {type:"numeric", value:7}]`.

---

## 3. `incrementRank(ranks, targetIndex)` → `ranks[]` (Nouvelle copie)

**Finalité** : Produire un nouveau tableau de rangs avec le rang cible incrémenté et les rangs à sa droite remis à zéro (Cascade Reset).

**Algorithme** :
- Effectue une **deep copy** du tableau (immuabilité — ne modifie jamais le tableau original).
- Pour chaque rang :
  - Si `i === targetIndex` → **Incrémente** :
    - `numeric` : `value + 1`
    - `alpha` : `charCodeAt(0) + 1`. Boucle de remise à zéro :
      - Si `code >= 90` (= après `Z`) → repart à 65 (`A`)
      - Si `code >= 122` (= après `z`) → repart à 97 (`a`)
  - Si `i > targetIndex` → **Reset** :
    - `numeric` : `value = 0`
    - `alpha` : `value = isUpperCase ? 'A' : 'a'`
  - Si `i < targetIndex` → **Inchangé**

**Exemple** : `incrementRank([V, 1, 2, 5], 1)` → `[V, 2, 0, 0]` (Cascade Reset des rangs 2 et 3).

---

## 4. `formatVersionString(ranks)` → `string`

**Finalité** : Concatener tous les rangs pour produire la chaîne de version finale.

**Implémentation** :
```js
return ranks.map(r => r.separator + r.value).join('');
```

**Exemples** :
- `[{sep:"", val:"V"}, {sep:"", val:2}, {sep:".", val:1}, {sep:".", val:7}]` → `"V2.1.7"`
- `[{sep:"", val:"BETA"}, {sep:" ", val:"V"}, {sep:"", val:1}, {sep:".", val:0}]` → `"BETA V1.0"` (si un rang `fixed` contient "BETA" et un autre " V")

---

## 5. Point de Vigilance — Incrémentation Alpha

L'incrémentation alpha ne gère **pas** le débordement multi-caractère (ex: `Z → AA`). Après `Z`, le rang boucle directement à `A` (perte d'information). Cette limitation est documentée dans le code : `// Boucle vers A car AA non géré`. À prendre en compte pour les projets dépassant 26 versions alphabétiques sur un rang.
