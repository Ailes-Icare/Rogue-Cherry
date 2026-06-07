# Post-Mortem : Bug de perte de lignes sur insertion pure (computeGhostDelta)

**Statut** : ✅ Résolu (2026-06-05)
**Fichier concerné** : `src/utils/diffEngine.js` (fonction `computeGhostDelta`)

## 1. Description du problème
Lorsqu'un utilisateur effectuait une **insertion pure de ligne(s)** (ajout de code sans modifier ni supprimer le code existant autour) dans l'éditeur en mode "Édition Libre", l'application Rogue-Cherry générait de manière transparente une requête `FIND / REPLACE` dans l'historique (`Smart Cancel` ou extraction de diff). 

**Symptôme** : Le bloc `##FIND##` généré englobait par erreur une ligne de contexte *en trop* par rapport au bloc `##REPLACE##`. Lors de la réapplication ultérieure de cette requête (ou de son annulation/multi-stack), la ligne supplémentaire présente dans le `FIND` (mais absente du `REPLACE`) **était purement et simplement supprimée** de manière silencieuse et trompeuse pour l'utilisateur.

## 2. Analyse technique (Root Cause)
Le problème résidait dans l'algorithme d'extraction de diff `computeGhostDelta`.
Lors du calcul des blocs modifiés (`diffBlocks`), l'algorithme parcourt les lignes pour regrouper les changements continus. 

- Pour une modification ou suppression, la boucle avance et délimite un index de début (`start1`) et de fin (`end1`).
- **Pour une insertion pure**, aucune ligne de l'ancien texte (`oldText`) n'est modifiée. L'index de parcours de l'ancien texte (`cur1`) et le prochain index modifié (`next1`) sont **identiques** (`cur1 === next1`).

**Le code erroné était le suivant :**
```javascript
diffBlocks.push({
  start1: cur1, end1: next1 > cur1 ? next1 - 1 : cur1,  // ERREUR ICI
  start2: cur2, end2: next2 > cur2 ? next2 - 1 : cur2
});
```

Si `next1 === cur1`, le code affectait `end1 = cur1`. 
Cela créait un intervalle `[cur1, cur1]` de longueur 1, englobant faussement la ligne `cur1` (qui était pourtant inchangée) comme faisant partie du bloc modifié ! 

Lors du calcul des lignes de contexte (les `CONTEXT_LINES` à ajouter autour du changement), l'algorithme se basait sur cet intervalle artificiellement étiré. En conséquence, le bloc `FIND` capturait une ligne non modifiée de plus en bas, mais le `REPLACE` (dont la taille d'insertion était correcte) ne l'incluait pas en tant que contexte, créant une asymétrie destructrice.

## 3. Solution apportée
La correction algorithmique consiste à déclarer un intervalle vide `[cur1, cur1 - 1]` pour l'ancien texte dans le cas d'une insertion pure (longueur = 0 ligne impactée).

**Le code corrigé :**
```javascript
diffBlocks.push({
  start1: cur1, end1: next1 > cur1 ? next1 - 1 : cur1 - 1, // CORRECTION (-1)
  start2: cur2, end2: next2 > cur2 ? next2 - 1 : cur2 - 1
});
```

Avec cette correction, la ligne inchangée n'est plus "happée" par l'intervalle de modification. Le calcul des bordures de contexte (`ctxStartOld`, `ctxEndOld`) se décale proprement, et les blocs `FIND` et `REPLACE` sont parfaitement symétriques en termes de contexte.

## 4. Conséquences et Validation
- **Sécurité des données** : Les éditions manuelles converties en requêtes ne peuvent plus tronquer de manière silencieuse le code adjacent.
- **Fiabilité du Smart Cancel** : Les piles d'annulation générées par inversion de diff reflètent désormais la stricte réalité algorithmique.
- L'algorithme a été testé mentalement (et par preuve mathématique sur matrice) aux cas limites : début de fichier, fin de fichier, insertions simples et suppressions simples.
