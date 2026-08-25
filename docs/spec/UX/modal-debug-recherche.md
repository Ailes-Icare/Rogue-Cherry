# Spécifications : Modale Débogueur — Contrôleur de Saisie et de Recherche

**Contexte** : Colonne de gauche et contrôles de recherche du Débogueur (`SmartDebugger.jsx`).

Ce document spécifie le comportement logique de l'analyseur syntaxique, de la synchronisation bidirectionnelle, et de la barre de recherche intégrée à la modale de débogage.

---

## 1. Synchronisation Bidirectionnelle de la Requête

Le panneau de gauche assure une mise à jour croisée en temps réel entre la Requête Brute (Raw) et ses extraits (FIND / REPLACE) :

### 1.1 Édition de la Requête Brute
-   Toute modification du texte dans le calque d'écriture est décodée par `parseSyntaxRequest`.
-   Si le parsing est valide, les champs des onglets **FIND** et **REPLACE** sont repeuplés.
-   Si le parsing échoue, un message d'erreur rouge explicite s'affiche décrivant la cause de l'erreur de syntaxe (ex: balises fermantes manquantes).

### 1.2 Édition des Onglets Décodes
-   **Édition dans l'onglet FIND** : Déclenche `handleFindChange` qui reconstruit la chaîne `rawText` brute en y insérant la nouvelle valeur entre les balises de recherche, tout en préservant le label, le mode Smart, les index multiples et le commentaire.
-   **Édition dans l'onglet REPLACE** : Déclenche `handleReplaceChange` qui opère de la même manière pour insérer la nouvelle valeur dans la section de remplacement du brut.
-   **Bouton SMART** : Modifier le Smart Mode de la requête (bouton 💡) met à jour l'en-tête de la requête brute en écrivant `[SMART:TRUE]` ou `[SMART:FALSE]`.

---

## 2. Barre de Recherche Complémentaire

Une barre de recherche indépendante est placée en haut du panneau droit (miroir) :
-   **Indépendance** : Elle permet de tester une chaîne de caractères dans le miroir sans modifier le champ FIND de la requête en cours d'analyse.
-   **Priorité visuelle** : Si cette barre est remplie, sa chaîne est prioritaire et remplace le texte de la requête pour la génération de la heatmap à l'écran.
-   **Bouton Copier (📋)** : Copie le texte de cette barre dans le presse-papier, l'injecte dans le champ FIND de la requête brute (remplaçant l'ancien), et vide la barre.

---

## 3. Configuration de l'Échappement de Sécurité (Escape Hatch)

La modale utilise le concept d'échappement de sécurité (voir [recherche.md](recherche.md)) avec une interface utilisateur dédiée :

-   **Alerte** : Un bandeau d'alerte rouge clignotant s'affiche en cas de dépassement des limites (recherche trop courte sur document trop grand).
-   **Dialogue d'outrepassation (Double-clic)** : Double-cliquer sur l'alerte ouvre une boîte de dialogue proposant 3 options :
    1.  **Annuler** : La sécurité reste active, les calculs restent bloqués.
    2.  **Éditer les limites** : Ouvre un formulaire de saisie pour modifier temporairement (durant la session) les valeurs de `maxLines` et `minChars`.
    3.  **Forcer la recherche** : Force le calcul de la heatmap malgré le risque de lag en activant le flag `forceSearchOverride`.

---

## 4. Actions de Validation et Fermeture

Deux boutons d'action sont situés en bas du panneau gauche :
-   **APPLIQUER** : Actif uniquement si la requête est syntaxiquement valide ET que le taux de conformité (similarité) est de 100%. Il applique directement le remplacement sur le texte principal de l'application et ajoute la modification dans l'historique global de Rogue Cherry avant de fermer la modale.
-   **ACCEPTER & COPIER** : Ferme la modale en chargeant les champs FIND/REPLACE de la SidebarLeft avec les valeurs corrigées, sans appliquer le remplacement immédiatement. L'utilisateur peut ainsi procéder à des vérifications ou des modifications manuelles supplémentaires.

---

## 5. Fonctionnalités de Zoom Interactif (Ctrl + Molette)

Pour assurer une lecture confortable des requêtes complexes, chaque conteneur de texte du panneau gauche ainsi que la recherche globale disposent de leur propre zoom :
-   **Requête Brute, FIND et REPLACE décodés** : Zoom indépendant sur chaque champ (borné de **8 px** à **40 px**, par défaut à **14 px**).
    -   Le zoom s'applique simultanément au calque de fond (coloration syntaxique et caractères cachés) et à la zone de saisie pour préserver leur superposition absolue.
-   **Barre de Recherche Globale (Multiline)** : En mode multiline, le champ de recherche s'étire et possède un zoom indépendant (`searchFontSize` de **8 px** à **40 px**). Sa gouttière de numéros de ligne multiline s'ajuste dynamiquement à la même taille pour assurer le défilement et l'alignement visuel.

