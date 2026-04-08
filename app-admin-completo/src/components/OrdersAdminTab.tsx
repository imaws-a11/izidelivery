import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';
import { supabase } from '../lib/supabase';
import { toastSuccess, toastError } from '../lib/useToast';

export default function OrdersAdminTab() {
  const {
    allOrders, 
    ordersPage, 
    ordersTotalCount, 
    fetchAllOrders,
    isLoadingList,
    appSettings,
    merchantsList
  } = useAdmin();

  React.useEffect(() => {
    fetchAllOrders(ordersPage);
  }, [fetchAllOrders]);

  const ORDERS_PER_PAGE = 50;

  const [localProcessingId, setLocalProcessingId] = React.useState<string | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = React.useState<any>(null);
  const [statusFilter, setStatusFilter] = React.useState('todos');
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredOrders = React.useMemo(() => {
    let result = allOrders;
    if (statusFilter !== 'todos') {
      result = result.filter(o => o.status === statusFilter);
    }
    if (searchQuery) {
      const lowSearch = searchQuery.toLowerCase();
      result = result.filter(o => 
        (o.user?.name || o.user_name || '').toLowerCase().includes(lowSearch) ||
        (o.user?.email || '').toLowerCase().includes(lowSearch) ||
        o.id.toLowerCase().includes(lowSearch)
      );
    }
    return result;
  }, [allOrders, statusFilter, searchQuery]);

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
      
      if (error) {
        toastError('Erro ao processar pedido: ' + error.message);
        throw error;
      }
      
      if (!data || data.length === 0) {
        toastError('O pedido foi atualizado, mas as alterações não refletiram.');
      } else {
        if (newStatus === 'cancelado') toastSuccess('Pedido cancelado com sucesso.');
        else toastSuccess('Status do pedido atualizado.');
      }

      await fetchAllOrders(ordersPage);
      if (selectedOrderDetails?.id === id) {
          setSelectedOrderDetails(data?.[0]);
      }
    } catch (err: any) {
      console.error('Erro na ação do admin:', err);
    } finally {
      setLocalProcessingId(null);
    }
  };

  const parseOrderAddress = (fullAddress: string) => {
    const parts = (fullAddress || '').split('| ITENS:');
    const rawItems = parts[1] ? parts[1].split(',').map(i => i.trim()).filter(Boolean) : [];
    
    // Tenta limpar preços da string para exibição na lista legada
    const cleanItems = rawItems.map(item => {
        return item.replace(/\(R\$.*?\)/g, '').trim();
    });

    return {
      address: parts[0]?.trim(),
      items: cleanItems
    };
  };

  const normalizeServiceType = (raw?: string | null) => {
    const type = String(raw || '').toLowerCase().trim();
    if (['carro', 'car_ride', 'taxi', 'ride'].includes(type)) return 'car_ride';
    if (['mototaxi', 'moto_taxi', 'motortaxi'].includes(type)) return 'mototaxi';
    if (['motorista_particular', 'motorista particular', 'chauffeur'].includes(type)) return 'motorista_particular';
    if (['logistica', 'logistics'].includes(type)) return 'logistica';
    return type || 'generic';
  };

  const formatCurrency = (value: number) => `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`;

  const getMerchantFinancialSummary = (order: any) => {
    if (!order?.merchant_id) return null;
    const merchant = merchantsList.find(m => m.id === order.merchant_id);
    const rate = Number(merchant?.commission_percent ?? appSettings?.appCommission ?? 12);
    const gross = Number(order.total_price || 0);
    const commissionAmount = gross * (rate / 100);
    return {
      label: 'Taxa Plataforma Loja',
      rate,
      gross,
      commissionAmount,
      netAmount: gross - commissionAmount,
      netLabel: 'Líquido Loja'
    };
  };

  const getDriverFinancialSummary = (order: any) => {
    if (!order) return null;

    const type = normalizeServiceType(order.service_type);
    const isPrivateDriver = ['car_ride', 'motorista_particular'].includes(type);
    const isMobilityOrFreight = ['mototaxi', 'car_ride', 'motorista_particular', 'frete', 'logistica', 'van', 'utilitario'].includes(type);
    const isErrand = ['package', 'motoboy', 'generic'].includes(type);

    let baseAmount = 0;
    if (isMobilityOrFreight) {
      baseAmount = Number(order.total_price || 0);
    } else if (isErrand) {
      baseAmount = Number(order.delivery_fee || order.total_price || 0);
    } else {
      const freightValue = Number(order.delivery_fee || 0);
      baseAmount = freightValue > 0 ? freightValue : Number(appSettings?.baseFee || 0);
    }

    if (baseAmount <= 0) return null;

    const rate = Number(
      isPrivateDriver
        ? (appSettings?.privateDriverCommission ?? appSettings?.driverFreightCommission ?? appSettings?.appCommission ?? 12)
        : (appSettings?.driverFreightCommission ?? appSettings?.appCommission ?? 12)
    );

    return {
      label: isPrivateDriver ? 'Comissão Motorista Particular' : 'Comissão Entregador',
      baseLabel: isPrivateDriver ? 'Base Corrida' : 'Base Frete',
      netLabel: isPrivateDriver ? 'Líquido Motorista' : 'Líquido Entregador',
      rate,
      baseAmount,
      commissionAmount: baseAmount * (rate / 100),
      netAmount: baseAmount * (1 - rate / 100)
    };
  };

  const selectedMerchantFinancial = selectedOrderDetails ? getMerchantFinancialSummary(selectedOrderDetails) : null;
  const selectedDriverFinancial = selectedOrderDetails ? getDriverFinancialSummary(selectedOrderDetails) : null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
      {isLoadingList && (
        <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </div>
      )}
      
      <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-4">
          <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">analytics</span>
            Monitoramento Global de Pedidos
          </h3>
          <div className="relative group max-w-md">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
            <input 
              type="text"
              placeholder="Buscar por cliente, e-mail ou ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-white dark:bg-slate-800 rounded-2xl p-1 border border-slate-200 dark:border-slate-700 shadow-sm overflow-x-auto">
            {['todos', 'novo', 'cancelado'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === s ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
          <button 
            onClick={() => fetchAllOrders(ordersPage)}
            className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary transition-all shadow-sm"
          >
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/80 dark:bg-slate-800/80">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">ID Pedido</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Cliente</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tipo</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Destino</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Valor Total</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Data/Hora</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredOrders.length === 0 ? (
               <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center">
                      <span className="material-symbols-outlined text-4xl text-slate-200 mb-4 scale-150">sentiment_dissatisfied</span>
                      <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Nenhum pedido encontrado com este filtro</p>
                    </div>
                  </td>
               </tr>
            ) : filteredOrders.map((o) => (
               <tr 
                 key={o.id} 
                 onClick={() => setSelectedOrderDetails(o)}
                 className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
               >
                <td className="px-8 py-5 font-bold text-slate-400 text-xs group-hover:text-primary transition-colors">#DT-{o.id.slice(0, 8).toUpperCase()}</td>
                <td className="px-8 py-5">
                   <div className="flex flex-col">
                     <span className="text-sm font-black text-slate-700 dark:text-slate-200 truncate max-w-[150px]">
                       {o.user?.name || o.user_name || 'Usuário Izi'}
                     </span>
                     <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter truncate max-w-[150px]">
                       ID: {o.user_id?.slice(0, 8)}...
                     </span>
                   </div>
                </td>
                <td className="px-8 py-5">
                   <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-500">
                     {o.service_type || 'Geral'}
                   </span>
                </td>
                <td className="px-8 py-5 font-bold text-slate-600 dark:text-slate-300 truncate max-w-[250px] text-sm">{parseOrderAddress(o.delivery_address).address || o.delivery_address}</td>
                <td className="px-8 py-5 font-black text-primary">R$ {Number(o.total_price || 0).toFixed(2).replace('.', ',')}</td>
                <td className="px-8 py-5">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                    o.status === 'concluido' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    o.status === 'cancelado' ? 'bg-red-50 text-red-600 border-red-100' :
                    o.status === 'pendente_pagamento' ? 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse' :
                    'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
                  }`}>
                    {o.status === 'waiting_driver' ? 'Aguardando Motorista' : 
                     o.status === 'waiting_merchant' ? 'Esperando Lojista' :
                     o.status === 'pendente_pagamento' ? 'Aguardando PIX' :
                     o.status === 'preparando' ? 'Em Preparo' :
                     o.status === 'a_caminho' ? 'Em Rota' : o.status}
                  </span>
                </td>
                <td className="px-8 py-5 font-medium text-slate-400 text-[11px]">{new Date(o.created_at).toLocaleString('pt-BR')}</td>
              </tr>
            ))}
            {allOrders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-8 py-16 text-center">
                  <span className="material-symbols-outlined text-4xl text-slate-200 mb-2">inventory_2</span>
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Nenhum pedido processado</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {ordersTotalCount > ORDERS_PER_PAGE && (
          <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Exibindo {((ordersPage - 1) * ORDERS_PER_PAGE) + 1}–{Math.min(ordersPage * ORDERS_PER_PAGE, ordersTotalCount)} de {ordersTotalCount} pedidos
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={ordersPage <= 1 || isLoadingList}
                onClick={() => fetchAllOrders(ordersPage - 1)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 transition-all disabled:opacity-30"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <div className="bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl text-[11px] font-black text-slate-500">
                Pág. {ordersPage}
              </div>
              <button
                disabled={ordersPage >= Math.ceil(ordersTotalCount / ORDERS_PER_PAGE) || isLoadingList}
                onClick={() => fetchAllOrders(ordersPage + 1)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 transition-all disabled:opacity-30"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
          {selectedOrderDetails && (
              <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 md:p-8">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSelectedOrderDetails(null)}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[48px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                  >
                      {/* Header */}
                      <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
                          <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Detalhes do Pedido (Admin)</p>
                              <h2 className="text-2xl font-black text-slate-900 dark:text-white">#DT-{selectedOrderDetails.id.slice(0, 8).toUpperCase()}</h2>
                          </div>
                          <button 
                            onClick={() => setSelectedOrderDetails(null)}
                            className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-500 transition-all flex items-center justify-center shadow-sm"
                          >
                            <span className="material-symbols-outlined">close</span>
                          </button>
                      </div>

                      {/* Content */}
                      <div className="p-8 overflow-y-auto flex-1 custom-scrollbar space-y-8">
                          {/* Status Banner */}
                          <div className={`p-6 rounded-[32px] border flex items-center justify-between ${
                              selectedOrderDetails.status === 'pendente_pagamento' ? 'bg-amber-50 border-amber-100 text-amber-600 dark:bg-amber-500/5' :
                              selectedOrderDetails.status === 'waiting_merchant' ? 'bg-orange-50 border-orange-100 text-orange-600 dark:bg-orange-500/5' :
                              selectedOrderDetails.status === 'preparando' ? 'bg-amber-50 border-amber-100 text-amber-600 dark:bg-amber-500/5' :
                              selectedOrderDetails.status === 'concluido' ? 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-500/5' :
                              'bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-500/5'
                          }`}>
                              <div className="flex items-center gap-4">
                                  <div className="size-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center">
                                      <span className="material-symbols-outlined text-2xl">
                                          {selectedOrderDetails.status === 'pendente_pagamento' ? 'payments' :
                                           selectedOrderDetails.status === 'waiting_merchant' ? 'pending' : 
                                           selectedOrderDetails.status === 'preparando' ? 'restaurant' : 
                                           selectedOrderDetails.status === 'concluido' ? 'check_circle' : 'local_shipping'}
                                      </span>
                                  </div>
                                  <div>
                                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Status Atual</p>
                                      <p className="text-base font-black uppercase tracking-widest">
                                          {selectedOrderDetails.status === 'pendente_pagamento' ? 'Aguardando Confirmação do Pagamento' :
                                           selectedOrderDetails.status === 'waiting_merchant' ? 'Aguardando Aprovação' : 
                                           selectedOrderDetails.status === 'preparando' ? 'Em Preparação' : 
                                           selectedOrderDetails.status === 'waiting_driver' ? 'Aguardando Entregador' : 
                                           selectedOrderDetails.status === 'concluido' ? 'Pedido Finalizado' : selectedOrderDetails.status}
                                      </p>
                                  </div>
                              </div>
                          </div>

                          {/* Items Section */}
                          <div>
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">Itens do Pedido</h4>
                              <div className="space-y-3">
                                  {selectedOrderDetails.items && Array.isArray(selectedOrderDetails.items) && selectedOrderDetails.items.length > 0 ? (
                                      <>
                                          {selectedOrderDetails.items.map((it: any, idx: number) => (
                                              <div key={idx} className="flex justify-between items-start p-4 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800 group hover:border-primary/20 transition-all">
                                                  <div className="flex items-start gap-4">
                                                       <div className="size-8 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center text-[10px] font-black text-primary border border-slate-100 dark:border-slate-800 group-hover:scale-110 transition-transform">
                                                           {it.quantity || 1}x
                                                       </div>
                                                       <div>
                                                           <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{it.name || it.product_name || 'Produto'}</p>
                                                           {((it.options && it.options.length > 0) || (it.addonDetails && it.addonDetails.length > 0)) && (
                                                               <div className="mt-1 space-y-0.5">
                                                                   {(it.options || []).map((opt: any, oIdx: number) => (
                                                                       <p key={oIdx} className="text-[10px] text-slate-400 font-medium italic">
                                                                           + {opt.name}
                                                                       </p>
                                                                   ))}
                                                                   {(it.addonDetails || []).map((addon: any, aIdx: number) => (
                                                                       <p key={aIdx} className="text-[10px] text-slate-400 font-medium italic">
                                                                           {addon.group_name}: {addon.name}
                                                                       </p>
                                                                   ))}
                                                               </div>
                                                           )}
                                                       </div>
                                                  </div>
                                                  <div className="text-right">
                                                      <p className="text-sm font-black text-slate-900 dark:text-white">
                                                          R$ {(
                                                              (Number(it.price || 0) + 
                                                              (it.options || []).reduce((acc: number, opt: any) => acc + (Number(opt.price) || 0), 0) +
                                                              (it.addonDetails || []).reduce((acc: number, ad: any) => acc + (Number(ad.price || ad.unit_price) || 0), 0)
                                                              ) * (it.quantity || 1)
                                                          ).toFixed(2).replace('.', ',')}
                                                      </p>
                                                      {it.quantity > 1 && (
                                                          <p className="text-[9px] font-bold text-slate-400 uppercase">
                                                              Un: R$ {Number(it.price || 0).toFixed(2).replace('.', ',')}
                                                          </p>
                                                      )}
                                                  </div>
                                              </div>
                                          ))}

                                          {/* Financial Summary */}
                                          <div className="mt-6 p-6 rounded-3xl bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 space-y-3">
                                               <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                   <span>Subtotal</span>
                                                   <span>R$ {Number(selectedOrderDetails.total_price - (selectedOrderDetails.delivery_fee || 0) + (selectedOrderDetails.discount || 0)).toFixed(2).replace('.', ',')}</span>
                                               </div>
                                               {selectedOrderDetails.delivery_fee > 0 && (
                                                   <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                       <span>Entrega</span>
                                                       <span className="text-blue-500 font-black">+ R$ {Number(selectedOrderDetails.delivery_fee).toFixed(2).replace('.', ',')}</span>
                                                   </div>
                                               )}
                                               {selectedOrderDetails.discount > 0 && (
                                                   <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                       <div className="flex items-center gap-1">
                                                           <span>Desconto</span>
                                                           {selectedOrderDetails.coupon_code && (
                                                               <span className="px-1.5 py-0.5 bg-rose-50 text-rose-500 rounded border border-rose-100 text-[8px] font-black">{selectedOrderDetails.coupon_code}</span>
                                                           )}
                                                       </div>
                                                       <span className="text-rose-500 font-black">- R$ {Number(selectedOrderDetails.discount).toFixed(2).replace('.', ',')}</span>
                                                   </div>
                                               )}
                                               <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
                                                   {selectedMerchantFinancial && (
                                                     <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                         <span>{selectedMerchantFinancial.label} ({selectedMerchantFinancial.rate}%)</span>
                                                         <span className="text-amber-600">{formatCurrency(selectedMerchantFinancial.commissionAmount)}</span>
                                                     </div>
                                                   )}
                                                   {selectedDriverFinancial && (
                                                     <>
                                                       <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                           <span>{selectedDriverFinancial.baseLabel}</span>
                                                           <span className="text-sky-600">{formatCurrency(selectedDriverFinancial.baseAmount)}</span>
                                                       </div>
                                                       <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                           <span>{selectedDriverFinancial.label} ({selectedDriverFinancial.rate}%)</span>
                                                           <span className="text-fuchsia-600">{formatCurrency(selectedDriverFinancial.commissionAmount)}</span>
                                                       </div>
                                                     </>
                                                   )}
                                                   <div className="flex justify-between items-center pt-2">
                                                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-display">Resumo Total</span>
                                                       <span className="text-xl font-black text-primary italic">{formatCurrency(selectedOrderDetails.total_price || 0)}</span>
                                                   </div>
                                                </div>
                                          </div>
                                      </>
                                  ) : parseOrderAddress(selectedOrderDetails.delivery_address).items.length > 0 ? (
                                      <div className="space-y-3">
                                          {parseOrderAddress(selectedOrderDetails.delivery_address).items.map((item: string, idx: number) => (
                                              <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                                      <span className="material-symbols-outlined text-primary text-xl">fastfood</span>
                                                  </div>
                                                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{item}</p>
                                              </div>
                                          ))}
                                          
                                          {/* Resumo Financeiro para Legado */}
                                          <div className="mt-6 p-6 rounded-3xl bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 space-y-3">
                                               <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                   <span>Subtotal Estimado</span>
                                                   <span>R$ {Number(selectedOrderDetails.total_price - (selectedOrderDetails.delivery_fee || 0) + (selectedOrderDetails.discount || 0)).toFixed(2).replace('.', ',')}</span>
                                               </div>
                                               {selectedOrderDetails.delivery_fee > 0 && (
                                                   <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                       <span>Entrega</span>
                                                       <span className="text-blue-500 font-black">+ R$ {Number(selectedOrderDetails.delivery_fee).toFixed(2).replace('.', ',')}</span>
                                                   </div>
                                               )}
                                               {selectedOrderDetails.discount > 0 && (
                                                   <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                        <div className="flex items-center gap-1">
                                                            <span>Desconto</span>
                                                            {selectedOrderDetails.coupon_code && (
                                                                <span className="px-1.5 py-0.5 bg-rose-50 text-rose-500 rounded border border-rose-100 text-[8px] font-black">{selectedOrderDetails.coupon_code}</span>
                                                            )}
                                                        </div>
                                                        <span className="text-rose-500 font-black">- R$ {Number(selectedOrderDetails.discount).toFixed(2).replace('.', ',')}</span>
                                                   </div>
                                               )}
                                               <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
                                                   {selectedMerchantFinancial && (
                                                     <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                         <span>{selectedMerchantFinancial.label} ({selectedMerchantFinancial.rate}%)</span>
                                                         <span className="text-amber-600">{formatCurrency(selectedMerchantFinancial.commissionAmount)}</span>
                                                     </div>
                                                   )}
                                                   {selectedDriverFinancial && (
                                                     <>
                                                       <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                           <span>{selectedDriverFinancial.baseLabel}</span>
                                                           <span className="text-sky-600">{formatCurrency(selectedDriverFinancial.baseAmount)}</span>
                                                       </div>
                                                       <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                           <span>{selectedDriverFinancial.label} ({selectedDriverFinancial.rate}%)</span>
                                                           <span className="text-fuchsia-600">{formatCurrency(selectedDriverFinancial.commissionAmount)}</span>
                                                       </div>
                                                     </>
                                                   )}
                                                   <div className="flex justify-between items-center pt-2">
                                                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-display">Valor Total</span>
                                                       <span className="text-xl font-black text-primary italic">{formatCurrency(selectedOrderDetails.total_price || 0)}</span>
                                                   </div>
                                                </div>
                                          </div>
                                      </div>
                                  ) : (
                                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 border-dashed text-center opacity-60">
                                          <p className="text-xs font-bold text-slate-400">Sem itens registrados para este pedido</p>
                                      </div>
                                  )}
                              </div>
                          </div>

                          {/* Info Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="p-6 rounded-[32px] bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800">
                                  <div className="flex items-center justify-between mb-4">
                                      <div className="flex items-center gap-3">
                                          <span className="material-symbols-outlined text-indigo-500">person</span>
                                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</h4>
                                      </div>
                                      <button 
                                          onClick={() => {
                                              navigator.clipboard.writeText(selectedOrderDetails.user_id || '');
                                              toastSuccess('ID do usuário copiado!');
                                          }}
                                          className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline"
                                      >
                                          Copiar ID
                                      </button>
                                  </div>
                                  <p className="text-sm font-black text-slate-700 dark:text-slate-200 leading-relaxed mb-1">
                                      {selectedOrderDetails.user?.name || selectedOrderDetails.user_name || 'Usuário Izi'}
                                  </p>
                                  {selectedOrderDetails.user?.name && selectedOrderDetails.user_name && selectedOrderDetails.user?.name !== selectedOrderDetails.user_name && (
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 italic">
                                      Nome no pedido: {selectedOrderDetails.user_name}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                                        UID: {selectedOrderDetails.user_id || 'Não informado'}
                                    </p>
                                  </div>
                              </div>
                              <div className="p-6 rounded-[32px] bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800">
                                  <div className="flex items-center gap-3 mb-4">
                                      <span className="material-symbols-outlined text-rose-500">pin_drop</span>
                                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Endereço de Entrega</h4>
                                  </div>
                                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed">
                                      {parseOrderAddress(selectedOrderDetails.delivery_address).address}
                                  </p>
                              </div>
                              <div className="p-6 rounded-[32px] bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800">
                                  <div className="flex items-center gap-3 mb-4">
                                      <span className="material-symbols-outlined text-blue-500">payments</span>
                                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pagamento ({selectedOrderDetails.payment_method})</h4>
                                  </div>
                                  <div className="space-y-4">
                                      <div className="flex items-end justify-between">
                                          <p className="text-2xl font-black text-primary">R$ {selectedOrderDetails.total_price?.toFixed(2).replace('.', ',')}</p>
                                          {selectedOrderDetails.payment_method === 'dinheiro' && (
                                              <span className="px-2 py-1 bg-rose-100 text-rose-600 rounded-lg text-[8px] font-black uppercase mb-1">Receber no local</span>
                                          )}
                                      </div>

                                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                          {selectedMerchantFinancial && (
                                            <>
                                              <div>
                                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{selectedMerchantFinancial.label} ({selectedMerchantFinancial.rate}%)</p>
                                                  <p className="text-sm font-black text-amber-600">{formatCurrency(selectedMerchantFinancial.commissionAmount)}</p>
                                              </div>
                                              <div className="text-right sm:text-left lg:text-right">
                                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{selectedMerchantFinancial.netLabel}</p>
                                                  <p className="text-sm font-black text-emerald-600">{formatCurrency(selectedMerchantFinancial.netAmount)}</p>
                                              </div>
                                            </>
                                          )}
                                          {selectedDriverFinancial && (
                                            <div className={`${selectedMerchantFinancial ? 'lg:text-right' : 'text-right'}`}>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{selectedDriverFinancial.label} ({selectedDriverFinancial.rate}%)</p>
                                                <p className="text-sm font-black text-fuchsia-600">{formatCurrency(selectedDriverFinancial.commissionAmount)}</p>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">{selectedDriverFinancial.netLabel}</p>
                                                <p className="text-sm font-black text-sky-600">{formatCurrency(selectedDriverFinancial.netAmount)}</p>
                                            </div>
                                          )}
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="p-8 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 bg-slate-50/50 dark:bg-slate-800/20">
                          <button
                              disabled={localProcessingId === selectedOrderDetails.id}
                              onClick={() => {
                                if(confirm('Como ADMIN, deseja forçar o cancelamento deste pedido?')) {
                                  handleAction(selectedOrderDetails.id, 'cancelado', 'Cancelado forçadamente pelo ADMIN');
                                }
                              }}
                              className="flex-1 py-4 rounded-3xl bg-white dark:bg-slate-800 text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] border border-slate-200 dark:border-slate-700 hover:bg-rose-50 hover:text-rose-500 transition-all shadow-sm disabled:opacity-50"
                          >
                              {localProcessingId === selectedOrderDetails.id ? '...' : 'Forçar Cancelamento'}
                          </button>

                          {selectedOrderDetails.status === 'pendente_pagamento' && (
                             <button
                                 disabled={localProcessingId === selectedOrderDetails.id}
                                 onClick={() => {
                                   if(confirm('Confirmar recebimento manual do PIX para este pedido?')) {
                                     handleAction(selectedOrderDetails.id, 'novo');
                                   }
                                 }}
                                 className="flex-[2] py-4 rounded-3xl bg-blue-500 text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                             >
                                 <span className="material-symbols-outlined text-sm">payments</span>
                                 Confirmar Pagamento e Liberar
                             </button>
                           )}

                           {selectedOrderDetails.status !== 'concluido' && selectedOrderDetails.status !== 'cancelado' && selectedOrderDetails.status !== 'pendente_pagamento' && (
                             <button
                                 disabled={localProcessingId === selectedOrderDetails.id}
                                 onClick={() => handleAction(selectedOrderDetails.id, 'concluido')}
                                 className="flex-[2] py-4 rounded-3xl bg-emerald-500 text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                             >
                                 {localProcessingId === selectedOrderDetails.id ? '...' : (
                                   <>
                                     <span className="material-symbols-outlined text-sm">check_circle</span>
                                     Forçar Conclusão
                                   </>
                                 )}
                             </button>
                           )}
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>
    </div>
  );
}
