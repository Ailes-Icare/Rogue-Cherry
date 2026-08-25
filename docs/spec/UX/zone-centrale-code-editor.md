# Spécifications : Zone Centrale — Contrôleur de l'Éditeur de Code

**Contexte** : Zone centrale, composant parent de l'éditeur de code principal (`App.jsx` instanciant `CodeEditor.jsx`).

Ce document décrit le rôle de contrôleur de la zone centrale vis-à-vis du composant `CodeEditor`. Il définit comment le contrôleur gère l'état, synchronise les actions de l'utilisateur, applique les modifications libres et coordonne les retours visuels.

---

## 1. Distinction : Composant vs Contrôleur

Pour éviter les duplications et régressions, une séparation stricte est observée :
- **Composant `CodeEditor.jsx`** : Fournit le moteur de rendu optimisé (Windowing / Virtualisation), la gouttière des numéros de ligne, le support des caractères invisibles, et la zone d'édition (textarea/div). C'est une boîte noire visuelle et fonctionnelle décrite dans [CodeEditor.md](CodeEditor.md).
- **Contrôleur de la Zone Centrale (`App.jsx`)** : C'est l'instance maîtresse de l'éditeur dans le flux principal. Il gère la persistance du texte, la distribution des marqueurs de diff, et l'intégration dans l'historique des versions.
- **Contrôleur du Débogueur (`SmartDebugger.jsx`)** : C'est une instance secondaire de l'éditeur, isolée, utilisée spécifiquement pour le travail de débogage et de simulation (décrite dans [SmartDebugger.md](../modal/SmartDebugger.md)).

**Le contrôleur est spécifique à la fenêtre principale sur quelques points particuliers :**
- **Logo central (Filigrane) en arrière-plan** :
  - **Fichier source** : `_brand/rogue_cherry-GHB.svg` (alias `logoGhb`).
  - **Transparence** : Fixée à **30%** (`opacity-30`).
  - **Taille** : Largeur automatique, limitée à un maximum de **80% de la largeur** de la zone d'édition et **50% de sa hauteur** (`max-w-[80%] max-h-[50%]`).
  - **Position** : Parfaitement centré horizontalement et verticalement dans la zone d'édition.
  - **Mécanique de Scroll fixe (CSS Layering)** : Le conteneur du logo est positionné en absolu (`absolute inset-0`) avec un `zIndex` de `0`. La couche d'affichage du texte du code (`editorWrapperRef`) est positionnée en superposition absolue (`absolute inset-0`) avec un `zIndex` de `1` et gère le défilement (`overflow: auto`). Le logo reste donc fixe à l'écran tandis que le code défile au premier plan.
  - **Gestion de mémoire** : Le logo est entièrement déchargé du DOM (pas simplement masqué) dès que le mode d'édition ou l'affichage des invisibles est activé.
- **La présence du bandeau de statut au-dessous** (voir [zone-centrale-bandeau-bas.md](zone-centrale-bandeau-bas.md))
- **L'UX de sélection in situ pour le Cherry-Picking** (voir Chapitre 4 de ce document)

---

## 2. Gestion des Propriétés (Props) et États

Le contrôleur de la zone centrale injecte les propriétés dynamiques suivantes dans le composant `<CodeEditor>` :

| Prop | Source dans `App.jsx` | Description |
|---|---|---|
| `text` | `store.currentText` (ou `previewData.text`) | Le texte source complet du projet à afficher dans la zone. |
| `onTextChange` | `handleSaveFreeEdit` | Callback déclenché pour valider et enregistrer les modifications issues de l'édition libre. |
| `marks` | `allMarks` | Fusion des marques de l'historique en cours, des deltas appliqués, et du Find de la Sidebar gauche. |
| `activeOccIndex` | `activeOccIndex` (ou `globalSearchOccIndex`) | Index de l'occurrence de recherche sur laquelle l'éditeur doit centrer le défilement (scroll). |
| `isEditable` | `isEditable && !isReplaceActive` | Indique si l'éditeur est déverrouillé en Mode Édition Libre. |
| `onToggleEditable` | `handleToggleEditable` | Callback pour basculer l'état du cadenas d'édition. |
| `fontSize` / `setFontSize` | `fontSize` | Taille de la police de caractères (zoom). |
| `statusBarInfo` | Chaîne calculée | Texte explicatif injecté dans la barre de statut (ex: "Occurrence 1/3 (MULTIPLE)"). |
| `scrollTargetIndex` | `historyScrollTarget` | Position de ligne ciblée pour scroller automatiquement l'éditeur (ex: clic sur un item d'historique). |
| `onToggleOccurrence` | Callback de Cherry-Picking | Appelé lorsqu'une occurrence est cochée/décochée dans le code en mode multiple. Met à jour `multiIndices`. |

---

## 3. Cycle de Vie de l'Édition Libre (Mode Cadenas)

L'une des responsabilités clés du contrôleur est de gérer la transition entre le mode lecture seule et le mode écriture.

```
       [Mode Lecture Seule]
                 │
                 ▼ (Clic cadenas / double-clic barre statut)
         [Mode Édition Libre]
                 │  (Saisie manuelle utilisateur dans textarea)
                 ├─────────────────────────┐
                 ▼ (Clic ENREGISTRER)      ▼ (Clic Annuler)
     [Calcul Delta via Diff]          [Restauration]
                 │                         │
                 ▼                         ▼
   [Ajout Historique Silencieux]     [Verrouillage Cadenas]
                 │
                 ▼
       [Mode Lecture Seule]
```

