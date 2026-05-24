import { normalizeText } from './helpers.js';

/**
 * Calcule la similarité sémantique (indice de Jaccard sur les tokens) entre deux chaînes.
 * Utilisé pour apparier des lignes modifiées plutôt que de les afficher comme pures suppressions/insertions.
 * 
 * @param {string} str1 - Première chaîne.
 * @param {string} str2 - Deuxième chaîne.
 * @returns {number} Un coefficient entre 0 (aucune ressemblance) et 1 (identité parfaite).
 */
export function getSimilarity(str1, str2) {
  const t1 = str1.match(/[a-zA-Z0-9\-_]+/g) || [];
  const t2 = str2.match(/[a-zA-Z0-9\-_]+/g) || [];
  if (t1.length === 0 && t2.length === 0) return 1;
  if (t1.length === 0 || t2.length === 0) return 0;
  
  const s1 = new Set(t1);
  const s2 = new Set(t2);
  const intersection = new Set([...s1].filter(x => s2.has(x)));
  return intersection.size / Math.max(s1.size, s2.size);
}

/**
 * Compare deux blocs de texte et extrait les marques de coloration (Diffing DraftSurge).
 * Utilise un LCS au niveau des lignes, puis effectue un LCS de caractères/mots intra-ligne.
 * 
 * @param {string} str1 - Le texte initial (Avant / Recherche).
 * @param {string} str2 - Le texte final (Après / Remplacement).
 * @param {boolean} splitChars - Si vrai, découpe au caractère près. Sinon au token près.
 * @returns {Object} `{ marksT1: Array, marksT2: Array }` les index de marquage à appliquer.
 */
