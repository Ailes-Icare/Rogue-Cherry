# DOSSIER D'ARCHITECTURE TECHNIQUE (DAT)
**Projet :** Outil d'Analyse et Remplacement de Code
**Date :** Planification de la refonte (Cible V10)
**Cible :** Développeurs / Ingénieurs d'application

## 1. Vue d'Ensemble et Architecture Globale
Ce projet est un outil de traitement de texte local conçu pour des developpeurs non spécialiste, qui créé souvent des outils "métier" au besoin sans avoir une bonne maitrise. l'idée est de leur fournir un outil de "push" et de gestion de version pour les aider à coder plus facilement, notamment via IA. Son but est d'effectuer des opérations de "Rechercher / Remplacer" (Patching) de manière stricte, sécurisée et traçable sur des codes sources. 
l'idée est de pouvoir le faire à la main, mais aussi de pouvoir demander a une IA de créer une "requete" qui contient directement l'ensemble de ces consignes.
l'IA d'aide au developpement pourra ainsi donner ses consignes de modification du code dans un format standard que l'outil comprendra.
Il est donc critique de maintenir un PROMPT dans le code qui soit conforme à la derniere syntaxe a jour de requette de modification
un des axes d'itération consistera à agrémenter cette requette d'information métadonnée en plus / consigne. tout en s'assurant que le code reste robuste devant cette diversité de consigne.

> **MANDATORY - NON NÉGOCIABLE :**
> Comme stipulé dans les consignes, l'ensemble de la requête SERA encadré des caractères de formatage pour que tout SOIT RECONNU comme du code (les trois accents graves). Le but est que la requête soit directement copiable avec un icône "copie" dans l'IDE de l'IA, très facilement. 
> Cependant, tu n'auras **jamais le droit** d'écrire ces trois accents graves où que ce soit *dans* le texte de la requête, ni ailleurs dans la conversation ou dans les commentaires, au risque de faire planter ta propre interface. **CECI EST UN ABSOLU SANS AUCUNE DÉROGATION POSSIBLE.**
> De plus, le système de reconnaissance de l'outil étant chirurgical, tu seras particulièrement vigilant, autant dans la syntaxe de la requête que dans le texte à chercher ou remplacer, aux retours à la ligne, espaces, indentations, tabulations et autres caractères invisibles.

### 1.1 : CONSIGNES DE REQUETES

#### 1.1.1 : VIGILANCE DÈS QU'ON MODIFIE LA SYNTAXE DU FORMAT DES REQUETES
À chaque fois qu'une nouvelle fonctionnalité est ajoutée au format de la requête (comme le MultiStack, les commentaires, etc.), il est impératif de mettre à jour la partie haute de l'interface gauche : tant le visuel apparent "Syntaxe" que le texte généré par le bouton de prompt doivent refléter ces nouveautés. De même, il faudra toujours penser à modifier la Nodale de Débogage, qui valide la syntaxe, pour qu'elle reconnaisse les nouvelles lignes ou balises.

#### 1.1.2 : SPECIFICITE DU CODE QUAND ON TOUCHE A LA ZONE DE LA DESCRIPTION REQUETE
**MANDATORY pour les futurs développeurs :**
Si l'on cherche à retoucher ce document (DAT.md), il faut garder à l'esprit que ce fichier contient lui-même les balises de requêtes dans son texte. 
Ici, tu vas devoir en PERMANENCE écrire des balises de syntaxe. Si tu mets ta consigne telle quelle pour modifier ce fichier, il est évident qu'elle ne marchera pas, puisque ta consigne contiendrait les codes mêmes des consignes.
C'est typiquement pour cela qu'on a créé la balise d'échappement "[REQMODIFIER]".
Dans toute conversation visant à modifier le DAT, **toutes les requêtes doivent commencer par "[REQMODIFIER]"**.
    
De plus, il est crucial de comprendre que les 4 caractères choisis pour le remplacement ne pourront pas être ceux déjà documentés (comme "@@NOUVEAU_DEBUT@@", "@@CHERCHER@@", "@@REMPLACER@@", "@@NOUVELLE_FIN@@"), puisqu'ils sont AUSSI déjà utilisés et écrits dans ce fichier.
Par exemple, si tu choisis : 
@@blabla@@
@@blabalbla?@@
@@mais-blabla!@@
@@OK TG!@@
    
Ce qui donnerait en format de requête :
[REQMODIFIER]
@@blabla@@
@@blabalbla?@@
@@mais-blabla!@@
@@OK TG!@@
@@blabla@@ [MULTI:FALSE]
@@blabalbla?@@
[Texte exact à trouver...]
@@mais-blabla!@@
[Texte de remplacement...]
@@OK TG!@@

Cependant, je ne peux pas imposer dans ce DAT une consigne de substitution fixe, car si la consigne était appliquée, elle ferait planter une future requête faite sur le DAT. Il faut donc bien préciser que faute de consigne dans la conversation, **c'est à l'IA de choisir quoi faire et d'inventer ses propres balises**, mais de s'y tenir. Du coup, quand on corrige le DAT, ni la formule de base, ni l'alternative "@@NOUVEAU_DEBUT@@", ni l'exemple "@@blabla@@" ne sont possibles, il en faut obligatoirement une autre générée spontanément.

#### 1.1.3 : PREPARATION POUR IMPLEMENTATION PERSONNALISATION UI
Tous les textes, les "tooltip" (textes au survol) des contrôles et les couleurs pointent sur des alias.
Les valeurs de ces alias sont toutes définies dans un paragraphe dédié (la déclaration des variables globales). 
À chaque fois qu'un nouvel élément est créé et qu'il contient de la couleur ou du texte, il doit impérativement être créé en suivant cette règle.
Cela inclut aussi les MsgBox et les Nodales.

### 1.2 : DESCRIPTION DES ELEMENTS, ZONE DE GAUCHE (requete et future pile de requete)
Cette zone pilote l'ingestion et la préparation des instructions de modification.
* **Contrôles présents :** Un encart "Assistant IA Prompt" avec bouton de copie, deux zones de texte (Texte 1 pour FIND, Texte 2 pour REPLACE), des cases à cocher pour les paramètres (Moteur strict, Recherche multiple) et les boutons d'action (Rechercher, Remplacer/Supprimer, Vider).
* **Spécificités des Textboxes (Texte 1 et 2) :** Ces champs utilisent une architecture en calques (Overlay/Backdrop) permettant de superposer du texte transparent éditable sur un fond colorisé en temps réel. Ils disposent d'un zoom indépendant (via Ctrl+Molette) et d'un défilement synchronisé.
* **Héritage :** Ces composants sont conçus de manière modulaire. Leurs fonctions de coloration et de synchronisation sont prévues pour être instanciables, ce qui facilitera grandement le développement du futur "Onglet 2" dédié aux piles de requêtes (MultiStack).

