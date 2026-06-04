# Spécifications : Recherche Globale (`GlobalSearch` / DraftSearch)

**Contexte** : Bandeau supérieur de l'éditeur principal, intégré à `App.jsx` / `CodeEditor.jsx`.

La recherche globale DraftSearch est un outil de navigation rapide indépendant de la pile d'historique. Elle utilise les algorithmes et l'échappement de sécurité décrits dans le [Moteur de Recherche Commun (recherche.md)](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/recherche.md).

---

## 1. Fonctionnement Visuel (Bandeau Supérieur)

### 1.1 Input Extensible
- La zone de texte est **multiligne et auto-redimensionnable** verticalement.
- Elle grandit dynamiquement au fur et à mesure de la saisie jusqu'à un **maximum de 25% de la hauteur de l'écran** (`maxSearchHeight = window.innerHeight * 0.25`).
- Au-delà de cette limite, une barre de défilement interne et une **gouttière de numérotation de ligne** apparaissent (même design que l'éditeur principal).

### 1.2 Bouton Smart (Toggle)
- Situé à gauche du champ texte.
- N'apparaît que si le champ **n'est pas vide**.
- Bascule entre : **Recherche Stricte** (dichotomie sur sous-chaîne) et **Recherche Floue** (Regex insensible à la casse/espaces).

### 1.3 Label de Similitude
- Affiche en temps réel le **pourcentage de correspondance** de la meilleure occurrence trouvée.
- La couleur du label suit la Lightmap DraftSearch CSS :
  - 100% → `hl-yellow` (Jaune vif)
  - ≥ 80% → `hl-find-80` (Or)
  - ≥ 50% → `hl-find-50` (Orange)
  - < 50% → `hl-find-10` (Rouge)

### 1.4 Navigation entre Occurrences (x / y)
- Si plusieurs occurrences à 100% sont trouvées, le label `1 / 15` apparaît.
- **Flèches directionnelles** (▲ et ▼) permettent de naviguer entre elles.
- Un **clic sur le ratio textuel** ouvre la `LineChoiceModal` en Mode Occurrences (voir `Autres.md`), fixée au-dessus des boutons de navigation.

### 1.5 Bouton d'Action (Copier & Supprimer)
- **Description** : Un bouton unique combiné **"Copier & Supprimer"** :
  - **Icône** : `📋` (presse-papier / petit calepin).
  - **Texte associé** : `"Copier & Supprimer"` (ou `"Copier"`).
  - **Comportement** : Copie le motif recherché dans le presse-papier, l'injecte dans le champ FIND de la Sidebar gauche (ce qui réactive la sidebar et y transfère le critère), et vide la barre de recherche globale. S'affiche uniquement si la similitude est à **100%**.
- **Comportement Réactif (Responsive)** : Si l'espace de la zone centrale vient à manquer (largeur contrainte), le libellé textuel ("Copier & Supprimer") est automatiquement masqué pour ne laisser visible que l'icône du petit calepin `📋` dans un bouton carré compact.

---

## 2. Intégration dans le CodeEditor (Injection de Marques et Gouttière)

La recherche globale DraftSearch injecte `globalSearchMarks` dans `CodeEditor.jsx` :

- **Lightmap DraftSearch Caractère** : Les correspondances colorent le texte en temps réel selon le niveau de similarité (fond `hl-yellow` pour 100%, `hl-find-80` pour ≥80%, `hl-find-50` pour ≥50%, `hl-find-10` pour <50%, via la colorisation dynamique in situ DraftSearch).
- **Lightmap DraftSearch Ligne (Background)** : L'arrière-plan de la ligne contenant l'occurrence est subtilement teinté en violet translucide (`hl-line-mod`/`hl-linebg`).
- **Marqueurs Visuels dans la Gouttière** :
  - **`▶` (Carré bleu)** : S'affiche à gauche du numéro de ligne de l'occurrence **active** ciblée par la navigation.
  - **`●` (Point coloré)** : S'affiche à gauche du numéro de ligne des occurrences **inactives** trouvées. La couleur du point s'aligne sur la lightmap DraftSearch (jaune si 100%, orange/rouge si flou).
- **Liseret et Lueur de Ciblage (`isTargeted`)** : Lors d'un saut de navigation (saisie ou navigation ▲ / ▼), la ligne de l'occurrence active reçoit un contour rouge (`outline-red-500`) et une lueur rouge (`shadow-[0_0_5px_rgba(239,68,68,0.8)]`). Ce marquage de ciblage reste affiché et persistant pendant **30 secondes**, y compris après la fermeture, l'effacement ou le masquage de la barre de recherche globale (permettant à l'utilisateur de conserver son repère visuel sur la ligne trouvée même si la recherche n'est plus active ou visible). Il ne s'efface avant ce délai que si une nouvelle recherche globale est initiée.

---

## 3. Comportements Conditionnels

### 3.1 Temporisations et Timers de Réactivité
- **Persistance du Mode Smart (Timer 30s)** : Si l'utilisateur efface le texte, l'état du bouton **SMART** (`globalSearchSmartMode`) est maintenu actif pendant **30 secondes** via un timer (`searchTimerRef`) pour éviter de devoir le réactiver lors d'une re-saisie ou d'un recollage rapide. Les autres éléments secondaires (badge, boutons de navigation, bouton copier) disparaissent immédiatement.
- **Délai de Réactivation de la Sidebar (Timer 2s)** : Lorsque le texte de recherche globale DraftSearch est entièrement effacé, la Sidebar Gauche n'est pas libérée immédiatement. Un timer de **2 secondes** (`sidebarRestoreTimerRef` réglé à 2000ms, pouvant être ressenti entre 2 et 4 secondes sous l'effet du cycle React) maintient la désactivation temporairement pour éviter les conflits d'affichage et de calculs de Lightmap DraftSearch lors d'une frappe rapide ou d'une correction. Une fois le timer écoulé, la Sidebar gauche est réactivée ainsi que son "Find dynamique DraftSearch".

