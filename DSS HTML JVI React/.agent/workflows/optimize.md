---
description: Optimiser un composant React (Performance, Re-renders, Rendu conditionnel)
---

# /optimize — Optimisation ciblée React

## Quand utiliser
- Le composant est lent à réagir ou "clignote".
- L'inspecteur React montre que le composant est re-rendu 15 fois à chaque clic.
- Le fichier JSX est rempli de code copié-collé (Tailwind à rallonge).

## Étapes

### 1. Identifier le scope
Quel composant est lent ou lourd ?

### 2. Passe 1 — La chasse aux Re-renders inutiles
En React, la performance est dictée par les rendus. Chercher :
- **État trop haut** : Un `input` dans une modale force tout le layout à se redessiner.
- **Absence de memoization** : Un tableau trié avec `.sort()` à l'intérieur du composant au lieu d'un `useMemo`.
- **Context cauchemardesque** : Tout le monde écoute le même objet Context global, et tout le monde se met à jour.

### 3. Passe 2 — Rationalisation Tailwind & JSX
- **Classes à rallonge** : Si une carte utilise `flex flex-col p-4 bg-white shadow-md rounded-lg` à 8 endroits différents, proposer de l'extraire en composant `<Card>`.
- **Rendu conditionnel lourd** : Si on masque un très gros composant (comme un chart D3.js) avec CSS (`className="hidden"`), la mémoire est quand même consommée. Optimiser en le retirant du DOM (`{isOpen && <Chart />}`).

### 4. Passe 3 — Code-Splitting (Lazy Loading)
- Si le fichier importe des librairies massives (ex: `three.js`, `echarts`) qui ne sont pas utiles immédiatement, proposer un `React.lazy()` pour réduire le bundle de chargement initial.

### 5. Proposer les changements
Montrer avant/après :

```
📊 Optimisation React : Extraction d'état

AVANT (Re-render de toute la page) :
<Dashboard> gère le `searchQuery` de la barre de recherche. Chaque lettre tapée re-rend les 5 graphiques de la page.

APRÈS :
Création d'un composant isolé `<SearchBar>` qui gère son propre state, puis envoie le résultat final au <Dashboard> via debounce.
```

### 6. Appliquer et vérifier
- Appliquer les changements et vérifier que l'UI reste identique, mais plus rapide.

## ✅ Checklist de sortie
- [ ] Les re-renders inutiles ont été identifiés et corrigés ?
- [ ] Les classes Tailwind dupliquées ont été factorisées ?
- [ ] Aucun changement visuel n'a été introduit sans accord ?
