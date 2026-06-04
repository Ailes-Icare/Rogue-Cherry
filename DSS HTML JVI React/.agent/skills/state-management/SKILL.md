---
name: React State Management
description: Comment gérer les données et l'état de l'application proprement
---

# Skill : React State Management

> [!NOTE] 
> **🔄 MIGRATION REACT :** Remplace l'ancienne gestion de données (Data Management en Python) qui reposait sur des fichiers JSON locaux. Ici, l'accent est mis sur le cycle de vie de la donnée en mémoire côté client.

## Objectif
Savoir structurer la donnée. Contrairement au backend où tout est lu/écrit en base de données, l'interface web possède un "état" (State) qui change dynamiquement (boutons cliqués, formulaires remplis) et déclenche des re-rendus.

## 1. État Local vs État Global

**L'état Local (`useState`) :**
À utiliser pour les données qui ne concernent qu'un seul composant.
*Exemples* : Un menu déroulant ouvert ou fermé, le texte tapé dans un input avant soumission, l'onglet actuellement sélectionné.

**L'état Global (Context API, Zustand) :**
À utiliser pour les données partagées entre plusieurs pages ou composants distants.
*Exemples* : Le thème (clair/sombre), les données de l'utilisateur connecté, le contenu du panier d'achat.

> **Règle** : Toujours commencer par un état local. Ne passer en global que si c'est strictement nécessaire (pour éviter le cauchemar du prop-drilling).

## 2. L'État des Appels API (Fetch State)

Un appel API ou réseau n'a pas seulement besoin de stocker la donnée finale. L'interface a besoin de connaître son statut pour être fluide !

❌ **Mauvaise gestion (trop basique) :**
```jsx
const [data, setData] = useState(null);
useEffect(() => {
  fetchData().then(setData);
}, []);
```
*Problème :* L'utilisateur voit un écran vide pendant le chargement. S'il y a une erreur, l'app crashe silencieusement.

✅ **Bonne gestion (La Trinité du Fetch) :**
Toujours avoir 3 variables d'état pour les données distantes :
```jsx
const [data, setData] = useState(null);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  setIsLoading(true);
  fetchData()
    .then(setData)
    .catch(setError)
    .finally(() => setIsLoading(false));
}, []);
```

## 3. Dérivations plutôt que synchronisations

L'erreur numéro 1 en React est d'essayer de synchroniser deux états (via un `useEffect`) alors qu'on pourrait simplement déduire l'un à partir de l'autre.

❌ **Mauvais (Redondance et bugs de synchro) :**
```jsx
const [items, setItems] = useState([1, 2, 3]);
const [total, setTotal] = useState(6);

useEffect(() => {
  // Mauvaise idée ! Un re-rendu inutile est déclenché.
  setTotal(items.reduce((a, b) => a + b, 0));
}, [items]);
```

✅ **Bon (Dérivation pure) :**
```jsx
const [items, setItems] = useState([1, 2, 3]);
// La valeur est calculée à la volée, c'est gratuit et instantané en React !
const total = items.reduce((a, b) => a + b, 0); 
```
Si le calcul est extrêmement lourd, utilisez `useMemo`. Mais par défaut, dérivez simplement les variables !
