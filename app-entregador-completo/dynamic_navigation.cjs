const fs = require('fs');
const path = 'c:/Users/swami/.gemini/antigravity/scratch/izidelivery/app-entregador-completo/src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remover a barra de botões fixa interna da função renderDedicatedView
// Ela não será mais necessária lá, pois estará integrada na BottomNavigation
const dedicatedViewPattern = /\{[/][*] ¢¢ÃƒÆ’¢¬¢ÃƒÆ’¢ÃƒÂ¢Ã¢â‚¬Åá¬Ãƒâ€¦á¬¢¢ÃƒÆ’¢¬¢ÃƒÆ’¢ÃƒÂ¢Ã¢â‚¬Åá¬Ãƒâ€¦á¬ Sticky Bottom ¢¢ÃƒÆ’¢¬¢ÃƒÆ’¢ÃƒÂ¢Ã¢â‚¬Åá¬Ãƒâ€¦á¬¢¢ÃƒÆ’¢¬¢ÃƒÆ’¢ÃƒÂ¢Ã¢â‚¬Åá¬Ãƒâ€¦á¬ [*][/]\}\s+<nav[\s\S]*?<\/nav>/;
content = content.replace(dedicatedViewPattern, '');

// 2. Modificar renderBottomNavigation para ser dinâmica
const bottomNavPattern = /const renderBottomNavigation = \(\) => \([\s\S]*?<nav[\s\S]*?<\/nav>\s+\);/;
const dynamicBottomNav = `const renderBottomNavigation = () => {
        const isSlotDetailActive = !!selectedSlot;

        return (
            <nav className="fixed bottom-0 left-0 right-0 z-[100] px-4 pb-6 pt-2 pointer-events-none">
                <motion.div 
                    layout
                    initial={false}
                    className="clay-card-dark rounded-[32px] p-2 flex items-center justify-between border-white/5 backdrop-blur-3xl shadow-[0_-10px_30px_rgba(0,0,0,0.5)] pointer-events-auto overflow-hidden"
                >
                    <AnimatePresence mode="wait">
                        {!isSlotDetailActive ? (
                            <motion.div 
                                key="nav-items"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="flex items-center justify-between w-full"
                            >
                                {[
                                    { id: 'dashboard', label: 'Início', icon: 'grid_view' },
                                    { id: 'active_mission', label: 'Missão', icon: 'route' },
                                    { id: 'scheduled', label: 'Agenda', icon: 'event', badge: scheduledOrders.length },
                                    { id: 'earnings', label: 'Financeiro', icon: 'payments' },
                                    { id: 'history', label: 'Histórico', icon: 'history' },
                                    { id: 'profile', label: 'Perfil', icon: 'person' }
                                ].map((item) => {
                                    const isActive = activeTab === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setActiveTab(item.id as any)}
                                            className={\`flex flex-col items-center gap-1.5 py-3 px-1 rounded-3xl transition-all relative flex-1 \${
                                                isActive ? 'text-primary' : 'text-white/30'
                                            }\`}
                                        >
                                            <div className={\`size-10 rounded-2xl flex items-center justify-center transition-all \${
                                                isActive ? 'bg-primary/10 border border-primary/20 scale-110' : 'bg-transparent'
                                            }\`}>
                                                <Icon name={item.icon} size={isActive ? 24 : 22} className={isActive ? 'text-primary' : 'text-white/20'} />
                                                {item.badge > 0 && (
                                                    <span className="absolute top-1 right-1 size-4 bg-primary text-slate-900 text-[8px] font-black rounded-full flex items-center justify-center border border-black shadow-lg">
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </div>
                                            <span className={\`text-[8px] font-black uppercase tracking-widest \${isActive ? 'opacity-100' : 'opacity-0'} transition-all text-center\`}>
                                                {item.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="action-button"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="w-full flex items-center gap-3 p-1"
                            >
                                <button 
                                    onClick={() => setSelectedSlot(null)}
                                    className="size-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all"
                                >
                                    <Icon name="close" size={24} />
                                </button>
                                
                                {(() => {
                                    const hasApplied = slotApplications.some(app => app.slot_id === selectedSlot?.id);
                                    const application = slotApplications.find(app => app.slot_id === selectedSlot?.id);
                                    
                                    if (hasApplied) {
                                        return (
                                            <div
                                                className="flex-1 flex items-center justify-center gap-3 h-14 font-black text-xs uppercase"
                                                style={{
                                                    ...(application?.status === 'accepted'
                                                        ? { background: '#10b981', boxShadow: '0 10px 25px rgba(16,185,129,0.3)' }
                                                        : { ...sClayDark, color: '#FFD700' }
                                                    ),
                                                    borderRadius: '1.2rem',
                                                    letterSpacing: '0.1em',
                                                    color: application?.status === 'accepted' ? '#fff' : '#FFD700',
                                                }}
                                            >
                                                <Icon name={application?.status === 'accepted' ? 'verified' : 'today'} size={18} />
                                                {application?.status === 'accepted' ? 'Candidatura Aprovada!' : 'Em Análise...'}
                                            </div>
                                        );
                                    }
                                    
                                    return (
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const { error } = await supabase.from('slot_applications').insert({
                                                        slot_id: selectedSlot.id,
                                                        driver_id: driverId,
                                                        status: 'pending',
                                                        created_at: new Date().toISOString()
                                                    });
                                                    if (error) throw error;
                                                    toastSuccess('Candidatura enviada!');
                                                    setSelectedSlot(null);
                                                    setActiveTab('dashboard');
                                                } catch { toastError('Erro ao candidatar.'); }
                                            }}
                                            className="flex-1 flex items-center justify-center gap-3 h-14 font-black text-xs uppercase text-stone-950 active:scale-[0.98] transition-all"
                                            style={{ ...sClayYellow, borderRadius: '1.2rem', letterSpacing: '0.15em' }}
                                        >
                                            <Icon name="verified" size={18} />
                                            Candidatar-se à Vaga
                                        </button>
                                    );
                                })()}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </nav>
        );
    };`;

