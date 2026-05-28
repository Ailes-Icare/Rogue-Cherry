# Instructions de Compilation — Rogue Cherry

> **À L'ATTENTION DE L'IA** : Ce fichier documente la procédure exacte pour compiler le projet Rogue Cherry depuis l'environnement de développement de l'utilisateur. Lis-le attentivement avant toute tentative de build.

## Environnement

- **OS** : Windows 11 Pro
- **Shell** : PowerShell (avec politique d'exécution de scripts **restreinte**)
- **Node.js** : Installé dans `C:\Program Files\nodejs\`
- **Bundler** : Vite (via `vite.config.js` à la racine du projet)
- **Plugin** : `vite-plugin-singlefile` — le build produit un **unique fichier `index.html`** dans `dist/`

## Problème connu

Les commandes `npm` et `npx` ne fonctionnent **PAS** directement dans PowerShell sur cette machine, car :

1. **`npm` / `npx` sans chemin** → `CommandNotFoundException` (pas dans le PATH du shell Gemini).
2. **Ajout au PATH puis appel `npm`** → PowerShell tente d'exécuter `npm.ps1` qui est bloqué par la politique d'exécution de scripts (`UnauthorizedAccess`).

## Commande qui fonctionne

```powershell
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH; & "C:\Program Files\nodejs\npm.cmd" run build
```

### Explication pas à pas

1. `$env:PATH = "C:\Program Files\nodejs;" + $env:PATH;` → Ajoute Node.js au PATH de la session courante (nécessaire pour que Vite trouve `node`).
2. `& "C:\Program Files\nodejs\npm.cmd"` → Appelle directement le fichier **`.cmd`** (et non `.ps1`) de npm, ce qui contourne la restriction d'exécution de scripts PowerShell.
3. `run build` → Exécute le script `build` défini dans `package.json`.

## Résultat attendu

```
> rogue-cherry@8.0.0 build
> vite build

vite v5.4.21 building for production...
transforming...
✓ 45 modules transformed.
rendering chunks...
[plugin vite:singlefile]
[plugin vite:singlefile] Inlining: index-XXXXXXXX.js
[plugin vite:singlefile] Inlining: style-XXXXXXXX.css
computing gzip size...
dist/index.html  ~265 kB │ gzip: ~79 kB
✓ built in ~2s
```

Le fichier final est **`dist/index.html`** — un seul fichier HTML autonome contenant tout le CSS et le JS inliné.

## Serveur de développement (non testé)

Si nécessaire, la commande serait probablement :

```powershell
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH; & "C:\Program Files\nodejs\npm.cmd" run dev
```

## Rappel important

- **Ne PAS utiliser** `npm run build` seul.
- **Ne PAS utiliser** `npx vite build` seul.
- **Toujours** utiliser la commande complète avec `& "C:\Program Files\nodejs\npm.cmd"`.
