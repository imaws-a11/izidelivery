import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "../../common/Icon";
import { AddressSearchInput } from "../Address/AddressSearchInput";
import { IziTrackingMap } from "../Map/IziTrackingMap";

interface TaxiWizardProps {
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

export const TaxiWizard: React.FC<TaxiWizardProps> = ({
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
            className="size-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-yellow-400 shadow-[4px_4px_10px_rgba(0,0,0,0.4),inset_2px_2px_4px_rgba(255,255,255,0.05)]"
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
            {transitData.type === 'mototaxi' ? "MotoTáxi" : "Motorista Particular"}
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400">Viagem Rápida & Segura</p>
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
                <h3 className="text-xl font-black text-white tracking-tight uppercase italic">Qual o seu destino?</h3>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest italic">Confirme os pontos de partida e chegada.</p>
              </div>
              
              <div className="space-y-6">
                <motion.div 
                  whileHover={{ scale: 1.01 }} 
                  className="bg-zinc-900 rounded-[35px] p-7 shadow-[10px_10px_20px_rgba(0,0,0,0.3),inset_2px_2px_4px_rgba(255,255,255,0.03)] border border-white/5 group transition-all"
                >
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.3em] ml-1">Origem</p>
                    <button 
                      onClick={() => updateLocation()} 
                      disabled={userLocation.loading} 
                      className="text-[8px] font-black text-yellow-400 uppercase tracking-widest bg-yellow-400/10 px-4 py-2 rounded-xl disabled:opacity-50 active:scale-95 transition-all shadow-inner"
                    >
                      {userLocation.loading ? 'Buscando...' : 'Meu Local'}
                    </button>
                  </div>
                  <AddressSearchInput 
                    initialValue={transitData.origin}
                    placeholder="De onde você está saindo?"
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
                  <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.3em] mb-3 ml-1">Destino</p>
                  <AddressSearchInput 
                    initialValue={transitData.destination}
                    placeholder="Para onde vamos?"
                    className="w-full bg-transparent border-none p-0 text-base font-black text-white focus:ring-0 placeholder:text-zinc-700 italic"
                    userCoords={userLocation.lat ? { lat: userLocation.lat, lng: userLocation.lng } : null}
                    onSelect={(p) => {
                      const dest = p.formatted_address || "";
                      setTransitData((prev: any) => ({...prev, destination: dest}));
                    }}
                  />
                </motion.div>

