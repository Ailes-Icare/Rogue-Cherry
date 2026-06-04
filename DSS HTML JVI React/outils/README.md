# Outils MCP — Analyseur de Code React SDD

Serveur MCP d'analyse statique pour projets **React / JavaScript / TypeScript**. 
Il fournit 7 outils utilisés automatiquement par l'IA dans les workflows SDD pour auditer votre application Web.

## 🛠️ Tutoriel d'installation (Pour Néophytes)

Puisque ce serveur est codé en **Python** (pour des raisons de simplicité et de puissance de scripting), vous devez avoir Python installé sur votre machine, même si votre projet est en React.

### Étape 1 : Installer Python
1. Téléchargez Python sur [python.org/downloads](https://www.python.org/downloads/).
2. Lancez l'installateur. **CRITIQUE : Cochez la case "Add Python to PATH"** en bas de la fenêtre d'installation avant de cliquer sur "Install Now".
3. Laissez l'installation se terminer.

### Étape 2 : Installer la librairie MCP
Ouvrez un terminal (PowerShell ou Invite de commandes) et tapez :
```powershell
pip install fastmcp
```

### Étape 3 : Configurer votre Agent (Antigravity, Claude, etc.)
L'agent IA a besoin de savoir où se trouve ce serveur. Vous devez éditer la configuration de l'agent (généralement dans un fichier `mcp_config.json` ou via les paramètres de l'application).

Exemple de configuration :
```json
{
  "mcpServers": {
    "analyseur-code-react": {
      "command": "python",
      "args": ["C:/Chemin/Vers/Votre/Projet/outils/analyseur_code.py"]
    }
  }
}
```

---

## Tools disponibles

| Tool | Description | Workflows React |
|------|------------|-----------|
| `arborescence_react` | Arborescence avec stats (lignes, alertes si > 150L) | `/audit`, `/optimize-all`, `/integrate-all` |
| `rapport_composants` | Liste les composants React et les Custom Hooks | `/implement`, `/review` |
| `detecter_anti_patterns` | Traque le CSS inline, `document.getElementById`, et hooks massifs | `/audit`, `/review` |
| `dependances_react` | Graphe d'imports internes (quel composant importe quoi) | `/integrate-all` |
| `imports_inutiles_js` | Imports non utilisés dans les fichiers JSX/JS | `/optimize-all` |
| `doublons_composants` | Composants ou Hooks portant le même nom | `/implement` |
| `couverture_tests_react` | Fichiers sans `.test.jsx` associé | `/audit` |

## Pourquoi Python et pas Node.js ?

Pour un projet React, Node.js serait le choix "natif". L'avantage de Node.js est qu'il peut générer un Abstract Syntax Tree (AST) parfait du code JSX.
Cependant, Python a été retenu ici pour sa légèreté d'exécution. Nous utilisons des Expressions Régulières (Regex) puissantes pour lire le JavaScript. C'est amplement suffisant pour notre niveau d'audit et cela permet de garder un serveur ultra rapide et facile à modifier.
