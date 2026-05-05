import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "../../common/Icon";
import { AddressSearchInput } from "../Address/AddressSearchInput";
import { IziTrackingMap } from "../Map/IziTrackingMap";
import { IziBottomSheet } from "../../common/IziBottomSheet";

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

  // Proteção contra undefined
  const safeTransitData = transitData || {};

  const totalValue = React.useMemo(() => {
    const base = distancePrices[safeTransitData.type] || 0;
    const distanceMultiplier = parseFloat(routeDistance) || 0;
    return base + (distanceMultiplier * 4.5);
  }, [distancePrices, safeTransitData.type, routeDistance]);

  React.useEffect(() => {
    updateLocation();
  }, []);

  return (
    <div className="absolute inset-0 z-[120] bg-white text-black flex flex-col overflow-hidden"
         style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      
      {/* ── MAPA FUNDO ── */}
      <div className="absolute inset-0 z-0">
        <IziTrackingMap 
          routePolyline={routePolyline} 
          driverLoc={driverLocation} 
          userLoc={(userLocation?.lat && userLocation?.lng) ? { lat: userLocation.lat as number, lng: userLocation.lng as number } : null} 
          originLoc={(safeTransitData.origin?.lat && safeTransitData.origin?.lng)
            ? { lat: Number(safeTransitData.origin.lat), lng: Number(safeTransitData.origin.lng) }
            : null}
          destLoc={(safeTransitData.destination?.lat && safeTransitData.destination?.lng)
            ? { lat: Number(safeTransitData.destination.lat), lng: Number(safeTransitData.destination.lng) }
            : null}
          originLabel="MEU ENDEREÇO"
          onMyLocationClick={updateLocation} 
          boxed={false}
          vehicleIcon="shuttle_taxi"
        />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
      </div>
      

      {/* ── HEADER FLUTUANTE PREMIUM ── */}
      <header className="fixed top-12 left-0 right-0 z-[150] flex items-center justify-between px-6 pointer-events-none">
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => setSubView("none")}
          className="size-12 rounded-2xl bg-white/90 backdrop-blur-xl border border-zinc-100 flex items-center justify-center text-black shadow-2xl pointer-events-auto"
        >
          <Icon name="arrow_back" />
        </motion.button>

        <div
          className="text-right px-6 py-3 rounded-[28px] bg-white/90 backdrop-blur-xl border border-zinc-100 shadow-2xl pointer-events-auto"
        >
          <h2 className="text-lg font-black text-black tracking-tighter leading-none uppercase">
            Van Logística
          </h2>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-500 mt-1">
             Mudanças & Cargas
          </p>
        </div>
      </header>

      {/* ── CHIPS FLUTUANTES PREMIUM ── */}
      <div className="fixed top-40 right-6 z-[140] flex flex-col gap-4 items-end pointer-events-none">
        {/* Card de distância */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="px-6 py-4 rounded-[28px] bg-white/90 backdrop-blur-xl border border-zinc-100 shadow-2xl flex items-center gap-4 pointer-events-auto"
        >
          <div className="size-9 rounded-2xl bg-zinc-50 flex items-center justify-center border border-zinc-100">
            <Icon name="route" size={20} className="text-blue-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] text-zinc-400 uppercase font-black tracking-widest leading-none mb-1">Distância</span>
            <span className="text-sm font-black tracking-tight text-black">{routeDistance ?? "-- km"}</span>
          </div>
        </motion.div>

        {/* Card de valor */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="px-6 py-4 rounded-[32px] bg-white border border-blue-500/20 shadow-2xl flex items-center gap-5 pointer-events-auto"
        >
          <div className="size-11 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100">
            <Icon name="payments" size={24} className="text-blue-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-zinc-400 uppercase font-black tracking-widest leading-none mb-1">Valor Estimado</span>
            <span className="text-2xl font-black tracking-tighter text-blue-600">
               {totalValue > 0 ? `R$ ${totalValue.toFixed(2).replace('.', ',')}` : "R$ --,--"}
            </span>
          </div>
        </motion.div>
      </div>

      {/* ── BOTTOM SHEET PREMIUM ── */}
      <IziBottomSheet snapPoints={["35vh", "65vh", "92vh"]} initialSnap={0}>
          <div className="p-8 pb-48 space-y-8">
            <AnimatePresence mode="wait">
                <motion.section 
                  key="step-summary"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                   <div className="rounded-[40px] p-8 border border-zinc-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] bg-white space-y-8">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-5">
                          <div className="size-14 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100">
                            <span className="material-symbols-rounded text-blue-600 text-3xl font-black">payments</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 font-black text-[10px] uppercase tracking-widest block mb-1">Custo da Logística</span>
                            <span className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">Baseado na distância</span>
                          </div>
                        </div>
                        <div className="text-right">
                           <span className="text-black text-3xl font-black tracking-tighter block">R$ {totalValue.toFixed(2).replace('.', ',')}</span>
                        </div>
                      </div>

                      <div className="h-px bg-zinc-100 w-full" />

                      <div className="space-y-6">
                        <div className="flex justify-between items-center px-2">
                           <div className="flex flex-col">
                             <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Pagamento</span>
                             <span className="text-[12px] font-black text-black uppercase tracking-tight">
                               {paymentMethod === 'saldo' ? 'Izi Pay (Saldo)' : paymentMethod === 'pix' ? 'PIX' : paymentMethod === 'cartao' ? 'Cartão via App' : 'Pagar na Coleta'}
                             </span>
                           </div>
                           <motion.button 
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigateSubView("mobility_payment")}
                            className="size-10 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center shadow-sm"
                           >
                             <span className="material-symbols-rounded text-zinc-400 text-xl">edit</span>
                           </motion.button>
                        </div>

                        <div className="bg-blue-50/50 p-5 rounded-3xl border border-blue-100">
                          <p className="text-blue-600/80 text-[10px] font-black uppercase tracking-tight text-center leading-relaxed">
                            O motorista aguardará no local por até 15 minutos gratuitamente para carregamento.
                          </p>
                        </div>
                      </div>
                   </div>
                </motion.section>
            </AnimatePresence>
          </div>

          {/* Botão de Ação Principal */}
          <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 bg-white/80 backdrop-blur-xl border-t border-zinc-50 z-50">
            <motion.button 
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                setTransitData((prev: any) => ({ ...(prev || {}), estPrice: totalValue }));
                setPaymentsOrigin("checkout");
                navigateSubView("mobility_payment");
              }}
              className="w-full h-[74px] rounded-[32px] bg-black text-white flex items-center justify-center gap-4 relative overflow-hidden group shadow-[0_20px_40px_rgba(0,0,0,0.15)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              
              <span className="relative z-10 font-black text-lg tracking-[0.1em] uppercase">
                Contratar Van
              </span>
              <div className="relative z-10 size-11 rounded-2xl bg-white/10 flex items-center justify-center group-hover:translate-x-1.5 transition-transform duration-300">
                <span className="material-symbols-rounded text-white font-black text-2xl">local_shipping</span>
              </div>
            </motion.button>
          </div>
      </IziBottomSheet>

    </div>
  );
};
