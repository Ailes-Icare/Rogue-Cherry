---
description: Vérifier que l'architecture des composants React et le State Management vont bien vieillir
---

# /archi — Vaccin architectural Frontend

## Quand utiliser
- **Après `/spec`**, avant `/implement` — vérifier que la hiérarchie des composants est logique.
- **Quand on ajoute une feature** à un projet existant — ex: "Comment intégrer un nouveau graphique D3.js sans alourdir la page d'accueil ?"
- **Quand l'application devient lente** — identifier un problème de design lié aux rendus React.

> Analogie : `/archi` c'est l'architecte web qui dit "Si tu mets l'état (state) global de ton Dashboard tout en haut de l'arbre React, toute ton application va clignoter et ramer dès qu'un graphe bouge."

## Différence avec les autres workflows

| Workflow | Question | Niveau |
|----------|---------|--------|
| `/plan` | QUOI construire ? (Quelles pages/routes) | Stratégique |
| `/spec` | COMMENT ça s'affiche ? (UI/UX) | Visuel & Interaction |
| **`/archi`** | **Est-ce que le code (JSX/Hooks) est maintenable ?** | **Structurel & Perfs** |

---

## Deux modes

### Mode Fondations (début de projet)
Après `/plan`.
**Input** : `docs/PLAN.md`  
**Question** : "Quelle structure de dossiers (`features/`, `components/ui/`) adopter ? Vite ou Next.js ?"

### Mode Évolution (projet existant)
**Input** : `docs/SPECS.md` + arborescence React existante.  
**Question** : "Où placer ce nouveau hook ? Faut-il créer un Context partagé ou faire descendre la prop ?"

---

## Étapes

### 1. Identifier le scope

```
🏗️ Analyse architecturale Frontend

Mode  : [Fondations | Évolution]
Scope : [structure des dossiers | nouveau Context | feature Dashboard]
Contexte : [intégration d'une feature lourde]
```

### 2. Cartographier l'arbre des composants (Component Tree)
Lire les specs et dessiner mentalement ou textuellement comment React va voir la page :

```
📋 Arbre React identifié

<App> (Routeur)
  └── <DashboardLayout> (Gère le Layout CSS Grid)
        ├── <Sidebar> (Menu de navigation)
        └── <DashboardPage> (Page principale)
              ├── <FiltersBar> (Gère le state de filtrage local)
              ├── <KpiCards data={kpis} /> (Composant idiot, pure UI)
              └── <ChartWidget> (Appelle D3.js, très lourd)
```

### 3. Les 4 axes d'analyse Frontend

#### Axe 1 — Modulabilité (Dumb vs Smart Components)
> "Ce composant est-il réutilisable ?"

- [ ] La logique de récupération des données (Fetch/Hooks) est-elle séparée de l'interface visuelle (JSX/Tailwind) ?
- [ ] Les composants de base (Boutons, Inputs, Modales) sont-ils "idiots" (pure props, pas de state interne réseau) ?
- [ ] Faut-il implémenter un **Compound Component** pour rendre cette modale plus flexible ?

#### Axe 2 — Évolutivité & Scalabilité (Bundle)
> "Peut-on rajouter 10 pages sans ralentir le site ?"

- [ ] Faut-il isoler un composant lourd (ex: un Chart Recharts/Three.js) avec un `React.lazy()` pour réduire la taille du bundle initial ?
- [ ] L'organisation des dossiers suit-elle le *Feature-Sliced Design* pour qu'on puisse supprimer un module entier facilement ?

#### Axe 3 — Le cauchemar du State & Prop Drilling
> "L'état est-il placé au bon endroit ?"

- [ ] L'état a-t-il été monté trop haut ? (Ex: mettre l'état d'un champ de texte dans `App.jsx`, provoquant un rendu de tout le site à chaque touche tapée).
- [ ] Passe-t-on la même prop à travers 5 niveaux de composants ? (Prop Drilling). Solution : utiliser la composition de composants (le composant `children`) ou un `Context`.
- [ ] Peut-on **dériver** cette donnée plutôt que de créer un nouveau `useState` ? (Ex: déduire `isEmpty` depuis `items.length`).

#### Axe 4 — Effets de bord et Hooks
> "Les `useEffect` sont-ils propres ?"

- [ ] Y a-t-il un risque de boucle infinie (tableau de dépendances mal configuré) ?
- [ ] La logique métier fait-elle plus de 20 lignes dans le composant ? (Si oui, il faut l'extraire dans un Custom Hook `useMonFeature()`).

### 4. Tests d'évolution React
Dérouler 2 scénarios pour prouver que l'arbre de composants est solide :

```
🧪 Test 1 : "Rendu conditionnel"
- Scénario : On veut pouvoir cacher le <ChartWidget> sur mobile.
- Architecture actuelle : <DashboardPage> charge toutes les datas puis les passe au widget.
- Faille : Même si on le cache avec CSS (hidden), le composant continue de calculer des données lourdes.
- Recommandation : Conditionner le rendu React (`isDesktop && <ChartWidget />`) pour détruire l'instance et libérer la mémoire.

🧪 Test 2 : "Le Prop Drilling"
- Scénario : Le <Avatar> tout au fond du header a besoin du profil utilisateur.
- Faille : La prop `user` passe de App -> Layout -> Header -> Navigation -> Avatar.
- Recommandation : Passer le `user` via le Context API de session (`useSession`) pour que Avatar s'y connecte directement.
```

### 5. Rapport architectural

Générer un rapport recommandant (ou non) des refactorisations de l'arbre React avant de commencer à coder. L'utilisateur décide.

## ✅ Checklist de sortie
- [ ] Arbre des composants esquissé ?
- [ ] Analyse du flux d'état (State/Props) effectuée ?
- [ ] Analyse des performances potentielles (re-renders, lazy loading) ?
- [ ] Rapport présenté à l'utilisateur ?
