import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { useAdmin } from '../context/AdminContext';
import type { Merchant, MerchantProfile, Product, MenuCategory } from '../lib/types';


import { showConfirm, toastError, toastSuccess } from '../lib/useToast';
import { supabase } from '../lib/supabase';
import { ProductStudio } from './ProductStudio';
import { DedicatedSlotStudio } from './DedicatedSlotStudio';
import FlashOffersSection from './FlashOffersSection';
import PromotionStudio from './PromotionStudio';
import { AddressSearchInput } from './AddressSearchInput';
import MerchantMapSelector from './MerchantMapSelector';
import PartnerStudio from './PartnerStudio';
import { GMAPS_KEY } from '../config';


export default function MyStudioTab() {
  const {
    activeTab, setActiveTab, userRole, merchantProfile, setMerchantProfile, session,
    selectedMerchantPreview, setSelectedMerchantPreview,
    productsList, previewProducts, setPreviewProducts,
    menuCategoriesList, previewCategories, setPreviewCategories,
    activePreviewTab, setActivePreviewTab,
    activeStudioTab, setActiveStudioTab,
    editingItem, setEditingItem, editType, setEditType,
    isSaving, setIsSaving,
    categoriesState, setCategoriesState,
    selectedCategoryStudio, setSelectedCategoryStudio,
    promotionsList,
    myDedicatedSlots, editingSlotId, setEditingSlotId,
    selectedDriverStudio, setSelectedDriverStudio,
    selectedUserStudio, setSelectedUserStudio,
    walletTransactions, isWalletLoading,
    showAddCreditModal, setShowAddCreditModal,
    creditToAdd, setCreditToAdd, isAddingCredit,
    showWalletStatementModal, setShowWalletStatementModal,
    allOrders, isCompletingOrder, setIsCompletingOrder,
    showActiveOrdersModal, setShowActiveOrdersModal,
    showCategoryListModal, setShowCategoryListModal,
    newOrderNotification, setNewOrderNotification,
    handleFileUpload, handleUpdateMyProduct, handleDeleteProduct,
    handleCreateNewProduct, handleUpdateMenuCategory, handleDeleteMenuCategory,
    handleUpdateDedicatedSlot, handleCreateDedicatedSlot, handleDeleteDedicatedSlot,
    handleUpdateMerchant, handleUpdateDispatchSettings,
    handleUpdateMyDriver, handleDeleteMyDriver,
    handleUpdateUser, handleApplyCredit, handleDeleteUser,
    handleNotifyUser, handleResetPassword,
    handleCompleteOrder, handleDeleteOrder,
    handleUpdateCategory, handleSeedCategories,
    handleUpdatePromotion, handleUpdateDriver, handleUpdateDriverStatus, handleDeleteDriver,
    handleUpdatePartner, handleUpdatePartnerStatus, handleDeletePartner,
    handleAddCredit, fetchUsers, fetchDrivers, fetchMyDrivers,
    fetchCategories, fetchProducts, fetchMenuCategories,
    isAddingPeakRule, setIsAddingPeakRule, newPeakRule, setNewPeakRule,
    handleAddPeakRule, handleRemovePeakRule,
    selectedZoneForMap, setSelectedZoneForMap,
    newZoneData, setNewZoneData,
    handleAddZone, handleRemoveZone,
    promoFilter, setPromoFilter, promoSearch, setPromoSearch,
    showPromoForm, setShowPromoForm, promoFormType, setPromoFormType,
    promoForm, setPromoForm, promoSaving, promoSaveStatus,
    savePromotion, autoSavePromo, fetchPromotions,
    establishmentTypes, fetchEstablishmentTypes, handleUpdateEstablishmentType, handleDeleteEstablishmentType,
    merchantBalance, merchantTransactions, fetchMerchantFinance,
    handleRequestWithdrawal, handleUpdateMerchantBankInfo, handleSyncMerchantBalance,
    dashboardData, appSettings, setAppSettings
  } = useAdmin();

  const [isLocating, setIsLocating] = React.useState(false);
  const [isMapSelectorOpen, setIsMapSelectorOpen] = React.useState(false);

  const getCurrentLocation = async (updateItem: (updated: any) => void, targetItem: any) => {
    if (!navigator.geolocation) {
      toastError("Geolocalização não é suportada pelo seu navegador.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GMAPS_KEY}&language=pt-BR`);
          const data = await res.json();
          if (data.status === 'OK' && data.results.length > 0) {
            const result = data.results[0];
            updateItem({
              ...targetItem,
              store_address: result.formatted_address,
              latitude,
              longitude,
              google_place_id: result.place_id
            });
            toastSuccess("Localização capturada com sucesso!");
          } else {
            toastError("Não foi possível converter as coordenadas em endereço.");
          }
        } catch (err: any) {
          toastError("Erro ao buscar endereço: " + err.message);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        toastError("Erro ao obter localização: " + error.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const [dateModalOpen, setDateModalOpen] = React.useState(false);
  const [tempDate, setTempDate] = React.useState('');
  const [tempTime, setTempTime] = React.useState('');
  const [selectedProductStudio, setSelectedProductStudio] = React.useState<any>(null);
  const [productSearch, setProductSearch] = React.useState('');
  const [withdrawalAmount, setWithdrawalAmount] = React.useState('');
  const [withdrawalStatus, setWithdrawalStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [withdrawalError, setWithdrawalError] = React.useState('');

  // --- Candidatos: state local da aba ---
  const [selectedSlotForCandidates, setSelectedSlotForCandidates] = React.useState<any>(null);
  const [slotApplications, setSlotApplications] = React.useState<any[]>([]);
  const [isLoadingApplications, setIsLoadingApplications] = React.useState(false);
  const [processingAppId, setProcessingAppId] = React.useState<string | null>(null);

  const fetchSlotApplications = React.useCallback(async (slotId: string) => {
    setIsLoadingApplications(true);
    try {
      const { data, error } = await supabase
        .from('slot_applications')
        .select('*, driver:drivers_delivery(*)')
        .eq('slot_id', slotId)
        .order('created_at', { ascending: false });
      if (!error) { setSlotApplications(data || []); return; }
      // fallback sem join
      const { data: simple } = await supabase.from('slot_applications').select('*').eq('slot_id', slotId);
      if (simple && simple.length > 0) {
        const ids = simple.map((a: any) => a.driver_id);
        const { data: drivers } = await supabase.from('drivers_delivery').select('*').in('id', ids);
        setSlotApplications(simple.map((a: any) => ({ ...a, driver: drivers?.find((d: any) => d.id === a.driver_id) })));
      } else { setSlotApplications([]); }
    } catch { setSlotApplications([]); }
    finally { setIsLoadingApplications(false); }
  }, []);
  
  // Realtime para candidaturas da vaga selecionada
  React.useEffect(() => {
    if (!selectedSlotForCandidates?.id) return;

    const channel = supabase.channel(`candidates_${selectedSlotForCandidates.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'slot_applications', 
        filter: `slot_id=eq.${selectedSlotForCandidates.id}` 
      }, () => {
        console.log('âš¡ Atualizando candidatos via Realtime...');
        fetchSlotApplications(selectedSlotForCandidates.id);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedSlotForCandidates?.id, fetchSlotApplications]);

  const handleCandidateAction = async (appId: string, status: 'accepted' | 'rejected') => {
    setProcessingAppId(appId);
    try {
      const app = slotApplications.find((a: any) => a.id === appId);
      const { error } = await supabase.from('slot_applications').update({ status }).eq('id', appId);
      if (error) throw error;
      
      if (status === 'accepted' && app?.driver_id) {
        // Marcar vaga como inativa pois foi preenchida
        await supabase.from('dedicated_slots_delivery').update({ is_active: false }).eq('id', selectedSlotForCandidates.id);
        
        await supabase.functions.invoke('send-push-notification', {
          body: { driver_id: app.driver_id, title: 'Vaga Confirmada! Ã°Å¸Å’Å¸', body: `Sua candidatura para "${selectedSlotForCandidates?.title}" foi aprovada!`, data: { type: 'dedicated_slot_confirmed', slot_id: selectedSlotForCandidates?.id } }
        }).catch(() => {});
      }
      
      toastSuccess(status === 'accepted' ? 'Candidato aprovado e vaga preenchida!' : 'Candidatura recusada.');
      fetchSlotApplications(selectedSlotForCandidates.id);
    } catch (e: any) { toastError('Erro: ' + e.message); }
    finally { setProcessingAppId(null); }
  };

  const openWhatsAppCandidate = (phone: string, name: string) => {
    if (!phone) { toastError('Telefone não cadastrado'); return; }
    window.open(`https://wa.me/55${phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${name}, vi sua candidatura para a nossa vaga dedicada. Podemos conversar?`)}`, '_blank');
  };


  const targetMerchantId = userRole === 'merchant' ? merchantProfile?.merchant_id : selectedMerchantPreview?.id;
  const merchantPromotionCards = promotionsList
    .filter(p => !targetMerchantId || p.merchant_id === targetMerchantId)
    .filter(p => userRole !== 'merchant' || Boolean(p.coupon_code));

  React.useEffect(() => {
    if (userRole === 'merchant') {
      fetchProducts();
      fetchMenuCategories();
      fetchPromotions();
      fetchMerchantFinance();
    }
  }, [userRole, fetchProducts, fetchMenuCategories, fetchPromotions, fetchMerchantFinance]);

  React.useEffect(() => {
    if (activePreviewTab === 'financial') {
      fetchMerchantFinance();
    }
  }, [activePreviewTab, fetchMerchantFinance]);

  const renderStudioPanel = (targetItem: Merchant | MerchantProfile, updateItem: (updatedItem: Merchant | MerchantProfile) => void) => (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden min-h-0">
      <div className="px-8 py-4 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 flex gap-6 overflow-x-auto scrollbar-hide">
        {[
          { id: 'info', label: 'Estande & Geral', icon: 'style' },
          { id: 'products', label: 'Cardápio Digital', icon: 'restaurant_menu' },
          { id: 'promotions', label: userRole === 'merchant' ? 'Promoções & Ofertas' : 'Promoções & Banners' , icon: 'campaign' },
          { id: 'sales', label: 'Vendas & Performance', icon: 'monitoring' },
          { id: 'financial', label: 'Financeiro & Saque', icon: 'account_balance_wallet' },
          { id: 'access', label: 'Dados de Acesso', icon: 'lock_person' },
          { id: 'dedicated_slots', label: 'Vagas Dedicadas', icon: 'stars' },
          { id: 'candidates', label: 'Candidatos', icon: 'group' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActivePreviewTab(t.id as any)}
            className={`flex items-center gap-3 py-4 px-2 border-b-2 transition-all whitespace-nowrap group ${activePreviewTab === t.id ? 'border-primary text-slate-900 dark:text-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            <span className={`material-symbols-outlined text-xl ${activePreviewTab === t.id ? 'font-fill text-primary' : 'group-hover:scale-110 transition-transform'}`}>{t.icon}</span>
            <span className="text-[10px] font-black uppercase tracking-[0.15em]">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#F8F9FA]/50 dark:bg-slate-950/20">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePreviewTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto w-full"
          >
            {activePreviewTab === 'info' && (
              <div className="space-y-12 pb-20">
                <section className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-2xl font-bold">domain</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Identidade Visual</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Como sua marca aparece no aplicativo</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Banner do Estabelecimento</label>
                      <div className="relative aspect-video rounded-[32px] overflow-hidden bg-slate-100 dark:bg-slate-800 group border-4 border-white dark:border-slate-800 shadow-xl">
                        <img src={targetItem.store_banner || 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1000&auto=format&fit=crop'} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button className="bg-white text-slate-900 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest">Alterar Banner</button>
                        </div>
                        <input 
                          type="file" accept="image/*" 
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={async (e) => {
                             const file = e.target.files?.[0];
                             if (file) {
                               const url = await handleFileUpload(file, 'banners');
                               if (url) updateItem({...targetItem, store_banner: url});
                             }
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Logotipo</label>
                      <div className="relative size-44 rounded-[40px] overflow-hidden bg-slate-100 dark:bg-slate-800 group border-4 border-white dark:border-slate-800 shadow-xl">
                        <img src={targetItem.store_logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(targetItem.store_name || 'IZI')}&background=FFD900&color=000&size=256&font-size=0.33&font-weight=900`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="material-symbols-outlined text-white">photo_camera</span>
                        </div>
                        <input 
                          type="file" accept="image/*" 
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={async (e) => {
                             const file = e.target.files?.[0];
                             if (file) {
                               const url = await handleFileUpload(file, 'logos');
                               if (url) updateItem({...targetItem, store_logo: url});
                             }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nome da Loja</label>
                      <input 
                        className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white shadow-sm"
                        value={targetItem.store_name || ''}
                        onChange={e => updateItem({...targetItem, store_name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Telefone Público / WhatsApp</label>
                       <input 
                         className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white shadow-sm"
                         value={targetItem.store_phone || ''}
                         onChange={e => updateItem({...targetItem, store_phone: e.target.value})}
                       />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Descrição curta</label>
                       <textarea 
                         rows={2}
                         className="w-full bg-white dark:bg-slate-900 border-none rounded-3xl px-6 py-4 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white shadow-sm resize-none"
                         value={targetItem.store_description || ''}
                         onChange={e => updateItem({...targetItem, store_description: e.target.value})}
                         placeholder="Descreva sua loja..."
                       />
                    </div>
                    
                    <div className="md:col-span-2 space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Meu endereço de coletas</label>
                       <div className="relative group">
                         <AddressSearchInput 
                           className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white shadow-sm"
                           initialValue={targetItem.store_address || ''}
                           userCoords={targetItem.latitude && targetItem.longitude ? { lat: targetItem.latitude, lng: targetItem.longitude } : null}
                           extraRightPadding={true}
                           onSelect={(addr) => {
                             updateItem({
                               ...targetItem, 
                               store_address: addr.formatted_address,
                               latitude: addr.lat,
                               longitude: addr.lng,
                               google_place_id: (addr as any).place_id
                             });
                           }}
                           placeholder="Av. Exemplo, 123 - Bairro"
                         />
                         <button
                           type="button"
                           onClick={() => getCurrentLocation(updateItem, targetItem)}
                           disabled={isLocating}
                           className="absolute right-[80px] top-1/2 -translate-y-1/2 w-[40px] h-[40px] rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary transition-all flex items-center justify-center hover:bg-primary/10 group-hover:bg-white dark:group-hover:bg-slate-700 shadow-sm"
                           title="Usar localização atual"
                         >
                           {isLocating ? (
                             <div className="size-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                           ) : (
                             <span className="material-symbols-outlined text-xl">my_location</span>
                           )}
                         </button>
                         <button
                           type="button"
                           onClick={() => setIsMapSelectorOpen(true)}
                           className="absolute right-[12px] top-1/2 -translate-y-1/2 w-[40px] h-[40px] rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-slate-900 transition-all flex items-center justify-center shadow-sm"
                           title="Selecionar no Mapa"
                         >
                           <span className="material-symbols-outlined text-xl">map</span>
                         </button>
                       </div>

                       <MerchantMapSelector 
                         isOpen={isMapSelectorOpen}
                         onClose={() => setIsMapSelectorOpen(false)}
                         initialCoords={targetItem.latitude && targetItem.longitude ? { lat: targetItem.latitude, lng: targetItem.longitude } : undefined}
                         initialAddress={targetItem.store_address || ''}
                         onConfirm={(data) => {
                           updateItem({
                             ...targetItem,
                             store_address: data.address,
                             latitude: data.lat,
                             longitude: data.lng,
                             google_place_id: (data as any).placeId
                           });
                           toastSuccess("Localização definida pelo mapa!");
                         }}
                       />
                       {(targetItem.latitude && targetItem.longitude) && (
                         <div className="flex items-center gap-2 ml-4 mt-1 opacity-60">
                           <span className="material-symbols-outlined text-[10px]">location_searching</span>
                           <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-500">Coordenadas Precisas: {targetItem.latitude.toFixed(6)}, {targetItem.longitude.toFixed(6)}</span>
                         </div>
                       )}
                    </div>
                  </div>

                  <div className="pt-8 flex justify-end">
                    <button
                      disabled={isSaving}
                      onClick={async () => {
                         const confirm = await showConfirm({
                           title: 'Confirmar Alterações',
                           message: 'Deseja salvar as configurações da sua loja?',
                           confirmLabel: 'Sim, Salvar',
                           cancelLabel: 'Cancelar'
                         });
                         if (!confirm) return;

                          setIsSaving(true);
                         try {
                           const targetId = userRole === 'merchant' ? (targetItem as MerchantProfile).merchant_id : (targetItem as Merchant).id;
                           
                           if (!targetId) throw new Error("ID do lojista não encontrado.");

                           const updates: any = {
                             store_name: targetItem.store_name,
                             store_description: targetItem.store_description,
                             store_address: targetItem.store_address,
                             store_phone: targetItem.store_phone,
                             store_type: (targetItem as any).store_type,
                             food_category: (targetItem as any).food_category,
                             delivery_radius: targetItem.delivery_radius,
                             store_banner: targetItem.store_banner,
                             store_logo: targetItem.store_logo,
                             latitude: targetItem.latitude,
                             longitude: targetItem.longitude,
                             google_place_id: targetItem.google_place_id,
                             metadata: targetItem.metadata || {}
                           };

                           // Credenciais (Email/Password)
                           if ((targetItem as any).email) updates.email = (targetItem as any).email;
                           if ((targetItem as any).password && (targetItem as any).password.trim() !== '') {
                             updates.password = (targetItem as any).password;
                           }
                           
                           if (userRole === 'admin') {
                             const admItem = targetItem as Merchant;
                             if (admItem.commission_percent !== undefined) updates.commission_percent = admItem.commission_percent;
                             if (admItem.service_fee !== undefined) updates.service_fee = admItem.service_fee;
                             if (admItem.is_active !== undefined) updates.is_active = admItem.is_active;
                           }
                           
                           console.log('[DEBUG] Preparando atualização do lojista:', { targetId, updates });
                            
                           const { error } = await supabase.from('admin_users').update(updates).eq('id', targetId);
                            
                           if (error) {
                             console.error('[DEBUG] Erro ao atualizar lojista:', error);
                             throw error;
                           }
                            
                           console.log('[DEBUG] Atualização bem-sucedida!');
                           
                           toastSuccess('Configurações salvas com sucesso!');

                           // Limpar senha do preview após salvar
                           if (userRole === 'admin') {
                             setSelectedMerchantPreview({...(targetItem as Merchant), password: ''});
                           } else {
                             const updatedProfile = {...targetItem, password: ''} as MerchantProfile;
                             setMerchantProfile(updatedProfile);
                             localStorage.setItem('izi_admin_profile', JSON.stringify(updatedProfile));
                           }
                         } catch (err: any) {
                           toastError(err.message);
                         } finally {
                           setIsSaving(false);
                         }
                      }}
                      className="bg-primary hover:bg-primary/90 text-slate-900 px-10 py-5 rounded-[20px] font-black text-[12px] uppercase tracking-widest transition-all shadow-xl shadow-primary/20 flex items-center gap-3 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-slate-900/20 border-t-slate-900 animate-spin"></div>
                          Salvando...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-lg">save</span>
                          Salvar Estande
                        </>
                      )}
                    </button>
                  </div>
                </section>
              </div>
            )}

            {activePreviewTab === 'sales' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: 'Vendas Hoje', val: `R$ ${(dashboardData.revenueToday || 0).toFixed(2).replace('.', ',')}`, icon: 'payments', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
                    { label: 'Pedidos Ativos', val: dashboardData.activeOrdersCount || 0, icon: 'receipt_long', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
                    { label: 'Avaliação Média', val: (targetItem as any).metadata?.rating || '4.9', icon: 'star', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30' },
                  ].map(s => (
                    <div key={s.label} className={`${s.bg} p-8 rounded-[40px] border border-white/10`}>
                      <span className={`material-symbols-outlined ${s.color} text-3xl mb-4`}>{s.icon}</span>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{s.label}</p>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white">{s.val}</h3>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activePreviewTab === 'financial' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
                <div className="flex items-center justify-between gap-4 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-2xl font-bold">payments</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Gestão Financeira</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saldo, saques e relatórios de desempenho</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleSyncMerchantBalance}
                      disabled={isWalletLoading}
                      className="h-10 px-4 bg-primary/10 hover:bg-primary text-primary hover:text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                    >
                      <span className={`material-symbols-outlined text-sm ${isWalletLoading ? 'animate-spin' : ''}`}>sync</span> 
                      {isWalletLoading ? 'Sincronizando...' : 'Sincronizar Saldo'}
                    </button>
                    <button className="h-10 px-4 bg-slate-100 dark:bg-slate-800 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">download</span> Exportar
                    </button>
                  </div>
                </div>

                {/* QR Code Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group border-b-4 border-b-primary">
                    <div className="flex flex-col items-center text-center">
                      <div className="p-4 bg-primary/10 rounded-3xl mb-6 ring-8 ring-primary/5">
                        <QRCodeSVG 
                          value={`izipay:merchant:${merchantProfile?.merchant_id}`}
                          size={180}
                          level="H"
                          includeMargin={false}
                          className="rounded-lg"
                        />
                      </div>
                      <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2">Seu QR Code IZI</h4>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed px-4">
                        Apresente este código para que o cliente realize o pagamento instantâneo via App IZI Customer.
                      </p>
                      
                      <div className="mt-8 grid grid-cols-2 gap-3 w-full">
                        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-center">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Taxa</p>
                          <p className="text-sm font-black text-emerald-500">0%</p>
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-center">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Prazo</p>
                          <p className="text-sm font-black text-primary">Na Hora</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2 bg-slate-900 p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-10">
                      <span className="material-symbols-outlined text-[120px] text-white">contactless</span>
                    </div>
                    
                    <div className="relative z-10 h-full flex flex-col justify-between">
                      <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary text-slate-900 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                           <span className="material-symbols-outlined text-xs">bolt</span> Novo Recurso
                        </div>
                        <h3 className="text-3xl font-black text-white leading-tight mb-4">
                          Receba Pagamentos <br/> Sem Maquininha.
                        </h3>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-md">
                          Utilize o saldo do cliente ou cartões cadastrados no App IZI para receber pagamentos presenciais de forma rápida, segura e com taxas reduzidas.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10">
                        {[
                          { icon: 'qr_code_scanner', title: 'Cliente Escaneia', desc: 'No App Customer' },
                          { icon: 'ads_click', title: 'Digita o Valor', desc: 'E confirma senha' },
                          { icon: 'account_balance_wallet', title: 'Você Recebe', desc: 'Saldo instantâneo' },
                        ].map((step, idx) => (
                          <div key={idx} className="flex flex-col gap-2">
                            <span className="material-symbols-outlined text-primary">{step.icon}</span>
                            <p className="text-xs font-black text-white uppercase tracking-tight">{step.title}</p>
                            <p className="text-[10px] text-slate-500 font-bold">{step.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { 
                      label: 'Vendas Brutas', 
                      val: `R$ ${(dashboardData.totalRevenue || 0).toFixed(2).replace('.', ',')}`, 
                      trend: 'Total histórico', 
                      icon: 'payments', 
                      color: 'bg-primary/10 text-primary'
                    },
                    { 
                      label: 'Pedidos Concluintes', 
                      val: dashboardData.completedOrdersCount || 0, 
                      trend: 'Total de vendas', 
                      icon: 'check_circle', 
                      color: 'bg-emerald-50 text-emerald-500' 
                    },
                    { 
                      label: 'Comissão IZI', 
                      val: `R$ ${(dashboardData.totalCommission || 0).toFixed(2).replace('.', ',')}`, 
                      trend: `${(merchantProfile?.commission_percent ?? appSettings.appCommission ?? 12)}% de taxa`, 
                      icon: 'percent', 
                      color: 'bg-red-50 text-red-500' 
                    },
                    { 
                      label: 'Líquido Disponível', 
                      val: `R$ ${merchantBalance.toFixed(2).replace('.', ',')}`, 
                      trend: 'Pronto para saque', 
                      icon: 'account_balance_wallet', 
                      color: 'bg-blue-50 text-blue-500' 
                    },
                  ].map((kpi, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-2xl ${kpi.color}`}>
                          <span className="material-symbols-outlined">{kpi.icon}</span>
                        </div>
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">{kpi.val}</h3>
                    </div>
                  ))}
                </div>

                {/* Gráfico de Performance */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="flex justify-between items-center mb-8">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-3 italic uppercase tracking-[0.1em]">
                      <span className="material-symbols-outlined text-primary">insights</span>
                      Tendência de Ganhos
                    </h4>
                  </div>
                  <div className="h-48 flex items-end justify-between gap-2 px-2">
                    {(dashboardData.dailyRevenue || [0,0,0,0,0,0,0]).map((val: number, i: number) => {
                      const maxVal = Math.max(...(dashboardData.dailyRevenue || [1]), 1);
                      const h = (val / maxVal) * 100;
                      return (
                        <div key={i} className="flex-1 bg-slate-50 dark:bg-slate-800/30 rounded-t-xl relative group">
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max(h, 5)}%` }}
                            className="absolute bottom-0 left-0 right-0 bg-primary/40 group-hover:bg-primary transition-all rounded-t-xl" 
                          />
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] font-black px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                            R${val.toFixed(0)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <div className="bg-emerald-500 dark:bg-emerald-600 p-10 rounded-[48px] shadow-2xl shadow-emerald-500/20 relative overflow-hidden group">
                      <div className="absolute -top-10 -right-10 size-64 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
                      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div>
                          <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mb-2">Saldo Disponível para Saque</p>
                          <h2 className="text-5xl font-black text-white tracking-tighter">R$ {merchantBalance.toFixed(2).replace('.', ',')}</h2>
                          
                          {withdrawalStatus === 'success' && (
                            <motion.div 
                              initial={{ opacity: 0, x: -10 }} 
                              animate={{ opacity: 1, x: 0 }}
                              className="mt-4 flex flex-col gap-1 text-white bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20 w-fit"
                            >
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm font-black">check_circle</span>
                                <span className="text-[10px] font-black uppercase tracking-wider">Solicitação Enviada!</span>
                              </div>
                              <p className="text-[8px] font-bold opacity-80 uppercase tracking-widest pl-6">Processamento em até {appSettings.withdrawal_period_h} horas</p>
                            </motion.div>
                          )}
                        </div>

                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-xs font-black">R$</span>
                              <input 
                                type="text"
                                placeholder="0,00"
                                value={withdrawalAmount}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, '');
                                  const formatted = (Number(val) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                                  setWithdrawalAmount(formatted);
                                  setWithdrawalStatus('idle');
                                  setWithdrawalError('');
                                }}
                                className="w-32 bg-white/10 border border-white/20 rounded-2xl h-16 pl-10 pr-4 text-white font-black text-sm outline-none focus:ring-2 focus:ring-white placeholder:text-white/20 transition-all"
                              />
                            </div>
                            <button 
                              onClick={async () => {
                                const amount = parseFloat(withdrawalAmount.replace('.', '').replace(',', '.'));
                                if (isNaN(amount) || amount <= 0) {
                                  setWithdrawalError('Digite um valor válido');
                                  setWithdrawalStatus('error');
                                  return;
                                }
                                const minLimit = Number(appSettings.minwithdrawalamount ?? 0);
                                if (amount < minLimit) {
                                  setWithdrawalError(`Mínimo R$ ${minLimit.toFixed(2).replace('.', ',')}`);
                                  setWithdrawalStatus('error');
                                  return;
                                }
                                if (amount > merchantBalance) {
                                  setWithdrawalError('Saldo insuficiente');
                                  setWithdrawalStatus('error');
                                  return;
                                }

                                setWithdrawalStatus('loading');
                                try {
                                  await handleRequestWithdrawal(amount, targetItem.bank_info?.pix_key || '');
                                  setWithdrawalStatus('success');
                                  setWithdrawalAmount('');
                                  setTimeout(() => setWithdrawalStatus('idle'), 5000);
                                } catch (err) {
                                  setWithdrawalStatus('error');
                                  setWithdrawalError('Erro na solicitação');
                                }
                              }}
                              disabled={withdrawalStatus === 'loading'}
                              className="bg-white text-emerald-600 px-8 h-16 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                              {withdrawalStatus === 'loading' ? (
                                <div className="size-4 border-2 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin"></div>
                              ) : (
                                <>
                                  <span className="material-symbols-outlined font-black text-sm">logout</span>
                                  Sacar
                                </>
                              )}
                            </button>
                          </div>
                          
                          <AnimatePresence>
                            {withdrawalStatus === 'error' && (
                              <motion.p 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="text-[10px] font-black text-white/90 bg-red-500/80 backdrop-blur-sm px-3 py-1.5 rounded-xl w-fit flex items-center gap-2"
                              >
                                <span className="material-symbols-outlined text-xs">error</span>
                                {withdrawalError}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                      <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
                        <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Histórico de Transações</h4>
                        {isWalletLoading && <div className="size-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>}
                      </div>
                      <div className="overflow-x-auto min-h-[150px]">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</th>
                              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {merchantTransactions.map((tx) => (
                              <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="px-8 py-6 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                  {new Date(tx.created_at).toLocaleDateString('pt-BR')}
                                </td>
                                <td className="px-8 py-6">
                                  <p className="text-xs font-black text-slate-700 dark:text-white uppercase tracking-tight">{tx.description}</p>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{tx.type}</p>
                                </td>
                                <td className={`px-8 py-6 font-black text-sm ${tx.type === 'saque' ? 'text-rose-500' : 'text-emerald-500'}`}>
                                  {tx.type === 'saque' ? '-' : '+'} R$ {Number(tx.amount).toFixed(2).replace('.', ',')}
                                </td>
                                <td className="px-8 py-6">
                                  <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                    tx.status === 'concluido' ? 'bg-emerald-50 text-emerald-600' : 
                                    tx.status === 'pendente' ? 'bg-amber-50 text-amber-600' : 
                                    'bg-rose-50 text-rose-600'
                                  }`}>
                                    {tx.status || 'concluido'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            {merchantTransactions.length === 0 && !isWalletLoading && (
                              <tr>
                                <td colSpan={4} className="px-8 py-20 text-center text-slate-300 font-bold uppercase tracking-widest text-[10px]">
                                  Nenhuma transação encontrada
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-8">

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-inner space-y-8">
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined text-lg font-black">account_balance</span>
                        </div>
                        <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Dados Bancários</h4>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Nome do Banco</label>
                          <input 
                            className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-4 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white shadow-sm"
                            value={targetItem.bank_info?.bank || ''}
                            onChange={e => updateItem({...targetItem, bank_info: { ...targetItem.bank_info, bank: e.target.value }})}
                            placeholder="Ex: NuBank, Bradesco..."
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Chave PIX (Principal)</label>
                          <input 
                            className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-4 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white shadow-sm"
                            value={targetItem.bank_info?.pix_key || ''}
                            onChange={e => updateItem({...targetItem, bank_info: { ...targetItem.bank_info, pix_key: e.target.value }})}
                            placeholder="CPF, E-mail ou Telefone"
                          />
                        </div>

                        <button 
                          onClick={() => handleUpdateMerchantBankInfo(targetItem.bank_info)}
                          disabled={isSaving}
                          className="w-full bg-primary/10 hover:bg-primary text-primary hover:text-slate-900 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border border-primary/20 flex items-center justify-center gap-2 group"
                        >
                          <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">check_circle</span>
                          {isSaving ? 'Salvando...' : 'Salvar Dados de Saque'}
                        </button>
                      </div>

                      <div className="p-6 bg-amber-500/5 rounded-3xl border border-amber-500/10">
                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 mb-2">
                          <span className="material-symbols-outlined text-lg">info</span>
                          <span className="text-[9px] font-black uppercase tracking-widest">Regras de Saque</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase italic">Os saques são processados em até {appSettings.withdrawal_period_h ?? 24}h. Pagamentos realizados: {appSettings.withdrawal_day ?? 'Qualquer dia'}. O valor mínimo é de R$ {(appSettings.minwithdrawalamount ?? 0).toFixed(2).replace('.', ',')}.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
 
             {activePreviewTab === 'access' && (
               <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
                 <div className="flex items-center gap-4 mb-8">
                    <div className="size-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
                      <span className="material-symbols-outlined text-2xl font-bold">lock_person</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Segurança & Acesso</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gerencie suas credenciais e permissões na plataforma</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="material-symbols-outlined text-primary">contact_mail</span>
                        <h5 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Credenciais de Login</h5>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">E-mail de Acesso</label>
                        <input 
                          className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white"
                          type="email"
                          value={(targetItem as any).email || ''}
                          onChange={e => updateItem({...targetItem, email: e.target.value})}
                          placeholder="seu@email.com"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center ml-4">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-slate-500">Nova Senha</label>
                          <button
                            type="button"
                            onClick={() => {
                              const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
                              let pass = "";
                              for(let i=0; i<10; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
                              updateItem({...targetItem, password: pass});
                            }}
                            className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline"
                          >
                            Gerar Senha Forte
                          </button>
                        </div>
                        <input
                          type="text"
                          value={(targetItem as any).password || ''}
                          onChange={e => updateItem({...targetItem, password: e.target.value})}
                          placeholder="Deixe em branco para manter a atual"
                          className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white"
                        />
                      </div>
                   </div>

                   {userRole === 'admin' && (
                     <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl space-y-6 border border-white/5">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="material-symbols-outlined text-primary">admin_panel_settings</span>
                          <h5 className="text-[11px] font-black text-white uppercase tracking-widest">Parâmetros de Sistema (Admin)</h5>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Comissão (%)</label>
                            <input 
                              type="number" step="0.1"
                              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-black text-white text-sm focus:ring-2 focus:ring-primary"
                              value={(targetItem as Merchant).commission_percent || 0}
                              onChange={e => updateItem({...targetItem, commission_percent: parseFloat(e.target.value) || 0})}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Taxa Fixa (R$)</label>
                            <input 
                              type="number" step="0.1"
                              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-black text-white text-sm focus:ring-2 focus:ring-primary"
                              value={(targetItem as Merchant).service_fee || 0}
                              onChange={e => updateItem({...targetItem, service_fee: parseFloat(e.target.value) || 0})}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Tipo de Estabelecimento</label>
                          <select 
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold text-white text-sm focus:ring-2 focus:ring-primary appearance-none"
                            value={targetItem.store_type || 'restaurant'}
                            onChange={e => updateItem({...targetItem, store_type: e.target.value})}
                          >
                            {establishmentTypes.filter(t => !t.parent_id).map(t => (
                              <option key={t.id} value={t.value} className="bg-slate-900">{t.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="p-6 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-between">
                          <div>
                            <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Status da Conta</h4>
                            <p className="text-[9px] font-bold text-slate-500 uppercase">Habilitar/Desativar acesso</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => updateItem({...targetItem, is_active: !(targetItem as Merchant).is_active})}
                            className={`relative w-12 h-6 rounded-full transition-colors ${(targetItem as Merchant).is_active ? 'bg-emerald-500' : 'bg-rose-500'}`}
                          >
                            <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${(targetItem as Merchant).is_active ? 'translate-x-6' : ''}`}></span>
                          </button>
                        </div>
                     </div>
                   )}
                 </div>

                 <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button 
                      onClick={async () => {
                         const confirm = await showConfirm({
                           title: 'Salvar Acessos',
                           message: 'Deseja confirmar a alteração das credenciais de segurança?',
                           confirmLabel: 'Sim, Atualizar',
                           cancelLabel: 'Cancelar'
                         });
                         if (confirm) {
                            if (userRole === 'merchant') {
                               // Handle saving as merchant
                               const { id, ...cleanItem } = targetItem;
                               const { error } = await supabase.from('admin_users').update(cleanItem).eq('id', id);
                               if (error) toastError("Erro ao salvar: " + error.message);
                               else toastSuccess("Credenciais atualizadas!");
                            } else {
                               // Handle saving will be done by the main 'Salvar' button of the modal if editing someone else
                               toastSuccess("Acessos preparados para salvamento.");
                            }
                         }
                      }}
                      className="px-10 py-5 bg-primary text-slate-950 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                    >
                      <span className="material-symbols-outlined">security</span>
                      Confirmar Atualizações
                    </button>
                 </div>
               </div>
             )}


            {activePreviewTab === 'products' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
                 <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 mb-8">
                    <div>
                       <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                          <span className="material-symbols-outlined text-primary text-3xl">restaurant_menu</span>
                          Cardápio & Produtos
                       </h3>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gerencie os itens da sua loja organizados por categorias</p>
                    </div>
                    <div className="flex items-center gap-3">
                       <button 
                         className="bg-primary text-slate-900 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
                         onClick={() => setSelectedProductStudio({ 
                            id: 'new-' + Date.now(), 
                            name: '', 
                            description: '', 
                            price: 0, 
                            category: '', 
                            sub_category: '', 
                            image_url: '', 
                            is_available: true, 
                            merchant_id: targetMerchantId, 
                            option_groups: [] 
                          })}
                       >
                          <span className="material-symbols-outlined text-lg">add_circle</span>
                          Novo Produto
                       </button>
                    </div>
                 </div>

                 <div className="space-y-12">
                   {(() => {
                      const currentProducts = (userRole === 'merchant' ? productsList : previewProducts)
                        .filter(p => !productSearch || p.name?.toLowerCase().includes(productSearch.toLowerCase()) || p.category?.toLowerCase().includes(productSearch.toLowerCase()));
                      const grouped: Record<string, any[]> = {};
                      currentProducts.forEach(p => {
                        const cat = p.category || 'Sem Categoria';
                        if (!grouped[cat]) grouped[cat] = [];
                        grouped[cat].push(p);
                      });

                      const catNames = Object.keys(grouped).sort((a, b) => {
                        if (a === 'Sem Categoria') return 1;
                        if (b === 'Sem Categoria') return -1;
                        return a.localeCompare(b);
                      });

                      if (catNames.length === 0) {
                        return (
                          <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-[40px] border-2 border-dashed border-slate-100 dark:border-slate-800">
                             <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">inventory</span>
                             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhum produto cadastrado</p>
                          </div>
                        );
                      }

                      return catNames.map(catName => (
                        <div key={catName} className="space-y-6">
                           <div className="flex items-center gap-4 px-2">
                              <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{catName}</h4>
                              <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800 opacity-50"></div>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {grouped[catName].map((p: any) => (
                                <div 
                                  key={p.id} 
                                  className="bg-white dark:bg-slate-800 p-4 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm flex gap-4 items-center group hover:border-primary/30 transition-all cursor-pointer relative overflow-hidden"
                                  onClick={() => {
                                     setSelectedProductStudio(p);
                                  }}
                                >
                                  {p.featured && (
                                    <div className="absolute -top-1 -right-1">
                                      <div className="bg-amber-400 text-amber-900 text-[8px] font-black px-3 py-1 scale-75 rounded-bl-xl uppercase tracking-tighter">Destaque</div>
                                    </div>
                                  )}
                                  <div className="size-20 rounded-2xl bg-slate-50 dark:bg-slate-900 overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800">
                                    <img src={p.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=500&auto=format&fit=crop'} className="w-full h-full object-cover" alt={p.name} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                      <span className="text-[9px] font-black text-primary uppercase tracking-widest">{p.subcategory || p.category}</span>
                                      <div className={`flex items-center gap-1.5`}>
                                        <span className={`size-1.5 rounded-full ${p.is_available ?? p.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                        <span className="text-[8px] font-bold text-slate-400 uppercase">{(p.is_available ?? p.is_active) ? 'Ativo' : 'Indisp.'}</span>
                                      </div>
                                    </div>
                                    <h5 className="text-sm font-black text-slate-900 dark:text-white truncate">{p.name || 'Novo Produto'}</h5>
                                    <p className="text-[9px] text-slate-400 font-bold truncate mt-0.5">{p.description || 'Sem descrição'}</p>
                                    <div className="flex justify-between items-end mt-2">
                                       <div className="flex flex-col">
                                          {p.flashOffer && (
                                            <span className="text-[10px] font-bold text-slate-400 line-through">R$ {parseFloat((p.price || 0).toString()).toFixed(2).replace('.', ',')}</span>
                                          )}
                                          <span className="text-xs font-black text-primary">
                                            R$ {p.flashOffer ? p.flashOffer.discounted_price.toFixed(2).replace('.', ',') : parseFloat((p.price || 0).toString()).toFixed(2).replace('.', ',')}
                                          </span>
                                       </div>
                                       {p.flashOffer && (
                                         <div className="bg-primary/20 border border-primary/20 px-2 py-0.5 rounded-full animate-pulse">
                                           <span className="text-[8px] font-black text-primary uppercase">OFF {p.flashOffer.discount_percent}%</span>
                                         </div>
                                       )}
                                    </div>
                                  </div>
                                  <div className="size-10 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-300 group-hover:text-primary transition-all group-hover:bg-primary/10">
                                    <span className="material-symbols-outlined text-lg">edit_square</span>
                                  </div>
                                </div>
                              ))}
                           </div>
                        </div>
                      ));
                   })()}
                 </div>
              </div>
            )}

            {activePreviewTab === 'promotions' && ( <PromotionStudio userRole={userRole as any} merchantId={targetMerchantId} onClose={() => setActivePreviewTab('metrics')} /> ) } {false && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 mb-8">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary text-3xl">campaign</span>
                      {userRole === 'merchant' ? 'Promoções & Ofertas' : 'Promoções & Banners'}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      {userRole === 'merchant'
                        ? 'Gerencie cupons e ofertas aplicadas direto nos produtos da sua loja'
                        : 'Gerencie banners, cupons e ofertas especiais da sua loja'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {userRole !== 'merchant' && (
                      <button 
                        onClick={() => {
                          setPromoFormType('banner');
                          setPromoForm({ 
                            title: '', description: '', image_url: '', 
                            is_active: true, merchant_id: targetMerchantId 
                          });
                          setShowPromoForm(true);
                        }}
                        className="bg-white dark:bg-slate-800 text-slate-500 px-6 py-4 rounded-[24px] font-black text-[10px] uppercase tracking-widest border border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition-all flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-lg">add_photo_alternate</span>
                        Novo Banner
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        setPromoFormType('coupon');
                        setPromoForm({ 
                          title: '', description: '', coupon_code: '', 
                          discount_type: 'percent', discount_value: 0, 
                          is_active: true, merchant_id: targetMerchantId 
                        });
                        setShowPromoForm(true);
                      }}
                      className="bg-primary text-slate-900 px-8 py-4 rounded-[24px] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-lg">confirmation_number</span>
                      Criar Cupom
                    </button>
                  </div>
                </div>

                {showPromoForm && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} 
                    className="bg-white dark:bg-slate-800 p-8 rounded-[48px] border-2 border-primary/20 shadow-2xl mb-12"
                  >
                    <div className="flex justify-between items-center mb-8">
                      <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase italic">
                        {promoFormType === 'banner' && userRole !== 'merchant' ? 'Configurar Banner' : 'Configurar Cupom'}
                      </h4>
                      <button onClick={() => setShowPromoForm(false)} className="text-slate-400 hover:text-rose-500 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Título da Campanha</label>
                        <input 
                          className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl px-6 py-4 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white"
                          value={promoForm.title} onChange={e => setPromoForm({...promoForm, title: e.target.value})}
                          placeholder="Ex: 20% OFF em todo o cardápio"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Descrição curta</label>
                        <input 
                          className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl px-6 py-4 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white"
                          value={promoForm.description} onChange={e => setPromoForm({...promoForm, description: e.target.value})}
                          placeholder="Ex: Válido até domingo"
                        />
                      </div>

                      {promoFormType === 'coupon' && (
                        <>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Código do Cupom</label>
                            <input 
                              className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl px-6 py-4 font-black text-lg tracking-widest text-primary focus:ring-2 focus:ring-primary dark:text-white uppercase"
                              value={promoForm.coupon_code} onChange={e => setPromoForm({...promoForm, coupon_code: e.target.value})}
                              placeholder="EXEMPLO20"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Valor do Desconto</label>
                            <div className="flex gap-4">
                              <input 
                                type="number"
                                className="flex-1 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl px-6 py-4 font-black text-lg focus:ring-2 focus:ring-primary dark:text-white"
                                value={promoForm.discount_value} onChange={e => setPromoForm({...promoForm, discount_value: parseFloat(e.target.value)})}
                              />
                              <select 
                                className="bg-slate-100 dark:bg-slate-800 border-none rounded-2xl px-4 font-black text-[10px] uppercase"
                                value={promoForm.discount_type} onChange={e => setPromoForm({...promoForm, discount_type: e.target.value})}
                              >
                                <option value="percent">% Porcentagem</option>
                                <option value="fixed">R$ Fixo</option>
                              </select>
                            </div>
                          </div>
                        </>
                      )}

                      {promoFormType === 'banner' && userRole !== 'merchant' && (
                        <div className="md:col-span-2 space-y-4">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Imagem do Banner</label>
                          <div className="relative aspect-[3/1] rounded-[32px] overflow-hidden bg-slate-100 dark:bg-slate-900 group border-2 border-dashed border-slate-200 dark:border-slate-800">
                             {promoForm.image_url ? (
                               <img src={promoForm.image_url} className="w-full h-full object-cover" />
                             ) : (
                               <div className="h-full flex flex-col items-center justify-center text-slate-300">
                                 <span className="material-symbols-outlined text-4xl mb-2">add_photo_alternate</span>
                                 <p className="text-[10px] font-black uppercase">Clique para selecionar imagem</p>
                               </div>
                             )}
                             <input 
                               type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer"
                               onChange={async (e) => {
                                 const file = e.target.files?.[0];
                                 if (file) {
                                   const url = await handleFileUpload(file, 'banners');
                                   if (url) setPromoForm({...promoForm, image_url: url});
                                 }
                               }}
                             />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-3 mt-10">
                      <button onClick={() => setShowPromoForm(false)} className="px-8 py-4 bg-slate-100 dark:bg-slate-900 text-slate-500 rounded-2xl font-black text-[10px] uppercase">Cancelar</button>
                      <button 
                        disabled={promoSaving}
                        onClick={() => savePromotion(promoForm)}
                        className="px-12 py-4 bg-primary text-slate-900 rounded-2xl font-black text-[10px] uppercase shadow-xl shadow-primary/20 flex items-center gap-2"
                      >
                        {promoSaving ? (
                          <div className="size-4 border-2 border-slate-900/20 border-t-slate-900 rounded-full animate-spin" />
                        ) : (
                          <span className="material-symbols-outlined text-lg">check_circle</span>
                        )}
                        Salvar Promoção
                      </button>
                    </div>
                  </motion.div>
                )}

                {userRole === 'merchant' && targetMerchantId && (
                  <FlashOffersSection userRole="merchant" merchantId={targetMerchantId} />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {merchantPromotionCards.map((promo, idx) => (
                    <div key={promo.id || idx} className="bg-white dark:bg-slate-800 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden group flex flex-col">
                      {promo.image_url && (
                        <div className="aspect-[3/1] overflow-hidden">
                          <img src={promo.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={promo.title} />
                        </div>
                      )}
                      <div className="p-8 flex-1">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`size-10 rounded-2xl flex items-center justify-center ${promo.coupon_code ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'}`}>
                              <span className="material-symbols-outlined text-xl">{promo.coupon_code ? 'confirmation_number' : 'campaign'}</span>
                            </div>
                            <div>
                               <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tighter uppercase italic line-clamp-1">{promo.title}</h4>
                               {promo.coupon_code && <p className="text-[10px] font-black text-blue-500 dark:text-blue-400 tracking-widest mt-0.5">CUPOM: {promo.coupon_code}</p>}
                            </div>
                          </div>
                          <button 
                            onClick={async () => {
                              if (await showConfirm({ message: 'Deseja excluir esta promoção permanentemente?' })) {
                                await supabase.from('promotions_delivery').delete().eq('id', promo.id);
                                fetchPromotions();
                              }
                            }}
                            className="p-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-2xl transition-all"
                          >
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                        <p className="text-[11px] font-bold text-slate-400 line-clamp-2">{promo.description || 'Nenhuma descrição informada'}</p>
                        
                        <div className="mt-8 pt-6 border-t border-slate-50 dark:border-slate-900 flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <span className={`size-2 rounded-full ${promo.is_active ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-slate-300'}`}></span>
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{promo.is_active ? 'Ativa' : 'Pausada'}</span>
                           </div>
                           <button 
                            onClick={async () => {
                              await supabase.from('promotions_delivery').update({ is_active: !promo.is_active }).eq('id', promo.id);
                              fetchPromotions();
                            }}
                            className={`w-12 h-6 rounded-full relative transition-all ${promo.is_active ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
                           >
                             <div className={`absolute top-1 size-4 bg-white rounded-full shadow-md transition-all ${promo.is_active ? 'right-1' : 'left-1'}`}></div>
                           </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {merchantPromotionCards.length === 0 && (
                    <div className="col-span-full py-24 text-center bg-slate-50/50 dark:bg-slate-950/20 rounded-[64px] border-2 border-dashed border-slate-100 dark:border-slate-800">
                      <div className="size-20 bg-white dark:bg-slate-900 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100 dark:border-slate-800">
                        <span className="material-symbols-outlined text-4xl text-slate-200 dark:text-slate-800">campaign</span>
                      </div>
                      <h4 className="text-xl font-black text-slate-400 italic">
                        {userRole === 'merchant' ? 'Nenhum cupom ativo' : 'Nenhuma promoção ativa'}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">
                        {userRole === 'merchant' ? 'Crie cupons ou ofertas para aumentar suas vendas' : 'Crie cupons ou banners para aumentar suas vendas'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activePreviewTab === 'dedicated_slots' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-700 pb-20">
                {/* Board Header */}
                <div className="relative group">
                   <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-transparent blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                   <div className="relative flex flex-col md:flex-row justify-between md:items-end gap-8 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-10 rounded-[48px] border border-white/20 shadow-2xl">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                           <div className="size-12 rounded-2xl bg-primary flex items-center justify-center text-slate-950 shadow-lg shadow-primary/20">
                              <span className="material-symbols-outlined text-2xl font-black">verified_user</span>
                           </div>
                           <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                             Vagas Dedicadas
                           </h3>
                        </div>
                        <p className="text-sm font-medium text-slate-500 max-w-xl leading-relaxed">
                          Garanta a exclusividade de entregadores para o seu negócio. Vagas dedicadas permitem que os motoristas aceitem trabalhar em turnos fixos apenas para você.
                        </p>
                      </div>
                      <button 
                        onClick={() => setEditingSlotId('new')}
                        className="group/btn relative bg-slate-950 text-white dark:bg-primary dark:text-slate-950 px-10 py-5 rounded-[28px] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500"></div>
                        <span className="relative flex items-center gap-3">
                           <span className="material-symbols-outlined text-xl">add_box</span>
                           Anunciar Vaga
                        </span>
                      </button>
                   </div>
                </div>

                {/* Slots Board */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                   {myDedicatedSlots.length === 0 ? (
                      <div className="col-span-full py-32 flex flex-col items-center justify-center bg-white/10 dark:bg-slate-900/20 rounded-[64px] border-2 border-dashed border-slate-200 dark:border-slate-800/50 group hover:border-primary/50 transition-colors">
                         <div className="size-24 bg-white dark:bg-slate-800 rounded-[32px] flex items-center justify-center mb-8 shadow-xl border border-slate-100 dark:border-slate-700 group-hover:scale-110 transition-transform duration-500">
                            <span className="material-symbols-outlined text-5xl text-slate-200 dark:text-slate-700 animate-bounce">rocket</span>
                         </div>
                         <h4 className="text-2xl font-black text-slate-400 italic mb-2">Sua frota exclusiva começa aqui</h4>
                         <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black">Clique no botão acima para criar sua primeira vaga</p>
                      </div>
                   ) : (
                      myDedicatedSlots.map((slot) => {
                        const isAccepted = (slot as any).slot_applications?.some((app: any) => app.status === 'accepted');
                        return (
                       <div 
                         key={slot.id} 
                          className={`group relative ${isAccepted ? "bg-gradient-to-br from-white to-emerald-50/30 dark:from-slate-900 dark:to-[#062016] ring-2 ring-emerald-500/30" : "bg-white dark:bg-slate-900/60"} backdrop-blur-sm rounded-[41px] border border-slate-100 dark:border-white/5 shadow-2xl overflow-hidden hover:shadow-primary/5 transition-all duration-500 flex flex-col h-full`}
                        >
                          {isAccepted && (
                            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-600 animate-pulse z-10"></div>
                          )}
                          <div className="p-10 flex-1 flex flex-col">
                             <div className="flex justify-between items-start mb-10">
                                <div className="space-y-3">
                                   <div className="flex items-center gap-3">
                                      <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-2 ${slot.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>
                                         <span className={`size-1.5 rounded-full ${slot.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></span>
                                         {slot.is_active ? 'Ativa' : 'Pausada'}
                                      </div>
                                      {isAccepted && (
                                        <div className="bg-emerald-600 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-500/20">
                                          <span className="material-symbols-outlined text-[10px]">verified</span>
                                          Preenchida
                                        </div>
                                      )}
                                   </div>


                                   <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight pr-4">
                                     {slot.title}
                                   </h3>
                                </div>
                                <div className="flex gap-3">
                                   <button 
                                     onClick={() => setEditingSlotId(slot.id)}
                                     className="size-12 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 hover:text-primary transition-all"
                                   >
                                      <span className="material-symbols-outlined text-xl">edit</span>
                                   </button>
                                   <button 
                                     onClick={() => handleDeleteDedicatedSlot(slot.id)}
                                     className="size-12 rounded-2xl bg-rose-500/5 flex items-center justify-center text-rose-500/50 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                                   >
                                      <span className="material-symbols-outlined text-xl">delete</span>
                                   </button>
                                </div>
                             </div>

                             <div className="flex-1 space-y-8">
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3 italic">
                                   "{slot.description || 'Sem descrição detalhada.'}"
                                </p>

                                <div className="grid grid-cols-2 gap-4">
                                   <div className="bg-slate-50 dark:bg-white/5 rounded-3xl p-6 border border-slate-100 dark:border-white/5 group-hover:bg-primary/5 transition-colors duration-500">
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pagamento / Dia</p>
                                      <p className="text-xl font-black text-primary leading-tight">R$ {slot.fee_per_day}</p>
                                      {slot.metadata?.base_deliveries > 0 && (
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Até {slot.metadata.base_deliveries} entregas</p>
                                      )}
                                   </div>
                                   <div className="bg-slate-50 dark:bg-white/5 rounded-3xl p-6 border border-slate-100 dark:border-white/5 group-hover:bg-primary/5 transition-colors duration-500">
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Horário / Turno</p>
                                      <p className="text-sm font-black text-slate-900 dark:text-white uppercase truncate">{slot.working_hours || 'A definir'}</p>
                                      {slot.metadata?.benefits?.length > 0 && (
                                        <div className="flex gap-1 mt-1.5 overflow-hidden">
                                          {slot.metadata.benefits.slice(0, 3).map((b: string) => (
                                             <span key={b} className="size-4 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                                               <span className="material-symbols-outlined text-[10px]">
                                                 {b === 'bag' ? 'shopping_bag' : b === 'meal' ? 'restaurant' : b === 'bonus' ? 'workspace_premium' : 'add_circle'}
                                               </span>
                                             </span>
                                          ))}
                                          {slot.metadata.benefits.length > 3 && <span className="text-[8px] font-black text-slate-400">+{slot.metadata.benefits.length - 3}</span>}
                                        </div>
                                      )}
                                   </div>
                                </div>
                             </div>

                             <div className="mt-10 pt-8 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                                <div className="flex -space-x-4">
                                   {[1,2,3].map(n => (
                                     <div key={n} className="size-10 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                                        <span className="material-symbols-outlined text-xs text-slate-400">person</span>
                                     </div>
                                   ))}
                                   <div className="size-10 rounded-full border-2 border-white dark:border-slate-900 bg-slate-950 text-white flex items-center justify-center text-[8px] font-black italic">
                                      +12
                                   </div>
                                </div>
                                 <span 
                                   onClick={() => {
                                     setActivePreviewTab('candidates');
                                     setSelectedSlotForCandidates(slot);
                                     fetchSlotApplications(slot.id);
                                   }}
                                   className="text-[10px] font-black text-primary uppercase tracking-widest cursor-pointer hover:underline animate-pulse"
                                 >{isAccepted ? "Ver Escalado" : "Ver Candidatos"}</span>
                             </div>
                          </div>
                          
                          <button 
                             onClick={() => setEditingSlotId(slot.id)}
                              className={`w-full py-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-t border-slate-100 dark:border-white/5 ${isAccepted ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-slate-50 dark:bg-white/5 text-slate-400 hover:bg-primary hover:text-slate-950"}`}
                          >
                             {isAccepted ? "Gerenciar Escala" : "Gerenciar Vaga"}
                          </button>
                       </div>
                       );
                      })
                   )}
                </div>
              </div>
            )}

            {activePreviewTab === 'candidates' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-700 pb-20">
                {/* Header */}
                <div className="relative flex flex-col md:flex-row justify-between md:items-end gap-8 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-10 rounded-[48px] border border-white/20 shadow-2xl">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="size-12 rounded-2xl bg-primary flex items-center justify-center text-slate-950 shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined text-2xl font-black">group_add</span>
                      </div>
                      <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                        {selectedSlotForCandidates ? selectedSlotForCandidates.title : 'Central de Candidatos'}
                      </h3>
                    </div>
                    <p className="text-sm font-medium text-slate-500 max-w-xl leading-relaxed">
                      {selectedSlotForCandidates ? 'Gerencie os entregadores interessados nesta vaga.' : 'Selecione uma vaga para visualizar e gerenciar candidaturas.'}
                    </p>
                  </div>
                  {selectedSlotForCandidates && (
                    <button
                      onClick={() => { setSelectedSlotForCandidates(null); setSlotApplications([]); }}
                      className="flex items-center gap-2 px-8 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-rose-500 transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">arrow_back</span>
                      Voltar às Vagas
                    </button>
                  )}
                </div>

                {/* Listagem de vagas ou candidatos */}
                {!selectedSlotForCandidates ? (
                  /* Seletor de vaga */
                  myDedicatedSlots.length === 0 ? (
                    <div className="py-32 flex flex-col items-center justify-center bg-white/10 dark:bg-slate-900/20 rounded-[64px] border-2 border-dashed border-slate-200 dark:border-slate-800/50">
                      <span className="material-symbols-outlined text-5xl text-slate-400 mb-6 font-thin">person_search</span>
                      <h4 className="text-xl font-black text-slate-400 italic">Nenhuma vaga criada</h4>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-2">Crie vagas em "Vagas Dedicadas" para atrair entregadores</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {myDedicatedSlots.map((slot: any) => {
                        const isFilled = slot.slot_applications?.some((a: any) => a.status === 'accepted');
                        return (
                          <button
                            key={slot.id}
                            onClick={() => { setSelectedSlotForCandidates(slot); fetchSlotApplications(slot.id); }}
                            className={`bg-white dark:bg-slate-900/60 p-8 rounded-[40px] border-2 flex items-center justify-between hover:scale-[1.02] active:scale-95 transition-all group shadow-xl text-left relative overflow-hidden ${isFilled ? 'border-emerald-500/30' : 'border-slate-100 dark:border-white/5'}`}
                          >
                            {isFilled && (
                              <div className="absolute top-0 right-0">
                                <div className="bg-emerald-500 text-white text-[8px] font-black px-4 py-1.5 rounded-bl-[20px] uppercase tracking-widest shadow-lg">
                                  Vaga Preenchida
                                </div>
                              </div>
                            )}
                            <div className="flex items-center gap-5">
                              <div className={`size-14 rounded-[20px] flex items-center justify-center shadow-lg ${isFilled ? 'bg-emerald-500 text-white' : 'bg-slate-950 dark:bg-primary text-white dark:text-slate-950'}`}>
                                <span className="material-symbols-outlined text-2xl">{isFilled ? 'verified' : 'person_search'}</span>
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">{slot.working_hours || 'Horário a definir'}</p>
                                <p className="text-xl font-black dark:text-white tracking-tight">{slot.title}</p>
                                <div className="flex items-center gap-3 mt-1">
                                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{slot.is_active ? 'â— Ativa' : 'â—‹ Pausada'}</p>
                                  {slot.slot_applications?.length > 0 && (
                                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">â— {slot.slot_applications.length} {slot.slot_applications.length === 1 ? 'Candidato' : 'Candidatos'}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className={`size-12 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center transition-all ${isFilled ? 'bg-emerald-50 text-emerald-500 border-emerald-100' : 'text-slate-400 group-hover:bg-primary group-hover:text-slate-950 group-hover:border-primary'}`}>
                              <span className="material-symbols-outlined">chevron_right</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )
                ) : (
                  /* Lista de candidatos da vaga selecionada */
                  isLoadingApplications ? (
                    <div className="py-24 flex flex-col items-center gap-4">
                      <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Carregando candidatos...</p>
                    </div>
                  ) : slotApplications.length === 0 ? (
                    <div className="py-28 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[48px] flex flex-col items-center gap-4 opacity-50">
                      <span className="material-symbols-outlined text-5xl text-slate-400">person_search</span>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nenhum candidato ainda</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {slotApplications.map((app: any) => (
                        <div key={app.id} className={`p-8 rounded-[40px] border transition-all ${app.status === 'accepted' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white dark:bg-slate-900/60 border-slate-100 dark:border-white/5 shadow-xl'}`}>
                          <div className="flex items-center gap-5 mb-6">
                            <div className="relative">
                              <div className="size-18 rounded-3xl bg-slate-100 dark:bg-slate-800 border border-white/10 overflow-hidden size-20">
                                {app.driver?.photo_url
                                  ? <img src={app.driver.photo_url} className="w-full h-full object-cover" />
                                  : <div className="w-full h-full flex items-center justify-center text-primary"><span className="material-symbols-outlined text-4xl">person</span></div>}
                              </div>
                              {app.status === 'accepted' && (
                                <div className="absolute -top-2 -right-2 size-7 bg-emerald-500 text-white rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                                  <span className="material-symbols-outlined text-sm">check</span>
                                </div>
                              )}
                            </div>
                            <div>
                              <h4 className="text-xl font-black dark:text-white">{app.driver?.name || 'Entregador'}</h4>
                              <div className="flex gap-2 mt-1">
                                <span className="text-[10px] font-black bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-lg text-slate-500">â˜… {app.driver?.rating || 'Novo'}</span>
                                <span className="text-[10px] font-black bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-lg text-slate-500">{app.driver?.total_trips || 0} viagens</span>
                              </div>
                            </div>
                          </div>

                          {/* Ações */}
                          {app.status === 'pending' ? (
                            <div className="flex flex-col gap-3">
                              <div className="flex gap-3">
                                <button onClick={() => handleCandidateAction(app.id, 'rejected')} disabled={processingAppId === app.id}
                                  className="flex-1 h-11 bg-slate-100 dark:bg-white/5 text-rose-500 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-500/10 transition-all">
                                  Recusar
                                </button>
                                <button onClick={() => handleCandidateAction(app.id, 'accepted')} disabled={processingAppId === app.id}
                                  className="flex-[2] h-11 bg-primary text-slate-950 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                                  {processingAppId === app.id ? '...' : 'Aceitar Piloto'}
                                </button>
                              </div>
                              <button onClick={() => openWhatsAppCandidate(app.driver?.phone, app.driver?.name)}
                                className="w-full h-11 bg-emerald-500/10 text-emerald-500 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-emerald-500/20 flex items-center justify-center gap-2 hover:bg-emerald-500/20 transition-all">
                                <span className="material-symbols-outlined text-sm">chat</span> Entrevistar via WhatsApp
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-3">
                              <div className={`w-full py-3 text-center text-[10px] font-black uppercase tracking-widest rounded-2xl border flex items-center justify-center gap-2 ${
                                app.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-white/5 text-slate-500 border-white/5'
                              }`}>
                                <span className="material-symbols-outlined text-sm">{app.status === 'accepted' ? 'verified' : 'archive'}</span>
                                {app.status === 'accepted' ? 'Candidato Selecionado' : 'Candidatura Arquivada'}
                              </div>
                              {app.status === 'accepted' && (
                                <div className="flex gap-3">
                                  <button onClick={() => openWhatsAppCandidate(app.driver?.phone, app.driver?.name)}
                                    className="flex-1 h-11 bg-emerald-500 text-slate-950 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-sm">call</span> Contato
                                  </button>
                                  <button onClick={() => handleCandidateAction(app.id, 'pending')}
                                    className="px-4 h-11 bg-white/5 text-white/40 rounded-2xl text-[9px] font-black uppercase hover:text-rose-500 transition-all" title="Remover da vaga">
                                    <span className="material-symbols-outlined text-sm">logout</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            )}

            {editingSlotId && (
              <DedicatedSlotStudio 
                slot={editingSlotId === 'new' ? { id: 'new' } : myDedicatedSlots.find((s: any) => s.id === editingSlotId)}
                onClose={() => setEditingSlotId(null)}
                onSave={async (slotData: any) => {
                  await handleUpdateDedicatedSlot(slotData);
                  setEditingSlotId(null);
                }}
                merchantId={targetMerchantId || ''}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );

  const renderDevicePreview = (targetItem: Merchant | MerchantProfile | null, targetProducts: Product[], targetCategories: any[]) => (
    <div className="flex flex-col items-center justify-center p-4 lg:p-10 select-none">
      <div className="relative w-full max-w-[320px] aspect-[9/19] bg-white dark:bg-slate-900 rounded-[50px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] border-[8px] border-slate-900 dark:border-slate-800 overflow-hidden">
        {/* Status Bar */}
        <div className="absolute top-0 w-full h-8 flex items-center justify-between px-8 z-20">
          <span className="text-[10px] font-black dark:text-white">9:41</span>
          <div className="flex gap-1.5">
            <span className="material-symbols-outlined text-xs dark:text-white">signal_cellular_4_bar</span>
            <span className="material-symbols-outlined text-xs dark:text-white">wifi</span>
            <span className="material-symbols-outlined text-xs dark:text-white">battery_full</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="h-full overflow-y-auto overflow-x-hidden scrollbar-hide pt-4">
          {/* Banner */}
          <div className="relative h-40 bg-slate-200 dark:bg-slate-800">
            <img 
              src={targetItem?.store_banner || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000'} 
              className="w-full h-full object-cover"
              alt="Banner"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-4 left-6 flex items-center gap-3">
              <div className="size-14 rounded-2xl bg-white p-0.5 shadow-lg border-2 border-white overflow-hidden">
                <img className="w-full h-full object-cover rounded-[14px]" src={targetItem?.store_logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(targetItem?.store_name || 'IZI')}&background=FFD900&color=000&size=256&font-size=0.33&font-weight=900`} />
              </div>
              <div className="text-white">
                <h4 className="text-sm font-black truncate max-w-[150px]">{targetItem?.store_name || 'Minha Loja'}</h4>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[10px] fill-1 text-primary">star</span>
                  <span className="text-[10px] font-black">4.9 â€¢ 30-40 min</span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4">
             <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
               {targetItem?.store_description || 'Bem-vindo ao nosso estabelecimento! Qualidade e sabor em cada pedido.'}
             </p>
          </div>

          <div className="flex gap-3 px-6 pb-4 overflow-x-auto scrollbar-hide">
             {targetCategories && targetCategories.filter(c => !c.parent_id).length > 0 ? (
               targetCategories.filter(c => !c.parent_id).map((cat, i) => (
                 <span key={cat.id} className={`whitespace-nowrap px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider ${i === 0 ? 'bg-primary text-slate-900 shadow-md shadow-primary/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                   {cat.name}
                 </span>
               ))
             ) : (
                ['Destaques', 'Combos', 'Bebidas'].map((c, i) => (
                  <span key={i} className={`whitespace-nowrap px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider ${i === 0 ? 'bg-primary text-slate-900 shadow-md shadow-primary/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    {c}
                  </span>
                ))
             )}
          </div>

          <div className="px-6 space-y-3 pb-20">
            {(targetProducts && targetProducts.length > 0 ? targetProducts : [1,2,3]).map((p: any, i: number) => (
              <div key={p.id || i} className="flex gap-4 bg-white dark:bg-slate-800 p-3 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="size-20 rounded-[18px] bg-slate-50 dark:bg-slate-900 shrink-0 overflow-hidden">
                  <img src={p.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=500&auto=format&fit=crop'} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h5 className="text-[11px] font-black text-slate-900 dark:text-white truncate">{p.name || `Produto Exemplo ${i+1}`}</h5>
                  <p className="text-[9px] text-slate-400 font-bold truncate mt-0.5">{p.description || 'Descrição deliciosa...'}</p>
                  <div className="flex justify-between items-end mt-2">
                     <div className="flex flex-col">
                        {p.flashOffer && (
                          <span className="text-[8px] font-black text-slate-400 line-through">R$ {p.price || '0,00'}</span>
                        )}
                        <span className="text-xs font-black text-primary">
                          R$ {p.flashOffer ? p.flashOffer.discounted_price.toFixed(2).replace('.', ',') : (p.price || '0,00')}
                        </span>
                     </div>
                     {p.flashOffer && (
                       <div className="bg-primary px-1.5 py-0.5 rounded-full shadow-sm animate-pulse">
                         <span className="text-[7px] font-black text-slate-950 uppercase">OFF {p.flashOffer.discount_percent}%</span>
                       </div>
                     )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 dark:bg-slate-800 rounded-b-[20px] z-30"></div>
      </div>
    </div>
  );

  return (
    <>
<div className={`flex flex-col h-[calc(100vh-160px)] -m-8 relative overflow-hidden bg-white dark:bg-slate-900 shadow-2xl rounded-[40px] border border-slate-100 dark:border-slate-800 ${activeTab === 'my_studio' ? 'block' : 'hidden'}`}>
  {((userRole === 'merchant' && merchantProfile) || (userRole === 'admin' && selectedMerchantPreview)) ? (
    <div className="flex-1 flex flex-col xl:flex-row overflow-hidden pb-10">
      {/* Creative Control Panel Column - Immersive Full Screen */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900 min-w-0">
         {renderStudioPanel(
          userRole === 'merchant' ? merchantProfile : selectedMerchantPreview,
          userRole === 'merchant' ? (updated: MerchantProfile) => setMerchantProfile(updated) : (updated: Merchant) => setSelectedMerchantPreview(updated)
         )}
      </div>

      {/* Digital Preview Column (Simulates App) - Responsive & Toggleable */}
      <div className="hidden xl:flex w-[480px] border-l border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex-col items-center justify-center p-8 overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-primary/0 via-primary/40 to-primary/0"></div>
        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white dark:bg-slate-900 px-4 py-2 rounded-full shadow-sm border border-slate-100 dark:border-slate-800 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
           <span className="material-symbols-outlined text-primary text-sm">devices</span>
           <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Visualização em Tempo Real</span>
        </div>
        
        <div className="scale-90 xl:scale-100 transition-transform duration-500">
          {renderDevicePreview(
            userRole === 'merchant' ? merchantProfile : selectedMerchantPreview,
            userRole === 'merchant' ? productsList : previewProducts,
            userRole === 'merchant' ? menuCategoriesList : previewCategories
          )}
        </div>
      </div>
    </div>
  ) : (
    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50 dark:bg-slate-950 animate-in fade-in duration-500">
      <div className="w-24 h-24 bg-primary/10 rounded-[32px] flex items-center justify-center mb-6 text-primary">
        <span className="material-symbols-outlined text-5xl">storefront</span>
      </div>
      <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Selecione um Lojista</h3>
      <p className="text-slate-500 dark:text-slate-400 max-w-sm font-medium">Você precisa selecionar um lojista na aba "Lojistas" para visualizar e editar seu estúdio digital.</p>
      <button 
        onClick={() => setActiveTab('merchants')}
        className="mt-8 px-8 py-4 bg-primary text-slate-900 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20"
      >
        Ir para Lojistas
      </button>
    </div>
  )}
</div>
{/* --- Merchant: Financeiro --- */}
{activeTab === 'financial' && userRole === 'merchant' && (
  <div className="flex flex-col h-[calc(100vh-160px)] -m-8 relative overflow-hidden bg-white dark:bg-slate-900 shadow-2xl rounded-[40px] border border-slate-100 dark:border-slate-800 p-8">
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="material-symbols-outlined text-3xl text-emerald-500">account_balance_wallet</span>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Meu Financeiro</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400">Controle seus ganhos, solicitações de saque e histórico de vendas.</p>
      </div>
      <button 
        onClick={() => handleRequestWithdrawal(merchantBalance, merchantProfile?.bank_info?.pix_key || '')}
        className="flex items-center gap-2 bg-emerald-500 text-white px-8 py-4 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
      >
        <span className="material-symbols-outlined">payments</span>
        Solicitar Saque
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1 space-y-6">
        <section className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/20 -mr-20 -mt-20 rounded-full blur-3xl"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Saldo Disponível</p>
          <h2 className="text-5xl font-black tracking-tighter mb-8">R$ {merchantBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 rounded-3xl bg-white/5 border border-white/10">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Saque Mínimo</span>
              <span className="font-black text-emerald-400">R$ {(appSettings.minwithdrawalamount ?? 0).toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="flex justify-between items-center p-4 rounded-3xl bg-white/5 border border-white/10">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Taxa de Saque</span>
              <span className="font-black">{(appSettings.withdrawalfeepercent ?? 0)} %</span>
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">pie_chart</span>
            Regras Atuais
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="font-bold text-slate-500">Sua Comissão (Líquido)</span>
              <span className="font-black text-slate-900 dark:text-white">{100 - (merchantProfile?.commission_percent ?? appSettings.appCommission ?? 12)}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div className="h-full bg-emerald-500" style={{ width: `${100 - (merchantProfile?.commission_percent ?? appSettings.appCommission ?? 12)}%` }}></div>
              <div className="h-full bg-slate-300 dark:bg-slate-700" style={{ width: `${(merchantProfile?.commission_percent ?? appSettings.appCommission ?? 12)}%` }}></div>
            </div>
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
              <span>Taxa sobre Venda</span>
              <span>{(merchantProfile?.commission_percent ?? appSettings.appCommission ?? 12)}%</span>
            </div>
          </div>
        </section>
      </div>

      <div className="md:col-span-2">
        <section className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-full">
          <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/20">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-3">
              <span className="material-symbols-outlined text-emerald-500">history</span>
              Ãšltimas Vendas
            </h3>
            <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Exportar CSV</button>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {allOrders.filter(o => o.status === 'concluido').slice(0, 8).map((o, i) => (
              <div key={i} className="flex items-center justify-between px-8 py-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <span className="material-symbols-outlined text-slate-400">shopping_bag</span>
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">Pedido #DT-{o.id.slice(0, 4).toUpperCase()}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(o.created_at).toLocaleDateString()} â€¢ {new Date(o.created_at).toLocaleTimeString().slice(0, 5)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-emerald-500">+ R$ {o.total_price.toFixed(2).replace('.', ',')}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Via {o.payment_method || 'Cartão'}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  </div>
</div>
)}

      {/* Edit Modals */}
      {
        editingItem && editType === 'partner' && (
          <PartnerStudio onClose={() => { setEditingItem(null); setEditType(null); }} />
        )
      }

      {
        editingItem && editType !== 'partner' && editType !== 'new_merchant' && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 text-slate-900">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setEditingItem(null)}></div>
            <motion.div
initial={{ opacity: 0, scale: 0.9 }}
animate={{ opacity: 1, scale: 1 }}
className="w-full max-w-lg bg-white rounded-[48px] p-10 shadow-2xl relative z-10"
            >
<div className="flex justify-between items-center mb-10">
  <div>
    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Editor de Registro</p>
    <h2 className="text-3xl font-black text-slate-900">
      {editingItem.id ? 'Editar' : 'Novo'} {
        editType === 'driver' ? 'Entregador' :
          editType === 'my_driver' ? 'Motoboy Próprio' :
            editType === 'user' ? 'Cliente' :
              editType === 'category' ? 'Categoria' :
                editType === 'merchant' ? 'Lojista' :
                  editType === 'partner' ? 'Parceiro Click & Retire' :
                    editType === 'my_product' ? 'Produto' : 'Promoção/Banner'
      }
    </h2>
  </div>
  <button onClick={() => { setEditingItem(null); setEditType(null); }} className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900">
    <span className="material-symbols-outlined text-3xl">close</span>
  </button>
</div>

<form onSubmit={
  editType === 'driver' ? handleUpdateDriver :
    editType === 'my_driver' ? handleUpdateMyDriver :
      editType === 'user' ? handleUpdateUser :
        editType === 'category' ? handleUpdateCategory :
          editType === 'merchant' ? handleUpdateMerchant :
            editType === 'partner' ? handleUpdatePartner :
              editType === 'my_product' ? handleUpdateMyProduct : handleUpdatePromotion
} className="space-y-6">

  {/* Common fields for User, Driver, Category */}
  {(editType === 'user' || editType === 'driver' || editType === 'my_driver' || editType === 'category' || editType === 'promotion' || editType === 'merchant' || editType === 'partner' || editType === 'my_product') && (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">
          {editType === 'merchant' ? 'E-mail de Acesso (Login)' : 
           editType === 'my_product' ? 'Nome do Produto' : 'Nome / Título'}
        </label>
        <input
          type={editType === 'merchant' ? 'email' : 'text'}
          required
          value={editType === 'merchant' ? (editingItem.email || '') : (editingItem.name || editingItem.title || '')}
          onChange={e => {
            if (editType === 'merchant') setEditingItem({ ...editingItem, email: e.target.value });
            else setEditingItem({ ...editingItem, name: e.target.value, title: e.target.value });
          }}
          placeholder={editType === 'merchant' ? 'lojista@exemplo.com' : 
                       editType === 'my_product' ? 'Ex: Pizza Calabresa' : ''}
          className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {editType === 'merchant' && (
        <div className="space-y-1">
          <div className="flex justify-between items-center ml-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Senha de Acesso</label>
            <button
              type="button"
              onClick={() => {
                const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
                let pass = "";
                for(let i=0; i<10; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
                setEditingItem({...editingItem, password: pass});
              }}
              className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline"
            >
              Gerar Aleatória
            </button>
          </div>
          <input
            type="text"
            value={editingItem.password || ''}
            onChange={e => setEditingItem({ ...editingItem, password: e.target.value })}
            placeholder="Nova senha para o lojista"
            className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      )}
    </div>
  )}

  {editType === 'merchant' && (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Nome do Estabelecimento</label>
        <input
          type="text"
          required
          value={editingItem.store_name || ''}
          onChange={e => setEditingItem({ ...editingItem, store_name: e.target.value })}
          className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Tipo de Estabelecimento</label>
        <select
          value={editingItem.store_type || 'restaurant'}
          onChange={e => setEditingItem({ ...editingItem, store_type: e.target.value })}
          className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="restaurant">Restaurante / Lanchonete</option>
          <option value="pharmacy">Farmácia</option>
          <option value="market">Mercado / Hortifruti</option>
          <option value="beverages">Bebidas</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Telefone Loja</label>
          <input
            type="text"
            value={editingItem.store_phone || ''}
            onChange={e => setEditingItem({ ...editingItem, store_phone: e.target.value })}
            className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Logo do Estabelecimento</label>
          <div className="relative group">
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.svg,.webp"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setIsSaving(true);
                  const url = await handleFileUpload(file, 'logos');
                  if (url) setEditingItem({ ...editingItem, store_logo: url });
                  setIsSaving(false);
                }
              }}
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
            />
            <div className="w-full bg-slate-50 border border-dashed border-slate-200 rounded-3xl px-6 py-4 font-bold text-sm flex items-center gap-3 group-hover:border-primary/50 transition-colors">
              <span className="material-symbols-outlined text-primary">cloud_upload</span>
              <span className="text-slate-400 truncate">
                {editingItem.store_logo ? 'Imagem Carregada âœ“' : 'PNG, JPG, SVG, WebP'}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Descrição da Loja</label>
        <textarea
          value={editingItem.store_description || ''}
          onChange={e => setEditingItem({ ...editingItem, store_description: e.target.value })}
          className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px]"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Documento (CPF/CNPJ)</label>
          <input
            type="text"
            value={editingItem.document || ''}
            onChange={e => setEditingItem({ ...editingItem, document: e.target.value })}
            placeholder="00.000.000/0001-00"
            className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Endereço Completo</label>
          <div className="relative group">
            <AddressSearchInput
              className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 pr-14 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              initialValue={editingItem.store_address || ''}
              userCoords={editingItem.latitude && editingItem.longitude ? { lat: editingItem.latitude, lng: editingItem.longitude } : null}
              onSelect={(addr) => {
                setEditingItem({
                  ...editingItem,
                  store_address: addr.formatted_address,
                  latitude: addr.lat,
                  longitude: addr.lng
                });
              }}
              placeholder="Rua, Número, Bairro, Cidade"
            />
            <button
               type="button"
               onClick={() => getCurrentLocation(setEditingItem, editingItem)}
               disabled={isLocating}
               className="absolute right-3 top-1/2 -translate-y-1/2 size-10 rounded-xl bg-white/50 dark:bg-slate-800/50 text-slate-400 hover:text-primary transition-all flex items-center justify-center hover:bg-primary/10 shadow-sm"
               title="Usar localização atual"
             >
               {isLocating ? (
                 <div className="size-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
               ) : (
                 <span className="material-symbols-outlined text-xl">my_location</span>
               )}
             </button>
          </div>
          {(editingItem.latitude && editingItem.longitude) && (
            <div className="flex items-center gap-2 ml-4 mt-1 opacity-60">
              <span className="material-symbols-outlined text-[10px]">location_searching</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-500">Coordenadas: {editingItem.latitude.toFixed(5)}, {editingItem.longitude.toFixed(5)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1 border-t border-slate-50 pt-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-emerald-500 ml-4">Comissão Personalizada (%)</label>
          <div className="relative">
            <input
              type="number"
              value={editingItem.commission_percent ?? appSettings.appCommission}
              onChange={e => setEditingItem({ ...editingItem, commission_percent: parseFloat(e.target.value) })}
              className="w-full bg-emerald-50/30 border border-emerald-100 rounded-3xl px-6 py-4 font-black text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-emerald-500 font-black">%</span>
          </div>
        </div>
        <div className="space-y-1 border-t border-slate-50 pt-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-emerald-500 ml-4">Taxa de Serviço (R$)</label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              value={editingItem.service_fee ?? appSettings.serviceFee}
              onChange={e => setEditingItem({ ...editingItem, service_fee: parseFloat(e.target.value) })}
              className="w-full bg-emerald-50/30 border border-emerald-100 rounded-3xl px-6 py-4 font-black text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-500 font-black">R$</span>
          </div>
        </div>
      </div>
    </div>
  )}

  {(editType === 'user' || editType === 'driver' || editType === 'my_driver') && (
    <div className="space-y-1">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Telefone / WhatsApp</label>
      <input
        type="text"
        required
        value={editingItem.phone || ''}
        onChange={e => setEditingItem({ ...editingItem, phone: e.target.value })}
        className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </div>
  )}

  {(editType === 'driver' || editType === 'my_driver') && (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Veículo</label>
        <input
          type="text"
          required
          value={editingItem.vehicle_type || ''}
          onChange={e => setEditingItem({ ...editingItem, vehicle_type: e.target.value })}
          placeholder="Ex: Honda CG 160"
          className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Placa</label>
        <input
          type="text"
          value={editingItem.license_plate || ''}
          onChange={e => setEditingItem({ ...editingItem, license_plate: e.target.value.toUpperCase() })}
          placeholder="ABC-1234"
          className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
    </div>
  )}

  {editType === 'category' && (
    <>
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Descrição curta</label>
        <input
          type="text"
          required
          value={editingItem.desc || ''}
          onChange={e => setEditingItem({ ...editingItem, desc: e.target.value })}
          className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-[28px] flex gap-2 mb-2">
         <button
           type="button"
           onClick={() => setEditingItem({ ...editingItem, icon_mode: 'symbol' })}
           className={`flex-1 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all ${(!editingItem.icon_mode || editingItem.icon_mode === 'symbol') ? 'bg-white dark:bg-slate-700 text-primary shadow-md' : 'text-slate-400'}`}
         >
           Material Icon
         </button>
         <button
           type="button"
           onClick={() => setEditingItem({ ...editingItem, icon_mode: 'image' })}
           className={`flex-1 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all ${editingItem.icon_mode === 'image' ? 'bg-white dark:bg-slate-700 text-primary shadow-md' : 'text-slate-400'}`}
         >
           Custom Image
         </button>
      </div>

      {(!editingItem.icon_mode || editingItem.icon_mode === 'symbol') ? (
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Ãcone (Material Symbol)</label>
          <div className="flex gap-4">
            <input
              type="text"
              required
              value={editingItem.icon || ''}
              onChange={e => setEditingItem({ ...editingItem, icon: e.target.value })}
              placeholder="Ex: motorcycle, layers"
              className="flex-1 bg-slate-50 border border-slate-100 dark:bg-slate-800 dark:border-slate-700 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <span className="material-symbols-outlined text-2xl">{editingItem.icon || 'category'}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">URL da Imagem / SVG</label>
            <input
              type="text"
              value={(editingItem.icon?.startsWith('http') || editingItem.icon?.startsWith('/') || editingItem.icon?.length > 50) ? editingItem.icon : ''}
              onChange={e => setEditingItem({ ...editingItem, icon: e.target.value })}
              placeholder="https://exemplo.com/icone.png"
              className="w-full bg-slate-50 border border-slate-100 dark:bg-slate-800 dark:border-slate-700 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex items-center gap-6 p-6 bg-slate-50 dark:bg-slate-800 rounded-[35px] border border-dashed border-slate-200 dark:border-slate-700">
            <div className="size-20 rounded-3xl bg-white dark:bg-slate-900 shadow-xl flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-700">
              {(editingItem.icon?.startsWith('http') || editingItem.icon?.startsWith('/') || editingItem.icon?.length > 50) ? (
                <img src={editingItem.icon} className="size-full object-contain p-2" />
              ) : (
                <span className="material-symbols-outlined text-slate-300 text-3xl">add_photo_alternate</span>
              )}
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Upload Direto</p>
              <label className="cursor-pointer bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:shadow-md transition-all inline-block border border-slate-100 dark:border-slate-600">
                Importar Arquivo
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*,.svg" 
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setEditingItem({ ...editingItem, icon: reader.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }} 
                />
              </label>
              <p className="text-[9px] font-bold text-slate-400 mt-2">Formatos: SVG, PNG, JPG, WEBP</p>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Categoria Pai (Opcional)</label>
        <select
          value={editingItem.parent_id || ''}
          onChange={e => setEditingItem({ ...editingItem, parent_id: e.target.value || null })}
          className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Nenhuma (Categoria Principal)</option>
          {categoriesState.filter(c => !c.parent_id && c.id !== editingItem.id).map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Segmento (Tipo de Serviço)</label>
        <select
          value={editingItem.type || 'service'}
          onChange={e => setEditingItem({ ...editingItem, type: e.target.value })}
          className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="service" title="Ã°Å¸â€ºâ€™">Serviços / Delivery</option>
          <option value="mobility" title="Ã°Å¸Å¡â€”">Mobilidade / Passageiros</option>
        </select>
      </div>
    </>
  )}

  {editType === 'promotion' && (
    <>
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Texto de Desconto (Opcional)</label>
        <input
          type="text"
          value={editingItem.discount_text || ''}
          onChange={e => setEditingItem({ ...editingItem, discount_text: e.target.value })}
          placeholder="Ex: 20% OFF na primeira compra"
          className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Valor (%)</label>
          <input
            type="number"
            required
            value={editingItem.discount_value || ''}
            onChange={e => setEditingItem({ ...editingItem, discount_value: e.target.value })}
            className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Código (Opcional)</label>
          <input
            type="text"
            value={editingItem.coupon_code || ''}
            onChange={e => setEditingItem({ ...editingItem, coupon_code: e.target.value.toUpperCase() })}
            placeholder="CUPOM20"
            className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Expira em (Data e Hora)</label>
          <button
            type="button"
            onClick={() => {
              if (editingItem.expires_at) {
                const d = new Date(editingItem.expires_at);
                setTempDate(d.toISOString().split('T')[0]);
                setTempTime(d.toTimeString().slice(0, 5));
              } else {
                setTempDate(new Date().toISOString().split('T')[0]);
                setTempTime('23:59');
              }
              setDateModalOpen(true);
            }}
            className="w-full bg-slate-50 border border-slate-100 dark:bg-slate-800 dark:border-slate-700 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-white flex items-center justify-between group hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">event</span>
              <span>
                {editingItem.expires_at 
                  ? new Date(editingItem.expires_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
                  : 'Definir expiração'}
              </span>
            </div>
            <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">calendar_month</span>
          </button>
        </div>

        {/* Date/Time Picker Modal */}
        {dateModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-slate-900 rounded-[40px] p-8 shadow-2xl border border-slate-100 dark:border-slate-800 max-w-sm w-full"
            >
              <div className="text-center mb-8">
                <div className="size-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4 border border-primary/20">
                  <span className="material-symbols-outlined text-3xl">schedule</span>
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Agendar Expiração</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Defina quando a oferta sairá do ar</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Data</label>
                  <input 
                    type="date"
                    value={tempDate}
                    onChange={e => setTempDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Horário</label>
                  <input 
                    type="time"
                    value={tempTime}
                    onChange={e => setTempTime(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-primary text-center text-2xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-10">
                <button
                  type="button"
                  onClick={() => setDateModalOpen(false)}
                  className="py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black text-xs uppercase tracking-widest rounded-3xl hover:bg-slate-200 transition-all font-black"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (tempDate && tempTime) {
                      const finalDate = new Date(`${tempDate}T${tempTime}:00`);
                      setEditingItem({ ...editingItem, expires_at: finalDate.toISOString() });
                    }
                    setDateModalOpen(false);
                  }}
                  className="py-4 bg-primary text-slate-900 font-black text-xs uppercase tracking-widest rounded-3xl shadow-lg shadow-primary/20 hover:brightness-105 transition-all font-black"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Usos Máximos</label>
          <input
            type="number"
            value={editingItem.max_usage || ''}
            onChange={e => setEditingItem({ ...editingItem, max_usage: e.target.value })}
            placeholder="0 para ilimitado"
            className="w-full bg-slate-50 border border-slate-100 dark:bg-slate-800 dark:border-slate-700 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Imagem do Banner / Cupom</label>
        <div className="relative aspect-[3/1] rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center group hover:border-primary transition-colors">
          {editingItem.banner_url ? (
            <>
              <img src={editingItem.banner_url} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="bg-white text-slate-900 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">upload</span>
                  Trocar Imagem
                </span>
              </div>
            </>
          ) : (
            <div className="text-center p-6 pointer-events-none">
              <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">add_photo_alternate</span>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Clique para Enviar Imagem</p>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={async (e) => {
               const file = e.target.files?.[0];
               if (file) {
                 const url = await handleFileUpload(file, 'banners');
                 if (url) {
                    setEditingItem({ ...editingItem, banner_url: url });
                 }
               }
            }}
          />
        </div>
      </div>
    </>
  )}

  {editType === 'driver' && (
    <div className="grid grid-cols-2 gap-6">
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Veículo</label>
        <input
          type="text"
          value={editingItem.vehicle_type || ''}
          onChange={e => setEditingItem({ ...editingItem, vehicle_type: e.target.value })}
          placeholder="Ex: Moto, Carro"
          className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Placa</label>
        <input
          type="text"
          value={editingItem.license_plate || ''}
          onChange={e => setEditingItem({ ...editingItem, license_plate: e.target.value })}
          placeholder="ABC-1234"
          className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
    </div>
  )}

  {editType === 'partner' && (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Endereço do Ponto</label>
          <AddressSearchInput
            className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-bold text-sm"
            initialValue={editingItem.address || ''}
            onSelect={(addr) => setEditingItem({ ...editingItem, address: addr.formatted_address, latitude: addr.lat, longitude: addr.lng })}
            placeholder="Rua, Número..."
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Telefone de Contato</label>
          <input
            type="text"
            required
            value={editingItem.phone || ''}
            onChange={e => setEditingItem({ ...editingItem, phone: e.target.value })}
            className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-bold text-sm"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Horário de Funcionamento</label>
          <input
            type="text"
            value={editingItem.hours || ''}
            onChange={e => setEditingItem({ ...editingItem, hours: e.target.value })}
            placeholder="Ex: 08h às 22h"
            className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-bold text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Tipo de Ponto</label>
          <select
            value={editingItem.type || 'Ponto de Retirada'}
            onChange={e => setEditingItem({ ...editingItem, type: e.target.value })}
            className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-bold text-sm"
          >
            <option value="Ponto de Retirada">Ponto de Retirada</option>
            <option value="Hub Logístico">Hub Logístico</option>
            <option value="Loja Parceira">Loja Parceira</option>
            <option value="Outro">Outro</option>
          </select>
        </div>
      </div>
    </div>
  )}

  <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-[32px] border border-slate-100">
    <div className="flex-1">
      <p className="text-sm font-black text-slate-900">
        {editType === 'my_product' ? 'Item Disponível' : 'Status da Conta'}
      </p>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
        {editType === 'my_product' ? 'Habilita ou desativa o item no cardápio' : 'Habilita ou desativa o acesso'}
      </p>
    </div>
    <button
      type="button"
      onClick={() => {
        if (editType === 'my_product') {
          setEditingItem({ ...editingItem, is_available: !editingItem.is_available });
        } else {
          setEditingItem({ ...editingItem, is_active: !editingItem.is_active });
        }
      }}
      className={`w-16 h-10 rounded-full relative transition-colors ${(editType === 'my_product' ? editingItem.is_available : editingItem.is_active) ? 'bg-green-500' : 'bg-slate-300'}`}
    >
      <div className={`absolute top-1 w-8 h-8 bg-white rounded-full shadow-md transition-all ${(editType === 'my_product' ? editingItem.is_available : editingItem.is_active) ? 'left-7' : 'left-1'}`}></div>
    </button>
  </div>

      <div className="grid grid-cols-2 gap-4 mt-8">
        <button
          type="button"
          onClick={() => { setEditingItem(null); setEditType(null); }}
          className="w-full bg-slate-100 text-slate-500 rounded-3xl py-5 font-black uppercase tracking-widest hover:bg-slate-200 transition-all font-sans"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="w-full bg-primary text-slate-900 rounded-3xl py-5 font-black uppercase tracking-widest hover:brightness-105 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 font-sans"
        >
          {isSaving ? 'Salvando...' : 'Confirmar & Salvar'}
        </button>
      </div>
    </form>
            </motion.div>
          </div>
        )
      }

        {selectedDriverStudio && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-10 text-slate-900 overflow-hidden">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-3xl" onClick={() => setSelectedDriverStudio(null)}></div>
            
            <motion.div
initial={{ opacity: 0, scale: 0.9, y: 40 }}
animate={{ opacity: 1, scale: 1, y: 0 }}
className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-[64px] overflow-hidden shadow-[0_0_120px_rgba(0,0,0,0.5)] relative z-10 flex flex-col border border-white/10 dark:border-slate-800 h-[92vh]"
            >
{/* Header */}
<div className="p-8 md:p-12 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/30">
  <div className="flex items-center gap-6">
    <div className="size-20 rounded-[32px] bg-primary/20 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
      <span className="material-symbols-outlined text-4xl font-black">sports_motorsports</span>
    </div>
    <div>
      <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">Estúdio do Entregador</h2>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
        <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>
        {(typeof selectedDriverStudio.id === 'string' && selectedDriverStudio.id.startsWith('new-')) ? 'Novo Cadastro Operacional' : `ID: ${selectedDriverStudio.id?.substring(0, 8)}...`}
      </p>
    </div>
  </div>
  <button 
    onClick={() => setSelectedDriverStudio(null)}
    className="size-14 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all border border-slate-200 dark:border-slate-700 shadow-sm"
  >
    <span className="material-symbols-outlined">close</span>
  </button>
</div>

{/* Dashboard Navigation Tabs */}
            <div className="px-10 py-4 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 flex gap-8 overflow-x-auto no-scrollbar">
{[
  { id: 'personal', label: 'Dados Pessoais', icon: 'person' },
  { id: 'vehicle', label: 'Veículo', icon: 'directions_bike' },
  { id: 'finance', label: 'Financeiro', icon: 'account_balance' },
  { id: 'documents', label: 'Documentação', icon: 'description' },
].map(t => (
  <button
    key={t.id}
    onClick={() => setActiveStudioTab(t.id as any)}
    className={`flex items-center gap-2 py-4 px-2 border-b-4 transition-all whitespace-nowrap ${activeStudioTab === t.id ? 'border-primary text-slate-900 dark:text-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
  >
    <span className={`material-symbols-outlined text-xl ${activeStudioTab === t.id ? 'font-fill' : ''}`}>{t.icon}</span>
    <span className="text-xs font-black uppercase tracking-widest">{t.label}</span>
  </button>
))}
            </div>

            {/* Scrollable Form Area */}
            <div className="flex-1 overflow-y-auto p-10 scrollbar-hide">
<AnimatePresence mode="wait">
  <motion.div
    key={activeStudioTab}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.2 }}
    className="space-y-10"
  >
    {activeStudioTab === 'personal' && (
      <div className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="flex flex-col items-center gap-4">
            <div className="size-44 rounded-[48px] bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-700 shadow-2xl overflow-hidden relative group">
              <img 
                src={`https://ui-avatars.com/api/?name=${selectedDriverStudio.name || 'D'}&background=ffd900&color=000&size=256&bold=true`} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                <span className="material-symbols-outlined text-white text-4xl">add_a_photo</span>
              </div>
            </div>
            <div className="text-center">
              <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${selectedDriverStudio.is_active ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'}`}>
                <span className={`size-2 rounded-full ${selectedDriverStudio.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                {selectedDriverStudio.is_active ? 'Conta Ativa' : 'Conta Bloqueada'}
              </span>
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nome Completo</label>
                 <input 
                   type="text" 
                   value={selectedDriverStudio.name || ''}
                   onChange={e => setSelectedDriverStudio({...selectedDriverStudio, name: e.target.value})}
                   className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white transition-all shadow-inner"
                   placeholder="Nome do motorista"
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">WhatsApp / Celular</label>
                 <input 
                   type="text" 
                   value={selectedDriverStudio.phone || ''}
                   onChange={e => setSelectedDriverStudio({...selectedDriverStudio, phone: e.target.value})}
                   className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white transition-all shadow-inner"
                   placeholder="(00) 00000-0000"
                 />
              </div>
              <div className="md:col-span-1 space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">E-mail de Acesso</label>
                 <input 
                   type="email" 
                   value={selectedDriverStudio.email || ''}
                   onChange={e => setSelectedDriverStudio({...selectedDriverStudio, email: e.target.value})}
                   className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white transition-all shadow-inner"
                   placeholder="email@exemplo.com"
                 />
              </div>
              <div className="md:col-span-1 space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nova Senha</label>
                 <input 
                   type="password" 
                   value={selectedDriverStudio.password || ''}
                   onChange={e => setSelectedDriverStudio({...selectedDriverStudio, password: e.target.value})}
                   className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white transition-all shadow-inner"
                   placeholder="Preencha apenas para alterar/criar"
                 />
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-inner">
          <div className="flex items-center gap-3 mb-6">
             <span className="material-symbols-outlined text-primary">location_on</span>
             <h4 className="text-xs font-black uppercase tracking-widest dark:text-white">Localização Principal</h4>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Endereço Completo</label>
            <input 
              type="text" 
              value={selectedDriverStudio.address || ''}
              onChange={e => setSelectedDriverStudio({...selectedDriverStudio, address: e.target.value})}
              className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white transition-all shadow-sm"
              placeholder="Rua, Número, Bairro, Cidade - UF"
            />
          </div>
        </div>
      </div>
    )}

    {activeStudioTab === 'vehicle' && (
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="p-10 rounded-[48px] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 shadow-inner space-y-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="size-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-2xl font-bold">directions_bike</span>
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Ativos Transacionais</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Informações do Veículo de Trabalho</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Tipo de Veículo</label>
               <select 
                 value={selectedDriverStudio.vehicle_type || 'Moto'}
                 onChange={e => setSelectedDriverStudio({...selectedDriverStudio, vehicle_type: e.target.value})}
                 className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white appearance-none cursor-pointer"
               >
                 <option>Moto</option>
                 <option>Bicicleta</option>
                 <option>Carro</option>
                 <option>Van / Caminhão</option>
               </select>
             </div>
             <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Placa do Veículo</label>
               <input 
                 type="text" 
                 value={selectedDriverStudio.license_plate || ''}
                 onChange={e => setSelectedDriverStudio({...selectedDriverStudio, license_plate: e.target.value})}
                 className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white transition-all"
                 placeholder="ABC-1234"
               />
             </div>
             <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Modelo / Fabricante</label>
               <input 
                 type="text" 
                 value={selectedDriverStudio.vehicle_model || ''}
                 onChange={e => setSelectedDriverStudio({...selectedDriverStudio, vehicle_model: e.target.value})}
                 className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white transition-all"
                 placeholder="Ex: Honda CG 160"
               />
             </div>
             <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Cor Predominante</label>
               <input 
                 type="text" 
                 value={selectedDriverStudio.vehicle_color || ''}
                 onChange={e => setSelectedDriverStudio({...selectedDriverStudio, vehicle_color: e.target.value})}
                 className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white transition-all"
                 placeholder="Ex: Vermelha"
               />
             </div>
          </div>
        </div>
      </div>
    )}

    {activeStudioTab === 'finance' && (
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="p-10 rounded-[48px] bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 shadow-inner space-y-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="size-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-600">
              <span className="material-symbols-outlined text-2xl font-bold">account_balance</span>
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Dados para Repasse</h4>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest italic">Pagamentos & Conciliação</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Instituição Bancária</label>
               <input 
                 type="text" 
                 value={selectedDriverStudio.bank_info?.bank || ''}
                 onChange={e => setSelectedDriverStudio({...selectedDriverStudio, bank_info: { ...selectedDriverStudio.bank_info, bank: e.target.value }})}
                 className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white"
                 placeholder="Nome do Banco"
               />
             </div>
             <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Chave PIX (Principal)</label>
               <input 
                 type="text" 
                 value={selectedDriverStudio.bank_info?.pix_key || ''}
                 onChange={e => setSelectedDriverStudio({...selectedDriverStudio, bank_info: { ...selectedDriverStudio.bank_info, pix_key: e.target.value }})}
                 className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white"
                 placeholder="CPF, E-mail ou Telefone"
               />
             </div>
             <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Número da Agência</label>
               <input 
                 type="text" 
                 value={selectedDriverStudio.bank_info?.agency || ''}
                 onChange={e => setSelectedDriverStudio({...selectedDriverStudio, bank_info: { ...selectedDriverStudio.bank_info, agency: e.target.value }})}
                 className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white"
                 placeholder="0001"
               />
             </div>
             <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Conta & Dígito</label>
               <input 
                 type="text" 
                 value={selectedDriverStudio.bank_info?.account || ''}
                 onChange={e => setSelectedDriverStudio({...selectedDriverStudio, bank_info: { ...selectedDriverStudio.bank_info, account: e.target.value }})}
                 className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white"
                 placeholder="00000000-0"
               />
             </div>
          </div>
        </div>
      </div>
    )}

    {activeStudioTab === 'documents' && (
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="p-10 rounded-[48px] bg-indigo-50/30 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10 shadow-inner space-y-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="size-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-600">
              <span className="material-symbols-outlined text-2xl font-bold">description</span>
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Documentação & KYC</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verificação de Identidade e Segurança</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">CPF / Documento</label>
               <input 
                 type="text" 
                 value={selectedDriverStudio.document_number || ''}
                 onChange={e => setSelectedDriverStudio({...selectedDriverStudio, document_number: e.target.value})}
                 className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all shadow-sm"
                 placeholder="000.000.000-00"
               />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Status de Verificação</label>
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1 flex items-center gap-3 bg-white dark:bg-slate-900 rounded-2xl px-6 py-5 border border-slate-100 dark:border-slate-800 shadow-sm">
                     <span className={`size-3 rounded-full ${selectedDriverStudio.status === 'active' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                     <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                       {selectedDriverStudio.status === 'active' ? 'Verificado' : 'Pendente / Em Análise'}
                     </span>
                  </div>
                  {selectedDriverStudio.status !== 'active' && (
                    <button
                      onClick={() => {
                        console.log('--- BUTTON CLICK: Aprovar Documentos (MyStudioTab) ---', selectedDriverStudio.id);
                        handleUpdateDriverStatus(selectedDriverStudio.id, 'active');
                      }}
                      className="px-6 py-5 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">verified</span>
                      Aprovar Documentos
                    </button>
                  )}
                </div>
              </div>
          </div>

          {/* Upload de Documentos */}
          <div className="space-y-4">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Arquivos Digitais</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { key: 'doc_cnh_frente', label: 'CNH Frente', icon: 'badge' },
                { key: 'doc_cnh_verso',  label: 'CNH Verso',  icon: 'badge' },
                { key: 'doc_residencia', label: 'Comprovante de Residência', icon: 'home_work' },
              ].map(({ key, label, icon }) => {
                const url: string = selectedDriverStudio[key] || '';
                const isPdf = url.toLowerCase().includes('.pdf');
                const isUploading = selectedDriverStudio[`_uploading_${key}`];
                return (
                  <div key={key} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    {/* Preview */}
                    <div className="h-28 bg-slate-50 dark:bg-slate-800 flex items-center justify-center relative">
                      {url ? (
                        isPdf ? (
                          <a href={url} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 group">
                            <span className="material-symbols-outlined text-4xl text-indigo-500 group-hover:scale-110 transition-transform">picture_as_pdf</span>
                            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Abrir PDF</span>
                          </a>
                        ) : (
                          <a href={url} target="_blank" rel="noreferrer">
                            <img src={url} alt={label} className="h-full max-h-28 object-contain rounded-xl hover:scale-105 transition-transform" />
                          </a>
                        )
                      ) : (
                        <span className="material-symbols-outlined text-4xl text-slate-300">{icon}</span>
                      )}
                      {isUploading && (
                        <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center">
                          <div className="size-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    {/* Info + Upload */}
                    <div className="p-4 space-y-3">
                      <div>
                        <p className="text-[10px] font-black text-slate-700 dark:text-white uppercase tracking-widest">{label}</p>
                        {url ? (
                          <p className="text-[9px] font-bold text-emerald-500 mt-0.5 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[10px]">check_circle</span> Arquivo enviado
                          </p>
                        ) : (
                          <p className="text-[9px] font-bold text-slate-400 mt-0.5">Nenhum arquivo</p>
                        )}
                      </div>
                      <label className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                        url
                          ? 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 dark:border-slate-700'
                          : 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/20 hover:scale-[1.02]'
                      }`}>
                        <span className="material-symbols-outlined text-sm">upload_file</span>
                        {url ? 'Substituir' : 'Enviar Arquivo'}
                        <input
                          type="file"
                          className="hidden"
                          accept="image/png,image/jpeg,image/jpg,application/pdf"
                          disabled={isUploading}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            // Valida tipo
                            const allowed = ['image/png','image/jpeg','image/jpg','application/pdf'];
                            if (!allowed.includes(file.type)) {
                              toastError('Formato inválido. Use PNG, JPEG ou PDF.');
                              return;
                            }
                            // Valida tamanho (10MB)
                            if (file.size > 10 * 1024 * 1024) {
                              toastError('Arquivo muito grande. Máximo 10MB.');
                              return;
                            }
                            setSelectedDriverStudio((prev: any) => ({...prev, [`_uploading_${key}`]: true}));
                            try {
                              const ext = file.name.split('.').pop();
                              const driverId = selectedDriverStudio.id || 'novo';
                              const path = `drivers/${driverId}/${key}_${Date.now()}.${ext}`;
                              const { error: upErr } = await supabase.storage
                                .from('documents')
                                .upload(path, file, { upsert: true });
                              if (upErr) throw upErr;
                              const { data: pub } = supabase.storage.from('documents').getPublicUrl(path);
                              setSelectedDriverStudio((prev: any) => ({
                                ...prev,
                                [key]: pub.publicUrl,
                                [`_uploading_${key}`]: false
                              }));
                              toastSuccess(`${label} enviado com sucesso!`);
                            } catch (err: any) {
                              setSelectedDriverStudio((prev: any) => ({...prev, [`_uploading_${key}`]: false}));
                              toastError('Erro no upload: ' + err.message);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[9px] font-bold text-slate-400 text-center">
              Formatos aceitos: <span className="text-indigo-400 font-black">PNG, JPEG, PDF</span> · Tamanho máximo: <span className="text-indigo-400 font-black">10MB</span>
            </p>
          </div>
        </div>
      </div>
    )}
  </motion.div>
</AnimatePresence>
            </div>

            {/* Footer Actions */}
            <div className="p-8 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
<div className="flex gap-4">
  <button 
    onClick={() => setSelectedDriverStudio({...selectedDriverStudio, is_active: !selectedDriverStudio.is_active})}
    className={`px-8 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${selectedDriverStudio.is_active ? 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white border border-red-100' : 'bg-green-50 text-green-500 hover:bg-green-500 hover:text-white border border-green-100'}`}
  >
    <span className="material-symbols-outlined text-lg">{selectedDriverStudio.is_active ? 'block' : 'check_circle'}</span>
    {selectedDriverStudio.is_active ? 'Bloquear Acesso' : 'Desbloquear Acesso'}
  </button>
</div>
<div className="flex gap-6 items-center">
  <button 
    onClick={() => setSelectedDriverStudio(null)}
    className="px-10 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-200 transition-all font-sans"
  >
    Cancelar
  </button>
  <button 
     disabled={isSaving}
     onClick={async () => {
       setIsSaving(true);
         try {
           // Obter merchant_id se não estiver presente
           let mId = selectedDriverStudio.merchant_id;
           if (!mId && session?.user?.email) {
             const { data: adminData } = await supabase
               .from('admin_users')
               .select('id')
               .eq('email', session.user.email)
               .single();
             if (adminData) mId = adminData.id;
           }

           const isNew = !selectedDriverStudio.id || (typeof selectedDriverStudio.id === 'string' && selectedDriverStudio.id.startsWith('new-'));
           let finalId = isNew ? undefined : selectedDriverStudio.id;

           if (selectedDriverStudio.email) {
             const { data: { session: authSession } } = await supabase.auth.getSession();
             const payload = {
               targetEmail: selectedDriverStudio.email,
               targetPassword: selectedDriverStudio.password || undefined,
               name: selectedDriverStudio.name,
               phone: selectedDriverStudio.phone,
               callerEmail: authSession?.user?.email
             };

             const res = await supabase.functions.invoke('manage-driver-auth', { body: payload });
             
             if (res.error) throw new Error('Falha de Autenticação: ' + res.error.message);
             if (!res.data.success) throw new Error(res.data.error || 'Erro no setup da conta do entregador');
             
             finalId = res.data.user.id;
           } else if (isNew) {
             throw new Error('O e-mail é obrigatório para um novo entregador.');
           }

           const driverData = {
             id: finalId,
             name: selectedDriverStudio.name,
             email: selectedDriverStudio.email,
             phone: selectedDriverStudio.phone,
             vehicle_type: selectedDriverStudio.vehicle_type,
             vehicle_model: selectedDriverStudio.vehicle_model,
             vehicle_color: selectedDriverStudio.vehicle_color,
             license_plate: selectedDriverStudio.license_plate,
             document_number: selectedDriverStudio.document_number,
             address: selectedDriverStudio.address,
             bank_info: selectedDriverStudio.bank_info,
             is_active: selectedDriverStudio.is_active,
             status: selectedDriverStudio.status || 'active',
             merchant_id: mId
           };

         let error;
         const { data: existingDriver } = await supabase.from('drivers_delivery').select('id').eq('id', finalId).maybeSingle();

         if (!existingDriver) {
           const { error: err } = await supabase.from('drivers_delivery').insert([driverData]);
           error = err;
         } else {
           const { error: err } = await supabase.from('drivers_delivery').update(driverData).eq('id', finalId);
           error = err;
         }
         if (error) throw error;
         toastSuccess('Dados do entregador salvos com sucesso!');
         setSelectedDriverStudio(null);
         fetchDrivers();
         fetchMyDrivers();
       } catch (err: any) {
         toastError('Erro ao salvar entregador: ' + err.message);
       } finally {
         setIsSaving(false);
       }
     }}
    className="px-12 py-5 bg-primary text-slate-900 font-black text-[10px] uppercase tracking-widest rounded-3xl shadow-xl shadow-primary/20 hover:scale-[1.05] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
  >
    <span className={`material-symbols-outlined text-lg font-bold ${isSaving ? 'animate-spin' : ''}`}>{isSaving ? 'sync' : 'done_all'}</span>
    {isSaving ? 'Processando...' : 'Confirmar & Salvar'}
  </button>
</div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ Client Detail Studio (Comprehensive Editing) ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ */}
      {selectedUserStudio && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-10 text-slate-900 overflow-hidden">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-3xl" onClick={() => setSelectedUserStudio(null)}></div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-[64px] overflow-hidden shadow-[0_0_120px_rgba(0,0,0,0.5)] relative z-10 flex flex-col border border-white/10 dark:border-slate-800 h-[92vh]"
          >
            {/* Header */}
            <div className="p-8 md:p-12 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/30">
<div className="flex items-center gap-6">
  <div className="size-20 rounded-[32px] bg-primary/20 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
    <span className="material-symbols-outlined text-4xl font-black">person</span>
  </div>
  <div>
    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">Estúdio do Cliente</h2>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
      <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>
      {(typeof selectedUserStudio.id === 'string' && selectedUserStudio.id.startsWith('new-')) ? 'Novo Cadastro Operacional' : `ID: ${selectedUserStudio.id?.substring(0, 8)}...`}
    </p>
  </div>
</div>
<button 
  onClick={() => setSelectedUserStudio(null)}
  className="size-14 rounded-3xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all border border-slate-200 dark:border-slate-700 shadow-xl hover:rotate-90"
>
  <span className="material-symbols-outlined text-2xl font-bold">close</span>
</button>
            </div>

            {/* Navigation Tabs */}
            <div className="px-12 py-2 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 flex gap-10 overflow-x-auto no-scrollbar">
{[
  { id: 'personal', label: 'Cadastro Base', icon: 'account_circle' },
  { id: 'wallet', label: 'Carteira & Saldo', icon: 'wallet' },
  { id: 'security', label: 'Segurança & Status', icon: 'verified_user' },
  { id: 'iziblack', label: 'Izi Black VIP', icon: 'workspace_premium' },
].map(t => (
  <button
    key={t.id}
    onClick={() => setActiveStudioTab(t.id as any)}
    className={`flex items-center gap-3 py-6 px-4 border-b-4 transition-all whitespace-nowrap group ${activeStudioTab === t.id ? 'border-primary text-slate-900 dark:text-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
  >
    <span className={`material-symbols-outlined text-2xl ${activeStudioTab === t.id ? 'font-fill text-primary' : 'group-hover:scale-110 transition-transform'}`}>{t.icon}</span>
    <span className="text-xs font-black uppercase tracking-[0.15em]">{t.label}</span>
  </button>
))}
            </div>

            {/* Scrollable Form Area */}
            <div className="flex-1 overflow-y-auto p-12 scrollbar-hide">
<AnimatePresence mode="wait">
  <motion.div
    key={activeStudioTab}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.2 }}
    className="max-w-4xl mx-auto w-full"
  >
    {activeStudioTab === 'personal' && (
      <div className="space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="flex flex-col items-center gap-6">
            <div className="size-48 rounded-[56px] bg-slate-100 dark:bg-slate-800 border-8 border-white dark:border-slate-700 shadow-2xl overflow-hidden relative group cursor-pointer ring-4 ring-primary/5">
              <img 
                src={`https://ui-avatars.com/api/?name=${selectedUserStudio.name || 'C'}&background=ffd900&color=000&size=256&bold=true`} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-5xl drop-shadow-lg">photo_camera</span>
              </div>
            </div>
            <div className="text-center">
              <div className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border shadow-sm ${selectedUserStudio.is_active ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                <span className={`size-2.5 rounded-full ${selectedUserStudio.is_active ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                {selectedUserStudio.is_active ? 'Conta Verificada' : 'Conta Restrita'}
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nome Completo</label>
                 <input 
                   type="text" 
                   value={selectedUserStudio.name || ''}
                   onChange={e => setSelectedUserStudio({...selectedUserStudio, name: e.target.value})}
                   className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-[28px] px-8 py-5 font-bold text-base focus:ring-4 focus:ring-primary/20 dark:text-white transition-all shadow-inner"
                   placeholder="Nome do cliente"
                 />
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Telefone / WhatsApp</label>
                 <input 
                   type="text" 
                   value={selectedUserStudio.phone || ''}
                   onChange={e => setSelectedUserStudio({...selectedUserStudio, phone: e.target.value})}
                   className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-[28px] px-8 py-5 font-bold text-base focus:ring-4 focus:ring-primary/20 dark:text-white transition-all shadow-inner"
                   placeholder="(00) 00000-0000"
                 />
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">E-mail</label>
                 <input 
                   type="email" 
                   value={selectedUserStudio.email || ''}
                   onChange={e => setSelectedUserStudio({...selectedUserStudio, email: e.target.value})}
                   className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-[28px] px-8 py-5 font-bold text-base focus:ring-4 focus:ring-primary/20 dark:text-white transition-all shadow-inner"
                   placeholder="cliente@exemplo.com"
                 />
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">CPF</label>
                 <input 
                   type="text" 
                   value={selectedUserStudio.cpf || ''}
                   onChange={e => setSelectedUserStudio({...selectedUserStudio, cpf: e.target.value})}
                   className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-[28px] px-8 py-5 font-bold text-base focus:ring-4 focus:ring-primary/20 dark:text-white transition-all shadow-inner"
                   placeholder="000.000.000-00"
                 />
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Data de Nascimento</label>
                 <input 
                   type="date" 
                   value={selectedUserStudio.birth_date || ''}
                   onChange={e => setSelectedUserStudio({...selectedUserStudio, birth_date: e.target.value})}
                   className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-[28px] px-8 py-5 font-bold text-base focus:ring-4 focus:ring-primary/20 dark:text-white transition-all shadow-inner"
                 />
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Gênero</label>
                 <div className="relative">
                   <select 
                     value={selectedUserStudio.gender || ''}
                     onChange={e => setSelectedUserStudio({...selectedUserStudio, gender: e.target.value})}
                     className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-[28px] px-8 py-5 font-bold text-base focus:ring-4 focus:ring-primary/20 dark:text-white transition-all shadow-inner appearance-none cursor-pointer"
                   >
                     <option value="">Selecionar</option>
                     <option value="masculino">Masculino</option>
                     <option value="feminino">Feminino</option>
                     <option value="outro">Outro</option>
                     <option value="prefiro_nao_informar">Prefiro não informar</option>
                   </select>
                   <span className="material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Endereço Completo */}
        <div className="p-10 rounded-[48px] bg-blue-50/30 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 shadow-inner space-y-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="size-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-600">
              <span className="material-symbols-outlined text-2xl font-bold">location_on</span>
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Endereço Residencial</h4>
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest italic">Localização Principal do Cliente</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-3">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">CEP</label>
               <input 
                 type="text" 
                 value={selectedUserStudio.zip_code || ''}
                 onChange={e => setSelectedUserStudio({...selectedUserStudio, zip_code: e.target.value})}
                 className="w-full bg-white dark:bg-slate-900 border-none rounded-[28px] px-8 py-5 font-bold text-base focus:ring-4 focus:ring-blue-500/20 dark:text-white transition-all shadow-sm"
                 placeholder="00000-000"
               />
            </div>
            <div className="md:col-span-3 space-y-3">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Rua / Avenida / Logradouro</label>
               <input 
                 type="text" 
                 value={selectedUserStudio.address || ''}
                 onChange={e => setSelectedUserStudio({...selectedUserStudio, address: e.target.value})}
                 className="w-full bg-white dark:bg-slate-900 border-none rounded-[28px] px-8 py-5 font-bold text-base focus:ring-4 focus:ring-blue-500/20 dark:text-white transition-all shadow-sm"
                 placeholder="Nome da rua"
               />
            </div>
            <div className="space-y-3">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Número</label>
               <input 
                 type="text" 
                 value={selectedUserStudio.address_number || ''}
                 onChange={e => setSelectedUserStudio({...selectedUserStudio, address_number: e.target.value})}
                 className="w-full bg-white dark:bg-slate-900 border-none rounded-[28px] px-8 py-5 font-bold text-base focus:ring-4 focus:ring-blue-500/20 dark:text-white transition-all shadow-sm"
                 placeholder="123"
               />
            </div>
            <div className="space-y-3">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Complemento</label>
               <input 
                 type="text" 
                 value={selectedUserStudio.address_complement || ''}
                 onChange={e => setSelectedUserStudio({...selectedUserStudio, address_complement: e.target.value})}
                 className="w-full bg-white dark:bg-slate-900 border-none rounded-[28px] px-8 py-5 font-bold text-base focus:ring-4 focus:ring-blue-500/20 dark:text-white transition-all shadow-sm"
                 placeholder="Apto 12, Bloco B"
               />
            </div>
            <div className="space-y-3">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Bairro</label>
               <input 
                 type="text" 
                 value={selectedUserStudio.neighborhood || ''}
                 onChange={e => setSelectedUserStudio({...selectedUserStudio, neighborhood: e.target.value})}
                 className="w-full bg-white dark:bg-slate-900 border-none rounded-[28px] px-8 py-5 font-bold text-base focus:ring-4 focus:ring-blue-500/20 dark:text-white transition-all shadow-sm"
                 placeholder="Nome do bairro"
               />
            </div>
            <div className="space-y-3">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Cidade</label>
               <input 
                 type="text" 
                 value={selectedUserStudio.city || ''}
                 onChange={e => setSelectedUserStudio({...selectedUserStudio, city: e.target.value})}
                 className="w-full bg-white dark:bg-slate-900 border-none rounded-[28px] px-8 py-5 font-bold text-base focus:ring-4 focus:ring-blue-500/20 dark:text-white transition-all shadow-sm"
                 placeholder="Nome da cidade"
               />
            </div>
            <div className="md:col-span-2 space-y-3">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Estado (UF)</label>
               <div className="relative">
                 <select 
                   value={selectedUserStudio.state || ''}
                   onChange={e => setSelectedUserStudio({...selectedUserStudio, state: e.target.value})}
                   className="w-full bg-white dark:bg-slate-900 border-none rounded-[28px] px-8 py-5 font-bold text-base focus:ring-4 focus:ring-blue-500/20 dark:text-white transition-all shadow-sm appearance-none cursor-pointer"
                 >
                   <option value="">Selecionar UF</option>
                   {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                     <option key={uf} value={uf}>{uf}</option>
                   ))}
                 </select>
                 <span className="material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
               </div>
            </div>
          </div>
        </div>

        {/* Observações Internas */}
        <div className="p-10 rounded-[48px] bg-amber-50/30 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10 shadow-inner space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="size-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-600">
              <span className="material-symbols-outlined text-2xl font-bold">sticky_note_2</span>
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Observações Internas</h4>
              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest italic">Visível apenas para administradores</p>
            </div>
          </div>
          <textarea 
            value={selectedUserStudio.notes || ''}
            onChange={e => setSelectedUserStudio({...selectedUserStudio, notes: e.target.value})}
            className="w-full bg-white dark:bg-slate-900 border-none rounded-3xl px-8 py-5 font-bold text-sm focus:ring-4 focus:ring-amber-500/20 dark:text-white transition-all shadow-sm h-32 resize-none"
            placeholder="Anotações sobre o cliente, preferências, restrições, informações relevantes..."
          />
        </div>

        <div className="p-10 rounded-[48px] bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/50 shadow-inner">
          <div className="flex items-center gap-4 mb-8">
            <div className="size-12 rounded-2xl bg-primary flex items-center justify-center text-slate-900 shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-2xl font-bold">history</span>
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.2em] dark:text-white">Resumo Cronológico</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Dados gerados pelo sistema</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Cliente desde</span>
               <span className="text-xl font-black text-slate-900 dark:text-white">
                  {selectedUserStudio.created_at ? new Date(selectedUserStudio.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Novo Registro'}
               </span>
            </div>
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">ID Global</span>
               <span className="text-xs font-mono font-bold text-slate-500 truncate block">
                  {selectedUserStudio.id}
               </span>
            </div>
          </div>
        </div>
      </div>
    )}

    {activeStudioTab === 'wallet' && (
      <div className="space-y-10">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-12 rounded-[56px] text-white shadow-2xl shadow-emerald-500/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform">
             <span className="material-symbols-outlined text-[160px] font-black">account_balance_wallet</span>
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-4">Saldo Disponível na Carteira</p>
            <h3 className="text-6xl font-black tracking-tighter mb-4 flex items-baseline gap-2">
              <span className="izi-coin-symbol">Z</span>
              {selectedUserStudio.izi_coins?.toLocaleString('pt-BR') || '0'}
            </h3>
            <div className="flex gap-4">
               <button onClick={() => setShowAddCreditModal(true)} className="px-6 py-3 bg-white/20 backdrop-blur-md rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/30 transition-all border border-white/20">Adicionar Créditos</button>
               <button onClick={() => setShowWalletStatementModal(true)} className="px-6 py-3 bg-black/10 backdrop-blur-md rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black/20 transition-all border border-white/5">Extrato Detalhado</button>
            </div>
          </div>
        </div>

        <div className="p-10 rounded-[48px] bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/50 shadow-inner">
           <h4 className="text-xs font-black uppercase tracking-[0.2em] dark:text-white mb-8 flex items-center gap-3">
             <span className="size-2 rounded-full bg-emerald-500"></span>
             Histórico Recente de Transações
           </h4>
           <div className="space-y-4">
              {isWalletLoading ? (
                <div className="flex items-center gap-3 h-20 px-6">
                  <span className="material-symbols-outlined animate-spin text-emerald-500">progress_activity</span>
                  <span className="text-xs font-bold text-slate-400">Carregando carteira...</span>
                </div>
              ) : walletTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl text-center">
                  <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2">receipt_long</span>
                  <span className="text-xs font-bold text-slate-400">Nenhuma transação encontrada</span>
                </div>
              ) : (
                walletTransactions.slice(0, 5).map(tx => {
                  const isPositive = tx.type === 'deposito' || tx.type === 'reembolso';
                  return (
                  <div key={tx.id} className="flex items-center justify-between p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm transition-all hover:scale-[1.01]">
                     <div className="flex items-center gap-4">
                        <div className={`size-10 rounded-xl flex items-center justify-center ${!isPositive ? 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400' : 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
                           <span className="material-symbols-outlined text-xl">{!isPositive ? 'shopping_bag' : 'add_circle'}</span>
                        </div>
                        <div>
                           <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{tx.description || (!isPositive ? 'Uso de Saldo' : 'Aporte de Saldo')}</p>
                           <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(tx.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })} ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ {new Date(tx.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                     </div>
                     <span className={`text-sm font-black ${!isPositive ? 'text-red-500' : 'text-emerald-500'}`}>
                       {!isPositive ? '- ' : '+ '}<span className="izi-coin-symbol">Z</span> {Number(tx.amount).toLocaleString('pt-BR')}
                     </span>
                  </div>
                )})
              )}
           </div>
        </div>


      </div>
    )}

    {activeStudioTab === 'iziblack' && (
      <div className="space-y-12">
        <div className="p-10 rounded-[48px] bg-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] -mr-20 -mt-20 group-hover:bg-white/10 transition-colors"></div>
          <div className="flex items-center gap-6 mb-10 relative z-10">
            <div className="size-16 rounded-3xl bg-gradient-to-br from-slate-700 to-black flex items-center justify-center text-white shadow-xl shadow-black/50 border border-white/10">
              <span className="material-symbols-outlined text-3xl font-bold fill-1">workspace_premium</span>
            </div>
            <div>
              <h4 className="text-xl font-black uppercase tracking-tight text-white">Programa Izi Black</h4>
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Painel Administrativo VIP</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
             <div className="space-y-4">
                <label className="text-[10px] font-black text-white/50 uppercase tracking-widest ml-4">Status da Assinatura</label>
                <div className="relative">
                  <select 
                    value={selectedUserStudio.is_izi_black ? 'active' : 'inactive'}
                    onChange={e => setSelectedUserStudio({...selectedUserStudio, is_izi_black: e.target.value === 'active'})}
                    className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-5 font-black text-sm focus:ring-4 focus:ring-white/10 text-white appearance-none cursor-pointer"
                  >
                    <option value="active" className="text-black">Ã°Å¸Å¸Â¢ Assinatura VIP Ativa</option>
                    <option value="inactive" className="text-black">âšª Sem Assinatura (Conta Comum)</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none">expand_more</span>
                </div>
             </div>
             <div className="p-6 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Cashback Histórico Ganho</p>
                  <p className="text-3xl font-black text-white tabular-nums italic">R$ <span className="text-emerald-400">{(selectedUserStudio.cashback_earned || 0).toLocaleString('pt-BR', {minimumFractionDigits:2})}</span></p>
                </div>
             </div>
          </div>
        </div>
      </div>
    )}

    {activeStudioTab === 'security' && (
      <div className="space-y-12">
        <div className="p-10 rounded-[48px] bg-slate-50 dark:bg-slate-800/30 border border-100 dark:border-slate-800/50 shadow-inner">
          <div className="flex items-center gap-4 mb-10">
            <div className="size-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <span className="material-symbols-outlined text-2xl font-bold">lock</span>
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.2em] dark:text-white">Estado Crítico & Segurança</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Controles de acesso do usuário</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Status Transacional</label>
                <div className="relative">
                  <select 
                    value={selectedUserStudio.status || 'active'}
                    onChange={e => setSelectedUserStudio({...selectedUserStudio, status: e.target.value, is_active: e.target.value === 'active'})}
                    className="w-full bg-white dark:bg-slate-900 border-none rounded-3xl px-8 py-5 font-bold text-sm focus:ring-4 focus:ring-primary/20 dark:text-white appearance-none cursor-pointer shadow-sm"
                  >
                    <option value="active">Ã°Å¸Å¸Â¢ Ativo (Acesso Total)</option>
                    <option value="inactive">âšª Inativo (Apenas Leitura)</option>
                    <option value="suspended">Ã°Å¸Å¸Â¡ Suspenso (Ação Requerida)</option>
                    <option value="blocked">Ã°Å¸â€Â´ Bloqueado (Acesso Negado)</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                </div>
             </div>
             <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Autenticação</label>
                <button className="w-full bg-white dark:bg-slate-900 border-none rounded-3xl px-8 py-5 font-black text-[10px] uppercase tracking-widest text-indigo-600 dark:text-indigo-400 shadow-sm hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-lg">key</span>
                  Resetar Senha por E-mail
                </button>
             </div>
          </div>
        </div>

        <div className="p-10 rounded-[56px] border-4 border-dashed border-red-100 dark:border-red-900/30 flex flex-col items-center text-center gap-6 py-16">
           <div className="size-20 rounded-[32px] bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500">
             <span className="material-symbols-outlined text-4xl font-black">gpp_maybe</span>
           </div>
           <div>
              <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Zona de Exclusão</h4>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest max-w-sm mx-auto">Estas ações são permanentes e afetarão todos os dados históricos deste cliente.</p>
           </div>
           <button className="px-10 py-5 bg-red-500 text-white font-black text-[10px] uppercase tracking-widest rounded-3xl shadow-2xl shadow-red-500/30 hover:scale-105 transition-all">
             Apagar Registro do Banco de Dados
           </button>
        </div>
      </div>
    )}
  </motion.div>
</AnimatePresence>
            </div>

            {/* Footer Actions */}
            <div className="p-10 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
<div className="flex gap-4">
  <button 
    onClick={() => setSelectedUserStudio({...selectedUserStudio, is_active: !selectedUserStudio.is_active, status: !selectedUserStudio.is_active ? 'active' : 'inactive'})}
    className={`px-10 py-5 rounded-[28px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 border shadow-sm ${selectedUserStudio.is_active ? 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white border-red-100' : 'bg-green-50 text-green-500 hover:bg-green-500 hover:text-white border-green-100'}`}
  >
    <span className="material-symbols-outlined text-xl">{selectedUserStudio.is_active ? 'block' : 'check_circle'}</span>
    {selectedUserStudio.is_active ? 'Bloquear Cliente' : 'Ativar Acesso'}
  </button>
</div>
<div className="flex gap-6 items-center">
  <button 
    onClick={() => setSelectedUserStudio(null)}
    className="px-8 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-all underline decoration-2 underline-offset-8 decoration-primary"
  >
    Cancelar
  </button>
  <button 
    disabled={isSaving}
    onClick={async () => {
      setIsSaving(true);
      try {
        const userData = {
          name: selectedUserStudio.name,
          phone: selectedUserStudio.phone,
          email: selectedUserStudio.email,
          cpf: selectedUserStudio.cpf,
          birth_date: selectedUserStudio.birth_date || null,
          gender: selectedUserStudio.gender,
          address: selectedUserStudio.address,
          address_number: selectedUserStudio.address_number,
          address_complement: selectedUserStudio.address_complement,
          neighborhood: selectedUserStudio.neighborhood,
          city: selectedUserStudio.city,
          state: selectedUserStudio.state,
          zip_code: selectedUserStudio.zip_code,
          notes: selectedUserStudio.notes,
          is_active: selectedUserStudio.is_active,
          status: selectedUserStudio.status || 'active',
          is_izi_black: selectedUserStudio.is_izi_black || false
        };

        const isNew = !selectedUserStudio.id || (typeof selectedUserStudio.id === 'string' && selectedUserStudio.id.startsWith('new-'));
        
        let error;
        if (isNew) {
           const { error: err } = await supabase.from('users_delivery').insert([userData]);
           error = err;
        } else {
           const { error: err } = await supabase.from('users_delivery').update(userData).eq('id', selectedUserStudio.id);
           error = err;
        }
        if (error) throw error;
        toastSuccess('Dados do cliente salvos com sucesso!');
        if (selectedUser && selectedUser.id === selectedUserStudio.id) {
          setSelectedUser({ ...selectedUser, ...selectedUserStudio });
        }
        setSelectedUserStudio(null);
        fetchUsers();
      } catch (err: any) {
        toastError('Erro ao salvar cliente: ' + err.message);
      } finally {
        setIsSaving(false);
      }
    }}
    className="px-14 py-6 bg-primary text-slate-900 font-black text-[10px] uppercase tracking-widest rounded-full shadow-[0_20px_40px_rgba(255,217,0,0.3)] hover:scale-[1.05] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
  >
    <span className={`material-symbols-outlined text-xl font-bold ${isSaving ? 'animate-spin' : ''}`}>{isSaving ? 'sync' : 'done_all'}</span>
    {isSaving ? 'Processando...' : 'Confirmar & Salvar Alterações'}
  </button>
</div>
            </div>
          </motion.div>
        </div>
      )}

      {/* â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢ Active Orders Live Monitor â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢ */}
      {showActiveOrdersModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-10 text-slate-900">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => setShowActiveOrdersModal(false)}></div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-4xl bg-[#F8F9FA] dark:bg-slate-900 rounded-[48px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.4)] relative z-10 flex flex-col border border-white/20 dark:border-slate-800 h-[80vh]"
          >
            {/* Header */}
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-950/50">
<div className="flex items-center gap-4">
  <div className="size-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/10">
    <span className="material-symbols-outlined text-3xl font-bold animate-pulse">shopping_cart</span>
  </div>
  <div>
    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Monitor de Pedidos Ativos</h2>
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{allOrders?.filter(o => !['concluido', 'cancelado'].includes(o.status)).length || 0} pedidos em andamento</p>
  </div>
</div>
<button 
  onClick={() => setShowActiveOrdersModal(false)}
  className="size-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all border border-slate-200 dark:border-slate-700 shadow-sm"
>
  <span className="material-symbols-outlined">close</span>
</button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8 space-y-4 scrollbar-hide">
{allOrders?.filter(o => !['concluido', 'cancelado'].includes(o.status)).length === 0 ? (
  <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4 py-20">
    <span className="material-symbols-outlined text-6xl">shopping_cart_off</span>
    <p className="text-sm font-bold uppercase tracking-widest">Nenhum pedido ativo no momento</p>
  </div>
) : (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {allOrders?.filter(o => !['concluido', 'cancelado'].includes(o.status)).map((o, idx) => (
      <motion.div 
        key={o.id}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: idx * 0.05 }}
        className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm group hover:shadow-md transition-all flex flex-col justify-between"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 font-bold border border-slate-100 dark:border-slate-800">
              #{o.id.slice(0, 4).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-white line-clamp-1">{o.user_name || 'Cliente'}</p>
              <div className="flex items-center gap-1.5">
                <span className={`size-1.5 rounded-full ${
                  o.status === 'preparando' ? 'bg-amber-500 animate-pulse' :
                  ['picked_up', 'em_rota', 'a_caminho'].includes(o.status) ? 'bg-emerald-500' :
                  'bg-blue-500'
                }`} />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {o.status === 'preparando' ? 'Em Preparação' :
                   o.status === 'pronto' ? 'Pronto p/ Retirada' :
                   ['picked_up', 'em_rota', 'a_caminho', 'saiu_para_entrega'].includes(o.status) ? 'Saiu para Entrega' :
                   ['waiting_driver', 'pending'].includes(o.status) ? 'Buscando Entregador' :
                   ['accepted', 'a_caminho_coleta', 'no_local_coleta', 'chegou_coleta', 'confirmado'].includes(o.status) ? 'Vindo coletar' :
                   o.status}
                </p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-black text-primary">R$ {o.total_price?.toFixed(2).replace('.', ',')}</p>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
            <span className="material-symbols-outlined text-xs">location_on</span>
            <span className="truncate">{o.delivery_address || 'Endereço não informado'}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
            <span className="material-symbols-outlined text-xs">schedule</span>
            <span>{new Date(o.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        <button 
          disabled={isCompletingOrder === o.id}
          onClick={() => handleCompleteOrder(o.id)}
          className="w-full py-4 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-emerald-100 disabled:opacity-50"
        >
           {isCompletingOrder === o.id ? (
             <span className="material-symbols-outlined animate-spin">sync</span>
           ) : (
             <span className="material-symbols-outlined text-base">task_alt</span>
           )}
           {isCompletingOrder === o.id ? 'Finalizando...' : 'Finalizar como Entregue'}
        </button>
      </motion.div>
    ))}
      </div>
    )}
            </div>
          </motion.div>
        </div>
      )}
      {/* â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢ Category Studio (Services & Infrastructure) â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢ */}
      {selectedCategoryStudio && (
        <div className="fixed inset-0 z-[170] flex items-center justify-center p-4 md:p-10 text-slate-900 overflow-hidden">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-3xl" onClick={() => setSelectedCategoryStudio(null)}></div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[56px] overflow-hidden shadow-[0_0_150px_rgba(0,0,0,0.6)] relative z-10 flex flex-col border border-white/20 dark:border-slate-800 h-[90vh]"
          >
            {/* Studio Header */}
            <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/40">
<div className="flex items-center gap-6">
  <div className="size-20 rounded-[32px] bg-primary/20 flex items-center justify-center text-primary shadow-xl shadow-primary/10 border border-primary/20">
    <span className="material-symbols-outlined text-4xl font-black">{selectedCategoryStudio.icon || 'category'}</span>
  </div>
  <div>
      <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">Estúdio de Categoria</h2>
      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
        <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>
        {selectedCategoryStudio.id?.startsWith('new-') ? 'Novo Recurso Estrutural' : `ID: ${selectedCategoryStudio.id}`}
      </p>
  </div>
</div>
<button 
  onClick={() => setSelectedCategoryStudio(null)}
  className="size-14 rounded-3xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all border border-slate-200 dark:border-slate-700 shadow-xl"
>
  <span className="material-symbols-outlined text-2xl font-black">close</span>
</button>
            </div>

            {/* Tab Navigation */}
            <div className="px-10 py-2 bg-slate-50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800 flex gap-8">
   {[
     { id: 'general', label: 'Dados Gerais', icon: 'settings' },
     { id: 'subcategories', label: 'Subcategorias', icon: 'account_tree' },
   ].map(t => (
     <button
       key={t.id}
       onClick={() => setActiveStudioTab(t.id as any)}
       className={`flex items-center gap-2 py-5 px-3 border-b-4 transition-all ${activeStudioTab === t.id ? 'border-primary text-slate-900 dark:text-white' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
     >
       <span className="material-symbols-outlined text-xl">{t.icon}</span>
       <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
     </button>
   ))}
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-12 bg-white dark:bg-slate-900">
 <AnimatePresence mode="wait">
      <motion.div
        key={activeStudioTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-10"
      >
        {activeStudioTab === 'general' && (
           <div className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4">Nome da Categoria</label>
                     <input 
                       type="text" 
                       value={selectedCategoryStudio.name || ''} 
                       onChange={e => setSelectedCategoryStudio({...selectedCategoryStudio, name: e.target.value})}
                       className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-3xl px-8 py-5 font-bold text-sm focus:ring-2 focus:ring-primary shadow-inner dark:text-white"
                       placeholder="Ex: Limpeza Residencial"
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4">Ãcone (Symbol Name)</label>
                     <div className="flex gap-4">
                        <input 
                          type="text" 
                          value={selectedCategoryStudio.icon || ''} 
                          onChange={e => setSelectedCategoryStudio({...selectedCategoryStudio, icon: e.target.value})}
                          className="flex-1 bg-slate-50 dark:bg-slate-800/50 border-none rounded-3xl px-8 py-5 font-bold text-sm focus:ring-2 focus:ring-primary shadow-inner dark:text-white"
                          placeholder="Ex: home_repair_service"
                        />
                        <div className="size-16 rounded-3xl bg-primary flex items-center justify-center text-slate-900 shadow-lg shadow-primary/20">
                           <span className="material-symbols-outlined text-2xl">{selectedCategoryStudio.icon || 'help'}</span>
                        </div>
                     </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                     <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4">Descrição da Atividade</label>
                     <textarea 
                       value={selectedCategoryStudio.description || ''} 
                       onChange={e => setSelectedCategoryStudio({...selectedCategoryStudio, description: e.target.value})}
                       className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-3xl px-8 py-5 font-bold text-sm focus:ring-2 focus:ring-primary shadow-inner h-32 resize-none dark:text-white"
                       placeholder="Descreva brevemente o que esta categoria abrange..."
                     />
                  </div>
              </div>

              <div className="p-8 rounded-[40px] bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <div className={`size-12 rounded-2xl flex items-center justify-center ${selectedCategoryStudio.is_active ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                            <span className="material-symbols-outlined">{selectedCategoryStudio.is_active ? 'check_circle' : 'block'}</span>
                         </div>
                         <div>
                            <p className="text-sm font-black text-slate-900 dark:text-white">Status de Disponibilidade</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{selectedCategoryStudio.is_active ? 'Visível para todos os usuários' : 'Oculto na interface do cliente'}</p>
                         </div>
                      </div>
                      <button 
                        onClick={() => setSelectedCategoryStudio({...selectedCategoryStudio, is_active: !selectedCategoryStudio.is_active})}
                        className={`w-16 h-10 rounded-full relative transition-all ${selectedCategoryStudio.is_active ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-slate-400'}`}
                      >
                         <div className={`absolute top-1 size-8 bg-white rounded-full shadow-md transition-all ${selectedCategoryStudio.is_active ? 'left-7' : 'left-1'}`} />
                      </button>
                  </div>
              </div>
           </div>
        )}

        {activeStudioTab === 'subcategories' && (
           <div className="space-y-8">
              <div className="flex items-center justify-between">
                 <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Sub-nódulos Operacionais</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Defina as especialidades desta categoria</p>
                 </div>
                 <button 
                   onClick={async () => {
                      if (String(selectedCategoryStudio.id).startsWith('new-')) {
                         toastWarning('Salve a categoria principal antes de adicionar subcategorias.');
                         return;
                      }
                      const { data, error } = await supabase.from('categories_delivery').insert([{
                         name: 'Nova Subcategoria',
                         parent_id: selectedCategoryStudio.id,
                         type: 'service',
                         is_active: true
                      }]).select();
                      if (error) toastError('Falha na infraestrutura: ' + error.message);
                      else {
                         toastSuccess('Sub-unidade adicionada com sucesso.');
                         setCategoriesState(prev => [...prev, data[0]]);
                      }
                   }}
                   className="px-6 py-4 bg-primary/10 text-primary border border-primary/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-slate-900 transition-all"
                 >
                    + Add Subcategoria
                 </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                 {categoriesState.filter(c => String(c.parent_id) === String(selectedCategoryStudio.id)).map(sub => (
                    <div key={sub.id} className="p-6 rounded-[32px] bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between group">
                       <div className="flex items-center gap-6">
                           <div className="size-12 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-primary shadow-sm border border-slate-100 dark:border-slate-800">
                              <span className="material-symbols-outlined text-xl">{sub.icon || 'subdirectory_arrow_right'}</span>
                           </div>
                           <input 
                             type="text" 
                             value={sub.name} 
                             onBlur={async (e) => {
                                const val = e.target.value;
                                if (val.trim()) { await supabase.from('categories_delivery').update({ name: val }).eq('id', sub.id); }
                             }}
                             onChange={e => {
                                const updated = categoriesState.map(c => c.id === sub.id ? { ...c, name: e.target.value } : c);
                                setCategoriesState(updated);
                             }}
                             className="bg-transparent border-none font-bold text-sm focus:ring-0 p-0 dark:text-white w-64"
                           />
                       </div>
                       <div className="flex items-center gap-4">
                          <button 
                            onClick={async () => {
                               const nextStatus = !sub.is_active;
                               const { error } = await supabase.from('categories_delivery').update({ is_active: nextStatus }).eq('id', sub.id);
                               if (!error) {
                                 setCategoriesState(prev => prev.map(c => c.id === sub.id ? { ...c, is_active: nextStatus } : c));
                               }
                            }}
                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${sub.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-200 text-slate-500'}`}
                          >
                             {sub.is_active ? 'Ativa' : 'Inativa'}
                          </button>
                          <button 
                             onClick={async () => {
                               if(await showConfirm({ message: 'Excluir subcategoria?' })) {
                                  fetchCategories();
                               }
                             }}
                             className="size-10 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                          >
                             <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                       </div>
                    </div>
                 ))}
                 {categoriesState.filter(c => c.parent_id === selectedCategoryStudio.id).length === 0 && (
                    <div className="py-20 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[48px]">
                        <div className="size-20 rounded-[32px] bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mx-auto mb-4 text-slate-300">
                            <span className="material-symbols-outlined text-4xl">account_tree</span>
                        </div>
                        <p className="text-sm font-bold text-slate-400">Nenhuma subcategoria vinculada.</p>
                    </div>
                 )}
              </div>
           </div>
        )}
      </motion.div>
 </AnimatePresence>
            </div>

            {/* Studio Footer */}
            <div className="p-10 border-t border-slate-100 dark:border-slate-800 flex justify-between bg-white dark:bg-slate-950 rounded-b-[56px]">
 <button 
   onClick={() => setSelectedCategoryStudio(null)}
   className="px-10 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-all font-sans"
 >
   Descartar AlteraçÃƒÆ’Ã‚Âµes
 </button>
 <button 
   disabled={isSaving}
   onClick={async () => {
      setIsSaving(true);
      try {
        const categoryData = {
          name: selectedCategoryStudio.name,
          description: selectedCategoryStudio.description,
          icon: selectedCategoryStudio.icon,
          type: selectedCategoryStudio.type || 'service',
          is_active: selectedCategoryStudio.is_active,
          parent_id: selectedCategoryStudio.parent_id
        };

        const isNew = selectedCategoryStudio.id?.startsWith('new-');
        
        if (isNew) {
           const { data, error } = await supabase.from('categories_delivery').insert([categoryData]).select();
           if (error) throw error;
           if (data && data[0]) {
              // Categoria criada, podemos agora permitir subcategorias
              toastSuccess('Categoria implementada com sucesso!');
              setSelectedCategoryStudio(data[0]);
              setActiveStudioTab('subcategories');
           }
        } else {
          const { error } = await supabase.from('categories_delivery').update(categoryData).eq('id', selectedCategoryStudio.id);
          if (error) throw error;
          toastSuccess('Dados atualizados no ecossistema.');
          setSelectedCategoryStudio(null);
        }
        fetchCategories();
      } catch (err: any) {
        toastError('Erro na infraestrutura: ' + err.message);
      } finally {
        setIsSaving(false);
      }
   }}
   className="px-12 py-5 bg-primary text-slate-900 font-black text-[10px] uppercase tracking-widest rounded-3xl shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
 >
    {isSaving ? (
      <span className="material-symbols-outlined animate-spin text-lg">sync</span>
    ) : (
      <span className="material-symbols-outlined text-lg">rocket_launch</span>
    )}
    {isSaving ? 'Sincronizando...' : 'Implementar Mudanças'}
 </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ Category Directory Modal ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ */}
      {showCategoryListModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 md:p-10 text-slate-900 overflow-hidden">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-3xl" onClick={() => setShowCategoryListModal(false)}></div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-[56px] overflow-hidden shadow-[0_0_120px_rgba(0,0,0,0.5)] relative z-10 flex flex-col border border-white/20 dark:border-slate-800 h-[85vh]"
          >
            {/* Modal Header */}
            <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
<div className="flex items-center gap-6">
  <div className="size-16 rounded-[24px] bg-primary/20 flex items-center justify-center text-primary border border-primary/10 shadow-lg shadow-primary/10">
    <span className="material-symbols-outlined text-4xl font-black">category</span>
  </div>
  <div>
    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Diretório de Categorias</h2>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Ecosystem Infrastructure ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ {categoriesState.length} itens cadastrados</p>
  </div>
</div>
<div className="flex items-center gap-4">
  <div className="hidden md:flex bg-white dark:bg-slate-800 p-2 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-inner">
    <span className="material-symbols-outlined text-slate-300 ml-2">search</span>
    <input type="text" placeholder="Filtrar categorias..." className="bg-transparent border-none text-[11px] font-bold px-4 py-2 w-48 focus:ring-0 placeholder:text-slate-300 dark:text-white" />
  </div>
  <button 
    onClick={() => setShowCategoryListModal(false)}
    className="size-14 rounded-3xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all border border-slate-200 dark:border-slate-700 hover:rotate-90"
  >
    <span className="material-symbols-outlined text-2xl">close</span>
  </button>
</div>
            </div>

            {/* List Area */}
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-white dark:bg-slate-900">
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {categoriesState.sort((a, _b) => (a.parent_id ? 1 : -1)).map((cat) => (
    <div key={cat.id} className="group p-6 rounded-[32px] bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 transition-all hover:shadow-xl hover:border-primary/20">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
           <div className="size-12 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-primary shadow-sm">
              <span className="material-symbols-outlined text-2xl">{cat.icon || 'category'}</span>
           </div>
           <div>
              <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{cat.name}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{cat.parent_id ? 'Subcategoria' : 'Categoria Principal'}</p>
           </div>
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
           <button 
             onClick={() => {
               setSelectedCategoryStudio(cat);
               setActiveStudioTab('general');
               setShowCategoryListModal(false);
             }}
             className="size-10 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-slate-900 transition-all flex items-center justify-center"
           >
              <span className="material-symbols-outlined text-base">edit</span>
           </button>
           <button 
             onClick={async () => {
               if(await showConfirm({ message: 'Tem certeza?' })) {
                 await supabase.from('categories_delivery').delete().eq('id', cat.id);
                 fetchCategories();
               }
             }}
             className="size-10 rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
           >
              <span className="material-symbols-outlined text-base">delete</span>
           </button>
        </div>
      </div>
      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
         <span className={cat.is_active ? 'text-emerald-500' : 'text-slate-300'}>{cat.is_active ? 'ÃƒÂ¢ââ‚¬â€Ã‚Â Ativo' : 'ÃƒÂ¢ââ‚¬â€ââ‚¬Â¹ Inativo'}</span>
         <span>Criado em {cat.created_at ? new Date(cat.created_at).toLocaleDateString() : 'N/A'}</span>
      </div>
    </div>
  ))}
</div>
            </div>

            {/* Modal Footer */}
            <div className="p-8 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Painel de Controle de Infraestrutura</p>
 <button 
   onClick={() => {
      setSelectedCategoryStudio({ 
        id: `new-${Date.now()}`, 
        name: '', 
        description: '', 
        icon: 'category', 
        type: 'service', 
        is_active: true 
      });
      setActiveStudioTab('general');
      setShowCategoryListModal(false);
   }}
   className="px-8 py-4 bg-primary text-slate-900 font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 transition-all"
 >
   Criar Nova Categoria
 </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ Peak Hour Rule Modal ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ */}
      {isAddingPeakRule && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 text-slate-900">
           <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-3xl" onClick={() => setIsAddingPeakRule(false)}></div>
           <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[48px] p-10 relative z-10 shadow-2xl border border-white/20">
<h2 className="text-2xl font-black mb-8 flex items-center gap-3">
   <span className="material-symbols-outlined text-primary">schedule</span>
   Novo Horário de Pico
</h2>
<div className="space-y-6">
   <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição / Nome</label>
      <input 
        type="text" value={newPeakRule.label} placeholder="Ex: Sexta Noite 18h-22h"
        onChange={e => setNewPeakRule({...newPeakRule, label: e.target.value})}
        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-5 font-bold"
      />
   </div>
   <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Multiplicador Sugerido</label>
      <div className="flex items-center gap-4">
         <input 
          type="range" min="1.0" max="4.0" step="0.1" value={newPeakRule.multiplier}
          onChange={e => setNewPeakRule({...newPeakRule, multiplier: parseFloat(e.target.value)})}
          className="flex-1 accent-primary"
         />
         <span className="text-xl font-black text-primary w-16 text-center">{newPeakRule.multiplier}x</span>
      </div>
   </div>
   <div className="flex gap-4 pt-4">
      <button onClick={() => setIsAddingPeakRule(false)} className="flex-1 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 font-black text-xs uppercase tracking-widest text-slate-400">Cancelar</button>
      <button onClick={handleAddPeakRule} className="flex-1 h-16 rounded-3xl bg-primary font-black text-xs uppercase tracking-widest text-slate-900 shadow-xl shadow-primary/20">Criar Regra</button>
   </div>
</div>
           </motion.div>
        </div>
      )}

      {/* ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ Zone Map Selection Modal ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã‚Â¢ */}
      {selectedZoneForMap && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 md:p-10 text-slate-900 overflow-hidden">
           <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-3xl" onClick={() => setSelectedZoneForMap(null)}></div>
           <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-6xl bg-white dark:bg-slate-900 rounded-[56px] overflow-hidden shadow-2xl relative z-10 flex flex-col md:flex-row h-[95vh] border border-white/20">
{/* Map Side */}
<div className="flex-1 relative bg-[#f0ebe3]">
   <div className="absolute top-6 left-6 right-6 z-20 flex gap-3">
      <div className="flex-1 bg-white/95 backdrop-blur-xl px-4 py-2 rounded-2xl border border-[#f8c967]/50 shadow-xl flex items-center gap-2">
         <span className="material-symbols-outlined text-[#e98d58] text-lg">search</span>
         {isLoaded && (
           <Autocomplete
             onLoad={auto => setMapSearch(auto)}
             onPlaceChanged={() => {
               if (mapSearch) {
                 const place = mapSearch.getPlace();
                 if (place.geometry?.location) {
                   const lat = place.geometry.location.lat();
                   const lng = place.geometry.location.lng();
                   setNewZoneData(prev => ({...prev, lat, lng}));
                   setMapCenterView({ lat, lng }); setFixedGridCenter({ lat, lng }); setSelectedHexagons([]);
                 }
               }
             }}
           >
             <input type="text" placeholder="Pesquisar endereço..." className="bg-transparent border-none text-sm font-bold w-full focus:ring-0 placeholder:text-slate-400 text-slate-700" />
           </Autocomplete>
         )}
      </div>
      {/* My Location Button */}
      <button
        onClick={() => {
          if (!navigator.geolocation) return;
          setIsGeolocating(true);
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const lat = pos.coords.latitude;
              const lng = pos.coords.longitude;
              setNewZoneData(prev => ({...prev, lat, lng}));
              setMapCenterView({ lat, lng }); setFixedGridCenter({ lat, lng }); setSelectedHexagons([]);
              setIsGeolocating(false);
            },
            () => setIsGeolocating(false),
            { enableHighAccuracy: true, timeout: 10000 }
          );
        }}
        className="w-14 h-[46px] rounded-2xl bg-white/95 border border-[#f8c967]/50 shadow-xl flex items-center justify-center hover:bg-[#f8c967]/20 transition-all group"
        title="Usar minha localização atual"
      >
        {isGeolocating
          ? <span className="material-symbols-outlined text-[#e98d58] animate-spin text-xl">progress_activity</span>
          : <span className="material-symbols-outlined text-[#e98d58] group-hover:scale-110 transition-transform text-xl">my_location</span>
        }
      </button>
   </div>
   {mapsLoadError ? (
     <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 gap-6 p-12 text-center">
        <span className="material-symbols-outlined text-6xl text-red-400">map_off</span>
        <div>
          <p className="text-base font-black text-white uppercase tracking-widest mb-2">API Google Maps com Erro</p>
          <p className="text-xs text-slate-400 max-w-sm leading-relaxed">{mapsLoadError}</p>
        </div>
        <div className="bg-slate-800 rounded-2xl p-5 text-left space-y-2 w-full max-w-sm">
          <p className="text-[10px] font-black text-primary uppercase tracking-widest">Como corrigir:</p>
          <p className="text-[11px] text-slate-300">1. Acesse console.cloud.google.com</p>
          <p className="text-[11px] text-slate-300">2. Ative: Maps JavaScript API + Places API</p>
          <p className="text-[11px] text-slate-300">3. Permita localhost nas restrições da chave</p>
        </div>
     </div>
    ) : isLoaded ? (
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={mapCenterView}
        zoom={14}
        onLoad={map => { zoneMapRef.current = map; }}
        onDragEnd={() => {
          if (zoneMapRef.current) {
            const center = zoneMapRef.current.getCenter();
            if (center) setMapCenterView({ lat: center.lat(), lng: center.lng() });
          }
        }}
        options={{ 
           styles: wazeMapStyle, 
           disableDefaultUI: true, 
           zoomControl: true,
           mapTypeControl: false,
           streetViewControl: false,
           fullscreenControl: false
        }}
        onClick={() => {}}
      >
         {hexGrid.map(hex => (
           <Polygon
             key={hex.id}
             paths={getHexPath(hex.center, HEX_SIZE)}
             onClick={() => {
               setSelectedHexagons(prev => 
                 prev.includes(hex.id) ? prev.filter(h => h !== hex.id) : [...prev, hex.id]
               );
             }}
             options={{
               fillColor: selectedHexagons.includes(hex.id) ? "#6366f1" : "transparent",
               fillOpacity: 0.4,
               strokeColor: "#6366f1",
               strokeOpacity: 0.2,
               strokeWeight: 1,
             }}
           />
         ))}
      </GoogleMap>
    ) : (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 gap-4">
         <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
         <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Iniciando Google Maps...</p>
      </div>
    )}
 </div>
 {/* Config Side */}
 <div className="w-full md:w-[400px] p-10 flex flex-col justify-between bg-white dark:bg-slate-950 overflow-y-auto scrollbar-hide">
    <div className="space-y-8">
       <div>
<h2 className="text-2xl font-black dark:text-white leading-tight">Nova Zona Dinâmica</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Configuração de Perímetro</p>
       </div>
        <div className="space-y-6">
           <div className="p-5 rounded-3xl bg-indigo-50 border border-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/20 space-y-3">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                 <span className="material-symbols-outlined text-sm">gesture</span>
                 <span className="text-[10px] font-black uppercase tracking-widest">Modo Colmeia Ativo</span>
              </div>
              <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                 Clique nos hexágonos no mapa para "pintar" a área de cobertura. A taxa será aplicada a todos os hexágonos selecionados.
              </p>
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Zona</label>
              <input type="text" value={newZoneData.label} placeholder="Ex: Centro Expandido" onChange={e => setNewZoneData({...newZoneData, label: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl p-5 font-bold text-slate-900 dark:text-white" />
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Acréscimo Fixo (R$)</label>
              <input type="text" value={newZoneData.fee} onChange={e => setNewZoneData({...newZoneData, fee: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl p-5 font-black text-primary text-xl" />
           </div>
        </div>
    </div>
    <div className="flex gap-4">
       <button onClick={() => setSelectedZoneForMap(null)} className="flex-1 h-16 rounded-3xl bg-slate-50 dark:bg-slate-800 font-black text-[10px] uppercase tracking-widest text-slate-400 border border-slate-100 dark:border-slate-800">Cancelar</button>
       <button onClick={handleAddZone} className="flex-1 h-16 rounded-3xl bg-indigo-500 font-black text-[10px] uppercase tracking-widest text-white shadow-xl shadow-indigo-200">Salvar Zona</button>
    </div>
 </div>
            </motion.div>
          </div>
        )}

          {/* Modal Adicionar Créditos */}
          <AnimatePresence>
            {showAddCreditModal && (
<div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
  <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowAddCreditModal(false)}></div>
  <motion.div
    initial={{ opacity: 0, scale: 0.9, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95, y: -20 }}
    className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[40px] p-10 shadow-2xl relative z-10 border border-slate-100 dark:border-slate-800"
  >
    <div className="flex justify-between items-center mb-8">
      <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
        <span className="material-symbols-outlined text-emerald-500">add_circle</span>
        Novo Aporte
      </h3>
      <button onClick={() => setShowAddCreditModal(false)} className="size-10 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors">
        <span className="material-symbols-outlined">close</span>
      </button>
    </div>
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Valor (R$)</label>
        <div className="relative">
          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
          <input 
            type="number"
            step="0.01" 
            value={creditToAdd}
            onChange={(e) => setCreditToAdd(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-3xl pl-14 pr-6 py-5 font-black text-xl focus:ring-2 focus:ring-emerald-500 dark:text-white"
            placeholder="0.00"
          />
        </div>
      </div>
      <button 
        onClick={handleAddCredit}
        disabled={isAddingCredit}
        className="w-full h-16 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-3xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        {isAddingCredit ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : <span className="material-symbols-outlined">done_all</span>}
        {isAddingCredit ? 'Processando...' : 'Confirmar Pagamento'}
      </button>
    </div>
  </motion.div>
</div>
            )}
          </AnimatePresence>

          {/* Modal Extrato Detalhado */}
          <AnimatePresence>
            {showWalletStatementModal && (
<div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
  <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowWalletStatementModal(false)}></div>
  <motion.div
    initial={{ opacity: 0, scale: 0.9, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95, y: -20 }}
    className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[40px] overflow-hidden shadow-2xl relative z-10 border border-slate-100 dark:border-slate-800 flex flex-col max-h-[85vh]"
  >
    <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-between items-center shrink-0">
      <div>
        <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-500">receipt_long</span>
          Extrato Detalhado
        </h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Todas as movimentações da carteira</p>
      </div>
      <button onClick={() => setShowWalletStatementModal(false)} className="size-12 rounded-full bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-100 dark:border-slate-700 flex items-center justify-center transition-colors shadow-sm">
        <span className="material-symbols-outlined">close</span>
      </button>
    </div>
    <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 dark:bg-slate-900 space-y-4 custom-scrollbar">
      {walletTransactions.length === 0 ? (
        <div className="py-20 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-200 dark:text-slate-700 mb-4 block">receipt_long</span>
          <p className="text-slate-400 font-bold">Nenhuma movimentação registrada.</p>
        </div>
      ) : (
        walletTransactions.map(tx => {
          const isPositive = tx.type === 'deposito' || tx.type === 'reembolso';
          return (
          <div key={tx.id} className="flex items-center justify-between p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-4">
                <div className={`size-12 rounded-2xl flex items-center justify-center ${!isPositive ? 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400' : 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
                  <span className="material-symbols-outlined text-2xl">{!isPositive ? 'shopping_bag' : 'add_circle'}</span>
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{tx.description || (!isPositive ? 'Uso de Saldo' : 'Aporte de Saldo')}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{new Date(tx.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })} â€¢ {new Date(tx.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="text-[9px] font-mono font-bold text-slate-300 dark:text-slate-600 mt-1">ID: {tx.id}</p>
                </div>
            </div>
            <span className={`text-lg font-black ${!isPositive ? 'text-red-500' : 'text-emerald-500'}`}>
              {!isPositive ? '- ' : '+ '}R$ {Number(tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )})
      )}
    </div>
  </motion.div>
</div>
            )}
          </AnimatePresence>

          {/* New Order Toast Notification */}
          <AnimatePresence>
            {newOrderNotification.show && (
<motion.div
  initial={{ opacity: 0, y: -50, scale: 0.9 }}
  animate={{ opacity: 1, y: 16, scale: 1 }}
  exit={{ opacity: 0, scale: 0.9, y: -20 }}
  className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] bg-white dark:bg-slate-900 shadow-2xl rounded-3xl p-4 pr-6 flex items-center gap-4 border-2 border-primary/50 cursor-pointer hover:scale-105 transition-all"
  onClick={() => {
     setNewOrderNotification({show: false});
     setActiveTab('orders');
  }}
>
  <div className="size-12 rounded-2xl bg-primary flex items-center justify-center text-slate-900 animate-pulse">
    <span className="material-symbols-outlined text-2xl font-black">notifications_active</span>
  </div>
  <div>
    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Novo Pedido Recebido!</h4>
    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Toque para abrir a tela de pedidos</p>
  </div>
</motion.div>
            )}
          </AnimatePresence>
          {/* As especialidades sumiram todas, implemenatr edicao de especialidades */}


          {selectedProductStudio && (
            <ProductStudio
              product={selectedProductStudio}
              onClose={() => setSelectedProductStudio(null)}
              onSave={() => {
                fetchProducts(targetMerchantId || '');
                setSelectedProductStudio(null);
              }}
              menuCategoriesList={userRole === 'merchant' ? menuCategoriesList : previewCategories}
              handleFileUpload={handleFileUpload}
              merchantId={targetMerchantId}
              fetchMenuCategories={fetchMenuCategories}
            />
          )}
      </>
  );
}
