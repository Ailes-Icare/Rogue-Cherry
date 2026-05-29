## V8 - Story Spéciale : Marqueurs Gouttière et Indicateurs Visuels d'Occurrences

En aparté des ajouts principaux, cette story consolide le fonctionnement comportemental et visuel des points et flèches apparaissant dans la gouttière des numéros de ligne du `CodeEditor` lors d'une recherche active.

### Comportement Visuel Attendu
Lorsqu'une recherche dynamique est active (Bouton FIND activé), l'éditeur repère l'ensemble des occurrences dans le fichier et place des indicateurs visuels à gauche des numéros de lignes concernées (dans la gouttière) :

1. **Occurrences ciblées / globales ("Point Jaune")** :
   Toutes les lignes contenant une occurrence, qu'elle soit ou non la "cible actuelle" (et qu'elle soit destinée à être remplacée ou non, y compris le statut interne `hl-yellow-pale`), doivent afficher un petit point jaune `●`.
2. **Occurrence active ("Flèche Orange")** :
   La ligne contenant l'occurrence "actuellement sélectionnée" (l'index actif dans la navigation, `activeOccIndex`) remplace son point jaune par une flèche orange pointant vers le numéro `▶`.

### Précision ultérieure :
> "En aparté, crée une toute petite story pour rappeler la feature comportementale des petits points jaunes avec la petite box bleue et la flèche — rappeler à quoi ça sert et dans quel cas c'est supposé se mettre en place."
> "lorsque je navigue entre les occurrences, le petit point jaune de la ligne active est remplacé par une petite box bleue avec une petite flèche. Ça fonctionne correctement dans ce cas. En revanche... je n'ai qu'un seul point jaune sur la première occurrence, et rien d'autre. La navigation ... fonctionne bien ... mais il n'y a plus aucun marquage latéral."

### Règles de base (Mandatory)
- **Le rendu du Gutter** : La gouttière de l'éditeur de code (CodeEditor) doit impérativement itérer et fusionner les états visuels des marqueurs.
- Si une ligne croise un marqueur de recherche, elle gagne le statut `isOccLine`.
- Même si un marqueur n'est pas le "marqueur prioritaire" sélectionné pour remplacement (qu'il soit "pâle"), il DOIT être compté comme un marqueur de recherche valide pour l'indicateur visuel de la ligne, afin de conserver la cartographie spatiale globale sur tout le fichier (même de 9000 lignes).
