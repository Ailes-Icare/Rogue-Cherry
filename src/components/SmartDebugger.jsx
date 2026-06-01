import React, { useState, useEffect, useRef, useMemo } from 'react';
import Splitter from './Splitter.jsx';
import faviconSvg from '../assets/brand/FAVICON.svg';
import { parseSyntaxRequest } from '../utils/textParser.js';
import { renderInvisiblesHtml, normalizeText } from '../utils/helpers.js';
import { computeSearchHeatmap, computeLiveDiff } from '../utils/diffEngine.js';
import { useZoomable } from '../hooks/useZoomable.js';
import { applyDeltaOnText } from '../hooks/useHistoryStore.js';
import { useDraggable } from '../hooks/useDraggable.js';
import { useMessageBox } from '../context/MessageBoxContext.jsx';
import LineChoiceModal from './LineChoiceModal.jsx';

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

function renderSyntaxHighlightHtml(text, syntax, showInvisibles = true) {
  if (!text) return "";
  
  // Remplacements des balises syntaxiques par du HTML stylisé
  let escaped = renderInvisiblesHtml(text, showInvisibles);
  
  const tags = [
    { tag: syntax.START, style: 'bg-primary-blue text-white px-1 rounded font-bold' },
    { tag: syntax.FIND, style: 'bg-[#FF8C00] text-black px-1 rounded font-bold' },
    { tag: syntax.REPLACE, style: 'bg-[#FF8C00] text-black px-1 rounded font-bold' },
    { tag: syntax.END, style: 'bg-[#9E67BA] text-white px-1 rounded font-bold' }
  ];

  tags.forEach(({ tag, style }) => {
    // Échapper d'abord la balise brute car renderInvisiblesHtml l'a déjà échappée
    const escapedTag = tag.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    const regex = new RegExp(escapedTag, 'g');
    escaped = escaped.replace(regex, `<span class="${style}">${escapedTag}</span>`);
  });

  return escaped;
}

/**
 * Fragment de ligne surligné de façon chirurgicale pour le miroir.
 */
function renderLineContent(text, lineMarks, showInvisibles = false) {
  const renderChunk = (chunk, isMark, markProps = {}) => {
    let content = chunk;
    if (showInvisibles) {
      const parts = [];
      let buf = "";
      for (let i = 0; i < chunk.length; i++) {
        if (chunk[i] === ' ' || chunk[i] === '\t') {
          if (buf) { parts.push(buf); buf = ""; }
          if (chunk[i] === ' ') parts.push(<span key={`sp-${i}`} className="hc-space"> </span>);
          else parts.push(<span key={`tb-${i}`} className="hc-tab">\t</span>);
        } else {
          buf += chunk[i];
        }
      }
      if (buf) parts.push(buf);
      content = parts;
    }
    if (isMark) {
      return <mark key={markProps.key} className={markProps.className}>{content}</mark>;
    }
    return content;
  };

  if (!lineMarks || lineMarks.length === 0) {
    return renderChunk(text, false);
  }
  
  const sorted = [...lineMarks].sort((a, b) => a.start - b.start);
  const elements = [];
  let lastIdx = 0;
  
  sorted.forEach((mark, index) => {
    if (mark.start > lastIdx) {
      elements.push(<React.Fragment key={`text-${index}-${lastIdx}`}>{renderChunk(text.substring(lastIdx, mark.start), false)}</React.Fragment>);
    }
    const highlighted = text.substring(mark.start, mark.start + mark.length);
    elements.push(renderChunk(highlighted, true, { key: `${index}-${mark.start}`, className: mark.type }));
    lastIdx = mark.start + mark.length;
  });
  
  if (lastIdx < text.length) {
    elements.push(<React.Fragment key={`text-end-${lastIdx}`}>{renderChunk(text.substring(lastIdx), false)}</React.Fragment>);
  }
  
  return elements;
}

/**
 * Ligne de miroir mémoïsée pour éviter les re-rendus massifs lors du scroll (Windowing).
 */
const MirrorLine = React.memo(({ line, showMirrorInvisibles, isVisible, isTargeted }) => {
  const showInvisibles = showMirrorInvisibles && isVisible;

  return (
    <div 
      className={`flex hover:bg-bg-panel-light/20 cursor-default select-text ${
        line.isHighlightLine ? 'bg-[#59466D]/15' : ''
      }`}
    >
      <div className="w-10 pr-2 text-right text-[#555] bg-bg-panel/40 border-r border-border-dark flex justify-between items-center select-none text-[9px] font-sans">
        <span className="pl-0.5 flex items-center h-full">
          {line.isActiveOccLine ? (
            <span className="bg-primary-blue text-white w-3 h-3 flex items-center justify-center rounded-[2px] text-[8px]" title="Occurrence active">▶</span>
          ) : line.isHighlightLine ? (
            <span className={line.cssClass.includes('hl-yellow') ? 'text-gutter-mod/70' : 'text-[#FFD700]/70'} title="Occurrence trouvée">●</span>
          ) : null}
        </span>
        <span className={`
          ${isTargeted ? 'outline outline-1 outline-red-500 rounded-sm shadow-[0_0_5px_rgba(239,68,68,0.8)] z-10 relative bg-bg-dark text-white px-[2px]' : ''}
        `}>
          {line.number}
        </span>
      </div>
      
      <div className="flex-1 pl-2.5 whitespace-pre text-left overflow-x-auto overflow-y-hidden min-w-0 select-text">
        {line.text === "" ? (showInvisibles ? <span className="hc-nl"></span> : "\n") : (
          <>
            {renderLineContent(line.text, line.marks, showInvisibles)}
            {showInvisibles && <span className="hc-nl"></span>}
          </>
        )}
      </div>
    </div>
  );
});

MirrorLine.displayName = 'MirrorLine';

