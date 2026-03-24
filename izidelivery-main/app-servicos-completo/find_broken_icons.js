
import fs from 'fs';

const content = fs.readFileSync('src/App.tsx', 'utf8');
const regex = /name="\{([^}]+)\}"/g;
let match;
while ((match = regex.exec(content)) !== null) {
    console.log(`Found: ${match[0]} at index ${match.index} (around line ${content.substring(0, match.index).split('\n').length})`);
}
