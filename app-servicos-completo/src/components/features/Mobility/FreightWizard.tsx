import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "../../common/Icon";
import { AddressSearchInput } from "../Address/AddressSearchInput";
import { IziTrackingMap } from "../Map/IziTrackingMap";
import { calculateFreightPrice } from "../../../lib/pricing_engine";

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
  distanceValueKm?: number;
  marketConditions?: any;
  setShowDatePicker: (val: boolean) => void;
  setShowTimePicker: (val: boolean) => void;
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
  distanceValueKm = 0,
  marketConditions,
  setShowDatePicker,
  setShowTimePicker,
  setPaymentsOrigin,
  setSubView,
  navigateSubView,
  showToast,
}) => {
  // CÁLCULO DINÂMICO DE FRETE
  const getEstimatedTotal = () => {
    if (!marketConditions?.settings?.baseValues) return 0;
    const bv = marketConditions.settings.baseValues;
    const surgeMultiplier = (bv.isDynamicActive ? marketConditions.surgeMultiplier : 1.0) || 1.0;
    
    try {
      const calculation = calculateFreightPrice({
        baseFare: parseFloat(String(bv.logistica_min || 45)),
        distanceInKm: distanceValueKm || 0,
        distanceRate: parseFloat(String(bv.logistica_km || 3)) * surgeMultiplier,
        helperCount: transitData.helpers || 0,
        helperRate: parseFloat(String(bv.logistica_helper || 35)),
        hasStairs: transitData.accessibility?.stairsAtOrigin || transitData.accessibility?.stairsAtDestination,
        stairsFee: parseFloat(String(bv.logistica_stairs || 30))
      });
      return calculation.totalPrice;
    } catch (e) {
      return 0;
    }
  };

  const estimatedTotal = getEstimatedTotal();

  React.useEffect(() => {
    console.log("FreightWizard TransitData Updated:", {
      helpers: transitData.helpers,
      stairs: transitData.accessibility?.stairsAtOrigin
    });
  }, [transitData]);

  return (
    <div className="absolute inset-0 z-[120] bg-transparent text-zinc-100 flex flex-col overflow-hidden italic">
      {/* MAPA NO FUNDO */}
      <div className="absolute inset-0 z-0 h-full">
        <IziTrackingMap 
          routePolyline={routePolyline} 
          driverLoc={driverLocation} 
          userLoc={(userLocation?.lat && userLocation?.lng) ? { lat: userLocation.lat as number, lng: userLocation.lng as number } : null} 
          onMyLocationClick={updateLocation} 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-zinc-950/90 pointer-events-none" />
      </div>

      <header className="relative z-50 flex items-center justify-between px-6 pt-10">
        <div className="flex items-center gap-4">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              if (mobilityStep > 1) {
                setMobilityStep(mobilityStep - 1);
              } else {
                setSubView("none");
              }
            }} 
            className="size-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-purple-400 shadow-[4px_4px_10px_rgba(0,0,0,0.4),inset_2px_2px_4px_rgba(255,255,255,0.05)]"
          >
            <Icon name="arrow_back" />
          </motion.button>
          {mobilityStep > 1 && (
            <motion.button 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSubView("none")} 
              className="px-4 py-3 rounded-2xl bg-zinc-900/50 border border-white/5 flex items-center justify-center text-zinc-500 text-[10px] font-black uppercase tracking-widest shadow-lg"
            >
              Sair
            </motion.button>
          )}
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-black text-white tracking-tighter leading-none mb-1 uppercase text-shadow-sm">
            Caminhão de Frete
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400">Logística Completa</p>
        </div>
      </header>

      <main className="relative z-40 mt-auto bg-zinc-950/90 backdrop-blur-3xl border-t border-white/5 flex flex-col h-[75vh] rounded-t-[45px] shadow-[0_-25px_50px_rgba(0,0,0,0.6)]">
        <div className="flex justify-center pt-4 pb-2">
          <div className="w-12 h-1.5 bg-white/10 rounded-full" />
        </div>
        <div className="p-8 pb-32 overflow-y-auto no-scrollbar flex-1 space-y-10">
          {mobilityStep === 1 && (
            <motion.section initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              <div className="space-y-2">
                <h3 className="text-xl font-black text-white tracking-tight uppercase italic">Configuração do Frete</h3>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest italic">Informe a rota e as condições de acessibilidade.</p>
              </div>
              
              <div className="space-y-6">
                <motion.div 
                  whileHover={{ scale: 1.01 }} 
                  className="bg-zinc-900/50 rounded-[35px] p-7 shadow-[10px_10px_20px_rgba(0,0,0,0.3),inset_2px_2px_4px_rgba(255,255,255,0.03)] border border-white/5 group transition-all"
                >
                  <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.3em] mb-3 ml-1">Retirada</p>
                  <AddressSearchInput 
                    initialValue={transitData.origin}
                    placeholder="Local de coleta"
                    className="w-full bg-transparent border-none p-0 text-base font-black text-white focus:ring-0 placeholder:text-zinc-700 italic"
                    userCoords={userLocation.lat ? { lat: userLocation.lat, lng: userLocation.lng } : null}
                    onSelect={(p: any) => {
                      const ori = p.formatted_address || "";
                      setTransitData((prev: any) => ({
                        ...prev, 
                        origin: ori,
                        originCoords: p.lat ? { lat: p.lat, lng: p.lng } : null
                      }));
                    }}
                  />
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.01 }} 
                  className="bg-zinc-900/50 rounded-[35px] p-7 shadow-[10px_10px_20px_rgba(0,0,0,0.3),inset_2px_2px_4px_rgba(255,255,255,0.03)] border border-white/5 group transition-all"
                >
                  <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.3em] mb-3 ml-1">Entrega</p>
                  <AddressSearchInput 
                    initialValue={transitData.destination}
                    placeholder="Local de destino"
                    className="w-full bg-transparent border-none p-0 text-base font-black text-white focus:ring-0 placeholder:text-zinc-700 italic"
                    userCoords={transitData.originCoords || (userLocation.lat ? { lat: userLocation.lat, lng: userLocation.lng } : null)}
                    onSelect={(p: any) => {
                      const dest = p.formatted_address || "";
                      setTransitData((prev: any) => ({
                        ...prev, 
                        destination: dest,
                        destinationCoords: p.lat ? { lat: p.lat, lng: p.lng } : null
                      }));
                    }}
                  />
                </motion.div>

                <div className="bg-zinc-900/50 rounded-[35px] p-8 border border-white/5 shadow-inner space-y-6">
                   <div className="flex items-center justify-between">
                      <div className="space-y-1">
                         <p className="text-xs font-black text-white uppercase italic">Possui Escadas?</p>
                         <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">Origem ou Destino</p>
                      </div>
                      <div className="flex bg-zinc-950 p-1 rounded-2xl border border-white/5 shadow-lg">
                        <button 
                          onClick={() => setTransitData((prev: any) => ({...prev, accessibility: {...prev.accessibility, stairsAtOrigin: false, stairsAtDestination: false}}))}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${!transitData.accessibility?.stairsAtOrigin ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-600 hover:text-zinc-400'}`}
                        >
                          Não
                        </button>
                        <button 
                          onClick={() => setTransitData((prev: any) => ({...prev, accessibility: {...prev.accessibility, stairsAtOrigin: true, stairsAtDestination: true}}))}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${transitData.accessibility?.stairsAtOrigin ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'text-zinc-600 hover:text-zinc-400'}`}
                        >
                          Sim
                        </button>
                      </div>
                   </div>

                   <div className="h-px bg-white/5 mx-2" />

                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                           <p className="text-xs font-black text-white uppercase italic">Precisa de Ajudantes?</p>
                           <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">Carga e Descarga</p>
                        </div>
                        <div className="flex bg-zinc-950 p-1 rounded-2xl border border-white/5 shadow-lg">
                           <button 
                             onClick={() => setTransitData((prev: any) => ({ ...prev, helpers: 0 }))}
                             className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${(transitData.helpers || 0) === 0 ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-600 hover:text-zinc-400'}`}
                           >
                             Não
                           </button>
                           <button 
                             onClick={() => setTransitData((prev: any) => ({ ...prev, helpers: Math.max(1, prev.helpers || 0) }))}
                             className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${(transitData.helpers || 0) > 0 ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'text-zinc-600 hover:text-zinc-400'}`}
                           >
                             Sim
                           </button>
                        </div>
                      </div>

                      <AnimatePresence>
                        {(transitData.helpers || 0) > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="flex items-center justify-between pt-6 border-t border-white/10 mt-2">
                               <div className="space-y-1">
                                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Quantidade</p>
                                  <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest italic">Máximo 10 ajudantes</p>
                               </div>
                               <div className="flex items-center gap-5 bg-zinc-800/80 p-2 rounded-2xl border border-white/5 backdrop-blur-md">
                                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setTransitData((prev: any) => ({...prev, helpers: Math.max(1, (prev.helpers || 0) - 1)}))} className="size-11 rounded-xl bg-zinc-900 flex items-center justify-center text-white active:scale-95 transition-all shadow-lg border border-white/5 active:bg-zinc-800">-</motion.button>
                                  <span className="text-base font-black text-white w-5 text-center drop-shadow-lg">{transitData.helpers || 0}</span>
                                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setTransitData((prev: any) => ({...prev, helpers: Math.min(10, (prev.helpers || 0) + 1)}))} className="size-11 rounded-xl bg-purple-500 flex items-center justify-center text-white active:scale-95 transition-all shadow-lg shadow-purple-500/20">+</motion.button>
                               </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                   </div>
                </div>
              </div>
            </motion.section>
          )}

          {mobilityStep === 2 && (
            <motion.section initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              <div className="space-y-2">
                <h3 className="text-xl font-black text-white tracking-tight uppercase italic">Data e Horário</h3>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest italic">Fretes são realizados apenas por agendamento.</p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                 <motion.div 
                   whileTap={{ scale: 0.98 }}
                   onClick={() => setShowDatePicker(true)}
                   className="bg-zinc-900/50 rounded-[35px] p-8 border border-white/5 shadow-xl flex items-center justify-between group cursor-pointer"
                 >
                    <div className="flex items-center gap-5">
                       <div className="size-14 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                          <Icon name="calendar_month" className="text-purple-400" />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Data da Coleta</p>
                          <p className="text-base font-black text-white italic">{transitData.scheduledDate || "Escolher Data"}</p>
                       </div>
                    </div>
                    <span className="material-symbols-outlined text-zinc-700 group-hover:text-purple-400 transition-colors">edit_calendar</span>
                 </motion.div>

                 <motion.div 
                   whileTap={{ scale: 0.98 }}
                   onClick={() => setShowTimePicker(true)}
                   className="bg-zinc-900/50 rounded-[35px] p-8 border border-white/5 shadow-xl flex items-center justify-between group cursor-pointer"
                 >
                    <div className="flex items-center gap-5">
                       <div className="size-14 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                          <Icon name="schedule" className="text-purple-400" />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Horário Previsto</p>
                          <p className="text-base font-black text-white italic">{transitData.scheduledTime || "Escolher Horário"}</p>
                       </div>
                    </div>
                    <span className="material-symbols-outlined text-zinc-700 group-hover:text-purple-400 transition-colors">history_toggle_off</span>
                 </motion.div>
              </div>

              <div className="p-6 rounded-[30px] bg-white/5 border border-white/10 flex items-start gap-4">
                 <Icon name="info" className="text-zinc-500 scale-75" />
                 <p className="text-[10px] font-bold text-zinc-500 italic leading-relaxed uppercase tracking-wider">
                   Nossos motoristas de frete precisam de antecedência para organizar a logística e ajudantes.
                 </p>
              </div>
            </motion.section>
          )}

          {mobilityStep === 3 && (
            <motion.section initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              <div className="space-y-2">
                <h3 className="text-xl font-black text-white tracking-tight uppercase italic">Resumo do Frete</h3>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest italic">Confira todos os detalhes antes de solicitar.</p>
              </div>

              <div className="bg-zinc-900 border border-white/5 p-8 rounded-[45px] shadow-[25px_25px_50px_rgba(0,0,0,0.6),inset_4px_4px_10px_rgba(255,255,255,0.05)]">
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-5">
                     <div className="size-15 rounded-3xl bg-zinc-800 flex items-center justify-center border border-white/5 shadow-inner">
                        <span className="material-symbols-outlined text-purple-400 text-2xl font-black">inventory_2</span>
                     </div>
                     <div className="flex-1">
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] leading-none mb-2">Transporte</p>
                        <p className="text-base font-black text-white italic uppercase tracking-tighter">Caminhão Baú de Frete</p>
                     </div>
                  </div>

                  <div className="h-px bg-white/5" />

                  <div className="flex items-center gap-5">
                    <div className="size-15 rounded-3xl bg-zinc-800 flex items-center justify-center border border-white/5 shadow-inner">
                      <span className="material-symbols-outlined text-yellow-400 text-2xl font-black">payments</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] leading-none mb-2">Valor Estimado</p>
                      <p className="text-4xl font-black text-yellow-400 tracking-tighter italic">
                        R$ {estimatedTotal > 0 ? estimatedTotal.toFixed(2).replace(".", ",") : (distancePrices['logistica']?.toFixed(2).replace(".", ",") || "---")}
                      </p>
                    </div>
                  </div>

                  <div className="h-px bg-white/5" />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-3xl bg-white/5 border border-white/5">
                       <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Agendado para</p>
                       <p className="text-[11px] font-black text-white italic">{transitData.scheduledDate || 'N/A'}</p>
                       <p className="text-[11px] font-black text-purple-400 italic">{transitData.scheduledTime || 'N/A'}</p>
                    </div>
                    <div className="p-4 rounded-3xl bg-white/5 border border-white/5 flex flex-col justify-center gap-1">
                       <div className="flex items-center gap-2">
                          <Icon name="groups" className="text-[12px] text-zinc-500" />
                          <span className="text-[9px] font-black text-zinc-400 uppercase">Ajudantes: {transitData.helpers || 0}</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <Icon name="stairs" className="text-[12px] text-zinc-500" />
                          <span className="text-[9px] font-black text-zinc-400 uppercase">Escadas: {transitData.accessibility?.stairsAtOrigin ? 'Sim' : 'Não'}</span>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent pt-28 pointer-events-none">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            className="pointer-events-auto w-full"
            onClick={() => {
              if (mobilityStep === 1) {
                if (!transitData.origin || !transitData.destination) {
                  showToast("Preencha todos os endereços", "warning");
                  return;
                }
                setMobilityStep(2);
              } else if (mobilityStep === 2) {
                if (!transitData.scheduledDate || !transitData.scheduledTime) {
                  showToast("Selecione data e horário", "warning");
                  return;
                }
                setMobilityStep(3);
              } else {
                setTransitData((prev: any) => ({ ...prev, estPrice: estimatedTotal }));
                setPaymentsOrigin("checkout");
                navigateSubView("mobility_payment");
              }
            }}
          >
            <div className="w-full bg-purple-500 text-white font-black text-lg py-6 px-12 rounded-[35px] shadow-[0_20px_40px_rgba(168,85,247,0.2),inset_4px_4px_8px_rgba(255,255,255,0.2)] active:grayscale transition-all flex items-center justify-center gap-4 group disabled:opacity-50 disabled:grayscale overflow-hidden relative">
              <span className="uppercase tracking-[0.3em] text-[13px] italic">
                {mobilityStep === 1 ? "Ir para Agendamento" : mobilityStep === 2 ? "Revisar Pedido" : "Confirmar Frete"}
              </span>
              <span className="material-symbols-outlined font-black group-hover:translate-x-2 transition-transform text-2xl">
                {mobilityStep === 3 ? 'bolt' : 'arrow_forward'}
              </span>
            </div>
          </motion.button>
        </div>
      </main>
    </div>
  );
};