/**
 * Modale de débogage intelligente pour requêtes IA défaillantes.
 */
export default function SmartDebugger({
  isOpen,
  onClose,
  initialRawText,
  sourceText,
  onApply,
  onAcceptAndCopy,
  syntaxConfig,
  searchLimits,
  setSearchLimits,
  isMultistackMode
}) {
  const { showCustom } = useMessageBox();
  const [rawText, setRawText] = useState(initialRawText || "");
  const [showInvisibles, setShowInvisibles] = useState(true);
  const [showMirrorInvisibles, setShowMirrorInvisibles] = useState(false);
  const [mirrorVisibleRange, setMirrorVisibleRange] = useState([0, 200]);
  const [leftWidthPercent, setLeftWidthPercent] = useState(40); // Pourcentage de largeur de la colonne gauche

  // Nouveaux états V8
  const [isFindActive, setIsFindActive] = useState(true);
  const [isReplaceActive, setIsReplaceActive] = useState(false);
  const [searchBarText, setSearchBarText] = useState("");
  const [isSearchSmartMode, setIsSearchSmartMode] = useState(false);
  const [searchOccIndex, setSearchOccIndex] = useState(0);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isSearchSuspended, setIsSearchSuspended] = useState(false);
  const [targetHighlightLine, setTargetHighlightLine] = useState(null);
  const targetHighlightTimerRef = useRef(null);
  const findClickTimeoutRef = useRef(null);
  const [lineChoiceModalConfig, setLineChoiceModalConfig] = useState(null);
  
  const [searchFontSize, setSearchFontSize] = useState(14);
  const [searchHeight, setSearchHeight] = useState(100);
  const searchContainerRef = useRef(null);

  const searchLines = searchBarText ? searchBarText.split('\n') : [];
  const isSearchMultiline = searchLines.length > 1;
  const rawBackdropRef = useRef(null);
  const rawTextareaRef = useRef(null);
  const findBackdropRef = useRef(null);
  const findTextareaRef = useRef(null);
  const replaceBackdropRef = useRef(null);
  const replaceTextareaRef = useRef(null);

  // Référence pour le défilement du miroir
  const zoomRefMirror = useZoomable(10); // Remplace mirrorScrollRef
  const mirrorContainerRef = useRef(null);

  const zoomRefRaw = useZoomable(14);
  const zoomRefFind = useZoomable(14);
  const zoomRefReplace = useZoomable(14);

  useEffect(() => {
    if (isOpen) {
      setRawText(normalizeText(initialRawText || ""));
    }
  }, [isOpen, initialRawText]);

  // Défilement synchrone des zones textuelles du débogueur
  const handleScrollRaw = () => {
    if (rawBackdropRef.current && rawTextareaRef.current) {
      rawBackdropRef.current.scrollTop = rawTextareaRef.current.scrollTop;
      rawBackdropRef.current.scrollLeft = rawTextareaRef.current.scrollLeft;
    }
  };

  const handleScrollFind = () => {
    if (findBackdropRef.current && findTextareaRef.current) {
      findBackdropRef.current.scrollTop = findTextareaRef.current.scrollTop;
      findBackdropRef.current.scrollLeft = findTextareaRef.current.scrollLeft;
    }
  };

  const handleScrollReplace = () => {
    if (replaceBackdropRef.current && replaceTextareaRef.current) {
      replaceBackdropRef.current.scrollTop = replaceTextareaRef.current.scrollTop;
      replaceBackdropRef.current.scrollLeft = replaceTextareaRef.current.scrollLeft;
    }
  };

  useEffect(() => {
    handleScrollRaw();
    handleScrollFind();
    handleScrollReplace();
  }, [rawText, showInvisibles, isOpen]);

  // Calcul du windowing pour le miroir lors de l'activation
  useEffect(() => {
    if (showMirrorInvisibles && zoomRefMirror.current) {
      const el = zoomRefMirror.current;
      const computedStyle = window.getComputedStyle(el);
      const fontSize = parseFloat(computedStyle.fontSize) || 10;
      const lineHeight = 1.625 * fontSize;
      const startLine = Math.floor(el.scrollTop / lineHeight);
      const endLine = Math.floor((el.scrollTop + el.clientHeight) / lineHeight);
      setMirrorVisibleRange([Math.max(0, startLine - 100), endLine + 100]);
    }
  }, [showMirrorInvisibles]);

  // Analyse syntaxique réactive en direct
  const parsedRequest = useMemo(() => {
    return parseSyntaxRequest(rawText, syntaxConfig);
  }, [rawText, syntaxConfig]);

  // Synchronisation bidirectionnelle : éditer FIND met à jour la Requête Brute
  const handleFindChange = (val) => {
    if (!parsedRequest.isValid) return;
    const multiTag = parsedRequest.multiMode ? '[MULTI:TRUE]' : '[MULTI:FALSE]';
    const smartTag = parsedRequest.smartMode ? '[SMART:TRUE]' : '[SMART:FALSE]';
    const labelTag = parsedRequest.label ? `[LABEL:${parsedRequest.label}]` : '';
    const header = `${syntaxConfig.START} ${labelTag} ${multiTag} ${smartTag}`.replace(/\s+/g, ' ').trim();
    const newRaw = `${header}\n${syntaxConfig.FIND}\n${val}\n${syntaxConfig.REPLACE}\n${parsedRequest.replaceText || ''}\n${syntaxConfig.END}`;
    setRawText(newRaw);
  };

  // Synchronisation bidirectionnelle : éditer REPLACE met à jour la Requête Brute
  const handleReplaceChange = (val) => {
    if (!parsedRequest.isValid) return;
    const multiTag = parsedRequest.multiMode ? '[MULTI:TRUE]' : '[MULTI:FALSE]';
    const smartTag = parsedRequest.smartMode ? '[SMART:TRUE]' : '[SMART:FALSE]';
    const labelTag = parsedRequest.label ? `[LABEL:${parsedRequest.label}]` : '';
    const header = `${syntaxConfig.START} ${labelTag} ${multiTag} ${smartTag}`.replace(/\s+/g, ' ').trim();
    const newRaw = `${header}\n${syntaxConfig.FIND}\n${parsedRequest.findText || ''}\n${syntaxConfig.REPLACE}\n${val}\n${syntaxConfig.END}`;
    setRawText(newRaw);
  };

  const handleCopyAndDeleteSearch = () => {
    if (searchBarText) {
      handleFindChange(searchBarText);
      navigator.clipboard.writeText(searchBarText).catch(console.error);
      setSearchBarText("");
      setIsSearchSuspended(false);
    }
  };

  // Bascule du Smart Mode depuis la Checkbox
  const handleSmartChange = (checked) => {
    if (!parsedRequest.isValid) return;
    const multiTag = parsedRequest.multiMode ? '[MULTI:TRUE]' : '[MULTI:FALSE]';
    const smartTag = checked ? '[SMART:TRUE]' : '[SMART:FALSE]';
    const labelTag = parsedRequest.label ? `[LABEL:${parsedRequest.label}]` : '';
    const header = `${syntaxConfig.START} ${labelTag} ${multiTag} ${smartTag}`.replace(/\s+/g, ' ').trim();
    const newRaw = `${header}\n${syntaxConfig.FIND}\n${parsedRequest.findText || ''}\n${syntaxConfig.REPLACE}\n${parsedRequest.replaceText || ''}\n${syntaxConfig.END}`;
    setRawText(newRaw);
  };

  // Recherche live dichotomique heatmap par rapport à la zone FIND extraite ou barre de recherche
  const isGlobalSearchActive = Boolean(searchBarText && !isSearchSuspended);
  const activeSearchText = isGlobalSearchActive ? searchBarText : (parsedRequest && parsedRequest.isValid && isFindActive ? parsedRequest.findText : "");
  const activeSmartMode = isGlobalSearchActive ? isSearchSmartMode : ((parsedRequest && parsedRequest.isValid) ? parsedRequest.smartMode : false);

  const [forceSearchOverride, setForceSearchOverride] = useState(false);
  
  useEffect(() => {
    setForceSearchOverride(false);
  }, [activeSearchText]);

  const isEscapeHatchActive = useMemo(() => {
    if (!sourceText || !activeSearchText) return false;
    const linesCount = sourceText.split('\n').length;
    return (linesCount > searchLimits.maxLines && activeSearchText.length > 0 && activeSearchText.length < searchLimits.minChars && !forceSearchOverride);
  }, [sourceText, activeSearchText, searchLimits, forceSearchOverride]);

  const handleEscapeHatchDoubleClick = async () => {
    const res = await showCustom({
      title: "Attention : Risque de ralentissement",
      message: "Forcer la recherche dynamique pour une occurrence courte dans un texte long risque de ralentir fortement l'application.",
      buttons: [
        { label: 'Annuler', value: 'cancel', variant: 'secondary' },
        { label: 'Éditer les limites', value: 'edit', variant: 'secondary' },
        { label: 'Forcer la recherche', value: 'accept', variant: 'primary' }
      ]
    });
    
    if (res === 'accept') {
      setForceSearchOverride(true);
    } else if (res === 'edit') {
      const editRes = await showCustom({
        title: "Éditer les limites de l'échappement",
        message: "Définissez les nouvelles limites pour la sécurité anti-lag de la recherche dynamique :",
        inputs: [
          { id: 'maxLines', type: 'number', label: "Nombre maximal de lignes tolérées dans le texte principal", defaultValue: searchLimits.maxLines },
          { id: 'minChars', type: 'number', label: "Nombre minimum de caractères requis pour lancer la recherche", defaultValue: searchLimits.minChars }
        ],
        buttons: [
          { label: 'Annuler', value: null, variant: 'secondary' },
          { label: 'Valider', value: 'submit', variant: 'primary' }
        ]
      });
      if (editRes && editRes !== 'cancel') {
        const newMaxLines = parseInt(editRes.maxLines) || 500;
        const newMinChars = parseInt(editRes.minChars) || 3;
        setSearchLimits({ maxLines: newMaxLines, minChars: newMinChars });
      }
    }
  };

  const searchResult = useMemo(() => {
    if (isEscapeHatchActive) return { marks: [], foundRatio: 0 };
    const res = computeSearchHeatmap(sourceText, activeSearchText, activeSmartMode);
    // Si la recherche n'est pas forcée par la barre, et que le bouton Find est désactivé, 
    // on purge les marques visuelles mais on conserve le ratio pour les boutons de validation
    if (!searchBarText && !isFindActive) {
      res.marks = [];
    }
    return res;
  }, [sourceText, activeSearchText, activeSmartMode, searchBarText, isFindActive, isEscapeHatchActive]);

  // Fix bounds pour searchOccIndex
  useEffect(() => {
    if (searchResult.marks.length > 0) {
      if (searchOccIndex >= searchResult.marks.length) setSearchOccIndex(searchResult.marks.length - 1);
    } else {
      setSearchOccIndex(0);
    }
  }, [searchResult.marks.length, searchOccIndex]);

  // Si Replace est actif, on précalcule le texte de remplacement
  const displayedSourceText = useMemo(() => {
    if (!searchBarText && isReplaceActive && parsedRequest.isValid && searchResult.foundRatio === 1) {
      return applyDeltaOnText(
        sourceText,
        parsedRequest.findText,
        parsedRequest.replaceText,
        parsedRequest.multiMode,
        parsedRequest.multiIndices,
        parsedRequest.smartMode
      );
    }
    return sourceText;
  }, [searchBarText, isReplaceActive, parsedRequest, searchResult.foundRatio, sourceText]);

  // Si Replace est actif, on calcule les marques de diff pour le miroir
  const mirrorMarks = useMemo(() => {
    if (!searchBarText && isReplaceActive && parsedRequest.isValid && searchResult.foundRatio === 1) {
      const { marksT2 } = computeLiveDiff(sourceText, displayedSourceText, false);
      return marksT2;
    }
    return searchResult.marks;
  }, [searchBarText, isReplaceActive, parsedRequest, searchResult.foundRatio, sourceText, displayedSourceText, searchResult.marks]);

  // Précalcule les lignes pour le miroir de texte source droit
  const mirrorLineRecords = useMemo(() => {
    if (!displayedSourceText) return [];
    const lines = displayedSourceText.split('\n');
    const marks = mirrorMarks;
    let absoluteOffset = 0;
    
    return lines.map((lineText, i) => {
      const lineLength = lineText.length;
      const lineStart = absoluteOffset;
      const lineEnd = lineStart + lineLength;
      
      const lineMarks = [];
      let isHighlightLine = false;
      let isActiveOccLine = false;
      let cssClass = '';

      marks.forEach(mark => {
        const mStart = mark.start;
        const mEnd = mark.start + mark.length;
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
            isHighlightLine = true;
            if (mark.occIndex === searchOccIndex) {
              isActiveOccLine = true;
              cssClass = mark.type;
            } else if (!cssClass) {
              cssClass = mark.type;
            }
          }
        }
      });

      absoluteOffset += lineLength + 1;

      return {
        number: i + 1,
        text: lineText,
        marks: lineMarks,
        isHighlightLine,
        isActiveOccLine,
        cssClass
      };
    });
  }, [sourceText, searchResult, displayedSourceText, mirrorMarks, searchOccIndex]);

  // Scroll automatique et mise en évidence (liseret rouge) vers la meilleure occurrence trouvée
  useEffect(() => {
    if (searchResult.marks.length > 0 && mirrorContainerRef.current) {
      const safeIndex = Math.min(searchOccIndex, searchResult.marks.length - 1);
      const targetMark = searchResult.marks[safeIndex];
      if (!targetMark) return;
      const prevText = displayedSourceText.substring(0, targetMark.start);
      const lineIndex = prevText.split('\n').length - 1;
      
      const mirrorContainer = mirrorContainerRef.current;
      // Note: children inclut potentiellement d'autres éléments, il vaut mieux cibler l'index de la ligne
      const targetLineNode = mirrorContainer.children[lineIndex];
      if (targetLineNode) {
        targetLineNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      setTargetHighlightLine(lineIndex + 1);
      if (targetHighlightTimerRef.current) clearTimeout(targetHighlightTimerRef.current);
      targetHighlightTimerRef.current = setTimeout(() => {
        setTargetHighlightLine(null);
      }, 1500);
    }
  }, [searchResult, displayedSourceText, searchOccIndex]);

  const { modalRef, dragHandlers, style } = useDraggable();

  if (!isOpen) return null;

  // Calcul du rendu HTML des calques
  const rawBackdropHtml = renderSyntaxHighlightHtml(rawText, syntaxConfig, showInvisibles);
  const findBackdropHtml = renderInvisiblesHtml(parsedRequest.findText || "", showInvisibles);
  const replaceBackdropHtml = renderInvisiblesHtml(parsedRequest.replaceText || "", showInvisibles);

  const handleValidateAndApply = () => {
    if (parsedRequest && parsedRequest.isValid) {
      onApply({
        findText: parsedRequest.findText,
        replaceText: parsedRequest.replaceText,
        label: parsedRequest.label,
        multiMode: parsedRequest.multiMode,
        multiIndices: parsedRequest.multiIndices,
        smartMode: parsedRequest.smartMode,
        comment: parsedRequest.comment
      });
      onClose();
    }
  };

  const handleValidateAndCopy = () => {
    if (parsedRequest && parsedRequest.isValid) {
      onAcceptAndCopy({
        findText: parsedRequest.findText,
        replaceText: parsedRequest.replaceText,
        label: parsedRequest.label,
        multiMode: parsedRequest.multiMode,
        multiIndices: parsedRequest.multiIndices,
        smartMode: parsedRequest.smartMode,
        comment: parsedRequest.comment
      });
      onClose();
    }
  };

  const handleResize = (newX) => {
    const percent = (newX / window.innerWidth) * 100;
    if (percent > 20 && percent < 80) {
      setLeftWidthPercent(percent);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[1000] flex justify-center items-center box-sizing-border select-none p-4 pointer-events-none">
      
      {/* Cadre de la Modale */}
      <div 
        ref={modalRef}
        style={{
          borderColor: parsedRequest.isValid ? '#00FF7F' : '#d16969',
          boxShadow: parsedRequest.isValid ? '0 0 15px rgba(0, 255, 127, 0.25)' : '0 0 15px rgba(209, 105, 105, 0.25)',
          ...style
        }}
        className="bg-bg-panel w-[90%] h-[95%] border flex flex-col shadow-2xl rounded-md overflow-hidden transition-[box-shadow,border-color] duration-300 pointer-events-auto"
      >
        
        {/* Header de la Modale */}
        <div 
          className="flex justify-between items-center p-3 bg-bg-dark border-b border-border-dark flex-shrink-0 cursor-move"
          {...dragHandlers}
        >
          <div className="flex items-center gap-3">
            <img src={faviconSvg} alt="" className="w-12 h-12 -ml-2 -mt-1 drop-shadow-md" />
            <span className="text-[1.25em] font-extrabold text-[#FF8C00] uppercase tracking-wide">
              🛠️ DÉBOGUEUR DE REQUÊTE IA
            </span>
            <span className={`text-xxs px-2 py-0.5 rounded font-bold ${
              parsedRequest.isValid ? 'bg-gutter-mod/20 text-gutter-mod border border-gutter-mod/50' : 'bg-cherry-red/20 text-cherry-red border border-cherry-red/50 animate-pulse'
            }`}>
              {parsedRequest.isValid ? '✓ REQUÊTE CONFORME' : '✗ SYNTAXE INVALIDE'}
            </span>
          </div>
          <button 
            onClick={onClose} 
            className="bg-cherry-red hover:bg-cherry-red-hover text-white font-extrabold px-3 py-1 rounded shadow transition"
          >
            X
          </button>
        </div>

        {/* Body Divisé en 2 Colonnes */}
        <div className="flex-1 flex overflow-hidden p-3.5 gap-2.5 min-h-0 select-none">
          
          {/* Colonne Gauche (Requête Brute et Zones extraites) */}
          <div 
            style={{ width: `${leftWidthPercent}%` }}
            className={`flex flex-col gap-3 flex-shrink-0 min-w-[200px] transition-opacity ${isGlobalSearchActive ? 'opacity-40 grayscale pointer-events-none' : ''}`}
          >
            
            {/* Ligne En-tête Requête brute */}
            <div className="flex justify-between items-center flex-shrink-0">
              <span className="text-xs text-[#aaa] font-bold uppercase">Requête Brute (Éditable)</span>
              <div className="flex gap-3 items-center">
                <button 
                  onClick={() => handleSmartChange(!parsedRequest.smartMode)}
                  disabled={!parsedRequest.isValid}
                  className={`flex items-center justify-center gap-1.5 px-2 py-0.5 rounded font-bold text-[11px] transition-colors uppercase border ${
                    parsedRequest.isValid && parsedRequest.smartMode 
                      ? 'bg-[#FFD700] text-black border-[#FFD700] shadow-[0_0_8px_rgba(255,215,0,0.4)]' 
                      : 'bg-bg-dark text-[#888] border-border-dark hover:text-white hover:border-[#666] disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                  title="Smart Mode (ignore la casse et les espaces dans la Requête Brute)"
                >
                  <span>💡</span>
                  <span>SMART</span>
                </button>
                <button
                  className="hover:bg-black/20 p-0.5 rounded transition-colors"
                  onClick={() => setShowInvisibles(!showInvisibles)}
                  title="Affiche ou cache les caractères invisibles"
                >
                  <EyeIcon active={showInvisibles} />
                </button>
              </div>
            </div>

            {/* Zone Requête Brute - Double calque */}
            <div 
              ref={zoomRefRaw}
              className={`h-[160px] border border-dashed border-primary-blue bg-bg-dark rounded-sm relative overflow-hidden flex-shrink-0 ${isGlobalSearchActive ? 'cursor-not-allowed' : ''}`}
              style={{ fontSize: 'var(--zoom-size, 14px)' }}
            >
              <div 
                ref={rawBackdropRef}
                className="backdrop-layer select-none"
                style={{ fontSize: 'inherit' }}
                dangerouslySetInnerHTML={{ __html: rawBackdropHtml }}
              />
              <textarea
                ref={rawTextareaRef}
                value={rawText}
                onChange={(e) => setRawText(normalizeText(e.target.value))}
                onScroll={handleScrollRaw}
                readOnly={isGlobalSearchActive}
                spellCheck="false"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                className={`overlay-layer text-left ${isGlobalSearchActive ? 'cursor-not-allowed' : ''}`}
                style={{ fontSize: 'inherit' }}
              />
            </div>

            {/* Messages d'erreur syntaxiques */}
            {!parsedRequest.isValid && parsedRequest.error && (
              <div className="bg-cherry-red/10 border-l-4 border-cherry-red text-cherry-red text-xxs p-2 rounded-sm font-medium animate-fadeIn flex-shrink-0 select-text">
                ⚠️ {parsedRequest.error}
              </div>
            )}

            {/* Zone FIND extraite */}
            <div className="flex-1 flex flex-col min-h-[80px]">
              <div className="flex justify-between items-center mb-1 flex-shrink-0 select-none">
                <span className={`text-xxs font-bold uppercase ${isReplaceActive ? 'text-[#aaa]/50' : 'text-[#aaa]'}`}>Zone FIND Décodée (Lecture Seule)</span>
                <div className="flex items-center gap-1">
                  <div 
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold transition-colors select-none flex items-center gap-1.5 ${
                       isGlobalSearchActive
                         ? 'bg-[#331111] text-[#883333] cursor-not-allowed border border-[#552222]'
                         : isReplaceActive 
                            ? 'bg-[#FF8C00]/20 text-[#FF8C00]/50 cursor-not-allowed'
                            : (parsedRequest.isValid && searchResult.foundRatio === 1)
                                ? (isFindActive ? 'bg-[#00FF7F] text-black shadow-[0_0_8px_rgba(0,255,127,0.6)] cursor-pointer' : 'bg-[#555] text-[#00FF7F] cursor-pointer')
                                : (isFindActive ? 'bg-[#FF8C00] text-black cursor-pointer' : 'bg-[#555] text-[#FF8C00] cursor-pointer')
                    }`}
                    title={isGlobalSearchActive ? 'Désactivé (Search globale active)' : isReplaceActive ? 'Désactivé (Replace actif)' : 'Simple-clic pour ouvrir, double-clic pour activer/désactiver'}
                    onClick={(e) => {
                      if (isGlobalSearchActive || isReplaceActive) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      
                      if (findClickTimeoutRef.current) {
                        clearTimeout(findClickTimeoutRef.current);
                        findClickTimeoutRef.current = null;
                        setIsFindActive(prev => !prev);
                      } else {
                        findClickTimeoutRef.current = setTimeout(() => {
                          findClickTimeoutRef.current = null;
                          if (isFindActive && parsedRequest.isValid && searchResult.foundRatio === 1 && searchResult.marks.length > 1) {
                            setLineChoiceModalConfig({ 
                              type: 'find',
                              pos: { x: rect.left, y: rect.bottom + 5 },
                              maxLines: searchResult.marks.length,
                              initialValue: searchOccIndex + 1
                            });
                          }
                        }, 250);
                      }
                    }}
                  >
                    {(parsedRequest.isValid && searchResult.foundRatio === 1 && searchResult.marks.length > 1 && isFindActive) ? (
                      <>
                        <span>FIND</span>
                        <span className="flex items-center gap-1 ml-2 border-l border-black/30 pl-2">
                          <span className="font-mono text-[#000]">
                            {searchOccIndex + 1}/{searchResult.marks.length}
                          </span>
                          <div className="flex gap-0.5">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setSearchOccIndex(Math.max(0, searchOccIndex - 1)); }}
                              className="hover:text-white px-1 font-bold transition-colors text-xs"
                            >▲</button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setSearchOccIndex(Math.min(searchResult.marks.length - 1, searchOccIndex + 1)); }}
                              className="hover:text-white px-1 font-bold transition-colors text-xs"
                            >▼</button>
                          </div>
                        </span>
                      </>
                    ) : (
                      <span>
                        {isGlobalSearchActive || isReplaceActive 
                          ? 'FIND' 
                          : (parsedRequest.isValid && searchResult.foundRatio === 1 && searchResult.marks.length > 1)
                              ? `FIND (${searchResult.marks.length})`
                              : 'FIND'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div 
                ref={zoomRefFind}
                className="flex-1 border border-border-dark bg-bg-dark rounded-sm relative overflow-hidden"
                style={{ fontSize: 'var(--zoom-size, 14px)' }}
              >
                <div 
                  ref={findBackdropRef}
                  className="backdrop-layer select-none"
                  style={{ fontSize: 'inherit' }}
                  dangerouslySetInnerHTML={{ __html: findBackdropHtml }}
                />
                <textarea
                  ref={findTextareaRef}
                  value={parsedRequest.findText || ""}
                  onChange={(e) => handleFindChange(normalizeText(e.target.value))}
                  readOnly={!parsedRequest.isValid || isGlobalSearchActive}
                  onScroll={handleScrollFind}
                  spellCheck="false"
                  className={`overlay-layer text-left ${isGlobalSearchActive || isReplaceActive ? 'opacity-30 cursor-not-allowed' : 'opacity-75 cursor-default'}`}
                  style={{ fontSize: 'inherit', backgroundColor: isGlobalSearchActive ? '#331111' : 'transparent' }}
                />
              </div>
            </div>

            {/* Zone REPLACE extraite */}
            <div className="flex-1 flex flex-col min-h-[80px]">
              <div className="flex justify-between items-center mb-1 flex-shrink-0 select-none">
                <span className="text-xxs text-[#aaa] font-bold uppercase">Zone REPLACE Décodée (Lecture Seule)</span>
                <div 
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold transition-colors select-none ${
                    (parsedRequest.isValid && searchResult.foundRatio === 1)
                      ? (isReplaceActive ? 'bg-[#00FF7F] text-black shadow-[0_0_8px_rgba(0,255,127,0.6)] cursor-pointer' : 'bg-[#555] text-[#00FF7F] cursor-pointer')
                      : 'bg-[#555] text-[#9E67BA]/40 cursor-not-allowed'
                  }`}
                  title={!(parsedRequest.isValid && searchResult.foundRatio === 1) ? "Requis: Find à 100%" : "Double-clic pour activer/désactiver la prévisualisation"}
                  onDoubleClick={() => {
                    if (!isGlobalSearchActive && parsedRequest.isValid && searchResult.foundRatio === 1) setIsReplaceActive(!isReplaceActive);
                  }}
                >
                  REPLACE
                </div>
              </div>
              <div 
                ref={zoomRefReplace}
                className="flex-1 border border-border-dark bg-bg-dark rounded-sm relative overflow-hidden"
                style={{ fontSize: 'var(--zoom-size, 14px)' }}
              >
                <div 
                  ref={replaceBackdropRef}
                  className="backdrop-layer select-none"
                  style={{ fontSize: 'inherit' }}
                  dangerouslySetInnerHTML={{ __html: replaceBackdropHtml }}
                />
                <textarea
                  ref={replaceTextareaRef}
                  value={parsedRequest.replaceText || ""}
                  onChange={(e) => handleReplaceChange(normalizeText(e.target.value))}
                  readOnly={!parsedRequest.isValid || isGlobalSearchActive}
                  onScroll={handleScrollReplace}
                  spellCheck="false"
                  className={`overlay-layer text-left ${isGlobalSearchActive ? 'opacity-30 cursor-not-allowed' : 'opacity-75 cursor-default'}`}
                  style={{ fontSize: 'inherit', backgroundColor: isGlobalSearchActive ? '#331111' : 'transparent' }}
                />
              </div>
            </div>

          </div>

          {/* Séparateur central */}
          <Splitter direction="vertical" onResize={handleResize} />

          {/* Colonne Droite (Miroir Texte Source et Heatmap) */}
          <div className="flex-1 flex flex-col gap-3 min-w-[200px]">
            
            {/* Barre de Recherche Globale */}
            <div className={`flex ${isSearchMultiline ? 'items-start pb-0' : 'items-stretch'} gap-2 py-1`}>
              {searchBarText && (
                <div className={`flex items-center gap-3 transition-opacity ${isSearchSuspended ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                  <button 
                    onClick={() => setIsSearchSmartMode(!isSearchSmartMode)}
                    className={`flex items-center justify-center gap-1.5 px-3 py-1 rounded font-bold text-[15px] transition-colors uppercase border ${
                      isSearchSmartMode 
                        ? 'bg-[#FFD700] text-black border-[#FFD700] shadow-[0_0_8px_rgba(255,215,0,0.4)]' 
                        : 'bg-bg-dark text-[#888] border-border-dark hover:text-white hover:border-[#666]'
                    }`}
                    title="Smart Search (ignore la casse et les espaces)"
                  >
                    <span>💡</span>
                    <span className="hidden sm:inline">SMART</span>
                  </button>
                  
                  <div className="text-[15px] uppercase font-bold text-[#aaa] flex items-center gap-2 select-none">
                    Similitude : 
                    <span className={`px-1.5 py-0.5 rounded font-mono text-[15px] ${
                      searchResult.foundRatio === 1 ? 'bg-[#4caf50] text-black shadow-[0_0_5px_rgba(76,175,80,0.5)]' : 
                      searchResult.foundRatio > 0.5 ? 'text-[#FFD700]' : 
                      'text-[#ff5555]'
                    }`}>
                      {(searchResult.foundRatio * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              )}

              {/* Conteneur Textarea + Gouttière */}
              <div 
                className={`flex-1 flex border rounded transition-colors bg-bg-dark overflow-hidden ${
                  searchBarText 
                    ? (isSearchSuspended ? 'border-[#666]' : (searchResult.foundRatio === 1 ? 'border-[#4caf50]' : 'border-[#FFD700]')) 
                    : 'border-border-dark'
                }`}
                style={isSearchMultiline ? { height: `${searchHeight}px` } : {}}
              >
                {/* Gouttière */}
                <div 
                  className={`flex flex-col w-12 border-r border-border-dark select-none text-[10px] py-1 transition-all relative ${
                    isSearchSuspended 
                      ? 'bg-[#FFD700] text-black shadow-[0_0_8px_rgba(255,215,0,0.5)] cursor-pointer' 
                      : (searchBarText ? 'bg-[#1e1e1e] text-[#666] cursor-pointer hover:bg-[#333]' : 'bg-[#1e1e1e] text-[#666]')
                  }`}
                  style={{ overflow: 'hidden' }}
                  title={searchBarText ? "Double-cliquez pour suspendre/réactiver la recherche" : ""}
                  onDoubleClick={() => {
                    if (searchBarText) {
                      setIsSearchSuspended(!isSearchSuspended);
                    }
                  }}
                  id="smart-search-gutter"
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
                <div className={`flex-1 relative flex transition-opacity ${isSearchSuspended ? 'opacity-50 grayscale' : ''}`}>
                  <textarea
                    ref={searchContainerRef}
                    onScroll={(e) => {
                      const gutter = document.getElementById('smart-search-gutter');
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
                    value={searchBarText}
                    onChange={(e) => {
                      if (!isSearchSuspended) {
                        setSearchBarText(normalizeText(e.target.value));
                      }
                    }}
                    readOnly={isSearchSuspended}
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

              {isEscapeHatchActive ? (
                <div 
                  className="text-[10px] text-center font-bold text-[#ff9800] bg-[#332200] border border-[#ff9800] rounded p-1 ml-2 cursor-pointer hover:bg-[#442200] transition-colors flex items-center"
                  onDoubleClick={handleEscapeHatchDoubleClick}
                  title="Double-cliquez pour ignorer cette sécurité et forcer la recherche (risque de lag)"
                >
                  ⚠️ Texte trop court (double-cliquez pour forcer)
                </div>
              ) : searchBarText ? (
                <div className={`flex items-stretch gap-3 ml-2 border-l border-border-dark pl-3 ${isSearchMultiline ? 'py-1' : ''}`}>
                  {searchResult.marks.length > 0 && !isSearchSuspended && (
                    <div className="flex items-center gap-2 justify-center min-w-[120px]">
                      <span 
                        className="font-mono text-[15px] font-bold cursor-pointer hover:text-white transition-colors text-[#FFD700]"
                        onDoubleClick={(e) => {
                          e.stopPropagation(); 
                          const rect = e.currentTarget.getBoundingClientRect();
                          setLineChoiceModalConfig({ 
                            type: 'search',
                            pos: { x: rect.left, y: rect.bottom + 5 },
                            maxLines: searchResult.marks.length,
                            initialValue: searchOccIndex + 1
                          });
                        }}
                        title="Double-cliquez pour aller à une occurrence spécifique"
                      >
                        - {searchOccIndex + 1} / <span className="text-[#FF4500]">{searchResult.marks.length}</span>
                      </span>
                      <div className="flex gap-1 items-stretch">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSearchOccIndex(Math.max(0, searchOccIndex - 1)); }}
                          className="bg-bg-dark hover:bg-border-dark border border-border-dark text-[#888] hover:text-white px-2 py-1 rounded text-[15px]"
                        >▲</button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSearchOccIndex(Math.min(searchResult.marks.length - 1, searchOccIndex + 1)); }}
                          className="bg-bg-dark hover:bg-border-dark border border-border-dark text-[#888] hover:text-white px-2 py-1 rounded text-[15px]"
                        >▼</button>
                      </div>
                    </div>
                  )}

                  {/* Bouton Copier et Supprimer */}
                  <button
                    onClick={handleCopyAndDeleteSearch}
                    className={`px-3 py-1 rounded text-[15px] font-bold transition-all uppercase flex items-center justify-center gap-1.5 ${
                      searchResult.foundRatio === 1
                        ? 'bg-[#4caf50] hover:bg-[#45a049] text-black shadow-[0_0_8px_rgba(76,175,80,0.5)]'
                        : 'bg-bg-dark border border-border-dark text-[#666] hover:text-[#888]'
                    }`}
                    title="Copier le texte dans la zone FIND et effacer la recherche"
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

            {/* Barre de conformité Heatmap (Visible uniquement quand la recherche globale est désactivée) */}
            {!searchBarText && (
              <div className="bg-[#1e1e1e] p-2 border border-border-dark flex justify-between items-center rounded-sm flex-shrink-0 select-none">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-white font-bold uppercase tracking-wider">Conformité Heatmap :</span>
                  <span className={`font-black ${
                    searchResult.foundRatio === 1.0 
                      ? 'text-gutter-mod' 
                      : searchResult.foundRatio >= 0.8 
                        ? 'text-hl-yellow' 
                        : searchResult.foundRatio >= 0.5 
                          ? 'text-[#FF8C00]' 
                          : 'text-cherry-red'
                  }`}>
                    {(searchResult.foundRatio * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="text-[11px] text-[#888] font-mono">
                  {searchResult.marks.length} segment(s) apparié(s)
                </div>
              </div>
            )}

            {/* Miroir de prévisualisation du texte source complet */}
            <div className="flex-1 border border-border-dark bg-bg-dark rounded-sm overflow-hidden flex flex-col">
              <div className="bg-bg-panel px-3 py-1 border-b border-border-dark flex justify-between items-center text-[10px] text-[#888] font-bold uppercase tracking-wider text-left select-none">
                <span>Miroir de Prévisualisation du Texte Source (T3)</span>
                <button
                  className="hover:bg-black/20 p-0.5 rounded transition-colors"
                  onClick={(e) => { e.stopPropagation(); setShowMirrorInvisibles(!showMirrorInvisibles); }}
                  title="Affiche ou cache les cara inivisble dans le texte principal"
                >
                  <EyeIcon active={showMirrorInvisibles} />
                </button>
              </div>
              
              <div 
                ref={(el) => {
                  zoomRefMirror(el);
                  mirrorContainerRef.current = el;
                }}
                className="flex-1 overflow-auto py-2 font-consolas leading-relaxed select-text select-none"
                style={{ fontSize: 'var(--zoom-size, 10px)' }}
                onScroll={(e) => {
                  if (showMirrorInvisibles) {
                    const el = e.target;
                    const computedStyle = window.getComputedStyle(el);
                    const fontSize = parseFloat(computedStyle.fontSize) || 10;
                    const lineHeight = 1.625 * fontSize;
                    const startLine = Math.floor(el.scrollTop / lineHeight);
                    const endLine = Math.floor((el.scrollTop + el.clientHeight) / lineHeight);
                    
                    const newStart = Math.max(0, startLine - 100);
                    const newEnd = endLine + 100;
                    
                    setMirrorVisibleRange(prev => {
                      if (Math.abs(prev[0] - newStart) > 20 || Math.abs(prev[1] - newEnd) > 20) {
                        return [newStart, newEnd];
                      }
                      return prev;
                    });
                  }
                }}
              >
                {mirrorLineRecords.length === 0 ? (
                  <div className="p-4 text-center text-[#555] italic">Texte source vide.</div>
                ) : (
                  mirrorLineRecords.map((line) => (
                    <MirrorLine 
                      key={line.number} 
                      line={line} 
                      showMirrorInvisibles={showMirrorInvisibles}
                      isVisible={line.number - 1 >= mirrorVisibleRange[0] && line.number - 1 <= mirrorVisibleRange[1]}
                      isTargeted={line.number === targetHighlightLine}
                    />
                  ))
                )}
              </div>

            </div>

          </div>

        </div>

        {/* Footer de la Modale */}
        <div className="p-3.5 bg-bg-dark border-t border-border-dark flex justify-end gap-3 flex-shrink-0 select-none">
          <button 
            type="button"
            onClick={onClose} 
            className="bg-disabled-dark hover:bg-border-dark text-white px-5 py-2.5 rounded font-bold text-xs shadow transition"
          >
            ANNULER
          </button>
          <button 
            type="button"
            disabled={!parsedRequest.isValid}
            onClick={handleValidateAndCopy}
            className={`px-6 py-2.5 rounded font-black text-xs shadow-md transition ${
              parsedRequest.isValid 
                ? 'bg-[#333] hover:bg-[#444] text-white border border-[#555] cursor-pointer' 
                : 'bg-disabled-dark text-[#666] cursor-not-allowed opacity-50'
            }`}
            title="Copier les textes dans les champs à gauche sans les appliquer immédiatement"
          >
            VALIDER & COPIER LA REQUÊTE
          </button>
          <button 
            type="button"
            disabled={isMultistackMode || !parsedRequest.isValid || searchResult.foundRatio < 1}
            onClick={handleValidateAndApply}
            className={`px-6 py-2.5 rounded font-black text-xs shadow-md transition ${
              isMultistackMode 
                ? 'bg-disabled-dark text-[#666] cursor-not-allowed opacity-50'
                : parsedRequest.isValid && searchResult.foundRatio === 1
                  ? 'bg-primary-blue hover:bg-primary-blue-hover text-white cursor-pointer' 
                  : 'bg-disabled-dark text-[#666] cursor-not-allowed opacity-50'
            }`}
            title={isMultistackMode ? "Impossible d'appliquer directement une modification via le débogueur lors d'une exécution de pile multistack." : ""}
          >
            VALIDER & APPLIQUER LA REQUÊTE
          </button>
        </div>

      </div>
      
      {/* Modale de saut de ligne (Recherche ou Find) */}
      {lineChoiceModalConfig && (
        <div className="pointer-events-auto">
          <LineChoiceModal
            isVisible={true}
            position={lineChoiceModalConfig.pos}
            onClose={() => setLineChoiceModalConfig(null)}
            maxLines={lineChoiceModalConfig.maxLines}
            title={`Aller à l'occurrence (1 - ${lineChoiceModalConfig.maxLines})`}
            initialValue={String(lineChoiceModalConfig.initialValue)}
            onGoToLine={(targetLine, occIndex) => {
              setSearchOccIndex(occIndex - 1);
            }}
          />
        </div>
      )}
    </div>
  );
}
