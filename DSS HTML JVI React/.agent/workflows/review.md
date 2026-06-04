---
description: Review de code React après implémentation
---

# /review — Review de code React

## Quand utiliser
- Après une implémentation (`/implement`) ou avant de finaliser une grosse Pull Request.

## Étapes

### 1. Identifier le scope
Quel(s) composant(s) ou hook(s) vérifier ?

### 2. Checklist de review Frontend
Pour chaque fichier JSX/JS reviewé, vérifier l'exigence Senior Frontend :

**Architecture React**
- [ ] **Taille** : Le composant dépasse-t-il 150 lignes de JSX ? (Si oui, extraire des sous-composants).
- [ ] **State** : Le state est-il le plus bas possible ? (Pas de state global inutile).
- [ ] **Prop-Drilling** : Passe-t-on une prop à travers plus de 3 niveaux d'enfants ? (Si oui, utiliser la composition `children` ou Context).
- [ ] **Hooks** : Les `useEffect` ont-ils un tableau de dépendances exact ? (Risque de boucle).

**Qualité UI (Tailwind)**
- [ ] Pas de styles CSS inline (`style={{...}}`).
- [ ] Utilisation logique des classes utilitaires (pas de `margin-top: 54px` en dur, privilégier l'échelle de design Tailwind).

**Performance (Render)**
- [ ] Des calculs lourds sont-ils refaits à chaque rendu ? (Besoin de `useMemo`).
- [ ] Des fonctions sont-elles passées à des enfants memoizés sans `useCallback` ?

### 3. Rapport de review

```markdown
# 📝 Review React — [Composant]

## Résumé
[Vue d'ensemble]

## Problèmes trouvés ⚠️
1. **[Fichier:ligne]** — [Problème de re-render ou architecture]
   - Suggestion : Extraire dans un Custom Hook.
   - Sévérité : 🔴 Bloquant / 🟡 Important / 🔵 Mineur
```

### 4. Discussion
- Expliquer chaque problème trouvé. L'utilisateur décide quoi corriger.

## ✅ Checklist de sortie
- [ ] Chaque critère de la checklist qualité React a été vérifié ?
- [ ] Les suggestions sont classées par priorité ?
- [ ] Rapport lu par l'utilisateur ?
