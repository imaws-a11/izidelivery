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

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isEditingWallet, setIsEditingWallet] = useState(false);
  const [walletAmount, setWalletAmount] = useState('');
  const [walletType, setWalletType] = useState<'add' | 'set'>('add');
  
  // States for Profile Editing
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Sync edit form when user is selected
  React.useEffect(() => {
    if (selectedUser) {
      setEditForm({
        name: selectedUser.name || '',
        email: selectedUser.email || '',
        phone: selectedUser.phone || '',
        cpf: selectedUser.cpf || '',
        password: selectedUser.password || '',
        avatar_url: selectedUser.avatar_url || ''
      });
    } else {
      setEditForm(null);
    }
  }, [selectedUser]);

  const handleWalletUpdate = async () => {
    if (!selectedUser || !walletAmount) return;
    
    try {
      const amount = parseFloat(walletAmount);
      let newBalance = selectedUser.wallet_balance || 0;
      
      if (walletType === 'add') newBalance += amount;
      else newBalance = amount;

      const { error } = await supabase
        .from('users_delivery')
        .update({ wallet_balance: newBalance })
        .eq('id', selectedUser.id);

      if (error) throw error;
      
      toastSuccess('Carteira atualizada com sucesso!');
      setSelectedUser({ ...selectedUser, wallet_balance: newBalance });
      setWalletAmount('');
      setIsEditingWallet(false);
      fetchUsers();
    } catch (err) {
      toastError('Erro ao atualizar carteira');
    }
  };

  const handleSaveProfile = async () => {
    if (!selectedUser || !editForm) return;
    setIsSavingProfile(true);
    
    try {
      const { error } = await supabase
        .from('users_delivery')
        .update({
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone,
          cpf: editForm.cpf,
          password: editForm.password,
          avatar_url: editForm.avatar_url
        })
        .eq('id', selectedUser.id);

      if (error) throw error;
      
      toastSuccess('Perfil do cliente atualizado com sucesso!');
      // Update local selection to reflect changes immediately
      setSelectedUser({ ...selectedUser, ...editForm });
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
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
             <div className="text-center px-4">
                 <p className="text-[9px] font-black text-slate-400 uppercase">Total Base</p>
                 <p className="text-lg font-black text-slate-900 dark:text-white">{stats.users}</p>
             </div>
             <div className="w-[1px] h-8 bg-slate-200 dark:bg-slate-800" />
             <div className="text-center px-4">
                 <p className="text-[9px] font-black text-slate-400 uppercase">VIP Black</p>
                 <p className="text-lg font-black text-primary">24</p>
             </div>
        </div>
      </div>

      {/* Grid de Clientes con Design Visual */}
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
          {usersList.map((user, i) => (
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
                        <div className={`absolute bottom-0 right-0 size-5 rounded-full border-4 border-white dark:border-slate-900 ${user.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                   </div>
                   <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase truncate max-w-[150px]">{user.name || 'Sem Nome'}</h3>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{user.phone || 'Sem telefone'}</p>
                   </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                   <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Carteira</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white italic">R$ {(user.wallet_balance || 0).toLocaleString('pt-BR')}</p>
                   </div>
                   <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pedidos</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white italic">--</p>
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
              className="w-full max-w-2xl h-full bg-slate-50 dark:bg-slate-950 rounded-[48px] shadow-2xl relative overflow-y-auto flex flex-col p-10 border-l border-white/5"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedUser(null)}
                className="absolute top-10 right-10 size-12 bg-white/5 text-white rounded-full flex items-center justify-center hover:bg-white/10 transition-all"
              >
                <span className="material-symbols-outlined">close</span>
              </button>

              {/* Profile Header Editor */}
              <div className="flex items-center gap-10 mb-12">
                   <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="size-32 rounded-[48px] bg-slate-200 dark:bg-slate-900 border-4 border-primary/20 flex items-center justify-center text-5xl font-black text-slate-400 grayscale cursor-pointer hover:border-primary transition-all overflow-hidden group relative"
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
                   <div>
                        <div className="flex items-center gap-3 mb-2">
                             <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">{editForm.name || 'Sem Nome'}</h2>
                             {selectedUser.is_izi_black && <span className="bg-primary text-slate-900 px-3 py-1 rounded-full text-[10px] font-black uppercase italic">VIP Black</span>}
                        </div>
                        <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs mb-6">{editForm.email}</p>
                        <div className="flex gap-4">
                             <button onClick={() => toggleIziBlack(selectedUser)} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedUser.is_izi_black ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-primary text-slate-900 shadow-xl shadow-primary/20'}`}>
                                  {selectedUser.is_izi_black ? 'Remover Izi Black' : 'Ativar Izi Black'}
                             </button>
                             <button onClick={() => handleUpdateUserStatus(selectedUser.id, selectedUser.is_active ? 'inactive' : 'active')} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${selectedUser.is_active ? 'border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white' : 'border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}>
                                  {selectedUser.is_active ? 'Desativar Conta' : 'Ativar Conta'}
                             </button>
                        </div>
                   </div>
              </div>

              {/* Edit Form Section */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 mb-8">
                   <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] italic mb-8 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">person_edit</span>
                        Dados Cadastrais & Login
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Nome Completo</label>
                            <input 
                              type="text" 
                              value={editForm.name} 
                              onChange={e => setEditForm({...editForm, name: e.target.value})}
                              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3 px-5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 ring-primary/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">CPF</label>
                            <input 
                              type="text" 
                              value={editForm.cpf} 
                              onChange={e => setEditForm({...editForm, cpf: e.target.value})}
                              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3 px-5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 ring-primary/50"
                              placeholder="000.000.000-00"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">E-mail de Login</label>
                            <input 
                              type="email" 
                              value={editForm.email} 
                              onChange={e => setEditForm({...editForm, email: e.target.value})}
                              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3 px-5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 ring-primary/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Telefone</label>
                            <input 
                              type="text" 
                              value={editForm.phone} 
                              onChange={e => setEditForm({...editForm, phone: e.target.value})}
                              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3 px-5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 ring-primary/50"
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Nova Senha (deixe em branco para manter)</label>
                            <div className="relative">
                                <input 
                                  type="password" 
                                  value={editForm.password} 
                                  onChange={e => setEditForm({...editForm, password: e.target.value})}
                                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3 px-5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 ring-primary/50"
                                  placeholder="••••••••"
                                />
                                <span className="absolute right-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg">lock</span>
                            </div>
                        </div>
                   </div>

                   <button 
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile}
                    className="w-full mt-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[28px] text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl hover:translate-y-[-4px] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                   >
                        {isSavingProfile ? (
                            <>
                                <div className="size-4 border-2 border-slate-400 border-t-white dark:border-t-slate-900 rounded-full animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-lg">save</span>
                                Salvar Informações do Cliente
                            </>
                        )}
                   </button>
              </div>

              {/* Financial Studio */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                   <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-8">
                             <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest italic">Carteira IZI</h3>
                             <span className="material-symbols-outlined text-primary font-black">wallet</span>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Crédito Disponível</p>
                        <h4 className="text-5xl font-black text-slate-900 dark:text-white italic tracking-tighter mb-10">R$ {(selectedUser.wallet_balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
                        
                        <div className="flex flex-col gap-4">
                             {isEditingWallet ? (
                                 <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                                     <div className="flex gap-2">
                                         <button onClick={() => setWalletType('add')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase ${walletType === 'add' ? 'bg-primary text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>Adicionar</button>
                                         <button onClick={() => setWalletType('set')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase ${walletType === 'set' ? 'bg-primary text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>Definir</button>
                                     </div>
                                     <input 
                                        type="number" 
                                        value={walletAmount}
                                        onChange={e => setWalletAmount(e.target.value)}
                                        placeholder="0,00"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-6 text-xl font-black italic text-center text-slate-900 dark:text-white focus:ring-primary"
                                     />
                                     <div className="flex gap-2">
                                         <button onClick={handleWalletUpdate} className="flex-1 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">Confirmar</button>
                                         <button onClick={() => setIsEditingWallet(false)} className="px-6 py-4 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Cancelar</button>
                                     </div>
                                 </motion.div>
                             ) : (
                                 <button onClick={() => setIsEditingWallet(true)} className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:translate-y-[-2px] transition-all">
                                      Ajustar Saldo
                                 </button>
                             )}
                        </div>
                   </div>

                   <div className="bg-slate-900 p-8 rounded-[40px] text-white overflow-hidden relative group">
                        <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                             <span className="material-symbols-outlined text-9xl font-black">insights</span>
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-widest italic mb-10">Insights de Consumo</h3>
                        
                        <div className="space-y-8 relative z-10">
                             <div>
                                  <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Pedidos realizados</p>
                                  <div className="flex items-center gap-4">
                                       <span className="text-3xl font-black italic">--</span>
                                       <span className="text-[10px] font-bold text-emerald-400 uppercase">+12% vs média</span>
                                  </div>
                             </div>
                             <div>
                                  <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Total Gasto (LTV)</p>
                                  <span className="text-3xl font-black italic text-primary">R$ --</span>
                             </div>
                             <div>
                                  <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Prato Favorito</p>
                                  <span className="text-sm font-black uppercase tracking-tight">Não identificado</span>
                             </div>
                        </div>
                   </div>
              </div>

              {/* Security & System */}
              <div className="mt-auto pt-10 border-t border-slate-200 dark:border-slate-900 flex items-center justify-between">
                   <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ID Único do Ecossistema</p>
                        <p className="text-xs font-mono text-slate-500">{selectedUser.id}</p>
                   </div>
                   <button onClick={() => { if(window.confirm('CUIDADO: Tem certeza que deseja deletar permanentemente este perfil e todo seu histórico?')) handleDeleteUser(selectedUser.id); setSelectedUser(null); }} className="flex items-center gap-2 px-6 py-3 bg-rose-500/10 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all">
                        <span className="material-symbols-outlined text-sm">delete_forever</span>
                        Deletar Perfil
                    </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
