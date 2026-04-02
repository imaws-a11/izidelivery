const fs = require('fs');
const path = require('path');

const filePath = 'c:/Users/swami/.gemini/antigravity/scratch/izidelivery/app-servicos-completo/src/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Vamos manter da linha 1207 em diante (mas limpando o começo da 1207)
// Na verdade, notei que a linha 1207 tem "};useRef, ...".
// O correto é começar do "import { useState, ..." que deve estar próximo.

// Vamos procurar o último bloco de imports legítimos e começar dele.
let startIdx = -1;
for (let i = 1200; i < 1300; i++) {
    if (lines[i] && lines[i].includes('import { useState')) {
        startIdx = i;
        break;
    }
}

if (startIdx === -1) {
    // Fallback: Vamos apenas remover até a linha antes do function App()
    startIdx = 1243; 
}

const cleanedLines = lines.slice(startIdx);
fs.writeFileSync(filePath, cleanedLines.join('\n'), 'utf8');
console.log(`Limpeza concluída. Removidas ${startIdx} linhas.`);
