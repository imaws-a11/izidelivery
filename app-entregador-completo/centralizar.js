import fs from 'fs';

const file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf-8');

// 1. Novos Pedidos
content = content.replace(
    '<div className="flex justify-between items-end">\n                        <div className="flex items-center gap-3">\n                            <h3 className="text-2xl font-bold text-white tracking-tight">Novos Pedidos</h3>',
    '<div className="flex flex-col items-center justify-center gap-4 text-center">\n                        <div className="flex items-center justify-center gap-3">\n                            <h3 className="text-2xl font-black text-white tracking-tighter uppercase drop-shadow-sm">Novos Pedidos</h3>'
);

// 2. Vagas Dedicadas
content = content.replace(
    '<div className="flex justify-between items-end">\n                        <h3 className="text-2xl font-bold text-white tracking-tight">Vagas Dedicadas</h3>',
    '<div className="flex flex-col items-center justify-center gap-4 text-center">\n                        <h3 className="text-2xl font-black text-white tracking-tighter uppercase drop-shadow-sm">Vagas Dedicadas</h3>'
);

// 3. Agendamentos
content = content.replace(
    '<div className="flex justify-between items-center px-1">\n                            <h3 className="text-2xl font-bold text-white tracking-tight">Agendamentos</h3>',
    '<div className="flex flex-col items-center justify-center gap-4 text-center px-1">\n                            <h3 className="text-2xl font-black text-white tracking-tighter uppercase drop-shadow-sm">Agendamentos</h3>'
);

// Título "Missões e Vagas"
content = content.replace(
    '<h2 className="text-4xl font-black text-white tracking-tighter drop-shadow-lg leading-none">Missões e <span className="text-yellow-400">Vagas</span></h2>',
    '<h2 className="text-4xl font-black text-white tracking-tighter drop-shadow-lg leading-none text-center uppercase w-full">Missões e <span className="text-yellow-400">Vagas</span></h2>'
);
content = content.replace(
    '<p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2 opacity-80">Disponível para entregas</p>',
    '<p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2 opacity-80 text-center w-full">Disponível para entregas</p>'
);

fs.writeFileSync(file, content, 'utf-8');
console.log('Subtitles centralized.');
