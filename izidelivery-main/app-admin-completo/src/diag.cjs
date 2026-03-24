const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');
const lines = content.split('\n');
console.log('Total Lines:', lines.length);
console.log('First 10 lines:', lines.slice(0, 10).join('\n'));
console.log('Last 10 lines:', lines.slice(-10).join('\n'));
