import React, { useState, useEffect, useMemo, useRef } from 'react';
import { escapeHtml, normalizeText } from '../utils/helpers.js';

/**
 * Fragment de ligne surligné de façon chirurgicale.
 */
function renderLineContent(text, lineMarks) {
  if (!lineMarks || lineMarks.length === 0) return text;
  
  // Tri des marqueurs locaux pour traitement séquentiel
  const sorted = [...lineMarks].sort((a, b) => a.start - b.start);
  const elements = [];
  let lastIdx = 0;
  
  sorted.forEach((mark, index) => {
    // Texte avant le marqueur
    if (mark.start > lastIdx) {
      elements.push(text.substring(lastIdx, mark.start));
    }
    // Texte surligné
    const highlighted = text.substring(mark.start, mark.start + mark.length);
    elements.push(
      <mark key={`${index}-${mark.start}`} className={mark.type}>
        {highlighted}
      </mark>
    );
    lastIdx = mark.start + mark.length;
  });
  
  // Fin de ligne
  if (lastIdx < text.length) {
    elements.push(text.substring(lastIdx));
  }
  
  return elements;
}

/**
 * Ligne individuelle de code mémoïsée pour éviter les re-rendus globaux inefficaces.
 */
const CodeLine = React.memo(({ number, text, marks, isGutterModified, isOccLine, isActiveOccLine, onClick }) => {
  const lineContent = useMemo(() => renderLineContent(text, marks), [text, marks]);

  return (
    <div 
      onClick={onClick}
      className={`flex font-consolas text-sm line-height-1.5 hover:bg-bg-panel-light/35 cursor-text select-text transition-colors duration-75`}
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
        <span className={`${isGutterModified ? 'bg-gutter-mod text-black font-bold rounded-sm px-[2px] text-[10px]' : ''}`}>
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
  statusBarInfo = ""
}) {
  const [localEditText, setLocalEditText] = useState(text);
  const containerRef = useRef(null);
  const textareaRef = useRef(null);

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
              type: mark.type
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
        <div className="flex-1"></div>
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
      <div className="flex-1 relative overflow-auto font-consolas select-text" style={{ fontSize: `${fontSize}px` }}>
        {isEditable ? (
          // Mode Édition Libre : Textarea fluide anti-lag
          <textarea
            ref={textareaRef}
            value={localEditText}
            onChange={handleTextareaChange}
            spellCheck="false"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            className="w-full h-full p-3 bg-bg-dark text-text-light font-mono text-sm border-none outline-none resize-none overflow-auto"
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.5 }}
          />
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
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex justify-between items-center bg-[#007acc] text-white px-3 py-0.5 text-[11px] font-sans select-none">
        <span>{statusBarInfo || 'Prêt'}</span>
        <span>UTF-8</span>
      </div>
    </div>
  );
}
