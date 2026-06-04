# Spécifications : Zone Centrale — Bandeau de Recherche (DraftSearch)

**Contexte** : Partie supérieure du composant `CodeEditor.jsx`, situé sous la barre d'onglets (à implémenter) et directement au-dessus de la zone de texte principale.

---

## 1. Agencement Visuel et Contrôles

Le bandeau de recherche est une barre d'outils de couleur de fond `#252526` intégrée au conteneur de l'éditeur principal. Il comprend les éléments suivants de gauche à droite :

### 1.1 Contrôle SMART et Similitude (Conditionnel)
Ces éléments ne s'affichent que si le champ de recherche **n'est pas vide** :
- **Bouton SMART** : Toggle permettant d'ignorer la casse et les espaces multiples. S'il est activé, il prend une couleur jaune `#FFD700` avec une lueur dorée (`shadow-[0_0_8px_rgba(255,215,0,0.4)]`). il est constitué d'un icone (lumière) suivit du terme "SMART". Ce toggle smart n'a une influence que sur la RECHERCHE et pas sur la fonction FIND. il applique donc la gestion de cette "souplesse" au texte écrit par l'utilisateur dans la barre de texte de recherche de ce bandeau.
- **Label de Similitude** : un label fixe "simulitude" suivit d'un label dynamique encadré avec un fond coloré pour la valeur numérique : Affiche le pourcentage de correspondance de la meilleure occurrence trouvée. La couleur s'adapte en temps réel (vert `#4caf50` à 100%, jaune `#FFD700` > 50%, rouge `#ff5555` sinon. a 100%, c'est le fond qui est vert, le texte est blanc. a moins de 100%, c'est le texte qui prends une couleur, le fond est transparent). de plus, la zone de recherche (icone / bouton de la loupe + texte area) a un cadre de mise en valeur associé : jaune quand la correspondance n'est pas parfaite, mais de sorte à pouvoir mettre en évidence que le systeme est en mode de recherche et attirer l'oeil de l'utilisateur, vert quand la corresponsance est parfaite.
- **Responsive** : le bouton smart, si la zone centrale deviens assez petite, fini par etre réduit de son texte, et n'affiche plus que le logo. le label de similitude subit le meme traitement : le mot "simulitude" disparait et il n'est affiché que la valeur numérique. (cette seconde fonction n'est pas encore implémenté)

### 1.2 Zone de Recherche Extensible (Textarea + Gouttière)
- **Icone loupe** : quand le text de recherche est réduit à une ligne, apparait comme un bouton intégré directement, séparé par un petit trait vertical du texte. 
- **Gouttière de Recherche (`#global-search-gutter`)** : Située à gauche de la zone de saisie. En mode multiligne, elle affiche les numéros de ligne du texte recherché. Elle affiche une icône de loupe 🔍 en sur impression au dessus la première ligne affiché. 
- **Comportement Loupe** : Un double-clic sur la loupe suspend/réactive la recherche (mode gel de la recherche). : toute la barre de recherche et ses fonctions associé sont grisé et inopérante, sauf la loupe qui est entouré d'un fond jaune. Un nouveau double clic réactive la recherche. la fonction de recherche dynamique est arrêté et donc le codeeditor est libéré de son lien avec la recherche, pour la retrouver avec la side bar de gauche, qui est alors réactivée, et avec elle le "Find dynamique DraftSearch", si celui ci était actif. le texte dans le texte de recherche reste intacte, permettant de relancer la recherche.
- **Textarea de recherche** : Zone de saisie principale.
  - Par défaut : hauteur sur une seule ligne.
  - En mode multiligne : grandit dynamiquement selon la saisie jusqu'à **25% de la hauteur de l'écran**.
  - Si la hauteur maximale est atteinte, une scrollbar interne et un splitter de redimensionnement manuel (en bas du bandeau de recherche) apparaissent.
  - Zoom indépendant : `Ctrl + Molette` sur cette zone permet d'ajuster sa taille de police (`searchFontSize`) entre 8 et 40px. la goutière est ajusté en meme temps et syncronisé.
  - quand le texte est vide, les boutons et fonction a droite et a gauche du texte sont déchargé / invisible. il ne reste alors que la loupe et le texte de recherche. l'ensemble est aligné en largeur a la taille du controle "code editor" au dessous.
  - quand un texte est ajouté : les boutons et fonction a gauche et a droite apparaisse, la similitude est calculé dynamiquement, et un encadrement colorisé apparait. de plus, toute la sidebar de gauche est intégralement grisé et gelé, tant qu'un texte apparait (ou que la fonction n'est pas désactivé par un double clic sur la loupe)

