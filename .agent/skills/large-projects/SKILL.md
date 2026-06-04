---
name: Architecture Large Projets React
description: Stratégies pour scaler un projet frontend complexe
---

# Skill : Architecture Large Projets React

> [!NOTE] 
> **🔄 MIGRATION REACT :** Aborde des problématiques exclusives au développement frontend moderne : gestion du bundle JS, lazy loading, et organisation par domaines métiers (Feature Slices).

## Objectif
Garder le projet maintenable, performant, et compréhensible lorsqu'il dépasse la cinquantaine de composants et les dizaines de pages.

## 1. Feature-Sliced Design (FSD) ou Découpage par Domaine

Quand le dossier `src/components/` devient un fouillis avec 100 fichiers, il faut passer à un découpage par "Fonctionnalité" (Feature).

```text
src/
├── features/
│   ├── auth/                # Tout ce qui concerne l'authentification
│   │   ├── components/      # LoginForm, RegisterForm
│   │   ├── hooks/           # useLogin, useSession
│   │   └── api/             # Appels réseau (login, logout)
│   ├── cart/                # Tout ce qui concerne le panier
│   └── dashboard/
```
**Avantage** : Si on veut supprimer ou modifier l'authentification, on ne touche qu'à un seul dossier. C'est l'équivalent des modules backend.

## 2. Le Lazy Loading (Code Splitting)

Par défaut, React (via Vite) met tout le code de l'application dans un seul gros fichier `bundle.js`. Sur un gros projet, ce fichier peut peser plusieurs Mégaoctets et bloquer le chargement du site.

**Solution : Charger les routes à la demande.**
Au lieu d'importer toutes les pages au démarrage :
❌ `import Dashboard from './pages/Dashboard';`

✅ **L'import dynamique :**
```jsx
import { lazy, Suspense } from 'react';
const Dashboard = lazy(() => import('./pages/Dashboard'));

// Dans le routeur :
<Suspense fallback={<Spinner />}>
  <Dashboard />
</Suspense>
```
L'utilisateur ne téléchargera le code du Dashboard que s'il clique sur le lien pour y aller !

## 3. L'État Global sous contrôle

Dans les gros projets, on est tenté de tout mettre dans un Context global géant (`AppProvider`) pour éviter de se casser la tête.

**La règle de la Scalabilité du State :**
1. **État local** : Si la donnée n'est utile qu'ici, `useState`.
2. **État de requête (Server State)** : Utiliser une librairie comme *React Query* ou *SWR* pour mettre en cache les requêtes réseau globales. NE PAS les stocker manuellement dans un Context.
3. **État UI Global (Client State)** : Si nécessaire (ex: thème sombre, modale ouverte globalement), utiliser des Contextes isolés (`ThemeProvider`, `ModalProvider`) ou un store `Zustand`. Ne jamais tout mélanger dans un seul Provider massif.

## 4. Configuration stricte du Linter

Sur un gros projet, on ne fait pas confiance aux développeurs, on fait confiance aux outils.
- S'assurer que le plugin `eslint-plugin-react-hooks` est activé en mode "error", pas "warning". Si une dépendance de Hook manque, le code ne doit pas compiler.
