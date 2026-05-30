# Spécifications : Modale Débogueur Intelligent (`SmartDebugger.jsx`)

**Fichier source** : `src/components/SmartDebugger.jsx` (1089 lignes)

Le `SmartDebugger` est l'outil d'analyse le plus lourd de Rogue Cherry. Il s'ouvre lorsqu'une requête IA est imparfaite ou introuvable, permettant à l'utilisateur de corriger la requête via une vue miroir bidirectionnelle.

---

## 1. Déclenchement et Modes d'Ouverture

Le SmartDebugger peut être ouvert de deux manières distinctes :

### A. Ouverture Automatique (Erreur de Parsing)
- Déclenché depuis `App.jsx` lorsque `parseSyntaxRequest()` retourne `isValid = false` après collage d'une requête IA.
- La prop `initialRawText` reçoit le texte brut de la requête défectueuse.
- La prop `sourceText` reçoit le code source actuel du projet pour la fenêtre miroir.

### B. Ouverture Manuelle (Accès d'Urgence)
- Déclenchée via double-clic sur l'icône des deux cerises dans la SidebarLeft (Ajout 11 — Story V8).
- Dans ce mode, `initialRawText` peut être **vide** — le débogueur s'ouvre avec un champ Raw vierge permettant de tester n'importe quelle requête à la volée.

---

## 2. Architecture Visuelle (Splitter Horizontal)

La modale est draggable (via `useDraggable`) et occupe une grande portion de l'écran. Elle est divisée en deux panneaux via un `Splitter.jsx` redimensionnable :

- **Panneau Gauche** (40% de largeur par défaut, `leftWidthPercent`) : Gestion de la requête.
- **Panneau Droit** (60% de largeur) : Miroir du code source avec heatmaps.

La largeur du splitter est persistée en state local (`leftWidthPercent`).

---

## 3. Le Panneau Gauche : Analyse de la Requête

### 3.1 Zone de Requête Brute (Raw Text)
- **Architecture Calques** : Comme les textareas FIND/REPLACE de la sidebar, le champ Raw est constitué d'un calque `textarea` (transparent, éditable) superposé à un `backdrop div` (colorisé, read-only).
- **Coloration Syntaxique "Fail-Fast"** (`renderSyntaxHighlightHtml`) :
  - Balises `START` : fond bleu `bg-primary-blue`
  - Balises `FIND` et `REPLACE` : fond orange `#FF8C00`
  - Balise `END` : fond violet `#9E67BA`
  - La coloration cesse au premier caractère invalide, laissant le reste non coloré (visual fail indicator).
- **Mode Invisibles** : Toggle icône œil active l'affichage des espaces (·), tabulations (→), retours à la ligne (¶) dans le calque backdrop.

### 3.2 Onglets FIND et REPLACE
- Deux onglets permettent de voir/éditer le contenu extrait du parsing.
- **Synchronisation Bidirectionnelle** :
  - Éditer le champ FIND → Reconstruit automatiquement `rawText` complet avec les bons tags via `handleFindChange`.
  - Éditer le champ REPLACE → Idem via `handleReplaceChange`.
  - Les métadonnées (MULTI, SMART, LABEL) sont **préservées** lors de la reconstruction.

### 3.3 Barre de Recherche Complémentaire
- Un champ de recherche indépendant situé dans le panneau gauche permet de tester une chaîne brute dans le miroir, **indépendamment du contenu FIND de la requête**.
- Si ce champ est rempli, il **prend la priorité** sur le contenu FIND pour l'affichage de la heatmap dans le miroir.
- Un bouton "Couper" (✂️) copie le contenu dans le presse-papier ET le colle dans le champ FIND via `handleCopyAndDeleteSearch`, puis vide la barre.
- Un toggle Smart Mode est disponible pour cette barre de recherche.

---

## 4. Le Panneau Droit : Miroir de Source

### 4.1 Modes d'Affichage Selon l'Onglet Actif

