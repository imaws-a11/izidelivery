const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

let lines = c.split(/\r?\n/);

console.log("Lines 1980-1995");
lines.slice(1980, 1995).forEach((l,i) => console.log(1980+i, l));

