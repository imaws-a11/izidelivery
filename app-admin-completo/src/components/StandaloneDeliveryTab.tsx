import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAdmin } from '../context/AdminContext';
import { toastSuccess, toastError, toastInfo } from '../lib/useToast';
import { AddressSearchInput } from './AddressSearchInput';
import MerchantOrdersTracking from './MerchantOrdersTracking';

export default function StandaloneDeliveryTab() {
  const { 
    merchantProfile, appSettings, session, userRole, merchantBalance, 
    fetchMerchantFinance, setShowAddCreditModal, dynamicRatesState,
    draftStandaloneOrder, setDraftStandaloneOrder, merchantZones
  } = useAdmin();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [referencePoint, setReferencePoint] = useState('');

  // Pre-fill from draft
  React.useEffect(() => {
    if (draftStandaloneOrder) {
      setCustomerName(draftStandaloneOrder.customer_name || draftStandaloneOrder.user_name || '');
      setCustomerPhone(draftStandaloneOrder.customer_phone || '');
      setDeliveryAddress(draftStandaloneOrder.delivery_address?.split('| ITENS:')[0]?.trim() || '');
      setNeighborhood(draftStandaloneOrder.neighborhood || '');
      setReferencePoint(draftStandaloneOrder.reference_point || '');
      setDeliveryPaymentMethod(draftStandaloneOrder.delivery_payment_method || 'loja');
      
      // Se tiver endereço, já calcula o frete
      if (draftStandaloneOrder.delivery_address) {
        calculateFee(
          draftStandaloneOrder.delivery_address.split('| ITENS:')[0]?.trim(),
          { lat: draftStandaloneOrder.lat, lng: draftStandaloneOrder.lng },
          draftStandaloneOrder.neighborhood
        );
      }

      setDraftStandaloneOrder(null);
      toastInfo('Dados do pedido anterior carregados no painel.');
    }
  }, [draftStandaloneOrder]);

  const [deliveryPaymentMethod, setDeliveryPaymentMethod] = useState<string>('loja');
  const [needsCardMachine, setNeedsCardMachine] = useState(false);
  const [customerPaysCash, setCustomerPaysCash] = useState(false);
  const [needsChange, setNeedsChange] = useState('');
  const [pickupTime, setPickupTime] = useState<'agora' | 'agendado'>('agora');
  const [scheduledPickupTime, setScheduledPickupTime] = useState('');
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(0);
  const [selectedHour, setSelectedHour] = useState<number>(new Date().getHours());
  const [selectedMinute, setSelectedMinute] = useState<number>(Math.ceil(new Date().getMinutes() / 5) * 5 % 60);

  // Sincronizar estados customizados com o scheduledPickupTime
  React.useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + selectedDayOffset);
    d.setHours(selectedHour, selectedMinute, 0, 0);
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dayNum = String(d.getDate()).padStart(2, '0');
    const hourNum = String(d.getHours()).padStart(2, '0');
    const minuteNum = String(d.getMinutes()).padStart(2, '0');
    
    setScheduledPickupTime(`${year}-${month}-${dayNum}T${hourNum}:${minuteNum}`);
  }, [selectedDayOffset, selectedHour, selectedMinute]);
  const [orderReadiness, setOrderReadiness] = useState<'pronto' | 'preparando'>('pronto');
  const [isFragile, setIsFragile] = useState(false);
  const [hasBeverage, setHasBeverage] = useState(false);
  const [notes, setNotes] = useState('');

  // Lógica de cálculo de frete
  const [estimatedFee, setEstimatedFee] = useState<number>(0);
  const [estimatedDistance, setEstimatedDistance] = useState<number>(0);

  const calculateFee = async (address: string, coords?: { lat: number; lng: number }, selectedNeighborhood?: string) => {
    if (!address || !merchantProfile?.latitude || !merchantProfile?.longitude) {
      return;
    }

    try {
       const baseValues = (dynamicRatesState as any)?.baseValues || {};
       
       const safeParse = (val: any, fallback: string) => {
          if (val === undefined || val === null) return parseFloat(fallback.replace(',', '.'));
          if (typeof val === 'number') return val;
          const str = String(val).replace(',', '.');
          return parseFloat(str) || parseFloat(fallback.replace(',', '.'));
       };

       const minFee = safeParse(baseValues.standalone_min, '10,00');
       const kmFee = safeParse(baseValues.standalone_km, '2,00');
       const kmInterval = safeParse(baseValues.standalone_km_interval, '1');

       // 1. Verificar se é modo Bairros
       const isNeighborhoodMode = merchantProfile?.delivery_coverage_mode === 'neighborhoods';
       const targetNeighborhood = selectedNeighborhood || neighborhood;

       if (isNeighborhoodMode && targetNeighborhood) {
         const zone = (merchantZones || []).find(z => 
           z.neighborhood?.toLowerCase().trim() === targetNeighborhood.toLowerCase().trim()
         );
         if (zone) {
           const fee = typeof zone.fee === 'string' ? parseFloat(zone.fee.replace(',', '.')) : zone.fee;
           setEstimatedFee(fee);
           setEstimatedDistance(0);
           return;
         }
       }

       // 2. Cálculo por KM
       let distanceKm = 1.5; 
       
       if (coords?.lat && coords?.lng && (window as any).google?.maps?.geometry?.spherical) {
         const p1 = new (window as any).google.maps.LatLng(merchantProfile.latitude, merchantProfile.longitude);
         const p2 = new (window as any).google.maps.LatLng(coords.lat, coords.lng);
         const meters = (window as any).google.maps.geometry.spherical.computeDistanceBetween(p1, p2);
         distanceKm = meters / 1000;
       } else if (coords?.lat && coords?.lng) {
         const R = 6371; 
         const dLat = (coords.lat - merchantProfile.latitude) * Math.PI / 180;
         const dLon = (coords.lng - merchantProfile.longitude) * Math.PI / 180;
         const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                   Math.cos(merchantProfile.latitude * Math.PI / 180) * Math.cos(coords.lat * Math.PI / 180) *
                   Math.sin(dLon/2) * Math.sin(dLon/2);
         const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
         distanceKm = R * c;
       }

       setEstimatedDistance(distanceKm);
       
       const finalFee = minFee + (distanceKm * (kmFee / Math.max(0.1, kmInterval)));
       setEstimatedFee(finalFee);
    } catch (err) {
       console.error('Erro ao calcular taxa:', err);
    }
  };

  const handleAddressSelect = (addressObj: any) => {
    const addressStr = addressObj?.formatted_address || '';
    setDeliveryAddress(addressStr);
    
    const extractedNeighborhood = addressObj?.neighborhood || '';
    if (extractedNeighborhood) {
      setNeighborhood(extractedNeighborhood);
    } else {
      const parts = addressStr.split('-');
      if (parts.length > 1) {
         setNeighborhood(parts[1].trim().split(',')[0]);
      }
    }

    calculateFee(addressStr, { lat: addressObj?.lat, lng: addressObj?.lng }, extractedNeighborhood);
  };

  const handleCreateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!merchantProfile?.id && userRole !== 'admin') {
      toastError('Lojista não identificado no sistema.');
      return;
    }

    if (!deliveryAddress) {
      toastError('Por favor, informe o endereço completo de entrega.');
      return;
    }

    if (estimatedFee > merchantBalance && userRole !== 'admin') {
      toastError('Saldo insuficiente na sua carteira para solicitar esta entrega.');
      return;
    }

    setIsSubmitting(true);
    try {
      const trackingCode = `TRK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const finalNotes = needsChange 
        ? `${notes ? notes + ' | ' : ''}TROCO: ${needsChange}`
        : notes;

      const payload = {
        user_id: null,
        merchant_id: merchantProfile?.id,
        merchant_name: merchantProfile?.store_name,
        service_type: 'entrega_avulsa',
        status: pickupTime === 'agendado' ? 'agendado' : 'waiting_driver',
        pickup_address: merchantProfile?.store_address || '',
        delivery_address: deliveryAddress,
        delivery_lat: merchantProfile?.latitude || null,
        delivery_lng: merchantProfile?.longitude || null,
        total_price: estimatedFee,
        delivery_fee: estimatedFee,
        payment_method: 'entrega_avulsa',
        payment_status: 'paid',
        user_name: customerName,
        notes: finalNotes,
        
        customer_name: customerName,
        customer_phone: customerPhone,
        neighborhood: neighborhood,
        reference_point: referencePoint,
        delivery_payment_method: deliveryPaymentMethod,
        pickup_time: pickupTime === 'agendado' ? scheduledPickupTime : new Date().toISOString(),
        scheduled_at: pickupTime === 'agendado' ? scheduledPickupTime : null,
        order_readiness: orderReadiness,
        needs_card_machine: !!needsCardMachine,
        customer_pays_cash: !!customerPaysCash,
        needs_change: !!needsChange,
        is_fragile: !!isFragile,
        has_beverage: !!hasBeverage,
        tracking_code: trackingCode
      };

      const { data, error } = await supabase.from('orders_delivery').insert([payload]).select();
      
      if (error) throw error;

      toastSuccess(`Entrega solicitada! Código de rastreio: ${trackingCode}`);
      
      if (pickupTime === 'agendado') {
         await supabase.functions.invoke('send-push-notification', {
           body: {
             driver_id: 'all',
             merchant_id: merchantProfile?.id,
             title: '📅 Novo Agendamento Disponível!',
             body: 'Um novo serviço agendado foi adicionado. Confira sua agenda!',
             data: { orderId: data[0].id }
           }
         });
      } else if (pickupTime === 'agora' || orderReadiness === 'pronto') {
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

      if (userRole === 'merchant') {
        const { error: walletError } = await supabase.from('wallet_transactions_delivery').insert([{
          user_id: merchantProfile?.id,
          type: 'saque',
          amount: estimatedFee,
          description: `Taxa de Entrega Avulsa (${trackingCode})`,
          status: 'concluido'
        }]);
        if (walletError) console.error('Erro ao debitar carteira:', walletError);
        
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
      toastError(err.message || 'Erro ao criar entrega avulsa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper para gerar dados de teste para o parceiro
  const handleFillTestData = () => {
    setCustomerName('Cliente de Teste Izi');
    setCustomerPhone('(79) 99999-8888');
    setNotes('Entregar sem fazer barulho. Deixar na recepção.');
    toastInfo('Dados fictícios de teste carregados com sucesso!');
  };

  return (
    <div className="space-y-12 p-6 md:p-12 max-w-6xl mx-auto font-['Plus_Jakarta_Sans'] relative overflow-hidden">
      
      {/* Background Gradient Orbs for Premium Glassmorphism */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-80 right-10 w-96 h-96 bg-purple-500/15 rounded-full blur-[150px] pointer-events-none" />
      
      {/* Ultra-Premium Glassmorphic Header Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-800 rounded-[40px] p-8 md:p-10 shadow-2xl border border-white/10 shrink-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-60" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full border border-white/20 text-[9px] font-black text-white uppercase tracking-[0.2em]">
              <span className="material-symbols-outlined text-[10px] animate-pulse">rocket_launch</span>
              Plano Exclusivo
            </span>
            <div className="space-y-2">
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic leading-none drop-shadow-md">
                Entrega Avulsa
              </h1>
              <p className="text-indigo-100 text-xs md:text-sm font-bold max-w-lg leading-relaxed">
                Logística de alta performance instantânea para o seu negócio. Solicite um piloto com apenas dois toques e acompanhe em tempo real.
              </p>
            </div>
          </div>

          {/* Quick Action Widget for Balance */}
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 flex flex-col min-w-[240px] relative overflow-hidden group shadow-lg">
            <span className="text-[9px] font-black text-indigo-200 uppercase tracking-widest block mb-1">Seu Saldo Disponível</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-indigo-300">R$</span>
              <span className="text-3xl font-black text-white tracking-tight">
                {merchantBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            
            <div className="mt-4 flex gap-2">
              <button 
                onClick={() => setShowAddCreditModal(true)}
                className="flex-1 py-2.5 bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-slate-950 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 shadow-md shadow-yellow-400/20"
              >
                <span className="material-symbols-outlined text-[12px] font-bold">add_circle</span>
                Recarregar
              </button>
              <button 
                onClick={handleFillTestData}
                className="py-2.5 px-3 bg-white/15 hover:bg-white/25 active:scale-95 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1"
                title="Preencher com dados fictícios para testar fluxo"
              >
                <span className="material-symbols-outlined text-[12px]">biotech</span>
                Teste
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Form Column */}
        <div className="lg:col-span-2 space-y-8">
          <form onSubmit={handleCreateDelivery} className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-[40px] p-8 md:p-10 border border-white/50 dark:border-slate-800/50 shadow-2xl space-y-10">
            
            {/* Section 1: Cliente */}
            <div className="space-y-6">
               <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                 <div className="size-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0 shadow-inner">
                   <span className="material-symbols-outlined text-xl font-bold">person</span>
                 </div>
                 <div>
                   <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] leading-none mb-1">
                     Dados do Destinatário
                   </h2>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Quem receberá a entrega no destino</p>
                 </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Nome do Cliente</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg">badge</span>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Ex: João da Silva"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Telefone (WhatsApp)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg">call</span>
                      <input
                        type="text"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Ex: (79) 99999-9999"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm"
                      />
                    </div>
                  </div>
               </div>
            </div>

            {/* Section 2: Endereço */}
            <div className="space-y-6">
               <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                 <div className="size-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0 shadow-inner">
                   <span className="material-symbols-outlined text-xl font-bold">location_on</span>
                 </div>
                 <div>
                   <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] leading-none mb-1">
                     Destino da Entrega
                   </h2>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Endereço exato onde o pacote será deixado</p>
                 </div>
               </div>

               <div className="space-y-6">
                  <div className="space-y-2 relative z-50">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Endereço Completo (Autocomplete)</label>
                    <AddressSearchInput
                      onSelect={handleAddressSelect}
                      placeholder="Digite a rua, número e cidade..."
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-2xl px-6 py-4.5 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm"
                    />
                    {deliveryAddress && (
                      <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-widest mt-2 ml-3 flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-500/10 w-fit">
                        <span className="material-symbols-outlined text-xs animate-ping">circle</span>
                        Geolocalização Ativa e Confirmada
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Bairro</label>
                      <input
                        type="text"
                        required
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value)}
                        placeholder="Ex: Centro"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Ponto de Referência</label>
                      <input
                        type="text"
                        value={referencePoint}
                        onChange={(e) => setReferencePoint(e.target.value)}
                        placeholder="Ex: Próximo à farmácia Pague Menos"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm"
                      />
                    </div>
                  </div>
               </div>
            </div>

            {/* Section 3: Detalhes do Pacote */}
            <div className="space-y-6">
               <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                 <div className="size-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0 shadow-inner">
                   <span className="material-symbols-outlined text-xl font-bold">inventory_2</span>
                 </div>
                 <div>
                   <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] leading-none mb-1">
                     Logística & Coleta
                   </h2>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Informações físicas e operacionais do pacote</p>
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Momento da Coleta</p>
                     <div className="flex p-1 bg-slate-100/50 dark:bg-slate-950 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
                        <button 
                          type="button" 
                          onClick={() => setPickupTime('agora')} 
                          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            pickupTime === 'agora' 
                              ? 'bg-white dark:bg-slate-850 text-indigo-600 shadow-md' 
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          Coleta Imediata
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setPickupTime('agendado')} 
                          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            pickupTime === 'agendado' 
                              ? 'bg-white dark:bg-slate-850 text-indigo-600 shadow-md' 
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          Agendar Horário
                        </button>
                     </div>
                  </div>

                  <div className="space-y-3">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Status de Preparo</p>
                     <div className="flex p-1 bg-slate-100/50 dark:bg-slate-950 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
                        <button 
                          type="button" 
                          onClick={() => setOrderReadiness('pronto')} 
                          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            orderReadiness === 'pronto' 
                              ? 'bg-emerald-500 text-white shadow-md' 
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          Já está Pronto
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setOrderReadiness('preparando')} 
                          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            orderReadiness === 'preparando' 
                              ? 'bg-amber-500 text-white shadow-md' 
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          Em Preparação
                        </button>
                     </div>
                  </div>
               </div>

               {/* Dedicated Card for Datetime Picker on Scheduling */}
               <AnimatePresence>
                  {pickupTime === 'agendado' && (
                     <motion.div
                       initial={{ opacity: 0, y: -20, height: 0 }}
                       animate={{ opacity: 1, y: 0, height: 'auto' }}
                       exit={{ opacity: 0, y: -20, height: 0 }}
                       transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                       className="overflow-hidden mt-6"
                     >
                       <div className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 dark:from-amber-500/10 dark:to-orange-500/10 p-6 rounded-[32px] border border-amber-500/20 shadow-lg space-y-6">
                          <div className="flex items-center gap-3">
                             <div className="size-11 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                                <span className="material-symbols-outlined text-xl">calendar_month</span>
                             </div>
                             <div>
                                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none mb-1">
                                   Programação do Agendamento
                                </h4>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                   Configuração interativa com design minimalista de vidro
                                </p>
                             </div>
                          </div>
                          
                          {/* Seletor Horizontal de Próximos 7 Dias */}
                          <div className="space-y-2">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Selecione o Dia</span>
                             <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                {(() => {
                                   const days = [];
                                   const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                                   for (let i = 0; i < 7; i++) {
                                      const d = new Date();
                                      d.setDate(d.getDate() + i);
                                      days.push({
                                         offset: i,
                                         dayNum: d.getDate(),
                                         dayName: i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : weekdays[d.getDay()],
                                         monthName: d.toLocaleString('pt-BR', { month: 'short' }).replace('.', '')
                                      });
                                   }
                                   return days.map(d => {
                                      const isSelected = selectedDayOffset === d.offset;
                                      return (
                                         <button
                                            key={d.offset}
                                            type="button"
                                            onClick={() => setSelectedDayOffset(d.offset)}
                                            className={`px-4 py-3 rounded-2xl flex flex-col items-center justify-center min-w-[76px] border-2 transition-all active:scale-95 shrink-0 ${
                                               isSelected
                                                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 border-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/25'
                                                  : 'bg-white/5 dark:bg-slate-950/40 border-white/10 dark:border-slate-800/80 text-slate-400 hover:text-slate-200'
                                            }`}
                                         >
                                            <span className="text-[9px] font-black uppercase tracking-wider">{d.dayName}</span>
                                            <span className="text-xl font-black mt-0.5 leading-none">{d.dayNum}</span>
                                            <span className="text-[8px] font-bold uppercase tracking-widest mt-0.5 opacity-80">{d.monthName}</span>
                                         </button>
                                      );
                                   });
                                })()}
                             </div>
                          </div>

                          {/* Seletor Ajustável de Hora e Minutos */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-white/5 pt-4">
                             <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hora</span>
                                   <span className="text-xs font-black text-amber-500">{String(selectedHour).padStart(2, '0')}h</span>
                                </div>
                                <div className="flex items-center gap-3 bg-white/5 dark:bg-slate-950/40 border border-white/10 dark:border-slate-800/80 rounded-2xl p-2.5">
                                   <button
                                      type="button"
                                      onClick={() => setSelectedHour(prev => Math.max(0, prev - 1))}
                                      className="size-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold active:scale-90 transition-all shrink-0"
                                   >
                                      <span className="material-symbols-outlined text-sm font-black">remove</span>
                                   </button>
                                   <input
                                      type="range"
                                      min="0"
                                      max="23"
                                      value={selectedHour}
                                      onChange={(e) => setSelectedHour(parseInt(e.target.value))}
                                      className="flex-1 accent-amber-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                   />
                                   <button
                                      type="button"
                                      onClick={() => setSelectedHour(prev => Math.min(23, prev + 1))}
                                      className="size-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold active:scale-90 transition-all shrink-0"
                                   >
                                      <span className="material-symbols-outlined text-sm font-black">add</span>
                                   </button>
                                </div>
                             </div>

                             <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Minutos</span>
                                   <span className="text-xs font-black text-amber-500">{String(selectedMinute).padStart(2, '0')} min</span>
                                </div>
                                <div className="flex items-center gap-3 bg-white/5 dark:bg-slate-950/40 border border-white/10 dark:border-slate-800/80 rounded-2xl p-2.5">
                                   <button
                                      type="button"
                                      onClick={() => setSelectedMinute(prev => (prev - 5 + 60) % 60)}
                                      className="size-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold active:scale-90 transition-all shrink-0"
                                   >
                                      <span className="material-symbols-outlined text-sm font-black">remove</span>
                                   </button>
                                   <input
                                      type="range"
                                      min="0"
                                      max="59"
                                      step="5"
                                      value={selectedMinute}
                                      onChange={(e) => setSelectedMinute(parseInt(e.target.value))}
                                      className="flex-1 accent-amber-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                   />
                                   <button
                                      type="button"
                                      onClick={() => setSelectedMinute(prev => (prev + 5) % 60)}
                                      className="size-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold active:scale-90 transition-all shrink-0"
                                   >
                                      <span className="material-symbols-outlined text-sm font-black">add</span>
                                   </button>
                                </div>
                             </div>
                          </div>

                          {/* Resumo do Agendamento */}
                          <div className="bg-white/5 dark:bg-slate-950/50 p-4 rounded-2xl border border-white/5 dark:border-slate-850 flex items-center justify-between text-xs mt-4">
                             <span className="font-bold text-slate-400 uppercase tracking-wider">Horário Final</span>
                             <div className="flex items-center gap-2 bg-amber-500/20 text-amber-400 px-3.5 py-1.5 rounded-xl font-black uppercase tracking-wider border border-amber-500/30">
                                <span className="material-symbols-outlined text-sm">alarm</span>
                                {(() => {
                                   const d = new Date();
                                   d.setDate(d.getDate() + selectedDayOffset);
                                   const weekdays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
                                   const dayText = selectedDayOffset === 0 ? 'Hoje' : selectedDayOffset === 1 ? 'Amanhã' : weekdays[d.getDay()];
                                   const formattedTime = `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;
                                   return `${dayText} às ${formattedTime}`;
                                })()}
                             </div>
                          </div>
                       </div>
                       </motion.div>
                  )}
               </AnimatePresence>
               
               {/* Checkboxes de Cuidados Especiais com Efeito Glass e Cores */}
               <div className="flex flex-wrap gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsFragile(!isFragile)}
                    className={`flex items-center gap-3 px-5 py-3 rounded-2xl border-2 transition-all ${
                      isFragile
                        ? 'bg-red-500/10 border-red-500/30 text-red-500'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-850 text-slate-400 hover:border-slate-200'
                    }`}
                  >
                     <span className={`material-symbols-outlined text-lg ${isFragile ? 'animate-bounce' : ''}`}>warning</span>
                     <span className="text-[10px] font-black uppercase tracking-wider">Conteúdo Frágil</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHasBeverage(!hasBeverage)}
                    className={`flex items-center gap-3 px-5 py-3 rounded-2xl border-2 transition-all ${
                      hasBeverage
                        ? 'bg-blue-500/10 border-blue-500/30 text-blue-500'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-850 text-slate-400 hover:border-slate-200'
                    }`}
                  >
                     <span className="material-symbols-outlined text-lg">local_cafe</span>
                     <span className="text-[10px] font-black uppercase tracking-wider">Contém Líquidos / Bebidas</span>
                  </button>
               </div>
            </div>

            {/* Section 4: Pagamento do Cliente */}
            <div className="space-y-6">
               <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                 <div className="size-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0 shadow-inner">
                   <span className="material-symbols-outlined text-xl font-bold">payments</span>
                 </div>
                 <div>
                   <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] leading-none mb-1">
                     Cobrança no Destino
                   </h2>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Como seu cliente pagará pelo produto na entrega</p>
                 </div>
               </div>

               <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                     {[
                       { id: 'loja', label: 'Pago na Loja', icon: 'storefront', color: 'border-emerald-500 text-emerald-500 bg-emerald-500/10' },
                       { id: 'dinheiro', label: 'Dinheiro', icon: 'payments', color: 'border-yellow-500 text-yellow-500 bg-yellow-500/10' },
                       { id: 'cartao', label: 'Cartão', icon: 'credit_card', color: 'border-indigo-500 text-indigo-500 bg-indigo-500/10' },
                       { id: 'pix', label: 'PIX', icon: 'qr_code_scanner', color: 'border-cyan-500 text-cyan-500 bg-cyan-500/10' },
                       { id: 'bitcoin_lightning', label: 'Lightning BTC', icon: 'currency_bitcoin', color: 'border-amber-500 text-amber-500 bg-amber-500/10' }
                     ].map(pm => {
                       const isSelected = deliveryPaymentMethod === pm.id;
                       return (
                         <button
                           key={pm.id}
                           type="button"
                           onClick={() => {
                              setDeliveryPaymentMethod(pm.id);
                              if (pm.id === 'dinheiro') setCustomerPaysCash(true);
                              else setCustomerPaysCash(false);
                              
                              if (pm.id === 'cartao') setNeedsCardMachine(true);
                              else setNeedsCardMachine(false);
                           }}
                          className={`p-4 rounded-3xl flex flex-col items-center justify-center gap-2 border-2 transition-all active:scale-95 ${
                            isSelected
                              ? pm.color + ' shadow-md shadow-slate-900/5 dark:shadow-black/20'
                              : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800/80 text-slate-400 hover:border-slate-200 dark:hover:border-slate-700'
                          }`}
                        >
                          <span className="material-symbols-outlined text-xl">{pm.icon}</span>
                          <span className="text-[9px] font-black uppercase tracking-widest text-center">{pm.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <AnimatePresence>
                    {customerPaysCash && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-2 pt-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Precisa de Troco para quanto?</label>
                          <input
                            type="text"
                            value={needsChange}
                            onChange={(e) => setNeedsChange(e.target.value)}
                            placeholder="Ex: Troco para R$ 100,00"
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>
            </div>

            <hr className="border-slate-100 dark:border-slate-800" />

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Instruções Importantes para o Piloto</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Tocar o interfone 203. Deixar a caixa reta..."
                className="w-full h-28 resize-none bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm"
              />
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting || !deliveryAddress}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-indigo-600/30 hover:shadow-indigo-500/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-indigo-400/20"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-lg">sync</span>
                  Injetando Pedido na Nuvem...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">local_shipping</span>
                  Chamar Motoboy Agora
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Calculator & Live Stats Sidebar */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-slate-950 dark:bg-slate-950 rounded-[40px] p-8 border border-white/10 shadow-2xl text-white relative overflow-hidden space-y-8 sticky top-8">
              
              {/* Orb Glow Effect inside Sidebar */}
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />

              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                 <h3 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-400 font-bold">receipt_long</span>
                    Resumo do Frete
                 </h3>
                 <span className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">Simulado</span>
              </div>

              <div className="space-y-6 relative z-10">
                 <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Ponto de Coleta (Sua Loja)</p>
                    <p className="text-xs font-bold text-slate-300 truncate">{merchantProfile?.store_address || '—'}</p>
                 </div>

                 <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Destino do Cliente</p>
                    <p className="text-xs font-bold text-slate-200 line-clamp-2 leading-relaxed">
                      {deliveryAddress || 'Aguardando preenchimento do endereço...'}
                    </p>
                 </div>

                 {/* Taxa Detalhada Breakdown */}
                 <div className="bg-white/5 rounded-3xl p-5 border border-white/10 space-y-3">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400 font-bold uppercase tracking-wider">Taxa de Partida</span>
                      <span className="text-slate-200 font-black">R$ 10,00</span>
                    </div>
                    {estimatedDistance > 0 && (
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-400 font-bold uppercase tracking-wider">Adicional por KM</span>
                        <span className="text-slate-200 font-black">+ R$ {(estimatedDistance * 2).toFixed(2).replace('.', ',')}</span>
                      </div>
                    )}
                    <div className="h-px bg-white/10 w-full" />
                    <div className="flex flex-col items-center pt-2">
                       <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Estimado</p>
                       <p className="text-4xl font-black text-yellow-400 tracking-tighter drop-shadow-[0_4px_12px_rgba(250,204,21,0.2)] animate-pulse">
                          R$ {estimatedFee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                       </p>
                       {estimatedDistance > 0 && (
                         <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">
                           ({estimatedDistance.toFixed(1)} km aproximados)
                         </span>
                       )}
                    </div>
                 </div>

                 {/* Wallet Check Widget */}
                 <div className="bg-white/5 rounded-3xl p-5 border border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                       <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Saldo na Carteira</p>
                          <p className={`text-xl font-black ${merchantBalance < estimatedFee ? 'text-rose-400' : 'text-emerald-400'}`}>
                             R$ {merchantBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                       </div>
                       <div className={`size-10 rounded-2xl flex items-center justify-center shrink-0 ${merchantBalance < estimatedFee ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                          <span className="material-symbols-outlined text-lg">{merchantBalance < estimatedFee ? 'error' : 'verified'}</span>
                       </div>
                    </div>
                    
                    {merchantBalance < estimatedFee && estimatedFee > 0 && (
                      <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-2xl">
                        <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest leading-relaxed text-center">
                          Saldo Insuficiente. Realize uma recarga antes de chamar o piloto.
                        </p>
                      </div>
                    )}

                    <button 
                      type="button"
                      onClick={() => setShowAddCreditModal(true)}
                      className="w-full py-3.5 bg-white/10 hover:bg-white/20 active:scale-95 transition-all rounded-2xl text-[10px] font-black text-white uppercase tracking-widest flex items-center justify-center gap-2 border border-white/10 shadow-lg"
                    >
                      <span className="material-symbols-outlined text-base">account_balance_wallet</span>
                      Adicionar Créditos
                    </button>
                 </div>

                 <div className="text-center bg-white/5 p-4 rounded-2xl border border-white/5">
                    <p className="text-[9px] font-bold text-slate-400 leading-relaxed uppercase tracking-wider">
                       IZI FAST • Cobrança automática de frete direto em saldo pré-pago.
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="py-6 shrink-0">
        <hr className="border-slate-200 dark:border-slate-800" />
      </div>

      {/* Seção de Acompanhamento Realtime */}
      <div className="bg-white/50 dark:bg-slate-900/30 backdrop-blur-md p-8 md:p-10 rounded-[40px] border border-white/40 dark:border-slate-800/40 shadow-xl space-y-6">
         <div className="flex items-center gap-3 pb-2">
            <div className="size-11 bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
               <span className="material-symbols-outlined text-2xl font-bold">radar</span>
            </div>
            <div>
               <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] leading-none mb-1">Acompanhamento de Entregas</h3>
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Painel operacional de pedidos avulsos em andamento</p>
            </div>
         </div>
         <MerchantOrdersTracking />
      </div>
    </div>
  );
}
