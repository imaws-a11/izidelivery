import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAdmin } from '../context/AdminContext';
import { toastSuccess, toastError, toastInfo } from '../lib/useToast';
import { AddressSearchInput } from './AddressSearchInput';

export default function StandaloneDeliveryTab() {
  const { merchantProfile, appSettings, session, userRole, merchantBalance, fetchMerchantFinance, setShowAddCreditModal } = useAdmin();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [referencePoint, setReferencePoint] = useState('');
  const [deliveryPaymentMethod, setDeliveryPaymentMethod] = useState<'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix' | 'loja' | 'cliente'>('loja');
  const [needsCardMachine, setNeedsCardMachine] = useState(false);
  const [customerPaysCash, setCustomerPaysCash] = useState(false);
  const [needsChange, setNeedsChange] = useState('');
  const [pickupTime, setPickupTime] = useState<'agora' | 'agendado'>('agora');
  const [scheduledPickupTime, setScheduledPickupTime] = useState('');
  const [orderReadiness, setOrderReadiness] = useState<'pronto' | 'preparando'>('pronto');
  const [isFragile, setIsFragile] = useState(false);
  const [hasBeverage, setHasBeverage] = useState(false);
  const [notes, setNotes] = useState('');

  // Lógica de cálculo de frete (simulação baseada em settings)
  const [estimatedFee, setEstimatedFee] = useState<number>(0);
  const [estimatedDistance, setEstimatedDistance] = useState<number>(0);

  const calculateFee = async (address: string) => {
    if (!address || !merchantProfile?.latitude || !merchantProfile?.longitude) return;
    try {
       toastInfo('Calculando rota e taxa...');
       
       // Em um cenário real, usar Google Distance Matrix API
       // Aqui pegamos os valores configurados pelo Admin
       const baseValues = (dynamicRatesState as any)?.baseValues || {};
       const minFee = parseFloat((baseValues.standalone_min || '10,00').replace(',', '.'));
       const kmFee = parseFloat((baseValues.standalone_km || '2,00').replace(',', '.'));

       const distanceKm = Math.random() * 5 + 1; // 1 to 6 km
       setEstimatedDistance(distanceKm);
       
       const fee = minFee + (distanceKm * kmFee);
       setEstimatedFee(fee);
       toastSuccess('Taxa calculada com base nas configurações vigentes.');
    } catch (err) {
       console.error('Erro ao calcular taxa:', err);
    }
  };

  const handleAddressSelect = (addressObj: any) => {
    const addressStr = typeof addressObj === 'string' ? addressObj : (addressObj?.formatted_address || '');
    setDeliveryAddress(addressStr);
    
    // Extrair bairro aproximado ou manter logica anterior
    const parts = addressStr.split('-');
    if (parts.length > 1) {
       setNeighborhood(parts[1].trim().split(',')[0]);
    }
    calculateFee(addressStr);
  };

  const handleCreateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!merchantProfile?.id && userRole !== 'admin') {
      toastError('Lojista não identificado.');
      return;
    }

    if (!deliveryAddress) {
      toastError('Por favor, informe o endereço de entrega.');
      return;
    }

    if (estimatedFee > merchantBalance && userRole !== 'admin') {
      toastError('Saldo insuficiente. Recarregue sua carteira para solicitar a entrega.');
      return;
    }

    setIsSubmitting(true);
    try {
      const trackingCode = `TRK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const payload = {
        user_id: session?.user?.id || merchantProfile?.id, // Assumindo que o admin/lojista é o "criador"
        merchant_id: merchantProfile?.id,
        merchant_name: merchantProfile?.store_name,
        service_type: 'entrega_avulsa',
        status: 'waiting_driver', // Cai direto na busca de entregador
        delivery_address: deliveryAddress,
        total_price: estimatedFee, // O valor do "pedido" aqui é apenas a taxa de entrega
        delivery_fee: estimatedFee,
        payment_method: 'entrega_avulsa', // Identificador interno
        notes: notes,
        
        // Novos campos
        customer_name: customerName,
        customer_phone: customerPhone,
        neighborhood: neighborhood,
        reference_point: referencePoint,
        delivery_payment_method: deliveryPaymentMethod,
        pickup_time: pickupTime === 'agendado' ? scheduledPickupTime : new Date().toISOString(),
        order_readiness: orderReadiness,
        needs_card_machine: needsCardMachine,
        customer_pays_cash: customerPaysCash,
        needs_change: needsChange,
        is_fragile: isFragile,
        has_beverage: hasBeverage,
        tracking_code: trackingCode
      };

      const { data, error } = await supabase.from('orders_delivery').insert([payload]).select();
      
      if (error) throw error;

      toastSuccess(`Entrega solicitada! Código de rastreio: ${trackingCode}`);
      
      // Notifica os entregadores se não for agendado pro futuro distante
      if (pickupTime === 'agora' || orderReadiness === 'pronto') {
         await supabase.functions.invoke('send-push-notification', {
           body: {
             driver_id: 'all',
             merchant_id: merchantProfile?.id,
             title: '🛵 Nova Entrega Avulsa!',
             body: 'Um pacote precisa ser coletado no lojista parceiro. Seja rápido!',
             data: { orderId: data[0].id }
           }
         });
      }

      // Debita da carteira do lojista se não for admin master testando
      if (userRole === 'merchant') {
        const { error: walletError } = await supabase.from('wallet_transactions_delivery').insert([{
          user_id: merchantProfile?.id,
          type: 'saque',
          amount: estimatedFee,
          description: `Taxa de Entrega Avulsa (${trackingCode})`,
          status: 'concluido'
        }]);
        if (walletError) console.error('Erro ao debitar carteira:', walletError);
        
        // Atualiza o saldo localmente
        await fetchMerchantFinance();
      }

      // Reset form
      setCustomerName('');
      setCustomerPhone('');
      setDeliveryAddress('');
      setNeighborhood('');
      setReferencePoint('');
      setNotes('');
      setEstimatedFee(0);
      setEstimatedDistance(0);
    } catch (err: any) {
      console.error('Erro ao criar entrega:', err);
      toastError(err.message || 'Erro ao criar entrega.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 p-4 md:p-8 font-display max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
              <span className="material-symbols-outlined text-3xl text-indigo-500">local_shipping</span>
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight text-shadow-sm uppercase">Entrega Avulsa</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Chame um motoboy para entregas rápidas da sua loja, sem precisar cadastrar produtos.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleCreateDelivery} className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-8">
            
            {/* Seção Cliente */}
            <div>
               <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                 <span className="material-symbols-outlined text-primary">person</span>
                 Dados do Cliente
               </h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Nome do Cliente</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ex: João Silva"
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Telefone (WhatsApp)</label>
                    <input
                      type="text"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Ex: (11) 99999-9999"
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                  </div>
               </div>
            </div>

            <hr className="border-slate-100 dark:border-slate-800" />

            {/* Seção Endereço */}
            <div>
               <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                 <span className="material-symbols-outlined text-primary">location_on</span>
                 Destino da Entrega
               </h2>
               <div className="space-y-4">
                  <div className="space-y-2 relative z-50">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Endereço Completo</label>
                    <AddressSearchInput
                      onSelect={handleAddressSelect}
                      placeholder="Digite a rua, número e cidade..."
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                    {deliveryAddress && (
                        <p className="text-xs text-emerald-500 font-bold mt-1 ml-1 flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">check_circle</span>
                          Endereço selecionado
                        </p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Bairro</label>
                      <input
                        type="text"
                        required
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value)}
                        placeholder="Ex: Centro"
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Ponto de Referência</label>
                      <input
                        type="text"
                        value={referencePoint}
                        onChange={(e) => setReferencePoint(e.target.value)}
                        placeholder="Ex: Próximo ao mercado"
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      />
                    </div>
                  </div>
               </div>
            </div>

            <hr className="border-slate-100 dark:border-slate-800" />

            {/* Seção Pacote e Coleta */}
            <div>
               <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                 <span className="material-symbols-outlined text-primary">inventory_2</span>
                 Sobre o Pacote e Coleta
               </h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                     <p className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Momento da Coleta</p>
                     <div className="flex gap-2">
                        <button type="button" onClick={() => setPickupTime('agora')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${pickupTime === 'agora' ? 'bg-primary text-slate-900 border-2 border-primary' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-2 border-transparent'}`}>Imediata</button>
                        <button type="button" onClick={() => setPickupTime('agendado')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${pickupTime === 'agendado' ? 'bg-primary text-slate-900 border-2 border-primary' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-2 border-transparent'}`}>Agendar</button>
                     </div>
                     {pickupTime === 'agendado' && (
                        <input
                          type="datetime-local"
                          required
                          value={scheduledPickupTime}
                          onChange={(e) => setScheduledPickupTime(e.target.value)}
                          className="w-full mt-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                     )}
                  </div>
                  <div className="space-y-3">
                     <p className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Status do Pacote</p>
                     <div className="flex gap-2">
                        <button type="button" onClick={() => setOrderReadiness('pronto')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${orderReadiness === 'pronto' ? 'bg-emerald-50 text-emerald-600 border-2 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-2 border-transparent'}`}>Já está Pronto</button>
                        <button type="button" onClick={() => setOrderReadiness('preparando')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${orderReadiness === 'preparando' ? 'bg-amber-50 text-amber-600 border-2 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-2 border-transparent'}`}>Em Preparação</button>
                     </div>
                  </div>
               </div>
               
               <div className="flex flex-wrap gap-4 mt-6">
                  <label className="flex items-center gap-2 cursor-pointer group">
                     <div className={`size-6 rounded border-2 flex items-center justify-center transition-all ${isFragile ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 dark:border-slate-600 group-hover:border-primary'}`}>
                        {isFragile && <span className="material-symbols-outlined text-white text-[14px]">check</span>}
                     </div>
                     <input type="checkbox" className="hidden" checked={isFragile} onChange={(e) => setIsFragile(e.target.checked)} />
                     <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Pacote Frágil</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                     <div className={`size-6 rounded border-2 flex items-center justify-center transition-all ${hasBeverage ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 dark:border-slate-600 group-hover:border-primary'}`}>
                        {hasBeverage && <span className="material-symbols-outlined text-white text-[14px]">check</span>}
                     </div>
                     <input type="checkbox" className="hidden" checked={hasBeverage} onChange={(e) => setHasBeverage(e.target.checked)} />
                     <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Contém Bebidas/Líquidos</span>
                  </label>
               </div>
            </div>

            <hr className="border-slate-100 dark:border-slate-800" />

            {/* Seção Pagamento */}
            <div>
               <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                 <span className="material-symbols-outlined text-primary">payments</span>
                 Pagamento do Pedido do Cliente
               </h2>
               <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { id: 'loja', label: 'Já pago na Loja', icon: 'storefront' },
                      { id: 'dinheiro', label: 'Dinheiro', icon: 'payments' },
                      { id: 'cartao_credito', label: 'Crédito', icon: 'credit_card' },
                      { id: 'cartao_debito', label: 'Débito', icon: 'credit_card' },
                      { id: 'pix', label: 'PIX', icon: 'qr_code_scanner' }
                    ].map(pm => (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => {
                           setDeliveryPaymentMethod(pm.id as any);
                           if (pm.id === 'dinheiro') setCustomerPaysCash(true);
                           else setCustomerPaysCash(false);
                           
                           if (pm.id === 'cartao_credito' || pm.id === 'cartao_debito') setNeedsCardMachine(true);
                           else setNeedsCardMachine(false);
                        }}
                        className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 transition-all ${
                          deliveryPaymentMethod === pm.id
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        <span className="material-symbols-outlined">{pm.icon}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-center">{pm.label}</span>
                      </button>
                    ))}
                  </div>

                  {customerPaysCash && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="pt-2">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Precisa de Troco para quanto?</label>
                        <input
                          type="text"
                          value={needsChange}
                          onChange={(e) => setNeedsChange(e.target.value)}
                          placeholder="Ex: Troco para R$ 100,00"
                          className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                      </div>
                    </motion.div>
                  )}
               </div>
            </div>

            <hr className="border-slate-100 dark:border-slate-800" />

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Observações para o Entregador</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Instruções adicionais..."
                className="w-full h-24 resize-none bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting || !deliveryAddress}
              className="w-full bg-primary text-slate-900 py-5 rounded-full font-black uppercase tracking-widest hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin">refresh</span>
                  Processando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">two_wheeler</span>
                  Chamar Entregador
                </>
              )}
            </button>
          </form>
        </div>

        {/* Painel Lateral: Resumo */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-slate-900 rounded-[32px] p-8 border border-slate-800 shadow-xl sticky top-8 text-white relative overflow-hidden">
              {/* Decoration */}
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>

              <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2 mb-6">
                 <span className="material-symbols-outlined text-primary">receipt_long</span>
                 Resumo da Corrida
              </h3>

              <div className="space-y-6 relative z-10">
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Destino</p>
                    <p className="text-sm font-bold line-clamp-2">{deliveryAddress || 'Informe o endereço de entrega para calcular'}</p>
                 </div>

                 {estimatedDistance > 0 && (
                     <div className="flex justify-between items-center pb-4 border-b border-white/10">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Distância Est.</span>
                        <span className="text-sm font-bold">{estimatedDistance.toFixed(1)} km</span>
                     </div>
                 )}

                 <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center mb-2">Valor da Entrega</p>
                    <p className="text-4xl font-black text-center text-primary">
                       R$ {estimatedFee.toFixed(2).replace('.', ',')}
                    </p>
                 </div>

                 {/* Seção de Saldo Pré-pago */}
                 <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex flex-col items-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Seu Saldo Izi</p>
                    <p className={`text-2xl font-black ${merchantBalance < estimatedFee ? 'text-red-400' : 'text-emerald-400'}`}>
                       R$ {merchantBalance.toFixed(2).replace('.', ',')}
                    </p>
                    
                    {merchantBalance < estimatedFee && estimatedFee > 0 && (
                      <p className="text-xs text-red-400 font-bold mt-2 text-center bg-red-400/10 p-2 rounded-lg w-full">
                        Saldo Insuficiente
                      </p>
                    )}

                    <button 
                      type="button"
                      onClick={() => setShowAddCreditModal(true)}
                      className="mt-4 w-full py-2 bg-white/10 hover:bg-white/20 transition-all rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
                      Recarregar Saldo
                    </button>
                 </div>

                 <div className="text-center mt-4">
                    <p className="text-[10px] font-bold text-slate-400 leading-relaxed">
                       O valor da entrega avulsa é debitado automaticamente do seu saldo Izi. Recarregue sua carteira para não ficar sem entregadores.
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
