import React, { useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';

export default function MerchantsTab() {
  const {
    merchantsList, isLoadingList, setEditingItem, setEditType, handleUpdateMerchantStatus, handleDeleteMerchant, openMerchantPreview, allOrders, appSettings, fetchMerchants, setActiveTab
  } = useAdmin();

  useEffect(() => {
    fetchMerchants();
  }, [fetchMerchants]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Gestão de Lojistas</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie os estabelecimentos parceiros da plataforma.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
        {isLoadingList && (
          <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Estabelecimento</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Financeiro</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {merchantsList.map(m => (
                <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div 
                      onClick={() => openMerchantPreview(m)}
                      className="flex items-center gap-4 cursor-pointer group/item hover:opacity-80 transition-all font-display"
                    >
                      <div className="size-12 rounded-[20px] bg-primary/20 flex items-center justify-center font-black text-primary border border-primary/10 overflow-hidden shrink-0 shadow-sm transition-transform text-2xl">
                        {m.store_logo ? <img className="w-full h-full object-cover" src={m.store_logo} alt={m.store_name} /> : <span className="material-symbols-outlined">storefront</span>}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-base dark:text-white tracking-tight truncate group-hover/item:text-primary transition-colors">{m.store_name || 'Loja Sem Nome'}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{m.store_phone || m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-100 dark:border-emerald-500/20">COMISSÃO {m.commission_percent || appSettings.appCommission}%</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TAXA SERV: R$ {(m.service_fee || appSettings.serviceFee).toString().replace('.', ',')}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${
                      m.status === 'active' || m.is_active
                      ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20'
                      : m.status === 'suspended'
                      ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                      : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/10'
                      }`}>
                      {m.status === 'active' || m.is_active ? 'Ativo' : m.status === 'suspended' ? 'Suspenso' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button onClick={() => { openMerchantPreview(m); setActiveTab('my_studio'); }} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-primary hover:text-slate-900 transition-all shadow-sm">
                        <span className="material-symbols-outlined text-lg">visibility</span>
                      </button>
                      <button onClick={() => { openMerchantPreview(m); setActiveTab('my_studio'); }} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-primary hover:text-slate-900 transition-all shadow-sm">
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button onClick={() => handleDeleteMerchant(m.id)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100">
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
