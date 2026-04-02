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
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => setSubView("none")} 
          className="size-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-purple-400 shadow-[4px_4px_10px_rgba(0,0,0,0.4),inset_2px_2px_4px_rgba(255,255,255,0.05)]"
        >
          <Icon name="arrow_back" />
        </motion.button>
        <div className="text-right">
          <h2 className="text-2xl font-black text-white tracking-tighter leading-none mb-1 uppercase">
            Caminhão de Frete
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400">Transporte de Grande Porte</p>
        </div>
      </header>

      <main className="relative z-40 mt-auto bg-zinc-950/90 backdrop-blur-3xl border-t border-white/5 flex flex-col h-[70vh] rounded-t-[45px] shadow-[0_-25px_50px_rgba(0,0,0,0.6)]">
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
                  className="bg-zinc-900 rounded-[35px] p-7 shadow-[10px_10px_20px_rgba(0,0,0,0.3),inset_2px_2px_4px_rgba(255,255,255,0.03)] border border-white/5 group transition-all"
                >
                  <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.3em] mb-3 ml-1">Retirada</p>
                  <AddressSearchInput 
                    initialValue={transitData.origin}
                    placeholder="Local de coleta"
                    className="w-full bg-transparent border-none p-0 text-base font-black text-white focus:ring-0 placeholder:text-zinc-700 italic"
                    userCoords={userLocation.lat ? { lat: userLocation.lat, lng: userLocation.lng } : null}
                    onSelect={(p) => {
                      const ori = p.formatted_address || "";
                      setTransitData((prev: any) => ({...prev, origin: ori}));
                    }}
                  />
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.01 }} 
                  className="bg-zinc-900 rounded-[35px] p-7 shadow-[10px_10px_20px_rgba(0,0,0,0.3),inset_2px_2px_4px_rgba(255,255,255,0.03)] border border-white/5 group transition-all"
                >
                  <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.3em] mb-3 ml-1">Entrega</p>
                  <AddressSearchInput 
                    initialValue={transitData.destination}
                    placeholder="Local de destino"
                    className="w-full bg-transparent border-none p-0 text-base font-black text-white focus:ring-0 placeholder:text-zinc-700 italic"
                    userCoords={userLocation.lat ? { lat: userLocation.lat, lng: userLocation.lng } : null}
                    onSelect={(p) => {
                      const dest = p.formatted_address || "";
                      setTransitData((prev: any) => ({...prev, destination: dest}));
                    }}
                  />
                </motion.div>

                <div className="bg-zinc-900 rounded-[35px] p-8 border border-white/5 shadow-inner space-y-6">
                   <div className="flex items-center justify-between">
                      <div className="space-y-1">
                         <p className="text-xs font-black text-white uppercase italic">Possui Escadas?</p>
                         <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">Origem ou Destino</p>
                      </div>
                      <button 
                        onClick={() => setTransitData((prev: any) => ({...prev, accessibility: {...prev.accessibility, stairsAtOrigin: !prev.accessibility.stairsAtOrigin}}))}
                        className={`size-14 rounded-2xl flex items-center justify-center transition-all ${transitData.accessibility.stairsAtOrigin ? 'bg-purple-500 text-white shadow-lg' : 'bg-zinc-800 text-zinc-600 shadow-inner'}`}
                      >
                         <span className="material-symbols-outlined font-black">stairs</span>
                      </button>
                   </div>
                   <div className="h-px bg-white/5" />
                   <div className="flex items-center justify-between">
                      <div className="space-y-1">
                         <p className="text-xs font-black text-white uppercase italic">Ajudantes IZI</p>
                         <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">Carga e Descarga</p>
                      </div>
                      <div className="flex items-center gap-4 bg-zinc-800 p-2 rounded-2xl border border-white/5">
                         <button onClick={() => setTransitData((prev: any) => ({...prev, accessibility: {...prev.accessibility, helpers: Math.max(0, (prev.accessibility.helpers || 0) - 1)}}))} className="size-10 rounded-xl bg-zinc-900 flex items-center justify-center text-white active:scale-95 transition-all">-</button>
                         <span className="text-sm font-black text-white w-4 text-center">{transitData.accessibility.helpers || 0}</span>
                         <button onClick={() => setTransitData((prev: any) => ({...prev, accessibility: {...prev.accessibility, helpers: (prev.accessibility.helpers || 0) + 1}}))} className="size-10 rounded-xl bg-purple-500 flex items-center justify-center text-white active:scale-95 transition-all shadow-lg">+</button>
                      </div>
                   </div>
                </div>
              </div>
            </motion.section>
          )}

          {mobilityStep === 2 && (
            <motion.section initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              <div className="space-y-2">
                <h3 className="text-xl font-black text-white tracking-tight uppercase italic">Resumo do Frete</h3>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest italic">Ajudas extras e escadas podem alterar o valor.</p>
              </div>

              <div className="bg-zinc-900 border border-white/5 p-8 rounded-[45px] space-y-8 shadow-[25px_25px_50px_rgba(0,0,0,0.6),inset_4px_4px_10px_rgba(255,255,255,0.05)]">
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
                      R$ {distancePrices['transporte_carga']?.toFixed(2).replace(".", ",") || "---"}
                    </p>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent pt-20">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (mobilityStep === 1) {
                if (!transitData.origin || !transitData.destination) {
                  showToast("Preencha todos os endereços", "warning");
                  return;
                }
                setMobilityStep(2);
              } else {
                setPaymentsOrigin("checkout");
                navigateSubView("mobility_payment");
              }
            }}
            className="w-full bg-purple-500 text-white font-black text-lg py-6 rounded-[35px] shadow-[0_20px_40px_rgba(168,85,247,0.2),inset_4px_4px_8px_rgba(255,255,255,0.2)] active:grayscale transition-all flex items-center justify-center gap-4 group disabled:opacity-50 disabled:grayscale overflow-hidden relative"
          >
            <span className="uppercase tracking-[0.3em] text-[13px] italic">{mobilityStep === 1 ? "Próximo Passo" : "Confirmar Caminhão"}</span>
            <span className="material-symbols-outlined font-black group-hover:translate-x-2 transition-transform text-2xl">{mobilityStep === 1 ? 'arrow_forward' : 'bolt'}</span>
          </motion.button>
        </div>
      </main>
    </div>
  );
};
