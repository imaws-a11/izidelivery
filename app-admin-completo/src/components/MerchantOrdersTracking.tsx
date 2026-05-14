import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAdmin } from '../context/AdminContext';
import { toastInfo, toastSuccess, toastError } from '../lib/useToast';

interface Order {
  id: string;
  tracking_code: string;
  status: string;
  customer_name: string;
  delivery_address: string;
  delivery_fee: number;
  created_at: string;
  driver_id?: string;
  drivers_delivery?: {
    name: string;
    phone: string;
    avatar_url: string;
    license_plate: string;
    vehicle_model: string;
  };
}

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  'waiting_driver': { label: 'Buscando Entregador', color: 'bg-amber-500', icon: 'search' },
  'accepted': { label: 'Entregador a Caminho', color: 'bg-blue-500', icon: 'directions_run' },
  'picking_up': { label: 'Coletando Pedido', color: 'bg-indigo-500', icon: 'inventory_2' },
  'delivering': { label: 'Em Entrega', color: 'bg-purple-500', icon: 'delivery_dining' },
  'delivered': { label: 'Entregue', color: 'bg-emerald-500', icon: 'check_circle' },
  'cancelled': { label: 'Cancelado', color: 'bg-red-500', icon: 'cancel' },
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
      .eq('service_type', 'entrega_avulsa')
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
        // Apenas excluir do histórico (soft delete ou hard delete)
        await supabase.from('orders_delivery').delete().eq('id', order.id);
        toastSuccess('Pedido removido do histórico.');
      } else {
        // Cancelar e estornar
        await supabase.from('orders_delivery').update({ 
          status: 'cancelado', 
          cancel_reason: 'Cancelado pelo parceiro via painel' 
        }).eq('id', order.id);
        
        // Estorno automático
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

    // Inscrição em tempo real para atualizações de status
    const channel = supabase
      .channel('merchant_tracking')
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
              toastInfo(`Pedido ${payload.new.tracking_code}: ${config.label}`);
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
    <div className="bg-slate-50 dark:bg-white/5 rounded-[32px] p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800">
      <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">history</span>
      <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Nenhuma entrega avulsa recente</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2 mb-6">
        <span className="material-symbols-outlined text-primary">analytics</span>
        Monitoramento em Tempo Real
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {orders.map((order) => {
            const config = statusConfig[order.status] || { label: order.status, color: 'bg-slate-500', icon: 'info' };
            
            return (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => setSelectedOrder(order as any)}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{order.tracking_code}</span>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white line-clamp-1">{order.customer_name}</h3>
                  </div>
                  <div className={`px-3 py-1.5 rounded-full ${config.color} text-white flex items-center gap-1.5`}>
                    <span className="material-symbols-outlined text-sm font-black">{config.icon}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">{config.label}</span>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-slate-400 text-sm mt-0.5">location_on</span>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 line-clamp-2">{order.delivery_address}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-400 text-sm">schedule</span>
                    <p className="text-xs font-bold text-slate-500">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {order.drivers_delivery ? (
                  <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 flex items-center justify-between border border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-primary/20 overflow-hidden flex items-center justify-center">
                        {order.drivers_delivery.avatar_url ? (
                          <img src={order.drivers_delivery.avatar_url} className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-primary">person</span>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{order.drivers_delivery.name}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{order.drivers_delivery.vehicle_model} • {order.drivers_delivery.license_plate}</p>
                      </div>
                    </div>
                    <a 
                      href={`https://wa.me/55${order.drivers_delivery.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="size-10 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:scale-110 transition-all shadow-lg shadow-emerald-500/20"
                    >
                      <span className="material-symbols-outlined text-xl">chat</span>
                    </a>
                  </div>
                ) : (
                  <div className="bg-amber-50 dark:bg-amber-500/5 rounded-2xl p-4 flex items-center gap-3 border border-amber-100 dark:border-amber-500/10">
                    <div className="size-8 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-amber-600 animate-pulse text-lg">radar</span>
                    </div>
                    <p className="text-[10px] font-black text-amber-700 dark:text-amber-500 uppercase tracking-widest">Sinal enviado para a base...</p>
                  </div>
                )}
                
                <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center">
                   <div className="flex items-center gap-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Custo:</span>
                      <span className="text-xs font-black text-slate-900 dark:text-white">R$ {order.delivery_fee.toFixed(2).replace('.', ',')}</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <button 
                       onClick={(e) => handleCancelOrder(order, e)}
                       disabled={processingId === order.id}
                       className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1 transition-all disabled:opacity-50 ${
                         ['delivered', 'concluido', 'entregue', 'cancelado', 'cancelled', 'finalizado'].includes(order.status)
                           ? 'text-slate-400 hover:text-rose-500'
                           : 'text-rose-500 hover:text-rose-700'
                       }`}
                     >
                       <span className="material-symbols-outlined text-[14px]">
                         {processingId === order.id ? 'refresh' : 
                          ['delivered', 'concluido', 'entregue', 'cancelado', 'cancelled', 'finalizado'].includes(order.status) ? 'delete' : 'cancel'}
                       </span>
                       {processingId === order.id ? '...' :
                        ['delivered', 'concluido', 'entregue', 'cancelado', 'cancelled', 'finalizado'].includes(order.status) ? 'Excluir' : 'Cancelar'}
                     </button>
                     <button 
                       onClick={(e) => {
                          e.stopPropagation();
                          const link = `${window.location.origin}/track/${order.tracking_code}`;
                          navigator.clipboard.writeText(link);
                          toastInfo('Link de rastreio copiado para o cliente!');
                       }}
                       className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1 hover:underline"
                     >
                       <span className="material-symbols-outlined text-[14px]">share</span>
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
