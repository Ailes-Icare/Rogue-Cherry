# Spécification Technique : Évolution du JSON pour la V9 (Multi-Fichier & Multi-Dossier)

Ce document décrit l'architecture et les spécifications d'évolution du format JSON pour la version 9 (V9) de Rogue Cherry. L'objectif principal est de supporter de manière native et fluide la gestion de multiples fichiers organisés en répertoires, tout en préservant l'intégrité du Time-Travel (retour arrière) et la rétrocompatibilité avec les projets mono-fichier V8.

---

## 1. Extension de la Racine du JSON

Pour supporter la structure de dossiers et de fichiers multiples, le JSON V9 enrichit la racine avec un index ou manifeste des fichiers du projet (`files`) et des dossiers (`folders`) :

```json
{
  "projectName": "Mon_Projet_Multi",
  "files": [
    {
      "fileId": "f1a8e9b2-3c4d",
      "relativePath": "src/components/Button.jsx",
      "originalName": "Button.jsx",
      "status": "active"
    },
    {
      "fileId": "f9c8d7e6-5b4a",
      "relativePath": "src/App.jsx",
      "originalName": "App.jsx",
      "status": "active"
    }
  ],
  "folders": [
    {
      "folderId": "d0e1f2a3-4b5c",
      "relativePath": "src/components",
      "status": "active"
    }
  ],
  "history": [
    ...
  ],
  "versionConfig": {
    ...
  }
}
```

