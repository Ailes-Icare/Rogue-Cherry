# V8 - Ajout n°5 : Fonctionnement de la barre de recherche globale

## 1. Consignes Initiales (Verbatim)

**Fonctionnement de la barre de recherche dans la fenetre principale.**

NOTA : la suite a été écrite a un moment ou la textbox "recherche" faisait totalement planter le logiciel. il m'étais donc impossible de verrifier comment se comportait les fonctions que tu avais précédement codé. il est possible que tout ou partie soit deja fonctionnel, et que tu n'ai plus que des ajustement à faire pour t'aligner avec mes consignes.

UI : élargir pour occuper toute la ligne jusqu'au label / bouton "mode de lecture"
ajouter a gauche un bouton pour le "smart search". bouton avec deux état visuel (actif ou non; inactif par défaut, et redeviens systématiquement innactif quand le texte de recherche est vide depuis 30 secondes). 
ajouter sur ce bouton un tool tip text pour expliquer ce qu'est le "smart" (gestion des espace ET de la casse). un clic permet de changer l'etat. texte du bouton : SMART + un logo. comme pour "ajout 2", gérer le responsive pour "cacher" l'icone, puis cacher le texte et mettre que l'icone si le bouton se réduit en taille.
- lorsque qu'un texte est écrit dans cette textbox, toute la side barre de gauche se désactive (grisé + non cliquable) ET la fonction "find" dynamique se désactive si elle était active. son état précédent est sauvegardé.
- lorsque le textbox est vide, apres un délais de 2 seconde, réactiver la side barre de gauche et remettre la fonction "find" dynamique se remet dans l'état où elle avait été sauvegardé.
la fonction smart de la case a cocher de gauche est totalement ignoré pour cette recherche
la fonction smart du nouveau bouton pilote si la recherche est effectué avec une gestion intelligente de la casse et des espace ou non.
UI / UX : la zone de texte est multiligne, et s'agrandit au fur et a mesure de l'ajout de texte / ligne. lorsqu'elle passe en multiligne, elle intègrera a gauche une numérotation de ligne, comme pour la zone de texte principale
la premiere ligne n'aura pas de n°, recouvert par le logo "loupe" qui restera visible.
lorsque la zone de texte atteint 25% de hauteur de l'interface totale, elle ne grandit plus, une barre de défilement apparait, et une barre horizontale de réglage apparait pour laisser l'utilisateur choisir ce qu'il préfère.
comme pour la textbox principal, il faut ajouter une fonction "zoom dezoom" indépendante des autres textbox, et syncroniser le n° de ligne avec.
normalement c'est intégré d'origine, mais il faut que si le texte dépasse en longueur le controleur, alors une barre de défillement horizontale pour la ligne apparait
on utilisera l'algo qui a été developpé pour la modale de debug pour faire une recherche intelligente avec calcul de heatmap.

**5.2.1 :**
remplacer le "mode normal" en bas de la zone de texte, dans le bandeau bleu, par le "mode de lecture seule", et le bouton cadena. inverser l'ordre : le bouton a gauche, suivit du label.
en mode d'édition, placer le label a gauche, puis les deux boutons (en somme dans le meme ordre que actuellement), mais toujours au meme endroit : dans le bandeau bleu en bas.

**5.2.2 :**
dans la zone dégagé en haut, placer le label "heatmap" (quand le textbox de recherche est vide, alors rien apparait dans cette zone. quand le texte est supprimé, les elements disparaissent au bout de 30 secondes)
ce label heatmap marche en partie comme celui de la modale de debug (mais qui est pas parfait a ce stade, puisque retouché dans les ajouts suivant), tout en s'inspirant de ce qui "marche" pour le bouton "find" de la sidebar de gauche.
actuellement le bouton "find" est remplacé par "1 / 3" avec deux bouton cliquable pour naviguer entre les occurences, si plusieurs occurence sont trouvé. et le texte principal se "déplace" sur l'occurence.
la ligne est mise en valeur avec liseret rouge qui disparait de lui meme a la fin.

**5.2.3 :**
le label de heatmap affichera "Conformité heatmap : VALUE" avec la valeur subissant un dégradé de couleur fonction de la valeur (comme pour la modale de debug actuelle)
par contre, SI plusieurs occurence sont trouvé, alors on doit ajouter juste apres : "- 1/106" et les deux fleches pour naviguer. le "106" etant le nombre d'occurence totale, c'est une valeur importante. met la dans une couleur différence ou en gras, voir les deux.

