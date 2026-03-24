import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';

// Gestão de Lojistas
export default function MerchantsTab() {
  const {
    merchantsList, selectedMerchantPreview, setSelectedMerchantPreview, editingItem, setEditingItem, editType, setEditType, isSaving, handleUpdateMerchant, handleUpdateMerchantStatus, handleDeleteMerchant, openMerchantPreview, fetchMerchants, setActiveTab
  } = useAdmin();

  return (
  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
    <div>
      <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Gestão de Lojistas</h1>
      <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie os estabelecimentos parceiros da plataforma.</p>
    </div>
    <button 
      onClick={() => {
        setEditingItem({ role: 'merchant', is_active: true });
        setEditType('merchant');
      }}
      className="bg-primary text-slate-900 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:brightness-95 transition-all shadow-lg shadow-primary/20"
    >
      <span className="material-symbols-outlined text-lg">add_business</span>
      Novo Lojista
    </button>
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
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Administrativo</th>
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Financeiro</th>
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Vendas Totais</th>
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
                  className="flex items-center gap-4 cursor-pointer group/item hover:opacity-80 transition-all"
                >
                  <div className="size-12 rounded-[20px] bg-primary/20 flex items-center justify-center font-black text-primary border border-primary/10 overflow-hidden shrink-0 shadow-sm leading-none group-hover/item:scale-105 transition-transform text-2xl">
                    {m.store_logo ? <img className="w-full h-full object-cover" src={m.store_logo} /> : <span className="material-symbols-outlined">storefront</span>}
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-base dark:text-white tracking-tight truncate group-hover/item:text-primary transition-colors">{m.store_name || 'Loja Sem Nome'}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate group-hover/item:text-slate-500">{m.store_phone || m.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-8 py-6">
                <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{m.document || 'S/ DOCUMENTO'}</p>
                <p className="text-[10px] font-bold text-slate-400 truncate max-w-[150px]">{m.store_address || 'Endereço não informado'}</p>
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
                <p className="text-sm font-black text-slate-900 dark:text-white">R$ {allOrders.filter(o => o.merchant_id === m.id && o.status === 'concluido').reduce((sum, o) => sum + (o.total_price || 0), 0).toFixed(2).replace('.', ',')}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{allOrders.filter(o => o.merchant_id === m.id).length} pedidos</p>
              </td>
              <td className="px-8 py-6 text-center">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${
                  m.status === 'active' || m.is_active
                  ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20'
                  : m.status === 'suspended'
                  ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                  : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/10'
                  }`}>
                  <span className={`size-1.5 rounded-full ${
                    (m.status === 'active' || m.is_active) ? 'bg-green-500' : m.status === 'suspended' ? 'bg-amber-500' : 'bg-red-500'
                  }`}></span>
                  {m.status === 'suspended' ? 'Suspenso' : (m.status === 'active' || m.is_active ? 'Ativo' : 'Inativo')}
                </span>
              </td>
              <td className="px-8 py-6 text-right">
                <div className="flex items-center justify-end gap-2">
                  {m.store_phone && (
                    <button
                      onClick={() => window.open(`https://wa.me/55${m.store_phone.replace(/\D/g, '')}`, '_blank')}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-green-50 text-green-600 hover:bg-green-500 hover:text-white transition-all shadow-sm border border-green-100"
                      title="Contato WhatsApp"
                    >
                      <span className="material-symbols-outlined text-lg">forum</span>
                    </button>
                  )}
                  <button
                    onClick={() => openMerchantPreview(m)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-primary hover:text-slate-900 transition-all shadow-sm"
                    title="Visão do Usuário"
                  >
                    <span className="material-symbols-outlined text-lg">visibility</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditingItem(m);
                      setEditType('merchant');
                    }}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-primary hover:text-slate-900 transition-all shadow-sm"
                    title="Editar Lojista"
                  >
                    <span className="material-symbols-outlined text-lg">edit</span>
                  </button>
                  <button
                    onClick={() => handleUpdateMerchantStatus(m.id, m.status === 'active' ? 'inactive' : 'active')}
                    className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all shadow-sm ${
                      m.status === 'active' ? 'bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500' : 'bg-green-50 text-green-500 hover:bg-green-500 hover:text-white border border-green-100'
                    }`}
                    title={m.status === 'active' ? 'Desativar Acesso' : 'Ativar Acesso'}
                  >
                    <span className="material-symbols-outlined text-lg">{m.status === 'active' ? 'do_not_disturb_on' : 'check_circle'}</span>
                  </button>
                  <button
                    onClick={() => handleUpdateMerchantStatus(m.id, 'suspended')}
                    className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all shadow-sm ${
                      m.status === 'suspended' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-500 hover:bg-amber-500 hover:text-white border border-amber-100'
                    }`}
                    title="Suspender Temporariamente"
                  >
                    <span className="material-symbols-outlined text-lg">pause_circle</span>
                  </button>
                  <button
                    onClick={() => handleDeleteMerchant(m.id)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100"
                    title="Excluir Lojista"
                  >
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
            )}

  );
}
