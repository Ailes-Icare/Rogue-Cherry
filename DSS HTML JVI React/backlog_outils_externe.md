# Backlog : Outils, Skills Externes et Serveurs MCP

> Ce document archive les excellentes trouvailles issues de la communauté (Claude Code, Github) pour enrichir notre environnement de développement ultérieurement.

## 1. Outils d'Architecture et d'Agentivité
- **Claude Engineer (Doriandarko)** : Framework permettant à l'IA de créer ses propres outils dynamiquement. Utile comme inspiration pour faire évoluer l'autonomie de notre propre agent sur des tâches répétitives (tests, dépendances).
- **Serveurs MCP (Model Context Protocol)** :
  - **Context7 (upstash/context7)** : Permet d'injecter la documentation officielle et "live" des librairies (Next.js, Tailwind) pour éviter les hallucinations sur les versions récentes. *À configurer prioritairement dans notre IDE/Agent.*
  - **Git-MCP (idosal/git-mcp)** : Permet à l'agent de naviguer, inspecter et commiter précisément dans les dépôts.
  - **Firecrawl (firecrawl/mcp-server)** : Pour scraper la documentation de sites web qui n'ont pas d'API.

## 2. Packs de Skills Communautaires
- **Ay-Skills (AY-Automate/Ay-Skills)** : Pack de skills "production-grade".
  - *À conserver pour plus tard* : L'intégration de **Remotion** (génération de vidéos en React) ou de l'automatisation de navigateur (headless browser).
  - *Intégré immédiatement* : L'approche "Artifact Builder" et "UI/UX Design System" va être fusionnée dans nos skills React de base.

## 3. Standards UI et React Intégrés
*(Note : Ces éléments sont tellement pertinents qu'ils sont directement intégrés dans les nouveaux fichiers `SKILL.md` de notre framework).*
- **Frontend-design (Anthropic)** : Rejet du "vibe coding" générique. Obligation de choisir une direction artistique forte (brutaliste, éditoriale, minimaliste), bannissement des fontes génériques (Inter/Roboto) au profit de typographies de caractère, utilisation intentionnelle des espaces et animations complexes.
- **Patterns React Modernes** : Utilisation stricte des *Compound Components* (façon Radix UI) et adoption des standards React 19 (remplacement de `forwardRef` par le nouveau hook `use()`).

## Prochaines étapes (TODO)
- [ ] Étudier la faisabilité d'ajouter `Context7` à notre configuration MCP locale.
- [ ] Explorer `Ay-Skills` pour l'automatisation SEO si le projet l'exige.
