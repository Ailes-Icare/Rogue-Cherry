# RULE STORY V8 — Moteur Smart Replace

## Contexte
Le moteur de remplacement intelligent (Smart Replace) a été développé et stabilisé au cours des sessions V8.
Il est activé par la balise `[SMART:TRUE]` dans les requêtes formatées, ou par la case à cocher "Concilier les espaces (Smart Replace)" dans l'interface utilisateur.

## Comportement MANDATORY

### Gestion de la casse
- Quand le mode Smart est actif, la recherche est **insensible à la casse** (case-insensitive).
- Si un mot du texte de remplacement est identique (en lowercase) à un mot du texte recherché, le moteur **préserve la casse d'origine** du document source.
- Exemple : si le document contient `Fin`, que la requête cherche `FIN` et remplace par `fin`, le résultat sera `Fin` (casse d'origine conservée).
- Si un mot est réellement modifié (pas le même en lowercase), la casse de la requête de remplacement est utilisée telle quelle.

### Gestion des espaces (Indentation)
- Quand le mode Smart est actif, les espaces du texte recherché sont traités comme des jokers d'espace (`\s+`).
- Le moteur reconstruit le texte de remplacement en **réinjectant les espaces d'origine** du document source entre les tokens non-espace.
- Cela permet à une IA de fournir un texte recherché avec une indentation légèrement différente de celle du document, sans bloquer la recherche.

### Algorithme
- Le moteur fonctionne par tokenisation : il sépare les mots et les espaces, puis reconstruit un texte hybride.
- Si le nombre de tokens non-espace entre find et replace est identique : reconstruction 1:1 avec les espaces d'origine.
- Si le nombre diffère : le moteur préserve au mieux la casse des mots inchangés par correspondance séquentielle.

## Fichier source
- `src/hooks/useHistoryStore.js` — fonction `applyDeltaOnText`, branche `if (ignoreSpaces)`.

## Règle
> **Le moteur Smart Replace gère simultanément la casse et les espaces. Ces deux fonctions sont indissociables : activer Smart, c'est activer les deux. Il n'y a pas de mode "espaces seuls" ou "casse seule".**
