import React, { useRef, useEffect, useMemo, useState } from 'react';
import { renderInvisiblesHtml, normalizeText } from '../utils/helpers.js';
import { computeLiveDiff } from '../utils/diffEngine.js';

/**
 * Formate un texte et ses marqueurs en HTML sécurisé pour l'affichage de diffing dans le Backdrop.
 */
function renderLiveDiffHtml(text, marks, showInvisibles = true) {
  if (!text) return "";
  
  // Trier les marqueurs
  const sorted = [...marks].sort((a, b) => a.start - b.start);
  let html = "";
  let lastIdx = 0;

  sorted.forEach((mark) => {
    if (mark.start > lastIdx) {
      html += renderInvisiblesHtml(text.substring(lastIdx, mark.start), showInvisibles);
    }
    const chunk = text.substring(mark.start, mark.start + mark.length);
    const escapedChunk = renderInvisiblesHtml(chunk, showInvisibles);

    // Formate selon la classe de marquage
    if (mark.type === 'hl-del') {
      html += `<span class="hl-del"></span>`;
    } else {
      html += `<mark class="${mark.type}">${escapedChunk}</mark>`;
    }

    lastIdx = mark.start + mark.length;
  });

  if (lastIdx < text.length) {
    html += renderInvisiblesHtml(text.substring(lastIdx), showInvisibles);
  }

  return html;
}

/**
 * Panneau de contrôle gauche : Prompt IA, Formulaires de recherche/remplacement et Cherry-Picking.
 */
