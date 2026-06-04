---
description: Initialiser un nouveau projet React avec la méthodologie SDD
---

# /new-project — Scaffolding React SDD

## Prérequis
- Node.js et npm installés.
- L'utilisateur a une idée du type d'application (Dashboard, E-commerce, SPA).

## Étapes

### 1. Demander les informations de base
- **Nom du projet** (ex: "admin-dashboard", pas d'espaces).
- **Description courte** (1-2 phrases).
- **Framework souhaité** : Vite (React pur) ou Next.js (SSR / SEO) ?

### 2. Scaffolding du Framework
Exécuter la commande officielle de création dans le terminal.
Exemple pour Vite :
```powershell
npx create-vite@latest [nom-du-projet] --template react
```

### 3. Installation des dépendances essentielles
S'installer dans le dossier et ajouter les piliers du Frontend moderne :
```powershell
cd [nom-du-projet]
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```
*(L'IA doit configurer `tailwind.config.js` et `index.css`)*.

### 4. Copier le kit SDD
Copier les dossiers `.gemini/` et `.agent/` depuis le `base_code` vers le nouveau dossier pour injecter l'âme du framework.

### 5. Scaffolding SDD (Dossiers)
Créer l'arborescence Frontend attendue par les workflows :
```
src/
  ├── components/
  │     └── ui/ (composants réutilisables, boutons, cards)
  ├── features/ (découpage métier)
  ├── hooks/
  └── utils/
docs/
  ├── ARCHITECTURE.md
  ├── SPECS.md
  ├── CHANGELOG.md
  └── DECISIONS.md
```

### 6. Rédiger l'architecture initiale
Dans `docs/ARCHITECTURE.md`, documenter la stack (ex: React 19, Tailwind, Zustand) et expliquer pourquoi.

### 7. Initialiser git
```powershell
git init
git add .
git commit -m "init: création du projet React [NOM] avec kit SDD"
```

### 8. Confirmation
L'IA informe l'utilisateur que l'environnement est prêt et l'invite à lancer `/plan` ou `/spec` pour concevoir sa première page.

## ✅ Checklist de sortie
- [ ] Application React instanciée (Vite/Next) ?
- [ ] Tailwind CSS configuré et prêt à l'emploi ?
- [ ] Dossiers de documentation (`docs/`) et architecture React (`src/hooks`, `src/features`) créés ?
- [ ] Kit IA copié ?
