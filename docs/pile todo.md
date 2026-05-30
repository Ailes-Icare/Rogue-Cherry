rappel à mon intention : npm run build
rappel à ton intention : 

#README / CONSIGNE :
- tu lira ce fichier dans l'ordre.
- tu ne retirera jamais la "story" tel que je l'ai écrite. tu écrira toujours les infos lié au sujet d'un chapitre dans le chapitre, sans un sous chapitre a ta propre attention. tu y ajoutera le contexte, les elements supplémentaire necessaire pour clarifier une contradiction ou un element que j'aurais omis
- si tu identifie de nouveaux points, tu les ajoutera dans la pile. soit dans le chapitre V8 si on le traitera en V8, soit en V99 ou ultérieur si c'est ultérieur.
- tu as le droit de décider de les faire dans le désordre. cette pile de chose a faire n'est pas directive quant a l'ordonnancement, a toi de faire au mieux. mais dans le doute, fait étape par étape, dans l'ordre, et défini plutot au besoin des sous étapes.

quand je te dirais que un sujet est clos, ajoute dans le titre du chapitre DONE
et ajoute a la fin du chapitre un paragraphe qui explicite ce qui est "mandatory" et qui ressort comme une nouvelle règle, si cela est necessaire et que ce qui est écrit au dessus n'est pas deja suffisement clair.

puis prends ce chapitre tel quel, créé un dossier ARCHIVE RULES dans DOCS, puis créé un RULES STORY avec le numéro de version et un nom descriptif, et met y ce chapitre. puis copie TEL QUEL sans modifier les elements le points clos, et supprime le de cette présente liste.

cette liste figure "ce qui reste à faire ou qui est en cours et non validé".
les archives contiennent ce qui est deja validé et fait.

quand je te dirais qu'on "versionne" (qu'on passe de la V8 a la V9 par exemple), duplique complètement tout le code source du projet dans un sous dossier "V8" dans ce dossier (Archives rules). mets y que le code source, pas les fichiers d'accompagnement.

#MANDATORY, non négociable
consignes : 
1) n'est DONE que ce que j'ai validé et acté comme bon. pas avant !
2) les story enregistré dans done DOIVENT contenir le texte d'origine tel que je l'avais écrit, comme je l'avais écrit, au mot pret, sans modification d'aucune sorte.
cette partie ne pourra JAMAIS être modifiée. il est POSSIBLE qu'une story archivé soit modifié par un ajout récent qui contredis les elements, mais même ainsi, ma demande d'origine ne doit en aucun cas etre modifié.
tu n'aura le droit que d'ajouter un chapitre directement a la suite pour informer que la story n° de story, plus récente, contreviens et contredis cette consigne et qu'il faut lire cette autre consigne pour avoir les réponses sur les contradictions.
3) Il est tout à fait possible et probable que cette consigne initiale ne soit pas suffisante ou complète dans certains cas. Aussi, si je reprécise les choses, si je redonne une autre manière d'expliquer la story ou si je lève une ambiguïté dans notre conversation, je te demande — et c'est obligatoire — de faire un verbatim au mot près. Tu as toutefois une toute petite autorisation de manœuvre : celle d'extraire le texte de la conversation qui concerne le sujet en question.
Pour chacun des blocs de phrases qui expliquent la story ou les fonctions attendues, je veux que tu rajoutes ces phrases à la suite de ma demande initiale. Tu peux les séparer dans un sous-chapitre en lui donnant un titre du type « Précision ultérieure : ».
Il existe également des cas où des tâches n'auront pas été écrites à la main par moi dans la to-do liste et émergeront de nos discussions. Dans ce cas, tu procèdes au même exercice : extraire les phrases qui concernent l'émergence d'une nouvelle story et donc d'une nouvelle consigne, en faire un verbatim exact sans modification, et avec ce bloc de texte, initier un nouveau point de to-do list ainsi qu'un élément archivé correspondant. Lorsque tu fais cela, informe-moi et invite-moi à relire la pile to-do pour vérifier que ce que tu as écrit est bien conforme aux attendus. 
fait le toutefois seulement dans le cas ou ce que je dis objective un point oublié, clarifie une contradiction, constitue un changement d'idée, et ne polue pas les archives avec des recherche de bug, ou des cas ou le problème est lié a un oubli ou une mécompréhenssion de ta part, m'obligeant a redire ce qui avait deja été explicité.

