# Méthodologie SDD — Spec-Driven Development

> Ces règles définissent le cycle de vie du développement piloté par les spécifications.

## Principe central

> **Les spécifications sont la source de vérité. Le code est un produit dérivé des specs.**

```
SPECS.md (la vérité) → Code React (l'implémentation) → Tests (la preuve)
```

Jamais l'inverse. Si le rendu ou le comportement du composant fait quelque chose de non spécifié, c'est un bug. Si les specs disent quelque chose que le code ne fait pas, c'est un bug.

## Cycle de développement SDD

Chaque feature (page, composant, flux) suit ce cycle obligatoire :

```
1. SPEC    → Rédiger/modifier les specs (UI/UX, État, Logique) dans SPECS.md
2. VALIDER → L'utilisateur valide les specs
3. PLAN    → L'IA propose un plan d'implémentation minimal (Composants à créer/modifier)
4. VALIDER → L'utilisateur valide le plan
5. CODER   → L'IA implémente (JSX, Tailwind, Hooks) selon le plan validé
6. TESTER  → Vérifier que l'interface correspond (rendu, réactivité, responsive)
7. METTRE À JOUR → Changelog, architecture React si nécessaire
```

**Raccourci autorisé** : Pour les changements triviaux (fix de padding Tailwind, ajuster une couleur, corriger une coquille), les étapes 1-4 peuvent être condensées en une seule validation rapide.

## Structure des specs (SPECS.md)

> [!NOTE] 
> **Note :** Les spécifications intègrent explicitement le rendu visuel (UI/UX) et la gestion de l'état (State), qui sont les cœurs du développement frontend interactif.

Les specs utilisent un format simple en français :

```markdown
## [Nom de la feature / Composant]

**Statut** : 🔴 Non implémenté / 🟡 En cours / 🟢 Implémenté / 🔧 À modifier

**Description** : Ce que fait la feature, à quoi elle sert, en français simple.

**Design & UI/UX** :
- Aspect visuel global (couleurs, layout Flexbox/Grid)
- États interactifs obligatoires (Hover, Focus, Active, Disabled)
- Comportement Responsive (Mobile, Tablette, Desktop)

**Gestion d'état (State & Props)** :
- Quelles données locales (`useState`) ou globales (`Context`) déclenchent un re-rendu ?
- Props attendues par le composant.
- Variables de contrôle (ex: `isLoading`, `hasError`, `isOpen`).

**Comportement attendu** :
- Quand l'utilisateur clique sur [Bouton], alors [Action / Appel API / Changement d'état]
- Si `isLoading` est vrai, alors afficher [Skeleton / Spinner] au lieu du contenu
- Si une erreur API survient, alors afficher [Message d'erreur]

**Limites** : Ce que le composant ne gère PAS (ex: la pagination n'est pas gérée ici).

**Dépendances** : Composants parents ou enfants liés, Custom Hooks utilisés.

**Critères de validation** :
- [ ] L'affichage est correct sur mobile
- [ ] Le clic sur le bouton déclenche bien la fonction avec les bons paramètres
- [ ] L'état de chargement est visible pendant la requête
```

## Règles de gestion des specs

1. **Une feature = une section de specs.** Pas de composants magiques non documentés dans le code.
2. **Le statut doit être honnête.** 🟢 = 100% fonctionnel (rendu UI exact et comportement validé). Pas "presque fini".
3. **Les specs sont versionnées** dans le changelog quand le design ou la logique change.
4. **Granularité** : Une feature (ou un composant parent) doit être assez petite pour être implémentée en une session. Si l'interface est trop complexe, découper en sous-composants spécifiés.

## Audits de cohérence

Un audit compare le rendu et le code réel (l'arborescence des composants) aux specs. Il doit être lancé :
- **Obligatoirement** : Avant de commencer une nouvelle vue complexe
- **Recommandé** : Après chaque session de dev significative
- **Sur demande** : Quand l'utilisateur a un doute

Format du rapport d'audit :
```text
✅ [Composant/Page] — Implémenté et conforme aux specs UI/UX
⚠️ [Composant/Page] — Partiellement implémenté (manque des états de chargement, par ex)
❌ [Composant/Page] — Non implémenté ou design non conforme (détails)
🔄 [Composant/Page] — Implémenté mais specs obsolètes (mise à jour nécessaire)
```

## Gestion des bugs UI/Logique

1. **Identifier** : Quel affichage ou comportement diffère des specs ?
2. **Localiser** : Trouver le composant ou le hook responsable (React DevTools mental).
3. **Proposer** : Montrer la correction JSX/Tailwind/State minimale à l'utilisateur.
4. **Valider** : L'utilisateur approuve le fix.
5. **Corriger** : Appliquer le changement minimal.
6. **Vérifier** : Confirmer que le bug est corrigé ET que l'interface globale n'est pas cassée ailleurs.
