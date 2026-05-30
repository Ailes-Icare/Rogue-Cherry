# RULES STORY 8.7 - Changement d'UI et d'UX en préparation de la V9 (Boutons Gestion Projet)

### Verbatim des consignes initiales (Fichier PILE TO DO)

### 8.7 :
changement d'UI et d'UX en préparation de la V9.
les trois boutons en haut a droite (save, open, reset) vont avoir une importance critique dans la V9. il faut deja les renommer plus explicitement : SAVE PROJECT, OPEN PROJECT. le RESET doit etre divisé en deux (les deux boutons occuperont la meme place). actuellement les deux ont un peu le meme fonctionnement. le bouton RESET ira tout a droite et restera. tool tip text "ferme tout les projet en cours et remet l'application vierge".
assure toi que "reset" vide toute la mémoire autant que possible.
le nouveau bouton sera baptisé "Fermer projet courant". pour l'instant il a le meme effet que le reset. mais en V9, il ne s'appliquera qu'au projet courant. c'est a dire a UN et un seul JSON.
le bouton open et les deux boutons reset / fermer auront le meme comportement que respectivement le bouton "sauver" / "exporter" et le bouton "Up Ver".
c'est a dire : si le logiciel est vierge, soit qu'il vient d'etre lancé, soit qu'il viens d'etre reset, les bouton save et les deux bouton reset sont grisé et non cliquable.
quand un projet est ouvert (soit parce qu'on a utilisé OPEN PROJECT, soit parce qu'on a ouvert un fichier avec "ouvrir" ou "import", en somme un "init" est apparu dans l'historique), alors les deux boutons "reset" / "fermer" deviennent non grisé et cliquable. ils resteront ainsi jusqu'au prochain reset / fermeture. (meme fonctionnement que le bouton "up ver"). le bouton "save" deviens cliquable mais grisé.
dès qu'une opération est ajouté dans l'historique, il deviens cliquable et non grisé. il redeviens grisé dès qu'une sauvegarde est effectué (SAVE PROJECT, pas "export" ou "sauver". pas confondre "fichier" (texte), et "projet" (JSON)).
le JSON de projet doit avoir un nom de projet. 
si un projet est lancé en ouvrant un fichier, alors le nom de projet deviens le nom de projet défini dans la Nodale d'import. si un proket est lancé en ouvrant un projet (json), alors le nom du projet est celui défini dans le JSON. 
le nom de projet apparait dans le label de titre du projet, avec le numéro de version. mais on ajoutera aussi une mention du nom du projet (sans version) dans le label "HISTORIQUE DES VERSIONS", à la suite (ou à la ligne si la side bar est trop étroite).

### Additif en cours de test

corrige un mini point (un ajout, pas un bug)
une fois un projet chargé, grise "open projet" (mais laisse le cliquable) en cas de reset ou de fermeture, il redeviendra non grisé. le reste à l'air de marcher.

---
*MANDATORY : Cette réorganisation des boutons de gestion de projet (SAVE, OPEN, FERMER, RESET) prépare le terrain pour la gestion multi-projets de la V9, en intégrant des indicateurs visuels clairs de l'état du projet (sale/sauvegardé/vide) via des niveaux d'opacité (grisage).*
