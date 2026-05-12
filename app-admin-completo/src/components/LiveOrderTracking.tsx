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
  Zap
} from 'lucide-react';

interface Driver {
  name: string;
  phone: string;
  avatar_url: string;
  vehicle_model: string;
  license_plate: string;
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

  const fetchActiveOrders = async () => {
    const mId = merchantProfile?.merchant_id || merchantProfile?.id;
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
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchActiveOrders();

    const mId = merchantProfile?.merchant_id || merchantProfile?.id;
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
    if (['novo', 'waiting_merchant', 'paid', 'pago', 'confirmed', 'confirmado'].includes(s)) return 0;
    if (s === 'preparando') return 1;
    if (s === 'pronto' || s === 'waiting_driver') return 2;
    if (['accepted', 'picked_up', 'em_rota', 'a_caminho', 'a_caminho_coleta', 'chegou_coleta', 'no_local_coleta'].includes(s)) return 3;
    if (['concluido', 'delivered'].includes(s)) return 4;
    return 0;
  };

  const getWaitTime = (createdAt: string) => {
    const diff = new Date().getTime() - new Date(createdAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Agora mesmo';
    return `${mins} min atrás`;
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando Fluxo Live...</p>
    </div>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-24 font-display">
      <header className="bg-white dark:bg-zinc-900 p-10 rounded-[48px] border border-zinc-100 dark:border-zinc-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
          <Zap size={120} className="text-primary fill-current" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Live Monitor</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Acompanhamento em Tempo Real</h1>
          <p className="text-slate-500 dark:text-zinc-400 font-medium mt-2 max-w-md">Gerencie o fluxo de seus pedidos ativos e a localização dos entregadores em uma visão simplificada.</p>
        </div>
      </header>

      {activeOrders.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-[48px] p-24 text-center border border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center gap-6">
          <div className="size-24 rounded-[32px] bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-300 dark:text-zinc-700">
            <Package size={48} strokeWidth={1} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Sem pedidos ativos no momento</h3>
            <p className="text-sm text-slate-500 dark:text-zinc-500 font-medium max-w-xs mx-auto">Assim que você receber um novo pedido, ele aparecerá aqui para monitoramento.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <AnimatePresence mode="popLayout">
            {activeOrders.map((order) => {
              const currentStage = getOrderStageIndex(order.status);
              
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={order.id}
                  className="bg-white dark:bg-zinc-900 rounded-[40px] border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden"
                >
                  <div className="p-8 md:p-10 flex flex-col lg:flex-row gap-10">
                    
                    {/* Lado Esquerdo: Info do Pedido */}
                    <div className="lg:w-1/3 space-y-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                            {order.service_type === 'entrega_avulsa' ? 'Entrega Avulsa' : 'Pedido de Loja'}
                          </p>
                          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">
                            #{(order.tracking_code || order.id.slice(0, 8)).toUpperCase()}
                          </h2>
                        </div>
                        <div className="bg-primary/10 px-4 py-2 rounded-2xl border border-primary/20">
                          <p className="text-[9px] font-black text-primary uppercase tracking-widest text-center">Iniciado há</p>
                          <p className="text-xs font-black text-primary text-center uppercase tracking-tighter">{getWaitTime(order.created_at)}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-start gap-4 p-5 rounded-3xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                          <MapPin className="size-5 text-zinc-400 shrink-0 mt-1" />
                          <div className="min-w-0">
                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Destino</p>
                            <p className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase leading-relaxed line-clamp-2">
                              {order.delivery_address?.split('|')[0]}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 px-5">
                          <User className="size-5 text-zinc-400 shrink-0" />
                          <div>
                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Cliente</p>
                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                              {order.customer_name || order.user_name || 'Usuário Izi'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Info do Entregador (se houver) */}
                      {order.drivers_delivery ? (
                        <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
                          <div className="flex items-center gap-4 p-5 rounded-3xl bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10">
                            <div className="size-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center overflow-hidden border-2 border-white dark:border-zinc-800 shadow-sm">
                              {order.drivers_delivery.avatar_url ? (
                                <img src={order.drivers_delivery.avatar_url} className="w-full h-full object-cover" />
                              ) : (
                                <User className="size-6 text-blue-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-0.5">Entregador em Rota</p>
                              <p className="text-lg font-black text-blue-600 dark:text-blue-400 uppercase tracking-tighter truncate">{order.drivers_delivery.name}</p>
                              <p className="text-[10px] font-bold text-blue-500/60 uppercase tracking-widest truncate">{order.drivers_delivery.vehicle_model} • {order.drivers_delivery.license_plate}</p>
                            </div>
                            <div className="flex gap-2">
                              <a 
                                href={`tel:${order.drivers_delivery.phone}`}
                                className="size-10 rounded-full bg-white dark:bg-zinc-800 text-blue-600 flex items-center justify-center shadow-sm hover:scale-110 transition-all"
                              >
                                <Phone size={18} />
                              </a>
                              <a 
                                href={`https://wa.me/55${order.drivers_delivery.phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="size-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 hover:scale-110 transition-all"
                              >
                                <MessageCircle size={18} />
                              </a>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
                          <div className="p-5 rounded-3xl bg-amber-50/50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10 flex items-center gap-4">
                            <div className="size-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                              <AlertCircle className="size-5 text-amber-600 animate-pulse" />
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Buscando Entregador</p>
                              <p className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest">Aguardando aceite de pilotos próximos...</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Lado Direito: Stepper do Fluxo */}
                    <div className="flex-1 bg-zinc-50 dark:bg-zinc-800/20 rounded-[32px] p-8 md:p-12 flex flex-col justify-center">
                      <div className="relative">
                        {/* Linha de Conexão */}
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-zinc-200 dark:bg-zinc-800 -translate-y-1/2 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(currentStage / (FLOW_STAGES.length - 1)) * 100}%` }}
                            className="h-full bg-primary"
                          />
                        </div>

                        {/* Estágios */}
                        <div className="relative flex justify-between items-center w-full">
                          {FLOW_STAGES.map((stage, idx) => {
                            const isCompleted = idx < currentStage;
                            const isActive = idx === currentStage;
                            const Icon = stage.icon;
                            
                            return (
                              <div key={stage.id} className="flex flex-col items-center gap-4 relative z-10">
                                <motion.div 
                                  initial={false}
                                  animate={{ 
                                    scale: isActive ? 1.2 : 1,
                                    backgroundColor: isCompleted || isActive ? '#facc15' : 'white'
                                  }}
                                  className={`size-14 md:size-16 rounded-[24px] flex items-center justify-center shadow-lg border-4 ${isActive ? 'border-primary ring-8 ring-primary/10' : 'border-zinc-100 dark:border-zinc-800 dark:bg-zinc-900'}`}
                                >
                                  <Icon 
                                    size={24} 
                                    className={`${isCompleted || isActive ? 'text-slate-900' : 'text-zinc-300'}`} 
                                  />
                                </motion.div>
                                <div className="text-center absolute top-full pt-4 w-24">
                                  <p className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-primary' : 'text-zinc-400'}`}>
                                    {stage.label}
                                  </p>
                                  {isActive && (
                                    <motion.p 
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      className="text-[8px] font-bold text-zinc-400 mt-1"
                                    >
                                      Atual
                                    </motion.p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
