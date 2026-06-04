---
description: Implémenter une feature React à partir de ses spécifications validées
---

# /implement — Implémenter depuis les specs

## Prérequis
- Les specs de la feature doivent exister dans `docs/SPECS.md` avec statut 🔴 ou 🔧.
- L'interface visuelle (UI/UX) doit y être décrite.
- Les specs doivent être **validées par l'utilisateur**.

## Étapes

### 1. Audit rapide (obligatoire)
Avant de commencer, vérifier :
- [ ] Les specs de la feature cible existent et sont validées.
- [ ] Aucune feature dépendante n'est cassée.
- [ ] Le serveur de dev (Vite) tourne sans erreur critique.

### 2. Lire et résumer les specs
Résumer à l'utilisateur :
- "Je vais implémenter le composant/page [nom]."
- "L'interface prévue est [résumé visuel]."
- "La gestion d'état se fera via [Hook / Context]."

### 2b. Scan de réutilisation et Choix de Rigidité (Obligatoire)
Avant d'écrire du nouveau JSX, l'IA doit scanner le dossier `src/components/` et `src/hooks/`.

1. **Lister** les composants UI existants (Boutons, Cards, Inputs).
2. **Pour chaque élément de la spec**, vérifier : Existe-t-il un composant qui fait déjà ça ?
3. **Produire le rapport** :

```
🔍 Scan de réutilisation Frontend

| Composant requis par la spec | Existe déjà ? |
|---|---|
| Bouton de validation | OUI : `<Button variant="primary">` |
| Carte Produit | SIMILAIRE : `<ArticleCard>` |
| Hook de fetch | NON |
```

4. **Demander le niveau de rigidité à l'utilisateur** :
> "Souhaitez-vous une approche **Stricte** (on généralise `<ArticleCard>` pour qu'il serve aussi aux produits) ou **Souple** (on crée `<ProductCard>` à part pour prototyper vite, quitte à refactoriser plus tard) ?"
*C'est l'utilisateur qui décide si on privilégie l'architecture pure ou la vitesse de prototypage.*

### 3. Proposer le plan d'implémentation
Présenter le plan React minimal :

```
📋 Plan d'implémentation : [Feature]

Fichiers à CRÉER :
  - src/components/ui/[composant].jsx — [description] (~XX lignes)

Fichiers à MODIFIER :
  - src/pages/[page].jsx — Import du nouveau composant, ajout du state

Dépendances (npm/yarn) :
  - [librairie] (ex: clsx, lucide-react)

Impact sur le bundle : Faible/Moyen/Élevé
```

### 4. Obtenir validation du plan
L'utilisateur doit approuver le plan AVANT toute modification de code.

### 5. Implémenter
Coder en suivant le plan validé. Règles de base :
- **Tailwind par défaut** : Pas de CSS externe.
- **Isoler la logique** : Si un composant a plus de 2 `useEffect`, proposer de les extraire dans un Custom Hook.
- **Gérer le asynchrone** : Toujours inclure visuellement un retour si `isLoading` est vrai.
- **Un composant = Un fichier** (sauf très petits sous-composants privés).

### 6. Tests (si configurés)
Si le projet utilise Vitest/React Testing Library :
- Créer un test d'interaction basique (ex: clique sur le bouton, un message apparaît).
- Lancer le test.

### 7. Vérification UI & Intégration
- Demander à l'utilisateur de regarder le rendu dans son navigateur.
- Vérifier la console du navigateur (pas d'erreurs, pas de warnings "Key prop missing").

### 8. Mise à jour des docs
- `docs/SPECS.md` : Mettre le statut à 🟢.
- `docs/CHANGELOG.md` : Ajouter l'entrée.
- `docs/DECISIONS.md` : Si on a choisi de dupliquer un composant par souci de vitesse (Mode Souple).

## ✅ Checklist de sortie
- [ ] Scan de réutilisation fait et Mode (Strict/Souple) choisi par l'utilisateur ?
- [ ] Composant codé selon les standards Tailwind/React ?
- [ ] Rendu navigateur validé par l'utilisateur ?
- [ ] `docs/SPECS.md` et `CHANGELOG.md` mis à jour ?
