# Module : Simulateurs & Complex State

> Guide architectural pour les simulateurs de type "Kingdom Simulator", "City Builder" ou simulation scientifique.

## Enjeux du Web pour la Simulation

Un simulateur se caractérise par des **milliers de calculs d'entités** (ex: calculer la récolte de 5000 fermes chaque seconde). Le navigateur a un thread principal unique : si on fait ces calculs dans React, la page va figer (freeze) et l'utilisateur ne pourra plus cliquer.

## Stack recommandée
- **UI** : React 19 + Tailwind
- **State Management** : Zustand (pour la flexibilité et la persistance).
- **Performance CPU** : Web Workers (pour déporter les calculs lourds).

## Structure type

```
src/
├── engine/              ← Le cœur mathématique de la simulation
│   ├── workers/         ← Fichiers Web Workers purs (.js)
│   └── formulas/        ← Fonctions mathématiques pures (testables à 100%)
├── store/
│   └── useSimStore.js   ← L'état global du simulateur
├── components/
│   ├── panels/          ← Panneaux de contrôle (gestion de la ville)
│   └── grid/            ← Affichage de la carte (Canvas ou CSS Grid)
```

## Architecture des Web Workers

Pour éviter que le jeu rame :
1. React envoie les données de base au **Web Worker**.
2. Le Worker calcule l'évolution (les récoltes, les maladies, la croissance de la population) en tâche de fond.
3. Le Worker renvoie le nouvel état.
4. Zustand met à jour le Store.
5. React met à jour l'UI en douceur.

## L'Horloge du Simulateur
Gérer l'écoulement du temps via un Hook `useTick` qui centralise les "tours" ou les "jours" du simulateur. L'UI doit s'abonner à ce tick uniquement si elle a besoin d'afficher l'horloge.