#VERSION 8 : derniers ajouts

##V8 - ajout n°11 : 
Amélioration UI / UX générale / finale
### 11.1
lorsqu'on colle une requete (en utilisant le bouton), si une modale d'alerte (msgbox) apparait, il faut qu'elle apparaisse au plus proche de l'utilisateur (au dessus ou au dessous des boutons, fonction de où se trouve les boutons de l'interface utilisateur)
### 11.2
utiliser les SVG dans brand : 
- double cherry vector (image vectorielle du logo stylisé)
- double cherry vector px (une image facon pixel art dérivé de la seconde)
- Vector purple : la cerise violette seule du grand logo
- vector red : la cerise rouge du grand logo
- Rogue Cherry GH : le logo actuel officiel avec le titre (noir)
- Rogue cherry GHB : la meme avec le titre en blanc
- Favicon.svg : le favicon en svg, en grand
- dossier favicon : contient tout les fichier favicon standard.
#### Taches :
- ajouter le favicon au projet en tant que logo de la page, et l'intégrer partout ou cela est utile.
- centré en fond de la zone de texte principale, ajouter le logo "GHB", de telle sorte que la hauteur de l'icone soit la moitié de celle du texte. mettre en arrière plan (derrière le texte) et en transparence (30%)
- creer un bouton a la suite de "up ver". y mettre le double cherry px en icone.
- ce bouton ouvre un "splash screen". en haut a gauche, afficher le logo double cherry vector (non pixelisé) avec le nom du logiciel, la version actuelle en gros titre. en dessous, afficher le texte "faites du cherry picking dans un texte pour cibler au sniper ce que vous voulez changer, et rien d'autre, avec l'aide de votre assistant IA préféré." au dessous, mettre a gauche en haut le logo vector red, puis un texte qui épouse la forme (contourne) le logo. (en haut = en haut du bloc de texte) et en bas a droite mettre le logo vector purple. écrire un texte pour habiller entre ces deux textes : "demandez à votre IA de vous dire comment modifier le texte de votre choix. dites lui ce que vous voulez changer, en lui donnant le texte source, et en lui expliquant également comment elle doit formuler une "requette rogue cherry" pour faire ces modifs. l'IA ne retouchera jamais d'elle meme le texte, au risque de le réécrire entièrement et de faire des bêtise, ou de finir par perdre son contexte a force de réécrire de long texte. elle se contentera de vous fournir une instruction informatique qui explique ce qu'il faut chercher, pour le remplacer par quoi. integrez le texte source et la requete dans rogue cherry, controlez au besoin ce qui est réellement modifié, et laissez faire !". au desous de ce bloc (en haut a gauche le red, en bas a droite le purple, et le texte complet pour combler le reste du rectangle de façon a ce qu'il épouse la forme des deux logo), ajoute un autre bandeau de texte, isolé, qui donne la licence (pour l'instant mets en une cohérente pour ce projet, l'adresse du git hub, l'adresse du readme du projet, l'année) 
- ajouter le favicon en haut a gauche de toutes modale (sauf la splashscreen et l'écran principal)
### 11.3
modifie le titre "code source" en "texte source"
### 11.4


#AJOUTE ICI DES FEATURES SI ON EN IDENTIFIE D'AUTRES AVANT LA V9

(...)

-------------------------------------------------------------------------------------------

#VERSION 9

quand la version 8 sera totalement validé, archive la et sanctuarise la. 
la version 9 interviens sur pas mal d'aspect du logiciel et pourrait tout a fait générer des régression.
commence par lire l'intro, actuellement et visé pour te faire une idée du goal, puis applique les elements dans l'ordre, un par un.

l'enjeux de la version 9 est de rajouter une capabilité "multi fichier"
avec deux "rangs" : le multi fichier et le multi projet.

##Actuellement : 
un "projet" est le JSON qui contient tout l'historique des modifs et le contenu du fichier source (il n'a pas besoin des fichiers source)
un "fichier" actuellement ne sert qu'à importer un état d'origine pour creer un projet. importer un fichier réunitialise le projet.

##visé : 

un "projet" pourra contenir non plus UN fichier, mais PLUSIEURS. l'historique est commun.
chaque "fichier" interne doit avoir un nom unique (si il y a des doubles, alors on ajoutera un indicateur supplémentaire unique sur chacun)
une fois qu'un projet est initié ou chargé, "importer" ou "ouvrir" un fichier ne fait plus un reset mais AJOUTE le fichier au projet
dans ce cas, une minimodale d'information a 2 choix donne le choix a l'utilisateur de "lancer un nouveau projet" ou de "ajouter ce fichier".
détaillons ce second cas :
la modale d'import est chargé, dans un troisieme mode : la modale d'import deviens une modale UpVersion encore un tout petit peu différente : 
sur cette modale, on permettra de cliquer sur "incrémenter" du rang "auto". et on ajoutera un bouton spécifique en bas a gauche : importer silentieusement (ne génère pas de changement de version)
une ligne s'ajoute dans la pile d'historique du projet non plus pour l'import, mais "Add file".
la source doit porter le nom du fichier (agrémenté ou non de son suffixe le rendant unique)
la requete contiendra un nouvel attribut "File" pour savoir sur quel fichier elle est supposé s'appliquer. cet attribut est en réalité double : nom du projet / nom du fichier
une ligne d'onglet est créé au dessous du trait horizontal, et au dessus de la zone de texte principal. un premier onglet apparait avec l'ancien fichier chargé (et son nom) et un second onglet est créé avec le nouveau fichier.
il devient l'onglet "focus", mis en surbrillance, et le texte est chargé en zone principale.
les sidebar gauche et droite ne sont pas modifié. le texte principal apparait sans colorisation (pour le nouveau fichier) mais si on change d'onglet, les colorisation existante sur les autres onglet seront chargé avec le texte.
les onglets peuvent etre réorganisé
une petite croix permet de les fermer, mais une modale apparait alors pour signifier : 
"voulez vous supprimer le fichier du projet, ou simplement le fermer ?"
trois choix : fermer, supprimer et expurger l'historique, supprimer le fichier sans suppression de l'historique.
fermer ferme l'onglet, mais il se régénèrera automatiquement a la prochaine requette appelant le fichier
supprimer et expurger supprime dans le json tout les points d'historique lié a ce fichier, l'import initial et tout backup intermédiaire.
supprimer et conserver créé un point dans l'historique qui informe le projet qu'a partir de ce moment là, le fichier est considéré comme innexistant. il ne sera plus possible de lui assigner des requetes
dans les trois cas, l'onglet est fermé.
a partir du moment ou au moins un fichier est "fermé", un onglet "fictif" réduit apparaitra tout a gauche (et sera toujours visible) avec une "flèche vers le haut" apparait. un clic dessus fait apparaitre une combobox flotante qui liste tout les fichier fermé du projet pour le réouvrir.

dans le cas ou un projet multifichier est ouvert mais que la requette n'a PAS de nom de fichier / dossier, la requette est en erreur
si un second projet mono fichier est chargé, alors Rogue cherry bascule automatiquement sur ce second projet, averti l'utilisateur, et colle la requete dans ce projet.
si aucun projet mono fichier est chargé, alors le message d'erreur est plus "agressif". une nouvelle modale s'ouvre pour assigner la requette à un fichier manuellement. (et elle est testé).
si l'utilisateur valide un des fichier comme étant le bon, ca reconstruit la requette avec l'attribut et elle est réinjecté.
c'est aussi vrai pour une sous requette d'une multistack (sachant que CHAQUE requette d'une multitack doit avoir cet attribut.

par défaut, une requette sans cet attribut n'est apliquable QUE sur un projet mono fichier OU lancera systématiquement la nouvelle modale.

une fois le fichier "identifié", la zone centrale (avec le texte principal) bascule sur l'onglet de ce fichier, et tout le reste de la requette se passe dans cet onglet là.
une fois "validé", la requete est placé dans le tableau d'historique avec en "source" le nom du fichier.
si on clic sur un element de l'historique, l'onglet de la "source" s'ouvre automatiquement (meme si il était fermé)
si on clic sur un element d'une pile de requete multistack, l'onglet change pour se mettre directement sur le bon fichier / onglet.

si a l'import d'un nouveau fichier, l'utilisateur clic plutot sur "creer un nouveau projet", alors, dans la sidebar de droite, au dessous des trois bouton, on créé un systeme d'onglet pour les PROJETS.
passer d'un projet a l'autre reviens a changer de JSON, et donc de "set de fichier" dedans.

de nouvelles fonctions seront utile : 
fermer le projet (= un onglet projet)
sauvegarder tout les projet

les boutons "export" et "sauvegarder" a partir du moment ou il y a 2 fichier ou plus dans le projet, se divisent verticalement
deux nouveaux boutons apparaissent sous les deux premier (divisé par deux en hauteur) avec écrit "TOUT" dessus.

=> sauvegarder "TOUT" :
un msgbox donne le choix entre "sauvegarder le JSON unique" et "sauvegarder chaque fichier"
si "chaque fichier" : 
permet de sauvegarder un a un tout les fichier dans leur dernier état avec comme nom par défaut le nom du fichier
Nota : est il possible de sauvegarder, en plus du nom, l'arborescence du fichier ? cela permettrait de pointer directement le bon dossier, plutot que "mes téléchargement"
si "JSON unique", lire la suite pour comprendre
=> exporter "TOUT" permet de creer un nouveau type de requete : 
un JSON simple qui contient tout les fjchier dans leur état final, avec en attribut le nom de chaque fichier / son arborescence, ainsi que son "nom source" (c'est a dire le nom avec l'éventuel suffixe)
donc "enregistrer tout json" est en fait la meme chose, mais cela sauvegarde le fichier directement dans "mes telechargement" sous le nom "nom projet - version - allexport"
le json contiendra un mini commentaire en début de fichier pour expliquer ce que c'est

NOTA : cet export est idéal pour donner à une IA en entrée, avec la "consigne requete" pour qu'elle sache exactement le contenu des différents fichier et leur désignation, pour construire ensuite proprement les requetes.

##ROADMAP : 

###étape 1 : 
compte tenu de ce cahier des charge initial, effectue si necessaire une refactorisation complète du code pour standardiser les elements sans rien retirer des fonctions.
liste ci après les taches que tu pense etre utile pour cela et toute les notes qui te seront utile pour archive

###étape 2 : 
compte tenu de ce cahier des charges, défini ici une a une les étapes pour monter tout ca.
commence par donner les grandes étapes clé avec un petit commentaire suffisant pour comprendre le contenu.

puis on traitera chaque étape une par une, et quand on en fera une seule, tu commencera par définir toi meme la granularité du projet et les sous étapes / cahier des charges.
tu notera dedans les éléments important / consigne qui émergerait de nos discussion et des ajustement
et tu validera les étapes sans jamais les supprimer au fur et a mesure ou je te dirais qu'on est bon.
une étape bonne deviens une étape archivé ici, non modifiable sans mon accord, qui pourra etre relue pour que tu n'oublie pas les "consigne" que je t'ai donné, afin que la progression ne produise pas de régression.

###étape 3 : 
alimente la roadmap qu'on transformera progressivement en avancant en cdc, puis en consigne valide / rules.


