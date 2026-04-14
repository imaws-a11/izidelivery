const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

let lines = c.split(/\r?\n/);

console.log("Lines 1980-1995");
lines.slice(1980, 1995).forEach((l,i) => console.log(1980+i, l));

console.log("\n\nLines 2060-2070");
lines.slice(2060, 2070).forEach((l,i) => console.log(2060+i, l));
