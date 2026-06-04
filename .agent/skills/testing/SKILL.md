---
name: React Testing
description: Écrire des tests unitaires et UI robustes dans l'écosystème React
---

# Skill : React Testing

> [!NOTE] 
> **🔄 MIGRATION REACT :** Remplace l'ancien skill Python (Pytest). Ici l'objectif est de tester des composants visuels, des états interactifs et des appels réseaux moqués via Vitest et React Testing Library (RTL).

## Objectif
S'assurer que l'interface utilisateur (UI) ne se casse pas lors de l'ajout de nouvelles fonctionnalités. En Frontend, on ne teste pas les "fonctions" isolées autant que les "interactions de l'utilisateur".

## 1. La Philosophie "React Testing Library"

L'erreur la plus courante est de tester l'implémentation (le code interne du composant).
❌ **Mauvais** : "Je vérifie que la variable d'état `isOpen` est à `true`".
✅ **Bon** : "Je clique sur le bouton Menu, et je vérifie que le texte 'Accueil' apparait à l'écran."

On teste ce que l'utilisateur **voit** et **fait**.

## 2. L'Anatomie d'un Test UI

```javascript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from './LoginForm';

test('Affiche une erreur si les identifiants sont vides', async () => {
  // 1. Arrange (Mettre en place)
  const user = userEvent.setup();
  render(<LoginForm />);

  // 2. Act (Agir)
  const submitButton = screen.getByRole('button', { name: /se connecter/i });
  await user.click(submitButton);

  // 3. Assert (Vérifier)
  expect(screen.getByText(/email obligatoire/i)).toBeInTheDocument();
});
```

## 3. Les Requêtes (Queries) par Accessibilité

Pour trouver un élément sur la page, n'utilisez pas de sélecteurs CSS bizarres (`querySelector('.mon-bouton')`). Utilisez l'accessibilité :
- `getByRole('button', { name: 'Valider' })` (Le plus robuste !)
- `getByText('Erreur réseau')`
- `getByPlaceholderText('Votre email')`
- `getByTestId('cart-item')` (Seulement en dernier recours si rien d'autre ne marche).

## 4. Gérer l'Asynchrone et les "Act" Warnings

Si vous testez un composant qui charge des données distantes :
- Utilisez `await screen.findByText('Résultat')` au lieu de `getByText`, car `find` attendra jusqu'à l'apparition de l'élément (max 1000ms par défaut).
- Moquez toujours les appels `fetch` globaux ou utilisez **MSW (Mock Service Worker)** pour éviter de taper de vraies API pendant les tests.

## 5. Ce qu'il NE FAUT PAS tester
- **Les styles CSS** : Ne testez pas que le bouton a la classe `bg-red-500`. C'est fragile.
- **Les librairies externes** : Ne testez pas que le Modal de `Radix UI` marche, testez que *votre* contenu s'affiche quand vous cliquez dessus.
