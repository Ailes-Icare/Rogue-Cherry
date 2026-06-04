# Kit SDD — Spec-Driven Development pour Google Antigravity (Édition React)

> **Version** : 2.0 (React/Web)  
> **Créé** : 2026-05-15  
> **Auteur** : tounnis (avec Antigravity)

## C'est quoi ce kit ?

Ce kit est un **environnement de développement complet** qui transforme la façon dont tu travailles avec l'IA. Au lieu du vibe coding (décrire vaguement → l'IA code → ça casse), tu utilises le **Spec-Driven Development** :

```
TU rédiges les specs → TU valides le plan → L'IA code → L'IA prouve que ça marche
```

**Toi** = le cerveau qui décide. **L'IA** = les mains qui exécutent.
Cette édition spéciale a été entièrement réécrite pour dominer l'écosystème **React / Vite / Tailwind / Node.js**.

## Structure du kit

```
DSS HTML JVI React/
├── .gemini/rules/          ← Règles que l'IA suit toujours
│   ├── core.md             ← Règles fondamentales (10 règles)
│   ├── sdd.md              ← Méthodologie SDD
│   ├── coding.md           ← Standards de code React/Tailwind
│   └── context.md          ← Contexte utilisateur (niveau, préférences)
│
├── .agent/
│   ├── rules/              ← Copie des règles (double emplacement)
│   ├── workflows/          ← Commandes que tu peux lancer (20 workflows)
│   │   ├── plan.md         ← /plan : Planification stratégique
│   │   ├── new-project.md  ← /new-project : Créer un projet React
│   │   ├── spec.md         ← /spec : Rédiger des specs
│   │   ├── archi.md        ← /archi : Vaccin architectural
│   │   ├── implement.md    ← /implement : Coder depuis les specs
│   │   ├── test.md         ← /test : Créer/lancer des tests Vitest
│   │   ├── audit.md        ← /audit : Vérifier la cohérence
│   │   ├── debug.md        ← /debug : Corriger un bug
│   │   ├── refactor.md     ← /refactor : Restructurer du code
│   │   ├── optimize.md     ← /optimize : Optimiser (re-renders, perf)
│   │   ├── optimize-all.md ← /optimize-all : Optimisation globale
│   │   ├── review.md       ← /review : Revoir le code
│   │   ├── learn.md        ← /learn : Comprendre un concept
│   │   ├── post-mortem.md  ← /post-mortem : Analyse systémique des erreurs
│   │   ├── think.md        ← /think : Moteur de réflexion sur le design
│   │   ├── integrate.md    ← /integrate : Vérification d'intégration ciblée
│   │   ├── integrate-all.md ← /integrate-all : Intégration globale du projet
│   │   ├── help.md         ← /help : Guide utilisateur interactif
│   │   ├── upgrade-kit.md  ← /upgrade-kit : Mettre à jour le kit
│   │   └── kit.md          ← /kit : Gérer les composants du kit
│   └── skills/             ← Guides détaillés pour l'IA (8 skills)
│       ├── spec-writing/                  ← Comment écrire de bonnes specs Frontend
│       ├── react-architecture/            ← Comment structurer un projet React
│       ├── testing/                       ← Comment tester avec Vitest/Jest
│       ├── javascript-react-intermediate/ ← Standards Frontend Senior (ex: react-senior)
│       ├── large-projects/                ← Gérer les gros projets
│       ├── react-patterns/                ← Garde-fou patterns de conception
│       ├── frontend-design/               ← Standards UI et UX
│       └── state-management/              ← Gestion de l'état (Zustand, Context)
│
├── outils/                 ← Serveurs MCP (tools pour l'IA)
│   ├── analyseur_code.py   ← Point d'entrée MCP (7 tools pour le Web)
│   ├── _mcp_utils.py       ← Fonctions partagées
│   ├── _mcp_*.py           ← Un fichier par tool
│   └── README.md           ← Tutoriel d'installation
│
├── modules/                ← Spécialisations par domaine (Boilerplates)
│   ├── dashboards/         ← Data Viz (D3.js, Recharts, gros tableaux)
│   ├── ecommerce/          ← Boutiques en ligne (Next.js, Stripe, Cart)
│   ├── landing-pages/      ← Vitrines marketing (Framer Motion, SEO)
│   ├── games/              ← Jeux web (React Three Fiber, Canvas)
│   ├── simulators/         ← Simulateurs complexes (Web Workers)
│   ├── hardware/           ← Contrôle de machines (Web Serial API)
│   └── desktop/            ← Apps natives via le web (Tauri / Electron)
│
├── templates/              ← Structure type pour nouveau projet
│   └── project-template/   ← Copié lors de /new-project
│       └── docs/
│           ├── SPECS.md
│           ├── ARCHITECTURE.md
│           ├── CHANGELOG.md
│           ├── DECISIONS.md     ← Journal des décisions techniques
│           ├── GLOSSARY.md
│           └── reference/       ← Données de domaine (constantes, design tokens)
│
├── tests/                  ← Tests du framework
│   └── test_analyseur_code_react.py ← Test du serveur MCP React
│
├── TUTORIAL.md             ← Tutoriel d'utilisation du framework
└── README.md               ← Ce fichier
```

## Cycle de développement

```
/plan → /spec → /archi → /implement → /test → /optimize
                                    ↑                    ↓
                                    └── /audit ← /review ←
```

## Commandes rapides

| Commande | Quand l'utiliser |
|---|---|
| `/plan` | **Début de projet** — Vision, modules, choix techniques, roadmap |
| `/new-project` | Créer la structure de fichiers du projet |
| `/spec` | Rédiger ou modifier les specs d'une feature |
| `/archi` | Vérifier modularité, évolutivité et solidité avant de coder |
| `/implement` | Coder une feature à partir de specs validées |
| `/test` | Créer et lancer les tests |
| `/audit` | Vérifier que le code correspond aux specs |
| `/debug` | Corriger un bug de manière structurée |
| `/refactor` | Réorganiser le code sans changer le comportement |
| `/optimize` | Optimiser le code (Re-renders) ou résoudre un problème précis |
| `/optimize-all` | Grand nettoyage : scanner tout le projet |
| `/review` | Checklist de qualité du code |
| `/learn` | Comprendre un concept avec analogies et exemples |
| `/post-mortem` | Analyser les erreurs systémiques et améliorer le kit |
| `/think` | Valider la logique et la solidité d'un design |
| `/integrate` | Vérifier l'intégration d'un module (imports, props) |
| `/integrate-all` | Vérification d'intégration globale du projet |
| `/help` | Guide : choisir le bon workflow, écrire de bons prompts |
| `/upgrade-kit` | Mettre à jour le kit SDD dans un projet existant |
| `/kit` | Créer, modifier ou supprimer un composant du kit |

## Les 10 règles d'or

1. **✋ L'humain décide** — L'IA propose, tu valides
2. **🚫 Pas de code sans specs** — Toujours spécifier avant de coder
3. **📏 Changement minimal** — Le moins de lignes modifiées possible
4. **🔍 Honnêteté absolue** — Ne jamais mentir sur l'état du code
5. **📖 Tout documenter** — Specs, architecture, décisions, changelog, en français
6. **💬 Communication claire** — Pas de jargon, commentaires en français
7. **🛡️ Intégrité du projet** — Ne jamais supprimer de code sans validation
8. **🔧 Consultation auto** — L'IA consulte skills, modules et MCP automatiquement
9. **♻️ Ne pas réinventer la roue** — Scanner le code existant avant de créer
10. **✅ Checklists obligatoires** — Remplir la checklist de sortie de chaque workflow
