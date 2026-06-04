# Standards de Code

> Conventions et standards de code pour l'écosystème React/Vite/Tailwind.

## Langage principal : JavaScript / React

Le développement se fait principalement en JavaScript (avec syntaxe JSX pour React), orchestré par le bundler Vite.

### Style React & JS
- **Syntaxe** : Utiliser les standards ES6+ (fonctions fléchées, destructuring, template literals).
- **ESLint & Prettier** : Le code doit suivre les règles de base du linter de l'écosystème (indentation, guillemets, etc.).
- **JSDoc** : En français, pour documenter les composants complexes et les hooks personnalisés :
  ```javascript
  /**
   * Composant de bouton personnalisé.
   * 
   * @param {Object} props - Les propriétés du composant.
   * @param {string} props.label - Le texte affiché sur le bouton.
   * @param {string} [props.variant='primary'] - Le style du bouton (primary, secondary).
   * @param {function} props.onClick - Fonction appelée au clic.
   * @returns {JSX.Element}
   */
  const CustomButton = ({ label, variant = 'primary', onClick }) => { ... }
  ```
- **Commentaires** : En français, uniquement pour expliquer le POURQUOI (la logique complexe), pas le quoi.
- **Hooks** : Respecter scrupuleusement les règles des Hooks (pas d'appel dans des conditions ou des boucles, gérer correctement le tableau de dépendances du `useEffect`).

### Styling avec Tailwind CSS
- **Interdit** : Le CSS externe classique (fichiers `.css` séparés par composant) ou le style inline `style={{...}}` (sauf pour des valeurs dynamiques impossibles à prévoir via des classes).
- **Obligatoire** : Utiliser exclusivement les classes utilitaires de **Tailwind CSS**.
- **Lisibilité** : Pour les classes Tailwind extrêmement longues, réfléchir à une extraction via utilitaires (ex: `clsx`, `tailwind-merge`) ou isoler en petits sous-composants.

### Organisation des fichiers
```text
src/
├── main.jsx         ← Point d'entrée Vite
├── App.jsx          ← Composant racine (Routage global / Layout de base)
├── components/      ← Composants UI réutilisables (Button, Card, Modal)
├── hooks/           ← Hooks personnalisés (useAuth, useFetch)
├── pages/           ← Composants représentant des pages entières
├── assets/          ← Images, icônes, styles globaux
├── utils/           ← Fonctions utilitaires JS (formatage de date, calculs)
└── context/         ← Gestion de l'état global (React Context Providers)
```

## Langages secondaires

| Langage | Quand l'utiliser | Conditions |
|---|---|---|
| HTML | Structure de base `index.html` | Minimal, configuré par Vite |
| CSS | Configuration Tailwind (`index.css`) | Limité à l'import de base et aux polices |
| TypeScript | Typage strict si demandé | Optionnel, à valider avec l'utilisateur |

## Conventions de nommage

| Élément | Convention | Exemple |
|---|---|---|
| Fichiers (Composants) | PascalCase | `CustomButton.jsx` |
| Fichiers (Hooks/Utils) | camelCase | `useUserSession.js`, `formatDate.js` |
| Composants React | PascalCase | `function CustomButton()` |
| Hooks | camelCase (préfixe 'use') | `useAuth()` |
| Fonctions JS & Variables | camelCase | `handleClick`, `userData` |
| Constantes globales | UPPER_SNAKE | `MAX_ITEMS_PER_PAGE` |

## Principes de code

1. **Un fichier = une responsabilité.** Un fichier `.jsx` ne devrait exporter par défaut qu'un seul composant principal.
2. **Composants courts.** Si la structure JSX d'un composant dépasse 150-200 lignes, il faut le découper en sous-composants pertinents.
3. **Pas de valeurs magiques.** Extraire les couleurs métier ou tailles spécifiques dans `tailwind.config.js` si elles reviennent souvent.
4. **Gestion des états visuels obligatoires.** Toujours penser et gérer les états de chargement (`isLoading`), d'erreur (`error`) et les états vides (pas de données).
5. **Gestion d'erreurs.** Traiter proprement les erreurs d'API (try/catch) et donner un feedback visuel à l'utilisateur.

## Tests

- Les tests vont généralement à côté de leur fichier cible ou dans un dossier `__tests__/` (ex: `CustomButton.test.jsx`).
- Framework cible (si tests activés) : `Vitest` (souvent couplé à Vite) et `React Testing Library`.
- Chaque composant critique ou complexe spécifié doit avoir ses cas de tests documentés/implémentés.
