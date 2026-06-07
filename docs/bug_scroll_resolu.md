# Rapport de Résolution : Bug de Défilement (Scroll) dans l'Éditeur

**Date de résolution :** Juin 2026

## 1. Description du Bug
Plusieurs comportements anormaux ont été observés concernant le défilement automatique du texte source dans l'éditeur principal :
- Lors de l'application d'une requête dans une pile "multi-stack", le texte ne se déplaçait pas pour s'aligner sur l'élément en cours de modification.
- Lors de la sélection d'un item dans l'historique des versions, le texte source ne scrollait pas jusqu'à l'endroit correspondant à la modification.
- Le texte source scrollait de manière intempestive et inexpliquée vers le haut du fichier dans certaines conditions (souvent de manière isolée, ne se reproduisant plus après la première occurrence).

## 2. Analyse de la Cause Racine
Ce bug particulièrement tenace était causé par une **condition de course (race condition) et un conflit entre différents effets (`useEffect`)** gérant le positionnement du défilement dans l'interface React :
1. **Multiplicité des sources de vérité :** Plusieurs composants ou hooks tentaient de mettre à jour la position de défilement (`scrollTop`) indépendamment, souvent via des compteurs de temps (`setTimeout`) ou des effets réagissant à des variables d'état (state) non synchronisées.
2. **Perte de référence au DOM :** Lorsque le texte source (`CodeEditor`) était mis à jour, le calcul de la position de la cible (via les `marksT2` ou `multiIndices`) s'exécutait parfois avant que le DOM ne soit complètement ré-endu, entraînant des valeurs erronées ou un retour à la position 0 (haut du fichier).
3. **Conflit d'index lors des itérations Multi-Stack :** Pendant l'application successive des requêtes multi-stack, l'index de sélection de l'occurrence active variait trop vite par rapport au cycle de rendu de React, empêchant le déclenchement de l'effet de défilement ou le ciblant sur la mauvaise occurrence.

## 3. Méthode de Résolution Appliquée
Pour résorber définitivement ce problème, l'architecture de défilement a été revue selon les principes suivants :

- **Centralisation de la cible (Single Source of Truth) :** Création d'un état global dédié (`historyScrollTarget` par exemple, sous la forme d'un objet `{ index, timestamp }`). Le `timestamp` permet de forcer le défilement même si on clique deux fois sur le même index.
- **Délégation au composant enfant :** La logique de `scrollIntoView` ou de calcul de `scrollTop` a été encapsulée de manière robuste dans le composant `CodeEditor` (ou son hook associé) à travers un `useEffect` écoutant exclusivement les changements de ce nouvel état ciblé.
- **Nettoyage des effets temporels (Debouncing/Cleanup) :** Suppression des `setTimeout` parasites et mise en place de vérifications strictes pour éviter que des effets retardés ne viennent contredire une nouvelle demande de défilement.
- **Séparation des événements UX :** Dissociation du "changement de texte actif" et de "l'ordre de défilement". Le défilement n'est déclenché qu'une fois la mutation du DOM effectuée.

## 4. Recommandations de Non-Régression
Lors de toute modification future de l'éditeur de code (`CodeEditor.jsx`) ou de l'application de requêtes (`handleReplace` dans `App.jsx`) :
- **Ne jamais rajouter de logique de défilement manuel (`element.scrollTop = ...` ou `element.scrollIntoView()`) hors de l'effet centralisé.**
- Passer par la fonction de mise à jour du state dédié pour ordonner un défilement.
- Tester rigoureusement les actions en rafale (clics rapides dans l'historique) et l'exécution automatique du mode multi-stack pour vérifier qu'aucun bond intempestif ne réapparaît.
