# Spécifications : Modales Secondaires

**Dossier source** : `src/components/`

Ce fichier regroupe les spécifications détaillées et exhaustives des modales secondaires de Rogue Cherry.

---

## 1. LineChoiceModal (La Modale de Navigation)

**Fichier source** : `src/components/LineChoiceModal.jsx`

**Finalité** : Permettre à l'utilisateur de sauter à un numéro de ligne spécifique, ou de naviguer entre les occurrences multiples d'une recherche. C'est un composant générique et réutilisable pouvant fonctionner dans deux modes.

### 1.1 Props d'entrée

| Prop | Type | Requis | Rôle |
|---|---|---|---|
| `isVisible` | `bool` | Oui | Contrôle l'affichage de la modale |
| `position` | `{ x, y }` | Oui | Coordonnées de fixation à l'écran (px absolus) |
| `onClose` | `function` | Oui | Callback de fermeture |
| `maxLines` | `number` | Oui | Borne supérieure de l'input numérique |
| `linesArray` | `Array\|null` | Non | Si fourni, tableau de correspondance entre index et ligne réelle (Mode Occurrences) |
| `onGoToLine` | `function` | Oui | Callback appelé avec `(ligneRéelle, index)` lors d'un saut |
| `title` | `string` | Non | Titre de la modale (par défaut: "Aller à la ligne (1 - N)") |
| `initialValue` | `string` | Non | Valeur initiale de l'input (par défaut: `"1"`) |

### 1.2 Les Deux Modes de Fonctionnement

**Mode Navigation Simple (Line Jump)** :
- `linesArray` est `null`.
- L'utilisateur saisit un numéro de ligne brut (de 1 à `maxLines`).
- `onGoToLine` est appelé avec `(num, num)` — la ligne réelle et l'index sont identiques.

**Mode Navigation Occurrences (Cherry-Picking / Find)** :
- `linesArray` est un tableau d'entiers fourni en entrée (ex: `[34, 128, 562]` = les lignes réelles des 3 occurrences trouvées).
- L'utilisateur saisit un **index incrémental** (1 = 1ère occurrence, 2 = 2ème...).
- L'input est borné par `linesArray.length` et non `maxLines`.
- `onGoToLine` est appelé avec `(linesArray[num - 1], num)` — index de l'occurrence + ligne du document réel.
- Ce mode lie un "numéro d'occurrence" à une "ligne absolue du code source" pour que le scroll soit précis.

### 1.3 L'Algorithme d'Accélération Progressive (Hold-to-Repeat)

C'est la feature non documentée jusqu'ici. Les boutons ▲ et ▼ implémentent un **incrément continu accéléré** lors d'un appui long.

**Fonctionnement (extrait code `startIncrement`) :**
1. **Clic simple** : Incrémente ou décrémente immédiatement de `delta = ±1`. L'interface saute à la ligne correspondante instantanément.
2. **Maintien (après 500ms)** : Déclenche une boucle récursive avec `setTimeout(loop, 100ms)` — soit 10 incréments par seconde.
3. **Accélération exponentielle** : À partir de la marque **2 secondes** de maintien (`elapsed > 2000ms`), le pas est multiplié par `2^(secondsPastTwo + 1)` :
   - À 2s : multiplicateur = 2 (±2 par 100ms)
   - À 3s : multiplicateur = 4 (±4 par 100ms)
   - À 4s : multiplicateur = 8 (±8 par 100ms)
   - ...
4. **Plafond Absolu** : Le delta est clampé à `±50` par iteration pour éviter d'aller trop vite.
5. **Libération** : `onMouseUp` ou `onMouseLeave` déclenche `stopIncrement()` qui annule le `setTimeout` actif.

> **Vigilance** : Cette boucle appelle `onGoToLine` à chaque tick de 100ms pendant l'appui. Si `onGoToLine` est coûteux (ex: scroll vers une ligne dans un fichier de 50 000 lignes), cela peut créer de la latence. La latence est acceptable dans l'usage actuel car le `CodeEditor` utilise un windowing virtuel.

### 1.4 Suspension de Navigation lors de la Saisie Clavier

Pour éviter que l'interface ne saute à chaque chiffre tapé (ex: taper "1", "5" = saute à 1 puis à 15 au lieu d'attendre "15") :
- Un **timer de 5000ms** (`typingTimerRef`) est déclenché à chaque frappe clavier.
- Le saut vers la ligne est suspendu tant que le timer est actif.
- **Déclenchement immédiat** si l'un des événements suivants se produit AVANT les 5 secondes :
  - L'utilisateur clique ailleurs dans la modale (hors de l'input → `handleModalClick`)
  - L'input perd le focus (`inputRef.current.blur()`)
  - L'utilisateur appuie sur `Enter`
