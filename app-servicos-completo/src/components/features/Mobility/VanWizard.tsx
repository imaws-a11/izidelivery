import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "../../common/Icon";
import { AddressSearchInput } from "../Address/AddressSearchInput";
import { IziTrackingMap } from "../Map/IziTrackingMap";

interface VanWizardProps {
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

export const VanWizard: React.FC<VanWizardProps> = ({
  transitData,
  setTransitData,
  mobilityStep,
  setMobilityStep,
  userLocation,
  updateLocation,
  routePolyline,
  driverLocation,
  distancePrices,
  isCalculatingPrice,
  marketConditions,
  paymentMethod,
  userLevel,
  routeDistance,
  setPaymentsOrigin,
  setSubView,
  navigateSubView,
  showToast,
}) => {

  const totalValue = React.useMemo(() => {
    const base = distancePrices[transitData.type] || 0;
    const distanceMultiplier = parseFloat(routeDistance) || 0;
    return base + (distanceMultiplier * 4.5);
  }, [distancePrices, transitData.type, routeDistance]);

  return (
    <div className="absolute inset-0 z-[120] bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden italic">
      
      {/* SECTION MAPA - TOPO (Estilo Missão Ativa) */}
      <section className="relative h-[35vh] shrink-0 overflow-hidden">
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
            className="size-12 rounded-2xl bg-zinc-900/80 backdrop-blur-xl border border-white/10 flex items-center justify-center text-blue-400 shadow-2xl clay-card-dark"
          >
            <Icon name="arrow_back" />
          </motion.button>
          <div className="text-right">
            <h2 className="text-xl font-black text-white tracking-tighter leading-none mb-1 uppercase text-shadow-sm">
              Van Logística
            </h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Mudanças & Cargas</p>
          </div>
        </header>

        {routeDistance && (
          <div className="absolute bottom-10 left-8 right-8 z-20 flex justify-between items-end">
            <div className="clay-card-dark bg-zinc-950/80 backdrop-blur-xl p-4 rounded-3xl border border-white/5 max-w-[70%]">
              <p className="text-zinc-500 text-[8px] font-black uppercase tracking-widest mb-1 italic">Destino Final</p>
              <p className="text-white font-black text-[11px] leading-tight line-clamp-1 italic uppercase truncate">
                {transitData.destination?.address || "Aguardando..."}
              </p>
            </div>
            <div className="clay-card-yellow px-5 py-3 rounded-3xl font-black text-[11px] text-black flex items-center gap-2 shadow-2xl italic">
              <Icon name="route" size={16} />
              {routeDistance}
            </div>
          </div>
        )}
      </section>

      {/* SECTION CONTEÚDO */}
      <main className="flex-1 bg-zinc-950 -mt-6 relative z-30 rounded-t-[40px] border-t border-white/5 overflow-y-auto no-scrollbar p-8 pt-10 pb-32 space-y-10">
        
        <AnimatePresence mode="wait">
          {mobilityStep === 1 ? (
            <motion.section 
              key="step1"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-10"
            >
              <div className="space-y-6">
                <h3 className="text-zinc-500 font-black text-[9px] uppercase tracking-[0.3em] px-2 italic text-shadow-sm">Trajeto da Van</h3>
                <div className="space-y-5 relative">
                  <div className="absolute left-9 top-1/2 -translate-y-1/2 w-[1px] h-12 bg-zinc-800" />
                  
                  <div className="clay-card-dark rounded-[35px] p-5 pl-6 flex items-center gap-4 border border-white/5">
                    <div className="size-10 rounded-2xl bg-blue-500/20 flex items-center justify-center shrink-0 shadow-inner">
                      <Icon name="inventory_2" size={20} className="text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0 pr-4">
                      <AddressSearchInput
                        placeholder="Endereço de Coleta"
                        onSelect={(addr) => setTransitData((p: any) => ({...p, origin: addr}))}
                        defaultValue={transitData.origin?.address}
                        className="bg-transparent text-white font-black text-xs w-full outline-none placeholder:text-zinc-700 italic"
                      />
                    </div>
                  </div>

                  <div className="clay-card-dark rounded-[35px] p-5 pl-6 flex items-center gap-4 border border-white/5">
                    <div className="size-10 rounded-2xl bg-blue-500/20 flex items-center justify-center shrink-0 shadow-inner">
                      <Icon name="location_on" size={20} className="text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0 pr-4">
                      <AddressSearchInput
                        placeholder="Endereço de Entrega"
                        onSelect={(addr) => setTransitData((p: any) => ({...p, destination: addr}))}
                        defaultValue={transitData.destination?.address}
                        className="bg-transparent text-white font-black text-xs w-full outline-none placeholder:text-zinc-700 italic"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="clay-card-dark rounded-[35px] p-7 border border-white/5 flex flex-col gap-6">
                 <div className="flex items-center justify-between">
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest italic leading-none">Tipo de Serviço</p>
                    <span className="bg-blue-500/10 text-blue-400 text-[10px] font-black px-3 py-1 rounded-full border border-blue-500/20 uppercase italic">Profissional</span>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/20 p-4 rounded-3xl border border-white/5 flex flex-col gap-2 shadow-inner">
                       <Icon name="local_shipping" size={20} className="text-blue-400" />
                       <span className="text-white font-black text-xs italic uppercase">Mudança</span>
                    </div>
                    <div className="bg-black/20 p-4 rounded-3xl border border-white/5 flex flex-col gap-2 shadow-inner opacity-40">
                       <Icon name="package_2" size={20} className="text-zinc-500" />
                       <span className="text-zinc-500 font-black text-xs italic uppercase">Carga Lotação</span>
                    </div>
                 </div>
              </div>
            </motion.section>
          ) : (
            <motion.section 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-10"
            >
               <div className="clay-card-dark rounded-[40px] p-8 border-l-4 border-blue-400 space-y-8">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-2xl bg-blue-400/10 flex items-center justify-center shadow-inner">
                        <Icon name="payments" size={24} className="text-blue-400" />
                      </div>
                      <div>
                        <span className="text-white font-black text-[13px] uppercase italic block leading-none mb-1">Custo da Logística</span>
                        <span className="text-zinc-500 text-[9px] font-black uppercase tracking-widest italic">Baseado na distância</span>
                      </div>
                    </div>
                    <div className="text-right">
                       <span className="text-blue-400 text-3xl font-black italic tracking-tighter block">R$ {totalValue.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>

                  <div className="h-px bg-white/5 w-full" />

                  <div className="space-y-5">
                    <div className="flex justify-between items-center px-2">
                       <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic text-shadow-sm">Pagamento</span>
                       <button 
                        onClick={() => navigateSubView("mobility_payment")}
                        className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-2xl border border-white/5 hover:bg-white/10 transition-all active:scale-95 shadow-md"
                       >
                         <Icon name={paymentMethod === 'online' ? 'credit_card' : 'payments'} size={14} className="text-blue-400" />
                         <span className="text-white font-black text-[10px] uppercase italic">
                            {paymentMethod === 'online' ? 'Cartão Online' : 'Pagar na Coleta'}
                         </span>
                       </button>
                    </div>

                    <p className="text-blue-400/60 text-[10px] font-bold uppercase tracking-tight text-center italic bg-blue-500/5 p-4 rounded-3xl border border-blue-500/10">
                      O motorista aguardará no local por até 15 minutos gratuitamente para carregamento.
                    </p>
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
                showToast("Defina a rota da van", "warning");
                return;
              }
              setMobilityStep(2);
            } else {
              setPaymentsOrigin("checkout");
              navigateSubView("mobility_payment");
            }
          }}
          className="w-full h-20 bg-blue-500 clay-card-dark py-6 rounded-full flex items-center justify-center gap-4 shadow-[0_20px_60px_rgba(59,130,246,0.3)] active:grayscale transition-all relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-blue-500 opacity-90" />
          <span className="relative z-10 text-white font-black text-xl tracking-tighter uppercase italic">
            {mobilityStep === 1 ? "Prosseguir" : "Contratar Van"}
          </span>
          <Icon name={mobilityStep === 1 ? "arrow_forward" : "local_shipping"} className="relative z-10 text-white font-black group-hover:translate-x-2 transition-transform" size={28} />
        </motion.button>
      </div>

    </div>
  );
};