### 3.2 Modale de Navigation et Défilement de Centrage
- Clic sur le label `x / y` → Ouvre `LineChoiceModal` en **Mode Occurrences**.
- La modale reçoit `linesArray` = tableau des lignes absolues de toutes les occurrences trouvées.
- **Centrage de l'Occurrence (Auto-Scroll)** : À chaque changement d'occurrence active (saut via ▲/▼ ou saisie dans la modale), le contrôleur force le conteneur du code principal à défiler instantanément de manière fluide (`scrollIntoView({ behavior: 'smooth', block: 'center' })`) afin de positionner précisément l'occurrence cible au centre de la hauteur de l'écran visible.

### 3.3 Suspension de Saisie (Timeout)
- Lors de la saisie dans la `LineChoiceModal`, le saut effectif est suspendu tant que le champ conserve le focus (voir la spec `LineChoiceModal` dans `Autres.md`).

### 3.4 Désactivation Mutuelle avec la SidebarLeft
- Si une recherche globale est en cours, la **zone FIND de la SidebarLeft est grisée** et désactivée.
- Cela évite des collisions de marqueurs entre les deux systèmes de recherche.

### 3.5 Échappement de Sécurité (Escape Hatch)
- Repose sur la mécanique commune de sécurité détaillée dans le [Moteur de Recherche Commun (recherche.md)](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/recherche.md).
- Si le document dépasse `maxLines` et que la recherche est inférieure à `minChars` caractères → alerte bloquante.

---

## 4. Règle de Priorité

La recherche globale DraftSearch est **prioritaire sur toutes les autres recherches** : quand elle est active, les marques du Find dynamique DraftSearch de la SidebarLeft sont supprimées de la vue du CodeEditor (les deux systèmes ne coexistent pas visuellement).

---

## 5. Règle de Priorité Réactive (Responsive)

En responsive, lorsque la largeur de l'écran ou du conteneur central se réduit :
- **Priorité Absolue à la Zone de Texte** : La zone de saisie de recherche (textarea) est l'élément d'affichage prioritaire. Une largeur minimale absolue de **500 pixels** lui est réservée.
- **Mécanique de réduction des contrôles secondaires** : En dessous du seuil de largeur garantissant les 500px au textarea :
  1. Le bouton **SMART** perd son texte pour ne conserver que son icône ampoule `💡`.
  2. Le label **Similarité** masque le mot `"Similitude :"` pour n'afficher que la valeur numérique et son badge de couleur (ex: `[100%]`).
  3. Le bouton d'action **"Copier & Supprimer"** masque entièrement son libellé textuel pour ne laisser visible que son icône de petit calepin `📋` dans un format de bouton carré compact.
