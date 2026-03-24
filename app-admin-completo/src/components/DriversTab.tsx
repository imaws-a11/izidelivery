import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';

// Gestão de Entregadores
export default function DriversTab() {
  const {
    driversList, filteredDrivers, paginatedDrivers, driversPage, setDriversPage, driverSearch, setDriverSearch, driverFilter, setDriverFilter, setSelectedDriverStudio, setActiveStudioTab, handleUpdateDriverStatus, handleExportDrivers, fetchDrivers
  } = useAdmin();

  const DRIVERS_PER_PAGE = 8;
  const isLoadingList = false; // Previsto no context mas simplificado aqui se necessário

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
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
            onClick={() => { setSelectedDriverStudio({ id: `new-${Date.now()}`, name: '', email: '', phone: '', is_active: true } as any); setActiveStudioTab('personal'); }}
            className="bg-primary text-slate-900 px-10 py-4 rounded-[24px] font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center gap-3"
          >
             <span className="material-symbols-outlined text-lg">add_circle</span>
             Novo Entregador
          </button>
        </div>
      </div>

      {/* Deliverers Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[56px] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden relative">
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
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 dark:text-white text-base leading-none mb-1">{d.name}</h4>
                        <p className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">{d.id.substring(0, 13)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                     <span className="text-[10px] font-black text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 shadow-sm">{d.vehicle_type} • {d.license_plate || 'S/ Placa'}</span>
                  </td>
                  <td className="px-10 py-8">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${d.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      <span className="size-2 rounded-full bg-current animate-pulse"></span>
                      {d.status === 'active' ? 'Ativo' : 'Suspenso'}
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-primary">star</span>
                        <span className="text-base font-black text-slate-900 dark:text-white">{d.rating?.toFixed(1) || '5.0'}</span>
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
                        <span className="material-symbols-outlined text-xl">edit_note</span>
                      </button>
                      <button
                        onClick={() => handleUpdateDriverStatus(d.id, d.status === 'suspended' ? 'active' : 'suspended')}
                        className={`size-11 flex items-center justify-center rounded-2xl transition-all shadow-sm ${
                          d.status === 'suspended' ? 'bg-amber-500 text-white' : 'bg-white dark:bg-slate-800 text-amber-500 border border-slate-100 dark:border-slate-800 hover:bg-amber-500 hover:text-white'
                        }`}
                        title={d.status === 'suspended' ? 'Reativar' : 'Suspender'}
                      >
                        <span className="material-symbols-outlined text-xl text-yellow-600">warning</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex items-center justify-between">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mostrando página {driversPage} de {Math.ceil(filteredDrivers.length / DRIVERS_PER_PAGE)}</p>
          <div className="flex gap-4">
            <button 
              disabled={driversPage === 1}
              onClick={() => setDriversPage(prev => prev - 1)}
              className="h-12 px-5 flex items-center gap-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-primary transition-all font-black text-[10px] uppercase tracking-widest shadow-sm disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-lg">chevron_left</span>
              Anterior
            </button>
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
  );
}
