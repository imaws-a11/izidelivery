import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';

// Gestão de Entregadores
export default function DriversTab() {
  const {
    driversList, filteredDrivers, paginatedDrivers, driversPage, setDriversPage, driverSearch, setDriverSearch, driverFilter, setDriverFilter, selectedDriverStudio, setSelectedDriverStudio, activeStudioTab, setActiveStudioTab, editingItem, setEditingItem, editType, setEditType, isSaving, handleUpdateDriver, handleUpdateDriverStatus, handleDeleteDriver, handleExportDrivers, fetchDrivers
  } = useAdmin();

  return (
  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
    <div>
      <div className="flex items-center gap-3 mb-2">
        <span className="material-symbols-outlined text-3xl text-primary">sports_motorsports</span>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Gestão de Entregadores</h1>
      </div>
      <p className="text-slate-500 dark:text-slate-400">Controle total da frota, aprovações, suspensões e monitoramento de performance.</p>
    </div>
    <div className="flex items-center gap-3">
       <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/20">
          <span className="material-symbols-outlined text-slate-400 pl-2">search</span>
          <input
            type="text"
            placeholder="Buscar por nome, id ou telefone..."
            className="bg-transparent border-none text-xs font-bold px-3 py-2 focus:ring-0 dark:text-white w-64"
            value={driverSearch}
            onChange={(e) => setDriverSearch(e.target.value)}
          />
       </div>
    </div>
  </div>

  {/* Statistics Bar - Real & Dynamic */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    {[
      { label: 'Frota Total', val: driversList.length, icon: 'group', color: 'text-primary', bg: 'bg-primary/10', trend: 'Base Completa', tc: 'text-slate-500' },
      { label: 'Disponíveis Agora', val: driversList.filter(d => d.is_online).length, icon: 'bolt', color: 'text-green-500', bg: 'bg-green-500/10', trend: 'Online', tc: 'text-green-500' },
      { label: 'Aguardando Aprovação', val: driversList.filter(d => !d.is_active && d.status !== 'suspended').length, icon: 'pending_actions', color: 'text-orange-500', bg: 'bg-orange-500/10', trend: 'Pendentes', tc: 'text-orange-500' },
      { label: 'Contas Suspensas', val: driversList.filter(d => d.status === 'suspended').length, icon: 'warning', color: 'text-red-500', bg: 'bg-red-500/10', trend: 'Ação Necessária', tc: 'text-red-500' },
    ].map((s, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.1 }}
        className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:scale-[1.02] transition-all"
      >
        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
          <span className="material-symbols-outlined text-6xl">{s.icon}</span>
        </div>
        <div className="flex justify-between items-start mb-6">
          <span className={`material-symbols-outlined ${s.color} p-4 ${s.bg} rounded-3xl font-bold`}>{s.icon}</span>
          <span className={`text-[10px] font-black ${s.tc} px-3 py-1 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-800 shadow-sm uppercase tracking-widest`}>{s.trend}</span>
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{s.label}</p>
        <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{s.val}</h3>
      </motion.div>
    ))}
  </div>

  {/* Filters & Actions Bar */}
  <div className="flex flex-wrap items-center justify-between gap-6">
    <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] p-2 shadow-sm shrink-0">
      {['Todos', 'Ativos', 'Offline', 'Pendentes'].map((f) => (
        <button
          key={f}
          onClick={() => setDriverFilter(f)}
          className={`px-8 py-3.5 text-[10px] font-black rounded-2xl uppercase tracking-[0.15em] transition-all ${driverFilter === f ? 'bg-primary text-slate-900 shadow-xl shadow-primary/20 scale-105' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
        >
          {f}
        </button>
      ))}
    </div>

    <div className="flex items-center gap-4">
      <button 
        onClick={handleExportDrivers}
        className="size-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 hover:text-primary transition-all shadow-sm"
        title="Exportar CSV"
      >
        <span className="material-symbols-outlined">download</span>
      </button>
      <button
        onClick={fetchDrivers}
        className="size-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 hover:text-primary transition-all shadow-sm active:rotate-180"
        title="Sincronizar"
      >
        <span className="material-symbols-outlined">sync</span>
      </button>
      <button
        onClick={() => setSelectedDriverStudio({ 
          id: `new-${Date.now()}`, 
          name: '', 
          email: '',
          phone: '', 
          vehicle_type: 'Moto', 
          vehicle_model: '',
          vehicle_color: '',
          license_plate: '',
          address: '',
          document_number: '',
          is_active: true, 
          status: 'active', 
          bank_info: { bank: '', agency: '', account: '', pix_key: '' } 
        })}
        className="px-10 py-5 bg-slate-900 dark:bg-primary text-white dark:text-slate-900 rounded-[28px] text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:brightness-110 active:scale-95 transition-all flex items-center gap-3"
      >
         <span className="material-symbols-outlined text-lg">person_add</span>
         Novo Entregador
      </button>
    </div>
  </div>

  {/* Deliverers Table with Modern Styling */}
  <div className="bg-white dark:bg-slate-900 rounded-[56px] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden relative">
    {isLoadingList && (
      <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md z-10 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    )}
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800/50 uppercase">
            <th className="px-10 py-8 text-[10px] font-black tracking-[0.2em] text-slate-400">Entregador & ID</th>
            <th className="px-10 py-8 text-[10px] font-black tracking-[0.2em] text-slate-400">Operacional</th>
            <th className="px-10 py-8 text-[10px] font-black tracking-[0.2em] text-slate-400">Status Acesso</th>
            <th className="px-10 py-8 text-[10px] font-black tracking-[0.2em] text-slate-400">Rating & Performance</th>
            <th className="px-10 py-8 text-[10px] font-black tracking-[0.2em] text-slate-400 text-right">Ações de Gestão</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-900 dark:text-white">
          {paginatedDrivers.map((d) => (
            <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all group">
              <td className="px-10 py-8">
                <div className="flex items-center gap-6">
                  <div className="size-16 rounded-[28px] bg-slate-100 dark:bg-slate-800 p-0.5 border-2 border-white dark:border-slate-700 shadow-xl overflow-hidden shrink-0 relative">
                    <img className="w-full h-full object-cover rounded-[24px]" src={`https://ui-avatars.com/api/?name=${d.name}&background=ffd900&color=000&size=128&bold=true`} />
                    {d.is_online && <span className="absolute bottom-0 right-0 size-4 bg-green-500 border-4 border-white dark:border-slate-800 rounded-full" />}
                  </div>
                  <div>
                    <p className="text-lg font-black tracking-tighter mb-0.5">{d.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">ID: {d.id.slice(0, 8)}</span>
                      {d.is_online && <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-[8px] font-black rounded-full uppercase">Online</span>}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-10 py-8">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-400 text-base">
                      {d.vehicle_type?.toLowerCase().includes('moto') ? 'motorcycle' : d.vehicle_type?.toLowerCase().includes('bike') ? 'directions_bike' : 'directions_car'}
                    </span>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">{d.vehicle_type || 'Moto'}</span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400">{d.license_plate?.toUpperCase() || 'SEM PLACA'}</p>
                </div>
              </td>
              <td className="px-10 py-8">
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] border transition-all ${
                  d.status === 'active' || d.is_active
                  ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20 shadow-sm'
                  : d.status === 'suspended'
                  ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                  : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/10'
                  }`}>
                  <span className={`size-2 rounded-full ${
                    (d.status === 'active' || d.is_active) ? 'bg-green-500' : d.status === 'suspended' ? 'bg-amber-500' : 'bg-red-500'
                  } shadow-sm`}></span>
                  {d.status === 'suspended' ? 'Suspenso' : (d.status === 'active' || d.is_active ? 'Conta Ativa' : 'Desativado')}
                </span>
              </td>
              <td className="px-10 py-8">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                    <span className="material-symbols-outlined text-lg fill-1">star</span>
                    <span className="text-base font-black text-slate-900 dark:text-white">{d.rating?.toFixed(1) || '5.0'}</span>
                  </div>
                  <div className="w-24 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                     <div className="h-full bg-primary" style={{ width: `${(d.rating || 5) * 20}%` }} />
                  </div>
                </div>
              </td>
              <td className="px-10 py-8">
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => window.open(`https://wa.me/55${d.phone?.replace(/\D/g, '')}`, '_blank')}
                    className="size-11 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 text-green-500 border border-slate-100 dark:border-slate-800 hover:bg-green-500 hover:text-white transition-all shadow-sm group/btn"
                    title="Enviar Mensagem"
                  >
                    <span className="material-symbols-outlined text-xl group-hover/btn:scale-110 transition-transform">chat</span>
                  </button>
                  <button
                    onClick={() => { setSelectedDriverStudio(d); setActiveStudioTab('personal'); }}
                    className="size-11 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 text-blue-500 border border-slate-100 dark:border-slate-800 hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                    title="Editar Perfil"
                  >
                    <span className="material-symbols-outlined text-xl">manage_accounts</span>
                  </button>
                  <button
                    onClick={() => handleUpdateDriverStatus(d.id, d.status === 'suspended' ? 'active' : 'suspended')}
                    className={`size-11 flex items-center justify-center rounded-2xl transition-all shadow-sm ${
                      d.status === 'suspended' ? 'bg-amber-500 text-white' : 'bg-white dark:bg-slate-800 text-amber-500 border border-slate-100 dark:border-slate-800 hover:bg-amber-500 hover:text-white'
                    }`}
                    title={d.status === 'suspended' ? 'Reativar' : 'Suspender'}
                  >
                    <span className="material-symbols-outlined text-xl">warning</span>
                  </button>
                  <button
                    onClick={() => handleDeleteDriver(d.id)}
                    className="size-11 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 text-red-500 border border-slate-100 dark:border-slate-800 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                    title="Excluir Permanentemente"
                  >
                    <span className="material-symbols-outlined text-xl">delete_forever</span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filteredDrivers.length === 0 && (
        <div className="py-32 text-center">
           <div className="size-24 rounded-[32px] bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mx-auto mb-6 text-slate-300">
               <span className="material-symbols-outlined text-5xl">sports_motorsports</span>
           </div>
           <h4 className="text-xl font-black text-slate-900 dark:text-white">Nenhum entregador encontrado</h4>
           <p className="text-sm font-bold text-slate-400 mt-2">Ajuste seu filtro ou busque por outro termo.</p>
        </div>
      )}
    </div>

    {/* Pagination Footer */}
    <div className="px-10 py-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-4">
         Filtro: <span className="text-slate-900 dark:text-white">{driverFilter}</span>
         <span className="w-1 h-1 rounded-full bg-slate-300" />
         Exibindo {filteredDrivers.length} de {driversList.length} entregadores
      </p>
      <div className="flex items-center gap-3">
        <button 
          disabled={driversPage === 1}
          onClick={() => setDriversPage(prev => prev - 1)}
          className="h-12 px-5 flex items-center gap-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary transition-all font-black text-[10px] uppercase tracking-widest shadow-sm disabled:opacity-40"
        >
          <span className="material-symbols-outlined text-lg">chevron_left</span>
          Anterior
        </button>
        
        <div className="flex items-center gap-2">
           {Array.from({ length: Math.ceil(filteredDrivers.length / DRIVERS_PER_PAGE) }).map((_, i) => {
               const p = i + 1;
               const totalP = Math.ceil(filteredDrivers.length / DRIVERS_PER_PAGE);
               if (p === 1 || p === totalP || (p >= driversPage - 1 && p <= driversPage + 1)) {
                   return (
                     <button 
                       key={p}
                       onClick={() => setDriversPage(p)}
                       className={`size-12 rounded-2xl font-black text-xs transition-all ${driversPage === p ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20' : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-primary border border-transparent dark:border-slate-800 hover:border-primary/30'}`}
                     >
                       {p}
                     </button>
                   );
               }
               if (p === driversPage - 2 || p === driversPage + 2) return <span key={p} className="text-slate-400 font-bold px-1">...</span>;
               return null;
           })}
        </div>

        <button 
          disabled={driversPage >= Math.ceil(filteredDrivers.length / DRIVERS_PER_PAGE)}
          onClick={() => setDriversPage(prev => prev + 1)}
          className="h-12 px-5 flex items-center gap-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-primary transition-all font-black text-[10px] uppercase tracking-widest shadow-sm disabled:opacity-40"
        >
          Próximo
          <span className="material-symbols-outlined text-lg">chevron_right</span>
        </button>
      </div>
    </div>
  </div>
</div>
            )}

  );
}
