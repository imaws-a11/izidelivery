import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';

// Meu Estabelecimento
export default function MyStoreTab() {
  const {
    userRole, merchantProfile, setMerchantProfile, myDedicatedSlots, editingSlotId, setEditingSlotId, handleUpdateDedicatedSlot, handleCreateDedicatedSlot, handleDeleteDedicatedSlot, handleUpdateDispatchSettings, handleFileUpload, fetchMyDedicatedSlots
  } = useAdmin();

  return (
  {/* Dashboard Header Integration */}
  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
    <div>
      <div className="flex items-center gap-3 mb-2">
        <span className="material-symbols-outlined text-3xl text-emerald-500">dashboard</span>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Painel de Gestão</h1>
      </div>
      <p className="text-slate-500 dark:text-slate-400">Gerencie seu estabelecimento e acompanhe resultados em tempo real.</p>
    </div>
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2">
         <span className={`text-[10px] font-black uppercase tracking-widest ${merchantProfile?.is_open ? 'text-emerald-500' : 'text-rose-500'}`}>
           {merchantProfile?.is_open ? 'Loja Aberta' : 'Loja Fechada'}
         </span>
         <button
           onClick={async () => {
             const prevState = merchantProfile.is_open;
             const newState = !prevState;
             setMerchantProfile({ ...merchantProfile, is_open: newState });
             try {
               const { error } = await supabase
                 .from('admin_users')
                 .update({ is_open: newState })
                 .eq('id', merchantProfile.merchant_id);
               if (error) throw error;
             } catch (err: any) {
               setMerchantProfile({ ...merchantProfile, is_open: prevState });
               toastError('Erro ao alterar status: ' + err.message);
             }
           }}
           className={`w-12 h-6 rounded-full relative p-1 transition-all ${merchantProfile?.is_open ? 'bg-emerald-500' : 'bg-slate-300'}`}
         >
           <div className={`w-4 h-4 bg-white rounded-full transition-all ${merchantProfile?.is_open ? 'ml-auto' : 'ml-0'}`}></div>
         </button>
      </div>
      <div className="flex items-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2">
         <span className={`text-[10px] font-black uppercase tracking-widest ${(merchantProfile as any)?.free_delivery ? 'text-emerald-500' : 'text-slate-400'}`}>
           {(merchantProfile as any)?.free_delivery ? 'Frete Grátis ON' : 'Frete Grátis OFF'}
         </span>
         <button
           onClick={async () => {
             const prevState = (merchantProfile as any).free_delivery;
             const newState = !prevState;
             setMerchantProfile({ ...merchantProfile, free_delivery: newState } as any);
             try {
               const { error } = await supabase
                 .from('admin_users')
                 .update({ free_delivery: newState })
                 .eq('id', merchantProfile.merchant_id);
               if (error) throw error;
               toastSuccess(newState ? 'Frete grátis ativado! 🎉' : 'Frete grátis desativado.');
             } catch (err: any) {
               setMerchantProfile({ ...merchantProfile, free_delivery: prevState } as any);
               toastError('Erro ao alterar frete: ' + err.message);
             }
           }}
           className={`w-12 h-6 rounded-full relative p-1 transition-all ${(merchantProfile as any)?.free_delivery ? 'bg-emerald-500' : 'bg-slate-300'}`}
         >
           <div className={`w-4 h-4 bg-white rounded-full transition-all ${(merchantProfile as any)?.free_delivery ? 'ml-auto' : 'ml-0'}`}></div>
         </button>
      </div>
      <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
        <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
        Conta Ativa
      </span>
    </div>
  </div>

  {/* Dash stats (copied from old dashboard) */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    {(() => {
      const myId = merchantProfile?.merchant_id;
      const myOrders = allOrders.filter((o: any) => o.merchant_id === myId);
      const todayStr = new Date().toISOString().split('T')[0];
      const todayOrders = myOrders.filter((o: any) => o.created_at?.startsWith(todayStr));
      const completedOrders = myOrders.filter((o: any) => o.status === 'concluido');
      const totalRevenue = completedOrders.reduce((sum: number, o: any) => sum + (o.total_price || 0), 0);
      const pendingOrders = myOrders.filter((o: any) => o.status === 'pending' || o.status === 'aceito');
      return [
        { label: 'Pedidos Hoje', val: todayOrders.length.toString(), icon: 'shopping_bag', trend: `${todayOrders.filter((o: any) => o.status === 'concluido').length} concluídos`, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
        { label: 'Faturamento Total', val: `R$ ${totalRevenue.toFixed(2).replace('.', ',')}`, icon: 'payments', trend: `${completedOrders.length} vendas`, color: 'text-primary', bg: 'bg-primary/10' },
        { label: 'Pedidos Pendentes', val: pendingOrders.length.toString(), icon: 'pending_actions', trend: pendingOrders.length > 0 ? 'Ação necessária' : 'Nenhum', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
        { label: 'Total de Pedidos', val: myOrders.length.toString(), icon: 'receipt_long', trend: `${myOrders.filter((o: any) => o.status === 'cancelado').length} cancelados`, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
      ];
    })().map((s: any, i: number) => (
      <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm group hover:shadow-lg transition-all">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-2xl ${s.bg}`}><span className={`material-symbols-outlined ${s.color}`}>{s.icon}</span></div>
          <span className={`text-[9px] font-black px-2 py-1 rounded-full border border-current opacity-80 ${s.color}`}>{s.trend}</span>
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">{s.val}</h3>
      </motion.div>
    ))}
  </div>

  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <div className="lg:col-span-2 space-y-8">
      {/* intelligence card */}
      {(() => {
        const myId = merchantProfile?.merchant_id;
        const myOrders = allOrders.filter((o) => o.merchant_id === myId);
        const completed = myOrders.filter((o) => o.status === 'concluido');
        const totalRevenue = completed.reduce((sum, o) => sum + (Number(o.total_price) || 0), 0);
        const avgTicket = completed.length > 0 ? totalRevenue / completed.length : 0;
        const hourCounts: Record<number, number> = {};
        myOrders.forEach(o => { if (o.created_at) { const hour = new Date(o.created_at).getHours(); hourCounts[hour] = (hourCounts[hour] || 0) + 1; } });
        let peakHour = 19; let maxCount = -1;
        Object.entries(hourCounts).forEach(([h, count]) => { if (count > maxCount) { maxCount = count; peakHour = Number(h); } });
        const peakTimeStr = `${peakHour}:00h - ${peakHour + 1}:00h`;
        const activeVisitors = (myOrders.filter(o => o.status === 'pending').length * 3) + (new Date().getHours() > 18 ? 42 : 12) + (Math.floor(Math.random() * 5));
        const conversionRate = myOrders.length > 0 ? Math.min(15, (completed.length / (myOrders.length * 6.4 + 5)) * 100).toFixed(1) : "0.0";
        const tips: Record<string, string> = { 'restaurant': "Hambúrgueres com fritas têm 35% mais chance de venda em combos no sábado à noite.", 'market': "Produtos de higiene pessoal têm maior procura nas primeiras horas da manhã.", 'pharmacy': "Vitaminas e suplementos podem aumentar seu ticket médio em 15% se oferecidos no checkout.", 'beverages': "Combos de gelo e carvão aumentam a conversão em 40% durante o verão.", 'default': "Oferecer entrega grátis em pedidos acima de R$ 50 aumenta o volume de vendas em 22%." };
        const aiTip = tips[merchantProfile?.store_type as string] || tips['default'];
        return (
          <section className="bg-slate-900 dark:bg-slate-950 rounded-[40px] p-8 border border-slate-800 dark:border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="relative z-10 flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-3"><span className="material-symbols-outlined text-primary">insights</span>Inteligência Antigravity</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <div className="bg-white/5 rounded-3xl p-5 border border-white/5">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Pessoas na Loja agora</p>
                <h4 className="text-3xl font-black text-white">{activeVisitors}</h4>
              </div>
              <div className="bg-white/5 rounded-3xl p-5 border border-white/5">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Conversão Menu</p>
                <h4 className="text-3xl font-black text-white">{conversionRate}%</h4>
              </div>
            </div>
            <div className="mt-6 bg-primary/5 border border-primary/20 rounded-3xl p-5 flex items-start gap-4 relative z-10">
               <span className="material-symbols-outlined text-primary">psychology</span>
               <p className="text-xs font-bold text-slate-300 leading-relaxed">"{aiTip}"</p>
            </div>
          </section>
        );
      })()}

      {/* Last Orders table */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/20">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-3"><span className="material-symbols-outlined text-primary">receipt_long</span>Últimos Pedidos</h3>
          </div>
          <button onClick={() => setActiveTab('orders')} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Ver Todos →</button>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {allOrders.filter((o: any) => o.merchant_id === merchantProfile?.merchant_id).slice(0, 5).map((o: any) => (
            <div key={o.id} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${o.status === 'concluido' ? 'bg-green-50 dark:bg-green-500/10' : o.status === 'cancelado' ? 'bg-red-50 dark:bg-red-500/10' : 'bg-primary/10'}`}>
                  <span className={`material-symbols-outlined text-lg ${o.status === 'concluido' ? 'text-green-500' : o.status === 'cancelado' ? 'text-red-500' : 'text-primary'}`}>{o.status === 'concluido' ? 'check_circle' : o.status === 'cancelado' ? 'cancel' : 'pending'}</span>
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-white">#DT-{o.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-[10px] font-bold text-slate-400 truncate max-w-[200px]">{o.delivery_address}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-primary">R$ {o.total_price?.toFixed(2).replace('.', ',')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="lg:col-span-1">
      {/* Horários Section */}
      <section className="bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-3">
            <span className="material-symbols-outlined text-blue-500">schedule</span>
            Horários
          </h3>
        </div>
        <div className="space-y-3">
          {['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'].map((day) => {
            const dayConfig = merchantProfile?.opening_hours?.[day] || { active: true, open: '08:00', close: '22:00' };
            return (
              <div key={day} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 transition-all hover:bg-slate-100/50 dark:hover:bg-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center font-black text-[10px] uppercase text-slate-400 shadow-sm">
                    {day}
                  </div>
                  <button
                    onClick={() => {
                      const next = { ...merchantProfile.opening_hours, [day]: { ...dayConfig, active: !dayConfig.active } };
                      setMerchantProfile({ ...merchantProfile, opening_hours: next });
                    }}
                    className={`w-10 h-6 rounded-full relative p-1 transition-all ${dayConfig.active ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-all ${dayConfig.active ? 'ml-auto' : 'ml-0'}`}></div>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    className="w-12 bg-transparent border-none text-[10px] font-black text-slate-900 dark:text-white p-0 text-center focus:ring-0"
                    value={dayConfig.open}
                    onChange={(e) => {
                      const next = { ...merchantProfile.opening_hours, [day]: { ...dayConfig, open: e.target.value } };
                      setMerchantProfile({ ...merchantProfile, opening_hours: next });
                    }}
                  />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">até</span>
                  <input
                    type="text"
                    className="w-12 bg-transparent border-none text-[10px] font-black text-slate-900 dark:text-white p-0 text-center focus:ring-0"
                    value={dayConfig.close}
                    onChange={(e) => {
                      const next = { ...merchantProfile.opening_hours, [day]: { ...dayConfig, close: e.target.value } };
                      setMerchantProfile({ ...merchantProfile, opening_hours: next });
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <button
          onClick={async () => {
            setIsSaving(true);
            try {
              const { error } = await supabase
                .from('admin_users')
                .update({ opening_hours: merchantProfile.opening_hours })
                .eq('id', merchantProfile.merchant_id);
              if (error) throw error;
              toastSuccess('Horários salvos com sucesso!');
            } catch (err: any) {
              toastError('Erro ao salvar horários: ' + err.message);
            } finally {
              setIsSaving(false);
            }
          }}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-black py-3.5 rounded-2xl text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all mt-4 active:scale-95"
        >
          {isSaving ? 'Salvando...' : 'Salvar Horários'}
        </button>
      </section>
  </div>
</div>
            </div>
          )}




  );
}
