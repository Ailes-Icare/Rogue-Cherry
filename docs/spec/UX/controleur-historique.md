# Spécifications : Contrôleur d'Historique et Cycle de Vie (Time-Travel)

**Contexte** : Zone de gestion globale du projet (`App.jsx` agissant sur `SidebarRight.jsx`).

Ce document définit la logique de contrôle et le cycle de vie du projet (historique, time-travel, import/export et états de sauvegarde) gérés par `App.jsx`, qui alimente le composant de vue de droite (`SidebarRight`).

---

## 1. Rôle du Contrôleur d'Historique

Le contrôleur coordonne l'état du projet et son évolution temporelle. Il gère l'interaction entre l'historique et l'affichage central :
- **Navigation temporelle (Time-Travel)** : Lorsqu'un utilisateur clique sur un point d'historique, le contrôleur appelle `rebuildTextAt(index)` pour recalculer l'état de l'ensemble des fichiers à cet instant et met à jour l'éditeur central.
- **Micro-actions sur ligne** : Gère l'édition de métadonnées (labels/commentaires) et l'alignement visuel (saut ciblé vers la ligne modifiée par un delta).
- **Synchronisation avec la SidebarRight** : Transmet l'état de sauvegarde (`isProjectDirty`), la taille du fichier d'export JSON et les boutons d'actions historiques.

---

## 2. Actions Systèmes et Logique Transactionnelle

### 2.1 Réinitialisation Globale (RESET)
- **Déclencheur** : Bouton RESET de la SidebarRight (fond rouge).
- **Comportement** : Demande confirmation à l'utilisateur via la `MessageBox`. Si acceptée, le contrôleur efface l'intégralité des données en mémoire :
  - Réinitialisation complète du store (historique vidé, code source vidé, nom du projet effacé).
  - Suppression de la pile multistack (`pendingRequests`).
  - Effacement de toutes les variables d'état (champs FIND/REPLACE, sélections, occurrences actives).

### 2.2 Annulation Intelligente (Smart Undo)
- **Déclencheur** : Bouton d'annulation (⚙️↩️) sur une modification sélectionnée.
- **Processus de contrôle** :
  1. Demande de confirmation à l'utilisateur.
  2. Analyse de conflits : Parcourt l'historique pour détecter si des modifications ultérieures affectent ou s'appuient sur la même portion de texte.
  3. Si un conflit est détecté : Bloque l'annulation et ajoute un point d'information "❌ Échec Annul." dans l'historique avec le détail du blocage (l'utilisateur peut alors générer une pile corrective *Smart Cancel Multistack*).
  4. Si aucun conflit n'est détecté, et que le texte à inverser existe toujours dans la version finale : Génère et applique une action inverse (FIND=ReplaceStr, REPLACE=FindStr) poussée à la fin de l'historique.

### 2.3 Compression d'Historique
- **Déclencheur** : Bouton de compression (🗜️).
- **Action** : Purge définitivement tous les points d'historique antérieurs à l'index sélectionné et les remplace par un snapshot unique (perte définitive du Time-Travel sur cette période passée).

### 2.4 Sécurisation du Flux de Branches (Modification d'une version antérieure)
- **Déclencheur** :
  - L'utilisateur tente de charger/coller une requête via la zone centrale, OU 
  - L'utilisateur clique sur le bouton "Appliquer" pour exécuter une requête existante.
- **Contexte** : L'index sélectionné dans le tableau Time-Travel (`selectedIndex`) n'est pas le dernier élément de la pile (`history.length - 1`).
- **Comportements mis en place** :
  1. **Au chargement ou collage d'une requête** (import) : Le contrôleur force le repositionnement automatique de l'index sur le dernier état (`selectedIndex = history.length - 1`), afin de prémunir l'utilisateur d'un import dangereux sur un vieil état sans s'en rendre compte.
  2. **À l'application d'une modification (Appliquer) après modification manuelle** : Si l'utilisateur a cliqué sur l'historique pour remonter dans le temps, ET qu'il a modifié manuellement la requête (clic sur les boutons SMART/MULTI, saisie de texte dans les champs, etc.), le clic sur Appliquer ne déclenchera pas de modale d'avertissement mais **créera implicitement une nouvelle branche** à partir de cet ancien état. La ligne temporelle précédente (futur) est alors débranchée et grisée.

### 2.5 Suivi de Rechargement de Requête Annulée (♻️)
- **Déclencheur** : L'utilisateur clique sur le bouton "Recharger" (♻️) d'une requête ignorée (grisée) dans l'historique, puis clique sur "Appliquer" sans l'avoir modifiée.
- **Processus de contrôle** :
  1. Lors du clic sur ♻️, l'index de la requête historique est conservé en mémoire temporaire (`reloadedRecordIndex`).
  2. Lors de l'application (bouton Appliquer), le contrôleur compare de manière stricte le contenu du formulaire (FIND, REPLACE, MULTI, SMART) avec la requête d'origine en mémoire.
  3. Si la correspondance est exacte (aucune modification manuelle), la requête historique d'origine est marquée comme "Réappliquée avec succès" (`isReapplied = true`).
  4. L'icône ♻️ est alors remplacée visuellement par un indicateur de validation (✔️), confirmant que cette branche morte a été restaurée sans altération. La mémoire temporaire est ensuite purgée.

---

## 3. Gestion des Fichiers et Exportations (JSON)

### 3.1 Export du Projet
- Compile le nom du projet, l'historique complet et la configuration de versioning (`versionConfig`) dans un objet JSON structuré.
- Télécharge le fichier avec le nom du projet nettoyé.
- Ajoute un enregistrement d'information "Export JSON" à l'historique et réinitialise l'état `isProjectDirty` à propre (`isSaved = true`).

### 3.2 Import du Projet
- Lit le fichier JSON sélectionné, valide sa structure (présence du projet et de l'historique).
- Restaure le store (nom, historique, configuration de version).
- Efface l'état de la pile multistack active et les sélections courantes.

---

## 4. Améliorations Futures : Barre de Gestion des Fichiers

Afin d'accompagner le passage au multi-fichiers, une nouvelle barre d'outils dédiée sera intégrée dans la section supérieure de gestion de projet (au niveau du bandeau "Gestion de Projet" de la SidebarRight) :

- **Bouton Ajouter Fichier** : Permet de déclencher l'ouverture du dialogue d'import pour insérer un nouveau fichier au projet (déclenchant la mini-modale de choix et la modale `VersionTagModal` en mode import).
- **Bouton Supprimer Fichier** : Permet de supprimer le fichier actuellement actif de l'onglet central du projet (déclenchant la modale de suppression à 3 choix).
- **Liste des Fichiers du Projet** : Affiche un récapitulatif textuel des fichiers actuellement rattachés au projet pour faciliter la navigation et le contrôle de l'intégrité de l'archive.