### 1.3 Badge de Résultats et Navigation
- a droite du texte de recherche.
- S'affiche si des occurrences sont trouvées.
- Affiche le compteur `- X / Y` (Occurrence active / Nombre total) en jaune/orange.
- **Boutons directionnels (▲ / ▼)** : Permettent de sauter d'une occurrence à l'autre dans le code.
- **Double-clic sur le compteur** : Ouvre la modale `LineChoiceModal` pour saisir directement le numéro de l'occurrence souhaitée.

### 1.4 Bouton "Copier & Supprimer"
- Icone 📋 suivie du texte "Copier & Supprimer" (ou icône seule sur les plus petits écrans).
- Si similitude = 100% : fond vert `#4caf50` avec lueur. Copie le contenu recherché dans le presse-papier, efface le champ et ferme le bandeau.

---

## 2. Intégration Fonctionnelle

Pour une description exhaustive du moteur de recherche, de la gestion de la sécurité (Escape Hatch) et des priorités d'affichage des marqueurs, se référer au document de spécifications dédié : [Recherche Globale (GlobalSearch.md)](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/GlobalSearch.md).

---

## 3. Temporisation de Réactivation (Timer 2s)

- **Délai de réactivation (Timer 2s)** : Si l'utilisateur efface le texte de la barre de recherche globale, un timer de **2 secondes** (`sidebarRestoreTimerRef` réglé à 2000ms) maintient la Sidebar gauche grisée avant de la libérer et de réactiver le "Find dynamique DraftSearch". Cela évite les toggles intempestifs et les calculs de Lightmap/Heatmap DraftSearch pendant les frappes clavier rapides.

---

## 4. Gouttière du Code Principal et Persistance du Ciblage (30s)

- **Marqueurs de Gouttière** : La recherche globale DraftSearch projette ses marqueurs dans la gouttière des numéros de ligne de l'éditeur de code principal (`▶` carré bleu pour l'occurrence active, `●` point coloré pour les occurrences inactives, via le calcul de Lightmap DraftSearch).
- **Persistance du ciblage (30s post-fermeture)** : Lors d'un saut de navigation, la ligne active reçoit un contour rouge (`outline-red-500`) et une lueur de ciblage. Ce ciblage visuel est persistant pendant **30 secondes**. Cette persistance est maintenue **même après la fermeture, l'effacement ou le masquage de la barre de recherche globale**, ce qui permet à l'utilisateur de continuer à situer visuellement la ligne qu'il a trouvée, même lorsque le bandeau de recherche n'est plus visible.

---

## 5. Règle de Priorité Réactive (Responsive)

- **Priorité à la Zone de Texte** : En responsive, la zone de saisie (textarea) est prioritaire avec une largeur minimale absolue de **500 pixels**.
- **Réduction des éléments secondaires** : En dessous de ce seuil, les autres composants se compressent :
  1. Le bouton **SMART** perd son texte pour n'afficher que l'icône `💡`.
  2. Le label **Similarité** perd le mot "Similitude :" pour n'afficher que la valeur de pourcentage.
  3. Le bouton d'action **"Copier & Supprimer"** (icône `📋` + texte) perd son libellé pour ne laisser visible que son icône de petit calepin `📋`.

---

## 6. Échappement de Sécurité (Escape Hatch)

Afin d'éviter de saturer le thread principal Javascript lors de la recherche dynamique en temps réel, un mécanisme d'échappement de sécurité est appliqué :

- **Règle d'activation** : La sécurité s'active si le texte du fichier de code principal dépasse **500 lignes** ET que la chaîne saisie dans le textarea de recherche contient **moins de 3 caractères** (et n'est pas vide).
- **Conséquences** : La recherche dynamique est suspendue, les calculs de Lightmap/Heatmap DraftSearch et de ratio de similarité sont mis en veille, et les contrôles de navigation (compteur d'occurrences, boutons ▲ / ▼) et d'action sont masqués.
- **Message d'avertissement pour l'utilisateur** :
  - **Emplacement exact** : Il apparaît directement à l'intérieur du bandeau de recherche, sur le côté droit, à la place habituelle des boutons de navigation et d'action.
  - **Rendu Visuel et Mise en avant** :
    - Présenté sous la forme d'un petit badge aux coins arrondis (`rounded p-1 ml-2`).
    - **Couleur du texte** : Orange vif (`#ff9800`).
    - **Couleur de fond** : Sombre orangé/marron (`#332200`).
    - **Bordure** : Fine bordure orange (`border border-[#ff9800]`).
    - Le texte en gras `"⚠️ Texte trop court (double-cliquez pour forcer)"` attire immédiatement l'œil.
  - **Contournement manuel (Force Search)** : Un double-clic de l'utilisateur sur ce badge orange permet de court-circuiter temporairement la sécurité et de forcer l'exécution de la recherche sur le fichier (au risque de provoquer des ralentissements lors de la frappe).


