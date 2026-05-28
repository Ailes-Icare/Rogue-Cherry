import React, { useState, useRef, useEffect, useMemo } from 'react';
import Splitter from './Splitter.jsx';
import { computeLiveDiff } from '../utils/diffEngine.js';
import { useZoomable } from '../hooks/useZoomable.js';

// Rendu des segments de texte avec les balises CSS
// Approche par char-map : chaque caractère reçoit l'union de ses classes CSS.
// Gère correctement les marks qui se chevauchent (ex: hl-line-mod + hl-word-mod).
function renderDiffSegment(text, marks) {
  if (!text) return "";
  if (!marks || marks.length === 0) return text;

  // Étape 1 : Construire un tableau de classes pour chaque caractère
  const charClasses = new Array(text.length);
  for (let i = 0; i < text.length; i++) charClasses[i] = new Set();

  marks.forEach(mark => {
    if (mark.length === 0) return; // Marques de longueur 0 (curseur de suppression) ignorées visuellement
    for (let i = mark.start; i < mark.start + mark.length && i < text.length; i++) {
      charClasses[i].add(mark.type);
    }
  });

  // Étape 2 : Fusionner les caractères consécutifs ayant les mêmes classes
  const elements = [];
  let currentClasses = "";
  let currentText = "";
  let elementIndex = 0;

  const pushCurrent = () => {
    if (currentText) {
      if (currentClasses) {
        elements.push(
          <mark key={`seg-${elementIndex++}`} className={currentClasses}>
            {currentText}
          </mark>
        );
      } else {
        elements.push(currentText);
      }
      currentText = "";
    }
  };

  for (let i = 0; i < text.length; i++) {
    const classesStr = Array.from(charClasses[i]).sort().join(" ");
    if (classesStr !== currentClasses) {
      pushCurrent();
      currentClasses = classesStr;
    }
    currentText += text[i];
  }
  pushCurrent();

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
  onEditRecord,
  onGoToRecord,
  onCopyAsRequest,
  onUndoStrict,
  onCompress,
  onDeleteLast,
  splitChars,
  width,
  onResizeWidth
}) {
  const [showMiniViews, setShowMiniViews] = useState(true);
  const [isSyncScroll, setIsSyncScroll] = useState(true);
  const [historyHeight, setHistoryHeight] = useState(Math.max(250, window.innerHeight * 0.5)); // Hauteur par défaut à 50% de l'écran
  const beforeScrollRef = useZoomable(10);
  const afterScrollRef = useZoomable(10);
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
    onBranchOut('modal');
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
          type="button"
          onClick={onResetProject}
          className="flex-1 bg-cherry-red hover:bg-cherry-red-hover text-xs font-bold border border-cherry-red flex flex-col justify-center items-center rounded-sm transition gap-1 duration-150 text-white"
          title="Vider et réinitialiser tout le projet"
        >
          <span className="text-lg leading-none">🔄</span>
          <span>RESET</span>
        </button>
      </div>

      {/* Titre Historique & Navigation */}
      <div className="flex flex-col gap-2 flex-shrink-0 mt-1">
        <div className="text-[1.3em] font-extrabold text-primary-blue tracking-wide uppercase select-none">
          📚 HISTORIQUE DES VERSIONS
        </div>
      </div>

      {/* 2. Tableau de la pile d'historique (3 colonnes) */}
      <div 
        style={{ height: showMiniViews ? `${historyHeight}px` : 'auto' }}
        className={`border border-border-dark bg-bg-dark rounded-sm overflow-y-auto ${showMiniViews ? 'flex-shrink-0' : 'flex-1'}`}
      >
        <table className="w-full text-left text-xs border-collapse table-auto">
          <thead className="bg-bg-panel sticky top-0 z-10 select-none border-b border-border-dark text-[10px] text-[#888] uppercase tracking-wider">
            <tr>
              <th className="p-2 whitespace-nowrap w-px">Ver.</th>
              <th className="p-2 whitespace-nowrap w-px">Label</th>
              <th className="p-2 w-full">Commentaire</th>
              <th className="p-2 whitespace-nowrap w-px">Source</th>
              <th className="p-2 text-right pr-3 whitespace-nowrap w-px">Heure</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2d2d2d] font-sans">
            {history.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-4 text-center text-[#666] italic">
                  Aucun historique.
                </td>
              </tr>
            ) : (
              history.map((rec, index) => {
                const isInfo = rec.type === 'info';
                const isSelected = index === selectedIndex && !isInfo;
                
                return (
                  <tr
                    key={index}
                    onClick={() => { if (!isInfo) onSelectIndex(index); }}
                    className={`transition duration-100 ${
                      isInfo 
                        ? 'bg-[#1a1a1a] text-[#666] border-l-4 border-transparent cursor-default'
                        : isSelected
                          ? 'bg-[#37373d] border-l-4 border-primary-blue font-bold text-white cursor-pointer'
                          : 'hover:bg-bg-panel text-text-light/90 cursor-pointer'
                    }`}
                  >
                    <td className={`p-2 font-mono text-[10px] align-top whitespace-nowrap w-px ${rec.isSaved ? 'text-[#87cefa]' : ''}`}>{rec.version}</td>
                    <td className={`p-2 align-top whitespace-nowrap w-px ${rec.isSaved ? 'text-[#87cefa] font-bold' : ''}`} title={rec.action}>
                      {isInfo ? <span className="italic">[{rec.action}]</span> : rec.action}
                    </td>
                    <td className={`p-2 align-top break-words w-full ${rec.isSaved ? 'text-[#87cefa]' : 'text-[#888]'}`} title={rec.comment}>
                      {rec.comment}
                    </td>
                    <td className="p-2 align-top text-[#9cdcfe] text-[10px] whitespace-nowrap w-px" title={rec.source}>
                      {rec.source && rec.source.startsWith("file :") ? "Fichier : 📁" : rec.source}
                    </td>
                    <td className="p-2 text-right pr-3 text-[#999] text-[10px] font-mono align-top whitespace-nowrap w-px">
                      {rec.timestamp}
                      {isSelected && rec.type !== 'snapshot' && (
                         <div className="flex gap-1.5 justify-end mt-1 text-base">
                             <button onClick={(e) => { e.stopPropagation(); onEditRecord(index); }} title="Éditer le label ou le commentaire" className="hover:text-primary-blue transition-colors">✏️</button>
                             <button onClick={(e) => { e.stopPropagation(); onGoToRecord(); }} title="Aller à la modification ciblée" className="hover:text-primary-blue transition-colors">🎯</button>
                         </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 3. Séparateur & Option de liaison */}
      {showMiniViews && (
        <Splitter direction="horizontal" onResize={handleHistoryResize} />
      )}

      {/* Barre de contrôles des Mini-Views et Commentaire */}
      <div className="flex flex-col gap-1.5 flex-shrink-0 mt-1 select-none">
        
        {/* Commentaire de la version sélectionnée */}
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-0.5">
            <span className="text-[10px] text-[#aaa] font-bold uppercase">Commentaire de l'action</span>
            <div className="flex gap-1">
              {selectedIndex !== -1 && history[selectedIndex] && history[selectedIndex].multiMode && (
                <span className="bg-[#5c2d91] text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">
                  {history[selectedIndex].multiIndices && history[selectedIndex].multiIndices.length > 0 
                    ? `CHERRY-PICK [${history[selectedIndex].multiIndices.map(i=>i+1).join(', ')}]` 
                    : 'MULTI'}
                </span>
              )}
              {selectedIndex !== -1 && history[selectedIndex] && history[selectedIndex].ignoreSpaces && (
                <span className="bg-[#007acc] text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">SMART</span>
              )}
            </div>
          </div>
          <textarea
            readOnly
            value={selectedIndex !== -1 && history[selectedIndex] ? (history[selectedIndex].comment || "Aucun commentaire.") : ""}
            className="w-full h-[35px] bg-bg-dark border border-border-dark text-[#d4d4d4] text-[10px] p-1.5 rounded-sm resize-none focus:outline-none font-sans italic"
            placeholder="Aucun commentaire disponible..."
          />
        </div>

        <div className="flex justify-between items-center text-xs gap-2">
          {/* Navigation et actions (déplacées de la topbar et du tableau) */}
          <div className="flex flex-1 gap-1 h-12 select-none">
            <button
              type="button"
              disabled={selectedIndex <= 0}
              onClick={() => onSelectIndex(selectedIndex - 1)}
              className="flex-1 bg-bg-panel hover:bg-bg-dark text-white border border-border-dark font-bold text-sm rounded transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Retourner à la version précédente"
            >
              ◀ Préc.
            </button>
            <button
              disabled={selectedIndex === -1 || selectedIndex === history.length - 1}
              onClick={() => onSelectIndex(selectedIndex + 1)}
              className="flex-1 bg-bg-panel hover:bg-bg-dark text-white border border-border-dark font-bold text-sm rounded transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Avancer à la version suivante"
            >
              Suiv. ▶
            </button>
            <button
              type="button"
              disabled={selectedIndex === -1 || selectedIndex === history.length - 1}
              onClick={handleBranchClick}
              className="flex-[1.5] bg-cherry-red hover:bg-cherry-red-hover text-white font-extrabold text-xs rounded transition duration-150 flex justify-center items-center gap-1 shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-center leading-tight px-1 overflow-hidden"
              title="Créer une nouvelle branche à partir de cette version"
            >
              <span className="mr-1.5 whitespace-nowrap flex-shrink-0">New Branch</span>
              <svg className="transform scale-y-[-1] flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v12"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>
            </button>
            
            <div className="w-px bg-[#444] mx-0.5"></div>
            
            <button
              disabled={selectedIndex === -1 || history[selectedIndex]?.type === 'snapshot' || history[selectedIndex]?.type === 'info'}
              onClick={() => onCopyAsRequest && onCopyAsRequest(selectedIndex)}
              className="flex-1 bg-bg-panel hover:bg-bg-dark text-green-500 border border-border-dark font-bold text-lg rounded transition duration-150 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
              title="Copier la requête"
            >
              📋
            </button>
            <button
              disabled={selectedIndex === -1 || history[selectedIndex]?.type !== 'replace'}
              onClick={() => onUndoStrict && onUndoStrict(selectedIndex)}
              className="flex-1 bg-bg-panel hover:bg-bg-dark text-cherry-red border border-border-dark font-bold text-lg rounded transition duration-150 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
              title="Annuler (Undo)"
            >
              ↩️
            </button>
            <button
              disabled={selectedIndex <= 0}
              onClick={() => onCompress && onCompress(selectedIndex)}
              className="flex-1 bg-bg-panel hover:bg-bg-dark text-purple-400 border border-border-dark font-bold text-lg rounded transition duration-150 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
              title="Compresser l'historique"
            >
              🗜️
            </button>
            
            <div className="w-px bg-[#444] mx-0.5"></div>
            
            <button
              disabled={selectedIndex === -1 || selectedIndex !== history.length - 1}
              onClick={() => {
                if (confirm("Voulez-vous vraiment supprimer définitivement ce dernier élément ?")) {
                  onDeleteLast();
                }
              }}
              className="flex-1 bg-bg-panel hover:bg-cherry-red text-white border border-border-dark hover:border-cherry-red font-bold text-xs rounded transition duration-150 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
              title="Supprimer dernier item"
            >
              🗑️
            </button>
          </div>
          
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0 ml-2">
            <span className="text-[10px] text-[#aaa] font-bold">Détails (AVANT / APRÈS)</span>
            <div className="flex gap-2">
              <button
                type="button"
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
                type="button"
                onClick={() => setShowMiniViews(!showMiniViews)}
                className="bg-bg-panel hover:bg-bg-dark border border-border-dark px-3 py-1 rounded text-[11px] font-bold text-[#d4d4d4]"
              >
                {showMiniViews ? 'Masquer ▲' : 'Afficher ▼'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Les Mini-Views AVANT / APRÈS */}
      {showMiniViews && (
        <div className="flex-1 flex flex-col gap-2 min-h-[120px] mt-1">
          {/* Mini-View AVANT (FIND) */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-bg-dark border border-border-dark rounded-sm">
            <div className="bg-bg-panel px-2.5 py-0.5 text-[10px] text-[#888] font-bold border-b border-border-dark uppercase tracking-wider text-left">
              AVANT (FIND)
            </div>
            <div 
              className="flex-1 overflow-auto p-2 font-mono whitespace-pre text-left" 
              ref={beforeScrollRef}
              style={{ fontSize: 'var(--zoom-size, 10px)' }}
            >
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
            <div 
              className="flex-1 overflow-auto p-2 font-mono whitespace-pre text-left" 
              ref={afterScrollRef}
              style={{ fontSize: 'var(--zoom-size, 10px)' }}
            >
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

      {/* Les boutons ont été déplacés en haut */}

    </div>
  );
}
