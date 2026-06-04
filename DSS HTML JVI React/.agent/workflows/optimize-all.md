---
description: Optimisation globale de l'application Web (Performances globales, Bundle)
---

# /optimize-all — Optimisation globale Web

## Quand utiliser
- Avant la mise en production (MVP ou v1.0).
- Le temps de chargement de l'application (TTV - Time To View) est mauvais.

## Étapes

### 1. Analyse du Bundle (Fichiers lourds)
- Analyser les `package.json` et les imports. 
- Y a-t-il des librairies obèses (`moment.js`, `lodash` entier) qui peuvent être remplacées par des alternatives légères (`date-fns`, utilitaires ES6 natifs) ?

### 2. Code-Splitting sur les Routes
- Vérifier le point d'entrée du Routeur (`App.jsx` ou `Router.jsx`).
- Les pages sont-elles toutes importées de manière synchrone ? (Ce qui force l'utilisateur à télécharger tout le site pour voir l'accueil).
- **Solution** : Proposer de passer les pages non-critiques sous `React.lazy()` avec un composant `<Suspense fallback={<Skeleton />}>`.

### 3. Chasse aux ressources mortes
- Y a-t-il des icônes SVG importées mais jamais utilisées ?
- Y a-t-il des classes Tailwind personnalisées dans `tailwind.config.js` qui ne sont plus requises ?

### 4. Proposer le plan de nettoyage
Générer un rapport d'optimisation globale et demander l'accord avant de toucher au code de manière transversale.

## ✅ Checklist de sortie
- [ ] Code-splitting proposé pour les routes majeures ?
- [ ] Librairies obsolètes ou obèses identifiées ?
- [ ] Nettoyage approuvé par l'utilisateur ?