**5.2.4 :**
comportement des boutons : quand on "navigue" d'une occurence a l'autre, le texte principal de code doit se déplacer à la bonne ligne, et la ligne est mise en valeur avec un liseret rouge.
quand la fonction search n'est plus utilisé, le lisert rouge disparait de lui meme au bout de 30 secondes.

**5.3 :**
ajout de fonctions utile sur ces boutons : 
un double clic sur la valeur "1 / 103" affiche la meme mini modale que tu as deja réalisé pour aller directement à un n° de ligne quand on double clic sur la barre bleu.
celle ci aura un petit ajout dont je parlerais en ajout 7
la valeur entré à la main par l'utilisateur (par exemple 23) deviens la valeur valide : "23 / 100". l'utilisation des fleches sur cette mini modale permet de naviguer dans les occurences.
pour implémenter convenablement cette fonction, lire "ajout 7"

**5.4 :**
il faut ajouter un bouton quelque part, peu encombrant mais visible et facile a identifier, qui permet de "copier le texte et supprimer le contenu du texte recherché".
quand la heatmap atteint 100%, ajouter un liseret vert autour du textbox, et mettre en surbrillance (fond vert ?) ce bouton "copier et supprimer"
cette surbrillance du texte ET du bouton sont annulé dès que la heatmap n'est plus égale a 100%

---

## 2. Précisions et Refinements Apportés en Cours de Développement (Verbatim)

### Précision ultérieure : Masquage Dynamique du Bouton Smart
> "Quand le texte de recherche est vide — et donc que l'utilisateur ne fait aucune recherche actuellement — je veux que le bouton Smart n'apparaisse pas, tu le caches."

### Précision ultérieure : Agencement UI (Bouton Smart, Similarité et Bouton Copier)
> "Mets donc le bouton Smart de l'autre côté [à gauche] et aligne-le avec la textbox... Le label de similarité de points et le pourcentage, je veux que tu les places entre le bouton Smart et le texte de recherche. Ce texte ainsi que le pourcentage à côté, mets-les à la même taille que le bouton Smart... Remplace également le texte 'Conformité Hitmap'... par 'Similitude', suivi du résultat en pourcentage. Enfin, pour le bouton 'Copier et Supprimer', modifie son comportement de sorte que, comme le bouton Smart, il grossisse lorsque la ligne grossit..."

### Précision ultérieure : Navigation des Occurrences Multiples et Modale "Line Choice"
> "Lorsqu'une occurrence multiple est trouvée, le label « 1 sur 2 » apparaît, suivi de deux petites flèches de navigation. C'est toujours le même problème récurrent : grossir les deux petites flèches de sorte que leur hauteur soit identique à celle des autres boutons de la ligne, et grossir le texte... c'est un simple clic qui, dans la fonction find, ouvre une petite modale dédiée à la navigation dans les occurrences."

### Précision ultérieure : Mode Édition Libre
> "Je veux impérativement que la fonction de recherche fonctionne en mode édition." (C'est-à-dire que l'utilisation du champ de recherche global ne doit plus bloquer ou forcer la sortie du mode édition libre, le cadenas ouvert).

### Précision ultérieure : Positionnement de la Modale de Navigation
> "Premièrement, tu as remonté la modale, certes, mais je t'ai dit qu'elle soit intégralement au-dessus du bandeau occupé par la zone de recherche, et qu'elle couvre plutôt les boutons qui se trouvent complètement en haut — ouvrir, import, export, sauver. Il faut qu'elle aille là."

### Précision ultérieure : Algorithme Temporisé de la Modale (Suspension de Recherche)
> "Dans la modale, quand l'utilisateur écrit à la main un numéro — par exemple 25 : il va d'abord écrire 2, ça va sauter à 2, puis il va écrire 5, et ça va sauter à 25. Il y avait un petit algorithme qui avait été mis en place pour la fonction « find »... s'il est en train de saisir quelque chose, la recherche en temps réel est désactivée tant que la textbox a le focus ; s'il cesse d'écrire pendant un certain délai, la recherche finit par se libérer ; s'il clique quelque part dans la modale, le focus se perd et ça navigue directement."

### Précision ultérieure : Colorisation Syntaxique par Heatmap (Mirroring Debugger)
> "Il y a une feature présente dans la modale de debug que tu n'as pas reproduite et que j'aimerais avoir : c'est la colorisation syntaxique de la zone retrouvée, avec la heatmap. Il y a donc une colorisation qui dépend de la valeur de la light map, et on voit bien les mots se détacher. Il faut également que tu regardes, en plus de cette colorisation syntaxique au sein du texte, la mise en valeur dans la partie avec les numéros de lignes."

