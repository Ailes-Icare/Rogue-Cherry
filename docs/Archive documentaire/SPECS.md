# Spécifications Techniques — Rogue Cherry V8

> **Statut global** : 🟡 En cours d'implémentation (Étape 2)  
> **Source de vérité** : Ce document régit la structure logique, le design visuel et le comportement réactif de l'application.

---

## 1. Moteur d'Historique Delta-Encoding (`useHistoryStore`)

**Statut** : 🟡 En cours

**Description** : Custom Hook React gérant le stockage ultra-compact de l'historique et la navigation temporelle sans saturation de la RAM (résolution de la fuite de mémoire d'origine).

### Gestion d'état (State)
L'état de l'historique est structuré sous forme d'un tableau d'enregistrements :
- **Snapshot Complet (Point d'ancrage) :** Stocké uniquement lors de l'**Import Initial** ou lors de la création d'une **Version Majeure** (ex: `V2.0.0`).
  ```javascript
  {
    type: "snapshot",
    version: "V1.0.0",
    action: "IMPORT INITIAL",
    timestamp: "23/05/2026 18:54:12",
    rawText: "...", // Texte brut intégral (ex: 8000 lignes)
    marks: [], // Tableau de marqueurs
  }
  ```
- **Delta-Opération (Remplacement unitaire) :** Stocké lors de l'application finale réussie d'un remplacement. Ne stocke **aucun** texte brut complet.
  ```javascript
  {
    type: "replace",
    version: "V1.0.1",
    action: "Remplacement de variable X", // Extrait de [LABEL:...] ou auto-généré
    timestamp: "23/05/2026 18:55:00",
    findStr: "...", // Requête FIND
    replaceStr: "...", // Requête REPLACE
    multiMode: true,
    multiIndices: [0, 2], // Cherry-picking
    splitChars: false,
    marksAfter: [], // Marqueurs après le remplacement (facilite le rendu)
    displayMarksAfter: [] // Marqueurs de recherche active après remplacement
  }
  ```

### Comportement attendu & Algorithme de Rejeu
- **Moment d'historisation :** Une opération n'est enregistrée dans l'historique **qu'après application réussie et définitive** sur le code source. Les modifications de brouillon en cours de saisie ne sont jamais enregistrées.
- **Time-Travel (Navigation) :** Pour afficher ou charger l'état à l'index `N` dans l'historique :
  1. Le moteur parcourt l'historique à l'envers depuis `N` pour trouver le premier enregistrement de type `"snapshot"`. Soit cet index `A`.
  2. Il extrait le `rawText` de ce snapshot.
  3. Il boucle de `A + 1` jusqu'à `N`. Pour chaque étape `i` de type `"replace"`, il ré-applique le remplacement séquentiel en mémoire sur le texte en respectant les paramètres (`findStr`, `replaceStr`, `multiMode`, `multiIndices`, `splitChars`).
  4. Le texte final obtenu devient le code source actif pour l'étape `N`.
- **Rétrocompatibilité :** Non requise à ce stade (simplification).

---

## 2. Parseur Syntaxique & Nommage des Requêtes (`textParser`)

**Statut** : 🟡 En cours

**Description** : Moteur d'analyse bidirectionnel des requêtes d'injection IA, supportant les labels nommés et le mode d'échappement furtif.

### Spécifications Syntaxiques
La syntaxe de base d'une requête est la suivante :
```text
##SYNTAX_COPIE## [LABEL:Correction du bug de boucle] [MULTI:TRUE]
##FIND##
for (let i = 0; i < N; i++)
##REPLACE##
for (let i = 0; i < limit; i++)
##END_COPIE##
```

### Comportement attendu
Le parseur extrait :
1. **`isSyntax` :** Vrai si le texte contient les balises courantes.
2. **`isValid` :** Vrai si la requête comporte exactement une occurrence des 4 balises.
3. **`label` :** Extrait depuis l'option `[LABEL:...]` présente sur la ligne d'en-tête (insensible à la casse, tolère les espaces). Si non renseigné, retourne `null` (ce qui provoquera une désignation séquentielle standard `Opération Zx`).
4. **`multiMode` & `multiIndices` :** Extrait depuis l'option `[MULTI:...]` (ex: `[MULTI:TRUE]`, `[MULTI:FALSE]`, ou `[MULTI:1,3,5]`).
5. **Mode Furtif (`[REQMODIFIER]`) :** Si le texte commence par `[REQMODIFIER]`, les 4 lignes suivantes définissent les nouvelles balises temporaires de substitution.

---

## 3. Éditeur Principal et Gouttière interactive (`CodeEditor`)

**Statut** : 🟡 En cours

**Description** : Zone d'affichage et de contrôle du code principal (`text3`), optimisée pour éliminer 100% du lag de rendu sur les gros fichiers.

### Design & UI/UX
- Utilise la police `Consolas, monospace` avec zoom dynamique géré par **Ctrl + Molette de la souris** ou via les boutons de la barre d'outils.
- **Rendu Mémoïsé à la Ligne :** Le fichier de 8 000 lignes est découpé en un tableau de lignes. Chaque ligne est rendue par un sous-composant React mémoïsé (`React.memo`) :
  ```javascript
  const CodeLine = React.memo(({ number, text, marks, isSelected, onClickLine }) => { ... })
  ```
  Une ligne ne se re-rend **que si** son texte change, que ses marqueurs s'activent/désactivent ou qu'elle entre/sort de la sélection. Cela évite au navigateur de redessiner 8 000 éléments DOM à chaque keystroke, rendant l'édition instantanée.
- **Gouttière (`line-numbers`) :** Synchronisée au pixel près lors du défilement vertical. Elle affiche :
  - Le numéro de ligne.
  - Un repère jaune (●) pour les occurrences trouvées lors de la recherche.
  - Un indicateur orange (▶) pour l'occurrence activement ciblée.
  - Une coloration verte (`gutter-mod`) pour les lignes ayant subi des modifications.

### Comportement & Mode Cadenas (Édition Libre)
- **Le Cadenas (🔒 / 🔓) :** 
  - Lorsque le cadenas est verrouillé (🔒), le code source principal est en lecture seule. Toute modification passe obligatoirement par l'importation d'une requête syntaxique.
  - Lorsque le cadenas est déverrouillé (🔓), l'utilisateur peut taper librement dans l'éditeur.
  - **Verrouillage automatique (Sauvegarde fantôme) :** Dès que le cadenas est reverrouillé, l'état global calcule les différences par rapport à la version verrouillée précédente, crée une **requête fantôme virtuelle** dans l'historique (nommée `[LABEL:Édition Libre]`) pour figer la modification, et recalcule les marqueurs de colorisation DraftSurge pour la nouvelle version.

---

## 4. Smart Debugger Modale (`SmartDebugger`)

**Statut** : 🟡 En cours

**Description** : Panneau de débogage s'ouvrant automatiquement si une requête IA échoue ou s'il y a des recouvrements à corriger.

### Design & UI/UX
- Modale à z-index 1000 prenant 95% de la hauteur de l'écran.
- Divisée en deux colonnes redimensionnables via un **Splitter réutilisable**.
  - **Colonne Gauche :** Requête brute (éditable) ↔ Zones FIND/REPLACE synchronisées via double calque Backdrop/Overlay.
  - **Colonne Droite :** Barre de recherche Live Find avec Lightmap/Heatmap DraftSearch interactive et miroir de prévisualisation du code source.
- Thème premium sombre avec bordures s'allumant en vert émeraude (`#00FF7F`) dès que la requête brute redevient syntaxiquement valide.

### Comportement & Recherche Lightmap/Heatmap DraftSearch
- **Fail-Fast Tokenizer :** Dès qu'une balise est mal orthographiée ou positionnée, le Backdrop de la requête brute souligne en rouge ondulé le premier token en erreur.
- **Recherche Live Lightmap/Heatmap DraftSearch :** 
  - Le champ de recherche de la colonne droite effectue une recherche dynamique.
  - Si la correspondance est parfaite (100%), la ligne est marquée en jaune vif (`hl-yellow`).
  - Si la correspondance est partielle, le moteur calcule la plus longue sous-chaîne commune via une dichotomie rapide et applique une opacité dégradée (Lightmap/Heatmap DraftSearch) du rouge vers l'orange et le jaune selon le pourcentage de similarité (50%, 80%, 100%), permettant à l'utilisateur de localiser instantanément où l'IA a fait une erreur de caractère ou d'indentation dans sa requête.

---

## 5. Tableau d'Historique à 3 Colonnes & Mini-views (`SidebarRight`)

**Statut** : 🟡 En cours

**Description** : Panneau de traçabilité latérale droite affichant l'historique compact et les mini-views AVANT/APRÈS.

### UI/UX de l'Historique
- Tableau réactif doté de 3 colonnes :
  1. **Ver.** (ex: `V1.0.2` - calculée automatiquement selon l'incrément de version).
  2. **Nom de la requête** (Label descriptif extrait ou nom d'action par défaut).
  3. **Heure** (Heure locale au format `HH:MM:SS`).
- La ligne cliquée est surlignée en bleu et déclenche le rejeu de l'historique pour charger la version correspondante dans le code central et dans les mini-views.

### Mini-views AVANT/APRÈS synchronisées
- Deux éditeurs de code miniature affichant le bloc avant la modification et le bloc après la modification.
- **Scroll-Sync (Verrouillable) :** Si l'icône de liaison (🔗) est activée, le défilement horizontal et vertical de la vue AVANT défile identiquement la vue APRÈS, facilitant le contrôle visuel. Cliquer sur 🔓 sépare les défilements.

---

## 6. Critères de Validation Global
- [ ] Zéro lag lors de la saisie libre (Cadenas déverrouillé) sur un fichier de 10 000 lignes.
- [ ] Ingestion de 50 modifications successives sans aucune fuite de mémoire (RAM stable dans l'onglet performance de Chrome/Firefox).
- [ ] Extraction correcte du label `[LABEL:nom]` et affichage instantané dans la colonne centrale de l'historique.
- [ ] Le débogueur de requête s'ouvre proprement et recalcule la heatmap de similarité en moins de 15ms.
