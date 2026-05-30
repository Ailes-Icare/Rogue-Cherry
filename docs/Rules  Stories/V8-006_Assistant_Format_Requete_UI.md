# RULE STORY V8 — UI de l'Assistant Format Requête (Auto-Collapse) & barre horizontale de redimmenssionnement

## Contexte
Le cadre "assistant format requête" prend initialement beaucoup de place en haut de la barre latérale gauche.
Lors de l'utilisation intensive du "multistack", ce panneau peut masquer les requêtes de la pile. Il a donc été doté d'une fonctionnalité permettant de l'enrouler/dérouler manuellement et automatiquement. ce comportement est aussi déterminé par le déplacement par l'utilisateur de la barre de redimmenssionnement horizontale, situé juste sous la zone de boutons "coller requete, appliquer" ...

## UI MANDATORY
- Le cadre se voit ajouter un petit bouton discret (triangle/chevron ▼ / ▶) aligné à gauche du label "Assistant format requête", qui permet de "replier ou déplier" le cadre. L'ajout de ce bouton ne doit **pas agrandir en hauteur** la taille de cette zone.
- Par défaut, le cadre est déplié.
- Si l'utilisateur décide de replier le cadre, le logiciel enregistre que l'utilisateur a cette préférence. si il re déplie de lui meme le cadre, alors cette préférence est annulée.
- **État enroulé (Collapse)** : Lorsqu'il s'enroule, le contenu est masqué mais on DOIT trouver à droite de cette zone :
  - Un petit bouton « Engrenage » (⚙️) permettant d'accéder aux paramètres.
  - Un bouton avec un calepin (📋) permettant de copier le promptotype dans le presse-papier.
  *(Ces boutons ne poussent pas le reste de l'interface et restent accessibles sans avoir à déplier la zone).*

## Valeur de taille à connaitre :
- Dans le cas où la zone de bouton est constitué de 4 boutons + le bandeau d'avertissement (cas quand on traite une pile multistack), la limite haute est de 140 pixel. (= la hauteur de la zone des 4 boutons + le bandeau d'avertissement)
- dans le cas ou la zone de bouton est constitué de 3 boutons (et sans bandeau d'avertissement), la limite haute est de 100 pixel. (= la hauteur de la zone des 3 boutons)
- dans le cas ou la requete traité contient de multiple occurence et que le tableau d'occurence s'affiche, la limite basse est de 220 pixel. (=la hauteur de la partie basse, délimité par un trait horizontal, situé au dessus du tableau)
- dans le cas ou aucune requete est actuellement traité ou que elle ne contient pas de multiples occurence, et donc que le tableau du bas ne s'affiche pas, la limite basse est de 160 pixel. (=la hauteur de la partie basse, délimité par un trait horizontal, situé au dessus des case a cocher)
- chaque ligne du tableau de requete (en cas de multistack) est mesure 30 pixel de haut. le titre du tableau mesure lui aussi 30px.

## Comportement des limites de déplacement du trait de réglage horizontal
### Limite haute :
le trait de réglage horizontal, une fois déplacé vers le haut, ne peut pas dépasser 140 pixel quand un tableau multistack est affiché, ou 100 pixel quand un tableau multistack n'est pas affiché.
ces deux valeurs seront à réajuster si :
la taille de la zone de bouton de gestion des requete (3 ou 4 boutons) est modifié par de future mise à jour ou le moteur responsive

### Limite basse :
le trait de réglage horizontal, une fois déplacé vers le bas, ne peut pas dépasser 220 pixel quand un tableau d'occurence multiple est affiché, ou 160 pixel quand un tableau d'occurence n'est pas affiché.
ces deux valeurs seront à réajuster si :
la taille du tableau d'occurence multiple, ou la taille / position des 4 case à cocher est modifiée par de future mise à jour ou le moteur responsive (= la position du trait horizontal bas)

### Couche, ordre, layers et bloquages
ces commentaires sont donné indépendament des règles de redimensionnement du cadre de l'assistant de requete
- la zone de bouton est "collé" au trait horizontal et le suit. elle est au dessus de tout le reste. elle passera donc au dessus du tableau d'occurence multiple (si affiché) et du cadre de l'assistant de requete OU le bandeau quand il est replié.
- le tableau d'occurence multiple est "fixe". il se calle sous le cadre de l'assistant de requete OU le bandeau quand il est replié.
- la zone de texte "texte à chercher" et "à remplacer" est responsive et se "tasse" quand on descend le trait de réglage. elle ne peuvent pas etre plus petit que une ligne. quand elles ont atteint cette taille, elles ne bougent plus. ensuite, en dernier recours, le texte "commentaire" se réduit a 1 ligne, puis enfin, la zone "repliable" de commentaire se replie, si ce n'etait pas deja le cas (auquel cas c'est enregistré comme un autre element de préférence utilisateur).
une fois arrivé au maximum de réduction, le trait horizontal fini par passer par dessus et cache ces elements, jusqu'à arriver à la butée basse.
le procédé inverse se produit quand on remonte le trait. excepté le dépliage automatique du cadre de "commentaire", qui conservera là aussi les "préférence" de l'utilisateur.

