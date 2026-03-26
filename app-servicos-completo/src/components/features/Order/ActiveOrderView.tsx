import React from "react";
import { motion } from "framer-motion";
import { Icon } from "../../common/Icon";
import { IziTrackingMap } from "../Map/IziTrackingMap";

interface ActiveOrderViewProps {
  selectedItem: any;
  driverLocation: any;
  userLocation: { lat: number; lng: number } | null;
  setSubView: (view: string) => void;
}

const ActiveOrderView: React.FC<ActiveOrderViewProps> = ({
  selectedItem,
  driverLocation,
  userLocation,
  setSubView,
}) => {
  if (!selectedItem) return null;

  const isMobility = ["mototaxi", "carro", "van", "utilitario"].includes(selectedItem.service_type);

  const steps = isMobility
    ? [
        { id: "procurando", label: "Buscando Motorista", icon: "search", status: ["waiting_driver", "novo"] },
        { id: "confirmed", label: "Motorista Confirmado", icon: "check_circle", status: ["aceito", "confirmado"] },
        { id: "a_caminho", label: "Motorista em Rota", icon: "directions_bike", status: ["a_caminho", "at_pickup"] },
        {
          id: "em_curso",
          label: "Viagem Iniciada",
          icon: "location_on",
          status: ["picked_up", "em_rota", "saiu_para_entrega"],
        },
        { id: "chegando", label: "Chegando ao Destino", icon: "potted_plant", status: ["no_local"] },
        { id: "concluido", label: "Viagem Concluída", icon: "verified", status: ["concluido"] },
      ]
    : [
        {
          id: "confirmado",
          label: "Pedido Confirmado",
          icon: "check_circle",
          status: [
            "aceito",
            "confirmado",
            "preparando",
            "pronto",
            "a_caminho",
            "picked_up",
            "saiu_para_entrega",
            "em_rota",
            "no_local",
            "concluido",
          ],
        },
        {
          id: "preparando",
          label: "Em Preparação",
          icon: "restaurant",
          status: [
            "preparando",
            "pronto",
            "a_caminho",
            "picked_up",
            "saiu_para_entrega",
            "em_rota",
            "no_local",
            "concluido",
          ],
        },
        {
          id: "aceito_ent",
          label: "Indo Coletar",
          icon: "moped",
          status: ["a_caminho", "picked_up", "saiu_para_entrega", "em_rota", "no_local", "concluido"],
        },
        {
          id: "coletado",
          label: "Pedido Coletado",
          icon: "package_2",
          status: ["picked_up", "saiu_para_entrega", "em_rota", "no_local", "concluido"],
        },
        {
          id: "em_rota",
          label: "A Caminho",
          icon: "delivery_dining",
          status: ["saiu_para_entrega", "em_rota", "no_local", "concluido"],
        },
        { id: "entregue", label: "Entregue", icon: "verified", status: ["concluido"] },
      ];

  const revIdx = steps
    .slice()
    .reverse()
    .findIndex((s) => s.status.includes(selectedItem.status));
  const currentIdx = revIdx === -1 ? 0 : steps.length - 1 - revIdx;

  return (
    <div className="absolute inset-0 z-[100] bg-black text-zinc-100 flex flex-col overflow-hidden pb-32">
      {/* MAPA PLACEHOLDER OU REAL-TIME */}
      <div className="relative w-full h-[35vh] bg-zinc-900 overflow-hidden shrink-0">
        {/* MAPA REAL-TIME IZI FLASH */}
        <IziTrackingMap driverLoc={driverLocation} userLoc={userLocation} />

        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black z-10 pointer-events-none" />

        {/* Botão flutuante voltar */}
        <div className="absolute top-8 left-6 z-20">
          <button
            onClick={() => setSubView("none")}
            className="size-12 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all"
          >
            <Icon name="arrow_back" />
          </button>
        </div>

        {/* Badge flutuante de status */}
        <div className="absolute bottom-8 left-6 right-6 z-20">
          <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-5 rounded-[32px] flex items-center gap-5 shadow-2xl">
            <div className="size-14 rounded-2xl bg-yellow-400 flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-black text-2xl animate-bounce">
                {steps[currentIdx]?.icon || "sync"}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.3em] mb-1">
                Logística Ativa
              </p>
              <h3 className="text-lg font-black text-white tracking-tighter leading-none">
                {steps[currentIdx]?.label || "Sintonizando..."}
              </h3>
            </div>
            <div className="text-right">
              <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Previsão</p>
              <p className="text-lg font-black text-white italic">{selectedItem.delivery_time || "15-25"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* DETALHES COMPLEMENTARES */}
      <main className="flex-1 overflow-y-auto no-scrollbar px-6 py-10 space-y-12">
        {/* TRACKING TIMELINE */}
        <section className="space-y-10">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.4em]">Fluxo Operacional</h2>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Real-time</span>
              <span className="size-2 bg-emerald-500 rounded-full animate-pulse" />
            </div>
          </div>

          <div className="relative space-y-12 pl-4">
            {/* Linha vertical tracejada */}
            <div className="absolute left-[38px] top-6 bottom-6 w-[2px] bg-zinc-900 border-l border-dashed border-zinc-800" />

            {steps.map((s, i) => {
              const isActive = i <= currentIdx;
              const isCurrent = i === currentIdx;
              return (
                <div
                  key={s.id}
                  className={`flex items-start gap-8 relative z-10 transition-all duration-500 ${isActive ? "opacity-100 scale-100" : "opacity-20 scale-95"}`}
                >
                  <div
                    className={`size-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${isActive ? "bg-yellow-400 text-black shadow-lg shadow-primary/30 border border-yellow-300/20" : "bg-zinc-900 text-zinc-700"}`}
                  >
                    <span
                      className="material-symbols-outlined text-xl"
                      style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      {s.icon}
                    </span>
                  </div>
                  <div className="flex-1 pt-1">
                    <h4 className={`text-base font-black tracking-tight ${isActive ? "text-white" : "text-zinc-600"}`}>
                      {s.label}
                    </h4>
                    {isCurrent && (
                      <motion.p
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-yellow-400/60 text-[10px] uppercase font-black tracking-widest mt-1"
                      >
                        Sendo processado agora
                      </motion.p>
                    )}
                  </div>
                  {isActive && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mt-2.5">
                      <span className="material-symbols-outlined text-emerald-400 text-lg">check_circle</span>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ESTABELECIMENTO / MOTORISTA */}
        <section className="bg-zinc-900/40 border border-white/5 rounded-[40px] p-8 space-y-8 shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div
                className="size-16 rounded-[24px] bg-cover bg-center border border-white/10 shadow-float"
                style={{
                  backgroundImage: `url('https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedItem.driver_id || selectedItem.merchant_name || "izi"}')`,
                }}
              />
              <div className="space-y-1">
                <h4 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">
                  {selectedItem.driver_id
                    ? selectedItem.driver_name || "Entregador Izi"
                    : selectedItem.merchant_name || "Estabelecimento"}
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">
                    {selectedItem.driver_id ? "Entregador Parceiro" : "Protocolo Izi"} #
                    {String(selectedItem.id).slice(-6)}
                  </span>
                </div>
              </div>
            </div>
            <button className="size-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 active:scale-90 transition-all">
              <Icon name="support_agent" size={20} className="text-zinc-500" />
            </button>
          </div>

          {selectedItem.driver_id && (
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
              <div className="size-10 rounded-xl bg-yellow-400/10 flex items-center justify-center">
                <Icon name="two_wheeler" className="text-yellow-400" />
              </div>
              <div className="flex-1">
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Veículo Selecionado</p>
                <p className="text-xs font-bold text-white">
                  Moto / Placa {String(selectedItem.id).slice(-4).toUpperCase()}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <span
                    className="material-symbols-outlined text-yellow-400 text-xs"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                  <span className="text-xs font-black text-white">4.9</span>
                </div>
              </div>
            </div>
          )}

          <div className="h-px bg-white/5 mx-2" />

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setSubView("order_chat")}
              className="bg-zinc-900/80 border border-zinc-800 py-5 rounded-[24px] flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 active:scale-[0.98] transition-all hover:bg-zinc-800 hover:text-white"
            >
              <Icon name="chat" size={18} className="text-yellow-400" />
              Abrir Canal Chat
            </button>
            <button className="bg-zinc-900/80 border border-zinc-800 py-5 rounded-[24px] flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 active:scale-[0.98] transition-all hover:bg-zinc-800 hover:text-white">
              <span className="material-symbols-outlined text-yellow-400 text-xl">call</span>
              Ligar Agora
            </button>
          </div>
        </section>

        {/* DADOS DE ENTREGA */}
        <section className="px-2 space-y-4">
          <h2 className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.4em]">Destino Final</h2>
          <div className="flex items-start gap-4 bg-zinc-900/40 p-6 rounded-[32px] border border-white/5">
            <div className="size-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
              <Icon name="location_on" className="text-orange-500" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Receber em</p>
              <p className="text-sm font-bold text-zinc-300 leading-tight">{selectedItem.delivery_address}</p>
            </div>
          </div>
        </section>

        {/* AJUDA */}
        <button
          onClick={() => setSubView("order_support")}
          className="w-full py-6 rounded-[32px] border-2 border-dashed border-zinc-900/60 text-zinc-800 font-black text-[10px] uppercase tracking-[0.3em] active:scale-95 transition-all flex items-center justify-center gap-3 group hover:border-white/10 hover:text-white mt-10"
        >
          <Icon name="help" className="group-hover:text-yellow-400 transition-colors" />
          Central de Protocolos e Ajuda
        </button>
      </main>
    </div>
  );
};

export default ActiveOrderView;
