import { normalizeText } from './src/utils/helpers.js';

export function computeGhostDelta(oldText, newText) {
  if (oldText === newText) return null;

  const oldLinesRaw = oldText.split('\n');
  const newLinesRaw = newText.split('\n');
  
  const l1 = normalizeText(oldText).split('\n');
  const l2 = normalizeText(newText).split('\n');
  
  const lines1 = l1.map(l => ({ trim: l.trimStart(), state: -1 }));
  const lines2 = l2.map(l => ({ trim: l.trimStart(), state: -1 }));

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
      lines1[i - 1].state = 0; // Unchanged
      lines2[j - 1].state = 0; // Unchanged
      i--; j--;
    } else if (lineDp[i - 1][j] > lineDp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  const diffBlocks = [];
  let cur1 = 0, cur2 = 0;
  while (cur1 < lines1.length || cur2 < lines2.length) {
    let next1 = cur1; while (next1 < lines1.length && lines1[next1].state !== 0) next1++;
    let next2 = cur2; while (next2 < lines2.length && lines2[next2].state !== 0) next2++;
    
    if (next1 > cur1 || next2 > cur2) {
      diffBlocks.push({
        start1: cur1, end1: next1 - 1,
        start2: cur2, end2: next2 - 1
      });
    }
    cur1 = next1 + 1; cur2 = next2 + 1;
  }

  if (diffBlocks.length === 0) return null;

  const GAP_THRESHOLD = 8;
  const CONTEXT_LINES = 2;
  const groups = [];
  
  let currentGroup = { ...diffBlocks[0] };
  for (let k = 1; k < diffBlocks.length; k++) {
    const gap = diffBlocks[k].start1 - currentGroup.end1;
    if (gap <= GAP_THRESHOLD) {
      currentGroup.end1 = diffBlocks[k].end1;
      currentGroup.end2 = diffBlocks[k].end2;
    } else {
      groups.push({ ...currentGroup });
      currentGroup = { ...diffBlocks[k] };
    }
  }
  groups.push(currentGroup);

  const deltas = [];
  for (const group of groups) {
    const ctxStartOld = Math.max(0, group.start1 - CONTEXT_LINES);
    const ctxEndOld = Math.min(oldLinesRaw.length - 1, group.end1 + CONTEXT_LINES);
    
    // We must map the ctxStartOld back to newLinesRaw
    // The difference between ctxStartOld and group.start1 is (group.start1 - ctxStartOld) lines of context.
    // Those same lines of context should be taken from newLinesRaw!
    const ctxStartNew = Math.max(0, group.start2 - (group.start1 - ctxStartOld));
    const ctxEndNew = Math.min(newLinesRaw.length - 1, group.end2 + (ctxEndOld - group.end1));
    
    let findStr = oldLinesRaw.slice(ctxStartOld, ctxEndOld + 1).join('\n');
    let replaceStr = newLinesRaw.slice(ctxStartNew, ctxEndNew + 1).join('\n');
    
    let expandStartOld = ctxStartOld;
    let expandEndOld = ctxEndOld;
    let expandStartNew = ctxStartNew;
    let expandEndNew = ctxEndNew;
    
    let firstOcc = oldText.indexOf(findStr);
    let lastOcc = oldText.lastIndexOf(findStr);
    
    while (firstOcc !== lastOcc && (expandStartOld > 0 || expandEndOld < oldLinesRaw.length - 1)) {
      if (expandStartOld > 0) { expandStartOld--; expandStartNew--; }
      else { expandEndOld++; expandEndNew++; }
      
      expandEndOld = Math.min(oldLinesRaw.length - 1, expandEndOld);
      expandEndNew = Math.min(newLinesRaw.length - 1, expandEndNew);
      
      findStr = oldLinesRaw.slice(expandStartOld, expandEndOld + 1).join('\n');
      replaceStr = newLinesRaw.slice(expandStartNew, expandEndNew + 1).join('\n');
      
      firstOcc = oldText.indexOf(findStr);
      lastOcc = oldText.lastIndexOf(findStr);
    }
    
    deltas.push({ findStr, replaceStr });
  }
  
  return deltas;
}

const oldText = "line 1\nline 2\nline 3\nline 4\nline 5\nline 6\nline 7\nline 8\nline 9\nline 10\nline 11\nline 12\nline 13\nline 14\nline 15";
const newText = "line 1\nline 2 CHANGED\nline 3\nline 4\nline 5\nline 6\nline 7\nline 8\nline 9\nline 10\nline 11\nline 12\nline 13\nNEW LINE ADDED\nline 14\nline 15";

const deltas = computeGhostDelta(oldText, newText);
console.log(JSON.stringify(deltas, null, 2));