## Comportement Automatique
### Règles Mathématiques du Repli Automatique
- **Si moins de 10 requêtes** : Le repli automatique se déclenche dès que la 5ème requête est rognée (c'est-à-dire que l'espace libre ne permet pas d'afficher 4 requêtes pleines + le titre).
- **Si 10 requêtes ou plus** : Le repli se déclenche dès que la 10ème requête est rognée (l'espace ne permet pas d'afficher 9 requêtes pleines + le titre).
### Comportement quand on déplace le trait horizontal (vers le haut) (story / application rèlge) (avec le multistack)
le tableau de requete est sous le cadre déplié de l'assistant.
SI le tablbeau de requete contient 10 ou moins de requete :
SI le trait + les 140 pixels occupé par les boutons finissent par dépasser le seuil de la taille de 5 lignes du tableau + le titre, et qu'ils commencent donc a "cacher" la 5eme ligne, alors le cadre se repliera automatiquement.
SI le tablbeau de requete contient plus de 10 requete :
SI le trait + les 140 pixels occupé par les boutons finissent par dépasser le seuil de la taille de 10 lignes du tableau + le titre, et qu'ils commencent donc a "cacher" la 10eme ligne, alors le cadre se repliera automatiquement.
(si le cadre était deja replié, il reste replié et les règles de layers s'appliquent : le bandeau se place au dessus du tableau jusqu'à le cacher entièrement et se mettre en butée a 140 pixel du bord haut de la fenetre d'affichage)
### Comportement quand on déplace le trait vers le bas APRES un repli automatique
Si l'utilisateur tire le trait vers le bas, quand le tableau laisse apparaitre le titre et 5 lignes si moins de 10 requete, ou 10 lignes si plus de 10 requete, alors le cadre applique cette règle : 
SI l'utilisateur n'avait pas préalablement de lui meme replié le cadre (voir "préférence" dans le chapitre "UI MANDATORY"), alors le cadre se dépliera automatiquement.
Sinon, le cadre restera replié, conformément au choix de l'utilisateur.
### Comportement au chargement d'un "multistack" immédiatement.
- Au chargement d'un "multistack", si la taille disponible pour le multistack est trop réduite pour afficher le tableau conformément au règle sus cité (dans "Comportement quand on déplace le trait vers le haut"), le cadre se repliera automatiquement.
- Il se remettra à l'état déplié à la fermeture du multistack, SAUF si l'utilisateur lui-même avait déjà "replié" la zone avant (auquel cas, elle reste repliée).
### Comportement quand on déplace le trait horizontal (story / application rèlge) (sans le multistack)
quand le trait horizontal est déplacé vers le haut, et que le cadre n'est pas replié, si le trait horizontal s'approche a 150 pixel du bas du cadre, alors le cadre se repliera automatiquement.
quand le trait est ensuite redéplacé vers le bas, arrivé au meme niveau, le cadre se dépliera automatiquement, sauf si l'utilisateur avait la préférence de le laisser replié.

## petit bug graphique : 
quand on descend le trait vers le bas et que l'interface commence à se glisser sous la zone sanctuarisé basse, alors un petit slider apparait.
ce petit slider deviens de plus en plus petit a mesure que la zone a slider s'agrandit puis atteint une taille mini.
quand cette taille est atteinte, il "suit" le trait horizontal vers le bas, jusqu'a arriver à la butée basse, mais a ce moment là il "pousse" le trait horizontal fixe de la zone sanctuarisé et pousse donc la zone sanctuarisé basse sous l'écran d'une quinzaine de pixel.
ce constat est exactement le meme en haut, le meme "slider" apparait. par contre comme il n'existe pas de zone sanctuarisé en haut, il arrive a la limite de l'interface et ne peut plus pousser le trait vers le haut, donc il fini par pousser l'affichage du haut des boutons d'actions.

il faudrait que arrivé a un certain stade, ce slider disparaisse.
voir meme qu'il n'apparait pas du tout.
---
## 🛠 Précisions ultérieures & Résolution technique (Notes d'implémentation)

### Calcul absolu des 150px (Auto-Collapse sans Multistack)
La règle des 150px stipule que le cadre se replie lorsque le trait horizontal s'approche à 150px du *bas du cadre*.
- **Implémentation stricte** : L'utilisation d'une référence physique (`useRef`) directement attachée au cadre de l'Assistant permet d'obtenir sa taille réelle (`offsetHeight`).
- **Condition** : La distance est calculée comme étant `Position du Trait (topHeight) - Hauteur réelle de l'Assistant`. Si cette valeur est `< 150px`, le repli est déclenché.

### Résolution du "Petit Slider" et de la Poussée (Overflow global)
- **Le faux slider** : Le slider qui apparaissait n'était pas un élément interne ajouté dynamiquement, mais bien la **barre de défilement principale de l'application (du navigateur)**.
- **La cause de la poussée** : Flexbox ne peut pas écraser les marges intérieures (`paddings`). La zone inférieure (scrollable + zone fixe) avait des paddings incompressibles d'environ 20px. Les limites théoriques du Splitter (`160px` et `220px`) étaient donc mathématiquement inférieures à la taille physique minimale de cette zone (`180px` et `240px`). Conséquence : la `SidebarLeft` dépassait de l'écran, faisant apparaître le slider global et poussant les éléments hors de l'écran.
- **Le correctif** : Les butées basses de la zone sanctuarisée ont été recalculées pour inclure ces marges (`180px` et `240px`), et les propriétés `overflow-hidden` ont été ajoutées sur les conteneurs du haut et du bas. L'interface se glisse désormais parfaitement sous les traits d'arrêt, sans aucun décalage ni barre de défilement parasite.

### Tassement successif et hauteurs minimales (40px)
- **Labels et Textboxes** : Pour que les labels ne se superposent pas lorsque l'interface est réduite au maximum, la contrainte de taille minimale (`min-h-[40px]`) doit s'appliquer **uniquement** à la zone de saisie du texte, et le bloc parent doit sécuriser la taille de l'ensemble (`60px` : 20px pour le label + 40px pour le texte).
- **Le Commentaire** : Pour qu'il se réduise progressivement avant de se replier, il a été dépossédé de la classe `flex-shrink-0` (qui le verrouillait) au profit d'un `flex-shrink` modéré, lui permettant de se tasser naturellement une fois les zones FIND/REPLACE réduites à leurs tailles minimales.