                <AnimatePresence>
                  {transitData.destination && transitData.origin && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-6 pt-4 overflow-hidden"
                    >
                      <div className="flex items-center gap-4 px-2">
                        <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">Escolha o Veículo</h4>
                        <div className="h-px flex-1 bg-white/5" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 pb-2">
                        {[
                          { id: 'mototaxi', label: 'MotoTáxi', icon: 'motorcycle', color: 'text-yellow-400', sub: 'Rápido & Ágil' },
                          { id: 'carro', label: 'Carro IZI', icon: 'directions_car', color: 'text-white', sub: 'Executivo' }
                        ].map((v) => {
                          const isSelected = transitData.type === v.id;
                          const price = distancePrices[v.id] || 0;
                          
                          return (
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              key={v.id}
                              onClick={() => setTransitData((prev: any) => ({ ...prev, type: v.id as any, estPrice: price }))}
                              className={`p-6 rounded-[40px] transition-all duration-500 flex flex-col items-center gap-3 border relative group overflow-hidden
                                ${isSelected 
                                  ? 'bg-yellow-400 border-yellow-400 shadow-[0_15px_30px_rgba(250,204,21,0.3),inset_4px_4px_8px_rgba(255,255,255,0.4)]' 
                                  : 'bg-zinc-900 border-white/5 shadow-[10px_10px_20px_rgba(0,0,0,0.3),inset_2px_2px_4px_rgba(255,255,255,0.03)]'}
                              `}
                            >
                              <div className={`size-14 rounded-2xl flex items-center justify-center transition-all duration-500
                                ${isSelected ? 'bg-black/10' : 'bg-zinc-800 shadow-inner'}
                              `}>
                                <span className={`material-symbols-outlined text-3xl font-black ${isSelected ? 'text-black' : v.id === 'mototaxi' ? 'text-yellow-400' : 'text-white'}`}>{v.icon}</span>
                              </div>
                              <div className="text-center z-10">
                                <p className={`text-[12px] font-black uppercase tracking-tight italic ${isSelected ? 'text-black' : 'text-zinc-100'}`}>{v.label}</p>
                                <p className={`text-[8px] font-black uppercase tracking-widest mt-1 opacity-50 italic ${isSelected ? 'text-black' : 'text-zinc-500'}`}>{v.sub}</p>
                                <div className="mt-4">
                                  <p className={`text-lg font-black tracking-tighter italic ${isSelected ? 'text-black' : 'text-yellow-400'} ${isCalculatingPrice ? 'animate-pulse' : ''}`}>
                                    {isCalculatingPrice ? '...' : price > 0 ? `R$ ${price.toFixed(2).replace(".", ",")}` : '---'}
                                  </p>
                                </div>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.section>
          )}

          {mobilityStep === 2 && (
            <motion.section initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              <div className="space-y-2">
                <h3 className="text-xl font-black text-white tracking-tight uppercase italic">Resumo da Viagem</h3>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest italic">Confirme os detalhes e o preço antes de pedir.</p>
              </div>

              <div className="bg-zinc-900 border border-white/5 p-8 rounded-[45px] space-y-8 shadow-[25px_25px_50px_rgba(0,0,0,0.6),inset_4px_4px_10px_rgba(255,255,255,0.05)]">
                {/* PAGAMENTO */}
                <motion.div 
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-5 cursor-pointer group" 
                  onClick={() => { setPaymentsOrigin("checkout"); setSubView("mobility_payment"); }}
                >
                  <div className="size-15 rounded-3xl bg-zinc-800 flex items-center justify-center border border-white/5 shadow-inner group-hover:bg-yellow-400 transition-all">
                    <span className="material-symbols-outlined text-blue-400 text-2xl font-black group-hover:text-black transition-colors">credit_card</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] leading-none mb-2">Pagamento</p>
                    <div className="flex items-center justify-between">
                      <p className="text-base font-black text-white italic uppercase tracking-tighter">
                        {paymentMethod === 'dinheiro' ? 'Dinheiro' : paymentMethod === 'pix' ? 'PIX' : paymentMethod === 'bitcoin_lightning' ? 'BTC Lightning' : paymentMethod === 'saldo' ? 'Saldo IZI' : 'Escolher Método'}
                      </p>
                      <span className="material-symbols-outlined text-zinc-700 text-lg group-hover:text-yellow-400 transition-colors">expand_more</span>
                    </div>
                  </div>
                </motion.div>

                <div className="h-px bg-white/5" />

                {/* PREÇO E INFO */}
                <div className="flex items-center gap-5">
                  <div className="size-15 rounded-3xl bg-zinc-800 flex items-center justify-center border border-white/5 shadow-inner">
                    <span className="material-symbols-outlined text-yellow-400 text-2xl font-black italic">local_atm</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] leading-none mb-2">Valor Estimado</p>
                    <div className="flex items-center gap-3">
                      <p className="text-4xl font-black text-yellow-400 tracking-tighter italic">
                        {distancePrices[transitData.type] > 0 
                          ? `R$ ${distancePrices[transitData.type].toFixed(2).replace(".", ",")}` 
                          : isCalculatingPrice ? "..." : "---"}
                      </p>
                      {marketConditions.surgeMultiplier > 1 && (
                        <div className="px-3 py-1 rounded-full flex items-center gap-1.5 bg-yellow-400/10 border border-yellow-400/20 shadow-inner">
                          <span className="material-symbols-outlined text-[12px] text-yellow-400 font-black italic">bolt</span>
                          <span className="text-[10px] font-black text-yellow-400 tracking-tighter uppercase">{marketConditions.surgeMultiplier}x</span>
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.2em] mt-3 flex items-center gap-2 italic">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      Chegada em: {routeDistance ? `${Math.round(parseInt(routeDistance)/1000 * 2.2)} min` : '-- min'}
                    </p>
                  </div>
                </div>

                <div className="h-px bg-white/5" />

                {/* CLIENTE LEVEL */}
                <div className="flex items-center gap-5">
                  <div className="size-15 rounded-3xl bg-zinc-800 flex items-center justify-center border border-white/5 shadow-inner">
                    <span className="material-symbols-outlined text-emerald-400 text-2xl font-black">verified_user</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] leading-none mb-2">Perfil Prioritário</p>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-white tracking-[0.2em] bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20 uppercase italic">Nível {userLevel >= 10 ? 'Elite' : 'Padrão'}</span>
                      {userLevel >= 10 && <span className="material-symbols-outlined text-yellow-400 text-xl font-black">workspace_premium</span>}
                    </div>
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
            disabled={mobilityStep === 1 ? (!transitData.origin || !transitData.destination) : (!distancePrices[transitData.type] || isCalculatingPrice)}
            className="w-full bg-yellow-400 text-black font-black text-lg py-6 rounded-[35px] shadow-[0_20px_40px_rgba(250,204,21,0.2),inset_4px_4px_8px_rgba(255,255,255,0.4)] active:grayscale transition-all flex items-center justify-center gap-4 group disabled:opacity-50 disabled:grayscale overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
            <span className="uppercase tracking-[0.3em] text-[13px] italic">{mobilityStep === 1 ? "Próximo Passo" : "Pedir Agora"}</span>
            <span className="material-symbols-outlined font-black group-hover:translate-x-2 transition-transform text-2xl">{mobilityStep === 1 ? 'arrow_forward' : 'bolt'}</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};
