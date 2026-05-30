import { getSimilarity, getIntraMarks } from './src/utils/diffEngine.js';

function computeLiveDiffFixed(str1, str2) {
  const marksT1 = [];
  const marksT2 = [];

  const l1 = str1.split('\n');
  const l2 = str2.split('\n');
  
  const lines1 = l1.map(l => {
    let trim = l.trimStart();
    if (trim.endsWith('\r')) trim = trim.slice(0, -1);
    return { raw: l, trim, state: -1, link: -1 };
  });
  const lines2 = l2.map(l => {
    let trim = l.trimStart();
    if (trim.endsWith('\r')) trim = trim.slice(0, -1);
    return { raw: l, trim, state: -1, link: -1 };
  });

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
        ecart1[x - 1].state = 3;
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
        if (p1 < ecart1.length) {
          uiRows.push({ state: 1, raw1: ecart1[p1].raw, raw2: null }); p1++;
        } else if (p2 < ecart2.length) {
          uiRows.push({ state: 2, raw1: null, raw2: ecart2[p2].raw }); p2++;
        } else {
          p1++; p2++;
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

const oldText = "line 1\r\nline 2\r\nline 3\r\nline 4\r\nline 5";
const newText = "line 1\r\nline 2 CHANGED\r\nline 3\r\nline 4\r\nline 5";

const diff = computeLiveDiffFixed(oldText, newText);
console.log(JSON.stringify(diff, null, 2));
