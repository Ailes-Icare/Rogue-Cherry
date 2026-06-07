# 🔍 Rapport d'Audit de Non-Conformité — Version V8

**Date de l'audit** : 5 juin 2026  
**Périmètre** : Version V8 (Consolidation et Finalisation avant la V9)  
**Objectif** : Identifier les régressions issues de la pré-refactorisation V9 et dresser l'état de conformité par rapport aux spécifications définies dans `docs/spec/`.

---

## 📊 Résumé de Conformité

- **Composants / Modules cibles** : 5
- **🟢 Conformes** : 1 (Fichiers d'accompagnement & Utilitaires)
- **⚠️ Partiels (Comportements altérés ou régressions mineures)** : 2 (SidebarLeft, SmartDebugger)
- **❌ Non conformes (Régressions majeures de performance ou de logique)** : 2 (SidebarRight, CodeEditor)

---

## ❌ Non-Conformités Majeures (Régressions Bloquantes)

### 1. [SidebarRight.jsx](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/src/components/SidebarRight.jsx) — Défilement synchrone des mini-views (Scroll-Sync) brisé
*   **Statut specs** : 🟢 Implémenté | **Code** : ❌ Non conforme
*   **Problème** : Dans [SidebarRight.jsx](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/src/components/SidebarRight.jsx#L90-L91), `beforeScrollRef` et `afterScrollRef` sont instanciés avec le hook `useZoomable(10)`. Or, `useZoomable` retourne une fonction callback ref (`callbackRef`) et non un objet standard avec une propriété `.current`. L'accès subséquent à `beforeScrollRef.current` et `afterScrollRef.current` à la ligne 124-125 renvoie `undefined`. L'écouteur de scroll n'est jamais attaché, rendant la synchronisation de défilement bidirectionnelle (🔗) inopérante.
*   **Impact** : Le défilement synchronisé entre la vue "AVANT" et "APRÈS" dans la Sidebar Droite est inutilisable.
*   **Action corrective** : Modifier `useZoomable.js` pour que la fonction retournée possède également une propriété `.current` assignée dynamiquement lors de l'appel du callback, ou adapter le composant pour capturer les nœuds DOM.

### 2. [CodeEditor.jsx](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/src/components/CodeEditor.jsx) — Virtualisation des lignes absente en Mode Lecture Seule (Lag de rendu)
*   **Statut specs** : 🟢 Implémenté | **Code** : ❌ Non conforme
*   **Problème** : La virtualisation de l'affichage (`visibleRange`) n'est pas appliquée lors du rendu du tableau `lineRecords` en mode lecture seule. Toutes les lignes (par exemple, 50 000 lignes) sont injectées simultanément dans le DOM à la ligne 937. Seul le rendu des caractères invisibles est restreint à la zone visible. De plus, `onScroll` à la ligne 809 ne recalcule `visibleRange` que si `showInvisibles` est activé, et ré-exécute le re-rendu de manière sous-optimale.
*   **Impact** : Ralentissement et gel immédiat du navigateur lors du chargement de fichiers de taille moyenne à grande en mode lecture seule.
*   **Action corrective** : Appliquer la virtualisation stricte au niveau du conteneur en mode lecture seule : ne mapper que `lineRecords.slice(visibleRange[0], visibleRange[1] + 1)` et insérer des éléments de rembourrage (`paddingTop` et `paddingBottom`) calculés d'après la hauteur de ligne (`1.5 * fontSize`) pour conserver la scrollbar native.

---

## ⚠️ Non-Conformités Modérées (Comportements & Raccourcis)

### 3. [CodeEditor.jsx](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/src/components/CodeEditor.jsx) — Durée et lifetime du liseret rouge de Recherche Globale
*   **Statut specs** : 🟢 Implémenté | **Code** : ⚠️ Partiel
*   **Problème** : Le liseret rouge (30 secondes) de ciblage d'occurrence de la recherche globale (`targetHighlightLine`) est immédiatement réinitialisé à `null` lorsque le texte de recherche est effacé (`!globalSearchBarText`). La spécification ([CodeEditor.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/CodeEditor.md#L97)) dicte que ce liseret de ciblage doit persister 30 secondes même après fermeture, effacement ou masquage de la recherche globale afin de garder le repère visuel.
*   **Impact** : Effacer la barre de recherche globale fait disparaître prématurément le repère visuel sur la ligne trouvée.
*   **Action corrective** : Modifier le `useEffect` d'écoute de la recherche globale pour ne pas vider `targetHighlightLine` si la recherche est effacée.

### 4. [useZoomable.js](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/src/hooks/useZoomable.js) — Raccourci clavier de réinitialisation `Ctrl+0` manquant
*   **Statut specs** : 🟢 Implémenté | **Code** : ⚠️ Partiel
*   **Problème** : Le raccourci clavier `Ctrl+0` permettant de réinitialiser la taille de police des zones zoomables à **14 px** (par défaut) n'est implémenté ni dans `useZoomable.js` ni dans les formulaires de saisie de la Sidebar gauche ([sidebar-left-bottom-inputs.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/sidebar-left-bottom-inputs.md#L131)).
*   **Impact** : Impossibilité pour l'utilisateur de réinitialiser rapidement le zoom des zones de texte à la taille standard.
*   **Action corrective** : Ajouter un écouteur d'événement `keydown` global dans le hook `useZoomable.js` interceptant `Ctrl+0` et réinitialisant la propriété CSS `--zoom-size` à `initialSize`.

### 5. [SidebarLeft.jsx](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/src/components/SidebarLeft.jsx) — Comportement responsif (Collapse) de la Barre Basse manquant
*   **Statut specs** : 🟢 Implémenté | **Code** : ⚠️ Partiel
*   **Problème** : Les labels textuels « Moteur strict (LCS fin) » et « Multi-emplacement (N trouvés) » ne se masquent pas de manière réactive si la largeur de la sidebar gauche (`width`) est réduite. De plus, il manque le tooltip (attribut `title`) explicatif du bouton STRICT.
*   **Impact** : Encombrement visuel et rognage lorsque le panneau de Cherry-Picking est actif et que la sidebar est à sa largeur minimale (280px).
*   **Action corrective** : Utiliser la prop `width` dans `SidebarLeft.jsx` pour masquer dynamiquement les labels textuels (par exemple lorsque la largeur est < 340px) et rajouter un tooltip explicatif complet au bouton STRICT.

### 6. [SmartDebugger.jsx](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/src/components/SmartDebugger.jsx) — Calcul de windowing miroir défectueux
*   **Statut specs** : 🟢 Implémenté | **Code** : ⚠️ Partiel
*   **Problème** : Le `useEffect` chargé du calcul du windowing d'invisibles pour le miroir ([SmartDebugger.jsx:L240](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/src/components/SmartDebugger.jsx#L240)) fait la vérification `if (showMirrorInvisibles && zoomRefMirror.current)`. Puisque `zoomRefMirror` est une fonction callback, `.current` est `undefined`, ce qui désactive de fait le calcul dynamique de la plage de visibilité.
*   **Impact** : Pas de recalcul ni de limitation optimisée de l'affichage des invisibles dans le miroir de débogage.
*   **Action corrective** : Même résolution que la Non-Conformité n°1 (exposition de `.current` sur le callback ref).

---

## 🔍 Vérifications Techniques Supplémentaires (Anti-patterns & Lints)

1.  **Utilisation de CSS Inline (`style={{...}}`)** :
    *   L'utilisation de styles dynamiques pour la taille de police et la largeur des panneaux (`width`, `--zoom-size`) est conforme aux exceptions spécifiées pour les variables impossibles à prévoir via Tailwind.
2.  **Manipulation directe du DOM** :
    *   Le composant `SidebarLeft` utilise `window._editorBackdropRef` pour synchroniser le scroll de l'éditeur en édition libre (cadenas ouvert). Cela contourne temporairement l'arborescence React standard mais fonctionne. Aucune autre manipulation sauvage (comme `document.getElementById` pour des modifications structurelles) n'a été détectée.
3.  **Gestion d'erreur de la console** :
    *   Les avertissements concernant des callbacks refs non résolus ou des tentatives d'écritures asynchrones de scroll se résoudront avec la correction du Scroll-Sync.

---

## 📋 Plan de Consolidation V8 proposé

1.  **Phase 1 : Correction du noyau d'interaction (useZoomable.js)**
    *   Modifier `useZoomable.js` pour ajouter la propriété `.current` sur la fonction retournée.
    *   Ajouter l'écouteur d'événement clavier `keydown` pour supporter le reset `Ctrl+0`.
2.  **Phase 2 : Restauration de la Virtualisation (CodeEditor.jsx)**
    *   Mettre en place la découpe physique de `lineRecords` à l'aide de `visibleRange`.
    *   Ajouter les zones de compensation `paddingTop` et `paddingBottom` dans le conteneur du Mode Lecture Seule.
    *   Optimiser le déclencheur `onScroll` pour qu'il s'exécute de façon inconditionnelle.
3.  **Phase 3 : Ajustements fins et comportement responsif (SidebarLeft, SidebarRight, CodeEditor)**
    *   Ajuster le timer de surbrillance rouge de la recherche globale.
    *   Mettre en place le collapse conditionnel des labels STRICT/MULTI dans la Sidebar Gauche.
    *   Ajouter les tooltips explicatifs.
