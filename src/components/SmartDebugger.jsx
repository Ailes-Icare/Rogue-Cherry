import React, { useState, useEffect, useRef, useMemo } from 'react';
import Splitter from './Splitter.jsx';
import { parseSyntaxRequest } from '../utils/textParser.js';
import { renderInvisiblesHtml, normalizeText } from '../utils/helpers.js';
import { computeSearchHeatmap, computeLiveDiff } from '../utils/diffEngine.js';
import { useZoomable } from '../hooks/useZoomable.js';
import { applyDeltaOnText } from '../hooks/useHistoryStore.js';

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
function renderLineContent(text, lineMarks) {
  if (!lineMarks || lineMarks.length === 0) return text;
  
  const sorted = [...lineMarks].sort((a, b) => a.start - b.start);
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
 * Modale de débogage intelligente pour requêtes IA défaillantes.
 */
export default function SmartDebugger({
  isOpen,
  onClose,
  initialRawText,
  sourceText,
  onApply,
  onAcceptAndCopy,
  syntaxConfig
}) {
  const [rawText, setRawText] = useState(initialRawText || "");
  const [showInvisibles, setShowInvisibles] = useState(true);
  const [leftWidthPercent, setLeftWidthPercent] = useState(40); // Pourcentage de largeur de la colonne gauche

  // Nouveaux états V8
  const [isFindActive, setIsFindActive] = useState(true);
  const [isReplaceActive, setIsReplaceActive] = useState(false);
  const [searchBarText, setSearchBarText] = useState("");
  const [isSearchSmartMode, setIsSearchSmartMode] = useState(false);
  const [searchOccIndex, setSearchOccIndex] = useState(0);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  // Références de synchronisation de défilement des double-calques
  const rawBackdropRef = useRef(null);
  const rawTextareaRef = useRef(null);
  const findBackdropRef = useRef(null);
  const findTextareaRef = useRef(null);
  const replaceBackdropRef = useRef(null);
  const replaceTextareaRef = useRef(null);

  // Référence pour le défilement du miroir
  const zoomRefMirror = useZoomable(10); // Remplace mirrorScrollRef

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
  const activeSearchText = searchBarText || (parsedRequest && parsedRequest.isValid ? parsedRequest.findText : "");
  const activeSmartMode = searchBarText ? isSearchSmartMode : ((parsedRequest && parsedRequest.isValid) ? parsedRequest.smartMode : false);

  const searchResult = useMemo(() => {
    const res = computeSearchHeatmap(sourceText, activeSearchText, activeSmartMode);
    // Si la recherche n'est pas forcée par la barre, et que le bouton Find est désactivé, 
    // on purge les marques visuelles mais on conserve le ratio pour les boutons de validation
    if (!searchBarText && !isFindActive) {
      res.marks = [];
    }
    return res;
  }, [sourceText, activeSearchText, activeSmartMode, searchBarText, isFindActive]);

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

  // Précalcule les lignes pour le miroir de code source droit
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
              type: mark.type
            });
            isHighlightLine = true;
            cssClass = mark.type;
          }
        }
      });

      absoluteOffset += lineLength + 1;

      return {
        number: i + 1,
        text: lineText,
        marks: lineMarks,
        isHighlightLine,
        cssClass
      };
    });
  }, [sourceText, searchResult]);

  // Scroll automatique vers la meilleure occurrence trouvée
  useEffect(() => {
    if (searchResult.marks.length > 0 && zoomRefMirror.current) {
      const safeIndex = Math.min(searchOccIndex, searchResult.marks.length - 1);
      const targetMark = searchResult.marks[safeIndex];
      const prevText = displayedSourceText.substring(0, targetMark.start);
      const lineIndex = prevText.split('\n').length - 1;
      
      const mirrorContainer = zoomRefMirror.current;
      const targetLineNode = mirrorContainer.children[lineIndex];
      if (targetLineNode) {
        targetLineNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [searchResult, displayedSourceText, searchOccIndex]);

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
    <div className="fixed inset-0 bg-black/80 z-[1000] flex justify-end items-center pr-[1%] box-sizing-border select-none p-4">
      
      {/* Cadre de la Modale */}
      <div 
        style={{
          borderColor: parsedRequest.isValid ? '#00FF7F' : '#d16969',
          boxShadow: parsedRequest.isValid ? '0 0 15px rgba(0, 255, 127, 0.25)' : '0 0 15px rgba(209, 105, 105, 0.25)'
        }}
        className="bg-bg-panel w-[90%] h-[95%] border flex flex-col shadow-2xl rounded-md overflow-hidden transition-all duration-300"
      >
        
        {/* Header de la Modale */}
        <div className="flex justify-between items-center p-3 bg-bg-dark border-b border-border-dark flex-shrink-0">
          <div className="flex items-center gap-3">
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
            className="flex flex-col gap-3 flex-shrink-0 min-w-[200px]"
          >
            
            {/* Ligne En-tête Requête brute */}
            <div className="flex justify-between items-center flex-shrink-0">
              <span className="text-xs text-[#aaa] font-bold uppercase">Requête Brute (Éditable)</span>
              <div className="flex gap-3 text-xxs text-[#888] font-bold">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showInvisibles} 
                    onChange={(e) => setShowInvisibles(e.target.checked)} 
                    className="w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>Invisibles</span>
                </label>
              </div>
            </div>

            {/* Zone Requête Brute - Double calque */}
            <div 
              ref={zoomRefRaw}
              className="h-[160px] border border-dashed border-primary-blue bg-bg-dark rounded-sm relative overflow-hidden flex-shrink-0"
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
                spellCheck="false"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                className="overlay-layer text-left"
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
                       searchBarText
                         ? 'bg-[#331111] text-[#883333] cursor-not-allowed border border-[#552222]'
                         : isReplaceActive 
                            ? 'bg-[#FF8C00]/20 text-[#FF8C00]/50 cursor-not-allowed'
                            : (parsedRequest.isValid && searchResult.foundRatio === 1)
                                ? (isFindActive ? 'bg-[#00FF7F] text-black shadow-[0_0_8px_rgba(0,255,127,0.6)] cursor-pointer' : 'bg-[#555] text-[#00FF7F] cursor-pointer')
                                : (isFindActive ? 'bg-[#FF8C00] text-black cursor-pointer' : 'bg-[#555] text-[#FF8C00] cursor-pointer')
                    }`}
                    title={searchBarText ? 'Désactivé (Search globale active)' : isReplaceActive ? 'Désactivé (Replace actif)' : 'Double-clic pour activer/désactiver le scan de heatmap'}
                    onDoubleClick={() => !searchBarText && !isReplaceActive && setIsFindActive(!isFindActive)}
                  >
                    <span>
                      {searchBarText || isReplaceActive 
                        ? 'FIND' 
                        : (parsedRequest.isValid && searchResult.foundRatio === 1 && searchResult.marks.length > 1)
                            ? `FIND (${searchResult.marks.length}) : Occ ${searchOccIndex + 1}/${searchResult.marks.length} ; réf. ${searchOccIndex}`
                            : (parsedRequest.isValid && searchResult.foundRatio === 1)
                                ? `FIND (${searchResult.marks.length})`
                                : 'FIND'}
                    </span>
                    {!searchBarText && !isReplaceActive && parsedRequest.isValid && searchResult.foundRatio === 1 && searchResult.marks.length > 1 && (
                      <span className="flex items-center gap-0.5 ml-1 border-l border-black/30 pl-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSearchOccIndex(Math.max(0, searchOccIndex - 1)); }}
                          className="hover:opacity-70 leading-none text-[9px]"
                          title="La référence est l'index base-0 de l'occurrence (occurrence 1 = réf. 0). Utilisez cette valeur dans [MULTI:1,3] pour cibler des occurrences spécifiques via le Cherry-Picking."
                        >▲</button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSearchOccIndex(Math.min(searchResult.marks.length - 1, searchOccIndex + 1)); }}
                          className="hover:opacity-70 leading-none text-[9px]"
                        >▼</button>
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
                  readOnly={!parsedRequest.isValid}
                  onScroll={handleScrollFind}
                  spellCheck="false"
                  className={`overlay-layer text-left ${searchBarText || isReplaceActive ? 'opacity-30 cursor-not-allowed' : 'opacity-75 cursor-default'}`}
                  style={{ fontSize: 'inherit', backgroundColor: searchBarText ? '#331111' : 'transparent' }}
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
                    if (parsedRequest.isValid && searchResult.foundRatio === 1) setIsReplaceActive(!isReplaceActive);
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
                  readOnly={!parsedRequest.isValid}
                  onScroll={handleScrollReplace}
                  spellCheck="false"
                  className="overlay-layer text-left opacity-75 cursor-default"
                  style={{ fontSize: 'inherit' }}
                />
              </div>
            </div>

          </div>

          {/* Séparateur central */}
          <Splitter direction="vertical" onResize={handleResize} />

          {/* Colonne Droite (Miroir Code Source et Heatmap) */}
          <div className="flex-1 flex flex-col gap-3 min-w-[200px]">
            
            {/* Nouvelle Barre de Recherche globale */}
            <div className={`bg-bg-panel border rounded-sm flex flex-col overflow-hidden transition-colors ${searchBarText ? 'border-[#FFD700]' : 'border-border-dark'}`}>
              <div className="flex items-center gap-2 p-1.5 border-b border-border-dark bg-bg-dark">
                <span className="text-primary-blue ml-1">🔍</span>
                <textarea
                  value={searchBarText}
                  onChange={(e) => setSearchBarText(e.target.value)}
                  placeholder="Recherche dynamique (désactive FIND...)"
                  className="flex-1 bg-transparent text-white text-xs outline-none resize-none transition-all"
                  style={{ height: searchBarText && isSearchExpanded ? '80px' : '20px' }}
                  spellCheck="false"
                />
                {searchBarText && (
                  <button
                    onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                    className="text-[10px] text-[#aaa] hover:text-white transition"
                    title={isSearchExpanded ? 'Réduire la zone de recherche' : 'Agrandir la zone de recherche'}
                  >{isSearchExpanded ? '▲' : '▼'}</button>
                )}
              </div>
              {searchBarText && (
                <div className="flex justify-between items-center px-2 py-1 bg-bg-dark text-xs text-[#ccc]">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isSearchSmartMode}
                      onChange={(e) => setIsSearchSmartMode(e.target.checked)}
                      className="cursor-pointer"
                    />
                    Smart Mode
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[#FFD700]">
                      {searchResult.marks.length > 0 ? `${searchOccIndex + 1}/${searchResult.marks.length}` : '0/0'}
                    </span>
                    <button 
                      onClick={() => setSearchOccIndex(Math.max(0, searchOccIndex - 1))}
                      disabled={searchResult.marks.length === 0}
                      className="hover:text-white disabled:opacity-50"
                    >
                      ▲
                    </button>
                    <button 
                      onClick={() => setSearchOccIndex(Math.min(searchResult.marks.length - 1, searchOccIndex + 1))}
                      disabled={searchResult.marks.length === 0}
                      className="hover:text-white disabled:opacity-50"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Barre de conformité Heatmap */}
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

            {/* Miroir de prévisualisation du code source complet */}
            <div className="flex-1 border border-border-dark bg-bg-dark rounded-sm overflow-hidden flex flex-col">
              <div className="bg-bg-panel px-3 py-1 border-b border-border-dark text-[10px] text-[#888] font-bold uppercase tracking-wider text-left select-none">
                Miroir de Prévisualisation du Code Source (T3)
              </div>
              
              <div 
                ref={zoomRefMirror}
                className="flex-1 overflow-auto py-2 font-consolas leading-relaxed select-text select-none"
                style={{ fontSize: 'var(--zoom-size, 10px)' }}
              >
                {mirrorLineRecords.length === 0 ? (
                  <div className="p-4 text-center text-[#555] italic">Code source vide.</div>
                ) : (
                  mirrorLineRecords.map((line) => (
                    <div 
                      key={line.number}
                      className={`flex hover:bg-bg-panel-light/20 cursor-default select-text ${
                        line.isHighlightLine ? 'bg-[#59466D]/15' : ''
                      }`}
                    >
                      {/* Numéro de ligne gouttière du Miroir */}
                      <div className="w-10 pr-2 text-right text-[#555] bg-bg-panel/40 border-r border-border-dark flex justify-between items-center select-none text-[9px] font-sans">
                        <span className="pl-0.5">
                          {line.isHighlightLine && <span className={line.cssClass.includes('hl-yellow') ? 'text-gutter-mod' : 'text-[#FF8C00]'}>▶</span>}
                        </span>
                        <span>{line.number}</span>
                      </div>
                      
                      {/* Ligne de texte avec surbrillance heatmap */}
                      <div className="flex-1 pl-2.5 whitespace-pre text-left overflow-x-auto min-w-0 select-text">
                        {line.text === "" ? "\n" : renderLineContent(line.text, line.marks)}
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>

          </div>

        </div>

        {/* Option Smart Replace et Footer */}
        <div className="flex justify-between items-center bg-bg-dark border-t border-border-dark px-4 py-2">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-[#ccc] font-medium">
            <input 
              type="checkbox" 
              checked={parsedRequest.isValid ? parsedRequest.smartMode : false}
              onChange={(e) => handleSmartChange(e.target.checked)}
              disabled={!parsedRequest.isValid}
              className="w-4 h-4 cursor-pointer"
            />
            Concilier les espaces (Smart Mode)
          </label>
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
            disabled={!parsedRequest.isValid || searchResult.foundRatio < 1}
            onClick={handleValidateAndApply}
            className={`px-6 py-2.5 rounded font-black text-xs shadow-md transition ${
              parsedRequest.isValid && searchResult.foundRatio === 1
                ? 'bg-primary-blue hover:bg-primary-blue-hover text-white cursor-pointer' 
                : 'bg-disabled-dark text-[#666] cursor-not-allowed opacity-50'
            }`}
          >
            VALIDER & APPLIQUER LA REQUÊTE
          </button>
        </div>

      </div>
    </div>
  );
}
