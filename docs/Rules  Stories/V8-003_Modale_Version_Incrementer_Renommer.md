# RULE STORY V8 — Modale de Version : Onglets Incrémenter et Renommer

## Contexte
La modale de version (`VersionTagModal.jsx`) a été refactorisée pour supporter trois modes d'interaction, organisés en onglets.
Ce fichier documente le comportement validé des deux premiers onglets : **Incrémenter** et **Renommer**.
L'onglet 3 ("Changer de motif") est défini dans la pile todo (ajout n°0) et n'est PAS encore implémenté.

## Structure commune (hors mode Init)
- La modale est utilisée dans trois contextes : `init` (import), `upVersion` (depuis la pointe de l'historique) et `branch` (depuis un index intermédiaire).
- En mode `init`, il n'y a pas d'onglets — la modale est libre et complète.
- En modes `upVersion` et `branch`, trois onglets apparaissent : Incrémenter, Renommer, Changer de motif.
- La case "Figer l'archive (Save)" est toujours visible en bas à gauche (sauf en mode `init`).

## Onglet 1 : Incrémenter (mode par défaut)

### UI MANDATORY
- La partie haute (Nom du projet, Préfixe) est **grisée et non cliquable** (`opacity-50 cursor-not-allowed`).
- La structure des rangs est visible mais **non modifiable** (tous les inputs sont `disabled`).
- Le rang marqué "AUTO" est davantage grisé (bordure neutre, pas de bleu).
- Les boutons "INCRÉMENTER" sont en **bleu primaire** (`bg-primary-blue`) sauf sur la ligne AUTO (grisé et désactivé).
- Le bouton "Ajouter un sous-rang" est grisé et désactivé.
- Les boutons de suppression (croix rouge) sont grisés.
- **Tooltip de simulation** : le survol d'un bouton INCRÉMENTER affiche la version simulée (ex: `Incrémenter : V2.0.0`).

### Comportement
- Un clic sur INCRÉMENTER génère un Snapshot avec label `CHG VER` (ou `CHG VER + Save`).

## Onglet 2 : Renommer

### UI MANDATORY
- La partie haute (Nom du projet, Préfixe) est **active et mise en valeur** : bordure bleue + ombre (`border-primary-blue shadow-[0_0_10px_rgba(0,122,204,0.3)]`).
- Toute la structure des rangs est **complètement grisée et non interactive** (`opacity-50 pointer-events-none select-none`).
- Les boutons INCRÉMENTER restent visibles mais **gris** (pas bleus).
- Le bouton AUTO est gris (pas bleu même sur la ligne AUTO).
- Le bouton "Ajouter un sous-rang" est grisé.
- En mode `branch`, les boutons "Remettre à zéro" et "Repartir de la branche" sont **masqués**.

### Bouton "VALIDER LE RENOMMAGE"
- N'apparaît que si le nom du projet OU le préfixe a été modifié par rapport à l'état initial à l'ouverture.
- Affiché en bleu primaire avec effet `animate-pulse`.
- La touche **Entrée** déclenche la validation (si le bouton est visible).

### Comportement
- La validation génère un Snapshot avec label `CHGNAME` (ou `CHGNAME + Save`).
- Le commentaire contient `Changement du nom — AncienNom vers NouveauNom`.
- Le préfixe modifié est **appliqué dans le numéro de version** stocké dans l'historique.
- La version numérique elle-même n'est PAS incrémentée lors d'un renommage.

## Aperçu bas de modale
- Le label de gauche ("Version actuelle") affiche la version telle qu'elle est à l'ouverture de la modale. Il ne change pas pendant les manipulations.
- Le label de droite ("Prochaine auto-incrémentation" / "Aperçu après renommage") se met à jour en temps réel avec les modifications de l'utilisateur (préfixe inclus).

## Fichier source
- `src/components/VersionTagModal.jsx`

## Règle
> **L'onglet Incrémenter verrouille tout sauf les boutons INCRÉMENTER (en bleu). L'onglet Renommer verrouille tout sauf les champs Nom et Préfixe (encadrés en bleu). Le bouton Valider n'apparaît que si un changement effectif a été détecté. Entrée = valider si le bouton est visible.**
