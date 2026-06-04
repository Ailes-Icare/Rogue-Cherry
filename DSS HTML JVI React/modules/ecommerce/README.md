# Module : E-Commerce

> Guide d'architecture pour la création de boutiques en ligne, catalogues, et tunnels de vente.

## Enjeux spécifiques
L'E-commerce exige deux choses fondamentales qui s'opposent souvent :
1. **Un SEO parfait** (pour que les fiches produits soient sur Google).
2. **Une interactivité fluide** (pour le panier, les filtres, le paiement).

## Stack recommandée
- **Framework Global** : Next.js (Obligatoire pour le SEO via Server-Side Rendering ou Static Site Generation). Un projet Vite classique ne sera pas indexé correctement par les moteurs de recherche pour un catalogue massif.
- **Paiement** : Stripe (Elements).
- **State Management** : Zustand (pour gérer l'état global du `<Cart>`).

## Architecture d'un E-Commerce

```
src/
├── app/                 ← Next.js App Router (Pages: /produits, /panier)
├── store/
│   └── useCartStore.js  ← Gère l'ajout, le retrait et le total du panier
├── features/
│   ├── checkout/        ← Tunnel de commande (Tunnel de conversion)
│   ├── product/         ← Affichage de la galerie produit et déclinaisons
│   └── search/          ← Algorithme de filtrage et recherche
├── components/
│   └── ui/              ← Boutons d'achat, mini-paniers, badges promo
```

## Le Tunnel de Commande (Checkout)

Le checkout est la partie la plus critique. Divisez-le en composants clairs et stricts :
1. Panier (Vérification des stocks).
2. Informations de Livraison (Formulaire avec validation stricte via `Zod` ou `React Hook Form`).
3. Paiement (Isolation sécurisée via Stripe).

## Le LocalStorage est votre ami
Si l'utilisateur ferme l'onglet, son panier ne doit pas disparaître. 
Demandez toujours à Zustand de **persister** le `useCartStore` dans le `localStorage` du navigateur.
