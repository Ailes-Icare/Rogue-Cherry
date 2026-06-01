import { useState, useMemo } from 'react';
import { getFullTimestamp, normalizeText } from '../utils/helpers.js';
import { DEFAULT_VERSION_CONFIG, parseVersionStringToRanks, incrementRank, formatVersionString } from '../utils/versionEngine.js';

/**
 * Applique un delta unitaire sur un texte.
 * 
 * @param {string} text - Le texte d'origine.
 * @param {string} findStr - Chaîne recherchée.
 * @param {string} replaceStr - Chaîne de remplacement.
 * @param {boolean} multiMode - Si vrai, remplacement multiple.
 * @param {Array<number>} multiIndices - Indices des occurrences à modifier (cherry-picking).
 * @returns {string} Le texte modifié.
 */
export function applyDeltaOnText(text, findStr, replaceStr, multiMode, multiIndices, ignoreSpaces = false) {
  if (!text) return "";
  if (!findStr) return text;
  
  if (ignoreSpaces) {
    const parts = findStr.split(/\s+/).filter(p => p.length > 0);
    const escapedParts = parts.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(escapedParts.join('\\s+'), 'gi');
    
    let match;
    let newText = "";
    let lastIndex = 0;
    let occIndex = 0;
    
    while ((match = regex.exec(text)) !== null) {
      const matchedOriginalStr = match[0];
      let shouldReplace = false;
      
      if (multiMode) {
        if (multiIndices && multiIndices.length > 0) {
          shouldReplace = multiIndices.includes(occIndex);
        } else {
          shouldReplace = true;
        }
      } else {
        shouldReplace = (occIndex === 0);
      }
      
      if (shouldReplace) {
        // SMART REPLACE : Analyse tokens
        const replaceTokens = replaceStr.split(/(\s+)/);
        const replaceNonWs = replaceTokens.filter(t => t.trim() !== '');
        const findTokens = findStr.split(/(\s+)/);
        const findNonWs = findTokens.filter(t => t.trim() !== '');
        
        let smartReplaced = replaceStr;
        
        if (findNonWs.length === replaceNonWs.length) {
          const origTokens = matchedOriginalStr.split(/(\s+)/);
          let origWsTokens = [];
          for (let i = 1; i < origTokens.length; i += 2) {
            origWsTokens.push(origTokens[i]);
          }
          
          let hybridText = "";
          for (let i = 0; i < replaceNonWs.length; i++) {
            let repWord = replaceNonWs[i];
            // Préservation de la casse d'origine si le mot n'est pas modifié
            if (repWord.toLowerCase() === findNonWs[i].toLowerCase()) {
              repWord = origTokens[i * 2];
            }
            hybridText += repWord;
            if (i < origWsTokens.length) {
              hybridText += origWsTokens[i]; // Préserve les espaces d'origine
            }
          }
          smartReplaced = hybridText;
        } else {
          // Si les longueurs diffèrent, on préserve au moins la casse des mots inchangés
          const origTokens = matchedOriginalStr.split(/(\s+)/);
          let origWordIndex = 0;
          const origWords = origTokens.filter((_, idx) => idx % 2 === 0);
          
          const finalTokens = replaceTokens.map((token, idx) => {
            if (idx % 2 !== 0) return token; // Espace de remplacement
            if (token.trim() === '') return token;
            
            const tokenLower = token.toLowerCase();
            let foundIdx = -1;
            for (let i = origWordIndex; i < origWords.length; i++) {
               if (origWords[i].toLowerCase() === tokenLower) {
                  foundIdx = i;
                  break;
               }
            }
            
            if (foundIdx !== -1) {
               origWordIndex = foundIdx + 1;
               return origWords[foundIdx]; // Conserver la casse d'origine
            }
            
            return token; // Ajout ou modification : prend la casse de la requête
          });
          
          smartReplaced = finalTokens.join('');
        }
        
        newText += text.substring(lastIndex, match.index) + smartReplaced;
      } else {
        newText += text.substring(lastIndex, match.index) + matchedOriginalStr;
      }
      
      lastIndex = regex.lastIndex;
      occIndex++;
    }
    
    newText += text.substring(lastIndex);
    return newText;
  }
  
  // MOTEUR STRICT (Ancien comportement)
  // IMPORTANT : on utilise des fonctions de remplacement (arrow functions) au lieu
  // de chaînes directes pour éviter que JS interprète les patterns $& $' $` dans replaceStr.
  if (multiMode) {
    if (multiIndices && multiIndices.length > 0) {
      const parts = text.split(findStr);
      let newText = parts[0];
      const occurrenceCount = parts.length - 1;
      
      for (let i = 0; i < occurrenceCount; i++) {
        if (multiIndices.includes(i)) {
          newText += replaceStr + parts[i + 1];
        } else {
          newText += findStr + parts[i + 1];
        }
      }
      return newText;
    } else {
      // replaceAll avec fonction pour neutraliser les patterns $ de JS
      return text.replaceAll(findStr, () => replaceStr);
    }
  } else {
    // replace avec fonction pour neutraliser les patterns $ de JS
    return text.replace(findStr, () => replaceStr);
  }
}

