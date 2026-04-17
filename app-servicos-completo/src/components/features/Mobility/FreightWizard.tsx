import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "../../common/Icon";
import { AddressSearchInput } from "../Address/AddressSearchInput";
import { IziTrackingMap } from "../Map/IziTrackingMap";

interface FreightWizardProps {
  transitData: any;
  setTransitData: React.Dispatch<React.SetStateAction<any>>;
  mobilityStep: number;
  setMobilityStep: (step: number) => void;
  userLocation: any;
  updateLocation: (onSuccess?: (address: string) => void) => void;
  routePolyline: string;
  driverLocation: any;
  distancePrices: Record<string, number>;
  isCalculatingPrice: boolean;
  marketConditions: any;
  paymentMethod: string;
  userLevel: number;
  routeDistance: string;
  setPaymentsOrigin: (origin: any) => void;
  setSubView: (view: any) => void;
  navigateSubView: (view: any) => void;
  showToast: (msg: string, type?: any) => void;
}

export const FreightWizard: React.FC<FreightWizardProps> = ({
  transitData,
  setTransitData,
  mobilityStep,
  setMobilityStep,
  userLocation,
  updateLocation,
  routePolyline,
  driverLocation,
  distancePrices,
  marketConditions,
  paymentMethod,
  routeDistance,
  setPaymentsOrigin,
  setSubView,
  navigateSubView,
  showToast,
}) => {

  const freightData = transitData.freightData || {
    vehicleType: "",
    hasStairs: false,
    helpers: 0,
    items: ""
  };

  const updateFreight = (updates: any) => {
    setTransitData((prev: any) => ({
      ...prev,
      freightData: { ...(prev.freightData || freightData), ...updates }
    }));
  };

  const vehicleTypes = [
    { id: "fiorino", name: "Fiorino", icon: "local_shipping", priceKey: "fiorino" },
    { id: "van", name: "Van Carga", icon: "airport_shuttle", priceKey: "van_carga" },
    { id: "truck_p", name: "Caminhão Baú Pequeno", icon: "local_shipping", priceKey: "bau_p" },
    { id: "truck_m", name: "Caminhão Baú Médio", icon: "local_shipping", priceKey: "bau_m" },
    { id: "truck_g", name: "Caminhão Baú Grande", icon: "rv_hookup", priceKey: "bau_g" },
    { id: "truck_bau", name: "Caminhão Aberto", icon: "local_shipping", priceKey: "aberto" },
  ];

  const totalValue = React.useMemo(() => {
    // Se não houver distância calculada ou veículo selecionado, o valor deve ser zero
    if (!routeDistance || !freightData.vehicleType) return 0;

    const vehicle = vehicleTypes.find(v => v.name === freightData.vehicleType);
    const priceKey = vehicle?.priceKey || "logistica";
    const base = distancePrices[priceKey] || distancePrices.logistica || 0;
    
    // Taxas dinâmicas do Admin
    const baseValues = marketConditions?.settings?.baseValues || {};
    const stairTaxValue = parseFloat(baseValues.logistica_stairs) || 30.0;
    const helperTaxValue = parseFloat(baseValues.logistica_helper) || 35.0;

    const stairTax = freightData.hasStairs ? stairTaxValue : 0;
    const helperTax = freightData.helpers * helperTaxValue;
    
    return base + stairTax + helperTax;
  }, [distancePrices, freightData, vehicleTypes, marketConditions, routeDistance]);

  return (
    <div className="absolute inset-0 z-[120] bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden italic">
      
      {/* SECTION MAPA - TOPO */}
      <section className="relative h-[38vh] shrink-0 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <IziTrackingMap 
            routePolyline={routePolyline} 
            driverLoc={driverLocation} 
            userLoc={(userLocation?.lat && userLocation?.lng) ? { lat: userLocation.lat as number, lng: userLocation.lng as number } : null} 
            onMyLocationClick={updateLocation} 
            boxed={true}
          />
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/60 pointer-events-none z-10" />
        
        <header className="absolute top-10 left-0 right-0 z-20 flex items-center justify-between px-8">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              if (mobilityStep > 1) setMobilityStep(mobilityStep - 1);
              else setSubView("none");
            }} 
            className="size-12 rounded-2xl bg-zinc-900/80 backdrop-blur-xl border border-white/10 flex items-center justify-center text-yellow-400 shadow-2xl clay-card-dark"
          >
            <Icon name="arrow_back" />
          </motion.button>
          <div className="text-right">
            <h2 className="text-xl font-black text-white tracking-tighter leading-none mb-1 uppercase text-shadow-sm">
              Izi Logistics
            </h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400">Frete & Mudanças</p>
          </div>
        </header>

        <div className="absolute bottom-6 left-6 right-6 z-20 flex flex-wrap gap-2">
           <div className={`clay-card-yellow px-4 py-2 rounded-[20px] font-black text-[10px] text-black flex items-center gap-2 shadow-[0_10px_20px_rgba(250,204,21,0.2)] italic border border-white/20 transition-all duration-500
             ${!routeDistance ? 'opacity-50 grayscale' : 'opacity-100'}`}>
             <span className="material-symbols-rounded text-sm">route</span>
             {routeDistance ? routeDistance.split(' • ')[0] : "-- KM"}
           </div>
           
           <div className={`clay-card-yellow px-4 py-2 rounded-[20px] font-black text-[10px] text-black flex items-center gap-2 shadow-[0_10px_20px_rgba(250,204,21,0.2)] italic border border-white/20 transition-all duration-500
             ${!routeDistance ? 'opacity-50 grayscale' : 'opacity-100'}`}>
             <span className="material-symbols-rounded text-sm">schedule</span>
             {routeDistance ? routeDistance.split(' • ')[1] : "-- MIN"}
           </div>

           <div className="clay-card-yellow px-4 py-2 rounded-[20px] font-black text-[10px] text-black flex items-center gap-2 shadow-[0_10px_20px_rgba(250,204,21,0.2)] italic border border-white/20 animate-in fade-in slide-in-from-bottom-2">
             <span className="material-symbols-rounded text-sm">payments</span>
             <span>R$ {totalValue.toFixed(2).replace('.', ',')}</span>
           </div>
        </div>
      </section>

      {/* SECTION CONTEÚDO */}
      <main className="flex-1 bg-zinc-950 -mt-6 relative z-30 rounded-t-[40px] border-t border-white/5 overflow-y-auto no-scrollbar p-8 pt-10 pb-32 space-y-10">
        
        <AnimatePresence mode="wait">
          {mobilityStep === 1 ? (
            <motion.section 
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10"
            >
              {/* ROTEIRO */}
              <div className="space-y-6">
                <h3 className="text-zinc-500 font-black text-[9px] uppercase tracking-[0.3em] px-2 italic text-shadow-sm">Endereços Confirmados</h3>
                <div className="space-y-4 relative">
                  <div className="absolute left-9 top-1/2 -translate-y-1/2 w-[1.5px] h-10 bg-zinc-800" />
                  
                  <div className="clay-card-dark rounded-[30px] p-4 pl-5 flex items-center gap-4 border border-white/5 shadow-inner">
                    <div className="size-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Icon name="package_2" size={18} className="text-emerald-400" />
                    </div>
                    <AddressSearchInput
                      placeholder="Local de Coleta"
                      onSelect={(addr) => setTransitData((p: any) => ({...p, origin: addr}))}
                      defaultValue={transitData.origin?.address}
                      className="bg-transparent text-white font-black text-xs w-full outline-none placeholder:text-zinc-800 italic"
                    />
                  </div>

                  <div className="clay-card-dark rounded-[30px] p-4 pl-5 flex items-center gap-4 border border-white/5 shadow-inner">
                    <div className="size-10 rounded-2xl bg-yellow-500/10 flex items-center justify-center shrink-0">
                      <Icon name="location_on" size={18} className="text-yellow-400" />
                    </div>
                    <AddressSearchInput
                      placeholder="Local de Entrega"
                      onSelect={(addr) => setTransitData((p: any) => ({...p, destination: addr}))}
                      defaultValue={transitData.destination?.address}
                      className="bg-transparent text-white font-black text-xs w-full outline-none placeholder:text-zinc-800 italic"
                    />
                  </div>
                </div>
              </div>

              {/* ESCOLHA DO TIPO DE VEÍCULO */}
              <div className="space-y-6">
                 <div className="flex justify-between items-end px-2">
                    <h3 className="text-zinc-500 font-black text-[9px] uppercase tracking-[0.3em] italic">Tipo de Veículo</h3>
                    <span className="text-yellow-400 text-[10px] font-black uppercase italic">Ideal para sua carga</span>
                 </div>
                 
                 <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 pr-10">
                    {vehicleTypes.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => {
                          updateFreight({vehicleType: v.name});
                          setTransitData((prev: any) => ({ ...prev, vehicleCategory: v.name }));
                        }}
                        className={`min-w-[140px] p-6 rounded-[40px] flex flex-col items-center gap-5 transition-all duration-300 active:scale-90
                          ${freightData.vehicleType === v.name 
                            ? 'clay-card-yellow border-2 border-yellow-200/50 scale-105 z-10' 
                            : 'clay-card-dark border border-white/5 opacity-40 grayscale blur-[0.5px] hover:blur-0 hover:opacity-100 hover:grayscale-0'}`}
                      >
                         <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner
                            ${freightData.vehicleType === v.name ? 'bg-black/10' : 'bg-white/5'}`}>
                            <span className={`material-symbols-rounded text-3xl ${freightData.vehicleType === v.name ? 'text-black' : 'text-zinc-500'}`}>
                              {v.icon}
                            </span>
                         </div>
                         <span className={`text-[10px] font-black uppercase tracking-tighter text-center leading-tight
                            ${freightData.vehicleType === v.name ? 'text-black' : 'text-zinc-500'}`}>
                            {v.name}
                         </span>
                      </button>
                    ))}
                 </div>
              </div>

              {/* DETALHES ADICIONAIS - ESCADA E AJUDANTES */}
              <div className="space-y-6">
                 <h3 className="text-zinc-500 font-black text-[9px] uppercase tracking-[0.3em] px-2 italic">Detalhes da Logística</h3>
                 <div className="clay-card-dark rounded-[40px] p-8 border border-white/5 space-y-8 shadow-2xl">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="size-10 rounded-2xl bg-yellow-400/10 flex items-center justify-center shadow-inner">
                             <Icon name="stairs" size={20} className="text-yellow-400" />
                          </div>
                          <div className="flex flex-col">
                             <span className="text-white font-black text-xs uppercase italic">Possui Escada?</span>
                             <span className="text-[9px] text-zinc-600 font-black uppercase">Prédios sem elevador</span>
                          </div>
                       </div>
                       <button 
                        onClick={() => updateFreight({hasStairs: !freightData.hasStairs})}
                        className={`w-14 h-8 rounded-full p-1 transition-all duration-300 flex items-center
                          ${freightData.hasStairs ? 'bg-yellow-400' : 'bg-zinc-800'}`}
                       >
                         <div className={`size-6 rounded-full bg-black shadow-lg shadow-black/40 transition-all duration-300 transform
                           ${freightData.hasStairs ? 'translate-x-6' : 'translate-x-0'}`} />
                       </button>
                    </div>

                    <div className="h-px bg-white/5 w-full" />

                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="size-10 rounded-2xl bg-yellow-400/10 flex items-center justify-center shadow-inner">
                             <Icon name="groups" size={20} className="text-yellow-400" />
                          </div>
                          <div className="flex flex-col">
                             <span className="text-white font-black text-xs uppercase italic">Precisa de Ajudante?</span>
                             <span className="text-[9px] text-zinc-600 font-black uppercase">Valor por profissional</span>
                          </div>
                       </div>
                       <div className="flex items-center gap-4 bg-black/40 px-4 py-2 rounded-2xl border border-white/5">
                         <button 
                          onClick={() => updateFreight({helpers: Math.max(0, freightData.helpers - 1)})}
                          className="size-8 rounded-xl bg-zinc-800 flex items-center justify-center text-yellow-400 active:scale-75 transition-all"
                         >
                            <span className="material-symbols-rounded">remove</span>
                         </button>
                         <span className="text-white font-black text-sm">{freightData.helpers}</span>
                         <button 
                          onClick={() => updateFreight({helpers: freightData.helpers + 1})}
                          className="size-8 rounded-xl bg-yellow-400 flex items-center justify-center text-black active:scale-75 transition-all"
                         >
                            <span className="material-symbols-rounded">add</span>
                         </button>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="clay-card-dark rounded-[35px] p-8 border border-white/5 space-y-3">
                 <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest italic">O que vamos levar hoje?</p>
                 <textarea 
                  value={freightData.items}
                  onChange={(e) => updateFreight({items: e.target.value})}
                  placeholder="Ex: 1 Geladeira, 1 Fogão e 3 Caixas..."
                  rows={2}
                  className="w-full bg-transparent text-white font-black text-sm outline-none border-none p-0 italic placeholder:text-zinc-800 resize-none"
                 />
              </div>

              {/* ESPAÇO FINAL PARA SCROLL */}
              <div className="h-10" />
            </motion.section>
          ) : (
            <motion.section 
              key="step2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-10"
            >
               <div className="clay-card-dark rounded-[40px] p-8 border-l-4 border-yellow-400 space-y-8">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-2xl bg-yellow-400/10 flex items-center justify-center shadow-inner">
                        <Icon name="payments" size={24} className="text-yellow-400" />
                      </div>
                      <div className="flex-1 space-y-4">
                         <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-xl font-black text-white tracking-tighter leading-none italic">{freightData.vehicleType || "Selecione o Veículo"}</h4>
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400 mt-1">Orçamento Inteligente Izi</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[28px] font-black text-white italic leading-none">R$ {totalValue.toFixed(2).replace('.', ',')}</p>
                              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Valor Total Estimado</p>
                            </div>
                         </div>

                         {/* Detalhamento de Precisão */}
                         {routeDistance && freightData.vehicleType && (
                           <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                              <div className="flex gap-4">
                                <span>Base: R$ {(totalValue - (parseFloat(routeDistance) * (distancePrices[vehicleTypes.find(v => v.name === freightData.vehicleType)?.priceKey || 'logistica'] || 0) / (parseFloat(routeDistance) || 1))).toFixed(2)}</span>
                                <span>KM: R$ {(totalValue - (totalValue - (parseFloat(routeDistance) * (distancePrices[vehicleTypes.find(v => v.name === freightData.vehicleType)?.priceKey || 'logistica'] || 0) / (parseFloat(routeDistance) || 1)))).toFixed(2)} ({routeDistance})</span>
                              </div>
                              <Icon name="verified" size={12} className="text-emerald-500" />
                           </div>
                         )}
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-white/5 w-full" />

                  <div className="space-y-5">
                    <div className="flex justify-between items-center px-2">
                       <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">Pagamento</span>
                       <button 
                        onClick={() => navigateSubView("mobility_payment")}
                        className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-2xl border border-white/5 hover:bg-white/10 transition-all active:scale-95 shadow-md"
                       >
                         <Icon name={paymentMethod === 'online' ? 'credit_card' : 'payments'} size={14} className="text-yellow-400" />
                         <span className="text-white font-black text-[10px] uppercase italic">
                           {paymentMethod === 'online' ? 'Cartão Online' : 'Pagar na Coleta'}
                         </span>
                       </button>
                    </div>

                    <div className="bg-black/30 p-6 rounded-[30px] border border-white/5 space-y-4">
                       <div className="flex justify-between text-[11px] font-black text-zinc-500 italic">
                          <span>Distância:</span>
                          <span className="text-zinc-200">{routeDistance}</span>
                       </div>
                       <div className="flex justify-between text-[11px] font-black text-zinc-500 italic">
                          <span>Veículo:</span>
                          <span className="text-yellow-400">{freightData.vehicleType}</span>
                       </div>
                       {freightData.hasStairs && (
                         <div className="flex justify-between text-[11px] font-black text-orange-400 italic">
                            <span>Taxa de Escada:</span>
                            <span>Sim (+R$40)</span>
                         </div>
                       )}
                       {freightData.helpers > 0 && (
                         <div className="flex justify-between text-[11px] font-black text-zinc-500 italic">
                            <span>Ajudantes ({freightData.helpers}x):</span>
                            <span className="text-zinc-200">R$ {(freightData.helpers * 50).toFixed(2)}</span>
                       </div>
                       )}
                    </div>
                  </div>
               </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* BOTÃO FIXO */}
      <div className="fixed bottom-0 left-0 right-0 p-8 pb-12 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent z-50">
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (mobilityStep === 1) {
              if (!transitData.origin || !transitData.destination) {
                showToast("Escolha a origem e destino do frete", "warning");
                return;
              }
              setMobilityStep(2);
            } else {
              // Garante que o valor calculado no wizard seja o valor usado no checkout
              setTransitData((prev: any) => ({ ...prev, estPrice: totalValue }));
              setPaymentsOrigin("checkout");
              navigateSubView("mobility_payment");
            }
          }}
          className="w-full h-20 bg-yellow-400 clay-card-dark py-6 rounded-full flex items-center justify-center gap-4 shadow-[0_20px_60px_rgba(250,204,21,0.3)] active:grayscale transition-all relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-yellow-400 opacity-90 shadow-[inset_4px_4px_10px_rgba(255,255,255,0.4)]" />
          <span className="relative z-10 text-black font-black text-xl tracking-tighter uppercase italic">
            {mobilityStep === 1 ? "Prosseguir" : "Confirmar Izi Logistics"}
          </span>
          <Icon name={mobilityStep === 1 ? "arrow_forward" : "local_shipping"} className="relative z-10 text-black font-black group-hover:translate-x-2 transition-transform" size={28} />
        </motion.button>
      </div>

    </div>
  );
};
