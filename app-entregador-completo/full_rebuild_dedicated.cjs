const fs = require('fs');
const path = 'c:/Users/swami/.gemini/antigravity/scratch/izidelivery/app-entregador-completo/src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

// O objetivo é substituir o bloco completo da função renderDedicatedView 
// pelo novo formato moderno e sem erros de fechamento.

const startMarker = 'const renderDedicatedView = () => {';
// Procurar o final da função - geralmente termina antes de renderScheduledView ou no final do return
const endMarker = 'const renderScheduledView = () => {';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    const newFunction = `const renderDedicatedView = () => {
        const slot = selectedSlot;
        if (!slot) return null;
        
        const hasApplied = slotApplications.some(app => app.slot_id === slot.id);
        const application = slotApplications.find(app => app.slot_id === slot.id);
        
        const requirements = slot.metadata?.requirements || [
            { label: "CNH Categoria A Definitiva", detail: "Documentação em dia é obrigatória" },
            { label: "Baú ou Mochila Térmica", detail: "Equipamento próprio para entregas" }
        ];
        const customBenefits = slot.metadata?.custom_benefits || [];
        const neighborhoodExtras = slot.metadata?.neighborhood_extras || [];

        const sClayDark: React.CSSProperties = {
            background: '#121212',
            borderRadius: '2.5rem',
            boxShadow: '8px 8px 16px rgba(0,0,0,0.6), inset 4px 4px 8px rgba(255,255,255,0.02), inset -4px -4px 8px rgba(0,0,0,0.8)',
        };
        const sClayIcon: React.CSSProperties = {
            background: '#1A1A1A',
            boxShadow: '4px 4px 8px rgba(0,0,0,0.5), inset 2px 2px 4px rgba(255,255,255,0.05), inset -2px -2px 4px rgba(0,0,0,0.4)',
        };

        return (
            <motion.div 
                initial={{ opacity: 0, y: 30 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: 30 }} 
                className="fixed inset-0 z-[150] bg-black overflow-y-auto no-scrollbar pb-48"
            >
                {/* Hero Header */}
                <header className="relative h-80 w-full shrink-0">
                    {slot.admin_users?.store_banner ? (
                        <img src={slot.admin_users.store_banner} className="w-full h-full object-cover" alt="" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-stone-900 via-zinc-950 to-black" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    
                    <button 
                        onClick={() => setSelectedSlot(null)}
                        className="absolute top-8 left-6 size-12 rounded-2xl bg-black/60 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all z-20"
                    >
                        <Icon name="arrow_back" size={24} />
                    </button>

                    <div className="absolute bottom-10 left-6 right-6">
                        <div className="flex items-end gap-5">
                            <div className="size-24 rounded-[32px] bg-yellow-400 p-1.5 shadow-[0_20px_40px_rgba(0,0,0,0.5)] overflow-hidden border-2 border-white/10 shrink-0">
                                {slot.admin_users?.store_logo ? (
                                    <img src={slot.admin_users.store_logo} className="w-full h-full object-cover rounded-[22px]" alt="" />
                                ) : (
                                    <Icon name="stars" className="text-black" size={48} />
                                )}
                            </div>
                            <div className="flex-1 min-w-0 pb-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2.5 py-1 rounded-full bg-yellow-400/20 border border-yellow-400/20 text-yellow-400 text-[8px] font-black uppercase tracking-widest">Verificado</span>
                                </div>
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">{slot.admin_users?.store_name || 'Parceiro Izi'}</p>
                                <h2 className="text-4xl font-black text-white italic tracking-tighter leading-none">{slot.title}</h2>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="px-6 space-y-10 py-10">
                    {/* Ganho Card */}
                    <div className="p-8 rounded-[40px] bg-yellow-400 text-stone-950 relative overflow-hidden shadow-[0_30px_60px_rgba(250,204,21,0.2)]">
                        <div className="relative z-10">
                            <p className="font-black uppercase opacity-40 text-[10px] tracking-[0.3em] mb-2">Diária Garantida</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black italic">R$</span>
                                <span className="text-7xl font-black tracking-tighter italic leading-none">{parseFloat(slot.fee_per_day || 0).toFixed(0)}</span>
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-stone-950/5 w-fit px-4 py-2 rounded-full border border-stone-950/10">
                                <Icon name="event" size={14} className="text-stone-950" />
                                {slot.working_hours}
                            </div>
                        </div>
                        <Icon name="payments" size={160} className="absolute -right-8 -bottom-8 opacity-10 rotate-12" />
                    </div>

                    {/* Benefícios e Extras */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 flex flex-col items-center text-center space-y-3" style={sClayDark}>
                            <div className="size-12 rounded-2xl flex items-center justify-center border border-white/5" style={sClayIcon}>
                                <Icon name="location_on" size={20} className="text-primary" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Cidade/Base</p>
                                <p className="text-sm font-black text-white truncate w-full italic">{slot.city || 'Sua Região'}</p>
                            </div>
                        </div>
                        <div className="p-6 flex flex-col items-center text-center space-y-3" style={sClayDark}>
                            <div className="size-12 rounded-2xl flex items-center justify-center border border-white/5" style={sClayIcon}>
                                <Icon name="analytics" size={20} className="text-primary" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Extra Entrega</p>
                                <p className="text-sm font-black text-white italic">R$ {parseFloat(slot.metadata?.fee_per_extra_delivery || 0).toFixed(2).replace('.', ',')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Bonus Extra */}
                    {customBenefits.length > 0 && (
                        <section className="space-y-6">
                            <h3 className="text-xl font-black text-white italic tracking-tight flex items-center gap-3">
                                <span className="size-2 rounded-full bg-primary" />
                                Bônus e Extras
                            </h3>
                            <div className="flex overflow-x-auto gap-4 -mx-6 px-6 no-scrollbar pb-2">
                                {customBenefits.map((ben: any, idx: number) => (
                                    <div key={idx} className="flex-shrink-0 w-40 p-6 flex flex-col gap-4 border border-white/5" style={sClayDark}>
                                        <div className="size-10 rounded-xl flex items-center justify-center" style={sClayIcon}>
                                            <Icon name="star" className="text-primary" size={20} />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">{ben.label || ben.title || 'Incentivo'}</p>
                                            <p className="text-lg font-black text-primary italic leading-none">+ R$ {parseFloat(ben.value || 0).toFixed(2).replace('.', ',')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Descrição */}
                    {slot.description && (
                        <section className="space-y-6">
                             <h3 className="text-xl font-black text-white italic tracking-tight flex items-center gap-3">
                                <span className="size-2 rounded-full bg-primary" />
                                Sobre a Vaga
                            </h3>
                            <div className="p-6 border border-white/5 leading-relaxed" style={sClayDark}>
                                <p className="text-sm font-medium text-white/60">{slot.description}</p>
                            </div>
                        </section>
                    )}

                    {/* Requisitos */}
                    <section className="space-y-6">
                        <h3 className="text-xl font-black text-white italic tracking-tight flex items-center gap-3">
                            <span className="size-2 rounded-full bg-primary" />
                            Requisitos
                        </h3>
                        <div className="grid gap-4">
                            {requirements.map((req: any, idx: number) => (
                                <div key={idx} className="p-2 pr-6 flex items-center gap-5 border border-white/5" style={sClayDark}>
                                    <div className="size-12 rounded-[20px] flex items-center justify-center shrink-0" style={sClayIcon}>
                                        <Icon name="check" size={20} className="text-primary" />
                                    </div>
                                    <div className="flex-1 py-2">
                                        <p className="text-xs font-black text-white uppercase tracking-wide">{typeof req === 'string' ? req : req.label}</p>
                                        {req.detail && <p className="text-[10px] font-medium text-white/30 mt-0.5">{req.detail}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </motion.div>
        );
    };\n\n    `;
    
    content = content.substring(0, startIndex) + newFunction + content.substring(endIndex);
    fs.writeFileSync(path, content, 'utf8');
    console.log('Função renderDedicatedView reconstruída com sucesso!');
} else {
    console.error('Marcadores não encontrados');
}
