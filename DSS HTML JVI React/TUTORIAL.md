# 📘 Tutorial — Kit SDD (Spec-Driven Development) pour le Web

> **Pour qui** : Toi, quand tu reviens après une pause et que tu te souviens plus comment ça marche.  
> **Durée de lecture** : 5 minutes.  
> **Mis à jour** : 2026-05-15 (Édition React)

---

## C'est quoi ce kit ?

Un **système de navigation** pour coder avec une IA sans perdre le contrôle.

> Analogie : Tu es le capitaine d'un bateau. L'IA est un équipage ultra-compétent mais qui fait exactement ce qu'on lui dit — même si c'est une mauvaise idée. Le kit, c'est les cartes marines, le compas et les procédures de bord qui empêchent le bateau de foncer dans un récif.

**Le principe central** :
```
Tu décides QUOI construire  →  Les specs le documentent  →  L'IA le code  →  Les tests le prouvent
```

Jamais l'inverse. Si le code fait un truc que les specs ne disent pas, c'est un bug.

---

## Les 4 couches du kit

```
┌─────────────────────────────────────────────────────────┐
│  RULES (4 fichiers)                                     │
│  Toujours actives, l'IA les suit automatiquement        │
│  → 10 règles fondamentales, standards React/Tailwind,   │
│    méthodologie SDD, ton profil                         │
├─────────────────────────────────────────────────────────┤
│  WORKFLOWS (20 slash-commands)                          │
│  Tu les appelles quand t'en as besoin                   │
│  → /spec, /implement, /test, /audit, /debug...          │
├─────────────────────────────────────────────────────────┤
│  SKILLS (8 guides)                                      │
│  L'IA les consulte automatiquement quand c'est pertinent│
│  → react-architecture, testing, state-management...     │
├─────────────────────────────────────────────────────────┤
│  MCP TOOLS (7 outils d'analyse Web)                     │
│  L'IA les utilise pour scanner ton code en temps réel   │
│  → CSS inline, prop-drilling, imports morts, arbo       │
└─────────────────────────────────────────────────────────┘
```

---

## Les 5 workflows que tu utiliseras le plus

### 1. `/spec` — Définir ce que tu veux

**Quand** : Tu as une idée de feature.  
**Ce que ça fait** : L'IA te pose des questions, puis écrit une spec claire dans `docs/SPECS.md`.  
**Résultat** : Un texte qui décrit exactement ce que la feature fait (UI, UX, Responsive, State), ne fait pas, et comment vérifier qu'elle marche.

```
Toi : "Je veux une barre de navigation qui se transforme en burger menu sur mobile"
IA  : → rédige la spec avec comportements Tailwind, limites, et critères de validation
Toi : → tu valides ou tu corriges
```

### 2. `/implement` — Coder la feature

**Quand** : La spec est validée.  
**Ce que ça fait** : L'IA code exactement ce que la spec dit, ni plus ni moins.  
**Résultat** : Du code React qui correspond aux specs + des tests de base.

### 3. `/test` — Vérifier que ça marche

**Quand** : Après un `/implement`.  
**Ce que ça fait** : Crée des tests (Vitest / React Testing Library) basés sur les critères de validation de la spec.  
**Résultat** : Des tests qui passent = la preuve que le code fait ce qu'il doit faire.

### 4. `/audit` — Vérifier la cohérence

**Quand** : Début de session, ou quand t'as un doute.  
**Ce que ça fait** : Compare le code aux specs. Tout ce qui est marqué 🟢 est-il vraiment implémenté ?  
**Résultat** : Un rapport honnête de l'état réel du projet Frontend.

### 5. `/debug` — Corriger un bug

**Quand** : Un truc marche pas.  
**Ce que ça fait** : Processus structuré : reproduire → localiser → proposer le fix → valider → corriger.  
**Ce que ça empêche** : L'IA qui réécrit tout un composant "au cas où" au lieu de trouver la vraie cause du bug.

---

## Les autres workflows (quand t'en as besoin)

