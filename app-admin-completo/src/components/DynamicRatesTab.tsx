import { useRef } from 'react';
import { useAdmin } from '../context/AdminContext';

// Taxas Dinâmicas
export default function DynamicRatesTab() {
  const {
    dynamicRatesState, setDynamicRatesState, setIsAddingPeakRule, 
    handleRemovePeakRule, saveDynamicRates, saveSpecificRateMetadata, 
    stats, allOrders, isSaving
  } = useAdmin();

  const headerRef = useRef<HTMLDivElement>(null);

  return (
    <>
      {/* Header de Comando Financeiro */}
      <div ref={headerRef} className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 bg-white dark:bg-slate-900 p-12 rounded-[56px] border border-slate-100 dark:border-slate-800 shadow-2xl relative overflow-hidden group">
        {/* Camada de Gradiente Decorativo */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full -mr-64 -mt-64 blur-[120px] pointer-events-none group-hover:bg-primary/10 transition-all duration-700"></div>
        
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="size-20 rounded-[35px] bg-primary flex items-center justify-center shadow-[0_20px_50px_rgba(255,217,0,0.4)] group-hover:rotate-6 transition-all duration-500">
             <span className="material-symbols-outlined text-white text-4xl font-black">finance_chip</span>
          </div>
          <div className="text-center md:text-left space-y-2">
            <div className="flex items-center justify-center md:justify-start gap-4">
               <h1 className="text-4xl font-black text-slate-900 dark:text-white leading-tight tracking-tighter italic">Gestão de Taxas</h1>
               <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-full flex items-center gap-2">
                  <div className="size-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  Operação Ativa
               </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-lg font-medium max-w-xl leading-relaxed">
               Configure multiplicadores surge, preços base e zonas de demanda para otimizar o equilíbrio da plataforma.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 relative z-10 self-center lg:self-center">
          <button
            disabled={isSaving}
            onClick={saveDynamicRates}
            className={`group/btn flex items-center justify-center gap-4 px-14 h-20 rounded-[35px] font-black text-xs uppercase tracking-[0.3em] shadow-2xl transition-all duration-500 relative overflow-hidden ${
              isSaving 
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed scale-95' 
              : 'bg-primary text-slate-900 hover:scale-105 active:scale-95 hover:shadow-primary/40'
            }`}
          >
            {isSaving ? (
              <>
                <div className="size-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                Publicando...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-xl transition-transform group-hover/btn:translate-y-[-3px]">rocket_launch</span>
                Publicar Alterações
              </>
            )}
            
            {/* Brilho interno no hover */}
            {!isSaving && <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000 skew-x-12"></div>}
          </button>
        </div>
      </div>

      {/* Market Pulse & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
        <div className="lg:col-span-2 bg-slate-950 rounded-[48px] p-10 text-white relative overflow-hidden flex flex-col justify-between shadow-2xl border border-white/5 group">
           {/* Background decorativo */}
           <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 -mr-48 -mt-48 rounded-full blur-[120px] transition-all group-hover:bg-primary/30"></div>
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 -ml-32 -mb-32 rounded-full blur-[100px]"></div>
           
           <div className="flex flex-col sm:flex-row justify-between items-start gap-6 relative z-10">
              <div className="space-y-4">
                 <div className="flex items-center gap-4">
                    <div className="size-14 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-3xl shadow-inner">
                       <span className="material-symbols-outlined text-primary text-3xl font-black">query_stats</span>
                    </div>
                    <div>
                       <h3 className="text-2xl font-black tracking-tight text-white italic">Pulso da Operação</h3>
                       <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Monitoramento de Equilíbrio em Tempo Real</p>
                    </div>
                 </div>

                 <div className="flex items-center gap-8 pl-1">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 italic">Entregadores Online</span>
                       <div className="flex items-center gap-2">
                          <div className="size-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                          <span className="text-2xl font-black">{stats?.onlineDrivers || 0}</span>
                       </div>
                    </div>
                    <div className="w-px h-10 bg-white/10"></div>
                    <div className="flex flex-col">
                       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 italic">Pedidos Ativos</span>
                       <div className="flex items-center gap-2 text-primary">
                          <span className="material-symbols-outlined text-sm">shopping_bag</span>
                          <span className="text-2xl font-black">{(allOrders?.filter(o => ['pendente', 'aceito', 'preparando', 'novo', 'waiting_driver'].includes(o.status)).length) || 0}</span>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="bg-white/5 backdrop-blur-2xl px-8 py-6 rounded-[35px] border border-white/10 shadow-lg flex flex-col items-center gap-3">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Indice de Surge</p>
                 <div className="text-4xl font-black text-primary drop-shadow-[0_0_15px_rgba(255,217,0,0.3)] italic">1,25x</div>
                 <div className="px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">Saudável</div>
              </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-12 relative z-10">
              <div className="bg-white/5 rounded-3xl p-6 border border-white/5 space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Saúde da Malha</span>
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Excelente</span>
                 </div>
                 <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex">
                    <div className="w-4/5 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"></div>
                 </div>
                 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Sua capacidade de atendimento é de 92%</p>
              </div>

              <div className="bg-white/5 rounded-3xl p-6 border border-white/5 flex items-center justify-between group-hover:border-primary/20 transition-all">
                 <div className="space-y-1">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Tempo Médio Pickup</span>
                    <p className="text-xl font-black text-white italic">8.5 min</p>
                 </div>
                 <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                    <span className="material-symbols-outlined text-lg">avg_time</span>
                 </div>
              </div>
           </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[48px] p-10 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-10 hover:shadow-2xl transition-all">
          <div className="space-y-2">
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-2xl">bolt</span>
              Modo Turbo
            </h3>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest italic">Ações Rápidas de Operação</p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm hover:border-primary/30 transition-all cursor-pointer">
              <div className="flex flex-col">
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Modo Inteligente</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">IA monitorando tráfego</span>
              </div>
              <button 
                onClick={() => {
                  const newFlow = { ...dynamicRatesState.flowControl, mode: dynamicRatesState.flowControl?.mode === 'auto' ? 'manual' : 'auto' };
                  setDynamicRatesState({ ...dynamicRatesState, flowControl: newFlow });
                  saveSpecificRateMetadata('flow_control', newFlow);
                }}
                className={`w-14 h-8 rounded-full relative shadow-lg transition-all ${dynamicRatesState.flowControl?.mode === 'auto' ? 'bg-primary shadow-primary/20' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <div className={`absolute top-1 size-6 bg-white rounded-full transition-all ${dynamicRatesState.flowControl?.mode === 'auto' ? 'right-1' : 'left-1'}`}></div>
              </button>
            </div>

            <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm hover:border-red-500/30 transition-all cursor-pointer">
              <div className="flex flex-col">
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Surge Crítico</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Forçar 1.5x global agora</span>
              </div>
              <button 
                onClick={() => {
                  const newFlow = { ...dynamicRatesState.flowControl, highDemandActive: !dynamicRatesState.flowControl?.highDemandActive };
                  setDynamicRatesState({ ...dynamicRatesState, flowControl: newFlow });
                  saveSpecificRateMetadata('flow_control', newFlow);
                }}
                className={`w-14 h-8 rounded-full relative transition-all ${dynamicRatesState.flowControl?.highDemandActive ? 'bg-red-500 shadow-lg shadow-red-500/20' : 'bg-slate-300 dark:bg-slate-700 shadow-inner'}`}
              >
                <div className={`absolute top-1 size-6 bg-white rounded-full transition-all ${dynamicRatesState.flowControl?.highDemandActive ? 'right-1' : 'left-1'}`}></div>
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
                  setDynamicRatesState((prev: any) => ({ ...prev, baseValues: newBase }));
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
              { title: 'Van de Transporte', minKey: 'van_min', kmKey: 'van_km' },
              { 
                title: 'Logística / Frete', 
                minKey: 'logistica_min', 
                kmKey: 'logistica_km',
                extras: [
                  { label: 'Adicional Escada', key: 'logistica_stairs' },
                  { label: 'Por Ajudante', key: 'logistica_helper' }
                ],
                vehicles: [
                  { title: 'Fiorino', minKey: 'fiorino_min', kmKey: 'fiorino_km' },
                  { title: 'Caminhonete', minKey: 'caminhonete_min', kmKey: 'caminhonete_km' },
                  { title: 'Baú P', minKey: 'bau_p_min', kmKey: 'bau_p_km' },
                  { title: 'Baú M', minKey: 'bau_m_min', kmKey: 'bau_m_km' },
                  { title: 'Baú G', minKey: 'bau_g_min', kmKey: 'bau_g_km' },
                  { title: 'Aberto', minKey: 'aberto_min', kmKey: 'aberto_km' }
                ]
              }
            ].map((cat: any) => (
              <div key={cat.title} className={`flex flex-col gap-6 p-8 rounded-[38px] ${cat.vehicles ? 'col-span-1 md:col-span-2' : ''} bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-2xl bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-sm text-primary">{cat.vehicles ? 'local_shipping' : 'category'}</span>
                    </div>
                    <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">{cat.title}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-1 relative group">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Taxa Mínima (Base)</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={dynamicRatesState.baseValues?.[cat.minKey] || '0.00'}
                        onChange={(e) => {
                          const newBase = { ...dynamicRatesState.baseValues, [cat.minKey]: e.target.value };
                          setDynamicRatesState((prev: any) => ({ ...prev, baseValues: newBase }));
                        }}
                        className="w-full text-right bg-white dark:bg-slate-900 border-none outline-none font-black text-primary text-base rounded-2xl py-3 px-4 shadow-inner focus:ring-2 focus:ring-primary/20 transition-all pr-[35px]"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">R$</span>
                    </div>
                  </div>

                  <div className="space-y-1 relative group">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Por KM (Global)</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={dynamicRatesState.baseValues?.[cat.kmKey] || '0.00'}
                        onChange={(e) => {
                          const newBase = { ...dynamicRatesState.baseValues, [cat.kmKey]: e.target.value };
                          setDynamicRatesState((prev: any) => ({ ...prev, baseValues: newBase }));
                        }}
                        className="w-full text-right bg-white dark:bg-slate-900 border-none outline-none font-black text-primary text-base rounded-2xl py-3 px-4 shadow-inner focus:ring-2 focus:ring-primary/20 transition-all pr-[35px]"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">R$</span>
                    </div>
                  </div>

                  {cat.extras?.map((extra: any) => (
                    <div key={extra.key} className="space-y-1 relative group">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{extra.label}</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={dynamicRatesState.baseValues?.[extra.key] || '0.00'}
                          onChange={(e) => {
                            const newBase = { ...dynamicRatesState.baseValues, [extra.key]: e.target.value };
                            setDynamicRatesState((prev: any) => ({ ...prev, baseValues: newBase }));
                          }}
                          className="w-full text-right bg-white dark:bg-slate-900 border-none outline-none font-black text-primary text-base rounded-2xl py-3 px-4 shadow-inner focus:ring-2 focus:ring-primary/20 transition-all pr-[35px]"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">R$</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subcategorias de Veículos para Logística */}
                {cat.vehicles && (
                  <div className="mt-4 pt-6 border-t border-slate-200/50 dark:border-slate-700/50 space-y-6">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Configurações Específicas por Veículo</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {cat.vehicles.map((v: any) => (
                        <div key={v.minKey} className="p-5 rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                           <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-wider">{v.title}</p>
                           <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Min (R$)</label>
                                <input
                                  type="text"
                                  value={dynamicRatesState.baseValues?.[v.minKey] || '0.00'}
                                  onChange={(e) => {
                                    const newBase = { ...dynamicRatesState.baseValues, [v.minKey]: e.target.value };
                                    setDynamicRatesState((prev: any) => ({ ...prev, baseValues: newBase }));
                                  }}
                                  className="w-full text-right bg-slate-50 dark:bg-slate-800 border-none outline-none font-black text-primary text-xs rounded-xl py-2 px-3 shadow-inner"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">KM (R$)</label>
                                <input
                                  type="text"
                                  value={dynamicRatesState.baseValues?.[v.kmKey] || '0.00'}
                                  onChange={(e) => {
                                    const newBase = { ...dynamicRatesState.baseValues, [v.kmKey]: e.target.value };
                                    setDynamicRatesState((prev: any) => ({ ...prev, baseValues: newBase }));
                                  }}
                                  className="w-full text-right bg-slate-50 dark:bg-slate-800 border-none outline-none font-black text-primary text-xs rounded-xl py-2 px-3 shadow-inner"
                                />
                              </div>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                  setDynamicRatesState((prev: any) => ({ ...prev, equilibrium: newEqui }));
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
                  setDynamicRatesState((prev: any) => ({ ...prev, equilibrium: newEqui }));
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
                  setDynamicRatesState((prev: any) => ({ ...prev, equilibrium: newEqui }));
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
