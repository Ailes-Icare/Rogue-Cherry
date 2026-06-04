---
description: Créer ou modifier des spécifications UI/UX pour une feature web
---

# /spec — Rédiger ou modifier des spécifications

## Usage
- `/spec nouvelle [nom]` — Créer les specs d'un composant ou d'une page
- `/spec modifier [nom]` — Modifier les specs d'une feature existante
- `/spec lister` — Lister toutes les features et leur statut

## Étapes pour une NOUVELLE spec

### 1. Comprendre le besoin (Focus UI/UX)
Demander à l'utilisateur :
- **À quoi ressemble l'interface visuellement ?**
- **Comment l'utilisateur interagit-il avec ?** (Clics, survols, formulaires)
- **D'où viennent les données ?** (Mockées, Context, API externe)

### 2. Rédiger la spec
> 💡 Utiliser strictement le format défini par le skill `spec-writing` pour forcer la prise en compte des états dynamiques du web.

Ajouter dans `docs/SPECS.md` une nouvelle section :

```markdown
---

## [Nom du Composant ou Page]

**Statut** : 🔴 Non implémenté

**Description** : [Ce que fait ce composant sur la page]

**Design Visuel & Responsive** :
- Aspect (ex: "Carte blanche avec bords arrondis xl, style minimaliste")
- Mobile (<768px) : [Layout empilé]
- Desktop (>768px) : [Layout en grille]

**États Interactifs (UI States)** :
- **Hover/Active** : [ex: Le bouton remonte légèrement au survol]
- **Loading** : [ex: Skeletons animés au lieu du texte]
- **Erreur** : [ex: Toast rouge en bas d'écran]
- **Empty** : [ex: "Aucune donnée trouvée" si le tableau est vide]

**Gestion d'état (State & Props)** :
- State local : [ex: `isOpen` pour une modale]
- Props attendues : [quelles données parentes le composant reçoit]

**Comportement attendu (User Flow)** :
1. Quand [l'utilisateur tape dans l'input], alors [le bouton Valider devient cliquable]
2. Quand [clic sur Valider], alors [API est appelée, état passe en Loading]

**Critères de validation** :
- [ ] [Test UI 1 - Responsive]
- [ ] [Test UI 2 - Comportement du chargement]
```

### 3. Faire valider
Montrer la spec à l'utilisateur et demander :
- Est-ce que les états de chargement (Loading) et d'erreur correspondent à la charte ?
- La gestion responsive convient-elle ?
- Le flux d'interaction (clic, attente, résultat) est-il complet ?

### 4. Mettre à jour le changelog
Dans `docs/CHANGELOG.md`, ajouter :
```
## [Date]
- SPEC : Ajout de la spécification "[Nom de la feature]"
```

## Étapes pour MODIFIER une spec

### 1. Montrer la spec actuelle
Afficher la spec existante à l'utilisateur.

### 2. Identifier les changements
Demander ce qui doit changer (ex: "On veut transformer le menu simple en Mega-Menu").

### 3. Proposer la modification
Montrer un diff clair (avant → après) de la spec. Insister sur les nouveaux états UI requis.

### 4. Vérifier l'impact React
Si le composant est déjà implémenté (🟢), un changement de spec implique un changement JSX ou un changement de Hooks. Lister les fichiers impactés.

### 5. Faire valider et mettre à jour
Validation utilisateur + mise à jour du changelog.

## Règles
- Une spec web ne doit **jamais omettre** les états de chargement (Loading) et d'erreur.
- Si le composant s'appuie sur une librairie externe (ex: `Recharts` pour un graphe), préciser la librairie.
- Chaque spec doit avoir des **critères de validation** testables (ex: "Cliquer hors de la modale la ferme").

## ✅ Checklist de sortie (obligatoire avant de conclure)
- [ ] Spec validée par l'utilisateur ?
- [ ] `docs/CHANGELOG.md` mis à jour ?
- [ ] États interactifs (Hover, Loading, Erreur) explicitement définis ?
- [ ] Critères de validation (tests UI) définis ?