- La touche `Escape` ferme la modale sans naviguer.

### 1.5 Positionnement et Fermeture

- La modale se positionne via `style={{ left: Math.max(10, Math.min(position.x, window.innerWidth - 250)), top: position.y }}` — elle se clamp dans les bords de la fenêtre automatiquement.
- Un fond transparent `fixed inset-0 z-40` (backdrop) écoute les `onMouseDown` pour fermer la modale si l'utilisateur clique hors d'elle.
- Elle n'est PAS draggable (contrairement à MessageBox). Elle est fixée au point de départ fourni.

---

## 2. SplashScreen

**Fichier source** : `src/components/SplashScreen.jsx` (ou intégré dans `App.jsx`)

**Finalité** : Écran d'accueil affiché lorsqu'aucun projet n'est chargé. Sert également de point d'accès discret au SmartDebugger via l'icône de branding.

### 2.1 Comportements Conditionnels selon l'état du projet

**Si aucun projet n'est ouvert (`!hasProject`)** :
- S'affiche en plein écran par défaut, recouvrant le CodeEditor vide.
- **Simple clic** sur le logo (les deux cerises) → Ouvre la modale d'import/création de projet.
- **Double clic** sur le logo → Même comportement (le double clic inclut le simple clic).
- **Responsive** : La taille de la typographie et des logos s'adapte automatiquement à la hauteur de la fenêtre (`min-h-screen`, pas de défilement).

**Si un projet est ouvert (`hasProject`)** :
- Le SplashScreen est masqué. L'éditeur est visible.
- L'icône des deux cerises reste affichée en haut de la sidebar gauche.
- **Simple clic** → Action normale (non définie / anciennement rien, actuellement peut ouvrir un raccourci).
- **Double clic** → Ouvre le `SmartDebugger` en mode "Urgence" / Debug indépendant du workflow standard (Story Ajout 11).

### 2.2 Règle de transition

- L'état `hasProject` est dérivé de `history.length > 0`.
- La transition entre les deux modes est instantanée (pas d'animation de fermeture du splash).

---

## 3. EditRecordModal

**Fichier source** : `src/components/EditRecordModal.jsx` (ou intégré dans `SidebarRight.jsx`)

**Finalité** : Modale permettant l'édition a posteriori (post-hoc) du label ou du commentaire d'un enregistrement existant dans l'historique, sans créer de nouvelle entrée.

### 3.1 Déclenchement

- S'ouvre via le bouton `✏️` qui apparaît sur la ligne active sélectionnée dans le tableau de l'historique (`SidebarRight`).
- Ce bouton n'apparaît **que** si l'enregistrement est de type `replace` (pas sur les snapshots ni les items `info`).

### 3.2 Comportements

- Récupère l'enregistrement complet via l'index `selectedIndex`.
- Pré-remplit les champs avec le label (`action`) et le commentaire (`comment`) existants.
- La validation (`onUpdateRecord`) ne crée **pas** de nouveau delta d'historique.
- La mise à jour cible directement l'objet dans `history` via `useHistoryStore.updateRecord(index, actionName, comment)`.
- N'altère pas le code source, ni `selectedIndex`, ni aucun calcul de diff.

---

## 4. SettingsModal (Paramètres de Syntaxe)

**Fichier source** : Intégré dans le système de Paramètres de l'application.

**Finalité** : Permet la personnalisation des balises de syntaxe de la requête IA (remplace `##SYNTAX_COPIE##`, `##FIND##`, etc. par des alternatives personnalisées).

### 4.1 Fonctionnement

- Affiche 4 champs texte correspondant aux 4 balises : `START`, `FIND`, `REPLACE`, `END`.
- La syntaxe par défaut est `DEFAULT_SYNTAX` dans `textParser.js`.
- Une balise personnalisée active une notification visuelle dans l'assistant prompt (l'assistant indique que la syntaxe est modifiée).
- Un bouton "Réinitialiser" restaure `DEFAULT_SYNTAX`.
- La configuration est passée comme prop `syntaxConfig` à tous les composants qui en ont besoin (`SidebarLeft`, `SmartDebugger`, `App.jsx`).

> **CONSIGNE LEGACY (DAT v7, §1.1.1)** : À chaque fois qu'une nouvelle fonctionnalité est ajoutée au format de requête, il est IMPÉRATIF de mettre à jour simultanement : (1) l'affichage dans l'Assistant Prompt, (2) le texte généré par "Ask to AI", ET (3) la Modale de débogage. Ces trois éléments doivent toujours être en parfaite cohérence syntaxique.
