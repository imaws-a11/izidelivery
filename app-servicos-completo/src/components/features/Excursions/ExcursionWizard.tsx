import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "../../common/Icon";
import { AddressSearchInput } from "../Address/AddressSearchInput";
import { IziTrackingMap } from "../Map/IziTrackingMap";

interface ExcursionWizardProps {
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

export const ExcursionWizard: React.FC<ExcursionWizardProps> = ({
  transitData,
  setTransitData,
  mobilityStep,
  setMobilityStep,
  userLocation,
  updateLocation,
  routePolyline,
  driverLocation,
  distancePrices,
  paymentMethod,
  setPaymentsOrigin,
  setSubView,
  navigateSubView,
  showToast,
}) => {
  const excursionData = transitData.excursionData || {
    passengers: 10,
    tripType: 'ida_e_volta',
    departureDate: '',
    returnDate: '',
    notes: ''
  };

  const updateExcursion = (updates: any) => {
    setTransitData((prev: any) => ({
      ...prev,
      excursionData: { ...(prev.excursionData || excursionData), ...updates }
    }));
  };

  return (
    <div className="absolute inset-0 z-[120] bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden italic">
      
      {/* SECTION MAPA - TOPO */}
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
              Excursão Izi
            </h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Viagens em Grupo</p>
          </div>
        </header>

        <div className="absolute bottom-10 left-8 right-8 z-20">
           <div className="clay-card-yellow px-5 py-3 rounded-3xl font-black text-[11px] text-black inline-flex items-center gap-2 shadow-2xl italic">
              <Icon name="groups" size={16} />
              Até {excursionData.passengers} passageiros
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
              <div className="space-y-6">
                 <h3 className="text-zinc-500 font-black text-[9px] uppercase tracking-[0.3em] px-2 italic text-shadow-sm">Roteiro da Viagem</h3>
                 <div className="space-y-5 relative">
                    <div className="absolute left-9 top-1/2 -translate-y-1/2 w-[1px] h-12 bg-zinc-800" />
                    <div className="clay-card-dark rounded-[35px] p-5 pl-6 flex items-center gap-4 border border-white/5">
                      <div className="size-10 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0 shadow-inner">
                        <Icon name="person_pin_circle" size={20} className="text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0 pr-4">
                        <AddressSearchInput
                          placeholder="Ponto de Saída"
                          onSelect={(addr) => setTransitData((p: any) => ({...p, origin: addr}))}
                          defaultValue={transitData.origin?.address}
                          className="bg-transparent text-white font-black text-xs w-full outline-none placeholder:text-zinc-700 italic"
                        />
                      </div>
                    </div>
                    <div className="clay-card-dark rounded-[35px] p-5 pl-6 flex items-center gap-4 border border-white/5">
                      <div className="size-10 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0 shadow-inner">
                        <Icon name="flag" size={20} className="text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0 pr-4">
                        <AddressSearchInput
                          placeholder="Destino da Excursão"
                          onSelect={(addr) => setTransitData((p: any) => ({...p, destination: addr}))}
                          defaultValue={transitData.destination?.address}
                          className="bg-transparent text-white font-black text-xs w-full outline-none placeholder:text-zinc-700 italic"
                        />
                      </div>
                    </div>
                 </div>
              </div>

              <div className="clay-card-dark rounded-[35px] p-8 border border-white/5 space-y-6">
                 <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest italic text-center">Tipo de Grupo</p>
                 <div className="grid grid-cols-2 gap-4">
                    <button className="bg-blue-500/10 border border-blue-500/20 py-4 rounded-3xl text-blue-400 font-black text-xs uppercase italic">Turismo</button>
                    <button className="bg-white/5 border border-white/10 py-4 rounded-3xl text-zinc-600 font-black text-xs uppercase italic">Evento</button>
                 </div>
              </div>
            </motion.section>
          ) : (
            <motion.section 
              key="step2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-10"
            >
              <div className="clay-card-dark rounded-[40px] p-7 space-y-8 border border-white/5 shadow-2xl">
                 <div className="space-y-3">
                   <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-2 italic">Data da Partida</p>
                   <div className="bg-black/20 p-5 rounded-[30px] border border-white/5 flex items-center gap-4">
                      <Icon name="calendar_today" size={20} className="text-blue-400" />
                      <input 
                        type="date" 
                        value={excursionData.departureDate}
                        onChange={(e) => updateExcursion({departureDate: e.target.value})}
                        className="bg-transparent text-white font-black text-sm outline-none border-none p-0 italic w-full"
                      />
                   </div>
                 </div>

                 <div className="bg-blue-500/5 p-6 rounded-[35px] border border-blue-500/10 space-y-3">
                    <div className="flex items-center gap-3">
                       <Icon name="info" size={18} className="text-blue-400" />
                       <span className="text-white font-black text-xs uppercase italic">Orçamento Imediato</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 font-black leading-relaxed italic uppercase">
                       Para viagens em grupo, nosso consultor entrará em contato para alinhar detalhes de bagagem e paradas.
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
                showToast("Escolha a rota da excursão", "warning");
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
          <div className="absolute inset-0 bg-blue-600 opacity-90" />
          <span className="relative z-10 text-white font-black text-xl tracking-tighter uppercase italic">
            {mobilityStep === 1 ? "Prosseguir" : "Solicitar Reserva"}
          </span>
          <Icon name={mobilityStep === 1 ? "arrow_forward" : "celebration"} className="relative z-10 text-white font-black group-hover:translate-x-2 transition-transform" size={28} />
        </motion.button>
      </div>

    </div>
  );
};