export default function SidebarLeft({
  findText,
  replaceText,
  onChangeFindText,
  onChangeReplaceText,
  splitChars,
  onChangeSplitChars,
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
  syntaxConfig,
  width
}) {
  const [showInvisibles, setShowInvisibles] = useState(true);

  const backdrop1Ref = useRef(null);
  const textarea1Ref = useRef(null);
  const backdrop2Ref = useRef(null);
  const textarea2Ref = useRef(null);

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

  // Génération du Prompt standard à copier
  const promptText = useMemo(() => {
    return `Agis comme un expert en modification de code source.
Je vais te fournir un code source. Tu devras me proposer des modifications en respectant STRICTEMENT ce format. Tu dois IMPERATIVEMENT placer ta reponse dans un bloc de code classique (utilise l'outil de formatage de code de ton interface) pour que je puisse la copier facilement en un clic :

${syntaxConfig.START} [LABEL:NomDeLaRequête] [MULTI:FALSE]
${syntaxConfig.FIND}
[Texte exact à trouver, avec lignes avant/après pour être UNIQUE. Fais très attention aux indentations, espaces et caractères spéciaux cachés !]
${syntaxConfig.REPLACE}
[Texte de remplacement complet, incluant les lignes avant/après conservées + modifications]
${syntaxConfig.END}

Règle d'or MANDATORY 
- La zone FIND ne doit avoir qu'une SEULE occurrence exacte dans tout le document. Toutefois, s'il est utile de faire un rechercher/remplacer d'un élément dans tout le texte (ex: un nom de variable), utilise le tag [MULTI:TRUE].
- tu utilisera le marqueur "trois accent grave" pour encadrer le code de la requete pour que je puisse la copier en un clic mais JAMAIS tu utilisera cette chaine spécifique de carractère DANS le code, ni dans find, ni dans replace. sinon, ces carractère seront reconnu comme un échappement de la conversation / du code que tu rédige et ton IDE plantera. 
en lisant ce prompt, ne fais pas l'erreur de me dire que tu l'as compris en écrivant la chaine de carractère en question, évidement.
- tu sera particulièrement vigilent avec les saut de ligne, les espace, les indentation et les caractères invisible. le systeme de reconnaissance de syntaxe est chirurgical et intransigeant : toute faute conduira soit a ne pas trouver le code (find) soit a une requete non reconnue.
- CAS EXCEPTIONNEL (MODE FURTIF) : Si tu dois modifier le parseur lui-même et que tes instructions contiennent les balises standard (ce qui ferait planter l'outil), tu dois utiliser le mode furtif. Commence EXACTEMENT ta réponse par la ligne [REQMODIFIER], suivie sur les 4 lignes suivantes de tes nouvelles balises personnalisées (ex: @@NOUVEAU_DEBUT@@, @@CHERCHER@@, @@REMPLACER@@, @@NOUVELLE_FIN@@). Rédige ensuite ta requête avec ces balises.`;
  }, [syntaxConfig]);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(promptText)
      .then(() => alert("Prompt copié dans le presse-papier !"))
      .catch(() => alert("Erreur lors de la copie."));
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

  const handleAuditIA = () => {
    const text = `Bonjour. J'ai effectué la recherche selon tes consignes. Voici un audit des occurrences correspondant spécifiquement à ta requête de Cherry-Picking. Confirme-moi que tout est correct, ou donne-moi une nouvelle requête si nécessaire :
Occurrence totale : ${occurrencesCount}
Occurrences appliquées : [${multiIndices.join(', ')}]`;
    navigator.clipboard.writeText(text)
      .then(() => alert("Message d'audit IA copié dans le presse-papier !"))
      .catch(() => alert("Erreur de copie."));
  };

  const handlePasteImport = () => {
    navigator.clipboard.readText()
      .then(clip => {
        onOpenDebugger(clip); // Envoie directement au Débogueur pour traitement et validation
      })
      .catch(() => {
        alert("Accès refusé au presse-papier ou presse-papier vide.");
      });
  };

  return (
    <div 
      style={{ width: `${width}px` }} 
      className="flex-shrink-0 bg-bg-panel flex flex-col p-2.5 gap-2.5 overflow-y-auto select-none min-w-[200px]"
    >
      
      {/* 1. Zone Prompt IA */}
      <div className="bg-[#333] p-2.5 border border-dashed border-[#555] rounded-md relative flex gap-3 text-xs flex-shrink-0">
        <div className="flex-1 min-w-0">
          <div className="font-black text-primary-blue text-base mb-1 tracking-wide uppercase">
            Assistant format requête
          </div>
          <span className="text-[10px] text-[#888]">Syntaxe active :</span>
          <pre className="text-sm leading-[1.4] text-[#9cdcfe] mt-2 font-mono select-text overflow-x-auto">
            {syntaxConfig.START} [LABEL:NomDeLaRequête] [MULTI:FALSE]<br/>
            {syntaxConfig.FIND}<br/>
            <span className="text-[#888]">...texte à chercher...</span><br/>
            {syntaxConfig.REPLACE}<br/>
            <span className="text-[#888]">...texte de remplacement...</span><br/>
            {syntaxConfig.END}
          </pre>
        </div>
        
        <div className="flex flex-col gap-2 items-center justify-between w-14 flex-shrink-0">
          <button 
            onClick={handleCopyPrompt}
            className="w-12 h-12 bg-primary-blue hover:bg-primary-blue-hover text-white text-2xl flex items-center justify-center rounded-md shadow-md transition duration-150 active:scale-95"
            title="Copier le prompt IA optimisé dans le presse-papier"
          >
            📋
          </button>
          <div className="text-center flex flex-col justify-center select-none leading-none">
            <span className="font-bold text-[10px] text-primary-blue">ASK TO</span>
            <span className="font-black text-xl text-hl-yellow scale-y-110 tracking-tighter">AI</span>
          </div>
        </div>

        <button 
          onClick={onOpenSettings}
          className="absolute bottom-1 right-1 w-5 h-5 bg-transparent border-none text-[#666] hover:text-primary-blue rounded transition duration-150 cursor-pointer text-xs"
          title="Modifier les balises de syntaxe"
        >
          ⚙️
        </button>
      </div>

      {/* 2. Boutons d'Action Principaux */}
      <div className="flex flex-col gap-2 flex-shrink-0">
        <div className="flex gap-2 h-9">
          <button
            onClick={handlePasteImport}
            className="flex-1 bg-primary-blue hover:bg-primary-blue-hover text-white font-bold text-xs flex items-center justify-center gap-1.5 rounded-sm transition duration-150"
            title="Coller et analyser une requête syntaxique depuis le presse-papier"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.5 9.5 0 0 1 6.7 2.7L21 8"></path><polyline points="21 3 21 8 16 8"></polyline></svg>
            <span>Coller REQUÊTE</span>
          </button>
          <button
            disabled={!findText}
            onClick={onSearch}
            className="flex-1 bg-primary-blue hover:bg-primary-blue-hover text-white font-bold text-xs rounded-sm transition duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            🔍 RECHERCHER
          </button>
        </div>
        
        <button
          disabled={occurrencesCount === 0}
          onClick={onReplace}
          className="w-full h-10 bg-cherry-red hover:bg-cherry-red-hover text-white font-extrabold text-xs rounded-sm shadow-md transition duration-150 disabled:opacity-40 disabled:cursor-not-allowed select-none"
        >
          {replaceText === "" ? '🗑️ SUPPRIMER L\'OCCURRENCE' : '⚙️ APPLIQUER LE REMPLACEMENT'}
        </button>
      </div>

      {/* 3. Zone de Recherche (1) - Double calque Backdrop/Overlay */}
      <div className="flex flex-col flex-1 min-h-[100px]">
        <div className="flex justify-between items-center mb-1 flex-shrink-0">
          <span className="text-xxs text-[#aaa] font-bold uppercase">Texte à chercher (1)</span>
          <span className="text-[11px] font-bold text-white uppercase select-all tracking-wider">FIND</span>
        </div>
        <div className="flex-1 border border-border-dark bg-bg-dark rounded-sm relative overflow-hidden">
          <div 
            ref={backdrop1Ref}
            className="backdrop-layer select-none"
            dangerouslySetInnerHTML={{ __html: findBackdropHtml }}
          />
          <textarea
            ref={textarea1Ref}
            value={findText}
            onChange={(e) => onChangeFindText(normalizeText(e.target.value))}
            onScroll={handleScroll1}
            spellCheck="false"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            placeholder="Entrez le texte à chercher..."
            className="overlay-layer text-left"
          />
        </div>
      </div>

      {/* 4. Zone de Remplacement (2) - Double calque Backdrop/Overlay */}
      <div className="flex flex-col flex-1 min-h-[100px]">
        <div className="flex justify-between items-center mb-1 flex-shrink-0">
          <span className="text-xxs text-[#aaa] font-bold uppercase">À remplacer par (2)</span>
          <span className="text-[11px] font-bold text-white uppercase select-all tracking-wider">REPLACE</span>
        </div>
        <div className="flex-1 border border-border-dark bg-bg-dark rounded-sm relative overflow-hidden">
          <div 
            ref={backdrop2Ref}
            className="backdrop-layer select-none"
            dangerouslySetInnerHTML={{ __html: replaceBackdropHtml }}
          />
          <textarea
            ref={textarea2Ref}
            value={replaceText}
            onChange={(e) => onChangeReplaceText(normalizeText(e.target.value))}
            onScroll={handleScroll2}
            spellCheck="false"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            placeholder="Laissez vide pour supprimer..."
            className="overlay-layer text-left"
          />
        </div>
      </div>

      {/* 5. Paramètres de validation et Cherry-Picking */}
      <div className="flex flex-col gap-2 mt-2 flex-shrink-0">
        <div className="text-[11px] text-[#ccc] font-medium flex flex-col gap-2">
          
          <div className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              id="chk-split-chars" 
              checked={splitChars}
              onChange={(e) => onChangeSplitChars(e.target.checked)}
              className="w-4 h-4 cursor-pointer"
            />
            <label htmlFor="chk-split-chars" className="cursor-pointer select-none">
              Moteur strict (LCS fin)
            </label>
          </div>

          <div className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              id="chk-show-invisibles" 
              checked={showInvisibles}
              onChange={(e) => setShowInvisibles(e.target.checked)}
              className="w-4 h-4 cursor-pointer"
            />
            <label htmlFor="chk-show-invisibles" className="cursor-pointer select-none">
              Afficher les caractères cachés (·, →, ↵)
            </label>
          </div>

          <div className="flex items-center gap-2 cursor-pointer mt-1">
            <input 
              type="checkbox" 
              id="chk-multi" 
              checked={multiMode}
              onChange={(e) => onChangeMultiMode(e.target.checked)}
              className="w-4 h-4 cursor-pointer"
            />
            <label htmlFor="chk-multi" className="cursor-pointer select-none font-bold text-white">
              {multiMode ? `Multi-remplacement (${occurrencesCount} trouvés)` : 'Occurrence unique exigée'}
            </label>
          </div>

        </div>

        {/* 6. Combo-Box de Cherry-Picking */}
        {multiMode && occurrencesCount > 0 && (
          <div className="flex flex-col gap-1.5 animate-fadeIn">
            <div className="max-h-[90px] overflow-y-auto bg-bg-dark border border-border-dark p-2 rounded-sm flex flex-col gap-1 text-xs text-left border-l-4 border-primary-blue">
              {cherryPickList.map((idx) => {
                const isChecked = multiIndices.includes(idx);
                return (
                  <label key={idx} className="flex items-center gap-2 cursor-pointer hover:bg-bg-panel px-1 py-0.5 rounded transition">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleOccurrence(idx)}
                      className="cursor-pointer"
                    />
                    <span className="text-xxs font-mono text-text-light/95">
                      Occurrence #{idx + 1}
                    </span>
                  </label>
                );
              })}
            </div>

            {/* Boutons de contrôle Cherry-Picking */}
            <div className="flex gap-1.5 mt-1">
              <button 
                onClick={() => handleCheckAll(true)}
                className="flex-1 bg-primary-blue hover:bg-primary-blue-hover text-white text-[10px] font-bold py-1 rounded"
              >
                ☑ TOUT
              </button>
              <button 
                onClick={() => handleCheckAll(false)}
                className="flex-1 bg-disabled-dark hover:bg-border-dark text-[#ccc] text-[10px] font-bold py-1 rounded"
              >
                ☐ RIEN
              </button>
              <button 
                onClick={handleAuditIA}
                className="flex-1 bg-[#9E67BA] hover:bg-[#83509e] text-white text-[10px] font-bold py-1 rounded"
                title="Générer un rapport d'audit dans le presse-papier"
              >
                AUDIT IA 🤖
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mt-2.5">
          <span className="text-[10px] text-text-light/40">v8.0.0 React Framework</span>
          <button
            onClick={onClear}
            className="bg-disabled-dark hover:bg-cherry-red hover:text-white text-[10px] text-[#ccc] font-bold px-3 py-1 rounded-sm transition duration-150"
            title="Effacer les zones (1) et (2)"
          >
            🗑️ VIDER 1 & 2
          </button>
        </div>

      </div>

    </div>
  );
}
