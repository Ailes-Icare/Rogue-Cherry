---
description: Planification stratégique d'un projet Web / React avant de commencer le développement
---

# /plan — Planification stratégique

## Quand utiliser
- **Au tout début** d'un nouveau projet, AVANT `/new-project`
- Quand on veut **repenser la stratégie** d'un projet web existant
- Quand une application (SaaS, E-commerce, Dashboard) devient trop grosse et qu'on ne sait pas par où commencer

## Ce que ce workflow produit
Un document `docs/PLAN.md` qui contient la vision complète du produit web.

## Étapes

### 1. Comprendre la vision
Poser à l'utilisateur ces questions fondamentales :
- **Qu'est-ce que cette application fait ?** (en 1-2 phrases simples)
- **Quel est le public cible ?** (Visiteurs publics, Utilisateurs connectés, Administrateurs)
- **Quel est le focus principal ?** (Conversion E-commerce, Visualisation de données Dashboard, Application métier)
- **À quoi ça ressemble quand c'est fini ?** (Design premium, brutaliste, minimaliste ?)

### 2. Analyser les besoins globaux
Transformer la vision en liste de **besoins concrets** :

```markdown
## Besoins identifiés

### Besoins essentiels (v1.0 — MVP)
1. [Authentification] — [Sans ça on ne peut pas lier les données à l'utilisateur]
2. [Visualisation des métriques] — [Le dashboard central avec Recharts/D3.js]

### Besoins importants (v1.1 — améliorent l'expérience)
3. [Mode Sombre (Dark Theme)]
4. [Filtres de date avancés]

### Besoins souhaitables (v2.0)
5. [Notifications en temps réel via WebSockets]
```

Faire valider cette priorisation par l'utilisateur.

### 3. Découper en Domaines (Feature Slices)
Regrouper les besoins en **features logiques** (qui deviendront les dossiers dans `src/features/`) :

```markdown
## Domaines du projet

### Feature 1 : Auth
- Responsabilité : Connexion, Inscription, Session
- Besoins couverts : B1
- Dépendances : aucune

### Feature 2 : Dashboard
- Responsabilité : Affichage des graphiques, widgets, KPI
- Besoins couverts : B2, B4
- Dépendances : Auth (l'utilisateur doit être connecté)
```

### 4. Choix techniques Frontend
Proposer et justifier chaque choix technique :

```markdown
## Choix techniques

| Couche | Options envisagées | Décision | Justification |
|---|---|---|---|
| Framework | Vite + React, Next.js | Vite + React | Application type Dashboard (SPA), pas de besoin SEO critique |
| Styling | TailwindCSS, CSS Modules | TailwindCSS | Vitesse de dev, système de design cohérent |
| State Global | Context API, Zustand | Zustand | Meilleures perfs sur les re-renders pour un Dashboard |
| Graphiques | Recharts, D3.js | Recharts | Composants React natifs prêts à l'emploi |
```

Chaque choix doit être **validé par l'utilisateur**.
**Chaque choix validé doit être enregistré dans `docs/DECISIONS.md`.**

### 4b. Identifier les données de domaine et le Design System
Lister les constantes qui ne doivent JAMAIS être codées en dur :
- **Design Tokens** : Couleurs principales, tailles de typo (à mettre dans `tailwind.config.js`).
- **Constantes API** : URL de base, endpoints.
Créer les fichiers correspondants dans `docs/reference/`.

### 5. Analyser les risques
Identifier ce qui pourrait casser l'expérience web :

```markdown
## Risques identifiés

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| Bundle JS trop lourd | Moyenne | Site lent à charger | Implémenter le Lazy Loading (`React.lazy`) sur les routes |
| API trop lente | Haute | UI figée | Skeleton Loaders, React Query pour le cache |
| Formulaires complexes | Moyenne | Bugs de validation | Utiliser React Hook Form + Zod |
```

### 6. Définir la roadmap
Planifier l'ordre de développement de manière itérative :

```markdown
## Roadmap

### Phase 1 — Fondations (semaine 1)
- [ ] Setup Vite + Tailwind + Design System de base
- [ ] Feature : Auth (Mockée d'abord)

### Phase 2 — Noyau (semaine 2)
- [ ] Feature : Dashboard (Intégration UI avec fausses données)
- [ ] Composants UI partagés (Cards, Graphiques, Tables)

### Phase 3 — Intégration (semaine 3)
- [ ] Connexion réelle à l'API
- [ ] Gestion des états de chargement (Skeletons) et d'erreurs
```

### 7. Rédiger le PLAN.md
Assembler toutes les sections ci-dessus dans un seul document `docs/PLAN.md`.
Faire valider le plan complet par l'utilisateur.

### 8. Transition vers /new-project
Une fois le plan validé :
- Lancer `/new-project` pour initier l'application React.
- Les domaines identifiés deviennent les dossiers de `src/features/`.

## Règles
- **Le plan ne remplace pas les specs.** Le plan = vue d'ensemble de l'app. Les specs = détails (hover, inputs) de chaque page.
- Toujours penser **Frontend first** : on raisonne en pages, en composants, et en expérience de chargement.

## ✅ Checklist de sortie (obligatoire avant de conclure)
- [ ] Tous les choix techniques (Vite/Next, Tailwind, State) validés par l'utilisateur ?
- [ ] `docs/DECISIONS.md` mis à jour avec chaque choix technique ?
- [ ] Roadmap définie avec un ordre clair de développement de l'UI ?
- [ ] Plan validé par l'utilisateur dans son ensemble ?
