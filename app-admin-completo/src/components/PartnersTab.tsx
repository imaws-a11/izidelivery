import React, { useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';
import { toastSuccess, toastError } from '../lib/useToast';
import type { PartnerStore } from '../lib/types';

export default function PartnersTab() {
  const {
    partnersList, isLoadingList, setEditingItem, setEditType, 
    handleUpdatePartnerStatus, handleDeletePartner, fetchPartners, setActiveTab
  } = useAdmin();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const filteredPartners = useMemo(() => {
    return partnersList.filter(p => {
      const matchesSearch = 
        (p.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.phone?.includes(searchTerm)) ||
        (p.address?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = 
        filterStatus === 'all' || 
        (filterStatus === 'active' && p.is_active) ||
        (filterStatus === 'inactive' && !p.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [partnersList, searchTerm, filterStatus]);

  const metrics = useMemo(() => {
    return {
      total: partnersList.length,
      active: partnersList.filter(p => p.is_active).length,
      inactive: partnersList.filter(p => !p.is_active).length,
    };
  }, [partnersList]);

  return (
    <div className="space-y-8 pb-20 italic">
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase mb-2">
            Rede Click & Retire
          </h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
             <span className="material-symbols-outlined text-sm text-primary">handshake</span>
             Gestão de Lojistas Parceiros e Pontos de Retirada
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
             onClick={() => {
                setEditingItem({
                  name: '',
                  address: '',
                  phone: '',
                  hours: '08h - 22h',
                  type: 'Ponto de Retirada',
                  is_active: true
                });
                setEditType('partner');
                setActiveTab('my_studio');
             }}
             className="h-16 px-10 bg-primary text-slate-900 rounded-[28px] shadow-2xl shadow-primary/30 flex items-center gap-3 hover:scale-105 active:scale-95 transition-all group overflow-hidden relative"
          >
             <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
             <span className="material-symbols-outlined font-black">add_location</span>
             <span className="text-[11px] font-black uppercase tracking-[0.2em] italic">Novo Parceiro</span>
          </button>
        </div>
      </div>

      {/* METRICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Parceiros', count: metrics.total, icon: 'hub', color: 'text-slate-600', bg: 'bg-slate-500/10' },
          { label: 'Pontos Ativos', count: metrics.active, icon: 'verified', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Pontos Inativos', count: metrics.inactive, icon: 'cancel', color: 'text-rose-500', bg: 'bg-rose-500/10' },
        ].map((m, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className={`p-6 rounded-[45px] border border-white/5 ${m.bg} shadow-[8px_8px_16px_rgba(0,0,0,0.05),-8px_-8px_16px_rgba(255,255,255,0.02),inset_4px_4px_8px_rgba(255,255,255,0.05)] flex items-center gap-5 transition-all hover:translate-y-[-4px]`}
          >
             <div className="size-14 rounded-3xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
                <span className={`material-symbols-outlined text-2xl font-black ${m.color}`}>{m.icon}</span>
             </div>
             <div>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none italic">{m.count}</h3>
                <p className={`text-[9px] font-black uppercase tracking-widest mt-1 opacity-60 ${m.color}`}>{m.label}</p>
             </div>
          </motion.div>
        ))}
      </div>

      {/* FILTERS & SEARCH */}
      <div className="bg-white dark:bg-slate-900/40 backdrop-blur-3xl rounded-[40px] border border-slate-200 dark:border-white/5 p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm">
         <div className="flex-1 w-full relative group">
            <span className="absolute left-6 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">search</span>
            <input 
              type="text"
              placeholder="Pesquise por nome, endereço ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-8 py-5 bg-slate-50 dark:bg-black/20 border-none rounded-[28px] text-sm font-bold focus:ring-2 focus:ring-primary/30 transition-all dark:text-white italic shrink-0"
            />
         </div>
         <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-black/20 rounded-[28px] border border-slate-200 dark:border-white/5">
            {[
              { id: 'all', label: 'Todos', icon: 'list_alt' },
              { id: 'active', label: 'Ativos', icon: 'check_circle' },
              { id: 'inactive', label: 'Inativos', icon: 'pause_circle' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterStatus(f.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-[24px] text-[10px] font-black uppercase tracking-widest transition-all ${
                  filterStatus === f.id 
                  ? 'bg-white dark:bg-slate-800 text-primary shadow-sm scale-105' 
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                <span className="material-symbols-outlined text-sm font-black">{f.icon}</span>
                {f.label}
              </button>
            ))}
         </div>
      </div>

      {/* TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-[54px] border border-slate-200 dark:border-white/5 shadow-2xl shadow-black/10 overflow-hidden relative group">
        <div className="absolute top-0 right-0 size-96 bg-primary/5 blur-[120px] rounded-full -mr-48 -mt-48 pointer-events-none" />
        
        {isLoadingList && (
          <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md z-40 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="size-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="text-[10px] font-black text-primary uppercase tracking-widest">Carregando Rede...</p>
            </div>
          </div>
        )}

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-black/20 border-b border-slate-100 dark:border-white/5">
                <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Parceiro</th>
                <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Localização</th>
                <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-center">Status</th>
                <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5 relative z-10">
              <AnimatePresence mode="popLayout">
                {filteredPartners.length > 0 ? filteredPartners.map((p) => (
                  <motion.tr 
                    key={p.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-all group/row"
                  >
                    <td className="px-10 py-7">
                      <div className="flex items-center gap-5">
                        <div className="size-16 rounded-3xl bg-primary/20 dark:bg-primary/10 border border-primary/10 flex items-center justify-center overflow-hidden transition-transform group-hover/row:scale-105 shadow-sm">
                           {p.logo_url ? (
                             <img src={p.logo_url} className="w-full h-full object-cover" />
                           ) : (
                             <span className="material-symbols-outlined text-primary text-3xl font-black">handshake</span>
                           )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-lg dark:text-white tracking-tighter truncate uppercase italic leading-none mb-2">{p.name || 'Parceiro Sem Nome'}</p>
                          <div className="flex items-center gap-3">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-lg">{p.type || 'Ponto de Retirada'}</p>
                             <p className="text-[10px] font-bold text-slate-500 truncate">{p.phone || p.email}</p>
                             {p.hours && <p className="text-[9px] font-bold text-primary/80 uppercase tracking-tight">{p.hours}</p>}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-10 py-7">
                      <div className="max-w-xs">
                        <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 line-clamp-2">{p.address}</p>
                        <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mt-1 italic">{p.city || 'SÃO PAULO - SP'}</p>
                      </div>
                    </td>

                    <td className="px-10 py-7 text-center">
                      <button 
                        onClick={() => handleUpdatePartnerStatus(p.id, !p.is_active)}
                        className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-full border transition-all ${
                          p.is_active 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                          : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                        }`}
                      >
                        <div className={`size-2 rounded-full animate-pulse ${p.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">
                          {p.is_active ? 'Disponível' : 'Inativo'}
                        </span>
                      </button>
                    </td>

                    <td className="px-10 py-7 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-40 group-hover/row:opacity-100 transition-opacity">
                         <button 
                           onClick={() => {
                             setEditingItem(p);
                             setEditType('partner');
                             setActiveTab('my_studio');
                           }}
                           className="size-11 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-primary hover:text-slate-900 transition-all shadow-sm flex items-center justify-center"
                           title="Editar Parceiro"
                         >
                           <span className="material-symbols-outlined text-xl">edit</span>
                         </button>
                         <button 
                           onClick={() => handleDeletePartner(p.id)}
                           className="size-11 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all shadow-sm flex items-center justify-center border border-rose-100 dark:border-rose-500/20"
                           title="Remover Parceiro"
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
                          <span className="material-symbols-outlined text-8xl">location_off</span>
                          <p className="text-xl font-black uppercase italic tracking-tighter">Nenhum parceiro encontrado</p>
                          <button onClick={() => { setSearchTerm(''); setFilterStatus('all'); }} className="px-6 py-3 bg-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary transition-colors">Limpar Filtros</button>
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
