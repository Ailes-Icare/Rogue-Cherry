# Module : Desktop Apps (Applications Bureau)

> Guide architectural pour packager une application Web en application logicielle pour Windows, macOS ou Linux.

## Frameworks recommandés

| Framework | Langages natifs | Poids de l'app | Avantages |
|---|---|---|---|
| **Tauri** (Recommandé) | Rust + JS/React | ~5 MB | Ultra léger, très rapide, consomme très peu de RAM. |
| **Electron** | Node.js + JS/React | ~150 MB | Standard de l'industrie (VSCode, Discord), écosystème immense. |

## Le Concept "IPC" (Inter-Process Communication)

Une app Desktop est divisée en deux mondes strictement étanches :
1. **Frontend (React)** : Ne peut afficher que des boutons. N'a PAS le droit de lire le disque dur.
2. **Backend (Rust / Node.js)** : Peut lire le disque, parler à des clés USB, mais n'a pas d'interface.

Pour que React lise un fichier, il doit envoyer un "message" (IPC) au backend.

## Structure Type (Tauri)

```
Projet/
├── src-tauri/           ← Backend Rust (Accès OS, Fichiers, Hardware)
│   ├── src/main.rs      ← Point d'entrée Rust
│   └── tauri.conf.json  ← Configuration de la fenêtre Desktop
├── src/                 ← Frontend React (Vite)
│   ├── components/      
│   ├── features/
│   └── ipc/             ← Dossier vital : Wrappers pour communiquer avec Rust
```

## Bonnes Pratiques React Desktop

1. **Context Menu** : Désactiver le clic droit du navigateur par défaut, et créer un vrai menu contextuel natif.
2. **Window Controls** : Cacher la barre Windows par défaut (frameless) et créer sa propre `<TitleBar>` en React avec des boutons "Fermer" et "Réduire".
3. **Mise à jour (Auto-Updater)** : Gérer les mises à jour en tâche de fond pour une expérience fluide.
