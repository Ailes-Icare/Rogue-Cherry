---
trigger: always_on
---

# Règles Fondamentales — Core Rules

> Ces règles sont TOUJOURS actives, pour TOUS les projets. Elles ne peuvent pas être ignorées.

## 1. L'humain décide, l'IA exécute

- **L'IA est un outil**, pas le chef de projet.
- Toute **décision architecturale** (nouveau composant, structure d'état, choix de lib npm) doit être **proposée et validée par l'utilisateur** AVANT d'être implémentée.
- Les **petits détails techniques** (noms de variables, formatage Tailwind, optimisation mineure) peuvent être gérés par l'IA sans demander.
- **En cas de doute, demander.** Mieux vaut une question de trop qu'un composant mal structuré.

## 2. Pas d'implémentation sans specs

- Chaque feature (page, composant complexe, hook) doit d'abord être décrite dans `docs/SPECS.md` avant d'être codée.
- Si les specs n'existent pas ou sont floues, l'IA doit **d'abord rédiger/clarifier les specs** et les faire valider.
- Le code DOIT correspondre aux specs. Si le rendu visuel ou le comportement diverge, c'est un bug.

## 3. Changement minimal obligatoire

- Chaque modification doit toucher le **minimum de lignes/composants nécessaire**.
- Avant d'implémenter, l'IA montre le **plan des fichiers touchés** et le nombre estimé de lignes modifiées.
- Si un changement touche **> 50 lignes**, l'IA doit **expliquer pourquoi** et obtenir validation.
- **Interdit** : réécrire un composant entier pour corriger un petit bug UI ou ajouter une petite feature. Modifier uniquement les props ou classes Tailwind concernées.

## 4. Honnêteté absolue

- L'IA ne doit **jamais mentir** sur l'état du code ou de l'interface.
- Si l'IA ne sait pas si une feature est implémentée, elle doit **vérifier dans le code** (pas deviner).
- Si une erreur React se produit (ex: undefined is not a function), le dire clairement au lieu de contourner le problème.
- Si une tâche est trop complexe pour le contexte actuel, le signaler.

## 5. Documentation vivante

- Le `CHANGELOG.md` est mis à jour après chaque composant/page significatif.
- Les `SPECS.md` sont mises à jour quand la maquette ou la logique change.
- L'`ARCHITECTURE.md` est mis à jour quand la structure du projet (nouveaux dossiers, routing) change.
- Le `DECISIONS.md` est mis à jour quand un **choix technique ou architectural** est fait ou rejeté.
- Le dossier `docs/reference/` contient les **données de domaine** (tokens de design, constantes API). L'IA ne doit **jamais inventer** une valeur de domaine — toujours vérifier `docs/reference/` d'abord.
- **Langue** : Toute documentation est en **français**.

## 6. Communication claire

- L'IA utilise un langage simple et accessible, pas du jargon inutile.
- Quand un concept technique (React, Hooks) est nécessaire, l'IA l'**explique brièvement**.
- Le code contient des **commentaires en français** pour les sections non évidentes (ex: `useEffect` complexe).

## 7. Intégrité du projet

- **Ne jamais supprimer** du code fonctionnel sans validation explicite de l'utilisateur.
- **Ne jamais modifier** un fichier qui n'est pas directement lié à la tâche en cours.
- En cas de refactoring d'un composant partagé, **lister toutes les pages/composants impactés** et obtenir validation.

## 8. Consultation automatique des ressources

- **Skills** (`.agent/skills/`) : L'IA doit **automatiquement consulter** le skill pertinent avant une tâche spécialisée.

- **Outils MCP** (`outils/`) : Si un serveur MCP d'analyse de code est disponible, l'utiliser pour l'arborescence, les dépendances (imports React inutilisés), etc.
- Le domaine du projet est indiqué dans le `README.md` du projet.
- L'utilisateur n'a **pas besoin de rappeler** à l'IA de consulter ces fichiers.

## 9. Réutilisation obligatoire — Ne pas réinventer la roue

> [!NOTE] 
> **Note :** Cette règle s'applique particulièrement aux **Composants UI** et aux **Custom Hooks**.

- Avant de **créer un nouveau composant (bouton, carte, input) ou hook**, l'IA doit **chercher dans le code existant** (`src/components/`, `src/hooks/`) si un équivalent existe.
- Si un composant existe → l'**importer** et l'utiliser avec ses props, pas en recréer un.
- Si un composant **presque similaire** existe → le **généraliser** (par ex. en ajoutant des props comme `variant`, `size`) au lieu de créer un doublon.
- **Créer un composant UI en doublon est considéré comme un bug**, au même titre qu'un crash.
- Cette règle s'applique à **tous les contextes** : un formulaire d'édition DOIT réutiliser les mêmes composants UI que le formulaire de création.

## 10. Checklists de sortie obligatoires

- Quand un workflow a une section `✅ Checklist de sortie`, l'IA **DOIT** la remplir explicitement avant de déclarer le workflow terminé.
- Chaque item de la checklist doit être marqué ✅ ou ❌ avec justification.
- **Interdit** : conclure un workflow en ignorant sa checklist de sortie.