> "si j'ajoute une lettre au texte recherché, la colorisation ne s'actualise pas en temps réel. Il ne s'agit donc pas d'un simple problème de rafraîchissement au démarrage — il n'y a tout simplement aucun rafraîchissement en temps réel au fur et à mesure que l'on écrit dans le champ de recherche." (Ce point a mis en évidence l'omission de `globalSearchMarks` dans le cycle de vie React, corrigé par la suite).

---

## 3. Implémentation Technique et Notes du Développeur (IA)

L'implémentation de cet Ajout N°5 a nécessité une révision complète du cycle de vie de la barre de recherche globale, afin de l'amener au même niveau de robustesse et de fidélité visuelle que la Modale de Debug et la fonction Find dynamique de la Sidebar.

### 3.1. Architecture et UI du Bandeau
Le bandeau a été restructuré en Flexbox pour permettre l'apparition/disparition dynamique de ses éléments en fonction de l'état :
- **Bouton Smart** : Ne s'affiche que lorsque le champ n'est pas vide. Gère de manière asynchrone un délai de désactivation (30 secondes d'inactivité).
- **Label Similitude** : Affiche en temps réel le ratio calculé par le moteur dichotomique (`diffEngine.js`).
- **Gouttière Textarea** : Affiche les numéros de ligne du champ de saisie lui-même (s'il est multiligne), avec gestion de hauteur maximale (`searchHeight` redimensionnable à la volée) et d'un zoom indépendant.

### 3.2. Intégration de la LineChoiceModal
La navigation entre occurrences multiples a été adossée à la modale de navigation (`LineChoiceModal.jsx`). 
- **Positionnement dynamique** : La modale se place stratégiquement avec un offset calculé (`rect.top - 90px`) pour s'afficher *au-dessus* des onglets de recherche, recouvrant temporairement les boutons globaux de projet pour ne jamais masquer le code source.
- **Temporisation de la saisie (Smart Navigation)** : Un algorithme implémente un `timeout` (5000ms). Si l'utilisateur saisit "1... 0... 5", la recherche et la navigation en temps réel sont suspendues. Dès que le focus est perdu (clic externe) ou que le délai expire, la navigation est effectuée et le code source scroll.

### 3.3. Colorisation par Heatmap dans le CodeEditor
Pour reproduire fidèlement l'aspect analytique du Débogueur, le moteur central du `CodeEditor.jsx` a été modifié :
- Les marqueurs de la recherche globale (`globalSearchMarks`), qui contiennent des intensités (`hl-yellow`, `hl-find-80`, `hl-find-50`, `hl-find-10`), ont été fusionnés avec les marqueurs standards (historique/find).
- **Line Background** : L'état `isOccLine` a été ajouté au composant `CodeLine` pour teinter légèrement l'arrière-plan de la ligne entière (`bg-[#59466D]/15`), ce qui fait contraster visuellement la surbrillance des mots (qui, elle, est calculée caractère par caractère).
- **Gouttière (Numéros de ligne)** : Le marqueur exact (`occCssClass`) est extrait pour conditionner la couleur du symbole de la gouttière (▶ pour l'occurrence active, ● pour les autres), basculant entre le `text-gutter-mod` (vert-bleuté) pour le 100% de match et le jaune/orange pour les correspondances partielles.
- **Réactivité React** : L'intégration de `globalSearchMarks` dans le tableau de dépendances du hook `useMemo` qui indexe les `lineRecords` assure désormais le "Live Highlighting" caractère par caractère lors de la saisie utilisateur.

### 3.4. Rétrocompatibilité FindDynamic (Story 8.8)
**MANDATORY RULE** : Le code de la fonctionnalité "Recherche Globale" est actuellement pleinement fonctionnel, ce qui inclut la parfaite rétrocompatibilité avec la fonction d'échappement (Escape Hatch / Story 8.8). 
Lorsqu'une recherche dépasse les limites structurelles configurées (ex: plus de 300 lignes avec un mot-clé de moins de 3 caractères), l'alerte d'échappement est levée et la recherche globale est désactivée par mesure de sécurité pour ne pas figer l'interface. Cet algorithme d'échappement reste le garde-fou obligatoire de toutes les recherches asynchrones de l'application.

> **Statut : DONE**
> L'ensemble du périmètre 5 (5.1 à 5.4) a été audité, testé et validé. Le composant est interactif, fidèle aux maquettes conceptuelles et aux directives de comportement.
