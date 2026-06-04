---
description: Guide interactif pour les workflows SDD React
---

# /help — Guide utilisateur Frontend

## Mode 1 — Arbre de décision

```
🌳 Quel workflow React utiliser ?

Tu veux...

📋 PLANIFIER
  ├── Démarrer un nouveau projet Web ?       → /plan puis /new-project
  ├── Repenser l'architecture de ton App ?   → /plan
  ├── Stress-tester les flux utilisateurs ?  → /think
  └── L'Arbre des composants est-il solide ? → /archi

📝 SPÉCIFIER
  └── Définir le Layout, UI, et les interactions ? → /spec

💻 CODER
  ├── Implémenter un composant depuis les specs ? → /implement (Mode Strict ou Souple)
  ├── Découper un gros composant JSX ?            → /refactor
  └── Réduire les re-renders inutiles ?           → /optimize

🔍 VÉRIFIER
  ├── L'UI correspond aux specs (Loading/Error) ? → /audit
  ├── Le code React est-il propre (Hooks, Prop-drilling) ? → /review
  ├── Le Context API et le Router sont-ils branchés ?      → /integrate

🧹 NETTOYER
  ├── Optimiser le Bundle JS du projet ?          → /optimize-all
  ├── Tester le composant (Clics, Accessibilité)? → /test

🔄 MAINTENIR
  ├── Créer/modifier une règle du kit ?           → /kit
  ├── Mettre à jour le kit dans ce projet ?       → /upgrade-kit

🐛 RÉPARER
  └── J'ai un bug React (Infinite Loop, Hydration) ? → /debug

🧠 RÉFLÉCHIR
  ├── Pourquoi le State s'est corrompu ?           → /post-mortem
  └── Je veux comprendre comment marche un Hook ?  → /learn
```

## Mode 2 — Comment bien écrire ses prompts pour React

| ❌ Mauvais (flou) | ✅ Bon (précis) | Pourquoi |
|---|---|---|
| "fais le bouton" | "implémente le composant Button selon SPECS.md en utilisant Tailwind" | L'IA cible le composant et la spec exacte. |
| "y a un bug" | "La page crashe avec un Infinite Re-render sur src/components/Dashboard.jsx" | L'IA identifie directement le type d'erreur React. |
| "refais le layout" | "/refactor Dashboard.jsx pour extraire la Sidebar dans un sous-composant" | Utilisation claire du workflow associé. |

## Mots clés puissants
- `@[/workflow]` : Force l'utilisation stricte du workflow.
- `en Mode Strict` : Lors de `/implement`, ordonne de réutiliser un composant.
- `en Mode Souple` : Lors de `/implement`, ordonne de coder vite sans se soucier de la duplication.

## ✅ Checklist de sortie
- Ne jamais modifier le code avec cette commande. Il s'agit uniquement d'informer l'utilisateur.
