# RULE STORY V8 — Modale de Version : Onglet Changer de motif

## Contexte
La modale de version (`VersionTagModal.jsx`) possède un troisième onglet "Changer de motif", implémenté pour permettre à l'utilisateur de modifier profondément la structure de la version (ajouter des rangs, changer les types, réinitialiser la configuration) sans repartir de zéro.

## UI MANDATORY
- La partie haute (Nom du projet, Préfixe) est **active et mise en valeur** (similaire au mode Renommer), car l'utilisateur peut avoir envie de changer le nom en même temps qu'il change le motif.
- La structure des rangs est **totalement éditable** (séparateur, type, valeur, auto-index). 
- Par contre, les boutons "INCRÉMENTER" sont **masqués** : on ne demande pas d'incrément en même temps qu'on change de structure.
- Des boutons d'aide à la modification apparaissent à côté du titre "Structure des Rangs" :
  - **Remise à 0 compteur** : Remet toutes les valeurs numériques à `0` (sauf l'autoIndex qui passe à `0`), et toutes les lettres à `A` ou `a`.
  - **RESET** : Réinitialise violemment la modale sur le motif standard Rogue Cherry (4 rangs, pas de préfixe, autoIndex à 3, valeurs par défaut).

### Bouton "VALIDER LE CHANGEMENT DE MOTIF"
- N'apparaît que si un changement **structurel** a été détecté par rapport au motif d'origine à l'ouverture de la modale. Un changement structurel inclut : changement d'un type, d'un séparateur, d'une valeur directement à la main, ajout/suppression de rang, ou changement de l'index AUTO.
- La touche **Entrée** déclenche la validation (si le bouton est visible).

### Aperçu bas de modale
- Le label de gauche ("Version actuelle") affiche la version telle qu'elle était à l'ouverture de la modale (avec le vieux motif).
- Le label de droite ("Aperçu du nouveau motif") se met à jour en temps réel avec le nouveau motif en cours de construction.

## Comportement
- La validation génère un Snapshot avec label `MOTIF` (ou `MOTIF + Save`).
- Le commentaire affiche `Changement de motif — [Ancienne Preview] vers [Nouvelle Preview]`.
- La configuration (le tableau `ranks` et le paramètre `autoIncrementIndex`) du projet est définitivement écrasée par la nouvelle.

## Sécurité en mode "Création de Branche"
- Si l'utilisateur est sur l'onglet "Changer de motif" depuis une position historique antérieure, qu'il commence à faire des changements structuraux, et qu'il clique sur "Remettre à zéro" ou "Repartir de la branche" : **un message d'erreur rouge clignotant** apparaît au-dessus des boutons : `⚠️ Vos modifications de motif seront perdues ! Utilisez "Valider" pour les conserver.`
- S'il re-clique une seconde fois (pendant le clignotement ou après), la sécurité est levée et la branche est créée, détruisant ses modifications.
