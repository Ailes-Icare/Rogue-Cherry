---
description: Apprendre et comprendre un concept de développement Web/React
---

# /learn — Apprendre et comprendre le Frontend

## Quand utiliser
- Tu as besoin d'explications sur un aspect obscur de React (ex: "C'est quoi un `useMemo` ?").
- Tu veux comprendre un code écrit par l'IA.
- Tu veux comprendre une décision d'architecture (Zustand vs Redux).

## Étapes

### 1. Comprendre la demande
Identifier si l'utilisateur souhaite une vulgarisation globale ou l'explication d'un bout de JSX spécifique.

### 2. Expliquer avec la méthode A-E-P (Adaptée au Web)

**A — Analogie** : Poser les bases avec le monde réel.
> "Un Context React, c'est comme un haut-parleur dans un magasin. Au lieu de passer l'information d'employé en employé (Prop Drilling), la direction annonce le message au micro, et tous les employés l'entendent instantanément."

**E — Exemple** : Un petit bout de code React pour illustrer.
```jsx
// Exemple de State local
const [temperature, setTemperature] = useState(20);
// On modifie l'état
setTemperature(25);
```

**P — Pratique** : Faire le lien avec l'application de l'utilisateur.
> "Dans ton Dashboard, on utilisera Zustand pour le `userToken`, car on a besoin que la Sidebar ET le Header y accèdent sans se compliquer la vie avec les props."

### 3. Décortiquer le Code Existant
Si l'utilisateur demande d'analyser un composant obscur :

```
📖 Ce composant fait : [Affiche une modale de confirmation].

Ligne par ligne :
│ ligne 5  → useEffect : On "écoute" si la modale s'ouvre pour bloquer le scroll de la page.
│ ligne 10 → return (JSX) : La structure visuelle du composant.
```

## Règles
- **Vulgarisation maximale** : Ne dites pas "Virtual DOM reconciliation", dites "React compare l'image précédente de la page avec la nouvelle, et ne modifie que le pixel qui a changé".
- **Analogies** : C'est le cœur du système SDD d'apprentissage.

## ✅ Checklist de sortie
- [ ] Le concept a été expliqué via une analogie ?
- [ ] L'utilisateur a confirmé avoir compris le Hook / le Concept ?
