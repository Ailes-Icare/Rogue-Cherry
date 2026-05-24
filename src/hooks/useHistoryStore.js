import { useState, useMemo } from 'react';
import { getFullTimestamp, normalizeText } from '../utils/helpers.js';

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
export function applyDeltaOnText(text, findStr, replaceStr, multiMode, multiIndices) {
  if (!text) return "";
  if (!findStr) return text;
  
  if (multiMode) {
    if (multiIndices && multiIndices.length > 0) {
      // Cherry-picking ciblé par indices d'occurrences
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
      // Remplacement global classique (toutes les occurrences)
      return text.replaceAll(findStr, replaceStr);
    }
  } else {
    // Remplacement unitaire (première occurrence)
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
        op.multiIndices
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
    let nextVer = "V1.0.0";

    if (history.length > 0) {
      const lastRec = history[history.length - 1];
      const match = lastRec.version.match(/V(\d+)\.(\d+)\.(\d+)/);
      if (match) {
        const x = parseInt(match[1], 10);
        const y = parseInt(match[2], 10);
        // Si version custom n'est pas passée, on incrémente le Majeur par défaut pour un snapshot manuel
        nextVer = customVersion || `V${x + 1}.0.0`;
      }
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
  const pushReplace = (findStr, replaceStr, multiMode, multiIndices, splitChars, label) => {
    if (selectedIndex === -1) return null;

    const timestamp = getFullTimestamp();
    const lastRec = history[selectedIndex];
    
    // Déduction du nom d'action (Label)
    const actionName = label ? label : `Opération Z${history.filter(h => h.type === "replace").length + 1}`;

    // Calcul de la version incrémentale V X.Y.Z (Z+1)
    let nextVer = "V1.0.1";
    const match = lastRec.version.match(/V(\d+)\.(\d+)\.(\d+)/);
    if (match) {
      const x = parseInt(match[1], 10);
      const y = parseInt(match[2], 10);
      const z = parseInt(match[3], 10);
      nextVer = `V${x}.${y}.${z + 1}`;
    }

    const record = {
      type: "replace",
      version: nextVer,
      action: actionName,
      timestamp,
      findStr,
      replaceStr,
      multiMode,
      multiIndices,
      splitChars
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
   * @param {string} branchType - "M" (Majeur), "m" (Mineur) ou "0" (Retour arrière)
   */
  const createNewBranch = (branchType) => {
    if (selectedIndex === -1 || !history[selectedIndex]) return;

    const currentTextCopy = currentText;
    const lastRec = history[selectedIndex];
    const match = lastRec.version.match(/V(\d+)\.(\d+)\.(\d+)/);
    if (!match) return;

    const x = parseInt(match[1], 10);
    const y = parseInt(match[2], 10);
    const timestamp = getFullTimestamp();

    let nextVer = "";
    let actionName = "";

    if (branchType === "M") {
      // Majeur : VX+1.0.0
      nextVer = `V${x + 1}.0.0`;
      actionName = `BRANCHE MAJEURE (depuis ${lastRec.version})`;
      
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
    } 
    else if (branchType === "m") {
      // Mineur : VX.Y+1.0
      nextVer = `V${x}.${y + 1}.0`;
      actionName = `BRANCHE MINEURE (depuis ${lastRec.version})`;
      
      const newHistory = history.slice(0, selectedIndex + 1);
      
      // On force également un snapshot pour fixer la branche mineure
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
    } 
    else if (branchType === "0") {
      // Pur retour en arrière (annulation complète du futur)
      const cleanHistory = history.slice(0, selectedIndex + 1);
      setHistory(cleanHistory);
      setSelectedIndex(cleanHistory.length - 1);
    }
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
    selectedIndex,
    setSelectedIndex,
    currentText,
    currentVersion,
    importProject,
    pushSnapshot,
    pushReplace,
    createNewBranch,
    resetStore
  };
}
