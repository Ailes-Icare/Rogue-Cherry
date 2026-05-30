# V8 - ajout n°10 : Amélioration UI / UX de la modale de debug

**Statut :** DONE

## Consigne initiale (Verbatim)

Amélioration UI / UX de la modale de debug
Dans l'état, tout fonctionne, hormis 3 points UX
=> doit etre réalisé apres l'ajout n°5 et la stabilisation du mode "search".

### 10.1 DEBUG / PRB UX.
#### 10.1.1 
actuellement, quand on rentre du texte dans le textbox de recherche, ca désactive uniquement le textbox "find". étends ca a TOUTE LA SIDEBAR DE GAUCHE. (le texte de requete, le texte de find, le bouton find dynamique, (qui doit se désactiver et se remettre dans son état précédent apres), le texte de remplacement, le bouton replace, et la case a cocher smart (qui va etre modifié ci après)
quand le textbox de recherche est vierge, alors réactiver les elements. (le bouton find dynamique doit se remettre dans son état précédent, actif ou non)

#### 10.0.2 
le bouton/label de "find dynamique" quand il affiche d'avoir trouvé plusieurs occurence avec les "petite flèche" pour naviguer d'une occurence à l'autre, ces flèches ne permettent pas de naviguer dans le texte principal. 
il n'y a pas de déplacement, ni de carré rouge, ni le petit icone bleu qui se déplace.
de plus concernant ce bouton, il y a le meme bug qu'il y avait sur le "find dynamique" de la fenetre principal : les boutons sont très sensible, et de manière "ressenti comme aléatoire" pour l'utilisateur, les clic sur les boutons "fleche" sont confondu avec une désactivation du find dynamique.
enfin, les deux fleches sont trop petite et trop proche l'une de l'autre, ca demande une précision chirurgicale de naviguer dessus.

#### 10.1.3 
quand on utilise la fonction "recherche" (la partie en haut a gauche qui désactive find), et que plusieurs occurence sont trouvé, les "petite flèche" pour naviguer d'une occurence à l'autre, ces flèches ne permettent pas de naviguer dans le texte principal. 
il n'y a pas de déplacement, ni de carré rouge, ni le petit icone bleu qui se déplace.

### 10.2 AMELIORATION FONCTION RECHERCHE : 
pour la textbox de recherche, reproduire le comportement évoqué en 5
UI, UX et comportement.
ne pas oublier de verrifier que la recherche inclue bien l'algo 8.8 et qu'il ne soit pas supprimé.

### 10.3 AMELIORATION AUTRE : 
#### 10.3.1 
remplace la case à cocher "concillier les espaces (smart mode) par un bouton identique a celui "smart" défini en 5.1

#### 10.3.2 
place le en haut de la sidebar de gauche, sur la meme ligne que "REQUETE BRUTE" et la case a cocher "invisible", à gauche de cette case a cocher (soit au final : label "requete brute (...)", le bouton smart, la fonction "invisible"

#### 10.3.3 
implémente l'equivalent de 5.3 : un double clic sur la numérotation des occurence de "find" lance la minimodale de choix de n° de ligne (avec l'attribut debug a true)

#### 10.3.4 
transforme la case a cocher "invisible" par un bouton a deux état sans texte mais avec une icone "espion" ou "loupe" ou quelque chose d'évocateur (la loupe étant deja utilisé pour la recherche, je suis pas fan)
met en tool tip text "affiche ou cache les carractère invisible dans les textbox requete, find, replace"
par défaut cette fonction / bouton est désactivé

---

## Précisions ultérieures (Verbatim issus de la conversation)

> "l'UI et l'UX de la barre de recherche doivent etre STRICTEMENT IDENTIQUE a celle de l'ajout n°9 qu'on vient de créer. c'est ta base de référence à dupliquer scrupuleusement. nos conversation tout comme la story devrait te permettre de solder toute ambiguité."

> "Premier problème : la barre de recherche, les boutons smart, similitudes, etc. se stackent sur une seule ligne au-dessus de la barre de recherche. L'objectif était de les disposer à gauche et à droite de cette barre. Il faut reproduire exactement l'apparence de la page principale, ce qui n'est absolument pas le cas actuellement."

> "Problème 1 — Fermeture intempestive de la modale de gestion des occurrences
Dès que je clique sur la flèche, la modale se ferme immédiatement. Elle interprète l'appui sur la flèche comme un déplacement d'occurrence et se ferme en conséquence. Ce comportement est incorrect."

> "Problème 2 — Colorisation incorrecte de la goulotte
La colorisation ne correspond pas au comportement attendu. Normalement : un point jaune doit apparaître sur toutes les occurrences trouvées, et un petit carré bleu avec une flèche doit s'afficher sur la ligne de l'occurrence active."

> "Problème 3 — Absence de barre de défilement horizontale sur la goulotte
Lorsque le nombre de lignes dépasse un certain seuil, une barre de réglage horizontale devrait apparaître pour permettre à l'utilisateur de choisir la hauteur souhaitée. Vérifier comment cette fonction est implémentée dans la fenêtre principale et la réimplémenter à l'identique."

> "Problème 4 — Absence de la fonction de zoom dans la textbox
La textbox n'est pas équipée de la fonctionnalité de zoom."

> "Problème 5 — Numéros de ligne de la goulotte bloqués après un certain seuil (concerne la modale de debug ET la fenêtre principale)
[...] la boussole doit remplacer le « 1 » visuellement, mais le numéro 1 doit continuer d'exister en dessous — caché, transparent — et la goulotte doit se déplacer normalement avec le texte lorsque l'utilisateur fait défiler vers le bas. La boussole, elle, reste fixe à sa position."

> "Le premier est que j'ai un peu le même problème que j'avais déjà signalé sur la page principale, à savoir que le système a une légère tendance à mélanger un simple clic et un double clic, y compris lorsque je clique sur les flèches. 
Le deuxième problème : lorsque je double-clique dessus pour désactiver le Find, l'ensemble de la zone se grise, mais en réalité le Find dynamique continue de fonctionner sous de nombreux aspects — notamment la colorisation et ce genre de choses. De plus, lorsque j'étais en mode multi-occurrence, même avec le Find désactivé, il continue d'afficher les résultats de la multi-occurrence, ce qui ne devrait pas être le cas. Globalement, lorsque le Find est désactivé, tout devrait être remplacé par le bouton Find grisé, et c'est tout.
Enfin, dernier problème : lorsque je fais un simple clic dessus alors qu'on est en mode multi-occurrence, la modale de sélection s'affiche bien, mais elle ne semble pas vraiment réagir."

---

## Règles déduites (Mandatory)

1. **Parité absolue UI/UX** : Tout composant "global" ou partagé virtuellement entre l'application principale (`CodeEditor.jsx` ou `SidebarLeft.jsx`) et une modale (comme `SmartDebugger.jsx`) doit se comporter de manière **stricto sensu identique**, y compris pour le Flexbox (alignements sur les bords), les barres de redimensionnement (`Splitter`), le défilement synchronisé, le Zoom (`Ctrl+Molette`) et les intercepteurs de clic.
2. **Double Clic vs Simple Clic** : Ne jamais utiliser un `onDoubleClick` natif sur un parent sans protéger tous les clics enfants. Privilégier le pattern `setTimeout(..., 250)` avec `clickTimeoutRef` pour différencier l'intention de l'utilisateur de façon fiable et permettre les interactions précises (comme des boutons fléchés très petits ou collés).
3. **Synchronisation du Scroll (Gouttière/Texte)** : Lorsque des lignes numérotées accompagnent une `textarea`, attacher l'événement `onScroll` à la `textarea` pour aligner le `scrollTop` de la gouttière en temps réel.
4. **Cohérence de l'état Inactif** : Lorsqu'une fonctionnalité globale de repérage (FIND, SEARCH) est désactivée par un bouton "toggle", sa chaîne active (`activeSearchText` ou équivalent) DOIT impérativement se réinitialiser (`""`) en aval pour nettoyer instantanément la Heatmap et les modales de multi-occurrences associées. Rien ne doit survivre visuellement à l'extinction.
