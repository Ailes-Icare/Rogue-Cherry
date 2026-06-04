# Spécifications Frontend — [Nom du Projet]

> **Ce fichier est la source de vérité du projet.**  
> L'UI et le code React DOIVENT correspondre à ce qui est écrit ici.  
> Dernière mise à jour : [DATE]

## Table des matières

- [Feature 1: Barre de Navigation](#feature-1-barre-de-navigation)
- _Ajouter les features ici_

---

## Feature 1: Barre de Navigation

**Statut** : 🔴 Non implémenté

**Description** :
_Menu principal visible sur toutes les pages, permettant de naviguer et de voir son statut de connexion._

**Design / Layout (Tailwind)** :
- Header fixe en haut de la page (`fixed top-0`).
- Fond avec effet "Glassmorphism" (`bg-white/80 backdrop-blur-md`).
- Ombre légère en dessous (`shadow-sm`).

**États / Comportements (React)** :
- **État "Non connecté"** : Affiche les liens "Accueil", "À Propos", et un bouton "Se connecter".
- **État "Connecté"** : Affiche en plus "Mon Profil" et un avatar cliquable avec menu déroulant.
- **Hover** : Les liens changent de couleur au survol avec une transition douce (`transition-colors duration-200`).

**Responsive (Mobile)** :
- Sur écran `< 768px` : Les liens disparaissent et sont remplacés par une icône "Menu Hamburger" ouvrant un tiroir latéral (Sidebar).

**Données & APIs** :
- Le composant "écoute" l'état global `useAuthStore()` pour savoir si l'utilisateur est connecté.

**Critères de validation** :
- [ ] [CV-001] La navbar reste fixée en haut lors du défilement.
- [ ] [CV-002] Le bouton de connexion se transforme bien en Avatar une fois connecté.
- [ ] [CV-003] Le menu Hamburger s'affiche correctement sur mobile.
