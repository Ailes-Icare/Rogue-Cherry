---
name: Frontend Design Senior
description: Skill pour générer des interfaces de qualité supérieure, non-génériques
---

# Skill : Frontend Design Senior

> [!NOTE] 
> **🔄 MIGRATION REACT :** Ce skill est exclusif à l'écosystème web. Il interdit le "vibe coding" paresseux et force des choix de design "opinionated".

## Objectif
Produire des interfaces web (UI) qui ont l'air d'avoir été conçues par un designer professionnel senior, en évitant le style générique souvent généré par défaut par les IA (le fameux "AI-slop").

## 1. Bannissement du Design Générique

**❌ Ce qui est strictement interdit :**
- Les dégradés violets/bleus sans raison.
- La police système par défaut (Arial) ou l'utilisation par défaut de *Inter* / *Roboto* sans réflexion.
- Les grilles de "cartes" (cards) basiques centrées avec une ombre portée molle (`shadow-md` partout).
- Le texte gris clair sur fond gris foncé illisible.

**✅ Ce qui est exigé :**
- **Une direction artistique forte** : Avant de coder, définir si le style est *Brutaliste*, *Éditorial*, *Minimaliste Premium*, ou *SaaS moderne technique*.
- **Contraste absolu** : Le texte doit être lisible. Utiliser des contrastes marqués.
- **Bordures et ombres intentionnelles** : Soit tout plat (flat), soit des ombres très nettes et dures (brutalisme), soit des bordures subtiles (`border-zinc-200`).

## 2. Typographie de Caractère

La typographie fait 80% du design.
- Toujours choisir une police principale forte (ex: *Outfit*, *Space Grotesk*, *Playfair Display*, *Syne*).
- Ne pas avoir peur des textes très gros (Headings massifs) contrastant avec du texte fin.
- Gérer l'interlignage (`leading-tight` pour les titres, `leading-relaxed` pour les paragraphes).
- Utiliser le tracking (`tracking-tight` pour les gros titres).

## 3. Composition Spatiale et Asymétrie

- Éviter de tout centrer bêtement. L'asymétrie donne un aspect plus professionnel.
- Utiliser abondamment l'espace vide (Whitespace). N'ayez pas peur des marges `p-12` ou `gap-16`.
- Casser la grille de temps en temps pour un élément visuel fort.

## 4. Micro-animations et Interactivité

L'interface doit paraître "vivante".
- Tous les boutons/liens doivent avoir des états `:hover` et `:active` (ex: `hover:-translate-y-1 hover:shadow-lg transition-all`).
- Les éléments importants qui apparaissent doivent être animés subtilement (ex: un `fade-in-up`).
- Les temps de transition doivent être courts et percutants (ex: `duration-200 ease-out`).

## Exemple : Un bouton "Premium" Tailwind

❌ **Bouton IA classique :**
`className="bg-blue-500 text-white p-2 rounded"`

✅ **Bouton Senior :**
`className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-zinc-800 hover:ring-4 hover:ring-zinc-200 active:scale-95"`
