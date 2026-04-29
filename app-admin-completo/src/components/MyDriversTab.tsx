import React from 'react';
import { useAdmin } from '../context/AdminContext';
import { isDriverOnline } from '../lib/driverPresence';

export default function MyDriversTab() {
  const {
    myDriversList,
    setSelectedDriverStudio,
    setEditingItem,
    setEditType,
    handleDeleteMyDriver,
    merchantProfile,
    handleUpdateDispatchSettings
  } = useAdmin();

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
                    const isSelected = merchantProfile?.dispatch_priority === opt.id || (!merchantProfile?.dispatch_priority && opt.id === 'global');
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleUpdateDispatchSettings('dispatch_priority', opt.id)}
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
    </div>
  );
}
