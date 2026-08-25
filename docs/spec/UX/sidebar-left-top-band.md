# Sidebar Gauche — Zone Haute : Bandeau de Requête (Assistant)

## Vue d'ensemble

Le bandeau de requête constitue la partie haute de la sidebar gauche (`SidebarLeft.jsx`). Il affiche les informations contextuelles de la requête active, fournit un guide syntaxique (Assistant format requête) et réagit dynamiquement au redimensionnement vertical de l'interface en se repliant automatiquement.

---

## Contenu du bandeau

Le bandeau se présente sous la forme d'un cadre à bordure pointillée grise (`border-dashed border-[#555]`) et au fond `#333` (lorsqu'il est déployé). Il contient les éléments suivants :

- **Titre principal** : "ASSISTANT FORMAT REQUÊTE" affiché en bleu primaire `#007acc` (lettres capitales, gras).
- **Nom de la requête active** : Identifié par le label de la requête active en cours d'édition (affiché dynamiquement dans l'en-tête de la section commentaire sous la forme `REQ : [label]`).
- **Aperçu de la Syntaxe** : Bloc de texte formaté en police à pas fixe (`font-mono`) de couleur `#9cdcfe` affichant la structure type d'une requête unitaire Rogue Cherry (tags `START`, `FIND`, `REPLACE`, `END` configurés) :
  ```text
  [START] [LABEL:Opt] [MULTI:Opt | NO] [SMART:Opt]
  ##Commentaire## (Optionnel)
  [FIND]
  ...texte à chercher...
  [REPLACE]
  ...texte de remplacement...
  [END]
  ```
- **Bouton d'action "Ask2AI" (📋)** : Copie un prompt système optimisé et enrichi dans le presse-papier de l'utilisateur.
- **Bouton de Paramètres (⚙️)** : Permet d'ouvrir la modale de configuration des balises syntaxiques (`SettingsModal`).

