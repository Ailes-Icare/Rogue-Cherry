---
description: Vérifier la cohérence de l'arbre entier de composants et des dépendances globales
---

# /integrate-all — Intégration globale de l'App

## Quand utiliser
- Après un refactoring massif touchant le dossier `src/` complet.
- Quand le projet Vite ou Next refuse de démarrer (écran blanc de la mort).

## Étapes

### 1. Analyse globale de l'arbre (`App.jsx` / `main.jsx`)
C'est le sommet de l'application Web. Vérifier l'ordre des emballages (Providers). 
Un mauvais ordre fait planter l'App :
```jsx
// BON ORDRE
<Router>
  <ThemeProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </ThemeProvider>
</Router>
```

### 2. Le balayage des Imports brisés
- Lancer un scan pour trouver les fichiers qui importent des composants supprimés ou renommés.
- Les systèmes de fichiers Windows/Linux gèrent la casse différemment (`Button.jsx` vs `button.jsx`), vérifier que les imports respectent la casse exacte.

### 3. La cohérence des State Managers
- Y a-t-il un mélange chaotique entre Zustand, Redux, et React Context ? Proposer de normaliser.

## ✅ Checklist de sortie
- [ ] L'arbre global des `Provider` est logique et stable ?
- [ ] Aucun import cassé sur l'ensemble de l'application ?
