---
description: Créer, modifier ou supprimer un composant du kit SDD
---

# /kit — Gestion du kit SDD

## Quand utiliser
- Pour étendre les capacités de l'agent (ajouter un workflow, modifier une règle).

## Sous-commandes
```
/kit nouveau [type] [nom]
/kit modifier [type] [nom]
/kit supprimer [type] [nom]
```

## Principe de fonctionnement
La structure du kit SDD (fichiers `.md` dans `.agent/`) est sacrée. Si l'utilisateur demande à modifier un workflow (par exemple `implement.md` pour le rendre encore plus strict), l'agent modifie directement le fichier markdown associé.

## Checklists par Mode

### Mode `/kit nouveau`
- Vérifier s'il n'existe pas déjà un workflow/skill similaire.
- Créer le fichier avec le bon Frontmatter YAML (ex: `trigger: always_on` pour les rules).
- Documenter dans `README.md` et `help.md`.

### Mode `/kit modifier`
- Appliquer le changement minimal sans dénaturer la fonction première du workflow.
- Mettre à jour l'en-tête (description) si nécessaire.

### Mode `/kit supprimer`
- Vérifier si ce workflow est appelé par d'autres workflows. S'il est orphelin, le supprimer.
- Nettoyer les compteurs et tableaux dans `help.md`.

## ✅ Checklist de sortie
- [ ] Fichier correctement manipulé (Markdown propre) ?
- [ ] Répercussions propagées sur les fichiers d'aide ?
