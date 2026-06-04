---
description: Moteur de réflexion systémique — valider la logique et la solidité d'une UI/Architecture web
---

# /think — Réflexion systémique

## Quand utiliser
- **Avant de coder** un système React complexe (panier E-commerce, Dashboard avec filtres croisés)
- **Après un `/plan`** pour stress-tester l'UI avant de passer aux specs
- **Quand ça sent mauvais** — "Il y a trop de `useEffect`, ça boucle à l'infini" ou "L'interface clignote bizarrement"
- **Après un bug complexe** pour analyser pourquoi le state s'est désynchronisé.

## Les deux missions

| Mission | Question centrale en Web Dev |
|---------|-------------------|
| **Logique** | L'utilisateur peut-il coincer l'interface dans un état impossible ? |
| **Solidité** | Le flux de données (State/Props) va-t-il résister aux re-renders ? |

---

## Étapes

### 1. Identifier le sujet
Définir précisément ce qu'on analyse :

```
🎯 Sujet de réflexion

Type : [gestion d'état | flux utilisateur | composant critique | architecture globale]
Nom  : [ex: "Processus de paiement (Checkout)"]
Scope : [un composant | un contexte global | tout le projet]
Contexte : [Nouveau feature, bug de désynchronisation de panier, etc.]
```

### 2. Cartographier le système Frontend
Lire le code et lister :

- **Les Acteurs** : Hooks, Contextes, Composants, API externe.
- **Les Flux (Data Flow)** : Comment la donnée descend (Props) ou remonte (Callbacks).
- **Les États (UI States)** : Loading, Error, Success, Idle.

*Exemple de Dashboard E-commerce :*
```
📋 Cartographie (Panier)

Acteurs :
  - NavbarCart (affiche le total)
  - CheckoutPage (affiche le formulaire)
  - useCartStore (Zustand : stocke les items)
  - API (/api/checkout)

Flux :
  CheckoutPage modifie quantité → useCartStore se met à jour → NavbarCart re-render
  CheckoutPage envoie requete → API répond → Vider useCartStore

États :
  Panier : Vide → Rempli → En cours de paiement (Verrouillé) → Succès
```

### 3. Questions systémiques Web (Le stress-test)
Passer le sujet au crible de ces questions propres aux applications web :

#### 3a. Cohérence visuelle et logique (Single Source of Truth)
- [ ] Le **panier** affiche-t-il le même prix dans la `Navbar` et sur la page `Checkout` ? (Problème de source de vérité).
- [ ] Les **boutons primaires** utilisent-ils tous le même composant partagé ou ont-ils été recréés 4 fois ?

#### 3b. Cas limites & Edge Cases (Le cauchemar du réseau)
- [ ] **Déconnexion réseau** : Que se passe-t-il si l'API crashe ou si le wifi coupe pendant le paiement ?
- [ ] **Double-clic frénétique** : Si l'utilisateur clique 3 fois sur "Acheter" pendant que ça charge, l'API est-elle appelée 3 fois ? (Problème de `disabled` ou `debouncing`).
- [ ] **État vide (Empty State)** : Que se passe-t-il si on ouvre le Dashboard d'une entreprise fraîchement créée qui n'a encore aucune donnée à afficher ?

#### 3c. Désynchronisation du State
- [ ] Si l'utilisateur ouvre le site sur **deux onglets différents**, et vide son panier dans l'onglet A, que se passe-t-il quand il clique sur Acheter dans l'onglet B ?
- [ ] Une donnée est-elle stockée en double (ex: `items` et `totalCount` stockés manuellement au lieu de dériver `totalCount = items.length`) ?

#### 3d. Scaling & Performance (Re-renders)
- [ ] Si j'ai 1000 produits dans le catalogue, la page fige-t-elle ? (Besoin de virtualisation ou pagination).
- [ ] Si j'utilise un `Context API` global pour stocker le nom de l'utilisateur ET la position de sa souris, est-ce que toute l'application se re-render à chaque mouvement de souris ?

### 4. Scénarios de Stress-Test
Inventer 2 scénarios concrets et les dérouler pas à pas :

```
🧪 Scénario 1 : "L'API est lente et l'utilisateur est impatient"
Déroulement :
1. L'utilisateur clique sur "Ajouter au panier". L'API met 3 secondes à répondre.
2. L'UI ne montre aucun spinner immédiat (l'état isLoading est déclenché trop tard).
3. Croyant que ça n'a pas marché, l'utilisateur clique sur "Accueil" (changement de route).
4. La page d'accueil charge. Soudain, l'API répond et le composant (qui n'existe plus) tente de faire un setState().

Faille trouvée ? OUI
Conséquence : Fuite de mémoire (Memory Leak) et erreur React "Can't perform a React state update on an unmounted component".
```

### 5. Identifier les failles et Proposer des corrections
Compiler les résultats :

```
🔴 Failles de logique (Critique)
  F-1 : Le bouton "Payer" n'est pas désactivé pendant le loading réseau (risque de double débit).
  → Correction : Ajouter prop `disabled={isLoading}` au bouton.

🟡 Failles de solidité (Performance)
  F-2 : La liste des produits déclenche un re-render complet du Layout à chaque filtre tapé.
  → Correction : Isoler l'état du filtre de recherche dans un sous-composant ou utiliser useMemo.
```

### 6. Rapport et validation
Générer un rapport et le soumettre à l'utilisateur.

## Règles
- **Toujours tester le réseau.** Dans une app web, le réseau est lent, instable, et imprévisible. Le design doit en tenir compte.
- **Toujours tester les inputs.** Les utilisateurs taperont du texte là où on attend des nombres.
- **Pas de "il faudrait réfléchir à..."** Soyez prescriptif : "L'absence d'un AbortController sur ce useEffect va causer un bug de race-condition."

## ✅ Checklist de sortie
- [ ] Cartographie des Hooks/Composants concernés ?
- [ ] Analyse des Edge Cases réseau (Lenteur, Erreur API) ?
- [ ] Au moins 2 scénarios déroulés ?
- [ ] Actions correctives de code proposées ?
