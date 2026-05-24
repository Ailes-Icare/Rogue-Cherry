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
    if (parts.length === 0) return text; // Sécurité si que des espaces

    const escapedParts = parts.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(escapedParts.join('\\s+'), 'g');
    
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
            hybridText += replaceNonWs[i];
            if (i < origWsTokens.length) {
              hybridText += origWsTokens[i];
            }
          }
          smartReplaced = hybridText;
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
      return text.replaceAll(findStr, replaceStr);
    }
  } else {
    return text.replace(findStr, replaceStr);
  }
}

/**
 * Reconstitue le texte source à un index d'historique donné en rejouant séquentiellement les deltas.
 * 
 * @param {Array} history - La pile d'historique.
 * @param {number} targetIndex - L'index cible.
 * @returns {string} Le texte source reconstruit.
 */
export function rebuildTextAt(history, targetIndex) {
  if (targetIndex < 0 || targetIndex >= history.length) return "";
  
  // 1. Trouver le snapshot (point d'ancrage) le plus proche en arrière
  let snapshotIdx = -1;
  for (let i = targetIndex; i >= 0; i--) {
    if (history[i].type === "snapshot") {
      snapshotIdx = i;
      break;
    }
  }
  
  if (snapshotIdx === -1) {
    return "";
  }
  
  // 2. Extraire le texte de départ
  let currentText = history[snapshotIdx].rawText;
  
  // 3. Rejouer séquentiellement de snapshotIdx + 1 à targetIndex
  for (let i = snapshotIdx + 1; i <= targetIndex; i++) {
    const op = history[i];
    if (op.type === "replace") {
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
  const [projectName, setProjectName] = useState("");
  const [history, setHistory] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [versionConfig, setVersionConfig] = useState(DEFAULT_VERSION_CONFIG);

  // Mémoïsation pour éviter de recalculer le texte complet à chaque re-rendu de l'application
  const currentText = useMemo(() => {
    return rebuildTextAt(history, selectedIndex);
  }, [history, selectedIndex]);

  // Récupération de la version courante
  const currentVersion = useMemo(() => {
    if (selectedIndex === -1 || !history[selectedIndex]) return "V0.0.0";
    return history[selectedIndex].version;
  }, [history, selectedIndex]);

  /**
   * Initialise le store avec un projet et son historique existants (import).
   */
  const importProject = (name, historyArray) => {
    setProjectName(name);
    setHistory(historyArray);
    setSelectedIndex(historyArray.length - 1);
  };

  /**
   * Enregistre un Snapshot complet (Point d'ancrage) dans l'historique.
   */
  const pushSnapshot = (rawText, actionName = "IMPORT INITIAL", customVersion = null) => {
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
      rawText: normalizedRawText
    };

    const newHistory = [...history, record];
    setHistory(newHistory);
    setSelectedIndex(newHistory.length - 1);
    return record;
  };

  /**
   * Enregistre une Delta-Opération (Remplacement appliqué) dans l'historique.
   */
  const pushReplace = (findStr, replaceStr, multiMode, multiIndices, splitChars, label, ignoreSpaces = false) => {
    if (selectedIndex === -1) return null;

    const timestamp = getFullTimestamp();
    const lastRec = history[selectedIndex];
    
    // Déduction du nom d'action (Label)
    const actionName = label ? label : `Opération Z${history.filter(h => h.type === "replace").length + 1}`;

    // Calcul de la version incrémentale via le moteur dynamique
    const currentRanks = parseVersionStringToRanks(lastRec.version, versionConfig.ranks);
    const nextRanks = incrementRank(currentRanks, versionConfig.autoIncrementIndex);
    const nextVer = formatVersionString(nextRanks);

    const record = {
      type: "replace",
      version: nextVer,
      action: actionName,
      timestamp,
      findStr,
      replaceStr,
      multiMode,
      multiIndices,
      splitChars,
      ignoreSpaces
    };

    // Si on insère à un index intermédiaire (Time-Travel puis application d'une nouvelle branche),
    // on coupe l'historique à l'index sélectionné avant de pousser.
    const cleanHistory = history.slice(0, selectedIndex + 1);
    const newHistory = [...cleanHistory, record];
    
    setHistory(newHistory);
    setSelectedIndex(newHistory.length - 1);
    return record;
  };

  /**
   * Crée une ramification / embranchement à partir de l'index sélectionné dans l'historique.
   * 
   * @param {number} targetRankIndex - L'index du rang à incrémenter (ou -1 pour annuler le futur sans saut)
   */
  const createNewBranch = (targetRankIndex) => {
    if (selectedIndex === -1 || !history[selectedIndex]) return;

    if (targetRankIndex === -1) {
      // Pur retour en arrière (annulation complète du futur)
      const cleanHistory = history.slice(0, selectedIndex + 1);
      setHistory(cleanHistory);
      setSelectedIndex(cleanHistory.length - 1);
      return;
    }

    const currentTextCopy = currentText;
    const lastRec = history[selectedIndex];
    const timestamp = getFullTimestamp();

    // Calcul de la version dynamique
    const currentRanks = parseVersionStringToRanks(lastRec.version, versionConfig.ranks);
    const nextRanks = incrementRank(currentRanks, targetRankIndex);
    const nextVer = formatVersionString(nextRanks);

    const actionName = `SAUT DE VERSION (depuis ${lastRec.version})`;

    // Nettoyage de l'historique futur
    const newHistory = history.slice(0, selectedIndex + 1);
    
    // On force la création d'un nouveau Snapshot pour fixer le nouvel embranchement majeur !
    const record = {
      type: "snapshot",
      version: nextVer,
      action: actionName,
      timestamp,
      rawText: currentTextCopy
    };
    
    const updatedHistory = [...newHistory, record];
    setHistory(updatedHistory);
    setSelectedIndex(updatedHistory.length - 1);
  };

  /**
   * Réinitialise le store à zéro.
   */
  const resetStore = () => {
    setProjectName("");
    setHistory([]);
    setSelectedIndex(-1);
  };

  return {
    projectName,
    setProjectName,
    history,
    setHistory,
    selectedIndex,
    setSelectedIndex,
    currentText,
    currentVersion,
    versionConfig,
    setVersionConfig,
    importProject,
    pushSnapshot,
    pushReplace,
    editHistoryRecord: (index, actionName, comment) => {
      setHistory(prev => {
        const newHistory = [...prev];
        if (newHistory[index]) {
          newHistory[index] = { ...newHistory[index], action: actionName, comment };
        }
        return newHistory;
      });
    },
    createNewBranch,
    resetStore
  };
}
