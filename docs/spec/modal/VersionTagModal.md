# Spécifications : Modale de Versioning (`VersionTagModal.jsx`)

**Fichier source** : `src/components/VersionTagModal.jsx` (557 lignes)

La `VersionTagModal` est la fenêtre de dialogue centrale gérant l'évolution de la ligne de temps du projet. Elle est draggable, modale (bloque les interactions en arrière-plan), et centralise toute la logique de versioning.

---

## 1. Props d'Entrée

| Prop | Type | Rôle |
|---|---|---|
| `isOpen` | `bool` | Contrôle l'affichage |
| `mode` | `'init' \| 'upVersion' \| 'branch'` | Définit le contexte d'ouverture |
| `initialConfig` | `Object` | La config de versioning actuelle (`{ ranks, autoIncrementIndex }`) |
| `currentVersion` | `string` | La chaîne de version actuelle (ex: `"V1.0.0"`) |
| `projectName` | `string` | Nom du projet actuel |
| `initialTab` | `string` | Onglet ouvert par défaut à l'ouverture |
| `onForceIncrement` | `function` | Callback pour incrémentation d'un rang spécifique |
| `onRename` | `function` | Callback pour le renommage du projet |
| `onChangePattern` | `function` | Callback pour changer le motif de versioning |
| `onSaveConfig` | `function` | Callback spécifique au mode `init` |
| `onBranchOut` | `function` | Callback pour créer une nouvelle branche |
| `onClose` | `function` | Fermeture (désactivée en mode `init`) |

---

## 2. Les 3 Modes d'Ouverture

### A. Mode `init` — Initialisation
- **Déclenché par** : Premier import d'un code source via `onLoadProject` ou depuis le SplashScreen.
- **Contraintes** :
  - L'utilisateur **ne peut pas fermer** la modale (bouton ✕ caché, `onClose` désactivé).
  - L'onglet "Incrémenter" n'est **pas disponible** (les boutons de rang n'ont pas de sens sans version préexistante).
  - Validation (`Enter` ou bouton) impossible si le nom de projet est vide → un flash jaune anime le champ (`showNameError`).
  - Les caractères de système de fichiers sont filtrés côté callback pour sécuriser les exports JSON.
- **Sortie** : Appelle `onSaveConfig` avec la config de rangs et le nom de projet. Génère le snapshot initial `type: 'snapshot'`.

### B. Mode `upVersion` — Mise à Jour
- **Déclenché par** : Clic sur le label de version dans la topbar (lorsque `selectedIndex === history.length - 1`, i.e. on est à la pointe de l'historique).
- **Comportement** :
  - Les 3 onglets sont disponibles : Incrémenter, Renommer, Changer de Motif.
  - L'onglet affiché par défaut est contrôlé par `initialTab`.

### C. Mode `branch` — Création de Branche
- **Déclenché par** : Clic sur le bouton "New Branch" de la SidebarRight (uniquement quand `selectedIndex < history.length - 1`, i.e. on navigue dans le passé).
- **Différences visuelles** :
  - Le titre de la modale affiche "CRÉATION DE BRANCHE".
  - Un bandeau d'avertissement jaune **"⚠️ Nouvel arbre de réalité"** apparaît dans l'onglet "Incrémenter" pour signaler que le passé sera purgé (`showBranchWarning`).
- **Comportement** : Appelle `onBranchFromParent` ou `onForceIncrement` selon la sélection. Purge automatiquement tous les enregistrements postérieurs au point sélectionné.

---

## 3. Interface à Onglets (mode `upVersion` et `branch` uniquement)

### 3.1 Onglet "Incrémenter"
- Affiche les rangs de la version actuelle sous forme de **boutons cliquables**.
- **Algorithme de Cascade Reset** : Cliquer sur le rang N incrémente N et remet à zéro tous les rangs situés à droite (N+1, N+2...).
  - Exemple : `V1.2.5` → clic sur "Mineure" → `V1.3.0` (le rang `5` est remis à `0`).
- Un **préfixe optionnel** peut être saisi (champ texte) pour créer des versions comme `"BETA V2.0.0"`.
- Une **preview dynamique** de la version résultante est affichée en temps réel.

### 3.2 Onglet "Renommer"
- Permet de modifier le nom du projet sans altérer les compteurs de version.
- Le bouton "Valider" n'est actif que si `isRenameDirty = true` (le nom a changé ou le préfixe a changé).
- Génère un enregistrement d'historique de type `rename`.

### 3.3 Onglet "Changer de Motif"
- Permet d'éditer la structure interne du versioning (`DEFAULT_VERSION_CONFIG`).
- Chaque rang peut être de 3 types : `numeric` (0, 1, 2...), `alpha` (A, B, C...) ou `fixed` (texte fixe "V").
- L'utilisateur choisit via des radio buttons quel rang sera incrémenté **automatiquement** lors des modifications IA silencieuses (`autoIncrementIndex`).
- Deux boutons utilitaires :
  - **"Remettre les compteurs à 0"** : Remet les valeurs de tous les rangs à leur valeur initiale (0 ou "A") sans changer le motif.
  - **"Réinitialiser au motif par défaut"** : Restaure le motif `V1.0.0` (3 rangs numériques + préfixe "V").
- **Détection des modifications** (`isPatternDirty`) : Compare les rangs actuels avec un snapshot pris à l'ouverture. Si rien n'a changé, le bouton "Appliquer" reste grisé.

---

## 4. Option FreezeArchive (Sauvegarde)

- Une **case à cocher** "Enregistrer comme point de sauvegarde" est présente sur **tous les onglets** en mode `upVersion` et `branch`.
- Si cochée, le snapshot résultant reçoit `isSaved = true`.
- Conséquence dans la SidebarRight : la ligne d'historique apparaît en bleu clair (`text-[#87cefa]`).
- Conséquence dans la logique `isProjectDirty` : ce point devient la référence de "dernier sauvegardé" — les modifications ultérieures font passer l'état du projet à "Non sauvegardé" (statut Dirty).

---

## 5. Validation par Touche Entrée

La modale écoute `onKeyDown` au niveau du container principal :
- **Mode `init`** : `Enter` → `handleSaveInit()`
- **Mode Renommer** : `Enter` → `handleActionRename()` (si `isRenameDirty`)
- **Mode Changer de motif** : `Enter` → `handleActionChangePattern()` (si `isPatternDirty`)
- **Mode Incrémenter** : `Enter` n'a **pas** d'effet automatique — l'utilisateur doit cliquer sur un rang spécifique.

---

## 6. Synchronisation à l'Ouverture (Parsing de Version)

Lors de l'ouverture en mode `upVersion` ou `branch`, la modale ne part pas de la config par défaut — elle lit la chaîne de version actuelle (`currentVersion`) via `parseVersionStringToRanks` pour **reconstituer les valeurs actuelles des rangs** et les afficher correctement.

C'est cette logique qui permet d'ouvrir la modale sur `V2.3.7` et de voir les boutons "2", "3", "7" au lieu de "1", "0", "0".
