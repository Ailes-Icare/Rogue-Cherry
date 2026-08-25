# Spécifications : Modale Débogueur Intelligent (`SmartDebugger.jsx`) — Agencement Visuel (UI)

**Fichier source** : `src/components/SmartDebugger.jsx` (1203 lignes)

Ce document définit l'agencement visuel, le squelette structurel et les contrôles de positionnement de la modale de débogage. Pour les spécifications logiques, voir :
- Le [Contrôleur de l'Éditeur Miroir (modal-debug-code-editor.md)](../UX/modal-debug-code-editor.md)
- Le [Contrôleur de Saisie et de Recherche (modal-debug-recherche.md)](../UX/modal-debug-recherche.md)

---

## 1. Cadre de la Modale et Triggers d'Ouverture

La modale s'affiche au-dessus de l'interface principale (fond d'assombrissement noir translucide `bg-black/80` avec un `zIndex` de `1000`).

### 1.1 Triggers Visuels
Elle s'ouvre de deux façons :
1.  **Ouverture automatique** : Suite à une erreur de syntaxe après collage ou application d'une requête IA.
2.  **Ouverture manuelle** : En cliquant sur le **Logo Cerises** du bandeau supérieur (quand un texte est chargé).

### 1.2 Styles du Cadre
- Le cadre principal de la modale prend une largeur de **90%** et une hauteur de **95%** de l'écran (`w-[90%] h-[95%]`).
- La bordure du cadre s'adapte dynamiquement selon la conformité syntaxique de la requête :
  - **Requête Conforme** : Bordure verte `rgb(0, 255, 127)` (`#00FF7F`) et lueur `shadow-[0_0_15px_rgba(0,255,127,0.25)]`.
  - **Syntaxe Invalide** : Bordure rouge cerise `rgb(209, 105, 105)` (`#d16969`) et lueur `shadow-[0_0_15px_rgba(209,105,105,0.25)]`.
- La modale est repositionnable manuellement (draggable) via un écouteur sur son en-tête.

---

## 2. Architecture Splitter Horizontal

La zone de travail sous l'en-tête est coupée en deux panneaux par un séparateur vertical dynamique (`Splitter.jsx` glissant horizontalement) :

-   **Panneau Gauche** : Réservé à l'analyse et à la correction de la requête (largeur initiale fixée par défaut à **40%**).
-   **Panneau Droit** : Réservé à la prévisualisation miroir du code source (largeur restante de **60%**).

---

## 3. Panneau Gauche : Édition, Décodage et Prévisualisation de la Requête

Le panneau gauche regroupe les outils de manipulation de la requête active. Il est divisé en deux sous-sections verticales : la saisie brute (Raw) et les onglets de décodage (FIND/REPLACE).

### 3.1 Saisie de la Requête Brute
1. **Entête "Requête Brute (Éditable)"** : Titre à gauche, bouton **SMART** et **bouton œil de gauche** à droite.
2. **Zone de Requête Brute** : Hauteur fixe de `160px` avec liseret pointillé bleu (`border-dashed border-primary-blue`), constitué d'un calque superposé `textarea` / `backdrop` pour la coloration syntaxique en temps réel.
3. **Encart d'erreur** : S'affiche sous la requête brute en rouge cerise si la syntaxe est invalide (`!parsedRequest.isValid`).

### 3.2 Le Badge/Bouton FIND (Zone FIND Décodée)
La zone FIND décodée (lecture seule) présente à sa droite un badge dynamique interactif qualifiant l'état de la recherche du motif dans le texte source :
- **Rôle du bouton/badge FIND** : 
  - **Indicateur d'occurrences** : Affiche `FIND (N)` (où N est le nombre total d'occurrences trouvées) ou un compteur dynamique `- X / Y` si la recherche est valide, trouve plusieurs correspondances et que le Find dynamique est actif.
  - **Single-clic (Navigation)** : Si la recherche est valide, trouve au moins 2 occurrences et que le Find dynamique est actif, un clic simple sur le compteur ouvre la modale de sélection de ligne `LineChoiceModal` (avec effet dirigé sur le miroir de code via `setSearchOccIndex`).
  - **Double-clic (Bascule d'activation)** : Active ou désactive le Find dynamique DraftSearch pour le Débogueur (`isFindActive`).
- **Comportement de Désactivation (Find inactif)** :
  - Lorsque le Find dynamique est désactivé (`isFindActive = false`), toute la zone FIND passe en style grisé/atténué.
  - La colorisation jaune des occurrences trouvées dans le miroir de code source est **immédiatement effacée**.
  - Si l'utilisateur clique sur le badge inactif, aucun effet de navigation ou d'ouverture de modale ne se produit.
- **États Visuels du badge FIND** :
  - *Actif & Correspondance 100%* : Fond vert-turquoise (`bg-[#00FF7F]`), texte noir, lueur verte (`shadow-[0_0_8px_rgba(0,255,127,0.6)]`).
  - *Actif & Correspondance Partielle (< 100%)* : Fond orange chaud (`bg-[#FF8C00]`), texte noir.
  - *Inactif* : Fond gris sombre (`bg-[#555]`) avec texte coloré atténué (`text-[#00FF7F]` ou `text-[#FF8C00]`).
  - *Verrouillage forcé* : Si la recherche globale de la modale est active (`isGlobalSearchActive`) ou si l'onglet REPLACE est actif, le badge est grisé et bloqué (`cursor-not-allowed`).

### 3.3 Le Badge/Bouton REPLACE (Zone REPLACE Décodée)
La zone REPLACE décodée (lecture seule) présente à sa droite un badge interactif de prévisualisation :
- **Rôle du bouton REPLACE** :
  - **Double-clic (Bascule de Prévisualisation)** : Active ou désactive l'état de prévisualisation du remplacement virtuel dans le miroir de code source (`isReplaceActive`).
- **Contraintes et Conditions d'activation** :
  - L'activation n'est autorisée que si la requête est syntaxiquement valide et que le Find de la requête a un ratio de conformité de **100%** (`searchResult.foundRatio === 1`).
  - Si le ratio est < 100%, le bouton est verrouillé en gris sombre avec un texte violet estompé (`text-[#9E67BA]/40`) et un curseur interdit (`cursor-not-allowed`), avec le tooltip *"Requis: Find à 100%"*.
  - Si la recherche globale est active, le double-clic sur REPLACE est bloqué.
- **Effet de l'activation (`isReplaceActive = true`)** :
  - Le miroir de code source à droite bascule d'affichage : il n'affiche plus le texte source original, mais le **texte virtuellement modifié** résultant de l'application de la requête.
  - Le moteur applique l'algorithme `computeLiveDiff` qui colorise en temps réel les insertions (rose/magenta `.hl-ins`), les modifications de mots (violet vif `.hl-word-mod` sur fond violet sombre `.hl-line-mod`) et les suppressions (icône `[✖]` `.hl-del` ou texte barré `.hl-del-txt`).
  - L'activation de REPLACE désactive temporairement le badge FIND (le grisant en `cursor-not-allowed`).

---

## 4. Panneau Droit : Barre de Recherche Globale et Miroir

Le panneau droit affiche le miroir de prévisualisation du texte source et intègre sa propre barre de recherche globale indépendante.

### 4.1 La Barre de Recherche Globale du Débogueur
Cette barre de recherche permet à l'utilisateur de tester une chaîne de caractères libre au sein du miroir sans affecter la requête brute en cours d'édition à gauche.
- **Rendu Visuel et Éléments** :
  - **Bouton SMART** : Toggle d'insensibilité à la casse/espaces, visible uniquement si le champ de recherche n'est pas vide.
  - **Label Similitude** : Affiche le pourcentage de correspondance de la meilleure occurrence trouvée sous forme colorée (vert à 100%, jaune > 50%, rouge sinon).
  - **Textarea + Gouttière** : Champ de saisie extensible verticalement (max 25% de la hauteur de l'écran, avec splitter horizontal) affichant la loupe 🔍 et les numéros de lignes de recherche en mode multiligne.
  - **Compteur d'occurrences (`- X / Y`)** et boutons de navigation (▲ / ▼) : Permettent de cibler et de sauter d'une occurrence de recherche à l'autre dans le miroir. Double-cliquer sur le compteur ouvre la `LineChoiceModal` (avec effet dirigé sur le miroir).
  - **Bouton "Copier & Supprimer" (📋)** : Copie le texte saisi dans le champ FIND de la requête brute à gauche, puis vide le champ de recherche.

### 4.2 Désactivation de facto de la Colonne Gauche par la Recherche
Dès que l'utilisateur saisit du texte dans le champ de recherche globale du débogueur (`isGlobalSearchActive = true`) :
- **Gel complet de la colonne gauche** : Le conteneur entier du panneau gauche reçoit la classe `opacity-40 grayscale pointer-events-none`, interdisant toute interaction avec la requête brute ou les onglets.
- **Verrouillage en lecture seule** :
  - La zone de texte de la requête brute et les zones de saisie FIND et REPLACE passent en lecture seule (`readOnly={true}`) et reçoivent un fond sombre (`#331111`) avec le curseur `cursor-not-allowed`.
  - Les badges FIND et REPLACE sont verrouillés en état inactif grisé (`cursor-not-allowed`).
- **Priorité d'affichage** : La chaîne de recherche globale devient prioritaire pour la génération de la heatmap du miroir, masquant temporairement le surlignage issu de la requête.
- **Rétablissement** : Dès que le champ de recherche est vidé, la colonne gauche se réactive instantanément, retrouvant son opacité et ses états d'interaction (y compris l'état d'activation du Find dynamique `isFindActive` tel qu'il était avant le gel).

### 4.3 Comparaison avec le Layout Principal
Bien que partageant le même code sous-jacent et les mêmes comportements réactifs (voir [zone-centrale-recherche.md](../UX/zone-centrale-recherche.md) et [GlobalSearch.md](../UX/GlobalSearch.md)), la recherche globale du Débogueur présente les différences d'UI suivantes :
- **Emplacement** : Elle est intégrée **en haut de la colonne droite (miroir)** du Débogueur, tandis que la recherche principale est située au-dessus de l'éditeur central de la page principale.
- **Périmètre d'effet** : Ses sauts de navigation, son liseret rouge de ciblage de 1500ms et sa heatmap s'appliquent exclusivement sur le **Miroir de prévisualisation (colonne droite)** et n'affectent jamais l'éditeur principal de l'application.
- **Périmètre de gel** : Son activation gèle la colonne gauche de la modale de débogage, tandis que la recherche globale principale gèle la Sidebar gauche de l'application.

---

## 5. Boutons de Visibilité des Caractères Invisibles (EyeIcons)

Pour préserver l'espace de la barre de statut principale, la modale intègre **deux boutons d'affichage des caractères invisibles (icônes œil) distincts** :

### 5.1 Bouton Œil Gauche (Saisie Requête)
- **Position** : Situé tout en haut à droite du panneau gauche, dans la barre d'en-tête de la "Requête Brute (Éditable)".
- **Action** : Active ou désactive l'affichage des espaces (`·`), tabulations (`→`) et retours à la ligne (`¶`/`↵`) dans les zones d'édition de gauche (Requête brute, FIND décodé, REPLACE décodé).

### 5.2 Bouton Œil Droite (Miroir de Code)
- **Position** : Situé en haut à droite du panneau droit, dans la barre d'en-tête noire du "Miroir de Prévisualisation du Texte Source".
- **Action** : Active ou désactive l'affichage des caractères invisibles spécifiquement dans la zone d'affichage du code miroir à droite.

*Ces deux contrôles fonctionnent sur le même principe visuel que le bouton œil de l'éditeur principal (voir [zone-centrale-bandeau-bas.md](../UX/zone-centrale-bandeau-bas.md)), mais agissent indépendamment sur leurs panneaux respectifs.*

---

## 6. Contrôles de Zoom Indépendants (Ctrl + Molette)

Pour optimiser la lisibilité du code et des requêtes, la modale intègre des mécanismes de zoom indépendants contrôlés par le raccourci `Ctrl + Molette` (via le hook `useZoomable`) :

### 6.1 Zoom des Zones de Saisie et de Décodage (Panneau Gauche)
- **Requête Brute, FIND et REPLACE** : Chacune de ces trois zones dispose de son propre conteneur zoomable indépendant (limites de **8 px** à **40 px**, valeur initiale **14 px**).
- Le zoom adapte dynamiquement la taille du texte tout en préservant l'alignement et la superposition des calques de coloration syntaxique et de caractères invisibles.

### 6.2 Zoom du Miroir de Prévisualisation (Panneau Droit)
- **Miroir du Texte Source** : Le conteneur du miroir dispose d'un zoom indépendant (limites de **8 px** à **40 px**, valeur initiale **10 px**).
- **Synchronisation de la Gouttière** : La gouttière de numérotation de ligne (`MirrorLine`) hérite de la taille de police active du miroir (`style={{ fontSize: 'inherit' }}`). Ainsi, la gouttière et ses indicateurs zooment et dézooment en parfaite synchronisation avec le texte du code source.

### 6.3 Zoom de la Barre de Recherche Globale
- En mode multiline, la zone de texte de recherche possède son propre zoom indépendant (`searchFontSize` de **8 px** à **40 px**), avec une gouttière de numéros de ligne multiline synchronisée qui s'ajuste également en temps réel.

---

## 7. Le Barre de Statut Inférieure (Footer de la Modale)

La zone inférieure de la modale regroupe la configuration fine des paramètres de la requête et les boutons de validation :

### 7.1 Les Paramètres de la Requête (À gauche)
Ces contrôles permettent de modifier directement les métadonnées de la requête IA décodée sans avoir besoin d'éditer manuellement la chaîne brute. Ils sont désactivés si la pile multistack est active (`isMultistackMode = true`). 
**Mécanisme de secours (Fallback) :** Même si la syntaxe de la zone brute est globalement invalide (ce qui bloque la génération standard), l'utilisation de ces contrôles (Smart, Multi, Label, Commentaire) ne s'arrête pas silencieusement. Ils utilisent une modification chirurgicale (Regex) directement sur les premières lignes de la chaîne de texte brute pour forcer la mise à jour des en-têtes sans endommager le reste du contenu saisi.
- **Bouton SMART (💡)** : 
  - *Rôle* : Active ou désactive le mode tolérant aux espaces et à la casse (`smartMode`) sur l'en-tête de la requête.
  - *Comportement* : Met à jour la chaîne brute en injectant `[SMART:TRUE]` ou `[SMART:FALSE]`.
  - *Couleur* : Vert vif (`bg-[#4caf50]` avec lueur) si actif, gris sombre (`bg-[#555]`) si inactif.
- **Bouton MULTI** :
  - *Rôle* : Active ou désactive le mode de remplacement multiple (`multiMode`).
  - *Comportement* : Affiche un champ de saisie texte à sa droite lorsqu'il est actif pour spécifier les indices des occurrences ciblées.
  - *Couleur* : Violet royal (`bg-[#5c2d91]` avec lueur) si actif, gris sombre (`bg-[#555]`) si inactif.
  - **Saisie des indices** : Permet d'écrire une liste d'entiers séparés par des virgules (ex: `0,2,4`) représentant les index base-0 des occurrences à modifier. Un label rappelle que pour les sélections complexes, il convient de passer par l'interface principale (Cherry-Picking).
- **Champ Label (LBL sur mobile)** : Zone de saisie du label personnalisé. Sa modification met à jour l'en-tête `[LABEL:...]` de la requête brute. Le champ est désormais flexible (flex-1) et responsif.
- **Champ Commentaire (CMT sur mobile)** : Zone de saisie du commentaire optionnel. Sa modification met à jour la section `##Commentaire##` en bas de la requête brute. Le champ est étendu visuellement pour plus de confort de saisie.

### 7.2 Les Boutons d'Action (À droite)
- **ANNULER** : Ferme la modale sans appliquer ni conserver les modifications de la session de débogage.
- **VALIDER & COPIER LA REQUÊTE** :
  - *Rôle* : Ferme la modale et injecte la requête corrigée (brute et champs décodés) dans la `SidebarLeft` principale de l'application, sans l'appliquer immédiatement sur le texte source. L'utilisateur peut procéder à des ajustements finaux.
  - *Activation* : Actif uniquement si la syntaxe de la requête est valide (`parsedRequest.isValid`).
- **VALIDER & APPLIQUER LA REQUÊTE** :
  - *Rôle* : Ferme la modale, applique directement le remplacement sur le texte principal de l'application et l'enregistre comme un nouvel événement d'historique de type `replace` (avec label et commentaire mis à jour).
  - *Activation* : Actif uniquement si la requête est syntaxiquement valide et que le ratio de conformité de recherche est à **100%** dans le miroir (`searchResult.foundRatio === 1`).
  - *Verrouillage* : Désactivé si un traitement de pile multistack est en cours (`isMultistackMode = true`), car les modifications via le débogueur ne peuvent pas court-circuiter une exécution séquentielle de pile.


