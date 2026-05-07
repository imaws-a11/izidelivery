import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';
import { supabase } from '../lib/supabase';
import { toastSuccess, toastError } from '../lib/useToast';

export default function OrderCenterTab() {
  const { 
    allOrders, 
    merchantProfile, 
    fetchAllOrders,
    isLoadingList 
  } = useAdmin();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeView, setActiveView] = useState<'pending' | 'ready'>('pending');
  const [showDriverPicker, setShowDriverPicker] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  // Filtrar pedidos do lojista logado
  const merchantOrders = useMemo(() => {
    const mId = merchantProfile?.merchant_id || merchantProfile?.id;
    if (!mId) return [];
    return allOrders.filter((o: any) => String(o.merchant_id) === String(mId));
  }, [allOrders, merchantProfile]);

  // Pedidos que podem ser despachados (Preparando ou Pronto)
  const dispatchableOrders = useMemo(() => {
    return merchantOrders.filter((o: any) => 
      ['novo', 'paid', 'pago', 'confirmed', 'confirmado', 'preparando', 'pronto'].includes(o.status) &&
      o.status !== 'cancelado' && o.status !== 'concluido' && !o.driver_id
    );
  }, [merchantOrders]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === dispatchableOrders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(dispatchableOrders.map(o => o.id));
    }
  };

  const handleBulkDispatch = async (mode: 'partner' | 'base', driverId?: string) => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);
    try {
      if (mode === 'partner') {
        if (!driverId) {
          setShowDriverPicker(true);
          setIsProcessing(false);
          return;
        }

        const { error } = await supabase
          .from('orders_delivery')
          .update({ 
            status: 'waiting_driver',
            driver_id: driverId 
          })
          .in('id', selectedIds);
        
        if (error) throw error;
        toastSuccess(`${selectedIds.length} pedidos atribuídos ao seu entregador!`);
        setShowDriverPicker(false);
        setSelectedDriverId(null);
      } else {
        const { error } = await supabase
          .from('orders_delivery')
          .update({ status: 'waiting_driver' })
          .in('id', selectedIds);
        
        if (error) throw error;
        toastSuccess(`${selectedIds.length} pedidos enviados para a Rede Izi!`);
      }
      setSelectedIds([]);
      await fetchAllOrders();
    } catch (err: any) {
      toastError('Erro ao despachar pedidos: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkAsReady = async (id: string) => {
    try {
      const { error } = await supabase
        .from('orders_delivery')
        .update({ preparation_status: 'pronto' })
        .eq('id', id);
      
      if (error) throw error;
      toastSuccess('Pedido marcado como PRONTO!');
      await fetchAllOrders();
    } catch (err: any) {
      toastError('Erro ao atualizar preparação');
    }
  };

  const printLabels = (mode: 'route' | 'order') => {
    const ordersToPrint = merchantOrders.filter(o => selectedIds.includes(o.id));
    if (ordersToPrint.length === 0) {
      toastError('Selecione pedidos para imprimir');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = ordersToPrint.map(o => `
      <div style="font-family: sans-serif; padding: 20px; border: 1px dashed #ccc; margin-bottom: 20px; page-break-inside: avoid;">
        <h2 style="margin: 0; text-transform: uppercase;">#DT-${o.id.slice(0, 8).toUpperCase()}</h2>
        <p><strong>Cliente:</strong> ${o.user_name || 'Usuário Izi'}</p>
        <p><strong>Endereço:</strong> ${o.delivery_address?.split('|')[0]}</p>
        <hr/>
        <p><strong>Itens:</strong></p>
        <ul>
          ${Array.isArray(o.items) ? o.items.map((it: any) => `<li>${it.quantity || 1}x ${it.name || it.product_name}</li>`).join('') : '---'}
        </ul>
        <p style="text-align: right; font-weight: bold;">IZI DELIVERY</p>
      </div>
    `).join('');

    const routeHeader = mode === 'route' ? `
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 10px;">
        <h1>ROTEIRO DE ENTREGA</h1>
        <p>Total de Paradas: ${ordersToPrint.length}</p>
        <p>Data: ${new Date().toLocaleString()}</p>
      </div>
    ` : '';

    printWindow.document.write(`
      <html>
        <head><title>Impressão IZI</title></head>
        <body onload="window.print(); window.close();">
          ${routeHeader}
          ${content}
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 pb-24">
      {/* Minimal Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Central de Pedidos</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Estúdio de Logística de Alto Volume</p>
        </div>

        <div className="flex items-center gap-4">
           <button 
             onClick={selectAll}
             className="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all"
           >
             {selectedIds.length === dispatchableOrders.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
           </button>
           <button 
             onClick={() => fetchAllOrders()}
             className="size-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:rotate-180 transition-transform duration-500"
           >
             <span className={`material-symbols-rounded font-black ${isLoadingList ? 'animate-spin' : ''}`}>refresh</span>
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
        {/* Order List Area */}
        <div className="xl:col-span-8 space-y-6">
          <div className="flex items-center gap-8 border-b border-zinc-100 dark:border-zinc-800 pb-4">
             <button 
               onClick={() => setActiveView('pending')}
               className={`text-xs font-black uppercase tracking-widest transition-all ${activeView === 'pending' ? 'text-black dark:text-white' : 'text-zinc-300'}`}
             >
               Aguardando Logística ({dispatchableOrders.length})
             </button>
          </div>

          {dispatchableOrders.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center text-center opacity-20">
               <span className="material-symbols-rounded text-6xl font-thin">inventory_2</span>
               <p className="text-sm font-black uppercase tracking-widest mt-4">Nenhum pedido pronto para despacho</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dispatchableOrders.map((order: any) => (
                <div 
                  key={order.id}
                  onClick={() => toggleSelect(order.id)}
                  className={`relative p-6 transition-all cursor-pointer group ${selectedIds.includes(order.id) ? 'scale-[0.98]' : ''}`}
                >
                  {/* No Border, No Background, just floating elements and selection indicator */}
                  <div className={`absolute inset-0 rounded-[32px] transition-all ${selectedIds.includes(order.id) ? 'bg-primary/5 ring-2 ring-primary/20' : 'group-hover:bg-zinc-50 dark:group-hover:bg-white/5'}`} />
                  
                  <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`size-2 rounded-full ${order.status === 'pronto' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{order.status === 'pronto' ? 'Pronto' : 'Em Preparo'}</span>
                        </div>
                        <h3 className="text-xl font-black text-black dark:text-white tracking-tighter uppercase italic">#DT-{order.id.slice(0, 8).toUpperCase()}</h3>
                      </div>
                      <div className={`size-7 rounded-full border-2 flex items-center justify-center transition-all ${selectedIds.includes(order.id) ? 'bg-black border-black text-white' : 'border-zinc-200'}`}>
                         {selectedIds.includes(order.id) && <span className="material-symbols-rounded text-sm font-black">check</span>}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-rounded text-zinc-400 text-lg">pin_drop</span>
                        <p className="text-xs font-bold text-zinc-500 line-clamp-2 uppercase tracking-tighter leading-relaxed">
                          {order.delivery_address?.split('|')[0]}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-rounded text-zinc-400 text-lg">person</span>
                        <p className="text-xs font-black text-black dark:text-white uppercase tracking-widest">{order.user_name || 'Cliente Izi'}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
                      <div className="flex -space-x-2">
                        <div className="size-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border-2 border-white dark:border-black flex items-center justify-center">
                           <span className="material-symbols-rounded text-xs font-black">shopping_bag</span>
                        </div>
                        <div className="size-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border-2 border-white dark:border-black flex items-center justify-center">
                           <span className="text-[8px] font-black">+{Array.isArray(order.items) ? order.items.length : 0}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                         {order.preparation_status !== 'pronto' && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleMarkAsReady(order.id); }}
                              className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all"
                            >
                              Pronto
                            </button>
                         )}
                         <span className="text-lg font-black text-black dark:text-white italic">R$ {Number(order.total_price || 0).toFixed(2).replace('.', ',')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Sidebar Area */}
        <div className="xl:col-span-4">
           <div className="sticky top-12 space-y-8">
              <div className="p-8 rounded-[48px] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/50">
                <div className="mb-8">
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Painel de Despacho</span>
                  <h2 className="text-2xl font-black text-black dark:text-white uppercase tracking-tighter mt-1">{selectedIds.length} Pedidos Selecionados</h2>
                </div>

                <div className="space-y-4">
                  <button 
                    disabled={selectedIds.length === 0 || isProcessing}
                    onClick={() => handleBulkDispatch('partner')}
                    className="w-full h-20 bg-black text-white rounded-[28px] font-black uppercase tracking-widest text-xs flex items-center justify-between px-8 group hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
                  >
                    <div className="flex flex-col items-start">
                      <span className="text-[9px] opacity-50 mb-0.5">Entregador Próprio</span>
                      <span>Despacho em Lote</span>
                    </div>
                    <span className="material-symbols-rounded group-hover:translate-x-2 transition-transform">local_shipping</span>
                  </button>

                  <button 
                    disabled={selectedIds.length === 0 || isProcessing}
                    onClick={() => handleBulkDispatch('base')}
                    className="w-full h-20 bg-white dark:bg-white/5 border border-zinc-200 dark:border-zinc-800 text-black dark:text-white rounded-[28px] font-black uppercase tracking-widest text-xs flex items-center justify-between px-8 hover:bg-zinc-50 dark:hover:bg-white/10 active:scale-95 transition-all disabled:opacity-30"
                  >
                    <div className="flex flex-col items-start">
                      <span className="text-[9px] opacity-50 mb-0.5">Rede Izi Delivery</span>
                      <span>Envio Individual</span>
                    </div>
                    <span className="material-symbols-rounded">rocket_launch</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-8">
                  <button 
                    onClick={() => printLabels('order')}
                    className="h-16 rounded-[24px] bg-zinc-100 dark:bg-zinc-800 flex flex-col items-center justify-center gap-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                  >
                    <span className="material-symbols-rounded text-lg">print</span>
                    <span className="text-[8px] font-black uppercase tracking-widest">Etiqueta Pedido</span>
                  </button>
                  <button 
                    onClick={() => printLabels('route')}
                    className="h-16 rounded-[24px] bg-zinc-100 dark:bg-zinc-800 flex flex-col items-center justify-center gap-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                  >
                    <span className="material-symbols-rounded text-lg">alt_route</span>
                    <span className="text-[8px] font-black uppercase tracking-widest">Etiqueta Rota</span>
                  </button>
                </div>
              </div>

              {/* Tips Section */}
              <div className="px-4 space-y-4">
                 <div className="flex gap-4 items-start">
                    <span className="material-symbols-rounded text-amber-500">info</span>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-black dark:text-white">Dica Logística</p>
                      <p className="text-[10px] text-zinc-400 font-bold leading-relaxed mt-1">
                        Para otimizar o custo, agrupe pedidos com endereços próximos e utilize o despacho em rota para motoboys fixos.
                      </p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
      {/* Driver Picker Modal */}
      <AnimatePresence>
        {showDriverPicker && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowDriverPicker(false)}
               className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-[48px] p-10 overflow-hidden"
             >
                <div className="mb-8">
                  <h3 className="text-2xl font-black text-black dark:text-white uppercase tracking-tighter italic">Selecionar Entregador</h3>
                  <p className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.2em] mt-1">Escolha qual entregador próprio levará a carga</p>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                  {(useAdmin().myDriversList || []).length === 0 ? (
                    <p className="text-center py-8 text-xs font-bold text-zinc-400 uppercase tracking-widest">Nenhum entregador próprio cadastrado</p>
                  ) : (
                    useAdmin().myDriversList.map((driver: any) => (
                      <button 
                        key={driver.id}
                        onClick={() => handleBulkDispatch('partner', driver.id)}
                        className="w-full p-6 rounded-[32px] bg-zinc-50 dark:bg-white/5 border border-transparent hover:border-black dark:hover:border-white transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-4">
                           <div className="size-12 rounded-2xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                              {driver.avatar_url ? <img src={driver.avatar_url} className="w-full h-full object-cover" /> : <span className="material-symbols-rounded text-zinc-400">person</span>}
                           </div>
                           <div className="text-left">
                              <p className="text-sm font-black text-black dark:text-white uppercase italic">{driver.name}</p>
                              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{driver.vehicle_type || 'Moto'}</p>
                           </div>
                        </div>
                        <span className="material-symbols-rounded opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">chevron_right</span>
                      </button>
                    ))
                  )}
                </div>

                <button 
                  onClick={() => setShowDriverPicker(false)}
                  className="w-full mt-8 h-16 rounded-[24px] bg-zinc-100 dark:bg-zinc-800 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
                >
                  Cancelar
                </button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
