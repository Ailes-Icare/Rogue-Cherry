import { normalizeText } from './helpers.js';

// Configuration par défaut des balises syntaxiques
export const DEFAULT_SYNTAX = {
  START: "##SYNTAX_COPIE##",
  FIND: "##FIND##",
  REPLACE: "##REPLACE##",
  END: "##END_COPIE##"
};

/**
 * Échappe les caractères spéciaux d'une chaîne pour l'insérer dans une RegExp.
 * 
 * @param {string} string - La chaîne à échapper.
 * @returns {string}
 */
const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Découpe une chaîne contenant potentiellement plusieurs requêtes (Multistack)
 * en un tableau de chaînes, chacune représentant une requête individuelle.
 * 
 * @param {string} rawInput - Le texte brut collé.
 * @returns {string[]} Un tableau contenant les requêtes séparées.
 */
export function splitMultistackRequest(rawInput) {
  if (!rawInput) return [];
  let text = normalizeText(rawInput);
  
  // Si la balise Multistack est détectée
  if (text.includes("##[MULTISTACK REQUEST]##")) {
    const parts = text.split(/##\[MULTISTACK REQUEST\]##/gi);
    return parts.map(p => p.trim()).filter(p => p.length > 0);
  }
  
  return [rawInput];
}

/**
 * Analyse une requête IA brute et en extrait les métadonnées et segments de code.
 * Gère dynamiquement les configurations personnalisées de balises et le mode furtif [REQMODIFIER].
 * 
 * @param {string} rawInput - Le texte brut de la requête à analyser.
 * @param {Object} [customSyntax] - Configuration de balises optionnelle.
 * @returns {Object} Un objet contenant le résultat de l'analyse syntaxique.
 */
export function parseSyntaxRequest(rawInput, customSyntax = DEFAULT_SYNTAX) {
  if (!rawInput) return { isSyntax: false };
  
  let text = normalizeText(rawInput);
  let syntax = { ...customSyntax };

  // --- LOGIQUE SMART [REQMODIFIER] (MODE FURTIF) ---
  const lines = text.split('\n');
  if (lines.length >= 5 && lines[0].trim() === "[REQMODIFIER]") {
    syntax = {
      START: lines[1].trim() || customSyntax.START,
      FIND: lines[2].trim() || customSyntax.FIND,
      REPLACE: lines[3].trim() || customSyntax.REPLACE,
      END: lines[4].trim() || customSyntax.END
    };
    // On retire les 5 lignes d'en-tête du mode furtif pour l'analyse
    text = lines.slice(5).join('\n');
  }

  // Si le texte ne contient même pas la balise de début, ce n'est pas une requête syntaxique
  if (!text.includes(syntax.START)) {
    return { isSyntax: false, syntaxUsed: syntax };
  }

  const sStart = escapeRegExp(syntax.START);
  const sFind = escapeRegExp(syntax.FIND);
  const sReplace = escapeRegExp(syntax.REPLACE);
  const sEnd = escapeRegExp(syntax.END);

  const countStr = (str, search) => (str.match(new RegExp(escapeRegExp(search), 'g')) || []).length;
  
  // 1. Extraction du LABEL (Nom de la requête) MÊME SI INVALIDE
  let extractedLabel = null;
  const labelMatch = text.match(/\[LABEL:([^\]]+)\]/i);
  if (labelMatch) {
    extractedLabel = labelMatch[1].trim();
  }

  if (
    countStr(text, syntax.START) !== 1 || 
    countStr(text, syntax.FIND) !== 1 || 
    countStr(text, syntax.REPLACE) !== 1 || 
    countStr(text, syntax.END) !== 1
  ) {
    return { 
      isSyntax: true, 
      isValid: false, 
      error: "La structure de la requête est invalide. Assurez-vous qu'il n'y ait qu'une seule occurrence exacte des balises.",
      syntaxUsed: syntax,
      rawText: rawInput,
      label: extractedLabel // On passe quand même le label !
    };
  }

  // REGEX pour capturer l'en-tête, le bloc de recherche (FIND) et le bloc de remplacement (REPLACE)
  // Regex d'extraction : tolérance maximale entre le START et le FIND, avec tolérance des espaces/tabs parasites en fin de ligne
  const regexStr = `^[\\s\\S]*?${sStart}([\\s\\S]*?)[ \\t]*${sFind}[ \\t]*\\n([\\s\\S]*?)\\n[ \\t]*${sReplace}[ \\t]*\\n([\\s\\S]*?)\\n[ \\t]*${sEnd}[\\s\\S]*$`;
  const match = text.match(new RegExp(regexStr));

  if (match) {
    const headerContent = match[1] || "";
    const findText = match[2];
    const replaceText = match[3];

    // Le label a déjà été extrait en amont
    let label = extractedLabel;

    // 2. Extraction du mode MULTI (occurrences multiples)
    // Format attendu (Optionnel) : [MULTI:TRUE] ou [MULTI:FALSE] ou [MULTI:0,2,5] ou [MULTI:NO 1,2,5]
    // Les indices sont en BASE-0 (0 = 1ère occurrence, 1 = 2ème, etc.)
    let isMulti = false;
    let indices = [];
    let isMultiExclude = false;
    const multiMatch = headerContent.match(/\[MULTI:(TRUE|FALSE|NO\s+[\d\s,.-]+|[\d\s,.-]+)\]/i);
    
    if (multiMatch) {
      const mVal = multiMatch[1].toUpperCase();
      if (mVal === 'TRUE') {
        isMulti = true;
      } else if (mVal !== 'FALSE') {
        isMulti = true;
        if (mVal.startsWith('NO')) {
          isMultiExclude = true;
          indices = mVal.replace('NO', '').replace(/[.-]/g, ',').split(',').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n) && n >= 0);
        } else {
          indices = mVal.replace(/[.-]/g, ',').split(',').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n) && n >= 0);
        }
      }
    }

    // 3. Extraction du mode SMART (Conciliation des espaces)
    // Format attendu (Optionnel) : [SMART:TRUE] ou [SMART:FALSE]
    let isSmart = false;
    const smartMatch = headerContent.match(/\[SMART:(TRUE|FALSE)\]/i);
    if (smartMatch && smartMatch[1].toUpperCase() === 'TRUE') {
      isSmart = true;
    }

    // 4. Extraction du COMMENTAIRE optionnel
    // Format attendu : ##Commentaire## Texte (sur la même ligne ou la ligne suivante)
    let comment = null;
    const commentMatch = headerContent.match(/(?:##|@@)Commentaire(?:##|@@)?[ \t]*([\s\S]*)$/i);
    if (commentMatch) {
      // On retire les espaces superflus mais on garde les sauts de ligne internes du commentaire
      const extracted = commentMatch[1].trim();
      if (extracted.length > 0) {
        comment = extracted;
      }
    }

    return {
      isSyntax: true,
      isValid: true,
      syntaxUsed: syntax,
      findText,
      replaceText,
      multiMode: isMulti,
      multiIndices: indices,
      multiExclude: isMultiExclude,
      smartMode: isSmart,
      label: label,
      comment: comment,
      rawText: rawInput
    };
  }

  return { 
    isSyntax: true, 
    isValid: false, 
    error: "Le format de la requête a été détecté, mais la structure interne ou les sauts de ligne sont incorrects.",
    syntaxUsed: syntax,
    rawText: rawInput
  };
}
