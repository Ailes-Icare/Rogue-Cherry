# V8-008 Quick Wins (Phase 1)

Ce document archive les stories des sous-tâches 8.1, 8.4, 8.5 et 8.6 validées.

---

### 8.1 : Rename projet (DONE)
**Verbatim initial :**
> un double clic sur le label de titre du projet lance la modale "Up Ver" sur l'onglet 2 dédié au renommage.

---

### 8.4 : Taille du projet (DONE)
**Verbatim initial :**
> ajouter une information de taille de fichier pour le projet (JSON)
> un simple label sous les boutons a droite suffira pour l'instant, et permettra de savoir où est ce qu'on en est.

---

### 8.5 : Accès au Smart Debugger (DONE)
**Verbatim initial :**
> désormais, un double clic sur le textbox "a rechercher" ou "a remplacer" ouvre la modale de débug. le but est de pouvoir offrir a l'utilisateur un cadre différent pour bien lire la requete et surtout prendre connaissance du texte cherché et le texte remplacé dans une UI plus large pour controler qu'il est d'accord avec les proposition.

**Précision ultérieure (Algorithme du double-clic et Payload) :**
> Voici l'algorithme :
> - Si le presse-papier est plein au moment du double-clic sur un champ texte (ou lors d'un collage de requête en mode manuel), on colle l'élément uniquement si le champ texte est vide, puis on vide le presse-papier.
> - Si le champ texte n'est pas vide, on ne colle pas et on ne vide pas le presse-papier.
> - Si le presse-papier est vide au moment du double-clic, on ouvre la modale de debug.
> 
> Concernant la modale de debug : actuellement, quand je double-clique sur le champ « find » dans la modale, ça insère dans la requête le contenu du texte find — ce n'est pas du tout ce que je veux. Ce que je veux, c'est que ça insère la requête telle qu'elle est affichée actuellement. C'est-à-dire la vraie requête brute et complète : si c'est un multistack, c'est la requête complète d'origine de l'item sur lequel on se trouve actuellement dans la pile. Et si la personne avait saisi quelque chose manuellement, il faut reconstruire et générer la requête, puis l'afficher.

---

### 8.6 : Amélioration UI Cherry-Picking (DONE)
**Verbatim initial :**
> simple amélioration UI / position des boutons.
> dans le cas ou le tableau en bas a gauche apparait avec "la liste des occurence", actuellement, sous ce tableau, apparait 3 boutons.
> ces trois boutons occupent une place inutile qui empiète sur le tableau, alors que les label associé aux ligne sont court, et donc que le tableau n'a pas besoin de beaucoup de largeur.
> en conséquence : déplace les trois boutons en position latérale du tableau et allonge le tableau vers le bas pour profiter de l'espace ainsi récupéré.

---

### 8.9 : Comportement du Bouton Find unitaire (DONE)
**Verbatim (Issue émergente) :**
> Le bouton « Find », qui passe en vert lorsque le texte recherché est intégralement trouvé, affiche en théorie le nombre d'occurrences lorsqu'il y en a plusieurs. Cependant, dans le cas où une seule occurrence est trouvée, il ne devrait pas afficher « 1 sur 1 » — cela n'a absolument aucun sens. Dans ce cas, j'aimerais que le texte reste simplement « Find », mais que le bouton passe en vert pour signifier que le texte a été trouvé.
