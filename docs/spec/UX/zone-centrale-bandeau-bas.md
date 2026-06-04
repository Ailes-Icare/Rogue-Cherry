# Spécifications : Zone Centrale — Bandeau Bas (Barre de Statut)

**Contexte** : Partie inférieure du composant `CodeEditor.jsx`.

La barre de statut est un bandeau horizontal de couleur bleue VSCode (`#007acc`) qui fournit des indicateurs d'état en temps réel et permet d'activer des modes d'affichage ou d'édition.

---

## 1. Agencement Visuel et Styles

- **Couleur de fond** : `#007acc` (Bleu VSCode).
- **Couleur du texte** : Blanc (`text-white`), taille de police de `12px` (classe CSS `text-xs font-bold font-sans`).
- **Comportement de curseur** : Curseur pointeur (`cursor-pointer`) sur l'ensemble de la barre.
- **Double-clic** : Double-cliquer sur la barre de statut ouvre la modale `LineChoiceModal` en positionnant le dialogue directement au-dessus pour naviguer rapidement vers une ligne spécifique (saut de ligne). La ligne pré-remplie par défaut dans le dialogue correspond à la ligne actuellement visible au milieu de l'écran.

---

## 2. Section Gauche : Indicateurs et Contrôles de Mode

### 2.1 Mode Lecture Seule (État par défaut)
- Affiche l'icône de cadenas fermé : **🔒** (bouton cliquable avec infobulle "Déverrouiller l'édition libre du texte source").
- Affiche la mention : `👁️ MODE LECTURE SEULE` en gris clair `#d4d4d4` avec espacement des lettres (`tracking-wider`).

### 2.2 Mode Édition Libre
- Affiche la mention : `✏️ MODE ÉDITION LIBRE` en jaune vif `#FFD700` (`tracking-wider`).
- Affiche le bouton **ENREGISTRER** :
  - Style : Fond rouge cerise (`bg-cherry-red`), texte blanc, animation de pulsation (`animate-pulse`).
  - Rôle : Valider et enregistrer les modifications dans l'historique et reverrouiller l'édition.
- Affiche le bouton **Annuler** :
  - Style : Fond sombre translucide (`bg-black/20 hover:bg-black/40`), texte blanc.
  - Rôle : Rejeter les modifications et reverrouiller l'éditeur sans modifier le texte source.

### 2.3 Texte Contextuel d'Information (`statusBarInfo`)
Affiché à droite de la mention du mode, séparé par un liseret vertical translucide. Exemples d'affichage :
- En mode normal : `Mode Normal` (ou masqué).
- Pendant la navigation d'occurrences : `Occurrence X/Y (MULTIPLE)` ou `Occurrence X/Y (UNIQUE)`.
- Pendant la recherche globale : `Recherche globale : X% de correspondance | Y fragment(s)`.

---

## 3. Section Droite : Statistiques et Réglages Visuels

Elle regroupe des compteurs textuels et le contrôle d'affichage des caractères spéciaux.

- **Compteur de Lignes** : Affiche `X Lignes`.
- **Compteur de Caractères** : Affiche `Y Caractères`.
- **Indicateur d'Encodage** : Affiche `UTF-8` de manière statique.
- **Toggle Invisibles (Icône Œil)** :
  - Bouton interactif qui active/désactive le mode d'affichage des caractères invisibles (`showInvisibles`).
  - Affiche l'icône `EyeIcon`.
  - Au survol : fond sombre translucide (`hover:bg-black/20`).
  - Infobulle : "Affiche ou cache les caractères invisibles dans le texte principal".
