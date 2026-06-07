/**
 * Moteur de Versioning Dynamique (Tag Version)
 * Permet de parser, incrémenter et formater des chaînes de versions complexes.
 */

export const DEFAULT_VERSION_CONFIG = {
  ranks: [
    { type: "fixed", value: "V", separator: "" },
    { type: "numeric", value: 1, separator: "" },
    { type: "numeric", value: 0, separator: "." },
    { type: "numeric", value: 0, separator: "." }
  ],
  autoIncrementIndex: 3
};

/**
 * Reconstruit un tableau de rangs (avec leurs valeurs) à partir d'une chaîne de version.
 */
export const parseVersionStringToRanks = (versionStr, configRanks) => {
  const ranks = JSON.parse(JSON.stringify(configRanks));
  let str = versionStr;
  
  for (let i = 0; i < ranks.length; i++) {
    const r = ranks[i];
    
    // Consommer le séparateur s'il y en a un
    if (r.separator && str.startsWith(r.separator)) {
      str = str.substring(r.separator.length);
    }
    
    // Extraire la valeur selon le type
    if (r.type === 'fixed') {
      if (str.startsWith(r.value)) {
        str = str.substring(r.value.length);
      }
    } else if (r.type === 'numeric') {
      const match = str.match(/^\d+/);
      if (match) {
        r.value = parseInt(match[0], 10);
        str = str.substring(match[0].length);
      }
    } else if (r.type === 'alpha') {
      const match = str.match(/^[A-Za-z]+/);
      if (match) {
        r.value = match[0];
        str = str.substring(match[0].length);
      }
    }
  }
  
  return ranks;
};

/**
 * Formate un tableau de rangs en une chaîne de version finale.
 */
export const formatVersionString = (ranks) => {
  return ranks.map(r => r.separator + r.value).join('');
};

/**
 * Incrémente le rang ciblé et réinitialise tous les rangs inférieurs (à sa droite).
 */
export const incrementRank = (ranks, targetIndex) => {
  const newRanks = JSON.parse(JSON.stringify(ranks));
  
  for (let i = 0; i < newRanks.length; i++) {
    if (i === targetIndex) {
      if (newRanks[i].type === 'numeric') {
        newRanks[i].value = parseInt(newRanks[i].value, 10) + 1;
      } else if (newRanks[i].type === 'alpha') {
        // Incrémentation alphabétique simple (ex: A -> B, Z -> AA non géré pour l'instant, on boucle)
        let currentCode = String(newRanks[i].value).charCodeAt(0);
        if (currentCode >= 90) currentCode = 64; // Reset après Z (majuscules)
        if (currentCode >= 122) currentCode = 96; // Reset après z (minuscules)
        newRanks[i].value = String.fromCharCode(currentCode + 1);
      }
    } else if (i > targetIndex) {
      // Réinitialisation des rangs inférieurs
      if (newRanks[i].type === 'numeric') {
        newRanks[i].value = 0;
      } else if (newRanks[i].type === 'alpha') {
        const isUpper = newRanks[i].value === newRanks[i].value.toUpperCase();
        newRanks[i].value = isUpper ? 'A' : 'a';
      }
    }
  }
  
  return newRanks;
};
