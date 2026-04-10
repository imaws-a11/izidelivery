import React, { useState } from "react";
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
    <div className="absolute inset-0 z-[120] bg-transparent text-zinc-100 flex flex-col overflow-hidden italic">
      <div className="absolute inset-0 z-0 h-full">
        <IziTrackingMap 
          routePolyline={routePolyline} 
          driverLoc={driverLocation} 
          userLoc={(userLocation?.lat && userLocation?.lng) ? { lat: userLocation.lat as number, lng: userLocation.lng as number } : null} 
          onMyLocationClick={updateLocation} 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/40 to-zinc-950 pointer-events-none" />
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
            className="size-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-blue-400 shadow-[4px_4px_10px_rgba(0,0,0,0.4),inset_2px_2px_4px_rgba(255,255,255,0.05)]"
          >
            <Icon name="arrow_back" />
          </motion.button>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-black text-white tracking-tighter leading-none mb-1 uppercase">
            Excursões & Viagens
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Izi Van Experience</p>
        </div>
      </header>

      <main className="relative z-40 mt-auto bg-zinc-950/95 backdrop-blur-3xl border-t border-white/5 flex flex-col h-[75vh] rounded-t-[50px] shadow-[0_-25px_80px_rgba(0,0,0,0.8)]">
        <div className="flex justify-center pt-5 pb-2">
          <div className="w-16 h-1.5 bg-white/20 rounded-full" />
        </div>

        <div className="p-8 pb-32 overflow-y-auto no-scrollbar flex-1 space-y-10">
          <AnimatePresence mode="wait">
            {mobilityStep === 1 ? (
              <motion.section 
                key="step1"
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-white tracking-tight uppercase italic flex items-center gap-3">
                    <Icon name="map_search" className="text-blue-400" />
                    Destino da Aventura
                  </h3>
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest italic ml-9">Defina o roteiro da sua viagem.</p>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-zinc-900/50 rounded-[35px] p-7 shadow-2xl border border-white/5 transition-all">
                    <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.3em] mb-3 ml-1">Origem / Ponto de Encontro</p>
                    <AddressSearchInput 
                      initialValue={transitData.origin}
                      placeholder="De onde partiremos?"
                      className="w-full bg-transparent border-none p-0 text-base font-black text-white focus:ring-0 placeholder:text-zinc-700 italic"
                      userCoords={userLocation.lat ? { lat: userLocation.lat, lng: userLocation.lng } : null}
                      onSelect={(p) => setTransitData((prev: any) => ({...prev, origin: p.formatted_address || ""}))}
                    />
                  </div>

                  <div className="bg-zinc-900/50 rounded-[35px] p-7 shadow-2xl border border-white/5 transition-all">
                    <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.3em] mb-3 ml-1">Destino Principal</p>
                    <AddressSearchInput 
                      initialValue={transitData.destination}
                      placeholder="Para onde vamos superar limites?"
                      className="w-full bg-transparent border-none p-0 text-base font-black text-white focus:ring-0 placeholder:text-zinc-700 italic"
                      userCoords={userLocation.lat ? { lat: userLocation.lat, lng: userLocation.lng } : null}
                      onSelect={(p) => setTransitData((prev: any) => ({...prev, destination: p.formatted_address || ""}))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-zinc-900/50 rounded-[30px] p-6 border border-white/5 shadow-inner">
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-3 italic">Passageiros</p>
                        <div className="flex items-center justify-between">
                           <button onClick={() => updateExcursion({passengers: Math.max(1, excursionData.passengers - 1)})} className="text-blue-400"><Icon name="remove" /></button>
                           <span className="text-lg font-black text-white">{excursionData.passengers}</span>
                           <button onClick={() => updateExcursion({passengers: excursionData.passengers + 1})} className="text-blue-400"><Icon name="add" /></button>
                        </div>
                     </div>
                     <div className="bg-zinc-900/50 rounded-[30px] p-6 border border-white/5 shadow-inner flex flex-col justify-center">
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1 italic">Tipo</p>
                        <select 
                          value={excursionData.tripType}
                          onChange={(e) => updateExcursion({tripType: e.target.value})}
                          className="w-full bg-transparent text-white font-black uppercase text-[11px] outline-none border-none p-0 italic"
                        >
                           <option value="ida_e_volta" className="bg-zinc-900 font-black">Ida e Volta</option>
                           <option value="ida" className="bg-zinc-900 font-black">Apenas Ida</option>
                        </select>
                     </div>
                  </div>
                </div>
              </motion.section>
            ) : (
              <motion.section 
                key="step2"
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-white tracking-tight uppercase italic flex items-center gap-3">
                    <Icon name="calendar_month" className="text-blue-400" />
                    Data & Detalhes
                  </h3>
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest italic ml-9">Agendamento e observações extras.</p>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-zinc-900/50 rounded-[35px] p-7 border border-white/5 shadow-inner">
                       <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-3 italic">Data de Partida</p>
                       <input 
                         type="datetime-local" 
                         value={excursionData.departureDate}
                         onChange={(e) => updateExcursion({departureDate: e.target.value})}
                         className="w-full bg-transparent text-white font-black text-base outline-none border-none p-0 italic"
                       />
                    </div>

                    {excursionData.tripType === 'ida_e_volta' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-zinc-900/50 rounded-[35px] p-7 border border-white/5 shadow-inner"
                      >
                         <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-3 italic">Data de Retorno</p>
                         <input 
                           type="datetime-local" 
                           value={excursionData.returnDate}
                           onChange={(e) => updateExcursion({returnDate: e.target.value})}
                           className="w-full bg-transparent text-white font-black text-base outline-none border-none p-0 italic"
                         />
                      </motion.div>
                    )}

                    <div className="bg-zinc-900/50 rounded-[35px] p-7 border border-white/5 shadow-inner">
                      <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-3 italic">Observações / Roteiro Detalhado</p>
                      <textarea 
                        value={excursionData.notes}
                        onChange={(e) => updateExcursion({notes: e.target.value})}
                        placeholder="Ex: Parada em Ouro Preto, translado para o hotel..."
                        rows={3}
                        className="w-full bg-transparent text-white font-black text-sm outline-none border-none p-0 italic placeholder:text-zinc-700 resize-none"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-[35px] flex items-center gap-5">
                    <div className="size-12 rounded-2xl bg-blue-500/20 flex items-center justify-center shrink-0">
                      <Icon name="info" className="text-blue-400" />
                    </div>
                    <p className="text-[10px] text-zinc-400 font-black uppercase leading-relaxed tracking-wide italic">
                      As tarifas de excursão são calculadas com base na quilometragem e o valor é confirmado por um de nossos parceiros em até 15 minutos.
                    </p>
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent pt-20">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (mobilityStep === 1) {
                if (!transitData.origin || !transitData.destination) {
                  showToast("Escolha os locais da viagem", "warning");
                  return;
                }
                setMobilityStep(2);
              } else {
                if (!excursionData.departureDate) {
                  showToast("Defina a data de partida", "warning");
                  return;
                }
                setPaymentsOrigin("checkout");
                navigateSubView("mobility_payment");
              }
            }}
            className="w-full bg-blue-500 text-white font-black text-lg py-6 rounded-[35px] shadow-[0_20px_40px_rgba(59,130,246,0.3),inset_4px_4px_8px_rgba(255,255,255,0.2)] active:grayscale transition-all flex items-center justify-center gap-4 group overflow-hidden relative"
          >
            <span className="uppercase tracking-[0.3em] text-[13px] italic">{mobilityStep === 1 ? "Definar Datas" : "Confirmar Viagem"}</span>
            <span className="material-symbols-outlined font-black group-hover:translate-x-2 transition-transform text-2xl">{mobilityStep === 1 ? 'arrow_forward' : 'celebration'}</span>
          </motion.button>
        </div>
      </main>
    </div>
  );
};
