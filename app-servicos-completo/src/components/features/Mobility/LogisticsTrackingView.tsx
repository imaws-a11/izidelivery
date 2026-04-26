import React, { useMemo, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "../../common/Icon";
import { IziTrackingMap } from "../Map/IziTrackingMap";
import { IziBottomSheet } from "../../common/IziBottomSheet";

/** Extrai apenas o endereço legível de strings JSON ou formatadas do DB */
const parseAddressText = (rawStr: any): string => {
  if (!rawStr) return "Endereço não disponível";
  if (typeof rawStr !== "string") {
    return rawStr.formatted_address || rawStr.address || "Localidade";
  }
  
  // Tenta limpar sufixos comuns do app
  let cleanStr = rawStr.split(" | OBS:")[0].split(" | FRETE:")[0].split(" | ENVIO:")[0].split(" | EXCURSÃO:")[0].split(" | VIAGEM:")[0].trim();
  
  if (cleanStr.includes("[object Object]")) return "Endereço em processamento...";

  try {
    const parsed = JSON.parse(cleanStr);
    return parsed.formatted_address || parsed.address || cleanStr;
  } catch {
    return cleanStr;
  }
};

interface LogisticsTrackingViewProps {
  order: any;
  driverLocation: { lat: number; lng: number } | null;
  userLocation: { lat: number; lng: number } | null;
  onBack: () => void;
  onContactDriver: () => void;
  onCancel: () => void;
  onUpdateLocation?: () => void;
}

const STATUS_TIMELINE = [
  { key: "waiting_driver",    label: "Aguardando Motorista",  icon: "search",         color: "blue"    },
  { key: "aceito",            label: "Motorista Alocado",     icon: "check_circle",   color: "cyan"    },
  { key: "a_caminho",         label: "A Caminho da Coleta",   icon: "directions_car", color: "yellow"  },
  { key: "chegou",            label: "No Local de Coleta",    icon: "location_home",  color: "orange"  },
  { key: "in_transit",        label: "Em Trânsito",           icon: "route",          color: "purple"  },
  { key: "concluido",         label: "Entregue com Sucesso",  icon: "check_circle",   color: "emerald" },
];

const CANCELLED_STATUSES = ["cancelado", "recusado"];

const STATUS_ORDER_MAP: Record<string, number> = {
  novo: 0, searching_driver: 0, waiting_driver: 0, waiting_merchant: 0, pendente_pagamento: 0,
  aceito: 1, confirmado: 1, confirmante: 1, atribuido: 1,
  a_caminho_coleta: 2, saiu_para_coleta: 2,
  chegou_coleta: 3, chegou: 3, no_local_coleta: 3,
  picked_up: 4, in_transit: 4, a_caminho: 4, em_rota: 4, saiu_para_entrega: 4, no_local: 4,
  concluido: 5, entregue: 5, finalizado: 5, delivered: 5
};

const COLOR_MAP: Record<string, Record<"text" | "bg" | "border", string>> = {
  blue:    { text: "text-blue-400",    bg: "bg-blue-400",    border: "border-blue-400"    },
  cyan:    { text: "text-cyan-400",    bg: "bg-cyan-400",    border: "border-cyan-400"    },
  yellow:  { text: "text-yellow-400",  bg: "bg-yellow-400",  border: "border-yellow-400"  },
  orange:  { text: "text-orange-400",  bg: "bg-orange-400",  border: "border-orange-400"  },
  purple:  { text: "text-purple-400",  bg: "bg-purple-400",  border: "border-purple-400"  },
  emerald: { text: "text-emerald-500", bg: "bg-emerald-500", border: "border-emerald-500" },
};

/** Calcula rota via Google Maps Directions API e retorna array de LatLng para o mapa */
async function calcRoutePath(
  origin: string | google.maps.LatLng,
  destination: string | google.maps.LatLng
): Promise<google.maps.LatLng[]> {
  return new Promise((resolve) => {
    if (!window.google?.maps) { resolve([]); return; }
    const svc = new window.google.maps.DirectionsService();
    svc.route(
      { origin, destination, travelMode: window.google.maps.TravelMode.DRIVING },
      (result, status) => {
        if (status === "OK" && result?.routes?.[0]?.overview_path?.length) {
          resolve(result.routes[0].overview_path);
        } else {
          resolve([]);
        }
      }
    );
  });
}

export const LogisticsTrackingView: React.FC<LogisticsTrackingViewProps> = ({
  order,
  driverLocation,
  userLocation,
  onBack,
  onContactDriver,
  onCancel,
  onUpdateLocation,
}) => {
  const [routePath, setRoutePath] = useState<any[]>([]);
  const [routeLoading, setRouteLoading] = useState(false);

  const isCancelled = CANCELLED_STATUSES.includes(order?.status);
  const isFinished  = order?.status === "concluido";
  const isFreight   = ["frete", "logistica", "van"].includes(order?.service_type);
  const currentStepIndex = isCancelled ? -1 : (STATUS_ORDER_MAP[order?.status] ?? 0);
  const currentStatus    = STATUS_TIMELINE[currentStepIndex];

  const calcRoute = useCallback(async () => {
    if (routePath.length > 0) return;

    let origin: google.maps.LatLng | string | null = null;
    const rawOrigin = order?.pickup_address;

    if (rawOrigin) {
      if (typeof rawOrigin === "object" && rawOrigin.lat && rawOrigin.lng) {
        origin = new window.google.maps.LatLng(Number(rawOrigin.lat), Number(rawOrigin.lng));
      } else if (typeof rawOrigin === "string") {
        try {
          const parsed = JSON.parse(rawOrigin);
          if (parsed.lat && parsed.lng) {
            origin = new window.google.maps.LatLng(Number(parsed.lat), Number(parsed.lng));
          } else if (parsed.formatted_address) {
            origin = parsed.formatted_address;
          } else if (parsed.address) {
            origin = parsed.address;
          }
        } catch {
          origin = rawOrigin.split(" | OBS:")[0].split(" | FRETE:")[0].trim();
        }
      }
    }

    let destination: string | null = null;
    const rawDest = order?.delivery_address;

    if (rawDest) {
      if (typeof rawDest === "object") {
        destination = rawDest.formatted_address || rawDest.address || "";
      } else if (typeof rawDest === "string") {
        destination = rawDest
          .split(" | OBS:")[0]
          .split(" | FRETE:")[0]
          .split(" | EXCURSÃO:")[0]
          .split(" | ENVIO:")[0]
          .split(" | VIAGEM:")[0]
          .trim();
        try {
          const parsed = JSON.parse(rawDest);
          destination = parsed.formatted_address || parsed.address || destination;
        } catch { }
      }
    }

    if (!origin || !destination || destination.includes("[object Object]")) return;

    setRouteLoading(true);
    try {
      const path = await calcRoutePath(origin as any, destination);
      if (path.length > 0) setRoutePath(path);
    } finally {
      setRouteLoading(false);
    }
  }, [order?.pickup_address, order?.delivery_address, routePath.length]);

  useEffect(() => {
    if (window.google?.maps) {
      calcRoute();
    } else {
      const interval = setInterval(() => {
        if (window.google?.maps) { clearInterval(interval); calcRoute(); }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [calcRoute]);

  const originLoc = useMemo<{ lat: number; lng: number } | null>(() => {
    if (order?.pickup_lat && order?.pickup_lng)
      return { lat: Number(order.pickup_lat), lng: Number(order.pickup_lng) };
    return userLocation;
  }, [order?.pickup_lat, order?.pickup_lng, userLocation]);

  const getColorClass = (color: string, type: "text" | "bg" | "border") =>
    COLOR_MAP[color]?.[type] ?? "";

  return (
    <div className="absolute inset-0 z-[150] bg-zinc-950 text-white flex flex-col overflow-hidden"
         style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ── MAPA EM TELA CHEIA ── */}
      <div className="absolute inset-0 z-0">
        <IziTrackingMap
          routePolyline={routePath as any}
          driverLoc={driverLocation}
          userLoc={userLocation}
          originLoc={originLoc}
          vehicleIcon={order?.service_type === "van" ? "airport_shuttle" : "local_shipping"}
          originLabel="COLETA"
          boxed={false}
          searching={order?.status === 'waiting_driver' || (!!order?.scheduled_at && order?.status === 'confirmado')}
          onMyLocationClick={onUpdateLocation}
        />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />
      </div>

      {/* HEADER SOBRE O MAPA */}
      <header className="absolute top-10 left-0 right-0 z-20 px-6 pointer-events-none">
        <div className="flex items-center justify-between w-full pointer-events-auto">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            className="size-12 rounded-full bg-black/70 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-white shadow-2xl clay-card-dark"
          >
            <Icon name="close" size={22} />
          </motion.button>

          <div className="clay-card-dark bg-black/70 backdrop-blur-2xl px-5 py-3 rounded-full border border-white/5 flex items-center gap-3 shadow-lg">
            {!isCancelled && !isFinished && (
              <span className="size-2 rounded-full bg-yellow-400 animate-pulse" />
            )}
            {isCancelled  && <Icon name="cancel"       size={14} className="text-rose-500"    />}
            {isFinished   && <Icon name="check_circle" size={14} className="text-emerald-500" />}
            <span className="text-[11px] font-black uppercase tracking-widest leading-none">
              {isCancelled  ? "Cancelado"
               : isFinished ? "Entregue!"
               : currentStatus?.label ?? "Processando..."}
            </span>
          </div>
        </div>
      </header>

      {/* BADGES DE STATUS FLUTUANTES */}
      <div className="absolute top-32 left-0 right-0 px-6 z-10 pointer-events-none flex flex-wrap gap-2">
        {routeLoading && (
          <div className="bg-black/60 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
            <div className="size-3 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
            <span className="text-[9px] font-black text-yellow-400 uppercase tracking-widest">GPS Sincronizando...</span>
          </div>
        )}
        {routePath.length === 0 && !routeLoading && (
          <div className="bg-black/60 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
            <Icon name="route" size={14} className="text-yellow-400/60" />
            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Aguardando coordenadas</span>
          </div>
        )}
      </div>

      {/* BOTTOM SHEET */}
      <IziBottomSheet snapPoints={["35vh", "70vh", "92vh"]} initialSnap={0}>
        <div className="p-8 pb-40 space-y-10">
          <AnimatePresence mode="wait">

            {/* CANCELADO */}
            {isCancelled && (
              <motion.div
                key="cancelled"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center gap-6 py-8"
              >
                <div className="size-24 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                  <Icon name="cancel" size={48} className="text-rose-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Serviço Cancelado</h3>
                  <p className="text-sm text-zinc-400 font-bold max-w-xs">Este serviço foi cancelado. Se precisar, solicite um novo.</p>
                </div>
                <button
                  onClick={onBack}
                  className="w-full py-5 rounded-[28px] bg-zinc-900 border border-white/5 text-white font-black text-sm uppercase tracking-widest active:scale-95 transition-all"
                >
                  Voltar ao início
                </button>
              </motion.div>
            )}

            {/* ATIVO */}
            {!isCancelled && (
              <motion.div
                key="active"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-10"
              >
                {/* CARD DO MOTORISTA */}
                {order?.driver_id ? (
                  <div className="clay-card-dark rounded-[40px] p-8 border border-white/5 flex items-center justify-between gap-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 blur-[50px] rounded-full -mr-10 -mt-10 pointer-events-none" />
                    <div className="flex items-center gap-5">
                      <div className="size-20 rounded-full bg-zinc-800 border-2 border-yellow-400/20 overflow-hidden flex items-center justify-center shadow-inner shrink-0">
                        {order?.driver_avatar
                          ? <img src={order.driver_avatar} className="w-full h-full object-cover" alt="Driver" />
                          : <Icon name="person" size={32} className="text-zinc-500" />}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Condutor Responsável</p>
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-none">{order?.driver_name || "Motorista Parceiro"}</h3>
                        <div className="flex items-center gap-1.5 mt-2.5">
                          <Icon name="star" size={14} className="text-yellow-400" />
                          <span className="text-[11px] font-bold text-zinc-400">4.9 • {order?.driver_vehicle_plate || "PLACA CONFIRMADA"}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={onContactDriver}
                      className="size-16 rounded-3xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center active:scale-90 transition-all shrink-0 shadow-lg"
                    >
                      <Icon name="chat_bubble" size={24} className="text-yellow-400" />
                    </button>
                  </div>
                ) : (
                  <div className="clay-card-dark rounded-[40px] p-8 border border-white/5 flex items-center gap-6">
                    <div className="size-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                      <div className="size-8 rounded-full border-2 border-blue-400/30 border-t-blue-400 animate-spin" />
                    </div>
                    <div>
                      <p className="text-lg font-black text-white uppercase tracking-tighter mb-1">Conectando ao Motorista</p>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">
                        Seu pedido está no topo da fila — acompanhe o status em tempo real
                      </p>
                    </div>
                  </div>
                )}

                {/* TIMELINE */}
                <div className="clay-card-dark rounded-[40px] p-8 border border-white/5 space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-8 px-2">Progresso da Missão</h4>
                  {STATUS_TIMELINE.map((step, idx) => {
                    const done   = idx < currentStepIndex;
                    const active = idx === currentStepIndex;
                    const isLast = idx === STATUS_TIMELINE.length - 1;

                    return (
                      <div key={step.key} className="flex gap-5">
                        <div className="flex flex-col items-center">
                          <motion.div
                            animate={active ? { scale: [1, 1.15, 1] } : {}}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className={`size-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-500
                              ${done
                                ? "bg-emerald-500 border-emerald-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                                : active
                                ? `${getColorClass(step.color, "bg")} ${getColorClass(step.color, "border")} shadow-lg`
                                : "bg-zinc-900 border-zinc-800"}`}
                          >
                            <span className={`material-symbols-rounded text-lg font-black ${done || active ? "text-black" : "text-zinc-700"}`}>
                              {done ? "check" : step.icon}
                            </span>
                          </motion.div>
                          {!isLast && (
                            <div className={`w-0.5 flex-1 min-h-[30px] my-1 rounded-full transition-all duration-700 ${done ? "bg-emerald-500/40" : "bg-zinc-800"}`} />
                          )}
                        </div>
                        <div className={`pb-6 flex-1 flex flex-col justify-center ${isLast ? "pb-0" : ""}`}>
                          <span className={`text-[13px] font-black uppercase tracking-tight transition-colors duration-500
                            ${done ? "text-emerald-500" : active ? "text-white" : "text-zinc-700"}`}>
                            {step.label}
                          </span>
                          {active && (
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className={`text-[9px] font-black uppercase tracking-widest mt-1.5 ${getColorClass(step.color, "text")}`}
                            >
                              Executando agora...
                            </motion.span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* DETALHES DO TRAJETO */}
                <div className="clay-card-dark rounded-[40px] p-8 border border-white/5 space-y-8">
                  <div className="space-y-6 relative">
                    <div className="absolute left-[19px] top-5 bottom-5 w-0.5 bg-white/5 rounded-full" />

                    <div className="flex items-start gap-5 relative z-10">
                      <div className="size-10 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
                        <Icon name="package_2" size={18} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1">Ponto de Coleta</p>
                        <p className="text-xs font-black text-white uppercase truncate">
                          {parseAddressText(order?.pickup_address)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-5 relative z-10">
                      <div className="size-10 rounded-2xl bg-zinc-900 border border-yellow-400/20 flex items-center justify-center shrink-0 shadow-inner">
                        <Icon name="flag" size={18} className="text-yellow-400" />
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1">Destino Final</p>
                        <p className="text-xs font-black text-white uppercase truncate">
                          {parseAddressText(order?.delivery_address)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-white/5" />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mb-1">Serviço Especializado</p>
                      <p className="text-sm font-black text-white uppercase">
                        {order?.service_type === "van" ? "Logística Van" : isFreight ? "Frete Express IZI" : "Mobilidade Urbana"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mb-1">Custo Total</p>
                      <p className="text-2xl font-black text-yellow-400 tracking-tighter">
                        R$ {Number(order?.total_price || 0).toFixed(2).replace(".", ",")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* CANCELAR */}
                {["novo","searching_driver","waiting_driver","waiting_merchant","pendente_pagamento"].includes(order?.status) && (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={onCancel}
                    className="w-full py-6 rounded-[35px] border border-rose-500/20 text-rose-400 font-black text-[12px] uppercase tracking-[0.3em] hover:bg-rose-500/5 active:scale-95 transition-all"
                  >
                    Interromper Solicitação
                  </motion.button>
                )}

                {isFinished && (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={onBack}
                    className="w-full py-6 rounded-[35px] bg-emerald-500 text-black font-black text-sm uppercase tracking-widest shadow-[0_20px_50px_rgba(34,197,94,0.3)] active:scale-95 transition-all mb-6"
                  >
                    Mudar para Nova Missão ✓
                  </motion.button>
                )}
                
                {/* Safe area spacer */}
                <div className="h-20 w-full" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </IziBottomSheet>
    </div>
  );
};
