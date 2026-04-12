import React from "react";
import { motion } from "framer-motion";
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
  paymentMethod: string;
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
  paymentMethod,
  setPaymentsOrigin,
  setSubView,
  navigateSubView,
  showToast,
}) => {
  const [sheetState, setSheetState] = React.useState<"collapsed" | "half" | "expanded">("expanded");

  const sheetVariants = {
    collapsed: { y: "85%", transition: { type: "spring", damping: 25, stiffness: 200 } },
    half: { y: "40%", transition: { type: "spring", damping: 25, stiffness: 200 } },
    expanded: { y: "0%", transition: { type: "spring", damping: 25, stiffness: 200 } }
  };

  const handleDragEnd = (_: any, info: any) => {
    const threshold = 50;
    if (info.offset.y > threshold) {
      if (sheetState === "expanded") setSheetState("half");
      else setSheetState("collapsed");
    } else if (info.offset.y < -threshold) {
      if (sheetState === "collapsed") setSheetState("half");
      else setSheetState("expanded");
    }
  };

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
            className="size-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-blue-400 shadow-[4px_4px_10px_rgba(0,0,0,0.4),inset_2px_2px_4px_rgba(255,255,255,0.05)]"
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
          <h2 className="text-2xl font-black text-white tracking-tighter leading-none mb-1 uppercase">
            Izi Van Express
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Transporte de Cargas & Mudanças</p>
        </div>
      </header>

      {/* BOTTOM SHEET DESLIZANTE */}
      <motion.div 
        variants={sheetVariants}
        initial="expanded"
        animate={sheetState}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        className="relative z-40 mt-auto bg-zinc-950/90 backdrop-blur-3xl border-t border-white/5 flex flex-col rounded-t-[45px] shadow-[0_-25px_50px_rgba(0,0,0,0.6)] touch-none"
        style={{ height: "100dvh" }}
      >
        <div 
          className="flex justify-center pt-4 pb-2 cursor-grab active:cursor-grabbing"
          onClick={() => {
            if (sheetState === "collapsed") setSheetState("half");
            else if (sheetState === "half") setSheetState("expanded");
            else setSheetState("collapsed");
          }}
        >
          <div className="w-12 h-1.5 bg-white/10 rounded-full" />
        </div>
        <div className="p-8 pb-32 overflow-y-auto no-scrollbar flex-1 space-y-10">
          {mobilityStep === 1 && (
            <motion.section initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              <div className="space-y-2">
                <h3 className="text-xl font-black text-white tracking-tight uppercase italic">Detalhes do Transporte</h3>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest italic">Informe a rota e o tipo de carga.</p>
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

                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-zinc-900 rounded-[30px] p-6 border border-white/5 shadow-inner">
                      <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-3 italic">Volume da Carga</p>
                      <select 
                        value={transitData.accessibility.loadSize || 'pequena'}
                        onChange={(e) => setTransitData((prev: any) => ({...prev, accessibility: {...prev.accessibility, loadSize: e.target.value}}))}
                        className="w-full bg-transparent text-white font-black uppercase text-[11px] outline-none border-none p-0 italic"
                      >
                         <option value="pequena" className="bg-zinc-900 text-white">📦 Pequena</option>
                         <option value="media" className="bg-zinc-900 text-white">📦 Média</option>
                         <option value="grande" className="bg-zinc-900 text-white">🚛 Grande</option>
                      </select>
                   </div>
                   <div className="bg-zinc-900 rounded-[30px] p-6 border border-white/5 shadow-inner">
                      <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-3 italic">Ajudantes</p>
                      <select 
                        value={transitData.helpers || 0}
                        onChange={(e) => setTransitData((prev: any) => ({...prev, helpers: parseInt(e.target.value)}))}
                        className="w-full bg-transparent text-white font-black uppercase text-[11px] outline-none border-none p-0 italic"
                      >
                         <option value="0" className="bg-zinc-900 text-white">0 ajudantes</option>
                         <option value="1" className="bg-zinc-900 text-white">1 ajudante</option>
                         <option value="2" className="bg-zinc-900 text-white">2 ajudantes</option>
                      </select>
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
                <motion.div 
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-5 cursor-pointer group" 
                  onClick={() => { setPaymentsOrigin("checkout"); setSubView("mobility_payment"); }}
                >
                  <div className="size-15 rounded-3xl bg-zinc-800 flex items-center justify-center border border-white/5 shadow-inner group-hover:bg-blue-400 transition-all">
                    <span className="material-symbols-outlined text-blue-400 text-2xl font-black group-hover:text-black transition-colors">credit_card</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] leading-none mb-2">Pagamento</p>
                    <p className="text-base font-black text-white italic uppercase tracking-tighter">
                      {paymentMethod || 'Escolher Método'}
                    </p>
                  </div>
                </motion.div>

                <div className="h-px bg-white/5" />

                <div className="flex items-center gap-5">
                  <div className="size-15 rounded-3xl bg-zinc-800 flex items-center justify-center border border-white/5 shadow-inner">
                    <span className="material-symbols-outlined text-yellow-400 text-2xl font-black italic">local_shipping</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] leading-none mb-2">Valor Estimado</p>
                    <p className="text-4xl font-black text-yellow-400 tracking-tighter italic">
                      R$ {distancePrices['van']?.toFixed(2).replace(".", ",") || "---"}
                    </p>
                    <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.2em] mt-3 flex items-center gap-2 italic">
                      <span className="material-symbols-outlined text-[14px]">local_mall</span>
                      Carga: {transitData.accessibility.loadSize} • Ajudantes: {transitData.helpers || 0}
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
            className="w-full bg-blue-500 text-white font-black text-lg py-6 rounded-[35px] shadow-[0_20px_40px_rgba(59,130,246,0.2),inset_4px_4px_8px_rgba(255,255,255,0.2)] active:grayscale transition-all flex items-center justify-center gap-4 group disabled:opacity-50 disabled:grayscale overflow-hidden relative"
          >
            <span className="uppercase tracking-[0.3em] text-[13px] italic">{mobilityStep === 1 ? "Próximo Passo" : "Confirmar Van"}</span>
            <span className="material-symbols-outlined font-black group-hover:translate-x-2 transition-transform text-2xl">{mobilityStep === 1 ? 'arrow_forward' : 'bolt'}</span>
          </motion.button>
        </div>
        </div>
      </motion.div>
    </div>
  );
};
