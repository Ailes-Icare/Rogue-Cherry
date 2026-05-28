import React, { useState, useEffect, useMemo, useRef } from 'react';
import SidebarLeft from './components/SidebarLeft.jsx';
import CodeEditor from './components/CodeEditor.jsx';
import SidebarRight from './components/SidebarRight.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import SmartDebugger from './components/SmartDebugger.jsx';
import Splitter from './components/Splitter.jsx';
import VersionTagModal from './components/VersionTagModal.jsx';
import EditRecordModal from './components/EditRecordModal.jsx';
import { useHistoryStore, applyDeltaOnText, rebuildTextAt } from './hooks/useHistoryStore.js';
import { parseSyntaxRequest, splitMultistackRequest, DEFAULT_SYNTAX } from './utils/textParser.js';
import { computeLiveDiff, computeGhostDelta } from './utils/diffEngine.js';

export default function App() {
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
  const [isReplaceActive, setIsReplaceActive] = useState(false);
  
  // NOUVEAU: Recherche globale (V8)
  const [globalSearchBarText, setGlobalSearchBarText] = useState("");
  const [globalSearchSmartMode, setGlobalSearchSmartMode] = useState(false);
  const [globalSearchOccIndex, setGlobalSearchOccIndex] = useState(0);
  const isGlobalSearching = globalSearchBarText.trim().length > 0;
  
  // File d'attente pour le Multistack
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeStackIndex, setActiveStackIndex] = useState(-1);

  // Largeurs dynamiques des panneaux latéraux
  const [leftWidth, setLeftWidth] = useState(() => Math.max(300, Math.floor(window.innerWidth * 0.25)));
  const [rightWidth, setRightWidth] = useState(() => Math.max(300, Math.floor(window.innerWidth * 0.25)));

  // États d'affichages des modales
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDebuggerOpen, setIsDebuggerOpen] = useState(false);
  const [debuggerRawText, setDebuggerRawText] = useState("");
  
  // Modale de Versioning Dynamique
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [isVersionModalInitMode, setIsVersionModalInitMode] = useState(false);
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

  // Mode édition libre (Cadenas)
  const [isEditable, setIsEditable] = useState(false);
  const textBeforeFreeEdit = useRef(""); // Mémoire temporaire pour calculer le delta fantôme

  // Zoom de police principal
  const [fontSize, setFontSize] = useState(14);

  const [isDragging, setIsDragging] = useState(false);

  // Importation générique depuis fichier (Interceptée pour le versioning)
  const processImportFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      if (store.history.length > 0) {
        if (!confirm("Attention : L'importation d'un nouveau fichier va réinitialiser tout le projet. Continuer ?")) {
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
  const occurrences = useMemo(() => {
    if (!store.currentText || !findText) return [];
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

  // --- RECONSTRUCTION DES MARQUEURS HISTORIQUES ACCUMULÉS (DRAFTSURGE) ---
  const historyMarks = useMemo(() => {
    if (store.selectedIndex <= 0) return [];

    // On cherche le dernier snapshot avant l'index sélectionné
    let snapshotIdx = -1;
    for (let i = store.selectedIndex; i >= 0; i--) {
      if (store.history[i].type === 'snapshot') {
        snapshotIdx = i;
        break;
      }
    }

    if (snapshotIdx === -1 || snapshotIdx === store.selectedIndex) return [];

    let allAccumulatedMarks = []; // Contiendra toutes les marques accumulées

    // On rejoue les opérations depuis le snapshot jusqu'à l'index sélectionné
    let virtualText = rebuildTextAt(store.history, snapshotIdx);

    for (let hIndex = snapshotIdx + 1; hIndex <= store.selectedIndex; hIndex++) {
      const rec = store.history[hIndex];
      if (rec.type !== 'replace') {
        if (rec.type === 'snapshot') {
          // Si on croise un snapshot, on purge les marques
          allAccumulatedMarks = [];
          virtualText = rec.newText || "";
        }
        continue;
      }

      if (!virtualText || !rec.findStr) continue;

      let indices = [];
      let idx = virtualText.indexOf(rec.findStr);
      // La recherche stricte d'index est sûre car le Smart Replace enregistre
      // le 'findStr' exact du code original, et non la requête IA.
      while (idx !== -1) {
        indices.push(idx);
        idx = virtualText.indexOf(rec.findStr, idx + Math.max(1, rec.findStr.length));
      }

      let indicesToReplace = [];
      if (rec.multiMode) {
        if (rec.multiIndices && rec.multiIndices.length > 0) {
          indicesToReplace = [...rec.multiIndices].sort((a, b) => b - a); // Ordre inverse crucial pour le décalage
        } else {
          // Si mode multi actif SANS ciblage spécifique, c'est un Replace All.
          indicesToReplace = indices.map((_, idx) => idx).sort((a, b) => b - a);
        }
      } else {
        if (indices.length > 0) indicesToReplace = [0];
      }

      const { marksT2: baseMarksT2 } = computeLiveDiff(rec.findStr, rec.replaceStr, rec.splitChars);
      let shiftLen = (rec.replaceStr.length - rec.findStr.length);
      
      let nextVirtualText = virtualText;

      // Pour chaque occurrence remplacée (traitée de la fin vers le début du texte)
      for (let i = 0; i < indicesToReplace.length; i++) {
        let occIndex = indicesToReplace[i];
        let tIndex = indices[occIndex]; 
        
        // --- 1. Décalage des ANCIENNES marques accumulées ---
        // Toutes les marques situées APRÈS tIndex doivent être décalées
        allAccumulatedMarks = allAccumulatedMarks.map(m => {
          if (m.start >= tIndex + rec.findStr.length) {
            return { ...m, start: m.start + shiftLen };
          } else if (m.start >= tIndex && m.start < tIndex + rec.findStr.length) {
            // Une ancienne marque est écrasée par la nouvelle modification
            return null;
          }
          return m;
        }).filter(m => m !== null);

        // --- 2. Ajout des NOUVELLES marques de cette opération ---
        let mapped = baseMarksT2.map(m => ({
          start: m.start + tIndex,
          length: m.length,
          type: m.type
        }));
        allAccumulatedMarks.push(...mapped);

        // --- 3. Application de l'opération sur le virtualText ---
        nextVirtualText = 
          nextVirtualText.substring(0, tIndex) + 
          rec.replaceStr + 
          nextVirtualText.substring(tIndex + rec.findStr.length);
      }
      
      virtualText = nextVirtualText;
    }

    return allAccumulatedMarks;
  }, [store.history, store.selectedIndex]);

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
  const globalSearchResult = useMemo(() => {
    if (!globalSearchBarText) return { marks: [], foundRatio: 0 };
    return computeSearchHeatmap(store.currentText, globalSearchBarText, globalSearchSmartMode);
  }, [store.currentText, globalSearchBarText, globalSearchSmartMode]);

  useEffect(() => {
    if (globalSearchResult.marks.length > 0) {
      if (globalSearchOccIndex >= globalSearchResult.marks.length) setGlobalSearchOccIndex(globalSearchResult.marks.length - 1);
    } else {
      setGlobalSearchOccIndex(0);
    }
  }, [globalSearchResult, globalSearchOccIndex]);

  // --- GESTIONNAIRES D'ACTIONS ---

  // Importation directe du Code source
  const handleImportMainCode = () => {
    navigator.clipboard.readText()
      .then(clipText => {
        if (!clipText.trim()) {
          alert("Le presse-papier est vide.");
          return;
        }
        if (store.history.length > 0) {
          if (!confirm("Attention : L'importation d'un nouveau fichier va réinitialiser tout le projet. Continuer ?")) {
            return;
          }
        }
        // Au lieu d'importer directement, on ouvre la modale d'initialisation !
        store.resetStore();
        setInitialTextPayload(clipText);
        setInitialTextSource({ label: "import init", source: "presse-papier" });
        store.setProjectName("");

        setIsVersionModalInitMode(true);
        setIsVersionModalOpen(true);
      })
      .catch(() => alert("Impossible de lire le presse-papier."));
  };

  const handleCopyMainCode = () => {
    if (!store.currentText) {
      alert("Aucun code source à copier.");
      return;
    }
    navigator.clipboard.writeText(store.currentText)
      .then(() => {
        alert("Code source copié dans le presse-papier !");
        store.pushInfoRecord("Export Presse-papier", "Code source copié dans le presse-papier");
      })
      .catch(() => alert("Échec de la copie."));
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
        alert("Fichier enregistré avec succès !");
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
        alert("Erreur lors de l'enregistrement du fichier.");
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
    
    // Génération automatique du delta fantôme ciblé
    const delta = computeGhostDelta(textBeforeFreeEdit.current, newText);
    
    if (delta) {
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
    }
    
    setIsEditable(false);
  };

  // Lancement de la recherche manuelle
  const handleSearch = () => {
    if (occurrencesCount === 0) {
      alert("Texte recherché introuvable dans le code source. Ouverture du Débogueur pour visualiser le décalage (Heatmap).");
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
  const handleGoToRecord = () => {
    if (historyMarks && historyMarks.length > 0) {
      // On prend la première marque générée par l'historique actif
      setHistoryScrollTarget(historyMarks[0].start);
    } else {
      alert("Impossible de localiser cette modification dans le code actuel.");
    }
  };

  // Application du remplacement unitaire ou multiple
  const handleReplace = () => {
    if (occurrencesCount === 0) return;

    // Remplacement unitaire en mode strict
    if (!multiMode && occurrencesCount > 1) {
      alert(`Erreur : Trouvé ${occurrencesCount} fois. Une occurrence unique est exigée en mode strict.`);
      return;
    }

    if (replaceText === "" && !confirm("ATTENTION : La zone de remplacement est vide. Voulez-vous vraiment SUPPRIMER cette occurrence du code ?")) {
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
        alert("🎉 Toutes les requêtes de la pile Multistack ont été appliquées avec succès !");
        setIsPlayingStack(false);
        setFindText("");
        setReplaceText("");
        setPendingRequests([]);
        setActiveStackIndex(-1);
      } else {
        setIsPlayingStack(false);
      }
    } else {
        setIsPlayingStack(false);
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
  const loadRequestIntoUI = (parsed, index = activeStackIndex, currentReqs = pendingRequests) => {
    if (parsed.isValid) {
      skipMultiResetRef.current = true;
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
      alert("Une requête exige une ouverture automatique du Débogueur : Erreur de syntaxe détectée.");
      setDebuggerRawText(parsed.rawText);
      setIsDebuggerOpen(true);
    }
  };

  // Réception et traitement d'une requête syntaxique IA (Coller depuis presse-papier)
  const handleImportSyntaxRequest = (clipboardText) => {
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
        loadRequestIntoUI(newPending[0].parsed, 0, newPending);
        alert(`📦 MODE MULTISTACK : ${newPending.length} requêtes détectées.\nLa première est chargée. Cliquez sur 'APPLIQUER' pour passer automatiquement à la suivante !`);
      } else {
        alert("Aucune requête syntaxique valide trouvée dans la pile Multistack.");
      }
    } else {
      // MODE UNITAIRE CLASSIQUE
      const parsed = parseSyntaxRequest(clipboardText, syntaxConfig);
      
      if (parsed.isSyntax) {
        if (parsed.isValid) {
          const testOccs = store.currentText.indexOf(parsed.findText);
          if (testOccs === -1) {
            alert("Le texte recherché est introuvable. Ouverture automatique du Débogueur.");
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
            alert(parsed.label ? `Requête "${parsed.label}" chargée !` : "Requête IA validée et chargée ! Cliquez sur APPLIQUER pour valider.");
          }
        } else {
          alert("Erreur syntaxique détectée dans la requête. Ouverture automatique du Débogueur.");
          setDebuggerRawText(clipboardText);
          setIsDebuggerOpen(true);
        }
      } else {
        // Fallback Texte Brut
        setFindText(clipboardText);
        alert("Texte brut importé dans la zone de recherche (FIND).");
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
    setIsPlayingStack(true);
  };

  // Moteur d'exécution automatique de la pile (Multistack)
  useEffect(() => {
    if (isPlayingStack) {
      if (pendingRequests.length === 0 || activeStackIndex === -1 || activeStackIndex >= pendingRequests.length) {
        setIsPlayingStack(false);
        return;
      }
      
      const req = pendingRequests[activeStackIndex];
      
      // Sécurité : on vérifie que les textboxes correspondent bien à la requête active
      if (findText !== req.parsed.findText) {
        return; // on attend le prochain render
      }

      if (req.status === 'error') {
        setIsPlayingStack(false);
        alert(`Arrêt de l'exécution de la pile : erreur détectée à l'index ${activeStackIndex + 1}.`);
        return;
      }
      
      if (occurrencesCount === 0) {
        setIsPlayingStack(false);
        alert(`Arrêt de l'exécution : l'occurrence est introuvable pour la requête n°${activeStackIndex + 1}.`);
        return;
      }
      
      if (multiMode && occurrencesCount > 1 && multiIndices.length !== occurrencesCount) {
        setIsPlayingStack(false);
        alert(`Arrêt de l'exécution : mode multi avec cherry-picking requis à l'index ${activeStackIndex + 1}. Veuillez sélectionner les occurrences ciblées.`);
        return;
      }

      // Si tout est ok, on applique avec un délai pour l'animation
      const timer = setTimeout(() => {
        handleReplace();
      }, 500); 
      
      return () => clearTimeout(timer);
    }
  }, [isPlayingStack, activeStackIndex, pendingRequests, occurrencesCount, multiMode, multiIndices, findText]);

  const handleClearStack = () => {
    if (confirm("Voulez-vous vider la pile Multistack actuelle ?")) {
      setPendingRequests([]);
      setActiveStackIndex(-1);
      setFindText("");
      setReplaceText("");
      setCommentText("");
      setCurrentLabel("");
    }
  };

  const handleRevertRequest = (index) => {
    const newReqs = [...pendingRequests];
    newReqs[index].status = 'pending';
    setPendingRequests(newReqs);
    setActiveStackIndex(index);
    loadRequestIntoUI(newReqs[index].parsed, index, newReqs);
  };

  const handleAuditIA = () => {
    const failed = pendingRequests.filter(r => r.status === 'error');
    if (failed.length === 0) {
      alert("Aucune erreur à auditer.");
      return;
    }
    const auditText = failed.map((req, i) => `--- REQUETE EN ERREUR ${i+1} ---\n${req.raw}\n\n--- CAUSE PROBABLE ---\nTexte cible introuvable ou altéré par une modification précédente.`).join('\n\n');
    navigator.clipboard.writeText(auditText)
      .then(() => alert("Audit copié dans le presse-papier pour l'IA !"))
      .catch(() => alert("Erreur de copie de l'audit."));
  };

  // Application de la requête réparée depuis la modale de Débogage
  const handleApplyDebuggerRequest = ({ findText: f, replaceText: r, label, multiMode: m, multiIndices: idxs, smartMode }) => {
    // 1. On charge la requête dans le formulaire gauche
    setFindText(f);
    setReplaceText(r);
    setMultiMode(m);
    setMultiIndices(idxs);
    setIgnoreSpaces(smartMode || false);

    // 2. On applique directement le remplacement sur le code source !
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
    alert(label ? `Opération "${label}" appliquée avec succès !` : "Requête déboguée appliquée avec succès !");
  };

  // Copie de la requête depuis la modale sans appliquer
  const handleAcceptAndCopy = ({ findText: f, replaceText: r, multiMode: m, multiIndices: idxs, smartMode }) => {
    setFindText(f);
    setReplaceText(r);
    setMultiMode(m);
    setMultiIndices(idxs);
    setIgnoreSpaces(smartMode || false);
    setCommentText(""); // Le débogueur n'a pas encore de champ commentaire
    alert("Les textes ont été copiés dans les champs FIND et REPLACE. Vous pouvez les vérifier et appliquer manuellement.");
  };

  // Exportation du projet au format JSON
  const handleExportProject = () => {
    if (store.history.length === 0) {
      alert("Rien à exporter. L'historique est vide.");
      return;
    }
    if (!store.projectName.trim()) {
      alert("Veuillez donner un nom au projet en haut de l'écran avant de sauvegarder.");
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
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          if (!data.projectName || !Array.isArray(data.history)) {
            alert("Format JSON incorrect. Fichier invalide.");
            return;
          }
          if (store.history.length > 0 && !confirm("ATTENTION : L'importation d'un projet va écraser tout votre historique en cours. Continuer ?")) {
            return;
          }
          
          if (data.versionConfig) {
            store.setVersionConfig(data.versionConfig);
          }
          
          store.importProject(data.projectName, data.history);
          alert(`Projet "${data.projectName}" importé avec succès !`);
        } catch (err) {
          alert("Erreur lors de la lecture du fichier JSON.");
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
        findText={findText}
        replaceText={replaceText}
        commentText={commentText}
        onChangeCommentText={setCommentText}
        currentLabel={currentLabel}
        pendingRequests={pendingRequests}
        activeStackIndex={activeStackIndex}
        onSelectStackRequest={handleSelectStackRequest}
        onChangeFindText={setFindText}
        onChangeReplaceText={(txt) => { setReplaceText(txt); setActiveOccIndex(-1); }}
        splitChars={splitChars}
        onChangeSplitChars={setSplitChars}
        ignoreSpaces={ignoreSpaces}
        onChangeIgnoreSpaces={setIgnoreSpaces}
        multiMode={multiMode}
        onChangeMultiMode={setMultiMode}
        multiIndices={multiIndices}
        onChangeMultiIndices={setMultiIndices}
        occurrencesCount={occurrencesCount}
        onSearch={handleSearch}
        onReplace={handleReplace}
        onClear={() => { setFindText(""); setReplaceText(""); }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenDebugger={handleImportSyntaxRequest}
        syntaxConfig={syntaxConfig}
        width={leftWidth}
        onPlayStack={handlePlayStack}
        onClearStack={handleClearStack}
        onRevertRequest={handleRevertRequest}
        onAuditIA={handleAuditIA}
        activeOccIndex={activeOccIndex}
        onSetActiveOccIndex={setActiveOccIndex}
        isCodeEmpty={!store.currentText}
        isGlobalSearching={isGlobalSearching}
        isFindActive={isFindActive}
        setIsFindActive={setIsFindActive}
        isReplaceActive={isReplaceActive}
        setIsReplaceActive={setIsReplaceActive}
      />

      <Splitter direction="vertical" onResize={handleResizeLeft} />

      {/* 2. ÉDITEUR DE CODE CENTRAL */}
      <div className="flex-1 flex flex-col min-w-0 p-2.5 gap-2.5">
        
        {/* En-tête Éditeur Central */}
        <div className="flex justify-between items-start gap-4 border-b border-border-dark pb-2.5 flex-shrink-0">
          <div className="flex flex-col flex-1 h-[75px] justify-center">
            <div className="text-2xl select-none font-bold mt-1 truncate" title={`CODE SOURCE - ${store.projectName || 'SANS_NOM'} - ${store.currentVersion}`}>
              CODE SOURCE - <span className="text-[#FF4500] uppercase font-mono">{store.projectName || 'SANS_NOM'}</span> - <span className="text-hl-yellow text-3xl ml-1 font-black font-mono">{store.currentVersion}</span>
            </div>
          </div>

          {/* Boutons d'Action Clés */}
          <div className="flex gap-2 items-stretch h-[70px]">
            <button
              onClick={handleOpenFile}
              className="px-3.5 bg-bg-panel-light border border-border-dark hover:border-[#20b2aa] rounded flex flex-col justify-center items-center gap-1 transition text-xs font-bold"
              title="Ouvrir un fichier"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path stroke="#20b2aa" strokeWidth="2" d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
              <span className="text-[#20b2aa] font-extrabold leading-none mt-0.5">OUVRIR</span>
            </button>

            <button
              onClick={handleImportMainCode}
              className="px-3.5 bg-bg-panel-light border border-border-dark hover:border-primary-blue rounded flex flex-col justify-center items-center gap-1 transition text-xs font-bold"
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
              disabled={!store.currentText || isProjectClean}
              className={`px-3.5 bg-bg-panel-light border border-border-dark hover:border-primary-blue rounded flex flex-col justify-center items-center gap-1 transition text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed ${(!store.currentText || isProjectClean) ? 'opacity-50 grayscale' : ''}`}
              title="Copier le code source modifié dans le presse-papier"
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
              disabled={!store.currentText || isProjectClean}
              className={`px-3.5 bg-bg-panel-light border border-border-dark hover:border-[#ffd700] rounded flex flex-col justify-center items-center gap-1 transition text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed ${(!store.currentText || isProjectClean) ? 'opacity-50 grayscale' : ''}`}
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
              className="px-3 bg-bg-panel-light border border-border-dark hover:border-[#20b2aa] rounded flex flex-col justify-center items-center gap-1 transition text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed"
              title="Configurer les versions ou forcer un saut"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#20b2aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                <polyline points="17 6 23 6 23 12"></polyline>
              </svg>
              <span className="text-[#20b2aa] font-extrabold leading-none mt-0.5">UP VER</span>
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
          isEditable={isEditable && !isReplaceActive && !isGlobalSearching}
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
        />
      </div>

      <Splitter direction="vertical" onResize={handleResizeRight} />

      {/* 3. PANNEAU DROIT (HISTORIQUE) */}
      <SidebarRight
        history={store.history}
        selectedIndex={store.selectedIndex}
        onSelectIndex={(idx) => {
          store.setSelectedIndex(idx);
          setHistoryScrollTarget(null);
        }}
        onSaveProject={handleExportProject}
        onLoadProject={handleTriggerImport}
        onResetProject={() => {
          if (confirm("Voulez-vous vraiment effacer tout le projet et l'historique ?")) {
            store.resetStore();
            setFindText("");
            setReplaceText("");
          }
        }}
        onBranchOut={() => setIsVersionModalOpen(true)}
        onEditRecord={handleEditRecord}
        onGoToRecord={handleGoToRecord}
        onCopyAsRequest={(index) => {
          const rec = store.history[index];
          if (!rec || rec.type === 'snapshot' || rec.type === 'info') {
            alert("Attention : il est impossible de générer une requête pour ce type d'élément (snapshot ou info).");
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
            .then(() => alert("La requête a bien été copiée dans le presse-papier."))
            .catch(() => alert("Erreur lors de la copie."));
        }}
        onUndoStrict={(index) => {
          const rec = store.history[index];
          if (!rec || rec.type !== 'replace') {
            alert("Impossible d'annuler ce type d'élément.");
            return;
          }
          // Tentative d'annulation : on inverse Find et Replace
          const inverseFindStr = rec.replaceStr;
          const inverseReplaceStr = rec.findStr;
          
          // Vérifier si le texte inversé existe dans le code actuel
          const currentText = store.currentText;
          const foundAt = currentText.indexOf(inverseFindStr);
          
          if (foundAt !== -1) {
            // Cas simple : le texte du Replace existe encore tel quel dans le code
            if (confirm(`Annuler "${rec.action || 'cette opération'}" ?\n\nLe texte produit par cette requête a été retrouvé intact dans le code source. L'annulation va rétablir le texte d'origine.`)) {
              store.pushReplace(
                inverseFindStr,
                inverseReplaceStr,
                false,
                [],
                false,
                `↩️ Annulation de "${rec.action || 'opération'}"`,
                rec.splitChars || false
              );
            }
          } else {
            // Cas complexe : le texte a été modifié par des items ultérieurs
            // Identifier les items conflictuels
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
            
            let message = `Impossible d'annuler directement "${rec.action || 'cette opération'}".\n\nLe texte produit par cette requête n'existe plus tel quel dans le code actuel.`;
            
            if (conflicting.length > 0) {
              message += `\n\nOpérations ultérieures en conflit :\n${conflicting.map(c => `  • ${c.label} (item #${c.index + 1})`).join('\n')}`;
              message += `\n\nVous devez d'abord annuler ces opérations en remontant le fil.`;
            } else {
              message += `\n\nLe texte a été modifié par des opérations ultérieures non identifiées automatiquement. Remontez le fil de l'historique pour annuler progressivement.`;
            }
            
            alert(message);
          }
        }}
        onCompress={(index) => {
          if (index <= 0) {
            alert("Impossible de compresser : cet item est déjà le premier de la pile.");
            return;
          }
          if (confirm(`⚠️ ATTENTION — Opération irréversible !\n\nCette action va supprimer définitivement les ${index} entrées antérieures à l'item sélectionné et les remplacer par un snapshot unique.\n\nTout l'historique antérieur sera perdu. Continuer ?`)) {
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
      />

      {isVersionModalOpen && (
        <VersionTagModal
          isOpen={isVersionModalOpen}
          onClose={() => {
            setIsVersionModalOpen(false);
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
            if (isVersionModalInitMode && initialTextPayload !== null) {
              const pName = newProjectName !== undefined ? newProjectName : store.projectName;
              store.pushSnapshot(
                initialTextPayload, 
                initialTextSource ? initialTextSource.label : "IMPORT INITIAL", 
                initVersionStr, 
                initialTextSource ? initialTextSource.source : "Système",
                `Init projet — Initialisation du projet : ${pName}`
              );
              setInitialTextPayload(null);
              setInitialTextSource(null);
            }
          }}
          onForceIncrement={(targetIndex, config, autoIndex, newProjectName, freezeArchive) => {
            if (newProjectName !== undefined) store.setProjectName(newProjectName);
            store.createNewBranch(targetIndex, freezeArchive);
            setIsVersionModalOpen(false);
          }}
          onRename={(configRanks, autoIndex, newProjectName, oldProjectName, freezeArchive) => {
            if (newProjectName !== undefined) store.setProjectName(newProjectName);
            const properConfig = { ranks: configRanks, autoIncrementIndex: autoIndex };
            store.setVersionConfig(properConfig);
            store.createNewBranch('rename', freezeArchive, oldProjectName, newProjectName, configRanks);
            setIsVersionModalOpen(false);
          }}
          onBranchReset={(config, autoIndex, newProjectName, freezeArchive) => {
            if (newProjectName !== undefined) store.setProjectName(newProjectName);
            store.createNewBranch('0', freezeArchive);
            setIsVersionModalOpen(false);
          }}
          onBranchFromParent={(config, autoIndex, newProjectName, freezeArchive) => {
            if (newProjectName !== undefined) store.setProjectName(newProjectName);
            store.createNewBranch('M', freezeArchive);
            setIsVersionModalOpen(false);
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

    </div>
  );
}
