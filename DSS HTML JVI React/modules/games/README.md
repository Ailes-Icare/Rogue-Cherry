# Module : Jeux Vidéo Web (Web Games)

> Guide architectural à copier dans un projet lors de la création d'un jeu Web en React.

## Sous-types supportés en Frontend

| Type de jeu | Stack recommandée | Notes |
|---|---|---|
| Jeu 2D UI-based (ex: Clicker, Text RPG) | React + Zustand + Tailwind | Idéal pour les jeux basés sur des menus et de la gestion de state complexe. |
| Jeu 2D (Action/Platformer) | React + Canvas API (`useRef`) | Hautes performances pour dessiner 60 FPS. |
| Jeu 3D | React Three Fiber (R3F) | Librairie incontournable pour la 3D déclarative en React. |

## Structure type d'un jeu Web

```
src/
├── game/
│   ├── loop/            ← Game Loop personnalisée (requestAnimationFrame)
│   ├── systems/         ← Logique pure (Combat, Déplacements)
│   └── entities/        ← Définitions (Monstres, Items)
├── store/
│   └── useGameStore.js  ← État global du jeu (Zustand)
├── components/
│   ├── canvas/          ← Composants R3F ou Canvas purs
│   └── hud/             ← Interface superposée (Barre de vie, Inventaire)
└── assets/
    ├── sprites/
    └── sounds/
```

## Concepts spécifiques au Frontend

### La Game Loop (React Hook)
Ne jamais utiliser `setInterval` en React pour une game loop, utiliser `requestAnimationFrame` dans un custom hook `useGameLoop` pour garantir 60 FPS sans bloquer l'UI.

### Le Piège des Re-Renders
Dans un jeu, la position X/Y du joueur change 60 fois par seconde. **NE PAS** stocker ces variables dans le State React local ou Zustand si elles sont liées au DOM, cela ferait crasher l'application. Utiliser des `useRef` pour les mutations rapides (positions, vélocité) qui ne nécessitent pas de redessiner l'UI.

### Save / Load
Sauvegarder l'état Zustand directement dans le `localStorage` de l'utilisateur ou via IndexedDB pour les grosses sauvegardes (images générées, gros tableaux).
