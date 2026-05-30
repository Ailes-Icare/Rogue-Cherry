# Spécifications : Recherche Globale (`GlobalSearch`)

**Contexte** : Bandeau supérieur de l'éditeur principal, intégré à `App.jsx` / `CodeEditor.jsx`.

La recherche globale est un outil de navigation rapide indépendant de la pile d'historique. Elle intègre le même moteur de heatmap que le SmartDebugger.

---

## 1. Fonctionnement Visuel (Bandeau Supérieur)

### 1.1 Input Extensible
- La zone de texte est **multiligne et auto-redimensionnable** verticalement.
- Elle grandit dynamiquement au fur et à mesure de la saisie jusqu'à un **maximum de 25% de la hauteur de l'écran** (`maxSearchHeight = window.innerHeight * 0.25`).
- Au-delà de cette limite, une barre de défilement interne et une **gouttière de numérotation de ligne** apparaissent (même design que l'éditeur principal).

### 1.2 Bouton Smart (Toggle)
- Situé à gauche du champ texte.
- N'apparaît que si le champ **n'est pas vide**.
- Bascule entre : **Recherche Stricte** (dichotomie sur sous-chaîne) et **Recherche Floue** (Regex insensible à la casse/espaces).

### 1.3 Label de Similitude
- Affiche en temps réel le **pourcentage de correspondance** de la meilleure occurrence trouvée.
- La couleur du label suit la Heatmap CSS :
  - 100% → `hl-yellow` (Jaune vif)
  - ≥ 80% → `hl-find-80` (Or)
  - ≥ 50% → `hl-find-50` (Orange)
  - < 50% → `hl-find-10` (Rouge)

### 1.4 Navigation entre Occurrences (x / y)
- Si plusieurs occurrences à 100% sont trouvées, le label `1 / 15` apparaît.
- **Flèches directionnelles** (▲ et ▼) permettent de naviguer entre elles.
- Un **clic sur le ratio textuel** ouvre la `LineChoiceModal` en Mode Occurrences (voir `Autres.md`), fixée au-dessus des boutons de navigation.

### 1.5 Bouton Couper/Supprimer
- S'affiche uniquement si la similitude est à **100%**.
- Copie le texte du champ dans le presse-papier **et** vide instantanément le champ, refermant visuellement la recherche.

---

## 2. Intégration dans le CodeEditor (Injection de Marques)

La recherche globale injecte `globalSearchMarks` dans `CodeEditor.jsx` :

- **Heatmap Caractère** : Les correspondances colorent le texte (fond `hl-yellow`, `hl-find-80`, `hl-find-50`, `hl-find-10`).
- **Heatmap Ligne (Background)** : L'arrière-plan de la ligne contenant l'occurrence est subtilement teinté.
- **Gouttière** : `●` (occurrence) ou `▶` (occurrence active en cours de navigation) s'affichent dans la colonne des numéros de ligne.

---

## 3. Comportements Conditionnels

### 3.1 Masquage Différé
- Si l'utilisateur efface le texte, les éléments secondaires (Bouton Smart, Label Similitude) ne disparaissent **pas immédiatement**.
- Un **timer de 30 secondes** maintient l'état pour permettre une re-saisie ou un recollage.

### 3.2 Modale de Navigation
- Clic sur le label `x / y` → Ouvre `LineChoiceModal` en **Mode Occurrences**.
- La modale reçoit `linesArray` = tableau des lignes absolues de toutes les occurrences trouvées.

### 3.3 Suspension de Saisie (Timeout)
- Lors de la saisie dans la `LineChoiceModal`, le saut effectif est suspendu tant que le champ conserve le focus (voir la spec `LineChoiceModal` dans `Autres.md`).

### 3.4 Désactivation Mutuelle avec la SidebarLeft
- Si une recherche globale est en cours, la **zone FIND de la SidebarLeft est grisée** et désactivée.
- Cela évite des collisions de marqueurs entre les deux systèmes de recherche.

### 3.5 Échappement de Sécurité (Escape Hatch)
- Partage les mêmes `searchLimits` (`maxLines`, `minChars`) que le SmartDebugger et la SidebarLeft.
- Si le document dépasse `maxLines` et que la recherche est inférieure à `minChars` caractères → alerte bloquante.

---

## 4. Règle de Priorité

La recherche globale est **prioritaire sur toutes les autres recherches** : quand elle est active, les marques du Find Dynamique de la SidebarLeft sont supprimées de la vue du CodeEditor (les deux systèmes ne coexistent pas visuellement).
