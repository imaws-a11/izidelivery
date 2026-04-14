const fs = require('fs');
const path = 'c:/Users/swami/.gemini/antigravity/scratch/izidelivery/app-entregador-completo/src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Corrigir Z-Index do botão de vaga dedicada (de z-50 para z-[120])
content = content.replace(
    'className="fixed bottom-0 left-0 w-full flex flex-col items-center z-50"',
    'className="fixed bottom-0 left-0 w-full flex flex-col items-center z-[120]"'
);

// 2. Limpeza profunda final de acentos em todo o arquivo (casos específicos detectados nos modais)
const finalMap = [
    [/LÃƒÆ’í/g, 'Lí'],
    [/aprovaÃƒÆ’çÃƒÆ’ão/g, 'aprovação'],
    [/solicitaÃƒÆ’çÃƒÆ’ão/g, 'solicitação'],
    [/sÃƒÆ’ão/g, 'são'],
    [/atÃƒÆ’é/g, 'até'],
    [/jÃƒÆ’á/g, 'já'],
    [/VocÃê/g, 'Você'],
    [/LÃƒÆ’íquido/g, 'Líquido'],
    [/ExperiÃªncia/g, 'Experiência'],
    [/VocÃª/g, 'Você'],
    [/Ã s/g, 'às'],
    [/análise/g, 'análise'],
    [/Análise/g, 'Análise']
];

finalMap.forEach(([regex, rep]) => {
    content = content.replace(regex, rep);
});

// 3. Garantir que o padding inferior do conteúdo da vaga dedicada permita ver tudo antes do botão
content = content.replace(
    'className="px-5 space-y-6 pb-24 pt-4"',
    'className="px-5 space-y-6 pb-40 pt-4"'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Correções de layout e acentuação técnica concluídas!');
