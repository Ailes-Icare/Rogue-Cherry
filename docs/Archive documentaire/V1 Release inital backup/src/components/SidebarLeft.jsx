import React, { useRef, useEffect, useMemo, useState } from 'react';
import { renderInvisiblesHtml, normalizeText } from '../utils/helpers.js';
import { computeLiveDiff } from '../utils/diffEngine.js';
import { useZoomable } from '../hooks/useZoomable.js';
import Splitter from './Splitter.jsx';
import { useMessageBox } from '../context/MessageBoxContext.jsx';

/**
 * Formate un texte et ses marqueurs en HTML sécurisé pour l'affichage de diffing dans le Backdrop.
 */
function renderLiveDiffHtml(text, marks, showInvisibles = true) {
  if (!text) return "";
  if (!marks || marks.length === 0) return renderInvisiblesHtml(text, showInvisibles);
  
  const chars = Array.from(text).map(c => ({ char: c, classes: new Set() }));
  const zeroMarks = {};
  
  marks.forEach(mark => {
    if (mark.length === 0) {
      if (!zeroMarks[mark.start]) zeroMarks[mark.start] = new Set();
      zeroMarks[mark.start].add(mark.type);
    } else {
      for (let i = mark.start; i < mark.start + mark.length && i < chars.length; i++) {
        chars[i].classes.add(mark.type);
      }
    }
  });

  let html = "";
  let currentClasses = "";
  let currentText = "";

  const pushCurrent = () => {
    if (currentText) {
      const escaped = renderInvisiblesHtml(currentText, showInvisibles);
      if (currentClasses) {
        html += `<mark class="${currentClasses}">${escaped}</mark>`;
      } else {
        html += escaped;
      }
      currentText = "";
    }
  };

  for (let i = 0; i <= chars.length; i++) {
    if (zeroMarks[i]) {
      pushCurrent();
      const zClasses = Array.from(zeroMarks[i]).join(" ");
      html += `<span class="${zClasses}"></span>`;
    }

    if (i < chars.length) {
      const charData = chars[i];
      const classesStr = Array.from(charData.classes).sort().join(" ");
      
      if (classesStr !== currentClasses) {
        pushCurrent();
        currentClasses = classesStr;
      }
      currentText += charData.char;
    }
  }
  
  pushCurrent();
  
  return html;
}

/**
 * Panneau de contrôle gauche : Prompt IA, Formulaires de recherche/remplacement et Cherry-Picking.
 */
