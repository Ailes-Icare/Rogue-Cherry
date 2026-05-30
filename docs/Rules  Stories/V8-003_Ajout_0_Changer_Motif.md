##V8 - ajout n°0 / 
Fin du developpement des modale "up ver" et "new branch"
sur l'onglet 3 (Changer de motif) <= TOUT L'AJOUT CONCERNE CET ONGLET EXCLUSIVEMENT
- le "nom du projet" est grisé / désactivé.
- toute la partie "structure des rangs" est dispo, mais tout les boutons incrémenté sont caché. les croix rouge fonctionnent, et il est possible de cocher un des rangs en "auto".
- les valeurs dans les textbox sont mise un peu en valeur pour inciter l'utilisateur a les changer si il le souhaite.
- un bouton "valider" apparait en bas a droite, a gauche de "annuler". il n'apparait qu'apres au moins une modification de l'utilisateur
- le label de version précédent se fixe au chargement de la modale (en jaune) le label en bleu est représentatif de la prochaine version
- un bouton apparait a droite de "STRUCTURE DES RANGS" : "remise à 0 du compteur". cela supprime les numérotation importé par les meme valeur qui seraient apparu si la modale avait été celle utilisé sur "import" (= reset des valeurs), et ce quelque soit le nombre et le type de rang.
- un second bouton "RESET" permet de revenir au motif "par défaut" : 4 rang, pas de préfixe, V1.0.0
- la numérotation marche ici comme pour un "import", et commence donc a 0 sur le rang réglé en "auto"
CAS chargé sur "Up Ver" : 
le bouton "valider" apparait seul et vaut validation des modifs. un item spécifique est généré pour l'historique, avec un label de changement de motif, un commentaire expliquant de quoi a quoi on passe. et la bonne valeur pour source, homogène avec le reste.
(en plus du annuler)
CAS chargé sur "NEW BRANCHE"
les 4 boutons apparaissent. valider marche comme pour "up ver"
par contre, pour les deux autres boutons, SI l'utilisateur avait commencé a modifier des trucs dans la modale, et qu'il clic ensuite sur un des deux boutons, alors un message d'erreur l'avertira que ca supprimera et remplacera ses modif, et que si il veut les concerver, il faut utiliser "valider".

### Précision ultérieure :
Dans la partie ajout numéro 0, onglet 3, concernant les deux versions de la modale — celle associée à l'update de version et celle associée à la création d'une nouvelle branche — dans les deux cas, dans la partie du haut, tu as rendu impossible de cliquer à la fois le nom du produit et le préfixe de version. Or, seul le nom du produit doit être impossible à cliquer ; il doit rester possible de modifier le préfixe de version. Pour mettre en relief que seul le paramètre de version est figé, je te conseille, sur cet onglet, de passer le label « Nom du projet » — actuellement en jaune — en gris. C'est le premier point.

Deuxième point : les boutons « Auto » sont impossibles à cliquer, alors qu'ils devraient être cliquables. Par conséquent, le cadre bleu doit se positionner sur la ligne rendue automatique. Ce comportement doit fonctionner de la même manière que la modale d'import — c'est exactement le même système.

De la même façon, le séparateur et le type sont non cliquables alors qu'ils devraient être cliquables.