| Onglet actif | Affichage miroir |
|---|---|
| **RAW ou FIND** | Heatmap dichotomique (`computeSearchHeatmap`) cherchant le texte FIND dans le code source |
| **REPLACE** (et FIND à 100%) | Rendu de la version *modifiée* du texte (`applyDeltaOnText`), avec diff coloré via `computeLiveDiff` (lignes rouges = supprimé, vertes = ajouté) |

### 4.2 Optimisation par Windowing (Anti-Freeze)
- Le miroir ne rend que les lignes visibles à l'écran + 100 lignes de marge de chaque côté (`mirrorVisibleRange`).
- Lors du scroll, un `onScroll` recalcule `mirrorVisibleRange` avec la formule : `startLine = scrollTop / lineHeight`.
- Le `MirrorLine` est un composant `React.memo` qui ne se re-rend que si son texte ou ses marques changent.
- Cette optimisation est **critique** : sans elle, un fichier de 10 000 lignes causerait un freeze complet de l'UI lors du toggle des invisibles.

### 4.3 Auto-Scroll et Mise en Valeur
- Lorsqu'une occurrence est trouvée (ou que l'index d'occurrence change), un `useEffect` force le scroll du miroir vers la ligne cible via `scrollIntoView`.
- La ligne cible reçoit un `outline-red` + shadow rouge pendant 1500ms (`targetHighlightTimerRef`).
- La gouttière du miroir affiche les mêmes indicateurs `●` (occurrence) et `▶` (occurrence active) que le CodeEditor principal.

---

## 5. L'Échappement de Sécurité (Escape Hatch Anti-Lag)

### 5.1 Condition de Déclenchement
```
isEscapeHatchActive = (
  sourceText.split('\n').length > searchLimits.maxLines
  AND activeSearchText.length < searchLimits.minChars
  AND !forceSearchOverride
)
```

### 5.2 Comportement
- Si actif : La recherche en temps réel est **bloquée**. Aucun calcul de heatmap n'est fait.
- Un bandeau d'alerte rouge s'affiche dans le panneau avec un double-clic pour débloquer.
- Au double-clic, une `MessageBox` propose 3 options :
  1. **Annuler** : Rien ne se passe.
  2. **Éditer les limites** : Ouvre un formulaire numérique pour modifier `maxLines` et `minChars` pour la session.
  3. **Forcer la recherche** : Active `forceSearchOverride = true` → Aucune limite jusqu'au prochain changement de texte.

### 5.3 Valeurs par défaut des limites
- `maxLines = 500` (lignes maximales dans le document source)
- `minChars = 3` (longueur minimale de la chaîne de recherche)
- Ces valeurs sont partagées avec la SidebarLeft et la recherche globale du CodeEditor.

---

## 6. Validation et Application

- **Bouton Valider** : Actif uniquement si `parsedRequest.isValid === true` ET `searchResult.foundRatio === 1`.
- **Bouton Copier & Fermer** (`onAcceptAndCopy`) : Copie la requête brute corrigée dans le presse-papier et ferme la modale. L'utilisateur peut ensuite recoller dans l'interface principale.
- **Bouton Appliquer** (`onApply`) : Injecte directement la requête corrigée dans le flux principal de l'application, la faisant entrer dans le cycle `parseSyntaxRequest → handleSearch → handleReplace`.

---

## 7. Heatmap Colorimétrique (Classes CSS)

Le ratio de correspondance dichotomique produit les classes CSS suivantes sur les lignes du miroir :

| Ratio | Classe | Couleur |
|---|---|---|
| 100% | `hl-yellow` | Jaune vif (correspondance parfaite) |
| ≥ 80% | `hl-find-80` | Jaune/Orange |
| ≥ 50% | `hl-find-50` | Orange |
| < 50% | `hl-find-10` | Rouge |

La gouttière utilise la couleur dominante du fond pour teinter l'indicateur `●`.