export default function SidebarLeft({
  findText,
  replaceText,
  commentText,
  onChangeCommentText,
  currentLabel,
  pendingRequests,
  activeStackIndex,
  onSelectStackRequest,
  onChangeFindText,
  onChangeReplaceText,
  splitChars,
  onChangeSplitChars,
  ignoreSpaces,
  onChangeIgnoreSpaces,
  multiMode,
  onChangeMultiMode,
  multiIndices,
  onChangeMultiIndices,
  occurrencesCount,
  onSearch,
  onReplace,
  onClear,
  onOpenSettings,
  onOpenDebugger,
  onDirectOpenDebugger,
  syntaxConfig,
  width,
  onPlayStack,
  onCopyStack,
  onClearStack,
  onRevertRequest,
  onAuditIA,
  onCherryPickAudit,
  activeOccIndex,
  onSetActiveOccIndex,
  isCodeEmpty,
  isGlobalSearching,
  isFindActive,
  setIsFindActive,
  isReplaceActive,
  setIsReplaceActive,
  onOpenLineChoiceModal,
  occLinesArray,
  isFindEscapeHatchActive,
  onForceFindEscapeHatch,
  disabled = false,
  isSmartCancelActive,
  onDoubleClickMulti,
  onDoubleClickSmart
}) {
  const { showAlert } = useMessageBox();
  const [showInvisibles, setShowInvisibles] = useState(true);
  const [topHeight, setTopHeight] = useState(window.innerHeight * 0.45);
  const clickTimeoutRef = useRef(null);
  const [isAssistantCollapsed, setIsAssistantCollapsed] = useState(false);
  const [isAssistantCollapsedByUser, setIsAssistantCollapsedByUser] = useState(false);
  const assistantRef = useRef(null);
  const [isCommentBoxCollapsed, setIsCommentBoxCollapsed] = useState(false);
  const [isCommentBoxCollapsedByUser, setIsCommentBoxCollapsedByUser] = useState(false);

  const backdrop1Ref = useRef(null);
  const textarea1Ref = useRef(null);
  const backdrop2Ref = useRef(null);
  const textarea2Ref = useRef(null);
  const cherryPickListRef = useRef(null);

  const zoomRef1 = useZoomable(14);
  const zoomRef2 = useZoomable(14);

  // Synchronisation du défilement pour les deux calques FIND
  const handleScroll1 = () => {
    if (backdrop1Ref.current && textarea1Ref.current) {
      backdrop1Ref.current.scrollTop = textarea1Ref.current.scrollTop;
      backdrop1Ref.current.scrollLeft = textarea1Ref.current.scrollLeft;
    }
  };

  // Synchronisation du défilement pour les deux calques REPLACE
  const handleScroll2 = () => {
    if (backdrop2Ref.current && textarea2Ref.current) {
      backdrop2Ref.current.scrollTop = textarea2Ref.current.scrollTop;
      backdrop2Ref.current.scrollLeft = textarea2Ref.current.scrollLeft;
    }
  };

  // Met à jour les scrolls après changement de texte ou d'affichage
  useEffect(() => {
    handleScroll1();
    handleScroll2();
  }, [findText, replaceText, showInvisibles]);

  // AUTO-COLLAPSE Assistant Format Requête
  useEffect(() => {
    if (!pendingRequests) return;
    const count = pendingRequests.length;
    if (count === 0) {
      // Pas de multistack : Logique d'enroulement à l'approche du splitter
      // Le repli se base sur le bas de l'Assistant quand il est ouvert (ou son estimation)
      const assistantHeight = (assistantRef.current && !isAssistantCollapsed) 
        ? assistantRef.current.offsetHeight 
        : 220; // Estimation quand replié

      // La distance entre le Splitter (topHeight) et le bas de l'assistant
      // (En ajoutant 10px pour le padding top du conteneur p-2.5)
      const assistantBottom = assistantHeight + 10;
      const distanceToSplitter = topHeight - assistantBottom;

      if (distanceToSplitter < 150) {
        if (!isAssistantCollapsed) {
          setIsAssistantCollapsed(true);
        }
      } else {
        if (isAssistantCollapsed && !isAssistantCollapsedByUser) {
          setIsAssistantCollapsed(false);
        }
      }
      return;
    }

    // Hauteur d'une ligne = 30px. Titre = 30px.
    const fullyVisibleLimit = count < 10 ? 5 : 10;
    const requiredMultistackHeight = 30 + (fullyVisibleLimit * 30);
    
    // Si l'assistant est déplié, il prend ~220px. Les boutons prennent 140px.
    const spaceWithAssistant = topHeight - 140 - 220;
    
    if (spaceWithAssistant < requiredMultistackHeight) {
      if (!isAssistantCollapsed) {
        setIsAssistantCollapsed(true);
      }
    } else {
      // Si on a assez de place ET que l'utilisateur n'avait pas forcé le repli, on redéplie
      if (isAssistantCollapsed && !isAssistantCollapsedByUser) {
        setIsAssistantCollapsed(false);
      }
    }
  }, [pendingRequests, topHeight, isAssistantCollapsed, isAssistantCollapsedByUser]);

  // AUTO-COLLAPSE de la zone Commentaire
  useEffect(() => {
    // Calcul de l'espace disponible pour la section inférieure scrollable
    const bottomReserved = (multiMode && occurrencesCount > 0) ? 220 : 160;
    const bottomScrollableHeight = window.innerHeight - topHeight - bottomReserved;
    
    // Espace nécessaire avec Commentaire déplié ~ 180px (40+40 texte, 60 comment, 40 paddings/gaps)
    if (bottomScrollableHeight < 180) {
      if (!isCommentBoxCollapsed) {
        setIsCommentBoxCollapsed(true);
      }
    } else {
      if (isCommentBoxCollapsed && !isCommentBoxCollapsedByUser) {
        setIsCommentBoxCollapsed(false);
      }
    }
  }, [topHeight, multiMode, occurrencesCount, isCommentBoxCollapsed, isCommentBoxCollapsedByUser]);

  useEffect(() => {
    if (activeOccIndex !== -1 && activeOccIndex !== undefined && cherryPickListRef.current) {
      const activeElement = cherryPickListRef.current.children[activeOccIndex];
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [activeOccIndex]);

  // Génération du Prompt standard à copier
  const promptText = useMemo(() => {
    return `Agis comme un système de traitement de texte intelligent.
Je vais te demander de modifier un document.
Lis attentivement le fichier de consignes "prompt_consigne_rogue_cherry.md" joint à notre conversation. Rogue Cherry est ACTIF, il est impératif d'utiliser sa syntaxe.
Tu dois IMPÉRATIVEMENT placer la ou les requêtes dans un unique bloc de code classique (avec \`\`\`) pour que je puisse tout copier en un clic.

Voici le format minimal d'une requête unitaire :
${syntaxConfig.START}
##Commentaire## (Optionnel : indique brièvement pourquoi tu fais cette modification)
${syntaxConfig.FIND}
[Texte exact à trouver, unique dans le document. Fais très attention aux indentations, espaces et caractères spéciaux !]
${syntaxConfig.REPLACE}
[Texte de remplacement complet]
${syntaxConfig.END}

Paramètres Optionnels d'en-tête (à rajouter sur la même ligne que ${syntaxConfig.START}) :
- [LABEL:nom-de-la-modif] : Identifiant court pour nommer ta requête dans l'historique. Fortement recommandé.
- [MULTI:TRUE], [MULTI:1,3] ou [MULTI:NO 1,2] : Active le remplacement multiple, le cherry-picking, ou le cherry-picking inversé (NO) qui exclut spécifiquement certains index. ATTENTION : Les index démarrent à 0 (0 = 1ère occurrence, 1 = 2ème, etc.).
- [SMART:TRUE] : Demande l'activation du Smart Replace (Concilier espaces et majuscules) pour que le parseur ignore l'indentation d'origine et la casse (très utile pour l'édition de tableaux Markdown ou corriger la casse sans tout casser).

Règles d'or MANDATORY :
- MULTISTACK : Si tu dois faire plusieurs requêtes séparées (pour éviter un FIND trop long), encadre-les toutes dans UN SEUL bloc de code, et sépare CHAQUE requête par la balise ##[MULTISTACK REQUEST]## sur une ligne vide.
- Tu ne dois JAMAIS inclure les 3 accents graves (qui délimitent le bloc de code) à l'intérieur de tes zones FIND ou REPLACE.
- Respecte au caractère près le contexte (espaces, indentations, sauts de ligne) dans la zone FIND, le parseur est intransigeant.
- MODE FURTIF : Si le document traite de la syntaxe de Rogue Cherry elle-même, commence ta réponse par [REQMODIFIER] suivi de tes balises personnalisées.`;
  }, [syntaxConfig]);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(promptText);
      await showAlert("Prompt copié dans le presse-papier !");
    } catch (e) {
      await showAlert("Erreur lors de la copie.", "Erreur");
    }
  };

  // Précalcul du rendu HTML des backdrops de saisie
  const findBackdropHtml = useMemo(() => {
    return renderInvisiblesHtml(findText, showInvisibles);
  }, [findText, showInvisibles]);

  const replaceBackdropHtml = useMemo(() => {
    // Calcule le diff intra-ligne du remplacement par rapport à la recherche !
    const { marksT2 } = computeLiveDiff(findText, replaceText, splitChars);
    return renderLiveDiffHtml(replaceText, marksT2, showInvisibles);
  }, [findText, replaceText, splitChars, showInvisibles]);

  // Liste réactive pour le Cherry-Picking
  const cherryPickList = useMemo(() => {
    const list = [];
    for (let i = 0; i < occurrencesCount; i++) {
      list.push(i);
    }
    return list;
  }, [occurrencesCount]);

  const toggleOccurrence = (index) => {
    if (multiIndices.includes(index)) {
      onChangeMultiIndices(multiIndices.filter(idx => idx !== index));
    } else {
      onChangeMultiIndices([...multiIndices, index]);
    }
  };

  const handleCheckAll = (check) => {
    if (check) {
      onChangeMultiIndices(cherryPickList);
    } else {
      onChangeMultiIndices([]);
    }
  };

  const handleDoubleClickInput = async (isFind) => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      const currentVal = isFind ? findText : replaceText;
      
      if (clipboardText.trim() && !currentVal) {
        if (isFind) {
          onChangeFindText(clipboardText);
        } else {
          onChangeReplaceText(clipboardText);
        }
        await navigator.clipboard.writeText("");
        return; // On s'arrête ici si on a collé
      }
    } catch (err) {
      console.warn("Clipboard read failed or denied", err);
    }
    
    // Soit le presse-papier est vide, soit le champ n'est pas vide
    if (!onDirectOpenDebugger) return;
    
    // Si on est sur une requête de pile
    if (pendingRequests && pendingRequests.length > 0 && activeStackIndex >= 0 && activeStackIndex < pendingRequests.length) {
      const activeReq = pendingRequests[activeStackIndex];
      const raw = activeReq.parsed ? activeReq.parsed.rawText : (activeReq.rawText || "");
      onDirectOpenDebugger(raw || "");
      return;
    }
    
    // Sinon on regénère la requête actuelle depuis l'interface
    const multiTag = multiMode 
      ? (multiIndices && multiIndices.length > 0 ? `[MULTI:${multiIndices.join(',')}]` : '[MULTI:TRUE]') 
      : '[MULTI:FALSE]';
    const smartTag = ignoreSpaces ? '[SMART:TRUE]' : '[SMART:FALSE]';
    const labelTag = currentLabel ? `[LABEL:${currentLabel}]` : '';
    const header = `${syntaxConfig.START} ${labelTag} ${multiTag} ${smartTag}`.replace(/\s+/g, ' ').trim();
    
    let commentPart = "";
    if (commentText) {
      commentPart = `##Commentaire## ${commentText}\n`;
    }
    
    const reqText = `${header}\n${commentPart}${syntaxConfig.FIND}\n${findText || ""}\n${syntaxConfig.REPLACE}\n${replaceText || ""}\n${syntaxConfig.END}`;
    onDirectOpenDebugger(reqText);
  };

  const handleAuditIA = () => {
    if (onAuditIA) onAuditIA();
  };

  const handlePasteImport = async (e) => {
    // Calcul de la position de la modale par rapport au bouton (décalage de 50px vers la droite et le bas)
    const rect = e.currentTarget.getBoundingClientRect();
    const position = { x: rect.left + 50, y: Math.min(rect.top + 50, window.innerHeight - 200) };

    try {
      const clip = await navigator.clipboard.readText();
      onOpenDebugger(clip, position);
    } catch (err) {
      await showAlert("Accès refusé au presse-papier ou presse-papier vide.", "Erreur", position);
    }
  };

  return (
    <div 
      style={{ width: `${width}px`, flexShrink: 9999 }} 
      className={`bg-[#262626] flex flex-col overflow-hidden select-none min-w-[280px] transition-all duration-300 ${disabled ? 'pointer-events-none grayscale opacity-50' : ''}`}
    >
      {/* SECTION SUPÉRIEURE (Redimensionnable) */}
      <div 
        style={{ height: `${topHeight}px` }}
        className="flex flex-col flex-shrink-0 relative border-b border-border-dark overflow-hidden"
      >
        {/* Zone Scrollable Haut (Scrollbar désactivée) */}
        <div className="flex flex-col p-2.5 gap-2.5 flex-1 min-h-0 overflow-hidden">
        {!isAssistantCollapsed ? (
          <div ref={assistantRef} className="bg-[#333] p-2.5 border border-dashed border-[#555] rounded-md relative flex gap-3 text-xs flex-shrink-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <button 
                  type="button"
                  onClick={() => {
                    setIsAssistantCollapsed(true);
                    setIsAssistantCollapsedByUser(true);
                  }}
                  className="text-xs text-primary-blue hover:text-white cursor-pointer bg-transparent border-none p-0 flex-shrink-0"
                  title="Enrouler l'assistant"
                >
                  ▼
                </button>
                <div className="font-black text-primary-blue text-base tracking-wide uppercase leading-none">
                  Assistant format requête
                </div>
              </div>
              <span className="text-[10px] text-[#888]">Syntaxe active :</span>
              <pre className="text-sm leading-[1.4] text-[#9cdcfe] mt-2 font-mono select-text overflow-x-auto">
                {syntaxConfig.START} <span className="text-[#888]">[LABEL:Opt] [MULTI:Opt | NO] [SMART:Opt]</span><br/>
                <span className="text-[#888]">##Commentaire## (Optionnel)</span><br/>
                {syntaxConfig.FIND}<br/>
                <span className="text-[#888]">...texte à chercher...</span><br/>
                {syntaxConfig.REPLACE}<br/>
                <span className="text-[#888]">...texte de remplacement...</span><br/>
                {syntaxConfig.END}
              </pre>
            </div>
            
            <div className="flex flex-col gap-1 items-center justify-start w-16 flex-shrink-0">
              <button 
                type="button"
                onClick={handleCopyPrompt}
                className="w-full h-16 bg-primary-blue hover:bg-primary-blue-hover text-white text-3xl flex items-center justify-center rounded-md shadow-md transition duration-150 active:scale-95"
                title="Copier le prompt IA optimisé dans le presse-papier"
              >
                📋
              </button>
              <div className="text-center flex flex-col justify-center select-none leading-none mt-3">
                <span className="font-black text-sm text-hl-yellow scale-y-[2.5] tracking-tight uppercase">Ask2AI</span>
              </div>
            </div>

            <button 
              type="button"
              onClick={onOpenSettings}
              className="absolute bottom-1 right-1 w-5 h-5 bg-transparent border-none text-[#666] hover:text-primary-blue rounded transition duration-150 cursor-pointer text-xs"
              title="Modifier les balises de syntaxe"
            >
              ⚙️
            </button>
          </div>
        ) : (
          <div className="bg-[#333] px-2.5 py-1.5 border border-dashed border-[#555] rounded-md flex items-center justify-between text-xs flex-shrink-0">
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={() => {
                  setIsAssistantCollapsed(false);
                  setIsAssistantCollapsedByUser(false); // La préférence de repli est annulée
                }}
                className="text-xs text-primary-blue hover:text-white cursor-pointer bg-transparent border-none p-0 flex-shrink-0"
                title="Dérouler l'assistant"
              >
                ▶
              </button>
              <div className="font-black text-primary-blue text-xs tracking-wide uppercase leading-none mt-0.5">
                Assistant format requête
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={handleCopyPrompt}
                className="w-6 h-6 bg-primary-blue hover:bg-primary-blue-hover text-white flex items-center justify-center rounded shadow-md transition duration-150 active:scale-95"
                title="Copier le prompt IA optimisé dans le presse-papier"
              >
                📋
              </button>
              <button 
                type="button"
                onClick={onOpenSettings}
                className="w-6 h-6 bg-transparent border-none text-[#999] hover:text-primary-blue rounded transition duration-150 cursor-pointer text-sm flex items-center justify-center"
                title="Modifier les balises de syntaxe"
              >
                ⚙️
              </button>
            </div>
          </div>
        )}

      {/* 2. Tableau Multistack */}
      {pendingRequests && pendingRequests.length > 0 && (
        <div className="flex flex-col flex-1 min-h-0 bg-[#1e1e1e] border border-border-dark p-2 rounded-sm overflow-y-auto custom-scrollbar relative">
          <div className="text-[11px] font-bold text-[#aaa] mb-1 flex justify-between items-center">
            <span>
              📦 PILE MULTISTACK
              {isSmartCancelActive && (
                <span className="text-yellow-500 ml-2">— Annulation intelligente</span>
              )}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[#20b2aa]">{pendingRequests.length} REQUÊTE{pendingRequests.length > 1 ? 'S' : ''}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); onCopyStack && onCopyStack(); }}
                className="text-[#4da6ff] hover:bg-[#4da6ff22] rounded px-1 transition"
                title="Copier la pile multistack reconstituée"
              >
                📋
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onClearStack(); }}
                className="text-[#ff5555] hover:bg-[#ff555522] rounded px-1 transition"
                title="Vider et supprimer la pile de requêtes"
              >
                🗑️
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            {pendingRequests.map((req, idx) => {
              const isActive = idx === activeStackIndex;
              let statusColor = "text-white";
              let statusIcon = "⬜";
              if (req.status === 'success') { statusColor = "text-[#4caf50]"; statusIcon = "✅"; }
              else if (req.status === 'error') { statusColor = "text-[#f44336]"; statusIcon = "❌"; }
              else if (req.status === 'repaired') { statusColor = "text-[#ff9800]"; statusIcon = "🟡"; }
              
              const labelText = req.parsed.label ? req.parsed.label : `Requête n° ${idx + 1}`;
              const comment = req.parsed.comment ? ` - ${req.parsed.comment}` : '';
              
              return (
                <div 
                  key={idx} 
                  className={`flex items-center justify-between text-xs p-1 rounded cursor-pointer border ${isActive ? 'bg-[#333] border-primary-blue' : 'hover:bg-[#2a2a2a] border-transparent'} transition`}
                  onClick={() => onSelectStackRequest(idx)}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="flex-shrink-0 text-[10px]" title={req.status === 'success' ? 'Succès' : req.status === 'error' ? 'Erreur' : req.status === 'repaired' ? 'Corrigée' : 'En attente'}>
                      {statusIcon}
                    </span>
                    <span className={`truncate ${statusColor} ${isActive ? 'font-bold' : ''}`}>
                      <span className="font-mono text-[10px] opacity-70 mr-1">{idx + 1} - </span>
                      [{labelText}]
                      {req.isModified && (
                        <span className="text-[#ff9800] ml-1 text-[9px]" title="Cette requête a été modifiée localement">✎</span>
                      )}
                      <span className="opacity-60 italic text-[10px] ml-1">{comment}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    {req.isModified && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onRevertRequest(idx); }}
                        className="text-[#ff9800] hover:text-white hover:bg-[#ff980055] rounded px-1 py-0.5 transition leading-none"
                        style={{ fontSize: '11px' }}
                        title="Restaurer la requête d'origine"
                      >
                        ⟲
                      </button>
                    )}
                    {isActive && <span className="text-primary-blue text-[10px] font-bold">&lt; ACTIVE</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

        </div> {/* Fin Zone Scrollable Haut */}

      {/* 4. Boutons d'Action Principaux (Fixes en bas de la zone supérieure) */}
      <div className="flex flex-col gap-2 p-2.5 pt-0 flex-shrink-0 bg-bg-panel z-10">
        <div className="flex gap-2 h-9">
          <button
            type="button"
            disabled={isCodeEmpty}
            onClick={handlePasteImport}
            className="flex-1 bg-primary-blue hover:bg-primary-blue-hover text-white font-bold text-xs flex items-center justify-center gap-1.5 rounded-sm transition duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Coller et analyser une requête syntaxique depuis le presse-papier"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.5 9.5 0 0 1 6.7 2.7L21 8"></path><polyline points="21 3 21 8 16 8"></polyline></svg>
            <span>Coller REQUÊTE</span>
          </button>
          <button
            type="button"
            disabled={!findText || isGlobalSearching}
            onClick={onSearch}
            className={`flex-1 bg-primary-blue hover:bg-primary-blue-hover text-white font-bold text-xs rounded-sm transition duration-150 disabled:opacity-40 ${!findText || isGlobalSearching ? 'cursor-not-allowed opacity-40' : ''}`}
          >
            {isGlobalSearching ? 'Recherche Globale Active' : '🔍 RECHERCHER'}
          </button>
        </div>

        {pendingRequests && pendingRequests.length > 0 && (
          <div className="text-[10px] text-center font-bold text-[#ff9800] bg-[#332200] border border-[#ff9800] rounded p-1">
            ⚠️ Attention : il est potentiellement dangereux d'appliquer les requêtes dans le désordre.
          </div>
        )}

        <div className="flex gap-2 h-10">
          <button
            type="button"
            disabled={occurrencesCount === 0 || isGlobalSearching}
            onClick={onReplace}
            className={`${(pendingRequests && pendingRequests.length > 0) ? 'w-1/2' : 'w-full'} bg-cherry-red hover:bg-cherry-red-hover text-white font-extrabold text-xs rounded-sm shadow-md transition duration-150 ${occurrencesCount === 0 || isGlobalSearching ? 'opacity-40 cursor-not-allowed' : ''} select-none`}
            title="Appliquer cette requête individuellement"
          >
            {replaceText === "" ? '🗑️ SUPPRIMER L\'OCCURRENCE' : '⚙️ APPLIQUER'}
          </button>
          
          {pendingRequests && pendingRequests.length > 0 && (
            <button
              type="button"
              disabled={isGlobalSearching}
              onClick={onPlayStack}
              className={`w-1/2 bg-[#4caf50] hover:bg-[#45a049] text-white font-extrabold text-xs rounded-sm shadow-md transition duration-150 select-none flex items-center justify-center gap-1 ${isGlobalSearching ? 'opacity-40 cursor-not-allowed' : ''} ${activeStackIndex > 0 && activeStackIndex < pendingRequests.length ? 'outline outline-2 outline-primary-blue outline-offset-1' : ''}`}
              title="Appliquer les requêtes de la pile dans l'ordre à partir de la requête active."
            >
              ▶ APPLIQUER PILE
            </button>
          )}
        </div>
      </div>
      
      </div> {/* Fin SECTION SUPÉRIEURE */}

      {/* SPLITTER HORIZONTAL GAUCHE */}
      <Splitter 
        direction="horizontal" 
        onResize={(clientY) => {
          const hasMultistack = pendingRequests && pendingRequests.length > 0;
          const minTopHeight = hasMultistack ? 140 : 100;
          
          // On inclut les paddings/gaps (environ 20px) dans la butée pour ne pas pousser la zone sanctuarisée !
          const bottomReserved = (multiMode && occurrencesCount > 0) ? 240 : 180;
          const maxTopHeight = window.innerHeight - bottomReserved;

          if (clientY > minTopHeight && clientY < maxTopHeight) {
            setTopHeight(clientY);
          }
        }} 
      />

      {/* SECTION INFÉRIEURE (Recherche et paramétrage) */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Conteneur (Scrollbar désactivée pour éviter de pousser le Splitter) */}
        <div className="flex flex-col p-2.5 gap-2.5 flex-1 min-h-0 overflow-hidden">

        {/* 3. Commentaire (Optionnel) en mode Collapsible */}
        <div className="flex flex-col flex-shrink">
          <div className="flex justify-between items-center mb-1 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xxs text-[#aaa] font-bold uppercase">Commentaire (Optionnel)</span>
              <button 
                type="button"
                onClick={() => {
                  if (isCommentBoxCollapsed) {
                    setIsCommentBoxCollapsed(false);
                    setIsCommentBoxCollapsedByUser(false); // Annule la préférence si déplié manuellement
                  } else {
                    setIsCommentBoxCollapsed(true);
                    setIsCommentBoxCollapsedByUser(true);
                  }
                }}
                className="text-xs text-primary-blue hover:text-white bg-transparent border-none cursor-pointer p-0"
                title="Enrouler/Dérouler le commentaire"
              >
                {isCommentBoxCollapsed ? '▶' : '▼'}
              </button>
            </div>
            <span className={`text-[10px] font-bold transition-opacity ${currentLabel ? 'opacity-100' : 'opacity-0'}`}>
              <span className="text-hl-yellow">REQ : </span>
              <span className="text-white">{currentLabel}</span>
            </span>
          </div>
          {!isCommentBoxCollapsed && (
            <textarea
              value={commentText || ""}
              onChange={(e) => onChangeCommentText(e.target.value)}
              disabled={isCodeEmpty || isGlobalSearching}
              placeholder={isCodeEmpty ? "" : "Ex: Refactorisation du calcul de version..."}
              className="w-full min-h-[30px] p-2 bg-bg-dark border border-border-dark rounded-sm text-sm font-mono text-hl-yellow resize-none shrink"
              style={{ fontSize: 'calc(14px + var(--global-zoom-offset, 0px))' }}
            />
          )}
        </div>

      {/* 5. Zone de Recherche (1) - Double calque Backdrop/Overlay */}
      <div className="flex flex-col flex-1 min-h-[60px] shrink">
        <div className="flex justify-between items-center mb-1 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xxs text-[#aaa] font-bold uppercase">Texte à chercher (1)</span>
            <button
               type="button"
               disabled={isCodeEmpty}
               onClick={() => setShowInvisibles(!showInvisibles)}
               className={`transition-colors ${isCodeEmpty ? 'opacity-40 cursor-not-allowed' : 'hover:text-white cursor-pointer text-[#888]'}`}
               title="Afficher/Masquer les caractères cachés (·, →, ↵)"
            >
               {showInvisibles ? (
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
               ) : (
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
               )}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
               type="button"
               disabled={isCodeEmpty}
               onClick={() => onChangeIgnoreSpaces(!ignoreSpaces)}
               onDoubleClick={() => !isCodeEmpty && onDoubleClickSmart && onDoubleClickSmart()}
               className={`text-[10px] font-bold px-2 py-0.5 rounded transition ${isCodeEmpty ? 'opacity-40 cursor-not-allowed text-[#555]' : (ignoreSpaces ? 'bg-[#4caf50] text-white shadow-[0_0_8px_rgba(76,175,80,0.6)]' : 'bg-[#555] text-[#ccc] hover:bg-[#666]')}`}
               title="Concilier espaces et majuscules (Smart). Double-cliquez pour sauvegarder cette option par défaut."
            >
               SMART
            </button>
            <div 
            className={`text-[11px] font-mono px-2 py-0.5 rounded font-bold transition-colors select-none flex items-center gap-1.5 ${
               isGlobalSearching
                 ? 'bg-[#331111] text-[#883333] cursor-not-allowed border border-[#552222]'
                 : isReplaceActive 
                    ? 'bg-[#FF8C00]/20 text-[#FF8C00]/50 cursor-not-allowed'
                    : (occurrencesCount > 0)
                        ? (isFindActive ? 'bg-[#00FF7F] text-black shadow-[0_0_8px_rgba(0,255,127,0.6)] cursor-pointer' : 'bg-[#555] text-[#00FF7F] cursor-pointer')
                        : (isFindActive ? 'bg-[#FF8C00] text-black cursor-pointer' : 'bg-[#555] text-[#FF8C00] cursor-pointer')
            }`}
            title={isGlobalSearching ? "Désactivé (Search globale active)" : isReplaceActive ? "Désactivé (Replace actif)" : "Simple-clic pour ouvrir, double-clic pour activer/désactiver"}
            onClick={(e) => {
              if (isGlobalSearching || isReplaceActive) return;
              const rect = e.currentTarget.getBoundingClientRect();
              
              if (clickTimeoutRef.current) {
                // Double clic détecté : annule le simple clic et bascule l'activation
                clearTimeout(clickTimeoutRef.current);
                clickTimeoutRef.current = null;
                setIsFindActive(prev => !prev);
              } else {
                // Attente pour voir s'il s'agit d'un double clic
                clickTimeoutRef.current = setTimeout(() => {
                  clickTimeoutRef.current = null;
                  // Traitement du simple clic
                  if (isFindActive && occurrencesCount > 1) {
                    if (onOpenLineChoiceModal) {
                      onOpenLineChoiceModal({
                        pos: { x: rect.left - 250, y: rect.top - 20 },
                        maxLines: occurrencesCount,
                        linesArray: occLinesArray,
                        title: `Aller à l'occurrence (1 - ${occurrencesCount})`,
                        initialValue: (activeOccIndex + 1).toString()
                      });
                    }
                  }
                }, 250);
              }
            }}
          >
            {(occurrencesCount > 1 && isFindActive) ? (
              <>
                <span 
                  className="hover:text-white px-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSetActiveOccIndex) {
                      onSetActiveOccIndex(prev => prev > 0 ? prev - 1 : occurrencesCount - 1);
                    }
                  }}
                  onDoubleClick={(e) => e.stopPropagation()}
                >
                  ◀
                </span>
                <span>{activeOccIndex + 1} / {occurrencesCount}</span>
                <span 
                  className="hover:text-white px-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSetActiveOccIndex) {
                      onSetActiveOccIndex(prev => prev < occurrencesCount - 1 ? prev + 1 : 0);
                    }
                  }}
                  onDoubleClick={(e) => e.stopPropagation()}
                >
                  ▶
                </span>
              </>
            ) : (
              <span>FIND</span>
            )}
            </div>
          </div>
        </div>
        {isFindEscapeHatchActive && (
          <div 
            className="text-[10px] text-center font-bold text-[#ff9800] bg-[#332200] border border-[#ff9800] rounded p-1 my-1 cursor-pointer hover:bg-[#442200] transition-colors"
            onDoubleClick={onForceFindEscapeHatch}
            title="Double-cliquez pour ignorer cette sécurité et forcer la recherche (risque de lag)"
          >
            ⚠️ Texte à chercher trop court dans un texte trop long (double-cliquez pour forcer)
          </div>
        )}
        <div 
          ref={zoomRef1}
          className="flex-1 min-h-[40px] border border-border-dark bg-bg-dark rounded-sm relative overflow-hidden"
          style={{ fontSize: 'calc(var(--zoom-size, 14px) + var(--global-zoom-offset, 0px))' }}
        >
          <div 
            ref={backdrop1Ref}
            className="backdrop-layer select-none"
            style={{ fontSize: 'inherit' }}
            dangerouslySetInnerHTML={{ __html: findBackdropHtml }}
          />
          <textarea
            ref={textarea1Ref}
            value={findText}
            onChange={(e) => onChangeFindText(normalizeText(e.target.value))}
            onScroll={handleScroll1}
            onDoubleClick={() => handleDoubleClickInput(true)}
            disabled={isCodeEmpty || isGlobalSearching}
            spellCheck="false"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            placeholder={isCodeEmpty ? "Importez d'abord un fichier source..." : "Entrez le texte à chercher..."}
            className={`overlay-layer text-left ${isCodeEmpty || isGlobalSearching || isReplaceActive ? 'cursor-not-allowed opacity-30' : ''}`}
            style={{ fontSize: 'inherit', color: 'transparent', backgroundColor: (isGlobalSearching || isReplaceActive) ? '#331111' : 'transparent' }}
          />
        </div>
      </div>

      {/* 4. Zone de Remplacement (2) - Double calque Backdrop/Overlay */}
      <div className="flex flex-col flex-1 min-h-[60px] shrink">
        <div className="flex justify-between items-center mb-1 flex-shrink-0">
          <span className="text-xxs text-[#aaa] font-bold uppercase">À remplacer par (2)</span>
        </div>
        <div 
          ref={zoomRef2}
          className="flex-1 min-h-[40px] border border-border-dark bg-bg-dark rounded-sm relative overflow-hidden"
          style={{ fontSize: 'calc(var(--zoom-size, 14px) + var(--global-zoom-offset, 0px))' }}
        >
          <div 
            ref={backdrop2Ref}
            className="backdrop-layer select-none"
            style={{ fontSize: 'inherit' }}
            dangerouslySetInnerHTML={{ __html: replaceBackdropHtml }}
          />
          <textarea
            ref={textarea2Ref}
            value={replaceText}
            disabled={isCodeEmpty || isGlobalSearching}
            onChange={(e) => onChangeReplaceText(normalizeText(e.target.value))}
            onScroll={handleScroll2}
            onDoubleClick={() => handleDoubleClickInput(false)}
            spellCheck="false"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            placeholder={isCodeEmpty ? "" : "Entrez le texte de remplacement..."}
            className={`overlay-layer text-left ${isCodeEmpty || isGlobalSearching ? 'cursor-not-allowed' : ''}`}
            style={{ fontSize: 'inherit', color: 'transparent' }}
          />
        </div>
      </div>

        </div> {/* Fin du conteneur scrollable de la zone inférieure */}

      {/* 5. Paramètres de validation et Cherry-Picking (FIXÉ EN BAS) */}
      <div className="flex flex-col gap-2 p-2.5 pt-2 border-t border-border-dark flex-shrink-0">
        <div className="flex flex-row gap-2">
          
          {/* Options de validation (Gauches) */}
          <div className="flex flex-col gap-2 flex-1 justify-start min-h-[88px]">
          
          {(() => {
            const availableWidthForLabels = (multiMode && occurrencesCount > 0) ? width * 0.55 : width;
            const showLabels = availableWidthForLabels >= 210;
            return (
              <>
                <div 
                  className={`flex items-center gap-2 ${isCodeEmpty ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`} 
                  onClick={() => !isCodeEmpty && onChangeSplitChars(!splitChars)}
                  title="Moteur Strict (LCS DraftSurge) :&#10;- ACTIF : Calcule une comparaison extrêmement fine au caractère près pour coloriser précisément les lettres/mots modifiés (tonalités violettes).&#10;- INACTIF : Calcule une comparaison simplifiée par blocs de mots.&#10;Note : Cette option n'affecte que le rendu visuel de la colorisation et n'altère pas le résultat final du remplacement dans le document."
                >
                  <button 
                    disabled={isCodeEmpty}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded transition ${splitChars ? 'bg-[#007acc] text-white shadow-[0_0_8px_rgba(0,122,204,0.6)]' : 'bg-[#555] text-[#ccc] hover:bg-[#666]'}`}
                  >
                    STRICT
                  </button>
                  {showLabels && (
                    <label className={`select-none text-[11px] ${splitChars ? 'text-white font-bold' : 'text-[#ccc]'} ${isCodeEmpty ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                      Moteur strict (LCS fin)
                    </label>
                  )}
                </div>

                <div 
                  className={`flex items-center gap-2 mt-1 ${isCodeEmpty ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`} 
                  onClick={() => !isCodeEmpty && onChangeMultiMode(!multiMode)}
                  onDoubleClick={() => !isCodeEmpty && onDoubleClickMulti && onDoubleClickMulti()}
                  title="Appliquer le remplacement à toutes les occurrences correspondantes trouvées. Double-cliquez pour sauvegarder cette option par défaut."
                >
                  <button 
                    disabled={isCodeEmpty}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded transition ${multiMode ? 'bg-[#5c2d91] text-white shadow-[0_0_8px_rgba(92,45,145,0.6)]' : 'bg-[#555] text-[#ccc] hover:bg-[#666]'}`}
                  >
                    MULTI
                  </button>
                  {showLabels && (
                    <label className={`select-none text-[11px] ${multiMode ? 'text-white font-bold' : 'text-[#ccc]'} ${isCodeEmpty ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                      Multi-emplacement ({occurrencesCount} trouvé{occurrencesCount !== 1 ? 's' : ''})
                    </label>
                  )}
                </div>
              </>
            );
          })()}

          </div>

          {/* 6. Combo-Box de Cherry-Picking (Droite) */}
          {multiMode && occurrencesCount > 0 && (
            <div className="flex flex-row gap-1.5 animate-fadeIn w-[45%] flex-shrink-0">
              <div ref={cherryPickListRef} className="flex-1 h-[150px] overflow-y-auto bg-bg-dark border border-border-dark p-2 rounded-sm flex flex-col gap-1 text-xs text-left border-l-4 border-primary-blue scroll-smooth">
                {cherryPickList.map((idx) => {
                  const isChecked = multiIndices.includes(idx);
                  return (
                    <div 
                      key={idx} 
                      className={`flex items-center gap-2 hover:bg-bg-panel px-1 py-1 rounded transition ${activeOccIndex === idx ? 'bg-primary-blue/20 border border-primary-blue/50' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleOccurrence(idx)}
                        className="cursor-pointer w-4 h-4"
                      />
                      <span 
                        className="text-[13px] font-mono text-text-light/95 cursor-pointer flex-1 select-none"
                        onClick={() => onSetActiveOccIndex && onSetActiveOccIndex(idx)}
                      >
                        Occurrence #{idx + 1}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Boutons de contrôle Cherry-Picking */}
              <div className="flex flex-col justify-between gap-1 w-[45px] shrink-0">
                <button 
                  onClick={() => handleCheckAll(true)}
                  className="flex-1 bg-primary-blue hover:bg-primary-blue-hover text-white text-[12px] font-bold py-1 rounded"
                  title="Sélectionner toutes les occurrences"
                >
                  ☑
                </button>
                <button 
                  onClick={() => handleCheckAll(false)}
                  className="flex-1 bg-disabled-dark hover:bg-border-dark text-[#ccc] text-[12px] font-bold py-1 rounded"
                  title="Désélectionner tout"
                >
                  ☐
                </button>
                <button 
                  onClick={onCherryPickAudit}
                  className="flex-1 bg-[#9E67BA] hover:bg-[#83509e] text-white text-[10px] font-bold py-1 rounded leading-none"
                  title="Générer un rapport d'audit dans le presse-papier"
                >
                  IA
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-3">
          <div className="flex items-baseline gap-2 opacity-70 cursor-default">
            <span className="text-lg sm:text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cherry-red to-purple-500 uppercase tracking-wider leading-none">Rogue Cherry</span>
            <span className="text-xs text-text-light/60"><span className="text-primary-blue font-bold">V1-release</span> / 1.9.0</span>
          </div>
          <button
            type="button"
            disabled={isCodeEmpty}
            onClick={onClear}
            className="bg-disabled-dark hover:bg-cherry-red hover:text-white text-xs text-[#ccc] font-bold px-4 py-1.5 rounded-sm transition duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Effacer les zones (1) et (2)"
          >
            🗑️ VIDER 1 & 2
          </button>
        </div>

      </div>
      </div> {/* Fin SECTION INFÉRIEURE */}
    </div>
  );
}
