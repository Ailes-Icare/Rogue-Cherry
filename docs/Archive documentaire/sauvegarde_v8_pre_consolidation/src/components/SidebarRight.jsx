import React, { useState, useRef, useEffect, useMemo } from 'react';
import Splitter from './Splitter.jsx';
import { computeLiveDiff } from '../utils/diffEngine.js';
import { useZoomable } from '../hooks/useZoomable.js';
import { useMessageBox } from '../context/MessageBoxContext.jsx';

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
  projectSizeBytes = 0,
  selectedIndex,
  onSelectIndex,
  onSaveProject,
  onLoadProject,
  onResetProject,
  onBranchOut,
  onEditRecord,
  onGoToRecord,
  onGenerateMultistack,
  onCopyAsRequest,
  onLoadRequestToSidebar,
  onUndoStrict,
  onCompress,
  onDeleteLast,
  splitChars,
  width,
  onResizeWidth,
  projectName,
  isProjectEmpty,
  isProjectDirty
}) {
  const { showConfirm } = useMessageBox();
  const [showMiniViews, setShowMiniViews] = useState(true);
  const [isSyncScroll, setIsSyncScroll] = useState(true);
  const [historyHeight, setHistoryHeight] = useState(Math.max(250, window.innerHeight * 0.5)); // Hauteur par défaut à 50% de l'écran
  const beforeScrollRef = useZoomable(10);
  const afterScrollRef = useZoomable(10);
  const isSyncingRef = useRef(false);

  const branchBtnRef = useRef(null);
  const [branchBtnWidth, setBranchBtnWidth] = useState(120);

  const resetBtnRef = useRef(null);
  const [resetBtnWidth, setResetBtnWidth] = useState(60);

  useEffect(() => {
    if (!branchBtnRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        setBranchBtnWidth(entry.contentRect.width);
      }
    });
    observer.observe(branchBtnRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!resetBtnRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        setResetBtnWidth(entry.contentRect.width);
      }
    });
    observer.observe(resetBtnRef.current);
    return () => observer.disconnect();
  }, []);

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
      style={{ width: `${width}px`, flexShrink: 9999 }} 
      className="bg-[#262626] flex flex-col overflow-hidden min-w-[280px] p-2.5 gap-2.5"
    >
      
      {/* 1. Zone Supérieure: Boutons de Projet */}
      <div className="flex gap-2 h-[72px] flex-shrink-0">
        {/* Cadre Bleu Global (Gestion de projet) */}
        <div className="flex-1 bg-[#007acc] rounded-sm flex flex-row overflow-hidden p-[6px] shadow-sm">
          {/* Titre à gauche, centré dans son espace bleu */}
          <div className="flex items-center justify-center px-2 min-w-[15%] max-w-[20%]">
            <span className="text-[17px] font-extrabold text-white text-center leading-[1.1] tracking-wide">
              Gestion<br/>de projet
            </span>
          </div>
          {/* Cadre intérieur (fond gris du logiciel) avec marge interne */}
          <div className="flex-1 bg-[#1e1e1e] rounded-sm flex flex-row items-stretch justify-start gap-2 p-[6px] overflow-hidden">
            <button
              onClick={onLoadProject}
              className={`flex-1 max-w-[120px] min-w-[42px] text-xl ${isProjectEmpty ? 'btn-active-blue' : 'btn-disabled-clickable'}`}
              title="Importer un projet Rogue Cherry à partir d'un fichier JSON"
            >
              📂
            </button>
            <button
              onClick={onSaveProject}
              disabled={isProjectEmpty}
              className={`flex-1 max-w-[120px] min-w-[42px] text-xl ${isProjectEmpty ? 'btn-disabled-unclickable' : (!isProjectDirty ? 'btn-disabled-clickable' : 'btn-active')}`}
              title="Sauvegarder le projet et tout l'historique dans un fichier JSON"
            >
              💾
            </button>
            <button
              type="button"
              onClick={onResetProject}
              disabled={isProjectEmpty}
              className={`flex-1 max-w-[120px] min-w-[42px] text-xl ${isProjectEmpty ? 'btn-disabled-unclickable' : 'btn-active'}`}
              title="Fermer le projet courant"
            >
              ❌
            </button>
          </div>
        </div>

        {/* Bouton Reset (25%) */}
        <button
          ref={resetBtnRef}
          type="button"
          onClick={onResetProject}
          disabled={isProjectEmpty}
          className={`w-[25%] flex-shrink-0 bg-cherry-red hover:bg-cherry-red-hover font-bold border border-cherry-red flex flex-row justify-evenly items-center rounded-sm transition duration-150 text-white shadow-sm overflow-hidden ${isProjectEmpty ? 'opacity-30 cursor-not-allowed' : ''}`}
          title="Ferme tous les projets en cours et remet l'application vierge"
        >
          {(() => {
            const w = resetBtnWidth;
            if (w >= 100) {
              return (
                <>
                  <span className="whitespace-nowrap" style={{ fontSize: '18px' }}>RESET</span>
                  <span className="text-3xl leading-none flex-shrink-0">🔄</span>
                </>
              );
            } else if (w >= 70) {
              const fontSize = 12 + 6 * ((w - 70) / 30);
              const iconSize = 24 + 12 * ((w - 70) / 30);
              return (
                <>
                  <span className="whitespace-nowrap" style={{ fontSize: `${fontSize}px` }}>RESET</span>
                  <span className="leading-none flex-shrink-0" style={{ fontSize: `${iconSize}px` }}>🔄</span>
                </>
              );
            } else if (w >= 50) {
              const iconSize = 24 + 12 * ((w - 50) / 20);
              return (
                <div className="flex flex-col items-center justify-center w-full">
                  <span className="leading-none flex-shrink-0" style={{ fontSize: `${iconSize}px` }}>🔄</span>
                  <span className="text-center w-full mt-1" style={{ fontSize: '10px' }}>RESET</span>
                </div>
              );
            } else {
              return (
                <div className="flex flex-col items-center justify-center w-full">
                  <span className="text-xl leading-none flex-shrink-0 mt-1">🔄</span>
                  <span className="text-center w-full mt-1" style={{ fontSize: '9px' }}>RESET</span>
                </div>
              );
            }
          })()}
        </button>
      </div>
      {/* Taille du projet JSON */}
      {projectSizeBytes > 0 && (
        <div className="text-center text-[10px] text-[#888] font-mono select-none -mt-1.5 mb-0.5">
          Taille export JSON : {projectSizeBytes < 1024 ? `${projectSizeBytes} o` : projectSizeBytes < 1024*1024 ? `${(projectSizeBytes/1024).toFixed(1)} Ko` : `${(projectSizeBytes/(1024*1024)).toFixed(2)} Mo`}
        </div>
      )}

      {/* Titre Historique & Navigation */}
      <div className="flex flex-col gap-2 flex-shrink-0 mt-1">
        <div className="text-[1.3em] font-extrabold text-primary-blue tracking-wide uppercase select-none">
          📚 HISTORIQUE DES VERSIONS{projectName ? ` - ${projectName}` : ''}
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
                const isSmartCancelFailure = isInfo && rec.action === '❌ Échec Annul.';
                
                // On autorise la sélection des Échecs d'Annulation pour voir les lignes concernées
                const isSelected = index === selectedIndex && (!isInfo || isSmartCancelFailure);

                let rowColorClass = 'hover:bg-bg-panel text-text-light/90 cursor-pointer';
                if (rec.isIgnored) {
                  rowColorClass = 'bg-[#1e1e1e] text-[#555] opacity-50 cursor-default';
                } else if (isInfo && !isSmartCancelFailure) {
                  rowColorClass = 'bg-[#1a1a1a] text-[#666] border-l-4 border-transparent cursor-default';
                } else if (isSelected) {
                  rowColorClass = 'bg-[#37373d] border-l-4 border-primary-blue font-bold text-white cursor-pointer';
                }

                // Surlignage conditionnel si un Échec d'annulation est sélectionné
                const activeRec = history[selectedIndex];
                if (activeRec && activeRec.action === '❌ Échec Annul.' && activeRec.meta) {
                  if (activeRec.meta.conflictTarget === index) {
                    rowColorClass = 'bg-[#1a2b3d] border-l-4 border-blue-500 font-bold text-blue-300 cursor-default';
                  } else if (activeRec.meta.conflictBlockers && activeRec.meta.conflictBlockers.includes(index)) {
                    rowColorClass = 'bg-[#3d1a1a] border-l-4 border-red-500 font-bold text-red-300 cursor-default';
                  }
                }

                return (
                  <tr
                    key={index}
                    onClick={() => { if (!isInfo || isSmartCancelFailure) onSelectIndex(index); }}
                    className={`transition duration-100 ${rowColorClass}`}
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
                      {isSelected && rec.type !== 'snapshot' && !rec.isIgnored && (
                         <div className="flex gap-1.5 justify-end mt-1 text-base">
                             <button onClick={(e) => { e.stopPropagation(); onEditRecord(index); }} title="Éditer le label ou le commentaire" className="hover:text-primary-blue transition-colors">✏️</button>
                             <button onClick={(e) => { e.stopPropagation(); onGoToRecord(); }} title="Aller à la modification ciblée" className="hover:text-primary-blue transition-colors">🎯</button>
                         </div>
                      )}
                      {rec.action === '❌ Échec Annul.' && !rec.isIgnored && (
                         <div className="flex gap-1.5 justify-end mt-1 text-base">
                             <button onClick={(e) => { e.stopPropagation(); onGenerateMultistack(index); }} title="Générer et appliquer la pile d'annulation intelligente (Smart Cancel)" className="hover:text-yellow-500 transition-colors">⚙️</button>
                         </div>
                      )}
                      {rec.isIgnored && rec.type === 'replace' && (
                         <div className="flex gap-1.5 justify-end mt-1 text-base">
                             <button onClick={(e) => { e.stopPropagation(); onLoadRequestToSidebar(index); }} title="Recharger cette requête annulée dans la zone de gauche" className="hover:text-green-400 transition-colors">♻️</button>
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
              className={`flex-1 font-bold text-sm shadow-sm flex items-center justify-center ${selectedIndex <= 0 ? 'btn-disabled-unclickable' : 'btn-active'}`}
              title="Retourner à la version précédente"
            >
              ◀ Préc.
            </button>
            <button
              disabled={selectedIndex === -1 || selectedIndex === history.length - 1}
              onClick={() => onSelectIndex(selectedIndex + 1)}
              className={`flex-1 font-bold text-sm shadow-sm flex items-center justify-center ${(selectedIndex === -1 || selectedIndex === history.length - 1) ? 'btn-disabled-unclickable' : 'btn-active'}`}
              title="Avancer à la version suivante"
            >
              Suiv. ▶
            </button>
            <button
              ref={branchBtnRef}
              type="button"
              disabled={selectedIndex === -1 || selectedIndex === history.length - 1}
              onClick={handleBranchClick}
              className={`flex-[1.5] min-w-0 bg-cherry-red hover:bg-cherry-red-hover text-white font-extrabold rounded transition duration-150 flex items-center justify-evenly shadow-md disabled:opacity-50 disabled:cursor-not-allowed leading-tight overflow-hidden`}
              title="Créer une nouvelle branche à partir de cette version"
            >
              {(() => {
                const w = branchBtnWidth;
                if (w >= 170) {
                  return (
                    <>
                      <span className="whitespace-nowrap" style={{ fontSize: '18px' }}>New Branch</span>
                      <svg className="transform scale-y-[-1] flex-shrink-0" width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v12"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>
                    </>
                  );
                } else if (w >= 110) {
                  const fontSize = 14 + 4 * ((w - 110) / 60);
                  return (
                    <>
                      <span className="whitespace-nowrap" style={{ fontSize: `${fontSize}px` }}>New Branch</span>
                      <svg className="transform scale-y-[-1] flex-shrink-0" width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v12"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>
                    </>
                  );
                } else if (w >= 85) {
                  return (
                    <>
                      <span className="whitespace-normal leading-none text-left" style={{ fontSize: '14px' }}>New<br/>Branch</span>
                      <svg className="transform scale-y-[-1] flex-shrink-0" width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v12"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>
                    </>
                  );
                } else if (w >= 60) {
                  const iconSize = 14 + 14 * ((w - 60) / 25);
                  return (
                    <>
                      <span className="whitespace-normal leading-none text-left" style={{ fontSize: '14px' }}>New<br/>Branch</span>
                      <svg className="transform scale-y-[-1] flex-shrink-0" width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v12"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>
                    </>
                  );
                } else if (w >= 40) {
                  return (
                    <span className="whitespace-normal leading-none text-center w-full" style={{ fontSize: '14px' }}>New<br/>Branch</span>
                  );
                } else {
                  const iconSize = Math.max(14, Math.min(28, 14 + 14 * ((w - 20) / 20)));
                  return (
                    <svg className="transform scale-y-[-1] flex-shrink-0" width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v12"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>
                  );
                }
              })()}
            </button>
            
            <div className="w-px bg-[#444] mx-0.5"></div>
            
            <button
              disabled={selectedIndex === -1 || history[selectedIndex]?.type === 'snapshot' || history[selectedIndex]?.type === 'info'}
              onClick={() => onCopyAsRequest && onCopyAsRequest(selectedIndex)}
              className={`flex-1 font-bold text-lg shadow-sm flex items-center justify-center ${(selectedIndex === -1 || history[selectedIndex]?.type === 'snapshot' || history[selectedIndex]?.type === 'info') ? 'btn-disabled-unclickable' : 'btn-active'}`}
              title="Copier la requête"
            >
              📋
            </button>
            <button
              disabled={selectedIndex === -1 || history[selectedIndex]?.type !== 'replace'}
              onClick={() => onUndoStrict && onUndoStrict(selectedIndex)}
              className={`flex-[1.2] font-bold text-lg shadow-sm flex items-center justify-center gap-1.5 ${(selectedIndex === -1 || history[selectedIndex]?.type !== 'replace') ? 'btn-disabled-unclickable' : 'btn-active'}`}
              title="Construction intelligente d'une requête d'annulation&#10;(Si cela est possible)"
            >
              <span className="text-sm">⚙️</span>
              <span className="text-base">↩️</span>
            </button>
            <button
              disabled={selectedIndex <= 0}
              onClick={() => onCompress && onCompress(selectedIndex)}
              className={`flex-1 font-bold text-lg shadow-sm flex items-center justify-center ${selectedIndex <= 0 ? 'btn-disabled-unclickable' : 'btn-active'}`}
              title="Compresser l'historique"
            >
              🗜️
            </button>
            
            <div className="w-px bg-[#444] mx-0.5"></div>
            
            <button
              disabled={selectedIndex === -1 || selectedIndex !== history.length - 1}
              onClick={async () => {
                if (await showConfirm("Voulez-vous vraiment supprimer définitivement ce dernier élément ?")) {
                  onDeleteLast();
                }
              }}
              className={`flex-1 font-bold text-xs shadow-sm flex items-center justify-center ${(selectedIndex === -1 || selectedIndex !== history.length - 1) ? 'btn-disabled-unclickable' : 'btn-active'}`}
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
                    ? 'bg-[#2a2d2e] border-[#444] text-white'
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
