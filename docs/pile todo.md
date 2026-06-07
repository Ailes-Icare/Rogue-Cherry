rappel à mon intention : npm run build
rappel à ton intention : $env:PATH = "C:\Program Files\nodejs;" + $env:PATH; & "C:\Program Files\nodejs\npm.cmd" run build
ou plus simplementg : cmd /c npm run build

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
les sidebar gauche et droite ne sont pas modifiées. Le texte principal apparaît sans colorisation DraftSurge (pour le nouveau fichier) mais si on change d'onglet, les colorisations DraftSurge existantes sur les autres onglets seront chargées avec le texte.
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

### Précision ultérieure :
- "c'est exactement ce que j'avais prévu. Mais attention, il faudra aussi gérer le cas des "fichier portant le meme nom" et donc intégrer un suffixe spécifique pour les différencier dans ce cas la, qui n'a pas d'existance réelle dans la réalité des fichier, mais qui deviendra au sein de rogue cherry le nom du fichier. il y a un laius dans mon plan initial qui traite du besoin de pouvoir creer automatiquement un texte qu'on puisse copier / coller a une IA qui contient les textes a modifier et leur nom : donc leur nom avec éventuel suffixe. c'est la l'interet principal."
- "par contre, j'ignore si cela est possible, mais quand on ouvre un fichier à la main (et donc qu'on l'ajoute au projet) ne serais t'il pas possible de sauvegarder aussi l'arborescence ?"
- Note technique actée : La sauvegarde de l'arborescence absolue est bloquée par la sécurité du navigateur. Pour compenser, l'API File System Access permettra de conserver un "fileHandle" (pointeur) vers le fichier d'origine à l'import, permettant d'écraser silencieusement le fichier d'origine lors de la sauvegarde sans redemander le chemin. Le prompt de sortie IA intégrera ces identifiants uniques "internalName".

##ROADMAP : 

###étape 1 : 
compte tenu de ce cahier des charge initial, effectue si necessaire une refactorisation complète du code pour standardiser les elements sans rien retirer des fonctions.
liste ci après les taches que tu pense etre utile pour cela et toute les notes qui te seront utile pour archive

*Plan de Refactorisation (Étape 1) :*
- [ ] **Tâche 1.1 : Exposer les primitives multi-fichiers et multi-projets depuis le hook `useHistoryStore`**
  - Exposer `projects`, `activeProjectId`, `activeFileId`, `files`, ainsi que les fonctions de manipulation (`setActiveProjectId`, `setActiveFileId`, ajout/fermeture/suppression de fichiers et projets).
- [ ] **Tâche 1.2 : Adapter `rebuildTextAt` et le calcul des deltas au support multi-fichiers**
  - S'assurer que le champ `fileId` (actuellement déduit à `"main"`) est correctement stocké dans chaque enregistrement (`snapshot`/`replace`) et que `rebuildTextAt` filtre bien par `fileId` actif.
- [ ] **Tâche 1.3 : Préparer la migration des états de recherche / remplacement de `App.jsx` vers un modèle multi-fichiers**
  - Préparer la gestion des états de saisie (`findText`, `replaceText`, `multiIndices`, `isFindActive`, `isReplaceActive`, `globalSearchBarText`) afin d'éviter qu'une recherche sur un fichier ne pollue visuellement l'affichage d'un autre fichier lors du changement d'onglet.
- [ ] **Tâche 1.4 : Standardiser et préparer l'arborescence des composants pour accueillir l'UI de navigation**
  - Prévoir le découpage et l'insertion des futurs composants d'UI (onglets de fichiers dans la zone centrale, onglets de projets dans la SidebarRight) sans casser le layout réactif existant.

###étape 2 : 
compte tenu de ce cahier des charges, défini ici une a une les étapes pour monter tout ca.
commence par donner les grandes étapes clé avec un petit commentaire suffisant pour comprendre le contenu.

