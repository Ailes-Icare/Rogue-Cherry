# Rogue-Cherry
🍒 **ROGUE CHERRY** Semantic Injection. Zero Dependency.

> 🛡️ **Environment:** Restricted-Safe | ⚡ **Dependencies:** Zero-JS-Library | 🛰️ **Status:** Alpha V2 (V7.4.9)

---

## 1. MISSION BRIEFING : A QUOI ÇA SERT ?

Concrètement, Rogue Cherry sert à chercher un extrait de texte spécifique au sein d'un document volumineux pour le remplacer par un autre. L'outil s'appuie sur un processus de recherche **puissant, robuste et visuellement assisté**, qui archive méticuleusement chaque modification dans un **historique traçable**.

Au-delà du traditionnel "copier/coller" manuel, sa véritable force réside dans sa capacité à ingérer une **"requête" formatée**. Cette requête contient l'ensemble des consignes : le texte exact à chercher, le texte de remplacement et vos choix d'application (comme la sélection multiple). Cela permet de dialoguer de manière fluide avec une IA via un **prompt pré-préparé** (intégré à l'outil) qui lui dicte la syntaxe obligatoire. Au lieu de configurer vos remplacements à la main, vous demandez à l'IA de lire votre texte global, puis de rédiger elle-même ces requêtes ciblées pour l'améliorer, le corriger ou l'étendre.

Cette approche chirurgicale dépasse largement le simple cadre du développement logiciel. Qu'il s'agisse de créer du code, de rédiger de la documentation technique, ou de corriger au mot près un article de publication scientifique, Rogue Cherry s'adapte. Il a été spécifiquement conçu pour **"augmenter" les capacités des IA conversationnelles traditionnelles**, leur permettant de modifier de très longs documents sans risque de casse accidentelle sur le reste du fichier, et sans surcharger inutilement la mémoire de la conversation.

L'objectif tactique est simple : ne plus avoir à réécrire ou regénérer un document entier à chaque itération. Vous **"snipez"** précisément les zones qui méritent un correctif pour vous concentrer uniquement sur l'essentiel, sans aucun parasite. 🍒

D'où son nom d'opération : **Rogue Cherry**.

- **L'esprit *Rogue***, c'est la ruse et l'autonomie. Un environnement sans nuage, sans installation et sans transfert de données, pensé pour débrider les capacités de votre IA en local, partout, tout le temps.

- **La méthode *Cherry***, c'est le "cherry-picking" chirurgical. Vous snipez votre cible pour n'extraire et ne remplacer que la cerise sur le gâteau. Pas de dommages collatéraux, juste l'impact recherché.

---

## 2. DRAFTSURGE : LE MOTEUR D'INJECTION ⚡

**DraftSurge** est le moteur invisible qui orchestre l'intelligence de Rogue Cherry. Il s'agit d'un système conçu pour transformer vos brouillons ou vos codes bruts en documents finis avec une précision chirurgicale. Son rôle est de s'assurer que chaque modification demandée, qu'elle vienne de vous ou d'une IA, soit appliquée exactement là où elle doit l'être, sans jamais altérer accidentellement le reste de votre travail.

L'utilisation est pensée pour être immédiate : vous pouvez soit saisir manuellement un texte à chercher et son remplaçant, soit coller une "requête" préformatée que l'IA a rédigée pour vous. Dès cet instant, l'outil prend le relais : il identifie les zones cibles dans votre document et les met en évidence en **"Jaune Électrique"**.

Vous gardez le **contrôle total** sur l'opération. L'interface vous permet de contrôler chaque occurrence trouvée avant de valider l'injection. Si jamais la consigne de l'IA est mal formée ou contient une erreur, Rogue Cherry intègre une **fonction de débogage** qui isole le problème et vous permet de le corriger dans un environnement sécurisé avant que le moindre changement ne soit appliqué à votre document principal.

**Pour ceux qui veulent voir ce qu'il y a sous le capot :**

DraftSurge repose sur une architecture de **Machine à États (State Machine)** globale, garantissant que l'application est une projection parfaite de vos données. Le moteur utilise un algorithme de comparaison de type **LCS (Longest Common Subsequence)** pour générer une matrice de différences au caractère près. Le rendu visuel utilise un système de calques (**Backdrop/Overlay**) permettant une colorisation dynamique en temps réel sans latence d'écriture.

La sécurité du processus est renforcée par une logique de **Boucle Inverse (Reverse Loop)** lors des remplacements multiples, ce qui prévient toute corruption des index mathématiques du texte. Enfin, le système d'historique ne se contente pas de sauvegarder le texte : il enregistre des instantanés complets incluant la colorisation sémantique, tandis que la console de débogage dédiée permet une gestion fine des caractères invisibles pour traquer les erreurs d'indentation ou les espaces fantômes.

---

## 3. FIELD OPERATIONS (USER STORIES)

### 3.1. 🛠️ Opération Alpha : Le Code au Scalpel (Développement et Débogage)

- **Situation :** Vous demandez à une IA d'améliorer un logiciel de 5000 lignes, de régler un bug complexe ou d'ajouter une fonction métier.

- **Action :** Après lui avoir expliqué votre besoin et fourni le code source, vous lui demandez de retourner l'ensemble des correctifs à faire précisément sous forme de requêtes préformatées Rogue Cherry.

- **Résultat :** Adieu le risque de voir l'IA vous recracher 5000 lignes de code en ayant, par inadvertance, cassé d'autres fonctions. Vous contrôlez exactement ce qu'elle change. Vous pouvez lire les requêtes, les vérifier visuellement, contredire l'IA si besoin, et corriger le code par petites touches. Vos conversations avec l'IA deviennent drastiquement plus courtes, ciblées et efficaces.

### 3.2. ✒️ Opération Beta : Le Nettoyage Sémantique Assisté (Révision de rapports)

- **Situation :** Un rapport juridique de 50 pages cite une dizaine de fois un avocat. Suite à une évolution du dossier, un nouvel avocat remplace l'ancien sur une partie seulement des procédures.

- **Action :** Vous fournissez le rapport à l'IA, lui expliquez le rôle du remplaçant, et lui demandez d'auditer le document pour déterminer qui doit être cité selon le contexte.

- **Résultat :** L'IA génère un lot de requêtes Rogue Cherry. Une première requête "multiple" remplace d'un coup l'ancien nom par le nouveau sur 5 occurrences simples. Mais l'agent IA a déterminé que dans deux cas spécifiques, un simple changement de nom ne suffisait pas : deux requêtes "sniper" injectent alors une petite phrase contextuelle pour rendre le changement cohérent. Il faut aussi féminiser un titre ? L'IA et Rogue Cherry vous permettent de passer rapidement le texte en revue pour changer le genre sans la moindre erreur.

### 3.3. 🎯 Opération Gamma : Le Cherry-Picking Contextuel (Refactoring Complexe)

- **Situation :** Une version dérivée et optimisée d'une fonction mathématique a été créée. Dans votre script, l'ancienne fonction est utilisée à des dizaines d'endroits, mais vous demandez à l'IA d'identifier les 3 seuls emplacements où elle devrait être remplacée par la nouvelle.

- **Action :** L'IA analyse le code, trouve les occurrences exactes, et génère une requête ciblant précisément ces index (ex: `[MULTI:4,12,18]`).

- **Résultat :** Vous collez la requête. Rogue Cherry surligne ces trois cibles. Avant de valider l'injection, vous pouvez utiliser la fonction d'audit intégrée pour demander à l'IA de vérifier que ce sont bien les bonnes lignes. Une fois confirmé, le moteur remplace ces trois occurrences précises et laisse la cinquantaine d'autres totalement intactes.

### 3.4. 📝 Opération Delta : La Documentation Vivante (Mise à jour d'Architecture)

- **Situation :** Vous tenez à jour une documentation technique qui archive la description fonctionnelle de votre projet. Au terme d'une boucle de développement, vous demandez à l'IA de synthétiser vos deux derniers jours de travail.

- **Action :** Vous demandez ensuite à cette même IA de faire un audit de votre documentation actuelle comparativement à son rapport de synthèse, et d'y injecter les nouveautés via Rogue Cherry.

- **Résultat :** L'IA produit trois requêtes ciblées. La première insère les nouvelles ressources documentaires à la suite des existantes. La seconde ajoute l'historique des problèmes réglés (l'état de l'art) dans le sous-chapitre dédié à la traçabilité. La dernière corrige chirurgicalement une section devenue fausse compte tenu de vos dernières conclusions. Votre documentation reste vivante et rigoureuse.

---

## 4. ARSENAL TACTIQUE (FONCTIONNALITÉS)

### 4.1. 🎯 Le Cherry-Picking Sémantique

L'option de remplacement global `[MULTI:TRUE]` est une arme lourde, souvent trop risquée sur des documents complexes. Rogue Cherry introduit la frappe chirurgicale : le ciblage d'index via la syntaxe `[MULTI:1,3,8]`.

- **Sélectionnez les occurrences exactes** à modifier grâce à une interface dynamique (ComboListBox) générée à la volée.

- **Gardez un contrôle visuel absolu :** une gouttière intelligente (Gutter) place des repères tactiques (● et ▶) face aux lignes impactées, vous évitant de vous perdre dans des fichiers kilométriques.

- **Déléguez la vérification :** générez en un clic un "Audit IA 🤖" dans votre presse-papier. L'outil extrait l'occurrence ciblée et son contexte (+/- 10 lignes) pour que votre IA confirme la validité de l'opération avant l'exécution.

### 4.2. 🛡️ Smart Debugger (Modale de Survie)

Que faire face à une requête IA "hallucinée" ou mal formatée ? Le Smart Debugger intercepte la faille et vous isole dans un bac à sable sécurisé (z-index: 1000) pour la neutraliser.

- **Fail-Fast Tokenizer :** Un analyseur lexical surligne la requête en temps réel et stoppe brutalement sa coloration sur le caractère exact qui fait planter la syntaxe. L'erreur vous saute aux yeux.

- **Vision Rayons-X :** Les IA trébuchent souvent sur l'indentation. La modale révèle les caractères invisibles (espaces ·, tabulations →, sauts de ligne ↵) pour débusquer immédiatement les anomalies de formatage.

- **Recherche Nuancée (Heatmap) :** Si le texte recherché n'est pas trouvé à 100%, un algorithme dichotomique scanne le document pour localiser les correspondances partielles et applique un dégradé de chaleur (du Vert fluo au Rouge critique). Vous savez immédiatement où l'IA s'est trompée d'un seul mot.

### 4.3. 🛰️ Time-Travel & MultiStack

L'outil ne pardonne pas l'erreur, il l'annule.

- **Historisation Git-Like :** Le panneau latéral archive chaque action (incrément Majeur, Mineur ou Rollback pur). Il offre des mini-vues miroirs "Avant/Après" au défilement synchronisé pour auditer vos propres modifications dans le temps.

- **MultiStack (Batch Processing) :** Pourquoi faire une requête quand vous pouvez en lancer dix ? Empilez les correctifs envoyés par l'IA avec la balise `##[MULTISTACK REQUEST]##`. L'outil pré-teste automatiquement chaque nœud de la chaîne en arrière-plan avant de procéder à l'injection séquentielle.

---

## 5. LE CŒUR DU RÉACTEUR : MOTEUR DRAFTSURGE ⚡

Sous la carrosserie, Rogue Cherry est propulsé par DraftSurge. Une architecture algorithmique taillée pour la précision mathématique et l'intégrité absolue de vos données :

- **100% Local (Zero-Dependency) :** Vos données industrielles ne quittent jamais votre poste. Aucune API tierce, aucune librairie externe. L'outil est un coffre-fort fonctionnant en hors-ligne total.

- **Diffing Sémantique (Double Passe) :** L'algorithme isole la recherche et le remplacement pour générer une matrice de différences locales (LCS). Cette matrice est ensuite projetée mathématiquement sur le code global, éliminant tout artefact visuel ou bavage de couleur.

- **State Machine Incorruptible :** L'interface graphique n'est qu'une illusion, une simple projection du DOM. La véritable "vérité métier" est verrouillée dans un objet d'état global (`state`), rendant chaque altération instantanément réversible et mathématiquement traçable.

- **Reverse Loop (Boucle Inverse) :** Lors des remplacements multiples (Cherry-Picking ou Batch), le moteur traite le document de la toute fin vers le début. Cette ruse algorithmique empêche la modification de la longueur d'un bloc de corrompre les coordonnées (Index Shifting) des blocs suivants.

---

## 6. MANUEL D'OPÉRATION STANDARD (S.O.P.)

### 6.1. Opérations Manuelles et Traçabilité

Dans son usage le plus direct, Rogue Cherry s'utilise comme un outil de remplacement classique, mais hautement sécurisé. Vous collez votre texte source dans l'éditeur principal. Ensuite, il vous suffit de placer l'extrait exact à modifier dans le champ "Texte à chercher (1)" et la nouvelle version dans le champ "À remplacer par (2)". L'outil gère parfaitement les sauts de ligne et les indentations complexes.
À chaque validation, l'action est sauvegardée dans le panneau d'historique (Panneau Droit). Ce journal conserve un instantané exact de l'état "Avant" et "Après" de votre code. Vous pouvez à tout moment créer une "Version" (Majeure V2.0.0 ou Mineure V1.1.0) pour figer un jalon de votre travail. Si vous faites fausse route, vous pouvez cliquer sur un ancien état et "Créer une branche" pour remonter le temps. Enfin, l'intégralité de ce projet (code, historique complet, couleurs) peut être exportée et sauvegardée dans un fichier JSON léger, puis rouverte plus tard pour reprendre exactement là où vous vous étiez arrêté.

### 6.2. L'Injection Automatisée (Les Requêtes IA)

Au lieu de faire ces manipulations à la main, vous pouvez demander à votre assistant IA de générer une "Requête". Il s'agit d'un bloc de texte préformaté qui contient toutes les instructions de remplacement. Rogue Cherry lit ce bloc, remplit les champs automatiquement et prépare l'opération en un clin d'œil.
Pour que l'outil comprenne l'IA sans ambiguïté, la syntaxe de base utilise des balises strictes : `##SYNTAX_COPIE##`, `##FIND##`, `##REPLACE##` et `##END_COPIE##`.
La requête inclut également des paramètres d'action, actuellement définis par le tag MULTI. Il peut être réglé sur `[MULTI:FALSE]` (sécurité maximale, une seule occurrence isolée est autorisée) ou cibler des index précis comme `[MULTI:1,3]`. À l'avenir, cette syntaxe évoluera pour supporter le traitement par lots (`##[MULTISTACK REQUEST]##`) ou l'ajout de métadonnées pour documenter les choix de l'IA (`##Commentaire##`).

### 6.3. Protocole de Crise : Erreur de Syntaxe

Que se passe-t-il si l'IA se trompe et génère une requête mal formée (par exemple, en oubliant la balise de fin ou en utilisant des caractères interdits) ? L'interface ne plantera pas. Si vous collez une requête corrompue, Rogue Cherry la bloque et ouvre automatiquement le **"Smart Debugger"**, une fenêtre de survie superposée.
Dans cet espace isolé, un analyseur syntaxique colore votre requête en temps réel. S'il y a une erreur, la coloration s'arrête exactement sur le caractère fautif. Cela vous permet de corriger manuellement la balise cassée par l'IA avant de réinjecter proprement l'instruction validée dans le système principal.

### 6.4. Protocole de Crise : Échec de la Recherche (Find)

L'autre erreur fréquente de l'IA est de vous proposer un texte à chercher qui ne correspond pas *exactement* à votre document (un espace en trop, un retour à la ligne manquant). Là encore, l'outil vous alerte ("0 occurrence trouvée") et vous propose d'ouvrir la modale de débogage.
Dans ce mode, vous bénéficiez d'une vision **"Rayons-X"** qui affiche les caractères invisibles (espaces, tabulations, sauts de ligne) pour repérer facilement les anomalies. Si la recherche échoue toujours, l'outil active son mode de **"Recherche Nuancée" (Heatmap)** : il scanne votre code et met en évidence par un dégradé (du vert fluo au rouge) les zones qui ressemblent presque à ce que vous cherchez. Vous repérez ainsi instantanément le mot ou l'espace qui bloque la procédure.

### 6.5. Tactiques Avancées : Multi-Occurrence et Audit IA

L'option de multi-occurrence a été pensée pour une productivité chirurgicale. Si vous cherchez un terme générique et que l'outil trouve 50 résultats, vous n'êtes pas obligé de tout remplacer aveuglément.
Une fois la recherche effectuée, un panneau dynamique (ComboListBox) apparaît sur la gauche. Il liste les occurrences et indique leur position. Vous disposez alors de deux méthodes pour affiner votre ciblage :

- **Sélection via la liste :** Cliquez sur un élément de la liste pour centrer automatiquement la vue de l'éditeur sur cette zone, puis cochez ou décochez la case correspondante.

- **Sélection interactive dans le code :** En parcourant directement votre document source, vous pouvez cliquer sur les occurrences surlignées en jaune pour les activer ou les désactiver à la volée, sans quitter le code des yeux.

Si vous utilisez la syntaxe IA de Cherry-Picking (`[MULTI:1,3,8]`), les cibles définies par l'IA seront pré-cochées. Mais comment être certain que l'agent n'a pas commis d'erreur d'interprétation ? C'est ici qu'intervient le bouton **"AUDIT IA 🤖"**.
En un clic, Rogue Cherry extrait les occurrences sélectionnées accompagnées de leur contexte immédiat (10 lignes de code avant et après) et place ce rapport structuré dans votre presse-papier. Il vous suffit de coller ce rapport dans votre conversation avec l'IA et de lui demander de confirmer formellement ses cibles. Vous verrouillez ainsi la fiabilité de la modification avant même d'appuyer sur le bouton "Remplacer".

> *(Note de sécurité : Si vous devez un jour patcher la documentation de Rogue Cherry elle-même, l'usage des balises standards créera un conflit avec le texte. Le système prévoit une balise d'échappement `[REQMODIFIER]` pour inventer vos propres balises à la volée.)*

---

## 7. DÉPLOIEMENT & LÉGENDE

### 7.1. Déploiement Rapide

- Téléchargez le fichier `index.html`.

- Double-cliquez.

- Vous êtes opérationnel. Aucune installation requise.

### 7.2. Charte Visuelle

L'interface de Rogue Cherry est codée pour projeter sa fonction :

- **Deep Charcoal (#1E1E1E) :** Le socle terminal.

- **Rouge Cerise (#D16969) :** L'état brut, le danger, le code non traité.

- **Jaune Électrique (#FFD700) :** Le radar, la cible identifiée (FIND).

- **Electric Purple (#9E67BA) :** L'injection réussie, le code muté (REPLACE).

> **Note de la Direction Artistique :** L'UI utilise Segoe UI pour la navigation, mais exige strictement Consolas (Monospace) pour les zones de texte afin de garantir l'alignement mathématique parfait des calques de "Diffing".
