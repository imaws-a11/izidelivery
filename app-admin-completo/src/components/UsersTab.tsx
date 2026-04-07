import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';
import { supabase } from '../lib/supabase';
import { toastSuccess, toastError } from '../lib/useToast';
import { uploadToCloudinary } from '../lib/cloudinary';

export default function UsersTab() {
  const {
    usersList, stats, fetchUsers, handleUpdateUserStatus, handleDeleteUser, isLoadingList
  } = useAdmin();

  const [iziCoinRate, setIziCoinRate] = useState(1.0);
  const [userTransactions, setUserTransactions] = useState<any[]>([]);
  const [userOrdersStats, setUserOrdersStats] = useState({ total: 0, spent: 0 });
  
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [editForm, setEditForm] = useState<any>(null);
  const [isEditingWallet, setIsEditingWallet] = useState(false);
  const [walletType, setWalletType] = useState('add');
  const [walletAmount, setWalletAmount] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync edit form and fetch extra data when user is selected
  React.useEffect(() => {
    if (selectedUser) {
      setEditForm({
        name: selectedUser.name || '',
        email: selectedUser.email || '',
        phone: selectedUser.phone || '',
        cpf: selectedUser.cpf || '',
        password: selectedUser.password || '',
        avatar_url: selectedUser.avatar_url || '',
        status: selectedUser.status || 'active',
        is_izi_black: selectedUser.is_izi_black || false
      });
      fetchUserExtraData(selectedUser.id);
    } else {
      setEditForm(null);
      setUserTransactions([]);
      setUserOrdersStats({ total: 0, spent: 0 });
    }
  }, [selectedUser]);

  const fetchUserExtraData = async (userId: string) => {
    // 1. Fetch Transactions
    const { data: txs } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);
    if (txs) setUserTransactions(txs);

    // 2. Fetch Orders Stats
    const { data: orders } = await supabase
      .from('orders_delivery')
      .select('total_price')
      .eq('user_id', userId)
      .eq('status', 'concluido');
    
    if (orders) {
      const total = orders.length;
      const spent = orders.reduce((sum, o) => sum + (o.total_price || 0), 0);
      setUserOrdersStats({ total, spent });
    }
  };

  const handleWalletUpdate = async () => {
    if (!selectedUser || !walletAmount) return;
    
    try {
      const amount = parseFloat(walletAmount);
      if (isNaN(amount)) {
         throw new Error("O valor inserido é inválido.");
      }

      let newBalance = selectedUser.izi_coins ? Number(selectedUser.izi_coins) : 0;
      let diff = amount;
      
      if (walletType === 'add') {
        newBalance += amount;
      } else {
        diff = amount - newBalance;
        newBalance = amount;
      }

      // 1. Update User Balance
      const { error: updateError } = await supabase
        .from('users_delivery')
        .update({ izi_coins: newBalance })
        .eq('id', selectedUser.id);

      if (updateError) {
         console.error('DB Update Error:', updateError);
         throw new Error(`DB Update: ${updateError.message || updateError.details}`);
      }

      // 2. Log Transaction for Audit
      const { error: insertError } = await supabase.from('wallet_transactions').insert({
        user_id: selectedUser.id,
        amount: diff,
        type: diff >= 0 ? 'deposito' : 'saque',
        description: `Ajuste manual via Painel Admin (${walletType === 'add' ? 'Adição' : 'Definição'})`
      });
      
      if (insertError) {
         console.error('DB Insert Error:', insertError);
         throw new Error(`Auditoria falhou: ${insertError.message || insertError.details}`);
      }
      
      toastSuccess('Carteira atualizada e registrada com sucesso!');
      setSelectedUser({ ...selectedUser, izi_coins: newBalance });
      setWalletAmount('');
      setIsEditingWallet(false);
      fetchUsers();
      fetchUserExtraData(selectedUser.id);
    } catch (err: any) {
      console.error('Wallet Update Error:', err);
      toastError(`Falha na atualização: ${err?.message || JSON.stringify(err)}`);
    }
  };

  const handleSaveProfile = async () => {
    if (!selectedUser || !editForm) return;
    setIsSavingProfile(true);
    
    try {
      const isNew = selectedUser.id === 'new';
      const userData = {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        cpf: editForm.cpf,
        password: editForm.password,
        avatar_url: editForm.avatar_url,
        status: editForm.status || 'active',
        is_izi_black: editForm.is_izi_black || false
      };

      let error;
      if (isNew) {
        const { error: insError, data: insData } = await supabase
          .from('users_delivery')
          .insert([userData])
          .select()
          .single();
        error = insError;
        if (insData) {
          setSelectedUser(insData);
        }
      } else {
        const { error: updError } = await supabase
          .from('users_delivery')
          .update(userData)
          .eq('id', selectedUser.id);
        error = updError;
      }

      if (error) throw error;
      
      toastSuccess(isNew ? 'Usuário criado com sucesso!' : 'Perfil do cliente atualizado com sucesso!');
      if (!isNew) setSelectedUser({ ...selectedUser, ...editForm });
      fetchUsers();
    } catch (err: any) {
      toastError('Erro ao salvar perfil: ' + err.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toastSuccess('Iniciando upload da foto...');
      const url = await uploadToCloudinary(file);
      if (url) {
        setEditForm({ ...editForm, avatar_url: url });
        toastSuccess('Foto carregada com sucesso!');
      } else {
        throw new Error('Falha no upload');
      }
    } catch (err) {
      toastError('Erro ao carregar foto');
    }
  };

  const toggleIziBlack = async (user: any) => {
    try {
      const { error } = await supabase
        .from('users_delivery')
        .update({ is_izi_black: !user.is_izi_black })
        .eq('id', user.id);

      if (error) throw error;
      toastSuccess(user.is_izi_black ? 'Izi Black removido' : 'Izi Black ativado!');
      if (selectedUser?.id === user.id) setSelectedUser({ ...selectedUser, is_izi_black: !user.is_izi_black });
      fetchUsers();
    } catch (err) {
      toastError('Erro ao atualizar status VIP');
    }
  };



  return (
    <div className="space-y-10 pb-20">
      {/* Header Studio */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">
            Estúdio de <span className="text-primary">Clientes</span>
          </h1>
          <p className="text-slate-500 font-bold text-sm mt-1 uppercase tracking-widest">
            Gerenciamento avançado de comportamento e fidelidade
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
               <div className="text-center px-4">
                   <p className="text-[9px] font-black text-slate-400 uppercase">Total Base</p>
                   <p className="text-lg font-black text-slate-900 dark:text-white">{stats.users}</p>
               </div>
               <div className="w-[1px] h-8 bg-slate-200 dark:bg-slate-800" />
               <div className="text-center px-4">
                   <p className="text-[9px] font-black text-slate-400 uppercase">VIP Black</p>
                   <p className="text-lg font-black text-primary">{usersList.filter(u => u.is_izi_black).length}</p>
               </div>
          </div>
          <button 
            onClick={() => {
              setSelectedUser({ id: 'new', name: '', email: '', phone: '', cpf: '', izi_coins: 0, status: 'active', is_izi_black: false });
              setActiveTab('settings');
            }}
            className="h-[72px] px-8 bg-primary hover:bg-primary/90 text-slate-900 rounded-3xl font-black text-[12px] uppercase tracking-widest transition-all shadow-xl shadow-primary/20 flex items-center gap-3 active:scale-95"
          >
            <span className="material-symbols-outlined text-2xl">person_add</span>
            Novo Usuário
          </button>
        </div>
      </div>

      {/* Grid de Clientes con Design Visual */}
      {/* Filtros e Busca */}
      <div className="flex flex-col md:flex-row gap-6 mb-10">
          <div className="flex-1 relative group">
              <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
              <input 
                type="text" 
                placeholder="Pesquisar por nome, email ou CPF..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border-none rounded-[28px] py-6 pl-16 pr-8 font-black text-sm italic focus:ring-4 ring-primary/10 transition-all shadow-sm"
              />
          </div>
          <div className="flex gap-2 p-2 bg-white dark:bg-slate-900 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm">
              {[
                  { id: 'all', label: 'Todos', icon: 'groups' },
                  { id: 'izi_black', label: 'Black', icon: 'workspace_premium' },
                  { id: 'active', label: 'Ativos', icon: 'check_circle' },
                  { id: 'suspended', label: 'Suspensos', icon: 'block' },
              ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFilterType(f.id)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === f.id ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <span className="material-symbols-outlined text-lg">{f.icon}</span>
                    {f.label}
                  </button>
              ))}
          </div>
      </div>

      <div className="relative">
        {isLoadingList && (
          <div className="absolute inset-x-0 -top-4 flex justify-center z-10">
             <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-2 rounded-full shadow-xl flex items-center gap-3">
                  <div className="size-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sincronizando...</span>
             </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {usersList
            .filter(u => {
                const matchesSearch = !searchTerm || 
                    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    u.cpf?.includes(searchTerm);
                
                if (filterType === 'izi_black') return matchesSearch && u.is_izi_black;
                if (filterType === 'active') return matchesSearch && u.status === 'active';
                if (filterType === 'suspended') return matchesSearch && u.status === 'suspended';
                return matchesSearch;
            })
            .map((user, i) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedUser(user)}
              className="bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:border-primary transition-all group cursor-pointer relative overflow-hidden"
            >
              {user.is_izi_black && (
                  <div className="absolute top-6 right-6 flex items-center gap-1 bg-primary px-3 py-1 rounded-full text-[9px] font-black text-slate-900 uppercase italic shadow-lg">
                      <span className="material-symbols-outlined text-xs">workspace_premium</span>
                      Black
                  </div>
              )}

              <div className="flex items-center gap-6 mb-8">
                   <div className="size-20 rounded-[30px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-slate-50 dark:border-slate-700 overflow-hidden relative">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} className="size-full object-cover group-hover:scale-110 transition-transform" />
                        ) : (
                          <span className="text-2xl font-black text-slate-400 grayscale group-hover:scale-110 transition-transform">{user.name?.charAt(0) || 'U'}</span>
                        )}
                        <div className={`absolute bottom-0 right-0 size-5 rounded-full border-4 border-white dark:border-slate-900 ${user.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                   </div>
                   <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase truncate max-w-[150px]">{user.name || 'Sem Nome'}</h3>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{user.phone || 'Sem telefone'}</p>
                   </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                   <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Carteira IZI</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white italic"><span className="izi-coin-symbol">Z</span> {(user.izi_coins || 0).toLocaleString('pt-BR')}</p>
                   </div>
                   <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                        <p className={`text-[10px] font-black uppercase italic ${user.status === 'active' ? 'text-emerald-500' : 'text-rose-500'}`}>{user.status || 'active'}</p>
                   </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-slate-800">
                   <div className="flex gap-2">
                        <button className="size-10 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-xl flex items-center justify-center hover:bg-primary hover:text-slate-900 transition-all">
                             <span className="material-symbols-outlined text-lg">mail</span>
                        </button>
                        <button className="size-10 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-xl flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all">
                             <span className="material-symbols-outlined text-lg">chat</span>
                        </button>
                   </div>
                   <button className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest group-hover:bg-primary group-hover:text-slate-900 transition-all">
                        Abrir Studio
                   </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Customer Studio Interface (Modal/Drawer) */}
      <AnimatePresence>
        {selectedUser && editForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-md p-4"
            onClick={() => setSelectedUser(null)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-3xl h-full bg-slate-50 dark:bg-slate-950 rounded-[48px] shadow-2xl relative overflow-y-auto flex flex-col p-8 md:p-12 border-l border-white/5"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedUser(null)}
                className="absolute top-10 right-10 size-12 bg-white/5 text-white rounded-full flex items-center justify-center hover:bg-white/10 transition-all"
              >
                <span className="material-symbols-outlined font-black">close</span>
              </button>

              {/* Profile Header Editor */}
              <div className="flex flex-col md:flex-row items-center gap-10 mb-12">
                   <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="shrink-0 size-32 rounded-[48px] bg-slate-200 dark:bg-slate-900 border-4 border-primary/20 flex items-center justify-center text-5xl font-black text-slate-400 grayscale cursor-pointer hover:border-primary transition-all overflow-hidden group relative"
                   >
                        {editForm.avatar_url ? (
                          <img src={editForm.avatar_url} className="size-full object-cover" />
                        ) : (
                          editForm.name?.charAt(0) || 'U'
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                             <span className="material-symbols-outlined text-white text-3xl">upload</span>
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                   </div>
                   <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                             <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">{editForm.name || 'Sem Nome'}</h2>
                             {selectedUser.is_izi_black && <span className="bg-primary text-slate-900 px-3 py-1 rounded-full text-[10px] font-black uppercase italic shadow-lg shadow-primary/20">VIP Black</span>}
                        </div>
                        <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mb-6">{editForm.email}</p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-3">
                             <button onClick={() => toggleIziBlack(selectedUser)} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedUser.is_izi_black ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-primary text-slate-900 shadow-xl shadow-primary/20 hover:scale-105'}`}>
                                  {selectedUser.is_izi_black ? 'Remover Izi Black' : 'Promover a Izi Black'}
                             </button>
                             <button onClick={() => handleUpdateUserStatus(selectedUser.id, selectedUser.status === 'active' ? 'inactive' : 'active')} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${selectedUser.status === 'active' ? 'border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white' : 'border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}>
                                  {selectedUser.status === 'active' ? 'Suspender Conta' : 'Reativar Conta'}
                             </button>
                        </div>
                   </div>
              </div>

              {/* Grid of Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    {/* Wallet Studio - Claymorphism Redesign */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 relative overflow-hidden flex flex-col min-h-[500px]">
                         <div className="flex items-center justify-between mb-8">
                              <div className="flex items-center gap-3">
                                <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary font-black">wallet</span>
                                </div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest italic">Carteira IZI</h3>
                              </div>
                              <div className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Auditado v2</span>
                              </div>
                         </div>

                         <div className="mb-6 text-center md:text-left">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Crédito em IZI Coins</p>
                             <div className="flex flex-col md:flex-row md:items-baseline gap-2">
                                 <h4 className="text-6xl font-black text-slate-900 dark:text-white italic tracking-tighter">
                                     <span className="izi-coin-symbol">Z</span> {Number(selectedUser.izi_coins || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 8 })}
                                 </h4>
                                 <p className="text-sm font-black text-emerald-500 italic opacity-80">~ R$ {(Number(selectedUser.izi_coins || 0) * iziCoinRate).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                             </div>
                         </div>

                         {/* Histórico Simplificado (Recent Transactions) */}
                         <div className="mb-8 space-y-3">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Últimas Movimentações</p>
                             {userTransactions.length > 0 ? (
                                 userTransactions.map((tx, idx) => (
                                     <div key={tx.id || idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/50">
                                         <div className="flex items-center gap-3">
                                             <div className={`size-8 rounded-lg flex items-center justify-center ${tx.amount >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                 <span className="material-symbols-outlined text-sm">{tx.amount >= 0 ? 'add_circle' : 'remove_circle'}</span>
                                             </div>
                                             <div>
                                                 <p className="text-[10px] font-black text-slate-900 dark:text-white truncate max-w-[120px]">{tx.description || 'Transação'}</p>
                                                 <p className="text-[8px] font-bold text-slate-400 uppercase">{new Date(tx.created_at).toLocaleDateString('pt-BR')}</p>
                                             </div>
                                         </div>
                                         <span className={`text-xs font-black italic ${tx.amount >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                             {tx.amount >= 0 ? '+' : ''}{Number(tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 8 })}
                                         </span>
                                     </div>
                                 ))
                             ) : (
                                 <div className="py-4 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sem movimentações</p>
                                 </div>
                             )}
                         </div>
                         
                         <div className="mt-auto space-y-4 border-t border-slate-100 dark:border-slate-800 pt-6">
                              {isEditingWallet ? (
                                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 bg-slate-50 dark:bg-slate-800/20 p-4 rounded-[30px] border border-slate-200 dark:border-slate-700/50">
                                      <div className="flex p-1.5 bg-slate-200/50 dark:bg-slate-900 rounded-2xl shadow-inner">
                                          <button onClick={() => setWalletType('add')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${walletType === 'add' ? 'bg-white dark:bg-slate-800 text-primary dark:text-primary shadow-md' : 'text-slate-400 hover:text-slate-500'}`}>Adicionar (+)</button>
                                          <button onClick={() => setWalletType('set')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${walletType === 'set' ? 'bg-white dark:bg-slate-800 text-amber-500 dark:text-amber-500 shadow-md' : 'text-slate-400 hover:text-slate-500'}`}>Definir Exato (=)</button>
                                      </div>
                                      <div className="relative group">
                                          <input 
                                             type="number" 
                                             step="any"
                                             value={walletAmount}
                                             onChange={e => setWalletAmount(e.target.value)}
                                             placeholder="0,00"
                                             className="w-full bg-white dark:bg-slate-900 border-2 border-transparent rounded-[24px] py-6 px-6 text-4xl font-black italic text-center text-slate-900 dark:text-white focus:border-primary/50 focus:ring-4 ring-primary/10 transition-all shadow-sm"
                                          />
                                          <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-40 italic pointer-events-none">
                                             <span className="text-xs font-black uppercase text-primary">IZI</span>
                                          </div>
                                      </div>
                                      
                                      {/* Quick Adjust Buttons */}
                                      {walletType === 'add' && (
                                          <div className="flex gap-2">
                                             {[50, 100, 500].map(v => (
                                                 <button key={v} onClick={() => setWalletAmount(v.toString())} className="flex-1 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-black text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all shadow-sm">+{v}</button>
                                             ))}
                                          </div>
                                      )}

                                      <div className="flex gap-3 pt-2">
                                          <button onClick={handleWalletUpdate} className="flex-1 py-5 bg-gradient-to-r from-primary to-emerald-400 text-white rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all">Sincronizar Dados</button>
                                          <button onClick={() => { setIsEditingWallet(false); setWalletAmount(''); }} className="size-[60px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 rounded-3xl flex items-center justify-center hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all shadow-sm">
                                              <span className="material-symbols-outlined font-black">close</span>
                                          </button>
                                      </div>
                                  </motion.div>
                              ) : (
                                  <button onClick={() => setIsEditingWallet(true)} className="w-full py-6 bg-slate-900 dark:bg-slate-800 text-white rounded-[30px] text-[10px] font-black uppercase tracking-[0.3em] shadow-xl hover:-translate-y-1 hover:shadow-2xl hover:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 transition-all group overflow-hidden relative italic border border-slate-700/50">
                                       <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-20 transition-opacity" />
                                       <span className="flex items-center justify-center gap-3">
                                          <span className="material-symbols-outlined">edit_square</span>
                                          Ajustar Créditos IZI
                                       </span>
                                  </button>
                              )}
                         </div>
                    </div>

                   {/* Insights Section */}
                   <div className="bg-slate-900 p-8 rounded-[40px] text-white overflow-hidden relative group flex flex-col">
                        <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                             <span className="material-symbols-outlined text-9xl font-black">analytics</span>
                        </div>
                        <div className="flex items-center justify-between mb-10">
                            <h3 className="text-sm font-black uppercase tracking-widest italic">Comportamento LTV</h3>
                            <span className="material-symbols-outlined text-primary font-black animate-pulse">insights</span>
                        </div>
                        
                        <div className="space-y-10 relative z-10">
                             <div className="flex items-center justify-between">
                                  <div>
                                       <p className="text-[10px] font-black text-slate-500 uppercase mb-2 ml-1">Pedidos no Total</p>
                                       <span className="text-4xl font-black italic tracking-tighter">{userOrdersStats.total}</span>
                                  </div>
                                  <div className="text-right">
                                       <p className="text-[10px] font-black text-slate-500 uppercase mb-2 mr-1">Gasto Acumulado</p>
                                       <span className="text-3xl font-black italic text-primary tracking-tighter">R$ {userOrdersStats.spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                  </div>
                             </div>

                             <div className="p-6 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-sm">
                                  <p className="text-[9px] font-black text-primary uppercase tracking-[0.4em] mb-4 text-center">Score de Engajamento</p>
                                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                      <div className="h-full bg-primary w-[--score-percent]" style={{ '--score-percent': '45%' } as any} />
                                  </div>
                                  <div className="flex justify-between mt-3 px-1">
                                      <span className="text-[8px] font-black text-slate-500 uppercase">Regular</span>
                                      <span className="text-[9px] font-black text-white italic uppercase">Nível Prata</span>
                                  </div>
                             </div>

                             <div className="mt-auto">
                                  <button className="w-full py-4 rounded-2xl border border-white/10 text-[9px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">Ver Histórico de Pedidos</button>
                             </div>
                        </div>
                   </div>
              </div>

              {/* Registration Form Section */}
              <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[48px] border border-slate-200 dark:border-slate-800 mb-12 shadow-sm">
                   <div className="flex items-center justify-between mb-10">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest italic flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary">person_search</span>
                            Perfil & Identidade
                        </h3>
                        <div className="flex gap-2">
                            <span className="material-symbols-outlined text-sm text-slate-300">verified_user</span>
                            <span className="material-symbols-outlined text-sm text-slate-300">shield_person</span>
                        </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Nome No Sistema</label>
                            <input 
                              type="text" 
                              value={editForm.name} 
                              onChange={e => setEditForm({...editForm, name: e.target.value})}
                              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-[28px] py-5 px-8 text-sm font-black italic text-slate-900 dark:text-white focus:ring-4 ring-primary/10 transition-all shadow-inner"
                              placeholder="Nome do cliente"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">CPF / Identificação</label>
                            <input 
                              type="text" 
                              value={editForm.cpf} 
                              onChange={e => setEditForm({...editForm, cpf: e.target.value})}
                              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-[28px] py-5 px-8 text-sm font-black italic text-slate-900 dark:text-white focus:ring-4 ring-primary/10 transition-all shadow-inner"
                              placeholder="000.000.000-00"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">E-mail Vinculado</label>
                            <input 
                              type="email" 
                              value={editForm.email} 
                              onChange={e => setEditForm({...editForm, email: e.target.value})}
                              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-[28px] py-5 px-8 text-sm font-black italic text-slate-900 dark:text-white focus:ring-4 ring-primary/10 transition-all shadow-inner"
                              placeholder="cliente@exemplo.com"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Telefone Celular</label>
                            <input 
                              type="text" 
                              value={editForm.phone} 
                              onChange={e => setEditForm({...editForm, phone: e.target.value})}
                              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-[28px] py-5 px-8 text-sm font-black italic text-slate-900 dark:text-white focus:ring-4 ring-primary/10 transition-all shadow-inner"
                              placeholder="(00) 00000-0000"
                            />
                        </div>
                        <div className="space-y-3 md:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Redefinir Senha (apenas se necessário)</label>
                            <div className="relative group">
                                <input 
                                  type="password" 
                                  value={editForm.password} 
                                  onChange={e => setEditForm({...editForm, password: e.target.value})}
                                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-[28px] py-5 px-8 text-sm font-black italic text-slate-900 dark:text-white focus:ring-4 ring-primary/10 transition-all shadow-inner"
                                  placeholder="••••••••"
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 size-10 rounded-2xl bg-zinc-900 flex items-center justify-center border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="material-symbols-outlined text-slate-400 text-lg">enhanced_encryption</span>
                                </div>
                            </div>
                        </div>
                   </div>

                   <button 
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile}
                    className="w-full mt-12 py-7 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[35px] text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl hover:translate-y-[-4px] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50 group italic"
                   >
                        {isSavingProfile ? (
                            <div className="size-6 border-4 border-slate-400 border-t-white dark:border-t-slate-900 rounded-full animate-spin" />
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-2xl font-black group-hover:rotate-12 transition-transform">verified</span>
                                Persistir Alterações do Perfil
                            </>
                        )}
                   </button>
              </div>

              {/* Security & System Footer */}
              <div className="mt-auto px-4 pb-4">
                   <div className="p-8 rounded-[40px] bg-rose-500/5 border border-rose-500/10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="text-center md:text-left">
                             <p className="text-[9px] font-black text-rose-500/60 uppercase tracking-widest mb-1 italic">Zona de Risco • Área Crítica</p>
                             <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">UID:</span>
                                <span className="text-[10px] font-mono text-slate-400 opacity-60">{selectedUser.id}</span>
                             </div>
                        </div>
                        <button onClick={() => { if(window.confirm('CUIDADO EXTREMO: Esta ação é irreversível. Deseja deletar permanentemente este perfil?')) handleDeleteUser(selectedUser.id); setSelectedUser(null); }} className="px-8 py-4 bg-rose-500 text-white rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-rose-500/20 flex items-center gap-3">
                            <span className="material-symbols-outlined font-black">delete_forever</span>
                            Excluir Usuário
                        </button>
                   </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
