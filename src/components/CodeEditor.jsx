import React, { useState, useEffect, useMemo, useRef } from 'react';
import { escapeHtml, normalizeText } from '../utils/helpers.js';

/**
 * Fragment de ligne surligné de façon chirurgicale.
 */
function renderLineContent(text, lineMarks) {
  if (!lineMarks || lineMarks.length === 0) return text;
  
  const chars = Array.from(text).map(c => ({ char: c, classes: new Set() }));
  const zeroMarks = {};
  
  lineMarks.forEach(mark => {
    if (mark.length === 0) {
      if (!zeroMarks[mark.start]) zeroMarks[mark.start] = new Set();
      zeroMarks[mark.start].add(mark.type);
    } else {
      for (let i = mark.start; i < mark.start + mark.length && i < chars.length; i++) {
        chars[i].classes.add(mark.type);
        if (mark.occIndex !== undefined) {
          chars[i].occIndex = mark.occIndex;
        }
      }
    }
  });

  const elements = [];
  let currentClasses = "";
  let currentText = "";
  let elementIndex = 0;

  const pushCurrent = (occIdx) => {
    if (currentText) {
      if (currentClasses) {
        elements.push(
          <mark 
            key={`chunk-${elementIndex++}`} 
            className={currentClasses}
            onDoubleClick={(e) => {
              if (occIdx !== undefined && typeof window.handleToggleOcc === 'function') {
                e.stopPropagation();
                window.handleToggleOcc(occIdx);
              }
            }}
          >
            {currentText}
          </mark>
        );
      } else {
        elements.push(currentText);
      }
      currentText = "";
    }
  };

  let currentOccIndex = undefined;

  for (let i = 0; i <= chars.length; i++) {
    if (zeroMarks[i]) {
      pushCurrent(currentOccIndex);
      const zClasses = Array.from(zeroMarks[i]).join(" ");
      elements.push(<span key={`zero-${elementIndex++}`} className={zClasses}></span>);
    }

    if (i < chars.length) {
      const charData = chars[i];
      const classesStr = Array.from(charData.classes).sort().join(" ");
      
      if (classesStr !== currentClasses || charData.occIndex !== currentOccIndex) {
        pushCurrent(currentOccIndex);
        currentClasses = classesStr;
        currentOccIndex = charData.occIndex;
      }
      currentText += charData.char;
    }
  }
  
  pushCurrent(currentOccIndex);
  
  return elements;
}

/**
 * Ligne individuelle de code mémoïsée pour éviter les re-rendus globaux inefficaces.
 */
const CodeLine = React.memo(({ number, text, marks, isGutterModified, isOccLine, isActiveOccLine, isTargeted, onClick }) => {
  const lineContent = useMemo(() => renderLineContent(text, marks), [text, marks]);

  return (
    <div 
      onClick={onClick}
      className={`flex font-consolas line-height-1.5 hover:bg-bg-panel-light/35 cursor-text select-text transition-colors duration-75`}
      style={{ fontSize: 'inherit' }}
    >
      {/* Numéro de ligne + Gouttière interactive */}
      <div 
        className={`w-12 pr-2 text-right text-[#858585] bg-[#252526] border-r border-border-dark user-select-none flex justify-between items-center select-none font-sans text-xs`}
      >
        <span className="text-[10px] pl-1 font-bold">
          {isActiveOccLine ? (
            <span className="text-[#FF8C00]" title="Occurrence active">▶</span>
          ) : isOccLine ? (
            <span className="text-[#FFD700]/70" title="Occurrence trouvée">●</span>
          ) : null}
        </span>
        <span className={`
          ${isGutterModified ? 'bg-gutter-mod text-black font-bold rounded-sm text-[10px]' : ''} 
          ${isTargeted ? 'outline outline-1 outline-red-500 rounded-sm shadow-[0_0_5px_rgba(239,68,68,0.8)] z-10 relative bg-bg-dark text-white' : ''}
          ${isGutterModified || isTargeted ? 'px-[2px]' : ''}
        `}>
          {number}
        </span>
      </div>

      {/* Rendu du texte de la ligne */}
      <div className="flex-1 pl-3 whitespace-pre text-left overflow-x-auto min-w-0 select-text selection:bg-[#264f78]">
        {text === "" ? "\n" : lineContent}
      </div>
    </div>
  );
});

