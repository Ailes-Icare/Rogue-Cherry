# Spécification Fonctionnelle : Schéma JSON du Projet (V8)

Ce document décrit la structure, l'architecture et les consignes associées au fichier d'export et d'import JSON dans sa version 8 (version actuelle). Ce fichier regroupe l'ensemble des données d'un projet Rogue Cherry, y compris le nom du projet, la configuration dynamique du versioning et l'historique complet des modifications permettant le Time-Travel.

---

## 1. Structure Globale de la Racine

Le JSON du projet est un objet contenant trois clés fondamentales :

```json
{
  "projectName": "Mon_Projet",
  "history": [
    ...
  ],
  "versionConfig": {
    ...
  }
}
```

### Propriétés racines :
- **`projectName`** (chaîne de caractères, requise) : Le nom logique du projet défini par l'utilisateur. Il sert également de base pour nommer le fichier lors de l'exportation (ex: `Mon_Projet_history.json`).
- **`history`** (tableau d'objets, requis) : La pile chronologique de tous les événements et modifications appliqués au projet.
- **`versionConfig`** (objet, facultatif) : La configuration du moteur de versioning dynamique. Si elle est absente lors de l'import, l'application applique la configuration par défaut (`DEFAULT_VERSION_CONFIG`).

---

## 2. Structure des Enregistrements d'Historique (`history`)

Le tableau `history` contient des enregistrements de trois types distincts, identifiés par le champ `type`.

### 2.1. Type `snapshot` (Point d'Ancrage)
Un snapshot stocke l'intégralité du texte source à un instant T. Il est généré lors de l'import initial, des changements majeurs de version, ou de l'activation du cadenas de protection.

#### Structure JSON :
```json
{
  "type": "snapshot",
  "version": "V1.0.0",
  "action": "IMPORT INITIAL",
  "timestamp": "04/06/2026 01:45",
  "rawText": "Contenu complet du fichier source...",
  "source": "Import",
  "comment": "Commentaire optionnel saisi par l'utilisateur",
  "fileId": "main"
}
```

#### Clés détaillées :
- **`type`** (valeur fixe `"snapshot"`) : Identifie un point d'ancrage complet.
- **`version`** (chaîne) : La version textuelle correspondante (ex: `"V1.0.0"`).
- **`action`** (chaîne) : Le libellé ou l'événement associé (ex: `"IMPORT INITIAL"`, `"CHG VER"`).
- **`timestamp`** (chaîne) : Date et heure de l'action au format `JJ/MM/AAAA HH:MM`.
- **`rawText`** (chaîne) : Le texte intégral normalisé (retours à la ligne normalisés en `\n`).
- **`source`** (chaîne) : L'origine du snapshot (ex: `"Import"`, `"Système"`, `"Fichier : mon_fichier.txt"`).
- **`comment`** (chaîne, optionnelle) : Explication ou commentaire rédigé par l'utilisateur.
- **`fileId`** (chaîne, par défaut `"main"`) : L'identifiant interne du fichier cible.

---

### 2.2. Type `replace` (Delta Léger)
Un enregistrement de remplacement ne stocke pas le texte complet. Il ne contient que la requête de modification (FIND/REPLACE) et ses options associées, permettant de reconstruire le texte dynamiquement.

#### Structure JSON :
```json
{
  "type": "replace",
  "version": "V1.0.1",
  "action": "User Input 1",
  "label": "Correction coquille",
  "timestamp": "04/06/2026 01:48",
  "findStr": "ancienTexte",
  "replaceStr": "nouveauTexte",
  "multiMode": true,
  "multiIndices": [0, 2],
  "splitChars": null,
  "ignoreSpaces": false,
  "comment": "Correction d'une erreur d'orthographe",
  "source": "requête",
  "fileId": "main"
}
```

#### Clés détaillées :
- **`type`** (valeur fixe `"replace"`) : Identifie une opération de remplacement.
- **`version`** (chaîne) : La version incrémentée après application du remplacement.
- **`action`** (chaîne) : Nom d'action interne ou séquentiel (ex: `"User Input 1"`, `"Manual Edit 1"`).
- **`label`** (chaîne ou `null`) : Label personnalisé ou extrait de la requête (ex: `[LABEL:...]`).
- **`timestamp`** (chaîne) : Date et heure au format `JJ/MM/AAAA HH:MM`.
- **`findStr`** (chaîne) : Le texte exact recherché.
- **`replaceStr`** (chaîne) : Le texte de remplacement.
- **`multiMode`** (booléen) : Indique si le remplacement s'applique sur plusieurs occurrences (`true` ou `false`).
- **`multiIndices`** (tableau d'entiers ou vide) : Tableau d'indices base-0 définissant les occurrences ciblées par le cherry-picking. Un tableau vide en mode `multiMode === true` signifie que toutes les occurrences sont remplacées.
- **`splitChars`** (tableau ou `null`) : Délimiteurs utilisés en cas de segmentation.
- **`ignoreSpaces`** (booléen) : Si `true`, active le mode **Smart Replace** (insensibilité aux espaces et à la casse avec préservation).
- **`comment`** (chaîne, optionnelle) : Commentaire ou description de la modification.
- **`source`** (chaîne, par défaut `"requête"`) : Origine du remplacement.
- **`fileId`** (chaîne, par défaut `"main"`) : L'identifiant interne du fichier affecté.

---

### 2.3. Type `info` (Enregistrement de Métadonnées)
Un enregistrement `info` est purement informatif. Il sert à garder une trace des actions système de haut niveau (ex: exports, sauvegardes). Il n'a aucun effet sur le texte et est ignoré par la navigation temporelle (Time-Travel).

#### Structure JSON :
```json
{
  "type": "info",
  "version": "V1.0.1",
  "action": "Export JSON",
  "label": "Export JSON",
  "timestamp": "04/06/2026 01:50",
  "comment": "Projet exporté au format JSON",
  "source": "Système",
  "meta": null
}
```

#### Clés détaillées :
- **`type`** (valeur fixe `"info"`) : Identifie un événement système.
- **`version`** (chaîne) : Hérite de la version active au moment de l'événement.
- **`action`** / **`label`** (chaîne) : Le type d'événement (ex: `"Export JSON"`, `"Sauvegarde"`).
- **`timestamp`** (chaîne) : Date et heure de l'événement.
- **`comment`** (chaîne, optionnelle) : Description détaillée de l'événement.
- **`source`** (chaîne) : Origine de l'événement (généralement `"Système"`).
- **`meta`** (objet ou `null`) : Métadonnées optionnelles structurées supplémentaires.

---

## 3. Configuration du Versioning (`versionConfig`)

La configuration du versioning dynamique est persistée dans le JSON pour assurer la cohérence de l'incrémentation des versions d'une session à l'autre.

```json
"versionConfig": {
  "ranks": [
    { "type": "fixed", "value": "V", "separator": "" },
    { "type": "numeric", "value": 1, "separator": "" },
    { "type": "numeric", "value": 0, "separator": "." },
    { "type": "numeric", "value": 0, "separator": "." }
  ],
  "autoIncrementIndex": 3
}
```

### Propriétés de `versionConfig` :
- **`ranks`** (tableau d'objets) : Tableau ordonné de la structure de la version. Chaque rang dispose de :
  - `type` : `"fixed"` (valeur textuelle fixe), `"numeric"` (nombre entier) ou `"alpha"` (lettre alphabétique simple).
  - `value` : La valeur courante du rang.
  - `separator` : Le caractère séparant ce rang du précédent (ex: `"."`, `"-"`).
- **`autoIncrementIndex`** (entier) : L'index du rang (base-0) dans le tableau `ranks` qui doit être automatiquement incrémenté lors d'un nouveau remplacement (`pushReplace`).

---

## 4. Algorithme de Reconstruction Temporelle (`rebuildTextAt`)

L'algorithme de Time-Travel permet de reconstituer l'état exact de n'importe quel fichier à un index cible `targetIndex` de l'historique :

1. **Recherche du Snapshot le plus proche** :
   - On parcourt l'historique à l'envers, en partant de `targetIndex` jusqu'à `0`.
   - On s'arrête dès qu'on trouve un enregistrement ayant `type === "snapshot"` **ET** `fileId` correspondant au fichier recherché.
   - On extrait la valeur `rawText` de ce snapshot.
2. **Rejeu séquentiel des deltas** :
   - On parcourt l'historique à l'endroit, de l'index du snapshot trouvé plus 1 jusqu'à `targetIndex`.
   - Pour chaque enregistrement trouvé :
     - Si l'enregistrement a `isIgnored === true`, on l'ignore (branche temporelle annulée).
     - Si `type === "replace"` **ET** `fileId` correspond au fichier recherché, on applique la modification sur le texte courant via la fonction pure `applyDeltaOnText(text, findStr, replaceStr, multiMode, multiIndices, ignoreSpaces)`.
3. **Retour du résultat** :
   - Le texte final obtenu à l'étape `targetIndex` est renvoyé.

---

## 5. Consignes et Règles de Validation à l'Import

Lorsqu'un fichier JSON est importé dans Rogue Cherry :
1. **Validation de structure** : Le parseur doit obligatoirement vérifier la présence de `projectName` (chaîne de caractères non vide) et de `history` (tableau valide). Si l'une de ces clés manque ou est invalide, l'import est rejeté avec un message d'erreur.
2. **Rétrocompatibilité (Migration V8)** :
   - Les versions antérieures de Rogue Cherry pouvaient omettre la propriété `fileId` dans les enregistrements d'historique.
   - À l'importation, l'application effectue une **montée de version à la volée** en mappant la valeur `"main"` à la clé `fileId` pour tout enregistrement qui en est dépourvu.
   - Le projet est initialisé avec un fichier unique interne nommé `"main"`.
