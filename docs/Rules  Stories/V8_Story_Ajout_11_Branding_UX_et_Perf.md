# Story : Ajout n°11 - Branding, UX Finale et Fix de Performance React

Cette story archive l'implémentation de la tâche d'amélioration UX globale (branding, splash screen) ainsi qu'un correctif majeur concernant un anti-pattern de performance React critique découvert lors de l'intégration.

## Verbatim de la demande initiale (Tiré de la pile To-do)

```markdown
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
```

## Précisions ultérieures (Issues de la conversation)

### 1. Concernant le Splash Screen et son responsive

**Algorithme de réduction (Demande 1) :**
> "À partir de cette version grande taille, déduis ensuite une algorithmie de réduction — à la fois de la taille de la police, des marges et des tailles de logo — de sorte à pouvoir avoir une interface plus responsive, et que sur les petits écrans et les petites configurations le splash screen s'affiche quand même en entier. Préconisation globale pour faciliter la lecture : réduis les marges verticales sur l'ensemble des blocs de texte, ainsi que la marge qui sépare les blocs de texte les uns par rapport aux autres."

**Adaptation stricte 1080p (Demande 2) :**
> "Ton algorithme de responsive est un peu trop conservatif sur la taille des polices et des marges. Actuellement, on fait l'essai sur un écran standard 1920x1080 et on est obligé d'utiliser la molette pour réussir à lire tout le texte, ce qui est un vrai problème. Sur un écran 4K, l'affichage est parfait [...] Voici ma demande : j'aimerais qu'en 1080, le splash screen s'affiche encore en entier. Les polices doivent se réduire, mais pas de beaucoup, afin de rester parfaitement lisibles — c'est important. En revanche, tu peux vraiment jouer sur la hauteur des marges, la taille des icônes et ce genre d'éléments. Il faut absolument que tout rentre sur un écran 1080."

**Préservation du 4K (Demande 3) :**
> "Ta proposition actuelle pour le 1080 me convient très bien, ta proposition précédente pour le 4K me convenait parfaitement, et ta proposition pour descendre en dessous de 1080 me convient également parfaitement. Ce qui manque maintenant : réintègre la version précédente du 4K, développe le mécanisme qui permet de passer de cette version 4K à la version actuelle 1080, et conserve dans la version actuelle ce qui permet de descendre en dessous de 1080."

### 2. Concernant le bouton "Double Cherry px" (Accès Splash Screen / Debug)

**Double fonctionnalité du bouton (Demande 4) :**
> "Je vais te demander maintenant l'ajout d'une petite feature UX [...] Ce bouton va donc lui donner maintenant deux fonctions au lieu d'une seule. Le splash screen apparaît quand on fait un double-clic sur ce bouton, et quand on fait un simple clic, je veux que ça revienne au même comportement que lorsqu'on double-clique sur le texte à chercher — ce qui en fait une manière d'appeler la modale de debug."

**État grisé / inactif au démarrage (Demande 5) :**
> "Pour le bouton Splash Screen (Cerise) sans projet chargé : il était bleu et transparent. Selon ta règle, il passe à Fond 38,38,38 / Contour 49,49,49. Veux-tu que le liseré bleu (0, 122, 204) reste visible sur ce bouton pour inviter l'utilisateur au clic, ou doit-il être strictement gris comme demandé ? Comment: "oh oui bien vu j'avais oublié. oui, fond "grisé" (38,38,38) MAIS liseret bleu, c'est un cas spécial.""

### 3. Concernant l'UI/UX : Bandeau "Gestion de Projet" et Couleurs des Boutons

**Bandeau "Gestion de projet" (Demande 6) :**
> "Gestion de projet : écris-le avec une police quasiment deux fois plus grande et mets-le sur deux lignes : « Gestion » sur la première ligne, « de projet » sur la deuxième. Je t'avais expliqué que la limite gauche du cadre gris doit être équidistante entre le texte « Gestion de projet » et le bord gauche."

**Charte colorimétrique stricte (Demande 7) :**
> "Commencons par les couleurs. bien définissons une fois pour toute les codes couleurs suivant, en RGB: 
> un bouton "non grisé et cliquable" c'est : 
> - fond 45, 45, 45 
> - contour 68, 68, 68 sauf si liseret bleu : 0, 122, 204. 
> 
> bouton grisé et cliquable : 
> - fond 38, 38, 38 
> - contour 49, 49, 49. 
> 
> bouton grisé et non cliquable : 
> - fond 35, 35, 35 pas de liseret. 
> 
> le fond de la zone derriere les 6 bouton centraux (au dessus du texte principal) est a 30,30,30"

### 4. Concernant le Responsive Global et les Sidebars

**Sanctuarisation de la zone de texte (Demande 8) :**
> "Pour l'esthétique pure, tout est bon, on s'arrête là. En revanche, la partie responsive ne fonctionne pas correctement. Lorsque je réduis la taille de la fenêtre, la partie centrale devrait être sanctuarisée en priorité : ce sont les parties latérales qui devraient progressivement se réduire — jusqu'à 25 % — avant que la partie centrale ne soit touchée."

---

*Note de l'Assistant : Les correctifs relatifs au problème de performance critique lié au rendu des caractères invisibles découverts à la fin de cette tâche ont été archivés dans un document séparé et dédié : `V8_Story_Perf_Bug_Caracteres_Invisibles.md`.*
