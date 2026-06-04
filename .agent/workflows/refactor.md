---
description: Restructurer un composant React ou extraire de la logique sans casser l'interface
---

# /refactor — Restructuration React

## Quand utiliser
- Le fichier `App.jsx` ou une Page dépasse 300 lignes.
- Un composant contient trop de `useState` ou de `useEffect` (logique métier mélangée au JSX).
- Un état (State) a besoin d'être remonté plus haut (Lifting State Up) ou descendu plus bas.
- Le prop-drilling (passer une prop sur 5 niveaux) devient insoutenable.

## Principe fondamental
> **Le refactoring change la STRUCTURE de l'arbre React, pas son RENDU VISUEL ni son comportement.**
> L'utilisateur ne doit voir aucune différence à l'écran après le refactor.

## Étapes

### 1. Justifier le refactoring
Expliquer POURQUOI on restructure :
- "Ce composant est trop difficile à lire."
- "On a besoin d'isoler cette logique pour la réutiliser ailleurs."
- L'utilisateur doit approuver.

### 2. S'assurer que le code marche (Tests ou Manuellement)
Avant de tout casser, lancer le serveur de développement.
Vérifier manuellement dans le navigateur (ou via `npm run test`) que la page ciblée s'affiche et fonctionne sans erreur dans la console.

### 3. Proposer le plan de refactoring
Montrer un plan clair des déplacements de code :

```
🔄 Plan de refactoring React

Problème : `<DashboardPage>` contient toute la logique de fetch et fait 400 lignes.

Action 1 : Extraction UI
  - Créer `src/components/layout/Sidebar.jsx`
  - Créer `src/components/layout/Header.jsx`

Action 2 : Extraction Logique (Custom Hook)
  - Extraire les 3 `useEffect` vers `src/hooks/useDashboardData.js`

Résultat attendu :
  `<DashboardPage>` ne fera plus que 50 lignes, très lisible.
  L'affichage navigateur restera 100% identique.
```

### 4. Obtenir validation du plan
L'utilisateur DOIT approuver le plan.

### 5. Exécuter le refactoring (Pas à pas)
- Créer les nouveaux fichiers.
- Déplacer le JSX ou les Hooks.
- **Règle vitale** : Adapter les Imports. C'est l'erreur numéro 1 lors d'un refactor React.

### 6. Vérification finale
- Vérifier que Vite recompile bien (pas d'imports cassés).
- L'utilisateur regarde le rendu dans le navigateur. Si ça clignote, si un state est perdu : le refactoring a échoué, on corrige.

### 7. Mise à jour de la documentation
- `docs/ARCHITECTURE.md` : Mettre à jour l'arbre des composants si une structure majeure a changé.
- `docs/CHANGELOG.md` : Ajouter `REFACTOR : Extraction de...`.

## Types de refactoring React courants

| Type | Description |
|---|---|
| **Extraction de Sous-composant** | Découper un gros morceau de JSX (`<div className="...">...</div>`) dans son propre fichier. |
| **Création de Custom Hook** | Prendre tout ce qui ne retourne pas de JSX (`useState`, `useEffect`) et le mettre dans un `useSomething.js`. |
| **Contextualisation** | Remplacer une prop passée 4 fois en cascade par un `<MonContext.Provider>`. |
| **Extraction de Composant Idiot (Dumb)**| Retirer tout le state d'un composant pour qu'il n'accepte plus que des props (rendu pur). |

## ✅ Checklist de sortie
- [ ] Le navigateur affiche la page exactement comme avant ?
- [ ] La console du navigateur est libre d'erreurs ou de warnings React ?
- [ ] Les imports ont été correctement corrigés ?
- [ ] L'`ARCHITECTURE.md` a été mise à jour si la structure a changé ?
