# Architecture Frontend — [Nom du Projet]

> Dernière mise à jour : [DATE]

## Vue d'ensemble

_1-2 paragraphes décrivant la structure générale de l'application React et son fonctionnement global (SPA, SSR, etc.)._

## Architecture de l'Application

Nous suivons l'architecture "Senior Frontend" orientée Feature-Sliced Design.

## Structure des dossiers

```
src/
├── main.jsx              ← Point d'entrée de l'Application (Providers)
├── App.jsx               ← Routeur principal
├── assets/               ← Médias statiques (Images, SVG, Fonts)
├── components/
│   └── ui/               ← Composants "bêtes" et réutilisables (Boutons, Modales)
├── features/             ← Code groupé par domaine (ex: /auth, /cart)
├── hooks/                ← Custom Hooks globaux
├── store/                ← État global (ex: Zustand store)
└── utils/                ← Fonctions pures et formatteurs
```

## State Management (Gestion de l'État)

_Expliquer comment l'état est géré. Ex: État serveur avec React Query, État global avec Zustand, État local avec useState._

## Décisions architecturales

| # | Décision | Raison | Date |
|---|---|---|---|
| DA-001 | _Tailwind CSS_ | _Vélocité de prototypage et absence de CSS mort_ | _DATE_ |
| DA-002 | _Zustand_ | _Plus léger et moins de boilerplate que Redux_ | _DATE_ |

## Dépendances majeures

| Lib | Version | Utilisée pour |
|---|---|---|
| react | 19.x | Cœur |
| tailwindcss | 3.x | Design System |
| vitest | 1.x | Tests |
