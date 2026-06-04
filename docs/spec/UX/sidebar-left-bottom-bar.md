# Sidebar Gauche — Zone Basse

## Vue d'ensemble

La zone basse de la sidebar gauche (`SidebarLeft.jsx`) constitue une barre de contrôle fixe, positionnée tout en bas de la colonne de gauche. Elle reste visible en permanence, quelles que soient les manipulations effectuées sur le splitter horizontal ou le redimensionnement de l'interface. Cette zone regroupe les options globales de validation de la requête (STRICT et MULTI), le tableau interactif de sélection d'occurrences multiples (Cherry-Picking), le bouton de nettoyage rapide, ainsi que la signature de marque de l'application.

---

## Éléments de la zone basse

### 1. Options de validation (Section gauche)

Ces contrôles modifient la façon dont le moteur évalue la requête FIND/REPLACE.

> [!NOTE]
> **Position de l'option SMART** : Pour des raisons d'ergonomie et de liaison directe avec le champ de saisie FIND, l'option **SMART** (sensibilité à la casse et aux espaces) est physiquement située dans la ligne d'en-tête du champ FIND (voir [sidebar-left-bottom-inputs.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/sidebar-left-bottom-inputs.md#2-zone-de-texte-principale-recherche-1-find)), et non dans cette barre basse. Les boutons de cette section gauche ne gèrent donc que les options **STRICT** et **MULTI**.

- **Moteur STRICT** :
  - *Comportement* : Active ou désactive le mode de recherche DraftSurge (LCS DraftSurge, via le booléen `splitChars`). Cette recherche DraftSurge n'est pas liée au fait de savoir reconnaître une chaîne de caractères dans la zone centrale, mais à des fins purement visuelles et de contrôle. Cela permet tout simplement de reconnaître les éléments qui ont été modifiés dans une ligne, quasiment au caractère près, ou au contraire d'en avoir une représentation simplifiée — au risque d'être parfois légèrement inexact — des sous-ensembles de type mots ou groupements de lettres devant être raccordés les uns aux autres de manière assez logique. En conséquence, cette fonction n'a un impact, au final, que sur la colorisation DraftSurge des éléments remplacés. 
  - *Bouton* : Libellé "STRICT". De couleur bleu primaire avec effet de lueur (`bg-[#007acc] shadow-[0_0_8px_rgba(0,122,204,0.6)]`) si actif, gris sombre (`bg-[#555]`) si inactif.
  - *Activation* : Désactivé si aucun code source n'est chargé.
  - Reste à faire : ajouter un tooltip texte qui explique convenablement ce que la fonction fait ou ne fait pas. Pour alléger l'interface et permettre au tableau multi-occurrence d'occuper le maximum d'espace quand la sidebar de gauche est réduite à son strict minimum, le label « Moteur strict DraftSurge » sera supprimé, pour ne laisser apparaître que le bouton strict. Cette suppression peut tout à fait être dynamique et raccordée à la taille de la zone. Ainsi, si la zone de gauche est suffisamment grande et permet l'affichage à la fois du tableau et de ce label, ce label sera conservé. Il sera supprimé si le bandeau est trop étroit pour laisser plus de place au tableau d'occurrence multiple. 
  - Par défaut, elle est décochée et l'utilisateur peut l'activer au besoin. Elle n'est aucunement raccordée à un attribut de la requête. 
- **Mode MULTI** :
  - *Comportement* : Active ou désactive l'application multi-emplacement de la modification (`multiMode`).
  - *Bouton* : Libellé "MULTI". De couleur violette avec effet de lueur (`bg-[#5c2d91] shadow-[0_0_8px_rgba(92,45,145,0.6)]`) si actif, gris sombre (`bg-[#555]`) si inactif.
  - *Étiquette associée* : "Multi-emplacement (N trouvés)", indiquant en temps réel le nombre d'occurrences de la chaîne FIND détectées dans le document source. Reste à faire : même constat que pour le bouton strict — le label associé pourra être supprimé ou caché pour répondre aux besoins responsifs de la réduction de la largeur du bandeau de gauche. 

---

### 2. Boutons d'action globale

- **Bouton VIDER 1 & 2** :
  - *Rôle* : Efface instantanément le contenu textuel des champs FIND (1) et REPLACE (2), ainsi que le commentaire, et tout élément en mémoire lié a la requete en cours. cela ne supprime pas une requete multistack, mais reviens plutot a totalement décocher toute requete du table. dans ce mode précis, il sera possible d'écrire manuellement une requete sans que cela supprime la pile multistack, toujours prete a etre joué. réinitialisant ainsi la saisie de la requête active.
  - *Style* : Fond gris sombre (`bg-[#333]`), passant au rouge cerise et texte blanc au survol (`hover:bg-cherry-red hover:text-white`).
  - *Activation* : Désactivé si aucun code source n'est chargé.
  - *Indépendance* : N'affecte pas le champ de commentaire, qui est géré indépendamment.

---

### 3. Label de marque et version

- **Signature "Rogue Cherry"** : Affichée en bas à gauche de manière statique, avec un effet de texte dégradé progressif allant du rouge cerise au violet (`from-cherry-red to-purple-500`), en lettres grasses et majuscules.
- **Numéro de Version** : Affiché à côté de la signature sous la forme "V1 Release / 8.11" en texte discret (`text-light/60`). Ce numéro est appelé à évoluer au fur et à mesure des incrémentations des versions. 

---

## Tableau de multi-occurrence (Cherry-Picking)

Le Cherry-Picking permet à l'utilisateur de cibler précisément quelles occurrences d'une recherche MULTI doivent être modifiées.

### Affichage conditionnel

- Le panneau de Cherry-Picking n'apparaît **que si le mode MULTI est activé et si le nombre d'occurrences trouvées est supérieur à 0** (`multiMode && occurrencesCount > 0`).
- Si ces conditions ne sont pas réunies, la boîte de Cherry-Picking est entièrement masquée de l'interface, et les options STRICT/MULTI occupent toute la largeur de la zone basse.

### Contenu et structure du tableau

Le panneau se divise en deux parties disposées côte à côte :

- **Liste des occurrences (Gauche - w-[45%])** :
  - Conteneur défilant verticalement (hauteur fixe `h-[150px]`, avec défilement fluide `scroll-smooth`) possédant une bordure gauche bleue épaisse (`border-l-4 border-primary-blue`).
  - Chaque ligne affiche une case à cocher (liée au tableau `multiIndices`) et le libellé "Occurrence #N" (où N représente l'index en BASE-1).
  - *Interaction tactile* : Cliquer sur le texte "Occurrence #N" sélectionne l'occurrence comme active (`activeOccIndex`) et fait défiler automatiquement le CodeEditor central pour la centrer à l'écran.
  - *Mise en surbrillance* : L'occurrence active courante possède un fond bleuté (`bg-primary-blue/20`) et une bordure bleue semi-transparente pour s'isoler visuellement des autres.
- **Boutons de contrôle rapide (Droite - w-[45px])** :
  - **Bouton ☑ (Tout cocher)** : Sélectionne l'intégralité des occurrences de la liste pour leur appliquer le remplacement.
  - **Bouton ☐ (Tout décocher)** : Désélectionne toutes les occurrences. Le remplacement n'affectera aucune occurrence (requête inactive).
  - **Bouton IA (Audit AI)** : Déclenche l'action `onCherryPickAudit`. Ce mécanisme extrait le contexte immédiat (3 lignes avant, 3 lignes après) de chaque occurrence cochée, protège les caractères spéciaux, génère un rapport d'audit textuel formaté pour les LLM et le copie directement dans le presse-papier de l'utilisateur.

### Interaction et Retours Visuels de Sélection

Lorsqu'un utilisateur interagit avec la liste des occurrences :
- **Clic sur une occurrence dans la liste** : Sélectionne cette occurrence comme active (`activeOccIndex`). Cela entraîne :
  - **Dans l'éditeur de code (zone de texte)** : Le document défile automatiquement (scroll) pour centrer verticalement le regard sur la ligne de l'occurrence active.
  - **Surlignage dans l'éditeur** : L'occurrence concernée apparaît en jaune vif (`.hl-yellow` — `#FFD700`) si elle est cochée, ou en jaune translucide pointillé (`.hl-yellow-pale`) si elle est décochée.
  - **Indicateur de goulotte** : Un indicateur fléché bleu (`▶`) est positionné dans la goulotte en face du numéro de ligne de l'occurrence active focalisée.

### Logique d'Initialisation des Occurrences (Attribut multi)

Par défaut, lors du chargement d'une requête, l'état coché ou non coché des cases du tableau est déterminé par l'attribut `multi` spécifié dans l'en-tête de la requête :
- **Initialisation standard** : Un en-tête contenant `[MULTI:0,2]` (indices en Base-0) verra par défaut les occurrences 1 et 3 (Base-1) cochées dans le tableau de Cherry-Picking, tandis que toutes les autres occurrences trouvées dans le fichier seront décochées.
- **Initialisation par défaut (vide ou TRUE)** : Si l'attribut est simplement `[MULTI:TRUE]` (sans indices précisés), toutes les occurrences détectées dans le fichier sont cochées par défaut.

### Mode MULTI Inversé / Négatif (Exclusion)

Il existe un mode d'initialisation inversé ou négatif permettant de désigner des occurrences à exclure par défaut :
- **Fonctionnement** : Indiqué par la syntaxe `[MULTI:NO 0,2]` (ou concepts de type `multi(-1)` dans les consignes), ce mode applique la logique inverse de celle spécifiée.
- **Exemple concret** : Pour un en-tête `[MULTI:NO 0,2]`, le système cochera par défaut toutes les occurrences du fichier, à l'exception des occurrences 1 et 3 (les indices 0 et 2).
- **Règle de limitation dynamique** : Cette exclusion s'applique strictement sur la liste des occurrences existantes détectées à l'instant T dans le document. Ainsi, le résultat final varie selon le nombre total d'occurrences. Si le fichier contient 3 occurrences, seule l'occurrence 2 sera cochée. Si le fichier contient 6 occurrences, les occurrences 2, 4, 5 et 6 seront cochées.

### Impact direct sur l'application

Le choix de cocher ou décocher une occurrence dans ce tableau de Cherry-Picking a un impact immédiat et direct sur l'application de la requête :
- **Occurrence cochée** : La modification (REPLACE) y sera appliquée lors de la validation.
- **Occurrence décochée** : Le texte d'origine (FIND) y sera conservé inchangé, sans affecter le reste du code.

---

## Comportement fixe et responsive

- La zone basse possède une hauteur structurelle fixe incompressible qui s'adapte à la présence du Cherry-Picking :
  - **Sans Cherry-Picking** : Hauteur physique brute de **160 px** sanctuarisée.
  - **Avec Cherry-Picking** : Hauteur physique brute de **220 px** sanctuarisée.
- **Butée de sécurité du Splitter** : Lors des calculs de redimensionnement par le splitter horizontal, une marge de garde de 20 px est ajoutée sur ces dimensions physiques. Ainsi, les contraintes de butée basse appliquées au splitter sont respectivement de **180 px** (sans Cherry-Picking) et de **240 px** (avec Cherry-Picking) pour éviter tout rognage ou scrollbar parasite sur les éléments d'options et de Cherry-Picking (voir [ui-layout-main.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/ui-layout-main.md#1-splitter-gauche)).
- Cette contrainte de hauteur influe sur le redimensionnement du splitter horizontal supérieur, garantissant que le panneau de Cherry-Picking et les boutons restent entièrement accessibles et ne glissent jamais hors de l'écran.

---

## Dépendances et références

- Voir [sidebar-left-bottom-inputs.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/sidebar-left-bottom-inputs.md) pour les champs de texte situés juste au-dessus.
- Voir [ui-layout-main.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/ui-layout-main.md) pour les règles globales du layout et du responsive vertical.
