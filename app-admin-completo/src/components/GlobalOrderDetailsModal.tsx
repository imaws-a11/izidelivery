import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';
import { supabase } from '../lib/supabase';
import { toastSuccess, toastError, toastInfo } from '../lib/useToast';

export default function GlobalOrderDetailsModal() {
  const { 
    selectedOrder, setSelectedOrder, merchantProfile, 
    fetchAllOrders, merchantOrdersPage, appSettings,
    setActiveTab, setDraftStandaloneOrder
  } = useAdmin();
  
  const [localProcessingId, setLocalProcessingId] = React.useState<string | null>(null);

  if (!selectedOrder) return null;

  const handleTogglePreparation = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'preparando' ? 'pronto' : 'preparando';
    setLocalProcessingId(id);
    try {
      const { data, error } = await supabase
        .from('orders_delivery')
        .update({ preparation_status: nextStatus })
        .eq('id', id)
        .select();

      if (error) throw error;
      toastSuccess(`Pedido marcado como ${nextStatus === 'pronto' ? 'PRONTO' : 'EM PREPARAÇÃO'}`);
      
      await fetchAllOrders(merchantOrdersPage);
      if (selectedOrder?.id === id) {
          setSelectedOrder(data[0]);
      }
    } catch (err: any) {
      console.error('Erro ao alternar preparação:', err);
      toastError('Erro ao atualizar status');
    } finally {
      setLocalProcessingId(null);
    }
  };

  const handleAction = async (id: string, newStatus: string, reason?: string) => {
    setLocalProcessingId(id);
    try {
      let updateData: any = { status: newStatus };
      if (reason) updateData.cancel_reason = reason;
      
      if (newStatus === 'novo') {
        updateData.payment_status = 'approved';
        updateData.paid_at = new Date().toISOString();
      }
      
      const { data, error } = await supabase.from('orders_delivery').update(updateData).eq('id', id).select();
      
      if (error) throw error;
      
      if (newStatus === 'cancelado') {
        toastSuccess('Pedido cancelado.');
      } else if (newStatus === 'waiting_driver') {
        toastSuccess('Pedido aceito! Chamando entregador...');
        supabase.functions.invoke('send-push-notification', {
          body: {
            driver_id: 'all',
            merchant_id: selectedOrder.merchant_id,
            title: '🛵 Nova Entrega IZI!',
            body: 'Um novo pedido aguarda um entregador na região.',
            data: { orderId: id }
          }
        }).catch(err => console.error('Push error:', err));
      } else {
        toastSuccess('Status atualizado.');
      }

      await fetchAllOrders(merchantOrdersPage);
      if (selectedOrder?.id === id) {
          setSelectedOrder(data[0]);
      }
    } catch (err: any) {
      console.error('Erro na ação:', err);
      toastError('Erro ao processar');
    } finally {
      setLocalProcessingId(null);
    }
  };

  const parseOrderAddress = (fullAddress: string) => {
    const parts = (fullAddress || '').split('| ITENS:');
    const rawItems = parts[1] ? parts[1].split(',').map(i => i.trim()).filter(Boolean) : [];
    const cleanItems = rawItems.map(item => item.replace(/\(R\$.*?\)/g, '').trim());
    return {
      address: parts[0]?.trim(),
      items: cleanItems
    };
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 md:p-8">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedOrder(null)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[48px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] font-display"
          >
              {/* Header */}
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
                  <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Detalhes do Pedido</p>
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">#DT-{selectedOrder.id.slice(0, 8).toUpperCase()}</h2>
                  </div>
                  <button 
                    onClick={() => setSelectedOrder(null)}
                    className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-500 transition-all flex items-center justify-center shadow-sm"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
              </div>

              {/* Content */}
              <div className="p-8 overflow-y-auto flex-1 custom-scrollbar space-y-8">
                  {/* Status Banner */}
                  <div className={`p-6 rounded-[32px] border flex flex-col md:flex-row items-center justify-between gap-4 ${
                      selectedOrder.status === 'concluido' ? 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-500/5' :
                      ['cancelado', 'refused'].includes(selectedOrder.status || '') ? 'bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-500/5' :
                      'bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-500/5'
                  }`}>
                      <div className="flex items-center gap-4">
                          <div className="size-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-2xl font-black">
                                  {selectedOrder.status === 'concluido' ? 'check_circle' :
                                   ['cancelado', 'refused'].includes(selectedOrder.status || '') ? 'cancel' : 'local_shipping'}
                              </span>
                          </div>
                          <div>
                              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Status Atual</p>
                              <p className="text-sm font-black uppercase tracking-widest">
                                  {selectedOrder.status === 'concluido' ? 'Pedido Finalizado' : 
                                   selectedOrder.status === 'cancelado' ? 'Cancelado' :
                                   selectedOrder.status === 'preparando' ? 'Em Preparação' :
                                   selectedOrder.status === 'waiting_driver' ? 'Buscando Entregador' :
                                   selectedOrder.status === 'accepted' ? 'Entregador vindo coletar' :
                                   selectedOrder.status === 'picked_up' ? 'Pedido em entrega' : (selectedOrder.status || 'Pendente')}
                              </p>
                          </div>
                      </div>

                       {/* Action Buttons for Merchant */}
                       {['waiting_merchant', 'novo', 'paid', 'pago'].includes(selectedOrder.status || '') && (
                         <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleAction(selectedOrder.id, 'cancelado', 'Recusado pelo lojista')}
                              className="px-6 py-3 bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
                            >
                              Recusar
                            </button>
                            <button 
                              onClick={() => handleAction(selectedOrder.id, 'waiting_driver')}
                              className="px-6 py-3 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                            >
                              Aceitar e Chamar
                            </button>
                         </div>
                       )}

                       {/* Toggle Preparation for Ongoing */}
                       {['preparando', 'pronto', 'waiting_driver', 'accepted', 'picked_up'].includes(selectedOrder.status || '') && (
                         <button
                            disabled={localProcessingId === selectedOrder.id}
                            onClick={() => handleTogglePreparation(selectedOrder.id, selectedOrder.preparation_status || 'preparando')}
                            className={`px-6 py-3 rounded-2xl border-2 flex items-center gap-2 transition-all ${
                              selectedOrder.preparation_status === 'pronto'
                                ? 'bg-emerald-500 text-white border-emerald-400'
                                : 'bg-amber-500 text-white border-amber-400'
                            }`}
                          >
                            <span className={`material-symbols-outlined text-sm ${selectedOrder.preparation_status === 'preparando' ? 'animate-pulse' : ''}`}>
                              {selectedOrder.preparation_status === 'pronto' ? 'check_circle' : 'restaurant'}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest">
                              {selectedOrder.preparation_status === 'pronto' ? 'Pronto' : 'Preparando'}
                            </span>
                          </button>
                       )}
                  </div>

                  {/* Área de Ações Extra (Cancelamento e Repetição) */}
                  <div className="flex justify-end items-center gap-3 px-1">
                      {/* Repetir Pedido (Chamar Entregador) */}
                      <button 
                        onClick={() => {
                          setDraftStandaloneOrder(selectedOrder);
                          setActiveTab('standalone_delivery');
                          setSelectedOrder(null);
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">reorder</span>
                        Repetir Entrega
                      </button>

                      {!['concluido', 'cancelado'].includes(selectedOrder.status || '') && (
                        <button 
                          disabled={localProcessingId === selectedOrder.id}
                          onClick={() => {
                            if (window.confirm('Deseja realmente CANCELAR este pedido? Esta ação não pode ser desfeita.')) {
                              handleAction(selectedOrder.id, 'cancelado', 'Cancelado pelo lojista via central');
                            }
                          }}
                          className="flex items-center gap-2 text-[10px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-50 px-4 py-2 rounded-xl transition-all"
                        >
                          <span className="material-symbols-outlined text-sm">cancel</span>
                          Cancelar Pedido
                        </button>
                      )}
                  </div>

                  {/* Items Section */}
                  <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">Itens do Pedido</h4>
                      <div className="space-y-3">
                          {selectedOrder.items && Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                              selectedOrder.items.map((it: any, idx: number) => (
                                  <div key={idx} className="flex justify-between items-start p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                      <div className="flex items-start gap-4">
                                           <div className="size-8 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center text-[10px] font-black text-primary border border-slate-100 dark:border-slate-800">
                                               {it.quantity || 1}x
                                           </div>
                                           <div>
                                               <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{it.name || it.product_name || 'Produto'}</p>
                                           </div>
                                      </div>
                                      <p className="text-sm font-black text-slate-900 dark:text-white">
                                          R$ {((Number(it.price || 0)) * (it.quantity || 1)).toFixed(2).replace('.', ',')}
                                      </p>
                                  </div>
                              ))
                          ) : (
                              parseOrderAddress(selectedOrder.delivery_address || '').items.map((item: string, idx: number) => (
                                  <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                      <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                          <span className="material-symbols-outlined text-primary text-xl">fastfood</span>
                                      </div>
                                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{item}</p>
                                  </div>
                              ))
                          )}
                      </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 rounded-[32px] bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-3 mb-4">
                              <span className="material-symbols-outlined text-indigo-500">person</span>
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</h4>
                          </div>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed">
                              {selectedOrder.user_name || 'Usuário Izi'}
                          </p>
                      </div>
                      <div className="p-6 rounded-[32px] bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-3 mb-4">
                              <span className="material-symbols-outlined text-rose-500">pin_drop</span>
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Endereço</h4>
                          </div>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed line-clamp-3">
                              {parseOrderAddress(selectedOrder.delivery_address || '').address}
                          </p>
                      </div>

                      {/* Informações do Entregador */}
                      {selectedOrder.driver_id && (
                        <div className="md:col-span-2 p-6 rounded-[32px] bg-gradient-to-r from-slate-50 to-blue-50/30 dark:from-slate-800/20 dark:to-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                          <div className="flex items-center gap-3 mb-5">
                              <div className="size-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                                <span className="material-symbols-outlined text-blue-500">sports_motorsports</span>
                              </div>
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entregador Responsável</h4>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-center gap-4">
                              <div className="size-14 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                                {selectedOrder.driver_avatar ? (
                                  <img src={selectedOrder.driver_avatar} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="material-symbols-outlined text-2xl text-slate-400">person</span>
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-900 dark:text-white uppercase">
                                  {selectedOrder.driver_name || 'Motoboy IZI'}
                                </p>
                                {selectedOrder.driver_phone && (
                                  <a href={`tel:${selectedOrder.driver_phone}`} className="text-[10px] font-bold text-blue-500 uppercase tracking-widest hover:underline flex items-center gap-1 mt-0.5">
                                    <span className="material-symbols-outlined text-xs">phone</span>
                                    {selectedOrder.driver_phone}
                                  </a>
                                )}
                                {selectedOrder.driver_vehicle && (
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-xs">two_wheeler</span>
                                    {selectedOrder.driver_vehicle}
                                    {selectedOrder.driver_plate && ` • ${selectedOrder.driver_plate}`}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="space-y-3">
                              {selectedOrder.delivery_payment_method && (
                                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pgto. na Entrega</span>
                                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-sm text-emerald-500">
                                      {selectedOrder.delivery_payment_method === 'dinheiro' ? 'payments' : 
                                       selectedOrder.delivery_payment_method === 'pix' ? 'qr_code_2' : 
                                       selectedOrder.delivery_payment_method === 'cartao' ? 'credit_card' : 'receipt'}
                                    </span>
                                    {selectedOrder.delivery_payment_method === 'dinheiro' ? 'Dinheiro' :
                                     selectedOrder.delivery_payment_method === 'pix' ? 'PIX' :
                                     selectedOrder.delivery_payment_method === 'cartao' ? 'Cartão' :
                                     selectedOrder.delivery_payment_method === 'ja_pago' ? 'Já Pago' :
                                     selectedOrder.delivery_payment_method}
                                  </span>
                                </div>
                              )}
                              {selectedOrder.delivery_fee > 0 && (
                                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Taxa Entrega</span>
                                  <span className="text-xs font-black text-blue-500 italic">
                                    R$ {Number(selectedOrder.delivery_fee).toFixed(2).replace('.', ',')}
                                  </span>
                                </div>
                              )}
                              {selectedOrder.notes && (
                                <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/20">
                                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block mb-1">Observações</span>
                                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{selectedOrder.notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Caso não tenha entregador ainda */}
                      {!selectedOrder.driver_id && ['waiting_driver', 'agendado', 'scheduled'].includes(selectedOrder.status || '') && (
                        <div className="md:col-span-2 p-6 rounded-[32px] bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
                          <div className="flex items-center gap-3">
                            <div className="size-10 bg-amber-500/10 rounded-xl flex items-center justify-center animate-pulse">
                              <span className="material-symbols-outlined text-amber-500">search</span>
                            </div>
                            <div>
                              <p className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">Buscando Entregador...</p>
                              <p className="text-[10px] font-bold text-slate-400 mt-0.5">Aguardando um motoboy aceitar a corrida</p>
                            </div>
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Financial Summary */}
                  <div className="p-8 rounded-[40px] bg-slate-900 text-white shadow-2xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-500">
                          <span className="material-symbols-outlined text-8xl font-black">payments</span>
                      </div>
                      <div className="relative z-10 space-y-4">
                          <div className="flex justify-between items-center opacity-60">
                              <span className="text-[10px] font-black uppercase tracking-widest">Subtotal do Pedido</span>
                              <span className="text-sm font-black">R$ {Number(selectedOrder.total_price || 0).toFixed(2).replace('.', ',')}</span>
                          </div>
                          <div className="flex justify-between items-center opacity-60">
                              <span className="text-[10px] font-black uppercase tracking-widest">Taxa de Entrega</span>
                              <span className="text-sm font-black">+ R$ {Number(selectedOrder.delivery_fee || 0).toFixed(2).replace('.', ',')}</span>
                          </div>
                          <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                              <span className="text-[10px] font-black uppercase tracking-widest">Total Líquido</span>
                              <span className="text-3xl font-black text-primary italic">R$ {Number(selectedOrder.total_price || 0).toFixed(2).replace('.', ',')}</span>
                          </div>
                          <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest text-center pt-2">Pagamento via {selectedOrder.payment_method || 'Não definido'}</p>
                      </div>
                  </div>
              </div>
          </motion.div>
      </div>
    </AnimatePresence>
  );
}