### Description détaillée du Prompt "Ask2AI"
Le prompt copié par le bouton 📋 contient les instructions suivantes pour les LLMs :
- Demande d'agir comme un système de traitement de texte intelligent respectant la syntaxe active de Rogue Cherry.
- Obligation de renvoyer le résultat dans un unique bloc de code Markdown standard (avec \`\`\`).
- Description du format minimal d'une requête unitaire (`START`, `Commentaire`, `FIND`, `REPLACE`, `END`).
- Explication des paramètres optionnels d'en-tête :
  - `[LABEL:nom-de-la-modif]` pour l'identifiant court.
  - `[MULTI:TRUE]`, `[MULTI:0,2]` ou `[MULTI:NO 0,1]` pour le cherry-picking (en **BASE-0**).
  - `[SMART:TRUE]` pour l'activation du Smart Replace (ignorer la casse et les indentations).
- Consignes pour le Multistack : insertion de `##[MULTISTACK REQUEST]##` sur une ligne vide pour séparer les requêtes unitaires.
- Interdiction d'inclure 3 accents graves (```) à l'intérieur des blocs FIND/REPLACE.

---

## Comportement dynamique selon la barre de séparation (Splitter)

Le déplacement vertical de la barre de séparation (splitter horizontal) influe directement sur l'affichage du bandeau.

### Cas 1 — Barre en position haute (zone haute réduite) : Mode Replié (Collapsed)
Lorsque la zone supérieure dispose d'un espace vertical insuffisant, ou que l'utilisateur clique sur le chevron de repli (▼) :
- L'aperçu textuel de la syntaxe est masqué.
- Le bandeau se réduit à une simple ligne de hauteur minimale fixe.
- Le titre reste visible à gauche, précédé d'un bouton de déploiement (▶).
- Les boutons d'action rapide 📋 (Ask2AI) et ⚙️ (Paramètres) sont disposés de manière condensée à l'extrémité droite (taille 6x6 pixels).

### Cas 2 — Barre en position basse (zone haute développée) : Mode Complet (Déployé)
Lorsque l'utilisateur descend le splitter horizontal ou clique sur le bouton de déploiement (▶) :
- Le bandeau s'affiche dans son intégralité (cadre complet `#333`).
- La hauteur de la zone s'adapte pour afficher la syntaxe monospace et le grand bouton Ask2AI vertical (largeur 16px, taille du symbole 3xl).
- Un chevron de repli manuel (▼) est affiché à gauche du titre.

### Seuil de transition et Auto-Collapse
La transition automatique entre les modes replié (collapsed) et complet (déployé) est pilotée par le contrôleur de hauteur selon deux scénarios, selon qu'il y a ou non une pile Multistack active :

- **Sans pile de requêtes active (Mode 3 boutons)** :
  - Dans cette configuration, seuls les 3 boutons d'action standard sont affichés en bas de la zone supérieure, pour une hauteur totale de **94 px** (pas de bandeau de sécurité ni de bouton supplémentaire).
  - L'assistant se replie automatiquement si la distance entre son bas et le splitter descend sous **150 px** (`distanceToSplitter < 150 px`).
  - L'assistant déplié mesurant **220 px** (avec 10 px de marge), le repli s'active ainsi automatiquement si la hauteur totale de la zone supérieure `topHeight` descend sous **380 px** (`220 + 10 + 150 px`).

- **Avec pile de requêtes active (Mode 4 boutons + bandeau de sécurité)** :
  - L'affichage de la pile Multistack et du bandeau d'avertissement orange de 22 px pousse la hauteur fixe des boutons d'action à **140 px**.
  - L'assistant se replie automatiquement si la hauteur `topHeight` est insuffisante pour afficher la pile Multistack avec le nombre requis de requêtes visibles (la pile comptant 30 px de titre et 30 px par item) :
    - **Moins de 10 requêtes dans la pile** (`count < 10`) : On cherche à afficher au moins **5 requêtes** (soit **180 px** pour la pile). En additionnant l'assistant déplié (220 px) et les boutons d'action (140 px), le repli s'active automatiquement si `topHeight < 540 px` (`140 + 220 + 180 px`).
    - **10 requêtes ou plus dans la pile** (`count >= 10`) : On cherche à afficher au moins **10 requêtes** (soit **330 px** pour la pile). Le repli s'active automatiquement si `topHeight < 690 px` (`140 + 220 + 330 px`).

- **Gestion des préférences vs contrainte d'espace (Splitter vs Clic)** :
  - **Mouvement vers le haut (Réduction d'espace)** : La contrainte physique de la sidebar est prioritaire. Si l'utilisateur remonte le splitter horizontal et franchit le seuil correspondant (**380 px** sans pile, **540 px** ou **690 px** avec pile), l'assistant est **systématiquement replié**, même si l'utilisateur avait forcé son ouverture.
  - **Mouvement vers le bas (Augmentation d'espace)** : Lorsque l'utilisateur descend le splitter et libère de l'espace vertical :
    - Si l'assistant a été **manuellement replié** par l'utilisateur (via un clic sur le chevron `▼` positionnant `isAssistantCollapsedByUser` à `true`), il **reste replié** pour respecter sa préférence.
    - S'il n'a pas été manuellement replié (`isAssistantCollapsedByUser` est `false`), l'assistant **se redéploie automatiquement** dès que la hauteur `topHeight` repasse au-dessus du seuil requis.

---

## Interactions utilisateur

| Action | Cible | Résultat |
|---|---|---|
| Clic | Bouton ▼ (Mode déployé) | Replie l'assistant et active `isAssistantCollapsedByUser` à `true`. |
| Clic | Bouton ▶ (Mode replié) | Déploie l'assistant et réinitialise `isAssistantCollapsedByUser` à `false`. |
| Clic | Bouton 📋 (Ask2AI) | Génère et copie le prompt IA optimisé dans le presse-papier. Affiche une MessageBox de confirmation. |
| Clic | Bouton ⚙️ (Paramètres) | Ouvre la modale `SettingsModal` pour configurer les balises de syntaxe. |
| Glissement (Drag) | Splitter horizontal | Ajuste la hauteur `topHeight` de la zone supérieure, déclenchant l'auto-collapse si nécessaire. |

### Comportement de Superposition et Rognage (Clipping)
L'Assistant format requête occupe le sommet du conteneur de flux de la sidebar gauche :
- **Solidarité dans le flux** : Il est positionné dans le même conteneur vertical flex que la pile Multistack située directement en dessous. Ces deux éléments se poussent mutuellement et ne se chevauchent jamais.
- **Masquage par superposition (z-index)** : En cas de réduction extrême de la hauteur supérieure par le splitter, la bande des Boutons d'Action Principaux (qui est surélevée sur une couche supérieure `z-index: 10` opaque) va glisser et passer visuellement **par-dessus** le bandeau de l'assistant (une fois celui-ci replié à sa taille minimale de 38 px), le masquant progressivement par le bas sous l'effet de la butée et du rognage (`overflow-hidden`).

---

## Dépendances et références

- Voir [ui-layout-main.md](ui-layout-main.md) pour les règles générales du splitter horizontal, du responsive et de la superposition.
- Voir [sidebar-left-multistack.md](sidebar-left-multistack.md) pour la pile de requêtes située immédiatement sous le bandeau.
- Voir [sidebar-left-center.md](sidebar-left-center.md) pour le groupe de boutons d'action en bas de la section supérieure.
