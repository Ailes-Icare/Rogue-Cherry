import React, { useState, useRef, useEffect, useMemo } from 'react';
import Splitter from './Splitter.jsx';
import { computeLiveDiff } from '../utils/diffEngine.js';

// Rendu des segments de texte avec les balises CSS
function renderDiffSegment(text, marks) {
  if (!text) return "";
  if (!marks || marks.length === 0) return text;

  const sorted = [...marks].sort((a, b) => a.start - b.start);
  const elements = [];
  let lastIdx = 0;

  sorted.forEach((mark, index) => {
    if (mark.start > lastIdx) {
      elements.push(text.substring(lastIdx, mark.start));
    }
    const highlighted = text.substring(mark.start, mark.start + mark.length);
    elements.push(
      <mark key={`${index}-${mark.start}`} className={mark.type}>
        {highlighted}
      </mark>
    );
    lastIdx = mark.start + mark.length;
  });

  if (lastIdx < text.length) {
    elements.push(text.substring(lastIdx));
  }

  return elements;
}

/**
 * Panneau latéral droit : Gestionnaire de l'historique et des prévisualisations de différences.
 */
export default function SidebarRight({
  history,
  selectedIndex,
  onSelectIndex,
  onSaveProject,
  onLoadProject,
  onResetProject,
  onBranchOut,
  splitChars,
  width,
  onResizeWidth
}) {
  const [showMiniViews, setShowMiniViews] = useState(true);
  const [isSyncScroll, setIsSyncScroll] = useState(true);
  const [historyHeight, setHistoryHeight] = useState(250); // Hauteur par défaut en pixels pour la table d'historique

  const beforeScrollRef = useRef(null);
  const afterScrollRef = useRef(null);
  const isSyncingRef = useRef(false);

  // Synchronisation du défilement bidirectionnel (Scroll-Sync) des mini-views
  useEffect(() => {
    const elBefore = beforeScrollRef.current;
    const elAfter = afterScrollRef.current;
    if (!elBefore || !elAfter) return;

    const handleBeforeScroll = () => {
      if (!isSyncScroll || isSyncingRef.current) return;
      isSyncingRef.current = true;
      elAfter.scrollTop = elBefore.scrollTop;
      elAfter.scrollLeft = elBefore.scrollLeft;
      isSyncingRef.current = false;
    };

    const handleAfterScroll = () => {
      if (!isSyncScroll || isSyncingRef.current) return;
      isSyncingRef.current = true;
      elBefore.scrollTop = elAfter.scrollTop;
      elBefore.scrollLeft = elAfter.scrollLeft;
      isSyncingRef.current = false;
    };

    elBefore.addEventListener('scroll', handleBeforeScroll);
    elAfter.addEventListener('scroll', handleAfterScroll);

    return () => {
      elBefore.removeEventListener('scroll', handleBeforeScroll);
      elAfter.removeEventListener('scroll', handleAfterScroll);
    };
  }, [isSyncScroll, showMiniViews, selectedIndex]);

  // Calcule les textes et les diffs spécifiques à la version sélectionnée
  const activeRecordDetails = useMemo(() => {
    if (selectedIndex === -1 || !history[selectedIndex]) {
      return { type: 'none', beforeText: '', afterText: '', beforeMarks: [], afterMarks: [] };
    }

    const rec = history[selectedIndex];
    if (rec.type === 'snapshot') {
      return {
        type: 'snapshot',
        beforeText: '--- SNAPSHOT DE DÉPART ---',
        afterText: rec.rawText || '',
        beforeMarks: [],
        afterMarks: []
      };
    }

    // Diffing DraftSurge unitaire des requêtes FIND / REPLACE pour les mini-views
    const beforeText = rec.findStr || "";
    const afterText = rec.replaceStr || "";
    const { marksT1, marksT2 } = computeLiveDiff(beforeText, afterText, splitChars);

    return {
      type: 'replace',
      beforeText,
      afterText,
      beforeMarks: marksT1,
      afterMarks: marksT2
    };
  }, [history, selectedIndex, splitChars]);

  const handleBranchClick = () => {
    if (selectedIndex === -1 || !history[selectedIndex]) return;
    const currentVer = history[selectedIndex].version;
    const type = prompt(
      `${currentVer} (Sélectionnée).\nVoulez-vous passer à la version supérieure ?\n\nÉcrivez 'M' pour Majeur (VX.0.0),\n'm' pour Mineur (VX.Y.0),\nou '0' pour couper l'historique futur (retour arrière pur) :`
    );
    if (type === 'M' || type === 'm' || type === '0') {
      onBranchOut(type);
    } else if (type !== null) {
      alert("Option invalide. Veuillez saisir M, m ou 0.");
    }
  };

  const handleHistoryResize = (newY) => {
    const parentTop = document.getElementById('history-panel-root')?.getBoundingClientRect().top || 0;
    const height = newY - parentTop - 60; // Ajustement décalage boutons du haut
    if (height > 80 && height < window.innerHeight - 200) {
      setHistoryHeight(height);
    }
  };

  return (
    <div 
      id="history-panel-root"
      style={{ width: `${width}px` }} 
      className="flex-shrink-0 bg-bg-panel-light flex flex-col overflow-hidden min-w-[250px] p-2.5 gap-2.5"
    >
      
      {/* 1. Zone Supérieure: Boutons de Projet */}
      <div className="flex gap-2 h-14 flex-shrink-0">
        <button
          onClick={onSaveProject}
          className="flex-1 bg-bg-panel hover:border-primary-blue text-xs font-bold border border-border-dark flex flex-col justify-center items-center rounded-sm transition gap-1 duration-150"
          title="Sauvegarder le projet et tout l'historique dans un fichier JSON"
        >
          <span className="text-lg leading-none">💾</span>
          <span>SAVE</span>
        </button>
        <button
          onClick={onLoadProject}
          className="flex-1 bg-bg-panel hover:border-primary-blue text-xs font-bold border border-border-dark flex flex-col justify-center items-center rounded-sm transition gap-1 duration-150"
          title="Importer un projet Rogue Cherry à partir d'un fichier JSON"
        >
          <span className="text-lg leading-none">📂</span>
          <span>OPEN</span>
        </button>
        <button
          onClick={onResetProject}
          className="flex-1 bg-cherry-red hover:bg-cherry-red-hover text-xs font-bold border border-cherry-red flex flex-col justify-center items-center rounded-sm transition gap-1 duration-150 text-white"
          title="Vider et réinitialiser tout le projet"
        >
          <span className="text-lg leading-none">🔄</span>
          <span>RESET</span>
        </button>
      </div>

      {/* Titre Historique */}
      <div className="text-[1.3em] font-extrabold text-primary-blue tracking-wide uppercase select-none flex-shrink-0 mt-1">
        📚 HISTORIQUE DES VERSIONS
      </div>

      {/* 2. Tableau de la pile d'historique (3 colonnes) */}
      <div 
        style={{ height: showMiniViews ? `${historyHeight}px` : 'auto' }}
        className={`border border-border-dark bg-bg-dark rounded-sm overflow-y-auto ${showMiniViews ? 'flex-shrink-0' : 'flex-1'}`}
      >
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-bg-panel sticky top-0 z-10 select-none border-b border-border-dark text-[10px] text-[#888] uppercase tracking-wider">
            <tr>
              <th className="p-2 w-[25%]">Ver.</th>
              <th className="p-2 w-[50%]">Action / Label</th>
              <th className="p-2 w-[25%] text-right pr-3">Heure</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2d2d2d] font-sans">
            {history.length === 0 ? (
              <tr>
                <td colSpan="3" className="p-4 text-center text-[#666] italic">
                  Aucun historique.
                </td>
              </tr>
            ) : (
              history.map((rec, index) => (
                <tr
                  key={index}
                  onClick={() => onSelectIndex(index)}
                  className={`cursor-pointer transition duration-100 ${
                    index === selectedIndex
                      ? 'bg-[#37373d] border-l-4 border-primary-blue font-bold text-white'
                      : 'hover:bg-bg-panel text-text-light/90'
                  }`}
                >
                  <td className="p-2 font-mono text-[11px]">{rec.version}</td>
                  <td className="p-2 truncate max-w-[120px]" title={rec.action}>
                    {rec.action}
                  </td>
                  <td className="p-2 text-right pr-3 text-[#999] text-xs font-mono">
                    {rec.timestamp ? rec.timestamp.split(' ')[1] : ''}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 3. Séparateur & Option de liaison */}
      {showMiniViews && (
        <Splitter direction="horizontal" onResize={handleHistoryResize} />
      )}

      {/* Barre de contrôles des Mini-Views */}
      <div className="flex justify-between items-center text-xs flex-shrink-0 mt-1 select-none">
        <div className="bg-[#333] border border-dashed border-[#555] rounded px-2 py-1 text-[11px] text-[#888] italic">
          futures optimisations V2.0
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-[10px] text-[#aaa] font-bold">Détails (AVANT / APRÈS)</span>
          <div className="flex gap-2">
            <button
              onClick={() => setIsSyncScroll(!isSyncScroll)}
              className={`w-8 h-7 flex items-center justify-center rounded border transition text-base ${
                isSyncScroll
                  ? 'bg-[#2a2d2e] border-primary-blue text-white'
                  : 'bg-bg-dark border-border-dark text-[#777]'
              }`}
              title={isSyncScroll ? "Désactiver le défilement synchronisé des mini-views" : "Activer le défilement synchronisé (🔗)"}
            >
              {isSyncScroll ? '🔗' : '🔓'}
            </button>
            <button
              onClick={() => setShowMiniViews(!showMiniViews)}
              className="bg-bg-panel hover:bg-bg-dark border border-border-dark px-3 py-1 rounded text-[11px] font-bold text-[#d4d4d4]"
            >
              {showMiniViews ? 'Masquer ▲' : 'Afficher ▼'}
            </button>
          </div>
        </div>
      </div>

      {/* 4. Les Mini-Views AVANT / APRÈS */}
      {showMiniViews && (
        <div className="flex-1 flex flex-col gap-2 min-h-[120px]">
          {/* Mini-View AVANT (FIND) */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-bg-dark border border-border-dark rounded-sm">
            <div className="bg-bg-panel px-2.5 py-0.5 text-[10px] text-[#888] font-bold border-b border-border-dark uppercase tracking-wider text-left">
              AVANT (FIND)
            </div>
            <div className="flex-1 overflow-auto p-2 font-mono text-[10px] whitespace-pre text-left" ref={beforeScrollRef}>
              {activeRecordDetails.type === 'none' ? (
                <span className="text-[#555] italic">Aucune sélection</span>
              ) : activeRecordDetails.type === 'snapshot' ? (
                <span className="text-[#a34a4a] italic">{activeRecordDetails.beforeText}</span>
              ) : (
                renderDiffSegment(activeRecordDetails.beforeText, activeRecordDetails.beforeMarks)
              )}
            </div>
          </div>

          {/* Mini-View APRÈS (REPLACE) */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-bg-dark border border-border-dark rounded-sm">
            <div className="bg-bg-panel px-2.5 py-0.5 text-[10px] text-[#888] font-bold border-b border-border-dark uppercase tracking-wider text-left">
              APRÈS (REPLACE)
            </div>
            <div className="flex-1 overflow-auto p-2 font-mono text-[10px] whitespace-pre text-left" ref={afterScrollRef}>
              {activeRecordDetails.type === 'none' ? (
                <span className="text-[#555] italic">Aucune sélection</span>
              ) : activeRecordDetails.type === 'snapshot' ? (
                <span className="text-[#555] italic truncate select-all">{activeRecordDetails.afterText.substring(0, 300)}...</span>
              ) : (
                renderDiffSegment(activeRecordDetails.afterText, activeRecordDetails.afterMarks)
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Pile de boutons temporels */}
      <div className="flex gap-2 h-14 flex-shrink-0 mt-1 select-none">
        <button
          disabled={selectedIndex <= 0}
          onClick={() => onSelectIndex(selectedIndex - 1)}
          className="flex-1 bg-bg-panel hover:bg-bg-dark text-white border border-border-dark font-bold text-xs rounded transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Retourner à la version précédente"
        >
          ◀ Préc.
        </button>
        <button
          disabled={selectedIndex === -1 || selectedIndex === history.length - 1}
          onClick={handleBranchClick}
          className="flex-[2] bg-cherry-red hover:bg-cherry-red-hover text-white font-extrabold text-[11px] rounded transition duration-150 flex justify-center items-center gap-1.5 shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-center leading-tight"
          title="Créer une nouvelle branche à partir de cette version"
        >
          <span>CRÉER BRANCHE<br/>À PARTIR DE</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'scaleY(-1)' }}>
            <line x1="6" y1="3" x2="6" y2="15"></line>
            <circle cx="18" cy="6" r="3"></circle>
            <circle cx="6" cy="18" r="3"></circle>
            <path d="M18 9a9 9 0 0 1-9 9"></path>
          </svg>
        </button>
        <button
          disabled={selectedIndex === -1 || selectedIndex === history.length - 1}
          onClick={() => onSelectIndex(selectedIndex + 1)}
          className="flex-1 bg-bg-panel hover:bg-bg-dark text-white border border-border-dark font-bold text-xs rounded transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Avancer à la version suivante"
        >
          Suiv. ▶
        </button>
      </div>

    </div>
  );
}
