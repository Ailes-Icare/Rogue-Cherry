# RULE STORY V8 — Labels et Historique de Version

## Contexte
Le système de labellisation de l'historique a été refondu lors des sessions V8 pour fournir des labels courts et lisibles dans la colonne "Action" du panneau latéral droit, avec les détails relégués dans la colonne "Commentaire".

## Convention MANDATORY des labels

| Action utilisateur | Label (colonne Action) | Commentaire (colonne Commentaire) |
|---|---|---|
| Incrémentation de version | `CHG VER` | `Changement de version (vX.Y.Z -> vA.B.C)` |
| Incrémentation + Save | `CHG VER + Save` | idem |
| Renommage du projet | `CHGNAME` | `Changement du nom — AncienNom vers NouveauNom` |
| Renommage + Save | `CHGNAME + Save` | idem |
| Création de branche | `Nouvelle Branche` | `Nouvelle Branche à partir de vX.Y.Z` |
| Création de branche + Save | `BRANCHE + Save` | idem |
| Import initial (FileInit) | `file init` ou `import init` | `Init projet — Initialisation du projet : NomDuProjet` |

## Propriété `isSaved`
- Lorsque l'utilisateur coche "Figer l'archive (Save)" dans la modale, le record historique reçoit `isSaved: true`.
- Dans le panneau latéral droit (SidebarRight), les colonnes Version, Action et Commentaire d'un record `isSaved: true` sont affichées en **bleu clair (#87cefa)** pour ressortir visuellement.

## Type de record pour les actions de modale
- Toute action de la modale de version (incrément, renommage, branche) génère un **Snapshot** dans l'historique.
- Un Snapshot duplique le texte brut complet à cet instant : c'est un point d'ancrage solide depuis lequel on peut restaurer ou brancher.

## Fichiers sources
- `src/hooks/useHistoryStore.js` — fonctions `pushSnapshot` et `createNewBranch`
- `src/components/SidebarRight.jsx` — rendu conditionnel des couleurs sur `rec.isSaved`
- `src/App.jsx` — câblage des callbacks `onForceIncrement`, `onRename`, `onBranchReset`, `onBranchFromParent`

## Règle
> **Chaque action de la modale de version produit un Snapshot avec un label court et un commentaire explicatif. Le suffixe "+ Save" et la coloration bleu clair sont réservés aux records dont l'utilisateur a explicitement coché "Figer l'archive".**
