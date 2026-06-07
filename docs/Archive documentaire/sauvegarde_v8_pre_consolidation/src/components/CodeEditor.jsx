import React, { useState, useEffect, useMemo, useRef } from 'react';
import { escapeHtml, normalizeText, renderInvisiblesHtml } from '../utils/helpers.js';
import Splitter from './Splitter.jsx';
import logoGhb from '../assets/brand/Rogue cherry GHB.svg';

const EyeIcon = ({ active }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`w-4 h-4 transition-colors ${active ? 'text-[#FFD700]' : 'text-[#d4d4d4] hover:text-white'}`}
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
    {!active && <line x1="1" y1="1" x2="23" y2="23"></line>}
  </svg>
);

/**
 * Fragment de ligne surligné de façon chirurgicale.
 */
function renderLineContent(text, lineMarks, showInvisibles = false) {
  if (!lineMarks || lineMarks.length === 0) {
    if (!showInvisibles) return text;
    const parts = [];
    let buf = "";
    for (let i = 0; i < text.length; i++) {
      if (text[i] === ' ' || text[i] === '\t') {
        if (buf) { parts.push(buf); buf = ""; }
        if (text[i] === ' ') parts.push(<span key={`sp-0-${i}`} className="hc-space"> </span>);
        else parts.push(<span key={`tb-0-${i}`} className="hc-tab">\t</span>);
      } else {
        buf += text[i];
      }
    }
    if (buf) parts.push(buf);
    return parts;
  }
  
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
      let content = currentText;
      if (showInvisibles) {
        const parts = [];
        let buf = "";
        for (let i = 0; i < currentText.length; i++) {
          if (currentText[i] === ' ' || currentText[i] === '\t') {
            if (buf) { parts.push(buf); buf = ""; }
            if (currentText[i] === ' ') parts.push(<span key={`sp-${elementIndex}-${i}`} className="hc-space"> </span>);
            else parts.push(<span key={`tb-${elementIndex}-${i}`} className="hc-tab">\t</span>);
          } else {
            buf += currentText[i];
          }
        }
        if (buf) parts.push(buf);
        content = parts;
      }

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
            {content}
          </mark>
        );
      } else {
        elements.push(<React.Fragment key={`chunk-${elementIndex++}`}>{content}</React.Fragment>);
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
const CodeLine = React.memo(({ number, text, marks, isGutterModified, isOccLine, isActiveOccLine, isTargeted, onClick, showInvisibles, occCssClass = '' }) => {
  const lineContent = useMemo(() => renderLineContent(text, marks, showInvisibles), [text, marks, showInvisibles]);

  return (
    <div 
      onClick={onClick}
      className={`flex font-consolas line-height-1.5 hover:bg-bg-panel-light/35 cursor-text select-text transition-colors duration-75 ${
        isOccLine ? 'bg-[#59466D]/15' : ''
      }`}
      style={{ fontSize: 'inherit' }}
    >
      {/* Numéro de ligne + Gouttière interactive */}
      <div 
        className={`w-12 pr-2 text-right text-[#858585] bg-[#252526] border-r border-border-dark user-select-none flex justify-between items-center select-none font-sans`}
        style={{ fontSize: 'inherit', lineHeight: 1.5 }}
      >
        <span className="text-[10px] pl-1 font-bold flex items-center h-full">
          {isActiveOccLine ? (
            <span className="bg-primary-blue text-white w-3 h-3 flex items-center justify-center rounded-[2px] text-[8px]" title="Occurrence active">▶</span>
          ) : isOccLine ? (
            <span className={occCssClass.includes('hl-yellow') ? 'text-gutter-mod/70' : 'text-[#FFD700]/70'} title="Occurrence trouvée">●</span>
          ) : null}
        </span>
        <span className={`
          ${isGutterModified ? 'bg-gutter-mod text-black font-bold rounded-sm text-[0.8em]' : ''} 
          ${isTargeted ? 'outline outline-1 outline-red-500 rounded-sm shadow-[0_0_5px_rgba(239,68,68,0.8)] z-10 relative bg-bg-dark text-white' : ''}
          ${isGutterModified || isTargeted ? 'px-[2px]' : ''}
        `}>
          {number}
        </span>
      </div>

      {/* Rendu du texte de la ligne */}
      <div className="flex-1 pl-3 whitespace-pre text-left overflow-x-auto overflow-y-hidden min-w-0 select-text selection:bg-[#264f78]">
        {text === "" ? (showInvisibles ? <span className="hc-nl"></span> : "\n") : (
          <>
            {lineContent}
            {showInvisibles && <span className="hc-nl"></span>}
          </>
        )}
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
  globalSearchMarks = [],
  globalSearchFoundRatio = 0,
  isGlobalEscapeHatchActive = false,
  onForceGlobalEscapeHatch,
  globalSearchSuspended = false,
  setGlobalSearchSuspended,
  onOpenLineChoiceModal,
  triggerGoToLine
}) {
  const [localEditText, setLocalEditText] = useState(text);
  const [showInvisibles, setShowInvisibles] = useState(false);
  const [visibleRange, setVisibleRange] = useState([0, 200]);
  const containerRef = useRef(null);
  const textareaRef = useRef(null);
  const gutterRef = useRef(null);
  const editorWrapperRef = useRef(null);

  const linesCount = text ? text.split('\n').length : 0;
  const charsCount = text ? text.length : 0;

  const [targetHighlightLine, setTargetHighlightLine] = useState(null);
  const targetHighlightTimerRef = useRef(null);

  const [searchFontSize, setSearchFontSize] = useState(14);
  const [searchHeight, setSearchHeight] = useState(100);
  const searchContainerRef = useRef(null);
  const searchTimerRef = useRef(null);

  // Timer pour la désactivation du Smart Mode (Étape 3)
  useEffect(() => {
    if (!globalSearchBarText && globalSearchSmartMode) {
      if (!searchTimerRef.current) {
        searchTimerRef.current = setTimeout(() => {
          setGlobalSearchSmartMode(false);
        }, 30000);
      }
    } else {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
        searchTimerRef.current = null;
      }
    }
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [globalSearchBarText, globalSearchSmartMode, setGlobalSearchSmartMode]);

  // Liseret rouge (30s) lors de la navigation dans la recherche globale (Étape 5.2.4)
  useEffect(() => {
    if (globalSearchBarText && globalSearchMarks.length > 0 && globalSearchOccIndex >= 0) {
      const activeMark = globalSearchMarks[globalSearchOccIndex];
      if (activeMark) {
        const prevText = text.substring(0, activeMark.start);
        const lineIndex = prevText.split('\n').length - 1;
        setTargetHighlightLine(lineIndex);

        if (targetHighlightTimerRef.current) clearTimeout(targetHighlightTimerRef.current);
        targetHighlightTimerRef.current = setTimeout(() => {
          setTargetHighlightLine(null);
        }, 30000);

        if (isEditable && textareaRef.current) {
          const lineHeight = 1.5 * fontSize;
          textareaRef.current.scrollTop = lineIndex * lineHeight;
        } else if (!isEditable && containerRef.current) {
          const targetLineNode = containerRef.current.children[0]?.children[lineIndex];
          if (targetLineNode) {
             targetLineNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }
    } else if (!globalSearchBarText && targetHighlightLine !== null) {
      // Efface le liseret si la recherche est annulée
      setTargetHighlightLine(null);
      if (targetHighlightTimerRef.current) clearTimeout(targetHighlightTimerRef.current);
    }
  }, [globalSearchOccIndex, globalSearchMarks, globalSearchBarText, text, isEditable, fontSize]);

  const isSearchMultiline = globalSearchBarText.includes('\n');
  const searchLines = globalSearchBarText.split('\n');

  // Zoom par touches Ctrl + Molette pour la barre de recherche
  useEffect(() => {
    const el = searchContainerRef.current;
    if (!el) return;

    const handleNativeSearchWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
        const delta = e.deltaY < 0 ? 1 : -1;
        const minSize = isSearchMultiline ? 10 : 15;
        setSearchFontSize(prev => Math.max(minSize, Math.min(30, prev + delta)));
      }
    };

    el.addEventListener('wheel', handleNativeSearchWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleNativeSearchWheel);
  }, [isSearchMultiline]);

  useEffect(() => {
    if (!isSearchMultiline && searchFontSize < 15) {
      setSearchFontSize(15);
    }
  }, [isSearchMultiline, searchFontSize]);

  const handleCopyAndDeleteSearch = () => {
    if (globalSearchBarText) {
      navigator.clipboard.writeText(globalSearchBarText).catch(console.error);
      setGlobalSearchBarText("");
      if (setGlobalSearchSuspended) setGlobalSearchSuspended(false);
    }
  };

  const handleSearchCounterDoubleClick = (e) => {
    if (globalSearchMarks.length > 0 && onOpenLineChoiceModal && !globalSearchSuspended) {
      const rect = e.currentTarget.getBoundingClientRect();
      onOpenLineChoiceModal({
        pos: { x: Math.max(10, rect.right - 220), y: Math.max(10, rect.top - 90) },
        maxLines: globalSearchMarks.length,
        linesArray: null,
        title: `Aller à l'occurrence (1 - ${globalSearchMarks.length})`,
        initialValue: (globalSearchOccIndex + 1).toString(),
        isOccurrenceMode: true, // Pour différenciation si besoin dans la modale
        callback: (val) => {
          const idx = parseInt(val, 10) - 1;
          if (!isNaN(idx) && idx >= 0 && idx < globalSearchMarks.length) {
            setGlobalSearchOccIndex(idx);
          }
        }
      });
    }
  };

  // Initialize or update windowing when toggling invisibles
  useEffect(() => {
    const scrollContainer = isEditable ? textareaRef.current : editorWrapperRef.current;
    if (showInvisibles && scrollContainer) {
      const el = scrollContainer;
      const lineHeight = 1.5 * fontSize;
      const startLine = Math.floor(el.scrollTop / lineHeight);
      const endLine = Math.floor((el.scrollTop + el.clientHeight) / lineHeight);
      setVisibleRange([Math.max(0, startLine - 100), endLine + 100]);
    }
  }, [showInvisibles, fontSize, isEditable]);

  const handleStatusBarDoubleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    
    // Calcul de la ligne du milieu
    let middleLine = 1;
    const scrollContainer = isEditable ? textareaRef.current : editorWrapperRef.current;
    if (scrollContainer) {
      const scrollTop = scrollContainer.scrollTop;
      const clientHeight = scrollContainer.clientHeight;
      const scrollHeight = scrollContainer.scrollHeight;
      const scrollBottom = scrollTop + clientHeight;

      if (scrollTop === 0) {
        middleLine = 1;
      } else if (Math.abs(scrollHeight - scrollBottom) <= 2) {
        middleLine = linesCount;
      } else {
        const lineHeight = 1.5 * fontSize;
        const firstVisible = Math.floor(scrollTop / lineHeight);
        const visibleLines = Math.floor(clientHeight / lineHeight);
        middleLine = firstVisible + Math.floor(visibleLines / 2) + 1;
      }
      middleLine = Math.max(1, Math.min(linesCount, middleLine));
    }

    if (onOpenLineChoiceModal) {
      onOpenLineChoiceModal({
        pos: { x: rect.left, y: rect.top - 80 },
        maxLines: linesCount,
        linesArray: null,
        title: `Aller à la ligne (1 - ${linesCount})`,
        initialValue: middleLine.toString()
      });
    }
  };

  useEffect(() => {
    if (triggerGoToLine) {
      const targetLineIndex = triggerGoToLine.line - 1;
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
          const targetLineNode = containerRef.current.children[0]?.children[targetLineIndex];
          if (targetLineNode) {
            targetLineNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }
    }
  }, [triggerGoToLine]);

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
    
    // Fusion des marqueurs normaux et de la recherche globale
    const combinedMarks = [...(marks || []), ...(globalSearchMarks || [])];
    
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
      let occCssClass = '';

      combinedMarks.forEach(mark => {
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
            if (mark.type.includes('hl-find') || mark.type.includes('hl-yellow')) {
              isOccLine = true;
              if (mark.occIndex === activeOccIndex) {
                isActiveOccLine = true;
                occCssClass = mark.type; // On privilégie la classe de l'occurrence active
              } else if (!occCssClass) {
                occCssClass = mark.type;
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
        isGutterModified,
        occCssClass
      });

      absoluteOffset += lineLength + 1; // +1 pour le saut de ligne \n
    });

    return result;
  }, [text, marks, globalSearchMarks, activeOccIndex]);

  // Scroll automatique vers l'occurrence active
  useEffect(() => {
    if (activeOccIndex !== -1 && marks.length > 0 && containerRef.current) {
      const activeMark = marks.find(m => m.occIndex === activeOccIndex);
      if (activeMark) {
        // Estimation simple de la ligne de l'occurrence
        const prevText = text.substring(0, activeMark.start);
        const lineIndex = prevText.split('\n').length - 1;
        
        const editorDOM = containerRef.current;
        const targetLineNode = editorDOM.children[0]?.children[lineIndex];
        if (targetLineNode) {
          targetLineNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [activeOccIndex, marks, text]);

  // Scroll ciblé arbitraire (ex: depuis l'historique)
  useEffect(() => {
    if (scrollTargetIndex !== null && containerRef.current && !isEditable) {
      const prevText = text.substring(0, scrollTargetIndex);
      const lineIndex = prevText.split('\n').length - 1;
      const targetLineNode = containerRef.current.children[0]?.children[lineIndex];
      if (targetLineNode) {
        targetLineNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [scrollTargetIndex, text, isEditable]);

  const handleTextareaChange = (e) => {
    setLocalEditText(normalizeText(e.target.value));
  };

  const savedScrollRef = useRef(0);
  
  const handleToggleEditableInternal = () => {
    if (isEditable) {
      savedScrollRef.current = textareaRef.current?.scrollTop || 0;
    } else {
      savedScrollRef.current = editorWrapperRef.current?.scrollTop || 0;
    }
    if (onToggleEditable) onToggleEditable();
  };

  useEffect(() => {
    if (isEditable) {
      // Un délai pour s'assurer que le textarea est monté et rendu
      setTimeout(() => {
        if (textareaRef.current) {
          const ta = textareaRef.current;
          // 1. Placer le curseur au MILIEU de l'écran visible pour que le navigateur 
          // considère que le curseur est déjà dans une "safe zone" et évite de scroller violemment.
          const lineHeight = 1.5 * fontSize;
          const middleVisibleLine = Math.floor((savedScrollRef.current + (ta.clientHeight / 2)) / lineHeight);
          
          const lines = text.split('\n');
          let charIndex = 0;
          for(let i=0; i<Math.min(middleVisibleLine, lines.length); i++) {
            charIndex += lines[i].length + 1; 
          }
          
          ta.focus({ preventScroll: true });
          ta.setSelectionRange(charIndex, charIndex);

          // 2. Écrasement brutal dans le prochain cycle d'affichage (requestAnimationFrame)
          // pour battre la tentative asynchrone du navigateur de repositionner l'écran
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              if (textareaRef.current) textareaRef.current.scrollTop = savedScrollRef.current;
            });
          });
        }
      }, 0);
    } else {
      setTimeout(() => {
        if (editorWrapperRef.current) {
          editorWrapperRef.current.scrollTop = savedScrollRef.current;
        }
      }, 0);
    }
  }, [isEditable, fontSize, text]);

  const handleSaveFreeEdit = () => {
    onTextChange(localEditText);
    handleToggleEditableInternal(); // Reverrouiller le cadenas
  };

  return (
    <div className="flex-1 flex flex-col border border-border-dark overflow-hidden bg-bg-dark rounded-sm">
      {/* Barre d'outils de l'éditeur */}
      <div 
        ref={searchContainerRef}
        className="flex flex-col bg-[#252526] border-b border-border-dark select-none"
      >
        <div className={`flex ${isSearchMultiline ? 'items-start pb-0' : 'items-stretch'} gap-2 py-1`}>
          
          {/* Bouton SMART et Label Similitude */}
          {globalSearchBarText && (
            <div className={`flex items-center gap-3 transition-opacity ${globalSearchSuspended ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
              <button 
                onClick={() => setGlobalSearchSmartMode(!globalSearchSmartMode)}
                className={`flex items-center justify-center gap-1.5 px-3 py-1 rounded font-bold text-[15px] transition-colors uppercase border ${
                  globalSearchSmartMode 
                    ? 'bg-[#FFD700] text-black border-[#FFD700] shadow-[0_0_8px_rgba(255,215,0,0.4)]' 
                    : 'bg-bg-dark text-[#888] border-border-dark hover:text-white hover:border-[#666]'
                }`}
                title="Smart Search (ignore la casse et les espaces). Désactivation auto après 30s si inactif."
              >
                <span>💡</span>
                <span className="hidden sm:inline">SMART</span>
              </button>
              
              <div className="text-[15px] uppercase font-bold text-[#aaa] flex items-center gap-2">
                Similitude : 
                <span className={`px-1.5 py-0.5 rounded font-mono text-[15px] ${
                  globalSearchFoundRatio === 1 ? 'bg-[#4caf50] text-black shadow-[0_0_5px_rgba(76,175,80,0.5)]' : 
                  globalSearchFoundRatio > 0.5 ? 'text-[#FFD700]' : 
                  'text-[#ff5555]'
                }`}>
                  {(globalSearchFoundRatio * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          )}

          {/* Conteneur Textarea + Gouttière */}
          <div 
            className={`flex-1 flex border rounded transition-colors bg-bg-dark overflow-hidden ${
              globalSearchBarText 
                ? (globalSearchSuspended ? 'border-[#666]' : (globalSearchFoundRatio === 1 ? 'border-[#4caf50]' : 'border-[#FFD700]')) 
                : 'border-border-dark'
            }`}
            style={isSearchMultiline ? { height: `${searchHeight}px` } : {}}
          >
            {/* Gouttière (visible uniquement en multiligne ou affiche juste la loupe) */}
            <div 
              className={`flex flex-col w-12 border-r border-border-dark select-none text-[10px] py-1 transition-all relative ${
                globalSearchSuspended 
                  ? 'bg-[#FFD700] text-black shadow-[0_0_8px_rgba(255,215,0,0.5)] cursor-pointer' 
                  : (globalSearchBarText ? 'bg-[#1e1e1e] text-[#666] cursor-pointer hover:bg-[#333]' : 'bg-[#1e1e1e] text-[#666]')
              }`}
              style={{ overflow: 'hidden' }}
              title={globalSearchBarText ? "Double-cliquez pour suspendre/réactiver la recherche" : ""}
              onDoubleClick={() => {
                if (globalSearchBarText && setGlobalSearchSuspended) {
                  setGlobalSearchSuspended(!globalSearchSuspended);
                }
              }}
              id="global-search-gutter"
            >
              <div className="absolute top-0 left-0 w-full flex justify-center items-center py-1 z-10 pointer-events-none" style={{ height: `${searchFontSize * 1.5}px` }}>
                <span className="text-primary-blue text-sm">🔍</span>
              </div>
              {isSearchMultiline ? (
                searchLines.map((_, i) => (
                  <div key={i} className="flex justify-center items-center h-[1.5em]" style={{ fontSize: `${searchFontSize}px` }}>
                    {i === 0 ? <span className="text-transparent">1</span> : i + 1}
                  </div>
                ))
              ) : (
                <div className="flex justify-center items-center h-full">
                  <span className="text-transparent">1</span>
                </div>
              )}
            </div>

            {/* Textarea Multiligne Adaptatif */}
            <div className={`flex-1 relative flex transition-opacity ${globalSearchSuspended ? 'opacity-50 grayscale' : ''}`}>
              <textarea
                ref={searchContainerRef}
                onScroll={(e) => {
                  const gutter = document.getElementById('global-search-gutter');
                  if (gutter) gutter.scrollTop = e.target.scrollTop;
                }}
                onWheel={(e) => {
                  if (e.ctrlKey) {
                    e.preventDefault();
                    if (e.deltaY < 0) {
                      setSearchFontSize(Math.min(40, searchFontSize + 1));
                    } else {
                      setSearchFontSize(Math.max(8, searchFontSize - 1));
                    }
                  }
                }}
                value={globalSearchBarText}
                onChange={(e) => {
                  if (!globalSearchSuspended) {
                    setGlobalSearchBarText(normalizeText(e.target.value));
                  }
                }}
                readOnly={globalSearchSuspended}
                placeholder="Recherche dynamique globale..."
                className={`w-full bg-transparent text-white outline-none py-1 px-3 font-mono resize-none custom-scrollbar ${isSearchMultiline ? 'h-full' : ''}`}
                style={{ fontSize: `${searchFontSize}px`, lineHeight: 1.5, height: isSearchMultiline ? '100%' : 'auto' }}
                spellCheck="false"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                wrap="off"
                rows={isSearchMultiline ? undefined : 1}
              />
            </div>
          </div>

          {isGlobalEscapeHatchActive ? (
            <div 
              className="text-[10px] text-center font-bold text-[#ff9800] bg-[#332200] border border-[#ff9800] rounded p-1 ml-2 cursor-pointer hover:bg-[#442200] transition-colors flex items-center"
              onDoubleClick={onForceGlobalEscapeHatch}
              title="Double-cliquez pour ignorer cette sécurité et forcer la recherche (risque de lag)"
            >
              ⚠️ Texte trop court (double-cliquez pour forcer)
            </div>
          ) : globalSearchBarText ? (
            /* Navigation & Copier */
            <div className={`flex items-stretch gap-3 ml-2 border-l border-border-dark pl-3 ${isSearchMultiline ? 'py-1' : ''}`}>
              {globalSearchMarks.length > 0 && !globalSearchSuspended && (
                <div className="flex items-center gap-2 justify-center min-w-[120px]">
                  <span 
                    className="font-mono text-[15px] font-bold cursor-pointer hover:text-white transition-colors text-[#FFD700]"
                    onDoubleClick={handleSearchCounterDoubleClick}
                    title="Double-cliquez pour aller à une occurrence"
                  >
                    - {globalSearchOccIndex + 1} / <span className="text-[#FF4500]">{globalSearchMarks.length}</span>
                  </span>
                  <div className="flex gap-1 items-stretch">
                    <button 
                      onClick={() => setGlobalSearchOccIndex(Math.max(0, globalSearchOccIndex - 1))}
                      className="bg-bg-dark hover:bg-border-dark border border-border-dark text-[#888] hover:text-white px-2 py-1 rounded text-[15px]"
                    >▲</button>
                    <button 
                      onClick={() => setGlobalSearchOccIndex(Math.min(globalSearchMarks.length - 1, globalSearchOccIndex + 1))}
                      className="bg-bg-dark hover:bg-border-dark border border-border-dark text-[#888] hover:text-white px-2 py-1 rounded text-[15px]"
                    >▼</button>
                  </div>
                </div>
              )}

              {/* Bouton Copier et Supprimer */}
              <button
                onClick={handleCopyAndDeleteSearch}
                className={`px-3 py-1 rounded text-[15px] font-bold transition-all uppercase flex items-center justify-center gap-1.5 ${
                  globalSearchFoundRatio === 1
                    ? 'bg-[#4caf50] hover:bg-[#45a049] text-black shadow-[0_0_8px_rgba(76,175,80,0.5)]'
                    : 'bg-bg-dark border border-border-dark text-[#666] hover:text-[#888]'
                }`}
                title="Copier le texte et effacer la recherche"
              >
                <span>📋</span> <span className="hidden lg:inline">Copier & Supprimer</span>
              </button>
            </div>
          ) : null}
        </div>
        
        {isSearchMultiline && (
          <Splitter 
            direction="horizontal" 
            onResize={(clientY) => {
              if (searchContainerRef.current) {
                const top = searchContainerRef.current.getBoundingClientRect().top;
                const maxHeight = window.innerHeight * 0.25;
                let newHeight = clientY - top - 10;
                if (newHeight < 60) newHeight = 60;
                if (newHeight > maxHeight) newHeight = maxHeight;
                setSearchHeight(newHeight);
              }
            }} 
          />
        )}
      </div>

      {/* Zone de Code Centrale avec Filigrane */}
      <div className="flex-1 relative overflow-hidden bg-bg-dark">
        {/* Filigrane fixe en arrière-plan (uniquement en lecture seule) */}
        {!isEditable && !showInvisibles && (
          <div 
            className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden" 
            style={{ zIndex: 0 }}
          >
            <img 
              src={logoGhb}
              alt="Filigrane Rogue Cherry"
              className="w-auto opacity-30 select-none max-w-[80%] max-h-[50%]"
            />
          </div>
        )}
        <div 
          ref={editorWrapperRef}
          className="absolute inset-0 overflow-auto font-consolas select-text" 
          style={{ fontSize: `${fontSize}px`, zIndex: 1 }}
        onScroll={(e) => {
          if (showInvisibles) {
            const scrollTop = e.target.scrollTop;
            const clientHeight = e.target.clientHeight;
            const lineHeight = 1.5 * fontSize;
            const startLine = Math.floor(scrollTop / lineHeight);
            const endLine = Math.floor((scrollTop + clientHeight) / lineHeight);
            
            const newStart = Math.max(0, startLine - 100);
            const newEnd = endLine + 100;
            
            setVisibleRange(prev => {
              // Optimisation critique : on ne met à jour le state que si le décalage est significatif (ex: 20 lignes)
              // pour éviter de re-rendre CodeEditor sur chaque pixel de scroll.
              if (Math.abs(prev[0] - newStart) > 20 || Math.abs(prev[1] - newEnd) > 20) {
                return [newStart, newEnd];
              }
              return prev;
            });
          }
        }}
      >
        {isEditable ? (
          // Mode Édition Libre : Textarea fluide anti-lag avec Gouttière
          <div className="flex w-full h-full">
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
                    <span className={`pl-1 font-bold
                      ${isModified ? 'bg-gutter-mod text-black rounded-sm text-[0.8em]' : ''}
                      ${isTargeted ? 'outline outline-1 outline-red-500 rounded-sm shadow-[0_0_5px_rgba(239,68,68,0.8)] z-10 relative bg-bg-dark text-white' : ''}
                      ${isModified || isTargeted ? 'px-[2px]' : ''}
                    `}>
                      {i + 1}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex-1 relative overflow-hidden">
              {showInvisibles && (
                <div 
                  className="absolute inset-0 pointer-events-none whitespace-pre p-3 text-text-light font-mono overflow-hidden"
                  style={{ fontSize: 'inherit', lineHeight: 1.5, color: 'transparent' }}
                  ref={(el) => {
                    if (el && textareaRef.current) {
                      el.scrollTop = textareaRef.current.scrollTop;
                      el.scrollLeft = textareaRef.current.scrollLeft;
                    }
                    window._editorBackdropRef = el;
                  }}
                  dangerouslySetInnerHTML={{ __html: renderInvisiblesHtml(localEditText, true, visibleRange) }}
                />
              )}
              <textarea
                ref={textareaRef}
                value={localEditText}
                onChange={handleTextareaChange}
                onKeyDown={(e) => {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    const start = e.target.selectionStart;
                    const end = e.target.selectionEnd;
                    const newText = localEditText.substring(0, start) + "\t" + localEditText.substring(end);
                    setLocalEditText(newText);
                    setTimeout(() => {
                      if (textareaRef.current) {
                        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 1;
                      }
                    }, 0);
                  }
                }}
                onScroll={(e) => {
                  if (gutterRef.current) {
                    gutterRef.current.scrollTop = e.target.scrollTop;
                  }
                  if (window._editorBackdropRef) {
                    window._editorBackdropRef.scrollTop = e.target.scrollTop;
                    window._editorBackdropRef.scrollLeft = e.target.scrollLeft;
                  }
                  
                  if (showInvisibles) {
                    const scrollTop = e.target.scrollTop;
                    const clientHeight = e.target.clientHeight;
                    const lineHeight = 1.5 * fontSize;
                    const startLine = Math.floor(scrollTop / lineHeight);
                    const endLine = Math.floor((scrollTop + clientHeight) / lineHeight);
                    
                    const newStart = Math.max(0, startLine - 100);
                    const newEnd = endLine + 100;
                    
                    setVisibleRange(prev => {
                      if (Math.abs(prev[0] - newStart) > 20 || Math.abs(prev[1] - newEnd) > 20) {
                        return [newStart, newEnd];
                      }
                      return prev;
                    });
                  }
                }}
                  spellCheck="false"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  wrap="off"
                  className="w-full h-full p-3 bg-transparent font-mono border-none outline-none resize-none overflow-auto whitespace-pre text-text-light"
                  style={{ fontSize: 'inherit', lineHeight: 1.5 }}
                />
            </div>
          </div>
        ) : (
          // Mode Lecture Seule : Rendu mémoïsé par lignes ultra-performant
          <div 
            ref={containerRef}
            className="w-full min-h-full py-2 text-text-light overflow-x-auto select-text code-safe-render relative bg-transparent"
          >
            <div className="relative z-10 w-full">
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
                    showInvisibles={showInvisibles && line.number - 1 >= visibleRange[0] && line.number - 1 <= visibleRange[1]}
                    occCssClass={line.occCssClass}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
      {/* Status Bar */}
      <div 
        className="flex justify-between items-center bg-[#007acc] text-white px-4 py-1.5 text-xs font-bold font-sans select-none flex-shrink-0 z-10 cursor-pointer"
        onDoubleClick={handleStatusBarDoubleClick}
        title="Double-clic pour aller à une ligne spécifique"
      >
        <div className="flex items-center gap-3">
          {!isEditable ? (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); handleToggleEditableInternal(); }}
                className="hover:opacity-80 transition text-base"
                title="Déverrouiller l'édition libre du texte source"
              >
                🔒
              </button>
              <span className="uppercase text-[#d4d4d4] tracking-wider">👁️ MODE LECTURE SEULE</span>
            </>
          ) : (
            <>
              <span className="uppercase text-[#FFD700] tracking-wider">✏️ MODE ÉDITION LIBRE</span>
              <button 
                onClick={(e) => { e.stopPropagation(); handleSaveFreeEdit(); }}
                className="bg-cherry-red hover:bg-cherry-red-hover text-white animate-pulse text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1"
                title="Valider les modifications et verrouiller"
              >
                🔓 <span>ENREGISTRER</span>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setLocalEditText(text); handleToggleEditableInternal(); }} 
                className="bg-black/20 hover:bg-black/40 text-white px-2 py-0.5 rounded text-[10px]"
                title="Annuler les modifications en cours"
              >
                Annuler
              </button>
            </>
          )}

          {statusBarInfo && statusBarInfo !== 'Mode Normal' && (
            <span className="ml-4 border-l border-white/30 pl-4 text-white/90 font-normal">
              {statusBarInfo}
            </span>
          )}
        </div>

        <div className="flex gap-4 items-center">
          <span>{linesCount} Lignes</span>
          <span>{charsCount} Caractères</span>
          <span>UTF-8</span>
          <button
            className="hover:bg-black/20 p-1 rounded transition-colors"
            onClick={(e) => { e.stopPropagation(); setShowInvisibles(!showInvisibles); }}
            title="Affiche ou cache les caractères invisibles dans le texte principal"
          >
            <EyeIcon active={showInvisibles} />
          </button>
        </div>
      </div>

    </div>
  );
}
