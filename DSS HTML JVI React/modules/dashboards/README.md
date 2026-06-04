# Module : Dashboards & Data Viz

> Guide d'architecture pour les backoffices, le suivi industriel, et la datavisualisation intensive.

## La problématique du Dashboard
Un Dashboard industriel ou un Backoffice gère de très larges tableaux de données (DataGrids) et de multiples graphiques complexes. Le plus grand risque est le **Re-render en cascade** : si une nouvelle donnée arrive via Websocket pour le Graphique A, il ne faut surtout pas que le Tableau B se redessine.

## Stack recommandée
- **UI & Layout** : Tailwind CSS (idéal pour les CSS Grids de dashboards).
- **Data Fetching** : React Query (TanStack Query) pour mettre en cache les API et gérer le polling.
- **Visualisation** :
  - `Recharts` : Très facile à lier à React, parfait pour 90% des courbes/barres.
  - `D3.js` : Si vous avez besoin d'un graphe ultra-spécifique (ex: carte thermique d'une usine).
  - `TanStack Table` : Le standard absolu pour les très gros tableaux de données (tri, filtres, pagination infinie).

## Architecture React pour Dashboards

```
src/
├── api/                 ← Définitions des appels Axios / Fetch
├── store/
│   └── useFilters.js    ← État global des filtres (ex: "Voir seulement Juin")
├── components/
│   ├── layout/          ← Sidebar, Header, PageContainer
│   ├── charts/          ← Wrappers autour de Recharts ou D3
│   ├── data-grid/       ← Composants de tableaux complexes
│   └── widgets/         ← Petites cartes "Statistiques clés" (KPI)
```

## Bonnes Pratiques

1. **Isolation des Widgets** : Chaque Widget de votre dashboard doit être responsable de sa propre donnée. Ne pas "fetcher" toute la donnée de la page dans le composant parent pour la distribuer en cascade (Prop Drilling). Utilisez `useQuery` dans chaque widget.
2. **Memoization massive** : Les tableaux et les charts coûtent cher à dessiner. Encapsulez-les dans un `React.memo()` pour qu'ils ne se redessinent que si LEUR donnée spécifique change.
3. **Skeleton Loaders** : Au chargement, affichez une structure grise clignotante à la place du graphe (Skeleton) pour éviter les sauts brutaux d'interface (Layout Shifts).
