# Spécifications : Zone Centrale — Bandeau Supérieur

**Contexte** : Partie supérieure de la zone centrale (`App.jsx`).

Le bandeau supérieur regroupe le titre dynamique du projet ainsi que la barre d'outils d'actions générales sur le code source du projet.

---

## 1. Agencement Spatial et Dimensions

- **Hauteur totale** : **95 pixels non réductibles** (la hauteur physique du conteneur est figée à 95px).
- **Séparateur horizontal** : Directement au-dessous du bandeau se trouve une ligne de séparation horizontale purement esthétique (couleur `#444444` / `border-b border-border-dark`), d'une épaisseur de 1px.
- **Placement sous-jacent** : Juste en dessous de cette ligne de séparation esthétique se trouve le système d'onglets (décrit dans [zone-centrale-onglets.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/zone-centrale-onglets.md)).

---

## 2. Titre Dynamique du Projet

Le titre est affiché à gauche du bandeau. Il est centré verticalement sur une hauteur de `75px`.

### 2.1 Contenu Textuel
Le titre affiche la chaîne suivante :
`TEXTE SOURCE - [NOM_PROJET] - [VERSION]`
- **NOM_PROJET** : Nom actuel du projet (`store.projectName`). Si aucun nom n'est défini, affiche `SANS_NOM` en rouge vif `#FF4500` et en lettres capitales (classe CSS `uppercase font-mono`).
- **VERSION** : Version courante du projet (`store.currentVersion`), affichée en gros caractères (`text-3xl font-black font-mono`) de couleur jaune `#FFD700`.

### 2.2 Action Associée
- **Double-clic** sur le conteneur du titre : Déclenche l'ouverture de la modale de versions (`VersionTagModal`) directement sur l'onglet **Rename** pour renommer le projet.
- **Survol** : Le titre devient légèrement opaque (`hover:opacity-80`) avec une transition douce et le curseur prend la forme d'un pointeur (`cursor-pointer`).

**Note : Voir les améliorations responsives cibles dans le chapitre 3.**

---

## 3. Barre d'Outils d'Actions (Boutons Clés)

Située à droite du titre, d'une hauteur de `70px`. Elle contient des boutons interactifs dont les couleurs, l'état visuel et le comportement dépendent de la présence de texte dans le projet (`store.currentText`) et de l'état de sauvegarde du projet.

### 3.1 Charte de Couleurs RGB et Liserets (Bordures)

Les boutons de l'interface Rogue Cherry utilisent des classes CSS strictes définissant leur fond (Background) et leur bordure (Liseret) :

*   **Actif Standard (`.btn-active`)** :
    *   Fond : `rgb(45, 45, 45)` (`#2d2d2d`)
    *   Liseret : `rgb(68, 68, 68)` (`#444444`)
*   **Actif avec Incitation (`.btn-active-blue`)** :
    *   Fond : `rgb(45, 45, 45)` (`#2d2d2d`)
    *   Liseret : `rgb(0, 122, 204)` (`#007acc` - Bleu VSCode)
    *   Lueur extérieure : Ombre portée de couleur `rgba(0, 122, 204, 0.3)`
*   **Grisé Cliquable avec Incitation (`.btn-disabled-clickable-blue`)** :
    *   Fond : `rgb(38, 38, 38)` (`#262626`)
    *   Liseret : `rgb(0, 122, 204)` (`#007acc` - Bleu VSCode)
    *   Lueur extérieure : Ombre portée de couleur `rgba(0, 122, 204, 0.3)`
*   **Grisé Non-Cliquable (`.btn-disabled-unclickable`)** :
    *   Fond : `rgb(35, 35, 35)` (`#232323`)
    *   Liseret : Transparent (`border-transparent`)
    *   Comportement : Curseur `not-allowed`, opacité à 80% et attribut HTML `disabled` actif.

---

### 3.2 Comportement d'Affichage des Boutons selon l'État du Projet

