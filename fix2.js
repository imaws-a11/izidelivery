const fs = require('fs');
const file = 'c:/Users/swami/.gemini/antigravity/scratch/izidelivery_git/izidelivery/app-entregador-completo/src/App.tsx';
let code = fs.readFileSync(file, 'utf8');

const regex = /const slot = select\s*\{\[\.\.\.dedicatedSlots\]/g;
const replacement = `const slot = selectedSlot;
        
        if (!slot) {
            return (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="px-5 space-y-6 pb-40 pt-4">
                    <header>
                        <p className="text-[9px] font-black text-yellow-600 uppercase tracking-[0.5em]">Exclusivo</p>
                        <h2 className="text-3xl font-black text-zinc-900 tracking-tight mt-1 text-center uppercase">Vagas Dedicadas</h2>
                        <p className="text-xs text-zinc-500 mt-1">Seja piloto exclusivo de um parceiro Izi.</p>
                    </header>

                    {dedicatedSlots.length === 0 ? (
                        <div className="py-20 bg-zinc-50 border border-zinc-100 border-dashed rounded-[40px] flex flex-col items-center gap-4 text-center">
                            <Icon name="sentiment_dissatisfied" className="text-4xl text-zinc-200" />
                            <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Nenhuma vaga disponível</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {[...dedicatedSlots]`;

code = code.replace(regex, replacement);
fs.writeFileSync(file, code);
console.log('Fixed headers');