/**
 * Reconstitue le texte source à un index d'historique donné en rejouant séquentiellement les deltas.
 * 
 * @param {Array} history - La pile d'historique.
 * @param {number} targetIndex - L'index cible.
 * @param {string} fileId - L'identifiant interne du fichier à reconstruire.
 * @returns {string} Le texte source reconstruit.
 */
export function rebuildTextAt(history, targetIndex, fileId = "main") {
  if (targetIndex < 0 || targetIndex >= history.length) return "";
  
  // 1. Trouver le snapshot (point d'ancrage) le plus proche en arrière POUR CE FICHIER
  let snapshotIdx = -1;
  for (let i = targetIndex; i >= 0; i--) {
    const item = history[i];
    const itemFileId = item.fileId || "main";
    if (item.type === "snapshot" && itemFileId === fileId) {
      snapshotIdx = i;
      break;
    }
  }
  
  if (snapshotIdx === -1) {
    return "";
  }
  
  // 2. Extraire le texte de départ
  let currentText = history[snapshotIdx].rawText;
  
  // 3. Rejouer séquentiellement de snapshotIdx + 1 à targetIndex POUR CE FICHIER
  for (let i = snapshotIdx + 1; i <= targetIndex; i++) {
    const op = history[i];
    const opFileId = op.fileId || "main";
    if (op.isIgnored) continue;
    if (op.type === "replace" && opFileId === fileId) {
      currentText = applyDeltaOnText(
        currentText,
        op.findStr,
        op.replaceStr,
        op.multiMode,
        op.multiIndices,
        op.ignoreSpaces
      );
    }
  }
  
  return currentText;
}

/**
 * Custom Hook React pour le State Management de l'historique et du Time-Travel.
 */
