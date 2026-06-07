# Rapport de Bug : Écrasement Asynchrone du Scroll (Multistack & Historique)

**Statut :** Résolu 🟢
**Composants impactés :** `App.jsx`, `CodeEditor.jsx`
**Difficulté :** Élevée (Race condition / conflit de cycles React)

## Symptômes Observés
1. Lors de l'application d'une pile Multistack ("Appliquer Pile"), le texte source ne scrollait pas pour suivre l'élément en cours de modification.
2. Lors du clic sur un élément dans l'historique des versions (Sidebar droite), le texte source ne scrollait pas jusqu'à la modification.
3. Aléatoirement, le texte scrollait de lui-même tout en haut du fichier (scrollTop: 0), après quoi le bug se figeait et la position ne bougeait plus du tout.
4. Étrangement, le clic manuel sur un élément de la file d'attente Multistack (Sidebar gauche) fonctionnait parfaitement et déclenchait bien le scroll.

## Cause Racine (Root Cause)
Le problème ne venait pas des fonctions de calcul de la cible de scroll (`handleGoToRecordForIndex` ou le scroll de `loadRequestIntoUI`), qui calculaient les bons offsets et les transmettaient correctement au composant `CodeEditor`.

La cause profonde résidait dans un **conflit de `useEffect` au sein de `CodeEditor.jsx`**.

Dans `CodeEditor.jsx`, il existe une fonctionnalité qui permet de mémoriser la position de scroll lorsque l'utilisateur bascule en "mode édition libre" (en cliquant sur l'icône du cadenas), afin de restaurer cette position lorsqu'il referme le cadenas.

Ce code de restauration était structuré ainsi :
```javascript
useEffect(() => {
  if (isEditable) {
    // ... code de ciblage pour le textarea ...
  } else {
    setTimeout(() => {
      if (editorWrapperRef.current) {
        editorWrapperRef.current.scrollTop = savedScrollRef.current;
      }
    }, 0);
  }
}, [isEditable, fontSize, text]);
```

### Le mécanisme destructeur
Le problème majeur était la dépendance au paramètre `text`. À chaque fois que le texte source était modifié (par exemple, à chaque étape du Multistack qui appelle `store.pushReplace()`), ce `useEffect` se redéclenchait.

Puisque le mode édition est généralement inactif (`isEditable` = `false`), la branche `else` s'exécutait et lançait un `setTimeout(0)`.

Ce `setTimeout(0)` est **asynchrone**. Il s'exécutait une fraction de seconde *après* les `useEffect` légitimes chargés de faire le smooth scroll vers les occurrences modifiées. Ce comportement écrasait brutalement (override) le smooth scroll en forçant le `scrollTop` à reprendre la valeur mémorisée par `savedScrollRef.current` (qui valait `0` par défaut).

- Le clic manuel fonctionnait car il modifiait la recherche mais **ne modifiait pas le texte source**, empêchant ce `useEffect` destructeur de se déclencher.

## Résolution
La résolution a consisté à isoler la logique de restauration du scroll lié au mode édition pour qu'elle ne se déclenche **uniquement** lors d'un vrai basculement de l'état `isEditable`.

Modification dans `CodeEditor.jsx` :
```javascript
const prevIsEditableRef = useRef(isEditable);

useEffect(() => {
  // Ne restaurer le scroll que lors d'un vrai basculement du mode édition
  if (prevIsEditableRef.current === isEditable) {
    return;
  }
  prevIsEditableRef.current = isEditable;

  // ... suite du code (setTimeout, etc.) ...
}, [isEditable, fontSize, text]);
```

Grâce à `prevIsEditableRef`, l'effet ignore désormais les déclenchements causés par de simples changements de texte ou de taille de police, laissant le champ libre aux mécanismes de ciblage (smooth scroll) du Multistack et de l'Historique. De plus, le résidu `skipHistoryScrollRef` devenu inutile dans `App.jsx` a été entièrement nettoyé.
