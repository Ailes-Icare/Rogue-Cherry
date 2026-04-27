# Rogue-Cherry

🍒 ROGUE CHERRY
Semantic Injection. Zero Dependency.

🛡️ Environment: Restricted-Safe | ⚡ Dependencies: Zero-JS-Library | 🛰️ Status: Alpha V2 (V7.4.9)

1. MISSION BRIEFING : A QUOI CA SERT ?

2. L'OUTIL DE TERRAIN
Rogue Cherry n'est pas né d'une volonté de concurrencer les IDE lourds du marché. C'est un outil de survie technique, conçu pour opérer dans des environnements où vous n'avez pas les droits d'administration sur sa machine.

Quand le système verrouille vos accès, Rogue Cherry est le scalpel que vous sortez de votre poche : un fichier HTML unique, 100% autonome, sans aucune bibliothèque externe. L'objectif ? Effectuer des opérations de "Rechercher / Remplacer" (Patching Sémantique) strictes, sécurisées et traçables, propulsées par l'intelligence artificielle.

Le texte en entrée est brut. L'injection est chirurgicale.

3. FIELD OPERATIONS (USER STORIES)

🛠️ Opération Alpha : Refactoring Code Source (Ingénierie)
Situation : Vous maintenez un script Python ou JS de 5000 lignes sur un poste restreint. L'IA vous propose un refactoring d'une fonction clé utilisée à 3 endroits différents.
Action : L'IA génère la requête avec [MULTI:1,3]. Vous collez la requête dans Rogue Cherry. L'outil surligne les occurrences en Jaune Électrique. Vous validez. Le moteur DraftSurge opère la Reverse Loop, remplace les occurrences sans briser le reste du fichier, et tag l'action en Violet (Electric Purple) dans l'historique.

📝 Opération Beta : The Living Doc (Documentation)
Situation : Vous devez mettre à jour une architecture complexe documentée dans un énorme fichier Markdown (comme ce DAT).
Action : Vous utilisez la fonction Le Cadenas. La vue Texte 3 s'encadre de rouge vif et devient éditable. Vous modifiez le texte à la main. À la fermeture, Rogue Cherry génère des "Requêtes Fantômes" en comparant votre travail avec le Snapshot initial, puis stocke proprement l'évolution dans la pile d'historique.

✒️ Opération Gamma : Semantic Cleansing (Révision de texte brut)
Situation : Un long rapport juridique ou littéraire en français contient un paragraphe erroné. Le mot à corriger ("contrat") apparaît 50 fois, mais seule la 12ème et 14ème occurrence doivent être modifiées.
Action : Vous insérez le texte source. Vous demandez un Cherry-Picking manuel. L'outil génère la liste des 50 occurrences. Vous cochez les numéros 12 et 14. L'outil nettoie la zone sans toucher aux 48 autres termes, garantissant une intégrité sémantique parfaite.

4. ARSENAL TACTIQUE (FONCTIONNALITÉS)
🎯 Le Cherry-Picking Sémantique
Le paramètre [MULTI:TRUE] est souvent trop destructeur. Rogue Cherry introduit le ciblage d'index via la syntaxe [MULTI:1,3,8].

Sélectionnez chirurgicalement les occurrences à modifier via une ComboListBox dynamique.

Vérification visuelle instantanée grâce à la gouttière intelligente (Gutter) qui place des repères (● et ▶) sur les lignes impactées.

Possibilité de générer un Audit IA 🤖 dans le presse-papier pour valider le contexte (+/- 10 lignes) avant exécution.

🛡️ Smart Debugger (Modale de Survie)
Une requête IA hallucinée ? Le Smart Debugger intercepte les erreurs dans un bac à sable isolé (z-index: 1000).

Fail-Fast Tokenizer : L'analyseur lexical colore la requête en temps réel et s'arrête exactement au caractère invalide.

Vision Rayons-X : Affichage explicite des caractères invisibles (espaces ·, tabulations →, sauts de ligne ↵) pour débusquer les erreurs de formatage.

Recherche Nuancée (Heatmap) : Si la recherche exacte échoue, l'algorithme dichotomique localise les correspondances partielles et affiche un dégradé (du Vert 100% au Rouge <50%).

🛰️ Time-Travel & MultiStack
Historisation Git-Like : Le panneau droit conserve chaque action (Majeure, Mineure, ou Retour/Rollback) avec des mini-vues miroirs avant/après synchronisées.

MultiStack (Batch Processing) : Empilez les requêtes via la balise ##[MULTISTACK REQUEST]## pour automatiser une chaîne de modifications (Pré-test automatique en background).

5. LE CŒUR DU RÉACTEUR : MOTEUR DRAFTSURGE ⚡
Sous le capot, l'outil est propulsé par le moteur DraftSurge, une architecture algorithmique pensée pour la précision absolue et la sécurité des données :

100% Local (Zero-Dependency) : Le code ne quitte jamais votre poste. Aucune API tierce, aucune librairie JS externe. L'outil fonctionne en hors-ligne total.

Diffing Sémantique (Double Passe) : L'algorithme isole votre recherche et votre remplacement pour générer une matrice de différences (LCS), projetée mathématiquement sur le code source. Fini les artefacts visuels.

State Machine Incorruptible : L'interface n'est qu'une projection du DOM. La "vérité métier" est stockée dans un objet global state, rendant toute modification réversible et traçable.

Reverse Loop (Boucle Inverse) : Lors des remplacements multiples (Batch Processing), le moteur traite le document de la fin vers le début pour empêcher toute corruption des index mathématiques (Index Shifting).

6. STANDARD OPERATING PROCEDURE (SYNTAXE)
L'IA doit vous fournir les consignes dans un format standardisé, reconnaissable par notre parseur intraitable.

Règle d'or absolue : Ne jamais utiliser le formateur "trois accents graves" à l'intérieur du texte de la requête, sous peine de crash de l'interface.

Format Standard :

Mode Furtif (Stealth) :
Si vous devez patcher le document de documentation de Rogue Cherry lui-même, les balises standards feront un conflit. Utilisez l'amorce furtive :

7. DÉPLOIEMENT & LÉGENDE

Déploiement Rapide
Téléchargez le fichier index.html.

Double-cliquez.

Vous êtes opérationnel. Aucune installation requise.

Charte Visuelle
L'interface de Rogue Cherry est codée pour projeter sa fonction :

Deep Charcoal (#1E1E1E) : Le socle terminal.

Rouge Cerise (#D16969) : L'état brut, le danger, le code non traité.

Jaune Électrique (#FFD700) : Le radar, la cible identifiée (FIND).

Electric Purple (#9E67BA) : L'injection réussie, le code muté (REPLACE).

Note de la Direction Artistique : L'UI utilise Segoe UI pour la navigation, mais exige strictement Consolas (Monospace) pour les zones de texte afin de garantir l'alignement mathématique parfait des calques de "Diffing".
