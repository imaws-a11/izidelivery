const fs = require('fs');
const path = 'c:/Users/swami/.gemini/antigravity/scratch/izidelivery/app-entregador-completo/src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Corrigir o mapeamento do ícone de voltar (arrow_back -> ChevronLeft)
content = content.replace(
    "'visibility': BespokeIcons.History,",
    "'visibility': BespokeIcons.History,\n    'arrow_back': BespokeIcons.ChevronLeft,"
);

// 2. Adicionar o WhatsApp também na barra dinâmica por questão de usabilidade (opcional, mas bom ter tudo lá)
// No momento vamos manter o WhatsApp dentro do card, mas garantir que o padding do card seja suficiente.
content = content.replace(
    'className="fixed inset-0 z-[150] bg-black overflow-y-auto no-scrollbar pb-32"',
    'className="fixed inset-0 z-[150] bg-stone-950 overflow-y-auto no-scrollbar pb-40"'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Acessibilidade de ícones e ajuste de scroll concluídos!');
