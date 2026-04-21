import React from "react";
import { motion } from "framer-motion";
import { Icon } from "../../common/Icon";

interface ActiveOrderViewProps {
  selectedItem: any;
  driverLocation: any;
  userLocation: { lat: number; lng: number } | null;
  routePolyline?: string;
  onMyLocationClick: () => void;
  setSubView: (view: string) => void;
  onCancelOrder: (id: string) => void;
}

export const ActiveOrderView: React.FC<ActiveOrderViewProps> = ({
  selectedItem,
  driverLocation,
  userLocation,
  routePolyline,
  onMyLocationClick,
  setSubView,
  onCancelOrder,
}) => {
  if (!selectedItem) return null;

  const handleCall = () => {
    const rawPhone = selectedItem.driver_phone || selectedItem.merchant_phone || selectedItem.phone;
    if (!rawPhone) {
      setSubView("order_support");
      return;
    }

    const phone = String(rawPhone).replace(/[^\d+]/g, "");
    window.location.href = `tel:${phone}`;
  };

  const isMobility = ["mototaxi", "carro", "van", "utilitario"].includes(selectedItem.service_type);
  
  // Regra de Negócio: Mostrar entregador sempre que ele for assinalado a corrida/pedido
  const shouldShowDriver = !!selectedItem?.driver_id;

  const steps = isMobility
    ? [
        { id: "procurando", label: "Procurando IZI parceiro nas proximidades", icon: "search", status: ["waiting_driver", "novo"] },
        { id: "confirmed", label: "Motorista Confirmado", icon: "check_circle", status: ["aceito", "confirmado", "atribuido"] },
        { id: "a_caminho", label: "Motorista em Rota", icon: "directions_bike", status: ["a_caminho_coleta", "saiu_para_coleta", "at_pickup", "chegou_coleta", "no_local_coleta"] },
        {
          id: "em_curso",
          label: "Viagem Iniciada",
          icon: "location_on",
          status: ["picked_up", "em_rota", "saiu_para_entrega", "a_caminho"],
        },
        { id: "chegando", label: "Chegando ao Destino", icon: "potted_plant", status: ["no_local"] },
        { id: "concluido", label: "Viagem Concluída", icon: "verified", status: ["concluido", "delivered", "finalizado"] },
      ]
    : [
        {
          id: "pagamento",
          label: "Aguardando Pagamento",
          icon: "schedule",
          status: ["pendente_pagamento"],
        },
        {
          id: "confirmado",
          label: "Pedido Recebido",
          icon: "check_circle",
          status: [
            "novo", "pendente", "aceito", "confirmado", "atribuido", "preparando", "no_preparo", "pronto", "waiting_driver", "a_caminho_coleta", "saiu_para_coleta", "chegou_coleta", "picked_up", "a_caminho", "saiu_para_entrega", "em_rota", "no_local", "concluido"
          ],
        },
        {
          id: "preparando",
          label: "Preparando seu Pedido",
          icon: "restaurant",
          status: [
            "preparando", "no_preparo", "pronto", "waiting_driver", "a_caminho_coleta", "saiu_para_coleta", "chegou_coleta", "picked_up", "a_caminho", "saiu_para_entrega", "em_rota", "no_local", "concluido"
          ],
        },
        {
          id: "aceito_ent",
          label: "Procurando IZI entregador nas proximidades",
          icon: "moped",
          status: [
            "a_caminho_coleta", "saiu_para_coleta", "chegou_coleta", "picked_up", "a_caminho", "saiu_para_entrega", "em_rota", "no_local", "concluido"
          ],
        },
        {
          id: "coletado",
          label: "Pedido Coletado",
          icon: "package_2",
          status: [
            "picked_up", "a_caminho", "saiu_para_entrega", "em_rota", "no_local", "concluido"
          ],
        },
        {
          id: "em_rota",
          label: "A Caminho",
          icon: "delivery_dining",
          status: [
            "a_caminho", "saiu_para_entrega", "em_rota", "no_local", "concluido"
          ],
        },
        {
          id: "no_local",
          label: "No seu Endereço",
          icon: "location_home",
          status: ["no_local", "concluido"],
        },
        { id: "entregue", label: "Entregue", icon: "verified", status: ["concluido", "delivered", "finalizado"] },
      ];

  const revIdx = steps
    .slice()
    .reverse()
    .findIndex((s) => s.status.includes(selectedItem.status));
  const currentIdx = revIdx === -1 ? 0 : steps.length - 1 - revIdx;

  let pickupLoc = null;
  if (selectedItem?.pickup_lat && selectedItem?.pickup_lng) {
    pickupLoc = { lat: Number(selectedItem.pickup_lat), lng: Number(selectedItem.pickup_lng) };
  } else if (selectedItem?.merchant_lat && selectedItem?.merchant_lng) {
    pickupLoc = { lat: Number(selectedItem.merchant_lat), lng: Number(selectedItem.merchant_lng) };
  }

  return (
    <div className="absolute inset-0 z-[100] bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden">
      {/* Botão flutuante voltar (sempre visível no topo) */}
      <div className="absolute top-8 left-6 z-50">
        <button
          onClick={() => setSubView("none")}
          className="size-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all shadow-xl shadow-black/50"
        >
          <Icon name="arrow_back" />
        </button>
      </div>

      {/* CONTEÚDO PRINCIPAL (REFORMULADO SEM MAPA) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col pt-24"
      >
        {/* ÁREA DE CABEÇALHO (STATUS RÁPIDO - CLAY STYLE) */}
        <div className="shrink-0 px-6 pb-6 mt-4">
            <div className="bg-yellow-400 p-6 rounded-[40px] flex items-center gap-5 shadow-[12px_12px_32px_rgba(0,0,0,0.25),inset_4px_4px_8px_rgba(255,255,255,0.4)] border-none relative overflow-hidden active:scale-[0.98] transition-all">
              <div className="absolute top-0 right-0 size-32 bg-white/10 blur-3xl rounded-full translate-x-12 -translate-y-12" />
              
              <div className="size-16 rounded-[24px] bg-black flex items-center justify-center shadow-[inset_2px_2px_4px_rgba(255,255,255,0.1),inset_-2px_-2px_4px_rgba(0,0,0,0.5)]">
                <span className="material-symbols-outlined text-yellow-400 text-3xl animate-bounce">
                  {steps[currentIdx]?.icon || "sync"}
                </span>
              </div>
              
              <div className="flex-1">
                <p className="text-[10px] font-black text-black/50 uppercase tracking-[0.3em] mb-1">
                  {isMobility ? "Sua Viagem" : "Seu Pedido"}
                </p>
                <h3 className="text-xl font-black text-black tracking-tighter leading-none">
                  {steps[currentIdx]?.label || "Sintonizando..."}
                </h3>
              </div>
              
              <div className="px-4 py-2 rounded-2xl bg-black/10 border border-black/5 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05)]">
                <p className="text-[8px] font-black text-black/40 uppercase tracking-widest mb-0.5 text-center">Tempo médio</p>
                <p className="text-xl font-black text-black leading-none">{selectedItem.delivery_time || "15-25"}</p>
              </div>
            </div>
          </div>

        {/* CONTEÚDO SCROLLABLE */}
        <main className="flex-1 overflow-y-auto no-scrollbar px-6 py-8 space-y-12 pb-48">
          {/* TRACKING TIMELINE */}
          <section className="space-y-8">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">Fluxo Operacional</h2>
              <span className="size-1.5 bg-emerald-500 rounded-full animate-pulse" />
            </div>

            <div className="relative space-y-10 pl-2">
              <div className="absolute left-[23px] top-6 bottom-6 w-[1.5px] bg-zinc-900 border-l border-dashed border-zinc-800" />

              {steps.map((s, i) => {
                const isActive = i <= currentIdx;
                const isCurrent = i === currentIdx;
                return (
                  <div
                    key={s.id}
                    className={`flex items-start gap-6 relative z-10 transition-all duration-500 ${isActive ? "opacity-100" : "opacity-30"}`}
                  >
                    <div
                      className={`size-12 rounded-[18px] flex items-center justify-center transition-all duration-500 ${isActive ? "bg-yellow-400 text-black shadow-[4px_4px_10px_rgba(0,0,0,0.3),inset_2px_2px_4px_rgba(255,255,255,0.5),inset_-2px_-2px_4px_rgba(0,0,0,0.2)]" : "bg-zinc-800 text-zinc-700 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.5),inset_-2px_-2px_4px_rgba(255,255,255,0.02)]"}`}
                    >
                      <span
                        className="material-symbols-outlined text-xl"
                        style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        {s.icon}
                      </span>
                    </div>
                    <div className="flex-1 pt-1.5">
                      <h4 className={`text-sm font-black tracking-tight ${isActive ? "text-white" : "text-zinc-600"}`}>
                        {s.label}
                      </h4>
                      {isCurrent && (
                        <motion.p
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="text-yellow-400/60 text-[9px] uppercase font-black tracking-widest mt-0.5"
                        >
                          {s.id === "em_rota" ? "Seu pedido está indo até você" : "Sendo processado agora"}
                        </motion.p>
                      )}
                    </div>
                    {isActive && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mt-2">
                        <span className="material-symbols-outlined text-emerald-400 text-base">check_circle</span>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>

            {(() => {
                const method = (selectedItem.payment_method || '').toLowerCase();
                const isOffline = method === 'dinheiro' || method === 'cartao_entrega';
                const isPending = selectedItem.status === 'pendente_pagamento' || selectedItem.payment_status === 'pending';
                
                if (!isPending || isOffline) return null;
                
                const tech = (selectedItem.payment_method || 'pix').toLowerCase();
                const targetView = tech.includes('bitcoin') || tech.includes('lightning') ? 'lightning_payment' : 'pix_payment';

                return (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-4"
                  >
                    <button
                      onClick={() => setSubView(targetView)}
                      className="w-full py-5 rounded-[28px] bg-yellow-400 text-black font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-[8px_8px_20px_rgba(250,204,21,0.2),inset_4px_4px_8px_rgba(255,255,255,0.4),inset_-4px_-4px_8px_rgba(0,0,0,0.1)] group"
                    >
                      <span className="material-symbols-outlined text-xl group-hover:rotate-12 transition-transform">payments</span>
                      Ir para Pagamento
                    </button>
                  </motion.div>
                );
            })()}

            {/* BOTÃO DE CANCELAMENTO - POSIÇÃO DE DESTAQUE */}
            {(() => {
                const canCancel = isMobility
                  ? ['novo', 'pendente', 'pendente_pagamento', 'waiting_driver'].includes(selectedItem.status)
                  : ['novo', 'pendente', 'pendente_pagamento', 'waiting_merchant'].includes(selectedItem.status);
                if (!canCancel) return null;
                
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6"
                  >
                    <button
                      onClick={() => {
                        console.log("[DEBUG] Clique no botÃ£o de cancelar. OrderID:", selectedItem?.id);
                        if(window.confirm("Deseja realmente cancelar este pedido?")) {
                          onCancelOrder(selectedItem?.id);
                        }
                      }}
                      className="w-full py-5 rounded-[28px] bg-gradient-to-r from-rose-500/10 to-rose-600/5 border border-rose-500/20 text-rose-500 font-black text-[10px] uppercase tracking-[0.25em] active:scale-95 transition-all flex items-center justify-center gap-3 group hover:border-rose-500/40 hover:from-rose-500 hover:to-rose-600 hover:text-white shadow-xl shadow-rose-500/5"
                    >
                      <span className="material-symbols-outlined text-[18px] group-hover:rotate-90 transition-transform">close</span>
                      Cancelar este Pedido
                    </button>
                    <p className="text-center text-zinc-600 text-[8px] font-black uppercase tracking-widest mt-3 opacity-60">
                      Disponível enquanto o lojista não aceita
                    </p>
                  </motion.div>
                );
            })()}
          </section>

          {/* ESTABELECIMENTO / MOTORISTA */}
          {/* ESTABELECIMENTO / MOTORISTA (CLAY CARD) */}
          <section className="bg-zinc-800 p-6 rounded-[40px] space-y-6 shadow-[10px_10px_20px_rgba(0,0,0,0.2),inset_6px_6px_12px_rgba(255,255,255,0.02),inset_-6px_-6px_12px_rgba(0,0,0,0.4)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="size-14 rounded-2xl bg-cover bg-center border border-white/10 shadow-lg"
                  style={{
                    backgroundImage: `url('https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedItem.driver_id || selectedItem.merchant_name || "izi"}')`,
                  }}
                />
                <div className="space-y-0.5">
                  <h4 className="text-lg font-black text-white uppercase tracking-tighter leading-none">
                    {selectedItem.driver_id
                      ? selectedItem.driver_name || "Entregador Izi"
                      : selectedItem.merchant_name || "Estabelecimento"}
                  </h4>
                  <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest opacity-80">
                    {selectedItem.driver_id ? "Sua Entrega" : "Seu Pedido"}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSubView("order_support")} 
                className="h-12 px-4 rounded-2xl bg-yellow-400 flex items-center gap-2 shadow-[4px_4px_10px_rgba(250,204,21,0.2),inset_2px_2px_4px_rgba(255,255,255,0.4)] active:scale-95 transition-all group"
              >
                <Icon name="support_agent" size={20} className="text-black group-hover:rotate-12 transition-transform" />
                <span className="text-[10px] font-black text-black uppercase tracking-wider">Suporte</span>
              </button>
            </div>

            {selectedItem.driver_id && (
              <div className="flex items-center gap-4 bg-zinc-900 p-4 rounded-3xl shadow-[inset_3px_3px_6px_rgba(0,0,0,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.02)]">
                <div className="size-9 rounded-xl bg-yellow-400/10 flex items-center justify-center">
                  <Icon name="two_wheeler" className="text-yellow-400" size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Veículo</p>
                  <p className="text-[11px] font-bold text-white">
                    Moto / Placa {String(selectedItem.id).slice(-4).toUpperCase()}
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-yellow-400/10 px-2 py-1 rounded-lg">
                  <span className="material-symbols-outlined text-yellow-400 text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="text-[10px] font-black text-white">4.9</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSubView("order_chat")}
                className="bg-zinc-800 shadow-[6px_6px_12px_rgba(0,0,0,0.4),-6px_-6px_12px_rgba(255,255,255,0.02),inset_3px_3px_6px_rgba(255,255,255,0.03),inset_-3px_-3px_6px_rgba(0,0,0,0.4)] py-5 rounded-[22px] flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-zinc-300 active:scale-[0.96] transition-all hover:text-yellow-400 group/btn"
              >
                <Icon name="chat" size={16} className="text-yellow-400 group-hover/btn:scale-110 transition-transform" />
                Chat
              </button>
              <button 
                onClick={handleCall} 
                className="bg-zinc-800 shadow-[6px_6px_12px_rgba(0,0,0,0.4),-6px_-6px_12px_rgba(255,255,255,0.02),inset_3px_3px_6px_rgba(255,255,255,0.03),inset_-3px_-3px_6px_rgba(0,0,0,0.4)] py-5 rounded-[22px] flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-zinc-300 active:scale-[0.96] transition-all hover:text-yellow-400 group/btn"
              >
                <span className="material-symbols-outlined text-yellow-400 text-xl group-hover/btn:scale-110 transition-transform">call</span>
                Ligar
              </button>
            </div>
          </section>

          {/* DESTINO */}
          <section className="px-2 space-y-4">
            <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">Destino Final</h2>
            <div className="flex items-start gap-4 bg-zinc-800 p-6 rounded-[35px] shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4),inset_-4px_-4px_8px_rgba(255,255,255,0.02)]">
              <div className="size-9 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                <Icon name="location_on" className="text-orange-500" size={18} />
              </div>
              <div>
                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">Receber em</p>
                <p className="text-xs font-bold text-zinc-300 leading-tight">
                  {selectedItem.delivery_address?.split('|')[0].trim()}
                </p>
                {selectedItem.delivery_address?.includes('|') && (
                  <div className="mt-2 p-3 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-[8px] font-black text-orange-500 uppercase tracking-widest mb-1">Nota da Entrega</p>
                    <p className="text-[10px] font-bold text-zinc-400 leading-tight">
                      {selectedItem.delivery_address.split('|')[1]?.replace(/^\s*OBS:\s*/i, '').trim()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ITENS DO PEDIDO */}
          <section className="px-2 space-y-4">
            <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">Itens do Pedido</h2>
            <div className="bg-zinc-800 p-7 rounded-[40px] space-y-4 shadow-[inset_6px_6px_12px_rgba(0,0,0,0.4),inset_-6px_-6px_12px_rgba(255,255,255,0.02)] border-none">
              {selectedItem.items && Array.isArray(selectedItem.items) && selectedItem.items.length > 0 ? (
                selectedItem.items.map((it: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-start pb-4 border-b border-white/5 last:pb-0 last:border-0">
                    <div className="flex items-start gap-4">
                      <div className="size-8 rounded-lg bg-yellow-400/20 flex items-center justify-center text-[10px] font-black text-yellow-500 border border-yellow-400/10 shrink-0">
                        {it.quantity || 1}x
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white leading-tight">{it.name || it.product_name || 'Produto'}</p>
                        {it.options && it.options.length > 0 && (
                          <p className="text-[10px] text-zinc-500 font-medium mt-1">
                            + {it.options.map((opt: any) => opt.name).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-white">
                        R$ {Number((it.price || 0) * (it.quantity || 1)).toFixed(2).replace('.', ',')}
                      </p>
                      {it.quantity > 1 && (
                        <p className="text-[9px] font-bold text-zinc-500 uppercase mt-0.5">
                          Un: R$ {Number(it.price || 0).toFixed(2).replace('.', ',')}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="opacity-60 text-center py-2">
                  <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Sem itens registrados</p>
                </div>
              )}
            </div>
          </section>

          {/* RESUMO FINANCEIRO */}
          <section className="px-2 space-y-4">
            <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">Resumo Financeiro</h2>
            <div className="bg-zinc-800 p-7 rounded-[45px] space-y-5 shadow-[12px_12px_24px_rgba(0,0,0,0.3),inset_8px_8px_16px_rgba(255,255,255,0.02),inset_-8px_-8px_16px_rgba(0,0,0,0.4)] relative overflow-hidden border-none">
              <div className="flex justify-between text-xs font-bold text-zinc-500 uppercase tracking-widest">
                <span>Subtotal</span>
                <span className="text-zinc-300">R$ {Number((selectedItem.total_price || 0) - (selectedItem.delivery_fee || 0) + (selectedItem.discount || 0)).toFixed(2).replace('.', ',')}</span>
              </div>
              
              {selectedItem.delivery_fee > 0 && (
                <div className="flex justify-between text-xs font-bold text-zinc-500 uppercase tracking-widest">
                  <span>Taxa de Entrega</span>
                  <span className="text-yellow-400 font-black">+ R$ {Number(selectedItem.delivery_fee).toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              
              {selectedItem.discount > 0 && (
                <div className="flex justify-between items-center text-xs font-bold text-zinc-500 uppercase tracking-widest">
                  <div className="flex items-center gap-2">
                    <span>Descontos</span>
                    {selectedItem.coupon_code && (
                      <span className="px-1.5 py-0.5 bg-rose-500/20 text-rose-400 rounded border border-rose-500/20 text-[8px] font-black">{selectedItem.coupon_code}</span>
                    )}
                  </div>
                  <span className="text-rose-400 font-black">- R$ {Number(selectedItem.discount).toFixed(2).replace('.', ',')}</span>
                </div>
              )}

              <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  {selectedItem.payment_status === 'paid' ? 'Total Pago' : 'Total a Pagar'}
                </span>
                <span className="text-2xl font-black text-white tracking-tighter">R$ {Number(selectedItem.total_price || 0).toFixed(2).replace('.', ',')}</span>
              </div>
              
              <div className="pt-2 flex flex-col gap-1 items-end">
                {selectedItem.payment_status === 'paid' ? (
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[10px]">check_circle</span>
                    Pago via {String(selectedItem.payment_method || 'Pix').toUpperCase()}
                  </span>
                ) : (
                  <>
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[10px]">payments</span>
                      Pagamento: {String(selectedItem.payment_method || 'Não Info').toUpperCase()}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1 animate-pulse mt-1">
                      <span className="material-symbols-outlined text-[10px]">schedule</span>
                      {(selectedItem.payment_method === 'dinheiro' || selectedItem.payment_method === 'cartao_entrega') 
                        ? 'Pagar na Entrega' 
                        : 'Aguardando Aprovação'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* AJUDA */}
          <button
            onClick={() => setSubView("order_support")}
            className="w-full py-5 rounded-3xl border-2 border-dashed border-zinc-900 text-zinc-700 font-black text-[9px] uppercase tracking-[0.3em] active:scale-95 transition-all flex items-center justify-center gap-2 group hover:border-white/10 hover:text-white"
          >
            <Icon name="help" size={16} className="group-hover:text-yellow-400 transition-colors" />
            Central de Ajuda
          </button>
        </main>
      </motion.div>
    </div>
  );
};

