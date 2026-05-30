# Spécifications : Recherche Dynamique et Prompt IA (`SidebarLeft.jsx`)

**Contexte** : Colonne de gauche (`SidebarLeft.jsx`).

Interface principale d'interaction avec le flux de modifications IA. Elle permet de composer, visualiser, et appliquer les requêtes FIND/REPLACE, de gérer le Cherry-Picking, et de générer des prompts pour l'assistant IA.

---

## 1. Agencement Visuel et Splitter

### 1.1 Splitter Horizontal
- La sidebar est divisée en deux sections via un `Splitter.jsx` glissant vertical.
- La section **haute** (`topHeight`) contient : le Multistack / Prompt IA + l'Assistant IA.
- La section **basse** contient : les champs FIND & REPLACE, l'encart Cherry-Picking, la zone de commentaire.

### 1.2 Auto-Collapse Intelligent (V8)

Deux zones peuvent se replier automatiquement selon l'espace disponible :

| Zone | Condition de repli automatique |
|---|---|
| **Assistant IA** | `pendingRequests.length > 1` ET espace vertical disponible inférieur à un seuil |
| **Zone Commentaire** | Encart Multi-Occurrences (Cherry-Picking) ouvert ET espace vertical insuffisant |

- Un **forçage manuel** (clic sur le chevron `▲/▼`) désactive le comportement automatique pour la session courante via les flags `isAssistantCollapsedByUser` et `isCommentBoxCollapsedByUser`.
- Ces flags préservent le choix de l'utilisateur : même si les conditions de repli sont remplies, la zone reste dans l'état où l'utilisateur l'a laissée.

---

## 2. Zone Requête et Multistack

### 2.1 Traitement des Collages
- Toute saisie ou collage dans les champs est intercepté et routé vers `textParser.js`.
- Si le texte colle via `splitMultistackRequest` retourne plusieurs blocs → chaque bloc apparaît comme un item dans la liste Multistack.
- Si un seul bloc → les champs FIND et REPLACE sont directement peuplés.

### 2.2 Génération du Prompt IA ("Ask to AI")
- Bouton bleu qui génère un prompt complet dans le presse-papier à fournir à un LLM.
- Le prompt inclut :
  - La syntaxe de balises actuellement configurée (`syntaxConfig`).
  - Un rappel explicite que les index Multi sont en **BASE-0**.
  - Un exemple de requête complet avec tous les attributs optionnels documentés.
  - Le contexte du code source (ou un extrait sélectionné).

### 2.3 Multistack (Pile de Requêtes)
- Affiche les requêtes en attente en liste verticale.
- Un clic sur un item charge sa requête dans les champs FIND/REPLACE **sans purger les autres**.
- Un bouton 🗑️ par item permet de supprimer une entrée spécifique.
- Le bouton "Appliquer tout" exécute les requêtes dans l'ordre de la pile.

---

## 3. Mécanique FIND & REPLACE

### 3.1 Architecture Calques (Textarea + Backdrop)
- Les champs FIND et REPLACE sont chacun constitués de deux couches superposées :
  - **`textarea`** (invisible) : Reçoit les événements clavier et la saisie.
  - **`backdrop div`** (visible) : Affiche le texte colorisé via `computeLiveDiff`.
- Un écouteur de scroll (`handleScrollFind`, `handleScrollReplace`) synchronise manuellement les positions `scrollTop` et `scrollLeft` de la textarea vers le backdrop.

### 3.2 Champ FIND
- Déclenche `computeSearchHeatmap` en temps réel sur le code source du projet.
- Affiche un **badge de ratio** (`x / y occurrences`).
- Un clic sur le badge ouvre la `LineChoiceModal` en Mode Occurrences.
- **Désactivé** si la Recherche Globale (bandeau supérieur) est active.

### 3.3 Mode SMART
- Une checkbox ou toggle bascule `ignoreSpaces`.
- Quand actif, la recherche est insensible à la casse et tolérante aux espaces multiples.
- L'état est persisté dans la requête via `[SMART:TRUE]` lors de la génération de la requête brute.

### 3.4 Colorisation DraftSurge (Backdrop)
- Le backdrop colorise les différences entre FIND et REPLACE en temps réel via `computeLiveDiff`.
- **FIND** reçoit les marques `marksT1` (texte supprimé, rouge).
- **REPLACE** reçoit les marques `marksT2` (texte ajouté, vert).

---

## 4. Panneau Multi-Occurrences (Cherry-Picking)

### 4.1 Condition d'Affichage
- `multiMode === true` ET `occurrencesCount > 1`.
- Le panneau s'insère entre le champ REPLACE et la zone de commentaire.

### 4.2 Fonctionnement
- Affiche **une case à cocher par occurrence** trouvée, libellée avec le numéro de ligne absolue.
- Cliquer sur la ligne (hors checkbox) déclenche un scroll du CodeEditor vers la ligne concernée.
- Cocher/Décocher met à jour `multiIndices` et en cascade la requête brute (`[MULTI:0,2]`).
- Deux boutons rapides : **"Tout cocher"** et **"Rien cocher"**.

### 4.3 Audit IA (Ajout 11 — V1.0)
- Bouton violet "🤖 AUDIT AI" actif si au moins une occurrence est cochée.
- Génère un rapport dans le presse-papier contenant :
  - Le contexte de code (`-3 / +3 lignes`) de **chaque occurrence sélectionnée uniquement**.
  - Le numéro de ligne absolue de chaque occurrence.
  - Une instruction claire demandant à l'IA de ne modifier que ces occurrences, en respectant la BASE-0.
- **Note technique** : Les caractères spéciaux dans le code sont protégés (escape ASCII) pour éviter des collisions d'affichage dans certains terminaux ou interfaces IA.

---

## 5. Zone de Commentaire

- Champ texte libre situé en bas de la section inférieure.
- Le contenu est stocké dans l'enregistrement d'historique sous `comment`.
- Pré-peuplé automatiquement si la requête IA contenait un tag `##Commentaire##`.
- Non obligatoire — peut être laissé vide.

---

## 6. Boutons d'Action Principale

| Bouton | Condition d'activation | Action |
|---|---|---|
| **REMPLACER** | `searchResult.foundRatio === 1` | Applique le remplacement et ajoute un enregistrement dans l'historique |
| **SMART UNDO** | Enregistrement `replace` sélectionné dans l'historique | Génère une requête d'annulation inverse (FIND=replaceStr, REPLACE=findStr) |
| **CHERCHER** | FIND non vide | Déclenche la recherche et affiche les occurrences |
