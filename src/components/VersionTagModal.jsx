import React, { useState, useEffect } from 'react';
import { formatVersionString, incrementRank, parseVersionStringToRanks } from '../utils/versionEngine.js';

export default function VersionTagModal({ 
  isOpen, 
  onClose, 
  initialConfig, 
  currentVersion,
  onSaveConfig, 
  onForceIncrement,
  onBranchReset,
  onBranchFromParent,
  mode = 'init', // 'init', 'upVersion', 'branch'
  projectName = "",
  onChangeProjectName,
  onRename
}) {
  const [ranks, setRanks] = useState([]);
  const [autoIndex, setAutoIndex] = useState(0);
  const [showNameError, setShowNameError] = useState(false);
  const [localProjectName, setLocalProjectName] = useState("");
  const [localPrefix, setLocalPrefix] = useState("");
  const [initialPrefixState, setInitialPrefixState] = useState("");
  const [interactionMode, setInteractionMode] = useState('increment'); // 'increment', 'rename', 'changePattern'
  const [freezeArchive, setFreezeArchive] = useState(false);

  // Synchronisation à l'ouverture
  useEffect(() => {
    if (isOpen) {
      if (initialConfig) {
        let initialRanks = JSON.parse(JSON.stringify(initialConfig.ranks));
        
        if (mode !== 'init' && currentVersion) {
          // En mode Update/Branch, on s'aligne sur la VRAIE dernière version
          let parsedRanks = parseVersionStringToRanks(currentVersion, initialRanks);
          
          if (parsedRanks.length > 0 && parsedRanks[0].type === 'fixed') {
            const val = parsedRanks[0].value;
            if (val.endsWith('V') && val.length > 1) {
              const pref = val.substring(0, val.length - 1).trim();
              setLocalPrefix(pref);
              setInitialPrefixState(pref);
              parsedRanks[0].value = 'V';
            } else if (val === 'V') {
              setLocalPrefix("");
              setInitialPrefixState("");
            }
          }
          setRanks(parsedRanks);
        } else {
          // En mode init, on utilise la config par défaut
          if (initialRanks.length > 0 && initialRanks[0].type === 'fixed') {
            const val = initialRanks[0].value;
            if (val.endsWith('V') && val.length > 1) {
              const pref = val.substring(0, val.length - 1).trim();
              setLocalPrefix(pref);
              setInitialPrefixState(pref);
              initialRanks[0].value = 'V';
            } else if (val === 'V') {
              setLocalPrefix("");
              setInitialPrefixState("");
            }
          }
          setRanks(initialRanks);
        }
        
        setAutoIndex(initialConfig.autoIncrementIndex);
      }
      setLocalProjectName(projectName);
      setInteractionMode('increment'); // Réinitialise l'onglet par défaut
      setFreezeArchive(false); // Reset checkbox
    }
  }, [isOpen, initialConfig, projectName, mode, currentVersion]);

  if (!isOpen) return null;

  const getProcessedRanks = () => {
    if (!ranks || ranks.length === 0) return [];
    const processed = JSON.parse(JSON.stringify(ranks));
    if (processed.length > 0 && processed[0].type === 'fixed') {
      processed[0].value = localPrefix ? `${localPrefix} V` : 'V';
    }
    return processed;
  };

  const currentPreview = formatVersionString(getProcessedRanks());
  const autoPreview = formatVersionString(incrementRank(getProcessedRanks(), autoIndex));

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

  const handleSaveInit = () => {
    if (mode !== 'init') return;
    if (!localProjectName || localProjectName.trim() === "") {
      setShowNameError(true);
      setTimeout(() => setShowNameError(false), 1500);
      return;
    }
    onSaveConfig({ ranks: getProcessedRanks(), autoIncrementIndex: autoIndex }, currentPreview, localProjectName.trim());
  };

  const handleActionIncrement = (index) => {
    onForceIncrement(index, getProcessedRanks(), autoIndex, localProjectName.trim(), freezeArchive);
  };

  const handleActionRename = () => {
    if (onRename) {
      onRename(getProcessedRanks(), autoIndex, localProjectName.trim(), projectName, freezeArchive);
    }
  };

  const isRenameDirty = localProjectName.trim() !== projectName || localPrefix !== initialPrefixState;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black bg-opacity-70 flex items-center justify-center backdrop-blur-sm"
      onKeyDown={(e) => { 
        if (e.key === 'Enter') {
          if (mode === 'init') handleSaveInit();
          if (mode !== 'init' && interactionMode === 'rename' && isRenameDirty) handleActionRename();
        } 
      }}
    >
      <div className="bg-bg-panel border border-border-dark w-[650px] shadow-2xl rounded-md overflow-hidden flex flex-col font-sans">
        
        {/* EN-TÊTE */}
        <div className="bg-[#2d2d30] px-4 py-3 border-b border-border-dark flex justify-between items-center select-none">
          <div className="font-bold text-[#d4d4d4] flex items-center gap-2">
            🏷️ {mode === 'init' ? "INITIALISATION DE LA VERSION" : mode === 'branch' ? "CRÉATION DE BRANCHE" : "MISE À JOUR DE VERSION"}
          </div>
          {mode !== 'init' && (
            <button onClick={onClose} className="text-[#888] hover:text-white transition cursor-pointer">✕</button>
          )}
        </div>

        {/* TABS DES MODES D'INTERACTION */}
        {mode !== 'init' && (
          <div className="bg-[#2d2d30] px-4 flex border-b border-border-dark select-none gap-1">
            <button
              onClick={() => setInteractionMode('increment')}
              className={`px-4 py-2 text-xs font-bold transition border-b-2 ${interactionMode === 'increment' ? 'border-primary-blue text-white bg-[#3a3d41]' : 'border-transparent text-[#888] hover:bg-[#3a3d41] hover:text-[#d4d4d4]'}`}
            >
              Incrémenter
            </button>
            <button
              onClick={() => setInteractionMode('rename')}
              className={`px-4 py-2 text-xs font-bold transition border-b-2 ${interactionMode === 'rename' ? 'border-primary-blue text-white bg-[#3a3d41]' : 'border-transparent text-[#888] hover:bg-[#3a3d41] hover:text-[#d4d4d4]'}`}
            >
              Renommer
            </button>
            <button
              onClick={() => setInteractionMode('changePattern')}
              className={`px-4 py-2 text-xs font-bold transition border-b-2 ${interactionMode === 'changePattern' ? 'border-primary-blue text-white bg-[#3a3d41]' : 'border-transparent text-[#888] hover:bg-[#3a3d41] hover:text-[#d4d4d4]'}`}
            >
              Changer de motif
            </button>
          </div>
        )}

        {/* CORPS */}
        <div className="p-5 flex flex-col gap-6 overflow-y-auto max-h-[70vh]">
          
          <div className={`flex flex-col gap-4 bg-[#222] p-4 text-sm rounded-sm border ${mode !== 'init' && interactionMode === 'rename' ? 'border-primary-blue shadow-[0_0_10px_rgba(0,122,204,0.3)]' : 'border-border-dark'}`}>
            {mode === 'init' && (
              <div className="text-[#eed] mb-2">
                <strong>Bienvenue !</strong> Pour importer votre premier code source, veuillez définir son nom ainsi que le format de versioning que vous souhaitez utiliser pour la version de départ.
              </div>
            )}
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase text-hl-yellow">Nom du projet {mode === 'init' ? '(Obligatoire)' : ''}</label>
              <input
                type="text"
                autoFocus={mode === 'init'}
                value={localProjectName}
                disabled={mode !== 'init' && interactionMode === 'increment'}
                onChange={(e) => {
                  setLocalProjectName(e.target.value);
                  if (showNameError) setShowNameError(false);
                }}
                onBlur={(e) => {
                  if (mode === 'init') {
                    const btn = document.getElementById('btn-validate-init');
                    if (btn) btn.focus();
                  }
                }}
                className={`bg-[#111] text-[#d4d4d4] text-sm border rounded w-full py-1.5 px-2 outline-none transition-all duration-300 ${
                  showNameError 
                    ? 'border-hl-yellow shadow-[0_0_10px_rgba(255,215,0,0.6)]' 
                    : 'border-[#444] focus:border-primary-blue'
                } ${mode !== 'init' && interactionMode === 'increment' ? 'opacity-50 cursor-not-allowed' : ''}`}
                placeholder="Ex: MonSuperProjet"
                spellCheck="false"
              />
            </div>

            {(mode === 'upVersion' || mode === 'branch') && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase text-hl-yellow">Préfixe de version (Optionnel)</label>
                <input
                  type="text"
                  autoFocus
                  value={localPrefix}
                  disabled={interactionMode === 'increment'}
                  onChange={(e) => setLocalPrefix(e.target.value)}
                  className={`bg-[#111] text-[#d4d4d4] text-sm border border-[#444] focus:border-primary-blue rounded w-full py-1.5 px-2 outline-none transition-all duration-300 ${interactionMode === 'increment' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  placeholder="Ex: ALPHA, BETA, RELEASE..."
                  spellCheck="false"
                />
              </div>
            )}
          </div>

          {/* Constructeur de Format */}
          <div className="flex flex-col gap-3">
            <h3 className="text-[#aaa] text-xs font-bold uppercase tracking-wider">Structure des Rangs</h3>
            
            <div className={`flex flex-col gap-2 ${mode !== 'init' && interactionMode === 'rename' ? 'opacity-50 pointer-events-none select-none' : ''}`}>
              {ranks.map((rank, idx) => {
                const isAutoLine = autoIndex === idx;
                const isIncrementMode = mode !== 'init' && interactionMode === 'increment';
                const isRenameMode = mode !== 'init' && interactionMode === 'rename';
                const isLineDisabled = isIncrementMode && isAutoLine;
                
                // Si on est en RenameMode, la ligne complète doit avoir l'air neutre (grise)
                const borderBgClass = isAutoLine 
                  ? (isRenameMode ? 'border-border-dark bg-[#1a1a1a]' : (isIncrementMode ? 'border-[#444] bg-[#1a1a1a] opacity-80' : 'border-primary-blue bg-[#0e2941]'))
                  : 'border-border-dark bg-bg-dark';

                return (
                <div key={idx} className={`flex items-center gap-2 p-2 rounded-sm border ${borderBgClass}`}>
                  
                  {/* Séparateur */}
                  <div className="flex flex-col w-12">
                    <span className="text-[10px] text-[#888] mb-1">Séparateur</span>
                    <input 
                      type="text" 
                      value={rank.separator} 
                      disabled={isIncrementMode}
                      onChange={(e) => handleRankChange(idx, 'separator', e.target.value)}
                      className={`bg-[#222] text-white text-xs text-center border border-[#444] rounded w-full py-1 outline-none ${isIncrementMode ? 'opacity-50 cursor-not-allowed' : 'focus:border-primary-blue'}`}
                    />
                  </div>

                  {/* Type */}
                  <div className="flex flex-col w-28">
                    <span className="text-[10px] text-[#888] mb-1">Type</span>
                    <select 
                      value={rank.type} 
                      disabled={isIncrementMode}
                      onChange={(e) => handleRankChange(idx, 'type', e.target.value)}
                      className={`bg-[#222] text-white text-xs border border-[#444] rounded w-full py-1 px-1 outline-none ${isIncrementMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <option value="fixed">Fixe (Texte)</option>
                      <option value="numeric">Numérique (1,2..)</option>
                      <option value="alpha">Alpha (A,B..)</option>
                    </select>
                  </div>

                  {/* Valeur initiale / Actuelle */}
                  <div className="flex flex-col flex-1">
                    <span className="text-[10px] text-[#888] mb-1">{mode === 'init' ? "Valeur de départ" : "Valeur actuelle"}</span>
                    <input 
                      type={rank.type === 'numeric' ? 'number' : 'text'} 
                      value={rank.value} 
                      disabled={isIncrementMode}
                      onChange={(e) => handleRankChange(idx, 'value', e.target.value)}
                      className={`bg-[#222] text-[#9cdcfe] font-mono font-bold text-xs border border-[#444] rounded w-full py-1 px-2 outline-none ${isIncrementMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                  </div>

                  {/* Options (Auto-incrément + Sauts manuels) */}
                  <div className="flex items-end gap-2 h-full pb-[2px]">
                    <button 
                      type="button"
                      disabled={isIncrementMode}
                      onClick={() => setAutoIndex(idx)}
                      className={`text-[10px] px-2 py-1 rounded border font-bold transition ${isAutoLine ? (isRenameMode ? 'bg-transparent text-[#aaa] border-[#444]' : 'bg-primary-blue text-white border-primary-blue') : 'bg-transparent text-[#aaa] border-[#444] hover:border-primary-blue'} ${isIncrementMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title="Ce rang s'incrémentera automatiquement à chaque modification"
                    >
                      {isAutoLine ? '✓ AUTO' : 'AUTO'}
                    </button>

                    {mode !== 'init' && (rank.type === 'numeric' || rank.type === 'alpha') && (
                      <button 
                        type="button"
                        disabled={isLineDisabled}
                        onClick={() => handleActionIncrement(idx)}
                        className={`text-[10px] px-2 py-1 rounded border font-bold transition ${isLineDisabled ? 'bg-[#222] text-[#555] border-[#444] opacity-50 cursor-not-allowed' : (isRenameMode ? 'bg-[#3a3d41] text-[#d4d4d4] border-[#555]' : 'bg-primary-blue hover:bg-primary-blue-hover text-white border-primary-blue')}`}
                        title={isLineDisabled ? "L'incrémentation automatique gère ce rang" : `Incrémenter : ${formatVersionString(incrementRank(getProcessedRanks(), idx))}`}
                      >
                        INCRÉMENTER
                      </button>
                    )}

                    <button 
                      type="button"
                      onClick={() => handleRemoveRank(idx)}
                      disabled={ranks.length === 1 || isIncrementMode}
                      className="text-[#ff5555] hover:bg-[#ff555522] px-2 py-0.5 rounded transition disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Supprimer ce rang"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )})}
            </div>

            <button 
              type="button"
              disabled={mode !== 'init' && interactionMode !== 'changePattern'}
              onClick={handleAddRank}
              className={`text-xs border border-dashed rounded py-1.5 transition mt-1 ${(mode !== 'init' && interactionMode !== 'changePattern') ? 'text-[#555] border-[#444] opacity-50 cursor-not-allowed' : 'text-[#aaa] hover:text-white hover:bg-[#333] border-[#555]'}`}
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
        <div className="bg-[#2d2d30] px-4 py-3 border-t border-border-dark flex justify-between items-center select-none">
          
          <div className="flex gap-2 items-center">
            {mode !== 'init' && (
              <label className="flex items-center gap-2 text-xs font-bold text-[#d4d4d4] cursor-pointer hover:text-white mr-4">
                <input 
                  type="checkbox" 
                  checked={freezeArchive} 
                  onChange={(e) => setFreezeArchive(e.target.checked)} 
                  className="accent-primary-blue w-4 h-4 cursor-pointer"
                />
                FIGER L'ARCHIVE (SAVE)
              </label>
            )}

            {mode === 'branch' && interactionMode !== 'rename' && (
              <>
                <button 
                  type="button"
                  onClick={() => onBranchReset(getProcessedRanks(), autoIndex, localProjectName.trim(), freezeArchive)}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-cherry-red hover:bg-cherry-red-hover rounded shadow-md transition"
                >
                  Remettre à zéro
                </button>
                <button 
                  type="button"
                  onClick={() => onBranchFromParent(getProcessedRanks(), autoIndex, localProjectName.trim(), freezeArchive)}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#0e2941] border border-primary-blue hover:bg-primary-blue rounded shadow-md transition"
                >
                  Repartir de la branche
                </button>
              </>
            )}
          </div>

          <div className="flex gap-3">
            {mode !== 'init' && interactionMode === 'rename' && isRenameDirty && (
              <button 
                type="button"
                onClick={handleActionRename}
                className="px-6 py-1.5 text-sm font-bold text-white bg-primary-blue hover:bg-primary-blue-hover rounded shadow-md transition animate-pulse"
              >
                VALIDER LE RENOMMAGE
              </button>
            )}

            {mode !== 'init' && (
              <button 
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 text-sm font-bold text-[#d4d4d4] bg-transparent border border-[#555] rounded hover:bg-[#444] transition"
              >
                Annuler
              </button>
            )}
            {mode === 'init' && (
              <button 
                id="btn-validate-init"
                type="button"
                onClick={handleSaveInit}
                className="px-6 py-1.5 text-sm font-bold text-white bg-primary-blue hover:bg-primary-blue-hover rounded shadow-md transition"
              >
                VALIDER ET IMPORTER LE CODE
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
