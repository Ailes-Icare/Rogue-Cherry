# STORY V8-011 : Création MSGBOX Universelle et Drag&Drop Modales

**Statut** : DONE

## Verbatim de la consigne initiale

### 8.2 : MSGBOX
#### 8.2.1 : création
compte tenu du nombre de fois où on a a afficher des message d'alerte et des messages a choix multiple, il conviendra de creer une nouvelle modale standard qui remplacera celle par défaut.
un peu organisé à la manière des "msgbox" / "inputbox"
- un titre modifiable
- la position par défaut (centré par défaut)
- un attribut pour permettre ou non le déplacement (voir 8.3)
- taille de la modale (optionnel sinon par défaut / dynamique fonction du contenu)
- un icone dans le titre selectionnable parmis une collection (ou passable en attribut ?). optionnel
- un icone affichable a gauche ou a droite, centré ou en haut, selectionnable parmis une collection (ou passable en attribut), avec une taille passable en attribut. optionnel, ou a gauche, ou a droite (autre attribut) 
- un label box a coté de l'icone (a gauche si l'icone est a droite, ou vice versa, ou sur toute la largeur de la modale)
- le label box est multiligne. on peu choisir si la modale s'allonge, ou si on affiche un "slidebar", ou si on met une limite (allonge puis slidebar)
- on peu ajouter un "combo box" OU un "combobox a case à cocher" ou un textbox, ou un champ "entier" incrémentable / décrémentable (et donc aussi modifiable). avec des attribut de réglage permettant de selectionner leur valeur par défaut.
- on peu stacker plusieurs fois ces elements (combo box, combobox a case a cocher, textbox, champ entier). sans qu'ils soient necessairement tous du meme type. et sans qu'ils soient necessairement tous avec une valeur par defaut.
- on peu ajouter des boutons au dessous, choisir leur style, leur texte et position, ainsi que le tool tip text.

#### 8.2.2 : application
une fois généré, on remplacera toute les messagebox par defaut par celle la.

### 8.3 : Modales improvement
- ajouter la possibilité de pouvoir déplacer en drag&drop toutes les modales du projet. sauf la modale d'incrément / ligne, qui apparait toujours au dessus a gauche de la souris

---

## Précisions ultérieures (issues de la conversation)

Concernant le design et l'iconographie de la MSGBOX :
> "seulement les emojis standard
> reste effectivement dans le meme esprit visuel (et / ou passe ces réglage en attribut pour pouvoir les ajuster plus tard. les valeurs par défaut seront choisie toutefois pour etre dans le meme esprit visuel que le reste du logiciel."
