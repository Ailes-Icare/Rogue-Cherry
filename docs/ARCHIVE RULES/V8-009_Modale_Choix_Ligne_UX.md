## V8 - ajout n°7 : amélioration de la modale "choix de ligne"

(qui apparait quand on double clic sur le bandeau bleu, initialement, et qui maintenant apparait aussi quand on double clic sur un label de listing d'occurence; cf 5.3 et 6)
- un clic "long et continu" sur les fleche permet d'incrémenter plus vite. a partir de 0,5seconde, ca incrémente de 1 unité tout les 0,5 secondes. au bout de 2 seconde, tout les 0,1 seconde. au bout de 4 secondes, incrémenter 2 a 2. au bout de 6 secondes, incrémenter de 10 a 10.
chaque incrément doit donner lieu a un déplacement du texte en conséquence. NOTA : les valeurs que j'ai donné peuvent etre trop ambitieuse pour le moteur, je te laisse me contredire si tu vois un problème, voir pourquoi pas creer un algo d'ajustement dynamique (?)
- ajouter un attribut en entrée a l'ouverture de la modale.
si absent : alors le n° entré = le n° de la ligne. et les n° possible sont compris entre 1 et le nombre total de ligne du texte principal. le n° affiché a l'utilisateur est strictement le n° de la ligne.
si présent : c'est un tableau, qui pour chaque ligne du tableau, donne un numéro, qui est en fait le n° de la ligne du texte principal.
ainsi, si la 12eme ligne du tableau contient "1026", cela signifie, pour l'ajout 5.3 et 6 que l'occurence 12 est à la ligne 1026.
le numéro affiché pour l'utilisateur est le n° du TABLEAU, mais le texte se déplace non pas au n° de la ligne du tableau, mais a la valeur enregistré dans cette ligne (1026).
les n° acceptable sont compris entre 1 et le nombre de ligne du tableau passé en paramètre.
ceci devrais permettre d'universaliser cette modale, et de faire en sorte que naviguer d'une occurence a l'autre dans cette modale avec les flèches permet bien de directement naviguer dans le texte.
il faut ajouter un second attribut optionnel "DEBUG" true / false.
par défaut a false.
si il est a "true", alors son "effet" ne s'applique pas au texte principal de la fenetre principal, mais au texte principal de la fenetre de debug.

### Précision ultérieure : Positionnement
> "Deuxièmement, il va falloir rajouter des attributs pour définir plus précisément où apparaît la modale. Sur le bouton Find, quand il fait apparaître des occurrences, la modale se retrouve à la fois au-dessus du bouton — on ne peut donc plus le lire — et au-dessus du numéro de ligne — on ne peut donc pas lire la ligne où on se trouve. De plus, le centre de la zone de texte est à peu près au même endroit que le bouton, ce qui fait que la ligne actuellement sélectionnée se retrouve forcément sous la modale. Bref, c'est catastrophique. Il faut donc la décaler : au lieu de l'aligner sur la droite de la souris, il vaudrait mieux l'aligner sur la gauche et la placer un peu au-dessus, pour que ce soit plus lisible."
> "Le positionnement de la modale fait le contraire de ce qui est demandé. Tu l'as mis à droite du bouton Find. Je veux que tu le mettes à gauche du bouton Find, pour qu'on voie bien le numéro de ligne et que ça n'empiète pas sur la partie code source, qui est vraiment la plus critique."

### Précision ultérieure : Accélération Mathématique
> "Au lieu de jouer sur le nombre de millisecondes, on va jouer sur le nombre de pas. Toutes les 2 secondes, on multiplie par 2 l'écart entre deux pas :
- De 0 à 2 secondes : ligne par ligne
- De 2 à 4 secondes : 2 lignes par 2 lignes
- De 4 à 6 secondes : 4 lignes par 4 lignes
- De 6 à 8 secondes : 8 lignes par 8 lignes
- Etc.
2 secondes, c'est peut-être un peu long : fais 2 secondes pour le premier palier, puis 1 seconde pour les paliers suivants. Pour éviter un résultat absurde, limite à 50 lignes par 50 lignes."

### Précision ultérieure : Valeur Initiale Dynamique
> "Premièrement, je veux pouvoir passer en attribut de la modale une valeur de départ par défaut :
- Sur un clic sur le bouton **Find**, la valeur de départ doit être la valeur affichée dans ce bouton. Par exemple, si je suis à l'occurrence 36 sur 416, la valeur affichée doit être 36.
- Pour le double-clic sur le bandeau bleu (navigation ligne par ligne), la valeur affichée doit être celle de la ligne du milieu de l'écran. Exception : si on est au tout début du code, la valeur est 1 ; si on est à la toute fin, la valeur est le numéro de la dernière ligne."

### Précision ultérieure : Comportement de Saisie au Clavier
> "Deuxièmement, concernant la saisie manuelle dans la textbox de la modale. Les boutons fléchés fonctionnent très bien, mais lorsqu'on saisit une valeur à la main, la navigation se déclenche à chaque chiffre entré. Par exemple, pour saisir 3825, il navigue successivement vers la ligne 3, puis 38, puis 382, puis 3825 — ce qui n'est pas souhaitable.
Voici le comportement attendu : dès que le focus est sur la textbox, la navigation dynamique est suspendue. La navigation ne se déclenche que dans les cas suivants :
1. L'utilisateur clique sur **Go** : navigation vers la ligne saisie, puis fermeture de la modale.
2. L'utilisateur clique en dehors de la modale : annulation, fermeture de la modale sans navigation.
3. L'utilisateur clique ailleurs dans la modale mais en dehors de la textbox : navigation vers la ligne saisie, sans fermer la modale.
4. Aucune saisie depuis 5 secondes : la textbox perd le focus et on navigue vers la ligne indiquée dans la textbox."

### Règles de base (Mandatory)
- L'algorithme d'accélération doit être imperméable aux effets de bord React (closures obsolètes) : la boucle d'incrémentation doit utiliser les valeurs d'état les plus récentes, via des références immuables ou via la mise à jour fonctionnelle du State.
- La validation différée de 5 secondes au clavier est essentielle pour prévenir un comportement saccadé ("essuie-glace") sur les très gros documents lors de frappes manuelles.
- Le positionnement est une règle d'or d'ergonomie : une interface "pop-up" ou "modale volante" ne doit jamais obstruer la zone cible ni sa propre zone de lancement.
