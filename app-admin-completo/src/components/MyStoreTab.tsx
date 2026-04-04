import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';
import { supabase } from '../lib/supabase';

// Componente de Toggle Premium
const PremiumToggle = ({ active, onClick, color = 'emerald' }: { active: boolean; onClick: () => void; color?: string }) => {
  const colors: Record<string, string> = {
    emerald: active ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-slate-200 dark:bg-slate-700',
    blue: active ? 'bg-blue-500 shadow-lg shadow-blue-500/20' : 'bg-slate-200 dark:bg-slate-700',
    rose: active ? 'bg-rose-500 shadow-lg shadow-rose-500/20' : 'bg-slate-200 dark:bg-slate-700',
  };

  return (
    <button
      onClick={onClick}
      className={`w-14 h-7 rounded-full relative p-1 transition-all flex items-center ${colors[color]}`}
    >
      <div className={`w-5 h-5 bg-white rounded-full transition-all shadow-sm ${active ? 'translate-x-7' : 'translate-x-0'}`}></div>
    </button>
  );
};

export default function MyStoreTab() {
  const {
    merchantProfile, 
    setMerchantProfile, 
    isSaving,
    setIsSaving
  } = useAdmin();

  const [localRadius, setLocalRadius] = useState(merchantProfile?.delivery_radius || 0);

  if (!merchantProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] animate-pulse">Sincronizando Estabelecimento...</p>
      </div>
    );
  }

  const updateProfileField = async (field: string, value: any) => {
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('admin_users')
        .update({ [field]: value })
        .eq('id', merchantProfile.merchant_id);
      
      if (error) throw error;
      setMerchantProfile({ ...merchantProfile, [field]: value });
      return true;
    } catch (err: any) {
      alert('Erro ao atualizar: ' + err.message);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveHours = async () => {
    const success = await updateProfileField('opening_hours', merchantProfile.opening_hours);
    if (success) alert('Horários de funcionamento atualizados com sucesso! 🕒');
  };

  const dayNames: Record<string, string> = {
    seg: 'Segunda', ter: 'Terça', qua: 'Quarta', qui: 'Quinta', sex: 'Sexta', sab: 'Sábado', dom: 'Domingo'
  };

  return (
    <div className="space-y-10 p-4 md:p-8 max-w-7xl mx-auto pb-20">
      
      {/* HEADER: STORE STATUS & QUICK CONTROLS */}
      <div className="relative group overflow-hidden bg-white dark:bg-slate-900 p-8 rounded-[48px] border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/40 dark:shadow-none transition-all">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
           <span className="material-symbols-outlined text-[160px] text-primary">storefront</span>
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          <div className="flex items-center gap-8">
            <div className="relative">
              <div className="size-32 rounded-[40px] overflow-hidden border-8 border-slate-50 dark:border-slate-800 shadow-xl bg-slate-100 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                {merchantProfile.store_logo ? (
                  <img src={merchantProfile.store_logo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-5xl text-slate-300">storefront</span>
                )}
              </div>
              <div className={`absolute -bottom-2 -right-2 size-12 rounded-[22px] flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-2xl ${merchantProfile.is_open ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                <span className="material-symbols-outlined text-2xl">{merchantProfile.is_open ? 'check' : 'close'}</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full border border-primary/20">Lojista Parceiro</span>
                <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{merchantProfile.store_name}</h2>
              </div>
              <p className="text-slate-400 font-bold text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-primary">pin_drop</span>
                {merchantProfile.store_address || 'Cadastre seu endereço nas configurações'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            {/* STATUS LOJA */}
            <div className="flex flex-col gap-3 px-8 py-6 bg-slate-50 dark:bg-slate-800/50 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-inner">
              <div className="flex items-center gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Sinal da Loja</p>
                  <p className={`text-sm font-black uppercase tracking-widest ${merchantProfile.is_open ? 'text-emerald-500 shadow-emerald-500/20' : 'text-rose-500 shadow-rose-500/20'}`}>
                    {merchantProfile.is_open ? 'Aberta agora' : 'Fechada'}
                  </p>
                </div>
                <PremiumToggle active={!!merchantProfile.is_open} onClick={async () => {
                   setIsSaving(true);
                   const nextOpen = !merchantProfile.is_open;
                   const { error } = await supabase.from('admin_users').update({ is_open: nextOpen, opening_mode: 'manual' }).eq('id', merchantProfile.merchant_id);
                   if (!error) setMerchantProfile({ ...merchantProfile, is_open: nextOpen, opening_mode: 'manual' });
                   setIsSaving(false);
                }} />
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/5 pt-3 mt-1">
                 <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">
                   Modo: <span className={merchantProfile.opening_mode === 'manual' ? 'text-amber-500' : 'text-primary'}>
                     {merchantProfile.opening_mode === 'manual' ? 'Manual (Padrão Override)' : 'Automático (Horários)'}
                   </span>
                 </p>
                 {merchantProfile.opening_mode === 'manual' && (
                   <button 
                     onClick={async () => {
                        setIsSaving(true);
                        const { error } = await supabase.from('admin_users').update({ opening_mode: 'auto' }).eq('id', merchantProfile.merchant_id);
                        if (!error) setMerchantProfile({ ...merchantProfile, opening_mode: 'auto' });
                        setIsSaving(false);
                     }}
                     className="text-[8px] font-black uppercase text-primary hover:underline"
                   >
                     Resetar para Automático
                   </button>
                 )}
              </div>
            </div>

            {/* FRETE GRÁTIS */}
            <div className="flex items-center gap-6 px-8 py-6 bg-slate-50 dark:bg-slate-800/50 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-inner">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Frete Grátis</p>
                <p className={`text-sm font-black uppercase tracking-widest ${merchantProfile.free_delivery ? 'text-blue-500' : 'text-slate-400'}`}>
                  {merchantProfile.free_delivery ? 'Ativado' : 'Inativo'}
                </p>
              </div>
              <PremiumToggle active={!!merchantProfile.free_delivery} onClick={() => updateProfileField('free_delivery', !merchantProfile.free_delivery)} color="blue" />
            </div>

            {/* TEMPO DE ENTREGA */}
            <button 
              onClick={async () => {
                const newTime = prompt('Defina o tempo de preparo + entrega (ex: 30-45 min):', merchantProfile.estimated_time || '30-45 min');
                if (newTime !== null) {
                  updateProfileField('estimated_time', newTime);
                }
              }}
              className="flex items-center gap-6 px-8 py-6 bg-slate-50 dark:bg-slate-800/50 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-inner hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group/time"
            >
              <div className="space-y-1 text-left">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Preparo + Entrega</p>
                <p className="text-sm font-black uppercase tracking-widest text-primary">
                  {merchantProfile.estimated_time || '30-45 min'}
                </p>
              </div>
              <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center group-hover/time:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined text-primary text-xl">timer</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          
          {/* LOGÍSTICA & RAIO */}
          <section className="bg-white dark:bg-slate-900 p-10 rounded-[56px] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
             <div className="relative z-10">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Gestão de Cobertura</h3>
                <p className="text-slate-400 text-sm font-medium mb-10">Defina o alcance máximo das suas entregas no mapa.</p>
                
                <div className="flex flex-col md:flex-row items-center gap-10">
                  <div className="flex-1 w-full space-y-6">
                    <div className="space-y-2">
                       <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Raio de Operação (km)</label>
                       <div className="relative flex items-center">
                          <input 
                            type="number" 
                            step="0.1"
                            value={localRadius}
                            onChange={(e) => setLocalRadius(parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-[32px] px-8 h-20 text-3xl font-black text-slate-900 dark:text-white focus:border-primary transition-all pr-32"
                            placeholder="0"
                          />
                          <div className="absolute right-4">
                             <button 
                               onClick={() => updateProfileField('delivery_radius', localRadius)}
                               disabled={isSaving}
                               className="px-8 h-12 bg-primary text-slate-900 font-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:grayscale"
                             >
                               {isSaving ? '...' : 'Salvar'}
                             </button>
                          </div>
                       </div>
                    </div>
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-[32px] flex items-start gap-4 border border-slate-100 dark:border-white/5">
                       <span className="material-symbols-outlined text-blue-500">info</span>
                       <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
                          Clientes localizados a mais de <span className="text-primary font-black">{localRadius}km</span> da sua loja não conseguirão visualizar seu card no aplicativo. Use com sabedoria para garantir a qualidade térmica dos seus produtos.
                       </p>
                    </div>
                  </div>
                  
                  <div className="relative shrink-0 flex items-center justify-center p-12 bg-primary/5 dark:bg-primary/10 rounded-[56px] border-2 border-dashed border-primary/20 group-hover:border-primary/40 transition-all">
                     <span className="material-symbols-outlined text-8xl text-primary animate-pulse opacity-50">radar</span>
                     <div className="absolute inset-0 flex items-center justify-center">
                        <div className="size-32 rounded-full border border-primary/30 animate-ping opacity-20" />
                     </div>
                  </div>
                </div>
             </div>
          </section>

          {/* AI ANALYTICS CARD */}
          <section className="bg-slate-900 dark:bg-black p-10 rounded-[56px] border border-white/5 shadow-[0_40px_100px_rgba(0,0,0,0.4)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 mix-blend-overlay opacity-20 group-hover:scale-110 transition-transform duration-1000">
               <span className="material-symbols-outlined text-[200px] text-white">neurology</span>
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-10">
                <div className="size-14 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                   <span className="material-symbols-outlined text-primary text-3xl">insights</span>
                </div>
                <div>
                   <h3 className="text-2xl font-black text-white">Inteligência Operacional</h3>
                   <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Insights em tempo real</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {[
                   { label: 'Pessoas na Loja', val: Math.floor(Math.random()*40)+10, icon: 'groups' },
                   { label: 'Conversão Média', val: '12.4%', icon: 'ads_click' },
                   { label: 'Preparo + Entrega', val: merchantProfile.estimated_time || '30-45 min', icon: 'timer' }
                 ].map((stat, i) => (
                   <div key={i} className="p-8 bg-white/5 rounded-[40px] border border-white/5 hover:bg-white/[0.08] transition-all group/stat">
                      <div className="flex items-center justify-between mb-4">
                        <span className="material-symbols-outlined text-slate-500 text-xl group-hover/stat:text-primary transition-colors">{stat.icon}</span>
                        <div className="size-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                      </div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                      <h4 className="text-3xl font-black text-white tracking-tighter">{stat.val}</h4>
                   </div>
                 ))}
              </div>
            </div>
          </section>
        </div>

        {/* COLUNA DIREITA: HORÁRIOS */}
        <div className="lg:col-span-1">
          <section className="bg-white dark:bg-slate-900 rounded-[56px] p-10 border border-slate-200 dark:border-slate-800 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-4">
                  Horários
                </h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Funcionamento Semanal</p>
              </div>
              <div className="size-14 rounded-3xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                 <span className="material-symbols-outlined text-orange-500 text-3xl">schedule</span>
              </div>
            </div>
            
            <div className="space-y-4 flex-1">
              {['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'].map((day) => {
                const dayConfig = merchantProfile.opening_hours?.[day] || { active: true, open: '08:00', close: '22:00' };
                return (
                  <div key={day} className="flex flex-col gap-4 p-5 bg-slate-50 dark:bg-slate-800/40 rounded-[32px] border border-slate-100 dark:border-white/5 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xs uppercase shadow-sm transition-all ${dayConfig.active ? 'bg-primary text-slate-900 border-none' : 'bg-slate-200 text-slate-400 dark:bg-slate-700 opacity-50 border border-slate-300 dark:border-slate-600'}`}>
                          {day}
                        </div>
                        <span className={`text-xs font-black uppercase tracking-widest ${dayConfig.active ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                          {dayNames[day]}
                        </span>
                      </div>
                      <PremiumToggle active={dayConfig.active} onClick={() => {
                        const next = { ...merchantProfile.opening_hours, [day]: { ...dayConfig, active: !dayConfig.active } };
                        setMerchantProfile({ ...merchantProfile, opening_hours: next });
                      }} color="emerald" />
                    </div>
                    
                    <AnimatePresence>
                      {dayConfig.active && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }} 
                          animate={{ height: 'auto', opacity: 1 }} 
                          exit={{ height: 0, opacity: 0 }}
                          className="flex items-center gap-3 px-2 overflow-hidden"
                        >
                          <div className="flex-1 flex items-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-2 overflow-hidden shadow-inner">
                            <input
                              type="text"
                              className="w-full bg-transparent border-none text-center font-black text-slate-900 dark:text-white focus:ring-0 placeholder:text-slate-300"
                              value={dayConfig.open}
                              onChange={(e) => {
                                const next = { ...merchantProfile.opening_hours, [day]: { ...dayConfig, open: e.target.value } };
                                setMerchantProfile({ ...merchantProfile, opening_hours: next });
                              }}
                            />
                          </div>
                          <span className="text-[10px] font-black text-slate-400 uppercase">at´e</span>
                          <div className="flex-1 flex items-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-2 overflow-hidden shadow-inner">
                            <input
                              type="text"
                              className="w-full bg-transparent border-none text-center font-black text-slate-900 dark:text-white focus:ring-0 placeholder:text-slate-300"
                              value={dayConfig.close}
                              onChange={(e) => {
                                const next = { ...merchantProfile.opening_hours, [day]: { ...dayConfig, close: e.target.value } };
                                setMerchantProfile({ ...merchantProfile, opening_hours: next });
                              }}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            <button
              disabled={isSaving}
              onClick={handleSaveHours}
              className="w-full mt-10 bg-emerald-500 hover:bg-emerald-600 text-white font-black py-7 rounded-[32px] text-xs uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(16,185,129,0.3)] hover:shadow-emerald-500/40 transition-all active:scale-[0.98] disabled:grayscale flex items-center justify-center gap-3 group"
            >
              {isSaving ? (
                <div className="size-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">save</span>
                  Confirmar Escala
                </>
              )}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
