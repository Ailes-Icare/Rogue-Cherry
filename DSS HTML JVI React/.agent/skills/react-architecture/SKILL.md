---
name: Architecture React Scalable
description: Structuration d'un projet frontend pour éviter le code spaghetti
---

# Skill : Architecture React Scalable

> [!NOTE] 
> **🔄 MIGRATION REACT :** Remplace l'ancienne structuration backend (Models/Services) par l'approche modulaire orientée UI (Components/Pages). Inspiré des meilleures pratiques (ex: Artifact Builder).

## Objectif
Garder le dossier `src/` propre, lisible et scalable. Éviter le fameux composant `App.jsx` de 1000 lignes où tout est mélangé.

## 1. Séparation des Responsabilités (Dossiers)

Un projet React robuste suit cette arborescence stricte :

```text
src/
├── assets/          # Images, icônes, fichiers CSS globaux
├── components/      # Composants UI purs (dumb components)
│   ├── ui/          # Boutons, Inputs, Modals, Cards
│   └── layout/      # Navbar, Footer, Sidebar
├── features/        # Regroupement par fonctionnalité (optionnel pour gros projets)
├── hooks/           # Logique métier extraite du JSX (useAuth, useCart)
├── pages/           # Vues principales (smart components). Une page = une route.
├── context/         # Gestionnaires d'état global
└── utils/           # Fonctions pures (calculs, formatage)
```

## 2. Règle d'or : Composants Idiots vs Composants Intelligents

### Composants "Idiots" (Presentational)
Se trouvent dans `src/components/`. 
- Ils ne connaissent rien au reste de l'application.
- Ils ne font pas d'appels API.
- Ils reçoivent uniquement des `props` et retournent du JSX.
- Ex : Un `ProductCard` qui prend un objet `product` et une fonction `onAddToCart`.

### Composants "Intelligents" (Container / Pages)
Se trouvent dans `src/pages/`.
- Ils connaissent le contexte.
- Ils gèrent l'état local, font les appels API, utilisent les Hooks.
- Ils passent les données aux composants idiots.

## 3. Éviter le "Prop Drilling"

Si vous devez passer une prop à travers 4 niveaux de composants enfants qui ne s'en servent pas eux-mêmes :
❌ **Mauvais** : Continuer à passer la prop en cascade.
✅ **Bon** : Utiliser la Composition (passer du JSX via la prop `children`), ou utiliser un Context React.

## 4. Organisation interne d'un fichier `.jsx`

L'ordre importe pour la lisibilité :
1. Imports (React -> Librairies -> Fichiers locaux)
2. Définition des Types/JSDoc (si applicable)
3. Déclaration du Composant
4. Hooks (`useState`, `useRef`, puis `useEffect`)
5. Fonctions intermédiaires (handlers de clic)
6. Le `return` (JSX)
7. L'export par défaut

## 5. Indexation (Barrels)

Pour éviter d'avoir des imports très longs :
`import Button from '../../components/ui/Button'`
Utiliser un fichier `index.js` dans le dossier `components/ui/` pour tout exporter :
`import { Button, Card, Input } from '@/components/ui'`
