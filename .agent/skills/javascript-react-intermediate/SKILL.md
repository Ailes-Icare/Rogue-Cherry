---
name: JavaScript & React Intermédiaire
description: Syntaxe moderne ES6+ et maitrise des subtilités des Hooks React
---

# Skill : JavaScript & React Intermédiaire

> [!NOTE] 
> **🔄 MIGRATION REACT :** Remplace le skill "Python Intermédiaire". Apprend à l'agent à écrire du code JS moderne, idiomatique et performant dans le contexte de React.

## Objectif
Ce guide couvre les syntaxes JavaScript modernes et les pièges classiques de React. Ce sont les techniques qui différencient un code junior brouillon d'un code robuste et concis.

## 1. La Destructuration (Destructuring)

### Le problème
Le code est lourd avec des répétitions de `.quelquechose`.
```javascript
function Profil(props) {
  return <div>{props.user.name} a {props.user.age} ans</div>;
}
```

### La solution
On extrait directement ce dont on a besoin.
```javascript
function Profil({ user: { name, age } }) {
  return <div>{name} a {age} ans</div>;
}
```

## 2. Le rendu conditionnel propre (Ternaires et ET logique)

### Le problème
Utiliser des `if/else` massifs à l'extérieur du JSX rend la lecture du composant difficile.

### La solution
- Utiliser le **ET logique (`&&`)** si on veut afficher quelque chose OU rien du tout :
  ```jsx
  {isLoading && <Spinner />}
  ```
- Utiliser la **Ternaire (`? :`)** si on a une alternative (A ou B) :
  ```jsx
  {isLoggedIn ? <Dashboard /> : <LoginForm />}
  ```
- **Attention au piège du `&&` avec les nombres** : En JS, `0 && <Component/>` affichera "0" sur l'écran. Toujours forcer un booléen (`items.length > 0 && ...`).

## 3. Manipulation immuable des Tableaux (Arrays)

En React, on ne modifie **jamais** un state directement (on ne fait jamais `array.push()`). On recrée un nouveau tableau.

- **Ajouter un élément** : Spread operator `...`
  ```javascript
  setItems(prev => [...prev, newItem]);
  ```
- **Supprimer un élément** : `.filter()`
  ```javascript
  setItems(prev => prev.filter(item => item.id !== idToRemove));
  ```
- **Modifier un élément spécifique** : `.map()`
  ```javascript
  setItems(prev => prev.map(item => 
    item.id === idToUpdate ? { ...item, status: 'done' } : item
  ));
  ```

## 4. Le tableau de dépendances des Hooks

La cause principale de bugs en React est un `useEffect` mal configuré.
- Un tableau vide `[]` : Le code s'exécute **une seule fois** au montage.
- Un tableau non renseigné (pas de second argument) : Le code s'exécute à **chaque** re-rendu (à éviter).
- Un tableau avec des variables `[userId, filter]` : Le code s'exécute quand l'une de ces variables change.

> **Règle absolue** : Si vous utilisez une variable réactive (state ou prop) à l'intérieur d'un `useEffect`, `useCallback` ou `useMemo`, elle DOIT être listée dans le tableau de dépendances. Sans exception.

## 5. Les "Optional Chaining" et "Nullish Coalescing"

### Le problème
Vérifier si un objet existe avant d'accéder à ses sous-propriétés est lourd.
`const zip = user && user.address && user.address.zipcode ? user.address.zipcode : "N/A";`

### La solution (ES2020+)
- **Optional Chaining (`?.`)** : Ne crashe pas si `address` est null.
  `const zip = user?.address?.zipcode;`
- **Nullish Coalescing (`??`)** : Gère correctement les valeurs par défaut (mieux que `||` qui considère `0` ou `""` comme faux).
  `const displayZip = zip ?? "N/A";`
