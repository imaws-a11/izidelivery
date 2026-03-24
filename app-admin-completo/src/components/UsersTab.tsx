import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';

// Gestão de Clientes
export default function UsersTab() {
  const {
    usersList, selectedUser, setSelectedUser, selectedUserStudio, setSelectedUserStudio, userStatusFilter, setUserStatusFilter, editingItem, setEditingItem, editType, setEditType, isSaving, walletTransactions, isWalletLoading, showAddCreditModal, setShowAddCreditModal, creditToAdd, setCreditToAdd, isAddingCredit, showWalletStatementModal, setShowWalletStatementModal, activeStudioTab, setActiveStudioTab, allOrders, showActiveOrdersModal, setShowActiveOrdersModal, handleUpdateUser, handleUpdateUserStatus, handleDeleteUser, handleApplyCredit, handleNotifyUser, handleResetPassword, handleAddCredit, fetchUsers, setActiveTab
  } = useAdmin();

  return (
  initial={{ opacity: 0, scale: 0.98 }}
  animate={{ opacity: 1, scale: 1 }}
  className="space-y-8"
>
  {/* Breadcrumbs */}
  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
    <button onClick={() => setSelectedUser(null)} className="hover:text-primary transition-colors">Clientes</button>
    <span className="material-symbols-outlined text-xs">chevron_right</span>
    <span className="text-slate-900 dark:text-white">Detalhes do Cliente</span>
  </div>

  {/* Profile Header */}
  <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
      <div className="flex items-center gap-8">
        <div className="size-24 md:size-32 rounded-[32px] border-4 border-slate-50 dark:border-slate-800 bg-primary/10 overflow-hidden shadow-inner shrink-0 leading-none">
          <img className="w-full h-full object-cover" src={`https://ui-avatars.com/api/?name=${selectedUser.name || 'U'}&background=ffd900&color=000&size=256&bold=true`} />
        </div>
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{selectedUser.name || 'Usuário Sem Nome'}</h1>
            <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${selectedUser.is_active
              ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20'
              : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/10'
              }`}>
              {selectedUser.is_active ? 'Ativo' : 'Bloqueado'}
            </span>
          </div>
          <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">ID: #{selectedUser.id.slice(0, 8)} • {selectedUser.phone || 'S/ Telefone'}</p>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Membro desde {new Date(selectedUser.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 w-full lg:w-auto">
        <button 
          onClick={async () => {
            const amount = await showPrompt('Digite o valor do crédito (ex: 50.00):');
            if (amount) handleApplyCredit(selectedUser.id, parseFloat(amount));
          }}
          className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 h-12 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-opacity shadow-lg shadow-emerald-500/20"
        >
          <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
          Add Crédito
        </button>
        <button 
          onClick={() => handleNotifyUser(selectedUser.id)}
          className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 h-12 bg-primary text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined text-lg">notifications</span>
          Notificar
        </button>
        <button 
          onClick={() => handleResetPassword(selectedUser.id)}
          className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 h-12 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">lock_reset</span>
          Senha
        </button>
        <button
          onClick={() => toggleUserStatus(selectedUser.id, selectedUser.is_active)}
          className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 h-12 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">{selectedUser.is_active ? 'block' : 'check_circle'}</span>
          {selectedUser.is_active ? 'Bloquear' : 'Ativar'}
        </button>
        <button onClick={() => setSelectedUser(null)} className="lg:hidden w-full px-6 h-12 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Voltar</button>
      </div>
    </div>
  </div>

   {/* Stats Grid */}
   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
     {[
       { label: 'Total Gasto', val: `R$ ${allOrders.filter(o => o.user_id === selectedUser.id && o.status === 'concluido').reduce((sum, o) => sum + (o.total_price || 0), 0).toFixed(2).replace('.', ',')}`, icon: 'payments', trend: 'LTV', color: 'text-emerald-500' },
       { label: 'Saldo Carteira', val: `R$ ${(selectedUser.wallet_balance || 0).toFixed(2).replace('.', ',')}`, icon: 'account_balance_wallet', trend: 'Disponível', color: 'text-emerald-600' },
       { label: 'Pedidos Totais', val: allOrders.filter(o => o.user_id === selectedUser.id).length, icon: 'shopping_bag', trend: 'Histórico', color: 'text-primary' },
       { label: 'Pedidos Ativos', val: allOrders.filter(o => o.user_id === selectedUser.id && !['concluido', 'cancelado'].includes(o.status)).length, icon: 'pending_actions', trend: 'Em aberto', color: 'text-blue-500' },
     ].map((s, i) => (
       <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm group">
         <div className="flex justify-between items-start mb-4">
           <span className={`material-symbols-outlined ${s.color} p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl transition-colors`}>{s.icon}</span>
           <span className="text-[9px] font-black text-slate-400 border border-slate-100 dark:border-slate-800 px-2 py-1 rounded-full">{s.trend}</span>
         </div>
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{s.label}</p>
         <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-2 tracking-tighter">{s.val}</h3>
       </div>
     ))}
   </div>

  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    {/* Left Column: Personal Info */}
    <div className="lg:col-span-1 space-y-8">
      <section className="bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 -mr-16 -mt-16 rounded-full blur-3xl"></div>
        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">person</span>
          Informações Pessoais
        </h3>
        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome de Cadastro</label>
            <p className="text-slate-900 dark:text-slate-200 font-black text-base mt-1 tracking-tight">{selectedUser.name || '---'}</p>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Telefone de Contato</label>
            <p className="text-slate-900 dark:text-slate-200 font-black text-base mt-1 tracking-tight">{selectedUser.phone || 'S/ Telefone'}</p>
          </div>
          {selectedUser.email && (
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">E-mail</label>
              <p className="text-slate-900 dark:text-slate-200 font-black text-base mt-1 tracking-tight">{selectedUser.email}</p>
            </div>
          )}
          {selectedUser.cpf && (
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CPF</label>
              <p className="text-slate-900 dark:text-slate-200 font-black text-base mt-1 tracking-tight">{selectedUser.cpf}</p>
            </div>
          )}
          {selectedUser.birth_date && (
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data de Nascimento</label>
              <p className="text-slate-900 dark:text-slate-200 font-black text-base mt-1 tracking-tight">{new Date(selectedUser.birth_date).toLocaleDateString('pt-BR')}</p>
            </div>
          )}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Endereço Principal</label>
            {selectedUser.address || selectedUser.zip_code ? (
              <div className="mt-1 space-y-0.5">
                <p className="text-slate-900 dark:text-slate-200 font-bold text-sm leading-relaxed">
                  {selectedUser.address}{selectedUser.address_number ? `, ${selectedUser.address_number}` : ''}{selectedUser.address_complement ? ` - ${selectedUser.address_complement}` : ''}
                </p>
                <p className="text-slate-600 dark:text-slate-400 font-bold text-sm">
                  {[selectedUser.neighborhood, selectedUser.city, selectedUser.state].filter(Boolean).join(' - ')}
                </p>
                {selectedUser.zip_code && (
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">CEP: {selectedUser.zip_code}</p>
                )}
              </div>
            ) : (
              <p className="text-slate-600 dark:text-slate-400 font-bold text-sm mt-1 leading-relaxed italic">Endereço não cadastrado.</p>
            )}
          </div>
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setSelectedUserStudio(selectedUser)}
              className="text-primary hover:text-slate-900 transition-colors text-[10px] font-black uppercase tracking-widest flex items-center gap-2 group"
            >
              Editar Informações
              <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">arrow_forward</span>
            </button>
          </div>
        </div>
      </section>

      {/* Izi Black Management Section */}
      <section className={`bg-white dark:bg-slate-900 rounded-[40px] p-8 border-2 shadow-sm relative overflow-hidden transition-all ${selectedUser.is_izi_black ? 'border-primary shadow-primary/10' : 'border-slate-100 dark:border-slate-800'}`}>
        <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full blur-3xl ${selectedUser.is_izi_black ? 'bg-primary/20' : 'bg-slate-500/5'}`}></div>
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <span className={`material-symbols-outlined ${selectedUser.is_izi_black ? 'text-primary' : 'text-slate-300'}`}>workspace_premium</span>
            Programa Izi Black
          </h3>
          <div 
            onClick={() => toggleIziBlack(selectedUser.id, !!selectedUser.is_izi_black)}
            className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors flex items-center ${selectedUser.is_izi_black ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
          >
            <div className={`size-4 bg-white rounded-full shadow-sm transition-transform ${selectedUser.is_izi_black ? 'translate-x-6' : 'translate-x-0'}`}></div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status de Fidelidade</p>
            <p className={`text-sm font-black uppercase tracking-widest ${selectedUser.is_izi_black ? 'text-primary' : 'text-slate-500'}`}>
              {selectedUser.is_izi_black ? 'MEMBRO VIP ATIVO' : 'CLIENTE REGULAR'}
            </p>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cashback Acumulado</label>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">R$ {(selectedUser.cashback_earned || 0).toFixed(2).replace('.', ',')}</p>
              <button 
                onClick={async () => {
                  const newVal = await showPrompt('Digite o novo valor do cashback:');
                  if (newVal !== null) {
                    const { error } = await supabase.from('users_delivery').update({ cashback_earned: parseFloat(newVal) }).eq('id', selectedUser.id);
                    if (!error) {
                      toastSuccess('Cashback atualizado!');
                      fetchUsers();
                      setSelectedUser({ ...selectedUser, cashback_earned: parseFloat(newVal) });
                    }
                  }
                }}
                className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
              </button>
            </div>
          </div>

          {selectedUser.is_izi_black && (
            <div className="pt-4 space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Benefícios VIP aplicados
              </div>
            </div>
          )}
        </div>
      </section>
    </div>

    {/* Right Column: History */}
    <div className="lg:col-span-2 space-y-8">
       {/* Active Orders */}
       <section className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
         <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
           <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
             <span className="material-symbols-outlined text-primary">pending_actions</span>
             Pedidos Ativos ({allOrders.filter(o => o.user_id === selectedUser.id && !['concluido', 'cancelado'].includes(o.status)).length})
           </h3>
         </div>
         <div className="divide-y divide-slate-50 dark:divide-slate-800">
           {allOrders.filter(o => o.user_id === selectedUser.id && !['concluido', 'cancelado'].includes(o.status)).length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center px-10">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-300 dark:text-slate-600 mb-4">
                  <span className="material-symbols-outlined text-3xl">shopping_cart_off</span>
                </div>
                <p className="text-sm font-bold text-slate-500">Nenhum pedido em andamento no momento.</p>
              </div>
           ) : (
             allOrders.filter(o => o.user_id === selectedUser.id && !['concluido', 'cancelado'].includes(o.status)).map((o, idx) => (
               <div key={idx} className="flex items-center justify-between px-8 py-5 hover:bg-slate-50 transition-colors">
                 <div className="flex items-center gap-4">
                    <div className="size-10 rounded-2xl bg-amber-50 flex items-center justify-center">
                      <span className="material-symbols-outlined text-amber-500">pending</span>
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 mt-1">Pedido #DT-{o.id.slice(0, 4).toUpperCase()}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{o.status}</p>
                    </div>
                 </div>
                 <p className="text-sm font-black text-slate-900">R$ {o.total_price.toFixed(2).replace('.', ',')}</p>
               </div>
             ))
           )}
         </div>
       </section>

      {/* History Table */}
      <section className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">history</span>
            Histórico de Pedidos
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">ID Pedido</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Data</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Total</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {allOrders.filter(o => o.user_id === selectedUser.id).length === 0 ? (
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                  <td colSpan={5} className="px-8 py-10 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhum registro encontrado</td>
                </tr>
              ) : (
                allOrders.filter(o => o.user_id === selectedUser.id).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((o, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group">
                    <td className="px-8 py-5">
                      <p className="text-sm font-black text-slate-900 dark:text-white">#DT-{o.id.slice(0, 4).toUpperCase()}</p>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-xs font-bold text-slate-500">{new Date(o.created_at).toLocaleDateString('pt-BR')}</p>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        o.status === 'concluido' ? 'bg-green-50 text-green-700 border-green-100' :
                        o.status === 'cancelado' ? 'bg-red-50 text-red-700 border-red-100' :
                        'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right font-black text-slate-900 dark:text-white">
                      R$ {(o.total_price || 0).toFixed(2).replace('.', ',')}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={() => setActiveTab('orders')}
                        className="material-symbols-outlined text-slate-400 hover:text-primary transition-colors"
                      >
                        visibility
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</motion.div>
            )}

            {activeTab === 'users' && !selectedUser && (
<div className="space-y-8">
  {/* Page Title & Main Actions */}
  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
    <div>
      <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Gestão de Clientes</h1>
      <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie sua base de usuários e visualize métricas de engajamento.</p>
    </div>
    <div className="flex items-center gap-3">
      <button className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors shadow-sm">
        <span className="material-symbols-outlined text-lg">download</span>
        Exportar CSV
      </button>
      <button 
        onClick={() => setSelectedUserStudio({ id: `new-${Date.now()}`, name: '', phone: '', email: '', is_active: true, status: 'active' })}
        className="bg-primary text-slate-900 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:brightness-95 transition-all shadow-lg shadow-primary/20"
      >
        <span className="material-symbols-outlined text-lg">add</span>
        Novo Cliente
      </button>
    </div>
  </div>

  {/* Metrics Overview */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {[
      { label: 'Total de Clientes', val: stats.users, trend: '+0%', color: 'text-primary' },
      { label: 'Clientes Ativos', val: usersList.filter(u => u.is_active).length, trend: '+0%', color: 'text-green-500' },
      { label: 'Novos este mês', val: usersList.filter(u => new Date(u.created_at).getMonth() === new Date().getMonth()).length, trend: 'Meta: 1k', color: 'text-blue-500' },
      { label: 'LTV Médio', val: 'R$ 0,00', trend: '+0%', color: 'text-emerald-500' },
    ].map((m, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.1 }}
        className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm"
      >
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{m.label}</p>
        <div className="flex items-baseline gap-3 mt-4">
          <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{m.val}</h3>
          <span className={`${m.color} text-[10px] font-black px-2 py-0.5 rounded-full border border-current opacity-80`}>{m.trend}</span>
        </div>
      </motion.div>
    ))}
  </div>

  {/* Filters */}
  <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-6">
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status:</span>
      <select 
        value={userStatusFilter}
        onChange={(e) => setUserStatusFilter(e.target.value as any)}
        className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs font-black uppercase tracking-widest focus:ring-primary py-3 px-6 cursor-pointer"
      >
        <option value="all">Todos</option>
        <option value="active">Ativos</option>
        <option value="suspended">Suspensos</option>
        <option value="inactive">Inativos</option>
      </select>
    </div>
    <div className="h-8 w-px bg-slate-100 dark:bg-slate-800"></div>
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Período:</span>
      <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-2 border border-slate-100 dark:border-slate-700">
        <span className="material-symbols-outlined text-sm text-slate-400">calendar_today</span>
        <input className="bg-transparent border-none text-xs font-bold focus:ring-0 p-0 w-24" type="date" />
        <span className="text-slate-400 text-[10px] font-black">ATÉ°</span>
        <input className="bg-transparent border-none text-xs font-bold focus:ring-0 p-0 w-24" type="date" />
      </div>
    </div>
    <button className="ml-auto text-[10px] font-black text-primary hover:underline uppercase tracking-widest">Limpar Filtros</button>
  </div>

  {/* Customers Table */}
  <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
    {isLoadingList && (
      <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    )}
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Nome do Cliente</th>
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Data de Registro</th>
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Total Pedidos</th>
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">LTV</th>
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Saldo</th>
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {usersList.filter(u => {
            if (userStatusFilter === 'all') return true;
            if (userStatusFilter === 'active') return u.status === 'active' || u.is_active;
            return u.status === userStatusFilter;
          }).map(u => (
            <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
              <td className="px-8 py-6">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-[20px] bg-primary/20 flex items-center justify-center font-black text-primary border border-primary/10 overflow-hidden shrink-0 shadow-sm">
                    <img className="w-full h-full object-cover" src={`https://ui-avatars.com/api/?name=${u.name || 'U'}&background=ffd90033&color=ffd900&size=128&bold=true`} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-base dark:text-white tracking-tight truncate">{u.name || 'Usuário Sem Nome'}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{u.phone || 'S/ Telefone'}</p>
                  </div>
                </div>
              </td>
              <td className="px-8 py-6 text-xs font-bold text-slate-500 uppercase tracking-widest">
                {new Date(u.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
              </td>
               <td className="px-8 py-6 text-sm font-black text-center text-slate-900 dark:text-white">
                {allOrders.filter(o => o.user_id === u.id).length}
              </td>
              <td className="px-8 py-6 text-sm font-black text-right text-primary">
                R$ {allOrders.filter(o => o.user_id === u.id && o.status === 'concluido').reduce((sum, o) => sum + (o.total_price || 0), 0).toFixed(2).replace('.', ',')}
              </td>
              <td className="px-8 py-6 text-sm font-black text-right text-emerald-600">
                 R$ {(u.wallet_balance || 0).toFixed(2).replace('.', ',')}
               </td>
               <td className="px-8 py-6 text-center">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${
                  u.status === 'active' || u.is_active
                  ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20'
                  : u.status === 'suspended'
                  ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                  : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/10'
                  }`}>
                  <span className={`size-1.5 rounded-full ${
                    (u.status === 'active' || u.is_active) ? 'bg-green-500' : u.status === 'suspended' ? 'bg-amber-500' : 'bg-red-500'
                  }`}></span>
                  {u.status === 'suspended' ? 'Suspenso' : (u.status === 'active' || u.is_active ? 'Ativo' : 'Inativo')}
                </span>
              </td>
              <td className="px-8 py-6 text-right">
                <div className="flex items-center justify-end gap-2">
                  {u.phone && (
                    <button
                      onClick={() => window.open(`https://wa.me/55${u.phone.replace(/\D/g, '')}`, '_blank')}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-green-50 text-green-600 hover:bg-green-500 hover:text-white transition-all shadow-sm border border-green-100"
                      title="Contato WhatsApp"
                    >
                      <span className="material-symbols-outlined text-lg">forum</span>
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedUser(u)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-primary hover:text-slate-900 transition-all shadow-sm"
                    title="Ver Detalhes"
                  >
                    <span className="material-symbols-outlined text-lg">visibility</span>
                  </button>
                  <button
                    onClick={() => setSelectedUserStudio(u)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 transition-all shadow-sm"
                    title="Editar Cliente"
                  >
                    <span className="material-symbols-outlined text-lg">edit</span>
                  </button>
                  <button
                    onClick={() => handleUpdateUserStatus(u.id, (u.status === 'active' || u.is_active) ? 'inactive' : 'active')}
                    className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all shadow-sm ${
                      (u.status === 'active' || u.is_active) ? 'bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500' : 'bg-green-50 text-green-500 hover:bg-green-500 hover:text-white border border-green-100'
                    }`}
                    title={(u.status === 'active' || u.is_active) ? 'Bloquear Acesso' : 'Ativar Acesso'}
                  >
                    <span className="material-symbols-outlined text-lg">{(u.status === 'active' || u.is_active) ? 'do_not_disturb_on' : 'check_circle'}</span>
                  </button>
                  <button
                    onClick={() => handleUpdateUserStatus(u.id, 'suspended')}
                    className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all shadow-sm ${
                      u.status === 'suspended' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-500 hover:bg-amber-500 hover:text-white border border-amber-100'
                    }`}
                    title="Suspender Temporariamente"
                  >
                    <span className="material-symbols-outlined text-lg">pause_circle</span>
                  </button>
                  <button
                    onClick={() => handleDeleteUser(u.id)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100"
                    title="Excluir Cliente"
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

    {/* Pagination */}
    <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Exibindo {usersList.length} de {stats.users} clientes</p>
      <div className="flex items-center gap-2">
        <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-sm">chevron_left</span>
        </button>
        <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-slate-900 font-black text-xs">1</button>
        <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-sm">chevron_right</span>
        </button>
      </div>
    </div>
  </div>
</div>
            )}

  );
}
