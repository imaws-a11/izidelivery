import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';
import { isDriverOnline } from '../lib/driverPresence';

export default function MyDriversTab() {
  const {
    myDriversList,
    setSelectedDriverStudio,
    editingItem,
    setEditingItem,
    editType,
    setEditType,
    isSaving,
    handleUpdateMyDriver,
    handleDeleteMyDriver,
    merchantProfile,
    handleUpdateDispatchSettings
  } = useAdmin();

  const [localPriority, setLocalPriority] = React.useState(merchantProfile?.dispatch_priority || 'global');
  const [isSavingPriority, setIsSavingPriority] = React.useState(false);

  React.useEffect(() => {
    if (merchantProfile?.dispatch_priority) {
      setLocalPriority(merchantProfile.dispatch_priority);
    }
  }, [merchantProfile?.dispatch_priority]);

  const onSavePriority = async () => {
    setIsSavingPriority(true);
    try {
      await handleUpdateDispatchSettings('dispatch_priority', localPriority);
    } finally {
      setIsSavingPriority(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-3xl text-primary">delivery_dining</span>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Motoboys Próprios</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400">Gerencie sua frota exclusiva, acompanhe o status e configure regras de prioridade.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Priority & Rules */}
        <div className="lg:col-span-1 space-y-6">
          <section className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 -mr-20 -mt-20 rounded-full blur-3xl"></div>
            <h3 className="text-lg font-black mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">settings_suggest</span>
              Regras de Despacho
            </h3>

            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Prioridade de Pedidos</p>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'exclusive', label: 'Meus Motoboys Primeiro', desc: 'O pedido toca primeiro para sua frota' },
                    { id: 'global', label: 'Todos os Motoboys', desc: 'Toca simultâneo para todos (Padrão)' },
                  ].map((opt) => {
                    const isSelected = localPriority === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setLocalPriority(opt.id)}
                        className={`p-4 rounded-2xl border text-left transition-all ${
                          isSelected 
                            ? 'bg-primary/20 border-primary text-primary' 
                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className={`text-xs font-black uppercase tracking-tight ${isSelected ? 'text-primary' : ''}`}>{opt.label}</p>
                          {isSelected && <span className="material-symbols-outlined text-primary text-sm">check_circle</span>}
                        </div>
                        <p className="text-[10px] opacity-70 mt-0.5">{opt.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={onSavePriority}
                disabled={isSavingPriority || localPriority === merchantProfile?.dispatch_priority}
                className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 ${
                  localPriority === merchantProfile?.dispatch_priority
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-primary text-slate-900 hover:brightness-110 shadow-lg shadow-primary/20'
                }`}
              >
                {isSavingPriority ? (
                  <>
                    <div className="size-4 border-2 border-slate-900/20 border-t-slate-900 rounded-full animate-spin"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">save</span>
                    Salvar Regras
                  </>
                )}
              </button>
            </div>
          </section>
        </div>

        {/* Drivers List */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/20">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">groups</span>
                Sua Equipe
              </h3>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total: {myDriversList.length} motoboys</span>
                <button 
                  onClick={() => {
                    setEditingItem({ 
                      name: '', 
                      phone: '', 
                      vehicle_type: 'Moto', 
                      is_active: true, 
                      status: 'active',
                      bank_info: { bank: '', agency: '', account: '', pix_key: '' } 
                    });
                    setEditType('my_driver');
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary text-slate-900 rounded-lg text-[9px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-sm"
                >
                  <span className="material-symbols-outlined text-xs">add</span> Novo
                </button>
              </div>
            </div>
            
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {myDriversList.length > 0 ? (
                myDriversList.map((driver, index) => {
                  const isOnline = isDriverOnline(driver);

                  return (
                    <div key={driver.id || index} className="flex items-center justify-between px-8 py-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="size-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                        <span className="material-symbols-outlined text-slate-400 text-2xl">person</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{driver.name}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{driver.vehicle_type} • {driver.license_plate}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`size-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{isOnline ? 'Online' : 'Offline'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setEditingItem(driver);
                          setEditType('my_driver');
                        }}
                        className="size-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary transition-all flex items-center justify-center border border-slate-100 dark:border-slate-700"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteMyDriver(driver.id)}
                        className="size-10 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-300 hover:text-red-500 transition-all flex items-center justify-center border border-red-100 dark:border-red-900/20"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-20 text-center">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-[32px] flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-4xl text-slate-300">smart_toy</span>
                  </div>
                  <p className="font-bold text-slate-400">Nenhum motoboy próprio cadastrado.</p>
                  <p className="text-xs text-slate-500 mt-2">Adicione entregadores exclusivos para sua loja.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal (Glassmorphism Minimalist) */}
      <AnimatePresence>
        {editingItem && editType === 'my_driver' && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 text-slate-900">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => { setEditingItem(null); setEditType(null); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[40px] p-10 shadow-2xl border border-slate-100 dark:border-slate-800 relative z-10 overflow-hidden font-sans"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 -mr-20 -mt-20 rounded-full blur-3xl"></div>
              
              <div className="flex justify-between items-center mb-8 relative z-10">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Frota Própria</p>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                    {editingItem.id ? 'Editar Motoboy' : 'Cadastrar Motoboy'}
                  </h2>
                </div>
                <button 
                  onClick={() => { setEditingItem(null); setEditType(null); }} 
                  className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-950 dark:hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-2xl">close</span>
                </button>
              </div>

              <form onSubmit={handleUpdateMyDriver} className="space-y-5 relative z-10">
                {/* Nome */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Nome do Motoboy</label>
                  <input
                    type="text"
                    required
                    value={editingItem.name || ''}
                    onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                    placeholder="Ex: Carlos Silva"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
                  />
                </div>

                {/* Telefone */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    required
                    value={editingItem.phone || ''}
                    onChange={e => setEditingItem({ ...editingItem, phone: e.target.value })}
                    placeholder="(00) 99999-9999"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
                  />
                </div>

                {/* E-mail e Senha (apenas na criação) */}
                {!editingItem.id && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-4">E-mail de Acesso</label>
                      <input
                        type="email"
                        required
                        value={editingItem.email || ''}
                        onChange={e => setEditingItem({ ...editingItem, email: e.target.value })}
                        placeholder="motoboy@exemplo.com"
                        className="w-full bg-primary/5 border border-primary/10 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-4">Senha de Acesso</label>
                      <input
                        type="password"
                        required
                        value={editingItem.password || ''}
                        onChange={e => setEditingItem({ ...editingItem, password: e.target.value })}
                        placeholder="Mínimo 6 dígitos"
                        className="w-full bg-primary/5 border border-primary/10 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
                      />
                    </div>
                  </div>
                )}

                {/* Veículo e Placa */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Veículo</label>
                    <input
                      type="text"
                      required
                      value={editingItem.vehicle_type || ''}
                      onChange={e => setEditingItem({ ...editingItem, vehicle_type: e.target.value })}
                      placeholder="Ex: Honda CG 160"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Placa</label>
                    <input
                      type="text"
                      value={editingItem.license_plate || ''}
                      onChange={e => setEditingItem({ ...editingItem, license_plate: e.target.value.toUpperCase() })}
                      placeholder="ABC-1234"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
                    />
                  </div>
                </div>

                {/* Status da Conta */}
                <div className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-slate-950 rounded-[24px] border border-slate-100 dark:border-slate-800 mt-2">
                  <div className="flex-1">
                    <p className="text-xs font-black text-slate-800 dark:text-slate-200">Status da Conta</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Habilita ou desativa o acesso ao app</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingItem({ ...editingItem, is_active: !editingItem.is_active })}
                    className={`w-14 h-8 rounded-full relative transition-colors ${editingItem.is_active ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${editingItem.is_active ? 'left-7' : 'left-1'}`}></div>
                  </button>
                </div>

                {/* Ações */}
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => { setEditingItem(null); setEditType(null); }}
                    className="w-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-3xl py-4 font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full bg-primary text-slate-900 rounded-3xl py-4 font-black uppercase tracking-widest hover:brightness-105 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 text-xs"
                  >
                    {isSaving ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
