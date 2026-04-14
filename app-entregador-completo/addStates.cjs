const fs = require('fs');
const filePath = 'c:/Users/swami/.gemini/antigravity/scratch/izidelivery/app-entregador-completo/src/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Add the states if they don't exist
if (!content.includes('const [applyingSlotId')) {
    content = content.replace(
        'const [selectedSlot, setSelectedSlot] = useState<any | null>(null);',
        'const [selectedSlot, setSelectedSlot] = useState<any | null>(null);\n    const [applyingSlotId, setApplyingSlotId] = useState<string | null>(null);\n    const [showSlotAppliedSuccess, setShowSlotAppliedSuccess] = useState(false);'
    );
    console.log('Added states');
}

// Add the overlay at the bottom if it doesn't exist
if (!content.includes('showSlotAppliedSuccess && (')) {
    const overlayCode = `
                {showSlotAppliedSuccess && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[300] bg-slate-950/98 backdrop-blur-2xl flex flex-col items-center justify-center p-8 text-center"
                    >
                        <motion.div 
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="size-28 rounded-[42px] bg-primary flex items-center justify-center shadow-[0_20px_40px_rgba(250,204,21,0.3)] mb-8"
                        >
                            <span className="material-symbols-outlined text-zinc-950 text-5xl font-black">stars</span>
                        </motion.div>
                        
                        <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none mb-4">
                            Candidatura <br />
                            <span className="text-primary">Enviada!</span>
                        </h2>
                        
                        <p className="text-slate-400 font-bold text-sm tracking-wide mb-12 max-w-xs uppercase opacity-70">
                            Seu perfil está agora com o lojista parceiro. Você será notificado se for selecionado!
                        </p>

                        <button
                            onClick={() => {
                                setShowSlotAppliedSuccess(false);
                                setSelectedSlot(null);
                            }}
                            className="w-full max-w-xs h-16 rounded-[28px] bg-white text-zinc-950 font-black text-xs uppercase tracking-[0.3em] active:scale-95 transition-all"
                        >
                            Voltar para Vagas
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
            {renderBottomNavigation()}
`;
    // We replace `</AnimatePresence>\n            {renderBottomNavigation()}` with the new overlay included.
    content = content.replace(
        /<\/AnimatePresence>\s*\{renderBottomNavigation\(\)\}/,
        overlayCode
    );
    console.log('Added overlay');
}

fs.writeFileSync(filePath, content, 'utf8');
