# Module : Landing Pages & Vitrines

> Guide d'architecture pour les sites marketing, les portfolios, ou les pages de capture d'e-mail.

## Enjeux spécifiques
Ici, il n'y a pas ou peu de données complexes à gérer. L'objectif est 100% visuel et marketing : 
- Il faut éblouir l'utilisateur (Animations).
- Il faut charger la page en moins de 1 seconde (Performance).
- Il faut optimiser le SEO et l'Accessibilité.

## Stack recommandée
- **Animations** : Framer Motion (Le standard React pour les animations fluides).
- **Framework Global** : Next.js ou Vite (si SEO géré autrement).
- **Styling** : Tailwind CSS.

## Architecture

```
src/
├── sections/            ← Une Landing Page est un empilement de sections pleines pages
│   ├── Hero.jsx         ← La première chose qu'on voit ("Above the fold")
│   ├── Features.jsx     ← Les arguments de vente
│   ├── Testimonials.jsx ← Preuve sociale
│   ├── Pricing.jsx      ← Tarifs
│   └── Footer.jsx
├── components/
│   └── ui/              ← Boutons Call To Action (CTA), Animations textuelles
```

## Bonnes Pratiques Landing Page

1. **Le "Above the Fold"** : Ce qui s'affiche à l'écran avant que l'utilisateur ne scrolle. Ne chargez JAMAIS d'image lourde ici, optimisez le LCP (Largest Contentful Paint).
2. **Micro-Interactions** : Un bouton "Acheter" sur une landing page ne doit pas être inerte. Utilisez Tailwind pour qu'il réagisse au survol (`hover:scale-105 transition-transform`).
3. **Scroll Reveal** : Utilisez Framer Motion (`whileInView`) pour faire apparaître les éléments doucement lorsque l'utilisateur scrolle vers le bas. Cela donne un aspect extrêmement "Premium" au site.
