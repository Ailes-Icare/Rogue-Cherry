# Bug Report : Cascade de doublons Multistack

**Statut** : 🟢 Résolu
**Date de résolution** : Juin 2026

## 1. Description du Bug
Lors de l'application d'une pile de requêtes (Multistack), le moteur s'emballait de manière incontrôlable, provoquant une "cascade de doublons". Les requêtes de la pile étaient appliquées de manière désordonnée et répétitive, corrompant gravement l'historique et le texte source. Ce problème était connu pour être extrêmement difficile à éliminer et réapparaissait souvent.

## 2. Cause Technique (Root Cause)
La cause racine provenait de la boucle d'exécution asynchrone du moteur Multistack dans le `useEffect` de `App.jsx` chargé de surveiller l'état `pendingRequests` et `activeStackIndex`.

Dans l'implémentation défectueuse, le code utilisait une fonction interne `async function processNext()` pour traiter la requête suivante. Cependant, l'appel de `setTimeout` pour déclencher le délai d'interface était encapsulé à l'intérieur, et le `useEffect` retournait le résultat de cette fonction asynchrone (une Promesse) au lieu de retourner la fonction de nettoyage classique.

Par conséquent :
1. Le React effect retournait une Promise plutôt que l'ID du timeout (via `clearTimeout`).
2. Lors du re-rendu de `App.jsx` (causé par le changement d'état après l'application d'une requête de la pile), le mécanisme de nettoyage de React (`cleanup function`) ne parvenait pas à annuler le timer précédent.
3. Des dizaines de boucles d'exécution asynchrones s'instanciaient en parallèle sans jamais être détruites, créant des conditions de course (Race Conditions) où plusieurs requêtes tentaient d'être appliquées simultanément sur le même état.

## 3. Méthode de Résolution
La solution consistait à isoler strictement la gestion du timer (synchrone) de l'exécution du travail de la requête (asynchrone).

Le code dans `App.jsx` a été refactoré de la manière suivante :
- L'appel au `setTimeout` a été remonté directement dans le corps principal du `useEffect` (synchrone).
- La fonction `async processNext()` a été gardée uniquement pour le corps de travail exécuté **à l'intérieur** du timeout.
- Le `useEffect` retourne désormais correctement une vraie fonction de nettoyage : `return () => clearTimeout(timer);`.

Grâce à cette modification, chaque fois que l'index de la pile (`activeStackIndex`) ou l'historique change, React nettoie proprement le timer précédent avant d'en relancer un nouveau, garantissant qu'une seule instance de la boucle d'exécution Multistack est active à un instant donné.

---
*Ce document sert de trace mémorielle pour s'assurer que les futurs développements (notamment les changements sur la gestion des états de l'application) ne réintroduisent pas de boucle asynchrone mal nettoyée dans l'orchestrateur de `App.jsx`.*
