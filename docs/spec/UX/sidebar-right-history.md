# Sidebar Droite — Zone Centrale : Tableau d'Historique (Time-Travel)

## Vue d'ensemble

La zone centrale de la sidebar droite (`SidebarRight.jsx`) contient le tableau de la pile d'historique de versions (moteur Time-Travel). Ce tableau affiche la liste ordonnée de toutes les actions, imports, modifications et tags appliqués depuis le début du projet. Cliquer sur un enregistrement permet de remonter le temps en rechargeant l'état exact du code source à cette version donnée.

---

## Structure du tableau

Le tableau est composé de 5 colonnes et d'un en-tête fixé en haut (`sticky top-0`) de couleur `#262626` (bg-panel) avec une bordure de séparation sombre :

1. **Ver. (Version)** : Affiche le numéro de version incrémenté (ex: `0`, `1.0`, `1.1`).
2. **Label (Action)** : Description synthétique de la nature de la modification (ex: `[Import]`, `Replace`, `[Tag: v1.0]`).
3. **Commentaire** : Note textuelle décrivant la modification.
4. **Source** : Fichier sur lequel porte la modification (ex: `Fichier : 📁` ou le nom logique du fichier ciblé).
5. **Heure (Timestamp)** : Date et heure de l'action, accueillant également les boutons d'actions rapides lors de la sélection.

---

## Time-Travel et sélection de ligne

- **Clic sur une ligne** : Déclenche l'action de sélection d'index (`onSelectIndex(index)`).
  - **Mise à jour des visualisations et contrôles** : Cette action charge et affiche immédiatement le contenu complet de la requête associée :
    - Le texte de recherche (FIND) et le texte de remplacement (REPLACE) sont chargés dans les Mini-Views comparatives respectives (AVANT et APRÈS).
    - Le commentaire associé à la version (`history[selectedIndex].comment`) est chargé dans la TextBox de commentaire en lecture seule située dans la zone centrale de la section basse de la sidebar droite.
    - Les badges de métadonnées associés (**SMART** et/ou **MULTI** / **CHERRY-PICK** avec ses indices convertis en base-1) s'affichent de façon dynamique au-dessus de la TextBox.
  - **Reconstruction du texte source** : Le contrôleur d'historique reconstruit l'état exact du code source à cette étape précise (`rebuildTextAt`) et met à jour dynamiquement le contenu du `CodeEditor` principal. Cette reconstruction s'effectue en rejouant les deltas légers depuis le snapshot le plus proche, **sans tenir compte des modifications postérieures à la ligne sélectionnée** (voir l'algorithme détaillé dans [json-project-schema-v8.md](../fonction/json-project-schema-v8.md#4-algorithme-de-reconstruction-temporelle-rebuildtextat)).
  - **Auto-centrage du code** : Dès la sélection, l'éditeur de code principal fait défiler (scroll) le texte pour se centrer précisément sur la ligne de code ciblée par la requête. Dans le cas d'une requête multi-occurrence (Cherry-Picking), le centrage s'effectue automatiquement sur la première occurrence.
- **Règle Multi-Fichiers (V9)** : Si l'utilisateur clique sur une version de l'historique liée à un fichier spécifique, la zone centrale bascule automatiquement sur l'onglet de ce fichier (en le rouvrant s'il avait été fermé) pour afficher le code correspondant. Le routing et le calcul de l'arborescence à cet index sont décrits dans [json-project-v9-specs.md](../fonction/json-project-v9-specs.md#3-algorithme-de-reconstruction-de-lespace-de-travail-v9).


---

## États visuels et couleurs des lignes

