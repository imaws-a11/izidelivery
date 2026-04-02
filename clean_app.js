const fs = require('fs');
const path = require('path');

const filePath = 'c:/Users/swami/.gemini/antigravity/scratch/izidelivery/app-servicos-completo/src/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const cleanedContent = content.split('\n').map(line => {
    // Se a linha for um comentário (//) e tiver sequências de lixo
    if (line.trim().startsWith('//') && (line.includes('Ã') || line.includes('Â') || line.includes('â') || line.includes('€'))) {
        return '      // [Comentario Limpo pelo Sistema]';
    }
    return line;
}).join('\n');

fs.writeFileSync(filePath, cleanedContent, 'utf8');
console.log('Limpeza concluída com sucesso.');
