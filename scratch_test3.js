import { computeLiveDiff } from './src/utils/diffEngine.js';

const oldText = `line 1
line 2
line 3
line 4
line 5`;

const newText = `line 1
line 2 CHANGED
line 3
line 4 CHANGED
line 5`;

const diff = computeLiveDiff(oldText, newText);
console.log(JSON.stringify(diff, null, 2));
