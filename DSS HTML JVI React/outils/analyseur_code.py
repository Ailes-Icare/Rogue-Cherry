# analyseur_code.py — Serveur MCP d'analyse statique de code React
# Fait partie du kit SDD. Point d'entrée qui enregistre les 7 tools.
#
# Installation : pip install fastmcp
# Usage : python analyseur_code.py

import sys
from pathlib import Path
from fastmcp import FastMCP

# Le dossier outils/ doit être dans le PYTHONPATH pour les imports
sys.path.insert(0, str(Path(__file__).parent))

# Importer les fonctions de chaque module
from _mcp_arborescence import arborescence_react
from _mcp_rapport import rapport_composants
from _mcp_anti_patterns import detecter_anti_patterns
from _mcp_dependances import dependances_react
from _mcp_imports_inutiles import imports_inutiles_js
from _mcp_doublons import doublons_composants
from _mcp_couverture import couverture_tests_react

# Créer l'instance MCP et enregistrer les tools
mcp = FastMCP("Analyseur de Code React SDD")

mcp.tool()(arborescence_react)
mcp.tool()(rapport_composants)
mcp.tool()(detecter_anti_patterns)
mcp.tool()(dependances_react)
mcp.tool()(imports_inutiles_js)
mcp.tool()(doublons_composants)
mcp.tool()(couverture_tests_react)


if __name__ == "__main__":
    mcp.run()