content = content.replace(bottomNavPattern, dynamicBottomNav);

// 3. Melhorar o cabeçalho da vaga dedicada para ser mais premium e incluir botão de voltar
const dedicatedHeaderPattern = /const renderDedicatedView = \(\) => \{[\s\S]*?return \(/;
const improvedDedicatedHeader = `const renderDedicatedView = () => {
        const slot = selectedSlot;
        if (!slot) return null;
        const hasApplied = slotApplications.some(app => app.slot_id === slot.id);
        const application = slotApplications.find(app => app.slot_id === slot.id);
        const requirements = slot.metadata?.requirements || [];
        const customBenefits = slot.metadata?.custom_benefits || [];
        const neighborhoodExtras = slot.metadata?.neighborhood_extras || [];

        return (
            <motion.div 
                initial={{ opacity: 0, y: 100 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: 100 }} 
                className="fixed inset-0 z-[150] bg-black overflow-y-auto no-scrollbar pb-32"
            >
                {/* Hero Header */}
                <header className="relative h-72 w-full">
                    {slot.admin_users?.store_banner ? (
                        <img src={slot.admin_users.store_banner} className="w-full h-full object-cover" alt="" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-stone-900 to-black" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    
                    <button 
                        onClick={() => setSelectedSlot(null)}
                        className="absolute top-8 left-6 size-12 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all z-20"
                    >
                        <Icon name="arrow_back" size={24} />
                    </button>

                    <div className="absolute bottom-8 left-6 right-6">
                        <div className="flex items-end gap-5">
                            <div className="size-20 rounded-3xl bg-yellow-400 p-1 shadow-2xl overflow-hidden border-2 border-white/20">
                                {slot.admin_users?.store_logo ? (
                                    <img src={slot.admin_users.store_logo} className="w-full h-full object-cover rounded-[20px]" alt="" />
                                ) : (
                                    <Icon name="stars" className="text-black" size={40} />
                                )}
                            </div>
                            <div className="flex-1 min-w-0 pb-1">
                                <p className="text-[10px] font-black text-yellow-400 uppercase tracking-widest mb-1">{slot.admin_users?.store_name || 'Parceiro Izi'}</p>
                                <h2 className="text-3xl font-black text-white italic tracking-tighter leading-none">{slot.title}</h2>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="space-y-10 pt-8">`;

content = content.replace(dedicatedHeaderPattern, improvedDedicatedHeader);

fs.writeFileSync(path, content, 'utf8');
console.log('Implementada Barra de Navegação Dinâmica e Cabeçalho Premium!');
