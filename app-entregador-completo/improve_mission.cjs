const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Update recoverActiveMission
const newRecover = `        const recoverActiveMission = async () => {
            if (!driverId) return;
            console.log('[RECOVERY] Buscando missão ativa no servidor...');
            const { data, error } = await supabase
                .from('orders_delivery')
                .select('*')
                .eq('driver_id', driverId)
                .not('status', 'in', '("concluido", "cancelado", "finalizado", "entregue", "delivered")')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (data && !error) {
                const mission = { 
                    ...data, 
                    realId: data.id, 
                    type: data.service_type || 'p2p', 
                    origin: data.pickup_address, 
                    destination: data.delivery_address, 
                    price: data.total_price || data.final_price,
                    customer: data.user_name || 'Cliente Izi'
                };
                setActiveMission(mission);
                localStorage.setItem('Izi_active_mission', JSON.stringify(mission));
                return true;
            }
            return false;
        };`;

c = c.replace(/const recoverActiveMission = async \(\) => {[\s\S]*?localStorage\.setItem\('Izi_active_mission', JSON\.stringify\(mission\)\);\s*}\s*};/, newRecover);

// 2. Update renderActiveMissionView Empty State
const newEmptyState = `    const renderActiveMissionView = () => {
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
        }`;

c = c.replace(/    const renderActiveMissionView = \(\) => {[\s\S]*?Ir para o Dashboard[\s\S]*?<\/button>\s*<\/div>\s*<\/motion\.div>\s*\);\s*}/, newEmptyState);

fs.writeFileSync('src/App.tsx', c, 'utf8');
