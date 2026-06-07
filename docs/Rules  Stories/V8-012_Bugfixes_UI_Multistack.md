# [DONE] V8 - Corrections de Bugs UI et Exécution Multistack

## Demande d'origine (Verbatim)

**Point 1 :** Légère régression. Tu as b... Les textes « AVANT », « APRÈS » ainsi que le commentaire de la Sidebar Droite sont écrits beaucoup plus petit que les autres textes... Vérifie que ces valeurs soient bien homogènes et identiques aux autres textes.

**Point 2 :** Modale Debug - Contrôles... Les contrôles « Smart », « Multi », « Commentaire » et « Label » sont dégrisés mais inopérants. La bascule des tags dans la box de texte elle-même est impossible quand on utilise ces éléments d'UI, et les inputs textes n'ont aucun effet sur le code dans la fenêtre au-dessus.

**Point 3 :** Multi-stack... Lorsque je clique sur « Appliquer la pile », la première requête s'applique correctement, mais une alarme se déclenche immédiatement en m'indiquant que la requête 1 n'a pas été trouvée, arrêtant ainsi tout le processus. Il semblerait que le système tente d'appliquer la même requête une seconde fois alors que le texte a déjà été modifié. Appliquer les requêtes une par une fonctionne.

## Résolution et Règles techniques (Mandatory)

1. **Régression de police (Sidebar Droite)** : L'homogénéisation des tailles de polices doit être maintenue (`useZoomable` à 14px et les petits labels en `text-xs` ou 12px) pour respecter la cohérence globale de l'application.
2. **SmartDebugger et requêtes invalides** : L'interface utilisateur de débogage ne doit jamais échouer silencieusement. Si la syntaxe brute est invalide, les contrôles UI (Smart, Multi, Label, Commentaire) doivent quand même pouvoir fonctionner en modifiant chirurgicalement les en-têtes sans effacer le reste du texte saisi par l'utilisateur.
3. **Validation asynchrone Multistack** : Lors du traitement d'une pile de requêtes, il est interdit d'évaluer la présence d'une occurrence (`testOccs`) avec l'état différé du store (`store.currentText`) si le texte a été modifié de façon synchrone dans la même boucle. Il faut générer et faire transiter la variable `latestText` pour éviter les faux-positifs d'erreur (erreur d'index/stale state).