### Propriétés racine ajoutées :
- **`files`** (tableau d'objets, requis en V9) : La liste de tous les fichiers enregistrés dans le projet à leur état final actuel. Chaque objet contient :
  - `fileId` (chaîne) : Identifiant unique du fichier (UUID ou hash unique généré à la création).
  - `relativePath` (chaîne) : Le chemin d'accès relatif du fichier depuis la racine du projet (ex: `src/utils/helpers.js`).
  - `originalName` (chaîne) : Le nom brut du fichier (ex: `helpers.js`).
  - `status` (chaîne) : Statut actuel du fichier (`"active"` ou `"deleted"`).
- **`folders`** (tableau d'objets, optionnel en V9) : La liste explicite des répertoires du projet. Permet de tracer les dossiers vides ou de stocker des métadonnées de dossier :
  - `folderId` (chaîne) : Identifiant unique du répertoire.
  - `relativePath` (chaîne) : Le chemin relatif du dossier (ex: `src/components`).
  - `status` (chaîne) : Statut du répertoire (`"active"` ou `"deleted"`).

---

## 2. Événements du Cycle de Vie dans l'Historique (`history`)

Pour que le Time-Travel fonctionne correctement, la structure de fichiers et dossiers ne doit pas être figée : si l'utilisateur retourne dans le passé à une version où un fichier n'avait pas encore été créé ou avait un autre nom, l'éditeur et l'arborescence de fichiers doivent refléter cet état passé.

Pour ce faire, le tableau `history` intègre des événements de cycle de vie en V9.

### 2.1. Création de Fichier (`file_create`)
Cet événement enregistre l'ajout d'un fichier au projet.

```json
{
  "type": "file_create",
  "version": "V1.1.0",
  "action": "Ajout fichier Button.jsx",
  "timestamp": "04/06/2026 01:55",
  "fileId": "f1a8e9b2-3c4d",
  "relativePath": "src/components/Button.jsx",
  "originalName": "Button.jsx",
  "source": "Système"
}
```

L'ajout d'un fichier est immédiatement suivi dans l'historique d'un enregistrement `snapshot` ayant le même `fileId` pour stocker le contenu de départ du fichier.

### 2.2. Suppression de Fichier (`file_delete`)
Cet événement marque la suppression logique d'un fichier.

```json
{
  "type": "file_delete",
  "version": "V1.1.2",
  "action": "Suppression Button.jsx",
  "timestamp": "04/06/2026 02:00",
  "fileId": "f1a8e9b2-3c4d",
  "source": "Système"
}
```

### 2.3. Renommage/Déplacement de Fichier (`file_rename`)
Cet événement enregistre le changement de nom ou de chemin d'un fichier.

```json
{
  "type": "file_rename",
  "version": "V1.1.3",
  "action": "Déplacement Button.jsx",
  "timestamp": "04/06/2026 02:05",
  "fileId": "f1a8e9b2-3c4d",
  "newRelativePath": "src/ui/Button.jsx",
  "newOriginalName": "Button.jsx",
  "source": "Système"
}
```

### 2.4. Événements de Dossier (`folder_create`, `folder_delete`, `folder_rename`)
Ces événements permettent de tracer l'évolution des dossiers.
- `folder_create` : Contient `folderId` et `relativePath`.
- `folder_delete` : Contient `folderId`.
- `folder_rename` : Contient `folderId` et `newRelativePath`. Le renommage d'un dossier entraîne la mise à jour en cascade des chemins relatifs de tous les fichiers et sous-dossiers enfants lors du parcours temporel.

---

## 3. Algorithme de Reconstruction de l'Espace de Travail V9

En V9, la fonction `rebuildTextAt` est couplée avec une reconstruction de la structure des fichiers.

### Étape 1 : Reconstruction de l'Arborescence à `targetIndex`
Pour savoir quels fichiers existent et quels sont leurs noms à un instant précis de l'historique :
1. Initialiser une liste vide de fichiers actifs `activeFiles = []` et de répertoires actifs `activeFolders = []`.
2. Parcourir l'historique chronologiquement de `0` à `targetIndex`.
3. Pour chaque événement de cycle de vie rencontré :
   - `file_create` : Ajouter le fichier à `activeFiles`.
   - `file_delete` : Retirer le fichier de `activeFiles` (ou marquer comme supprimé).
   - `file_rename` : Mettre à jour `relativePath` et `originalName` du fichier correspondant dans `activeFiles`.
   - `folder_create` / `folder_delete` / `folder_rename` : Appliquer les mêmes règles sur `activeFolders` (et propager les renommages de dossiers sur les fichiers enfants de `activeFiles`).
4. À la fin du parcours, l'arborescence des dossiers et l'onglet de chaque fichier dans la zone centrale sont mis à jour pour correspondre à cette structure historique.

### Étape 2 : Reconstruction du Contenu de chaque Fichier Actif
Pour chaque fichier présent dans `activeFiles` :
1. Lancer l'algorithme V8 `rebuildTextAt(history, targetIndex, fileId)`.
2. Charger le texte ainsi reconstruit dans la zone de code correspondante.

---

## 4. Consignes pour l'Importation et Rétrocompatibilité (V8 -> V9)

Pour assurer une transition sans friction des projets créés sous la V8 :
1. **Détection de Version du Projet** :
   - Si le JSON importé possède la clé `projectName` et un tableau `history`, mais que la clé `files` est absente à la racine : le projet est détecté comme un **Projet V8 (Legacy)**.
2. **Conversion Automatique à la Volée** :
   - L'importateur Rogue Cherry initialise automatiquement la clé `files` de la structure en mémoire avec :
     ```json
     [
       {
         "fileId": "main",
         "relativePath": "main.txt",
         "originalName": "main.txt",
         "status": "active"
       }
     ]
     ```
   - Tous les enregistrements d'historique de type `snapshot` et `replace` qui ne possèdent pas de clé `fileId` se voient attribuer automatiquement `fileId: "main"`.
   - L'application ouvre l'onglet de code principal lié au fichier virtuel `"main"`.
   - L'utilisateur peut continuer à travailler sans perte de données. Lors de la prochaine sauvegarde du projet, le fichier sera exporté au format V9.

---

## 5. Spécifications de Sauvegarde et d'Exportation en V9

Le mode multi-fichier modifie la façon dont les données sont écrites ou exportées.

### 5.1. Sauvegarde Unique en Fichier JSON Global
- Combine les métadonnées globales, le manifeste des fichiers (`files`), le manifeste des dossiers (`folders`), la configuration de versioning et l'historique complet (contenant les événements de cycle de vie de fichiers et les deltas).
- Permet de restaurer l'intégralité du projet en une seule opération d'importation dans Rogue Cherry.

### 5.2. Sauvegarde Physique Individuelle des Fichiers sur le Disque
- Si l'utilisateur choisit de sauvegarder les fichiers individuels sur son disque dur (via l'API *File System Access*), l'application écrit le texte reconstruit de chaque fichier actif à la version courante (`selectedIndex`) directement dans le fichier physique associé à son pointeur `fileHandle`.
- Cette écriture est sélective : seuls les fichiers ayant été modifiés depuis le dernier snapshot physique sont réécrits.
