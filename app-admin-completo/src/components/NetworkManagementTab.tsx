import React, { useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';
import { supabase } from '../lib/supabase';
import { toastSuccess, toastError } from '../lib/useToast';
import type { Merchant, PartnerStore } from '../lib/types';

type NetworkMember = {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: 'merchant_full' | 'merchant_avulso' | 'partner_point';
  status: 'active' | 'suspended' | 'inactive';
  is_active: boolean;
  address?: string;
  city?: string;
  logo?: string;
  commission_percent?: number;
  service_fee?: number;
  raw_data: any;
};

export default function NetworkManagementTab() {
  const {
    merchantsList, partnersList, isLoadingList, setEditingItem, setEditType, 
    handleUpdateMerchantStatus, handleDeleteMerchant, 
    handleUpdatePartnerStatus, handleDeletePartner,
    openMerchantPreview, appSettings, fetchMerchants, fetchPartners, establishmentTypes
  } = useAdmin();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'full' | 'avulso' | 'point'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended' | 'inactive'>('all');

  useEffect(() => {
    fetchMerchants();
    fetchPartners();
  }, [fetchMerchants, fetchPartners]);

  const unifiedList = useMemo(() => {
    const list: NetworkMember[] = [];

    // Add Merchants
    merchantsList.forEach(m => {
      const isAvulso = m.subscription_plan === 'avulso';
      list.push({
        id: m.id,
        name: m.store_name || 'Sem Nome',
        email: m.email || '',
        phone: m.store_phone || '',
        type: isAvulso ? 'merchant_avulso' : 'merchant_full',
        status: m.status === 'suspended' ? 'suspended' : (m.is_active ? 'active' : 'inactive'),
        is_active: m.is_active,
        address: m.store_address,
        logo: m.store_logo,
        commission_percent: m.commission_percent,
        service_fee: m.service_fee,
        raw_data: m
      });
    });

    // Add Partners (avoiding duplicates if avulso merchants are in both)
    partnersList.forEach(p => {
      if (list.some(item => item.id === p.id)) return;
      
      list.push({
        id: p.id,
        name: p.name || 'Sem Nome',
        email: p.email || '',
        phone: p.phone || '',
        type: 'partner_point',
        status: p.is_active ? 'active' : 'inactive',
        is_active: p.is_active,
        address: p.address,
        city: p.city,
        logo: p.logo_url,
        commission_percent: p.commission_percent,
        service_fee: p.service_fee,
        raw_data: p
      });
    });

    return list.filter(item => {
      const matchesSearch = 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.phone.includes(searchTerm) ||
        (item.address?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesType = 
        filterType === 'all' ||
        (filterType === 'full' && item.type === 'merchant_full') ||
        (filterType === 'avulso' && item.type === 'merchant_avulso') ||
        (filterType === 'point' && item.type === 'partner_point');

      const matchesStatus = 
        filterStatus === 'all' || 
        (filterStatus === 'active' && item.status === 'active') ||
        (filterStatus === 'suspended' && item.status === 'suspended') ||
        (filterStatus === 'inactive' && item.status === 'inactive');

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [merchantsList, partnersList, searchTerm, filterType, filterStatus]);

  const metrics = useMemo(() => {
    return {
      total: unifiedList.length,
      full: unifiedList.filter(i => i.type === 'merchant_full').length,
      avulso: unifiedList.filter(i => i.type === 'merchant_avulso').length,
      points: unifiedList.filter(i => i.type === 'partner_point').length
    };
  }, [unifiedList]);

  return (
    <div className="space-y-8 pb-20 italic">
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase mb-2">
            Gestão de Rede
          </h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
             <span className="material-symbols-outlined text-sm text-primary">hub</span>
             Ecossistema Unificado de Lojistas e Parceiros
          </p>
        </div>
        
        <div className="flex items-center gap-4">
           <button 
             onClick={async () => {
                const confirm = await window.confirm('Deseja sincronizar as credenciais de todos os lojistas? Isso garantirá que todos consigam fazer login.');
                if (!confirm) return;
                
                toastSuccess('Iniciando sincronização em massa...');
                let successCount = 0;
                let errorCount = 0;

                // Sincronizar apenas quem é Merchant (Lojista)
                const merchantsOnly = unifiedList.filter(i => i.type !== 'partner_point');

                for (const merchant of merchantsOnly) {
                  try {
                    const { data, error } = await supabase.functions.invoke('create-admin-user', {
                      body: {
                        email: merchant.email,
                        password: merchant.raw_data.password || 'Jnior19!',
                        role: 'merchant',
                        metadata: {
                          store_name: merchant.name
                        }
                      }
                    });

                    if (error || data?.error) {
                      console.error(`Erro ao sincronizar ${merchant.name}:`, error || data?.error);
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
             className="h-16 px-6 bg-slate-900 text-white rounded-[28px] shadow-xl flex items-center gap-3 hover:bg-slate-800 transition-all group"
             title="Reparar contas de acesso"
          >
             <span className="material-symbols-outlined font-black group-hover:rotate-180 transition-transform duration-500">sync</span>
             <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">Sincronizar Acessos</span>
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
             className="h-16 px-10 bg-primary text-slate-900 rounded-[28px] shadow-2xl shadow-primary/30 flex items-center gap-3 hover:scale-105 active:scale-95 transition-all group overflow-hidden relative"
          >
             <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
             <span className="material-symbols-outlined font-black">add_circle</span>
             <span className="text-[11px] font-black uppercase tracking-[0.2em] italic">Novo Membro</span>
          </button>
        </div>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Geral', count: metrics.total, icon: 'groups', color: 'text-slate-600', bg: 'bg-slate-500/10' },
          { label: 'Lojistas Full', count: metrics.full, icon: 'storefront', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Lojistas Avulso', count: metrics.avulso, icon: 'local_shipping', color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Pontos Coleta', count: metrics.points, icon: 'handshake', color: 'text-amber-500', bg: 'bg-amber-500/10' },
        ].map((m, i) => (
          <motion.div key={i} className={`p-6 rounded-[45px] border border-white/5 ${m.bg} shadow-sm flex items-center gap-5 transition-all hover:translate-y-[-4px]`}>
             <div className="size-14 rounded-3xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
                <span className={`material-symbols-outlined text-2xl font-black ${m.color}`}>{m.icon}</span>
             </div>
             <div>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic">{m.count}</h3>
                <p className={`text-[9px] font-black uppercase tracking-widest mt-1 opacity-60 ${m.color}`}>{m.label}</p>
             </div>
          </motion.div>
        ))}
      </div>

      {/* FILTERS */}
      <div className="bg-white dark:bg-slate-900/40 backdrop-blur-3xl rounded-[40px] border border-slate-200 dark:border-white/5 p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm">
         <div className="flex-1 w-full relative group">
            <span className="absolute left-6 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">search</span>
            <input 
              type="text"
              placeholder="Pesquise por nome, e-mail, telefone ou endereço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-8 py-5 bg-slate-50 dark:bg-black/20 border-none rounded-[28px] text-sm font-bold focus:ring-2 focus:ring-primary/30 transition-all dark:text-white italic"
            />
         </div>
         <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-100 dark:bg-black/20 rounded-[32px] border border-slate-200 dark:border-white/5">
            {[
              { id: 'all', label: 'Todos', icon: 'list_alt' },
              { id: 'full', label: 'Full', icon: 'storefront' },
              { id: 'avulso', label: 'Avulso', icon: 'local_shipping' },
              { id: 'point', label: 'Ponto', icon: 'handshake' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-[28px] text-[10px] font-black uppercase tracking-widest transition-all ${
                  filterType === f.id ? 'bg-white dark:bg-slate-800 text-primary shadow-sm scale-105' : 'text-slate-500'
                }`}
              >
                <span className="material-symbols-outlined text-sm font-black">{f.icon}</span>
                {f.label}
              </button>
            ))}
         </div>
      </div>

      {/* UNIFIED TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-[54px] border border-slate-200 dark:border-white/5 shadow-2xl shadow-black/10 overflow-hidden relative">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-black/20 border-b border-slate-100 dark:border-white/5">
                <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Estabelecimento</th>
                <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Tipo / Contrato</th>
                <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Localização</th>
                <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-center">Status</th>
                <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5 relative z-10">
              <AnimatePresence mode="popLayout">
                {unifiedList.map((member) => (
                  <motion.tr key={member.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-all group/row">
                    <td className="px-10 py-7">
                      <div className="flex items-center gap-5">
                        <div className="size-16 rounded-3xl bg-primary/20 dark:bg-primary/10 border border-primary/10 flex items-center justify-center overflow-hidden transition-transform group-hover/row:scale-105 shadow-sm">
                           {member.logo ? (
                             <img src={member.logo} className="w-full h-full object-cover" />
                           ) : (
                             <span className="material-symbols-outlined text-primary text-3xl font-black">
                                {member.type === 'partner_point' ? 'handshake' : 'storefront'}
                             </span>
                           )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-lg dark:text-white tracking-tighter truncate uppercase italic leading-none mb-2">{member.name}</p>
                          <p className="text-[10px] font-bold text-slate-500 truncate">{member.phone || member.email}</p>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-10 py-7">
                      <div className="flex flex-col gap-1">
                        <span className={`text-[9px] font-black px-3 py-1 rounded-full border italic uppercase inline-block w-fit ${
                          member.type === 'merchant_full' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                          member.type === 'merchant_avulso' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                          'bg-amber-500/10 border-amber-500/20 text-amber-500'
                        }`}>
                          {member.type === 'merchant_full' ? 'Marketplace' : 
                           member.type === 'merchant_avulso' ? 'Avulso (Logística)' : 
                           'Ponto de Coleta'}
                        </span>
                        {member.commission_percent !== undefined && (
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Comissão: {member.commission_percent}%</p>
                        )}
                      </div>
                    </td>

                    <td className="px-10 py-7">
                       <div className="max-w-xs">
                          <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 line-clamp-2">{member.address || 'Endereço não informado'}</p>
                          <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mt-1 italic">{member.city || 'SÃO PAULO - SP'}</p>
                       </div>
                    </td>

                    <td className="px-10 py-7 text-center">
                       <div className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10`}>
                        <div className={`size-2 rounded-full animate-pulse ${
                          member.status === 'active' ? 'bg-emerald-500' :
                          member.status === 'suspended' ? 'bg-amber-500' : 'bg-rose-500'
                        }`} />
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] italic ${
                          member.status === 'active' ? 'text-emerald-500' :
                          member.status === 'suspended' ? 'text-amber-500' : 'text-rose-500'
                        }`}>
                          {member.status === 'active' ? 'Ativo' : member.status === 'suspended' ? 'Suspenso' : 'Inativo'}
                        </span>
                      </div>
                    </td>

                    <td className="px-10 py-7 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-40 group-hover/row:opacity-100 transition-opacity">
                         <button 
                           onClick={() => { 
                             if (member.type === 'partner_point') {
                               setEditingItem(member.raw_data);
                               setEditType('partner');
                             } else {
                               openMerchantPreview(member.raw_data);
                               setEditingItem(member.raw_data);
                               setEditType('merchant'); 
                             }
                           }}
                           className="size-11 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-primary hover:text-slate-900 transition-all flex items-center justify-center shadow-sm"
                           title="Acessar Estúdio"
                         >
                           <span className="material-symbols-outlined text-xl">palette</span>
                         </button>
                         <button 
                           onClick={() => {
                             if (member.type === 'partner_point') {
                               handleUpdatePartnerStatus(member.id, !member.is_active);
                             } else {
                               handleUpdateMerchantStatus(member.id, member.is_active ? 'suspended' : 'active');
                             }
                           }}
                           className="size-11 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-amber-500 hover:text-white transition-all flex items-center justify-center"
                           title={member.is_active ? "Suspender" : "Ativar"}
                         >
                           <span className="material-symbols-outlined text-xl">{member.is_active ? 'do_not_disturb_on' : 'verified'}</span>
                         </button>
                         <button 
                           onClick={() => member.type === 'partner_point' ? handleDeletePartner(member.id) : handleDeleteMerchant(member.id)}
                           className="size-11 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center"
                           title="Excluir"
                         >
                           <span className="material-symbols-outlined text-xl">delete</span>
                         </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
