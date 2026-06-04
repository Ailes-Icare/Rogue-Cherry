# Sidebar Gauche — Zone Centrale (Boutons d'Action)

## Vue d'ensemble

La zone centrale de la sidebar gauche (`SidebarLeft.jsx`) regroupe les contrôles principaux permettant d'importer, de rechercher et d'appliquer des modifications sur le code source. Située juste au-dessus du splitter horizontal, elle a la particularité d'avoir une hauteur fixe et incompressible, toujours placé sur la couche layer la plus haute, garantissant que ces contrôles de sécurité et d'action restent toujours à portée de clic de l'utilisateur.

---

## Groupe de boutons d'action

L'agencement des boutons s'ajuste dynamiquement en fonction de l'état de la pile multistack.

### Configuration standard — 3 boutons (Sans pile active)

Dans l'état par défaut, lorsque la pile multistack est vide, seuls 3 boutons sont visibles, répartis sur deux lignes :

- **Ligne 1 : Importation et Recherche** (2 boutons à part égale)
  - **Coller REQUÊTE** :
    - *Rôle* : Lit le presse-papier de l'utilisateur, l'analyse via le parseur syntaxique et peuple automatiquement les champs de saisie de la zone inférieure (Commentaire, FIND, REPLACE, STRICT, MULTI, etc.).
    - *Style* : Fond bleu (`bg-primary-blue hover:bg-primary-blue-hover`), texte blanc, gras.
    - *Activation* : Désactivé (`disabled`) si aucun code source n'est chargé dans l'application (`isCodeEmpty = true`).
    - *Notifications à l'utilisateur* :
      - **Requête unitaire standard** : Une MessageBox `Information` s'affiche pour confirmer le chargement (ex: `"Requête 'Label' chargée !"` ou `"Requête IA validée et chargée ! Cliquez sur APPLIQUER pour valider."`).
      - **Requête Multistack** : Si le parseur identifie plusieurs requêtes, une MessageBox `Information` s'affiche avec le message : `"📦 MODE MULTISTACK : N requêtes détectées. La première est chargée. Cliquez sur 'APPLIQUER' pour passer automatiquement à la suivante !"`.
  - **🔍 RECHERCHER** :
    - *Rôle* : Évalue la chaîne du champ FIND dans le document et affiche les occurrences et l'indice actif. cette recherche peu se faire en mode "smart" SI la fonction smart attaché à la sidebar de gauche (et pas celle de la recherche, au centre), est coché / validé (soit par l'utilisateur, soit par la requete)
    - *Style* : Fond bleu (`bg-primary-blue hover:bg-primary-blue-hover`), texte blanc, gras.
    - *Activation* : Désactivé si le champ "Texte à chercher (1)" est vide ou si la recherche globale supérieure est active.
- **Ligne 2 : Application unitaire** (1 bouton sur toute la largeur)
  - **APPLIQUER (ou SUPPRIMER L'OCCURRENCE)** :
    - *Rôle* : Exécute le remplacement de l'occurrence active dans le document. Si le champ de remplacement REPLACE (2) est vide, le libellé s'adapte automatiquement et devient "🗑️ SUPPRIMER L'OCCURRENCE". Dans ce cas, l'action supprime simplement le texte recherché en le remplaçant par une chaîne vide (`""`).
    - *Style* : Fond rouge cerise (`bg-cherry-red hover:bg-cherry-red-hover`), texte blanc, extra-gras.
    - *Activation* : Désactivé si aucune occurrence n'est trouvée (`occurrencesCount === 0`) ou si la recherche globale supérieure est active.

### Configuration étendue — 4 boutons + mention centrale (Avec pile active)

Dès qu'une pile multistack contient des requêtes en attente, le groupe de boutons se reconfigure automatiquement :

- **Mention textuelle centrale (Bandeau de sécurité)** :
  - Un bandeau d'avertissement s'intercale visuellement entre les deux lignes de boutons.
  - *Texte* : "⚠️ Attention : il est potentiellement dangereux d'appliquer les requêtes dans le désordre."
  - *Style* : Fond sombre orangé `#332200`, bordure orange `#ff9800`, texte orange et taille réduite (xxs, gras).
- **Ligne 2 réagencée** (2 boutons à part égale)
  - Le bouton **APPLIQUER** est rétréci à 50% de la largeur.
  - Le bouton **▶ APPLIQUER PILE** apparaît à droite :
    - *Rôle* : Déclenche l'exécution séquentielle automatique de toutes les requêtes en attente de la pile, dans l'ordre chronologique, à partir de la requête actuellement sélectionnée.
    - *Style* : Fond vert vif (`bg-[#4caf50] hover:bg-[#45a049]`), texte blanc, extra-gras.
    - *Activation* : Désactivé si la recherche globale supérieure est active.
    - *Mécanique et Règles d'Interruption* :
      La pile se déroule automatiquement en appliquant chaque étape avec une temporisation d'animation de 500 ms jusqu'à ce qu'un événement provoque son arrêt :
      - **Arrêt sur Erreur** : Si une requête a le statut `error` ou si la chaîne recherchée n'est plus trouvée (`occurrencesCount === 0`), la pile s'interrompt immédiatement avec un message d'erreur.
      - **Distinction Multi Global (sans arrêt)** : Si la requête a le paramètre `multi = true` et que toutes les occurrences du texte sont ciblées (multi global sans discrimination : `multiIndices.length === occurrencesCount`), la requête est appliquée automatiquement et le processus passe à la suivante sans s'arrêter.
      - **Interruption sur Cherry-Picking** : Si la requête requiert du Cherry-Picking (c'est-à-dire que `multi = true` mais que seule une sélection d'occurrences est ciblée : `multiIndices.length !== occurrencesCount`), l'exécution de la pile s'arrête. Un message d'avertissement s'affiche à l'écran demandant à l'utilisateur de vérifier les cibles sélectionnées et l'incitant à utiliser le bouton **« Audit IA »** (ou « Cherry-Picking Audit ») pour contrôler ses occurrences avant de valider.
      - **Reprise après Interruption** : Si l'utilisateur clique de nouveau sur le bouton **« APPLIQUER PILE »** alors que la pile s'est arrêtée sur une requête de Cherry-Picking, le système force l'exécution de cette requête spécifique en ignorant le contrôle d'arrêt de sécurité pour cette étape, permettant d'appliquer les cibles choisies et de continuer l'exécution de la pile sur les requêtes suivantes.

### Règles de transition

- L'apparition ou la disparition du quatrième bouton et du bandeau de sécurité se fait instantanément, sans transition animée, pour offrir une réactivité maximale.
- La division de la largeur de la deuxième ligne (100% en mode 3 boutons, 50%/50% en mode 4 boutons) s'effectue via Flexbox CSS.

---

## Comportement après application (Nettoyage & États)

Une fois qu'une requête (unitaire ou au sein de la pile) a été appliquée avec succès, les états de l'interface de saisie sont réinitialisés :

1. **Nettoyage des champs de texte** :
   - La boîte **Commentaire** est entièrement vidée.
   - Le champ de saisie du texte à chercher **FIND (1)** est vidé.
   - Le champ de saisie du texte à remplacer **REPLACE (2)** est vidé.
   - Le tableau d'occurrences de Cherry-Picking se masque automatiquement (car le texte de recherche est vide).
2. **Conservation des options (Toggles)** :
   - Par défaut, les boutons d'options **Smart** et **Multi** conservent leur dernier état en date (ils ne sont pas désactivés/décochés automatiquement, afin de préserver la continuité du mode de travail choisi par l'utilisateur).
