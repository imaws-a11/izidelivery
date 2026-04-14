const fs = require('fs');
const filePath = 'c:/Users/swami/.gemini/antigravity/scratch/izidelivery/app-entregador-completo/src/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Change z-index of bottom nav from z-[100] to z-[200] to sit above z-[150] of the detailed view!
if (content.includes('z-[100] px-4 pb-6 pt-2 pointer-events-none')) {
    content = content.replace(
        'z-[100] px-4 pb-6 pt-2 pointer-events-none',
        'z-[200] px-4 pb-6 pt-2 pointer-events-none'
    );
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed z-index overlap!');
} else {
    console.log('z-index class not found.');
}
