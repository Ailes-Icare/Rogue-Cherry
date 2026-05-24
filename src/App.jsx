import React, { useState, useEffect, useMemo, useRef } from 'react';
import SidebarLeft from './components/SidebarLeft.jsx';
import CodeEditor from './components/CodeEditor.jsx';
import SidebarRight from './components/SidebarRight.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import SmartDebugger from './components/SmartDebugger.jsx';
import Splitter from './components/Splitter.jsx';

import { useHistoryStore } from './hooks/useHistoryStore.js';
import { parseSyntaxRequest, DEFAULT_SYNTAX } from './utils/textParser.js';
import { applyDeltaOnText } from './hooks/useHistoryStore.js';
import { computeLiveDiff } from './utils/diffEngine.js';

export default function App() {
  // 1. Instanciation du store d'historique compressé Delta-Encoding
  const store = useHistoryStore();

  // 2. États de Recherche et de Remplacements unitaire / multiple
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [splitChars, setSplitChars] = useState(false);
  const [multiMode, setMultiMode] = useState(false);
  const [multiIndices, setMultiIndices] = useState([]);
  const [activeOccIndex, setActiveOccIndex] = useState(-1);

  // Largeurs dynamiques des panneaux latéraux
  const [leftWidth, setLeftWidth] = useState(320);
  const [rightWidth, setRightWidth] = useState(350);

  // États d'affichages des modales
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDebuggerOpen, setIsDebuggerOpen] = useState(false);
  const [debuggerRawText, setDebuggerRawText] = useState("");

  // Configuration de syntaxe dynamique
  const [syntaxConfig, setSyntaxConfig] = useState(DEFAULT_SYNTAX);

  // Mode édition libre (Cadenas)
  const [isEditable, setIsEditable] = useState(false);
  const textBeforeFreeEdit = useRef(""); // Mémoire temporaire pour calculer le delta fantôme

  // Zoom de police principal
  const [fontSize, setFontSize] = useState(14);

  const [isDragging, setIsDragging] = useState(false);

  // Importation générique depuis fichier
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
      store.resetStore();
      store.pushSnapshot(content, "IMPORT INITIAL");
      
      const safeName = file.name.replace(/\.[^/.]+$/, "");
      store.setProjectName(safeName);
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
    const indices = [];
    let idx = store.currentText.indexOf(findText);
    while (idx !== -1) {
      indices.push(idx);
      idx = store.currentText.indexOf(findText, idx + findText.length);
    }
    return indices;
  }, [store.currentText, findText]);

  const occurrencesCount = occurrences.length;

  // Génération des marqueurs de surbrillance pour l'éditeur principal
  const activeMarks = useMemo(() => {
    if (!findText || occurrencesCount === 0) return [];
    
    return occurrences.map((start, occIndex) => {
      // Si l'occurrence est sélectionnée ou ciblée
      const isSelected = multiMode ? multiIndices.includes(occIndex) : (occIndex === 0);
      return {
        start,
        length: findText.length,
        type: isSelected 
          ? (occIndex === activeOccIndex ? 'hl-yellow' : 'hl-yellow') 
          : 'hl-yellow-pale',
        occIndex
      };
    });
  }, [findText, occurrences, occurrencesCount, multiMode, multiIndices, activeOccIndex]);

  // --- RECONSTRUCTION DES MARQUEURS HISTORIQUES (DRAFTSURGE) ---
  const historyMarks = useMemo(() => {
    if (store.selectedIndex <= 0) return [];
    const rec = store.history[store.selectedIndex];
    if (rec.type !== 'replace') return [];

    // On calcule les marques relatives de remplacement
    const { marksT2: baseMarksT2 } = computeLiveDiff(rec.findStr || "", rec.replaceStr || "", rec.splitChars);

    // Pour obtenir leurs positions absolues dans le currentText, il faut 
    // rejouer virtuellement le remplacement sur le texte de la version N-1.
    const textBefore = store.rebuildTextAt(store.selectedIndex - 1);
    if (!textBefore) return [];
    if (!rec.findStr) return []; // PREVENT INFINITE LOOP

    let indices = [];
    let idx = textBefore.indexOf(rec.findStr);
    while (idx !== -1) {
      indices.push(idx);
      idx = textBefore.indexOf(rec.findStr, idx + Math.max(1, rec.findStr.length)); // SAFE ADVANCE
    }

    let indicesToReplace = [];
    if (rec.multiMode && rec.multiIndices && rec.multiIndices.length > 0) {
      indicesToReplace = [...rec.multiIndices].sort((a, b) => b - a); // Reverse order
    } else {
      for (let i = indices.length - 1; i >= 0; i--) indicesToReplace.push(i);
    }

    // Calcul des décalages pour mapper les baseMarksT2 dans currentText
    let finalMarks = [];
    let shiftLen = (rec.replaceStr.length - rec.findStr.length);
    
    // On simule l'application depuis la fin, comme dans applyDeltaOnText,
    // mais ici on s'intéresse à l'emplacement final du replaceStr inséré.
    // L'emplacement final d'une cible k (dans le texte T-after) correspond 
    // à son emplacement de départ tIndex + le shift généré par TOUS les 
    // remplacements PRECEDANT k dans le texte.
    // Puisqu'on itère de la fin vers le début, la position relative d'un 
    // bloc par rapport au début du texte T-before n'a PAS encore été altérée 
    // par les remplacements situés après lui. 
    // Donc son tIndex de départ est toujours correct dans T-before.
    // Mais dans T-after, sa position finale est :
    // tIndex + (nombre de remplacements AVANT lui) * shiftLen
    
    for (let i = 0; i < indicesToReplace.length; i++) {
        let occIndex = indicesToReplace[i]; // ex: 3
        let tIndex = indices[occIndex]; // index dans T-before
        
        // Combien de cibles réelles sont placées AVANT occIndex ?
        let replacementsBefore = 0;
        for (let j = 0; j < indicesToReplace.length; j++) {
            if (indicesToReplace[j] < occIndex) replacementsBefore++;
        }
        
        let finalPos = tIndex + (replacementsBefore * shiftLen);

        // On projette baseMarksT2
        let mapped = baseMarksT2.map(m => ({
            start: m.start + finalPos,
            length: m.length,
            type: m.type
        }));
        finalMarks.push(...mapped);
    }

    return finalMarks;
  }, [store.history, store.selectedIndex]);

  const allMarks = useMemo(() => {
    return [...activeMarks, ...historyMarks];
  }, [activeMarks, historyMarks]);

  // Synchronisation des indices multiMode lors d'une nouvelle recherche
  useEffect(() => {
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
        store.resetStore();
        store.pushSnapshot(clipText, "IMPORT INITIAL");
        
        // Nom de projet auto par défaut s'il est vide
        if (!store.projectName) {
          store.setProjectName("Projet_Cherry");
        }
      })
      .catch(() => alert("Impossible de lire le presse-papier."));
  };

  // Copie dans le presse-papier du code courant
  const handleCopyMainCode = () => {
    if (!store.currentText) {
      alert("Aucun code source à copier.");
      return;
    }
    navigator.clipboard.writeText(store.currentText)
      .then(() => alert("Code source copié dans le presse-papier !"))
      .catch(() => alert("Échec de la copie."));
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
    
    // Génération automatique du delta fantôme : on remplace le texte d'origine par le nouveau texte
    store.pushReplace(
      textBeforeFreeEdit.current, 
      newText, 
      false, 
      [], 
      false, 
      "Édition Libre"
    );
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

    // Calcul du nouveau texte via le diffEngine
    const newText = applyDeltaOnText(
      store.currentText,
      findText,
      replaceText,
      multiMode,
      multiIndices
    );

    // Enregistrement après application réussie dans la pile d'historique
    store.pushReplace(
      findText,
      replaceText,
      multiMode,
      multiIndices,
      splitChars,
      null // Laisse le store déduire Z1, Z2...
    );

    // Nettoyage et reset
    setFindText("");
    setReplaceText("");
  };

  // Réception et traitement d'une requête syntaxique IA (Coller depuis presse-papier)
  const handleImportSyntaxRequest = (clipboardText) => {
    const parsed = parseSyntaxRequest(clipboardText, syntaxConfig);
    
    if (parsed.isSyntax) {
      if (parsed.isValid) {
        // La requête est syntaxiquement valide.
        // Testons si le texte FIND est présent dans le code source actuel !
        const testOccs = store.currentText.indexOf(parsed.findText);
        
        if (testOccs === -1) {
          // FIND introuvable : on ouvre le Débogueur pour correction
          alert("Le texte recherché est introuvable. Ouverture automatique du Débogueur.");
          setDebuggerRawText(clipboardText);
          setIsDebuggerOpen(true);
        } else {
          // FIND trouvé avec succès !
          setFindText(parsed.findText);
          setReplaceText(parsed.replaceText);
          setMultiMode(parsed.multiMode);
          setMultiIndices(parsed.multiIndices);
          
          // Notification rapide
          alert(parsed.label ? `Requête "${parsed.label}" chargée !` : "Requête IA validée et chargée ! Cliquez sur APPLIQUER pour valider.");
        }
      } else {
        // Syntaxe brisée détectée : on ouvre le Débogueur pour la réparer
        alert("Erreur syntaxique détectée dans la requête. Ouverture automatique du Débogueur.");
        setDebuggerRawText(clipboardText);
        setIsDebuggerOpen(true);
      }
    } else {
      // Ce n'est pas une requête syntaxique : on l'importe simplement comme du texte FIND brut
      setFindText(clipboardText);
      alert("Texte brut importé dans la zone de recherche (FIND).");
    }
  };

  // Application de la requête réparée depuis la modale de Débogage
  const handleApplyDebuggerRequest = ({ findText: f, replaceText: r, label, multiMode: m, multiIndices: idxs }) => {
    // 1. On charge la requête dans le formulaire gauche
    setFindText(f);
    setReplaceText(r);
    setMultiMode(m);
    setMultiIndices(idxs);

    // 2. On applique directement le remplacement sur le code source !
    const newText = applyDeltaOnText(
      store.currentText,
      f,
      r,
      m,
      idxs
    );

    store.pushReplace(
      f,
      r,
      m,
      idxs,
      splitChars,
      label
    );

    // Nettoyage après application
    setFindText("");
    setReplaceText("");
    alert(label ? `Opération "${label}" appliquée avec succès !` : "Requête déboguée appliquée avec succès !");
  };

  // Copie de la requête depuis la modale sans appliquer
  const handleAcceptAndCopy = ({ findText: f, replaceText: r, multiMode: m, multiIndices: idxs }) => {
    setFindText(f);
    setReplaceText(r);
    setMultiMode(m);
    setMultiIndices(idxs);
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
      history: store.history
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
        onChangeFindText={setFindText}
        onChangeReplaceText={setReplaceText}
        splitChars={splitChars}
        onChangeSplitChars={setSplitChars}
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
      />

      <Splitter direction="vertical" onResize={handleResizeLeft} />

      {/* 2. ÉDITEUR DE CODE CENTRAL */}
      <div className="flex-1 flex flex-col min-w-0 p-2.5 gap-2.5">
        
        {/* En-tête Éditeur Central */}
        <div className="flex justify-between items-start gap-4 border-b border-border-dark pb-2.5 flex-shrink-0">
          <div className="flex flex-col flex-1 h-[75px] justify-between">
            <div className="flex items-center gap-2">
              <label className="text-xs text-[#aaa] font-bold whitespace-nowrap">Nom du projet</label>
              <input 
                type="text" 
                value={store.projectName} 
                onChange={(e) => store.setProjectName(e.target.value)} 
                className="bg-bg-dark border border-border-dark text-[#d4d4d4] text-xs px-2 py-1 rounded w-full outline-none focus:border-primary-blue transition"
                placeholder="Entrez le nom du projet..."
              />
            </div>
            <div className="text-sm select-none font-bold mt-1">
              CODE SOURCE - <span className="text-[#FF4500] uppercase font-mono">{store.projectName || 'SANS_NOM'}</span> - <span className="text-hl-yellow text-lg ml-1 font-black font-mono">{store.currentVersion}</span>
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
              className="px-3.5 bg-bg-panel-light border border-border-dark hover:border-primary-blue rounded flex flex-col justify-center items-center gap-1 transition text-xs font-bold"
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
              onClick={() => {
                if (store.selectedIndex === -1) return;
                const opt = prompt("Entrez 'M' pour incrémenter une version majeure (VX.0.0) ou 'm' pour une version mineure (VX.Y.0) :");
                if (opt === 'M' || opt === 'm') {
                  store.createNewBranch(opt);
                  alert("Point de version majeur/mineur fixé !");
                }
              }}
              className="px-3 bg-bg-panel-light border border-border-dark hover:border-[#20b2aa] rounded flex flex-col justify-center items-center gap-1 transition text-xs font-bold"
              title="Marquer une version Majeure ou Mineure"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#20b2aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                <polyline points="17 6 23 6 23 12"></polyline>
              </svg>
              <span className="text-[#20b2aa] font-extrabold leading-none mt-0.5">TAG VER</span>
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
          text={store.currentText}
          onTextChange={handleSaveFreeEdit}
          marks={allMarks}
          activeOccIndex={activeOccIndex}
          isEditable={isEditable}
          onToggleEditable={handleToggleEditable}
          fontSize={fontSize}
          statusBarInfo={
            occurrencesCount > 0 
              ? `Occurrence ${activeOccIndex + 1}/${occurrencesCount} ciblée | Lignes: ${store.currentText.split('\n').length}`
              : `Lignes: ${store.currentText ? store.currentText.split('\n').length : 0} | Caractères: ${store.currentText ? store.currentText.length : 0}`
          }
        />
      </div>

      <Splitter direction="vertical" onResize={handleResizeRight} />

      {/* 3. PANNEAU DROIT (HISTORIQUE) */}
      <SidebarRight
        history={store.history}
        selectedIndex={store.selectedIndex}
        onSelectIndex={store.setSelectedIndex}
        onSaveProject={handleExportProject}
        onLoadProject={handleTriggerImport}
        onResetProject={() => {
          if (confirm("Voulez-vous vraiment effacer tout le projet et l'historique ?")) {
            store.resetStore();
            setFindText("");
            setReplaceText("");
          }
        }}
        onBranchOut={store.createNewBranch}
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

    </div>
  );
}
