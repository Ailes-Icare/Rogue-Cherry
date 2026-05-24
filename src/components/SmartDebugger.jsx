import React, { useState, useEffect, useRef, useMemo } from 'react';
import Splitter from './Splitter.jsx';
import { parseSyntaxRequest } from '../utils/textParser.js';
import { renderInvisiblesHtml, normalizeText } from '../utils/helpers.js';
import { computeSearchHeatmap } from '../utils/diffEngine.js';

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

  // Références de synchronisation de défilement des double-calques
  const rawBackdropRef = useRef(null);
  const rawTextareaRef = useRef(null);
  const findBackdropRef = useRef(null);
  const findTextareaRef = useRef(null);
  const replaceBackdropRef = useRef(null);
  const replaceTextareaRef = useRef(null);

  // Référence pour le défilement du miroir
  const mirrorScrollRef = useRef(null);

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
    const labelTag = parsedRequest.label ? `[LABEL:${parsedRequest.label}]` : '';
    const header = `${syntaxConfig.START} ${labelTag} ${multiTag}`.replace(/\s+/g, ' ').trim();
    const newRaw = `${header}\n${syntaxConfig.FIND}\n${val}\n${syntaxConfig.REPLACE}\n${parsedRequest.replaceText || ''}\n${syntaxConfig.END}`;
    setRawText(newRaw);
  };

  // Synchronisation bidirectionnelle : éditer REPLACE met à jour la Requête Brute
  const handleReplaceChange = (val) => {
    if (!parsedRequest.isValid) return;
    const multiTag = parsedRequest.multiMode ? '[MULTI:TRUE]' : '[MULTI:FALSE]';
    const labelTag = parsedRequest.label ? `[LABEL:${parsedRequest.label}]` : '';
    const header = `${syntaxConfig.START} ${labelTag} ${multiTag}`.replace(/\s+/g, ' ').trim();
    const newRaw = `${header}\n${syntaxConfig.FIND}\n${parsedRequest.findText || ''}\n${syntaxConfig.REPLACE}\n${val}\n${syntaxConfig.END}`;
    setRawText(newRaw);
  };

  // Recherche live dichotomique heatmap par rapport à la zone FIND extraite
  const searchResult = useMemo(() => {
    const findStr = (parsedRequest && parsedRequest.isValid) ? parsedRequest.findText : "";
    return computeSearchHeatmap(sourceText, findStr);
  }, [sourceText, parsedRequest]);

  // Précalcule les lignes pour le miroir de code source droit
  const mirrorLineRecords = useMemo(() => {
    if (!sourceText) return [];
    const lines = sourceText.split('\n');
    const marks = searchResult.marks;
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
    if (searchResult.marks.length > 0 && mirrorScrollRef.current) {
      const firstMark = searchResult.marks[0];
      const prevText = sourceText.substring(0, firstMark.start);
      const lineIndex = prevText.split('\n').length - 1;
      
      const mirrorContainer = mirrorScrollRef.current;
      const targetLineNode = mirrorContainer.children[lineIndex];
      if (targetLineNode) {
        targetLineNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [searchResult, sourceText]);

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
        multiIndices: parsedRequest.multiIndices
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
        multiIndices: parsedRequest.multiIndices
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
            <div className="h-[160px] border border-dashed border-primary-blue bg-bg-dark rounded-sm relative overflow-hidden flex-shrink-0">
              <div 
                ref={rawBackdropRef}
                className="backdrop-layer select-none"
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
                <span className="text-xxs text-[#aaa] font-bold uppercase">Zone FIND Décodée (Lecture Seule)</span>
                <span className="text-[10px] font-mono text-[#FF8C00]">FIND</span>
              </div>
              <div className="flex-1 border border-border-dark bg-bg-dark rounded-sm relative overflow-hidden">
                <div 
                  ref={findBackdropRef}
                  className="backdrop-layer select-none"
                  dangerouslySetInnerHTML={{ __html: findBackdropHtml }}
                />
                <textarea
                  ref={findTextareaRef}
                  value={parsedRequest.findText || ""}
                  onChange={(e) => handleFindChange(normalizeText(e.target.value))}
                  readOnly={!parsedRequest.isValid}
                  onScroll={handleScrollFind}
                  spellCheck="false"
                  className="overlay-layer text-left opacity-75 cursor-default"
                />
              </div>
            </div>

            {/* Zone REPLACE extraite */}
            <div className="flex-1 flex flex-col min-h-[80px]">
              <div className="flex justify-between items-center mb-1 flex-shrink-0 select-none">
                <span className="text-xxs text-[#aaa] font-bold uppercase">Zone REPLACE Décodée (Lecture Seule)</span>
                <span className="text-[10px] font-mono text-[#9E67BA]">REPLACE</span>
              </div>
              <div className="flex-1 border border-border-dark bg-bg-dark rounded-sm relative overflow-hidden">
                <div 
                  ref={replaceBackdropRef}
                  className="backdrop-layer select-none"
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
                />
              </div>
            </div>

          </div>

          {/* Séparateur central */}
          <Splitter direction="vertical" onResize={handleResize} />

          {/* Colonne Droite (Miroir Code Source et Heatmap) */}
          <div className="flex-1 flex flex-col gap-3 min-w-[200px]">
            
            {/* Barre de conformité Heatmap */}
            <div className="bg-[#1e1e1e] p-2 border border-border-dark flex justify-between items-center rounded-sm flex-shrink-0 select-none">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-primary-blue text-sm">🔍</span>
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
                ref={mirrorScrollRef}
                className="flex-1 overflow-auto py-2 font-consolas text-xxs leading-relaxed select-text select-none"
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

        {/* Footer de la Modale */}
        <div className="p-3.5 bg-bg-dark border-t border-border-dark flex justify-end gap-3 flex-shrink-0 select-none">
          <button 
            onClick={onClose} 
            className="bg-disabled-dark hover:bg-border-dark text-white px-5 py-2.5 rounded font-bold text-xs shadow transition"
          >
            ANNULER
          </button>
          <button 
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
            disabled={!parsedRequest.isValid}
            onClick={handleValidateAndApply}
            className={`px-6 py-2.5 rounded font-black text-xs shadow-md transition ${
              parsedRequest.isValid 
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
