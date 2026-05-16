import { useRef, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAdmin } from '../context/AdminContext';
import { motion, AnimatePresence } from 'framer-motion';
import type { DynamicRatesState } from '../lib/types';

export default function DynamicRatesTab() {
  const {
    dynamicRatesState, setDynamicRatesState, setIsAddingPeakRule, 
    handleRemovePeakRule, handleRemoveZone, saveDynamicRates, saveSpecificRateMetadata, 
    stats, allOrders, isSaving
  } = useAdmin();

  const headerRef = useRef<HTMLDivElement>(null);
  const onlineDrivers = stats?.onlineDrivers || 0;
  const activeOrders = (allOrders?.filter(o => ['pendente', 'aceito', 'preparando', 'novo', 'waiting_driver', 'picked_up', 'em_rota'].includes(o.status)).length) || 0;
  const ratio = activeOrders / (onlineDrivers || 1);

  // Simular o cálculo do surge atual
  const threshold = dynamicRatesState.equilibrium?.threshold || 1.2;
  const sensitivity = dynamicRatesState.equilibrium?.sensitivity || 2.0;
  const maxSurge = dynamicRatesState.equilibrium?.maxSurge || 4.0;

  let simulatedSurge = 1.0;
  if (dynamicRatesState.flowControl?.mode === 'auto') {
    if (ratio > threshold) {
      simulatedSurge = 1.0 + (ratio - threshold) * sensitivity;
    }
  }
  
  const anyWeatherActive = Object.values(dynamicRatesState.weather || {}).find((w: any) => w.active);
  if (anyWeatherActive) simulatedSurge += (anyWeatherActive.multiplier - 1);
  
  if (dynamicRatesState.flowControl?.highDemandActive) {
    simulatedSurge = Math.max(simulatedSurge, 1.5);
  }
  
  const finalSurgeDisplay = Math.max(1.0, Math.min(maxSurge, simulatedSurge));
  const healthPercent = Math.max(1, onlineDrivers === 0 ? 0 : Math.min(100, Math.round((onlineDrivers / (activeOrders || onlineDrivers)) * 100)));
  const healthLabel = healthPercent > 80 ? 'Excelente' : (healthPercent > 50 ? 'Estável' : 'Crítica');
  const healthColor = healthPercent > 80 ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]' : (healthPercent > 50 ? 'bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.5)]' : 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]');

  // Estilos Glassmorphism Premium
  const glassCard = "bg-white/40 dark:bg-black/40 backdrop-blur-2xl border border-white/50 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-[32px] overflow-hidden relative transition-all duration-500";
  const glassCardDark = "bg-slate-900/90 dark:bg-black/80 backdrop-blur-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.2)] rounded-[32px] overflow-hidden relative transition-all duration-500";
  const inputStyle = "w-full bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-white/5 outline-none font-black text-slate-900 dark:text-white text-sm rounded-2xl py-3 px-4 shadow-inner focus:ring-2 focus:ring-primary/20 transition-all text-right";

  return (
    <div className="space-y-10 pb-32 font-display">
      {/* Header Glassmorphic */}
      <div ref={headerRef} className={`${glassCard} p-10 flex flex-col md:flex-row md:items-center justify-between gap-8 group`}>
        <div className="absolute -top-32 -right-32 size-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none group-hover:bg-primary/30 transition-all duration-1000" />
        <div className="absolute -bottom-32 -left-32 size-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="size-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
               <span className="material-symbols-outlined text-slate-900 text-2xl font-black">payments</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none drop-shadow-md">
              Taxas & <span className="text-primary">Algoritmo</span>
            </h1>
          </div>
          <p className="text-slate-800 dark:text-zinc-900 font-bold text-xs uppercase tracking-[0.2em] ml-1">
            Controle de precificação dinâmica e fluxo operacional
          </p>
        </div>
        
        <div className="relative z-10 flex items-center gap-4">
          <button
            disabled={isSaving}
            onClick={saveDynamicRates}
            className={`group/btn flex items-center justify-center gap-3 px-10 h-16 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-500 ${
              isSaving 
              ? 'bg-slate-200 dark:bg-zinc-800 text-slate-900 cursor-not-allowed' 
              : 'bg-slate-900 dark:bg-primary text-white dark:text-slate-900 hover:scale-[1.05] active:scale-95 shadow-2xl hover:shadow-primary/30'
            }`}
          >
            {isSaving ? (
              <div className="size-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-lg">publish</span>
            )}
            {isSaving ? 'Publicando...' : 'Publicar Alterações'}
          </button>
        </div>
      </div>

      {/* Operação em Tempo Real */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className={`lg:col-span-2 ${glassCardDark} p-10 text-white flex flex-col justify-between group`}>
           <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 -mr-32 -mt-32 rounded-full blur-[100px] pointer-events-none" />
           
           <div className="flex justify-between items-start relative z-10">
              <div className="space-y-8">
                 <div className="flex items-center gap-4">
                    <div className="size-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-xl shadow-inner">
                       <span className="material-symbols-outlined text-primary text-3xl animate-pulse">analytics</span>
                    </div>
                    <div>
                       <h3 className="text-2xl font-black tracking-tighter uppercase">Pulso da Operação</h3>
                       <p className="text-slate-900 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Status da Malha em Tempo Real</p>
                    </div>
                 </div>

                 <div className="flex items-center gap-16">
                    <div className="space-y-2">
                       <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Pilotos Ativos</span>
                       <div className="flex items-center gap-3">
                          <span className="text-5xl font-black tracking-tighter">{onlineDrivers}</span>
                          <div className="size-3 rounded-full bg-emerald-500 animate-ping" />
                       </div>
                    </div>
                    <div className="w-px h-16 bg-white/10" />
                    <div className="space-y-2">
                       <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Demanda Atual</span>
                       <div className="flex items-center gap-3 text-primary">
                          <span className="text-5xl font-black tracking-tighter">{activeOrders}</span>
                          <span className="material-symbols-outlined text-2xl">local_mall</span>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="bg-white/5 backdrop-blur-3xl p-8 rounded-[40px] border border-white/10 flex flex-col items-center gap-3 min-w-[180px] shadow-2xl">
                 <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Multiplicador Surge</span>
                 <div className="text-5xl font-black text-primary drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]">
                   {finalSurgeDisplay.toFixed(2).replace('.', ',')}x
                 </div>
                 <div className={`px-4 py-1.5 rounded-xl ${finalSurgeDisplay > 1.0 ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'} text-[10px] font-black uppercase tracking-widest border border-current/10`}>
                   {healthLabel}
                 </div>
              </div>
           </div>

           <div className="mt-16 relative z-10">
              <div className="flex justify-between items-center mb-4">
                 <span className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Capacidade de Atendimento</span>
                 <span className="text-sm font-black text-white">{healthPercent}%</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden shadow-inner border border-white/5">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${healthPercent}%` }}
                   transition={{ duration: 1.5, ease: "easeOut" }}
                   className={`h-full ${healthColor} transition-all duration-1000`} 
                 />
              </div>
           </div>
        </div>

        {/* Quick Actions */}
        <div className={`${glassCard} p-10 flex flex-col justify-between`}>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3 uppercase tracking-tighter">
              <span className="material-symbols-outlined text-primary text-3xl">bolt</span>
              Controles Rápidos
            </h3>
            <p className="text-slate-900 dark:text-slate-900 text-[10px] font-black uppercase tracking-widest">Intervenção Manual do Sistema</p>
          </div>

          <div className="space-y-6">
            <div className={`p-6 rounded-[24px] border transition-all flex items-center justify-between ${dynamicRatesState.flowControl?.mode === 'auto' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-100/50 dark:bg-white/5 border-slate-200 dark:border-white/5'}`}>
              <div className="flex flex-col">
                <span className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-tight">Algoritmo Inteligente</span>
                <span className="text-[9px] font-bold text-slate-900 uppercase tracking-widest mt-1">Cálculo Automático de Surge</span>
              </div>
              <button 
                onClick={() => {
                  const newFlow = { ...dynamicRatesState.flowControl, mode: dynamicRatesState.flowControl?.mode === 'auto' ? 'manual' : 'auto' };
                  setDynamicRatesState({ ...dynamicRatesState, flowControl: newFlow });
                  saveSpecificRateMetadata('flow_control', newFlow);
                }}
                className={`w-14 h-8 rounded-full relative transition-all shadow-inner ${dynamicRatesState.flowControl?.mode === 'auto' ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-zinc-700'}`}
              >
                <motion.div 
                  layout
                  className="absolute top-1 size-6 bg-white rounded-full shadow-lg"
                  style={{ left: dynamicRatesState.flowControl?.mode === 'auto' ? 'calc(100% - 28px)' : '4px' }}
                />
              </button>
            </div>

            <div className={`p-6 rounded-[24px] border transition-all flex items-center justify-between ${dynamicRatesState.flowControl?.highDemandActive ? 'bg-rose-500/5 border-rose-500/20' : 'bg-slate-100/50 dark:bg-white/5 border-slate-200 dark:border-white/5'}`}>
              <div className="flex flex-col">
                <span className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-tight">Modo Crítico (Forçar)</span>
                <span className="text-[9px] font-bold text-slate-900 uppercase tracking-widest mt-1">Surge Fixo 1.5x em toda rede</span>
              </div>
              <button 
                onClick={() => {
                  const newFlow = { ...dynamicRatesState.flowControl, highDemandActive: !dynamicRatesState.flowControl?.highDemandActive };
                  setDynamicRatesState({ ...dynamicRatesState, flowControl: newFlow });
                  saveSpecificRateMetadata('flow_control', newFlow);
                }}
                className={`w-14 h-8 rounded-full relative transition-all shadow-inner ${dynamicRatesState.flowControl?.highDemandActive ? 'bg-rose-500' : 'bg-slate-300 dark:bg-zinc-700'}`}
              >
                <motion.div 
                  layout
                  className="absolute top-1 size-6 bg-white rounded-full shadow-lg"
                  style={{ left: dynamicRatesState.flowControl?.highDemandActive ? 'calc(100% - 28px)' : '4px' }}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preços Base por Categoria */}
      <section className={`${glassCard} p-10`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-5">
            <div className="size-16 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-3xl font-black">category</span>
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Preços Estruturais</h2>
              <p className="text-[10px] font-black text-slate-900 dark:text-slate-900 uppercase tracking-[0.3em] mt-1">Configuração de Taxas Mínimas e Adicionais</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 px-6 py-4 bg-slate-100/50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-inner">
            <span className="text-[10px] font-black uppercase text-slate-800 dark:text-zinc-900 tracking-widest">Ativar Dynamic Pricing</span>
            <button 
              onClick={() => {
                const newBase = { ...dynamicRatesState.baseValues, isDynamicActive: !dynamicRatesState.baseValues?.isDynamicActive };
                setDynamicRatesState((prev: any) => ({ ...prev, baseValues: newBase }));
              }}
              className={`w-12 h-7 rounded-full relative transition-all ${dynamicRatesState.baseValues?.isDynamicActive ? 'bg-primary' : 'bg-slate-300 dark:bg-zinc-700'}`}
            >
              <div className={`absolute top-1 size-5 bg-white rounded-full shadow transition-all ${dynamicRatesState.baseValues?.isDynamicActive ? 'right-1' : 'left-1'}`} />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {[
            { title: 'Restaurantes', id: 'food', icon: 'restaurant' },
            { title: 'Mercados', id: 'market', icon: 'shopping_basket' },
            { title: 'Farmácias', id: 'pharmacy', icon: 'medication' },
            { title: 'Bebidas', id: 'beverages', icon: 'local_bar' },
            { title: 'MotoTáxi', id: 'mototaxi', icon: 'moped' },
            { title: 'Carro Executivo', id: 'carro', icon: 'directions_car' },
          ].map((cat: any) => (
            <CategoryRateCard 
              key={cat.id} 
              cat={cat} 
              state={dynamicRatesState} 
              setState={setDynamicRatesState} 
              inputStyle={inputStyle} 
            />
          ))}

           {/* Izi Log - Card Especial com Grid de Veículos */}
           <div className="xl:col-span-2 space-y-8">
              <div className="flex items-center gap-6 mb-2 ml-4">
                 <div className="size-14 rounded-2xl bg-slate-900 text-primary border border-white/10 flex items-center justify-center shadow-2xl">
                    <span className="material-symbols-outlined text-3xl font-black">local_shipping</span>
                 </div>
                 <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Logística de Carga (Izi Log)</h2>
                    <p className="text-[10px] font-black text-slate-900 dark:text-slate-900 uppercase tracking-[0.3em] mt-1">Gerenciamento Pro de Veículos Pesados</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {[
                   { title: 'Fiorino', id: 'fiorino', icon: 'local_shipping' },
                   { title: 'Van Carga', id: 'van', icon: 'minor_crash' },
                   { title: 'Caminhão Baú', id: 'bau_p', icon: 'rv_hookup' },
                   { title: 'Caminhão Aberto', id: 'aberto', icon: 'truck_period' }
                 ].map(v => (
                   <CategoryRateCard 
                     key={v.id} 
                     cat={v} 
                     state={dynamicRatesState} 
                     setState={setDynamicRatesState} 
                     inputStyle={inputStyle}
                     dark={true}
                   />
                 ))}
              </div>
           </div>
        </div>
      </section>

      {/* Prioridades e Inteligência */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
         {/* Izi Express Flash */}
         <section className={`${glassCard} p-10 flex flex-col gap-12`}>
            <div className="flex items-center gap-6">
               <div className="size-16 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/10 flex items-center justify-center shadow-inner">
                  <span className="material-symbols-outlined text-3xl font-black">electric_bolt</span>
               </div>
               <div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Izi Express Flash</h2>
                  <p className="text-[10px] font-black text-slate-900 dark:text-slate-900 uppercase tracking-[0.3em] mt-1">Níveis de Prioridade Standalone</p>
               </div>
            </div>

            <div className="space-y-6">
               {[
                 { id: 'turbo', label: 'Turbo Flash', icon: 'bolt', color: 'text-amber-500' },
                 { id: 'light', label: 'Light Flash', icon: 'speed', color: 'text-blue-500' },
                 { id: 'normal', label: 'Express', icon: 'moped', color: 'text-slate-900' },
                 { id: 'scheduled', label: 'Agendado', icon: 'calendar_today', color: 'text-emerald-500' }
               ].map(p => {
                 const config = dynamicRatesState.shippingPriorities?.[p.id as keyof DynamicRatesState['shippingPriorities']] || { multiplier: 1.0, min_fee: 0, active: true };
                 return (
                   <div key={p.id} className={`p-8 rounded-[32px] border flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition-all ${config.active ? 'bg-slate-50/50 dark:bg-white/5 border-slate-200 dark:border-white/5 shadow-sm' : 'opacity-40 grayscale border-dashed border-slate-300 dark:border-zinc-800'}`}>
                      <div className="flex items-center gap-5">
                         <div className={`size-12 rounded-2xl bg-white dark:bg-zinc-900 flex items-center justify-center ${p.color} border border-current/10 shadow-md`}>
                            <span className="material-symbols-outlined text-2xl">{p.icon}</span>
                         </div>
                         <div>
                            <span className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{p.label}</span>
                            <p className="text-[9px] font-bold text-slate-900 uppercase tracking-widest mt-1">Configuração de Fator</p>
                         </div>
                      </div>

                      <div className="flex items-center gap-8 bg-white/40 dark:bg-black/20 p-4 rounded-2xl border border-white/50 dark:border-white/5 shadow-inner">
                         <div className="flex flex-col items-center">
                            <span className="text-[8px] font-black text-slate-900 uppercase tracking-widest mb-1">Multiplicador</span>
                            <input 
                              type="number" step="0.1" value={config.multiplier}
                              onChange={(e) => {
                                const newPriorities = { ...dynamicRatesState.shippingPriorities };
                                (newPriorities as any)[p.id].multiplier = parseFloat(e.target.value);
                                setDynamicRatesState({ ...dynamicRatesState, shippingPriorities: newPriorities });
                              }}
                              className="w-16 bg-transparent text-center font-black text-base text-primary outline-none"
                            />
                         </div>
                         <div className="w-px h-8 bg-slate-300 dark:bg-zinc-800" />
                         <div className="flex flex-col items-center">
                            <span className="text-[8px] font-black text-slate-900 uppercase tracking-widest mb-1">Mínima (R$)</span>
                            <input 
                              type="number" value={config.min_fee}
                              onChange={(e) => {
                                const newPriorities = { ...dynamicRatesState.shippingPriorities };
                                (newPriorities as any)[p.id].min_fee = parseFloat(e.target.value);
                                setDynamicRatesState({ ...dynamicRatesState, shippingPriorities: newPriorities });
                              }}
                              className="w-16 bg-transparent text-center font-black text-base text-primary outline-none"
                            />
                         </div>
                         <button 
                            onClick={() => {
                               const newPriorities = { ...dynamicRatesState.shippingPriorities };
                                (newPriorities as any)[p.id].active = !(newPriorities as any)[p.id].active;
                               setDynamicRatesState({ ...dynamicRatesState, shippingPriorities: newPriorities });
                            }}
                            className={`w-12 h-7 rounded-full relative transition-all shadow-inner ${config.active ? 'bg-primary' : 'bg-slate-300 dark:bg-zinc-700'}`}
                         >
                            <motion.div 
                              layout
                              className="absolute top-1 size-5 bg-white rounded-full shadow"
                              style={{ left: config.active ? 'calc(100% - 24px)' : '4px' }}
                            />
                         </button>
                      </div>
                   </div>
                 );
               })}
            </div>
         </section>

         {/* Equilíbrio IA */}
         <section className={`${glassCard} p-10 flex flex-col gap-12`}>
            <div className="flex items-center gap-6">
               <div className="size-16 rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/10 flex items-center justify-center shadow-inner">
                  <span className="material-symbols-outlined text-3xl font-black">tune</span>
               </div>
               <div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Equilíbrio IA</h2>
                  <p className="text-[10px] font-black text-slate-900 dark:text-slate-900 uppercase tracking-[0.3em] mt-1">Sensibilidade do Algoritmo Surge</p>
               </div>
            </div>

            <div className="space-y-12 py-6">
               {[
                 { label: 'Gatilho de Ativação', sub: 'Ratio ideal driver/order', val: dynamicRatesState.equilibrium?.threshold, key: 'threshold', min: 0.5, max: 3.0, step: 0.1, unit: 'x' },
                 { label: 'Agressividade de Curva', sub: 'Velocidade de aumento do surge', val: dynamicRatesState.equilibrium?.sensitivity, key: 'sensitivity', min: 0.1, max: 5.0, step: 0.1, unit: 'x' },
                 { label: 'Teto de Segurança', sub: 'Multiplicador máximo permitido', val: dynamicRatesState.equilibrium?.maxSurge, key: 'maxSurge', min: 1.5, max: 10.0, step: 0.5, unit: 'x' }
               ].map(s => (
                 <div key={s.key} className="space-y-6">
                    <div className="flex justify-between items-end">
                       <div className="flex flex-col">
                          <span className="text-[14px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{s.label}</span>
                          <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest mt-1">{s.sub}</span>
                       </div>
                       <div className="bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-xl">
                          <span className="text-lg font-black text-primary">{s.val?.toFixed(1)}{s.unit}</span>
                       </div>
                    </div>
                    <div className="relative pt-4">
                      <input 
                        type="range" min={s.min} max={s.max} step={s.step} value={s.val}
                        onChange={(e) => {
                          const newEqui = { ...dynamicRatesState.equilibrium, [s.key]: parseFloat(e.target.value) };
                          setDynamicRatesState((prev: any) => ({ ...prev, equilibrium: newEqui }));
                        }}
                        className="w-full accent-primary h-2 bg-slate-200 dark:bg-white/5 rounded-full appearance-none cursor-pointer shadow-inner"
                      />
                      <div className="flex justify-between mt-3 text-[9px] font-black text-slate-900 uppercase tracking-widest">
                        <span>Min: {s.min}</span>
                        <span>Max: {s.max}</span>
                      </div>
                    </div>
                 </div>
               ))}
            </div>

            <div className="mt-auto p-8 rounded-[32px] bg-blue-500/5 border border-blue-500/10 backdrop-blur-sm">
               <div className="flex items-start gap-4">
                  <span className="material-symbols-outlined text-blue-500">info</span>
                  <p className="text-[11px] font-bold text-blue-600/80 dark:text-blue-400/80 leading-relaxed uppercase tracking-wider">
                    O equilíbrio IA ajusta automaticamente os ganhos dos pilotos e o custo para o cliente para garantir que nenhum pedido fique sem atendimento.
                  </p>
               </div>
            </div>
         </section>
      </div>

      {/* Clima e Eventos */}
      <section className={`${glassCard} p-10`}>
         <div className="flex items-center gap-6 mb-16">
            <div className="size-16 rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/10 flex items-center justify-center shadow-inner">
               <span className="material-symbols-outlined text-3xl font-black">thermostat</span>
            </div>
            <div>
               <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Clima & Eventos</h2>
               <p className="text-[10px] font-black text-slate-900 dark:text-slate-900 uppercase tracking-[0.3em] mt-1">Multiplicadores Meteorológicos Dinâmicos</p>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { key: 'rain', label: 'Chuva / Vento Forte', icon: 'water_drop', color: 'text-blue-500' },
              { key: 'storm', label: 'Tempestade Elétrica', icon: 'thunderstorm', color: 'text-amber-500' },
              { key: 'snow', label: 'Feriado / Evento Extremo', icon: 'celebration', color: 'text-rose-500' }
            ].map(w => {
              const active = dynamicRatesState.weather?.[w.key]?.active;
              return (
                <div key={w.key} className={`group p-10 rounded-[48px] transition-all relative overflow-hidden flex flex-col items-center gap-8 ${active ? 'bg-white dark:bg-black/40 ring-4 ring-primary shadow-2xl scale-105 z-10' : 'bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-white/5 opacity-70 hover:opacity-100 shadow-sm'}`}>
                   {active && (
                     <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="absolute top-4 right-4 size-4 rounded-full bg-primary animate-pulse shadow-[0_0_15px_rgba(250,204,21,1)]" 
                     />
                   )}
                   
                   <div className={`size-20 rounded-[32px] bg-white dark:bg-zinc-900 flex items-center justify-center ${w.color} border border-current/10 shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                      <span className="material-symbols-outlined text-4xl">{w.icon}</span>
                   </div>
                   
                   <div className="text-center w-full">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{w.label}</h4>
                      <div className="flex flex-col items-center gap-6 mt-8">
                         <div className="relative w-full max-w-[120px]">
                            <input 
                              type="number" step="0.1" value={dynamicRatesState.weather?.[w.key]?.multiplier || 1.0}
                              onChange={(e) => {
                                const newWeather = { ...dynamicRatesState.weather };
                                newWeather[w.key].multiplier = parseFloat(e.target.value);
                                setDynamicRatesState({ ...dynamicRatesState, weather: newWeather });
                              }}
                              className="w-full bg-white dark:bg-black/60 border border-slate-200 dark:border-white/10 rounded-2xl py-4 text-center font-black text-primary text-xl shadow-inner outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            <span className="absolute -top-3 -right-2 text-[10px] font-black text-slate-900 bg-white dark:bg-zinc-900 px-2 rounded-full border border-slate-200 dark:border-white/10">SURGE</span>
                         </div>
                         <button
                           onClick={() => {
                             const newWeather = { ...dynamicRatesState.weather };
                             newWeather[w.key].active = !newWeather[w.key].active;
                             setDynamicRatesState({ ...dynamicRatesState, weather: newWeather });
                           }}
                           className={`w-16 h-9 rounded-full relative transition-all shadow-inner ${active ? 'bg-primary' : 'bg-slate-300 dark:bg-zinc-700'}`}
                         >
                           <motion.div 
                              layout
                              className="absolute top-1 size-7 bg-white rounded-full shadow-lg"
                              style={{ left: active ? 'calc(100% - 32px)' : '4px' }}
                           />
                         </button>
                      </div>
                   </div>
                </div>
              );
            })}
         </div>
      </section>

      {/* Regras Geográficas e Temporais */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
         {/* Zonas de Demanda */}
         <section className={`${glassCard} p-10 flex flex-col gap-10`}>
            <div className="flex justify-between items-center">
               <div className="flex items-center gap-5">
                  <div className="size-14 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-inner">
                     <span className="material-symbols-outlined text-2xl font-black">map</span>
                  </div>
                  <div>
                     <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Zonas de Demanda</h2>
                     <p className="text-[10px] font-black text-slate-900 dark:text-slate-900 uppercase tracking-[0.2em] mt-1">Taxas Extras por Perímetro</p>
                  </div>
               </div>
               <button className="size-12 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl">
                  <span className="material-symbols-outlined">add</span>
               </button>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
               {dynamicRatesState.zones?.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-20 bg-slate-100/50 dark:bg-white/5 rounded-[32px] border border-dashed border-slate-300 dark:border-white/10">
                    <span className="material-symbols-outlined text-slate-900 text-4xl mb-4">location_off</span>
                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Nenhuma zona configurada</p>
                 </div>
               ) : (
                 dynamicRatesState.zones.map((zone: any) => (
                   <div key={zone.id} className="p-6 rounded-[28px] bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-center justify-between group hover:border-primary/30 transition-all shadow-sm">
                      <div className="flex items-center gap-4">
                         <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary border border-primary/10">
                            <span className="material-symbols-outlined text-lg">layers</span>
                         </div>
                         <div>
                            <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{zone.label}</span>
                            <p className="text-[9px] font-bold text-slate-900 uppercase tracking-widest mt-1">Taxa Fixa: <span className="text-primary">R${zone.fee || '0.00'}</span></p>
                         </div>
                      </div>
                      <button 
                        onClick={() => handleRemoveZone(zone.id)}
                        className="size-10 rounded-xl bg-rose-500/10 text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white flex items-center justify-center"
                      >
                         <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                   </div>
                 ))
               )}
            </div>
         </section>

         {/* Horários de Pico */}
         <section className={`${glassCard} p-10 flex flex-col gap-10`}>
            <div className="flex justify-between items-center">
               <div className="flex items-center gap-5">
                  <div className="size-14 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-inner">
                     <span className="material-symbols-outlined text-2xl font-black">schedule</span>
                  </div>
                  <div>
                     <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Horários de Pico</h2>
                     <p className="text-[10px] font-black text-slate-900 dark:text-slate-900 uppercase tracking-[0.2em] mt-1">Sobretaxas por Janela de Tempo</p>
                  </div>
               </div>
               <button 
                onClick={() => setIsAddingPeakRule(true)}
                className="size-12 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl"
               >
                  <span className="material-symbols-outlined">add</span>
               </button>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
               {dynamicRatesState.peakHours?.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-20 bg-slate-100/50 dark:bg-white/5 rounded-[32px] border border-dashed border-slate-300 dark:border-white/10">
                    <span className="material-symbols-outlined text-slate-900 text-4xl mb-4">timer_off</span>
                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Nenhum horário configurado</p>
                 </div>
               ) : (
                 dynamicRatesState.peakHours.map((rule: any) => (
                   <div key={rule.id} className="p-6 rounded-[28px] bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-center justify-between group hover:border-primary/30 transition-all shadow-sm">
                      <div className="flex items-center gap-4">
                         <div className="size-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500 border border-blue-500/10">
                            <span className="material-symbols-outlined text-lg">alarm_on</span>
                         </div>
                         <div>
                            <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{rule.label}</span>
                            <p className="text-[9px] font-bold text-slate-900 uppercase tracking-widest mt-1">Multiplicador: <span className="text-primary">{rule.multiplier}x</span></p>
                         </div>
                      </div>
                      <button 
                        onClick={() => handleRemovePeakRule(rule.id)}
                        className="size-10 rounded-xl bg-rose-500/10 text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white flex items-center justify-center"
                      >
                         <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                   </div>
                 ))
               )}
            </div>
         </section>
      </div>

      {/* Rodapé Informativo */}
      <div className="text-center py-10 opacity-30">
         <p className="text-[9px] font-black uppercase tracking-[0.5em] dark:text-white">Engine de Precificação Dinâmica IZI v4.0</p>
         <p className="text-[8px] font-bold uppercase tracking-[0.2em] mt-2 dark:text-slate-900">Otimizado para Latência Ultrabaixa e Escalabilidade Linear</p>
      </div>
    </div>
  );
}

function CategoryRateCard({ cat, state, setState, inputStyle, dark = false }: any) {
  const modeKey = `${cat.id}_pricing_mode`;
  const rangesKey = `${cat.id}_ranges`;
  const minKey = `${cat.id}_min`;
  const kmKey = `${cat.id}_km`;
  const extraKmKey = `${cat.id}_extra_km`;
  
  const mode = state.baseValues?.[modeKey] || 'simple';
  const ranges = (state.baseValues?.[rangesKey] || []) as any[];
  const extraKmValue = state.baseValues?.[extraKmKey] ?? '0,00';

  const handleAddRange = () => {
    const lastRange = ranges[ranges.length - 1];
    const from = lastRange ? lastRange.to : 0;
    const to = from + 2;
    const newRanges = [...ranges, { from, to, price: 8.0 }];
    setState((prev: any) => ({
      ...prev,
      baseValues: { ...prev.baseValues, [rangesKey]: newRanges }
    }));
  };

  const handleRemoveRange = (idx: number) => {
    const newRanges = ranges.filter((_, i) => i !== idx);
    setState((prev: any) => ({
      ...prev,
      baseValues: { ...prev.baseValues, [rangesKey]: newRanges }
    }));
  };

  const handleRangeChange = (idx: number, field: string, value: any) => {
    const newRanges = [...ranges];
    if (field === 'price') {
       newRanges[idx] = { ...newRanges[idx], [field]: value };
    } else {
       newRanges[idx] = { ...newRanges[idx], [field]: parseFloat(value) || 0 };
    }
    setState((prev: any) => ({
      ...prev,
      baseValues: { ...prev.baseValues, [rangesKey]: newRanges }
    }));
  };

  const cardBase = dark 
    ? "p-8 rounded-[40px] bg-slate-900 text-white border border-white/5 shadow-2xl relative overflow-hidden"
    : "p-8 rounded-[40px] bg-white/40 backdrop-blur-2xl border border-white/50 shadow-xl relative overflow-hidden transition-all duration-500 hover:shadow-2xl";

  const labelColor = dark ? "text-slate-400" : "text-slate-900";
  const textColor = dark ? "text-white" : "text-slate-900";
  const subLabelColor = dark ? "text-slate-500" : "text-slate-900";
  const inputBg = dark ? "bg-black/40 border-white/5" : "bg-white/50 border-white/80";

  return (
    <div className={cardBase}>
      {dark && <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -mr-32 -mt-32 blur-[80px] pointer-events-none" />}
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 relative z-10">
        <div className="flex items-center gap-4">
          <div className={`size-12 rounded-2xl flex items-center justify-center shadow-inner ${dark ? 'bg-white/5 text-primary border border-white/10' : 'bg-primary/10 text-primary border border-primary/20'}`}>
            <span className="material-symbols-outlined text-2xl font-black">{cat.icon || 'restaurant'}</span>
          </div>
          <div>
            <h3 className={`text-xl font-black tracking-tight uppercase ${textColor}`}>{cat.title}</h3>
            <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${subLabelColor}`}>Configuração de Custos</p>
          </div>
        </div>
        
        <div className={`flex items-center gap-1 p-1 rounded-2xl border ${dark ? 'bg-black/20 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
          {[
            { id: 'simple', label: 'Simples', icon: 'bolt' },
            { id: 'tiered', label: 'Por Faixa', icon: 'distance' }
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setState((prev: any) => ({
                ...prev,
                baseValues: { ...prev.baseValues, [modeKey]: m.id }
              }))}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                mode === m.id 
                ? (dark ? 'bg-white/10 text-primary shadow-sm' : 'bg-white text-primary shadow-sm') 
                : (dark ? 'text-slate-400 hover:text-white' : 'text-slate-900 hover:text-slate-800')
              }`}
            >
              <span className="material-symbols-outlined text-sm">{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {mode === 'simple' ? (
          <motion.div 
            key="simple"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-2 gap-6 relative z-10"
          >
            <div className="space-y-2">
              <label className={`text-[9px] font-black uppercase tracking-widest ml-2 ${labelColor}`}>Taxa Mínima</label>
              <div className="relative">
                <input
                  type="text"
                  value={String(state.baseValues?.[minKey] ?? '0,00')}
                  onChange={(e) => setState((prev: any) => ({
                    ...prev,
                    baseValues: { ...prev.baseValues, [minKey]: e.target.value }
                  }))}
                  className={`${inputStyle} ${dark ? 'bg-black/40 border-white/5 text-primary' : ''}`}
                />
                <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black ${labelColor}`}>R$</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className={`text-[9px] font-black uppercase tracking-widest ml-2 ${labelColor}`}>Add p/ KM</label>
              <div className="relative">
                <input
                  type="text"
                  value={String(state.baseValues?.[kmKey] ?? '0,00')}
                  onChange={(e) => setState((prev: any) => ({
                    ...prev,
                    baseValues: { ...prev.baseValues, [kmKey]: e.target.value }
                  }))}
                  className={`${inputStyle} ${dark ? 'bg-black/40 border-white/5 text-primary' : ''}`}
                />
                <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black ${labelColor}`}>R$</span>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="tiered"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6 relative z-10"
          >
            <div className="flex items-center justify-between px-2">
               <span className={`text-[10px] font-black uppercase tracking-widest ${labelColor}`}>Faixas de Distância</span>
               <button 
                 onClick={handleAddRange}
                 className="flex items-center gap-1.5 text-primary hover:text-primary/80 transition-all hover:scale-105"
               >
                 <span className="material-symbols-outlined text-sm font-black">add_circle</span>
                 <span className="text-[9px] font-black uppercase tracking-widest">Add Faixa</span>
               </button>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {ranges.map((range, idx) => (
                <div key={idx} className={`grid grid-cols-12 gap-4 items-center p-4 rounded-3xl border group/range transition-all ${dark ? 'bg-white/5 border-white/5' : 'bg-white/60 border-white/80'} hover:ring-1 hover:ring-primary/30 shadow-sm`}>
                  <div className="col-span-3 space-y-1">
                    <span className={`text-[7px] font-black uppercase tracking-widest ml-1 ${labelColor}`}>De (KM)</span>
                    <input 
                      type="number" step="0.1" value={range.from}
                      onChange={(e) => handleRangeChange(idx, 'from', e.target.value)}
                      className={`w-full bg-transparent text-sm font-black outline-none text-center ${textColor}`}
                    />
                  </div>
                  <div className="col-span-3 space-y-1">
                    <span className={`text-[7px] font-black uppercase tracking-widest ml-1 ${labelColor}`}>Até (KM)</span>
                    <input 
                      type="number" step="0.1" value={range.to}
                      onChange={(e) => handleRangeChange(idx, 'to', e.target.value)}
                      className={`w-full bg-transparent text-sm font-black outline-none text-center ${textColor}`}
                    />
                  </div>
                  <div className="col-span-4 space-y-1">
                    <span className={`text-[7px] font-black uppercase tracking-widest ml-1 ${labelColor}`}>Preço (R$)</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-900">R$</span>
                      <input 
                        type="text" value={range.price}
                        onChange={(e) => handleRangeChange(idx, 'price', e.target.value)}
                        className="w-full bg-transparent text-sm font-black text-primary outline-none text-right"
                      />
                    </div>
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <button 
                      onClick={() => handleRemoveRange(idx)}
                      className="size-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover/range:opacity-100"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>
              ))}
              
              {ranges.length === 0 && (
                <div className={`py-12 flex flex-col items-center gap-4 rounded-3xl border border-dashed ${dark ? 'bg-black/20 border-white/10' : 'bg-slate-100/50 border-slate-300'}`}>
                   <span className={`material-symbols-outlined text-3xl ${subLabelColor}`}>distance</span>
                   <p className={`text-[9px] font-black uppercase tracking-widest ${subLabelColor}`}>Nenhuma faixa definida</p>
                </div>
              )}
            </div>

            <div className={`p-6 rounded-[32px] border border-dashed transition-all ${dark ? 'bg-black/20 border-white/10' : 'bg-primary/5 border-primary/20'}`}>
               <div className="flex items-center justify-between gap-6">
                  <div className="flex flex-col">
                     <span className={`text-[10px] font-black uppercase tracking-widest ${textColor}`}>Após última faixa</span>
                     <span className={`text-[8px] font-bold uppercase tracking-tight ${subLabelColor}`}>Cobrar KM excedente</span>
                  </div>
                  <div className="relative w-32">
                     <input 
                       type="text" 
                       value={extraKmValue}
                       onChange={(e) => setState((prev: any) => ({ ...prev, baseValues: { ...prev.baseValues, [extraKmKey]: e.target.value } }))}
                       className={`${inputStyle} ${dark ? 'bg-black/40 border-white/5 text-primary' : 'bg-white/80 border-white/50'}`}
                     />
                     <span className={`absolute -top-3 right-0 text-[8px] font-black px-2 rounded-full border ${dark ? 'bg-zinc-900 border-white/10 text-primary' : 'bg-white border-primary/20 text-primary'}`}>R$/KM</span>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
