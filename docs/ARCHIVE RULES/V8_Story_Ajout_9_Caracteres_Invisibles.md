# V8 - Ajout n°9 : Bouton des caractères invisibles

## Consignes initiales (Verbatim)

##V8 - Ajout n°9 : 
dans le bandeau bleu en bas, tout a droite, ajouter un bouton " a deux état sans texte mais avec une icone "espion" ou "loupe" ou quelque chose d'évocateur (la loupe étant deja utilisé pour la recherche, je suis pas fan)
met en tool tip text "affiche ou cache les carractère invisible dans le texte principal"
implémente la fonction, identique a celle présente dans les textbox "requete", "find" et "replace" de la modale de debug, sur le texte principal.
par défaut, cette fonction / bouton est désactivé.

####10.3.5 
dans le bandeau au dessus du texte principal, ou se trouve le label "MIROIR DE PREVISUALISATION DU CODE SOURCE", ajoute, à droite, le meme icone que 10.3.4 et, comme pour l'ajout 9, ajoute la fonction pour cacher / afficher les caractère invisible dans la zone de texte principal de la modale de debug
modifie le tool tip text : "Affiche ou cache les cara inivisble dans le texte principal"
par défaut, cette fonction / bouton est désactivé.

## Précision ultérieure (Verbatim de nos échanges)

"Ton prédécesseur a déjà partiellement implémenté la fonction. Voici les trois problèmes à traiter.
Note préliminaire : L'ajout numéro 10 mentionne probablement des étapes relatives à la modale de debug. Dans la mesure où l'algorithme a déjà été installé, si certaines de ces étapes concernent des cas couverts par l'ajout numéro 9, il faudra les déplacer dans ce dernier afin de traiter les deux contextes ensemble : la page principale et la modale de debug.

Problème 1 — UI : couleur de l'icône œil [...] sa couleur grise sur fond bleu est illisible.
Problème 2 — Affichage du caractère de retour à la ligne [...] L'apparition d'un slider vertical sur ces lignes rendait la navigation dans le code source totalement impraticable.
Problème 3 — Performance sur les textes longs [...] si l'on charge un texte de 9 000 lignes et que l'on active l'affichage des caractères invisibles, le PC sature complètement pendant près de dix minutes. [...] Pour limiter la charge mémoire, ces caractères pourraient n'être rendus que sur une fenêtre d'environ 300 lignes"

## Compréhension et Résolution Technique (Implémentation)

L'implémentation de cet ajout nécessitait de concilier la gestion visuelle des caractères invisibles et les performances sur les textes volumineux.

1. **Performances (Windowing Actif)** : L'injection de milliers de balises `<span>` (pour matérialiser les espaces et retours à la ligne) faisait saturer la RAM. J'ai donc implémenté un système de **Windowing**. Un écouteur de scroll calcule dynamiquement l'intervalle de lignes affiché à l'écran (+/- 100 lignes de sécurité). Le rendu des caractères invisibles n'est actif QUE dans cet intervalle. L'algorithme a été implémenté d'une part sur le conteneur principal `CodeEditor.jsx`, et d'autre part sur le "Miroir" du `SmartDebugger.jsx` (ex-ajout 10.3.5), garantissant des performances optimales pour des fichiers allant jusqu'à 9 000 lignes.
2. **Scroll vertical du retour à la ligne** : L'apparition intempestive de sliders verticaux pour `.hc-nl` (caractère `↵`) était un problème de CSS. En neutralisant sa hauteur (`line-height: 0`) et en utilisant un centrage vertical absolu (`transform: translateY(-50%)`), le symbole est affiché sans déformer la structure HTML de la ligne.
3. **UI Icone** : L'icône (un œil) a été ajustée pour avoir une couleur `text-[#d4d4d4]` (gris très clair) à l'état inactif pour contraster correctement avec le fond bleu et rester cohérent dans tous les panneaux.

**MANDATORY RULE** : 
Le fenêtrage (Windowing) dynamique basé sur un `visibleRange` et un `CodeLine` / `MirrorLine` isolé dans un `React.memo` est désormais la norme absolue dans le projet pour tout rendu nécessitant de l'enrichissement par balise sur des gros textes. Il ne faut plus revenir à des boucles complètes sur l'intégralité du code. De plus, tout ajustement des caractères invisibles doit se faire exclusivement via modification des attributs de positionnement sans altérer le `line-height` standard.
