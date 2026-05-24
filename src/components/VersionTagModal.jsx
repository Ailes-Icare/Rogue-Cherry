import React, { useState, useEffect } from 'react';
import { formatVersionString, incrementRank } from '../utils/versionEngine.js';

export default function VersionTagModal({ 
  isOpen, 
  onClose, 
  initialConfig, 
  currentVersion,
  onSaveConfig, 
  onForceIncrement,
  isInitMode = false,
  projectName = "",
  onChangeProjectName
}) {
  const [ranks, setRanks] = useState([]);
  const [autoIndex, setAutoIndex] = useState(0);

  // Synchronisation à l'ouverture
  useEffect(() => {
    if (isOpen && initialConfig) {
      // On copie profondément les rangs pour l'édition
      setRanks(JSON.parse(JSON.stringify(initialConfig.ranks)));
      setAutoIndex(initialConfig.autoIncrementIndex);
    }
  }, [isOpen, initialConfig]);

  if (!isOpen) return null;

  const currentPreview = formatVersionString(ranks);
  const autoPreview = formatVersionString(incrementRank(ranks, autoIndex));

  const handleRankChange = (index, field, value) => {
    const newRanks = [...ranks];
    if (field === 'type') {
      newRanks[index].type = value;
      // Réinitialisation par défaut selon le type
      if (value === 'numeric') newRanks[index].value = 0;
      else if (value === 'alpha') newRanks[index].value = 'A';
      else if (value === 'fixed') newRanks[index].value = 'V';
    } else {
      newRanks[index][field] = value;
    }
    setRanks(newRanks);
  };

  const handleAddRank = () => {
    setRanks([...ranks, { type: 'numeric', value: 0, separator: '.' }]);
  };

  const handleRemoveRank = (index) => {
    if (ranks.length <= 1) return; // Sécurité : au moins un rang
    const newRanks = ranks.filter((_, i) => i !== index);
    setRanks(newRanks);
    // Ajustement de l'autoIndex si on supprime le rang suivi ou un avant
    if (autoIndex >= newRanks.length) setAutoIndex(newRanks.length - 1);
  };

  const handleSave = () => {
    onSaveConfig({ ranks, autoIncrementIndex: autoIndex }, isInitMode ? currentPreview : null);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black bg-opacity-70 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-bg-panel border border-border-dark w-[650px] shadow-2xl rounded-md overflow-hidden flex flex-col font-sans">
        
        {/* EN-TÊTE */}
        <div className="bg-[#2d2d30] px-4 py-3 border-b border-border-dark flex justify-between items-center select-none">
          <div className="font-bold text-[#d4d4d4] flex items-center gap-2">
            🏷️ {isInitMode ? "INITIALISATION DE LA VERSION" : "CONFIGURATION DU VERSIONING"}
          </div>
          {!isInitMode && (
            <button onClick={onClose} className="text-[#888] hover:text-white transition cursor-pointer">✕</button>
          )}
        </div>

        {/* CORPS */}
        <div className="p-5 flex flex-col gap-6 overflow-y-auto max-h-[70vh]">
          
          {isInitMode && (
            <div className="flex flex-col gap-4 bg-[#222] border border-border-dark p-4 text-sm rounded-sm">
              <div className="text-[#eed]">
                <strong>Bienvenue !</strong> Pour importer votre premier code source, veuillez définir son nom ainsi que le format de versioning que vous souhaitez utiliser pour la version de départ.
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-[#888] font-bold uppercase">Nom du projet (Optionnel)</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => onChangeProjectName(e.target.value)}
                  className="bg-[#111] text-[#d4d4d4] text-sm border border-[#444] rounded w-full py-1.5 px-2 outline-none focus:border-primary-blue transition"
                  placeholder="Ex: MonSuperProjet"
                />
              </div>
            </div>
          )}

          {/* Constructeur de Format */}
          <div className="flex flex-col gap-3">
            <h3 className="text-[#aaa] text-xs font-bold uppercase tracking-wider">Structure des Rangs</h3>
            
            <div className="flex flex-col gap-2">
              {ranks.map((rank, idx) => (
                <div key={idx} className={`flex items-center gap-2 p-2 rounded-sm border ${autoIndex === idx ? 'border-primary-blue bg-[#0e2941]' : 'border-border-dark bg-bg-dark'}`}>
                  
                  {/* Séparateur */}
                  <div className="flex flex-col w-12">
                    <span className="text-[10px] text-[#888] mb-1">Séparateur</span>
                    <input 
                      type="text" 
                      value={rank.separator} 
                      onChange={(e) => handleRankChange(idx, 'separator', e.target.value)}
                      className="bg-[#222] text-white text-xs text-center border border-[#444] rounded w-full py-1 outline-none"
                    />
                  </div>

                  {/* Type */}
                  <div className="flex flex-col w-28">
                    <span className="text-[10px] text-[#888] mb-1">Type</span>
                    <select 
                      value={rank.type} 
                      onChange={(e) => handleRankChange(idx, 'type', e.target.value)}
                      className="bg-[#222] text-white text-xs border border-[#444] rounded w-full py-1 px-1 outline-none"
                    >
                      <option value="fixed">Fixe (Texte)</option>
                      <option value="numeric">Numérique (1,2..)</option>
                      <option value="alpha">Alpha (A,B..)</option>
                    </select>
                  </div>

                  {/* Valeur initiale / Actuelle */}
                  <div className="flex flex-col flex-1">
                    <span className="text-[10px] text-[#888] mb-1">{isInitMode ? "Valeur de départ" : "Valeur actuelle"}</span>
                    <input 
                      type={rank.type === 'numeric' ? 'number' : 'text'} 
                      value={rank.value} 
                      onChange={(e) => handleRankChange(idx, 'value', e.target.value)}
                      className="bg-[#222] text-[#9cdcfe] font-mono font-bold text-xs border border-[#444] rounded w-full py-1 px-2 outline-none"
                    />
                  </div>

                  {/* Options (Auto-incrément + Sauts manuels) */}
                  <div className="flex items-end gap-2 h-full pb-[2px]">
                    <button 
                      type="button"
                      onClick={() => setAutoIndex(idx)}
                      className={`text-[10px] px-2 py-1 rounded border font-bold transition ${autoIndex === idx ? 'bg-primary-blue text-white border-primary-blue' : 'bg-transparent text-[#aaa] border-[#444] hover:border-primary-blue'}`}
                      title="Ce rang s'incrémentera automatiquement à chaque modification"
                    >
                      {autoIndex === idx ? '✓ AUTO' : 'AUTO'}
                    </button>

                    {!isInitMode && (rank.type === 'numeric' || rank.type === 'alpha') && (
                      <button 
                        type="button"
                        onClick={() => onForceIncrement(idx)}
                        className="text-[10px] bg-[#3a3d41] hover:bg-[#ff8c00] hover:text-white text-[#d4d4d4] px-2 py-1 rounded border border-[#555] font-bold transition"
                        title="Forcer un saut de version sur ce rang (Majeur/Mineur)"
                      >
                        +1 SAUT
                      </button>
                    )}

                    <button 
                      type="button"
                      onClick={() => handleRemoveRank(idx)}
                      disabled={ranks.length === 1}
                      className="text-[#ff5555] hover:bg-[#ff555522] px-2 py-0.5 rounded transition disabled:opacity-30"
                      title="Supprimer ce rang"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button 
              type="button"
              onClick={handleAddRank}
              className="text-xs text-[#aaa] hover:text-white hover:bg-[#333] border border-dashed border-[#555] rounded py-1.5 transition mt-1"
            >
              + Ajouter un sous-rang
            </button>
          </div>

          {/* Aperçu Final */}
          <div className="bg-[#1e1e1e] p-4 border border-[#333] rounded-md shadow-inner flex justify-between items-center">
            <div>
              <div className="text-[10px] text-[#888] uppercase mb-1">Aperçu de la version actuelle</div>
              <div className="text-xl font-mono font-black text-hl-yellow tracking-wider">{currentPreview}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-[#888] uppercase mb-1">Aperçu prochaine auto-incrémentation</div>
              <div className="text-xl font-mono font-black text-[#20b2aa] tracking-wider">{autoPreview}</div>
            </div>
          </div>

        </div>

        {/* PIED DE MODALE */}
        <div className="bg-[#2d2d30] px-4 py-3 border-t border-border-dark flex justify-end gap-3 select-none">
          {!isInitMode && (
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-sm font-bold text-[#d4d4d4] bg-transparent border border-[#555] rounded hover:bg-[#444] transition"
            >
              Annuler
            </button>
          )}
          <button 
            type="button"
            onClick={handleSave}
            className="px-6 py-1.5 text-sm font-bold text-white bg-primary-blue hover:bg-primary-blue-hover rounded shadow-md transition"
          >
            {isInitMode ? "VALIDER ET IMPORTER LE CODE" : "SAUVEGARDER LA CONFIGURATION"}
          </button>
        </div>

      </div>
    </div>
  );
}
