import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAdmin } from '../context/AdminContext';
import { toastInfo, toastSuccess, toastError } from '../lib/useToast';
import { 
  Phone, 
  MessageCircle, 
  Trash2, 
  XCircle, 
  Share2, 
  MapPin, 
  Clock, 
  CreditCard,
  User,
  Zap,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Calendar
} from 'lucide-react';

interface Order {
  id: string;
  tracking_code: string;
  status: string;
  customer_name: string;
  delivery_address: string;
  delivery_fee: number;
  created_at: string;
  driver_id?: string;
  is_fragile?: boolean;
  has_beverage?: boolean;
  drivers_delivery?: {
    name: string;
    phone: string;
    avatar_url: string;
    license_plate: string;
    vehicle_model: string;
  };
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  'waiting_driver': { label: 'Buscando Piloto', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Zap },
  'accepted': { label: 'Piloto a Caminho', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Navigation },
  'picking_up': { label: 'Coleta em Andamento', color: 'text-indigo-500', bg: 'bg-indigo-500/10', icon: MapPin },
  'delivering': { label: 'Em Entrega', color: 'text-purple-500', bg: 'bg-purple-500/10', icon: CheckCircle2 },
  'delivered': { label: 'Concluído', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
  'cancelled': { label: 'Cancelado', color: 'text-rose-500', bg: 'bg-rose-500/10', icon: XCircle },
  'agendado': { label: 'Agendado', color: 'text-slate-500', bg: 'bg-slate-500/10', icon: Calendar },
  'scheduled': { label: 'Agendado', color: 'text-slate-500', bg: 'bg-slate-500/10', icon: Calendar },
};

export default function MerchantOrdersTracking() {
  const { merchantProfile, setSelectedOrder, fetchMerchantFinance } = useAdmin();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    if (!merchantProfile?.id) return;
    
    const { data, error } = await supabase
      .from('orders_delivery')
      .select(`
        *,
        drivers_delivery:driver_id (
          name,
          phone,
          avatar_url,
          license_plate,
          vehicle_model
        )
      `)
      .eq('merchant_id', merchantProfile.id)
      .in('service_type', ['entrega_avulsa', 'standalone', 'avulsa', 'motoboy'])
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Erro ao buscar pedidos:', error);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleCancelOrder = async (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    const isTerminal = ['delivered', 'concluido', 'entregue', 'cancelado', 'cancelled', 'finalizado'].includes(order.status);
    
    const confirmMsg = isTerminal 
      ? 'Deseja remover este pedido do histórico?' 
      : `Deseja cancelar esta entrega? O valor de R$ ${order.delivery_fee.toFixed(2).replace('.', ',')} será estornado ao seu saldo.`;
    
    if (!confirm(confirmMsg)) return;
    
    setProcessingId(order.id);
    try {
      if (isTerminal) {
        await supabase.from('orders_delivery').delete().eq('id', order.id);
        toastSuccess('Pedido removido do histórico.');
      } else {
        await supabase.from('orders_delivery').update({ 
          status: 'cancelado', 
          cancel_reason: 'Cancelado pelo parceiro via painel' 
        }).eq('id', order.id);
        
        if (order.delivery_fee > 0) {
          await supabase.from('wallet_transactions_delivery').insert([{
            user_id: merchantProfile?.id,
            type: 'deposito',
            amount: order.delivery_fee,
            description: `Estorno — Entrega Avulsa cancelada (${order.tracking_code})`,
            status: 'concluido'
          }]);
          await fetchMerchantFinance();
          toastSuccess(`Cancelado! R$ ${order.delivery_fee.toFixed(2).replace('.', ',')} estornado ao seu saldo.`);
        } else {
          toastSuccess('Entrega cancelada com sucesso.');
        }
      }
      fetchOrders();
    } catch (err) {
      console.error('Erro ao processar:', err);
      toastError('Erro ao processar a ação. Tente novamente.');
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('merchant_tracking_avulsa')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders_delivery',
        filter: `merchant_id=eq.${merchantProfile?.id}`
      }, (payload) => {
        fetchOrders();
        if (payload.eventType === 'UPDATE') {
          const oldStatus = (payload.old as any).status;
          const newStatus = (payload.new as any).status;
          if (oldStatus !== newStatus) {
            const config = statusConfig[newStatus];
            if (config) {
              toastInfo(`Entrega ${payload.new.tracking_code}: ${config.label}`);
            }
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [merchantProfile?.id]);

  if (loading) return (
    <div className="flex justify-center p-12">
      <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (orders.length === 0) return (
    <div className="bg-zinc-50 dark:bg-white/5 rounded-[40px] p-20 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center gap-4">
      <div className="size-20 rounded-[28px] bg-white dark:bg-zinc-900 shadow-sm flex items-center justify-center text-zinc-300">
        <Clock size={40} strokeWidth={1} />
      </div>
      <p className="text-zinc-400 font-black uppercase tracking-widest text-[10px]">Nenhuma entrega avulsa recente</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-2">
          <Zap size={14} className="text-primary fill-current" />
          Monitoramento em Tempo Real
        </h2>
        <button onClick={() => fetchOrders()} className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline">Atualizar</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {orders.map((order) => {
            const config = statusConfig[order.status] || { label: order.status, color: 'text-zinc-500', bg: 'bg-zinc-500/10', icon: Zap };
            const Icon = config.icon;
            
            return (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => setSelectedOrder(order as any)}
                className="bg-white dark:bg-zinc-900 rounded-[32px] p-7 border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer group relative overflow-hidden"
              >
                {/* Visual Feedback for Searching */}
                {order.status === 'waiting_driver' && (
                  <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none">
                     <Zap size={80} className="text-amber-500 fill-current animate-pulse" />
                  </div>
                )}

                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                      #{order.tracking_code || order.id.slice(0, 8)}
                    </span>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter line-clamp-1">
                      {order.customer_name}
                    </h3>
                  </div>
                  <div className={`px-4 py-2 rounded-2xl ${config.bg} ${config.color} flex items-center gap-2 border border-current/10`}>
                    <Icon size={14} className={order.status === 'waiting_driver' ? 'animate-bounce' : ''} />
                    <span className="text-[9px] font-black uppercase tracking-widest">{config.label}</span>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <MapPin className="size-4 text-zinc-400 shrink-0 mt-0.5" />
                    <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2 uppercase">
                      {order.delivery_address?.split('|')[0]}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {order.is_fragile && (
                      <span className="px-2 py-1 bg-rose-500/10 text-rose-500 rounded-lg text-[8px] font-black uppercase tracking-widest border border-rose-500/20">Frágil</span>
                    )}
                    {order.has_beverage && (
                      <span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded-lg text-[8px] font-black uppercase tracking-widest border border-blue-500/20">Líquidos</span>
                    )}
                    <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 rounded-lg text-[8px] font-black uppercase tracking-widest">
                      R$ {Number(order.delivery_fee).toFixed(2)}
                    </span>
                  </div>
                </div>

                {order.drivers_delivery ? (
                  <div className="bg-blue-50/50 dark:bg-blue-500/5 rounded-[24px] p-4 flex items-center justify-between border border-blue-100 dark:border-blue-500/10">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-2xl bg-white dark:bg-zinc-800 border-2 border-blue-100 dark:border-blue-900 overflow-hidden shadow-sm flex items-center justify-center shrink-0">
                        {order.drivers_delivery.avatar_url ? (
                          <img src={order.drivers_delivery.avatar_url} className="w-full h-full object-cover" />
                        ) : (
                          <User size={20} className="text-blue-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-tight truncate">{order.drivers_delivery.name}</p>
                        <p className="text-[9px] font-bold text-blue-400/60 uppercase tracking-widest truncate">
                          {order.drivers_delivery.vehicle_model} • {order.drivers_delivery.license_plate}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a 
                        href={`tel:${order.drivers_delivery.phone}`}
                        className="size-10 rounded-full bg-white dark:bg-zinc-800 text-blue-600 flex items-center justify-center hover:scale-110 transition-all shadow-sm border border-blue-100 dark:border-blue-900/50"
                      >
                        <Phone size={16} />
                      </a>
                      <a 
                        href={`https://wa.me/55${order.drivers_delivery.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="size-10 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:scale-110 transition-all shadow-lg shadow-emerald-500/20"
                      >
                        <MessageCircle size={16} />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50/50 dark:bg-amber-500/5 rounded-[24px] p-5 flex items-center gap-4 border border-amber-100 dark:border-amber-500/10">
                    <div className="size-10 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                      <Zap size={18} className="text-amber-600 animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest leading-none mb-1">Localizando Pilotos</p>
                      <p className="text-[10px] font-bold text-amber-500/40 uppercase tracking-widest leading-none">Sinal enviado para a base...</p>
                    </div>
                    <div className="flex gap-1">
                       <div className="size-1.5 rounded-full bg-amber-500/20 animate-ping" />
                       <div className="size-1.5 rounded-full bg-amber-500/40 animate-ping delay-75" />
                       <div className="size-1.5 rounded-full bg-amber-500/60 animate-ping delay-150" />
                    </div>
                  </div>
                )}
                
                <div className="mt-6 pt-6 border-t border-zinc-50 dark:border-zinc-800 flex justify-between items-center">
                   <div className="flex items-center gap-2 opacity-50">
                      <Clock size={12} />
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                   </div>
                   <div className="flex items-center gap-3">
                     {!['delivered', 'concluido', 'entregue', 'finalizado'].includes(order.status) && order.status !== 'cancelado' && order.status !== 'cancelled' && (
                       <button 
                         onClick={(e) => handleCancelOrder(order, e)}
                         disabled={processingId === order.id}
                         className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all disabled:opacity-50 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 px-4 py-2 rounded-xl border border-rose-500/20 hover:border-rose-500/40"
                       >
                         <XCircle size={14} />
                         {processingId === order.id ? 'Cancelando...' : 'Cancelar Entrega'}
                       </button>
                     )}
                     {['delivered', 'concluido', 'entregue', 'cancelado', 'cancelled', 'finalizado'].includes(order.status) && (
                       <button 
                         onClick={(e) => handleCancelOrder(order, e)}
                         disabled={processingId === order.id}
                         className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all disabled:opacity-50 text-zinc-300 hover:text-rose-500"
                       >
                         <Trash2 size={14} />
                         {processingId === order.id ? '...' : 'Limpar'}
                       </button>
                     )}
                     <button 
                       onClick={(e) => {
                          e.stopPropagation();
                          const link = `${window.location.origin}/track/${order.tracking_code}`;
                          navigator.clipboard.writeText(link);
                          toastSuccess('Link de rastreio copiado!');
                       }}
                       className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-1.5 hover:scale-105 transition-all bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20"
                     >
                       <Share2 size={14} />
                       Rastreio
                     </button>
                   </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
