const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

const newRenderActiveMission = `    const renderActiveMissionView = () => {
        if (!activeMission) {
            return (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-screen bg-[#020617] flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full animate-pulse" />
                        <div className="size-32 rounded-[45px] bg-white/5 border border-white/10 flex items-center justify-center relative z-10 shadow-2xl">
                            <Icon name="route" size={56} className="text-primary" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-3">Sem Missão Ativa</h2>
                    <p className="text-sm text-white/40 leading-relaxed mb-10 max-w-[280px]">Você não possui nenhuma corrida em andamento no momento.</p>
                    <div className="flex flex-col gap-4 w-full max-w-xs">
                        <button 
                            onClick={async () => {
                                setIsFinanceLoading(true);
                                try {
                                    const found = await recoverActiveMission();
                                    if (found) toastSuccess('Missão recuperada!');
                                    else toastSuccess('Nenhuma missão encontrada.');
                                } finally {
                                    setTimeout(() => setIsFinanceLoading(false), 800);
                                }
                            }}
                            className="h-16 clay-card-yellow text-slate-950 font-black text-sm uppercase tracking-widest rounded-[28px] w-full active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl"
                        >
                            {isFinanceLoading ? <div className="size-5 border-3 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" /> : <><Icon name="sync" className="text-xl" />Verificar Servidor</>}
                        </button>
                        <button onClick={() => setActiveTab('dashboard')} className="h-16 bg-white/5 border border-white/10 text-white/60 font-black text-sm uppercase tracking-widest rounded-[28px] w-full active:scale-95 transition-all">Ir para Dashboard</button>
                    </div>
                </motion.div>
            );
        }

        const getStatusDisplay = () => {
            switch(activeMission.status) {
                case 'accepted': return 'Aceito';
                case 'waiting_driver': return 'Aguardando';
                case 'preparando': return 'Em Preparo';
                case 'pronto': return 'Pronto para Coleta';
                case 'coletando': return 'cheguei no local';
                case 'a_caminho': return 'A Caminho';
                case 'cheguei': return 'No Local';
                case 'picked_up': case 'saiu_para_entrega': case 'em_rota': return 'Em Entrega';
                case 'no_local': return 'No Destino';
                default: return activeMission.status || 'Andamento';
            }
        };

        const isMobility = activeMission.service_type === 'Mobilidade' || activeMission.type === 'Mobilidade';

        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#020617] pb-48 overflow-y-auto no-scrollbar relative">
                <header className="px-7 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-[#020617]/90 backdrop-blur-2xl z-50 border-b border-white/[0.03]">
                    <div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Corrida Ativa</p>
                        <h2 className="text-3xl font-black text-white mt-1 tracking-tight italic">Destino Izi</h2>
                    </div>
                    <div className="clay-card-dark px-4 py-2 flex items-center gap-2 rounded-2xl border-white/10 shadow-lg">
                         <div className="size-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_#facc15]" />
                         <span className="text-[10px] font-black text-white uppercase tracking-widest">{getStatusDisplay()}</span>
                    </div>
                </header>

                <main className="px-7 space-y-7 pt-4">
                    {/* Navigation Stealth Card */}
                    <div className="h-44 clay-card-dark overflow-hidden relative group rounded-[40px] border-white/[0.05]">
                        <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-40">
                            <Icon name="navigation" className="text-primary/20 text-9xl -rotate-12" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent" />
                        <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                             <div className="flex items-center gap-4 bg-black/40 backdrop-blur-xl p-3 pr-6 rounded-3xl border border-white/5">
                                <div className="size-10 rounded-2xl bg-primary/20 flex items-center justify-center shadow-lg">
                                    <Icon name="timer" className="text-primary text-xl" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Chegada em</p>
                                    <p className="text-sm font-black text-white tracking-widest leading-none mt-0.5">~ 14 MIN</p>
                                </div>
                             </div>
                             <button onClick={() => {
                                const lat = activeMission.delivery_lat || activeMission.pickup_lat;
                                const lng = activeMission.delivery_lng || activeMission.pickup_lng;
                                window.open(\`https://www.google.com/maps/dir/?api=1&destination=\${lat},\${lng}\`);
                             }} className="size-16 clay-card-yellow flex items-center justify-center rounded-[24px] shadow-primary/20">
                                <Icon name="near_me" className="text-slate-900 text-3xl font-black" />
                             </button>
                        </div>
                    </div>

                    {/* Customer & Price Card */}
                    <div className="grid grid-cols-1 gap-4">
                        <div className="clay-card-dark p-6 rounded-[35px] flex items-center justify-between border-white/[0.05]">
                            <div className="flex items-center gap-5">
                                <div className="size-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
                                    <Icon name="account_circle" className="text-white/40 text-4xl" />
                                </div>
                                <div>
                                    <h4 className="text-white font-black text-xl tracking-tight leading-none">{activeMission.customer || 'Usuário Izi'}</h4>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Pagamento Online</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Valor</p>
                                <p className="text-2xl font-black text-white tracking-tighter self-end">R$ {(activeMission.price || 0).toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Compact Route Info */}
                    <div className="clay-card-dark p-8 rounded-[40px] space-y-10 relative bg-gradient-to-br from-white/[0.02] to-transparent">
                        <div className="absolute left-[54px] top-20 bottom-24 w-0.5 bg-dashed-line opacity-20" style={{ backgroundImage: 'linear-gradient(to bottom, #ffd900 10%, rgba(255,255,255,0) 0%)', backgroundSize: '1px 8px', backgroundRepeat: 'repeat-y' }} />
                        
                        <div className="flex items-start gap-6 relative z-10">
                            <div className="size-14 rounded-[22px] bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-lg">
                                <Icon name="radio_button_checked" className="text-primary text-xl" />
                            </div>
                            <div className="space-y-1 pt-0.5">
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] opacity-80">Ponto A (Coleta)</p>
                                <p className="text-sm font-bold text-white/90 leading-relaxed max-w-[200px]">{activeMission.origin || activeMission.pickup_address}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-6 relative z-10">
                            <div className="size-14 rounded-[22px] bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-lg">
                                <Icon name="location_on" className="text-emerald-500 text-xl" />
                            </div>
                            <div className="space-y-1 pt-0.5">
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] opacity-80">Ponto B (Entrega)</p>
                                <p className="text-sm font-bold text-white/90 leading-relaxed max-w-[200px]">{activeMission.destination || activeMission.delivery_address}</p>
                            </div>
                        </div>
                    </div>

                    {/* Stealth Action Section */}
                    <div className="fixed bottom-32 left-7 right-7 z-[60] flex flex-col gap-4">
                        {activeMission.status === 'accepted' || activeMission.status === 'waiting_driver' || activeMission.status === 'preparando' || activeMission.status === 'pronto' ? (
                            <button 
                                onClick={() => handleUpdateStatus('coletando')} 
                                className="w-full h-20 clay-card-yellow text-slate-950 font-black text-lg uppercase tracking-[0.25em] rounded-[32px] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 group"
                            >
                                <Icon name="hail" size={32} className="group-hover:scale-110 transition-transform" /> CHEGUEI NO LOCAL
                            </button>
                        ) : activeMission.status === 'coletando' ? (
                            <button 
                                onClick={() => handleUpdateStatus('picked_up')} 
                                className="w-full h-20 bg-blue-600 text-white font-black text-lg uppercase tracking-[0.25em] rounded-[32px] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 border-none shadow-blue-500/20"
                            >
                                <Icon name="inventory_2" size={32} /> COLETAR PEDIDO
                            </button>
                        ) : activeMission.status === 'picked_up' || activeMission.status === 'em_rota' || activeMission.status === 'a_caminho' || activeMission.status === 'saiu_para_entrega' ? (
                             <button 
                                onClick={() => handleUpdateStatus('no_local')} 
                                className="w-full h-20 bg-white text-black font-black text-lg uppercase tracking-[0.25em] rounded-[32px] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 border-none"
                            >
                                <Icon name="person_pin_circle" size={32} /> JÁ ESTOU NO CLIENTE
                            </button>
                        ) : (
                            <button 
                                onClick={() => handleUpdateStatus('concluido')} 
                                className="w-full h-20 bg-emerald-500 text-white font-black text-lg uppercase tracking-[0.25em] rounded-[32px] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 border-none shadow-emerald-500/20"
                            >
                                <Icon name="check_circle" size={32} /> FINALIZAR CORRIDA
                            </button>
                        )}
                        
                        <div className="flex gap-4">
                            <button className="flex-1 h-14 bg-white/5 border border-white/10 text-white/40 font-black text-[10px] uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all">
                                 <Icon name="help" size={16} /> Suporte
                            </button>
                            <button onClick={() => setActiveTab('dashboard')} className="flex-1 h-14 bg-white/5 border border-white/10 text-white/40 font-black text-[10px] uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all">
                                 <Icon name="close" size={16} /> Minimizar
                            </button>
                        </div>
                    </div>
                </main>
            </motion.div>
        );
    };`;

const startFunc = "    const renderActiveMissionView = () => {";
const endFunc = "    };";

// Finding the start and end of the function index
const startIndex = c.indexOf(startFunc);
let endIndex = -1;

// We need to find the matching closing brace for the function
if (startIndex !== -1) {
    let braceCount = 0;
    for (let i = startIndex; i < c.length; i++) {
        if (c[i] === '{') braceCount++;
        if (c[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
                endIndex = i + 1;
                break;
            }
        }
    }
}

if (startIndex !== -1 && endIndex !== -1) {
    c = c.substring(0, startIndex) + newRenderActiveMission + c.substring(endIndex);
    fs.writeFileSync('src/App.tsx', c, 'utf8');
    console.log('Function successfully replaced.');
} else {
    console.log('Function not found.');
}
