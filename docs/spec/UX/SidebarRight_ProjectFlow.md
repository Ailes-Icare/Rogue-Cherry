# Spécifications : Flux de Projet & Historique (`SidebarRight.jsx`)

**Contexte** : Colonne de droite (`SidebarRight.jsx`).

Cette zone gouverne le cycle de vie complet du projet : gestion de fichiers, Time-Travel, sauvegardes, miniatures AVANT/APRÈS, et ramification de versions.

---

## 1. Bandeau Supérieur "Gestion de Projet" (Story 8.7 — V8)

Situé en haut à droite, composé de deux blocs distincts visuellement :

### 1.1 Cadre Bleu "Gestion de Projet"
- Fond bleu VSCode (`#007acc`), occupe environ 75% de la largeur du bandeau.
- Titre "Gestion\nde projet" à gauche (vertical centré).
- Zone intérieure fond sombre (`#1e1e1e`) contenant 3 boutons :

| Bouton | Icône | Condition d'activation | Action |
|---|---|---|---|
| **Ouvrir** | 📂 | Toujours actif si aucun projet n'est ouvert (`isProjectEmpty = true`) | Importe un fichier JSON de projet Rogue Cherry |
| **Sauvegarder** | 💾 | Actif uniquement si `isProjectDirty = true` | Sauvegarde l'historique complet en JSON |
| **Fermer** | ❌ | Actif si `!isProjectEmpty` | Ferme le projet actuel, retourne au SplashScreen |

### 1.2 Bouton RESET (Séparé)
- Fond rouge (`bg-cherry-red`), occupe environ 25% de la largeur.
- Responsive : adapte son affichage selon la largeur disponible (`resetBtnWidth`) via `ResizeObserver` :
  - `>= 100px` : Texte "RESET" + icône 🔄
  - `>= 70px` : Texte + icône réduits proportionnellement
  - `>= 50px` : Icône seule + "RESET" dessous
  - `< 50px` : Icône seule (version minimale)
- **Effet** : Réinitialisation **totale** de l'application. Vide l'historique, le code source, et le nom du projet. Demande confirmation via `MessageBox`.
- Désactivé (`opacity-30`) si `isProjectEmpty`.

### 1.3 Indicateur de Taille JSON
- Si `projectSizeBytes > 0`, affiche sous le bandeau : `"Taille export JSON : X Ko"` en texte gris 10px.
- Format conditionnel : octets si < 1024, Ko si < 1 Mo, Mo sinon.

---

## 2. Logique "Dirty" (État de Sauvegarde)

- `isProjectDirty` est calculé dans `App.jsx` en comparant l'index du dernier snapshot `isSaved === true` avec l'index actuel.
- Si `selectedIndex > dernierIndexSauvegardé` → `isProjectDirty = true`.
- Conséquences UX :
  - Bouton 💾 devient actif (vert `btn-active`).
  - Potentiellement : titre du projet avec un astérisque ou indicateur visuel.

---

## 3. La Pile d'Historique (Time-Travel)

### 3.1 Tableau à 5 Colonnes
Les colonnes du tableau sont : **Ver.** | **Label** | **Commentaire** | **Source** | **Heure**

### 3.2 Comportements par Ligne
- **Clic** sur un enregistrement → `onSelectIndex(index)` → `rebuildTextAt` est appelé → CodeEditor se met à jour.
- **Items `info`** : Grisés, en italique, **non-cliquables** (protégés par `if (!isInfo) onSelectIndex(index)`).
- **Ligne sélectionnée** : Fond `#37373d`, bordure bleue à gauche, texte blanc gras.
- **Lignes `isSaved`** : Texte en bleu clair `#87cefa` sur toutes les colonnes.

### 3.3 Micro-Actions sur Ligne Sélectionnée
Apparaissent uniquement sur la ligne active (hors snapshots et info) :
- **✏️** → Ouvre `EditRecordModal` pour modifier label/commentaire.
- **🎯** → Scroll le CodeEditor vers la ligne modifiée (`onGoToRecord`).

### 3.4 Badge Multi/Smart dans l'En-Tête Commentaire
Sous le tableau (dans la zone de commentaire), si l'enregistrement actif possède :
- `multiMode = true` + `multiIndices` → Badge violet `CHERRY-PICK [1, 3]` (affiché en Base-1 pour l'humain).
- `ignoreSpaces = true` → Badge bleu `SMART`.

---

## 4. Boutons de Navigation et d'Actions

Situés dans une barre de boutons sous la zone de commentaire (hauteur `h-12`) :

| Bouton | Condition | Action |
|---|---|---|
| **◀ Préc.** | `selectedIndex > 0` | `onSelectIndex(selectedIndex - 1)` |
| **Suiv. ▶** | `selectedIndex < history.length - 1` | `onSelectIndex(selectedIndex + 1)` |
| **New Branch** | `selectedIndex < history.length - 1` | Ouvre `VersionTagModal` en mode `branch` |
| **📋** | Enregistrement `replace` | Copie la requête brute dans le presse-papier |
| **⚙️↩️** | Enregistrement `replace` | Génère une requête d'annulation inverse (Smart Undo) |
| **🗜️** | `selectedIndex > 0` | Ouvre la confirmation de compression d'historique |
| **🗑️** | `selectedIndex === history.length - 1` | Supprime le dernier item (après confirmation) |

### Bouton "New Branch" — Responsive
Adapte son affichage via `ResizeObserver` (même logique que RESET) :
- `>= 170px` : "New Branch" + icône SVG de branche
- `>= 110px` : Texte + icône réduits
- `>= 85px` : "New\nBranch" + icône
- `< 40px` : Icône SVG seule

---

## 5. Mini-Views AVANT / APRÈS

### 5.1 Affichage Conditionnel
- Le toggle "Afficher/Masquer ▼▲" contrôle `showMiniViews`.
- Un `Splitter` redimensionnable permet d'ajuster la hauteur du tableau d'historique vs les mini-views.

### 5.2 Contenu selon le Type d'Enregistrement

| Type | Mini-View AVANT | Mini-View APRÈS |
|---|---|---|
| `none` (aucune sélection) | "Aucune sélection" grisé | "Aucune sélection" grisé |
| `snapshot` | "--- SNAPSHOT DE DÉPART ---" rouge | Aperçu tronqué du texte source (300 premiers caractères) |
| `replace` | Texte FIND colorisé (marques `marksT1`) | Texte REPLACE colorisé (marques `marksT2`) |

### 5.3 Scroll Synchronisé
- Toggle 🔗/🔓 (`isSyncScroll`) active ou désactive la synchronisation scroll entre les deux mini-views.
- Implémenté via un `useEffect` ajoutant des listeners `scroll` et un `isSyncingRef` anti-boucle infinie.
- Le zoom (via `useZoomable`) est indépendant entre les deux vues.

---

## 6. Règles de Redimensionnement (Responsive)

La SidebarRight elle-même est redimensionnable horizontalement via un composant `Splitter` latéral géré par `App.jsx` :
- Largeur minimale : `280px` (`min-w-[280px]`).
- Largeur transmise via la prop `width` et appliquée via `style={{ width: '${width}px' }}`.
- Le bandeau "Gestion de Projet" et le bouton RESET **ne se cassent jamais** grâce aux adaptations responsive.