| Commande | En une phrase | Quand |
|----------|--------------|-------|
| `/plan` | Vision globale du projet | Tout début, avant de coder |
| `/archi` | L'architecture va-t-elle bien vieillir ? | Après /spec ou /plan |
| `/think` | Le design tient-il debout ? | Quand un truc "cloche" |
| `/review` | Le code est-il propre ? | Après un `/implement` |
| `/refactor` | Restructurer sans changer le comportement | Quand le code devient sale |
| `/optimize` | Améliorer les performances (Re-renders) | Après un `/implement` |
| `/optimize-all` | Scanner tout le projet | Quand le projet a grandi |
| `/integrate` | Le câblage entre fichiers est-il bon ? | Après un refactoring |
| `/integrate-all` | Vérifier tout le câblage | Avant une release |
| `/post-mortem` | Pourquoi ça a cassé ? | Après un gros bug |
| `/new-project` | Créer la structure d'un projet Web | Une seule fois |
| `/upgrade-kit` | Mettre à jour le kit dans un vieux projet | Quand le kit a évolué |
| `/kit` | Ajouter/modifier un composant du kit | Quand le kit doit changer |
| `/learn` | Expliquer un concept | Quand tu comprends pas un truc |
| `/help` | Quel workflow utiliser ? | Quand t'es perdu |

---

## Le cycle de travail typique

```
Début de session
    │
    ├── /audit (optionnel — vérifier l'état)
    │
    ├── /spec nouvelle [feature]
    │     └── Tu valides la spec
    │
    ├── /archi [feature] (si structurel)
    │     └── L'architecture est-elle modulable ?
    │
    ├── /implement [feature]
    │     └── L'IA code selon la spec
    │
    ├── /test [feature]
    │     └── Les tests passent ?
    │           ├── OUI → /review (optionnel)
    │           └── NON → /debug
    │
    └── Prochaine feature → retour à /spec
```

---

## Les 10 règles d'or (rappel)

1. **✋ L'humain décide** — L'IA propose, tu valides
2. **🚫 Pas de code sans specs** — Toujours spécifier avant de coder
3. **📏 Changement minimal** — Le moins de lignes modifiées possible
4. **🔍 Honnêteté absolue** — Ne jamais mentir sur l'état du code
5. **📖 Tout documenter** — Specs, architecture, décisions, changelog
6. **💬 Communication claire** — Pas de jargon, commentaires en français
7. **🛡️ Intégrité du projet** — Ne jamais supprimer de code sans validation
8. **🔧 Consultation auto** — L'IA consulte les skills et MCP automatiquement
9. **♻️ Ne pas réinventer la roue** — Scanner le code existant avant de créer
10. **✅ Checklists obligatoires** — Remplir la checklist de sortie de chaque workflow

---

## Les 7 outils MCP (analyse automatique Web)

L'IA utilise ces outils **automatiquement** quand c'est pertinent. Tu n'as rien à faire.

| Outil | Ce qu'il fait | Exemple d'utilisation |
|-------|--------------|---------------------|
| `arborescence_react` | Vue complète du projet | Début d'audit |
| `rapport_composants` | Liste tous les composants et hooks | Chercher où ajouter du code |
| `detecter_anti_patterns`| Scan le CSS inline, Prop Drilling | Diagnostic rapide |
| `dependances_react` | Graphe des imports internes | Comprendre qui dépend de qui |
| `imports_inutiles_js`| Trouve les imports JS inutilisés | Nettoyage |
| `doublons_composants`| Détecte les composants dupliqués | Règle #9 |
| `couverture_tests_react`| Fichiers sans .test.jsx | Avant de créer des tests |

---

## Structure d'un projet créé avec le kit

```
mon-projet/
├── .gemini/rules/        ← Rules (l'IA les suit toujours)
├── .agent/
│   ├── workflows/        ← Les 20 slash-commands
│   └── skills/           ← Les 8 guides Frontend
├── docs/
│   ├── SPECS.md          ← Source de vérité (ce que le projet FAIT)
│   ├── ARCHITECTURE.md   ← Structure du projet React
│   ├── DECISIONS.md      ← Choix techniques (Zustand, Tailwind)
│   ├── CHANGELOG.md      ← Historique des changements
│   └── reference/        ← Données de domaine
├── src/                  ← Le code source (components, hooks, features)
├── tests/                ← Les tests Vitest
└── README.md             ← Présentation du projet
```

---

## Astuces pratiques

### "Je sais pas par où commencer"
→ Tape `/help`. L'arbre de décision te guide.

### "Le projet existe déjà mais n'a pas le kit"
→ Utilise `/upgrade-kit` pour copier le kit dans un projet existant.

### "L'IA a fait n'importe quoi"
→ C'est probablement parce que la spec était floue. Corrige la spec d'abord (`/spec modifier`), puis relance l'implémentation.

### "J'ai un doute sur l'état du projet"
→ `/audit`. Toujours `/audit`. C'est le scanner complet du projet.

### "Le code marche mais c'est le bordel"
→ `/review` pour diagnostiquer, puis `/refactor` si nécessaire.

### "J'ai ajouté 5 features sans vérifier"
→ `/integrate-all` + `/optimize-all`. Ça prend du temps mais ça rattrape la dette technique.