export function computeLiveDiff(str1, str2, splitChars = false) {
  const marksT1 = [];
  const marksT2 = [];

  if (!str1) {
    return { marksT1, marksT2: [{ start: 0, length: (str2 || "").length, type: 'hl-ins' }] };
  }
  if (!str2) {
    return { marksT1: [{ start: 0, length: str1.length, type: 'hl-del-txt' }], marksT2: [{ start: 0, length: 0, type: 'hl-del' }] };
  }

  // --- COUPE-CIRCUIT DE SÉCURITÉ ANTI-EXPLOSION D'ESPACE ---
  // Évite que la matrice DP (Dynamic Programming) du LCS ne fige le thread sur des blocs gigantesques.
  const DIFF_MAX_CHARS = 5000;
  if (str1.length > DIFF_MAX_CHARS || str2.length > DIFF_MAX_CHARS) {
    return {
      marksT1: [{ start: 0, length: str1.length, type: 'hl-line-mod' }],
      marksT2: [{ start: 0, length: str2.length, type: 'hl-ins' }]
    };
  }

  /**
   * Effectue un LCS local intra-ligne pour colorer finement les mots insérés/supprimés.
   */
  function getIntraMarks(s1, s2, offset1, offset2) {
    const mT1 = [];
    const mT2 = [];
    const regexPattern = splitChars ? "[a-zA-Z0-9]+|\\s+|." : "[a-zA-Z0-9\\-_]+|\\s+|.";
    const regex = new RegExp(regexPattern, "g");
    const tokens1 = s1.match(regex) || [];
    const tokens2 = s2.match(regex) || [];
    const m = tokens1.length;
    const n = tokens2.length;
    
    // Matrice d'alignement DP
    const dp = Array(m + 1).fill(null).map(() => new Int32Array(n + 1));
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (tokens1[i - 1] === tokens2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    let i = m, j = n;
    const ops = [];
    while (i > 0 && j > 0) {
      if (tokens1[i - 1] === tokens2[j - 1]) {
        ops.push({ type: 'eq', text: tokens1[i - 1] });
        i--; j--;
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        ops.push({ type: 'del', text: tokens1[i - 1] });
        i--;
      } else {
        ops.push({ type: 'ins', text: tokens2[j - 1] });
        j--;
      }
    }
    while (i > 0) { ops.push({ type: 'del', text: tokens1[i - 1] }); i--; }
    while (j > 0) { ops.push({ type: 'ins', text: tokens2[j - 1] }); j--; }
    ops.reverse();

    // Groupement des opérations en blocs continus (Hunks)
    const hunks = [];
    let currentHunk = [];
    for (let op of ops) {
      if (op.type === 'eq') {
        if (currentHunk.length > 0) { hunks.push(currentHunk); currentHunk = []; }
        hunks.push([op]);
      } else {
        currentHunk.push(op);
      }
    }
    if (currentHunk.length > 0) hunks.push(currentHunk);

    let ptr1 = offset1;
    let ptr2 = offset2;
    for (let hunk of hunks) {
      if (hunk[0].type === 'eq') {
        ptr1 += hunk[0].text.length;
        ptr2 += hunk[0].text.length;
      } else {
        let delText = "", insText = "";
        for (let op of hunk) {
          if (op.type === 'del') delText += op.text;
          if (op.type === 'ins') insText += op.text;
        }
        if (delText && insText) {
          mT1.push({ start: ptr1, length: delText.length, type: 'hl-word-mod' });
          mT2.push({ start: ptr2, length: insText.length, type: 'hl-word-mod' });
          ptr1 += delText.length; ptr2 += insText.length;
        } else if (delText) {
          mT1.push({ start: ptr1, length: delText.length, type: 'hl-del-txt' });
          mT2.push({ start: ptr2, length: 0, type: 'hl-del' });
          ptr1 += delText.length;
        } else if (insText) {
          mT2.push({ start: ptr2, length: insText.length, type: 'hl-ins' });
          ptr2 += insText.length;
        }
      }
    }
    return { mT1, mT2 };
  }

  // --- ALIGNEMENT DES LIGNES (LCS PREMIÈRE PASSE) ---
  const l1 = normalizeText(str1).split('\n');
  const l2 = normalizeText(str2).split('\n');
  
  const lines1 = l1.map(l => ({ raw: l, trim: l.trimStart(), state: -1, link: -1 }));
  const lines2 = l2.map(l => ({ raw: l, trim: l.trimStart(), state: -1, link: -1 }));

  const lineDp = Array(lines1.length + 1).fill(0).map(() => Array(lines2.length + 1).fill(0));
  for (let i = 1; i <= lines1.length; i++) {
    for (let j = 1; j <= lines2.length; j++) {
      if (lines1[i - 1].trim === lines2[j - 1].trim) {
        lineDp[i][j] = lineDp[i - 1][j - 1] + 1;
      } else {
        lineDp[i][j] = Math.max(lineDp[i - 1][j], lineDp[i][j - 1]);
      }
    }
  }

  let i = lines1.length, j = lines2.length;
  while (i > 0 && j > 0) {
    if (lines1[i - 1].trim === lines2[j - 1].trim) {
      lines1[i - 1].state = 0; // Égalité
      lines2[j - 1].state = 0;
      lines1[i - 1].link = j - 1;
      lines2[j - 1].link = i - 1;
      i--; j--;
    } else if (lineDp[i - 1][j] > lineDp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  // --- AUDIT DES ÉCARTS ET PROXIMITÉ (DEUXIÈME PASSE DRAFTSURGE) ---
  const uiRows = [];
  const evaluerEcart = (start1, end1, start2, end2) => {
    const ecart1 = lines1.slice(start1, end1);
    const ecart2 = lines2.slice(start2, end2);
    const eDp = Array(ecart1.length + 1).fill(0).map(() => Array(ecart2.length + 1).fill(0));

    for (let x = 1; x <= ecart1.length; x++) {
      for (let y = 1; y <= ecart2.length; y++) {
        const sim = getSimilarity(ecart1[x - 1].trim, ecart2[y - 1].trim);
        if (sim >= 0.25) {
          eDp[x][y] = eDp[x - 1][y - 1] + sim;
        } else {
          eDp[x][y] = Math.max(eDp[x - 1][y], eDp[x][y - 1]);
        }
      }
    }

    let x = ecart1.length, y = ecart2.length;
    while (x > 0 && y > 0) {
      const sim = getSimilarity(ecart1[x - 1].trim, ecart2[y - 1].trim);
      if (sim >= 0.25 && Math.abs(eDp[x][y] - (eDp[x - 1][y - 1] + sim)) < 0.0001) {
        ecart1[x - 1].state = 3; // Ligne modifiée (similarité sémantique)
        ecart2[y - 1].state = 3;
        ecart1[x - 1].link = y - 1;
        ecart2[y - 1].link = x - 1;
        x--; y--;
      } else if (eDp[x - 1][y] >= eDp[x][y - 1]) {
        x--;
      } else {
        y--;
      }
    }

    let p1 = 0, p2 = 0;
    while (p1 < ecart1.length || p2 < ecart2.length) {
      if (p1 < ecart1.length && ecart1[p1].state === 3 && p2 < ecart2.length && ecart2[p2].state === 3 && ecart1[p1].link === p2) {
        uiRows.push({ state: 3, raw1: ecart1[p1].raw, raw2: ecart2[p2].raw }); p1++; p2++;
      } else if (p1 < ecart1.length && ecart1[p1].state !== 3) {
        uiRows.push({ state: 1, raw1: ecart1[p1].raw, raw2: null }); p1++;
      } else if (p2 < ecart2.length && ecart2[p2].state !== 3) {
        uiRows.push({ state: 2, raw1: null, raw2: ecart2[p2].raw }); p2++;
      } else {
        // SAFE FALLBACK : Empêche la boucle infinie si deux lignes sont 'state=3' 
        // mais qu'elles ne sont pas linkées l'une à l'autre à ce moment précis.
        if (p1 < ecart1.length) {
          uiRows.push({ state: 1, raw1: ecart1[p1].raw, raw2: null }); p1++;
        } else if (p2 < ecart2.length) {
          uiRows.push({ state: 2, raw1: null, raw2: ecart2[p2].raw }); p2++;
        } else {
          p1++; p2++; // Securité absolue
        }
      }
    }
  };

  let cur1 = 0, cur2 = 0;
  while (cur1 < lines1.length || cur2 < lines2.length) {
    let next1 = cur1; while (next1 < lines1.length && lines1[next1].state !== 0) next1++;
    let next2 = cur2; while (next2 < lines2.length && lines2[next2].state !== 0) next2++;
    evaluerEcart(cur1, next1, cur2, next2);
    if (next1 < lines1.length && next2 < lines2.length) {
      uiRows.push({ state: 0, raw1: lines1[next1].raw, raw2: lines2[next2].raw });
    }
    cur1 = next1 + 1; cur2 = next2 + 1;
  }

  // Marquage d'arrière-plan intelligent pour délimiter les changements dans le document
  let firstChange = uiRows.findIndex(r => r.state !== 0);
  let lastChange = uiRows.findLastIndex(r => r.state !== 0);
  if (firstChange === -1) { firstChange = uiRows.length; lastChange = -1; }
  uiRows.forEach((r, idx) => { if (idx < firstChange || idx > lastChange) r.trimBg = true; });

  let c1 = 0, c2 = 0;
  uiRows.forEach((row, rowIndex) => {
    const isLast = rowIndex === uiRows.length - 1;
    const nl1 = isLast && !str1.endsWith('\n') ? 0 : 1;
    const nl2 = isLast && !str2.endsWith('\n') ? 0 : 1;

    if (row.state === 0) { 
      if (!row.trimBg) {
        marksT1.push({ start: c1, length: row.raw1.length, type: 'hl-line-mod' });
        marksT2.push({ start: c2, length: row.raw2.length, type: 'hl-line-mod' });
      }
      c1 += row.raw1.length + nl1; c2 += row.raw2.length + nl2;
    } 
    else if (row.state === 1) { 
      marksT1.push({ start: c1, length: row.raw1.length, type: 'hl-del-txt' });
      marksT2.push({ start: c2, length: 0, type: 'hl-del' });
      c1 += row.raw1.length + nl1;
    } 
    else if (row.state === 2) { 
      marksT2.push({ start: c2, length: row.raw2.length, type: 'hl-ins' });
      c2 += row.raw2.length + nl2;
    } 
    else if (row.state === 3) { 
      const intra = getIntraMarks(row.raw1, row.raw2, c1, c2);
      marksT1.push({ start: c1, length: row.raw1.length, type: 'hl-line-mod' });
      marksT2.push({ start: c2, length: row.raw2.length, type: 'hl-line-mod' });
      marksT1.push(...intra.mT1); 
      marksT2.push(...intra.mT2);
      c1 += row.raw1.length + nl1; c2 += row.raw2.length + nl2;
    }
  });

  return { marksT1, marksT2 };
}

/**
 * Recherche dichotomique nuancée par Heatmap pour localiser un extrait imparfait (Tir 4 Debugger).
 * Calcule la plus longue chaîne de recherche présente dans le texte cible pour positionner
 * une heatmap dégradée.
 * 
 * @param {string} sourceText - Le texte global (Texte 3) dans lequel chercher.
 * @param {string} searchStr - La chaîne de recherche saisie par l'utilisateur.
 * @returns {Object} `{ foundRatio: number, marks: Array }`
 */
export function computeSearchHeatmap(sourceText, searchStr) {
  if (!sourceText || !searchStr) return { foundRatio: 0, marks: [] };

  const marks = [];
  const L = searchStr.length;
  let low = 1, high = L;
  let bestSub = "";

  // Recherche dichotomique pour identifier la plus grande sous-chaîne commune présente dans le code source
  while (low <= high) {
    const mid = (low + high) >> 1;
    let found = false;
    for (let i = 0; i <= L - mid; i++) {
      const sub = searchStr.substring(i, i + mid);
      if (sourceText.indexOf(sub) !== -1) {
        found = true;
        bestSub = sub;
        break;
      }
    }
    if (found) low = mid + 1;
    else high = mid - 1;
  }

  let foundRatio = 0;
  if (bestSub.length > 0) {
    foundRatio = bestSub.length / L;
    let cssClass = 'hl-find-10'; // <50% de ressemblance (Rouge)
    if (foundRatio === 1.0) cssClass = 'hl-yellow'; // 100% de ressemblance (Jaune Vif)
    else if (foundRatio >= 0.8) cssClass = 'hl-find-80'; // >=80% (Jaune Or)
    else if (foundRatio >= 0.5) cssClass = 'hl-find-50'; // >=50% (Orange)

    let idx = sourceText.indexOf(bestSub);
    while (idx !== -1) {
      marks.push({
        start: idx,
        length: bestSub.length,
        type: cssClass,
        scroll: false,
        occIndex: marks.length
      });
      idx = sourceText.indexOf(bestSub, idx + bestSub.length);
    }
  }

  return { foundRatio, marks };
}