### 1.3 : DESCRIPTION DES ELEMENTS, ZONE PRINCIPALE (TEXTE3 / CODE)
C'est le cœur de l'éditeur, affichant le code source global sur lequel les opérations sont appliquées.
* **Contrôles présents :** Champ "Nom du projet" (qui définit le nom du fichier d'export), affichage de la version en cours, boutons d'import/export rapide, boutons de zoom (+/-) et le bouton "Versionner".
* **Spécificités de la Textbox (Texte 3) :** Il s'agit d'un composant de rendu HTML complexe en mode "Read-Only". Il est couplé à une gouttière (Gutter) générant les numéros de ligne dynamiquement. Le défilement de la gouttière est strictement synchronisé avec le texte. Le rendu projette les couleurs calculées par la State Machine globale.
* **Héritage :** La fonction de rendu de ce champ accepte désormais des ID DOM dynamiques. Cette modularité est vitale pour la future architecture multi-onglets (V9A) où chaque onglet de fichier instanciera son propre "Texte 3".

### 1.4 : DESCRIPTION DES ELEMENTS, ZONE DE DROITE (Pile d'historique)
Cette zone assure la traçabilité complète des actions et permet le voyage dans le temps (Time-Travel).
* **Contrôles présents :** Barre d'outils (Export JSON, Import JSON, Reset), tableau cliquable de l'historique (Version, Action, Heure), panneau rétractable des détails "Avant/Après" (Texte 4 et Texte 5), et boutons de navigation (Précédent, Appliquer Branche, Suivant).
* **Spécificités des Textboxes (Texte 4 et 5) :** Ce sont des mini-vues de consultation. Elles héritent du même moteur de coloration que le Texte 3. Elles possèdent une fonctionnalité de défilement synchronisé bidirectionnel (scroll sync) liable ou déliable, permettant de comparer confortablement les états "Avant" et "Après" d'une modification.

### 1.5 : NODALE DE DEBUG
Une fenêtre superposée (z-index élevé) conçue pour intercepter et corriger les erreurs de syntaxe générées par l'IA, sans polluer l'état global de l'application.
* **Contrôles présents :** Un champ principal "Requête Brute" éditable, deux vues miroirs (Texte 1 et Texte 2), une barre de recherche "Live Find" avec navigation, et une prévisualisation du Texte 3.
* **Capacités spécifiques :** La nodale isole son fonctionnement dans un objet temporaire (modalState). Elle intègre un parseur bidirectionnel : taper dans la "Requête Brute" met à jour les Textes 1 et 2, et modifier les Textes 1 et 2 met à jour la requête brute.
* **Comportement des Textboxes :** Le champ "Live Find" effectue une recherche algorithmique en direct dans le code source pour surligner en jaune les occurrences dans la vue "Texte 3" de la modale. Cela permet à l'utilisateur de valider visuellement sa correction avant de l'importer dans l'environnement principal.

### 1.6 : CONSIGNE DE PROMPT (V7.0)
**A DATE; V7.0 (Release publique V1), la consigne de prompt est celle ci :**
Agis comme un expert en modification de code source.
Je vais te fournir un code source. Tu devras me proposer des modifications en respectant STRICTEMENT ce format. Tu dois IMPERATIVEMENT placer ta reponse dans un bloc de code classique (utilise l'outil de formatage de code de ton interface) pour que je puisse la copier facilement en un clic :

##SYNTAX_COPIE## [MULTI:FALSE]
##FIND##
[Texte exact à trouver, avec lignes avant/après pour être UNIQUE. Fais très attention aux indentations, espaces et caractères spéciaux cachés !]
##REPLACE##
[Texte de remplacement complet, incluant les lignes avant/après conservées + modifications]
##END_COPIE##

Règle d'or MANDATORY 
- La zone FIND ne doit avoir qu'une SEULE occurrence exacte dans tout le document. Toutefois, s'il est utile de faire un rechercher/remplacer d'un élément dans tout le texte (ex: un nom de variable), utilise le tag [MULTI:TRUE].
- tu utilisera le marqueur "trois accent grave" pour encadrer le code de la requete pour que je puisse la copier en un clic mais JAMAIS tu utilisera cette chaine spécifique de carractère DANS le code, ni dans find, ni dans replace. sinon, ces carractère seront reconnu comme un échappement de la conversation / du code que tu rédige et ton IDE plantera. 
en lisant ce prompt, ne fais pas l'erreur de me dire que tu l'as compris en écrivant la chaine de carractère en question, évidement.
- tu sera particulièrement vigilent avec les saut de ligne, les espace, les indentation et les caractères invisible. le systeme de reconnaissance de syntaxe est chirurgical et intransigeant : toute faute conduira soit a ne pas trouver le code (find) soit a une requete non reconnue.
- CAS EXCEPTIONNEL (MODE FURTIF) : Si tu dois modifier le parseur lui-même et que tes instructions contiennent les balises standard (ce qui ferait planter l'outil), tu dois utiliser le mode furtif. Commence EXACTEMENT ta réponse par la ligne [REQMODIFIER], suivie sur les 4 lignes suivantes de tes nouvelles balises personnalisées (ex: @@NOUVEAU_DEBUT@@, @@CHERCHER@@, @@REMPLACER@@, @@NOUVELLE_FIN@@). Rédige ensuite ta requête avec ces balises.

### 1.7 : RECOMMANDATION SPECIALE
**RECOMMANDATION SPECIALE AU DEVELOPPEUR AMELIORANT CET OUTIL :**
NE TE MELANGE JAMAIS LES PINCEAUX entre la manière dont tu dois parler avec ton client, qui utilise une ancienne version de l'outil
et ce que tu es en train de developper pour l'outil dans une future version non déployé.

plus concrêtement : si tu developpe une amélioration pour la requete, sauf consigne explicite de ton client, tu continuera, toi, a publier tes "push" de consigne sous la forme de l'ancienne requette, telle que défini dans tes consignes.

### 1.8 : FORMAT DE REQUÊTE ACTUEL (V7.0)
**A DATE; V7.0 (Release publique V1), le format de requete est celui ci :**

##SYNTAX_COPIE## [MULTI:FALSE]
##FIND##
[Texte exact à trouver, avec lignes avant/après pour être UNIQUE. Fais très attention aux indentations, espaces et caractères spéciaux cachés !]
##REPLACE##
[Texte de remplacement complet, incluant les lignes avant/après conservées + modifications]
##END_COPIE##

MULTI:FALSE pourra etre MULTI:TRUE

OPTIONNELLEMENT, il pourra etre de ce type : 

[REQMODIFIER]
@@NOUVEAU_DEBUT@@
@@CHERCHER@@
@@REMPLACER@@
@@NOUVELLE_FIN@@
@@NOUVEAU_DEBUT@@ [MULTI:FALSE]
@@CHERCHER@@
[Texte exact à trouver, avec lignes avant/après pour être UNIQUE. Fais très attention aux indentations, espaces et caractères spéciaux cachés !]
@@REMPLACER@@
[Texte de remplacement complet, incluant les lignes avant/après conservées + modifications]
@@NOUVELLE_FIN@@

les 4 textes entre [REQMODIFIER] et l'ancienne ligne ##SYNTAX_COPIE## [MULTI:FALSE] sont libre et visent a remplacer : ##SYNTAX_COPIE## ##FIND## ##REPLACE## et ##END_COPIE## si necessaire

### 1.9 : MODIFICATIONS FUTURES DE LA REQUÊTE
**Modification future de la requete a prévoir mais définir proprement :**
* **CHERRY PICKING** [MULTI:FALSE] et  [MULTI:TRUE] peu devenir :  [MULTI:1,3,8]
cela signifie : recherche multiple TRUE, mais REPLACE appliqué seulement sur l'occurance 1, 3 et 8 trouvé, et aucune autre

* **Commentaire** ##Commentaire##
entre "syntax copie" et "find" (ou les mot replacé par "[REQMODIFIER]")
suivit d'une ligne dédié au commentaire.
=> PUREMENT OPTIONNEL
permet d'associer a une requete un commentaire explicatif

* **pile de requete** ##[MULTISTACK REQUEST]##
ajout de cette ligne en premiere ligne, optionnel.
si présent : plusieurs requete peuvent ensuite etre "stacké" les une a la suite des autres avec un espace entre.
il faudra tenir compte des cas ou en plus une requete est "[REQMODIFIER]"

par exemple : 
##[MULTISTACK REQUEST]##

##SYNTAX_COPIE## [MULTI:FALSE]
##FIND##
[Texte exact 1]
##REPLACE##
[Remplacement 1]
##END_COPIE##

[REQMODIFIER]
@@NOUVEAU_DEBUT@@
@@CHERCHER@@
@@REMPLACER@@
@@NOUVELLE_FIN@@
@@NOUVEAU_DEBUT@@ [MULTI:FALSE]
@@CHERCHER@@
[Texte exact 2]
@@REMPLACER@@
[Remplacement 3]
@@NOUVELLE_FIN@@

##SYNTAX_COPIE## [MULTI:1,3,8]
##Commentaire##
[Explication de la modification 2]
##FIND##
[Texte exact 3]
##REPLACE##
[Remplacement 3]
##END_COPIE##

* **fichier d'applicabilité** ##SYNTAX_COPIE## [MULTI:FALSE] deviens ##SYNTAX_COPIE## [MULTI:FALSE] [FILE:XXX]
le [FILE] est optionnel
si il n'est pas présent, c'est l'onglet en cours qui sera impacté
si il est présent et que plusieurs onglet sont ouvert, le "find / replace" sera appliqué sur l'onglet portant le nom du fichier.

### 1.10 : CONTRAINTES ARCHITECTURALES
**Contraintes architecturales respectées :**
* **100% Local (Zero-dependency) :** Un fichier HTML unique. Aucune librairie externe pour garantir un fonctionnement hors-ligne absolu.
* **Machine à États (State Machine) :** L'application est régie par un objet global "state". L'interface graphique n'est qu'une projection de cet état.
* **Read-Only Security :** Le code principal ne peut être modifié manuellement au clavier, garantissant la traçabilité des patchs.

**RAPPEL ARCHITECTURAL IMPORTANT :** Comme détaillé au point 1.9, le format et les capacités de la requête vont évoluer (Cherry-picking, MultiStack). En conséquence, l'ingénierie de la zone de requêtes (décrite en 1.2) sera amenée à changer. Il est impératif de se référer systématiquement aux règles édictées en **1.1.1** et **1.1.2** : toute modification du comportement d'une requête implique de maintenir la cohérence de l'interface (mise à jour des textes de l'assistant prompt, des tooltips) ET la mise à jour conjointe du parseur de la Nodale de débogage.

## 2. DESCRIPTION TECHNIQUE ET ANTERIORICITE PRE RELEASE V1 (V7 interne)

### 2.1 : La release publique V1.0 (=V7 internal) se définit de la sorte :
La V1.0 marque l'aboutissement du socle algorithmique de l'outil, offrant une plateforme robuste et sécurisée pour le "Patching Sémantique". Voici les éléments clés qui la définissent tant pour l'utilisateur que pour le moteur interne :

* **A. Modèle Vue-Contrôleur et State Machine (État Global) :** L'application fonctionne sur un modèle strict où le DOM n'est qu'une projection visuelle de l'état des données. L'objet global "state" (et "modalState" pour la nodale) contient toute la vérité métier (texte brut, historique, curseurs de sélection). Les fonctions comme "updateMainView()" ou "renderHighlights()" ne font que lire cet état pour injecter le HTML correspondant. Aucune modification n'est faite directement sur le DOM éditable du Texte 3, garantissant une intégrité parfaite des données et permettant le "Time-Travel" (Undo/Redo via l'historique).
* **B. Moteur de Diffing Sémantique Local :** C'est le cœur du réacteur (via la fonction "computeLiveDiff"). L'algorithme isole le "Texte à chercher" (Texte 1) et le "Texte de remplacement" (Texte 2) pour générer une matrice de différences locales (paradigme de la Double Passe algorithmique). Il identifie au caractère près les ajouts, suppressions et modifications, puis translate mathématiquement cette matrice de formatage sur l'index du code global (Texte 3).
* **C. Système de Calques (Backdrop/Overlay) et Rendu Live :** Pour les zones d'édition (Texte 1 et 2), l'outil superpose un zone de texte transparente (Overlay) sur une div stylisée (Backdrop). À chaque frappe (écouteur "oninput"), l'algorithme recalcule le diff et met à jour le Backdrop, offrant une prévisualisation colorisée en temps réel (Live Diff) sans perturber la saisie de l'utilisateur. Le défilement est synchronisé entre les deux calques de manière transparente.
* **D. Nodale de Débogage et Auto-Configuration (REQMODIFIER) :** Afin de pallier les hallucinations de l'IA, l'outil intègre un débogueur complet (Z-index 1000) permettant de valider les requêtes brutes avant injection, avec une recherche en temps réel ("liveFindModal()"). De plus, le parseur gère un dictionnaire de syntaxe dynamique ("SYNTAX_CONFIG") : l'outil peut ingérer des balises de remplacement personnalisées grâce à l'en-tête furtif d'échappement, évitant ainsi le plantage des expressions régulières (Regex) du parseur.

### 2.2 : Dette technique et explication pré V6 (Évolution du Moteur de Diffing)
Historiquement (jusqu'à la V4.3), l'outil comparait la recherche et le remplacement tout en essayant de calculer le décalage sur l'ensemble du document cible. Cela provoquait des "fuites" sémantiques (sur-lignage fantôme, couleurs baveuses sur des variables non modifiées).

**Le nouveau paradigme (V5+) repose sur une isolation stricte :**
1.  **Isolement :** L'algorithme ("calculateSmartDiffMarks") compare uniquement le Texte 1 (Recherche) et le Texte 2 (Remplacement).
2.  **Génération de la Matrice :** Il génère un tableau d'instructions de formatage relatives (ex: *Au caractère 15 de ce petit bloc, insérer du rose sur 10 caractères*).
3.  **Projection :** Cette matrice est ensuite translatée (décalée mathématiquement) en l'ajoutant à l'index de départ trouvé dans le Texte 3 (le code source global).
*Avantage : Résolution définitive des artefacts visuels et baisse de la charge CPU.*

### 2.3 : Évolution de la V6 à la V7 ; Archive technique
Ce chapitre retrace l'historique des itérations critiques ayant permis de stabiliser le moteur de l'application et de préparer l'architecture aux fonctionnalités complexes de la V8 (Batch Processing et Édition Hybride).

#### Version 6.2 : Candidate Release "Bêta V1.0" et Stabilisation du Cœur
La V6.2 a marqué la fin du développement du cœur algorithmique initial. L'objectif principal de cette version était de résoudre définitivement les fuites de mémoire et les artefacts visuels (bavures de couleurs) présents dans les itérations V4.x.

Le premier pilier de cette version fut l'implémentation complète du Moteur de "Diff Sémantique Local". Au lieu de comparer l'immensité du document source, l'application a commencé à isoler le Texte 1 et le Texte 2 pour générer une matrice de différences locales via l'algorithme "Longest Common Subsequence", permettant un surlignage parfait au caractère près.

Le second pilier fut la centralisation autour de l'architecture "State Machine". Toute l'application est devenue régie par un objet global "state", garantissant une sauvegarde JSON incorruptible, un versionnement sans faille et une navigation sécurisée dans l'historique. Enfin, la V6.2 a introduit le système de prévisualisation Live Diff avec la technique des calques Backdrop/Overlay pour prévenir les erreurs humaines avant application.

#### Version 6.6 : Découverte du Bug Multi-Occurrences et Améliorations UX
Lors des tests de stress (stress tests) de la fonction de remplacement multiple, un bug critique a été identifié : l'utilisation du mode [MULTI:TRUE] sur une zone déjà modifiée (chevauchement) supprimait totalement les surlignages violets antérieurs[cite: 78, 82]. La sécurité d'origine vidait brutalement la matrice "state.marks" pour éviter les conflits[cite: 57, 59]. Ce correctif a exigé de maintenir l'incrémentation de version tout en empêchant le vidage arbitraire de l'historique visuel[cite: 60].

En parallèle, la V6.6 a introduit une refonte UX majeure avec la gestion manuelle du mode multiple. Une case à cocher "Recherche et remplacement multiple autorisé" a été ajoutée sous les paramètres[cite: 88]. Son comportement a été pensé pour être intelligent : cochée automatiquement si l'IA envoie un tag [MULTI:TRUE], elle se grise en mode automatique mais redevient accessible (et décochée) dès qu'une action manuelle de vidage est effectuée[cite: 89].

Cette version a également enrichi les retours utilisateurs. Lors d'un clic sur "RECHERCHER", l'interface affiche désormais le nombre précis d'occurrences trouvées[cite: 90]. Enfin, la V6.6 a vu une itération drastique du prompt IA pour forcer un respect strict de l'indentation et imposer l'usage exclusif du format de requête copiable en un clic[cite: 84, 85].

#### Version 6.7 : Refactorisation et Compartimentation (Préparation Modale)
L'ajout planifié d'une fenêtre de débogage (Modale) soulevait un risque d'architecture majeur : le fichier unique approchant les 800 lignes, dupliquer la logique d'interface risquait de créer un code impossible à maintenir (effet "plat de spaghettis")[cite: 62, 63]. La V6.7 a donc été une version purement dédiée à la refactorisation préalable[cite: 67].

La première action a été l'isolation du parseur de requête. La logique complexe par expressions régulières (Regex) a été extraite de la fonction d'importation pour créer une fonction indépendante et pure "parseSyntaxRequest(rawText)". Cela a permis d'interroger la validité d'une syntaxe depuis n'importe quel composant de l'application (et notamment en temps réel depuis la future modale).

La deuxième étape critique a été la généralisation du moteur de rendu. Les fonctions "renderHighlights()" et "updateLineNumbers()" étaient initialement câblées "en dur" sur les ID du DOM de la vue principale. Elles ont été réécrites pour accepter des ID dynamiques en paramètres, permettant au même algorithme de dessiner le code source aussi bien dans l'interface principale que dans la vue miroir de débogage. L'objet "modalState" a également été préparé.

#### Version 6.8 à 7.0 : Implémentation du Débogueur ("Smart Debugger")
Construite sur les bases saines de la V6.7, cette itération a intégré la Modale de Debug (Feature 3). L'objectif était de fournir un "bac à sable" sécurisé s'activant automatiquement en cas d'erreur de syntaxe ou si la recherche échoue, proposant à l'utilisateur de déboguer manuellement[cite: 91, 92].

La modale (en z-index: 1000) intègre cinq zones de texte, dont trois inspirées en miroir de l'interface principale[cite: 93]. Pour débusquer les hallucinations de l'IA, le texte de la requête affiche la représentation visuelle des caractères cachés (espaces, tabulations, sauts de ligne)[cite: 94]. Le parseur y fonctionne de manière bidirectionnelle : modifier la requête brute met à jour les vues séparées, et inversement[cite: 99, 102].

L'innovation majeure de cette version est le "Live Find". Un champ de recherche dédié (fonctionnant comme un "Ctrl+F" classique) scrute le code source global en temps réel, surlignant en jaune les occurrences et centrant la vue automatiquement[cite: 95, 96, 103]. 

Enfin, la sécurité a été renforcée : le bouton de validation ("Appliquer") reste grisé tant que la requête n'est pas strictement valide et que le texte recherché n'est pas formellement identifié dans le code source[cite: 104, 106]. Une fois validée, la modale ferme, pousse la requête modifiée dans le presse-papier, et l'injecte dans le circuit standard de l'application[cite: 105].

## 2.4 : DESCRIPTION ARCHITECTURE ET FONCTION PRINCIPALE

L'architecture repose sur des fonctions compartimentées. L'interface (DOM) est manipulée presque exclusivement par le moteur de rendu, qui puise sa vérité dans les objets de "State" (state et modalState).

### 2.4.0 : PROCESSUS (USER STORIES ET FLUX DE DONNÉES)

Cette section retrace les chaînes d'appels (recettes) lors des actions clés de l'utilisateur, illustrant comment les fonctions interagissent pour transformer les données.

#### A. Story : Importation d'un code source initial (JSON vierge)
* **A-1 : Déclenchement :** L'utilisateur clique sur "Importer code depuis presse papier" (fonction "importMainCode").
* **A-2 : Lecture et normalisation :** Le système appelle l'API système via "readClipboard()", puis standardise les sauts de ligne avec "normalize()".
* **A-3 : Écrasement du State :** L'objet global "state" est réinitialisé avec ce nouveau texte brut (Version 1.0.0).
* **A-4 : Rendu final :** La fonction "addHistoryRecord()" crée le point de départ dans le panneau de droite. Les champs de l'interface sont nettoyés ("viderInputs()", "checkSearchState()") et le moteur de rendu affiche le code source via "updateMainView()".

#### B. Story : Ouverture d'un projet existant (Fichier JSON)
* **B-1 : Déclenchement :** L'utilisateur clique sur "Import JSON" ("triggerImport()").
* **B-2 : Sécurité et Purge :** Le système vérifie si des données non sauvegardées existent ("isProjectDirty"). Il purge visuellement le DOM (innerHTML) pour éviter les freezes, puis ouvre l'explorateur de fichiers système.
* **B-3 : Ingestion des données :** L'événement "onchange" appelle "importHistory(event)". Un FileReader lit le fichier. Le système parse le JSON et écrase l'objet "state" actuel avec les données importées.
* **B-4 : Rendu final :** Le dernier état connu du fichier importé devient l'état courant. Les vues sont recalculées via "renderHistoryTable()" et "updateMainView()".

#### C. Story : Recherche et Remplacement manuel
* **C-1 : Saisie et Live Diff :** L'utilisateur tape dans Texte 1 et Texte 2. Les écouteurs ("handleText1Input", "handleText2Input") déclenchent "updateLiveDiffBackdrops()". Cette dernière appelle "computeLiveDiff()" qui calcule la matrice de formatage pour colorer l'arrière-plan des zones de saisie en temps réel.
* **C-2 : Validation Recherche :** Au clic sur "RECHERCHER", "effectuerRecherche()" repère l'index de la chaîne dans le code source. Elle peuple "state.yellowMarks", dégrise le bouton de remplacement ("checkSearchState()"), met à jour la vue ("updateMainView()") et centre l'écran sur la ligne ("scrollToTarget()").
* **C-3 : Validation Remplacement :** Au clic sur "REMPLACER" (ou "SUPPRIMER"), "effectuerRemplacement()" opère la substitution dans la chaîne de caractères brute. Le moteur de diff recalcul exact ("computeLiveDiff()") génère les marques de coloration. Les anciens index de couleurs ("state.marks") sont translatés mathématiquement pour ne pas être désynchronisés par le changement de longueur du texte. Enfin, "addHistoryRecord()" fige cette étape dans le temps.

#### D. Story : Importation automatique d'une requête pré-formatée
* **D-1 : Déclenchement :** L'utilisateur copie une réponse de l'IA et clique sur "Importer" au-dessus du Texte 1. "pasteToLeft()" est appelée.
* **D-2 : Parsing syntaxique :** Le presse-papier est lu et envoyé à "parseSyntaxRequest()". Ce parseur (fonction pure) vérifie strictement la présence et l'unicité des balises de la "SYNTAX_CONFIG".
* **D-3 : Routage :** * Si la requête est valide, le système la dissèque et remplit automatiquement Texte 1, Texte 2, et la case MULTI. Les Live Diff sont calculés ("updateLiveDiffBackdrops()").
  * Si la requête est invalide, l'opération est stoppée et le système bascule sur la modale de débogage ("openDebugModal()") en y transférant le texte brut pour analyse humaine.

#### E. Story : Versionnement manuel (Création d'une Release Majeure/Mineure)
* **E-1 : Déclenchement :** L'utilisateur clique sur "VERSIONNER" ("btnVersionner()").
* **E-2 : Saisie Utilisateur :** Un "prompt()" natif s'ouvre pour demander si l'incrément est Majeur (M) ou Mineur (m).
* **E-3 : Purge et Sauvegarde :** Les compteurs de version ("state.vX" ou "vY") sont incrémentés. **Surtout**, le système vide l'historique visuel actif ("state.marks" et "yellowMarks") pour proposer un code source "propre" (sans violet ni jaune). L'état est figé via "addHistoryRecord()".

#### F. Story : Création d'une branche (Time-Travel)
* **F-1 : Navigation :** L'utilisateur clique sur une ancienne ligne dans le tableau de droite. "renderHistoryTable()" met à jour l'index sélectionné ("state.selectedIndex") et "updateMiniViews()" affiche l'état passé dans les Textes 4 et 5.
* **F-2 : Déclenchement :** Au clic sur "APPLIQUER (Branche)", "applySelectedBranch()" est appelée. Une alerte prévient de l'écrasement de l'état actuel.
* **F-3 : Injection :** Le code source "Après" de la version sélectionnée devient le nouveau code source actuel ("state.rawText"). La version mineure globale est incrémentée. L'action est sauvegardée comme un nouveau point de départ ("addHistoryRecord()"), annulant de facto les futurs potentiels si l'utilisateur modifie le code à partir de là.

### 2.4.1 : Utilitaires (Helpers)

* **formatText**
  * A : FUNCTION / UTILITE : Formate dynamiquement un texte issu du dictionnaire de l'application en y injectant des arguments.
  * B : INPUT : `key` (String, clé de l'objet APP_CONFIG.texts), `...args` (Arguments variables).
  * C : OUTPUT : `String` (Texte formaté).
  * D : Rules, issue, vigilence : Permet l'internationalisation et la centralisation des textes. Si la clé est introuvable, renvoie la clé brute.
* **escapeHtml**
  * A : FUNCTION / UTILITE : Sécurise les chaînes de caractères avant leur injection dans le DOM pour éviter les failles XSS.
  * B : INPUT : `unsafe` (String).
  * C : OUTPUT : `String` (Texte avec les balises HTML échappées).
  * D : Rules, issue, vigilence : Utilisé massivement par `renderHighlights`. Très optimisé via Regex natif.
* **normalize**
  * A : FUNCTION / UTILITE : Standardise les sauts de ligne d'un texte (remplace les CRLF de Windows par des LF unix).
  * B : INPUT : `text` (String).
  * C : OUTPUT : `String` (Texte normalisé).
  * D : Rules, issue, vigilence : Indispensable avant tout calcul d'index pour garantir la cohérence des positions mathématiques.
* **formatVersion**
  * A : FUNCTION / UTILITE : Renvoie la version actuelle du projet formatée.
  * B : INPUT : Aucun (lit `state.vX`, `state.vY`, `state.vZ`).
  * C : OUTPUT : `String` (ex: "V1.2.0").
  * D : Rules, issue, vigilence : Aucune mutation.
* **getTimestamp**
  * A : FUNCTION / UTILITE : Génère l'horodatage actuel.
  * B : INPUT : Aucun.
  * C : OUTPUT : `String` (ex: "12/04/2026 14:32:00").
  * D : Rules, issue, vigilence : Format localisé "fr-FR".
* **copyPrompt**
  * A : FUNCTION / UTILITE : Copie la consigne IA (Prompt) formatée dans le presse-papier de l'utilisateur.
  * B : INPUT : Aucun.
  * C : OUTPUT : Aucun (Appel de l'API navigator.clipboard).
  * D : Rules, issue, vigilence : Remplace dynamiquement les balises du prompt par celles définies dans `SYNTAX_CONFIG`.
* **readClipboard**
  * A : FUNCTION / UTILITE : Lit le contenu du presse-papier système.
  * B : INPUT : Aucun.
  * C : OUTPUT : `Promise<String | null>`.
  * D : Rules, issue, vigilence : Fonction asynchrone. Demande des permissions navigateur, peut lever une alerte si refusé.

### 2.4.2 : Initialisation et UI Générale

* **initUI**
  * A : FUNCTION / UTILITE : Point d'entrée de l'application. Initialise les textes du dictionnaire, les tooltips et injecte les variables CSS.
  * B : INPUT : Aucun.
  * C : OUTPUT : Aucun (Mutation du DOM).
  * D : Rules, issue, vigilence : Doit être appelée à l'événement `DOMContentLoaded`.
* **initSplitters**
  * A : FUNCTION / UTILITE : Initialise la logique de redimensionnement des panneaux à la souris (Drag & Drop).
  * B : INPUT : Aucun.
  * C : OUTPUT : Aucun.
  * D : Rules, issue, vigilence : Lie des écouteurs sur `mousemove` et `mouseup` au niveau du `document`.
* **toggleMiniViews**
  * A : FUNCTION / UTILITE : Affiche ou masque les vues miroirs de l'historique (Texte 4 et Texte 5) et gère l'espace Flexbox alloué.
  * B : INPUT : Aucun.
  * C : OUTPUT : Aucun (Mutation CSS).
  * D : Rules, issue, vigilence : Sauvegarde la hauteur du tableau d'historique pour la restituer à la réouverture.

### 2.4.3 : Synchronisation et Curseurs

* **toggleSyncT4T5**
  * A : FUNCTION / UTILITE : Active ou désactive la synchronisation bidirectionnelle du défilement entre les vues "Avant" et "Après" de l'historique.
  * B : INPUT : Aucun.
  * C : OUTPUT : Aucun.
  * D : Rules, issue, vigilence : Calcule et maintient un offset (`syncOffsetTop`/`Left`) pour permettre une synchronisation même si les textes n'ont pas la même taille.
* **setupSync**
  * A : FUNCTION / UTILITE : Lie les événements de scroll et de zoom entre deux éléments DOM.
  * B : INPUT : `id1` (String), `id2` (String), `getZoom` (Function), `setZoom` (Function).
  * C : OUTPUT : Aucun.
  * D : Rules, issue, vigilence : Utilise des drapeaux `isSyncing` pour éviter les boucles infinies d'événements.
* **zoomMain**
  * A : FUNCTION / UTILITE : Modifie la taille de la police du code source (Texte 3) et de la gouttière des numéros de ligne.
  * B : INPUT : `dir` (Integer, direction du zoom, +1 ou -1).
  * C : OUTPUT : Aucun.
  * D : Rules, issue, vigilence : Plafonne la taille de la police entre 8px et 40px.
* **updateCursorPos**
  * A : FUNCTION / UTILITE : Calcule la position mathématique du curseur texte (Ligne et Colonne) de l'utilisateur dans le DOM rendu du Texte 3.
  * B : INPUT : Aucun.
  * C : OUTPUT : Aucun (met à jour la barre d'état).
  * D : Rules, issue, vigilence : Complexité importante liée à l'API `window.getSelection()`. Clône un `Range` pour déduire l'index réel malgré la présence des balises `<mark>`.
* **setSelectionRange**
  * A : FUNCTION / UTILITE : Sélectionne programmeusement une plage de texte dans le DOM malgré le formatage HTML.
  * B : INPUT : `el` (Node DOM), `startIdx` (Integer), `endIdx` (Integer).
  * C : OUTPUT : Aucun.
  * D : Rules, issue, vigilence : Fonction récursive traversant l'arbre DOM (NodeType 3). Lourde si très souvent appelée.
* **selectLinesInCode**
  * A : FUNCTION / UTILITE : Convertit une plage de numéros de lignes en index mathématiques pour les sélectionner dans l'interface principale.
  * B : INPUT : `lineA` (Integer), `lineB` (Integer).
  * C : OUTPUT : Aucun (Appelle `setSelectionRange`).
  * D : Rules, issue, vigilence : Dépendante des retours à la ligne `\n` stricts présents dans `state.rawText`.

### 2.4.4 : Paramètres de Syntaxe

* **openSettingsModal / closeSettingsModal**
  * A : FUNCTION / UTILITE : Affiche/Masque la modale des paramètres permettant de redéfinir la syntaxe d'amorce et de clôture.
  * B : INPUT : Aucun.
  * C : OUTPUT : Aucun.
  * D : Rules, issue, vigilence : Modifie le DOM.
* **resetSettings**
  * A : FUNCTION / UTILITE : Rétablit la syntaxe par défaut (ex: `##SYNTAX_COPIE##`).
  * B : INPUT : `silent` (Booléen, false par défaut).
  * C : OUTPUT : Aucun (Réécrit `SYNTAX_CONFIG`).
  * D : Rules, issue, vigilence : Si `silent` est true, la modale n'est pas fermée visuellement.
* **applySettings / updateSyntaxDisplay**
  * A : FUNCTION / UTILITE : Enregistre les nouvelles balises choisies par l'utilisateur et met à jour l'affichage de l'assistant prompt.
  * B : INPUT : Aucun.
  * C : OUTPUT : Aucun.
  * D : Rules, issue, vigilence : L'assistant prompt modifie sa couleur si une syntaxe personnalisée est active.

### 2.4.5 : Modale de Débogage

* **parseSyntaxRequest**
  * A : FUNCTION / UTILITE : Analyseur syntaxique. Vérifie qu'un texte brut respecte les balises définies dans `SYNTAX_CONFIG` et le scinde en blocs logiques.
  * B : INPUT : `rawText` (String).
  * C : OUTPUT : `Object` ({ isSyntax, isValid, error, multiMode, findText, replaceText }).
  * D : Rules, issue, vigilence : Fonction PURE. Indispensable pour la sécurité avant d'autoriser l'application d'un changement.
* **openDebugModal / closeDebugModal**
  * A : FUNCTION / UTILITE : Active/désactive l'environnement de bac à sable.
  * B : INPUT : `rawQuery` (String, requête en erreur).
  * C : OUTPUT : Aucun.
  * D : Rules, issue, vigilence : Crée un contexte isolé (`modalState`) en clonant le code source principal. Ne pollue pas le `state`.
* **initModalSplitter**
  * A : FUNCTION / UTILITE : Règle l'ajustement du splitter central de la modale.
  * B : INPUT : Aucun.
  * C : OUTPUT : Aucun.
  * D : Rules, issue, vigilence : Appelé à l'initialisation.
* **processModalInput**
  * A : FUNCTION / UTILITE : Écouteur principal de la modale. Parse en Live la requête tapée et met à jour les vues miroirs.
  * B : INPUT : Aucun.
  * C : OUTPUT : Aucun.
  * D : Rules, issue, vigilence : Appelle `parseSyntaxRequest`. Gère l'affichage des caractères cachés en appelant `renderHighlights` avec `showHidden = true`.
* **updateRawFromFields**
  * A : FUNCTION / UTILITE : Composant bidirectionnel. Modifie la requête brute si l'utilisateur modifie un des champs fractionnés (Texte 1 ou 2).
  * B : INPUT : Aucun.
  * C : OUTPUT : Aucun.
  * D : Rules, issue, vigilence : Sécurisé par une vérification de `document.activeElement` pour éviter les boucles infinies avec `processModalInput`.
* **applyModalQuery**
  * A : FUNCTION / UTILITE : Valide la requête corrigée, l'injecte dans le presse-papier et ferme la modale.
  * B : INPUT : Aucun.
  * C : OUTPUT : Aucun.
  * D : Rules, issue, vigilence : Si l'API presse-papier plante (droits navigateurs), le code s'exécute quand même (`catch()`) pour forcer l'application des champs dans l'interface principale.
* **liveFindModal / navigateModalFind**
  * A : FUNCTION / UTILITE : Effectue une recherche en temps réel du texte à trouver dans le miroir du code source de la modale.
  * B : INPUT : `dir` (Integer, pour la navigation au clic suivant/précédent).
  * C : OUTPUT : Aucun.
  * D : Rules, issue, vigilence : Calcule dynamiquement les marques jaunes et force le scroll. Débloque le bouton "Valider" uniquement si la recherche trouve au moins un résultat.

### 2.4.6 : Moteur Algorithmique Local (Diffing)

* **getSimilarity**
  * A : FUNCTION / UTILITE : Calcule la proximité sémantique (en mots partagés) entre deux phrases.
  * B : INPUT : `str1` (String), `str2` (String).
  * C : OUTPUT : `Float` (Entre 0 et 1).
  * D : Rules, issue, vigilence : Fonction pure. Utilisée pour décider si une ligne a été modifiée (seuil > 0.25) ou si elle a été totalement supprimée/remplacée.
* **computeLiveDiff**
  * A : FUNCTION / UTILITE : Le cerveau mathématique du système. Compare le texte de recherche et de remplacement et retourne les instructions de formatage CSS associées.
  * B : INPUT : `str1` (String), `str2` (String), `splitChars` (Boolean, Moteur strict).
  * C : OUTPUT : `Object` ({ marksT1: Array, marksT2: Array }).
  * D : Rules, issue, vigilence : Implémente le "Longest Common Subsequence" (LCS). Opère en double passe (par ligne, puis `getIntraMarks` par caractère). Ne touche pas au DOM.

### 2.4.7 : Moteur de Rendu DOM

* **renderHighlights**
  * A : FUNCTION / UTILITE : Génère la structure HTML finale intégrant les balises `<mark>` de couleurs au texte brut.
  * B : INPUT : `text` (String), `marksToApply` (Array d'objets), `showHidden` (Boolean, optionnel).
  * C : OUTPUT : `String` (HTML généré).
  * D : Rules, issue, vigilence : Le tri du tableau d'événements `events.sort` est le mécanisme critique garantissant l'intégrité du DOM. Échappe les balises natives du code source via `escapeHtml`.
* **scrollToTarget**
  * A : FUNCTION / UTILITE : Force le scroll dynamique d'une zone de texte vers la balise possédant l'ID `#scroll-target`.
  * B : INPUT : `containerId` (String).
  * C : OUTPUT : Aucun.
  * D : Rules, issue, vigilence : S'exécute asynchronement (`setTimeout`) pour laisser le temps au DOM de se peindre.
* **updateLineNumbers**
  * A : FUNCTION / UTILITE : Calcule et génère la gouttière des numéros de ligne. Applique un surlignage CSS (`gutter-mod`) si la ligne est impactée par une modification.
  * B : INPUT : `text` (String), `marks` (Array), `targetLineContainerId` (String, ID DOM cible), `targetStatsContainerId` (String, ID DOM cible).
  * C : OUTPUT : Aucun (Mutation du DOM).
  * D : Rules, issue, vigilence : Fonction généralisée pour servir autant à l'interface principale qu'à la modale. Extrêmement rapide (analyse les sauts de ligne purs).
* **updateMainView**
  * A : FUNCTION / UTILITE : Rafraîchit l'intégralité de la zone centrale (Texte 3, version, nom de projet, stats) en se basant sur l'objet `state`.
  * B : INPUT : Aucun.
  * C : OUTPUT : Aucun.
  * D : Rules, issue, vigilence : Point de rassemblement. Combine les couleurs d'historique (`state.marks`) et les couleurs de recherche courante (`state.yellowMarks`).

### 2.4.8 : Logique Métier (Recherche & Remplacement)

* **updateLiveDiffBackdrops**
  * A : FUNCTION / UTILITE : Calcule le diffing des champs Texte 1 et Texte 2 et met à jour leurs calques de fond (Backdrops).
  * B : INPUT : Aucun.
  * C : OUTPUT : Aucun.
  * D : Rules, issue, vigilence : Provoque un appel à `computeLiveDiff`. Exécuté à chaque frappe dans l'un des deux champs (Live Diff).
* **handleText1Input / handleText2Input**
  * A : FUNCTION / UTILITE : Déclencheurs (Listeners) liés aux inputs clavier des zones Texte 1 et 2.
  * B : INPUT : Aucun.
  * C : OUTPUT : Aucun.
  * D : Rules, issue, vigilence : Effacent les index de recherche en cours (`state.yellowMarks`) puisqu'une modification invalide la recherche précédente.
* **viderInputs / viderInputsConfirm**
  * A : FUNCTION / UTILITE : Nettoie les champs de recherche et de remplacement et remet l'interface à zéro.
  * B : INPUT : Aucun.
  * C : OUTPUT : Aucun.
  * D : Rules, issue, vigilence : Désactive les sécurités automatiques du bouton Multi et le rend à nouveau contrôlable manuellement.
* **pasteToLeft**
  * A : FUNCTION / UTILITE : Écouteur asynchrone interceptant les collages du presse-papier.
  * B : INPUT : `targetId` (String, champ ciblé).
  * C : OUTPUT : `Promise<void>`.
  * D : Rules, issue, vigilence : Lit les requêtes magiques furtives (`[REQMODIFIER]`). Si une requête est cassée, propose et lance le transfert vers `openDebugModal`. Gère le paramètre `skipDeleteWarning` de manière silencieuse pour les requêtes valides de suppression (empty replace).
* **checkSearchState**
  * A : FUNCTION / UTILITE : Évalue l'état de l'application et grise/dégrise les boutons d'action (Recherche, Remplacer).
  * B : INPUT : Aucun.
  * C : OUTPUT : Aucun.
  * D : Rules, issue, vigilence : Bascule le bouton "Remplacer" en rouge "Supprimer" si le champ Remplacement (Texte 2) est vide et qu'une recherche valide a été trouvée. Affiche le compteur de sélection multiple.
* **effectuerRecherche**
  * A : FUNCTION / UTILITE : Cherche le Texte 1 dans le Texte 3 et met à jour la State Machine.
  * B : INPUT : Aucun.
  * C : OUTPUT : Aucun.
  * D : Rules, issue, vigilence : Alerte et propose la Modale de Débogage si 0 occurrence est trouvée. En mode classique (`MULTI:FALSE`), alerte et bloque le remplacement si plus d'une occurrence est trouvée.
* **effectuerRemplacement**
  * A : FUNCTION / UTILITE : Opère le "Patch Sémantique". Écrase la chaîne de texte, calcule les index translatés (mathématiques), et inscrit l'action dans l'historique.
  * B : INPUT : Aucun.
  * C : OUTPUT : Aucun.
  * D : Rules, issue, vigilence : Fonction critique. Gère le recouvrement (si on remplace une zone déjà remplacée, elle purge `state.marks` pour éviter les corruptions d'index sauf si le mode Multi est actif). Boucle en Reverse (de la fin du doc vers le début) pour les modifications multiples afin de prévenir le "Index Shifting".

### 2.4.9 : Gestion de l'Historique et des Fichiers

* **addHistoryRecord**
  * A : FUNCTION / UTILITE : Sauvegarde une ligne complète dans la State Machine.
  * B : INPUT : `action` (String), `tBefore`, `tAfter`, `mBefore`, `mAfter`, `displayMarksBefore`, `displayMarksAfter` (Tableaux).
  * C : OUTPUT : Aucun.
  * D : Rules, issue, vigilence : Déclare le projet comme "Dirty" (nécessitant une sauvegarde). Appelle `renderHistoryTable`.
* **importMainCode / copyMainCode**
  * A : FUNCTION / UTILITE : Gère l'ingestion brute initiale d'un code source depuis le presse-papier, et son exportation.
  * B : INPUT : Aucun.
  * C : OUTPUT : Aucun.
  * D : Rules, issue, vigilence : `importMainCode` écrase l'historique si validé par l'utilisateur. Initialise la Version 1.0.0.
* **btnVersionner**
  * A : FUNCTION / UTILITE : Crée un tag manuel dans l'historique (incrément Majeur ou Mineur) et purge la matrice visuelle.
  * B : INPUT : Aucun.
  * C : OUTPUT : Aucun.
  * D : Rules, issue, vigilence : Appuie sur `prompt` pour valider le type de montée de version.
* **applySelectedBranch**
  * A : FUNCTION / UTILITE : Mécanisme de "Time-Travel". Permet de remonter le temps et de créer une branche depuis un ancien point de sauvegarde.
  * B : INPUT : Aucun.
  * C : OUTPUT : Aucun.
  * D : Rules, issue, vigilence : Écrase le `state.rawText` par l'état `tAfter` de la ligne sélectionnée. Incrémente toujours la version Mineure depuis le dernier point global connu.
* **renderHistoryTable**
  * A : FUNCTION / UTILITE : Construit le DOM de la liste cliquable (Panneau droit).
  * B : INPUT : Aucun.
  * C : OUTPUT : Aucun (Mutation du DOM).
  * D : Rules, issue, vigilence : Indique visuellement l'état sélectionné (`state.selectedIndex`).
* **updateMiniViews / updateNavButtons / navigateHistory**
  * A : FUNCTION / UTILITE : Fonctions de pilotage du panneau droit.
  * B : INPUT : `dir` (Integer, pour `MapsHistory`).
  * C : OUTPUT : Aucun.
  * D : Rules, issue, vigilence : `updateMiniViews` calcule dynamiquement quels tableaux de couleur injecter dans les vues miroirs selon le type d'action cliquée.
* **exportHistory / triggerImport / importHistory**
  * A : FUNCTION / UTILITE : S/R de l'objet de base. Convertit l'objet `state` global en JSON pour le télécharger, et inversement.
  * B : INPUT : `event` (Fichier uploade, pour `importHistory`).
  * C : OUTPUT : Aucun.
  * D : Rules, issue, vigilence : Génère un nom de fichier propre. Intègre des sécurités (try/catch) pour annuler l'importation si le JSON est corrompu et avertit si des données risquent d'être perdues.
* **resetAll**
  * A : FUNCTION / UTILITE : Réinitialise intégralement la State Machine.
  * B : INPUT : `force` (Booléen, pour bypasser les messages d'avertissement).
  * C : OUTPUT : `Booléen` (Renvoie true si le reset a bien eu lieu).
  * D : Rules, issue, vigilence : Vide visuellement le DOM (innerHTML) et remet le drapeau `isProjectDirty` à false.

### 2.5 : ARCHITECTURE DES DONNÉES

#### 2.5.1 : MARQUEURS DE COLORISATION DANS LE TEXTE

L'outil repose sur un système de marqueurs abstraits pour gérer le surlignage. Plutôt que de stocker du HTML contenant des balises de couleur (qui se corrompraient à la moindre modification), le système stocke les marqueurs sous la forme d'un tableau d'objets mathématiques : { start: entier, length: entier, type: 'classe-css', scroll: booléen }.

**A. Gestion dans le Texte 1 (Find) et Texte 2 (Replace)**
Dans ces zones d'édition, les marqueurs sont strictement éphémères. Ils sont calculés à la volée à chaque frappe clavier par la fonction "computeLiveDiff". Ils ne sont pas sauvegardés dans l'état global. Une fois générés avec un index de base 0 (le début de la zone de saisie), ils sont directement passés au moteur "renderHighlights" pour colorer les calques transparents de fond (Backdrop), offrant un retour visuel instantané sans polluer la mémoire.

**B. Gestion dans le Texte 3 (Code Principal)**
Le Texte 3 affiche le code global. Sa source de vérité est l'objet global "state".
Les marqueurs y sont divisés en deux tableaux distincts :
* "state.marks" : Conserve la trace de toutes les modifications passées (surlignages violets, roses, rouges). C'est la mémoire visuelle du projet.
* "state.yellowMarks" : Conserve temporairement les index des occurrences trouvées lors de la recherche en cours.
Lors du rafraîchissement ("updateMainView"), l'outil concatène ces deux tableaux avant de les envoyer au moteur de rendu, ce qui permet d'afficher la recherche en jaune par-dessus les anciennes modifications.

**C. Gestion dans l'Historique (Textes 4 et 5)**
Dans "state.history", chaque enregistrement est un "Snapshot" figé dans le temps.
L'objet d'historique capture la matrice des marqueurs au moment exact de l'action via les propriétés "mBefore" et "mAfter".
Pour restituer fidèlement l'expérience visuelle, il sauvegarde également les surlignages jaunes temporaires via "displayMarksBefore" et "displayMarksAfter". Ainsi, cliquer sur une ancienne ligne d'historique restaure exactement les couleurs (incluant ce qui était cherché et ciblé à ce moment précis) dans les mini-vues miroirs.

**D. Conversion, Translation et Index Shifting**
Lorsqu'un remplacement est validé ("effectuerRemplacement"), l'algorithme "computeLiveDiff" génère la matrice de la modification (ex: "ajouter 5 caractères en rose à l'index 10"). Cependant, cet index 10 est relatif au Texte 1. 
Le système opère alors une **translation mathématique** : il ajoute l'index de la position de la recherche ("state.tempSearchIndex") à tous les nouveaux marqueurs pour les projeter au bon endroit dans le Texte 3.
Simultanément, un **Index Shifting** est appliqué : comme le texte inséré peut être plus long ou plus court que le texte supprimé, le système calcule la différence ("shiftLen"). Tous les anciens marqueurs ("state.marks") dont le "start" est situé après la zone de modification voient leur position décalée de cette valeur "shiftLen". Cela garantit que les anciennes couleurs ne se décalent pas par rapport à leur texte d'origine.

#### 2.5.2 : FICHIER DE SAUVEGARDE JSON

Le fichier de sauvegarde (.json) généré par l'outil est une sérialisation directe et littérale de l'objet global "state".

**Structure globale du JSON :**
Le fichier contient un objet JSON de premier niveau avec les clés suivantes :
* "projectName" (String) : Le nom défini par l'utilisateur.
* "vX", "vY", "vZ" (Integers) : La numérotation de la version actuelle.
* "rawText" (String) : Le code source brut dans son état le plus récent, sans aucune balise HTML.
* "marks", "yellowMarks" (Arrays) : Les marqueurs de colorisation actuels.
* "searchStr", "replaceStr" (Strings) : Le dernier état des champs de recherche et remplacement.
* "history" (Array d'objets) : La pile complète contenant toutes les étapes du projet (versions, branches, opérations de remplacement).

**Sauvegarde des marqueurs dans le JSON :**
La puissance de cette architecture réside dans la séparation entre la donnée et l'affichage. Le JSON ne sauvegarde **aucun code HTML**. 
Les "marks" (et les "mBefore" / "mAfter" dans l'historique) sont sérialisés sous leur forme mathématique brute [{start: 145, length: 12, type: 'hl-word-mod'}].
Lors de l'importation ("importHistory"), le JSON écrase le "state". L'outil rappelle ensuite "updateMainView()", qui re-déclenche "renderHighlights()" sur la base de ces coordonnées mathématiques. Cette approche garantit un poids de fichier minuscule, prévient totalement la corruption du DOM au chargement, et permet d'appliquer facilement des mises à jour de la charte graphique à des projets historisés.

## 3. Charte Graphique Visuelle (Stricte)
* **Fond Jaune (`#FFD700`) :** Occurrence ciblée par la recherche en cours.
* **Fond Violet Pâle (`rgba(198, 142, 255, 0.35)`) :** Lignes impactées par une modification passée.
* **Violet Foncé (`#9E67BA`) :** Mots/Tokens modifiés (Modification).
* **Rose (`#FF007F`) :** Mots/Tokens insérés (Ajout pur).
* **Croix Rouge (`[✖]`) :** Zone de suppression pure générée en CSS (`::after`).
* **Gutter Vert (`#00FF7F`) :** Numéros des lignes modifiées dans la marge.

## 4. Roadmap de Développement Détaillée (V8 à V11)
L'ordre d'implémentation de la V8 est défini de manière incrémentale pour garantir la robustesse du moteur.

### V8A : Amélioration de la Modale de Débogage
* **Caractères cachés :** Affichage explicite des espaces (·), tabulations (→) et sauts de ligne (↵) dans la zone de texte brut.
* **Coloration Syntaxique "Fail-Fast" :** Surlignage dynamique de la requête en temps réel.
  * Balises maîtresses en orange (ex: SYNTAX_COPIE, FIND, REPLACE, END_COPIE).
  * Paramètre MULTI en jaune.
  * Texte recherché en violet foncé, texte de remplacement en violet clair.
  * **Arrêt sur erreur :** La coloration s'interrompt au caractère exact où la syntaxe n'est plus reconnue, ce qui laisse la suite non colorée (ou soulignée en rouge) pour identifier immédiatement la faille.

### V8B : La Pile de Requêtes (MultiStack / Batch Processing)
* **Ingestion de flux :** Support de la balise optionnelle ##[MULTISTACK REQUEST]## permettant le chaînage.
* **UI par Onglets (Panneau Gauche) :**
  * *Onglet 1 (Standard) :* Champs Texte 1 et Texte 2.
  * *Onglet 2 (Pile) :* Liste des requêtes + Textes 1 et 2 en prévisualisation. L'outil bascule automatiquement sur cet onglet si une pile est détectée au collage.
* **Contrôles dédiés :** Boutons "Appliquer la courante", "Appliquer tout", "Supprimer de la pile".
* **Cherry-Picking :** Évolution de [MULTI:TRUE] vers [MULTI:1,3,8]. Génération dynamique de cases à cocher (actives en mode manuel ET en prévisualisation MultiStack). Traitement obligatoire en "Reverse Loop" (de la fin vers le début du document) pour prévenir la corruption des index asymétriques.

### V8C : Enrichissement et Optimisation de l'Historique
* **Métadonnées et Commentaires :** Support de la balise ##Commentaire##. L'interface d'historique (Panneau Droit) gagne une 4ème colonne pour afficher ces mémos. Les montées de version (Majeur/Mineur) proposeront la saisie d'un commentaire humain.
* **Refonte de l'objet de Sauvegarde (Delta-Encoding) :** Pour empêcher les "Memory Leaks" sur de gros volumes, les requêtes issues d'un batch modifient la façon dont le JSON sauvegarde le code source (cf. Section 6).

### V8D : L'Édition Libre Sécurisée (Le Cadenas)
* **Activation :** Le "Nom de projet" cède de l'espace à un bouton "Cadenas". À l'ouverture : la zone Nom devient une barre "Find" (loupe), le Texte 3 s'entoure de rouge et devient éditable. Tous les autres boutons sont grisés. Un "Warning" s'affiche.
* **Mécanique "Rusée" (Capture & Diffing) :** * Un *Snapshot* du code est pris à l'ouverture.
  * À la fermeture validée, un Diff compare le texte édité au *Snapshot*.
  * Les modifications sont scindées en blocs (séparation si 5 à 10 lignes non modifiées consécutives sont détectées).
  * Pour chaque bloc, une "Requête Fantôme" est générée et poussée dans le MultiStack.
* **Restauration et Application :** Le Texte 3 est annulé pour revenir à son strict état initial. L'utilisateur doit appliquer la nouvelle pile générée. Cela force le passage par le moteur de rendu, appliquant les couleurs et générant un historique "dans les règles de l'art".

## 5. Spécifications V9 à V11
* **V9A :** Architecture Multi-onglets (1 onglet = 1 fichier source). Routage via le tag optionnel [FILE:nomdufichier.ext].
* **V9B :** Refactorisation Haute Performance. Mise en place d'un Virtual Scroller (DOM Virtualization) pour supporter les méga-fichiers (+50k lignes).
* **V10 :** Accessibilité, Thèmes (Clair/Sombre, mode Daltonien avec textures) et i18n (Support FR/EN).
* **V11 :** Intégration GitHub (Extraction de repos, Pull Requests via JSON).

## 6. Structure des Données (Architecture JSON et Delta-Encoding)
Pour supporter le Batch Processing sans saturer la RAM, l'historique des états (state.history) abandonne la copie profonde systématique.

**Logique de sauvegarde pour un MultiStack de 3 requêtes (Exemple) :**
* **Requête 1 :** Sauvegarde du `TextBefore` (État initial complet) + Corps de la Requête 1. `TextAfter` est défini sur `null`.
* **Requête 2 :** `TextBefore` et `TextAfter` sont `null`. Seul le Corps de la Requête 2 est conservé.
* **Requête 3 :** `TextBefore` est `null`. Corps de la Requête 3 + Sauvegarde du `TextAfter` (État final complet).

Le système reconstruit le code à la volée lors des sauts dans l'historique (Time-travel) en rejouant la pile depuis le dernier point d'ancrage valide.

## 7 : VERSION 7.0, ROADMAP TO 8

**REGLE DE NOMMAGE ET D'ARBORESCENCE DE CE CHAPITRE :**
Dans ce chapitre, les numérotations standards (7.1, 7.2, etc.) sont strictement réservées aux VERSIONS du code et à la traçabilité des rapports techniques. Les paragraphes généraux décrivant les fonctionnalités et spécifications sont placés entre le titre du chapitre et le 7.1, et sont numérotés par des lettres (7.A, 7.B). À l'intérieur des sous-chapitres, la numérotation chiffrée (ex: 7.A.1) désigne une itération de fonctionnalité. Chaque chapitre et sous-chapitre fonctionnel doit obligatoirement se diviser en trois sections : **A : DEFINITION DES FEATURES**, **B : ROADMAP**, **C : CONSIGNE SPECIFIQUE**.

### 7.A : DEFINITION DES FEATURES
Ce chapitre définit l'ensemble des fonctionnalités cibles pour la transition de la version 7.0 (V1 publique) vers la version 8.0 (Alpha V2). L'objectif est de transformer l'outil unitaire en une station de traitement par lots (Batch processing) et d'édition hybride.

---

#### 7.A.1 : Amélioration de la nodale debug

##### 7.A.1.1 : Ajout des caractères cachés
**A : DEFINITION DES FEATURES**
La requête brute affichée dans le champ "Input" de la modale de débogage doit intégrer la représentation visuelle des caractères cachés (espaces transformés en points médians, tabulations en flèches, sauts de ligne en symboles de retour chariot). Cela permet à l'utilisateur de repérer immédiatement une erreur d'indentation ou un espace fantôme généré par l'IA.

**B : ROADMAP**
Déploiement via une fonction de formatage imbriquée dans le parseur de la modale. À chaque événement "oninput", le texte sera scanné et les caractères invisibles seront remplacés visuellement par des balises HTML stylisées, sans altérer la véritable valeur de la chaîne (qui doit rester copiable).

**C : CONSIGNE SPECIFIQUE**
Il est critique de s'assurer que cette représentation visuelle ne perturbe pas la fonction de parsing bidirectionnelle. Le texte "réel" envoyé au validateur de syntaxe doit être purgé de ces artefacts visuels.

##### 7.A.1.2 : Identification des zones syntaxiques (Fail-Fast)
**A : DEFINITION DES FEATURES**
Le champ "Input" de la modale appliquera une coloration syntaxique stricte sur la requête : orange pour les balises de début/fin, jaune pour les paramètres, violet pour les blocs de texte. L'innovation majeure réside dans le "Fail-Fast" : la coloration s'interrompt purement et simplement au caractère exact où la syntaxe n'est plus reconnue, laissant le reste du texte en blanc ou souligné en rouge.

**B : ROADMAP**
Implémentation d'un parseur lexical séquentiel (Tokenizer) spécifique à la modale. Ce tokenizer lira la chaîne caractère par caractère ou ligne par ligne, et appliquera des classes CSS jusqu'à rencontrer une violation du dictionnaire SYNTAX_CONFIG.

**C : CONSIGNE SPECIFIQUE**
Attention aux performances. Recalculer un arbre de tokens à chaque frappe de clavier sur des requêtes potentiellement longues peut créer de la latence (input lag). L'utilisation d'un "Debounce" (délai de 150ms après la dernière frappe avant calcul) est fortement recommandée.

##### 7.A.1.3 : Correction du bug holographique et bascules d'affichage
**A : DEFINITION DES FEATURES**
L'architecture actuelle superpose un "Textarea" transparent sur une "Div" colorée (Backdrop). Lors des défilements ou des zooms, de légers décalages créent un effet "holographique" rendant le texte illisible. De plus, l'affichage permanent des caractères cachés peut surcharger visuellement l'interface. L'objectif est d'ajouter une case à cocher (Checkbox) indépendante pour chaque zone de texte de la modale, permettant d'activer ou désactiver l'affichage des caractères cachés et de la colorimétrie de fond.

**B : ROADMAP**
Ajout d'une ligne d'outils UI au-dessus des Textes 1, 2 et de l'Input brut dans la modale. Connexion de ces Checkboxes aux fonctions de rendu (renderHighlights) avec un paramètre booléen "showHidden". 

**C : CONSIGNE SPECIFIQUE**
Le bug holographique provient souvent d'une différence de traitement des "white-spaces" ou des marges entre le Textarea et la Div de fond par le navigateur. Assurez-vous d'appliquer une police Monospace stricte (ex: Consolas), de désactiver le redimensionnement (resize: none), et de forcer des line-height absolus en pixels.

##### 7.A.1.4 : Recherche nuancée par dégradé (Rouge vers Vert)
**A : DEFINITION DES FEATURES**
Le champ "Find" de la modale ne fera plus qu'une simple recherche binaire (Trouvé / Pas trouvé). Il cherchera la chaîne lettre par lettre. Le surlignage dans le Texte 3 de la modale évoluera en un dégradé de couleurs : Rouge s'il ne trouve qu'une lettre, jaune/orange pour une correspondance partielle, jusqu'au Vert fluo quand 100% de la chaîne est trouvée. Si plusieurs zones correspondent partiellement, l'interface centrera automatiquement la vue sur la zone ayant la plus longue correspondance.

**B : ROADMAP**
Remplacement de l'algorithme "indexOf" de la fonction "liveFindModal" par un algorithme de type "Longest Common Subsequence" (LCS) continu, ou une distance de Levenshtein. Génération dynamique de classes CSS interpolant le pourcentage de réussite pour modifier la propriété "background-color" de la balise mark.

**C : CONSIGNE SPECIFIQUE**
C'est le défi algorithmique le plus lourd de la modale. Effectuer un LCS sur un fichier source de 10 000 lignes à chaque frappe va geler le navigateur. 
*Solution imposée :* Limiter cette recherche nuancée à une fenêtre glissante (ex: les 1000 lignes autour du curseur) ou utiliser des Web Workers pour déléguer le calcul hors du thread principal de l'UI.
*alternative rusée :* premierement, procéder non pas par cara, mais par zone. commencer par tester 100% du texte, et, si ca marche pas (aucune occurence) passer a 90%, puis 80%, puis 70% ...
ainsi, quand une occurence est enfin trouvé (ou plusieurs), elles seront très certainement peu nombreuse. si a partir de 70% du texte, on a 4 occurence trouvé, alors on testera dans l'autre sens : 71, 72, 73 jusqu'a en avoir qu'une seule. enfin, on avancera cara par cara pour trouver exactement OU ca déconne. on testera chacune des 4 séparément pour trouver la ou ca coince pour les 4
cet algo devra etre améliorer pour gérer le cas des occurence multiple autorisé, mais il y a des chances qu'il marche deja quasiment en l'état.

---

#### 7.A.2 : Amélioration de la gestion des requêtes

##### 7.A.2.1 : Ajout du Cherry-Picking
**A : DEFINITION DES FEATURES**
Le paramètre global MULTI:TRUE est trop destructeur. Il sera remplacé par un ciblage d'index. La syntaxe acceptera le format [MULTI:1,3,8]. L'interface principale affichera dynamiquement des cases à cocher sous le bouton "Remplacer", permettant à l'utilisateur de valider visuellement ou de modifier cette sélection avant d'appliquer le patch.
*Controle manuel :* ne pas oublier le cas "sans requete" ou c'est l'utilisateur qui a coché la case "autoriser les remplacement multiple" dans ce cas, il faudra de la meme manière remplir ce nouveau controleur avec toute les occurence trouvé ET les cocher décoher
il faudra ajouter un element a l'UI dans la partie de gauche pour voir les occurence demandé par la requete (quand il y en a), et pouvoir cocher / décocher les elements.
le plus adapté est sans doute de créer une "combolistbox" déroulante qui sera placé astucieusement au dessus de la case a cocher idoine. ce controle est grisé en temps normal, se valide en cas de requete cherry ou si l'utilisateur coche la case. et se met en surbrillance si il a été activé par cherry.

**B : ROADMAP**
1. Mise à jour de "parseSyntaxRequest" pour lire les index et peupler un tableau "state.multiIndices".
2. Génération de l'UI des Checkboxes lors du "checkSearchState".
3. Modification de "effectuerRemplacement" pour itérer uniquement sur les occurrences dont l'index correspond aux cases cochées.

**C : CONSIGNE SPECIFIQUE**
Le problème de "l'Index Shifting" est critique ici. Si on remplace l'occurrence 1 par un texte plus long, la position de l'occurrence 3 change, ce qui fait planter le remplacement suivant.
*Boucle rétroactive de contrôle :* Les remplacements DOIVENT être appliqués de la fin vers le début du document (Reverse Loop, de l'index 8, puis 3, puis 1). De plus, si l'IA demande de modifier l'occurrence 8 mais que le système n'en trouve que 5, l'outil doit bloquer l'action, alerter l'utilisateur, et proposer d'ouvrir la modale de débogage pour corriger l'erreur de pointage.
la manière dont doit etre proposé de traiter a l'utilisateur les probleme doit etre mieux défini. l'option reste dangereuse en mode automatique et il conviendra de noter dans le prompt a destination de l'IA de proposer elle meme un processus de controle de résultat. elle est par contre puissante en manuel (puisque l'utilisateur pourra verrifier les numéro de ligne)
corrolaire : une solution possible serait d'inciter l'IA a dire que "si tout va bien, l'occurence 3, 5 et 8 doivent etre la ligne 384, 578 et 1250; verrifiez que c'est bien ces lignes et n'appliquez pas cette requete si ce n'est pas le cas.
probleme : les IA ont du mal a numéroter les lignes et se trompent souvent.

##### 7.A.2.2 : Ajout des commentaires dans la requête
**A : DEFINITION DES FEATURES**
Permettre à l'IA d'expliquer sa logique en intégrant une ligne ##Commentaire## suivie de son texte explicatif, juste avant la balise ##FIND##. Cette métadonnée sera extraite et conservée tout au long du cycle de vie de la modification.
*Controle manuel :* ne pas oublier le cas "sans requete" ou c'est l'utilisateur qui rentre a la main un texte a chercher et remplacer : il faudra creer une inputbox dédié pour lui permettre optionnellement de rentrer un commentaire, puisque ce commentaire a une influence sur les amélioration de l'historique tel que vu plus loin.

**B : ROADMAP**
Mise à jour des Regex de parsing dans "parseSyntaxRequest" et dans la configuration dynamique "SYNTAX_CONFIG". Ajout d'une propriété "comment" dans l'objet de retour de la requête. Modification du prompt IA pour exiger ou suggérer cette balise.

**C : CONSIGNE SPECIFIQUE**
Ce champ doit être PUREMENT OPTIONNEL. Le parseur (standard et modale de debug) doit être construit de manière à valider la requête avec ou sans la présence de la balise ##Commentaire##. La Regex devra utiliser un groupe de capture optionnel `(?:...)?`.

##### 7.A.2.3 : Ajout de la Multi-Requête (Batch Processing / MultiStack)
**A : DEFINITION DES FEATURES**
1. **FONCTION :** La fonctionnalité maîtresse de la V8. L'outil peut ingérer un flux de plusieurs requêtes successives initié par la balise ##[MULTISTACK REQUEST]##. 
Quelques icones dédié seront la pour permettre le management de la pile : L'utilisateur peut y ordonnancer les requêtes, exécuter une étape, ignorer une étape, éditer une étape pour débug, ou lancer un "Run All" avec EVENTUELLEMENT une option de gestion en cas d'erreur. un bouton permettra d'exporter la pile restante sous forme d'une nouvelle requete stack en automatique.
2. **REFONTE UI :** L'interface s'adapte : le panneau de gauche bascule sur un système d'onglets, dévoilant une liste de tâches (la pile), ainsi que le texte 1 et 2 en plus petit, et de nouvelles icones complete ce nouvel onglet pour afficher les différents option d'action pour l'utilisateur.
3. **OPTION 1 :** proposer de s'arreter au premier bug OU de passer au dessus d'une requete qui ne marche pas.
4. **OPTION 2 :** faire un pré controle "syntaxe requete conforme" et "texte trouvé" pour afficher les ligne "prete a etre lancé" des lignes a débug. pouvoir ouvrir directement la nodale de debug sur une ligne de la liste.


**B : ROADMAP**
1. **Refonte UI Gauche :** Création d'une structure HTML par onglets (Standard vs Pile).
2. **Ingestion :** Le "pasteToLeft" détecte le tag MultiStack et découpe la chaîne globale en un tableau d'objets Requêtes.
3. **Composant Liste :** Affichage d'une liste cliquable. Cliquer sur un élément peuple des instances miroirs de Texte 1 et Texte 2 pour prévisualisation.
4. **Pré-Test Automatique :** À l'ingestion, le système teste en arrière-plan chaque requête de la pile (Test Syntaxe + Test Find dans le Texte 3). Il applique une icône d'état (Vert = Prêt, Rouge = Erreur).
5. **Gestionnaire d'erreurs :** Si une requête est rouge, l'utilisateur peut cliquer sur un bouton "Debug" pour l'ouvrir dans la nodale, la corriger, et la réinjecter dans la pile.
6. **Outils d'Export :** Capacité d'exporter (copier dans le presse-papier) la pile restante non exécutée.

**C : CONSIGNE SPECIFIQUE**
Pour la fonction "Run All" (lancement automatique successif), il est indispensable d'implémenter un mode "Arrêt sur erreur". Si la requête 2 de la pile modifie le contexte dont la requête 3 a besoin, le Pré-Test initial de la requête 3 était peut-être Vert, mais elle plantera au moment de son exécution. 
Le moteur doit s'arrêter, surligner la requête fautive en rouge dans la liste, et rendre la main à l'utilisateur sans corrompre les étapes précédentes (qui auront déjà généré leurs propres historiques de version).
il faudra voir si une solution "passer par dessus la requette et procéder a la suivante" sera possible (option offerte a l'utilisateur si oui)

---

#### 7.A.3 : Ajout d'attributs sur la pile d'historique

**A : DEFINITION DES FEATURES**
1. **FONCTION :** Le journal d'historique (Panneau Droit) évolue pour devenir un véritable outil de traçabilité industrielle. Le tableau UI intégrera une colonne "Commentaire". À chaque création de branche ou de version manuelle, une InputBox forcera l'utilisateur à justifier son action. Le JSON sauvegardera des métadonnées étendues : commentaire, pourqui pas un hash de sécurité, voir nom d'utilisateur, et surtout, la requête brute (avec ses balises d'échappement type [REQMODIFIER]) qui a généré la modification, permettant de la rejouer plus tard.
avec un JSON robuste, il doit pouvoir etre possible d'ajouter d'autre atribus.
en complément, le systeme actuel, qui prévois de stocker en brut le texte avant et le texte apres, prendrais rapidement des proportion gargantuesque sur de gros codes. l'ajout de la sauvegarde de la requette directement va permettre de peut etre pouvoir se passer de tout sauvegarder. soit par la requette, soit par un autre systeme, il sera possible de "tracer" ce qu'il faut retirer, modifier, ou inserer pour naviguer d'une version a l'autre, dans les deux sens. toutefois il pourra etre utile, pour sécuriser et pour éviter de surcharger en ayant a remonter trop de crant, de stocker aussi les textes des version majeurs de manière régulière
2. **REFONTE UI :** le tableau des snapshot de version doit afficher une colonne de plus pour les commentaire. une partie deja existante et réservé acceuillera les outils de management de la pile : supprimer tout les historique ou tout les suivant, éditer un snap, ajouter des attribus, choisir de les afficher ou non, les consulter, et appliquer et manager les différents outils d'optimisation proposé

**B : ROADMAP**
1. **Refonte de l'objet History :** Ajout des clés "comment", "rawQuery", "user", "hash".
2. **Outils d'optimisation (Delta-Encoding) :** Création de boutons UI permettant à l'utilisateur de purger l'historique de son poids mort. Option "Regrouper les sous-versions" (fusionne les opérations d'une même version mineure). Option "Purger les TextBefore/After" (le JSON ne conserve que l'état initial du document et la pile stricte des requêtes brutes, sans sauvegarder le code complet à chaque itération).
3. **Réflexion sur un nouveau système de Diff :** Pour les fichiers massifs, la logique actuelle de copier le `state.rawText` entier à chaque historique est une hérésie mémoire. L'architecture doit évoluer vers le stockage de "Patchs" stricts (lignes ajoutées/supprimées avec index absolu de ligne), inspiré de Git. soit en se basant directement sur la "requete", soit quelque chose de plus strict et robuste, basé, par exemple, sur une ligne entière et une identification des n° de ligne. a étudier et réaliser.

**C : CONSIGNE SPECIFIQUE**
L'extensibilité du JSON doit être absolue. Le système de rendu de la table d'historique doit lire dynamiquement les clés de l'objet JSON pour générer ses colonnes. Ainsi, si un utilisateur crée ses propres champs (ex: "JIRA_Ticket_ID"), l'UI s'adaptera sans planter. La rétrocompatibilité avec les JSON de la V7.0 (qui ne possèdent pas ces clés) doit être gérée par des valeurs par défaut élégantes (null ou "N/A").

---

#### 7.A.4 : Ajout d'une fonction "Edit" sur le Texte 3 (Le Cadenas)

**A : DEFINITION DES FEATURES**
L'objectif de cette fonctionnalité est de permettre à l'utilisateur de modifier le code source global (Texte 3) "à la main", tout en préservant l'intégrité absolue de la *State Machine* et du système de versionnement. Pour éviter de corrompre l'historique ou de perdre les formatages visuels, l'outil n'enregistrera pas le texte édité tel quel, mais effectuera une rétro-ingénierie des actions de l'utilisateur pour générer des "requêtes fantômes".

1. **Le point d'entrée (Le Cadenas) :** Afin de ne pas surcharger l'interface, la largeur du champ « Nom du projet » est légèrement réduite. À sa droite, un nouveau bouton carré contenant une icône de cadenas fait son apparition. Par défaut, le cadenas est **fermé** (édition du Texte 3 bloquée).

2. **Passage en Mode Édition (Cadenas Ouvert) :**
   Lors du clic sur le cadenas, l'interface se métamorphose pour sécuriser l'opération :
   * **Déverrouillage :** La zone « Texte 3 » s'entoure d'une bordure rouge vif et devient éditable.
   * **Verrouillage UI :** L'intégralité des autres boutons de l'application (Recherche, Remplacement, Import/Export, Navigation historique) se grise et devient non cliquable.
   * **Avertissement :** Une boîte de dialogue (*Message Box*) apparaît pour informer l'utilisateur que l'édition manuelle est une opération sensible. Elle précise que la fermeture du cadenas proposera de sauvegarder ou d'annuler les modifications.
   * **Substitution de l'en-tête (Live Find) :** Le label « Nom du projet » et sa zone de saisie disparaissent. À leur place, l'interface affiche un label « Find », une icône loupe, et un champ de recherche. Ce champ de recherche fonctionnera de manière strictement identique au champ de recherche "Live Find" développé pour la modale de débogage.

3. **Clôture du Mode Édition (La stratégie "Rusée" et Transparente) :**
   Lorsque l'utilisateur referme le cadenas, une fenêtre lui demande s'il souhaite enregistrer ou annuler. S'il valide, le système n'injecte pas son texte dans l'historique. Au contraire, il calcule ce qui a changé, génère une pile de requêtes automatiques, **remet le Texte 3 à son état initial strict**, et pousse cette pile générée dans l'Assistant de requête (le module MultiStack). 
   *Conséquence :* L'édition manuelle est traitée in fine comme des requêtes standards, permettant au moteur de rendu d'appliquer toutes les règles visuelles (surlignages, couleurs) et de respecter la nouvelle architecture d'historique.

**B : ROADMAP**
Le développement de cette feature complexe doit suivre ce séquençage strict :

1. **Intégration UI et Toggle d'état :** Implémenter le bouton Cadenas, la bordure rouge dynamique sur le Texte 3, et la fonction de grisement de l'ensemble des `.btn-large` et `.btn-square`.
2. **Implémentation du Live Find de substitution :** Créer le basculement d'affichage dans le DOM (masquer le nom du projet, afficher la barre de recherche) et brancher cette barre sur l'algorithme de recherche en temps réel déjà codé pour la modale de debug.
3. **Capture de l'état (Snapshot) :** Créer une fonction qui réalise une copie profonde (*deep copy*) de `state.rawText` au moment exact où le cadenas est ouvert.
4. **Moteur de Diffing de clôture et Fragmentation (Chunking) :** Au clic de sauvegarde, comparer le Snapshot avec le nouveau texte du DOM. 
   * **Règle absolue du Chunking :** Scinder les modifications en blocs distincts. Le critère de scission est le suivant : si le système détecte un espace de **5 à 10 lignes consécutives non modifiées** entre deux changements, il coupe et crée une nouvelle zone (un nouveau bloc).
5. **Génération Fantôme et Formatage :** Pour chaque bloc identifié par le Chunking, l'algorithme doit reconstruire une chaîne de caractères respectant la syntaxe définie (ex: `##FIND## ... ##REPLACE##`). 
6. **Restauration et Routage (Le saut vers le MultiStack) :** * Le Texte 3 est écrasé par le Snapshot (annulation visuelle de ce que l'utilisateur vient de taper).
   * L'ensemble des requêtes fantômes générées est concaténé en une seule chaîne (avec amorce `##[MULTISTACK REQUEST]##` si nécessaire) et injecté dans l'outil de gestion des requêtes.
   * L'interface bascule sur l'onglet "Pile". L'utilisateur n'a plus qu'à cliquer sur "Appliquer" la pile générée.

**C : CONSIGNE SPECIFIQUE**
Cette fonctionnalité est un point de convergence de plusieurs systèmes et comporte des défis critiques :

* **Unicité des blocs FIND (Le risque de la requête fantôme) :** C'est le point de fragilité principal. Si le Chunking (B.4) génère un bloc `##FIND##` qui s'avère ne pas être UNIQUE dans le document global, la requête fantôme échouera lors de son application finale. L'algorithme de Diffing de clôture doit donc être paramétré pour capturer suffisamment de "lignes de contexte" (les fameuses 5 à 10 lignes non modifiées avant et après la modification) pour garantir que le bloc FIND généré sera strictement unique.
* **Dépendance à la nouvelle architecture JSON (Delta-Encoding) :** Cette feature dépend intrinsèquement de l'évolution de la sauvegarde (cf. 7.A.3). Si l'édition manuelle génère 3 blocs distincts, cela créera 3 requêtes dans la pile. Lors de l'application, l'historique sera créé de la façon suivante : seule la Requête 1 stockera le champ `TextBefore` complet. La Requête 2 ne stockera que l'action. La Requête 3 stockera le `TextAfter` complet. Sans cette optimisation, une simple édition manuelle ferait exploser le poids de la RAM.
* **Le défi du rendu visuel asynchrone :** Appliquer les modifications visuelles (surlignage jaune, violet `hl-word-mod`, etc.) sur du code source altéré indirectement via des requêtes fantômes va nécessiter d'invoquer les fonctions de prévisualisation et de rendu (`computeLiveDiff`, `renderHighlights`) de manière un peu détournée. Une validation rigoureuse devra être menée pour s'assurer que la boucle de rendu de l'interface principale parvient à peindre le DOM correctement lorsque la pile de requêtes auto-générées s'exécute.

### 7.B : ROADMAP
L'ordre de développement imposé est le suivant :
1. Amélioration de la Nodale de Debug (Outils de visualisation et de recherche).
2. Amélioration de la gestion des requêtes (Cherry-picking et Commentaires).
3. Ajout de la Multi-requête (MultiStack et refonte du panneau gauche).
4. Ajout d'attributs sur la pile d'historique (Optimisation JSON et architecture des données).
5. Ajout de la fonction "Edit" sur le Texte 3 (Le Cadenas et les requêtes fantômes).

### 7.C : CONSIGNE SPECIFIQUE
La vigilance est de mise sur la rétrocompatibilité. Les évolutions de la syntaxe des requêtes et de la structure du fichier JSON ne doivent en aucun cas empêcher le chargement ou le fonctionnement des anciens projets sauvegardés en V7.0.

---

### 7.1 : V7.1 Interne - Amélioration Visuelle de la Modale de Debug

**A : CE QUI A ÉTÉ FAIT**
* **Incrémentation :** L'outil passe officiellement en V7.1 pour préparer la base du système "Fail-Fast".
* **Refonte structurelle (Feature 7.A.1.1 & 7.A.1.3) :** Le champ "Requête Brute" de la modale n'est plus un simple `<textarea>`. Il a été converti vers le système propriétaire en "Calques" (`backdrop-layer` / `overlay-layer`). Cela permet désormais de voir les caractères invisibles (espaces, retours chariots, tabulations) au sein même de la requête brute copiable, sans altérer sa valeur.
* **Résolution du Bug Holographique (Feature 7.A.1.3) :** Une anomalie visuelle (décalage entre le texte édité et le surlignage de fond) polluait la lecture. Un `line-height: 14px` strict a été appliqué sur les classes CSS globales de la matrice pour garantir un alignement asynchrone parfait sur tous les navigateurs.
* **Ergonomie UI :** Ajout de la barre d'outils (Checkboxes) au-dessus des Textes 1, 2 et de l'Input Brut pour pouvoir désactiver les caractères cachés et (bientôt) la coloration syntaxique à la volée.

**B : PROBLÉMATIQUES RENCONTRÉES / POINTS DE VIGILANCE**
* **Gestion des Checkboxes "Couleurs" :** L'interface affiche désormais les boutons "Couleurs", mais ils ne sont pas encore câblés à la fonction `renderHighlights`. Cela sera fait dans l'itération V7.2 lors de l'intégration de la machine d'état (Fail-Fast).
* **Architecture DOM :** Le remplacement du `textarea` unique par le bloc en `position: relative` a nécessité la suppression de la classe `.modal-textarea-main`.

**C : PROCHAINE ÉTAPE (V7.2)**
* Implémenter le parseur lexical (Tokenizer) séquentiel pour colorer dynamiquement (en orange, jaune, violet) les composants exacts de la requête brute dans le `modal-raw-backdrop`.
* Câbler l'arrêt de la coloration ("Fail-Fast") à l'endroit exact où la requête devient invalide vis-à-vis du dictionnaire `SYNTAX_CONFIG`.

### 7.2 : V7.2 Interne - Coloration Syntaxique "Fail-Fast" de la Modale

**A : CE QUI A ÉTÉ FAIT**
* **Incrémentation :** Outil passé en V7.2.
* **Création d'un Analyseur Lexical (Feature 7.A.1.2) :** Implémentation d'un parseur séquentiel (`renderModalRawSyntax`). Cet algorithme découpe la chaîne de caractères brute (Requête) en testant de manière incrémentale la présence des jalons définis par la "State Machine" (`START`, `MULTI`, `FIND`, `REPLACE`, `END`). 
* **Rendu Visuel Fail-Fast :** Tant que la syntaxe est respectée, le parseur applique la charte graphique : Orange pour les balises système, Jaune pour les options, Violet Foncé/Clair pour le texte cible. Dès qu'un jalon n'est pas trouvé (ex: absence de la balise REPLACE), l'algorithme s'interrompt et souligne le reste du code non-parsé avec une vaguelette rouge (erreur de syntaxe).
* **Câblage UI :** Le parseur a été branché sur la case à cocher "Couleurs", et intégré aux écouteurs d'événements bidirectionnels (`processModalInput` et `updateRawFromFields`).

**B : PROBLÉMATIQUES RENCONTRÉES / POINTS DE VIGILANCE**
* **Performance d'Expression Régulière :** Pour garantir que l'Analyseur Lexical reconnaisse correctement les textes de `FIND` et `REPLACE` quel que soit leur contenu (même s'ils contiennent d'autres balises par erreur), l'algorithme utilise massivement la fonction native `indexOf` plutôt qu'un `match` Regex global. Cela émule parfaitement le comportement de l'évaluateur principal tout en économisant les ressources CPU.
* **Sécurité Anti-Injection :** Une fonction d'échappement (`escapeHtml`) est rigoureusement appelée avant chaque projection de calque pour bloquer les tentatives de corruption XSS pendant la coloration.

**C : PROCHAINE ÉTAPE (V7.3)**
* Le morceau de résistance : Algorithme de "Recherche nuancée par dégradé" (LCS fractionné ou recherche dégadée par pourcentage) pour la barre "Find" de la modale (Feature 7.A.1.4). Cela permettra de ne plus faire "Trouvé / Pas trouvé", mais d'indiquer visuellement si le texte est partiellement trouvé dans le code source.

### 7.2.1 : V7.2.1 Interne - Coloration Syntaxique "Fail-Fast" de la Modale

**A : CE QUI A ÉTÉ FAIT**
* **Optimisation des performances :** Mise en place de variables globales `modalInputTimeout` et `modalFieldsTimeout`. Les fonctions de parsing de la modale s'exécutent désormais avec un "Debounce" de 150 millisecondes, éliminant totalement l'effet de "Lag" lors de la saisie.
* **Résilience du Tokenizer :** L'algorithme de coloration syntaxique n'avorte plus aveuglément en cas de balise `##END_COPIE##` ou `##REPLACE##` manquante. Il utilise un système de repli (`lastIndexOf('\n')`) pour valider et colorer le texte légitime qui précède la balise corrompue, pointant l'erreur (vaguelette rouge) uniquement sur la zone problématique.
* **Confort Visuel (CSS) :** Ajout de la règle `padding-bottom: 25px;` sur les instances de `.backdrop-layer` et `.overlay-layer` pour empêcher la barre de défilement horizontale native du navigateur d'obstruer la dernière ligne de la requête.
* **Sécurisation des variables JavaScript :** Purge des "littéraux de gabarits" (accents graves) dans le moteur de rendu JavaScript pour éviter toute collision future avec la méthode de Patching.

### 7.2.2 : V7.2.2 Interne - Refonte du Tokenizer en Analyseur Heuristique Ligne par Ligne

**A : CE QUI A ÉTÉ FAIT**
* **Incrémentation :** Outil passé en V7.2.2.
* **Refonte du Parseur (Correction UX majeure) :** L'approche séquentielle (basée sur `indexOf` globaux) a été supprimée car elle échouait massivement en cas d'erreur de balise (entraînant le surlignage d'erreur sur l'intégralité du code). 
* **Création d'une Machine à États (State Machine) locale :** Le parseur analyse désormais le texte ligne par ligne. Il maintient un état interne (`START`, `FIND`, `REPLACE`, `END`) pour colorer dynamiquement les blocs de texte intermédiaires.
* **Correction d'erreur Heuristique :** Si le parseur détecte une ligne commençant par un préfixe de balise (ex: `##` ou `@@`) mais que l'orthographe est fausse (ex: `##REPLACE#` ou `##END_COP`), il calcule le ratio de similarité avec les balises attendues. S'il trouve une correspondance supérieure à 50%, il souligne *exclusivement* cette ligne en rouge, mais force la machine à changer d'état correctement pour sauver l'affichage de tout le reste de la requête !

**C : PROCHAINE ÉTAPE (V7.3)**
* Feature 7.A.1.4 : Intégration de l'algorithme de "Recherche nuancée par dégradé" pour le champ "Find" de la modale.

### 7.3 : V7.3 Interne - Moteur Heuristique de Recherche Nuancée

**A : CE QUI A ÉTÉ FAIT**
* **Incrémentation :** Outil passé en V7.3. L'ensemble des spécifications "Modale de Débug" de la V8.A sont désormais finalisées.
* **Nouvel Algorithme de Recherche (`liveFindModal`) :** Remplacement de la simple fonction binaire `indexOf` par un algorithme de recherche de sous-chaîne par dichotomie. Il calcule dynamiquement la plus longue portion continue de la zone `FIND` existant réellement dans le code source.
* **Colorimétrie Dynamique :** Implémentation d'un "Heatmap CSS". Selon le ratio de correspondance trouvé (Longueur trouvée / Longueur cherchée), le surlignage dans la fenêtre de visualisation varie :
  * 100% = Vert (`hl-find-100`) : Prêt à être appliqué.
  * ≥ 80% = Jaune (`hl-find-80`) : Modification mineure manquante.
  * ≥ 50% = Orange (`hl-find-50`) : Décalage modéré.
  * < 50% = Rouge (`hl-find-10`) : Correspondance critique ou lointaine.
* **Feedback Quantitatif :** Le compteur de résultat de la modale affiche désormais le pourcentage de réussite de la recherche à côté du nombre d'occurrences (ex: `1/3 (85%)`).

**B : PROBLÉMATIQUES CONTOURNÉES**
* **Sécurité Anti-Freeze (CPU) :** L'usage d'un véritable algorithme LCS (Longest Common Subsequence) a été écarté pour éviter un gel du navigateur sur des documents volumineux. La dichotomie sur la longueur de la sous-chaîne réduit les itérations à $O(\log_2 M)$ où $M$ est la longueur de la recherche, tirant profit de l'extrême optimisation de la fonction native V8 `indexOf` de JavaScript.
* **Verrouillage de sécurité :** Malgré le fait que l'algorithme trouve des occurrences partielles pour aider l'utilisateur visuellement, le bouton "VALIDER & IMPORTER LA REQUÊTE" reste strictement lié à un ratio d'exactitude de 100%, évitant toute corruption lors de l'injection.

**C : PROCHAINES ÉTAPES (V7.4 - V8.B)**
* Le chantier bascule maintenant sur la **Feature 7.A.2.1** : L'ajout du **Cherry-Picking** (`[MULTI:1,3,8]`).
* Modification du Parseur central pour lire et extraire ce nouveau format d'index.
* Création de la logique de boucle inversée ("Reverse Loop") pour opérer plusieurs remplacements distincts sans corrompre les offsets mathématiques de l'historique visuel.

🚀 Phase 2 : Plan de développement pour le "Cherry-Picking" (V7.4)
Maintenant que la nodale de débogage est robuste (Fin de la feature 7.A.1), le DAT nous indique de passer à la Feature 7.A.2.1 : L'ajout du Cherry-Picking.

C'est une fonctionnalité très sensible car elle touche à l'intégrité de ton code source et aux offsets mathématiques de tes historiques de modifications.

Voici comment je prévois de structurer cette V7.4 en 3 blocs itératifs pour éviter de tout casser :

Le Parseur et la State Machine (Bloc 1) : Modifier parseSyntaxRequest (et notre nouveau renderModalRawSyntax) pour qu'ils ne cherchent plus uniquement [MULTI:TRUE|FALSE], mais qu'ils acceptent une liste d'entiers type [MULTI:1,3,8]. On ajoutera une variable state.multiIndices = [] dans l'état global.

L'Interface Utilisateur (Bloc 2) :
Dans le panneau de gauche, sous les paramètres, nous allons créer la "combolistbox" demandée dans le DAT. Elle s'activera dynamiquement lorsqu'une recherche trouve plusieurs résultats. Elle affichera des cases à cocher [ ] Occurence 1 (Ligne X), [ ] Occurence 2 (Ligne Y), etc., permettant un contrôle manuel total.

Le Moteur de Remplacement "Reverse Loop" (Bloc 3) :
C'est l'étape critique. Modifier la fonction effectuerRemplacement. Au lieu de remplacer toutes les occurrences trouvées, elle devra lire notre liste multiIndices. Surtout, elle devra obligatoirement commencer par la dernière occurrence (ex: la 8, puis la 3, puis la 1) pour s'assurer que le remplacement de l'occurrence 1 ne décale pas l'index de l'occurrence 3 (Index Shifting).

### 7.4 (Bloc 1) : V7.4 Interne - Cerveau et Parseur Cherry-Picking

**A : CE QUI A ÉTÉ FAIT**
* **Incrémentation :** Outil passé en V7.4.
* **Architecture des données :** Ajout d'un tableau `multiIndices` dans la State Machine globale et la modale.
* **Évolution du Parseur Principal (`parseSyntaxRequest`) :** La fonction pure d'analyse Regex accepte désormais un groupe de capture numérique complexe `\d+(?:,\d+)*`. Elle retourne l'information correctement castée en tableau d'entiers.
* **Adaptation du Tokenizer Fail-Fast :** Le moteur heuristique reconnaît désormais cette extension de balise pour ne plus déclencher d'erreur syntaxique.
* **Reconstruction Bidirectionnelle :** Les fonctions `updateRawFromFields` et `applyModalQuery` ont été mises à jour pour sérialiser et restituer le tag `[MULTI:X,Y,Z]` dynamiquement sans le transformer en un simple `TRUE/FALSE`.

**C : PROCHAINE ÉTAPE (Bloc 2 - UI)**
* Implémenter l'interface visuelle (les Cases à cocher) dans la zone de gauche pour voir, cocher et décocher chaque occurrence manuellement ou suite à un collage de tag `[MULTI:X,Y]`.

### 7.4.1 : V7.4.1 Interne - Interface Utilisateur du Cherry-Picking (ComboListBox)

**A : CE QUI A ÉTÉ FAIT**
* **Incrémentation :** Outil passé en V7.4.1.
* **Création de la ComboListBox :** Injection d'un conteneur dynamique (`#multi-list-container`) sous les paramètres de la zone de gauche.
* **Génération Dynamique :** La fonction `renderMultiList` calcule le numéro de ligne absolu de chaque occurrence trouvée dans le code source global et génère une liste de cases à cocher contextuelles.
* **Contrôle Interactif :** Cocher ou décocher une sous-occurrence met à jour le tableau global `state.multiIndices`. Si toutes les cases sont décochées, l'outil désactive la sécurité globale et grise le bouton de remplacement.
* **Sécurisation (Hotfix V6.7) :** Le bouton d'action "REMPLACER" vérifie désormais formellement l'état de `state.multiMode` pour prévenir les réactivations fantômes après une annulation. 

**C : PROCHAINE ÉTAPE (Bloc 3 - Le Cœur du Réacteur)**
* Modifier la fonction `effectuerRemplacement`.
* Créer la "Reverse Loop" (Boucle Inversée) qui lira le tableau `multiIndices` et exécutera les remplacements de la fin vers le début du document afin d'éviter toute corruption mathématique liée à l'Index Shifting !

### 7.4.2 : V7.4.2 Interne - Peaufinage UX Cherry-Picking et Branche

**A : CE QUI A ÉTÉ FAIT**
* **Incrémentation :** Outil passé en V7.4.2.
* **Mise en valeur visuelle ciblée :** Les occurrences décochées dans la liste MultiMode adoptent un nouveau rendu (`hl-yellow-pale`). Elles deviennent translucides avec un pointillé, laissant le focus visuel principal aux occurrences validées pour le remplacement.
* **Navigation par l'UX :** Cliquer sur le texte descriptif d'une occurrence dans la liste force un défilement dynamique asynchrone (`scrollToTarget`) centrant le code source sur la zone concernée.
* **Standardisation de l'Historique :** La création de branche via "Time-Travel" passe par la même boîte de dialogue modale que "Versionner", exigeant explicitement le choix entre une itération Majeure ou Mineure.

**C : PROCHAINE ÉTAPE (Bloc 3 - Moteur)**
* S'attaquer à l'algorithme "Reverse Loop" dans la fonction `effectuerRemplacement`. L'objectif est d'itérer de la fin du code source vers le début pour appliquer le Cherry-Picking sans corrompre les Index de coloration historique.

### 7.4.3 : V7.4.3 Interne - Retour Visuel Avancé (Gutter & Liste)

**A : CE QUI A ÉTÉ FAIT**
* **Incrémentation :** Outil passé en V7.4.3.
* **Gouttière Intelligente (Gutter) :** Refonte de la fonction `updateLineNumbers`. Les numéros de ligne intègrent désormais des pseudo-indicateurs absolus (Puces jaunes `●` pour les occurrences trouvées, et Flèche rouge `▶` pour l'occurrence active). Ce système outrepasse les surlignages d'historique (vert) pour garantir la visibilité des recherches même sur un code saturé de modifications.
* **Focus Checkbox :** Un clic sur la case à cocher d'une occurrence dans la liste déclenche désormais un appel à `focusOccurrence(index)`, forçant le centrage visuel dans le Texte 3.
* **Surbrillance ListBox :** Ajout de la classe CSS `.active-occ`. L'élément cliqué dans le conteneur de gauche s'encadre et se grise pour fournir un feedback visuel constant à l'utilisateur sur sa position dans le document.

**C : PROCHAINE ÉTAPE (Bloc 3)**
* Plus d'excuses ! On passe au moteur de remplacement "Reverse Loop" dans la fonction `effectuerRemplacement`.

APRES AUDIT DE TEST : version non fonctionnelle. donc on reboucle.

### 7.4.4 : V7.4.4 Interne - Hotfix Gouttière et Synchronisation

**A : CE QUI A ÉTÉ FAIT**
* **Correction Alignement :** Suppression des règles CSS intrusives (`display: block` et `position: absolute`) qui cassaient le flux vertical du `white-space: pre` de la gouttière des numéros de ligne. L'injection des marqueurs se fait désormais sous forme de texte en ligne classique.
* **Correction Data-Binding (Majeur) :** Le moteur de rendu `updateMainView` passait par erreur l'objet statique `state.marks` (qui ne contient que l'historique de modification) à la gouttière, ignorant totalement la recherche active en cours. La gouttière reçoit désormais le tableau calculé dynamique combiné, lui permettant d'afficher les puces jaunes et la flèche de focus.

### 7.4.5 : V7.4.5 Interne - Finalisation du Moteur Cherry-Picking (Reverse Loop)

**A : CE QUI A ÉTÉ FAIT**
* **Incrémentation :** Outil passé en V7.4.5.
* **Moteur de Remplacement Sélectif :** Refonte intégrale de `effectuerRemplacement`. La fonction sait désormais filtrer ses cibles en comparant les occurrences trouvées avec le tableau `state.multiIndices`.
* **Algorithme "Reverse Loop" :** Implémentation d'un tri décroissant des index avant application. En traitant le document de la fin vers le début, le moteur garantit que la modification de la longueur d'un bloc de texte n'invalide pas les coordonnées mathématiques des blocs situés plus haut dans le document.
* **Gestion Dynamique de l'Action :** Le journal d'historique s'adapte désormais au type d'opération. Il affiche le nombre exact d'occurrences traitées ou précise le numéro de l'occurrence choisie en cas de ciblage unique (ex: `Opération Z4 (Cherry #3)`).
* **Nettoyage UI :** Le patch réinitialise automatiquement le conteneur de liste Cherry-Picking après application pour éviter toute confusion visuelle.

**B : POINTS DE VIGILANCE**
* **Index Shifting :** La logique de décalage des marques (`currentMarks.map`) a été affinée pour s'appliquer à partir du point exact de modification (`tIndex + searchStr.length`), évitant ainsi de décaler par erreur une marque située au sein même du bloc en cours de modification.

**C : PROCHAINE ÉTAPE (V7.5)**
* Feature 7.A.2.2 : Ajout des **Commentaires** dans la requête (balise `##Commentaire##`) et stockage de ces métadonnées dans l'objet d'historique.

### 7.4.6 : V7.4.6 Interne - Ajout des Macro-Commandes et Refonte Branche

**A : CE QUI A ÉTÉ FAIT**
* **Incrémentation :** Outil passé en V7.4.6.
* **Audit et i18n :** Validation de l'internationalisation (`APP_CONFIG`). Création ou redéfinition des variables textes et infobulles pour l'ensemble des modules récents (Les 3 bascules de modale, l'interface de liste et le prompt de branche).
* **Boutons Macro (Tout cocher/Rien) :** Ajout de deux boutons de pilotage rapide au-dessus de la fonction de vidage (`#multi-list-controls`). Ils s'affichent de façon contextuelle en synchronisation stricte avec la présence de la ComboListBox. La fonction `setAllMulti()` itère massivement sur les Checkboxes puis appelle une mise à jour d'interface unique.
* **Evolution Time-Travel (Branche 0) :** La fonction `applySelectedBranch` gère dorénavant une 3ème directive : la touche '0'. Au lieu d'incrémenter le numéro de version (comportement d'arborescence), le projet fige et clone littéralement le numéro de version de la source cliquée (comportement de "Rollback" pur). Le log du tableau affiche la mention `RETURN TO V(X.Y.Z)`.

**C : PROCHAINE ÉTAPE (V7.5)**
* Après cette parenthèse d'amélioration UX (absolument nécessaire), on peut reprendre la roadmap à la lettre : **Feature 7.A.2.2 - L'intégration des commentaires** et leur stockage persistant dans le JSON.

### 7.4.7 : V7.4.7 Interne - Workflow Cherry-Picking (Modale, Clics et Audit IA)

**A : CE QUI A ÉTÉ FAIT**
* **Incrémentation :** Outil passé en V7.4.7.
* **Audit IA (Sécurité Mandatory) :** Ajout de la fonction `generateAuditIA()` et du bouton "AUDIT IA 🤖". Si une liste d'occurrences est ciblée par un Cherry-Picking, l'utilisateur peut générer automatiquement un rapport dans son presse-papier contenant le contexte de code (-10/+10 lignes) pour validation par son assistant IA. *(Note technique : protection Regex et caractères d'échappement ASCII appliqués pour ne pas faire planter la console au rendu)*.
* **Alertes Visuelles :** Le label "MULTI" passe en `var(--hl-yellow)` dès qu'une configuration complexe `[MULTI:X,Y]` est insérée, attirant l'œil de l'utilisateur.
* **Rendu Modale :** Les fonctions `renderMultiList` et `updateMultiIndices` ont été refactorisées pour accepter un paramètre `isModal`. La Modale de Débogage possède désormais sa propre `ComboListBox` miroir.
* **Interaction DOM (Click / DblClick) :** Le moteur de rendu `renderHighlights` injecte maintenant un attribut `data-occ` aux `yellowMarks`. Les balises `<mark>` écoutent les clics (`handleMarkClick`) et doubles clics (`handleMarkDblClick`) pour naviguer dans la liste et cocher/décocher directement depuis la vue du code source.

**C : PROCHAINE ÉTAPE (V7.5)**
* Le workflow Cherry-Picking est 100% clos et robuste.
* Prochaine étape : Feature 7.A.2.2 (Les Commentaires) pour pouvoir typer les modifications directement dans les fichiers de requêtes JSON.

### 7.4.8 : V7.4.8 Interne - Correction des Outils de Défilement (UX)

**A : CE QUI A ÉTÉ FAIT**
* **Alignement Mathématique (Bug 4) :** Ajout de la propriété `position: relative` sur la classe `.main-code`. La fonction JS `offsetTop` base désormais son calcul de scroll sur les bordures du texte, et non plus sur la page entière, ce qui ramène le centrage visuel à la perfection.
* **Tressautement de clic (Bug 4) :** Ajout d'un Flag `fromCodeClick`. Un clic sur une occurrence `yellowMark` actualise la liste à gauche, mais suspend le recalcul asynchrone de `scrollToTarget` pour éviter que l'écran ne saute violemment sous la souris de l'utilisateur.
* **Auto-Scroll de Liste (Bug 1) :** La fonction `focusOccurrence` force désormais la ComboListBox (conteneur de gauche) à défiler automatiquement via `scrollIntoView({ behavior: 'smooth' })` pour garder la ligne active visible à l'écran.
* **Synchronisation Modale (Bug 2) :** L'écouteur global d'initialisation injecte désormais un événement `scroll` liant strictement la vue `modal-text3` à sa gouttière `modal-line-numbers`.
* **Optimisation Modale (Bug 3) :** Le champ de recherche `Live Find` de la modale est désormais bridé par un Debounce de 300 millisecondes, empêchant le déclenchement intempestif de l'algorithme dichotomique et tuant les problèmes de Lag.

### 7.4.9 : V7.4.9 Interne - Anti-Lag (Auto/Manuel) & Data-Binding Modale

**A : CE QUI A ÉTÉ FAIT**
* **Incrémentation :** Outil passé en V7.4.9.
* **UX Anti-Lag Absolu (Auto/Manuel) :** Les deux champs critiques de la modale (`modal-raw-input` et `modal-text1`) possèdent désormais des boutons bascules (Orange=Auto / Bleu=Manuel). 
  * En mode Manuel, le navigateur ne recalcule les colorations syntaxiques lourdes (Tokenizer) et les dichotomies de recherche (`liveFindModal`) que lors d'un clic explicite.
  * Le problème de saisie bloquée (ex: la touche `#` qui freezait) est ainsi définitivement résolu pour les textes volumineux.
  * *Intelligence contextuelle :* Dès que la requête est détectée comme 100% valide par le parseur rapide d'arrière-plan, le système bascule automatiquement la zone concernée en mode Manuel pour économiser le processeur, cache le bouton, et encercle la zone d'une bordure verte (`border-valid`).
* **Correction des couleurs de sélection Modale :** Remplacement de `hl-find-100` (Vert) par la classe standard `hl-yellow` lors d'une occurrence parfaite. Cela résout instantanément le bug de non-détection du double-clic (qui ciblait les éléments par leur couleur jaune).
* **Data-Binding Ascendant :** La fonction `updateMultiIndices` (appelée lors du clic sur la ComboListBox ou le code) force désormais la mise à jour inverse (`updateRawFromFields(true)`). Cocher/Décocher un index dans l'interface modale met instantanément à jour le texte brut de la requête (ex: `[MULTI:2]` devient `[MULTI:2,4]`).