"""Tests pour le MCP analyseur de code React.

Teste les nouveaux outils (arborescence_react, detecter_anti_patterns, etc.)
en générant un faux projet React temporaire (fichiers .jsx et .js).
"""
import os
import sys
import tempfile
import textwrap

import pytest

# Ajouter le dossier outils/ au path pour importer le nouveau MCP
sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), '..', 'outils')
)

from _mcp_utils import collecter_fichiers_react
from _mcp_arborescence import arborescence_react
from _mcp_rapport import rapport_composants
from _mcp_anti_patterns import detecter_anti_patterns
from _mcp_dependances import dependances_react
from _mcp_imports_inutiles import imports_inutiles_js
from _mcp_doublons import doublons_composants
from _mcp_couverture import couverture_tests_react

@pytest.fixture
def projet_react_temp(tmp_path):
    """Crée un mini-projet React temporaire pour les tests."""
    
    # 1. Un composant propre
    (tmp_path / "Header.jsx").write_text(textwrap.dedent("""\
        import React from 'react';
        import { useTheme } from './useTheme';

        export default function Header() {
            const theme = useTheme();
            return <header className="bg-blue-500">Logo</header>;
        }
    """), encoding='utf-8')

    # 2. Un Custom Hook
    (tmp_path / "useTheme.js").write_text(textwrap.dedent("""\
        export const useTheme = () => {
            return "dark";
        }
    """), encoding='utf-8')

    # 3. Un Composant rempli d'anti-patterns
    (tmp_path / "BadComponent.jsx").write_text(textwrap.dedent("""\
        import React, { useState, useEffect } from 'react';
        import Header from './Header';
        import { isOk } from './utils'; // import inutilisé

        const BadComponent = () => {
            // Anti-pattern: manipulation DOM
            const element = document.getElementById("bad-div");
            
            // Anti-pattern: CSS inline
            return (
                <div style={{ backgroundColor: 'red', marginTop: '20px' }} id="bad-div">
                    <Header />
                </div>
            );
        }
        export default BadComponent;
    """), encoding='utf-8')

    # 4. Fichier avec doublon de composant (Règle 9)
    # Header est défini ici ET dans Header.jsx
    (tmp_path / "HeaderClone.jsx").write_text(textwrap.dedent("""\
        const Header = () => {
            return <div>Fake Header</div>
        }
    """), encoding='utf-8')

    # 5. Fichiers de test
    tests_dir = tmp_path / "__tests__"
    tests_dir.mkdir()
    (tests_dir / "Header.test.jsx").write_text(textwrap.dedent("""\
        test('renders header', () => {
            expect(true).toBe(true);
        });
    """), encoding='utf-8')

    return tmp_path

# === Tests des 7 tools React ===

class TestArborescenceReact:
    def test_compte_fichiers(self, projet_react_temp):
        resultat = arborescence_react(str(projet_react_temp))
        assert "Header.jsx" in resultat
        assert "BadComponent.jsx" in resultat
        assert "✅ Aucun fichier ne dépasse" in resultat # Pas de gros fichiers ici

class TestRapportComposants:
    def test_trouve_composants_et_hooks(self, projet_react_temp):
        resultat = rapport_composants(str(projet_react_temp))
        assert "Header (Composant)" in resultat
        assert "useTheme (Custom Hook)" in resultat
        assert "BadComponent (Composant)" in resultat

class TestDetecterAntiPatterns:
    def test_detecte_erreurs_frontend(self, projet_react_temp):
        resultat = detecter_anti_patterns(str(projet_react_temp))
        # Doit trouver document.getElementById
        assert "document.getElement" in resultat
        assert "BadComponent.jsx" in resultat
        # Doit trouver le CSS inline
        assert "CSS Inline" in resultat
        assert "style={{" in resultat

class TestDependancesReact:
    def test_detecte_imports(self, projet_react_temp):
        resultat = dependances_react(str(projet_react_temp))
        # BadComponent importe Header
        assert "Header" in resultat
        # Header importe useTheme
        assert "useTheme" in resultat

class TestImportsInutiles:
    def test_detecte_import_non_utilise(self, projet_react_temp):
        resultat = imports_inutiles_js(str(projet_react_temp))
        # isOk est importé mais pas utilisé dans BadComponent
        assert "isOk" in resultat
        assert "BadComponent.jsx" in resultat

class TestDoublonsComposants:
    def test_detecte_composant_en_double(self, projet_react_temp):
        resultat = doublons_composants(str(projet_react_temp))
        # Le composant 'Header' existe dans Header.jsx et HeaderClone.jsx
        assert "Header" in resultat
        assert "Header.jsx" in resultat
        assert "HeaderClone.jsx" in resultat

class TestCouvertureTestsReact:
    def test_verifie_couverture(self, projet_react_temp):
        resultat = couverture_tests_react(str(projet_react_temp))
        # Header a un Header.test.jsx (donc couvert)
        assert "Header.jsx (Pas de test trouvé)" not in resultat
        # BadComponent n'a PAS de test
        assert "BadComponent.jsx (Pas de test trouvé)" in resultat
