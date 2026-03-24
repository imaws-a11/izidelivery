import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';

// Taxas Dinâmicas
export default function DynamicRatesTab() {
  const {
    dynamicRatesState, setDynamicRatesState, isAddingPeakRule, setIsAddingPeakRule, 
    newPeakRule, setNewPeakRule, newZoneData, setNewZoneData, 
    selectedZoneForMap, setSelectedZoneForMap, mapSearch, setMapSearch, 
    isGeolocating, setIsGeolocating, mapCenterView, setMapCenterView, 
    fixedGridCenter, setFixedGridCenter, selectedHexagons, setSelectedHexagons, 
    hexGrid, getHexPath, isLoaded, mapsLoadError, handleAddPeakRule, 
    handleRemovePeakRule, handleAddZone, handleRemoveZone,
    fetchDynamicRates, saveDynamicRates, saveSpecificRateMetadata, stats, allOrders
  } = useAdmin();

  const [isSaving, setIsSaving] = useState(false);

  return (
    <>
      {/* Dynamic Rates Pro Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-white dark:bg-slate-900 p-10 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 -mr-32 -mt-32 rounded-full blur-3xl"></div>
        <div className="flex flex-col gap-2 relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">Motor de Preços v4.0</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">Gestão de Taxas Dinâmicas</h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium max-w-2xl">Refine a economia do seu marketplace ajustando multiplicadores em tempo real para equilibrar oferta e demanda.</p>
        </div>
        <div className="flex items-center gap-4 relative z-10">
          <button
            onClick={() => fetchDynamicRates()}
            className="group flex items-center justify-center gap-3 px-8 h-16 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-[28px] font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-200 transition-all"
          >
            <span className="material-symbols-outlined transition-transform group-hover:rotate-180">restart_alt</span>
            Descartar
          </button>
          <button
            onClick={saveDynamicRates}
            className="flex items-center justify-center gap-3 px-12 h-16 bg-primary text-slate-900 rounded-[28px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined">verified</span>
            Publicar Alterações
          </button>
        </div>
      </div>

      {/* Market Pulse & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
        <div className="lg:col-span-2 bg-slate-900 rounded-[48px] p-10 text-white relative overflow-hidden flex flex-col justify-between shadow-2xl">
          <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,#ffd900,transparent_70%)]"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <h3 className="text-xl font-black uppercase tracking-widest text-primary mb-1">Pulso do Mercado</h3>
              <p className="text-slate-400 text-sm font-bold">Equilíbrio da Operação em Tempo Real</p>
            </div>
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
              <div className="size-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black uppercase tracking-widest">Sincronizado</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8 mt-12 relative z-10">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ratio Atual (D/O)</p>
              <h4 className="text-4xl font-black">
                {stats ? (stats.onlineDrivers / (allOrders?.filter(o => o.status === 'pendente').length || 1)).toFixed(2) : '1.00'}
              </h4>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Surge Sugerido</p>
              <h4 className="text-4xl font-black text-primary">1.25x</h4>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tempo de Espera Clientes</p>
              <h4 className="text-4xl font-black">8.5 min</h4>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[48px] p-10 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-8">
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">rocket_launch</span>
            Controle de Fluxo
          </h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
              <div className="flex flex-col">
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Modo Dinâmico Automático</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{dynamicRatesState.flowControl?.mode === 'auto' ? 'IA ativa monitorando oferta/demanda' : 'Modo manual habilitado'}</span>
              </div>
              <button 
                onClick={() => {
                  const newFlow = { ...dynamicRatesState.flowControl, mode: dynamicRatesState.flowControl?.mode === 'auto' ? 'manual' : 'auto' };
                  setDynamicRatesState({ ...dynamicRatesState, flowControl: newFlow });
                  saveSpecificRateMetadata('flow_control', newFlow);
                }}
                className={`w-12 h-7 rounded-full relative shadow-lg transition-all ${dynamicRatesState.flowControl?.mode === 'auto' ? 'bg-primary shadow-primary/20' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <div className={`absolute top-1 size-5 bg-white rounded-full transition-all ${dynamicRatesState.flowControl?.mode === 'auto' ? 'right-1' : 'left-1'}`}></div>
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
              <div className="flex flex-col">
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Modo de Alta Demanda</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Forçar surge em todo o mapa</span>
              </div>
              <button 
                onClick={() => {
                  const newFlow = { ...dynamicRatesState.flowControl, highDemandActive: !dynamicRatesState.flowControl?.highDemandActive };
                  setDynamicRatesState({ ...dynamicRatesState, flowControl: newFlow });
                  saveSpecificRateMetadata('flow_control', newFlow);
                }}
                className={`w-12 h-7 rounded-full relative transition-all ${dynamicRatesState.flowControl?.highDemandActive ? 'bg-red-500 shadow-lg shadow-red-200' : 'bg-slate-200 dark:bg-slate-700'}`}
              >
                <div className={`absolute top-1 size-5 bg-white rounded-full transition-all ${dynamicRatesState.flowControl?.highDemandActive ? 'right-1' : 'left-1'}`}></div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 mt-10">
        {/* Valores Base de Precificação */}
        <section className="bg-white dark:bg-slate-900 px-6 py-10 sm:p-10 rounded-[56px] border border-slate-100 dark:border-slate-800 shadow-sm col-span-1 xl:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-3xl bg-emerald-50 text-emerald-500 border border-emerald-100">
                <span className="material-symbols-outlined font-black text-2xl">universal_currency_alt</span>
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Preços Base p/ Categorias</h2>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Taxas por distância e serviço</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-3 pr-4 rounded-[28px] border border-slate-100 dark:border-slate-700">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Usar Preços Dinâmicos</span>
              <button 
                onClick={() => {
                  const newBase = { ...dynamicRatesState.baseValues, isDynamicActive: !dynamicRatesState.baseValues?.isDynamicActive };
                  setDynamicRatesState(prev => ({ ...prev, baseValues: newBase }));
                }}
                className={`w-14 h-8 rounded-full relative shadow-lg transition-all ${dynamicRatesState.baseValues?.isDynamicActive ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <div className={`absolute top-1 size-6 bg-white rounded-full transition-all ${dynamicRatesState.baseValues?.isDynamicActive ? 'right-1' : 'left-1'}`}></div>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: 'MotoTáxi', minKey: 'mototaxi_min', kmKey: 'mototaxi_km' },
              { title: 'Carro Executivo', minKey: 'carro_min', kmKey: 'carro_km' },
              { title: 'Entrega Express', minKey: 'utilitario_min', kmKey: 'utilitario_km' },
              { title: 'Van de Transporte', minKey: 'van_min', kmKey: 'van_km' }
            ].map((cat) => (
              <div key={cat.title} className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 p-6 rounded-[32px] bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-2xl bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm"><span className="material-symbols-outlined text-sm text-primary">category</span></div>
                  <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">{cat.title}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="space-y-1 relative group w-1/2 xl:w-28">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Taxa Mínima</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={dynamicRatesState.baseValues?.[cat.minKey] || '0.00'}
                        onChange={(e) => {
                          const newBase = { ...dynamicRatesState.baseValues, [cat.minKey]: e.target.value };
                          setDynamicRatesState(prev => ({ ...prev, baseValues: newBase }));
                        }}
                        className="w-full text-right bg-white dark:bg-slate-900 border-none outline-none font-black text-primary text-lg rounded-2xl py-3 px-4 shadow-inner focus:ring-2 focus:ring-primary/20 transition-all pr-[35px]"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">R$</span>
                    </div>
                  </div>
                  <div className="space-y-1 relative group w-1/2 xl:w-28">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Por KM</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={dynamicRatesState.baseValues?.[cat.kmKey] || '0.00'}
                        onChange={(e) => {
                          const newBase = { ...dynamicRatesState.baseValues, [cat.kmKey]: e.target.value };
                          setDynamicRatesState(prev => ({ ...prev, baseValues: newBase }));
                        }}
                        className="w-full text-right bg-white dark:bg-slate-900 border-none outline-none font-black text-primary text-lg rounded-2xl py-3 px-4 shadow-inner focus:ring-2 focus:ring-primary/20 transition-all pr-[35px]"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">R$</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Equilíbrio de Marketplace Section */}
        <section className="bg-white dark:bg-slate-900 p-10 rounded-[56px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-4 mb-10">
            <div className="p-4 rounded-3xl bg-blue-50 text-blue-500 border border-blue-100">
              <span className="material-symbols-outlined font-black text-2xl">balance</span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Equilíbrio do Logic</h2>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Sensibilidade do algoritmo</p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center px-4">
                <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Gatilho (Threshold)</label>
                <span className="bg-blue-100 text-blue-700 font-black px-3 py-1 rounded-full text-xs">{dynamicRatesState.equilibrium?.threshold}x Ratio</span>
              </div>
              <input 
                type="range" min="0.5" max="3.0" step="0.1"
                value={dynamicRatesState.equilibrium?.threshold || 1.0}
                onChange={(e) => {
                  const newEqui = { ...dynamicRatesState.equilibrium, threshold: parseFloat(e.target.value) };
                  setDynamicRatesState(prev => ({ ...prev, equilibrium: newEqui }));
                }}
                className="w-full accent-primary h-2 bg-slate-100 rounded-full appearance-none cursor-pointer"
              />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center px-4">
                <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Sensibilidade (Aggressiveness)</label>
                <span className="bg-amber-100 text-amber-700 font-black px-3 py-1 rounded-full text-xs">{dynamicRatesState.equilibrium?.sensitivity}x</span>
              </div>
              <input 
                type="range" min="1.0" max="5.0" step="0.5"
                value={dynamicRatesState.equilibrium?.sensitivity || 1.0}
                onChange={(e) => {
                  const newEqui = { ...dynamicRatesState.equilibrium, sensitivity: parseFloat(e.target.value) };
                  setDynamicRatesState(prev => ({ ...prev, equilibrium: newEqui }));
                }}
                className="w-full accent-primary h-2 bg-slate-100 rounded-full appearance-none cursor-pointer"
              />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center px-4">
                <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Teto Máximo (Hard Cap)</label>
                <span className="bg-red-100 text-red-700 font-black px-3 py-1 rounded-full text-xs">{dynamicRatesState.equilibrium?.maxSurge}x Valor</span>
              </div>
              <input 
                type="range" min="2.0" max="10.0" step="1.0"
                value={dynamicRatesState.equilibrium?.maxSurge || 2.0}
                onChange={(e) => {
                  const newEqui = { ...dynamicRatesState.equilibrium, maxSurge: parseFloat(e.target.value) };
                  setDynamicRatesState(prev => ({ ...prev, equilibrium: newEqui }));
                }}
                className="w-full accent-primary h-2 bg-slate-100 rounded-full appearance-none cursor-pointer"
              />
            </div>
          </div>
        </section>

        {/* Horários de Pico */}
        <section className="bg-white dark:bg-slate-900 p-10 rounded-[56px] border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-xl hover:shadow-primary/5">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-3xl bg-primary/10 text-primary border border-primary/20">
                <span className="material-symbols-outlined font-black text-2xl">schedule</span>
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Horários de Pico</h2>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Multiplicadores automáticos</p>
              </div>
            </div>
            <button 
              onClick={() => setIsAddingPeakRule(true)}
              className="size-12 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary transition-all flex items-center justify-center border border-slate-100 shadow-sm"
            >
              <span className="material-symbols-outlined font-black">add</span>
            </button>
          </div>

          <div className="space-y-4">
            {dynamicRatesState.peakHours?.map((rule, idx) => (
              <div key={rule.id} className="p-6 rounded-[32px] bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 flex items-center justify-between group hover:border-primary/30 transition-all">
                <div className="flex flex-col">
                  <span className="text-base font-black text-slate-900 dark:text-white">{rule.label}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Janela Diária Ativa</span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <input
                      type="number" step="0.1"
                      value={rule.multiplier}
                      onChange={(e) => {
                        const newPeak = [...dynamicRatesState.peakHours];
                        newPeak[idx].multiplier = parseFloat(e.target.value);
                        setDynamicRatesState({ ...dynamicRatesState, peakHours: newPeak });
                      }}
                      className="w-20 bg-white dark:bg-slate-900 border-none rounded-xl text-center font-black text-sm py-3 text-primary focus:ring-2 focus:ring-primary shadow-sm"
                    />
                    <span className="absolute -top-2 -right-2 size-5 bg-primary text-slate-900 rounded-full text-[8px] font-black flex items-center justify-center shadow-md">x</span>
                  </div>
                  <button
                    onClick={() => {
                      const newPeak = [...dynamicRatesState.peakHours];
                      newPeak[idx].active = !newPeak[idx].active;
                      setDynamicRatesState({ ...dynamicRatesState, peakHours: newPeak });
                    }}
                    className={`w-14 h-8 rounded-full relative transition-all ${rule.active ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 size-6 bg-white rounded-full shadow-md transition-all ${rule.active ? 'right-1' : 'left-1'}`}></div>
                  </button>
                  <button 
                    onClick={() => handleRemovePeakRule(rule.id)}
                    className="text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Zonas de Alta Demanda */}
        <section className="bg-white dark:bg-slate-900 p-10 rounded-[56px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-3xl bg-indigo-50 text-indigo-500 border border-indigo-100">
                <span className="material-symbols-outlined font-black text-2xl">near_me</span>
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Zonas de Alta Demanda</h2>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Geofencing & Taxas Fixas</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {dynamicRatesState.zones?.map((zone, idx) => (
              <div key={zone.id} className="p-6 rounded-[32px] bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group/z hover:border-indigo-200 transition-all">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{zone.label}</span>
                    <div className="flex items-center gap-2">
                       <span className="size-1.5 rounded-full bg-indigo-500"></span>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acréscimo fixo ativado</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 border-t sm:border-t-0 pt-4 sm:pt-0">
                  <div className="relative group">
                    <input
                      type="text"
                      value={zone.fee}
                      onChange={(e) => {
                        const newZones = [...dynamicRatesState.zones];
                        newZones[idx].fee = e.target.value;
                        setDynamicRatesState({ ...dynamicRatesState, zones: newZones });
                      }}
                      className="w-24 bg-white dark:bg-slate-900 border-none rounded-xl py-3 px-4 font-black text-primary text-sm shadow-sm focus:ring-2 focus:ring-primary/20 text-right pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">R$</span>
                  </div>
                  <button
                    onClick={() => {
                      const newZones = [...dynamicRatesState.zones];
                      newZones[idx].active = !newZones[idx].active;
                      setDynamicRatesState({ ...dynamicRatesState, zones: newZones });
                    }}
                    className={`w-14 h-8 rounded-full relative transition-all ${zone.active ? 'bg-indigo-500 shadow-lg shadow-indigo-200' : 'bg-slate-200 dark:bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 size-6 bg-white rounded-full shadow-md transition-all ${zone.active ? 'right-1' : 'left-1'}`}></div>
                  </button>
                  <button 
                    onClick={() => handleRemoveZone(zone.id)}
                    className="text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Condições Climáticas (Wide) */}
        <section className="bg-white dark:bg-slate-900 p-10 rounded-[64px] border border-slate-100 dark:border-slate-800 shadow-sm col-span-1 xl:col-span-2 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[6px] bg-gradient-to-r from-blue-400 via-primary to-emerald-400"></div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-3xl bg-blue-50 text-blue-500 border border-blue-100">
                <span className="material-symbols-outlined font-black text-2xl">cloudy_snowing</span>
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Condições Climáticas Atuantes</h2>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Ajuste de sensibilidade meteorológica</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { key: 'rain', label: 'Chuva / Vento', icon: 'water_drop', color: 'text-blue-500', bg: 'bg-blue-50' },
              { key: 'storm', label: 'Tempestade Severa', icon: 'thunderstorm', color: 'text-amber-500', bg: 'bg-amber-50' },
              { key: 'snow', label: 'Neve / Gelo', icon: 'ac_unit', color: 'text-indigo-500', bg: 'bg-indigo-50' }
            ].map((weather) => (
              <div key={weather.key} className="group p-10 rounded-[48px] bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 flex flex-col items-center gap-8 hover:bg-white dark:hover:bg-slate-900 hover:shadow-2xl transition-all relative overflow-hidden">
                <div className={`p-6 rounded-[32px] ${weather.bg} ${weather.color} border border-current/10 shadow-lg group-hover:scale-110 transition-transform relative z-10`}>
                  <span className="material-symbols-outlined text-4xl">{weather.icon}</span>
                </div>
                
                <div className="text-center relative z-10">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">{weather.label}</h3>
                  <p className="text-[9px] font-black text-slate-400 mt-2 uppercase tracking-[0.3em]">Multiplicador do Valor</p>
                </div>

                <div className="flex items-center gap-6 relative z-10 w-full justify-center">
                  <div className="relative">
                    <input
                      type="number" step="0.1"
                      value={dynamicRatesState.weather?.[weather.key]?.multiplier || 1.0}
                      onChange={(e) => {
                        const newWeather = { ...dynamicRatesState.weather };
                        newWeather[weather.key].multiplier = parseFloat(e.target.value);
                        setDynamicRatesState({ ...dynamicRatesState, weather: newWeather });
                      }}
                      className="w-28 bg-white dark:bg-slate-950 border-none rounded-2xl py-5 text-center font-black text-2xl text-primary shadow-inner focus:ring-2 focus:ring-primary/20"
                    />
                    <span className="absolute -bottom-2 right-1/2 translate-x-1/2 bg-primary text-slate-900 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg">Multi</span>
                  </div>
                  <button
                    onClick={() => {
                      const newWeather = { ...dynamicRatesState.weather };
                      newWeather[weather.key].active = !newWeather[weather.key].active;
                      setDynamicRatesState({ ...dynamicRatesState, weather: newWeather });
                    }}
                    className={`w-16 h-9 rounded-full relative transition-all ${dynamicRatesState.weather?.[weather.key]?.active ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700 shadow-inner'}`}
                  >
                    <div className={`absolute top-1 size-7 bg-white rounded-full shadow-md transition-all ${dynamicRatesState.weather?.[weather.key]?.active ? 'right-1' : 'left-1'}`}></div>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
