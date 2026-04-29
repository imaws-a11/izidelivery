import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/** Extrai a parte em texto limpo de endereços salvos de forma corrompida ou serializada no DB */
const parseAddressText = (rawStr: any): string => {
  if (!rawStr) return "Endereço não disponível";
  if (typeof rawStr !== "string") {
    return rawStr.formatted_address || rawStr.address || "Localidade";
  }
  let cleanStr = rawStr.split(" | OBS:")[0].split(" | FRETE:")[0].split(" | ENVIO:")[0].split(" | EXCURSÃO:")[0].split(" | VIAGEM:")[0].trim();
  if (cleanStr.includes("[object Object]")) {
    return "Endereço processando...";
  }
  try {
    const parsed = JSON.parse(cleanStr);
    return parsed.formatted_address || parsed.address || cleanStr;
  } catch {
    return cleanStr;
  }
};

interface OrderListViewProps {
  myOrders: any[];
  setSelectedItem: (item: any) => void;
  setSubView: (view: string) => void;
  navigateSubView: (view: string) => void;
  userId: string | null;
  fetchMyOrders: (uid: string) => void;
  onOpenCoinTracking?: (order: any) => void;
}

export const OrderListView: React.FC<OrderListViewProps> = ({
  myOrders,
  setSelectedItem,
  setSubView,
  navigateSubView,
  userId,
  fetchMyOrders,
  onOpenCoinTracking,
}) => {
  const [filterTab, setFilterTab] = useState("ativos");

  const activeOrders = myOrders.filter((o) => o && !["concluido", "cancelado"].includes(o.status));
  const scheduledOrders = myOrders.filter((o) => o && o.scheduled_at && !["concluido", "cancelado"].includes(o.status));
  const pastOrders = myOrders.filter((o) => o && ["concluido", "cancelado"].includes(o.status));

  const statusLabel: Record<string, string> = {
    pending: "Aguardando",
    pendente: "Aguardando",
    pendente_pagamento: "Aguardando Pagamento",
    novo: "Processando",
    waiting_driver: "Aguardando Entregador",
    aceito: "Confirmado",
    confirmado: "Confirmado",
    preparando: "Em Preparação",
    no_preparo: "Em Preparação",
    pronto: "Pronto para Coleta",
    a_caminho: "Em Rota de Coleta",
    at_pickup: "No Local",
    picked_up: "Coletado / Em Viagem",
    em_rota: "A Caminho do Destino",
    saiu_para_entrega: "Saindo para Entrega",
    concluido: "Concluído",
    cancelado: "Cancelado",
  };

  const isMobility = (o: any) => ["mototaxi", "carro", "van", "utilitario", "frete", "logistica", "package"].includes(o.service_type);

  const getServicePresentation = (o: any) => {
    const type = o.service_type;
    if (['mototaxi', 'carro', 'van'].includes(type)) {
      return { 
        label: type === 'mototaxi' ? 'Mobilidade (Moto)' : 'Mobilidade (Carro)',
        icon: type === 'mototaxi' ? 'two_wheeler' : 'directions_car',
        color: 'text-blue-400',
        glow: 'rgba(59,130,246,0.5)',
        name: o.merchant_name || (type === 'mototaxi' ? 'Izi Moto' : 'Izi Car'),
        bg: 'bg-blue-400/10'
      };
    }
    if (type === 'utilitario' || type === 'package' || type === 'frete' || type === 'logistica') {
      return { 
        label: 'Izi Envios',
        icon: 'local_shipping',
        color: 'text-purple-400',
        glow: 'rgba(168,85,247,0.5)',
        name: o.merchant_name || 'Entrega de Objeto',
        bg: 'bg-purple-400/10'
      };
    }
    if (type === 'coin_purchase') {
      return {
        label: 'Financeiro',
        icon: 'payments',
        color: 'text-emerald-400',
        glow: 'rgba(16,185,129,0.5)',
        name: 'Compra de IZI Coins',
        bg: 'bg-emerald-400/10'
      };
    }
    return { 
      label: 'Alimentação',
      icon: 'restaurant',
      color: 'text-yellow-400',
      glow: 'rgba(250,205,5,0.5)',
      name: o.merchant_name || 'Pedido',
      bg: 'bg-yellow-400/10'
    };
  };

  const renderClayCard = (order: any, isHistory: boolean = false) => {
    const presentation = getServicePresentation(order);
    const isCoin = order.service_type === "coin_purchase";
    const isMobilityOrder = isMobility(order);

    return (
      <motion.div
        key={order.id || Math.random().toString(36).substr(2, 9)}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          setSelectedItem(order);
          const isHistory = ["concluido", "cancelado"].includes(order.status);
          
            if (isCoin) {
              if (onOpenCoinTracking) onOpenCoinTracking(order);
              else navigateSubView("izi_coin_tracking");
            } else if (isHistory) {
              navigateSubView("order_detail");
            } else if (isMobilityOrder || !!order.scheduled_at) {
              navigateSubView("logistics_tracking");
            } else {
              navigateSubView("active_order");
            }
          }}
          className={`relative overflow-hidden rounded-[40px] cursor-pointer group ${isHistory ? 'mb-4 scale-95 origin-left opacity-90' : 'mb-8'}`}
        style={{
          background: "linear-gradient(135deg, rgba(28,28,31,0.9) 0%, rgba(20,20,22,0.95) 100%)",
          backdropFilter: "blur(20px)",
          boxShadow: isHistory 
            ? "10px 10px 30px rgba(0,0,0,0.4)" 
            : "25px 25px 50px rgba(0,0,0,0.7), -8px -8px 25px rgba(255,255,255,0.02), inset 1.5px 1.5px 0px rgba(255,255,255,0.08), inset -1.5px -1.5px 0px rgba(0,0,0,0.2)",
          border: `1.5px solid ${isHistory ? 'rgba(250,204,21,0.05)' : presentation.color.includes('yellow') ? 'rgba(250,204,21,0.22)' : presentation.color.includes('blue') ? 'rgba(59,130,246,0.22)' : 'rgba(168,85,247,0.22)'}`
        }}
      >
        {/* PREMIUM DECORATION */}
        <div className={`absolute top-0 right-0 w-64 h-64 ${presentation.bg} rounded-full blur-[80px] pointer-events-none group-hover:bg-opacity-20 transition-all duration-1000`} />
        
        <div className="relative z-10 p-8 pb-6">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-5">
              <div
                className={`size-16 rounded-[24px] flex items-center justify-center shrink-0 relative shadow-[10px_10px_25px_rgba(0,0,0,0.5),inset_2px_2px_4px_rgba(255,255,255,0.05)]`}
                style={{
                  background: "linear-gradient(145deg, #2a2a2e, #1c1c20)",
                }}
              >
                <span className={`material-symbols-rounded text-3xl font-black ${isHistory ? 'text-zinc-500' : presentation.color} drop-shadow-[0_0_12px_${presentation.glow}]`}>
                  {presentation.icon}
                </span>
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent rounded-[24px]" />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 mb-1.5 opacity-60">
                  {isHistory ? "Encerrado" : order.scheduled_at ? "Agendamento" : "Atividade"}
                </p>
                <h4 className={`text-lg font-black uppercase tracking-tight leading-tight ${isHistory ? 'text-zinc-400' : 'text-white'}`}>
                  {presentation.name}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${isHistory ? 'bg-zinc-800 text-zinc-600' : `${presentation.bg} ${presentation.color} border border-white/5`}`}>
                    {presentation.label}
                  </span>
                </div>
              </div>
            </div>

            <div
              className={`px-4 py-2.5 rounded-2xl flex items-center gap-2 bg-black/40 border border-white/5 shadow-[inset_1px_1px_4px_rgba(0,0,0,0.5)]`}
            >
              {!isHistory && <div className={`size-1.5 rounded-full ${order.status === 'cancelado' ? 'bg-red-500' : presentation.color.includes('yellow') ? 'bg-yellow-400 animate-pulse' : presentation.color.includes('blue') ? 'bg-blue-400 animate-pulse' : 'bg-purple-400 animate-pulse'}`} />}
              <p className={`text-[10px] font-black uppercase tracking-widest ${order.status === 'cancelado' ? 'text-red-400' : isHistory ? 'text-zinc-500' : presentation.color}`}>
                {statusLabel[order.status] || order.status}
              </p>
            </div>
          </div>

          <div className="relative flex gap-4 min-h-0 bg-white/5 p-6 rounded-[32px] mb-8 border border-white/5 shadow-[inset_2px_2px_8px_rgba(0,0,0,0.2)]">
            <div className="flex flex-col items-center pt-1 shrink-0">
              <div className="size-2 rounded-full bg-white/20" />
              <div className="w-px flex-1 my-1.5 bg-gradient-to-b from-white/10 to-transparent" />
              <div className={`size-2 rounded-full ${presentation.color.replace('text-', 'bg-')} shadow-[0_0_8px_${presentation.glow}]`} />
            </div>
            <div className="flex-1 min-w-0 space-y-3">
              <div className="min-w-0">
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Origem</p>
                <p className="text-xs font-black text-zinc-300 truncate uppercase tracking-tight">
                  {isMobilityOrder ? parseAddressText(order.pickup_address) || "Origem" : isCoin ? "Digital" : order.merchant_name || "Loja Parceira"}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Destino</p>
                <p className={`text-xs font-black ${presentation.color} truncate uppercase tracking-tight`}>
                  {isCoin ? "Recarga na Carteira" : parseAddressText(order.delivery_address) || "Destino"}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0 flex flex-col justify-end border-l border-white/5 pl-4">
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Valor</p>
              <p className={`text-xl font-black ${isHistory ? 'text-zinc-300' : 'text-white'}`}>
                <span className="text-[10px] not-italic mr-1 opacity-50">R$</span>
                {Number(order.total_price || 0).toFixed(2).replace(".",",")}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-auto">
            <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">
               {order.scheduled_at ? new Date(order.scheduled_at).toLocaleString("pt-BR") : new Date(order.created_at).toLocaleString("pt-BR")}
            </p>
            <div className={`${isHistory ? 'text-zinc-600' : presentation.color} text-[10px] font-black uppercase tracking-widest flex items-center gap-2 group-hover:translate-x-1 transition-all`}>
               DETALHES <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };


  return (
    <div className="flex flex-col h-full bg-black text-zinc-100 pb-32 overflow-y-auto no-scrollbar">
      <main className="px-5 pt-8 pb-10 max-w-2xl mx-auto w-full">
        {/* TABS */}
        <nav className="flex items-center gap-8 mb-10 overflow-x-auto no-scrollbar">
          {[
            { id: "ativos", label: "Ativos", count: activeOrders.length },
            { id: "agendados", label: "Agendados", count: scheduledOrders.length },
            { id: "historico", label: "Histórico", count: pastOrders.length },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setFilterTab(t.id)}
              className="relative pb-2 group shrink-0"
            >
              <span
                className={`font-extrabold text-lg transition-colors ${
                  filterTab === t.id ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"
                }`}
              >
                {t.label}
                {t.count > 0 && (
                  <span className="ml-2 text-[10px] bg-yellow-400 text-black font-black px-1.5 py-0.5 rounded-full">
                    {t.count}
                  </span>
                )}
              </span>
              <div
                className={`absolute bottom-0 left-0 h-[2px] rounded-full transition-all duration-300 ${
                  filterTab === t.id ? "w-full bg-yellow-400" : "w-0 bg-zinc-700"
                }`}
              />
            </button>
          ))}
        </nav>

        <AnimatePresence mode="wait">
          {/* ATIVOS */}
          {filterTab === "ativos" && (
            <motion.div
              key="ativos"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-12"
            >
              {activeOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <span className="material-symbols-outlined text-5xl text-zinc-800">shopping_bag</span>
                  <p className="text-zinc-600 text-sm font-medium">Nenhum pedido ativo no momento</p>
                </div>
              ) : (
                <>
                  {/* Seção Mobilidade */}
                  {activeOrders.some(isMobility) && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-4 px-2">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]">Mobilidade & Fretes</h3>
                        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
                      </div>
                      {activeOrders.filter(isMobility).map((order) => renderClayCard(order, false))}
                    </div>
                  )}

                  {/* Seção Delivery/Outros */}
                  {activeOrders.some(o => !isMobility(o)) && (
                    <div className="space-y-6">
                      {activeOrders.some(isMobility) && (
                        <div className="flex items-center gap-4 px-2 mt-8">
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
                          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Pedidos de Delivery</h3>
                          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
                        </div>
                      )}
                      {activeOrders.filter(o => !isMobility(o)).map((order) => renderClayCard(order, false))}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* AGENDADOS */}
          {filterTab === "agendados" && (
            <motion.div
              key="agendados"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-14"
            >
              {scheduledOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <span className="material-symbols-outlined text-5xl text-zinc-800">event</span>
                  <p className="text-zinc-600 text-sm font-medium">Nenhum pedido agendado</p>
                </div>
              ) : (
                scheduledOrders.map((order) => renderClayCard(order, false))
              )}
            </motion.div>
          )}

          {/* HISTÓRICO */}
          {filterTab === "historico" && (
            <motion.div
              key="historico"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {pastOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <span className="material-symbols-outlined text-5xl text-zinc-800">history</span>
                  <p className="text-zinc-600 text-sm font-medium">Nenhum pedido no histórico</p>
                </div>
              ) : (
                pastOrders.map((order) => renderClayCard(order, true))
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* BOTTOM HINT */}
        <div className="mt-20 pt-8 border-t border-zinc-900 flex flex-col items-center text-center">
          <span className="material-symbols-outlined text-zinc-800 text-4xl mb-3">shopping_bag</span>
          <p className="text-zinc-600 text-sm font-medium">
            Não vê um pedido?{" "}
            <button
              onClick={() => userId && fetchMyOrders(userId)}
              className="text-yellow-400/60 hover:text-yellow-400 transition-colors"
            >
              Atualizar lista
            </button>
          </p>
        </div>
      </main>
    </div>
  );
};


