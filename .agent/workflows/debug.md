---
description: Processus structuré pour traquer et fixer les bugs dans un écosystème React
---

# /debug — Debugging Frontend

## Quand utiliser
- L'interface ne se met pas à jour quand on clique.
- La page "clignote" ou boucle à l'infini (Infinite Re-render).
- Une erreur rouge sang ("React Runtime Error") s'affiche à l'écran.
- Un composant a un comportement imprévisible (State asynchrone / Stale Closure).

## Étapes

### 1. Identifier le symptôme React
Renseigner le comportement inattendu :
- **Console Browser** : Y a-t-il une erreur rouge dans la console Chrome/Firefox ? (Ex: `Warning: Each child in a list should have a unique "key" prop`, `Maximum update depth exceeded`).
- **Visuel** : Qu'est-ce qui devrait s'afficher vs Qu'est-ce qui s'affiche ?

### 2. Hypothèse ciblée (Les 4 cavaliers de l'Apocalypse React)
95% des bugs complexes en React viennent de 4 causes. L'IA doit immédiatement envisager :

1. **Le tableau de dépendances (Dependency Array) corrompu** : Un `useEffect` ou `useMemo` a une variable manquante ou se déclenche trop souvent car on lui passe un objet/fonction qui change de référence à chaque rendu.
2. **La fermeture obsolète (Stale Closure)** : Une fonction (comme un setInterval ou un handler) lit l'ancienne valeur d'un state au lieu de la nouvelle.
3. **Mutation directe de l'état** : Quelqu'un a fait `monTableau.push(x)` au lieu de `setMonTableau([...monTableau, x])`. React ne voit pas le changement, la page ne se met pas à jour.
4. **Condition de course (Race Condition) API** : On charge la page A, puis on clique sur B, la réponse de la page A arrive après et écrase le composant de B.

### 3. Localiser la cause
1. Remonter l'arbre des composants (Mentalement ou via React DevTools).
2. Trouver *qui* est responsable du state incriminé.
3. Analyser le code du Hook ou du render.

### 4. Proposer le fix
Montrer à l'utilisateur :

```
🐛 Bug React identifié : Boucle infinie au chargement de la page.

📍 Cause : `src/components/Dashboard.jsx` ligne 42.
Le `useEffect` appelle `fetchData()` qui appelle `setData()`.
Mais `fetchData` est recréé à chaque render, ce qui re-déclenche le `useEffect` (car fetchData est dans ses dépendances).

🔧 Fix proposé :
  Envelopper la déclaration de `fetchData` dans un `useCallback`, ou sortir la fonction du composant si elle ne dépend d'aucun state.
```

### 5. Valider et appliquer
- L'utilisateur valide.
- Appliquer le changement minimal.
- L'utilisateur vérifie dans son navigateur que le comportement (ou l'erreur console) a disparu.

### 6. Documenter (Post-mortem)
Si c'est un bug vicieux (ex: Hydration Mismatch en Next.js, ou Stale Closure complexe) :
- Ajouter dans `docs/CHANGELOG.md` : `fix: [description]`.
- Envisager d'ajouter une note dans `docs/DECISIONS.md` ou un commentaire dans le code pour expliquer *pourquoi* ce setup bizarre a été fait.

## Règles
- **Jamais de `// @ts-ignore` ou `// eslint-disable-next-line`** pour masquer une erreur de Hook. Si ESLint crie, c'est qu'il y a un vrai bug.
- **Console.log stratégiques** : Pour debugger un problème de re-render, le meilleur ami est de placer un `console.log('Rendering Component X', state)` juste avant le `return` JSX.

## ✅ Checklist de sortie
- [ ] Cause exacte identifiée (Hook, State mutation, Rendu conditionnel) ?
- [ ] Fix appliqué au fichier ciblé ?
- [ ] Confirmation que l'erreur a disparu de la console du navigateur ?
- [ ] `docs/CHANGELOG.md` mis à jour ?
