import React, { useState, useEffect, useMemo, useRef } from 'react';
import SidebarLeft from './components/SidebarLeft.jsx';
import CodeEditor from './components/CodeEditor.jsx';
import SidebarRight from './components/SidebarRight.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import SmartDebugger from './components/SmartDebugger.jsx';
import Splitter from './components/Splitter.jsx';
import SplashScreen from './components/SplashScreen.jsx';
import VersionTagModal from './components/VersionTagModal.jsx';
import EditRecordModal from './components/EditRecordModal.jsx';
import LineChoiceModal from './components/LineChoiceModal.jsx';
import { useHistoryStore, applyDeltaOnText, rebuildTextAt } from './hooks/useHistoryStore.js';
import { parseSyntaxRequest, splitMultistackRequest, DEFAULT_SYNTAX } from './utils/textParser.js';
import { computeLiveDiff, computeGhostDelta, computeSearchHeatmap } from './utils/diffEngine.js';
import { useMessageBox } from './context/MessageBoxContext.jsx';
import pixelCherryLogo from './assets/brand/Double cherry vector px.svg';

export default function App() {
  const { showAlert, showConfirm, showCustom } = useMessageBox();

  // 1. Instanciation du store d'historique compressé Delta-Encoding
  const store = useHistoryStore();

  // 2. États de Recherche et de Remplacements unitaire / multiple
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [splitChars, setSplitChars] = useState(false);
  const [ignoreSpaces, setIgnoreSpaces] = useState(false);
  const [multiMode, setMultiMode] = useState(false);
  const [multiIndices, setMultiIndices] = useState([]);
  const skipMultiResetRef = useRef(false);
  const [activeOccIndex, setActiveOccIndex] = useState(-1);
  const [commentText, setCommentText] = useState("");
  const [currentLabel, setCurrentLabel] = useState("");
  
  // NOUVEAU: États actifs pour les zones FIND / REPLACE globales
  const [isFindActive, setIsFindActive] = useState(true);
  const [isSmartDebuggerActive, setIsSmartDebuggerActive] = useState(false);
  const [isSplashScreenOpen, setIsSplashScreenOpen] = useState(false);
  const [isReplaceActive, setIsReplaceActive] = useState(false);
  
  // NOUVEAU: Recherche globale (V8)
  const [globalSearchBarText, setGlobalSearchBarText] = useState("");
  const [globalSearchSmartMode, setGlobalSearchSmartMode] = useState(false);
  const [globalSearchOccIndex, setGlobalSearchOccIndex] = useState(0);
  const [globalSearchSuspended, setGlobalSearchSuspended] = useState(false);
  const [lineChoiceModalConfig, setLineChoiceModalConfig] = useState(null);

  // Verrouillage de la SidebarLeft (Étape 5)
  const [isSidebarDisabled, setIsSidebarDisabled] = useState(false);
  const [savedFindActive, setSavedFindActive] = useState(null);
  const sidebarRestoreTimerRef = useRef(null);
  const isGlobalSearching = globalSearchBarText.trim().length > 0 && !globalSearchSuspended;
  
  // Logique de désactivation de la SidebarLeft
  useEffect(() => {
    if (isGlobalSearching) {
      if (!isSidebarDisabled) {
        setSavedFindActive(isFindActive);
        setIsFindActive(false);
        setIsSidebarDisabled(true);
      }
      if (sidebarRestoreTimerRef.current) {
        clearTimeout(sidebarRestoreTimerRef.current);
        sidebarRestoreTimerRef.current = null;
      }
    } else {
      if (isSidebarDisabled && !sidebarRestoreTimerRef.current) {
        sidebarRestoreTimerRef.current = setTimeout(() => {
          setIsSidebarDisabled(false);
          setIsFindActive(prev => savedFindActive !== null ? savedFindActive : prev);
          sidebarRestoreTimerRef.current = null;
        }, 2000);
      }
    }
  }, [isGlobalSearching, isSidebarDisabled, isFindActive, savedFindActive]);
  
  // NOUVEAU: Limites et Echappement du Find Dynamique (Task 8.8)
  const [searchLimits, setSearchLimits] = useState({ maxLines: 500, minChars: 3 });
  const [forceFindSearchOverride, setForceFindSearchOverride] = useState(false);
  const [forceGlobalSearchOverride, setForceGlobalSearchOverride] = useState(false);

  // NOUVEAU: Gestion des états de propreté du projet (Tâche 8.7)
  const [lastSavedHistoryLength, setLastSavedHistoryLength] = useState(0);
  const isProjectEmpty = store.history.length === 0;
  const isProjectDirty = store.history.length !== lastSavedHistoryLength;

  useEffect(() => { setForceFindSearchOverride(false); }, [findText]);
  useEffect(() => { setForceGlobalSearchOverride(false); }, [globalSearchBarText]);

  const handleEscapeHatchDoubleClick = async (type) => {
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
      if (type === 'global') setForceGlobalSearchOverride(true);
      else if (type === 'find') setForceFindSearchOverride(true);
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

  // File d'attente pour le Multistack
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeStackIndex, setActiveStackIndex] = useState(-1);

  // Largeurs dynamiques des panneaux latéraux
  const leftWidthRef = useRef(Math.max(280, Math.floor(window.innerWidth * 0.25)));
  const rightWidthRef = useRef(Math.max(280, Math.floor(window.innerWidth * 0.25)));

  const [leftWidth, _setLeftWidth] = useState(leftWidthRef.current);
  const [rightWidth, _setRightWidth] = useState(rightWidthRef.current);

  const setLeftWidth = (val) => {
    let newVal = typeof val === 'function' ? val(leftWidthRef.current) : val;
    leftWidthRef.current = newVal;
    _setLeftWidth(newVal);
  };

  const setRightWidth = (val) => {
    let newVal = typeof val === 'function' ? val(rightWidthRef.current) : val;
    rightWidthRef.current = newVal;
    _setRightWidth(newVal);
  };

  const lastWindowWidthRef = useRef(window.innerWidth);

  useEffect(() => {
    const handleWindowResize = () => {
      const currentWidth = window.innerWidth;
      const delta = currentWidth - lastWindowWidthRef.current;
      lastWindowWidthRef.current = currentWidth;

      if (delta < 0) {
        let shrinkNeeded = Math.abs(delta);
        
        let l = leftWidthRef.current;
        let r = rightWidthRef.current;
        
        let lAvailable = Math.max(0, l - 280);
        let rAvailable = Math.max(0, r - 280);
        
        let totalAvailable = lAvailable + rAvailable;
        
        if (totalAvailable > 0) {
          let actualShrink = Math.min(shrinkNeeded, totalAvailable);
          let lShrink = 0;
          let rShrink = 0;
          
          if (lAvailable > 0 && rAvailable > 0) {
            let half = actualShrink / 2;
            if (lAvailable >= half && rAvailable >= half) {
              lShrink = half;
              rShrink = half;
            } else if (lAvailable < half) {
              lShrink = lAvailable;
              rShrink = actualShrink - lShrink;
            } else {
              rShrink = rAvailable;
              lShrink = actualShrink - rShrink;
            }
          } else if (lAvailable > 0) {
            lShrink = actualShrink;
          } else if (rAvailable > 0) {
            rShrink = actualShrink;
          }
          
          if (lShrink > 0) setLeftWidth(l - lShrink);
          if (rShrink > 0) setRightWidth(r - rShrink);
        }
      }
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, []);


  // États d'affichages des modales
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDebuggerOpen, setIsDebuggerOpen] = useState(false);
  const [debuggerRawText, setDebuggerRawText] = useState("");
  
  // Modale de Versioning Dynamique
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);

  // Splash Screen Click Handler
  const splashClickTimeoutRef = useRef(null);

  const buildCurrentRequestString = () => {
    if (pendingRequests && pendingRequests.length > 0 && activeStackIndex >= 0 && activeStackIndex < pendingRequests.length) {
      const activeReq = pendingRequests[activeStackIndex];
      const raw = activeReq.parsed ? activeReq.parsed.rawText : (activeReq.rawText || "");
      return raw || "";
    }
    
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
    
    return `${header}\n${commentPart}${syntaxConfig.FIND}\n${findText || ""}\n${syntaxConfig.REPLACE}\n${replaceText || ""}\n${syntaxConfig.END}`;
  };

  const handleSplashButtonClick = () => {
    if (!store.currentText) {
      setIsSplashScreenOpen(true);
      return;
    }

    if (splashClickTimeoutRef.current) {
      clearTimeout(splashClickTimeoutRef.current);
      splashClickTimeoutRef.current = null;
      setIsSplashScreenOpen(true);
    } else {
      splashClickTimeoutRef.current = setTimeout(() => {
        splashClickTimeoutRef.current = null;
        setDebuggerRawText(buildCurrentRequestString());
        setIsDebuggerOpen(true);
      }, 250);
    }
  };
  const [isVersionModalInitMode, setIsVersionModalInitMode] = useState(false);
  const [versionModalInitialTab, setVersionModalInitialTab] = useState('increment');
  const [initialTextPayload, setInitialTextPayload] = useState(null);
  const [initialTextSource, setInitialTextSource] = useState(null);

  // Configuration de syntaxe dynamique
  const [syntaxConfig, setSyntaxConfig] = useState(DEFAULT_SYNTAX);

  // Modale d'édition d'enregistrement
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editModalIndex, setEditModalIndex] = useState(-1);
  const [editModalRecord, setEditModalRecord] = useState(null);

  // Cible de scroll pour l'historique
  const [historyScrollTarget, setHistoryScrollTarget] = useState(null);

  // Moteur d'exécution automatique
  const [isPlayingStack, setIsPlayingStack] = useState(false);
  const [forcePlayStep, setForcePlayStep] = useState(-1);
  const isUserEditingRef = useRef(false);

  // Mode édition libre (Cadenas)
  const [isEditable, setIsEditable] = useState(false);
  const textBeforeFreeEdit = useRef(""); // Mémoire temporaire pour calculer le delta fantôme

  // Zoom de police principal
  const [fontSize, setFontSize] = useState(14);

  const [isDragging, setIsDragging] = useState(false);

  const cancelActiveSmartCancel = () => {
    const activeCancelIndex = store.history.findIndex(h => h.action === "🟡 Pile multistack / Smart Cancel");
    if (activeCancelIndex !== -1) {
       const cancelRec = store.history[activeCancelIndex];
       const originalAction = cancelRec.meta?.originalAction || "❌ Échec Annul.";
       store.updateInfoRecord(activeCancelIndex, { action: originalAction });
    }
  };

  // --- GÉNÉRATION AUTOMATIQUE PILE SMART CANCEL ---
  const handleGenerateMultistack = async (infoIndex) => {
    const infoRec = store.history[infoIndex];
    if (!infoRec || !infoRec.meta || !infoRec.meta.conflictBlockers) return;

    if (pendingRequests.length > 0) {
      if (!(await showConfirm("Une requête ou pile est déjà en cours. Voulez-vous vraiment l'écraser pour lancer l'annulation intelligente ?"))) {
        return;
      }
    }

    const { conflictTarget, conflictBlockers } = infoRec.meta;
    const blockers = [...conflictBlockers].sort((a, b) => b - a);
    const indicesToReverse = [...blockers, conflictTarget];
    
    let multistackRawText = "";
    const generatedRequests = [];
    
    for (const idx of indicesToReverse) {
      const rec = store.history[idx];
      if (!rec || rec.type !== 'replace') continue;
      
      const reqLabel = `SmartCancel-${rec.action || idx}`;
      const multiTag = rec.multiMode ? (rec.multiIndices && rec.multiIndices.length > 0 ? "[MULTI:TRUE]" : "[MULTI:FALSE]") : "[MULTI:FALSE]";
      
      const rawText = `##SYNTAX_COPIE## [LABEL:${reqLabel}] ${multiTag}\n` +
                      `##FIND##\n${rec.replaceStr}\n` +
                      `##REPLACE##\n${rec.findStr}\n` +
                      `##END_COPIE##`;
      
      if (multistackRawText.length > 0) {
        multistackRawText += `\n\n##[MULTISTACK REQUEST]##\n\n`;
      }
      multistackRawText += rawText;
      
      generatedRequests.push({
        status: 'pending',
        isModified: false,
        parsed: {
          isSyntax: true,
          isValid: true,
          label: reqLabel,
          findText: rec.replaceStr,
          replaceText: rec.findStr,
          multiMode: rec.multiMode,
          multiIndices: rec.multiMode ? [] : [],
          smartMode: false,
          rawText: rawText
        }
      });
    }
    
    try {
      await navigator.clipboard.writeText(multistackRawText);
    } catch (e) {
      console.error("Clipboard copy failed", e);
    }
    
    setPendingRequests(generatedRequests);
    setActiveStackIndex(0);
    loadRequestIntoUI(generatedRequests[0].parsed, 0, generatedRequests);
    setIsDebuggerOpen(false);
    
    store.updateInfoRecord(infoIndex, {
      action: "🟡 Pile multistack / Smart Cancel",
      comment: "En attente de résolution par la pile générée."
    });
  };

  const handleFocusLeftPanel = () => {
    if (store.selectedIndex !== store.history.length - 1) {
      store.setSelectedIndex(store.history.length - 1);
      setHistoryScrollTarget(null);
    }
  };

  // Importation générique depuis fichier (Interceptée pour le versioning)
  const processImportFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target.result;
      if (store.history.length > 0) {
        if (!(await showConfirm("Attention : L'importation d'un nouveau fichier va réinitialiser tout le projet. Continuer ?"))) {
          return;
        }
      }
      
      const safeName = file.name.replace(/\.[^/.]+$/, "");
      store.resetStore();
      setInitialTextPayload(content);
      setInitialTextSource({ label: "file init", source: `file : ${file.name}` });
      store.setProjectName(safeName);
      
      // On ouvre la modale pour forcer l'initialisation de la V1.0.0 au format souhaité
      setIsVersionModalInitMode(true);
      setVersionModalInitialTab('increment');
      setIsVersionModalOpen(true);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processImportFile(e.dataTransfer.files[0]);
    }
  };

  const handleOpenFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e) => {
      if (e.target.files && e.target.files.length > 0) {
        processImportFile(e.target.files[0]);
      }
    };
    input.click();
  };

  // --- RECHERCHE ET LOCALISATION DES OCCURRENCES DANS LE CODE ACTIF ---
  const isFindEscapeHatchActive = useMemo(() => {
    if (!store.currentText || !findText) return false;
    const linesCount = store.currentText.split('\n').length;
    return (linesCount > searchLimits.maxLines && findText.length > 0 && findText.length < searchLimits.minChars && !forceFindSearchOverride);
  }, [store.currentText, findText, searchLimits, forceFindSearchOverride]);

  const occurrences = useMemo(() => {
    if (!store.currentText || !findText || isFindEscapeHatchActive) return [];
    const results = [];
    
    if (ignoreSpaces) {
      const parts = findText.split(/\s+/).filter(p => p.length > 0);
      if (parts.length === 0) return []; // Évite les regex vides
      const escapedParts = parts.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      const regex = new RegExp(escapedParts.join('\\s+'), 'gi');
      
      let match;
      while ((match = regex.exec(store.currentText)) !== null) {
        results.push({ start: match.index, length: match[0].length });
      }
    } else {
      let idx = store.currentText.indexOf(findText);
      while (idx !== -1) {
        results.push({ start: idx, length: findText.length });
        idx = store.currentText.indexOf(findText, idx + findText.length);
      }
    }
    return results;
  }, [store.currentText, findText, ignoreSpaces]);

  const occurrencesCount = occurrences.length;

  // Génération des marqueurs de surbrillance pour l'éditeur principal
  const activeMarks = useMemo(() => {
    if (!isFindActive) return [];
    if (!findText || occurrencesCount === 0) return [];
    
    return occurrences.map((occ, occIndex) => {
      // Si l'occurrence est sélectionnée ou ciblée
      const isSelected = multiMode ? multiIndices.includes(occIndex) : (occIndex === 0);
      return {
        start: occ.start,
        length: occ.length,
        type: isSelected 
          ? (occIndex === activeOccIndex ? 'hl-yellow' : 'hl-yellow') 
          : 'hl-yellow-pale',
        occIndex
      };
    });
  }, [findText, occurrences, occurrencesCount, multiMode, multiIndices, activeOccIndex]);

  // --- RECONSTRUCTION DES MARQUEURS HISTORIQUES ACCUMULÉS ---
  const accumulatedHistoryIndex = useMemo(() => {
    let idx = store.selectedIndex;
    while (idx > 0) {
      const rec = store.history[idx];
      if (rec.type === 'snapshot' || rec.action === "Sauvegarde" || rec.action === "Export JSON" || rec.action === "Export Presse-papier") {
        break;
      }
      idx--;
    }
    return idx;
  }, [store.history, store.selectedIndex]);

  const historyMarks = useMemo(() => {
    if (store.selectedIndex <= 0) return [];
    if (accumulatedHistoryIndex === store.selectedIndex) return [];

    const virtualTextBefore = rebuildTextAt(store.history, accumulatedHistoryIndex, store.activeFileId);
    const virtualTextAfter = store.currentText;

    const { marksT2 } = computeLiveDiff(virtualTextBefore, virtualTextAfter, false);
    
    return marksT2;
  }, [store.history, store.selectedIndex, store.activeFileId, store.currentText, accumulatedHistoryIndex]);

  // Marqueurs spécifiques pour la navigation vers l'élément sélectionné
  const selectedRecordMarks = useMemo(() => {
    if (store.selectedIndex <= 0) return [];
    const currentRec = store.history[store.selectedIndex];
    if (!currentRec || currentRec.type !== 'replace') return [];

    const virtualTextBefore = rebuildTextAt(store.history, store.selectedIndex - 1, store.activeFileId);
    const virtualTextAfter = rebuildTextAt(store.history, store.selectedIndex, store.activeFileId);

    const { marksT2 } = computeLiveDiff(virtualTextBefore, virtualTextAfter, currentRec.splitChars);
    return marksT2;
  }, [store.history, store.selectedIndex, store.activeFileId]);

  // === ETAT DU PROJET (Clean/Dirty) ===
  const isProjectClean = useMemo(() => {
    if (!store.history || store.selectedIndex < 0) return true;
    const currentRec = store.history[store.selectedIndex];
    if (currentRec.action === "Export Presse-papier" || currentRec.action === "Sauvegarde" || currentRec.type === "snapshot" || currentRec.action === "Export JSON") {
      return true;
    }
    return false;
  }, [store.history, store.selectedIndex]);

  // Précalcule le texte avec remplacement appliqué si REPLACE est actif
  const previewData = useMemo(() => {
    if (!isGlobalSearching && isReplaceActive && occurrencesCount > 0) {
      const previewText = applyDeltaOnText(
        store.currentText,
        findText,
        replaceText,
        multiMode,
        multiIndices,
        ignoreSpaces
      );
      const { marksT2 } = computeLiveDiff(store.currentText, previewText, splitChars);
      return { text: previewText, marks: marksT2 };
    }
    return null;
  }, [store.currentText, isGlobalSearching, isReplaceActive, findText, replaceText, occurrencesCount, multiMode, multiIndices, ignoreSpaces, splitChars]);

  const allMarks = useMemo(() => {
    if (previewData) {
      return previewData.marks; // Replace preview remplace les marqueurs normaux et d'historique
    }
    return [...activeMarks, ...historyMarks];
  }, [activeMarks, historyMarks, previewData]);

  // Synchronisation des indices multiMode lors d'une nouvelle recherche
  useEffect(() => {
    if (skipMultiResetRef.current) {
      skipMultiResetRef.current = false;
      return;
    }
    if (multiMode) {
      const allIndices = [];
      for (let i = 0; i < occurrencesCount; i++) {
        allIndices.push(i);
      }
      setMultiIndices(allIndices);
    } else {
      setMultiIndices([]);
    }
    setActiveOccIndex(occurrencesCount > 0 ? 0 : -1);
  }, [occurrencesCount, multiMode]);

  // Zoom par touches Ctrl + Molette
  useEffect(() => {
    const handleGlobalWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 1 : -1;
        setFontSize(prev => Math.max(8, Math.min(30, prev + delta)));
      }
    };
    window.addEventListener('wheel', handleGlobalWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleGlobalWheel);
  }, []);

  // --- RECHERCHE GLOBALE ---
  const isGlobalEscapeHatchActive = useMemo(() => {
    if (!store.currentText || !globalSearchBarText) return false;
    const linesCount = store.currentText.split('\n').length;
    return (linesCount > searchLimits.maxLines && globalSearchBarText.length > 0 && globalSearchBarText.length < searchLimits.minChars && !forceGlobalSearchOverride);
  }, [store.currentText, globalSearchBarText, searchLimits, forceGlobalSearchOverride]);

  const globalSearchResult = useMemo(() => {
    if (!globalSearchBarText || isGlobalEscapeHatchActive || globalSearchSuspended) return { marks: [], foundRatio: 0 };
    return computeSearchHeatmap(store.currentText, globalSearchBarText, globalSearchSmartMode);
  }, [store.currentText, globalSearchBarText, globalSearchSmartMode, isGlobalEscapeHatchActive, globalSearchSuspended]);

  useEffect(() => {
    if (globalSearchResult.marks.length > 0) {
      if (globalSearchOccIndex >= globalSearchResult.marks.length) setGlobalSearchOccIndex(globalSearchResult.marks.length - 1);
    } else {
      setGlobalSearchOccIndex(0);
    }
  }, [globalSearchResult, globalSearchOccIndex]);

  // --- GESTIONNAIRES D'ACTIONS ---

  // Importation directe du Texte source
  const handleImportMainCode = () => {
    navigator.clipboard.readText()
      .then(async clipText => {
        if (!clipText.trim()) {
          await showAlert("Le presse-papier est vide.", "Erreur");
          return;
        }
        if (store.history.length > 0) {
          if (!(await showConfirm("Attention : L'importation d'un nouveau fichier va réinitialiser tout le projet. Continuer ?"))) {
            return;
          }
        }
        // Au lieu d'importer directement, on ouvre la modale d'initialisation !
        store.resetStore();
        setInitialTextPayload(clipText);
        setInitialTextSource({ label: "import init", source: "presse-papier" });
        store.setProjectName("");
        
        cancelActiveSmartCancel();
        setPendingRequests([]);
        setActiveStackIndex(-1);
        setFindText("");
        setReplaceText("");
        setCommentText("");
        setCurrentLabel("");
        setMultiIndices([]);
        setMultiMode(false);

        setIsVersionModalInitMode(true);
        setVersionModalInitialTab('increment');
        setIsVersionModalOpen(true);
      })
      .catch(async () => await showAlert("Impossible de lire le presse-papier.", "Erreur"));
  };

  const handleCopyMainCode = async () => {
    if (!store.currentText) {
      await showAlert("Aucun texte source à copier.", "Avertissement");
      return;
    }
    navigator.clipboard.writeText(store.currentText)
      .then(async () => {
        await showAlert("Texte source copié dans le presse-papier !");
        store.pushInfoRecord("Export Presse-papier", "Texte source copié dans le presse-papier");
      })
      .catch(async () => await showAlert("Échec de la copie.", "Erreur"));
  };

  const handleDirectOpenDebugger = (text) => {
    setDebuggerRawText(text || "");
    setIsDebuggerOpen(true);
  };

  // Enregistrer Sous
  const handleSaveAs = async () => {
    if (!store.currentText) return;
    const defaultName = `${store.projectName || 'Projet'}_${store.currentVersion}.txt`;
    
    // File System Access API support
    try {
      if ('showSaveFilePicker' in window) {
        const handle = await window.showSaveFilePicker({
          suggestedName: defaultName,
          types: [{
            description: 'Text Files',
            accept: {'text/plain': ['.txt', '.js', '.jsx', '.html', '.css', '.md', '.json', '.py']}
          }]
        });
        const writable = await handle.createWritable();
        await writable.write(store.currentText);
        await writable.close();
        await showAlert("Fichier enregistré avec succès !");
        store.pushInfoRecord("Sauvegarde", `Fichier enregistré sous ${handle.name}`);
      } else {
        // Fallback pour les navigateurs non compatibles
        const blob = new Blob([store.currentText], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = defaultName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        store.pushInfoRecord("Sauvegarde", `Fichier téléchargé : ${defaultName}`);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error(err);
        await showAlert("Erreur lors de l'enregistrement du fichier.", "Erreur");
      }
    }
  };

  // Clic sur cadenas pour édition libre
  const handleToggleEditable = () => {
    if (!isEditable) {
      // Passage au mode écriture libre : on mémorise la version stable
      textBeforeFreeEdit.current = store.currentText;
      setIsEditable(true);
    } else {
      setIsEditable(false);
    }
  };

  // Enregistrement de la saisie libre (Cadenas reverrouillé)
  const handleSaveFreeEdit = (newText) => {
    if (newText === textBeforeFreeEdit.current) {
      setIsEditable(false);
      return;
    }
    
    // Génération automatique des deltas fantômes ciblés
    const deltas = computeGhostDelta(textBeforeFreeEdit.current, newText);
    
    if (deltas && deltas.length > 0) {
      deltas.forEach(delta => {
        store.pushReplace(
          delta.findStr, 
          delta.replaceStr, 
          false, 
          [], 
          false, 
          "Manual Edit",
          false,
          null,
          null,
          "user"
        );
      });
    }
    
    setIsEditable(false);
  };

  // Lancement de la recherche manuelle
  const handleSearch = async () => {
    if (occurrencesCount === 0) {
      await showAlert("Texte recherché introuvable dans le texte source. Ouverture du Débogueur pour visualiser le décalage (Heatmap).", "Avertissement");
      const dummyRaw = `${syntaxConfig.START} [MULTI:FALSE]\n${syntaxConfig.FIND}\n${findText}\n${syntaxConfig.REPLACE}\n${replaceText}\n${syntaxConfig.END}`;
      setDebuggerRawText(dummyRaw);
      setIsDebuggerOpen(true);
    } else {
      setActiveOccIndex(0);
    }
  };

  // Edition d'un enregistrement d'historique (Label/Commentaire)
  const handleEditRecord = (index) => {
    const rec = store.history[index];
    if (rec) {
      setEditModalIndex(index);
      setEditModalRecord(rec);
      setIsEditModalOpen(true);
    }
  };

  // Centrage de l'écran sur une modification de l'historique
  const handleGoToRecord = async () => {
    if (selectedRecordMarks && selectedRecordMarks.length > 0) {
      // On cible spécifiquement la première modification de la requête active
      setHistoryScrollTarget(selectedRecordMarks[0].start);
    } else {
      await showAlert("Impossible de localiser cette modification dans le code actuel.", "Erreur");
    }
  };

  // Auto-scroll natif lors du clic ou changement de version dans l'historique
  const [lastAutoScrollIndex, setLastAutoScrollIndex] = useState(-1);
  useEffect(() => {
    if (store.selectedIndex !== lastAutoScrollIndex && store.selectedIndex > 0) {
      setLastAutoScrollIndex(store.selectedIndex);
      if (selectedRecordMarks && selectedRecordMarks.length > 0) {
        setHistoryScrollTarget(selectedRecordMarks[0].start);
      }
    }
  }, [store.selectedIndex, selectedRecordMarks, lastAutoScrollIndex]);


  // Application du remplacement unitaire ou multiple
  const handleReplace = async () => {
    isUserEditingRef.current = false;
    if (occurrencesCount === 0) return;

    // Remplacement unitaire en mode strict
    if (!multiMode && occurrencesCount > 1) {
      await showAlert(`Erreur : Trouvé ${occurrencesCount} fois. Une occurrence unique est exigée en mode strict.`, "Erreur");
      return;
    }

    if (replaceText === "" && !(await showConfirm("ATTENTION : La zone de remplacement est vide. Voulez-vous vraiment SUPPRIMER cette occurrence du code ?"))) {
      return;
    }

    // Enregistrement après application réussie dans la pile d'historique
    store.pushReplace(
      findText,
      replaceText,
      multiMode,
      multiIndices,
      splitChars,
      currentLabel || null,
      ignoreSpaces,
      null, // explicitVersion
      commentText || null,
      (activeStackIndex >= 0 && pendingRequests[activeStackIndex]) ? "requête" : "user"
    );

    // Nettoyage et reset
    setFindText("");
    setReplaceText("");
    setCommentText("");
    setCurrentLabel("");

    // Dépilement du Multistack avec gestion de l'index actif
    if (pendingRequests.length > 0 && activeStackIndex >= 0) {
      const newReqs = [...pendingRequests];
      newReqs[activeStackIndex].status = 'success';
      setPendingRequests(newReqs);

      // Chercher la prochaine requête en attente
      const nextIndex = newReqs.findIndex((req, idx) => idx > activeStackIndex && (req.status === 'pending' || req.status === 'repaired'));
      
      if (nextIndex !== -1) {
        setActiveStackIndex(nextIndex);
        loadRequestIntoUI(newReqs[nextIndex].parsed, nextIndex, newReqs);
      } else if (newReqs.every(r => r.status === 'success' || r.status === 'ignored')) {
        await showAlert("🎉 Toutes les requêtes de la pile Multistack ont été appliquées avec succès !");
        
        // INTERCEPTION : Pile Multistack Smart Cancel
        const activeCancelIndex = store.history.findIndex(h => h.action === "🟡 Pile multistack / Smart Cancel");
        if (activeCancelIndex !== -1) {
           const cancelRec = store.history[activeCancelIndex];
           const originalAction = cancelRec.meta?.originalAction || "❌ Échec Annul.";
           const newAction = `~~${originalAction}~~`;
           const newComment = (cancelRec.comment || "") + "\n\n✅ [RÉSOLU] L'annulation a bien pu se réaliser grâce à la requête Multistack Smart.";
           store.updateInfoRecord(activeCancelIndex, { action: newAction, comment: newComment });
        }
        setIsPlayingStack(false);
        setForcePlayStep(-1);
        setFindText("");
        setReplaceText("");
        setPendingRequests([]);
        setActiveStackIndex(-1);
      } else {
        setIsPlayingStack(false);
        setForcePlayStep(-1);
      }
    } else {
        setIsPlayingStack(false);
        setForcePlayStep(-1);
    }
  };

  // --- HELPER : Résolution des indices MULTI ---
  const resolveMultiIndices = (parsed, text) => {
    let finalMultiIndices = parsed.multiIndices;
    if (parsed.multiMode) {
      let occurrencesFoundCount = 0;
      if (parsed.smartMode) {
        const parts = parsed.findText.split(/\s+/).filter(p => p.length > 0);
        if (parts.length > 0) {
          const escapedParts = parts.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
          const regex = new RegExp(escapedParts.join('\\s+'), 'gi');
          let match;
          while ((match = regex.exec(text)) !== null) occurrencesFoundCount++;
        }
      } else {
        occurrencesFoundCount = text.split(parsed.findText).length - 1;
      }
      
      if (parsed.multiExclude) {
        const inverted = [];
        for (let i = 0; i < occurrencesFoundCount; i++) {
          if (!parsed.multiIndices.includes(i)) inverted.push(i);
        }
        finalMultiIndices = inverted;
      } else if (parsed.multiIndices.length === 0) {
        const allIndices = [];
        for (let i = 0; i < occurrencesFoundCount; i++) {
          allIndices.push(i);
        }
        finalMultiIndices = allIndices;
      }
    }
    return finalMultiIndices;
  };

  // Chargement d'une requête spécifique dans l'UI (Sas de sécurité)
  const loadRequestIntoUI = async (parsed, index = activeStackIndex, currentReqs = pendingRequests, position = null) => {
    isUserEditingRef.current = false;
    if (parsed.isValid) {
      if (parsed.multiMode && parsed.multiIndices && parsed.multiIndices.length === 0 && !parsed.multiExclude) {
        skipMultiResetRef.current = false;
      } else {
        skipMultiResetRef.current = true;
      }
      let finalMultiIndices = resolveMultiIndices(parsed, store.currentText);

      setFindText(parsed.findText);
      setReplaceText(parsed.replaceText);
      setMultiMode(parsed.multiMode);
      setMultiIndices(finalMultiIndices);
      setIgnoreSpaces(parsed.smartMode || false);
      setCommentText(parsed.comment || "");
      setCurrentLabel(parsed.label || "");

      // Si erreur de localisation avec le vrai texte du store, on passe en error
      if (!parsed.smartMode) {
        const testOccs = store.currentText.indexOf(parsed.findText);
        if (testOccs === -1 && currentReqs[index]) {
          const newReqs = [...currentReqs];
          newReqs[index].status = 'error';
          setPendingRequests(newReqs);
        }
      }
    } else {
      if (currentReqs[index]) {
        const newReqs = [...currentReqs];
        newReqs[index].status = 'error';
        setPendingRequests(newReqs);
      }
      await showAlert("Une requête exige une ouverture automatique du Débogueur : Erreur de syntaxe détectée.", "Erreur", position);
      setDebuggerRawText(parsed.rawText);
      setIsDebuggerOpen(true);
    }
  };

  // Réception et traitement d'une requête syntaxique IA (Coller depuis presse-papier)
  const handleImportSyntaxRequest = async (clipboardText, position = null, isSmartCancelImport = false) => {
    if (!isSmartCancelImport) {
       cancelActiveSmartCancel();
    }
    // 1. Découpage du bloc en requêtes distinctes (Multistack)
    const requests = splitMultistackRequest(clipboardText);

    if (requests.length > 1) {
      // MODE MULTISTACK : On parse toutes les requêtes
      const parsedRequests = requests.map(req => parseSyntaxRequest(req, syntaxConfig));
      const validReqs = parsedRequests.filter(p => p.isSyntax);
      
      if (validReqs.length > 0) {
        const newPending = validReqs.map(p => ({
          raw: p.rawText,
          parsed: p,
          status: 'pending' // 'pending', 'success', 'error', 'repaired'
        }));
        setPendingRequests(newPending);
        setActiveStackIndex(0);
        loadRequestIntoUI(newPending[0].parsed, 0, newPending, position);
        await showAlert(`📦 MODE MULTISTACK : ${newPending.length} requêtes détectées.\nLa première est chargée. Cliquez sur 'APPLIQUER' pour passer automatiquement à la suivante !`, "Information", position);
      } else {
        await showAlert("Aucune requête syntaxique valide trouvée dans la pile Multistack.", "Erreur", position);
      }
    } else {
      // MODE UNITAIRE CLASSIQUE
      const parsed = parseSyntaxRequest(clipboardText, syntaxConfig);
      
      if (parsed.isSyntax) {
        if (parsed.isValid) {
          const testOccs = store.currentText.indexOf(parsed.findText);
          if (testOccs === -1) {
            await showAlert("Le texte recherché est introuvable. Ouverture automatique du Débogueur.", "Erreur", position);
            setDebuggerRawText(clipboardText);
            setIsDebuggerOpen(true);
          } else {
            setFindText(parsed.findText);
            setReplaceText(parsed.replaceText);
            setMultiMode(parsed.multiMode);
            
            skipMultiResetRef.current = true;
            let finalMultiIndices = resolveMultiIndices(parsed, store.currentText);
            setMultiIndices(finalMultiIndices);
            
            setCommentText(parsed.comment || "");
            setCurrentLabel(parsed.label || "");
            await showAlert(parsed.label ? `Requête "${parsed.label}" chargée !` : "Requête IA validée et chargée ! Cliquez sur APPLIQUER pour valider.", "Information", position);
          }
        } else {
          await showAlert("Erreur syntaxique détectée dans la requête. Ouverture automatique du Débogueur.", "Erreur", position);
          setDebuggerRawText(clipboardText);
          setIsDebuggerOpen(true);
        }
      } else {
        // Fallback Texte Brut
        setFindText(clipboardText);
        await showAlert("Texte brut importé dans la zone de recherche (FIND).", "Information", position);
      }
    }
  };

  // Clic sur un item de la pile Multistack
  const handleSelectStackRequest = (index) => {
    setActiveStackIndex(index);
    if (pendingRequests[index]) {
      loadRequestIntoUI(pendingRequests[index].parsed, index);
    }
  };

  const handlePlayStack = () => {
    if (activeStackIndex >= 0 && pendingRequests[activeStackIndex]) {
      setForcePlayStep(activeStackIndex);
    }
    setIsPlayingStack(true);
  };

  // Moteur d'exécution automatique de la pile (Multistack)
  useEffect(() => {
    const playStackStep = async () => {
      if (isPlayingStack) {
        if (pendingRequests.length === 0 || activeStackIndex === -1 || activeStackIndex >= pendingRequests.length) {
          setIsPlayingStack(false);
          setForcePlayStep(-1);
          return;
        }
        
        const req = pendingRequests[activeStackIndex];
        
        // Sécurité : on vérifie que les textboxes correspondent bien à la requête active
        if (findText !== req.parsed.findText && forcePlayStep !== activeStackIndex) {
          return; // on attend le prochain render
        }

        if (forcePlayStep !== activeStackIndex) {
          if (req.status === 'error') {
            setIsPlayingStack(false);
            await showAlert(`Arrêt de l'exécution de la pile : erreur détectée à l'index ${activeStackIndex + 1}.`, "Erreur");
            return;
          }
          
          if (occurrencesCount === 0) {
            setIsPlayingStack(false);
            await showAlert(`Arrêt de l'exécution : l'occurrence est introuvable pour la requête n°${activeStackIndex + 1}.`, "Erreur");
            return;
          }
          
          if (multiMode && occurrencesCount > 1) {
            if (multiIndices.length !== occurrencesCount) {
              setIsPlayingStack(false);
              await showAlert(`Arrêt de l'exécution : mode multi avec cherry-picking requis à l'index ${activeStackIndex + 1}. Veuillez sélectionner les occurrences ciblées.`, "Avertissement");
              return;
            } else {
              const activeCancelIndex = store.history.findIndex(h => h.action === "🟡 Pile multistack / Smart Cancel");
              if (activeCancelIndex !== -1) {
                setIsPlayingStack(false);
                await showAlert(`Arrêt de sécurité (Smart Cancel) : la requête n°${activeStackIndex + 1} modifie plusieurs occurrences. Veuillez vérifier visuellement si l'annulation s'applique correctement à toutes les cibles avant de cliquer sur "Appliquer Pile".`, "Avertissement");
                return;
              }
            }
          }
        } else if (occurrencesCount === 0) {
           setIsPlayingStack(false);
           setForcePlayStep(-1);
           await showAlert(`Impossible de forcer l'exécution : l'occurrence de la requête n°${activeStackIndex + 1} est toujours introuvable. Veuillez corriger le texte ou cliquer sur le bouton R pour réparer la cible.`, "Erreur bloquante");
           return;
        }

        // Si tout est ok, on applique avec un délai pour l'animation
        const timer = setTimeout(() => {
          handleReplace();
        }, 500); 
        
        return () => clearTimeout(timer);
      }
    };
    
    playStackStep();
  }, [isPlayingStack, activeStackIndex, pendingRequests, occurrencesCount, multiMode, multiIndices, findText]);

  const handleClearStack = async () => {
    isUserEditingRef.current = false;
    if (await showConfirm("Voulez-vous vider la pile Multistack actuelle ?")) {
      cancelActiveSmartCancel();
      setPendingRequests([]);
      setActiveStackIndex(-1);
      setFindText("");
      setReplaceText("");
      setCommentText("");
      setCurrentLabel("");
    }
  };

  // Sauvegarde à la volée des retouches libres sur la requête en cours (Multistack)
  useEffect(() => {
    if (!isUserEditingRef.current) return;

    if (activeStackIndex >= 0 && pendingRequests[activeStackIndex]) {
       const req = pendingRequests[activeStackIndex].parsed;
       if (req.findText !== findText || 
           req.replaceText !== replaceText || 
           req.multiMode !== multiMode || 
           req.smartMode !== ignoreSpaces || 
           JSON.stringify(req.multiIndices) !== JSON.stringify(multiIndices)) {
          
          setPendingRequests(prev => {
             const newReqs = [...prev];
             if (newReqs[activeStackIndex]) {
               newReqs[activeStackIndex].parsed = {
                 ...newReqs[activeStackIndex].parsed,
                 findText,
                 replaceText,
                 multiMode,
                 smartMode: ignoreSpaces,
                 multiIndices
               };
               newReqs[activeStackIndex].status = 'repaired';
               newReqs[activeStackIndex].isModified = true;
             }
             return newReqs;
          });
       }
    }
  }, [findText, replaceText, multiMode, ignoreSpaces, multiIndices, activeStackIndex]);

  const handleRevertRequest = (index) => {
    const newReqs = [...pendingRequests];
    newReqs[index].status = 'pending';
    setPendingRequests(newReqs);
    setActiveStackIndex(index);
    loadRequestIntoUI(newReqs[index].parsed, index, newReqs);
  };

  const handleCherryPickAudit = async () => { if (!store.currentText || occurrencesCount === 0 || multiIndices.length === 0) { await showAlert('Aucune occurrence cochée à auditer.', 'Information'); return; } const lines = store.currentText.split('\n'); let auditText = '--- AUDIT DES OCCURRENCES COCHÉES ---\n\n'; const sortedIndices = [...multiIndices].sort((a, b) => a - b); sortedIndices.forEach(idx => { const occ = occurrences[idx]; if (!occ) return; let currentLength = 0; let targetLineStart = -1; let targetLineEnd = -1; for (let i = 0; i < lines.length; i++) { const lineLen = lines[i].length + 1; if (currentLength + lineLen > occ.start && targetLineStart === -1) { targetLineStart = i; } if (currentLength + lineLen > occ.start + occ.length && targetLineEnd === -1) { targetLineEnd = i; break; } currentLength += lineLen; } if (targetLineEnd === -1) targetLineEnd = lines.length - 1; const contextLines = 3; const startContext = Math.max(0, targetLineStart - contextLines); const endContext = Math.min(lines.length - 1, targetLineEnd + contextLines); auditText += `--- OCCURRENCE [Index: ${idx}] ---\n`; auditText += lines.slice(startContext, endContext + 1).join('\n'); auditText += '\n\n'; }); navigator.clipboard.writeText(auditText).then(async () => await showAlert('Audit des occurrences copié dans le presse-papier !')).catch(async () => await showAlert("Erreur de copie de l'audit.", 'Erreur')); };

  const handleAuditIA = async () => {
    const failed = pendingRequests.filter(r => r.status === 'error');
    if (failed.length === 0) {
      await showAlert("Aucune erreur à auditer.", "Information");
      return;
    }
    const auditText = failed.map((req, i) => `--- REQUETE EN ERREUR ${i+1} ---\n${req.raw}\n\n--- CAUSE PROBABLE ---\nTexte cible introuvable ou altéré par une modification précédente.`).join('\n\n');
    navigator.clipboard.writeText(auditText)
      .then(async () => await showAlert("Audit copié dans le presse-papier pour l'IA !"))
      .catch(async () => await showAlert("Erreur de copie de l'audit.", "Erreur"));
  };

  // Application de la requête réparée depuis la modale de Débogage
  const handleApplyDebuggerRequest = async ({ findText: f, replaceText: r, label, multiMode: m, multiIndices: idxs, smartMode }) => {
    isUserEditingRef.current = true;
    // 1. On charge la requête dans le formulaire gauche
    setFindText(f);
    setReplaceText(r);
    setMultiMode(m);
    setMultiIndices(idxs);
    setIgnoreSpaces(smartMode || false);

    // 2. On applique directement le remplacement sur le texte source !
    const newText = applyDeltaOnText(
      store.currentText,
      f,
      r,
      m,
      idxs,
      smartMode || false
    );

    store.pushReplace(
      f,
      r,
      m,
      idxs,
      splitChars,
      label,
      smartMode || false,
      null,
      commentText || null
    );

    // Nettoyage après application
    setFindText("");
    setReplaceText("");
    setCommentText("");
    await showAlert(label ? `Opération "${label}" appliquée avec succès !` : "Requête déboguée appliquée avec succès !");
  };

  // Copie de la requête depuis la modale sans appliquer
  const handleAcceptAndCopy = async ({ findText: f, replaceText: r, multiMode: m, multiIndices: idxs, smartMode }) => {
    isUserEditingRef.current = true;
    setFindText(f);
    setReplaceText(r);
    setMultiMode(m);
    setMultiIndices(idxs);
    setIgnoreSpaces(smartMode || false);
    setCommentText(""); // Le débogueur n'a pas encore de champ commentaire
    await showAlert("Les textes ont été copiés dans les champs FIND et REPLACE. Vous pouvez les vérifier et appliquer manuellement.");
  };

  // Exportation du projet au format JSON
  const handleExportProject = async () => {
    if (store.history.length === 0) {
      await showAlert("Rien à exporter. L'historique est vide.", "Avertissement");
      return;
    }
    if (!store.projectName.trim()) {
      await showAlert("Veuillez donner un nom au projet en haut de l'écran avant de sauvegarder.", "Avertissement");
      return;
    }

    const exportData = {
      projectName: store.projectName,
      history: store.history,
      versionConfig: store.versionConfig // Sauvegarde de la configuration !
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${store.projectName.trim().replace(/\s+/g, '_')}_history.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    store.pushInfoRecord("Export JSON", "Projet exporté au format JSON");
    setLastSavedHistoryLength(store.history.length + 1); // +1 car pushInfoRecord ajoute un élément
  };

  // Déclencheur d'ouverture de fichier pour l'import JSON
  const handleTriggerImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = JSON.parse(event.target.result);
          if (!data.projectName || !Array.isArray(data.history)) {
            await showAlert("Format JSON incorrect. Fichier invalide.", "Erreur");
            return;
          }
          if (store.history.length > 0 && !(await showConfirm("ATTENTION : L'importation d'un projet va écraser tout votre historique en cours. Continuer ?"))) {
            return;
          }
          
          if (data.versionConfig) {
            store.setVersionConfig(data.versionConfig);
          }
          
          store.importProject(data.projectName, data.history);
          setLastSavedHistoryLength(data.history.length);
          
          cancelActiveSmartCancel();
          setPendingRequests([]);
          setActiveStackIndex(-1);
          setFindText("");
          setReplaceText("");
          setCommentText("");
          setCurrentLabel("");
          setMultiIndices([]);
          setMultiMode(false);

          await showAlert(`Projet "${data.projectName}" importé avec succès !`);
        } catch (err) {
          await showAlert("Erreur lors de la lecture du fichier JSON.", "Erreur");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Resizing avec Splitters
  const handleResizeLeft = (clientX) => {
    if (clientX > 200 && clientX < window.innerWidth - 450) {
      setLeftWidth(clientX);
    }
  };

  const handleResizeRight = (clientX) => {
    const w = window.innerWidth - clientX;
    if (w > 200 && w < window.innerWidth - 450) {
      setRightWidth(w);
    }
  };

  const projectSizeBytes = useMemo(() => {
    if (!store.projectName) return 0;
    const exportData = {
      projectName: store.projectName,
      history: store.history,
      versionConfig: store.versionConfig
    };
    return new Blob([JSON.stringify(exportData)]).size;
  }, [store.projectName, store.history, store.versionConfig]);

  return (
    <div 
      className="w-screen h-screen flex bg-bg-dark overflow-hidden font-segoe select-none relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      
      {/* Overlay Drag & Drop */}
      {isDragging && (
        <div className="absolute inset-0 z-[2000] bg-primary-blue bg-opacity-20 backdrop-blur-sm flex items-center justify-center border-4 border-dashed border-primary-blue">
          <div className="text-4xl font-bold text-white pointer-events-none drop-shadow-md bg-black/50 px-10 py-5 rounded-lg border border-border-dark">
            Relâchez le fichier pour l'importer 📥
          </div>
        </div>
      )}

      {/* 1. PANNEAU GAUCHE */}
      <SidebarLeft
        onFocusPanel={handleFocusLeftPanel}
        findText={findText}
        replaceText={replaceText}
        commentText={commentText}
        onChangeCommentText={setCommentText}
        currentLabel={currentLabel}
        pendingRequests={pendingRequests}
        activeStackIndex={activeStackIndex}
        onSelectStackRequest={handleSelectStackRequest}
        onChangeFindText={(val) => { isUserEditingRef.current = true; setFindText(val); }}
        onChangeReplaceText={(txt) => { isUserEditingRef.current = true; setReplaceText(txt); setActiveOccIndex(-1); }}
        splitChars={splitChars}
        onChangeSplitChars={setSplitChars}
        ignoreSpaces={ignoreSpaces}
        onChangeIgnoreSpaces={(val) => { isUserEditingRef.current = true; setIgnoreSpaces(val); }}
        multiMode={multiMode}
        onChangeMultiMode={(val) => { isUserEditingRef.current = true; setMultiMode(val); }}
        multiIndices={multiIndices}
        onChangeMultiIndices={(val) => { isUserEditingRef.current = true; setMultiIndices(val); }}
        occurrencesCount={occurrencesCount}
        onSearch={handleSearch}
        onReplace={handleReplace}
        onClear={() => { setFindText(""); setReplaceText(""); }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenDebugger={handleImportSyntaxRequest}
        onDirectOpenDebugger={handleDirectOpenDebugger}
        syntaxConfig={syntaxConfig}
        width={leftWidth}
        onPlayStack={handlePlayStack}
        onClearStack={handleClearStack}
        onRevertRequest={handleRevertRequest}
        onAuditIA={handleAuditIA}
        onCherryPickAudit={handleCherryPickAudit}
        activeOccIndex={activeOccIndex}
        onSetActiveOccIndex={setActiveOccIndex}
        isCodeEmpty={!store.currentText}
        isGlobalSearching={isGlobalSearching}
        isFindActive={isFindActive}
        setIsFindActive={setIsFindActive}
        isReplaceActive={isReplaceActive}
        setIsReplaceActive={setIsReplaceActive}
        isFindEscapeHatchActive={isFindEscapeHatchActive}
        onForceFindEscapeHatch={() => handleEscapeHatchDoubleClick('find')}
        disabled={isSidebarDisabled}
        onOpenLineChoiceModal={setLineChoiceModalConfig}
        isSmartCancelActive={store.history.findIndex(h => h.action === "🟡 Pile multistack / Smart Cancel") !== -1}
      />

      <Splitter direction="vertical" onResize={handleResizeLeft} />

      {/* 2. ÉDITEUR DE CODE CENTRAL */}
      <div className="flex-1 flex flex-col min-w-[450px] p-2.5 gap-2.5">
        
        {/* En-tête Éditeur Central */}
        <div className="flex justify-between items-start gap-4 border-b border-border-dark pb-2.5 flex-shrink-0">
          <div className="flex flex-col flex-1 h-[75px] justify-center">
            <div 
              className="text-2xl select-none font-bold mt-1 truncate cursor-pointer hover:opacity-80 transition-opacity" 
              title={`Double-clic pour renommer le projet. TEXTE SOURCE - ${store.projectName || 'SANS_NOM'} - ${store.currentVersion}`}
              onDoubleClick={() => {
                setVersionModalInitialTab('rename');
                setIsVersionModalOpen(true);
              }}
            >
              TEXTE SOURCE - <span className="text-[#FF4500] uppercase font-mono">{store.projectName || 'SANS_NOM'}</span> - <span className="text-hl-yellow text-3xl ml-1 font-black font-mono">{store.currentVersion}</span>
            </div>
          </div>

          {/* Boutons d'Action Clés */}
          <div className="flex gap-2 items-stretch h-[70px]">
            <button
              onClick={handleOpenFile}
              className={`px-3.5 rounded flex flex-col justify-center items-center gap-1 transition text-xs font-bold hover:border-[#20b2aa] ${
                !store.currentText ? 'btn-active-blue' : 'btn-active'
              }`}
              title="Ouvrir un fichier"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path stroke="#20b2aa" strokeWidth="2" d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
              <span className="text-[#20b2aa] font-extrabold leading-none mt-0.5">OUVRIR</span>
            </button>

            <button
              onClick={handleImportMainCode}
              className={`px-3.5 rounded flex flex-col justify-center items-center gap-1 transition text-xs font-bold hover:border-[#4da6ff] ${
                !store.currentText ? 'btn-active-blue' : 'btn-active'
              }`}
              title="Coller le code à modifier depuis le presse-papier"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path stroke="#4da6ff" strokeWidth="2" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline stroke="#4da6ff" strokeWidth="2" points="14 2 14 8 20 8"></polyline>
                <path stroke="#ff3333" strokeWidth="3" d="M12 18v-6"></path>
                <path stroke="#ff3333" strokeWidth="3" d="M9 15l3 3 3-3"></path>
              </svg>
              <span className="text-[#4da6ff] font-extrabold leading-none mt-0.5">IMPORT</span>
            </button>

            <button
              onClick={handleCopyMainCode}
              disabled={!store.currentText}
              className={`px-3.5 rounded flex flex-col justify-center items-center gap-1 transition text-xs font-bold hover:border-primary-blue ${
                !store.currentText ? 'btn-disabled-unclickable' : 'btn-active'
              } ${isProjectClean ? 'opacity-50' : ''}`}
              title="Copier le texte source modifié dans le presse-papier"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path stroke="#4da6ff" strokeWidth="2" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline stroke="#4da6ff" strokeWidth="2" points="14 2 14 8 20 8"></polyline>
                <path stroke="#ff3333" strokeWidth="3" d="M12 11v7"></path>
                <path stroke="#ff3333" strokeWidth="3" d="M9 14l3-3 3 3"></path>
              </svg>
              <span className="text-[#4da6ff] font-extrabold leading-none mt-0.5">EXPORT</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAs}
              disabled={!store.currentText}
              className={`px-3.5 rounded flex flex-col justify-center items-center gap-1 transition text-xs font-bold hover:border-[#ffd700] ${
                !store.currentText ? 'btn-disabled-unclickable' : 'btn-active'
              } ${isProjectClean ? 'opacity-50' : ''}`}
              title="Enregistrer le fichier sur votre disque (Save As)"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path stroke="#ffd700" strokeWidth="2" d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline stroke="#ffd700" strokeWidth="2" points="17 21 17 13 7 13 7 21"></polyline>
                <polyline stroke="#ffd700" strokeWidth="2" points="7 3 7 8 15 8"></polyline>
              </svg>
              <span className="text-[#ffd700] font-extrabold leading-none mt-0.5">SAUVER</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (store.selectedIndex === -1) return;
                setIsVersionModalInitMode(false);
                setIsVersionModalOpen(true);
              }}
              disabled={!store.currentText}
              className={`px-3 rounded flex flex-col justify-center items-center gap-1 transition text-xs font-bold hover:border-[#20b2aa] ${
                !store.currentText ? 'btn-disabled-unclickable' : 'btn-active'
              }`}
              title="Configurer les versions ou forcer un saut"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#20b2aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                <polyline points="17 6 23 6 23 12"></polyline>
              </svg>
              <span className="text-[#20b2aa] font-extrabold leading-none mt-0.5">UP VER</span>
            </button>

            <button
              onClick={handleSplashButtonClick}
              className={`w-[72px] flex flex-col justify-center items-center rounded-sm transition gap-1 shadow-md hover:shadow-lg ${
                !store.currentText 
                  ? 'btn-disabled-clickable-blue' 
                  : 'btn-active'
              }`}
              title={!store.currentText ? "À propos de Rogue Cherry" : "À propos (Double-clic) / Débogueur (Clic)"}
            >
              <img src={pixelCherryLogo} alt="Splash Screen" className={`w-16 h-16 object-contain transition duration-300 ${!store.currentText ? 'grayscale-[40%] opacity-70 brightness-[1.1]' : ''}`} />
            </button>

            <div className="flex flex-col gap-1 w-10">
              <button 
                onClick={() => setFontSize(prev => Math.min(30, prev + 1))}
                className="flex-1 bg-bg-panel-light hover:border-primary-blue border border-border-dark rounded flex items-center justify-center text-sm font-bold text-white transition"
                title="Augmenter la taille du code"
              >
                +
              </button>
              <button 
                onClick={() => setFontSize(prev => Math.max(8, prev - 1))}
                className="flex-1 bg-bg-panel-light hover:border-primary-blue border border-border-dark rounded flex items-center justify-center text-sm font-bold text-white transition"
                title="Diminuer la taille du code"
              >
                -
              </button>
            </div>
          </div>
        </div>

        {/* L'Éditeur proprement dit */}
        <CodeEditor
          text={previewData ? previewData.text : store.currentText}
          onTextChange={handleSaveFreeEdit}
          marks={allMarks}
          activeOccIndex={isGlobalSearching ? globalSearchOccIndex : activeOccIndex}
          isEditable={isEditable && !isReplaceActive}
          onToggleEditable={handleToggleEditable}
          fontSize={fontSize}
          setFontSize={setFontSize}
          statusBarInfo={
            isGlobalSearching 
              ? `Recherche globale : ${(globalSearchResult.foundRatio * 100).toFixed(0)}% de correspondance | ${globalSearchResult.marks.length} fragment(s)`
              : (activeOccIndex !== -1 && occurrencesCount > 0 
                  ? `Occurrence ${activeOccIndex + 1}/${occurrencesCount} ${multiMode ? '(MULTIPLE)' : '(UNIQUE)'}` 
                  : 'Mode Normal')
          }
          scrollTargetIndex={historyScrollTarget}
          onToggleOccurrence={(index) => {
            if (isGlobalSearching) return;
            if (multiMode) {
              setMultiIndices(prev => 
                prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index].sort((a,b)=>a-b)
              );
            }
          }}
          globalSearchBarText={globalSearchBarText}
          setGlobalSearchBarText={setGlobalSearchBarText}
          globalSearchSmartMode={globalSearchSmartMode}
          setGlobalSearchSmartMode={setGlobalSearchSmartMode}
          globalSearchOccIndex={globalSearchOccIndex}
          setGlobalSearchOccIndex={setGlobalSearchOccIndex}
          globalSearchMarks={globalSearchResult.marks}
          globalSearchFoundRatio={globalSearchResult.foundRatio}
          isGlobalEscapeHatchActive={isGlobalEscapeHatchActive}
          onForceGlobalEscapeHatch={() => handleEscapeHatchDoubleClick('global')}
          globalSearchSuspended={globalSearchSuspended}
          setGlobalSearchSuspended={setGlobalSearchSuspended}
          onOpenLineChoiceModal={setLineChoiceModalConfig}
        />
      </div>

      <Splitter direction="vertical" onResize={handleResizeRight} />

      {/* 3. PANNEAU DROIT (HISTORIQUE) */}
      <SidebarRight
        history={store.history}
        projectSizeBytes={projectSizeBytes}
        projectName={store.projectName}
        isProjectEmpty={isProjectEmpty}
        isProjectDirty={isProjectDirty}
        selectedIndex={store.selectedIndex}
        onSelectIndex={(idx) => {
          store.setSelectedIndex(idx);
          setHistoryScrollTarget(null);
        }}
        onSaveProject={handleExportProject}
        onLoadProject={handleTriggerImport}
        onResetProject={async () => {
          if (await showConfirm("Voulez-vous vraiment effacer tout le projet et l'historique ?")) {
            store.resetStore();
            setLastSavedHistoryLength(0);
            cancelActiveSmartCancel();
            setPendingRequests([]);
            setActiveStackIndex(-1);
            setFindText("");
            setReplaceText("");
            setCommentText("");
            setCurrentLabel("");
            setMultiIndices([]);
            setMultiMode(false);
          }
        }}
        onBranchOut={() => {
          setVersionModalInitialTab('increment');
          setIsVersionModalOpen(true);
        }}
        onEditRecord={handleEditRecord}
        onGoToRecord={handleGoToRecord}
        onGenerateMultistack={handleGenerateMultistack}
        onCopyAsRequest={async (index) => {
          const rec = store.history[index];
          if (!rec || rec.type === 'snapshot' || rec.type === 'info') {
            await showAlert("Attention : il est impossible de générer une requête pour ce type d'élément (snapshot ou info).", "Avertissement");
            return;
          }
          const multiTag = rec.multiMode 
            ? (rec.multiIndices && rec.multiIndices.length > 0 ? `[MULTI:${rec.multiIndices.join(',')}]` : '[MULTI:TRUE]') 
            : '[MULTI:FALSE]';
          const smartTag = rec.ignoreSpaces ? '[SMART:TRUE]' : '[SMART:FALSE]';
          const labelTag = rec.action ? `[LABEL:${rec.action}]` : '';
          const header = `${syntaxConfig.START} ${labelTag} ${multiTag} ${smartTag}`.replace(/\s+/g, ' ').trim();
          const reqText = `${header}\n${syntaxConfig.FIND}\n${rec.findStr}\n${syntaxConfig.REPLACE}\n${rec.replaceStr}\n${syntaxConfig.END}`;
          navigator.clipboard.writeText(reqText)
            .then(async () => await showAlert("La requête a bien été copiée dans le presse-papier."))
            .catch(async () => await showAlert("Erreur lors de la copie.", "Erreur"));
        }}
        onUndoStrict={async (index) => {
          const rec = store.history[index];
          if (!rec || rec.type !== 'replace') {
            await showAlert("Impossible d'annuler ce type d'élément.", "Erreur");
            return;
          }
          
          // La confirmation systèmatique AVANT toute vérification technique !
          if (!(await showConfirm(`Annuler "${rec.action || 'cette opération'}" ?\n\nL'annulation va générer une nouvelle opération à la FIN de l'historique pour le rétablir, sans altérer vos travaux intermédiaires.`))) {
             return; // L'utilisateur a cliqué sur "Non"
          }

          // Tentative d'annulation : on inverse Find et Replace
          const inverseFindStr = rec.replaceStr;
          const inverseReplaceStr = rec.findStr;

          // 1. Scanner les conflits avec les requêtes ultérieures AVANT tout
          const conflicting = [];
          for (let i = index + 1; i < store.history.length; i++) {
            const laterRec = store.history[i];
            if (laterRec.type !== 'replace') continue;
            // Un conflit existe si le findStr de l'item ultérieur chevauche le replaceStr de l'item à annuler
            if (laterRec.findStr && rec.replaceStr && (
              laterRec.findStr.includes(rec.replaceStr) || 
              rec.replaceStr.includes(laterRec.findStr) ||
              laterRec.findStr.includes(rec.findStr) ||
              rec.findStr.includes(laterRec.findStr)
            )) {
              conflicting.push({ index: i, label: laterRec.action || `Item #${i}` });
            }
          }

          if (conflicting.length > 0) {
            const conflictIndices = conflicting.map(c => c.index);
            const conflictLabels = conflicting.map(c => c.label).join(', ');
            
            store.pushInfoRecord(
              `❌ Échec Annul.`, 
              `Conflit avec : ${conflictLabels}`, 
              "système",
              {
                conflictTarget: index,
                conflictBlockers: conflictIndices,
                originalAction: `❌ Échec Annul.`
              }
            );

            let message = `Désolé, mais je ne peux pas effectuer cette action, car plusieurs requêtes ultérieures ont modifié la même zone de texte ou s'appuient sur cette modification :\n${conflicting.map(c => `  • ${c.label} (item #${c.index + 1})`).join('\n')}\n\nUn rapport a été ajouté à l'historique. Tu peux cliquer sur l'engrenage (⚙️) de ce rapport pour générer et appliquer automatiquement la pile d'annulation corrective (Smart Cancel Multistack).`;
            await showAlert(message, "Conflit détecté");
            return;
          }
          
          // 2. Vérifier si le texte inversé existe dans le code FINAL (à la fin de l'historique)
          const finalIndex = store.history.length - 1;
          const currentText = store.currentText;
          const foundAt = currentText.indexOf(inverseFindStr);
          
          if (foundAt !== -1) {
            // Cas simple : le texte du Replace existe encore tel quel dans le code final
            store.pushReplace(
              inverseFindStr,
              inverseReplaceStr,
              rec.multiMode,
              rec.multiMode ? [] : [], // L'inversion détruit le ciblage du cherry-picking
              rec.splitChars || false,
              `↩️ ${rec.action || 'opération'}`,
              rec.ignoreSpaces || false, // ignoreSpaces
              null, // explicitVersion
              `Annulation intelligente de l'opération générée à la version ${rec.version}`, // comment
              "système", // source
              true // appendToEnd
            );
          } else {
            // Cas complexe : introuvable malgré l'absence de conflits stricts
            await showAlert(`Impossible d'annuler directement "${rec.action || 'cette opération'}".\n\nLe texte produit par cette requête n'existe plus tel quel dans le code actuel. Il a probablement été altéré par des opérations non identifiées automatiquement.`, "Avertissement");
          }
        }}
        onCompress={async (index) => {
          if (index <= 0) {
            await showAlert("Impossible de compresser : cet item est déjà le premier de la pile.", "Avertissement");
            return;
          }
          if (await showConfirm(`⚠️ ATTENTION — Opération irréversible !\n\nCette action va supprimer définitivement les ${index} entrées antérieures à l'item sélectionné et les remplacer par un snapshot unique.\n\nTout l'historique antérieur sera perdu. Continuer ?`)) {
            store.compressHistory(index);
          }
        }}
        onDeleteLast={store.popLastRecord}
        splitChars={splitChars}
        width={rightWidth}
      />

      {/* 4. MODALE DE PARAMÈTRES SYNTAXE */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        syntaxConfig={syntaxConfig}
        onSave={setSyntaxConfig}
      />

      {/* 5. MODALE DE DÉBOGAGE INTELLIGENTE */}
      <SmartDebugger
        isOpen={isDebuggerOpen}
        onClose={() => setIsDebuggerOpen(false)}
        initialRawText={debuggerRawText}
        sourceText={store.currentText}
        onApply={handleApplyDebuggerRequest}
        onAcceptAndCopy={handleAcceptAndCopy}
        syntaxConfig={syntaxConfig}
        searchLimits={searchLimits}
        setSearchLimits={setSearchLimits}
        isMultistackMode={pendingRequests.length > 0}
      />

      {isVersionModalOpen && (
        <VersionTagModal
          isOpen={isVersionModalOpen}
          initialTab={versionModalInitialTab}
          onClose={() => {
            setIsVersionModalOpen(false);
            setIsVersionModalInitMode(false);
            if (isVersionModalInitMode) {
              setInitialTextPayload(null); // Annulation de l'import
            }
          }}
          initialConfig={store.versionConfig}
          currentVersion={store.currentVersion}
          mode={isVersionModalInitMode ? 'init' : (store.selectedIndex < store.history.length - 1 ? 'branch' : 'upVersion')}
          projectName={store.projectName}
          onChangeProjectName={store.setProjectName}
          onSaveConfig={(config, initVersionStr, newProjectName) => {
            if (newProjectName !== undefined) store.setProjectName(newProjectName);
            store.setVersionConfig(config);
            setIsVersionModalOpen(false);
            setIsVersionModalInitMode(false);
            if (isVersionModalInitMode && initialTextPayload !== null) {
              const pName = newProjectName !== undefined ? newProjectName : store.projectName;
              store.pushSnapshot(
                initialTextPayload, 
                initialTextSource ? initialTextSource.label : "IMPORT INITIAL", 
                initVersionStr, 
                initialTextSource ? initialTextSource.source : "Système",
                `Init projet — Initialisation du projet : ${pName}`
              );
              setLastSavedHistoryLength(1); // À l'initialisation, la longueur est de 1
              setInitialTextPayload(null);
              setInitialTextSource(null);
            }
          }}
          onForceIncrement={(targetIndex, config, autoIndex, newProjectName, freezeArchive) => {
            if (newProjectName !== undefined) store.setProjectName(newProjectName);
            store.createNewBranch(targetIndex, freezeArchive);
            setIsVersionModalOpen(false);
            setIsVersionModalInitMode(false);
          }}
          onRename={(configRanks, autoIndex, newProjectName, oldProjectName, freezeArchive) => {
            if (newProjectName !== undefined) store.setProjectName(newProjectName);
            const properConfig = { ranks: configRanks, autoIncrementIndex: autoIndex };
            store.setVersionConfig(properConfig);
            store.createNewBranch('rename', freezeArchive, oldProjectName, newProjectName, configRanks);
            setIsVersionModalOpen(false);
            setIsVersionModalInitMode(false);
          }}
          onBranchReset={(config, autoIndex, newProjectName, freezeArchive) => {
            if (newProjectName !== undefined) store.setProjectName(newProjectName);
            store.createNewBranch('0', freezeArchive);
            setIsVersionModalOpen(false);
            setIsVersionModalInitMode(false);
          }}
          onBranchFromParent={(config, autoIndex, newProjectName, freezeArchive) => {
            if (newProjectName !== undefined) store.setProjectName(newProjectName);
            store.createNewBranch('M', freezeArchive);
            setIsVersionModalOpen(false);
            setIsVersionModalInitMode(false);
          }}
          onChangePattern={(configRanks, autoIndex, newProjectName, oldPatternPreview, freezeArchive) => {
            if (newProjectName !== undefined) store.setProjectName(newProjectName);
            const properConfig = { ranks: configRanks, autoIncrementIndex: autoIndex };
            store.setVersionConfig(properConfig);
            store.createNewBranch('changePattern', freezeArchive, "", "", properConfig, oldPatternPreview);
            setIsVersionModalOpen(false);
            setIsVersionModalInitMode(false);
          }}
        />
      )}

      {isEditModalOpen && (
        <EditRecordModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          record={editModalRecord}
          index={editModalIndex}
          syntaxConfig={syntaxConfig}
          onSave={(index, newLabel, newComment) => {
            store.updateRecord(index, newLabel, newComment);
          }}
        />
      )}

      {/* 9. Modale de Choix de Ligne (Navigation Occurrences) */}
      {lineChoiceModalConfig && (
        <LineChoiceModal
          isVisible={true}
          position={lineChoiceModalConfig.pos}
          onClose={() => setLineChoiceModalConfig(null)}
          maxLines={lineChoiceModalConfig.maxLines}
          linesArray={lineChoiceModalConfig.linesArray}
          title={lineChoiceModalConfig.title}
          initialValue={lineChoiceModalConfig.initialValue}
          onGoToLine={(targetLine, occIndex) => {
            if (lineChoiceModalConfig.callback) {
              lineChoiceModalConfig.callback(occIndex);
            } else {
              setActiveOccIndex(occIndex - 1);
            }
          }}
        />
      )}

      {isSplashScreenOpen && (
        <SplashScreen isOpen={isSplashScreenOpen} onClose={() => setIsSplashScreenOpen(false)} />
      )}
    </div>
  );
}
