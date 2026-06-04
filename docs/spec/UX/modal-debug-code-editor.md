# Spécifications : Modale Débogueur — Contrôleur de l'Éditeur Miroir

**Contexte** : Colonne de droite du Débogueur (`SmartDebugger.jsx` agissant sur la zone miroir).

Ce document spécifie le comportement logique, l'optimisation d'affichage et l'interactivité de la zone miroir de prévisualisation du code source située à droite de la modale de débogage.

---

## 1. Rendu de Prévisualisation et Diffing

Le miroir affiche dynamiquement le texte source du projet selon les conditions suivantes :
-   **Si l'onglet RAW ou FIND est actif** : Le miroir affiche le texte source original (`sourceText`). Les occurrences du texte FIND y sont colorées selon les règles de heatmap.
-   **Si l'onglet REPLACE est actif** (et que la correspondance FIND est de 100%) : Le miroir affiche le texte *virtuellement modifié* (`applyDeltaOnText`). Le moteur applique alors un calcul de diffing live (`computeLiveDiff`) qui colorise :
    *   Les lignes insérées en rose/magenta (classe `.hl-ins`).
    *   Les lignes modifiées en violet sombre (classe `.hl-line-mod`) avec les mots modifiés mis en valeur en violet vif (classe `.hl-word-mod`).
    *   Les suppressions via des indicateurs `[✖]` (classe `.hl-del`) ou du texte barré (`.hl-del-txt`).

---

## 2. Windowing Visuel de la Zone Miroir (Anti-Freeze)

Pour éviter les freezes de l'application lors du chargement de gros fichiers (supérieurs à 1 000 lignes) ou lors de la modification en direct de la requête brute, la zone miroir applique une virtualisation stricte :
-   **Calcul de la plage visible** (`mirrorVisibleRange`) : Un écouteur sur le conteneur du miroir recalcule à chaque défilement les lignes qui doivent être montées dans le DOM :
    ```js
    const lineHeight = 1.625 * fontSize;
    const startLine = Math.floor(scrollTop / lineHeight);
    const endLine = Math.floor((scrollTop + clientHeight) / lineHeight);
    setMirrorVisibleRange([startLine - 100, endLine + 100]); // Fenêtre + marge de 100 lignes
    ```
-   **Mémoïsation (`MirrorLine`)** : Chaque ligne de code est rendue par un composant `MirrorLine` mémoïsé (`React.memo`) qui ne se re-rend que si son texte, ses marques de surbrillance ou son état de ciblage change.

---

## 3. Auto-Scroll et Mise en Valeur de l'Occurrence Cible

-   **Centrage automatique** : À chaque changement d'occurrence active (changement de `searchOccIndex` ou de la liste des marques de recherche), un effet force le défilement fluide du miroir pour placer la ligne contenant l'occurrence au centre de la zone visible (`scrollIntoView({ behavior: 'smooth', block: 'center' })`).
-   **Liseret de ciblage** : La ligne cible reçoit instantanément un contour rouge (`outline-red`) et une lueur rouge pendant **1500ms**. Ce délai est géré par un timer d'auto-effacement (`targetHighlightTimerRef`).

---

## 4. Gouttière des Numéros de Ligne du Miroir

La gouttière de gauche affiche les numéros de ligne absolus du code et intègre les marqueurs visuels de recherche :
-   **`▶`** (carré bleu) : Indique l'emplacement de l'occurrence **active** ciblée par la navigation.
-   **`●`** (point coloré) : Indique l'emplacement d'une occurrence **non active**. La couleur du point s'aligne sur celle de la heatmap (jaune, or, orange, rouge).
-   **Mise à l'échelle (Zoom synchrone)** : La gouttière de numérotation hérite de la taille de police active du miroir (variable CSS `--zoom-size` gérée de **8 px** à **40 px** via `Ctrl + Molette`). Elle zoom et dézoome de manière synchrone avec le code pour garantir l'alignement vertical strict et la lisibilité.

