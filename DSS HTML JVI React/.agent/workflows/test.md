---
description: Créer et lancer des tests UI et unitaires pour React
---

# /test — Tests React & UI

## Usage
- `/test créer [composant/feature]` — Créer les tests d'une feature
- `/test lancer` — Lancer tous les tests Vitest
- `/test lancer [composant]` — Lancer les tests d'un fichier spécifique

## Créer des tests React

### 1. Lire les specs (Focus UI)
Ouvrir `docs/SPECS.md` et trouver les **critères de validation**. 
Rappel : En React, on teste les *interactions de l'utilisateur* (ce qu'il voit et clique), pas l'implémentation (le nom des variables internes).

### 2. Écrire les tests (Vitest + Testing Library)
Créer un fichier `[NomDuComposant].test.jsx` à côté du composant ou dans `__tests__/`.

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import MonComposant from './MonComposant';

describe('MonComposant', () => {
  it('affiche le contenu par défaut', () => {
    // 1. Arrange
    render(<MonComposant />);
    
    // 2. Assert
    expect(screen.getByRole('heading', { name: /Titre/i })).toBeInTheDocument();
  });

  it('affiche une erreur quand on soumet un champ vide', async () => {
    const user = userEvent.setup();
    render(<MonComposant />);
    
    // Act : Clic sans remplir
    const submitButton = screen.getByRole('button', { name: /Valider/i });
    await user.click(submitButton);
    
    // Assert : L'erreur UI apparait
    expect(await screen.findByText(/Champ requis/i)).toBeInTheDocument();
  });
});
```

### 3. Moquer les API (Fetch)
Ne jamais laisser un test React appeler une vraie API. 
Utiliser **MSW (Mock Service Worker)** ou moquer la fonction de fetch globalement via `vi.fn()` de Vitest.

### 4. Lancer les tests
```powershell
npm run test
# ou 
npx vitest run
```

### 5. Interpréter les résultats
```
✅ PASSED = L'UI réagit correctement à l'interaction
❌ FAILED = L'UI est cassée ou le bouton ne déclenche pas l'action
⚠️ ERROR = Le test lui-même est mal codé (ex: await oublié sur userEvent)
```

## Règles
- **Utiliser les requêtes d'accessibilité** : Toujours privilégier `getByRole` ou `getByText`. Interdiction d'utiliser des sélecteurs CSS (pas de `document.querySelector('.classe')`).
- **Tester les Hooks isolément** : Si la logique métier est dans un gros Hook (`useAuth`), créer un test unitaire spécifique au Hook en utilisant `@testing-library/react-hooks` (ou `renderHook`).
- Ne jamais tester les classes Tailwind (ex: ne pas tester que la modale est `bg-red-500`, ce n'est pas le but d'un test RTL).

## ✅ Checklist de sortie
- [ ] Les tests vérifient l'UI (boutons, textes, rôles) et non le state interne ?
- [ ] Les appels API distants ont été moqués ?
- [ ] Tous les tests passent dans la console ?
- [ ] Critères de validation cochés dans `SPECS.md` ?
