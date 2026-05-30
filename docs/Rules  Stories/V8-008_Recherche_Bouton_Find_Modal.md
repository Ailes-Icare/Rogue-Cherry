## V8 - ajout n°6 : bouton "find" du "find actif" dans la sidebar de gauche.

actuellement, un double clic active ou désactive la recherche dynamique.
ajouter que quand de multiple occurence sont trouvé, ALORS un simple clic lance la modale de choix manuel (cf 5.3, et 7)

### Précision ultérieure :
> "le simple clic si pas d'occurence multiple ne fait effectivement rien => navigation instantanée + go pour fermer, oui"

> "La modale n'apparaît pas, ni sur un double clic sur le bandeau bleu en bas, ni sur un simple clic sur le texte "find" lorsqu'il fait apparaître des occurrences."

### Règles de base (Mandatory)
- **Séparation des événements de clic** : Le double-clic (qui active/désactive le mode Find dynamique) et le simple-clic (qui ouvre la modale) partagent la même zone cliquable. Il est obligatoire d'avoir un délai (ex: 250ms) pour différencier les deux événements de manière étanche.
- **Condition d'ouverture** : Le simple-clic n'ouvre la modale QUE s'il y a plus d'une occurrence.
