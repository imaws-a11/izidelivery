import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RefreshCcw, 
  Inbox, 
  Bell, 
  UtensilsCrossed, 
  PackageCheck, 
  Truck, 
  History, 
  MapPin, 
  User, 
  ShoppingBag,
  CheckCircle2,
  XCircle,
  Play,
  CreditCard,
  Wallet,
  Phone,
  MessageCircle,
  Clock,
  Eye,
  ChevronRight
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { supabase } from '../lib/supabase';
import { toastSuccess, toastError } from '../lib/useToast';

export default function OrderCenterTab() {
  const { 
    allOrders, 
    merchantProfile, 
    fetchAllOrders,
    isLoadingList,
    setSelectedOrder
  } = useAdmin();

  const [localProcessingId, setLocalProcessingId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Auto-refresh a cada 15s para máxima resiliência
  useEffect(() => {
    const timer = setInterval(() => fetchAllOrders(undefined, true), 15000);
    return () => clearInterval(timer);
  }, [fetchAllOrders]);

  // Filtrar pedidos do lojista logado
  const merchantOrders = useMemo(() => {
    const mId = merchantProfile?.id;
    if (!mId) return [];
    return allOrders.filter((o: any) => String(o.merchant_id) === String(mId));
  }, [allOrders, merchantProfile]);

  // Agrupamento de pedidos por status em tempo real
  const groups = useMemo(() => {
    return {
      pending: merchantOrders.filter(o => 
        ['novo', 'waiting_merchant', 'paid', 'pago', 'confirmed', 'confirmado', 'agendado', 'scheduled'].includes(o.status)
      ),
      preparing: merchantOrders.filter(o => 
        o.status === 'preparando' || 
        (o.preparation_status === 'preparando' && o.status !== 'concluido' && o.status !== 'cancelado')
      ),
      ready: merchantOrders.filter(o => 
        (o.status === 'pronto' || o.preparation_status === 'pronto' || o.status === 'waiting_driver') && 
        !['picked_up', 'em_rota', 'concluido', 'cancelado'].includes(o.status)
      ),
      shipped: merchantOrders.filter(o => 
        ['accepted', 'picked_up', 'em_rota', 'a_caminho', 'a_caminho_coleta', 'chegou_coleta', 'no_local_coleta', 'delivering'].includes(o.status)
      ),
      history: merchantOrders.filter(o => 
        ['concluido', 'delivered', 'cancelado'].includes(o.status)
      ).slice(0, 20)
    };
  }, [merchantOrders]);

  const handleAction = async (id: string, newStatus: string, preparationStatus?: string) => {
    setLocalProcessingId(id);
    try {
      const payload: any = { status: newStatus };
      if (preparationStatus) payload.preparation_status = preparationStatus;

      // Se for confirmação manual de pagamento em pendentes
      if (newStatus === 'preparando' && preparationStatus === 'preparando') {
        payload.payment_status = 'approved';
        payload.paid_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('orders_delivery')
        .update(payload)
        .eq('id', id);
      
      if (error) throw error;
      toastSuccess('Pedido atualizado com sucesso!');
      await fetchAllOrders(undefined, true);
    } catch (err: any) {
      toastError('Erro ao atualizar pedido: ' + err.message);
    } finally {
      setLocalProcessingId(null);
    }
  };

  const getElapsedTime = (createdAt: string) => {
    const diffMs = Date.now() - new Date(createdAt).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins} min atrás`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    return new Date(createdAt).toLocaleDateString('pt-BR');
  };

  const getOrderTypeBadge = (serviceType: string) => {
    const s = serviceType?.toLowerCase();
    if (['entrega_avulsa', 'avulsa', 'standalone', 'motoboy'].includes(s)) {
      return { label: 'Entrega Avulsa', style: 'bg-amber-500/10 text-amber-600 border border-amber-500/20' };
    }
    if (['takeout', 'balcao', 'retirada'].includes(s)) {
      return { label: 'Retirada', style: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' };
    }
    return { label: 'Delivery Normal', style: 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20' };
  };

  return (
    <div className="w-full mx-auto space-y-8 pb-24 font-display text-slate-900 dark:text-white px-2">
      {/* Header Estilizado Luxury White */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-zinc-950 p-8 rounded-[36px] border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-950 dark:text-white tracking-tight uppercase flex items-center gap-3">
            <span className="p-2 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              <ShoppingBag className="size-6" />
            </span>
            Central de Pedidos
          </h1>
          <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.3em] mt-2">Torre de Controle de Fluxo Realtime</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsHistoryOpen(true)}
            className="h-13 px-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 flex items-center gap-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 hover:border-indigo-500/30 transition-all font-black text-[10px] uppercase tracking-widest active:scale-95"
          >
            <History className="size-4" />
            Ver Histórico
          </button>
          <button 
            onClick={() => fetchAllOrders()}
            disabled={isLoadingList}
            className="h-13 px-5 rounded-2xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center gap-2 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-100 transition-all font-black text-[10px] uppercase tracking-widest active:scale-95 disabled:opacity-50"
          >
            <RefreshCcw className={`size-4 ${isLoadingList ? 'animate-spin' : ''}`} />
            Sincronizar
          </button>
        </div>
      </header>

      {/* Grid Kanban principal de 4 colunas - Ocupação Total */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 w-full items-start">
        
        {/* COLUNA 1: PENDENTES */}
        <div className="flex flex-col bg-zinc-50/50 dark:bg-zinc-900/30 rounded-[32px] p-5 border border-zinc-200/40 dark:border-zinc-800/40 shadow-sm h-full">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
                <Bell className="size-4" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">Pendentes</h3>
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Aguardando aceite</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-orange-500 text-white text-[10px] font-black">{groups.pending.length}</span>
          </div>

          <div className="space-y-4 max-h-[calc(100vh-270px)] overflow-y-auto pr-1 custom-scrollbar min-h-[150px]">
            <AnimatePresence mode="popLayout">
              {groups.pending.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center opacity-30 bg-white dark:bg-zinc-900/20 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
                  <Inbox className="size-8 stroke-[1px] text-zinc-400 mb-2" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Sem novos pedidos</p>
                </div>
              ) : (
                groups.pending.map((order: any) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="bg-white dark:bg-zinc-950 p-5 rounded-3xl border border-zinc-200/60 dark:border-zinc-850 shadow-sm hover:shadow-md hover:border-indigo-500/20 transition-all cursor-pointer relative group overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors uppercase">
                          #DT-{order.id.slice(0, 8).toUpperCase()}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-1 text-[9px] text-zinc-400 font-bold">
                          <Clock className="size-3 text-zinc-300" />
                          {getElapsedTime(order.created_at)}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[8px] font-black ${getOrderTypeBadge(order.service_type).style}`}>
                          {getOrderTypeBadge(order.service_type).label}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 my-3">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-zinc-400 uppercase">Cliente</span>
                        <span className="font-extrabold text-slate-800 dark:text-zinc-200 max-w-[130px] truncate uppercase">{order.user_name || 'Cliente Izi'}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-zinc-400 uppercase">Valor</span>
                        <span className="font-extrabold text-slate-950 dark:text-white">R$ {Number(order.total_price || 0).toFixed(2).replace('.', ',')}</span>
                      </div>
                    </div>

                    {/* Itens do Pedido */}
                    {Array.isArray(order.items) && (
                      <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-900 space-y-1">
                        {order.items.slice(0, 2).map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-[10px] text-zinc-500 font-bold">
                            <span className="truncate flex-1 pr-3 uppercase">{item.name || item.product_name || 'Produto'}</span>
                            <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 text-[9px] text-zinc-600 dark:text-zinc-400 font-black">{item.quantity}x</span>
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <p className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase mt-1">
                            + {order.items.length - 2} outros itens
                          </p>
                        )}
                      </div>
                    )}

                    {/* Ações rápidas */}
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-900" onClick={(e) => e.stopPropagation()}>
                      <button
                        disabled={localProcessingId === order.id}
                        onClick={() => handleAction(order.id, 'cancelado')}
                        className="h-10 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 hover:border-rose-500 text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400 transition-all active:scale-95 disabled:opacity-50"
                      >
                        <XCircle className="size-3" />
                        Recusar
                      </button>
                      <button
                        disabled={localProcessingId === order.id}
                        onClick={() => handleAction(order.id, 'preparando', 'preparando')}
                        className="h-10 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 shadow-sm hover:shadow active:scale-95 transition-all disabled:opacity-50"
                      >
                        <Play className="size-3 fill-current" />
                        Aceitar
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* COLUNA 2: EM PRODUÇÃO */}
        <div className="flex flex-col bg-zinc-50/50 dark:bg-zinc-900/30 rounded-[32px] p-5 border border-zinc-200/40 dark:border-zinc-800/40 shadow-sm h-full">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <UtensilsCrossed className="size-4" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">Em Produção</h3>
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Sendo preparado</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-500 text-white text-[10px] font-black">{groups.preparing.length}</span>
          </div>

          <div className="space-y-4 max-h-[calc(100vh-270px)] overflow-y-auto pr-1 custom-scrollbar min-h-[150px]">
            <AnimatePresence mode="popLayout">
              {groups.preparing.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center opacity-30 bg-white dark:bg-zinc-900/20 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
                  <Inbox className="size-8 stroke-[1px] text-zinc-400 mb-2" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Nenhum pedido em produção</p>
                </div>
              ) : (
                groups.preparing.map((order: any) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="bg-white dark:bg-zinc-950 p-5 rounded-3xl border border-zinc-200/60 dark:border-zinc-850 shadow-sm hover:shadow-md hover:border-indigo-500/20 transition-all cursor-pointer relative group overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors uppercase">
                          #DT-{order.id.slice(0, 8).toUpperCase()}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-1 text-[9px] text-zinc-400 font-bold">
                          <Clock className="size-3 text-zinc-300 animate-pulse" />
                          {getElapsedTime(order.created_at)}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[8px] font-black ${getOrderTypeBadge(order.service_type).style}`}>
                          {getOrderTypeBadge(order.service_type).label}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 my-3">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-zinc-400 uppercase">Cliente</span>
                        <span className="font-extrabold text-slate-800 dark:text-zinc-200 max-w-[130px] truncate uppercase">{order.user_name || 'Cliente Izi'}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-zinc-400 uppercase">Valor</span>
                        <span className="font-extrabold text-slate-950 dark:text-white">R$ {Number(order.total_price || 0).toFixed(2).replace('.', ',')}</span>
                      </div>
                    </div>

                    {/* Itens do Pedido */}
                    {Array.isArray(order.items) && (
                      <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-900 space-y-1">
                        {order.items.slice(0, 2).map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-[10px] text-zinc-500 font-bold">
                            <span className="truncate flex-1 pr-3 uppercase">{item.name || item.product_name || 'Produto'}</span>
                            <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 text-[9px] text-zinc-600 dark:text-zinc-400 font-black">{item.quantity}x</span>
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <p className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase mt-1">
                            + {order.items.length - 2} outros itens
                          </p>
                        )}
                      </div>
                    )}

                    {/* Ações rápidas */}
                    <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-900" onClick={(e) => e.stopPropagation()}>
                      <button
                        disabled={localProcessingId === order.id}
                        onClick={() => handleAction(order.id, 'waiting_driver', 'pronto')}
                        className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm hover:shadow active:scale-95 transition-all disabled:opacity-50"
                      >
                        <CheckCircle2 className="size-4" />
                        Pronto para Coleta
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* COLUNA 3: PRONTOS */}
        <div className="flex flex-col bg-zinc-50/50 dark:bg-zinc-900/30 rounded-[32px] p-5 border border-zinc-200/40 dark:border-zinc-800/40 shadow-sm h-full">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <PackageCheck className="size-4" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">Prontos</h3>
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Aguardando retirada</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-black">{groups.ready.length}</span>
          </div>

          <div className="space-y-4 max-h-[calc(100vh-270px)] overflow-y-auto pr-1 custom-scrollbar min-h-[150px]">
            <AnimatePresence mode="popLayout">
              {groups.ready.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center opacity-30 bg-white dark:bg-zinc-900/20 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
                  <Inbox className="size-8 stroke-[1px] text-zinc-400 mb-2" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Nenhum pedido pronto</p>
                </div>
              ) : (
                groups.ready.map((order: any) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="bg-white dark:bg-zinc-950 p-5 rounded-3xl border border-zinc-200/60 dark:border-zinc-850 shadow-sm hover:shadow-md hover:border-indigo-500/20 transition-all cursor-pointer relative group overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors uppercase">
                          #DT-{order.id.slice(0, 8).toUpperCase()}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-1 text-[9px] text-zinc-400 font-bold">
                          <Clock className="size-3 text-zinc-300" />
                          Pronto {getElapsedTime(order.created_at)}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[8px] font-black ${getOrderTypeBadge(order.service_type).style}`}>
                          {getOrderTypeBadge(order.service_type).label}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 my-3">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-zinc-400 uppercase">Cliente</span>
                        <span className="font-extrabold text-slate-800 dark:text-zinc-200 max-w-[130px] truncate uppercase">{order.user_name || 'Cliente Izi'}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-zinc-400 uppercase">Valor</span>
                        <span className="font-extrabold text-slate-950 dark:text-white">R$ {Number(order.total_price || 0).toFixed(2).replace('.', ',')}</span>
                      </div>
                    </div>

                    {/* Estado de Coleta / Entregador */}
                    <div className="mt-4 p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                        <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Aguardando Coleta</span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* COLUNA 4: EM ROTA */}
        <div className="flex flex-col bg-zinc-50/50 dark:bg-zinc-900/30 rounded-[32px] p-5 border border-zinc-200/40 dark:border-zinc-800/40 shadow-sm h-full">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                <Truck className="size-4" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">Em Rota</h3>
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Saiu para entrega</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-blue-500 text-white text-[10px] font-black">{groups.shipped.length}</span>
          </div>

          <div className="space-y-4 max-h-[calc(100vh-270px)] overflow-y-auto pr-1 custom-scrollbar min-h-[150px]">
            <AnimatePresence mode="popLayout">
              {groups.shipped.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center opacity-30 bg-white dark:bg-zinc-900/20 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
                  <Inbox className="size-8 stroke-[1px] text-zinc-400 mb-2" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Nenhum pedido em trânsito</p>
                </div>
              ) : (
                groups.shipped.map((order: any) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="bg-white dark:bg-zinc-950 p-5 rounded-3xl border border-zinc-200/60 dark:border-zinc-850 shadow-sm hover:shadow-md hover:border-indigo-500/20 transition-all cursor-pointer relative group overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors uppercase">
                          #DT-{order.id.slice(0, 8).toUpperCase()}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-1 text-[9px] text-zinc-400 font-bold">
                          <Clock className="size-3 text-zinc-300 animate-pulse" />
                          Em rota {getElapsedTime(order.created_at)}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[8px] font-black ${getOrderTypeBadge(order.service_type).style}`}>
                          {getOrderTypeBadge(order.service_type).label}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 my-3">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-zinc-400 uppercase">Cliente</span>
                        <span className="font-extrabold text-slate-800 dark:text-zinc-200 max-w-[130px] truncate uppercase">{order.user_name || 'Cliente Izi'}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-zinc-400 uppercase">Valor</span>
                        <span className="font-extrabold text-slate-950 dark:text-white">R$ {Number(order.total_price || 0).toFixed(2).replace('.', ',')}</span>
                      </div>
                    </div>

                    {/* Informações Reais do Entregador com Join */}
                    {order.driver_name ? (
                      <div className="mt-4 bg-blue-50/50 dark:bg-blue-500/5 rounded-2xl p-3 flex items-center justify-between border border-blue-100 dark:border-blue-900/30" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-xl bg-white dark:bg-zinc-800 border border-blue-100 dark:border-blue-950 overflow-hidden shadow-sm flex items-center justify-center shrink-0">
                            {order.driver_avatar ? (
                              <img src={order.driver_avatar} className="w-full h-full object-cover" />
                            ) : (
                              <User size={16} className="text-blue-500" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-tight truncate max-w-[100px]">{order.driver_name}</p>
                            <p className="text-[8px] font-bold text-blue-400/70 uppercase tracking-widest truncate max-w-[100px]">
                              {order.driver_vehicle || 'Motoboy'} • {order.driver_plate || 'S/ Placa'}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          {order.driver_phone && (
                            <>
                              <a 
                                href={`tel:${order.driver_phone}`}
                                className="size-7 rounded-full bg-white dark:bg-zinc-800 text-blue-600 flex items-center justify-center hover:scale-105 transition-all shadow-sm border border-blue-100 dark:border-blue-900/50"
                                title="Ligar para o Entregador"
                              >
                                <Phone size={12} />
                              </a>
                              <a 
                                href={`https://wa.me/55${order.driver_phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="size-7 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:scale-105 transition-all shadow-sm"
                                title="WhatsApp do Entregador"
                              >
                                <MessageCircle size={12} />
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 bg-amber-50/50 dark:bg-amber-500/5 rounded-2xl p-3 flex items-center gap-3 border border-amber-100 dark:border-amber-500/10">
                        <div className="size-7 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-base text-amber-600 animate-pulse">progress_activity</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest leading-none">Buscando Piloto</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* GAVETA LATERAL DE HISTÓRICO RECENTE */}
      <AnimatePresence>
        {isHistoryOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryOpen(false)}
              className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-screen w-full max-w-md bg-white dark:bg-zinc-950 z-[120] shadow-2xl flex flex-col border-l border-zinc-200/50 dark:border-zinc-800/50"
            >
              {/* Header */}
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-900 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
                <div className="flex items-center gap-3">
                  <History className="size-5 text-indigo-500" />
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Histórico Recente</h3>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Últimos 20 pedidos finalizados</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="size-10 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-rose-500 transition-colors"
                >
                  <XCircle className="size-5" />
                </button>
              </div>

              {/* Lista de Pedidos */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {groups.history.length === 0 ? (
                  <div className="py-20 text-center opacity-30">
                    <Inbox className="size-12 mx-auto stroke-[1px]" />
                    <p className="text-xs font-black uppercase tracking-widest mt-4">Nenhum pedido finalizado recentemente</p>
                  </div>
                ) : (
                  groups.history.map((order: any) => (
                    <div
                      key={order.id}
                      onClick={() => {
                        setSelectedOrder(order);
                        setIsHistoryOpen(false);
                      }}
                      className="group bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-3xl border border-zinc-200/30 dark:border-zinc-800/30 hover:border-indigo-500/20 transition-all cursor-pointer flex justify-between items-start"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`size-1.5 rounded-full ${order.status === 'cancelado' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                          <h4 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors uppercase">
                            #DT-{order.id.slice(0, 8).toUpperCase()}
                          </h4>
                        </div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{order.user_name || 'Cliente Izi'}</p>
                        <p className="text-[9px] text-zinc-400 font-bold">{new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <div className="text-right space-y-2">
                        <p className="text-xs font-black text-slate-900 dark:text-white">R$ {Number(order.total_price || 0).toFixed(2).replace('.', ',')}</p>
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                          order.status === 'cancelado' 
                            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                            : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        }`}>
                          {order.status === 'cancelado' ? 'Cancelado' : 'Entregue'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
