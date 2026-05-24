import React, { useState, useEffect } from 'react';
import { DEFAULT_SYNTAX } from '../utils/textParser.js';

/**
 * Modale de configuration personnalisée pour les balises de requêtes IA.
 * 
 * @param {Object} props - Les propriétés du composant.
 * @param {boolean} props.isOpen - Contrôle de visibilité de la modale.
 * @param {function} props.onClose - Fermeture de la modale.
 * @param {Object} props.syntaxConfig - Configuration courante { START, FIND, REPLACE, END }.
 * @param {function(Object)} props.onSave - Action lors de la validation des paramètres.
 * @returns {JSX.Element|null}
 */
export default function SettingsModal({ isOpen, onClose, syntaxConfig, onSave }) {
  const [startTag, setStartTag] = useState(DEFAULT_SYNTAX.START);
  const [findTag, setFindTag] = useState(DEFAULT_SYNTAX.FIND);
  const [replaceTag, setReplaceTag] = useState(DEFAULT_SYNTAX.REPLACE);
  const [endTag, setEndTag] = useState(DEFAULT_SYNTAX.END);

  // Synchronisation avec l'état parent à l'ouverture
  useEffect(() => {
    if (isOpen && syntaxConfig) {
      setStartTag(syntaxConfig.START);
      setFindTag(syntaxConfig.FIND);
      setReplaceTag(syntaxConfig.REPLACE);
      setEndTag(syntaxConfig.END);
    }
  }, [isOpen, syntaxConfig]);

  if (!isOpen) return null;

  const handleReset = () => {
    setStartTag(DEFAULT_SYNTAX.START);
    setFindTag(DEFAULT_SYNTAX.FIND);
    setReplaceTag(DEFAULT_SYNTAX.REPLACE);
    setEndTag(DEFAULT_SYNTAX.END);
  };

  const handleValidate = () => {
    // Vérification que les balises ne sont pas vides
    if (!startTag.trim() || !findTag.trim() || !replaceTag.trim() || !endTag.trim()) {
      alert("Erreur : Les balises ne peuvent pas être vides.");
      return;
    }
    onSave({
      START: startTag.trim(),
      FIND: findTag.trim(),
      REPLACE: replaceTag.trim(),
      END: endTag.trim()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 z-[1050] flex justify-center items-center p-4">
      <div className="bg-bg-panel w-full max-w-[400px] border border-primary-blue rounded-md shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-3.5 bg-bg-dark border-b border-border-dark">
          <span className="text-[1.15em] font-bold text-[#20b2aa] uppercase">⚙️ PARAMÈTRES SYNTAXE</span>
          <button 
            onClick={onClose} 
            className="bg-cherry-red hover:bg-cherry-red-hover text-white font-bold px-2 py-0.5 rounded text-xs transition duration-150"
          >
            X
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col p-4 gap-3.5 text-sm">
          <div className="flex flex-col gap-1">
            <label className="text-[#aaa] text-xs font-semibold">Balise de Début</label>
            <input 
              type="text" 
              value={startTag} 
              onChange={(e) => setStartTag(e.target.value)} 
              className="bg-bg-dark border border-border-dark text-[#d4d4d4] px-2 py-1.5 font-mono text-xs rounded outline-none focus:border-[#20b2aa] transition"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[#aaa] text-xs font-semibold">Balise Recherche (FIND)</label>
            <input 
              type="text" 
              value={findTag} 
              onChange={(e) => setFindTag(e.target.value)} 
              className="bg-bg-dark border border-border-dark text-[#d4d4d4] px-2 py-1.5 font-mono text-xs rounded outline-none focus:border-[#20b2aa] transition"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[#aaa] text-xs font-semibold">Balise Remplacement (REPLACE)</label>
            <input 
              type="text" 
              value={replaceTag} 
              onChange={(e) => setReplaceTag(e.target.value)} 
              className="bg-bg-dark border border-border-dark text-[#d4d4d4] px-2 py-1.5 font-mono text-xs rounded outline-none focus:border-[#20b2aa] transition"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[#aaa] text-xs font-semibold">Balise de Fin</label>
            <input 
              type="text" 
              value={endTag} 
              onChange={(e) => setEndTag(e.target.value)} 
              className="bg-bg-dark border border-border-dark text-[#d4d4d4] px-2 py-1.5 font-mono text-xs rounded outline-none focus:border-[#20b2aa] transition"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-bg-dark border-t border-border-dark flex justify-between gap-3">
          <button 
            onClick={handleReset} 
            className="bg-cherry-red hover:bg-cherry-red-hover text-white text-xs font-bold px-3 py-1.5 rounded transition"
          >
            🔄 Reset
          </button>
          <button 
            onClick={handleValidate} 
            className="bg-primary-blue hover:bg-primary-blue-hover text-white text-xs font-bold px-4 py-1.5 rounded transition"
          >
            VALIDER
          </button>
        </div>

      </div>
    </div>
  );
}
