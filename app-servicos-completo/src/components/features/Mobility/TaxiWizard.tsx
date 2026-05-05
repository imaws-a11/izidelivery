import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "../../common/Icon";
import { AddressSearchInput } from "../Address/AddressSearchInput";
import { IziTrackingMap } from "../Map/IziTrackingMap";
import { IziBottomSheet } from "../../common/IziBottomSheet";

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

  const safeTransitData = transitData || {};

  const totalValue = React.useMemo(() => {
    if (!distancePrices || typeof distancePrices !== 'object' || !safeTransitData?.type) return 0;
    try {
      return distancePrices[safeTransitData.type] || 0;
    } catch (e) {
      console.warn("Erro ao acessar distancePrices:", e);
      return 0;
    }
  }, [distancePrices, safeTransitData?.type]);

  React.useEffect(() => {
    updateLocation();
  }, []);

  return (
    <div
      className="absolute inset-0 z-[120] bg-white text-black flex flex-col overflow-hidden"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >

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
            Izi Mobilidade
          </h2>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-yellow-500 mt-1">
            {safeTransitData.type === 'mototaxi' ? "MotoTáxi Izi" : "Motorista Particular"}
          </p>
        </div>
      </header>

      {/* ── MAPA FUNDO ── */}
      <div className="absolute inset-0 z-0">
        <IziTrackingMap
          routePolyline={routePolyline}
          driverLoc={driverLocation}
          userLoc={(userLocation?.lat && userLocation?.lng)
            ? { lat: userLocation.lat as number, lng: userLocation.lng as number }
            : null}
          originLoc={(safeTransitData.origin?.lat && safeTransitData.origin?.lng)
            ? { lat: Number(safeTransitData.origin.lat), lng: Number(safeTransitData.origin.lng) }
            : null}
          destLoc={(safeTransitData.destination?.lat && safeTransitData.destination?.lng)
            ? { lat: Number(safeTransitData.destination.lat), lng: Number(safeTransitData.destination.lng) }
            : null}
          originLabel="MEU ENDEREÇO"
          onMyLocationClick={updateLocation}
          boxed={false}
        />
      </div>

      {/* ── BOTTOM SHEET PREMIUM ── */}
      <IziBottomSheet snapPoints={["42vh", "65vh", "90vh"]} initialSnap={0}>
          <div className="px-6 pb-48 pt-4 space-y-6">
            <AnimatePresence mode="wait">
              <motion.section
                key="step-summary"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Card de Preço Claymorphic */}
                <div
                  className="rounded-[40px] p-8 border border-zinc-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] bg-white relative overflow-hidden"
                >
                  <div className="flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-5">
                      <div className="size-16 rounded-[22px] bg-yellow-400/10 flex items-center justify-center border border-yellow-400/20">
                        <span className="material-symbols-rounded text-yellow-600 text-3xl font-black">payments</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 font-black text-[10px] uppercase tracking-widest block mb-1">Custo da Viagem</span>
                        <span className="text-black font-black text-xs uppercase tracking-tight opacity-40">Tarifa Dinâmica Ativa</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-black text-4xl font-black tracking-tighter block">
                        R$ {totalValue.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>

                  <div className="h-px bg-zinc-100 my-8" />

                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                       <div className="flex flex-col">
                         <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Forma de Pagamento</span>
                         <span className="text-[13px] font-black text-black uppercase tracking-tight">
                           {paymentMethod === 'saldo' ? 'Izi Pay (Saldo)' : paymentMethod === 'pix' ? 'PIX' : paymentMethod === 'cartao' ? 'Cartão via App' : 'Pagar no Destino'}
                         </span>
                       </div>
                       <motion.button
                         whileTap={{ scale: 0.95 }}
                         onClick={() => navigateSubView("mobility_payment")}
                         className="px-5 py-2.5 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center gap-2 group"
                       >
                         <span className="material-symbols-rounded text-zinc-400 text-lg group-hover:text-black transition-colors">edit</span>
                         <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Alterar</span>
                       </motion.button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 rounded-[28px] bg-zinc-50/50 border border-zinc-100/50 flex flex-col gap-1">
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Distância</span>
                        <span className="text-[13px] font-black text-black uppercase tracking-tighter">{routeDistance || "-- km"}</span>
                      </div>
                      <div className="p-5 rounded-[28px] bg-zinc-50/50 border border-zinc-100/50 flex flex-col gap-1">
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Previsão</span>
                        <span className="text-emerald-500 text-[13px] font-black uppercase tracking-tighter">Rápido ⚡</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Resumo do Destino */}
                <div className="p-6 rounded-[32px] bg-zinc-50 border border-zinc-100/50">
                  <div className="flex items-start gap-4">
                    <div className="size-10 rounded-full bg-black flex items-center justify-center shrink-0 mt-0.5">
                      <span className="material-symbols-rounded text-white text-lg font-black">location_on</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Destino da Viagem</span>
                      <p className="text-[13px] font-black text-black uppercase truncate leading-tight">
                        {safeTransitData.destination || "Destino não definido"}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.section>
            </AnimatePresence>
          </div>

          {/* Botão de Ação Principal */}
          <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 bg-white/80 backdrop-blur-xl border-t border-zinc-50 z-[130]">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setTransitData((prev: any) => ({ ...(prev || {}), estPrice: totalValue }));
                setPaymentsOrigin("checkout");
                navigateSubView("mobility_payment");
              }}
              className="w-full h-[74px] rounded-[32px] bg-black text-white flex items-center justify-center gap-4 relative overflow-hidden group shadow-[0_20px_40px_rgba(0,0,0,0.15)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              
              <span className="relative z-10 font-black text-lg tracking-[0.1em] uppercase">
                Confirmar Viagem
              </span>
              <div className="relative z-10 size-11 rounded-2xl bg-white/10 flex items-center justify-center group-hover:translate-x-1.5 transition-transform duration-300">
                <span className="material-symbols-rounded text-white font-black text-2xl">
                  {safeTransitData.type === 'mototaxi' ? 'two_wheeler' : 'directions_car'}
                </span>
              </div>
            </motion.button>
          </div>
      </IziBottomSheet>
    </div>
  );
};