L'affichage des lignes s'adapte à leur type et statut pour offrir un repérage rapide. Chaque ligne de l'interface correspond à un enregistrement JSON de la pile d'historique (voir [json-project-schema-v8.md](../fonction/json-project-schema-v8.md#2-structure-des-enregistrements-dhistorique-history) pour les structures et types précis) :

| Type de ligne / État | Couleur de fond | Couleur du texte | Règle / Signification |
|---|---|---|---|
| **Ligne Standard** | `#262626` (hover: `#1e1e1e`) | Blanc cassé (`#text-light`) | Modification classique de type `replace`, sélectionnable. |
| **Ligne Sélectionnée** | `#37373d` | Blanc pur (Gras) | Version active affichée à l'écran. Bordure gauche bleue de 4px (`border-l-4 border-primary-blue`). |
| **Ligne Sauvegardée (`isSaved`)** | Idem | Bleu ciel (`#87cefa`) | Enregistrement de type `snapshot` ou marqué comme point de sauvegarde physique (fichier JSON). |
| **Ligne Ignorée (`isIgnored`)** | `#1e1e1e` (opacité 50%) | Gris sombre (`#555`) | Modification annulée ou désactivée de l'arbre d'historique principal (ex: masquée après Time-Travel). |
| **Ligne Info (`isInfo` - Événements)** | `#1a1a1a` | Gris (`#666`) (Italique) | Événement système de type `info` (ex: import, tags). Non sélectionnable au clic. |

### Surlignage d'Échecs d'Annulation (Smart Cancel visual highlights)

> [!IMPORTANT]
> Les lignes colorées de type « Échec annul » (cible et bloqueurs du conflit) n'apparaissent uniquement que lorsque la ligne d'historique indiquant qu'une tentative d'annulation a échoué (« ❌ Échec Annul. ») est activement sélectionnée par l'utilisateur.
> Si aucune ligne de ce type n'est sélectionnée, aucun de ces surlignages bleus ou rouges n'est visible dans le tableau.

Lorsqu'une ligne d'échec d'annulation ("❌ Échec Annul.") est sélectionnée par l'utilisateur, l'application applique un surlignage coloré contextuel sur les autres lignes du tableau pour identifier la source du conflit :
- **Cible du conflit (`conflictTarget`)** : La ligne d'historique à l'origine de la collision est colorée en fond bleu-gris (`bg-[#1a2b3d]`), texte bleu clair (`text-blue-300`) et bordure gauche bleue (`border-l-4 border-blue-500`).
- **Bloqueurs du conflit (`conflictBlockers`)** : Les lignes de modifications intermédiaires qui empêchent l'annulation automatique sont colorées en fond rouge-gris (`bg-[#3d1a1a]`), texte rouge clair (`text-red-300`) et bordure gauche rouge (`border-l-4 border-red-500`).

---

## Micro-actions et visibilité des icônes

Des boutons de raccourcis rapides apparaissent dans la cellule **Heure** selon le type de ligne sélectionnée ou son état :

### Raccourcis sur sélection (nécessitent un clic)
Les icônes suivantes ne s'affichent **que si l'utilisateur a cliqué sur la ligne concernée** pour la sélectionner activement :
- **✏️ (Éditer)** : Ouvre la modale `EditRecordModal` pour renommer le label ou modifier le commentaire associé à cette version.
  - *Disponibilité* : Visible uniquement sur la ligne active sélectionnée (hors snapshots de départ et lignes d'infos).
- **🎯 (Cibler)** : Centre l'éditeur de code principal et fait défiler le curseur vers la ligne de code exacte qui a été affectée par cette modification (`onGoToRecord`).
  - *Disponibilité* : Visible uniquement sur la ligne active sélectionnée.

### Raccourcis permanents (visibles sans clic)
Contrairement aux icônes d'édition et de ciblage, les icônes système suivantes s'affichent **immédiatement et en permanence** sur toutes les lignes concernées, sans nécessiter de clic ou de sélection préalable de la ligne :
- **⚙️ (Smart Cancel)** : Génère une pile de modifications d'annulation intelligente (`onGenerateMultistack`) pour réparer les conflits d'annulation détectés.
  - *Disponibilité* : Visible en permanence sur toutes les lignes de statut rouge "❌ Échec Annul." (non ignorées).
- **♻️ (Recharger)** : Recharge la requête FIND/REPLACE de cette action passée directement dans les formulaires de saisie de la sidebar gauche.
  - *Disponibilité* : Visible en permanence sur toutes les lignes de type "Replace" qui ont été ignorées (`isIgnored === true`).
  - *Scénario utilisateur type (New Branch)* : Lorsqu'un **New Branch** est effectué sur une version antérieure de l'historique, une dérivation est créée à partir de ce point. Par conséquent, tous les items intermédiaires situés entre la version source de dérivation et le sommet de la branche précédente sont de facto exclus et marqués comme ignorés (`isIgnored`). L'icône **Recharger** `♻️` s'affiche alors en permanence sur chacune de ces lignes délaissées, permettant à l'utilisateur de rejouer et de réinjecter facilement n'importe quelle modification passée dans sa nouvelle branche active.

---

## Les Actions Standards de l'Historique

Le tableau d'historique enregistre de manière automatique les différentes actions de l'utilisateur ou du système. Pour chaque type d'action standard, voici les propriétés générées par défaut :

### 1. Importation Initiale (Snapshot de départ)
- **Déclencheur** : Importation d'un fichier source (bouton **OUVRIR** ou bouton **IMPORT** de la zone centrale).
- **Type d'enregistrement** : `snapshot` (point de sauvegarde complet).
- **Label automatique** : `"IMPORT INITIAL"` (ou `"Add file"` en contexte multifichier V9).
- **Commentaire automatique** : `null` (vide).
- **Source automatique** : `"système"` ou nom physique du fichier importé (ex: `"file : app.js"`).

### 2. Édition Libre (Modification manuelle directe)
- **Déclencheur** : Validation de modifications textuelles saisies directement dans l'éditeur de code principal (mode Édition Libre / cadenas déverrouillé).
- **Type d'enregistrement** : `replace` (requête de remplacement).
- **Label automatique** : `"Manual Edit"`.
- **Commentaire automatique** : `null` (vide).
- **Source automatique** : `"user"`.

### 3. Application de Requête FIND/REPLACE (Modification unitaire ou multiple)
- **Déclencheur** : Clic sur le bouton **APPLIQUER LA REQUÊTE** dans la Sidebar Gauche.
- **Type d'enregistrement** : `replace`.
- **Label automatique** : Libellé saisi dans l'en-tête de la Sidebar Gauche (ou `"Replace"` par défaut).
- **Commentaire automatique** : Commentaire rédigé dans le champ commentaire de la Sidebar Gauche.
- **Source automatique** : `"user"` (ou `"requête"` si exécuté depuis le Multistack).

### 4. Annulation Intelligente (Smart Undo / Undo Strict)
- **Déclencheur** : Clic sur l'icône d'annulation inverse (`↩️`) d'un item de l'historique dans la Sidebar Droite.
- **Type d'enregistrement** : `replace`.
- **Label automatique** : `"↩️ [Label de l'opération d'origine]"`.
- **Commentaire automatique** : `"Annulation intelligente de l'opération générée à la version [Version]"` (référence temporelle dynamique).
- **Source automatique** : `"système"`.

### 5. Échec d'Annulation (Rapport de conflit)
- **Déclencheur** : Tentative d'annulation d'une modification provoquant des collisions/conflits insolubles automatiquement avec des versions postérieures.
- **Type d'enregistrement** : `info` (événement informatif, mais sélectionnable pour l'analyse visuelle des conflits).
- **Label automatique** : `"❌ Échec Annul."`.
- **Commentaire automatique** : `"Conflit avec : [Liste des labels des versions conflictuelles]"`.
- **Source automatique** : `"système"`.

### 6. Pile Multistack de Résolution (Smart Cancel)
- **Déclencheur** : Clic sur l'engrenage `⚙️` d'une ligne d'échec d'annulation pour appliquer les résolutions correctives.
- **Type d'enregistrement** : `info` (suivi de l'application successive des requêtes de réparation de type `replace`).
- **Label automatique** : `"🟡 Pile multistack / Smart Cancel"`.
- **Commentaire automatique** : Initialement descriptif du lancement, puis mis à jour en `"✅ [RÉSOLU] L'annulation a bien pu se réaliser..."` après application complète.
- **Source automatique** : `"système"`.

### 7. Sauvegarde Locale / Enregistrer Sous
- **Déclencheur** : Clic sur le bouton **SAUVER** dans la zone centrale (téléchargement physique ou File System Access).
- **Type d'enregistrement** : `info` (non sélectionnable).
- **Label automatique** : `"Sauvegarde"`.
- **Commentaire automatique** : `"Fichier enregistré sous [nom]"` ou `"Fichier téléchargé : [nom]"`.
- **Source automatique** : `"système"`.

### 8. Exportation du Projet JSON
- **Déclencheur** : Clic sur le bouton **Sauvegarder** (icône disquette) dans le bandeau de gestion de projet (haut de la Sidebar Droite).
- **Type d'enregistrement** : `info` (non sélectionnable).
- **Label automatique** : `"Export JSON"`.
- **Commentaire automatique** : `"Projet exporté au format JSON"`.
- **Source automatique** : `"système"`.

### 9. Exportation du Code vers le Presse-papier
- **Déclencheur** : Clic sur le bouton **EXPORT** (icône de copie du code modifié) de la zone centrale.
- **Type d'enregistrement** : `info` (non sélectionnable).
- **Label automatique** : `"Export Presse-papier"`.
- **Commentaire automatique** : `"Texte source copié dans le presse-papier"`.
- **Source automatique** : `"système"`.

### 10. Dérivation de Branche (New Branch)
- **Déclencheur** : Clic sur le bouton **New Branch** depuis un point d'historique antérieur (ou lors d'un tag de version).
- **Type d'enregistrement** : `info` ou `snapshot`.
- **Label automatique** : `"New Branch"` ou `"Increment Version"`.
- **Commentaire automatique** : Description ou configuration de la branche.
- **Source automatique** : `"système"`.

---

## Responsive et défilement

- Le tableau d'historique dispose d'une hauteur fixe allouée par le splitter horizontal (`historyHeight`, par défaut à 50% de la hauteur de l'écran, minimum de 250px).
- Si le tableau dépasse cette hauteur, un défilement vertical interne (`overflow-y-auto`) avec une scrollbar personnalisée est activé.
- Si le toggle des mini-views comparatives est désactivé (`showMiniViews === false`), le tableau d'historique s'étire pour occuper 100% de la hauteur restante de la sidebar.

---

## Dépendances et références

- Voir [sidebar-right-top-project.md](sidebar-right-top-project.md) pour les boutons de chargement de projet au-dessus.
- Voir [sidebar-right-controls.md](sidebar-right-controls.md) pour la barre d'outils de navigation située sous le tableau.
- Voir [ui-layout-main.md](ui-layout-main.md) pour les règles de dimensionnement et de Splitter.
