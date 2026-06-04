# Spécifications : Zone Centrale — Système d'Onglets (Multi-fichiers)

**Contexte** : Zone centrale, située verticalement entre le Séparateur Horizontal (sous le bandeau supérieur) et la Barre de Recherche Globale.

Ce document décrit le fonctionnement visuel et applicatif du système d'onglets permettant de gérer un projet contenant **plusieurs fichiers** avec un historique commun.

---

## 1. Architecture Multi-fichiers & Historique Commun

- **Historique commun** : Contrairement à un système mono-fichier, l'historique de versions (Time-Travel) de la SidebarRight est unique et partagé par l'ensemble des fichiers du projet. Chaque action s'inscrit chronologiquement dans la même pile globale, quel que soit le fichier impacté.
- **Unicité des noms** : Chaque fichier au sein du projet doit porter un nom unique. En cas d'importation d'un fichier possédant un nom identique à un fichier déjà présent, le système ajoute automatiquement un suffixe/indicateur unique de différenciation.
- **Absence en Mode Mono-fichier (Sûreté UX)** : Tant que le projet n'est pas dans un état multi-fichiers — c'est-à-dire qu'un seul et unique fichier est chargé dans le projet — **la zone de barre d'onglets n'est pas rendue dans le DOM et reste totalement invisible**. Elle ne vient pas surcharger l'environnement de travail de l'utilisateur ni consommer d'espace vertical utile.

---

## 2. Flux d'Importation et d'Ajout de Fichier

Lorsqu'un projet est déjà initié ou chargé :
1. Cliquer sur **OUVRIR** ou **IMPORT** ne réinitialise plus l'application.
2. Une mini-modale d'information à 2 choix apparaît :
   - **Lancer un nouveau projet** : Réinitialise l'historique et crée un nouveau projet avec ce fichier.
   - **Ajouter ce fichier** : Conserve le projet en cours et intègre le fichier.

### 2.1 Processus d'Ajout ("Ajouter ce fichier")
Si l'utilisateur choisit d'ajouter le fichier au projet, la modale d'import s'ouvre dans un troisième mode spécifique, dérivé de la modale `UpVersion` :
- **Incrémentation** : Permet de choisir d'incrémenter la version du projet sur le rang "auto".
- **Import Silencieux** : Un bouton spécifique est ajouté en bas à gauche de la modale : **"Importer silencieusement"**. Il permet d'ajouter le fichier sans générer de changement/incrément de version globale du projet.
- **Historique** : Une ligne est ajoutée dans la pile d'historique avec le label **"Add file"** (au lieu de "IMPORT").
- **Source** : Le champ `source` de cet enregistrement prend le nom du fichier (avec son suffixe d'unicité éventuel).
- **Attribut File** : La requête brute associée à ce point d'historique reçoit un attribut double `File: [nom_projet]/[nom_fichier]` pour identifier le fichier cible de l'opération.

---

## 3. Comportement des Onglets et Focus

- **Création** : Lors de l'ajout, une barre d'onglets se matérialise sous le liseret horizontal. Un premier onglet affiche le fichier initial et son nom, tandis qu'un second onglet est généré pour le nouveau fichier.
- **Focus automatique** : Le nouvel onglet prend immédiatement le focus (état actif), est mis en surbrillance (fond plus clair, liseret bleu, texte blanc gras), et son texte est chargé dans la zone de texte principale du CodeEditor.
- **Indépendance des vues** :
  - Les sidebars gauche et droite ne sont pas altérées par le changement d'onglet.
  - Le nouveau fichier s'affiche sans aucune colorisation de recherche ou colorisation DraftSurge au départ.
  - Lors du changement d'onglet (clic sur un autre onglet), le texte associé est chargé et les surbrillances/marqueurs existants spécifiques à ce fichier sont restaurés.
- **Réorganisation** : Les onglets peuvent être réorganisés horizontalement par glisser-déposer (draggable).

---

## 4. Fermeture et Suppression d'un Onglet

Chaque onglet comporte une petite croix de fermeture `x`. Lors du clic, une modale de confirmation propose 3 choix à l'utilisateur :

1. **Fermer** : L'onglet est masqué de la barre d'onglets, mais le fichier reste dans le projet. L'onglet se réouvrira automatiquement dès qu'une requête ciblant ce fichier sera exécutée.
2. **Supprimer et expurger l'historique** : Supprime définitivement le fichier du projet JSON, et nettoie (expurge) tous les points d'historique liés à ce fichier, y compris son import initial et ses sauvegardes intermédiaires.
3. **Supprimer le fichier sans suppression de l'historique** : Crée un point d'information dans l'historique notifiant le projet qu'à partir de cet instant, le fichier est considéré comme inexistant (supprimé). Il n'est plus possible de lui appliquer des requêtes ultérieures, mais les anciennes étapes historiques de ce fichier sont préservées.

---

## 5. Gestion des Fichiers Fermés (Tiroir de Restauration)

- Dès qu'au moins un fichier est dans l'état "Fermé" :
  - Un onglet fictif réduit apparaît à l'extrême gauche de la barre d'onglets (toujours visible).
  - Cet onglet comporte une flèche vers le haut `▲`.
  - Un clic dessus ouvre une combobox flottante listant tous les fichiers fermés du projet.
  - Sélectionner un fichier dans cette liste le réouvre instantanément et recrée son onglet actif.

---

## 6. Règle de Sûreté (Gestion des Erreurs)

- **Ciblage obligatoire** : Dès lors qu'un projet comporte plusieurs fichiers (projet multi-fichiers), toute requête FIND/REPLACE ou prompt doit impérativement spécifier le nom du fichier ou dossier cible.
- **Requête sans cible** : Si une requête est exécutée dans un projet multi-fichiers sans inclure l'attribut de ciblage du fichier, la requête est considérée en erreur et son exécution est bloquée.