*Grandes étapes de la Roadmap V9 (Étape 2) :*
- [ ] **Étape 2.1 : Intégration du State Multi-Fichiers / Multi-Projets dans le Store**
  - Mettre à jour `useHistoryStore.js` pour supporter les actions de gestion de plusieurs projets et fichiers (gestion des handles, suffixes uniques pour doublons de noms, sauvegarde automatique de l'arborescence).
- [ ] **Étape 2.2 : Interface des Onglets de Fichiers (Zone Centrale)**
  - Ajouter une barre d'onglets au-dessus de l'éditeur principal avec réorganisation interactive (drag & drop) et option de fermeture de fichiers (prompts à 3 choix). Ajouter l'onglet réduit `↑` à gauche pour l'accès aux fichiers fermés.
- [ ] **Étape 2.3 : Modale d'Import Multi-Choix et Mode UpVersion Silencieux**
  - Intercepter l'import de fichier pour proposer "Nouveau projet" ou "Ajouter le fichier". Si ajouté, afficher la modale UpVersion avec option "Importation silencieuse" (pas de changement de version globale) et insérer l'action "Add file" dans l'historique.
- [ ] **Étape 2.4 : Gestion de l'Attribut `File` dans les Requêtes et Modale d'Assignation Manuelle**
  - Parser l'attribut `File` (`[FILE:projet/fichier]`). En multi-fichiers, si l'attribut est absent, bloquer l'exécution et afficher une modale d'assignation manuelle, puis reconstruire et réinjecter la requête.
- [ ] **Étape 2.5 : Interface de Gestion de Projets (Sidebar Droite)**
  - Ajouter un système d'onglets sous les boutons d'action de la SidebarRight pour basculer d'un projet à l'autre.
- [ ] **Étape 2.6 : Sauvegarde et Exportation "TOUT"**
  - Diviser les boutons d'export et sauvegarde en sous-boutons "TOUT" en présence de plusieurs fichiers, avec prompts pour sauvegarde JSON unique vs fichiers séparés (via fileHandle) et export condensé pour prompts d'IA.

###étape 3 : 
alimente la roadmap qu'on transformera progressivement en avancant en cdc, puis en consigne valide / rules.


🏗️ Rapport d'Audit Architecture (Préparation V9 : Multi-fichiers / Multi-projets)
Date : 7 juin 2026 Objectif : Confirmer que l'architecture actuelle est bien compatible et prête pour accueillir les évolutions majeures de la V9, comme décrit dans la Phase 1 du cahier des charges (fichier pile todo.md).

📊 État des Lieux par Composant Core
1. 🟢 Couche Données et État (useHistoryStore.js)
Statut : Prêt à 100% pour la V9

Architecture d'état : L'état global stocke déjà un tableau projects, contenant lui-même un tableau files (avec les propriétés internalName, originalName, et le pointeur natif fileHandle). Les IDs de sélection activeProjectId et activeFileId sont en place.
Moteur temporel : La fonction rebuildTextAt a été parfaitement adaptée. Elle accepte désormais un fileId en argument et filtre intelligemment la pile d'historique pour ne reconstruire que l'état du fichier ciblé (filtre sur opFileId === fileId).
Enregistrement : Les fonctions pushReplace et pushSnapshot attachent déjà de manière proactive l'identifiant du fichier courant (fileId: activeFileId || "main") à chaque nouvelle opération.
TIP

Le refactoring profond du gestionnaire d'état a été fait de manière exemplaire. Aucune refonte du stockage historique n'est requise.

2. ⚠️ Couche Parsing IA (textParser.js)
Statut : Préparation manquante (Action requise)

Problème : Le cahier des charges de la V9 indique que chaque requête IA pourra posséder un attribut [FILE:projet/fichier]. Actuellement, textParser.js extrait parfaitement [LABEL:...], [MULTI:...] et [SMART:...], mais ignore toute logique d'extraction d'une balise [FILE:...].
Action V9 : Il faudra simplement ajouter une regex pour extraire cette balise optionnelle dans parseSyntaxRequest et la retourner dans l'objet parsedRequest.
3. ⚠️ Couche d'Orchestration UI (App.jsx - États de Recherche)
Statut : Non conforme (Tâche 1.3 de la roadmap V9 non finalisée)

Problème : Les états qui pilotent la recherche et le ciblage (findText, replaceText, multiIndices, isFindActive, isReplaceActive, globalSearchBarText) sont déclarés comme de simples variables d'état (scalaires) à la racine de App.jsx.
Impact : Si l'utilisateur charge le fichier A et recherche le mot "const", puis clique sur l'onglet du fichier B, le mot "const" restera en surbrillance rouge sur le fichier B. L'état "pollue" la vue d'un fichier à l'autre.
Action V9 : Il faudra implémenter un useEffect qui écoute les changements de store.activeFileId et qui déclenche une réinitialisation automatique (ou une sauvegarde en cache locale) des variables de recherche.
4. 🟡 Couche Interface Utilisateur (Layouts UI)
Statut : Pré-câblé mais composants manquants (Tâche 1.4 partielle)

Zone Centrale (App.jsx) : Le squelette Flexbox est optimal. L'en-tête (qui contient le nom du fichier) et l'éditeur CodeEditor sont séparés. Il suffira d'intercaler un composant FileTabsBar entre l'en-tête et l'éditeur, qui s'alimentera du tableau store.files.
Sidebar Droite (SidebarRight.jsx) : Les boutons d'importation et de sauvegarde globale sont prêts (il y a même déjà de l'espace alloué en haut), mais il n'y a pas encore de structure d'onglets pour gérer les Projets. L'agencement permet de glisser un bloc d'onglets sans rien casser.
📝 Conclusion & Plan d'Action pour lancer la V9
IMPORTANT

L'assertion selon laquelle une nouvelle refonte architecturale est inutile est VRAIE. Le plus dur (la migration de l'historique de type array plat vers un arbre projects -> files -> history) a déjà été réalisé. La fondation est solide.

Cependant, avant de plonger tête baissée dans la création des modales complexes de la V9, voici le Plan d'Action Minimal (Phase 1 V9) qu'il faudra exécuter pour achever la préparation :

Parser : Modifier textParser.js pour qu'il reconnaisse [FILE:nom].
Cloisonnement : Rajouter le useEffect dans App.jsx qui nettoiera findText / replaceText lors d'un changement de activeFileId (Validation Tâche 1.3).
Skeleton UI : Créer deux composants "coquilles vides" (FileTabs et ProjectTabs) et les insérer dans le layout de App.jsx et SidebarRight.jsx pour visualiser l'espace qu'ils prendront (Validation Tâche 1.4).