3. **Cas de la Pile Multistack vidée** :
   - Si la dernière requête en attente de la pile multistack a été validée avec succès, la pile multistack elle-même est masquée de la sidebar.
   - L'interface revient instantanément à la configuration standard à trois boutons.
   - Une MessageBox de succès s'affiche avec le message : `"🎉 Toutes les requêtes de la pile Multistack ont été appliquées avec succès !"`.

---

## Transition et Persistance de la Colorisation DraftSurge (Application vs Recherche)

Dès qu'une application de requête est effectuée (que ce soit pour une requête unitaire ou suite à un clic sur l'une des requêtes d'une pile multistack), le comportement visuel de l'éditeur de code transitionne :

- **Remplacement de la couleur de recherche** : La colorisation jaune consécutive (qui résulte soit de la recherche active via le Find, soit du focus temporaire sur une requête de la pile) est entièrement remplacée par la colorisation DraftSurge.
- **Persistance et Cumul** : Cette colorisation DraftSurge (définie en détail dans [CodeEditor.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/CodeEditor.md)) est persistante. Elle est sauvegardée dans le document de travail, s'additionne aux colorisations DraftSurge qui auraient pu exister précédemment, et n'empêche pas l'affichage des colorisations des futures requêtes ou recherches.

Pour des détails sur la gestion de l'état du code source et l'implémentation de l'éditeur, voir :
- [Zone Centrale — Contrôleur de l'Éditeur de Code](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/zone-centrale-code-editor.md)
- [Spécifications : Éditeur de Code Principal](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/CodeEditor.md)

---

## Barre de séparation (Splitter)

- Le splitter horizontal de redimensionnement de la sidebar se trouve immédiatement au-dessous de ce bloc de boutons.
- La zone centrale possède une **hauteur incompressible**, sanctuarisée lors du déplacement du splitter : le splitter ne peut pas être remonté au point de masquer ou de rogner ces boutons.


## Responsive

- En cas de réduction de la largeur de la sidebar gauche :
  - La taille de police des boutons diminue et leurs marges internes se réduisent.
  - En deçà d'un seuil critique (ex. largeur < 280px), les libellés longs peuvent être masqués pour ne laisser visibles que les icônes de contrôle (ex: 🔍, 🗑️, ▶) avec des tooltips d'explication au survol.
  - Le bandeau de sécurité est tronqué avec ellipse ou réduit.

## Positionnement et Superposition (Layers & Clipping)

Le groupe de boutons d'action bénéficie d'une priorité visuelle haute au sein de la section supérieure :
- **Couche de superposition supérieure (`z-index: 10`)** : Ce panneau est positionné sur une couche supérieure avec un arrière-plan opaque (`bg-bg-panel`). Il est ancré de façon fixe et incompressible au bas de la zone supérieure (directement au-dessus du splitter horizontal).
- **Cinématique responsive d'Overlap** :
  - Lors de la remontée du splitter horizontal (réduction de `topHeight`), ce bloc de boutons pousse d'abord le conteneur supérieur, ce qui réduit la pile Multistack puis replie l'Assistant format requête.
  - Si le splitter remonte au-delà des limites physiques, ce bloc de boutons **passe visuellement par-dessus** la pile Multistack puis par-dessus l'Assistant, les masquant progressivement par le bas (rognage/clipping géré par l'overflow-hidden du conteneur supérieur).

---

## Dépendances et références

- Voir [sidebar-left-multistack.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/sidebar-left-multistack.md) pour la pile de requêtes située au-dessus.
- Voir [sidebar-left-bottom-inputs.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/sidebar-left-bottom-inputs.md) pour les zones de texte et de saisie situées en dessous du splitter.
- Voir [ui-layout-main.md](file:///c:/Users/inso/Documents/GitHub/Rogue-Cherry/docs/spec/UX/ui-layout-main.md) pour les règles complètes du splitter horizontal, du responsive et de la superposition.
