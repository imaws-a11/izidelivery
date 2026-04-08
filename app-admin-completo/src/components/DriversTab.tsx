import React, { useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';
import { supabase } from '../lib/supabase';
import { countOnlineDrivers, isDriverOnline, sortDriversByPresence } from '../lib/driverPresence';
import { toastSuccess, toastError } from '../lib/useToast';
import type { Driver } from '../lib/types';

export default function DriversTab() {
  const {
    setSelectedDriverStudio, handleUpdateDriverStatus, handleDeleteDriver, 
    selectedDriverStudio, activeStudioTab, setActiveStudioTab, 
    isSaving, setIsSaving, session, fetchMyDrivers
  } = useAdmin();

  // Estado próprio — não depende do AdminProvider para o status online
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDrivers = async () => {
    const { data } = await supabase
      .from('drivers_delivery')
      .select('*')
      .eq('is_deleted', false)
      .order('is_online', { ascending: false })
      .order('name', { ascending: true });
    if (data) setDrivers(sortDriversByPresence(data as Driver[]));
    setIsLoading(false);
  };

  // Busca inicial + polling a cada 5 segundos (direto no banco, sem intermediários)
  useEffect(() => {
    loadDrivers();
    const interval = setInterval(loadDrivers, 5_000);
    return () => clearInterval(interval);
  }, []);

  // Subscription Realtime própria — independente do AdminProvider
  useEffect(() => {
    const channel = supabase
      .channel('drivers_tab_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers_delivery' }, () => {
        // Qualquer mudança na tabela → rebusca imediatamente
        loadDrivers();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Timer para forçar re-render e recálculo de online status a cada 5s sem depender de DB
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 5000);
    return () => clearInterval(timer);
  }, []);

  const metrics = useMemo(() => {
    const total = drivers.filter(d => !d.is_deleted).length;
    const now = Date.now() + (tick * 0);
    const online = countOnlineDrivers(drivers, now);
    /*
      if (!d.last_seen_at) return true; // Fallback se não houver timestamp
      return (now - lastSeen) < 15_000; // 15 segundos de tolerância (agressivo)
    */
    const blocked = drivers.filter(d => d.is_active === false && d.status !== 'inactive').length;
    const inactive = drivers.filter(d => d.status === 'inactive' || (!d.is_active && !d.status)).length;
    return { total, online, blocked, inactive };
  }, [drivers, tick]);

  const isDriverTrulyOnline = (d: Driver) => isDriverOnline(d);
  /*
    if (!d.is_online || d.is_deleted) return false;
    if (!d.last_seen_at) return true;
    const now = new Date().getTime();
    const lastSeen = new Date(d.last_seen_at).getTime();
    return (now - lastSeen) < 15_000; // 15s de tolerância
  */

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Gestão de Entregadores</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Visão geral do ecossistema de logística.</p>
        </div>
        <button onClick={() => setSelectedDriverStudio({ id: `new-${Date.now()}`, name: '', phone: '', email: '', is_active: true } as any)} className="h-14 px-8 rounded-3xl bg-primary text-slate-900 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
           <span className="material-symbols-outlined text-lg">add</span>
           Novo Entregador
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card Online - Claymorphism */}
        <div className="relative group bg-emerald-500/10 dark:bg-emerald-500/10 p-5 rounded-[48px] border border-emerald-500/10 shadow-[8px_8px_16px_rgba(0,0,0,0.05),-8px_-8px_16px_rgba(255,255,255,0.8),inset_4px_4px_8px_rgba(255,255,255,0.4),inset_-4px_-4px_8px_rgba(16,185,129,0.1)] transition-all hover:scale-[1.02]">
           <div className="flex items-center gap-4">
              <div className="size-12 bg-white/40 dark:bg-slate-900/40 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-white/50 backdrop-blur-sm">
                <span className="material-symbols-outlined text-2xl font-black animate-pulse">wifi_tethering</span>
              </div>
              <div className="flex flex-col">
                 <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter leading-none">{metrics.online}</h3>
                 <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/50 mt-1">Online</p>
              </div>
           </div>
        </div>

        {/* Card Offline - Claymorphism */}
        <div className="relative group bg-slate-500/10 dark:bg-slate-500/10 p-5 rounded-[48px] border border-slate-500/10 shadow-[8px_8px_16px_rgba(0,0,0,0.05),-8px_-8px_16px_rgba(255,255,255,0.8),inset_4px_4px_8px_rgba(255,255,255,0.4),inset_-4px_-4px_8px_rgba(71,85,105,0.1)] transition-all hover:scale-[1.02]">
           <div className="flex items-center gap-4">
              <div className="size-12 bg-white/40 dark:bg-slate-900/40 rounded-2xl flex items-center justify-center text-slate-500 shadow-sm border border-white/50 backdrop-blur-sm">
                <span className="material-symbols-outlined text-2xl font-black">wifi_tethering_off</span>
              </div>
              <div className="flex flex-col">
                 <h3 className="text-2xl font-black text-slate-700 dark:text-slate-300 tracking-tighter leading-none">{metrics.total - metrics.online}</h3>
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-500/50 mt-1">Offline</p>
              </div>
           </div>
        </div>

        {/* Card Bloqueados - Claymorphism */}
        <div className="relative group bg-red-500/10 dark:bg-red-500/10 p-5 rounded-[48px] border border-red-500/10 shadow-[8px_8px_16px_rgba(0,0,0,0.05),-8px_-8px_16px_rgba(255,255,255,0.8),inset_4px_4px_8px_rgba(255,255,255,0.4),inset_-4px_-4px_8px_rgba(239,68,68,0.1)] transition-all hover:scale-[1.02]">
           <div className="flex items-center gap-4">
              <div className="size-12 bg-white/40 dark:bg-slate-900/40 rounded-2xl flex items-center justify-center text-red-500 shadow-sm border border-white/50 backdrop-blur-sm">
                <span className="material-symbols-outlined text-2xl font-black">block</span>
              </div>
              <div className="flex flex-col">
                 <h3 className="text-2xl font-black text-red-600 dark:text-red-400 tracking-tighter leading-none">{metrics.blocked}</h3>
                 <p className="text-[10px] font-black uppercase tracking-widest text-red-600/50 mt-1">Bloqueados</p>
              </div>
           </div>
        </div>

        {/* Card Base Total - Claymorphism (Primary Accent) */}
        <div className="relative group bg-primary/20 dark:bg-primary/20 p-5 rounded-[48px] border border-primary/20 shadow-[8px_8px_16px_rgba(0,0,0,0.05),-8px_-8px_16px_rgba(255,255,255,0.8),inset_4px_4px_8px_rgba(255,255,255,0.4),inset_-4px_-4px_8px_rgba(255,217,0,0.1)] transition-all hover:scale-[1.02]">
           <div className="flex items-center gap-4">
              <div className="size-12 bg-white/40 dark:bg-slate-900/40 rounded-2xl flex items-center justify-center text-slate-900 shadow-sm border border-white/50 backdrop-blur-sm font-black">
                <span className="material-symbols-outlined text-2xl font-black">groups</span>
              </div>
              <div className="flex flex-col">
                 <h3 className="text-2xl font-black text-slate-900 dark:text-primary tracking-tighter leading-none">{metrics.total}</h3>
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-800/50 mt-1">Base Global</p>
              </div>
           </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Entregador</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Veículo</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {drivers.map(d => {
                const isOnline = isDriverTrulyOnline(d);
                return (
                <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className={`size-10 rounded-full flex items-center justify-center font-black text-white ${isOnline ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-slate-100 text-slate-400 grayscale'}`}>
                           {d.name?.charAt(0) || 'D'}
                        </div>
                        {isOnline && (
                          <span className="absolute -top-0.5 -right-0.5 size-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-black text-sm dark:text-white uppercase tracking-tight">{d.name || 'Sem Nome'}</p>
                          {isOnline && (
                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest hidden sm:inline-block">Online</span>
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 truncate">{d.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-xs font-bold text-slate-500 uppercase tracking-widest">{d.vehicle_type || 'Moto'} • {d.license_plate || 'N/A'}</td>
                  <td className="px-8 py-6 text-center">
                    <span className={`px-3 py-1 text-[9px] font-black rounded-full uppercase tracking-widest ${
                      d.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {d.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button onClick={() => setSelectedDriverStudio(d)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-primary transition-all shadow-sm">
                        <span className="material-symbols-outlined text-lg">visibility</span>
                      </button>
                      <button onClick={() => handleUpdateDriverStatus(d.id, d.is_active ? 'inactive' : 'active')} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-primary transition-all shadow-sm">
                        <span className="material-symbols-outlined text-lg">{d.is_active ? 'block' : 'check_circle'}</span>
                      </button>
                      <button onClick={() => handleDeleteDriver(d.id)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100">
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>
        {selectedDriverStudio && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-10 text-slate-900 overflow-hidden">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-3xl" onClick={() => setSelectedDriverStudio(null)}></div>
            
            <motion.div
initial={{ opacity: 0, scale: 0.9, y: 40 }}
animate={{ opacity: 1, scale: 1, y: 0 }}
className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-[64px] overflow-hidden shadow-[0_0_120px_rgba(0,0,0,0.5)] relative z-10 flex flex-col border border-white/10 dark:border-slate-800 h-[92vh]"
            >
{/* Header */}
<div className="p-8 md:p-12 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/30">
  <div className="flex items-center gap-6">
    <div className="size-20 rounded-[32px] bg-primary/20 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
      <span className="material-symbols-outlined text-4xl font-black">sports_motorsports</span>
    </div>
    <div>
      <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">Estúdio do Entregador</h2>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
        <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>
        {(typeof selectedDriverStudio.id === 'string' && selectedDriverStudio.id.startsWith('new-')) ? 'Novo Cadastro Operacional' : `ID: ${selectedDriverStudio.id?.substring(0, 8)}...`}
      </p>
    </div>
  </div>
  <button 
    onClick={() => setSelectedDriverStudio(null)}
    className="size-14 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all border border-slate-200 dark:border-slate-700 shadow-sm"
  >
    <span className="material-symbols-outlined">close</span>
  </button>
</div>

{/* Dashboard Navigation Tabs */}
            <div className="px-10 py-4 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 flex gap-8 overflow-x-auto no-scrollbar">
{[
  { id: 'personal', label: 'Dados Pessoais', icon: 'person' },
  { id: 'vehicle', label: 'Veículo', icon: 'directions_bike' },
  { id: 'finance', label: 'Financeiro', icon: 'account_balance' },
  { id: 'documents', label: 'Documentação', icon: 'description' },
].map(t => (
  <button
    key={t.id}
    onClick={() => setActiveStudioTab(t.id as any)}
    className={`flex items-center gap-2 py-4 px-2 border-b-4 transition-all whitespace-nowrap ${activeStudioTab === t.id ? 'border-primary text-slate-900 dark:text-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
  >
    <span className={`material-symbols-outlined text-xl ${activeStudioTab === t.id ? 'font-fill' : ''}`}>{t.icon}</span>
    <span className="text-xs font-black uppercase tracking-widest">{t.label}</span>
  </button>
))}
            </div>

            {/* Scrollable Form Area */}
            <div className="flex-1 overflow-y-auto p-10 scrollbar-hide">
<AnimatePresence mode="wait">
  <motion.div
    key={activeStudioTab}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.2 }}
    className="space-y-10"
  >
    {activeStudioTab === 'personal' && (
      <div className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="flex flex-col items-center gap-4">
            <div className="size-44 rounded-[48px] bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-700 shadow-2xl overflow-hidden relative group">
              <img 
                src={`https://ui-avatars.com/api/?name=${selectedDriverStudio.name || 'D'}&background=ffd900&color=000&size=256&bold=true`} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                <span className="material-symbols-outlined text-white text-4xl">add_a_photo</span>
              </div>
            </div>
            <div className="text-center">
              <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${selectedDriverStudio.is_active ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'}`}>
                <span className={`size-2 rounded-full ${selectedDriverStudio.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                {selectedDriverStudio.is_active ? 'Conta Ativa' : 'Conta Bloqueada'}
              </span>
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nome Completo</label>
                 <input 
                   type="text" 
                   value={selectedDriverStudio.name || ''}
                   onChange={e => setSelectedDriverStudio({...selectedDriverStudio, name: e.target.value})}
                   className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white transition-all shadow-inner"
                   placeholder="Nome do motorista"
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">WhatsApp / Celular</label>
                 <input 
                   type="text" 
                   value={selectedDriverStudio.phone || ''}
                   onChange={e => setSelectedDriverStudio({...selectedDriverStudio, phone: e.target.value})}
                   className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white transition-all shadow-inner"
                   placeholder="(00) 00000-0000"
                 />
              </div>
              <div className="md:col-span-1 space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">E-mail de Acesso</label>
                 <input 
                   type="email" 
                   value={selectedDriverStudio.email || ''}
                   onChange={e => setSelectedDriverStudio({...selectedDriverStudio, email: e.target.value})}
                   className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white transition-all shadow-inner"
                   placeholder="email@exemplo.com"
                 />
              </div>
              <div className="md:col-span-1 space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nova Senha</label>
                 <input 
                   type="password" 
                   value={selectedDriverStudio.password || ''}
                   onChange={e => setSelectedDriverStudio({...selectedDriverStudio, password: e.target.value})}
                   className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white transition-all shadow-inner"
                   placeholder="Preencha apenas para alterar/criar"
                 />
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-inner">
          <div className="flex items-center gap-3 mb-6">
             <span className="material-symbols-outlined text-primary">location_on</span>
             <h4 className="text-xs font-black uppercase tracking-widest dark:text-white">Localização Principal</h4>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Endereço Completo</label>
            <input 
              type="text" 
              value={selectedDriverStudio.address || ''}
              onChange={e => setSelectedDriverStudio({...selectedDriverStudio, address: e.target.value})}
              className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white transition-all shadow-sm"
              placeholder="Rua, Número, Bairro, Cidade - UF"
            />
          </div>
        </div>
      </div>
    )}

    {activeStudioTab === 'vehicle' && (
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="p-10 rounded-[48px] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 shadow-inner space-y-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="size-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-2xl font-bold">directions_bike</span>
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Ativos Transacionais</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Informações do Veículo de Trabalho</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Tipo de Veículo</label>
               <select 
                 value={selectedDriverStudio.vehicle_type || 'Moto'}
                 onChange={e => setSelectedDriverStudio({...selectedDriverStudio, vehicle_type: e.target.value})}
                 className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white appearance-none cursor-pointer"
               >
                 <option>Moto</option>
                 <option>Bicicleta</option>
                 <option>Carro</option>
                 <option>Van / Caminhão</option>
               </select>
             </div>
             <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Placa do Veículo</label>
               <input 
                 type="text" 
                 value={selectedDriverStudio.license_plate || ''}
                 onChange={e => setSelectedDriverStudio({...selectedDriverStudio, license_plate: e.target.value})}
                 className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white transition-all"
                 placeholder="ABC-1234"
               />
             </div>
             <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Modelo / Fabricante</label>
               <input 
                 type="text" 
                 value={selectedDriverStudio.vehicle_model || ''}
                 onChange={e => setSelectedDriverStudio({...selectedDriverStudio, vehicle_model: e.target.value})}
                 className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white transition-all"
                 placeholder="Ex: Honda CG 160"
               />
             </div>
             <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Cor Predominante</label>
               <input 
                 type="text" 
                 value={selectedDriverStudio.vehicle_color || ''}
                 onChange={e => setSelectedDriverStudio({...selectedDriverStudio, vehicle_color: e.target.value})}
                 className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white transition-all"
                 placeholder="Ex: Vermelha"
               />
             </div>
          </div>
        </div>
      </div>
    )}

    {activeStudioTab === 'finance' && (
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="p-10 rounded-[48px] bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 shadow-inner space-y-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="size-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-600">
              <span className="material-symbols-outlined text-2xl font-bold">account_balance</span>
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Dados para Repasse</h4>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest italic">Pagamentos & Conciliação</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Instituição Bancária</label>
               <input 
                 type="text" 
                 value={selectedDriverStudio.bank_info?.bank || ''}
                 onChange={e => setSelectedDriverStudio({...selectedDriverStudio, bank_info: { ...selectedDriverStudio.bank_info, bank: e.target.value }})}
                 className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white"
                 placeholder="Nome do Banco"
               />
             </div>
             <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Chave PIX (Principal)</label>
               <input 
                 type="text" 
                 value={selectedDriverStudio.bank_info?.pix_key || ''}
                 onChange={e => setSelectedDriverStudio({...selectedDriverStudio, bank_info: { ...selectedDriverStudio.bank_info, pix_key: e.target.value }})}
                 className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white"
                 placeholder="CPF, E-mail ou Telefone"
               />
             </div>
             <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Número da Agência</label>
               <input 
                 type="text" 
                 value={selectedDriverStudio.bank_info?.agency || ''}
                 onChange={e => setSelectedDriverStudio({...selectedDriverStudio, bank_info: { ...selectedDriverStudio.bank_info, agency: e.target.value }})}
                 className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white"
                 placeholder="0001"
               />
             </div>
             <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Conta & Dígito</label>
               <input 
                 type="text" 
                 value={selectedDriverStudio.bank_info?.account || ''}
                 onChange={e => setSelectedDriverStudio({...selectedDriverStudio, bank_info: { ...selectedDriverStudio.bank_info, account: e.target.value }})}
                 className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white"
                 placeholder="00000000-0"
               />
             </div>
          </div>
        </div>
      </div>
    )}

    {activeStudioTab === 'documents' && (
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="p-10 rounded-[48px] bg-indigo-50/30 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10 shadow-inner space-y-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="size-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-600">
              <span className="material-symbols-outlined text-2xl font-bold">description</span>
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Documentação & KYC</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verificação de Identidade e Segurança</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">CPF / Documento</label>
               <input 
                 type="text" 
                 value={selectedDriverStudio.document_number || ''}
                 onChange={e => setSelectedDriverStudio({...selectedDriverStudio, document_number: e.target.value})}
                 className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all shadow-sm"
                 placeholder="000.000.000-00"
               />
             </div>
             <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Status de Verificação</label>
               <div className="flex items-center gap-3 bg-white dark:bg-slate-900 rounded-2xl px-6 py-5 border border-slate-100 dark:border-slate-800 shadow-sm">
                  <span className={`size-3 rounded-full ${selectedDriverStudio.status === 'active' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                  <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                    {selectedDriverStudio.status === 'active' ? 'Verificado' : 'Pendente / Em Análise'}
                  </span>
               </div>
             </div>
          </div>

          <div className="bg-indigo-500/5 rounded-3xl p-6 border border-indigo-500/10">
             <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Arquivos Digitais</p>
             <div className="flex flex-wrap gap-4">
                <button className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 shadow-sm border border-slate-100 dark:border-slate-700 hover:border-indigo-500/30 transition-all">
                  <span className="material-symbols-outlined text-indigo-500">picture_as_pdf</span>
                  CNH_FRENTE.PDF
                </button>
                <button className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 shadow-sm border border-slate-100 dark:border-slate-700 hover:border-indigo-500/30 transition-all">
                  <span className="material-symbols-outlined text-indigo-500">picture_as_pdf</span>
                  CNH_VERSO.PDF
                </button>
             </div>
          </div>
        </div>
      </div>
    )}
  </motion.div>
</AnimatePresence>
            </div>

            {/* Footer Actions */}
            <div className="p-8 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
<div className="flex gap-4">
  <button 
    onClick={() => setSelectedDriverStudio({...selectedDriverStudio, is_active: !selectedDriverStudio.is_active})}
    className={`px-8 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${selectedDriverStudio.is_active ? 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white border border-red-100' : 'bg-green-50 text-green-500 hover:bg-green-500 hover:text-white border border-green-100'}`}
  >
    <span className="material-symbols-outlined text-lg">{selectedDriverStudio.is_active ? 'block' : 'check_circle'}</span>
    {selectedDriverStudio.is_active ? 'Bloquear Acesso' : 'Desbloquear Acesso'}
  </button>
</div>
<div className="flex gap-6 items-center">
  <button 
    onClick={() => setSelectedDriverStudio(null)}
    className="px-10 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-200 transition-all font-sans"
  >
    Cancelar
  </button>
  <button 
     disabled={isSaving}
     onClick={async () => {
       setIsSaving(true);
         try {
           // Obter merchant_id se não estiver presente
           let mId = selectedDriverStudio.merchant_id;
           if (!mId && session?.user?.email) {
             const { data: adminData } = await supabase
               .from('admin_users')
               .select('id')
               .eq('email', session.user.email)
               .single();
             if (adminData) mId = adminData.id;
           }

           const isNew = !selectedDriverStudio.id || (typeof selectedDriverStudio.id === 'string' && selectedDriverStudio.id.startsWith('new-'));
           let finalId = isNew ? undefined : selectedDriverStudio.id;

           if (selectedDriverStudio.email) {
             const { data: { session: authSession } } = await supabase.auth.getSession();
             const payload = {
               targetEmail: selectedDriverStudio.email,
               targetPassword: selectedDriverStudio.password || undefined,
               name: selectedDriverStudio.name,
               phone: selectedDriverStudio.phone,
               callerEmail: authSession?.user?.email
             };

             const res = await supabase.functions.invoke('manage-driver-auth', { body: payload });
             
             if (res.error) throw new Error('Falha de Autenticação: ' + res.error.message);
             if (!res.data.success) throw new Error(res.data.error || 'Erro no setup da conta do entregador');
             
             finalId = res.data.user.id;
           } else if (isNew) {
             throw new Error('O e-mail é obrigatório para um novo entregador.');
           }

           const driverData = {
             id: finalId,
             name: selectedDriverStudio.name,
             email: selectedDriverStudio.email,
             phone: selectedDriverStudio.phone,
             vehicle_type: selectedDriverStudio.vehicle_type,
             vehicle_model: selectedDriverStudio.vehicle_model,
             vehicle_color: selectedDriverStudio.vehicle_color,
             license_plate: selectedDriverStudio.license_plate,
             document_number: selectedDriverStudio.document_number,
             address: selectedDriverStudio.address,
             bank_info: selectedDriverStudio.bank_info,
             is_active: selectedDriverStudio.is_active,
             status: selectedDriverStudio.status || 'active',
             merchant_id: mId
           };

         let error;
         const { data: existingDriver } = await supabase.from('drivers_delivery').select('id').eq('id', finalId).maybeSingle();

         if (!existingDriver) {
           const { error: err } = await supabase.from('drivers_delivery').insert([driverData]);
           error = err;
         } else {
           const { error: err } = await supabase.from('drivers_delivery').update(driverData).eq('id', finalId);
           error = err;
         }
         if (error) throw error;
         toastSuccess('Dados do entregador salvos com sucesso!');
         setSelectedDriverStudio(null);
         loadDrivers();
         fetchMyDrivers();
       } catch (err: any) {
         toastError('Erro ao salvar entregador: ' + err.message);
       } finally {
         setIsSaving(false);
       }
     }}
    className="px-12 py-5 bg-primary text-slate-900 font-black text-[10px] uppercase tracking-widest rounded-3xl shadow-xl shadow-primary/20 hover:scale-[1.05] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
  >
    <span className={`material-symbols-outlined text-lg font-bold ${isSaving ? 'animate-spin' : ''}`}>{isSaving ? 'sync' : 'done_all'}</span>
    {isSaving ? 'Processando...' : 'Confirmar & Salvar'}
  </button>
</div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
