import React, { useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';
import { supabase } from '../lib/supabase';
import { toastSuccess, toastError } from '../lib/useToast';
import type { Merchant } from '../lib/types';

export default function MerchantsTab() {
  const {
    merchantsList, isLoadingList, setEditingItem, setEditType, 
    handleUpdateMerchantStatus, handleDeleteMerchant, openMerchantPreview, 
    appSettings, fetchMerchants, setActiveTab, establishmentTypes
  } = useAdmin();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended' | 'inactive'>('all');

  useEffect(() => {
    fetchMerchants();
  }, [fetchMerchants]);

  const filteredMerchants = useMemo(() => {
    return merchantsList.filter(m => {
      const matchesSearch = 
        (m.store_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.store_phone?.includes(searchTerm));
      
      const matchesStatus = 
        filterStatus === 'all' || 
        (filterStatus === 'active' && (m.status === 'active' || m.is_active)) ||
        (filterStatus === 'suspended' && m.status === 'suspended') ||
        (filterStatus === 'inactive' && !m.is_active && m.status !== 'suspended');

      return matchesSearch && matchesStatus;
    });
  }, [merchantsList, searchTerm, filterStatus]);

  const metrics = useMemo(() => {
    return {
      total: merchantsList.length,
      active: merchantsList.filter(m => m.status === 'active' || m.is_active).length,
      suspended: merchantsList.filter(m => m.status === 'suspended').length,
      inactive: merchantsList.filter(m => !m.is_active && m.status !== 'suspended').length
    };
  }, [merchantsList]);

  return (
    <div className="space-y-8 pb-20">
      {/* HEADER & ACTIONS - Glass Style */}
      <div className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl border border-white/50 dark:border-white/10 p-10 rounded-[32px] flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden group shadow-sm transition-all duration-500">
        <div className="absolute -top-32 -right-32 size-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-primary/20 transition-all duration-1000" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="size-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
               <span className="material-symbols-outlined text-slate-900 text-2xl font-black">storefront</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">
              Rede de <span className="text-primary">Parceiros</span>
            </h1>
          </div>
          <p className="text-slate-800 dark:text-zinc-900 font-bold text-xs uppercase tracking-[0.2em] ml-1">
             Gestão de Estabelecimentos e Ecossistema de Lojistas
          </p>
        </div>
        
        <div className="relative z-10 flex items-center gap-4">
          <button 
             onClick={async () => {
                const confirm = await window.confirm('Deseja sincronizar as credenciais de todos os lojistas? Isso garantirá que todos consigam fazer login.');
                if (!confirm) return;
                
                toastSuccess('Iniciando sincronização em massa...');
                let successCount = 0;
                let errorCount = 0;

                for (const merchant of merchantsList) {
                  try {
                    const { data, error } = await supabase.functions.invoke('create-admin-user', {
                      body: {
                        email: merchant.email,
                        password: merchant.password || 'Jnior19!',
                        role: 'merchant',
                        metadata: { store_name: merchant.store_name }
                      }
                    });

                    if (error || data?.error) {
                      errorCount++;
                    } else {
                      successCount++;
                    }
                  } catch (err) {
                    errorCount++;
                  }
                }

                if (errorCount === 0) {
                  toastSuccess(`${successCount} lojistas sincronizados com sucesso!`);
                } else {
                  toastSuccess(`${successCount} sincronizados. ${errorCount} falhas.`);
                }
             }}
             className="h-16 px-6 bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-2xl shadow-sm flex items-center gap-3 hover:bg-white transition-all group backdrop-blur-md"
          >
             <span className="material-symbols-outlined font-black group-hover:rotate-180 transition-transform duration-700">sync</span>
             <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">Sincronizar</span>
          </button>

          <button 
             onClick={() => {
                setEditType('new_merchant');
                setEditingItem({
                  store_name: '',
                  email: '',
                  password: '',
                  store_type: (establishmentTypes.filter(t => !t.parent_id)[0]?.value) || 'restaurant',
                  commission_percent: appSettings.appCommission || 15,
                  service_fee: appSettings.serviceFee || 1.5,
                  is_active: true,
                  role: 'merchant'
                });
             }}
             className="h-16 px-10 bg-slate-900 dark:bg-primary text-white dark:text-slate-900 rounded-2xl shadow-2xl shadow-primary/30 flex items-center gap-3 hover:scale-[1.05] active:scale-95 transition-all group overflow-hidden relative"
          >
             <span className="material-symbols-outlined font-black">add_circle</span>
             <span className="text-[11px] font-black uppercase tracking-[0.2em]">Novo Lojista</span>
          </button>
        </div>
      </div>

      {/* METRICS CARDS - Glass Style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'Total Base', count: metrics.total, icon: 'hub', color: 'text-slate-800', bg: 'bg-slate-500/10' },
          { label: 'Operando', count: metrics.active, icon: 'verified', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Suspensos', count: metrics.suspended, icon: 'warning', color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Inativos', count: metrics.inactive, icon: 'cancel', color: 'text-rose-500', bg: 'bg-rose-500/10' },
        ].map((m, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl p-8 rounded-[40px] border border-white/50 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] transition-all duration-500 hover:translate-y-[-4px] group flex items-center gap-6"
          >
             <div className={`size-16 rounded-2xl ${m.bg} ${m.color} flex items-center justify-center border border-current/10 shadow-inner group-hover:scale-110 transition-transform`}>
                <span className="material-symbols-outlined text-2xl font-black">{m.icon}</span>
             </div>
             <div>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{m.count}</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-slate-900 mt-1">{m.label}</p>
             </div>
          </motion.div>
        ))}
      </div>

      {/* FILTERS & SEARCH */}
      <div className="bg-white dark:bg-slate-900/40 backdrop-blur-3xl rounded-[40px] border border-slate-200 dark:border-white/5 p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm">
         <div className="flex-1 w-full relative group">
            <span className="absolute left-6 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-900 group-focus-within:text-primary transition-colors">search</span>
            <input 
              type="text"
              placeholder="Pesquise por nome, e-mail ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-8 py-5 bg-slate-50 dark:bg-black/20 border-none rounded-[28px] text-sm font-bold focus:ring-2 focus:ring-primary/30 transition-all dark:text-white shrink-0"
            />
         </div>
         <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-black/20 rounded-[28px] border border-slate-200 dark:border-white/5">
            {[
              { id: 'all', label: 'Todos', icon: 'list_alt' },
              { id: 'active', label: 'Ativos', icon: 'check_circle' },
              { id: 'suspended', label: 'Suspensos', icon: 'pause_circle' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterStatus(f.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-[24px] text-[10px] font-black uppercase tracking-widest transition-all ${
                  filterStatus === f.id 
                  ? 'bg-white dark:bg-slate-800 text-primary shadow-sm scale-105' 
                  : 'text-slate-900 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                <span className="material-symbols-outlined text-sm font-black">{f.icon}</span>
                {f.label}
              </button>
            ))}
         </div>
      </div>

      {/* MAIN TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-[54px] border border-slate-200 dark:border-white/5 shadow-2xl shadow-black/10 overflow-hidden relative group">
        <div className="absolute top-0 right-0 size-96 bg-primary/5 blur-[120px] rounded-full -mr-48 -mt-48 pointer-events-none group-hover:bg-primary/10 transition-colors duration-1000" />
        
        {isLoadingList && (
          <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md z-40 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="size-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="text-[10px] font-black text-primary uppercase tracking-widest animate-pulse">Sincronizando Rede...</p>
            </div>
          </div>
        )}

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-black/20 border-b border-slate-100 dark:border-white/5">
                <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-900">Estabelecimento</th>
                <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-900">Financeiro / Taxas</th>
                <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 text-center">Status Operacional</th>
                <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5 relative z-10">
              <AnimatePresence mode="popLayout">
                {filteredMerchants.length > 0 ? filteredMerchants.map((m, idx) => (
                  <motion.tr 
                    key={m.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-all group/row"
                  >
                    <td className="px-10 py-7">
                      <div 
                        onClick={() => { 
                          openMerchantPreview(m);
                          setEditingItem(m);
                          setEditType('merchant'); 
                        }}
                        className="flex items-center gap-5 cursor-pointer group/item"
                      >
                        <div className="size-16 rounded-3xl bg-primary/20 dark:bg-primary/10 border border-primary/10 flex items-center justify-center overflow-hidden transition-transform group-hover/item:scale-105 shadow-sm">
                           {m.store_logo ? (
                             <img src={m.store_logo} className="w-full h-full object-cover" />
                           ) : (
                             <span className="material-symbols-outlined text-primary text-3xl font-black">storefront</span>
                           )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-lg dark:text-white tracking-tighter truncate uppercase leading-none mb-2 group-hover/item:text-primary transition-colors">{m.store_name || 'Loja Sem Nome'}</p>
                          <div className="flex items-center gap-3">
                             <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-lg">{m.store_type || 'Geral'}</p>
                             <p className="text-[10px] font-bold text-slate-900 truncate">{m.store_phone || m.email}</p>
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-10 py-7">
                      <div className="space-y-3">
                         <div className="flex items-center gap-2">
                           <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/10 uppercase">COMISSÃO {m.commission_percent || appSettings.appCommission}%</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-xs text-slate-900">payments</span>
                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Serviço: R$ {(m.service_fee || appSettings.serviceFee).toString().replace('.', ',')}</p>
                         </div>
                      </div>
                    </td>

                    <td className="px-10 py-7 text-center">
                      <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 group-hover/row:border-primary/20 transition-all">
                        <div className={`size-2 rounded-full animate-pulse ${
                          m.status === 'active' || m.is_active ? 'bg-emerald-500' :
                          m.status === 'suspended' ? 'bg-amber-500' : 'bg-rose-500'
                        }`} />
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                          m.status === 'active' || m.is_active ? 'text-emerald-600 dark:text-emerald-400' :
                          m.status === 'suspended' ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {m.status === 'active' || m.is_active ? 'Ativo' : m.status === 'suspended' ? 'Suspenso' : 'Inativo'}
                        </span>
                      </div>
                    </td>

                    <td className="px-10 py-7 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-40 group-hover/row:opacity-100 transition-opacity">
                         <button 
                           onClick={() => { 
                             openMerchantPreview(m);
                             setEditingItem(m);
                             setEditType('merchant'); 
                           }}
                           className="size-11 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-900 hover:bg-primary hover:text-slate-900 transition-all shadow-sm flex items-center justify-center border border-transparent hover:border-primary/20"
                           title="Acessar Estúdio"
                         >
                           <span className="material-symbols-outlined text-xl">palette</span>
                         </button>
                         <button 
                           onClick={() => handleUpdateMerchantStatus(m.id, (m.status === 'active' || m.is_active) ? 'suspended' : 'active')}
                           className="size-11 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-900 hover:bg-amber-500 hover:text-white transition-all shadow-sm flex items-center justify-center"
                           title={m.is_active ? "Suspender" : "Ativar"}
                         >
                           <span className="material-symbols-outlined text-xl">{(m.status === 'active' || m.is_active) ? 'do_not_disturb_on' : 'verified'}</span>
                         </button>
                         <button 
                           onClick={() => handleDeleteMerchant(m.id)}
                           className="size-11 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all shadow-sm flex items-center justify-center border border-rose-100 dark:border-rose-500/20"
                           title="Excluir Lojista"
                         >
                           <span className="material-symbols-outlined text-xl">delete</span>
                         </button>
                      </div>
                    </td>
                  </motion.tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-10 py-20 text-center">
                       <div className="flex flex-col items-center gap-6 opacity-30">
                          <span className="material-symbols-outlined text-8xl">store_search</span>
                          <div>
                            <p className="text-xl font-black uppercase tracking-tighter">Nenhum lojista encontrado</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest mt-2">Tente ajustar seus filtros de busca</p>
                          </div>
                          <button onClick={() => { setSearchTerm(''); setFilterStatus('all'); }} className="px-6 py-3 bg-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-900 hover:text-primary transition-colors">Limpar Filtros</button>
                       </div>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
