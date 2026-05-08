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
  Wallet
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { supabase } from '../lib/supabase';
import { toastSuccess, toastError } from '../lib/useToast';

type OrderStatusGroup = 'pending' | 'preparing' | 'ready' | 'shipped' | 'history';

export default function OrderCenterTab() {
  const { 
    allOrders, 
    merchantProfile, 
    fetchAllOrders,
    isLoadingList,
    myDriversList
  } = useAdmin();

  const [activeTab, setActiveTab] = useState<OrderStatusGroup>('pending');
  const [isProcessing, setIsProcessing] = useState(false);

  // Auto-refresh a cada 30s
  useEffect(() => {
    const timer = setInterval(() => fetchAllOrders(undefined, true), 30000);
    return () => clearInterval(timer);
  }, [fetchAllOrders]);

  // Filtrar pedidos do lojista logado
  const merchantOrders = useMemo(() => {
    const mId = merchantProfile?.merchant_id || merchantProfile?.id;
    if (!mId) return [];
    return allOrders.filter((o: any) => String(o.merchant_id) === String(mId));
  }, [allOrders, merchantProfile]);

  // Agrupamento de pedidos por status
  const groups = useMemo(() => {
    return {
      pending: merchantOrders.filter(o => ['novo', 'waiting_merchant', 'paid', 'pago', 'confirmed', 'confirmado'].includes(o.status)),
      preparing: merchantOrders.filter(o => o.status === 'preparando' || (o.preparation_status === 'preparando' && o.status !== 'concluido' && o.status !== 'cancelado')),
      ready: merchantOrders.filter(o => (o.status === 'pronto' || o.preparation_status === 'pronto' || o.status === 'waiting_driver') && !['picked_up', 'em_rota', 'concluido', 'cancelado'].includes(o.status)),
      shipped: merchantOrders.filter(o => ['accepted', 'picked_up', 'em_rota', 'a_caminho', 'a_caminho_coleta', 'chegou_coleta', 'no_local_coleta'].includes(o.status)),
      history: merchantOrders.filter(o => ['concluido', 'delivered', 'cancelado'].includes(o.status)).slice(0, 20)
    };
  }, [merchantOrders]);

  const currentOrders = groups[activeTab];

  const handleAction = async (id: string, newStatus: string, preparationStatus?: string) => {
    setIsProcessing(true);
    try {
      const payload: any = { status: newStatus };
      if (preparationStatus) payload.preparation_status = preparationStatus;

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
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    if (['novo', 'waiting_merchant'].includes(s)) return { label: 'Novo', color: 'bg-orange-500' };
    if (s === 'preparando') return { label: 'Produção', color: 'bg-amber-500' };
    if (s === 'pronto' || s === 'waiting_driver') return { label: 'Pronto', color: 'bg-emerald-500' };
    if (['picked_up', 'em_rota'].includes(s)) return { label: 'Em Rota', color: 'bg-blue-500' };
    if (s === 'concluido' || s === 'delivered') return { label: 'Concluído', color: 'bg-zinc-400' };
    if (s === 'cancelado') return { label: 'Cancelado', color: 'bg-rose-500' };
    return { label: status, color: 'bg-zinc-400' };
  };

  const getDriverInfo = (driverId: string) => {
    if (!driverId) return null;
    return myDriversList.find(d => d.id === driverId);
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 pb-24 font-display">
      {/* Header Estilizado */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-zinc-900 p-8 rounded-[40px] border border-zinc-100 dark:border-zinc-800 shadow-sm">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tighter uppercase">Central de Pedidos</h1>
          <p className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mt-1">Torre de Controle em Tempo Real</p>
        </div>

        <div className="flex items-center gap-4">
           <button 
             onClick={() => fetchAllOrders()}
             className="h-14 px-6 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center gap-3 hover:bg-black hover:text-white transition-all group font-bold text-[10px] uppercase tracking-widest"
           >
             <RefreshCcw className={`size-4 ${isLoadingList ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
             Atualizar Painel
           </button>
        </div>
      </header>

      {/* Tabs de Navegação de Fluxo */}
      <nav className="flex flex-wrap gap-3 p-2 bg-zinc-100/50 dark:bg-white/5 rounded-[32px] border border-zinc-100 dark:border-zinc-800">
        {[
          { id: 'pending', label: 'Pendentes', icon: Bell, count: groups.pending.length, color: 'text-orange-500' },
          { id: 'preparing', label: 'Produção', icon: UtensilsCrossed, count: groups.preparing.length, color: 'text-amber-500' },
          { id: 'ready', label: 'Prontos', icon: PackageCheck, count: groups.ready.length, color: 'text-emerald-500' },
          { id: 'shipped', label: 'Em Rota', icon: Truck, count: groups.shipped.length, color: 'text-blue-500' },
          { id: 'history', label: 'Recentes', icon: History, count: groups.history.length, color: 'text-zinc-400' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as OrderStatusGroup)}
            className={`flex-1 min-w-[140px] h-16 rounded-[24px] flex items-center justify-center gap-3 transition-all font-bold text-[10px] uppercase tracking-widest ${activeTab === tab.id ? 'bg-white dark:bg-zinc-800 shadow-sm border border-zinc-200 dark:border-zinc-700 text-black dark:text-white' : 'text-zinc-400 hover:text-zinc-600'}`}
          >
            <tab.icon className={`size-4 ${activeTab === tab.id ? tab.color : 'text-zinc-300'}`} />
            {tab.label}
            {tab.count > 0 && <span className={`ml-1 px-2 py-0.5 rounded-full text-[8px] ${activeTab === tab.id ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-zinc-200 text-zinc-500'}`}>{tab.count}</span>}
          </button>
        ))}
      </nav>

      {/* Grid de Pedidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {currentOrders.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-32 flex flex-col items-center justify-center text-center opacity-20"
            >
               <Inbox className="size-16 stroke-[1px]" />
               <p className="text-sm font-bold uppercase tracking-widest mt-4">Nenhum pedido nesta fase</p>
            </motion.div>
          ) : (
            currentOrders.map((order: any) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={order.id}
                className="bg-white dark:bg-zinc-900 p-8 rounded-[40px] border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-5 blur-3xl ${getStatusBadge(order.status).color}`} />

                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`size-2 rounded-full ${getStatusBadge(order.status).color} animate-pulse`} />
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{getStatusBadge(order.status).label}</span>
                    </div>
                    <h3 className="text-2xl font-extrabold text-black dark:text-white tracking-tighter uppercase">#DT-{order.id.slice(0, 8).toUpperCase()}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Total</p>
                    <p className="text-xl font-extrabold text-primary">R$ {Number(order.total_price || 0).toFixed(2).replace('.', ',')}</p>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-4 p-4 rounded-3xl bg-zinc-50 dark:bg-white/5 border border-zinc-100/50 dark:border-white/5">
                    <MapPin className="size-5 text-zinc-400 mt-0.5" />
                    <div className="flex-1 min-w-0">
                       <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Endereço de Entrega</p>
                       <p className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300 line-clamp-2 leading-relaxed uppercase">
                         {order.delivery_address?.split('|')[0]}
                       </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between px-4">
                    <div className="flex items-center gap-4">
                      <User className="size-5 text-zinc-400" />
                      <div>
                        <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Cliente</p>
                        <p className="text-xs font-bold text-black dark:text-white uppercase tracking-tighter">{order.user_name || 'Usuário Izi'}</p>
                      </div>
                    </div>
                    {order.payment_method && (
                      <div className="flex flex-col items-end">
                        <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Pagamento</p>
                        <div className="flex items-center gap-1.5 text-zinc-500">
                          {order.payment_method?.toLowerCase() === 'pix' ? <Wallet className="size-3" /> : <CreditCard className="size-3" />}
                          <span className="text-[10px] font-bold uppercase">{order.payment_method}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Itens do Pedido */}
                <div className="mb-8 px-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Itens do Pedido</p>
                    <span className="text-[9px] font-bold text-zinc-300 bg-zinc-100 dark:bg-white/5 px-2 py-0.5 rounded-full">{Array.isArray(order.items) ? order.items.length : 0} unid</span>
                  </div>
                  <div className="space-y-2">
                    {Array.isArray(order.items) ? order.items.slice(0, 3).map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-[10px] font-bold text-zinc-500">
                        <span className="truncate flex-1 pr-4 uppercase">{item.name || item.product_name}</span>
                        <span className="text-black dark:text-white">{item.quantity}x</span>
                      </div>
                    )) : <p className="text-[10px] font-bold text-zinc-400">Ver detalhes na comanda</p>}
                    {Array.isArray(order.items) && order.items.length > 3 && (
                      <p className="text-[9px] font-bold text-primary uppercase mt-2">+ {order.items.length - 3} outros itens</p>
                    )}
                  </div>
                </div>

                {/* Ações Rápidas por Fase */}
                <div className="grid grid-cols-2 gap-3">
                  {activeTab === 'pending' && (
                    <>
                      <button 
                        disabled={isProcessing}
                        onClick={() => handleAction(order.id, 'cancelado')}
                        className="h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-[9px] font-bold uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        <XCircle className="size-3" />
                        Recusar
                      </button>
                      <button 
                        disabled={isProcessing}
                        onClick={() => handleAction(order.id, 'preparando', 'preparando')}
                        className="h-14 rounded-2xl bg-black dark:bg-white text-white dark:text-black text-[9px] font-bold uppercase tracking-widest hover:bg-primary hover:text-black transition-all flex items-center justify-center gap-2"
                      >
                        <Play className="size-3 fill-current" />
                        Aceitar
                      </button>
                    </>
                  )}
                  {activeTab === 'preparing' && (
                    <button 
                      disabled={isProcessing}
                      onClick={() => handleAction(order.id, 'waiting_driver', 'pronto')}
                      className="col-span-2 h-14 rounded-2xl bg-emerald-500 text-white text-[9px] font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="size-4" />
                      Marcar como Pronto
                    </button>
                  )}
                  {activeTab === 'ready' && (
                    <div className="col-span-2 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <Truck className="size-5 text-emerald-500 animate-bounce" />
                          <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Aguardando Coleta</span>
                       </div>
                       <button 
                         onClick={() => fetchAllOrders(undefined, true)}
                         className="text-[9px] font-bold text-emerald-700 underline uppercase"
                       >
                         Ver Mapa
                       </button>
                    </div>
                  )}
                  {activeTab === 'shipped' && (
                    <div className="col-span-2 space-y-3">
                       {getDriverInfo(order.driver_id) && (
                         <div className="flex items-center gap-3 p-3 rounded-2xl bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10">
                            <div className="size-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center overflow-hidden">
                               {getDriverInfo(order.driver_id)?.avatar_url ? (
                                 <img src={getDriverInfo(order.driver_id)?.avatar_url} className="w-full h-full object-cover" />
                               ) : (
                                 <User className="size-4 text-blue-500" />
                               )}
                            </div>
                            <div className="flex-1">
                               <p className="text-[8px] font-bold text-blue-400 uppercase tracking-widest">Entregador</p>
                               <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">{getDriverInfo(order.driver_id)?.name}</p>
                            </div>
                         </div>
                       )}
                       <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <Truck className="size-5 text-blue-500" />
                             <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">Pedido em Entrega</span>
                          </div>
                       </div>
                    </div>
                  )}
                  {activeTab === 'history' && (
                    <div className="col-span-2 p-4 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <ShoppingBag className="size-5 text-zinc-400" />
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Pedido Finalizado</span>
                       </div>
                       <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full uppercase ${order.status === 'cancelado' ? 'bg-rose-100 text-rose-500' : 'bg-emerald-100 text-emerald-500'}`}>
                          {order.status === 'cancelado' ? 'Cancelado' : 'Entregue'}
                       </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
