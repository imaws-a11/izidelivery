import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAdmin } from '../context/AdminContext';
import { 
  Clock, 
  CheckCircle2, 
  Package, 
  Truck, 
  MapPin, 
  User, 
  MessageCircle, 
  Phone,
  Timer,
  AlertCircle,
  Zap,
  ShoppingBag,
  CreditCard,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  MoreHorizontal
} from 'lucide-react';
import { toastSuccess } from '../lib/useToast';

interface Driver {
  name: string;
  phone: string;
  avatar_url: string;
  vehicle_model: string;
  license_plate: string;
}

interface OrderItem {
  name?: string;
  product_name?: string;
  quantity: number;
  price: number;
  options?: any[];
}

interface Order {
  id: string;
  tracking_code: string;
  status: string;
  customer_name: string;
  user_name: string;
  delivery_address: string;
  created_at: string;
  updated_at: string;
  merchant_id: string;
  driver_id?: string;
  service_type: string;
  drivers_delivery?: Driver;
  items?: OrderItem[];
  total_price?: number;
  payment_method?: string;
  payment_status?: string;
  notes?: string;
  delivery_fee?: number;
}

const FLOW_STAGES = [
  { id: 'pending', label: 'Recebido', icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { id: 'preparing', label: 'Em Preparo', icon: Timer, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { id: 'ready', label: 'Pronto', icon: Package, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { id: 'shipped', label: 'Em Rota', icon: Truck, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 'delivered', label: 'Concluído', icon: CheckCircle2, color: 'text-zinc-400', bg: 'bg-zinc-400/10' }
];

export default function LiveOrderTracking() {
  const { merchantProfile } = useAdmin();
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);

  const toggleExpand = (id: string) => {
    setExpandedOrders(prev => 
      prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
    );
  };

  const fetchActiveOrders = async () => {
    const mId = merchantProfile?.id;
    if (!mId) return;

    const { data, error } = await supabase
      .from('orders_delivery')
      .select(`
        *,
        drivers_delivery:driver_id (
          name,
          phone,
          avatar_url,
          vehicle_model,
          license_plate
        )
      `)
      .eq('merchant_id', mId)
      .not('status', 'in', '("concluido","cancelado","delivered")')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar monitoramento:', error);
    } else {
      setActiveOrders(data || []);
      // Auto-expand first order if it's the only one
      if (data?.length === 1 && expandedOrders.length === 0) {
        setExpandedOrders([data[0].id]);
      }
    }
    setLoading(false);
  };

  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleCancelOrder = async (order: Order) => {
    if (!confirm(`Deseja realmente cancelar este pedido (${order.tracking_code})?`)) return;
    
    setProcessingId(order.id);
    try {
      await supabase.from('orders_delivery').update({ 
        status: 'cancelado', 
        cancel_reason: 'Cancelado pelo parceiro via painel Live' 
      }).eq('id', order.id);
      
      // Se for entrega avulsa/standalone, estorna a taxa de entrega
      if (['entrega_avulsa', 'standalone', 'avulsa'].includes(order.service_type) && (order.delivery_fee || 0) > 0) {
        await supabase.from('wallet_transactions_delivery').insert([{
          user_id: merchantProfile?.id,
          type: 'deposito',
          amount: order.delivery_fee,
          description: `Estorno — Pedido cancelado (${order.tracking_code})`,
          status: 'concluido'
        }]);
        // Tenta atualizar as finanças se o método fetchMerchantFinance estiver disponível no hook, senão ignora
      }
      
      toastSuccess('Pedido cancelado com sucesso.');
      fetchActiveOrders();
    } catch (err) {
      console.error('Erro ao cancelar:', err);
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    fetchActiveOrders();

    const mId = merchantProfile?.id;
    if (!mId) return;

    const channel = supabase
      .channel('live_tracking_merchant')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders_delivery',
        filter: `merchant_id=eq.${mId}`
      }, () => {
        fetchActiveOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [merchantProfile?.id]);

  const getOrderStageIndex = (status: string) => {
    const s = status?.toLowerCase();
    if (['novo', 'waiting_merchant', 'paid', 'pago', 'confirmed', 'confirmado', 'agendado', 'scheduled'].includes(s)) return 0;
    if (s === 'preparando') return 1;
    if (s === 'pronto' || s === 'waiting_driver') return 2;
    if (['accepted', 'picked_up', 'em_rota', 'a_caminho', 'a_caminho_coleta', 'chegou_coleta', 'no_local_coleta'].includes(s)) return 3;
    if (['concluido', 'delivered'].includes(s)) return 4;
    return 0;
  };

  const getWaitTime = (createdAt: string) => {
    const diff = new Date().getTime() - new Date(createdAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Agora';
    return `${mins} min`;
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando Fluxo Live...</p>
    </div>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-24 font-display">
      <header className="bg-white dark:bg-zinc-900 p-8 md:p-10 rounded-[48px] border border-zinc-100 dark:border-zinc-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
          <Zap size={120} className="text-primary fill-current" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="size-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Live Monitor</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Monitor de Operações</h1>
            <p className="text-slate-500 dark:text-zinc-400 font-medium max-w-md">Gerencie pedidos ativos, entregadores e prepare suas encomendas com agilidade.</p>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="bg-zinc-50 dark:bg-zinc-800 px-6 py-4 rounded-3xl border border-zinc-100 dark:border-zinc-700 text-center">
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Pedidos Ativos</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{activeOrders.length}</p>
             </div>
             <button 
                onClick={() => fetchActiveOrders()}
                className="size-14 rounded-3xl bg-primary text-slate-900 flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
             >
                <motion.span whileTap={{ rotate: 180 }} className="material-symbols-outlined font-black">refresh</motion.span>
             </button>
          </div>
        </div>
      </header>

      {activeOrders.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-[48px] p-24 text-center border border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center gap-6">
          <div className="size-24 rounded-[32px] bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-300 dark:text-zinc-700">
            <Package size={48} strokeWidth={1} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Tudo sob controle!</h3>
            <p className="text-sm text-slate-500 dark:text-zinc-500 font-medium max-w-xs mx-auto">Não há pedidos pendentes no momento. Aproveite para organizar seu estoque!</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {activeOrders.map((order) => {
              const currentStage = getOrderStageIndex(order.status);
              const isExpanded = expandedOrders.includes(order.id);
              
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={order.id}
                  className={`bg-white dark:bg-zinc-900 rounded-[40px] border ${isExpanded ? 'border-primary/30 shadow-2xl shadow-primary/5' : 'border-zinc-100 dark:border-zinc-800 shadow-sm'} overflow-hidden transition-all duration-300`}
                >
                  {/* Card Header (Sempre visível) */}
                  <div 
                    className="p-8 cursor-pointer flex flex-col md:flex-row items-start md:items-center gap-8"
                    onClick={() => toggleExpand(order.id)}
                  >
                    {/* Status Badge e ID */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${FLOW_STAGES[currentStage].bg} ${FLOW_STAGES[currentStage].color}`}>
                          {FLOW_STAGES[currentStage].label}
                        </span>
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                          #{ (order.tracking_code || order.id.slice(0, 8)).toUpperCase() }
                        </span>
                      </div>
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none truncate">
                        {order.customer_name || order.user_name || 'Usuário Izi'}
                      </h2>
                      <p className="text-xs font-bold text-zinc-400 mt-2 flex items-center gap-2">
                        <Clock size={14} /> Recebido há {getWaitTime(order.created_at)}
                      </p>
                    </div>

                    {/* Stepper Compacto (Desktop) */}
                    <div className="hidden lg:flex items-center gap-1.5 px-6">
                       {FLOW_STAGES.map((s, idx) => (
                         <div 
                           key={s.id} 
                           className={`h-1.5 w-10 rounded-full transition-all duration-500 ${idx <= currentStage ? 'bg-primary' : 'bg-zinc-100 dark:bg-zinc-800'}`} 
                         />
                       ))}
                    </div>

                    {/* Resumo Financeiro Rápido */}
                    <div className="text-right shrink-0">
                       <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total</p>
                       <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                         R$ {Number(order.total_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                       </p>
                       <div className="flex items-center justify-end gap-1.5 mt-2">
                          <CreditCard size={12} className="text-zinc-400" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                            {order.payment_method?.replace('_', ' ') || 'Pendente'}
                          </span>
                       </div>
                    </div>

                    {/* Botão de Expandir */}
                    <div className="size-12 rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-primary transition-colors">
                       {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>

                  {/* Detalhes Expandidos */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-zinc-100 dark:border-zinc-800"
                      >
                        <div className="p-8 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
                           
                           {/* Coluna 1: Itens e Observações */}
                           <div className="lg:col-span-1 space-y-8">
                             <div className="space-y-4">
                               <div className="flex items-center justify-between">
                                 <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                   <ShoppingBag size={14} /> Itens do Pedido
                                 </h3>
                                 <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-md text-[9px] font-black text-zinc-500">
                                   {order.items?.length || 0} PROD
                                 </span>
                               </div>
                               
                               <div className="space-y-3">
                                 {order.items && order.items.length > 0 ? (
                                   order.items.map((item, idx) => (
                                     <div key={idx} className="flex justify-between items-start p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800/50">
                                       <div className="flex gap-4">
                                          <div className="size-8 rounded-lg bg-primary text-slate-900 flex items-center justify-center text-[10px] font-black shrink-0">
                                            {item.quantity}x
                                          </div>
                                          <div className="min-w-0">
                                            <p className="text-sm font-bold text-slate-800 dark:text-zinc-200 truncate leading-tight">
                                              {item.name || item.product_name}
                                            </p>
                                            {item.options && item.options.length > 0 && (
                                              <p className="text-[10px] text-zinc-400 mt-1">
                                                {item.options.map((o: any) => o.name).join(', ')}
                                              </p>
                                            )}
                                          </div>
                                       </div>
                                       <p className="text-sm font-black text-slate-900 dark:text-white">
                                         R$ {Number(item.price * item.quantity).toFixed(2).replace('.', ',')}
                                       </p>
                                     </div>
                                   ))
                                 ) : (
                                   <div className="p-6 text-center border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-2xl">
                                      <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Sem detalhes de itens</p>
                                   </div>
                                 )}
                               </div>

                               {order.notes && (
                                 <div className="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10">
                                   <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Observações do Cliente</p>
                                   <p className="text-xs font-medium text-amber-700 dark:text-amber-400 leading-relaxed italic">
                                     "{order.notes}"
                                   </p>
                                 </div>
                               )}
                             </div>
                           </div>

                           {/* Coluna 2: Logística e Entrega */}
                           <div className="lg:col-span-1 space-y-8">
                             <div className="space-y-6">
                               <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                 <Truck size={14} /> Logística
                               </h3>

                               <div className="flex items-start gap-4 p-5 rounded-3xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                                 <MapPin className="size-5 text-zinc-400 shrink-0 mt-1" />
                                 <div className="min-w-0">
                                   <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Endereço de Entrega</p>
                                   <p className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase leading-relaxed">
                                     {order.delivery_address?.split('|')[0]}
                                   </p>
                                   {order.delivery_address?.includes('|') && (
                                     <p className="text-[10px] font-medium text-primary mt-1">
                                       {order.delivery_address.split('|')[1]}
                                     </p>
                                   )}
                                 </div>
                               </div>

                               {/* Entregador */}
                               <div className="space-y-4">
                                  {order.drivers_delivery ? (
                                    <div className="flex items-center gap-5 p-5 rounded-3xl bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10">
                                      <div className="size-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center overflow-hidden border-2 border-white dark:border-zinc-800 shadow-sm shrink-0">
                                        {order.drivers_delivery.avatar_url ? (
                                          <img src={order.drivers_delivery.avatar_url} className="w-full h-full object-cover" />
                                        ) : (
                                          <User className="size-8 text-blue-500" />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Entregador</p>
                                        <p className="text-xl font-black text-blue-600 dark:text-blue-400 uppercase tracking-tighter truncate leading-none">
                                          {order.drivers_delivery.name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                           <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 rounded text-[8px] font-black text-blue-500 uppercase tracking-widest">
                                             {order.drivers_delivery.license_plate || 'PLACA INV'}
                                           </span>
                                           <span className="text-[10px] font-bold text-blue-400/60 truncate">
                                             {order.drivers_delivery.vehicle_model}
                                           </span>
                                        </div>
                                      </div>
                                      <div className="flex flex-col gap-2">
                                        <a href={`tel:${order.drivers_delivery.phone}`} className="size-10 rounded-full bg-white dark:bg-zinc-800 text-blue-600 flex items-center justify-center shadow-sm hover:scale-110 transition-all border border-blue-100 dark:border-blue-900/50">
                                          <Phone size={16} />
                                        </a>
                                        <a href={`https://wa.me/55${order.drivers_delivery.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="size-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 hover:scale-110 transition-all">
                                          <MessageCircle size={16} />
                                        </a>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="p-6 rounded-3xl bg-amber-50/50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10 flex flex-col items-center text-center gap-3">
                                      <div className="size-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                        <AlertCircle className="size-5 text-amber-600 animate-pulse" />
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Aguardando Entregador</p>
                                        <p className="text-[10px] font-bold text-amber-500/50 uppercase tracking-widest mt-1">O pedido está visível para os pilotos próximos</p>
                                      </div>
                                    </div>
                                  )}
                               </div>
                             </div>
                           </div>

                           {/* Coluna 3: Ações e Resumo Financeiro */}
                           <div className="lg:col-span-1 flex flex-col justify-between">
                              <div className="space-y-6">
                                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                  <CreditCard size={14} /> Financeiro
                                </h3>

                                <div className="p-7 rounded-[40px] bg-zinc-900 dark:bg-zinc-800 text-white shadow-2xl relative overflow-hidden">
                                   <div className="absolute top-0 right-0 p-4 opacity-10">
                                      <Zap size={60} />
                                   </div>
                                   
                                   <div className="space-y-4 relative z-10">
                                      <div className="flex justify-between items-center opacity-60">
                                         <span className="text-[10px] font-black uppercase tracking-widest">Produtos</span>
                                         <span className="text-xs font-bold font-mono">R$ {Number((order.total_price || 0) - (order.delivery_fee || 0)).toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between items-center opacity-60">
                                         <span className="text-[10px] font-black uppercase tracking-widest">Entrega Izi</span>
                                         <span className="text-xs font-bold font-mono">R$ {Number(order.delivery_fee || 0).toFixed(2)}</span>
                                      </div>
                                      <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                                         <div>
                                            <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1">Total Final</p>
                                            <p className="text-3xl font-black tracking-tighter leading-none">
                                              R$ {Number(order.total_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </p>
                                         </div>
                                         <div className="text-right">
                                            <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${order.payment_status === 'paid' ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`}>
                                              {order.payment_status === 'paid' ? 'Liquidado' : 'A Receber'}
                                            </p>
                                            <span className="px-2 py-1 bg-white/10 rounded-lg text-[9px] font-black uppercase">
                                              {order.payment_method?.replace('_', ' ')}
                                            </span>
                                         </div>
                                      </div>
                                   </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4 mt-8">
                                 <button 
                                   onClick={() => {
                                      navigator.clipboard.writeText(order.id);
                                      toastSuccess('ID do pedido copiado!');
                                   }}
                                   className="flex items-center justify-center gap-2 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                                 >
                                   <ClipboardCheck size={16} /> ID
                                 </button>
                                 <button 
                                   onClick={() => handleCancelOrder(order)}
                                   disabled={processingId === order.id}
                                   className="flex items-center justify-center gap-2 h-14 rounded-2xl bg-rose-500/10 text-rose-500 font-black text-[10px] uppercase tracking-widest hover:bg-rose-500/20 transition-all disabled:opacity-50"
                                 >
                                   <AlertCircle size={16} /> {processingId === order.id ? 'Cancelando...' : 'Cancelar'}
                                 </button>
                              </div>
                           </div>

                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
