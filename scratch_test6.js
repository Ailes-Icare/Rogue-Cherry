import { computeLiveDiff } from './src/utils/diffEngine.js';

const oldStr = "line 1\nline 2\nline 3\nline 4";
const newStr = "line 1\nline 2 CHANGED\nline 3\nline 4";

const { marksT1, marksT2 } = computeLiveDiff(oldStr, newStr);
console.log(marksT2);