### 3.1 Entrée en mode Édition Libre
1. L'utilisateur clique sur le cadenas de la barre de statut.
2. L'état `isEditable` passe à `true`.
3. Le contrôleur mémorise la position de scroll actuelle (`savedScrollRef`) de sorte à rester là où se trouve l'utilisateur.
4. L'éditeur bascule sur un `<textarea>` natif et positionne le curseur au milieu de l'écran visible pour éviter un scroll brutal du navigateur.
5. **Déchargement du logo** : Le logo central en arrière-plan est instantanément retiré de la zone de texte. Ce déchargement est opéré via un démontage complet du composant d'arrière-plan dans React (`!isEditable && !showInvisibles`), ce qui libère la mémoire et évite tout lag ou ralentissement lors de la saisie au clavier.
6. **Cumul du Mode Invisibles** : L'activation de l'édition libre n'empêche pas l'affichage cumulatif des caractères invisibles (espaces, tabulations, retours chariot). Si l'affichage des invisibles est activé (icône œil dans la barre de statut basse, voir [zone-centrale-bandeau-bas.md](zone-centrale-bandeau-bas.md)), l'éditeur superpose un calque de rendu des invisibles synchronisé en défilement avec le textarea d'édition libre (mécanique détaillée dans [CodeEditor.md](CodeEditor.md)).

### 3.2 Sortie et Enregistrement des Modifications
Lors du clic sur le bouton vert clignotant **ENREGISTRER** :
1. Le contrôleur appelle `handleSaveFreeEdit` avec la nouvelle valeur textuelle.
2. **Algorithme de génération des requêtes (`computeGhostDelta`)** : Le contrôleur compare la version du texte avant édition (`textBeforeFreeEdit.current`) avec la nouvelle version.
   - **Détection des écarts (Gap Threshold)** : L'algorithme regroupe les lignes modifiées. Si deux blocs de modifications sont séparés par un écart inférieur ou égal à **8 lignes** (`GAP_THRESHOLD = 8`), ils sont fusionnés dans la même requête.
   - **Génération Multi-requêtes** : Si des modifications sont très éloignées les unes des autres (écart strictement supérieur à 8 lignes), l'algorithme ne génère pas une unique requête, mais **plusieurs requêtes distinctes** (une par groupe isolé de modifications).
3. **Création des points d'historique** : Pour chaque delta généré :
   - Un nouvel enregistrement est automatiquement poussé dans le store d'historique.
   - **Labels et Commentaires par défaut** : Le label (action) de la requête prend la valeur par défaut `"Manual Edit"`, et le commentaire associé reste **vide** (`null`).
   - **Attributs SMART et MULTI** : Les attributs `smartMode` (sensibilité aux espaces) et `multiMode` (cherry-picking) sont forcés à `false`. Ces concepts de ciblage n'ont aucun sens pour des modifications saisies de manière séquentielle et directe dans le texte source par l'utilisateur.
4. L'état `isEditable` repasse à `false` (le cadenas est reverrouillé).

### 3.3 Annulation des Modifications
Si l'utilisateur clique sur le bouton **Annuler** :
1. Le texte édité localement est jeté.
2. Le contrôleur restaure la valeur initiale (`store.currentText`).
3. L'état `isEditable` repasse à `false`.

## 4. Interaction et Cherry-Picking depuis l'Éditeur

- Lorsque le mode multiple (`multiMode`) est actif et que l'utilisateur clique sur une occurrence de recherche dans l'éditeur (en mode lecture seule) :
  - Le contrôleur intercepte le clic via `onToggleOccurrence`.
  - Si l'index de l'occurrence est déjà présent dans le tableau de sélection `multiIndices`, il est retiré.
  - S'il n'est pas présent, il est ajouté et trié par ordre croissant.
  - Cela met instantanément à jour le panneau de Cherry-Picking de la Sidebar gauche et modifie la signature de la requête brute générée (`[MULTI:...]`).
  - **Maintien de la position de lecture** : Lors du clic pour activer ou désactiver une occurrence, le défilement de la page reste fixe (le système intercepte ce changement pour ne pas ramener brutalement l'utilisateur vers la première occurrence du fichier).

### 4.1 Retours Visuels et Charte Colorimétrique du Cherry-Picking

Le statut de chaque occurrence de recherche s'affiche avec une couleur spécifique :
- **Occurrence Validée / Cochée (Inclus dans `multiIndices`)** : Surlignée en **Jaune Vif** (classe `.hl-yellow`). Elle indique que cette occurrence sera ciblée par l'application du remplacement.
- **Occurrence Non Cochée (Exclue de `multiIndices`)** : Surlignée en **Jaune Légèrement Grisé / Pâle** (classe `.hl-yellow-pale`, jaune transparent avec un liseret pointillé jaune vif). Elle indique que cette occurrence sera ignorée lors de la modification.
- **Occurrence Active Focalisée** : Reçoit l'indicateur de positionnement `▶` dans la gouttière et le liseret de ciblage clignotant rouge si activé par la navigation, tout en conservant sa couleur de sélection.

