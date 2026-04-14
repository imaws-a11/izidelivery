const fs = require('fs');
const path = 'c:/Users/swami/.gemini/antigravity/scratch/izidelivery/app-entregador-completo/src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Mudar o container de botões para ficar ACIMA da barra de navegação
// Vamos usar bottom-[108px] (cerca de 27rem/4) para ficar logo acima da barra
content = content.replace(
    'className="fixed bottom-0 left-0 w-full flex flex-col items-center z-[120]"',
    'className="fixed bottom-[100px] left-0 w-full flex flex-col items-center z-[90]"'
);

// 2. Remover o fundo preto pesado e o backdrop filter para não bloquear a visão da barra
// E adicionar um gradiente suave apenas para destacar os botões
content = content.replace(
    "style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.05)' }}",
    "style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)', pointerEvents: 'none' }}"
);

// 3. Garantir que os botões dentro do container voltem a ter pointer-events
content = content.replace(
    'className="w-full pt-5 pb-8 px-6"',
    'className="w-full pt-5 pb-2 px-6 pointer-events-auto"'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Layout ajustado: Botões agora flutuam acima da navegação!');