CodeLine.displayName = 'CodeLine';

/**
 * Éditeur principal de Rogue Cherry avec double mode lecture-seule/édition libre.
 */
export default function CodeEditor({ 
  text, 
  onTextChange, 
  marks = [], 
  activeOccIndex = -1, 
  isEditable = false, 
  onToggleEditable,
  fontSize = 14,
  setFontSize,
  statusBarInfo = "",
  scrollTargetIndex = null,
  onToggleOccurrence,
  // Props de la recherche globale
  globalSearchBarText = "",
  setGlobalSearchBarText,
  globalSearchSmartMode = false,
  setGlobalSearchSmartMode,
  globalSearchOccIndex = 0,
  setGlobalSearchOccIndex,
  globalSearchMarks = []
}) {
  const [localEditText, setLocalEditText] = useState(text);
  const containerRef = useRef(null);
  const textareaRef = useRef(null);
  const gutterRef = useRef(null);
  const editorWrapperRef = useRef(null);

  const linesCount = text ? text.split('\n').length : 0;
  const charsCount = text ? text.length : 0;

  const [targetHighlightLine, setTargetHighlightLine] = useState(null);
  const targetHighlightTimerRef = useRef(null);

  const [goToLineVisible, setGoToLineVisible] = useState(false);
  const [goToLinePos, setGoToLinePos] = useState({ x: 0, y: 0 });
  const [goToLineValue, setGoToLineValue] = useState("");

  const handleStatusBarDoubleClick = (e) => {
    setGoToLinePos({ x: e.clientX, y: e.clientY });
    setGoToLineValue("");
    setGoToLineVisible(true);
  };

  const handleGoToLine = () => {
    const lineNum = parseInt(goToLineValue, 10);
    if (!isNaN(lineNum) && lineNum >= 1 && lineNum <= linesCount) {
      const targetLineIndex = lineNum - 1;
      setTargetHighlightLine(targetLineIndex);
      
      if (targetHighlightTimerRef.current) clearTimeout(targetHighlightTimerRef.current);
      targetHighlightTimerRef.current = setTimeout(() => {
        setTargetHighlightLine(null);
      }, 30000);

      if (isEditable) {
        if (textareaRef.current) {
          const lineHeight = 1.5 * fontSize;
          textareaRef.current.scrollTop = targetLineIndex * lineHeight;
        }
      } else {
        if (containerRef.current) {
          const targetLineNode = containerRef.current.children[targetLineIndex];
          if (targetLineNode) {
            targetLineNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }
      setGoToLineVisible(false);
    }
  };

  // Expose onToggleOccurrence to the global window for the memoized lines
  useEffect(() => {
    window.handleToggleOcc = onToggleOccurrence;
    return () => { delete window.handleToggleOcc; };
  }, [onToggleOccurrence]);

  // Écouteur natif pour le zoom de l'éditeur principal (évite l'erreur passive)
  useEffect(() => {
    const el = editorWrapperRef.current;
    if (!el || !setFontSize) return;

    const handleNativeWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
        if (e.deltaY < 0) {
          setFontSize(prev => Math.min(40, prev + 1));
        } else {
          setFontSize(prev => Math.max(8, prev - 1));
        }
      }
    };

    el.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleNativeWheel);
  }, [setFontSize]);

  // Synchronisation du texte local avec le texte parent
  useEffect(() => {
    setLocalEditText(text);
  }, [text]);

  // Découpe le texte en lignes et y distribue les marqueurs correspondants
  const lineRecords = useMemo(() => {
    if (!text) return [];
    const lines = text.split('\n');
    let absoluteOffset = 0;
    const result = [];

    // Indexation rapide des positions de marqueurs par rapport aux lignes
    lines.forEach((lineText, i) => {
      const lineLength = lineText.length;
      const lineStart = absoluteOffset;
      const lineEnd = lineStart + lineLength;

      const lineMarks = [];
      let isOccLine = false;
      let isActiveOccLine = false;
      let isGutterModified = false;

      marks.forEach(mark => {
        const mStart = mark.start;
        const mEnd = mark.start + mark.length;

        // Si le marqueur intersecte la ligne
        if (mStart < lineEnd && mEnd >= lineStart) {
          const localStart = Math.max(0, mStart - lineStart);
          const localEnd = Math.min(lineLength, mEnd - lineStart);
          
          if (localEnd >= localStart) {
            lineMarks.push({
              start: localStart,
              length: localEnd - localStart,
              type: mark.type,
              occIndex: mark.occIndex
            });

            // Détection du statut d'occurrence pour la gouttière
            if (mark.type.includes('hl-find') || mark.type === 'hl-yellow') {
              isOccLine = true;
              if (mark.occIndex === activeOccIndex) {
                isActiveOccLine = true;
              }
            }
            if (mark.type === 'hl-line-mod' || mark.type === 'hl-word-mod' || mark.type === 'hl-ins') {
              isGutterModified = true;
            }
          }
        }
      });

      result.push({
        number: i + 1,
        text: lineText,
        marks: lineMarks,
        isOccLine,
        isActiveOccLine,
        isGutterModified
      });

      absoluteOffset += lineLength + 1; // +1 pour le saut de ligne \n
    });

    return result;
  }, [text, marks, activeOccIndex]);

  // Scroll automatique vers l'occurrence active
  useEffect(() => {
    if (activeOccIndex !== -1 && marks.length > 0 && containerRef.current) {
      const activeMark = marks.find(m => m.occIndex === activeOccIndex);
      if (activeMark) {
        // Estimation simple de la ligne de l'occurrence
        const prevText = text.substring(0, activeMark.start);
        const lineIndex = prevText.split('\n').length - 1;
        
        const editorDOM = containerRef.current;
        const targetLineNode = editorDOM.children[lineIndex];
        if (targetLineNode) {
          targetLineNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [activeOccIndex, marks, text]);

  // Scroll ciblé arbitraire (ex: depuis l'historique)
  useEffect(() => {
    if (scrollTargetIndex !== null && containerRef.current) {
      const prevText = text.substring(0, scrollTargetIndex);
      const lineIndex = prevText.split('\n').length - 1;
      const targetLineNode = containerRef.current.children[lineIndex];
      if (targetLineNode) {
        targetLineNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [scrollTargetIndex, text]);

  const handleTextareaChange = (e) => {
    setLocalEditText(normalizeText(e.target.value));
  };

  const handleSaveFreeEdit = () => {
    onTextChange(localEditText);
    onToggleEditable(); // Reverrouiller le cadenas
  };

  return (
    <div className="flex-1 flex flex-col border border-border-dark overflow-hidden bg-bg-dark rounded-sm">
      {/* Barre d'outils de l'éditeur */}
      <div className="flex justify-between items-center bg-[#252526] px-3 py-1.5 border-b border-border-dark text-xs select-none">
        {/* Recherche globale */}
        <div className="flex-1 flex items-center">
          <div className={`flex items-center gap-2 px-2 py-0.5 rounded border transition-colors ${globalSearchBarText ? 'border-[#FFD700] bg-[#1e1e1e]' : 'border-border-dark bg-bg-dark'}`}>
            <span className="text-primary-blue text-sm">🔍</span>
            <input
              type="text"
              value={globalSearchBarText}
              onChange={(e) => setGlobalSearchBarText(e.target.value)}
              placeholder="Recherche dynamique globale..."
              className="bg-transparent text-white text-xs outline-none w-64"
              spellCheck="false"
            />
            {globalSearchBarText && (
              <>
                <label className="flex items-center gap-1.5 cursor-pointer ml-2 text-[#ccc]">
                  <input 
                    type="checkbox" 
                    checked={globalSearchSmartMode}
                    onChange={(e) => setGlobalSearchSmartMode(e.target.checked)}
                    className="cursor-pointer"
                  />
                  Smart
                </label>
                <div className="flex items-center gap-1 ml-2 border-l border-border-dark pl-2">
                  <span className="font-mono text-[#FFD700] text-[10px] w-12 text-center">
                    {globalSearchMarks.length > 0 ? `${globalSearchOccIndex + 1}/${globalSearchMarks.length}` : '0/0'}
                  </span>
                  <button 
                    onClick={() => setGlobalSearchOccIndex(Math.max(0, globalSearchOccIndex - 1))}
                    disabled={globalSearchMarks.length === 0}
                    className="hover:text-white disabled:opacity-50 px-1"
                  >
                    ▲
                  </button>
                  <button 
                    onClick={() => setGlobalSearchOccIndex(Math.min(globalSearchMarks.length - 1, globalSearchOccIndex + 1))}
                    disabled={globalSearchMarks.length === 0}
                    className="hover:text-white disabled:opacity-50 px-1"
                  >
                    ▼
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-[#9cdcfe] font-mono font-bold text-[11px] tracking-wider uppercase">
            {isEditable ? '✏️ MODE ÉDITION LIBRE' : '👁️ MODE LECTURE SEULE'}
          </div>

          <button 
            onClick={isEditable ? handleSaveFreeEdit : onToggleEditable}
            className={`px-3 py-1 rounded flex items-center justify-center transition ${
              isEditable 
                ? 'bg-cherry-red hover:bg-cherry-red-hover text-white animate-pulse text-xs font-bold gap-1' 
                : 'bg-bg-panel border border-border-dark hover:border-primary-blue text-[#d4d4d4] text-base'
            }`}
            title={isEditable ? "Valider les modifications et verrouiller" : "Déverrouiller l'édition libre du code source"}
          >
            {isEditable ? <>🔓 <span>ENREGISTRER</span></> : '🔒'}
          </button>
          
          {isEditable && (
            <button 
              onClick={() => { setLocalEditText(text); onToggleEditable(); }} 
              className="bg-disabled-dark hover:bg-border-dark text-white px-2 py-1 rounded"
              title="Annuler les modifications en cours"
            >
              Annuler
            </button>
          )}
        </div>
      </div>

      {/* Zone de Code Centrale */}
      <div 
        ref={editorWrapperRef}
        className="flex-1 relative overflow-auto font-consolas select-text" 
        style={{ fontSize: `${fontSize}px` }}
      >
        {isEditable ? (
          // Mode Édition Libre : Textarea fluide anti-lag avec Gouttière
          <div className="flex w-full h-full bg-bg-dark">
            <div 
              ref={gutterRef}
              className="w-12 pr-2 text-right text-[#858585] bg-[#252526] border-r border-border-dark select-none font-sans overflow-hidden py-3"
              style={{ fontSize: 'inherit', lineHeight: 1.5 }}
            >
              {localEditText.split('\n').map((_, i) => {
                const isModified = i < lineRecords.length && lineRecords[i].isGutterModified;
                const isTargeted = targetHighlightLine === i;
                return (
                  <div key={i} className="flex justify-end items-center h-[1.5em]">
                    <span className={`pl-1 font-bold text-xs
                      ${isModified ? 'bg-gutter-mod text-black rounded-sm text-[10px]' : ''}
                      ${isTargeted ? 'outline outline-1 outline-red-500 rounded-sm shadow-[0_0_5px_rgba(239,68,68,0.8)] z-10 relative bg-bg-dark text-white' : ''}
                      ${isModified || isTargeted ? 'px-[2px]' : ''}
                    `}>
                      {i + 1}
                    </span>
                  </div>
                );
              })}
            </div>
            <textarea
              ref={textareaRef}
              value={localEditText}
              onChange={handleTextareaChange}
              onScroll={(e) => {
                if (gutterRef.current) {
                  gutterRef.current.scrollTop = e.target.scrollTop;
                }
              }}
              spellCheck="false"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              wrap="off"
              className="flex-1 p-3 bg-bg-dark text-text-light font-mono border-none outline-none resize-none overflow-auto whitespace-pre"
              style={{ fontSize: 'inherit', lineHeight: 1.5 }}
            />
          </div>
        ) : (
          // Mode Lecture Seule : Rendu mémoïsé par lignes ultra-performant
          <div 
            ref={containerRef}
            className="w-full min-h-full py-2 bg-bg-dark text-text-light overflow-x-auto select-text code-safe-render"
          >
            {lineRecords.length === 0 ? (
              <div className="p-4 text-center text-[#888] italic text-xs">
                En attente d'importation de fichier...
              </div>
            ) : (
              lineRecords.map((line) => (
                <CodeLine
                  key={line.number}
                  number={line.number}
                  text={line.text}
                  marks={line.marks}
                  isOccLine={line.isOccLine}
                  isActiveOccLine={line.isActiveOccLine}
                  isGutterModified={line.isGutterModified}
                  isTargeted={targetHighlightLine === line.number - 1}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div 
        className="flex justify-between items-center bg-[#007acc] text-white px-4 py-1.5 text-xs font-bold font-sans select-none flex-shrink-0 z-10 cursor-pointer"
        onDoubleClick={handleStatusBarDoubleClick}
        title="Double-clic pour aller à une ligne spécifique"
      >
        <span>{statusBarInfo || 'Prêt'}</span>
        <div className="flex gap-4">
          <span>{linesCount} Lignes</span>
          <span>{charsCount} Caractères</span>
          <span>UTF-8</span>
        </div>
      </div>

      {/* Mini-Modal Aller à la Ligne */}
      {goToLineVisible && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setGoToLineVisible(false)} 
          />
          <div 
            className="fixed z-50 bg-[#252526] border border-border-dark p-3 rounded shadow-xl flex flex-col gap-2 animate-fadeIn"
            style={{ left: Math.min(goToLinePos.x, window.innerWidth - 250), top: Math.max(10, goToLinePos.y - 80) }}
          >
            <span className="text-[11px] text-[#ccc] font-bold uppercase tracking-wider">Aller à la ligne (1 - {linesCount})</span>
            <div className="flex gap-1.5 items-center">
              <input 
                type="number" 
                min={1} 
                max={linesCount}
                value={goToLineValue}
                onChange={(e) => setGoToLineValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleGoToLine();
                  if (e.key === 'Escape') setGoToLineVisible(false);
                }}
                autoFocus
                className="bg-bg-dark text-text-light border border-border-dark px-2 py-1 text-xs outline-none focus:border-primary-blue w-24 rounded-sm font-mono"
              />
              <div className="flex flex-col gap-0.5">
                <button onClick={() => setGoToLineValue(v => Math.min(linesCount, (parseInt(v)||1) + 1))} className="px-1.5 bg-[#333] hover:bg-[#444] text-white rounded-[2px] text-[8px] leading-none py-0.5">▲</button>
                <button onClick={() => setGoToLineValue(v => Math.max(1, (parseInt(v)||1) - 1))} className="px-1.5 bg-[#333] hover:bg-[#444] text-white rounded-[2px] text-[8px] leading-none py-0.5">▼</button>
              </div>
              <button onClick={handleGoToLine} className="ml-1 px-3 py-1 bg-primary-blue hover:bg-primary-blue-hover transition text-white rounded-sm text-xs font-bold">GO</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
