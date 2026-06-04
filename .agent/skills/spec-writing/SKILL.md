---
name: Rédaction de Spécifications Web
description: Rédiger des specs adaptées au Frontend et à l'interactivité
---

# Skill : Rédaction de Spécifications Web

> [!NOTE] 
> **🔄 MIGRATION REACT :** L'ancien template de specs orienté "règles métiers mathématiques" (calcul de dégâts) est remplacé par un template UI/UX centré sur les comportements des composants, le design visuel et les interactions de l'utilisateur.

## Objectif
Aider à rédiger des spécifications qui capturent l'intégralité d'une interface web avant de la coder. Dans le monde du développement frontend, une spec vague produit une interface cassée ou générique.

## 1. Penser en "États" visuels (UI States)

La différence majeure avec un backend, c'est qu'une interface web possède de multiples "états" pour un même composant. Les specs doivent les documenter.

Pour chaque élément interactif, demandez-vous :
- À quoi ressemble-t-il par défaut (Idle) ?
- Que se passe-t-il quand la souris passe dessus (Hover) ?
- Que se passe-t-il quand on clique ou navigue au clavier (Focus / Active) ?
- Que se passe-t-il pendant qu'il charge une donnée (Loading) ?
- Comment est-il désactivé si l'utilisateur n'a pas les droits (Disabled) ?

## 2. Le Design System implicite

Dans les specs, ne dites pas simplement : "Faire un bouton bleu".
Utilisez le langage des utilitaires ou des intentions : "Utiliser la couleur primaire de la charte", "Bouton avec variant *Secondary*", ou "Ajouter un padding `p-4` pour la zone de respiration".

## 3. Template de spec Frontend (Composant ou Page)

Voici le format exigé pour tout composant ou page développé en SDD :

```markdown
## [Nom du Composant ou de la Page]

**Statut** : 🔴 Non implémenté

**Description** :
[À quoi sert cette vue pour l'utilisateur final ? Quel est son rôle métier ?]

**Design Visuel & Responsive** :
- Aspect (ex: "Carte blanche avec bords arrondis xl, style minimaliste")
- Mobile (<768px) : [Comportement en colonne, menu burger]
- Desktop (>768px) : [Comportement en grille, affichage max-w-5xl centré]

**États Interactifs** :
- **Loading** : Affichage de `[Skeleton Cards]` à la place du contenu pendant la requête API.
- **Erreur** : Message toast d'erreur rouge avec un bouton "Réessayer".
- **Empty State** : Si aucune donnée, afficher une illustration stylisée et un texte "Aucun élément trouvé".

**Gestion d'état (Data)** :
- State local : [ex: `isOpen` pour le menu, `searchQuery` pour l'input]
- Source de données : [Où va-t-on chercher la data ? (API externe, Context...)]

**Comportement attendu (User Flow)** :
1. L'utilisateur atterrit sur la page, l'état `Loading` est actif.
2. Les données arrivent, l'état normal s'affiche.
3. Quand l'utilisateur clique sur [Élément X], alors [État Y change et ouvre la Modal].

**Critères de validation** :
- [ ] Le layout sur téléphone (iPhone SE) ne dépasse pas l'écran (pas de scroll horizontal).
- [ ] Le bouton de soumission est désactivé (`opacity-50 cursor-not-allowed`) pendant le chargement.
- [ ] L'interface respecte les règles du "Frontend Design Senior" (pas d'Arial, de bons contrastes).
```

## 4. Éviter le piège de la "feature cachée"

En frontend, il est facile d'oublier des comportements "par défaut" du web.
❌ "Mettre une barre de recherche."
✅ "Mettre une barre de recherche. L'appui sur la touche Entrée déclenche la soumission du formulaire. L'icône de loupe change de couleur au focus de l'input."
