/**
 * Utilitaires généraux et assistants de formatage pour Rogue Cherry.
 */

// REGEX et MAP de cache pour échapper le HTML de façon ultra-performante (fast path)
const _ESCAPE_HTML_RE = /[&<>]/g;
const _ESCAPE_HTML_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };

/**
 * Échappe proprement les caractères spéciaux HTML d'une chaîne.
 * Inclut un coupe-circuit ultra-rapide (fast path) s'il n'y a rien à échapper.
 * 
 * @param {string} unsafe - La chaîne à échapper.
 * @returns {string}
 */
export const escapeHtml = (unsafe) => {
  if (!unsafe) return "";
  if (!_ESCAPE_HTML_RE.test(unsafe)) return unsafe;
  _ESCAPE_HTML_RE.lastIndex = 0; // Reset regex state
  return unsafe.replace(_ESCAPE_HTML_RE, c => _ESCAPE_HTML_MAP[c]);
};

/**
 * Normalise les sauts de ligne pour éviter les asymétries entre systèmes (Windows CRLF vs Unix LF).
 * 
 * @param {string} text - Le texte à normaliser.
 * @returns {string}
 */
export const normalizeText = (text) => {
  if (!text) return "";
  return text.replace(/\r\n/g, '\n');
};

/**
 * Génère un timestamp complet de la date et de l'heure locale.
 * Exemple: "23/05/2026 18:54:12"
 * 
 * @returns {string}
 */
export const getFullTimestamp = () => {
  const d = new Date();
  return `${d.toLocaleDateString('fr-FR')} ${d.toLocaleTimeString('fr-FR')}`;
};

/**
 * Génère un timestamp de l'heure locale uniquement pour l'historique rapide.
 * Exemple: "18:54:12"
 * 
 * @returns {string}
 */
export const getTimeTimestamp = () => {
  const d = new Date();
  return d.toLocaleTimeString('fr-FR');
};

/**
 * Formate un texte brut en HTML sécurisé en y injectant les spans d'affichage des caractères invisibles.
 * 
 * @param {string} text - Le texte brut à formater.
 * @param {boolean} showInvisibles - Activer ou désactiver l'affichage des symboles invisibles.
 * @returns {string} Chaîne HTML formatée et échappée.
 */
export const renderInvisiblesHtml = (text, showInvisibles = true) => {
  let escaped = escapeHtml(text);
  if (!showInvisibles) return escaped;
  
  // Remplacement séquentiel
  escaped = escaped.replace(/\t/g, '<span class="hc-tab">\t</span>');
  escaped = escaped.replace(/ /g, '<span class="hc-space"> </span>');
  escaped = escaped.replace(/\n/g, '<span class="hc-nl"></span>\n');
  
  return escaped;
};
