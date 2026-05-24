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
    // On retire TOUTES les balises de séparation (regex /gi pour tous les cas)
    text = text.replace(/##\[MULTISTACK REQUEST\]##/gi, "").trim();
    // On sépare le texte à chaque fois qu'on rencontre soit un [REQMODIFIER], soit un START standard.
    // L'expression régulière (?=...) permet de séparer sans consommer le délimiteur.
    const parts = text.split(/(?=\[REQMODIFIER\]|##SYNTAX_COPIE##)/i);
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

  // Vérification de l'unicité stricte des balises structurelles
  const countStr = (str, search) => (str.match(new RegExp(escapeRegExp(search), 'g')) || []).length;
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
      syntaxUsed: syntax
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

    // 1. Extraction du LABEL (Nom de la requête)
    // Format attendu : [LABEL:Texte libre sans crochets]
    let label = null;
    const labelMatch = headerContent.match(/\[LABEL:([^\]]+)\]/i);
    if (labelMatch) {
      label = labelMatch[1].trim();
    }

    // 2. Extraction du mode MULTI (occurrences multiples)
    // Format attendu (Optionnel) : [MULTI:TRUE] ou [MULTI:FALSE] ou [MULTI:1,2,5]
    let isMulti = false;
    let indices = [];
    const multiMatch = headerContent.match(/\[MULTI:(TRUE|FALSE|\d+(?:,\d+)*)\]/i);
    
    if (multiMatch) {
      const mVal = multiMatch[1].toUpperCase();
      if (mVal === 'TRUE') {
        isMulti = true;
      } else if (mVal !== 'FALSE') {
        isMulti = true;
        // On convertit les index de l'IA (base 1 : 1ère occurrence) en index JS (base 0)
        indices = mVal.split(',').map(n => parseInt(n.trim(), 10) - 1).filter(n => !isNaN(n) && n >= 0);
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
    // Format attendu : ##Commentaire## suivi du texte jusqu'à la balise FIND
    let comment = null;
    const commentMatch = headerContent.match(/(?:##|@@)Commentaire(?:##|@@)?[ \t]*\n([\s\S]*)$/i);
    if (commentMatch) {
      // On retire les espaces superflus mais on garde les sauts de ligne internes du commentaire
      comment = commentMatch[1].trim();
    }

    return {
      isSyntax: true,
      isValid: true,
      syntaxUsed: syntax,
      findText,
      replaceText,
      multiMode: isMulti,
      multiIndices: indices,
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
