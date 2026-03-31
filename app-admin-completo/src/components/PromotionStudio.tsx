import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAdmin } from '../context/AdminContext';
import { toastSuccess, toastError, showConfirm } from '../lib/useToast';
import { uploadToCloudinary } from '../lib/cloudinary';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import FlashOfferTimerModal from './FlashOfferTimerModal';
import { MerchantSelectorModal } from './MerchantSelectorModal';
import { ProductSelectorModal } from './ProductSelectorModal';

interface PromotionStudioProps {
  merchantId?: string | null;
  userRole: 'admin' | 'merchant';
  onClose?: () => void;
  isModal?: boolean;
}

type PromoType = 'banner' | 'coupon' | 'flash';

export default function PromotionStudio({ merchantId = null, userRole, onClose, isModal = false }: PromotionStudioProps) {
  const { fetchPromotions, promotionsList, stats, appSettings, setAppSettings, handleSaveAppSettings } = useAdmin();
  
  const [activeTab, setActiveTab] = useState<PromoType>('coupon');
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  
  // Flash Offer States
  const [flashOffers, setFlashOffers] = useState<any[]>([]);
  const [merchants, setMerchants] = useState<any[]>([]);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [merchantModalOpen, setMerchantModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);

  const [formData, setFormData] = useState<any>({
    id: '',
    title: '',
    description: '',
    image_url: '',
    coupon_code: '',
    discount_type: 'percent',
    discount_value: 0,
    min_order_value: 0,
    max_usage: 100,
    expires_at: '',
    is_active: true,
    is_vip: false,
    merchant_id: merchantId,
    // Flash specific
    merchant_ids: merchantId ? [merchantId] : [],
    selected_product_ids: []
  });

  const fetchFlashOffers = useCallback(async () => {
    let query = supabase.from('flash_offers').select('*, admin_users(store_name)');
    if (userRole === 'merchant' && merchantId) {
      query = query.eq('merchant_id', merchantId);
    } else if (merchantId) {
      query = query.eq('merchant_id', merchantId);
    }

    const { data } = await query.order('created_at', { ascending: false });
    if (data) setFlashOffers(data);
  }, [merchantId, userRole]);

  const fetchMerchants = useCallback(async () => {
    if (userRole === 'admin') {
      const { data } = await supabase
        .from('admin_users')
        .select('id, store_name')
        .eq('role', 'merchant')
        .eq('is_active', true);
      if (data) setMerchants(data);
    }
  }, [userRole]);

  const fetchProducts = useCallback(async (mIds: string[]) => {
    if (!mIds.length) {
      setAvailableProducts([]);
      return;
    }
    const { data } = await supabase
      .from('products_delivery')
      .select('*')
      .in('merchant_id', mIds)
      .eq('is_available', true);
    setAvailableProducts(data || []);
  }, []);

  useEffect(() => {
    fetchPromotions();
    fetchFlashOffers();
    fetchMerchants();
  }, [fetchPromotions, fetchFlashOffers, fetchMerchants]);

  useEffect(() => {
    if ((activeTab === 'flash' || activeTab === 'coupon') && formData.merchant_ids.length > 0) {
      fetchProducts(formData.merchant_ids);
    }
  }, [activeTab, formData.merchant_ids, fetchProducts]);

  const filteredPromos = promotionsList.filter(p => {
    if (merchantId) return p.merchant_id === merchantId;
    if (userRole === 'admin') return true; 
    return p.merchant_id === null; 
  });

  const banners = filteredPromos.filter(p => p.image_url && !p.coupon_code && !p.is_vip);
  const coupons = filteredPromos.filter(p => p.coupon_code && !p.is_vip);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsSaving(true);
      const url = await uploadToCloudinary(file);
      if (url) {
        setFormData({ ...formData, image_url: url });
        toastSuccess('Imagem carregada com sucesso!');
      }
    } catch (err) {
      toastError('Erro no upload');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (activeTab === 'flash') {
        await saveFlashOffer();
      } else {
        await saveStandardPromotion();
      }
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const saveStandardPromotion = async () => {
    if (activeTab === 'coupon' && !formData.coupon_code) throw new Error('Código do cupom é obrigatório');
    if (activeTab === 'banner' && !formData.image_url) throw new Error('Imagem do banner é obrigatória');

    const dataToSave = {
      title: formData.title,
      description: formData.description,
      discount_type: formData.discount_type,
      discount_value: formData.discount_value,
      min_order_value: formData.min_order_value,
      max_usage: formData.max_usage,
      expires_at: formData.expires_at || null,
      is_active: formData.is_active,
      is_vip: formData.is_vip,
      merchant_id: formData.merchant_id,
      coupon_code: activeTab === 'coupon' ? formData.coupon_code.toUpperCase().trim() : null,
      image_url: activeTab === 'banner' ? formData.image_url : null,
      target_merchants: activeTab === 'coupon' ? formData.merchant_ids : null,
      target_products: activeTab === 'coupon' ? formData.selected_product_ids : null,
    };

    const { error } = formData.id 
      ? await supabase.from('promotions_delivery').update(dataToSave).eq('id', formData.id)
      : await supabase.from('promotions_delivery').insert([dataToSave]);

    if (error) throw error;

    // Se é um banner e alterou o preço da assinatura
    if (activeTab === 'banner' && dataToSave.min_order_value !== appSettings.iziBlackFee) {
        const newSettings = { ...appSettings, iziBlackFee: dataToSave.min_order_value };
        setAppSettings(newSettings);
        await supabase.from('app_settings_delivery').upsert(newSettings);
    }

    toastSuccess(`Promoção ${formData.id ? 'atualizada' : 'criada'} com sucesso!`);
    setShowForm(false);
    fetchPromotions();
  };

  const saveFlashOffer = async () => {
    if (!formData.merchant_ids.length) throw new Error('Selecione pelo menos um lojista');
    if (!formData.selected_product_ids.length) throw new Error('Selecione pelo menos um produto');
    if (formData.discount_value <= 0) throw new Error('Informe um desconto válido');

    const expiresAt = formData.expires_at
      ? new Date(formData.expires_at).toISOString()
      : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const selectedProducts = availableProducts.filter(p => formData.selected_product_ids.includes(p.id));

    const payloads = selectedProducts.map((product: any) => {
      const originalPrice = Number(product.price || 0);
      let discountedPrice = 0;
      let discountPercent = 0;

      if (formData.discount_type === 'fixed') {
        discountedPrice = Math.max(originalPrice - formData.discount_value, 0);
        discountPercent = originalPrice > 0 ? Math.round((1 - (discountedPrice / originalPrice)) * 100) : 0;
      } else {
        discountPercent = Math.min(formData.discount_value, 100);
        discountedPrice = Number((originalPrice * (1 - (discountPercent / 100))).toFixed(2));
      }

      return {
        title: formData.title || `Oferta ${product.name}`,
        description: formData.description || null,
        merchant_id: product.merchant_id,
        product_name: product.name,
        product_image: product.image_url,
        product_id: product.id,
        original_price: originalPrice,
        discounted_price: discountedPrice,
        discount_percent: discountPercent,
        expires_at: expiresAt,
        is_active: true
      };
    });

    if (formData.id) {
      const { error } = await supabase.from('flash_offers').update(payloads[0]).eq('id', formData.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('flash_offers').insert(payloads);
      if (error) throw error;
    }

    toastSuccess('Oferta Flash publicada com sucesso!');
    setShowForm(false);
    fetchFlashOffers();
  };

  const handleDelete = async (id: string, type: PromoType) => {
    if (!await showConfirm({ message: `Tem certeza que deseja excluir esta promoção?` })) return;
    try {
      const table = type === 'flash' ? 'flash_offers' : 'promotions_delivery';
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      toastSuccess('Removido com sucesso');
      if (type === 'flash') fetchFlashOffers();
      else fetchPromotions();
    } catch (err) {
      toastError('Erro ao excluir');
    }
  };

  const resetForm = (type: PromoType) => {
    setFormData({
      id: '',
      title: '',
      description: '',
      image_url: '',
      coupon_code: '',
      discount_type: 'percent',
      discount_value: 0,
      min_order_value: 0,
      max_usage: 100,
      expires_at: '',
      is_active: true,
      is_vip: false,
      merchant_id: merchantId,
      merchant_ids: merchantId ? [merchantId] : [],
      selected_product_ids: []
    });
  };

  const openEdit = (item: any, type: PromoType) => {
    if (type === 'flash') {
      setFormData({
        id: item.id,
        title: item.title,
        description: item.description,
        discount_type: item.discount_percent ? 'percent' : 'fixed',
        discount_value: item.discount_percent || (item.original_price - item.discounted_price),
        expires_at: item.expires_at,
        is_active: item.is_active,
        merchant_ids: [item.merchant_id],
        selected_product_ids: item.product_id ? [item.product_id] : [],
        merchant_id: item.merchant_id,
        is_vip: false
      });
    } else {
      setFormData({
        ...item,
        expires_at: item.expires_at ? format(new Date(item.expires_at), 'yyyy-MM-dd') : '',
        merchant_ids: item.target_merchants || (item.merchant_id ? [item.merchant_id] : []),
        selected_product_ids: item.target_products || []
      });
    }
    setActiveTab(type);
    setShowForm(true);
  };

  const tabs = [
    { id: 'banner', label: 'Banners Home (Geral)', icon: 'view_carousel', color: 'text-amber-500' },
    { id: 'coupon', label: 'Cupons de Desconto', icon: 'confirmation_number', color: 'text-primary' },
    { id: 'flash', label: 'Izi Flash (Ofertas)', icon: 'local_fire_department', color: 'text-rose-500' },
  ];

  const containerClasses = isModal 
    ? "fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-10 text-white overflow-hidden font-display"
    : "relative w-full text-white font-display min-h-screen pb-20";

  const wrapperClasses = isModal
    ? "w-full max-w-6xl xl:max-w-7xl bg-slate-950 rounded-[48px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)] relative z-10 flex flex-col border border-white/5 h-[90vh]"
    : "w-full bg-slate-950 rounded-[48px] overflow-hidden shadow-2xl relative flex flex-col border border-white/5 min-h-[85vh]";

  return (
    <div className={containerClasses}>
      {isModal && <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose}></div>}
      
      <motion.div
        initial={isModal ? { opacity: 0, scale: 0.95, y: 20 } : { opacity: 1 }}
        animate={isModal ? { opacity: 1, scale: 1, y: 0 } : { opacity: 1 }}
        className={wrapperClasses}
      >
        {/* Header */}
        <div className="p-8 md:p-10 border-b border-white/5 flex justify-between items-center bg-black/40">
          <div className="flex items-center gap-6">
            <div className="size-16 rounded-2xl bg-primary flex items-center justify-center text-slate-950 shadow-[0_0_30px_rgba(255,217,0,0.3)]">
              <span className="material-symbols-outlined text-4xl font-black">campaign</span>
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight leading-none mb-2">Estúdio de Promoções</h2>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>
                {merchantId ? 'Gestão de Marketing da Loja' : 'Central de Marketing Global'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <button 
                onClick={() => { resetForm(activeTab); setShowForm(true); }}
                className="bg-primary text-slate-950 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all"
             >
                Novo Item
             </button>
             <button 
                onClick={onClose}
                className="size-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-white/10 transition-all border border-white/5"
             >
                <span className="material-symbols-outlined">close</span>
             </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="px-10 py-2 border-b border-white/5 flex gap-10 bg-black/20">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id as PromoType); setShowForm(false); }}
              className={`flex items-center gap-3 py-6 px-4 border-b-4 transition-all ${activeTab === t.id ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
            >
              <span className={`material-symbols-outlined text-2xl ${t.color}`}>{t.icon}</span>
              <span className="text-xs font-black uppercase tracking-widest">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-10 scrollbar-hide bg-slate-950">
          <AnimatePresence mode="wait">
            {showForm ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-4xl mx-auto"
              >
                <form onSubmit={handleSave} className="space-y-8">
                    <div className="bg-white/5 border border-white/5 rounded-[40px] p-10 space-y-8 shadow-2xl">
                        <div className="flex items-center gap-4 mb-4">
                            <span className={`material-symbols-outlined text-4xl ${tabs.find(t => t.id === activeTab)?.color}`}>{tabs.find(t => t.id === activeTab)?.icon}</span>
                            <div>
                                <h3 className="text-xl font-black italic uppercase tracking-tighter">Editar detalhes</h3>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    {activeTab === 'banner' ? 'Banner promocional para todos os usuários' : 'Preencha os detalhes da sua campanha'}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Título Interno da Campanha</label>
                                <input 
                                    type="text" 
                                    required
                                    value={formData.title} 
                                    onChange={e => setFormData({...formData, title: e.target.value})}
                                    className="w-full bg-white/5 border border-white/5 rounded-3xl px-8 py-5 font-bold text-lg focus:ring-2 focus:ring-primary focus:bg-white/10 transition-all shadow-inner"
                                    placeholder="Ex: Festival de Verão 2026"
                                />
                             </div>

                             {activeTab === 'banner' && (
                                 <div className="space-y-2 md:col-span-2">
                                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Imagem do Banner (Público Geral)</label>
                                     <div className="aspect-[3/1] rounded-[40px] bg-white/5 border-2 border-dashed border-white/10 relative overflow-hidden group hover:border-primary/50 transition-colors cursor-pointer">
                                         {formData.image_url ? (
                                             <>
                                                 <img src={formData.image_url} className="w-full h-full object-cover" />
                                                 <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                     <span className="material-symbols-outlined text-primary text-5xl">edit</span>
                                                 </div>
                                             </>
                                         ) : (
                                             <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-slate-500 group-hover:text-primary transition-colors">
                                                 <span className="material-symbols-outlined text-6xl text-slate-500">add_photo_alternate</span>
                                                 <span className="text-xs font-black uppercase tracking-widest text-center px-10">Banner Home Geral - Desktop/Mobile 1200x400</span>
                                             </div>
                                         )}
                                         <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleFileUpload} />
                                     </div>
                                 </div>
                             )}

                             {activeTab === 'coupon' && (
                                 <div className="space-y-2 md:col-span-2">
                                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Código Único (CUPOM)</label>
                                     <input 
                                         type="text" 
                                         required
                                         value={formData.coupon_code} 
                                         onChange={e => setFormData({...formData, coupon_code: e.target.value.toUpperCase()})}
                                         className="w-full bg-white/5 border border-white/5 rounded-3xl px-8 py-5 font-black text-2xl text-center text-primary tracking-[0.3em] focus:ring-2 focus:ring-primary focus:bg-white/10 transition-all shadow-inner"
                                         placeholder="EX: IZI20OFF"
                                     />
                                 </div>
                             )}

                             {(activeTab === 'coupon' || activeTab === 'flash') && (
                                 <>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Lojistas Associados</label>
                                        <button
                                            type="button"
                                            onClick={() => setMerchantModalOpen(true)}
                                            className="w-full bg-white/5 border border-white/5 rounded-3xl px-8 py-5 font-bold text-left flex justify-between items-center group hover:bg-white/10 transition-all font-display"
                                        >
                                            <span className={formData.merchant_ids.length ? 'text-white' : 'text-slate-500'}>
                                                {formData.merchant_ids.length ? `${formData.merchant_ids.length} lojistas participantes` : 'Clique para selecionar os lojistas'}
                                            </span>
                                            <span className="material-symbols-outlined text-slate-500 group-hover:text-primary transition-colors">storefront</span>
                                        </button>
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Produtos Participantes</label>
                                        <button
                                            type="button"
                                            disabled={!formData.merchant_ids.length}
                                            onClick={() => setProductModalOpen(true)}
                                            className="w-full bg-white/5 border border-white/5 rounded-3xl px-8 py-5 font-bold text-left flex justify-between items-center group hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed font-display"
                                        >
                                            <span className={formData.selected_product_ids.length ? 'text-white' : 'text-slate-500'}>
                                                {formData.selected_product_ids.length ? `${formData.selected_product_ids.length} produtos exclusivos` : 'Clique para selecionar os produtos'}
                                            </span>
                                            <span className="material-symbols-outlined text-slate-500 group-hover:text-primary transition-colors">restaurant_menu</span>
                                        </button>
                                    </div>
                                 </>
                             )}

                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">
                                     Tipo de Desconto
                                </label>
                                <select 
                                   value={formData.discount_type}
                                   onChange={e => setFormData({...formData, discount_type: e.target.value})}
                                   className="w-full bg-white/5 border border-white/5 rounded-3xl px-8 py-5 font-bold focus:ring-2 focus:ring-primary focus:bg-white/10 transition-all outline-none"
                                >
                                    <option value="percent" className="bg-slate-900 border-none">Porcentagem (%)</option>
                                    <option value="fixed" className="bg-slate-900 border-none">Valor Fixo (R$)</option>
                                </select>
                             </div>

                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">
                                     Valor do Desconto
                                </label>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    value={formData.discount_value}
                                    onChange={e => setFormData({...formData, discount_value: parseFloat(e.target.value)})}
                                    className="w-full bg-white/5 border border-white/5 rounded-3xl px-8 py-5 font-black text-lg focus:ring-2 focus:ring-primary focus:bg-white/10 transition-all shadow-inner"
                                />
                             </div>

                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">
                                     {activeTab === 'banner' ? 'Preço da Assinatura (R$)' : 'Pedido Mínimo (R$)'}
                                </label>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    value={formData.min_order_value || 0}
                                    onChange={e => setFormData({...formData, min_order_value: parseFloat(e.target.value)})}
                                    className="w-full bg-white/5 border border-white/5 rounded-3xl px-8 py-5 font-black text-lg focus:ring-2 focus:ring-primary focus:bg-white/10 transition-all shadow-inner"
                                    placeholder="0.00"
                                />
                             </div>

                             <div className="space-y-2">
                                <label className="text-[10px) font-black text-slate-500 uppercase tracking-widest ml-4">Expira em (Vencimento)</label>
                                <input 
                                    type={activeTab === 'flash' ? 'datetime-local' : 'date'}
                                    value={formData.expires_at}
                                    onChange={e => setFormData({...formData, expires_at: e.target.value})}
                                    className="w-full bg-white/5 border border-white/5 rounded-3xl px-8 py-5 font-bold text-lg focus:ring-2 focus:ring-primary focus:bg-white/10 transition-all shadow-inner text-white appearance-none"
                                />
                             </div>

                             <div className="md:col-span-2 pt-4 flex gap-6">
                                <label className="flex-1 flex items-center justify-between p-6 bg-white/5 border border-white/5 rounded-[32px] cursor-pointer group hover:bg-white/10 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                            <span className="material-symbols-outlined">check_circle</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-black">Status Ativo</p>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Publicar imediatamente</p>
                                        </div>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        checked={formData.is_active}
                                        onChange={e => setFormData({...formData, is_active: e.target.checked})}
                                        className="size-8 rounded-xl bg-white/5 border-white/10 text-emerald-500 focus:ring-emerald-500 transition-all" 
                                    />
                                </label>
                             </div>

                             <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Descrição da Campanha</label>
                                <textarea 
                                    value={formData.description}
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                    className="w-full bg-white/5 border border-white/5 rounded-3xl px-8 py-5 font-bold text-sm focus:ring-2 focus:ring-primary focus:bg-white/10 transition-all shadow-inner min-h-[120px] resize-none"
                                    placeholder="Explique os benefícios e regras da promoção..."
                                />
                             </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button 
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="flex-1 py-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[28px] font-black text-[11px] uppercase tracking-widest transition-all"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            disabled={isSaving}
                            className="flex-[2] py-6 bg-primary text-slate-950 rounded-[28px] font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {isSaving ? (
                                <div className="size-5 border-2 border-slate-900/20 border-t-slate-900 rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span className="material-symbols-outlined">rocket_launch</span>
                                    {formData.id ? 'Salvar Alterações' : 'Publicar Promoção'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-10"
              >
                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { label: 'Investimento Global', value: `R$ ${stats.couponInvestment.toLocaleString('pt-BR')}`, icon: 'receipt_long', color: 'text-primary', bg: 'bg-primary/5' },
                        { label: 'Cupons Ativos', value: coupons.filter(c => c.is_active).length, icon: 'qr_code_2', color: 'text-sky-500', bg: 'bg-sky-500/5' },
                        { label: 'Ofertas Flash', value: flashOffers.filter(f => f.is_active).length, icon: 'bolt', color: 'text-rose-500', bg: 'bg-rose-500/5' },
                    ].map((s, i) => (
                        <div key={i} className={`p-8 rounded-[40px] border border-white/5 flex flex-col items-center text-center ${s.bg}`}>
                            <span className={`material-symbols-outlined text-4xl mb-4 ${s.color}`}>{s.icon}</span>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{s.label}</p>
                            <h3 className="text-3xl font-black italic tracking-tighter">{s.value}</h3>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Render List Items based on activeTab */}
                    {activeTab === 'banner' && banners.map(item => (
                        <motion.div layout key={item.id} className="bg-slate-900/50 border border-white/5 rounded-[48px] overflow-hidden group hover:border-primary/50 transition-all flex flex-col relative shadow-2xl">
                            <div className="aspect-[2/1] relative overflow-hidden">
                                <img src={item.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.title} />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent p-8 flex flex-col justify-end">
                                    <h4 className="text-xl font-black italic uppercase tracking-tighter text-white">{item.title}</h4>
                                    <p className="text-xs font-bold text-slate-400 mt-1">{item.description}</p>
                                </div>
                                <div className="absolute top-6 right-6 flex gap-2">
                                     <button onClick={() => openEdit(item, 'banner')} className="size-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-primary hover:text-slate-950 transition-all"><span className="material-symbols-outlined text-lg">edit</span></button>
                                     <button onClick={() => handleDelete(item.id, 'banner')} className="size-10 rounded-xl bg-rose-500/20 backdrop-blur-md flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all"><span className="material-symbols-outlined text-lg">delete</span></button>
                                </div>
                            </div>
                            <div className="p-8 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className={`size-2.5 rounded-full ${item.is_active ? 'bg-amber-500 animate-pulse' : 'bg-slate-700'}`}></span>
                                    <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest">{item.is_active ? 'Ativo' : 'Pausado'}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                                        {item.discount_type === 'percent' ? `${item.discount_value}% OFF` : `R$ ${item.discount_value} OFF`}
                                    </span>
                                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">
                                        Pedido Mín: R$ {item.min_order_value?.toFixed(2).replace('.', ',')}
                                    </div>
                                    <div className="text-[9px] font-bold text-slate-700 uppercase tracking-widest mt-1">
                                        {item.expires_at ? format(new Date(item.expires_at), 'dd MMM yyyy', { locale: ptBR }) : 'Oferta Permanente'}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {activeTab === 'coupon' && coupons.map(item => (
                        <motion.div layout key={item.id} className="bg-slate-900 border border-white/5 rounded-[48px] p-10 flex flex-col gap-6 group hover:border-primary/50 transition-all shadow-2xl relative">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Cupom de Desconto</p>
                                    <h4 className="text-4xl font-black italic tracking-widest text-primary uppercase">{item.coupon_code}</h4>
                                </div>
                                <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined text-2xl">confirmation_number</span>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h5 className="text-xl font-black text-white italic uppercase tracking-tighter">{item.title}</h5>
                                <p className="text-xs font-bold text-slate-500 line-clamp-2">{item.description}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Benefício</p>
                                    <p className="text-base font-black text-emerald-400">
                                        {item.discount_type === 'percent' ? `${item.discount_value}% OFF` : `R$ ${item.discount_value} OFF`}
                                    </p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Pedido Mín.</p>
                                    <p className="text-base font-black text-white">R$ {item.min_order_value}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <div className="flex items-center gap-3">
                                     <button onClick={() => openEdit(item, 'coupon')} className="text-slate-500 hover:text-primary transition-colors uppercase font-black text-[9px] tracking-widest">Editar</button>
                                     <button onClick={() => handleDelete(item.id, 'coupon')} className="text-slate-500 hover:text-rose-500 transition-colors uppercase font-black text-[9px] tracking-widest">Excluir</button>
                                </div>
                                <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${item.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-500'}`}>
                                    {item.is_active ? 'Ativo' : 'Pausado'}
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {activeTab === 'flash' && flashOffers.map(item => (
                        <motion.div layout key={item.id} className="bg-slate-900 border border-white/5 rounded-[48px] overflow-hidden group hover:border-rose-500/50 transition-all shadow-2xl relative">
                            {item.product_image && (
                                <div className="aspect-square relative overflow-hidden bg-black">
                                    <img src={item.product_image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={item.product_name} />
                                    <div className="absolute top-6 left-6">
                                        <div className="bg-rose-600 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase italic tracking-tighter shadow-2xl flex items-center gap-2">
                                            <span className="material-symbols-outlined text-sm">bolt</span>
                                            {item.discount_percent}% OFF
                                        </div>
                                    </div>
                                    <div className="absolute bottom-6 left-6 right-6">
                                         <div className="bg-black/60 backdrop-blur-xl p-4 rounded-3xl border border-white/10 flex flex-col">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.admin_users?.store_name}</p>
                                            <h4 className="text-base font-black text-white italic uppercase tracking-tighter truncate">{item.product_name}</h4>
                                         </div>
                                    </div>
                                </div>
                            )}
                            <div className="p-8 space-y-6">
                                <div className="flex justify-between items-center bg-white/5 p-4 rounded-3xl border border-white/5">
                                    <div className="flex flex-col">
                                        <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Oferta Agora</p>
                                        <p className="text-xl font-black text-white italic tracking-tighter">R$ {item.discounted_price.toFixed(2).replace('.', ',')}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Normal</p>
                                        <p className="text-xs font-bold text-slate-500 line-through">R$ {item.original_price.toFixed(2).replace('.', ',')}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                     <div className="flex items-center gap-2 text-slate-500">
                                        <span className="material-symbols-outlined text-lg">timer</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest">Expira em 24h</span>
                                     </div>
                                     <div className="flex gap-2">
                                         <button onClick={() => openEdit(item, 'flash')} className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all"><span className="material-symbols-outlined">edit</span></button>
                                         <button onClick={() => handleDelete(item.id, 'flash')} className="size-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all"><span className="material-symbols-outlined">delete</span></button>
                                     </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {/* Empty State */}
                    {((activeTab === 'banner' && banners.length === 0) || (activeTab === 'coupon' && coupons.length === 0) || (activeTab === 'flash' && flashOffers.length === 0)) && (
                        <div className="col-span-full py-32 text-center flex flex-col items-center">
                            <div className="size-24 rounded-full bg-white/5 flex items-center justify-center text-slate-800 mb-6">
                                <span className="material-symbols-outlined text-6xl">{tabs.find(t => t.id === activeTab)?.icon}</span>
                            </div>
                            <h4 className="text-xl font-black italic text-slate-500 uppercase">Nenhum item encontrado</h4>
                            <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest mt-2 px-20">Comece criando sua primeira campanha de marketing clicando no botão "Novo Item" no topo do estúdio.</p>
                        </div>
                    )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Modals for Flash Offer */}
        <MerchantSelectorModal
          isOpen={merchantModalOpen}
          onClose={() => setMerchantModalOpen(false)}
          merchants={merchants}
          selectedIds={formData.merchant_ids}
          onConfirm={(ids) => {
            setFormData((prev: any) => ({
              ...prev,
              merchant_ids: ids,
              selected_product_ids: []
            }));
            setMerchantModalOpen(false);
            fetchProducts(ids);
          }}
        />

        <ProductSelectorModal
          isOpen={productModalOpen}
          onClose={() => setProductModalOpen(false)}
          products={availableProducts}
          selectedProducts={availableProducts.filter(p => formData.selected_product_ids.includes(p.id))}
          onConfirm={(selected) => {
            setFormData((prev: any) => ({
              ...prev,
              selected_product_ids: selected.map((p: any) => p.id)
            }));
            setProductModalOpen(false);
          }}
        />

        <FlashOfferTimerModal 
            isOpen={dateModalOpen}
            onClose={() => setDateModalOpen(false)}
            initialDate={formData.expires_at}
            onConfirm={(date) => setFormData({...formData, expires_at: date})}
        />
      </motion.div>
    </div>
  );
}
