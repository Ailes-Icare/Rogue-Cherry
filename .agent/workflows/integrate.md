---
description: Brancher correctement un nouveau composant ou une nouvelle page dans l'Arbre React
---

# /integrate — Vérification d'intégration React

## Quand utiliser
- Après un `/implement` qui a créé un nouveau composant.
- Le composant s'affiche mais n'a pas accès aux données globales (Thème, Auth, Router).
- On a le redouté message d'erreur : `useContext must be used within a Provider` ou `useNavigate must be used within a Router`.

## Étapes

### 1. Identifier le composant et ses besoins
Qu'est-ce qu'on vient de créer et qu'est-ce qu'il consomme ?
Ex: `<UserProfile />` consomme `useAuthContext()` et utilise des liens (`<Link>`).

### 2. Vérification des Providers
Si le composant utilise un Context, remonter l'arbre :
- [ ] Est-il bien inséré à l'intérieur de `<AuthProvider>` ?
- [ ] Si non, où doit-on déplacer le Provider (dans `main.jsx` ou plus localement) ?

### 3. Vérification du Routeur
Si le fichier est une nouvelle *Page* :
- [ ] Est-elle déclarée dans le fichier de routing principal (ex: `App.jsx` ou le fichier de routes react-router) ?
- [ ] Le path URL est-il cohérent ?

### 4. Vérification des Imports (Fichiers JSX)
- [ ] Les imports sont-ils absolus ou relatifs ?
- [ ] Ne manque-t-il pas le `import { useState } from 'react'` en haut du fichier ?
- [ ] L'export par défaut (`export default`) ou nommé est-il cohérent avec la façon dont il est importé ?

### 5. Connexions des Props
- [ ] Le composant Parent envoie-t-il bien toutes les props requises ?
- [ ] S'il manque des données, afficher un avertissement clair sur le prop-drilling.

### 6. Rapport et Fixes
Corriger les imports, rajouter les balises de Provider manquantes ou ajuster le Router. Relancer l'app pour valider l'affichage.

## ✅ Checklist de sortie
- [ ] Les erreurs liées au Context et Providers sont évitées/corrigées ?
- [ ] Le composant s'affiche correctement dans l'arbre ?
