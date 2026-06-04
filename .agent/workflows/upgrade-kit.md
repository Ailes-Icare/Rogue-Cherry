---
description: Mettre à jour le kit SDD dans un projet React existant
---

# /upgrade-kit — Mise à jour du kit SDD

## Quand utiliser
- Après avoir amélioré le framework React SDD dans le `base_code/` (ex: ajout d'une nouvelle règle d'optimisation Tailwind).
- Quand un de vos anciens projets Web utilise un vieux kit et que l'IA semble oublier les bonnes pratiques récentes.

## Le problème
Le kit SDD vit dans le dossier maître. Quand `/new-project` crée un projet Web, il **copie** le kit. Mais si le kit évolue après la copie, les vieux projets n'en profitent pas.

## Étapes

### 1. Identifier la source et la cible
- **Source** (kit à jour) : Dossier maître.
- **Cible** (projet à mettre à jour) : L'App React actuellement ouverte.

### 2. Comparer les versions
L'IA va lister les `workflows`, `skills` et `rules` présents dans les dossiers `.gemini/` et `.agent/` du projet cible et les comparer avec la source.

```
📋 Différences kit détectées

Source : base_code/ (20 workflows, 8 skills)
Cible  : [projet React] (18 workflows, 7 skills)

Workflows manquants :
  + integrate.md (nouveau système de check Provider React)
  + integrate-all.md

Rules modifiées :
  ~ coding.md (+10 lignes sur les Hooks React 19)
```

### 3. Proposer le plan de mise à jour
Montrer à l'utilisateur ce qui sera copié.

```
🔄 Plan de mise à jour

Fichiers à COPIER :
  .agent/workflows/integrate.md
Fichiers à REMPLACER :
  .gemini/rules/coding.md

Fichiers NON TOUCHÉS :
  src/ (Votre code React reste intact)
  package.json (Vos dépendances npm restent intactes)
```

### 4. Valider et appliquer
Copier les fichiers dans le projet cible après l'accord de l'utilisateur.

### 5. Vérification post-mise à jour
- Les rules sont synchronisées.
- Tous les workflows et skills de qualité React sont présents.
- Le code source (JSX/TSX) n'a subi aucune altération.

## ✅ Checklist de sortie
- [ ] Différences identifiées ?
- [ ] Code et dépendances npm du projet non touchés ?
- [ ] Kit SDD synchronisé ?
