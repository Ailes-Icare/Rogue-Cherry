---
description: Audit de cohérence entre le code React, l'UI/UX et les spécifications
---

# /audit — Audit de cohérence Frontend

## Quand utiliser
- **Obligatoire** : Avant de commencer une nouvelle feature majeure.
- **Sur demande** : Quand l'interface utilisateur semble incohérente ou que le code devient un plat de spaghettis.

## Étapes

### 1. Charger les specs UI/UX
Lire `docs/SPECS.md` et lister tous les composants majeurs avec leur statut déclaré.

### 2. Vérifier chaque feature (Frontend Check)
Pour chaque feature marquée 🟢 (Implémenté) ou 🟡 (En cours) :

1. **Existence visuelle** : Le composant existe-t-il dans `src/components/` ?
2. **Conformité UI** : Le rendu Tailwind correspond-il à l'esprit de la spec (responsive, padding, couleurs) ?
3. **États UI** : Les états *Loading*, *Error*, et *Empty* sont-ils implémentés dans le code ?
4. **Console propre** : L'utilisation de ce composant génère-t-elle des erreurs React dans la console navigateur ?

### 3. Produire le rapport

Format du rapport :

```markdown
# 🔍 Rapport d'Audit React — [Date]

## Résumé
- Total composants cibles : [N]
- ✅ Conformes : [N]
- ⚠️ Partiels (manque Loading/Error/Responsive) : [N]
- ❌ Non conformes : [N]

## Détail

### ⚠️ [Feature: Modale de Paiement]
Statut specs : 🟢 | Code : Partiel | Tests UI : OK
**Problème** : L'état *Loading* n'est pas géré au clic. L'utilisateur peut cliquer deux fois.
**Action** : Ajouter la prop `disabled={isLoading}`.
```

### 4. Vérifications Frontend Supplémentaires
- [ ] **Styles Sauvages** : Y a-t-il des attributs `style={{...}}` (inline CSS) au lieu de classes Tailwind ?
- [ ] **Anti-Pattern React** : Utilise-t-on `document.getElementById` au lieu des `refs` React ?
- [ ] **Dépendances** : Y a-t-il des dépendances npm importées mais jamais utilisées ?

### 5. Actions correctives
Présenter le rapport et demander à l'utilisateur s'il souhaite corriger (via `/debug` ou `/implement`).

## ✅ Checklist de sortie
- [ ] Toutes les features 🟢 ont été vérifiées dans le code JSX ?
- [ ] Les états interactifs (Loading/Error) ont été traqués ?
- [ ] Rapport présenté à l'utilisateur ?
