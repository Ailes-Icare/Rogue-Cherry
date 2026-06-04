# [Nom du Projet]

> _Description courte du projet Web (1-2 phrases)._

**Statut** : 🔴 En cours de spécification / 🟡 En développement / 🟢 En Production

**Type** : _Dashboard / E-commerce / Landing Page / SPA / Autre_

**Stack** : _React (Vite) / Next.js / Tailwind CSS / Zustand_

## Documentation SDD

| Document | Description |
|---|---|
| [Spécifications](docs/SPECS.md) | La source de vérité absolue — UI, UX, Comportement, APIs. |
| [Architecture](docs/ARCHITECTURE.md) | Structure de l'arbre des composants et choix des librairies. |
| [Décisions](docs/DECISIONS.md) | Choix techniques (ex: pourquoi Zustand plutôt que Redux). |
| [Changelog](docs/CHANGELOG.md) | Historique des changements (Features, Fixes). |
| [Glossaire](docs/GLOSSARY.md) | Vocabulaire métier pour s'aligner avec l'IA. |

## Lancer le projet en Local

```powershell
cd "[CHEMIN_DU_PROJET]"
npm install
npm run dev
```

## Lancer les tests

```powershell
npm run test
# Pour vérifier la couverture du code :
npm run coverage
```

## Méthodologie

Ce projet utilise le framework **Spec-Driven Development (SDD)** adapté au Web :
1. Les specs UI/UX sont rédigées et validées en premier (`/spec`).
2. Les composants sont implémentés avec Tailwind selon les specs (`/implement`).
3. Les performances (Re-renders) sont audités (`/optimize`).
4. L'arbre React est vérifié en continu (`/integrate`).
