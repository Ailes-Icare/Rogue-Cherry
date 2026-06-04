---
description: Analyser les erreurs systémiques React et trouver des failles dans le kit
---

# /post-mortem — Analyse systémique Frontend

## Quand utiliser
- L'application web a souffert d'un crash majeur (boucle infinie en prod, écran blanc silencieux, data corruption dans le State).
- Les mêmes types de bugs UI reviennent (les props se perdent, les formulaires ne se valident pas).
- On a le sentiment que "le projet est mal monté".

## Volet A — Conception Frontend (Application)

### A1. Cartographier le désastre
- Quel est l'état global qui a explosé ? (Context, Zustand, Props ?)
- Quel était le flux réseau asynchrone ? (Fetch API -> setState -> re-render -> bug).

### A2. Chercher les erreurs de conception Web
- **Single Source of Truth** : Y a-t-il deux états qui gardent la trace de la même chose (ex: `userToken` dans le localStorage ET dans un `useState` qui se désynchronisent) ?
- **Gestion des Erreurs (Error Boundaries)** : Une petite erreur dans une `<Card>` a-t-elle fait exploser toute la page entière ? (Manque d'Error Boundaries).

### A3. Rapport et Actions
Proposer une restructuration globale : "Passer à React Query pour éviter les conflits d'états asynchrones", ou "Implémenter Zod pour valider toutes les APIs".

## Volet B — Audit du kit SDD

### B1. Le kit nous a-t-il protégé ?
- Si un bug lié aux *Stale Closures* a persisté malgré l'usage de `/debug`, c'est que `/debug` est mal formulé.
- Si le design de l'app est parti en vrille (pas responsive), est-ce que `/spec` oblige vraiment l'utilisateur à définir le layout Mobile ?

### B2. Ancrer les leçons
- Modifier les Workflows, Rules, ou ajouter un Skill spécifique pour que cette catastrophe React ne se reproduise plus jamais (via `/kit`).

## ✅ Checklist de sortie
- [ ] Cause profonde architecturale (React/State) identifiée ?
- [ ] Leçons extraites et injectées dans les règles SDD ?
