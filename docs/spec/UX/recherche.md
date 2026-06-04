# Spécifications : Moteur de Recherche Commun (DraftSearch — Recherche & Lightmaps/Heatmaps)

**Contexte** : Algorithmes partagés de recherche dynamique et d'analyse de conformité (`src/utils/diffEngine.js`).

Ce document regroupe les spécifications du moteur de recherche DraftSearch sous-jacent à l'ensemble des modules de l'application (Sidebar gauche, Recherche globale centrale, et Débogueur).

---

## 1. Similarité Sémantique et Alignement (`getSimilarity`)

Pour évaluer la correspondance entre des blocs textuels, Rogue Cherry s'appuie sur un indice de similarité de Jaccard basé sur les tokens :
- **Découpage** : Les chaînes de caractères sont découpées en jetons (tokens) alphanumériques via l'expression régulière `/[a-zA-Z0-9\-_]+/g`.
- **Calcul** : L'indice est égal au ratio entre la taille de l'intersection des ensembles de tokens et la taille de leur union.
- **Résultat** : Un coefficient réel compris entre `0.0` (aucune ressemblance) et `1.0` (identité parfaite).

---

## 2. Algorithme de Recherche et Lightmap/Heatmap DraftSearch (`computeSearchHeatmap`)

La fonction `computeSearchHeatmap` (moteur DraftSearch) prend en entrée le texte source global (`sourceText`), la chaîne recherchée (`searchStr`), et le flag `ignoreSpaces` (Smart Mode). Elle retourne le pourcentage de conformité de la meilleure occurrence trouvée (`foundRatio`) et la liste des marques de surbrillance (`marks`).

### 2.1 Mode SMART (Tolérant aux espaces et à la casse)
- **Fonctionnement** : Si `ignoreSpaces = true`, la recherche découpe la chaîne recherchée par ses espaces blancs (`/\s+/`) et compile dynamiquement une expression régulière insensible à la casse (`gi`) en insérant le motif de tolérance `\s+` entre chaque token.
- **Résultat** : Toutes les occurrences correspondantes dans le texte source sont immédiatement surlignées en Jaune Vif via la Lightmap DraftSearch (classe `.hl-yellow`, considéré comme une similarité de 100%).

### 2.2 Mode Dichotomique (Recherche d'extrait approximatif)
Si `ignoreSpaces = false`, l'algorithme cherche à localiser le plus grand segment commun entre la chaîne recherchée et le code source :
1.  **Dichotomie** : Une recherche binaire détermine la longueur maximale $M$ (comprise entre 1 et la longueur de la recherche) pour laquelle au moins une sous-chaîne de la recherche existe textuellement dans le code source.
2.  **Ratio de Similarité** : Le ratio est calculé par la formule :
    $$Ratio = \frac{\text{Longueur du plus grand segment commun}}{\text{Longueur totale de la recherche}}$$
3.  **Classes de Surlignage (Lightmap/Heatmap DraftSearch)** : Les occurrences du plus grand segment trouvé sont injectées dans l'éditeur avec une classe CSS dépendant de ce ratio :

| Ratio de similarité | Classe CSS | Rendu Visuel |
|---|---|---|
| **100% (Ratio = 1.0)** | `.hl-yellow` | Jaune vif (correspondance exacte) |
| **>= 80%** | `.hl-find-80` | Jaune or / doré |
| **>= 50%** | `.hl-find-50` | Orange |
| **< 50%** | `.hl-find-10` | Rouge-Orange (faible correspondance) |

---

## 3. Le Concept de l'Échappement de Sécurité DraftSearch (Escape Hatch)

La recherche en temps réel (déclenchée à chaque frappe de touche) peut saturer le thread principal Javascript si le fichier source est volumineux et que la chaîne de recherche est trop courte. Pour prévenir cela, une sécurité est partagée par l'ensemble des modules :

### 3.1 Limites par défaut
-   **Taille maximale du fichier (`maxLines`)** : 500 lignes.
-   **Longueur minimale du texte (`minChars`)** : 3 caractères.

### 3.2 Déclenchement de la sécurité
Si le nombre de lignes du texte source est **strictement supérieur** à `maxLines` ET que la longueur de la chaîne recherchée (non vide) est **strictement inférieure** à `minChars` :
-   Le moteur de recherche dynamique DraftSearch se met en veille.
-   Les calculs de Lightmap DraftSearch (heatmap) et de ratio sont suspendus (aucun lag de frappe).
-   Un bandeau d'avertissement jaune (ou rouge dans la modale) s'affiche, invitant l'utilisateur à double-cliquer pour forcer l'override si nécessaire.
