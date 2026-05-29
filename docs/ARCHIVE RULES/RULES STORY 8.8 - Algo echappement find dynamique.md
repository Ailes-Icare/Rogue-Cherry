# RULES STORY 8.8 - Algo d'échappement du "find dynamique"

### Verbatim des consignes initiales (Fichier PILE TO DO)

### 8.8 :
algo d'échapement du "find dynamique". ceci doit etre appliqué dans les 4 cas : la zone "texte à chercher", ainsi que la zone de texte de recherche en haut, dans la fenetre principale et dans la modale de debug (les deux fenetres ont leur propre instance du "find dynamique", meme si celle ci est codée avec un seul et meme code). 
SI le mode "find" dynamique est activé, ET si le texte principal fait plus de 500 lignes, ALORS désactiver le "find" dynamique tant que le texte à rechercher ne fait pas au moins 3 caractère. appliquer cette désactivation silentieuse AVANT de faire toute recherche. un indicateur visuel doit s'afficher pour informer "texte à chercher trop court dans un texte trop long". toutefois, un double clic sur cet indicateur doit forcer l'activation du "find" dynamique et relancer la recherche. un message d'avertissement "accepter ou refuser" doit s'afficher pour prévenir l'utilisateur des consequence de son acte (gros risque de lag, devoir attendre, lettre par lettre, que la recherche des forcément nombreuse occurence se termine.
les deux limites (500 et 3) sont éditable. dans le messagebox qui apparaitra pour avertir l'utilisateur, il aura le choix entre "accepter" ou "annuler", mais aussi "éditer les limites". cela affichera une seconde messagebox avec deux text d'input pour entrer la taille max du texte principal admis et la taille mini du texte a chercher admis)

### Précision ultérieure :
*Note de la conversation :*
"tout fonctionne du premier coup. 'testé sur les deux "FIND" dans la modale de debug et la fenetre principale. pas testé sur les deux "Search"."
"créé un nouveau point dans le Pile Todo toutefois : copie dedans cette story en ajoutant la mention "apres génération et stabilisation du "search", s'assurer que ce systeme fonctionne aussi en mode recherche. cette ajout sera a traiter apres avoir fait l'ajout n°5."

---
*MANDATORY : L'algorithme d'échappement est essentiel pour éviter que des saisies courtes dans un contexte très large ne bloquent l'application (lag/gel). Les limites définies sont éditables par l'utilisateur et appliquées sur les zones de "Find" et "Search" (bien que l'impact sur le "Search" sera audité après la tâche 5).*