| Bouton | Action | État : Projet Vide (`!currentText`) | État : Projet Modifié / Non Sauvegardé ("Dirty") | État : Projet Propre / Sauvegardé ("Clean") |
|---|---|---|---|---|
| **OUVRIR** | Importe un fichier texte local. | **Classe `btn-active-blue`** (Fond `rgb(45, 45, 45)`, Liseret `rgb(0, 122, 204)`) pour inciter à charger un fichier. | **Classe `btn-active`** (Fond `rgb(45, 45, 45)`, Liseret `rgb(68, 68, 68)`). | **Classe `btn-active`** (Fond `rgb(45, 45, 45)`, Liseret `rgb(68, 68, 68)`). |
| **IMPORT** | Colle le texte depuis le presse-papier. | **Classe `btn-active-blue`** (Fond `rgb(45, 45, 45)`, Liseret `rgb(0, 122, 204)`) pour inciter à l'import. | **Classe `btn-active`** (Fond `rgb(45, 45, 45)`, Liseret `rgb(68, 68, 68)`). | **Classe `btn-active`** (Fond `rgb(45, 45, 45)`, Liseret `rgb(68, 68, 68)`). |
| **EXPORT** | Copie le texte source modifié. | **Classe `btn-disabled-unclickable`** (Fond `rgb(35, 35, 35)`, Liseret transparent). Bouton inactif. | **Classe `btn-active`** (Fond `rgb(45, 45, 45)`, Liseret `rgb(68, 68, 68)`) avec opacité 100%. | **Classe `btn-active`** (Fond `rgb(45, 45, 45)`, Liseret `rgb(68, 68, 68)`) mais avec une **opacité réduite à 50%** (`opacity-50`). |
| **SAUVER** | Télécharge le texte source modifié. | **Classe `btn-disabled-unclickable`** (Fond `rgb(35, 35, 35)`, Liseret transparent). Bouton inactif. | **Classe `btn-active`** (Fond `rgb(45, 45, 45)`, Liseret `rgb(68, 68, 68)`) avec opacité 100%. | **Classe `btn-active`** (Fond `rgb(45, 45, 45)`, Liseret `rgb(68, 68, 68)`) mais avec une **opacité réduite à 50%** (`opacity-50`). |
| **UP VER** | Configure les versions / saut de branche. | **Classe `btn-disabled-unclickable`** (Fond `rgb(35, 35, 35)`, Liseret transparent). Bouton inactif. | **Classe `btn-active`** (Fond `rgb(45, 45, 45)`, Liseret `rgb(68, 68, 68)`). | **Classe `btn-active`** (Fond `rgb(45, 45, 45)`, Liseret `rgb(68, 68, 68)`). |
| **Logo Cerises** | Clic simple : Débogueur. <br>Double-clic : À propos. | **Classe `btn-disabled-clickable-blue`** (Fond `rgb(38, 38, 38)`, Liseret `rgb(0, 122, 204)`). <br>Image cerise grisée (`grayscale-[40%] opacity-70`). <br>**Comportement spécial** : Clic simple ET double-clic ouvrent la modale **À Propos** (`SplashScreen`). Le débogueur est inaccessible. | **Classe `btn-active`** (Fond `rgb(45, 45, 45)`, Liseret `rgb(68, 68, 68)`). <br>Image en couleur. <br>**Comportement standard** : Clic simple → Débogueur. <br>Double-clic → À Propos. | **Classe `btn-active`** (Fond `rgb(45, 45, 45)`, Liseret `rgb(68, 68, 68)`). <br>Image en couleur. <br>**Comportement standard** : Clic simple → Débogueur. <br>Double-clic → À Propos. |

---

### 3.3 Améliorations Responsives Cibles (Futur)
Actuellement, ces boutons ont une taille fixe et peuvent empiéter ou passer sous la sidebar droite lorsque celle-ci s'élargit ou que le panneau central rétrécit.
- **Règle de dimensionnement réactif** : Le titre et les boutons occupent environ 1060px en pleine taille. Dès que la largeur utile descend sous 1060px, le titre et les boutons doivent réduire leur échelle progressivement jusqu'à atteindre un minimum de **50% de leur taille initiale**.
- **Titre multi-ligne** : Si la longueur en pixels du titre dépasse environ 500px, le titre doit se répartir sur deux lignes (avec mise à la ligne du numéro de version). Les 70px de hauteur utile du bandeau permettent cette disposition sur deux lignes sans dépassement.

---

## 4. Contrôle de Zoom (Taille de Police)

À l'extrême droite du bandeau, un pavé vertical composé de deux boutons (`+` et `-`) permet d'ajuster rapidement la taille du texte de l'éditeur principal :
- **Bouton `+`** : Augmente la taille de la police (`fontSize`) jusqu'à une limite maximale de **30px**.
- **Bouton `-`** : Diminue la taille de la police jusqu'à une limite minimale de **8px**.
- Raccourci alternatif : `Ctrl + Molette` directement sur la zone de texte de l'éditeur principal produit le même effet (avec une limite haute de **40px**).
