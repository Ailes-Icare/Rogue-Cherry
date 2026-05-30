# Story : Résolution du Bug Critique de Performance (Caractères Invisibles)

Cette story archive la documentation d'un correctif majeur concernant un anti-pattern de performance React critique, découvert lors de la finalisation de la phase V8 (en marge de l'Ajout 11). Ce bug provoquait un gel complet du navigateur et nécessitait un reboot du PC lors de l'activation du mode "Caractères invisibles" sur des fichiers de 10 000 lignes, tout particulièrement dans la modale de debug.

## Le Bug

Lorsque l'utilisateur activait l'œil pour afficher les caractères invisibles (espaces, tabulations, sauts de ligne), l'interface figeait de manière catastrophique, et le moindre défilement (scroll) à la souris empirait le blocage. Ce problème subsistait même en mode lecture seule.

## Les 3 causes majeures (Anti-patterns React) identifiées et corrigées

1. **La fragmentation des chaînes de caractères (Buffer) :**
   - **Problème :** L'algorithme d'affichage parcourait le texte caractère par caractère et poussait chaque espace (`<span className="hc-space"> </span>`), tabulation (`<span className="hc-tab">\t</span>`), MAIS AUSSI **chaque lettre individuelle** dans un tableau React. Pour 200 lignes visibles de 100 caractères, React essayait de générer et comparer **20 000 nœuds Fiber textuels séparés** (au lieu de regrouper les mots contigus).
   - **Solution :** Implémentation d'un *buffer* (tampon). Le texte normal s'accumule dans une chaîne unique, et on ne découpe en nœuds React séparés que lorsqu'on rencontre un espace ou une tabulation. Le nombre de nœuds DOM générés a été divisé par 100.

2. **L'hérésie du `Math.random()` comme clé React :**
   - **Problème :** Dans `SmartDebugger.jsx`, lors de la génération dynamique des espaces et tabulations invisibles, les clés React étaient assignées avec `key={Math.random()}`. C'est l'un des pires anti-patterns en React : à chaque re-rendu (ex: sur un pixel de scroll), les clés changent, forçant React à **détruire puis recréer** l'intégralité du DOM de la zone au lieu de le mettre à jour.
   - **Solution :** Utilisation de l'index séquentiel de la boucle d'analyse (ex: `key={\`sp-\${index}\`}`) pour garantir la stabilité de l'arbre DOM lors des re-rendus.

3. **La boucle infinie de rendus au défilement (Windowing non-throttlé) :**
   - **Problème :** Dans la modale de debug, le calcul du *Windowing* (fenêtrage des lignes visibles) s'exécutait avec un simple `setMirrorVisibleRange([newStart, newEnd])` à chaque événement natif `onScroll`. Comme un nouveau tableau était instancié et affecté à l'état à chaque pixel défilé, React déclenchait un cycle de re-rendu complet du composant de la modale des dizaines de fois par seconde.
   - **Solution :** Ajout d'un throttling d'état avec `prev` : `if (Math.abs(prev[0] - newStart) > 20) return [newStart, newEnd]; return prev;`. L'état (et donc le re-rendu du composant) ne se met à jour que lorsque le défilement dépasse 20 lignes.

## Règle d'Architecture Dérivée pour la V9
> **IMPORTANT :** Ne jamais utiliser `Math.random()` pour des clés de listes React. Toujours concaténer le texte contigu dans un buffer plutôt que de mapper sur chaque caractère individuel. Le défilement dynamique (scroll) couplé à une mise à jour d'état (`useState`) doit impérativement utiliser un mécanisme de seuil (throttling/debouncing par saut de lignes) pour éviter l'effondrement du moteur de rendu.
