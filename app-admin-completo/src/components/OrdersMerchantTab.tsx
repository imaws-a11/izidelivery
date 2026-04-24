import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';
import { supabase } from '../lib/supabase';
import { toastSuccess, toastError, toastInfo } from '../lib/useToast';
import { playIziSound } from '../lib/iziSounds';

// Pedidos do Lojista
export default function OrdersMerchantTab() {
  const {
    allOrders, 
    merchantOrdersPage, 
    merchantOrdersTotalCount, 
    fetchAllOrders, 
    merchantProfile,
    isLoadingList,
    appSettings
  } = useAdmin();

  const ORDERS_PER_PAGE = 50;

  // Filtrar pedidos que pertencem a este lojista
  const myOrders = React.useMemo(() => {
    const mId = merchantProfile?.merchant_id || merchantProfile?.id;
    if (!mId) return allOrders;
    return allOrders.filter((o: any) => String(o.merchant_id) === String(mId));
  }, [allOrders, merchantProfile]);
  
  // Pedidos que precisam de INTERVENÇÃO (Aceitar/Recusar)
  const pendingOrders = myOrders.filter((o: any) => 
    ['waiting_merchant', 'novo', 'paid', 'pago', 'confirmed', 'confirmado'].includes(o.status)
  );
  
  // Pedidos aguardando pagamento (EXCLUÍDOS DA VISÃO DO LOJISTA ATÉ CONFIRMAÇÃO)
  const waitingPaymentOrders: any[] = [];
  
  // Pedidos em PRODUÇÃO ou ENTREGA
  const ongoingOrders = myOrders.filter((o: any) => ['preparando', 'pronto', 'pendente', 'waiting_driver', 'accepted', 'picked_up', 'em_rota', 'a_caminho', 'a_caminho_coleta', 'chegou_coleta', 'no_local_coleta'].includes(o.status));

  const totalActionableOrders = pendingOrders.length + waitingPaymentOrders.length;

  const [localProcessingId, setLocalProcessingId] = React.useState<string | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = React.useState<any>(null);
  const [orderToCancel, setOrderToCancel] = React.useState<any>(null);
  const [cancelReason, setCancelReason] = React.useState('');

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
      if (selectedOrderDetails?.id === id) {
          setSelectedOrderDetails(data[0]);
      }
    } catch (err: any) {
      console.error('Erro ao alternar preparação:', err);
      toastError('Erro ao atualizar status de preparação');
    } finally {
      setLocalProcessingId(null);
    }
  };

  const handleAction = async (id: string, newStatus: string, reason?: string) => {
    setLocalProcessingId(id);
    try {
      let updateData: any = { status: newStatus };
      if (reason) updateData.cancel_reason = reason;
      
      // Se for confirmação manual de pagamento, atualizar campos de pagamento também
      if (newStatus === 'novo') {
        updateData.payment_status = 'approved';
        updateData.paid_at = new Date().toISOString();
      }
      
      const { data, error } = await supabase.from('orders_delivery').update(updateData).eq('id', id).select();
      
      if (error) {
        console.error('Erro detalhado Supabase:', error);
        toastError('Erro ao processar pedido: ' + error.message);
        throw error;
      }
      
      if (!data || data.length === 0) {
        toastError('O pedido foi atualizado, mas as alterações não refletiram.');
      } else {
        if (newStatus === 'cancelado') {
          toastSuccess('Pedido cancelado com sucesso.');
        } else if (newStatus === 'waiting_driver') {
          toastSuccess('Pedido aceito! Chamando entregador...');
          // Notificar Entregadores
          supabase.functions.invoke('send-push-notification', {
            body: {
              driver_id: 'all',
              title: '🛵 Nova Entrega IZI!',
              body: 'Um novo pedido aguarda um entregador na região. Seja rápido!',
              data: { orderId: id }
            }
          }).catch(err => console.error('Erro ao notificar entregadores:', err));
        } else {
          toastSuccess('Status do pedido atualizado.');
          if (newStatus === 'novo') {
            // Se for um pedido novo confirmado pagamento, talvez seja o caso de alertar entregadores (opcional)
             supabase.functions.invoke('send-push-notification', {
                body: {
                  driver_id: 'all',
                  title: '🔔 Novo Pedido IZI',
                  body: 'Um novo pedido acabou de ser recebido, prepare-se!',
                  data: { orderId: id }
                }
             }).catch(err => console.error('Erro ao notificar entregadores (novo_pedido):', err));
          }
        }
      }

      // Forçar atualização do dashboard
      await fetchAllOrders(merchantOrdersPage);
      if (selectedOrderDetails?.id === id) {
          setSelectedOrderDetails(data[0]);
      }
    } catch (err: any) {
      console.error('Erro na ação do lojista:', err);
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

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
              <span className="material-symbols-outlined text-3xl text-primary">shopping_cart</span>
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight text-shadow-sm">Meus Pedidos</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Gerencie o fluxo de atendimento da sua loja em tempo real.</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-orange-600 shadow-sm">
            <span className="size-2 rounded-full bg-orange-500 animate-ping"></span>
            {totalActionableOrders} ações pendentes
          </span>
          <button 
            onClick={() => {
              playIziSound('merchant');
              toastInfo('Testando som de notificação...');
            }}
            className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-amber-500 transition-all active:scale-95 shadow-sm flex items-center gap-2"
            title="Testar Som de Notificação"
          >
            <span className="material-symbols-outlined">volume_up</span>
            <span className="text-[10px] font-bold uppercase hidden md:inline">Testar Som</span>
          </button>
          <button 
            onClick={() => fetchAllOrders(1)}
            disabled={isLoadingList}
            className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-primary transition-all active:scale-95 shadow-sm"
          >
            <span className={`material-symbols-outlined ${isLoadingList ? 'animate-spin' : ''}`}>refresh</span>
          </button>
        </div>
      </div>

      {pendingOrders.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-orange-500 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
              <span className="material-symbols-outlined text-lg">notifications_active</span>
              Aguardando sua ação
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingOrders.map((o: any) => (
                <div 
                  key={o.id} 
                  className="group bg-gradient-to-br from-white to-orange-50/30 dark:from-slate-900 dark:to-orange-500/5 p-6 rounded-[32px] border-2 border-orange-100 dark:border-orange-500/20 shadow-xl shadow-orange-500/5 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4">
                     <span className="px-3 py-1 rounded-full bg-orange-500 text-white text-[9px] font-black uppercase tracking-widest animate-pulse">NOVO</span>
                  </div>
                  
                    <div className="mb-6 flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Pedido</p>
                        <p className="text-xl font-black text-slate-900 dark:text-white">#DT-{o.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">schedule</span>
                          {new Date(o.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Cliente</p>
                        <div className="flex flex-col items-end">
                           <p className="text-sm font-black text-slate-700 dark:text-slate-200 truncate max-w-[120px]">
                              {o.user?.name || o.user_name || 'Usuário Izi'}
                           </p>
                           {o.user?.name && o.user_name && o.user?.name !== o.user_name && (
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter truncate max-w-[120px] italic">
                                 Obs: {o.user_name}
                              </p>
                           )}
                        </div>
                      </div>
                    </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                        <span className="material-symbols-outlined text-lg text-rose-500">pin_drop</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Destino Final</p>
                        <p className="text-sm font-black text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug">
                          {parseOrderAddress(o.delivery_address).address === 'Buscando localização...' ? 'Localização em processamento...' : parseOrderAddress(o.delivery_address).address}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                        <span className="material-symbols-outlined text-lg text-blue-500">payments</span>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Pagamento</p>
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300 capitalize">{o.payment_method || 'Não inf.'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-8 px-1">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
                       <p className="text-3xl font-black text-primary">R$ {(((o.total_price || 0) - (o.delivery_fee || 0) - (o.service_fee || 0)) * (1 - (merchantProfile?.commission_percent ?? appSettings?.appCommission ?? 12) / 100)).toFixed(2).replace('.', ',')}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      disabled={localProcessingId === o.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if(!confirm('Deseja realmente recusar este pedido?')) return;
                        handleAction(o.id, 'cancelado', 'Recusado pelo lojista');
                      }} 
                      className="flex-1 py-4 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-rose-50 hover:text-rose-500 transition-all border border-transparent hover:border-rose-100 disabled:opacity-50"
                    >
                      {localProcessingId === o.id ? '...' : 'Recusar'}
                    </button>
                    <button 
                      disabled={localProcessingId === o.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(o.id, 'waiting_driver');
                      }} 
                      className="flex-[2] py-4 rounded-3xl bg-emerald-500 text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/25 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {localProcessingId === o.id ? '...' : <><span className="material-symbols-outlined text-sm text-white">delivery_dining</span> Aceitar e Chamar</>}
                    </button>
                    <button 
                      onClick={() => setSelectedOrderDetails(o)}
                      className="p-4 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary transition-all flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined">visibility</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
      )}

      {/* Seção de Aguardando Pagamento removida conforme solicitação */}

      <div className="space-y-4">
        <div className="flex items-center justify-between ml-1">
            <h3 className="text-sm font-black text-blue-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">local_shipping</span>
            Em andamento
            </h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{ongoingOrders.length} ativos</p>
        </div>
        
        {ongoingOrders.length === 0 ? (
          <div className="py-12 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[40px] border border-dashed border-slate-200 dark:border-slate-800">
            <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">empty_dashboard</span>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Nenhum pedido em produção</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {ongoingOrders.map((o: any) => (
                <div 
                  key={o.id} 
                  onClick={() => setSelectedOrderDetails(o)}
                  className="bg-white dark:bg-slate-900 p-5 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Pedido • {o.user_name || 'Cliente Izi'}</p>
                      <p className="text-sm font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors">#DT-{o.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                        o.status === 'preparando' ? 'bg-amber-100 text-amber-600' :
                        o.status === 'pending' || o.status === 'accepted' || o.status === 'waiting_driver' ? 'bg-blue-100 text-blue-600' :
                        'bg-emerald-100 text-emerald-600'
                      }`}>
                        {o.status === 'preparando' ? 'Preparando' : 
                         o.status === 'waiting_driver' || o.status === 'pending' ? 'Buscando Entregador' : 
                         ['accepted', 'a_caminho_coleta', 'no_local_coleta'].includes(o.status) ? 'Vindo coletar' :
                         o.status === 'chegou_coleta' ? 'Entregador no Local' :
                         ['picked_up', 'em_rota', 'a_caminho', 'saiu_para_entrega'].includes(o.status) ? 'Saiu para Entrega' : 
                         o.status === 'pronto' ? 'Pronto p/ Retirada' : o.status}
                      </span>
                      {o.payment_method === 'dinheiro' && (
                        <div className="flex flex-col items-end">
                          <span className="text-[8px] font-black text-rose-500 uppercase mt-1">Dinheiro na Entrega</span>
                          {o.notes && <span className="text-[8px] font-black text-amber-500 uppercase">{o.notes}</span>}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Toggle de Preparação */}
                  <div className="mb-4">
                    <button
                      disabled={localProcessingId === o.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePreparation(o.id, o.preparation_status || 'preparando');
                      }}
                      className={`w-full py-2.5 rounded-2xl border-2 flex items-center justify-center gap-2 transition-all ${
                        o.preparation_status === 'pronto' 
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20' 
                          : 'bg-amber-50 border-amber-100 text-amber-600 dark:bg-amber-500/10 dark:border-amber-500/20'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-sm ${o.preparation_status === 'preparando' ? 'animate-pulse' : ''}`}>
                        {o.preparation_status === 'pronto' ? 'check_circle' : 'restaurant'}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {o.preparation_status === 'pronto' ? 'Pronto para Retirada' : 'Em Preparação...'}
                      </span>
                    </button>
                  </div>

                  <p className="text-[11px] font-bold text-slate-500 truncate mb-4">{parseOrderAddress(o.delivery_address).address}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
                     <span className="text-lg font-black text-primary">R$ {(((o.total_price || 0) - (o.delivery_fee || 0) - (o.service_fee || 0)) * (1 - (merchantProfile?.commission_percent ?? appSettings?.appCommission ?? 12) / 100)).toFixed(2).replace('.', ',')}</span>
                    <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-all">arrow_forward</span>
                  </div>
                </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden mt-12">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">history</span>
            Histórico Completo
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pedido</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Destino</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Valor</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Data</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {myOrders.filter((o: any) => o.status !== 'pendente_pagamento').map((o: any) => (
                <tr 
                  key={o.id} 
                  onClick={() => setSelectedOrderDetails(o)}
                  className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                >
                  <td className="px-8 py-6 font-bold text-slate-400 text-sm group-hover:text-primary transition-colors">#DT-{o.id.slice(0, 8).toUpperCase()}</td>
                  <td className="px-8 py-6">
                    <p className="font-black text-slate-900 dark:text-white text-sm truncate max-w-[300px]">{parseOrderAddress(o.delivery_address).address}</p>
                  </td>
                   <td className="px-8 py-6 font-black text-primary text-base">R$ {(((o.total_price || 0) - (o.delivery_fee || 0) - (o.service_fee || 0)) * (1 - (merchantProfile?.commission_percent ?? appSettings?.appCommission ?? 12) / 100)).toFixed(2).replace('.', ',')}</td>
                  <td className="px-8 py-6">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      o.status === 'concluido' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                      o.status === 'cancelado' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                      ['novo', 'paid', 'pago', 'waiting_merchant'].includes(o.status) ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                    }`}>
                      {o.status === 'concluido' ? 'Concluído' : 
                       o.status === 'cancelado' ? 'Cancelado' : 
                       o.status === 'preparando' ? 'Em Preparo' : 
                       ['novo', 'paid', 'pago', 'waiting_merchant', 'pending', 'accepted'].includes(o.status) ? 'Novo' : o.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 font-bold text-slate-400 text-xs">
                    {new Date(o.created_at).toLocaleDateString('pt-BR')} {new Date(o.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-8 py-6 text-right">
                      <button onClick={() => setSelectedOrderDetails(o)} className="p-2 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-400 hover:text-primary transition-all">
                          <span className="material-symbols-outlined">visibility</span>
                      </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {myOrders.length === 0 && (
            <div className="px-8 py-24 text-center">
              <div className="size-20 rounded-full bg-slate-50 dark:bg-slate-800 mx-auto flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-4xl text-slate-200">folder_open</span>
              </div>
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Nenhum pedido no histórico</p>
            </div>
          )}
        </div>

        {merchantOrdersTotalCount > ORDERS_PER_PAGE && (
          <div className="px-8 py-8 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between bg-slate-50/30 gap-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Mostrando {((merchantOrdersPage - 1) * ORDERS_PER_PAGE) + 1}–{Math.min(merchantOrdersPage * ORDERS_PER_PAGE, merchantOrdersTotalCount)} de {merchantOrdersTotalCount} pedidos
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={merchantOrdersPage <= 1 || isLoadingList}
                onClick={() => fetchAllOrders(merchantOrdersPage - 1)}
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary hover:border-primary/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              
              <div className="flex items-center gap-2 px-2">
                {Array.from({ length: Math.min(3, Math.ceil(merchantOrdersTotalCount / ORDERS_PER_PAGE)) }, (_, i) => {
                  const totalPages = Math.ceil(merchantOrdersTotalCount / ORDERS_PER_PAGE);
                  let pageNum: number;
                  if (totalPages <= 3) pageNum = i + 1;
                  else if (merchantOrdersPage <= 2) pageNum = i + 1;
                  else if (merchantOrdersPage >= totalPages - 1) pageNum = totalPages - 2 + i;
                  else pageNum = merchantOrdersPage - 1 + i;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => fetchAllOrders(pageNum)}
                      className={`w-12 h-12 flex items-center justify-center rounded-2xl font-black text-xs transition-all ${
                        merchantOrdersPage === pageNum 
                          ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20 scale-110' 
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={merchantOrdersPage >= Math.ceil(merchantOrdersTotalCount / ORDERS_PER_PAGE) || isLoadingList}
                onClick={() => fetchAllOrders(merchantOrdersPage + 1)}
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary hover:border-primary/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE DETALHES DO PEDIDO */}
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
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Detalhes do Pedido</p>
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
                                           selectedOrderDetails.status === 'waiting_driver' || selectedOrderDetails.status === 'pending' ? 'Buscando Entregador' : 
                                           ['accepted', 'a_caminho_coleta', 'no_local_coleta'].includes(selectedOrderDetails.status) ? 'Entregador vindo coletar' :
                                           selectedOrderDetails.status === 'chegou_coleta' ? 'Entregador no Estabelecimento' :
                                           ['picked_up', 'em_rota', 'a_caminho', 'saiu_para_entrega'].includes(selectedOrderDetails.status) ? 'Pedido saiu para entrega' :
                                           selectedOrderDetails.status === 'concluido' ? 'Pedido Finalizado' : selectedOrderDetails.status}
                                      </p>
                                  </div>
                              </div>

                               {/* Controle de Preparação no Modal */}
                               <div className="flex items-center gap-2">
                                  <button
                                    disabled={localProcessingId === selectedOrderDetails.id}
                                    onClick={() => handleTogglePreparation(selectedOrderDetails.id, selectedOrderDetails.preparation_status || 'preparando')}
                                    className={`px-6 py-3 rounded-2xl border-2 flex items-center gap-2 transition-all ${
                                      selectedOrderDetails.preparation_status === 'pronto'
                                        ? 'bg-emerald-500 text-white border-emerald-400'
                                        : 'bg-amber-500 text-white border-amber-400'
                                    }`}
                                  >
                                    <span className={`material-symbols-outlined ${selectedOrderDetails.preparation_status === 'preparando' ? 'animate-pulse' : ''}`}>
                                      {selectedOrderDetails.preparation_status === 'pronto' ? 'check_circle' : 'restaurant'}
                                    </span>
                                    <span className="text-xs font-black uppercase tracking-widest">
                                      {selectedOrderDetails.preparation_status === 'pronto' ? 'Pronto' : 'Preparando'}
                                    </span>
                                  </button>
                               </div>
                          </div>

                          {/* Items Section */}
                          <div>
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">Itens do Pedido</h4>
                              <div className="space-y-3">
                                  {selectedOrderDetails.items && Array.isArray(selectedOrderDetails.items) && selectedOrderDetails.items.length > 0 ? (
                                      <>
                                          {selectedOrderDetails.items.map((it: any, idx: number) => (
                                              <div key={idx} className="flex justify-between items-start p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 group hover:border-primary/20 transition-all">
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
                                                       <span>Taxa de Entrega</span>
                                                       <span className="text-blue-500 font-black">+ R$ {Number(selectedOrderDetails.delivery_fee).toFixed(2).replace('.', ',')}</span>
                                                   </div>
                                               )}
                                               {selectedOrderDetails.discount > 0 && (
                                                   <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                       <div className="flex items-center gap-1">
                                                           <span>Desconto Aplicado</span>
                                                           {selectedOrderDetails.coupon_code && (
                                                               <span className="px-1.5 py-0.5 bg-rose-50 text-rose-500 rounded border border-rose-100 text-[8px] font-black">{selectedOrderDetails.coupon_code}</span>
                                                           )}
                                                       </div>
                                                       <span className="text-rose-500 font-black">- R$ {Number(selectedOrderDetails.discount).toFixed(2).replace('.', ',')}</span>
                                                   </div>
                                               )}
                                                                                               <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                                                   <div className="flex items-center gap-1">
                                                       <span>Comissão IZI ({merchantProfile?.commission_percent ?? appSettings?.appCommission ?? 12}%)</span>
                                                   </div>
                                                   <span className="text-rose-500 font-black">- R$ {((Number(selectedOrderDetails.total_price || 0) - Number(selectedOrderDetails.delivery_fee || 0) - Number(selectedOrderDetails.service_fee || 0)) * ((merchantProfile?.commission_percent ?? appSettings?.appCommission ?? 12) / 100)).toFixed(2).replace('.', ',')}</span>
                                               </div>
                                               <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Líquido (Recebe)</span>
                                                   <span className="text-xl font-black text-emerald-500 italic">R$ {( (Number(selectedOrderDetails.total_price || 0) - Number(selectedOrderDetails.delivery_fee || 0) - Number(selectedOrderDetails.service_fee || 0)) * (1 - (merchantProfile?.commission_percent ?? appSettings?.appCommission ?? 12) / 100) ).toFixed(2).replace('.', ',')}</span>
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

                                          {/* Resumo Financeiro Legado */}
                                          <div className="mt-6 p-6 rounded-3xl bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 space-y-3">
                                               <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                   <span>Subtotal</span>
                                                   <span>R$ {Number(selectedOrderDetails.total_price - (selectedOrderDetails.delivery_fee || 0) + (selectedOrderDetails.discount || 0)).toFixed(2).replace('.', ',')}</span>
                                               </div>
                                               {selectedOrderDetails.delivery_fee > 0 && (
                                                   <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                       <span>Taxa de Entrega</span>
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
                                                                                               <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                                                   <div className="flex items-center gap-1">
                                                       <span>Comissão IZI ({merchantProfile?.commission_percent ?? appSettings?.appCommission ?? 12}%)</span>
                                                   </div>
                                                   <span className="text-rose-500 font-black">- R$ {((Number(selectedOrderDetails.total_price || 0) - Number(selectedOrderDetails.delivery_fee || 0) - Number(selectedOrderDetails.service_fee || 0)) * ((merchantProfile?.commission_percent ?? appSettings?.appCommission ?? 12) / 100)).toFixed(2).replace('.', ',')}</span>
                                               </div>
                                               <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Líquido (Recebe)</span>
                                                   <span className="text-xl font-black text-emerald-500 italic">R$ {( (Number(selectedOrderDetails.total_price || 0) - Number(selectedOrderDetails.delivery_fee || 0) - Number(selectedOrderDetails.service_fee || 0)) * (1 - (merchantProfile?.commission_percent ?? appSettings?.appCommission ?? 12) / 100) ).toFixed(2).replace('.', ',')}</span>
                                               </div>
                                          </div>
                                      </div>
                                  ) : (
                                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 border-dashed text-center opacity-60">
                                          <p className="text-xs font-bold text-slate-400">Detalhes dos itens não disponíveis</p>
                                      </div>
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
                                      {selectedOrderDetails.user_name || 'Usuário Izi'}
                                  </p>
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
                                      <p className="text-base font-black uppercase tracking-widest">
                                          {selectedOrderDetails.status === 'pendente_pagamento' ? 'Aguardando Confirmação do Pagamento' :
                                           selectedOrderDetails.status === 'waiting_merchant' ? 'Aguardando Aprovação' : 
                                           selectedOrderDetails.status === 'preparando' ? 'Em Preparação' : 
                                           selectedOrderDetails.status === 'waiting_driver' || selectedOrderDetails.status === 'pending' ? 'Buscando Entregador' : 
                                           ['accepted', 'a_caminho_coleta', 'no_local_coleta'].includes(selectedOrderDetails.status) ? 'Entregador vindo coletar' :
                                           selectedOrderDetails.status === 'chegou_coleta' ? 'Entregador no Estabelecimento' :
                                           ['picked_up', 'em_rota', 'a_caminho', 'saiu_para_entrega'].includes(selectedOrderDetails.status) ? 'Pedido saiu para entrega' :
                                           selectedOrderDetails.status === 'concluido' ? 'Pedido Finalizado' : selectedOrderDetails.status}
                                      </p>
                                  </div>
                              </div>

                               {/* Controle de Preparação no Modal */}
                               <div className="flex items-center gap-2">
                                  <button
                                    disabled={localProcessingId === selectedOrderDetails.id}
                                    onClick={() => handleTogglePreparation(selectedOrderDetails.id, selectedOrderDetails.preparation_status || 'preparando')}
                                    className={`px-6 py-3 rounded-2xl border-2 flex items-center gap-2 transition-all ${
                                      selectedOrderDetails.preparation_status === 'pronto'
                                        ? 'bg-emerald-500 text-white border-emerald-400'
                                        : 'bg-amber-500 text-white border-amber-400'
                                    }`}
                                  >
                                    <span className={`material-symbols-outlined ${selectedOrderDetails.preparation_status === 'preparando' ? 'animate-pulse' : ''}`}>
                                      {selectedOrderDetails.preparation_status === 'pronto' ? 'check_circle' : 'restaurant'}
                                    </span>
                                    <span className="text-xs font-black uppercase tracking-widest">
                                      {selectedOrderDetails.preparation_status === 'pronto' ? 'Pronto' : 'Preparando'}
                                    </span>
                                  </button>
                               </div>
                          </div>

                          {/* Items Section */}
                          <div>
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">Itens do Pedido</h4>
                              <div className="space-y-3">
                                  {selectedOrderDetails.items && Array.isArray(selectedOrderDetails.items) && selectedOrderDetails.items.length > 0 ? (
                                      <>
                                          {selectedOrderDetails.items.map((it: any, idx: number) => (
                                              <div key={idx} className="flex justify-between items-start p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 group hover:border-primary/20 transition-all">
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
                                                       <span>Taxa de Entrega</span>
                                                       <span className="text-blue-500 font-black">+ R$ {Number(selectedOrderDetails.delivery_fee).toFixed(2).replace('.', ',')}</span>
                                                   </div>
                                               )}
                                               {selectedOrderDetails.discount > 0 && (
                                                   <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                       <div className="flex items-center gap-1">
                                                           <span>Desconto Aplicado</span>
                                                           {selectedOrderDetails.coupon_code && (
                                                               <span className="px-1.5 py-0.5 bg-rose-50 text-rose-500 rounded border border-rose-100 text-[8px] font-black">{selectedOrderDetails.coupon_code}</span>
                                                           )}
                                                       </div>
                                                       <span className="text-rose-500 font-black">- R$ {Number(selectedOrderDetails.discount).toFixed(2).replace('.', ',')}</span>
                                                   </div>
                                               )}
                                                                                               <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                                                   <div className="flex items-center gap-1">
                                                       <span>Comissão IZI ({merchantProfile?.commission_percent ?? appSettings?.appCommission ?? 12}%)</span>
                                                   </div>
                                                   <span className="text-rose-500 font-black">- R$ {((Number(selectedOrderDetails.total_price || 0) - Number(selectedOrderDetails.delivery_fee || 0) - Number(selectedOrderDetails.service_fee || 0)) * ((merchantProfile?.commission_percent ?? appSettings?.appCommission ?? 12) / 100)).toFixed(2).replace('.', ',')}</span>
                                               </div>
                                               <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Líquido (Recebe)</span>
                                                   <span className="text-xl font-black text-emerald-500 italic">R$ {( (Number(selectedOrderDetails.total_price || 0) - Number(selectedOrderDetails.delivery_fee || 0) - Number(selectedOrderDetails.service_fee || 0)) * (1 - (merchantProfile?.commission_percent ?? appSettings?.appCommission ?? 12) / 100) ).toFixed(2).replace('.', ',')}</span>
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

                                          {/* Resumo Financeiro Legado */}
                                          <div className="mt-6 p-6 rounded-3xl bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 space-y-3">
                                               <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                   <span>Subtotal</span>
                                                   <span>R$ {Number(selectedOrderDetails.total_price - (selectedOrderDetails.delivery_fee || 0) + (selectedOrderDetails.discount || 0)).toFixed(2).replace('.', ',')}</span>
                                               </div>
                                               {selectedOrderDetails.delivery_fee > 0 && (
                                                   <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                       <span>Taxa de Entrega</span>
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
                                                                                               <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                                                   <div className="flex items-center gap-1">
                                                       <span>Comissão IZI ({merchantProfile?.commission_percent ?? appSettings?.appCommission ?? 12}%)</span>
                                                   </div>
                                                   <span className="text-rose-500 font-black">- R$ {((Number(selectedOrderDetails.total_price || 0) - Number(selectedOrderDetails.delivery_fee || 0) - Number(selectedOrderDetails.service_fee || 0)) * ((merchantProfile?.commission_percent ?? appSettings?.appCommission ?? 12) / 100)).toFixed(2).replace('.', ',')}</span>
                                               </div>
                                               <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Líquido (Recebe)</span>
                                                   <span className="text-xl font-black text-emerald-500 italic">R$ {( (Number(selectedOrderDetails.total_price || 0) - Number(selectedOrderDetails.delivery_fee || 0) - Number(selectedOrderDetails.service_fee || 0)) * (1 - (merchantProfile?.commission_percent ?? appSettings?.appCommission ?? 12) / 100) ).toFixed(2).replace('.', ',')}</span>
                                               </div>
                                          </div>
                                      </div>
                                  ) : (
                                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 border-dashed text-center opacity-60">
                                          <p className="text-xs font-bold text-slate-400">Detalhes dos itens não disponíveis</p>
                                      </div>
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
                                      {selectedOrderDetails.user_name || 'Usuário Izi'}
                                  </p>
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
                                  <div className="flex items-end justify-between">
                                       <p className="text-2xl font-black text-emerald-500">R$ {((Number(selectedOrderDetails.total_price || 0) - Number(selectedOrderDetails.delivery_fee || 0) - Number(selectedOrderDetails.service_fee || 0)) * (1 - (merchantProfile?.commission_percent ?? appSettings?.appCommission ?? 12) / 100)).toFixed(2).replace('.', ',')}</p>
                                       {selectedOrderDetails.payment_method === 'dinheiro' && (
                                           <div className="flex flex-col items-end gap-1 mb-1">
                                               <span className="px-2 py-1 bg-rose-100 text-rose-600 rounded-lg text-[8px] font-black uppercase">Receber no local</span>
                                               {selectedOrderDetails.notes && (
                                                   <span className="text-[10px] font-black text-rose-500 uppercase">{selectedOrderDetails.notes}</span>
                                               )}
                                           </div>
                                       )}
                                  </div>
                              </div>
                          </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="p-8 border-t border-slate-100 dark:border-slate-800 flex gap-4 bg-slate-50/50 dark:bg-slate-800/20">
                          {selectedOrderDetails.status === 'pendente_pagamento' && (
                              <>
                                <button
                                    disabled={localProcessingId === selectedOrderDetails.id}
                                    onClick={() => setOrderToCancel(selectedOrderDetails)}
                                    className="flex-1 py-4 rounded-3xl bg-white dark:bg-slate-800 text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] border border-slate-200 dark:border-slate-700 hover:bg-rose-50 hover:text-rose-500 transition-all shadow-sm disabled:opacity-50"
                                >
                                    {localProcessingId === selectedOrderDetails.id ? '...' : 'Cancelar Pedido'}
                                </button>
                                <button
                                    disabled={localProcessingId === selectedOrderDetails.id}
                                    onClick={() => handleAction(selectedOrderDetails.id, 'novo')}
                                    className="flex-[2] py-4 rounded-3xl bg-emerald-500 text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {localProcessingId === selectedOrderDetails.id ? '...' : (
                                      <>
                                        <span className="material-symbols-outlined text-sm">payments</span>
                                        Confirmar Pagamento
                                      </>
                                    )}
                                </button>
                              </>
                          )}
                          {(selectedOrderDetails.status === 'waiting_merchant' || selectedOrderDetails.status === 'novo') && (
                              <>
                                <button 
                                    disabled={localProcessingId === selectedOrderDetails.id}
                                    onClick={() => setOrderToCancel(selectedOrderDetails)}
                                    className="flex-1 py-4 rounded-3xl bg-white dark:bg-slate-800 text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] border border-slate-200 dark:border-slate-700 hover:bg-rose-50 hover:text-rose-500 transition-all shadow-sm disabled:opacity-50"
                                >
                                    {localProcessingId === selectedOrderDetails.id ? '...' : 'Cancelar Pedido'}
                                </button>
                                <button 
                                    disabled={localProcessingId === selectedOrderDetails.id}
                                    onClick={() => handleAction(selectedOrderDetails.id, 'waiting_driver')}
                                    className="flex-[2] py-4 rounded-3xl bg-emerald-500 text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {localProcessingId === selectedOrderDetails.id ? '...' : (
                                      <>
                                        <span className="material-symbols-outlined text-sm">delivery_dining</span>
                                        Aceitar e Chamar
                                      </>
                                    )}
                                </button>
                              </>
                          )}
                          {selectedOrderDetails.status === 'preparando' && (
                              <>
                                <button
                                  disabled={localProcessingId === selectedOrderDetails.id}
                                  onClick={() => setOrderToCancel(selectedOrderDetails)}
                                  className="flex-1 py-4 rounded-3xl bg-white dark:bg-slate-800 text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] border border-slate-200 dark:border-slate-700 hover:bg-rose-50 hover:text-rose-500 transition-all shadow-sm disabled:opacity-50"
                                >
                                  {localProcessingId === selectedOrderDetails.id ? '...' : 'Cancelar Pedido'}
                                </button>
                                <button 
                                  disabled={localProcessingId === selectedOrderDetails.id}
                                  onClick={() => handleAction(selectedOrderDetails.id, 'waiting_driver')}
                                  className="flex-[2] py-4 rounded-3xl bg-blue-500 text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                  {localProcessingId === selectedOrderDetails.id ? '...' : (
                                    <>
                                      <span className="material-symbols-outlined text-sm">delivery_dining</span>
                                      Pronto! Chamar Entregador
                                    </>
                                  )}
                                </button>
                              </>
                          )}
                          {(selectedOrderDetails.status === 'waiting_driver' || selectedOrderDetails.status === 'accepted') && (
                               <>
                                 <button
                                   disabled={localProcessingId === selectedOrderDetails.id}
                                   onClick={() => setOrderToCancel(selectedOrderDetails)}
                                   className="flex-1 py-4 rounded-3xl bg-white dark:bg-slate-800 text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] border border-slate-200 dark:border-slate-700 hover:bg-rose-50 hover:text-rose-500 transition-all shadow-sm disabled:opacity-50"
                                 >
                                   {localProcessingId === selectedOrderDetails.id ? '...' : 'Cancelar Pedido'}
                                 </button>
                                 <div className="flex-[2] flex items-center justify-center p-4 rounded-3xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
                                     <span className="material-symbols-outlined text-blue-500 animate-spin mr-3">autorenew</span>
                                     <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Buscando entregador próximo...</p>
                                 </div>
                               </>
                          )}
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>

      {/* MODAL DE CONFIRMAÇÃO DE CANCELAMENTO E ESTORNO */}
      <AnimatePresence>
         {orderToCancel && (
           <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setOrderToCancel(null)}
               className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl"
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[48px] shadow-2xl overflow-hidden p-8 border border-slate-200 dark:border-slate-800"
             >
               <div className="text-center space-y-6">
                 <div className="size-20 rounded-[32px] bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto shadow-inner shadow-rose-500/20">
                   <span className="material-symbols-outlined text-4xl">cancel</span>
                 </div>
                 
                 <div className="space-y-2">
                   <h3 className="text-2xl font-black text-slate-900 dark:text-white">Confirmar Cancelamento</h3>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                     Esta ação é irreversível e o cliente será notificado imediatamente.
                   </p>
                 </div>

                 {/* Detalhes do Estorno Automático */}
                 <div className="p-6 rounded-[32px] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-4">
                   <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor do Estorno</span>
                     <span className="text-lg font-black text-primary italic">R$ {orderToCancel.total_price?.toFixed(2).replace('.', ',')}</span>
                   </div>
                   <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Método Original</span>
                     <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase px-3 py-1 rounded-full bg-white dark:bg-slate-700 shadow-sm">
                       {orderToCancel.payment_method?.toUpperCase()}
                     </span>
                   </div>
                   <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex items-start gap-3">
                     <span className="material-symbols-outlined text-emerald-500 text-sm">auto_awesome</span>
                     <p className="text-[10px] font-bold text-slate-500 text-left leading-relaxed">
                       {orderToCancel.payment_method === 'dinheiro' 
                         ? 'Este pedido foi marcado como dinheiro. Nenhum estorno digital será processado.'
                         : 'O estorno será processado automaticamente pelo gateway de pagamento IZI.'}
                     </p>
                   </div>
                 </div>

                 <div className="space-y-4 pt-4">
                   <textarea 
                     placeholder="Motivo do cancelamento (opcional)..."
                     value={cancelReason}
                     onChange={(e) => setCancelReason(e.target.value)}
                     className="w-full p-6 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-[32px] text-xs font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-slate-400 min-h-[120px] resize-none"
                   />
                   
                   <div className="flex gap-3">
                     <button 
                       onClick={() => setOrderToCancel(null)}
                       className="flex-1 py-5 rounded-[24px] bg-white dark:bg-slate-800 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] border border-slate-200 dark:border-slate-700 hover:text-slate-600 transition-all"
                     >
                       Voltar
                     </button>
                     <button 
                       disabled={localProcessingId === orderToCancel.id}
                       onClick={() => {
                         handleAction(orderToCancel.id, 'cancelado', cancelReason || 'Cancelado pelo lojista');
                         setOrderToCancel(null);
                         setCancelReason('');
                       }}
                       className="flex-[2] py-5 rounded-[24px] bg-rose-500 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-rose-500/30 hover:bg-rose-600 transition-all flex items-center justify-center gap-2"
                     >
                       {localProcessingId === orderToCancel.id ? 'Processando...' : 'Confirmar e Estornar'}
                     </button>
                   </div>
                 </div>
               </div>
             </motion.div>
           </div>
         )}
      </AnimatePresence>
    </div>
  );
}