export function useHistoryStore() {
  // --- V9 STATE MANAGEMENT ---
  const [projects, setProjects] = useState([{
    id: 'default',
    projectName: "",
    history: [],
    selectedIndex: -1,
    files: [], // Array de { internalName: string, originalName: string, fileHandle: object }
    activeFileId: null
  }]);
  const [activeProjectId, setActiveProjectId] = useState('default');
  const [versionConfig, setVersionConfig] = useState(DEFAULT_VERSION_CONFIG);

  // --- PROXY PROPERTIES ---
  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];
  const { history, selectedIndex, projectName, activeFileId, files } = activeProject;

  const updateActiveProject = (updater) => {
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
         return typeof updater === 'function' ? { ...p, ...updater(p) } : { ...p, ...updater };
      }
      return p;
    }));
  };

  const setProjectName = (name) => updateActiveProject({ projectName: name });

  // Mémoïsation pour éviter de recalculer le texte complet à chaque re-rendu de l'application
  const currentText = useMemo(() => {
    return rebuildTextAt(history, selectedIndex, activeFileId || "main");
  }, [history, selectedIndex, activeFileId]);

  // Récupération de la version courante
  const currentVersion = useMemo(() => {
    if (selectedIndex === -1 || !history[selectedIndex]) return "V0.0.0";
    return history[selectedIndex].version;
  }, [history, selectedIndex]);

  /**
   * Initialise le store avec un projet et son historique existants (import).
   */
  const importProject = (name, historyArray) => {
    const upgradedHistory = historyArray.map(item => ({
      ...item,
      fileId: item.fileId || "main"
    }));
    
    updateActiveProject({
      projectName: name,
      history: upgradedHistory,
      selectedIndex: upgradedHistory.length - 1,
      activeFileId: "main",
      files: [{ internalName: "main", originalName: "main", fileHandle: null }]
    });
  };

  /**
   * Enregistre un Snapshot complet (Point d'ancrage) dans l'historique.
   */
  const pushSnapshot = (rawText, actionName = "IMPORT INITIAL", customVersion = null, customSource = null, comment = null) => {
    const timestamp = getFullTimestamp();
    const normalizedRawText = normalizeText(rawText);
    
    // Soit une version custom (au tout premier import), soit on tente d'incrémenter le rang Majeur
    let nextVer = customVersion || "V1.0.0";

    if (history.length > 0 && !customVersion) {
      const lastRec = history[history.length - 1];
      const currentRanks = parseVersionStringToRanks(lastRec.version, versionConfig.ranks);
      // Incrémenter par défaut le premier rang numérique qu'on trouve pour un nouveau snapshot (Majeur)
      let majorIndex = versionConfig.ranks.findIndex(r => r.type === 'numeric' || r.type === 'alpha');
      if (majorIndex === -1) majorIndex = 0;
      
      const nextRanks = incrementRank(currentRanks, majorIndex);
      nextVer = formatVersionString(nextRanks);
    }

    const record = {
      type: "snapshot",
      version: nextVer,
      action: actionName,
      timestamp,
      rawText: normalizedRawText,
      source: customSource || (customVersion ? (actionName.includes("Fichier") ? actionName : "Import") : "Système"),
      comment: comment,
      fileId: activeFileId || "main"
    };

    updateActiveProject(prev => {
      const newHistory = [...prev.history, record];
      return {
        history: newHistory,
        selectedIndex: newHistory.length - 1,
        activeFileId: prev.activeFileId || "main",
        files: prev.files.length === 0 ? [{ internalName: "main", originalName: "main", fileHandle: null }] : prev.files
      };
    });
    return record;
  };

  /**
   * Enregistre une Delta-Opération (Remplacement appliqué) dans l'historique.
   */
  const pushReplace = (findStr, replaceStr, multiMode, multiIndices, splitChars, label, ignoreSpaces = false, explicitVersion = null, comment = null, source = "requête") => {
    if (selectedIndex === -1) return null;

    const timestamp = getFullTimestamp();
    const lastRec = history[selectedIndex];
    
    // Déduction du nom d'action (Label)
    let actionName = label;
    if (!label || label === "spécifique" || label === "User Input") {
      actionName = `User Input ${history.filter(h => h.action && h.action.startsWith("User Input")).length + 1}`;
    } else if (label === "Manual Edit") {
      actionName = `Manual Edit ${history.filter(h => h.action && h.action.startsWith("Manual Edit")).length + 1}`;
    }

    // Calcul de la version incrémentale via le moteur dynamique ou utilisation de la version explicite
    let nextVer;
    if (explicitVersion) {
      nextVer = explicitVersion;
    } else {
      const currentRanks = parseVersionStringToRanks(lastRec.version, versionConfig.ranks);
      const nextRanks = incrementRank(currentRanks, versionConfig.autoIncrementIndex);
      nextVer = formatVersionString(nextRanks);
    }

    const record = {
      type: "replace",
      version: nextVer,
      action: actionName,
      label: label || null,
      timestamp,
      findStr,
      replaceStr,
      multiMode,
      multiIndices,
      splitChars,
      ignoreSpaces,
      comment,
      source: source,
      fileId: activeFileId || "main"
    };

    // Si on insère à un index intermédiaire (Time-Travel puis application d'une nouvelle branche),
    // on garde l'historique mais on marque les éléments "futurs" comme ignorés.
    updateActiveProject(prev => {
      const newHistory = [...prev.history];
      for (let i = prev.selectedIndex + 1; i < newHistory.length; i++) {
        newHistory[i] = { ...newHistory[i], isIgnored: true };
      }
      const cleanHistory = newHistory;
      
      // Sécurisation : Il faut recalculer dynamiquement la version et le label basés sur `cleanHistory` 
      // pour que ce soit synchronisé si plusieurs appels synchrones ont lieu !
      const dynamicLastRec = cleanHistory[prev.selectedIndex];
      const dynamicActionName = (!label || label === "spécifique" || label === "User Input") 
        ? `User Input ${cleanHistory.filter(h => h.action && h.action.startsWith("User Input")).length + 1}` 
        : (label === "Manual Edit" ? `Manual Edit ${cleanHistory.filter(h => h.action && h.action.startsWith("Manual Edit")).length + 1}` : label);
      
      let dynamicNextVer;
      if (explicitVersion) {
        dynamicNextVer = explicitVersion;
      } else {
        const currentRanks = parseVersionStringToRanks(dynamicLastRec.version, versionConfig.ranks);
        const nextRanks = incrementRank(currentRanks, versionConfig.autoIncrementIndex);
        dynamicNextVer = formatVersionString(nextRanks);
      }

      const finalRecord = {
        ...record,
        action: dynamicActionName,
        version: dynamicNextVer
      };

      const updatedHistory = [...cleanHistory, finalRecord];
      return {
        history: updatedHistory,
        selectedIndex: updatedHistory.length - 1
      };
    });
    
    return record;
  };

  /**
   * Enregistre un Item informatif dans l'historique (ex: Export, Sauvegarde).
   * Transparent : il est ignoré lors des opérations de retour en arrière ou de navigation dans l'historique.
   */
  const pushInfoRecord = (actionName, comment = null, source = "Système", meta = null) => {
    if (selectedIndex === -1) return null;

    const timestamp = getFullTimestamp();
    const lastRec = history[selectedIndex];
    
    // La version reste identique au dernier snapshot/replace actif
    const currentVer = lastRec.version;

    const record = {
      type: "info",
      version: currentVer,
      action: actionName,
      label: actionName,
      timestamp,
      comment,
      source,
      meta
    };

    updateActiveProject(prev => {
      const newHistory = [...prev.history, record];
      // On n'incrémente PAS le selectedIndex pour que le time-travel pointe toujours sur la vraie dernière modif !
      // Mais wait, si on n'incrémente pas selectedIndex, le record sera effacé au prochain pushReplace...
      // La consigne est "n'incrémente pas la version", et ignoré par la navigation.
      // Donc oui on doit incrémenter selectedIndex pour qu'il soit dans l'historique de base, mais on le gérera dans App.js ou SidebarRight pour le bloquer au clic.
      return {
        history: newHistory,
        selectedIndex: newHistory.length - 1
      };
    });
    
    return record;
  };

  /**
   * Crée une ramification / embranchement à partir de l'index sélectionné dans l'historique.
   * 
   * @param {number|string} targetRankIndex - L'index du rang à incrémenter (ou 'rename', ou -1 pour annuler)
   * @param {boolean} freezeArchive - Si vrai, on appose le label "+ Save"
   */
  const createNewBranch = (targetRankIndex, freezeArchive = false, oldProjectName = "", newProjectName = "", overrideConfigRanks = null, oldPatternPreview = "") => {
    if (selectedIndex === -1 || !history[selectedIndex]) return;

    if (targetRankIndex === -1) {
      // Pur retour en arrière (annulation complète du futur)
      updateActiveProject(prev => {
        const newHistory = [...prev.history];
        for (let i = prev.selectedIndex + 1; i < newHistory.length; i++) {
          newHistory[i] = { ...newHistory[i], isIgnored: true };
        }
        return {
          history: newHistory,
          selectedIndex: prev.selectedIndex
        };
      });
      return;
    }

    const currentTextCopy = currentText;
    const lastRec = history[selectedIndex];
    const timestamp = getFullTimestamp();
    const baseVersion = lastRec.version;

    // Calcul de la version dynamique
    const currentRanks = parseVersionStringToRanks(lastRec.version, versionConfig.ranks);
    let nextRanks;
    let actionLabel = "";
    let commentText = "";
    
    if (targetRankIndex === 'rename') {
      nextRanks = currentRanks; // Version inchangée au niveau des numéros
      if (overrideConfigRanks && nextRanks.length > 0 && nextRanks[0].type === 'fixed' && overrideConfigRanks.length > 0) {
        nextRanks[0].value = overrideConfigRanks[0].value;
      }
      actionLabel = freezeArchive ? "CHGNAME + Save" : "CHGNAME";
      commentText = `Changement du nom — ${oldProjectName} vers ${newProjectName}`;
    } else if (targetRankIndex === 'changePattern') {
      // oldPatternPreview is passed in `oldPatternPreview` argument for this call
      // overrideConfigRanks contains the NEW configuration objects (ranks and autoIncrementIndex) but here it's actually just `{ ranks: ..., autoIncrementIndex: ... }` from App.jsx or just `ranks`.
      // Let's refine how it is passed from App.jsx: we passed `properConfig` which is an object.
      nextRanks = JSON.parse(JSON.stringify(overrideConfigRanks.ranks));
      const newPatternPreview = formatVersionString(nextRanks);
      actionLabel = freezeArchive ? "MOTIF + Save" : "MOTIF";
      commentText = `Changement de motif — ${oldPatternPreview} vers ${newPatternPreview}`;
    } else if (targetRankIndex === '0') {
      // Remettre à zéro : V1.0.0 (premier rang num/alpha à 1, les suivants à 0)
      nextRanks = JSON.parse(JSON.stringify(currentRanks));
      let isFirstNumeric = true;
      for (let i = 0; i < nextRanks.length; i++) {
        if (nextRanks[i].type === 'numeric') {
          nextRanks[i].value = isFirstNumeric ? 1 : 0;
          isFirstNumeric = false;
        } else if (nextRanks[i].type === 'alpha') {
          const isUpper = String(nextRanks[i].value) === String(nextRanks[i].value).toUpperCase();
          nextRanks[i].value = isUpper ? 'A' : 'a';
          isFirstNumeric = false;
        }
      }
    } else if (targetRankIndex === 'M') {
      // Repartir de la branche parente
      nextRanks = incrementRank(currentRanks, versionConfig.autoIncrementIndex);
    } else {
      nextRanks = incrementRank(currentRanks, targetRankIndex);
    }
    
    const nextVer = formatVersionString(nextRanks);

    // Ajout linéaire du Snapshot de saut de version à la fin de l'historique
    updateActiveProject(prev => {
      const isAtTip = prev.selectedIndex === prev.history.length - 1;
      
      if (targetRankIndex !== 'rename' && targetRankIndex !== 'changePattern') {
        if (isAtTip) {
          actionLabel = freezeArchive ? "CHG VER + Save" : "CHG VER";
          commentText = `Changement de version (v${baseVersion} -> ${nextVer})`;
        } else {
          actionLabel = freezeArchive ? "BRANCHE + Save" : "Nouvelle Branche";
          commentText = `Nouvelle Branche à partir de v${baseVersion}`;
        }
      }

      const record = {
        type: "snapshot",
        version: nextVer,
        action: actionLabel,
        comment: commentText,
        timestamp,
        source: "user_cmd",
        rawText: currentTextCopy,
        isSaved: freezeArchive
      };
      
      const newHistory = [...prev.history];
      if (!isAtTip) {
        for (let i = prev.selectedIndex + 1; i < newHistory.length; i++) {
          newHistory[i] = { ...newHistory[i], isIgnored: true };
        }
      }
      newHistory.push(record);

      return {
        history: newHistory,
        selectedIndex: newHistory.length - 1
      };
    });
  };

  /**
   * Supprime strictement le dernier item de la pile.
   * Rétablit l'état tel qu'il était avant cette opération.
   */
  const popLastRecord = () => {
    updateActiveProject(prev => {
      if (prev.history.length === 0) return prev;
      const newHistory = prev.history.slice(0, prev.history.length - 1);
      return {
        history: newHistory,
        selectedIndex: newHistory.length - 1
      };
    });
  };

  /**
   * Compresse l'historique : purge tous les items avant targetIndex
   * et les remplace par un snapshot contenant le texte compilé à ce point.
   * 
   * @param {number} targetIndex - L'index à partir duquel conserver l'historique.
   */
  const compressHistory = (targetIndex) => {
    updateActiveProject(prev => {
      if (targetIndex <= 0 || targetIndex >= prev.history.length) return prev;
      
      // Reconstruire le texte juste avant l'index cible
      const textAtTarget = rebuildTextAt(prev.history, targetIndex - 1, prev.activeFileId || "main");
      
      // Créer un snapshot de remplacement
      const compressionSnapshot = {
        type: 'snapshot',
        version: prev.history[targetIndex].version || '1.0.0',
        action: `Compression de l'historique (Base: v${prev.history[targetIndex].version})`,
        timestamp: getFullTimestamp(),
        source: "user_cmd",
        rawText: textAtTarget,
        comment: `Historique compressé. ${targetIndex} entrées antérieures ont été fusionnées.`
      };
      
      // Nouveau tableau : snapshot + items à partir de targetIndex
      const newHistory = [compressionSnapshot, ...prev.history.slice(targetIndex)];
      
      return {
        history: newHistory,
        // L'ancien selectedIndex pointe maintenant sur un index décalé
        selectedIndex: Math.max(0, prev.selectedIndex - targetIndex + 1)
      };
    });
  };

  /**
   * Réinitialise le store à zéro.
   */
  const resetStore = () => {
    updateActiveProject({ projectName: "", history: [], selectedIndex: -1, files: [], activeFileId: null });
  };

  // Rétrocompatibilité pour les exports
  const setHistory = (newHist) => {
    updateActiveProject(prev => ({
      ...prev,
      history: typeof newHist === 'function' ? newHist(prev.history) : newHist
    }));
  };

  const setSelectedIndex = (index) => {
    updateActiveProject(prev => ({
      ...prev,
      selectedIndex: typeof index === 'function' ? index(prev.selectedIndex) : index
    }));
  };

  return {
    projectName,
    setProjectName,
    history,
    setHistory,
    selectedIndex,
    currentText,
    currentVersion,
    versionConfig,
    setVersionConfig,
    importProject,
    pushSnapshot,
    pushReplace,
    pushInfoRecord,
    createNewBranch,
    popLastRecord,
    compressHistory,
    setSelectedIndex: (idx) => {
      // Sécurité : on empêche la sélection des items informatifs
      if (history[idx] && history[idx].type === 'info') return;
      updateActiveProject(prev => ({ ...prev, selectedIndex: idx }));
    },
    resetStore,
    updateRecord: (index, actionName, comment) => {
      updateActiveProject(prev => {
        const newHistory = [...prev.history];
        if (newHistory[index]) {
          newHistory[index] = { ...newHistory[index], action: actionName, comment };
        }
        return { ...prev, history: newHistory };
      });
    },
    updateInfoRecord: (index, updates) => {
      updateActiveProject(prev => {
        const newHistory = [...prev.history];
        if (newHistory[index] && newHistory[index].type === 'info') {
          newHistory[index] = { ...newHistory[index], ...updates };
        }
        return { ...prev, history: newHistory };
      });
    }
  };
}
