import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAdmin } from '../context/AdminContext';
import { toastSuccess, toastError, showConfirm } from '../lib/useToast';
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

type PromoType = 'banner' | 'coupon' | 'flash' | 'explore' | 'promo_header';

export default function PromotionStudio({ merchantId = null, userRole, onClose, isModal = false }: PromotionStudioProps) {
  const { fetchPromotions, promotionsList, stats, appSettings, setAppSettings, handleFileUpload: uploadToSupabase } = useAdmin();
  
  const [activeTab, setActiveTab] = useState<PromoType>(userRole === 'merchant' ? 'coupon' : 'banner');
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
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
    is_free_shipping: false,
    merchant_id: merchantId,
    max_usage_per_user: null,
    first_order_only: false,
    // Flash specific
    merchant_ids: merchantId ? [merchantId] : [],
    selected_product_ids: [],
    target_view: ''
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

  // Efeito de segurança: impede lojistas de acessarem abas restritas
  useEffect(() => {
    if (userRole === 'merchant' && (activeTab === 'banner' || activeTab === 'explore')) {
      setActiveTab('coupon');
    }
  }, [userRole, activeTab]);

  const filteredPromos = promotionsList.filter(p => {
    if (merchantId) return p.merchant_id === merchantId;
    if (userRole === 'admin') return true; 
    return p.merchant_id === null; 
  });

  const banners = filteredPromos.filter(p => (p.image_url || p.type === 'banner') && !p.coupon_code && p.type !== 'explore');
  const coupons = filteredPromos.filter(p => (p.coupon_code || p.type === 'coupon') && p.type !== 'explore');
  const exploreCards = filteredPromos.filter(p => p.type === 'explore');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsSaving(true);
      const url = await uploadToSupabase(file, 'banners');
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

  const handlePromoBannerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      setIsSaving(true);
      const urls = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadToSupabase(files[i], 'banners');
        if (url) urls.push(url);
      }
      
      const currentUrls = appSettings.promo_banner_config?.image_urls || [];
      const config = { 
        ...appSettings.promo_banner_config, 
        image_urls: [...currentUrls, ...urls],
        // Manter compatibilidade com versão anterior
        image_url: urls[0] || appSettings.promo_banner_config?.image_url 
      };
      setAppSettings({ ...appSettings, promo_banner_config: config });
      toastSuccess(`${urls.length} imagem(ns) carregada(s)!`);
    } catch (err) {
      toastError('Erro no upload das imagens');
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
    if (activeTab === 'explore' && !formData.image_url) throw new Error('Imagem do card é obrigatória');
    if (activeTab === 'coupon' && !formData.is_free_shipping && Number(formData.discount_value || 0) <= 0)
      throw new Error('Informe um valor de desconto maior que zero');

    const dataToSave = {
      title: formData.title,
      description: formData.description,
      discount_type: formData.is_free_shipping ? 'free_shipping' : formData.discount_type,
      discount_value: formData.is_free_shipping ? 0 : Number(formData.discount_value || 0),
      min_order_value: Number(formData.min_order_value || 0),
      max_usage: formData.max_usage,
      expires_at: formData.expires_at || null,
      is_active: formData.is_active,
      is_vip: formData.is_vip,
      is_free_shipping: formData.is_free_shipping,
      merchant_id: formData.merchant_id,
      max_usage_per_user: formData.max_usage_per_user ? Number(formData.max_usage_per_user) : null,
      first_order_only: formData.first_order_only,
      coupon_code: activeTab === 'coupon' ? formData.coupon_code.toUpperCase().trim() : null,
      image_url: (activeTab === 'banner' || activeTab === 'coupon' || activeTab === 'explore') ? formData.image_url : null,
      target_merchants: activeTab === 'coupon' ? formData.merchant_ids : null,
      target_products: activeTab === 'coupon' ? formData.selected_product_ids : null,
      target_view: activeTab === 'banner' ? formData.target_view : null,
      type: activeTab,
    };

    const { error } = formData.id 
      ? await supabase.from('promotions_delivery').update(dataToSave).eq('id', formData.id)
      : await supabase.from('promotions_delivery').insert([dataToSave]);

    if (error) throw error;

    // Se é um banner e alterou o preço da assinatura
    if (activeTab === 'banner' && dataToSave.min_order_value !== appSettings.iziBlackFee) {
        const newSettings = { ...appSettings, iziBlackFee: dataToSave.min_order_value };
        setAppSettings(newSettings);
        
        const SETTINGS_ID = appSettings.id || 'c568f69e-1e96-48c3-8e7c-8e8e8e8e8e8e';
        await supabase
          .from('app_settings_delivery')
          .update({ izi_black_fee: dataToSave.min_order_value })
          .eq('id', SETTINGS_ID);
    }

    toastSuccess(`Promoção ${formData.id ? 'atualizada' : 'criada'} com sucesso!`);
    setShowForm(false);
    fetchPromotions();
  };

  const saveFlashOffer = async () => {
    if (!formData.merchant_ids.length) throw new Error('Selecione pelo menos um lojista');
    if (!formData.selected_product_ids.length) throw new Error('Selecione pelo menos um produto');
    if (Number(formData.discount_value) <= 0) throw new Error('Informe um desconto válido');

    const expiresAt = formData.expires_at
      ? new Date(formData.expires_at).toISOString()
      : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const selectedProducts = availableProducts.filter(p => formData.selected_product_ids.includes(p.id));

    const payloads = selectedProducts.map((product: any) => {
      const originalPrice = Number(product.price || 0);
      let discountedPrice = 0;
      let discountPercent = 0;

      if (formData.discount_type === 'fixed') {
        discountedPrice = Math.max(originalPrice - Number(formData.discount_value || 0), 0);
        discountPercent = originalPrice > 0 ? Math.round((1 - (discountedPrice / originalPrice)) * 100) : 0;
      } else {
        discountPercent = Math.min(Number(formData.discount_value || 0), 100);
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
        is_active: true,
        max_usage_per_user: formData.max_usage_per_user ? Number(formData.max_usage_per_user) : null,
        first_order_only: formData.first_order_only,
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

  const resetForm = () => {
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
      is_free_shipping: false,
      merchant_id: merchantId,
      max_usage_per_user: null,
      first_order_only: false,
      merchant_ids: merchantId ? [merchantId] : [],
      selected_product_ids: [],
      target_view: ''
    });
  };

  const openEdit = (item: any, type: PromoType) => {
    if (type === 'flash') {
      let fDate = '';
      if (item.expires_at) {
        try {
           const d = new Date(item.expires_at);
           // datetime-local format: YYYY-MM-DDThh:mm
           const pad = (n: number) => n < 10 ? '0' + n : n;
           fDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        } catch(e) {}
      }

      setFormData({
        id: item.id,
        title: item.title || '',
        description: item.description || '',
        discount_type: item.discount_percent ? 'percent' : 'fixed',
        discount_value: item.discount_percent || Number((item.original_price - item.discounted_price).toFixed(2)),
        expires_at: fDate,
        is_active: item.is_active,
        merchant_ids: item.merchant_id ? [item.merchant_id] : [],
        selected_product_ids: item.product_id ? [item.product_id] : [],
        merchant_id: item.merchant_id,
        is_vip: item.is_vip || false,
        is_free_shipping: false,
        max_usage_per_user: item.max_usage_per_user || null,
        first_order_only: item.first_order_only || false,
      });
    } else {
      setFormData({
        ...item,
        expires_at: item.expires_at ? format(new Date(item.expires_at), 'yyyy-MM-dd') : '',
        merchant_ids: item.target_merchants || (item.merchant_id ? [item.merchant_id] : []),
        selected_product_ids: item.target_products || [],
        is_free_shipping: item.is_free_shipping || item.discount_type === 'free_shipping' || false,
        max_usage_per_user: item.max_usage_per_user || null,
        first_order_only: item.first_order_only || false,
      });
    }
    setActiveTab(type);
    setShowForm(true);
  };

  const availableTabs = [
    { id: 'banner', label: 'Banners Home (Geral)', icon: 'view_carousel', color: 'text-amber-500' },
    { id: 'explore', label: 'Cards de Exploração', icon: 'explore', color: 'text-indigo-400' },
    { id: 'coupon', label: 'Cupons de Desconto', icon: 'confirmation_number', color: 'text-primary' },
    { id: 'flash', label: 'Izi Flash (Ofertas)', icon: 'local_fire_department', color: 'text-rose-500' },
    { id: 'promo_header', label: 'Banner Topo (Cupons)', icon: 'ad_units', color: 'text-yellow-400' },
  ];

  const tabs = userRole === 'merchant' 
    ? availableTabs.filter(t => t.id === 'coupon' || t.id === 'flash')
    : availableTabs;

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
                onClick={() => { resetForm(); setShowForm(true); }}
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
            {activeTab === 'promo_header' ? (
              <motion.div
                key="promo_header"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-5xl mx-auto"
              >
                <div className="bg-white/5 border border-white/5 rounded-[40px] p-10 space-y-10 shadow-2xl">
                    <div className="flex items-center gap-6 mb-4">
                        <div className="size-16 rounded-[24px] bg-yellow-400 flex items-center justify-center text-black shadow-lg shadow-yellow-400/20">
                            <span className="material-symbols-outlined text-4xl">ad_units</span>
                        </div>
                        <div>
                            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">Banner Topo (Geral)</h3>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Gerencie a seção fixa no topo do App de serviços</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="flex items-center justify-between p-8 bg-black/40 border border-white/5 rounded-[32px] md:col-span-2">
                            <div className="flex items-center gap-5">
                                <div className={`size-12 rounded-2xl flex items-center justify-center transition-all ${appSettings.promo_banner_config?.active ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-800 text-slate-600'}`}>
                                    <span className="material-symbols-outlined">{appSettings.promo_banner_config?.active ? 'visibility' : 'visibility_off'}</span>
                                </div>
                                <div>
                                    <p className="text-sm font-black text-white">Exibir no App</p>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">O banner ficará visível para todos os clientes</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={appSettings.promo_banner_config?.active}
                                    onChange={(e) => {
                                        const config = { ...appSettings.promo_banner_config, active: e.target.checked };
                                        setAppSettings({ ...appSettings, promo_banner_config: config });
                                    }}
                                />
                                <div className="w-14 h-7 bg-white/5 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-white"></div>
                            </label>
                        </div>

                        <div className="space-y-4 md:col-span-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Galeria do Banner Hero (Carrossel Home)</label>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {(appSettings.promo_banner_config?.image_urls || []).map((url: string, idx: number) => (
                                    <div key={idx} className="aspect-square rounded-3xl bg-white/5 border border-white/10 relative overflow-hidden group">
                                        <img src={url} className="w-full h-full object-cover" alt={`Banner ${idx}`} />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newUrls = appSettings.promo_banner_config.image_urls.filter((_: any, i: number) => i !== idx);
                                                    const config = { ...appSettings.promo_banner_config, image_urls: newUrls, image_url: newUrls[0] || null };
                                                    setAppSettings({ ...appSettings, promo_banner_config: config });
                                                }}
                                                className="size-10 rounded-xl bg-rose-500 text-white flex items-center justify-center hover:scale-110 transition-all"
                                            >
                                                <span className="material-symbols-outlined text-xl">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                
                                <label className="aspect-square rounded-3xl bg-white/5 border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 text-slate-500 hover:border-yellow-400/50 hover:text-yellow-400 transition-all cursor-pointer">
                                    <span className="material-symbols-outlined text-3xl">add_photo_alternate</span>
                                    <span className="text-[8px] font-black uppercase tracking-widest">Adicionar</span>
                                    <input type="file" className="hidden" accept="image/*" multiple onChange={handlePromoBannerImageUpload} />
                                </label>
                            </div>

                            {(!appSettings.promo_banner_config?.image_urls || appSettings.promo_banner_config.image_urls.length === 0) && (
                                <div className="p-8 rounded-[32px] bg-yellow-400/5 border border-yellow-400/10 flex items-center gap-4">
                                    <span className="material-symbols-outlined text-yellow-400 text-3xl">info</span>
                                    <p className="text-xs font-bold text-slate-400">Nenhuma imagem carregada. O App usará uma imagem padrão de backup até que você adicione fotos para o carrossel.</p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-3 md:col-span-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Título do Banner</label>
                            <input 
                                type="text" 
                                value={appSettings.promo_banner_config?.title || ''}
                                onChange={(e) => {
                                    const config = { ...appSettings.promo_banner_config, title: e.target.value.toUpperCase() };
                                    setAppSettings({ ...appSettings, promo_banner_config: config });
                                }}
                                className="w-full bg-black/40 border border-white/5 rounded-3xl px-8 py-5 font-black text-xl text-yellow-400 tracking-tighter focus:ring-2 focus:ring-yellow-400 focus:bg-black/60 transition-all outline-none"
                                placeholder="EX: SEMANA DE CUPONS"
                            />
                        </div>

                        <div className="md:col-span-2 space-y-6">
                            <div className="flex items-center gap-3 ml-4">
                                <span className="material-symbols-outlined text-slate-500 text-sm">event_repeat</span>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Configuração dos Dias de Resgate</label>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                                {(appSettings.promo_banner_config?.days || []).map((dayObj: any, idx: number) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => {
                                            const newDays = [...appSettings.promo_banner_config.days];
                                            newDays[idx] = { ...dayObj, active: !dayObj.active };
                                            const config = { ...appSettings.promo_banner_config, days: newDays };
                                            setAppSettings({ ...appSettings, promo_banner_config: config });
                                        }}
                                        className={`p-4 rounded-[28px] border cursor-pointer transition-all flex flex-col items-center gap-2 group ${dayObj.active ? 'bg-yellow-400 border-yellow-400 text-black shadow-lg shadow-yellow-400/10' : 'bg-white/5 border-white/5 text-slate-600'}`}
                                    >
                                        <span className="text-[10px] font-black uppercase">Dia</span>
                                        <span className="text-2xl font-black italic leading-none">{dayObj.day}</span>
                                        <div className={`size-6 rounded-full flex items-center justify-center transition-all ${dayObj.active ? 'bg-black/10' : 'bg-white/5'}`}>
                                            <span className="material-symbols-outlined text-[14px]">{dayObj.active ? 'check_circle' : 'circle'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-white/5">
                        <button 
                            type="button"
                            onClick={async () => {
                                setIsSaving(true);
                                try {
                                    const SETTINGS_ID = appSettings.id || 'c568f69e-1e96-48c3-8e7c-8e8e8e8e8e8e';
                                    const { error } = await supabase
                                        .from('app_settings_delivery')
                                        .update({ promo_banner_config: appSettings.promo_banner_config })
                                        .eq('id', SETTINGS_ID);
                                    
                                    if (error) throw error;
                                    toastSuccess('Configuração Global salva!');
                                } catch (e) {
                                    toastError('Falha ao salvar');
                                } finally {
                                    setIsSaving(false);
                                }
                            }}
                            disabled={isSaving}
                            className="w-full bg-primary text-slate-950 h-20 rounded-[32px] font-black uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                        >
                            {isSaving ? (
                                <div className="size-6 border-4 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined font-black">save</span>
                                    <span>Salvar Configurações no App</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
              </motion.div>
            ) : showForm ? (
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
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">
                                  {activeTab === 'explore' ? 'Selecione a Categoria de Exploração' : 'Título Interno da Campanha'}
                                </label>
                                {activeTab === 'explore' ? (
                                    <div className="flex flex-wrap gap-3">
                                        {[
                                            { id: "Restaurantes", icon: "🍔", label: "Restaurantes" },
                                            { id: "Lanches", icon: "🍟", label: "Lanches" },
                                            { id: "Doceria", icon: "🍩", label: "Doceria" },
                                            { id: "Mercado", icon: "🛒", label: "Mercado" },
                                            { id: "Bebidas", icon: "🍾", label: "Bebidas" },
                                            { id: "Farmácia", icon: "💊", label: "Farmácia" },
                                            { id: "Pet Shop", icon: "🐾", label: "Pet Shop" },
                                            { id: "Hortifruti", icon: "🥬", label: "Hortifruti" },
                                            { id: "Carnes", icon: "🥩", label: "Carnes" },
                                            { id: "Padaria", icon: "🥐", label: "Padaria" },
                                            { id: "Gás e Água", icon: "💧", label: "Gás e Água" }
                                        ].map(cat => {
                                            const isSelected = (formData.title || '').split(',').includes(cat.id);
                                            return (
                                                <button
                                                    type="button"
                                                    key={cat.id}
                                                    onClick={() => {
                                                        const currentList = (formData.title || '').split(',').filter(Boolean);
                                                        if (isSelected) {
                                                            setFormData({ ...formData, title: currentList.filter(c => c !== cat.id).join(',') });
                                                        } else {
                                                            setFormData({ ...formData, title: [...currentList, cat.id].join(',') });
                                                        }
                                                    }}
                                                    className={`px-5 py-3 rounded-2xl flex items-center gap-2 font-black transition-all ${
                                                        isSelected 
                                                            ? 'bg-primary text-slate-900 shadow-[0_4px_20px_rgba(0,0,0,0.4)] scale-105' 
                                                            : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
                                                    }`}
                                                >
                                                    <span className="text-xl">{cat.icon}</span>
                                                    <span className="text-[10px] uppercase tracking-widest">{cat.label}</span>
                                                </button>
                                            )
                                        })}
                                        {(!formData.title || formData.title.length === 0) && (
                                            <p className="text-[10px] font-bold text-rose-500 w-full ml-4 mt-2 uppercase tracking-widest">
                                                * Obrigatório: Selecione pelo menos uma categoria acima.
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.title} 
                                        onChange={e => setFormData({...formData, title: e.target.value})}
                                        className="w-full bg-white/5 border border-white/5 rounded-3xl px-8 py-5 font-bold text-lg focus:ring-2 focus:ring-primary focus:bg-white/10 transition-all shadow-inner"
                                        placeholder="Ex: Festival de Verão 2026"
                                    />
                                )}
                             </div>

                              {activeTab === 'banner' && (
                                 <>
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

                                     <div className="space-y-2 md:col-span-2">
                                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Ação ao Clicar (Destino)</label>
                                         <select 
                                            value={formData.target_view || ''}
                                            onChange={e => setFormData({...formData, target_view: e.target.value})}
                                            className="w-full bg-white/5 border border-white/5 rounded-3xl px-8 py-5 font-bold focus:ring-2 focus:ring-primary focus:bg-white/10 transition-all outline-none"
                                         >
                                             <option value="" className="bg-slate-900 border-none">Padrão (Izi Black para não assinantes)</option>
                                             <option value="izi_black_purchase" className="bg-slate-900 border-none">Assinatura Izi Black</option>
                                             <option value="exclusive_offer" className="bg-slate-900 border-none">Ofertas Exclusivas Izi</option>
                                             <option value="explore_category" className="bg-slate-900 border-none">Navegar Categoria</option>
                                             <option value="wallet" className="bg-slate-900 border-none">Carteira / Pagamentos</option>
                                         </select>
                                     </div>
                                 </>
                             )}

                             {activeTab === 'explore' && (
                                 <div className="space-y-2 md:col-span-2">
                                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Imagem do Card de Exploração</label>
                                     <div className="aspect-[2/1] rounded-[40px] bg-white/5 border-2 border-dashed border-white/10 relative overflow-hidden group hover:border-primary/50 transition-colors cursor-pointer">
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
                                                 <span className="text-xs font-black uppercase tracking-widest text-center px-10">Upload Imagem (Proporção 2:1 recomendada)</span>
                                             </div>
                                         )}
                                         <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleFileUpload} />
                                     </div>
                                 </div>
                             )}

                             {activeTab === 'coupon' && (
                                 <>
                                   {/* Seletor de tipo de cupom */}
                                   <div className="space-y-3 md:col-span-2">
                                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Tipo de Cupom</label>
                                     <div className="grid grid-cols-2 gap-4">
                                       <button
                                         type="button"
                                         onClick={() => setFormData({ ...formData, is_free_shipping: false })}
                                         className={`flex items-center gap-4 p-5 rounded-3xl border-2 transition-all ${
                                           !formData.is_free_shipping
                                             ? 'border-primary bg-primary/10 text-primary'
                                             : 'border-white/10 bg-white/5 text-slate-500 hover:bg-white/10'
                                         }`}
                                       >
                                         <div className="size-10 rounded-xl bg-current/10 flex items-center justify-center shrink-0">
                                           <span className="material-symbols-outlined text-xl">percent</span>
                                         </div>
                                         <div className="text-left">
                                           <p className="text-sm font-black">Desconto em Produto</p>
                                           <p className="text-[9px] font-bold uppercase tracking-widest opacity-70">% ou R$ no carrinho</p>
                                         </div>
                                       </button>
                                       <button
                                         type="button"
                                         onClick={() => setFormData({ ...formData, is_free_shipping: true })}
                                         className={`flex items-center gap-4 p-5 rounded-3xl border-2 transition-all ${
                                           formData.is_free_shipping
                                             ? 'border-sky-400 bg-sky-400/10 text-sky-400'
                                             : 'border-white/10 bg-white/5 text-slate-500 hover:bg-white/10'
                                         }`}
                                       >
                                         <div className="size-10 rounded-xl flex items-center justify-center shrink-0">
                                           <span className="material-symbols-outlined text-xl">local_shipping</span>
                                         </div>
                                         <div className="text-left">
                                           <p className="text-sm font-black">Frete Grátis</p>
                                           <p className="text-[9px] font-bold uppercase tracking-widest opacity-70">Zera a taxa de entrega</p>
                                         </div>
                                       </button>
                                     </div>
                                   </div>

                                   {/* Código do cupom */}
                                   <div className="space-y-2 md:col-span-2">
                                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Código Único (CUPOM)</label>
                                     <input 
                                         type="text" 
                                         required
                                         value={formData.coupon_code} 
                                         onChange={e => setFormData({...formData, coupon_code: e.target.value.toUpperCase()})}
                                         className="w-full bg-white/5 border border-white/5 rounded-3xl px-8 py-5 font-black text-2xl text-center text-primary tracking-[0.3em] focus:ring-2 focus:ring-primary focus:bg-white/10 transition-all shadow-inner"
                                         placeholder={formData.is_free_shipping ? 'EX: FRETEFREE' : 'EX: IZI20OFF'}
                                     />
                                   </div>

                                   {/* Imagem de Fundo do Cupom */}
                                   <div className="space-y-2 md:col-span-2">
                                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Imagem de Fundo do Card (Personalização)</label>
                                       <div className="aspect-[3/1] rounded-[32px] bg-white/5 border-2 border-dashed border-white/10 relative overflow-hidden group hover:border-primary/50 transition-colors cursor-pointer">
                                           {formData.image_url ? (
                                               <>
                                                   <img src={formData.image_url} className="w-full h-full object-cover" />
                                                   <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                                       <span className="material-symbols-outlined text-primary text-4xl">edit</span>
                                                       <button 
                                                           type="button"
                                                           onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFormData({...formData, image_url: null}); }}
                                                           className="size-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center hover:scale-110 transition-all"
                                                       >
                                                           <span className="material-symbols-outlined">delete</span>
                                                       </button>
                                                   </div>
                                               </>
                                           ) : (
                                               <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-500 group-hover:text-primary transition-colors">
                                                   <span className="material-symbols-outlined text-4xl text-slate-500">add_photo_alternate</span>
                                                   <span className="text-[10px] font-black uppercase tracking-widest">Adicionar fundo visual ao cupom</span>
                                               </div>
                                           )}
                                           <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleFileUpload} />
                                       </div>
                                   </div>
                                 </>
                             )}

                             {(activeTab === 'coupon' || activeTab === 'flash') && (
                                 <>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Lojistas Associados</label>
                                        {userRole === 'merchant' ? (
                                            <div className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-5 font-bold text-slate-400 flex items-center gap-3">
                                                <span className="material-symbols-outlined text-emerald-500">check_circle</span>
                                                Sua loja já está selecionada para esta oferta
                                            </div>
                                        ) : (
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
                                        )}
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

                                       {/* Tipo de Desconto e Valor – ocultados no modo Frete Grátis */}
                              {(activeTab === 'coupon' || activeTab === 'flash') && (
                                <>
                                  {!formData.is_free_shipping && (
                                    <>
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
                                            type="text" 
                                            inputMode="decimal"
                                            value={formData.discount_value?.toString().replace('.', ',')}
                                            onChange={e => setFormData({...formData, discount_value: e.target.value.replace(',', '.')})}
                                            className="w-full bg-white/5 border border-white/5 rounded-3xl px-8 py-5 font-black text-lg focus:ring-2 focus:ring-primary focus:bg-white/10 transition-all shadow-inner"
                                        />
                                      </div>
                                    </>
                                  )}

                                  {/* Banner de Frete Grátis */}
                                  {formData.is_free_shipping && activeTab === 'coupon' && (
                                    <div className="col-span-2 flex items-center gap-5 p-6 bg-sky-500/10 border border-sky-500/30 rounded-3xl">
                                      <div className="size-12 rounded-2xl bg-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                                        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>local_shipping</span>
                                      </div>
                                      <div>
                                        <p className="text-sm font-black text-sky-400">Cupom de Frete Grátis</p>
                                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">Este cupom zera a taxa de entrega cobrada pelo Izi. Defina um pedido mínimo abaixo se quiser restringir o uso.</p>
                                      </div>
                                    </div>
                                  )}

                                 <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">
                                         Pedido Mínimo (R$)
                                    </label>
                                    <input 
                                        type="text" 
                                        inputMode="decimal"
                                        value={formData.min_order_value?.toString().replace('.', ',') || ''}
                                        onChange={e => setFormData({...formData, min_order_value: e.target.value.replace(',', '.')})}
                                        className="w-full bg-white/5 border border-white/5 rounded-3xl px-8 py-5 font-black text-lg focus:ring-2 focus:ring-primary focus:bg-white/10 transition-all shadow-inner"
                                        placeholder="0,00"
                                    />
                                 </div>
                                </>
                              )}

                             {(activeTab === 'coupon' || activeTab === 'flash') && (
                                 <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Expira em (Vencimento)</label>
                                    <input 
                                        type={activeTab === 'flash' ? 'datetime-local' : 'date'}
                                        value={formData.expires_at}
                                        onChange={e => setFormData({...formData, expires_at: e.target.value})}
                                        className="w-full bg-white/5 border border-white/5 rounded-3xl px-8 py-5 font-bold text-lg focus:ring-2 focus:ring-primary focus:bg-white/10 transition-all shadow-inner text-white appearance-none"
                                    />
                                 </div>
                             )}

                              {(activeTab === 'coupon' || activeTab === 'flash') && (
                                  <>
                                      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                          <div className="space-y-2">
                                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Limite por CPF (Opcional)</label>
                                              <div className="relative">
                                                  <input 
                                                      type="number" 
                                                      placeholder="Ex: 1 (Deixe vazio para ilimitado)"
                                                      value={formData.max_usage_per_user || ''}
                                                      onChange={e => setFormData({...formData, max_usage_per_user: e.target.value ? Number(e.target.value) : null})}
                                                      className="w-full bg-white/5 border border-white/5 rounded-3xl px-8 py-5 font-bold text-lg focus:ring-2 focus:ring-primary focus:bg-white/10 transition-all shadow-inner"
                                                  />
                                                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500">
                                                      <span className="material-symbols-outlined">person_limit</span>
                                                  </div>
                                              </div>
                                          </div>

                                          <div className="space-y-2">
                                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Restrição de Uso</label>
                                              <label className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-[32px] cursor-pointer group hover:bg-white/10 transition-all h-[70px]">
                                                  <div className="flex items-center gap-3">
                                                      <div className="size-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                                          <span className="material-symbols-outlined text-sm">shopping_cart_checkout</span>
                                                      </div>
                                                      <p className="text-xs font-black">Apenas Primeira Compra</p>
                                                  </div>
                                                  <input 
                                                      type="checkbox" 
                                                      checked={formData.first_order_only}
                                                      onChange={e => setFormData({...formData, first_order_only: e.target.checked})}
                                                      className="size-6 rounded-lg bg-white/5 border-white/10 text-indigo-500 focus:ring-indigo-500 transition-all" 
                                                  />
                                              </label>
                                          </div>
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

                                        <label className="flex-1 flex items-center justify-between p-6 bg-white/5 border border-white/5 rounded-[32px] cursor-pointer group hover:bg-white/10 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                                                    <span className="material-symbols-outlined">stars</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-amber-500">Exclusivo Black</p>
                                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest text-amber-500/60">Somente membros VIP</p>
                                                </div>
                                            </div>
                                            <input 
                                                type="checkbox" 
                                                checked={formData.is_vip}
                                                onChange={e => setFormData({...formData, is_vip: e.target.checked})}
                                                className="size-8 rounded-xl bg-white/5 border-white/10 text-amber-500 focus:ring-amber-500 transition-all" 
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
                                 </>
                             )}
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
                                    {item.is_vip && (
                                        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full">
                                            <span className="material-symbols-outlined text-[14px] text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                                            <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Exclusivo Izi Black</span>
                                        </div>
                                    )}
                                </div>
                                <div className="absolute top-6 right-6 flex gap-2">
                                     <button onClick={() => openEdit(item, 'banner')} className="size-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-primary hover:text-slate-950 transition-all"><span className="material-symbols-outlined text-lg">edit</span></button>
                                      <button onClick={() => handleDelete(item.id!, 'banner')} className="size-10 rounded-xl bg-rose-500/20 backdrop-blur-md flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all"><span className="material-symbols-outlined text-lg">delete</span></button>
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

                    {activeTab === 'explore' && exploreCards.map(item => (
                        <motion.div layout key={item.id} className="bg-slate-900/50 border border-indigo-500/20 rounded-[48px] overflow-hidden group hover:border-indigo-400 transition-all flex flex-col relative shadow-2xl">
                            <div className="aspect-[2/1] relative overflow-hidden">
                                <img src={item.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.title} />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent p-6 flex flex-col justify-end">
                                    <h4 className="text-xl font-black italic uppercase tracking-tighter text-white">{item.title}</h4>
                                </div>
                                <div className="absolute top-6 right-6 flex gap-2">
                                     <button onClick={() => openEdit(item, 'explore')} className="size-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-indigo-400 hover:text-slate-950 transition-all"><span className="material-symbols-outlined text-lg">edit</span></button>
                                     <button onClick={() => handleDelete(item.id!, 'explore')} className="size-10 rounded-xl bg-rose-500/20 backdrop-blur-md flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all"><span className="material-symbols-outlined text-lg">delete</span></button>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {activeTab === 'coupon' && coupons.map(item => {
                      const isFreeShipping = item.is_free_shipping || item.discount_type === 'free_shipping';
                      return (
                        <motion.div layout key={item.id} className={`bg-slate-900 border rounded-[48px] p-10 flex flex-col gap-6 group transition-all shadow-2xl relative ${
                          isFreeShipping
                            ? 'border-sky-500/20 hover:border-sky-400/60'
                            : 'border-white/5 hover:border-primary/50'
                        }`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                                      {isFreeShipping ? 'Cupom Frete Grátis' : 'Cupom de Desconto'}
                                    </p>
                                    <h4 className={`text-4xl font-black italic tracking-widest uppercase ${
                                      isFreeShipping ? 'text-sky-400' : 'text-primary'
                                    }`}>{item.coupon_code}</h4>
                                </div>
                                <div className={`size-12 rounded-2xl flex items-center justify-center ${
                                  isFreeShipping ? 'bg-sky-500/10 text-sky-400' : 'bg-primary/10 text-primary'
                                }`}>
                                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                                      {isFreeShipping ? 'local_shipping' : 'confirmation_number'}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h5 className="text-xl font-black text-white italic uppercase tracking-tighter">{item.title}</h5>
                                <div className="flex flex-wrap gap-2">
                                  {isFreeShipping && (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-500/10 border border-sky-500/20 rounded-full w-fit">
                                        <span className="material-symbols-outlined text-[14px] text-sky-400" style={{ fontVariationSettings: "'FILL' 1" }}>local_shipping</span>
                                        <span className="text-[9px] font-black text-sky-400 uppercase tracking-widest">Frete Grátis</span>
                                    </div>
                                  )}
                                  {item.is_vip && (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full w-fit">
                                        <span className="material-symbols-outlined text-[14px] text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                                        <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Exclusivo Izi Black</span>
                                    </div>
                                  )}
                                  {item.first_order_only && (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full w-fit">
                                        <span className="material-symbols-outlined text-[14px] text-indigo-400">shopping_cart_checkout</span>
                                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">1ª Compra</span>
                                    </div>
                                  )}
                                  {item.max_usage_per_user && (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-500/10 border border-white/10 rounded-full w-fit">
                                        <span className="material-symbols-outlined text-[14px] text-slate-400">person</span>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Limite {item.max_usage_per_user}/CPF</span>
                                    </div>
                                  )}
                                </div>
                                <p className="text-xs font-bold text-slate-500 line-clamp-2">{item.description}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className={`p-4 rounded-2xl border ${
                                  isFreeShipping ? 'bg-sky-500/5 border-sky-500/20' : 'bg-white/5 border-white/5'
                                }`}>
                                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Benefício</p>
                                    <p className={`text-base font-black ${
                                      isFreeShipping ? 'text-sky-400' : 'text-emerald-400'
                                    }`}>
                                        {isFreeShipping
                                          ? 'Frete Grátis'
                                          : item.discount_type === 'percent'
                                            ? `${item.discount_value}% OFF`
                                            : `R$ ${item.discount_value} OFF`
                                        }
                                    </p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Pedido Mín.</p>
                                    <p className="text-base font-black text-white">
                                      {Number(item.min_order_value) > 0 ? `R$ ${Number(item.min_order_value).toFixed(2).replace('.',',')}` : 'Sem mínimo'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <div className="flex items-center gap-3">
                                     <button onClick={() => openEdit(item, 'coupon')} className="text-slate-500 hover:text-primary transition-colors uppercase font-black text-[9px] tracking-widest">Editar</button>
                                     <button onClick={() => handleDelete(item.id!, 'coupon')} className="text-slate-500 hover:text-rose-500 transition-colors uppercase font-black text-[9px] tracking-widest">Excluir</button>
                                </div>
                                <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${item.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-500'}`}>
                                    {item.is_active ? 'Ativo' : 'Pausado'}
                                </div>
                            </div>
                        </motion.div>
                      );
                    })}

                    {activeTab === 'flash' && flashOffers.map(item => (
                        <motion.div layout key={item.id} className="bg-slate-900 border border-white/5 rounded-[48px] overflow-hidden group hover:border-rose-500/50 transition-all shadow-2xl relative">
                            <div className="p-4 space-y-4">
                                <div className="flex items-center gap-4 bg-white/5 p-3 rounded-[32px] border border-white/5">
                                    {item.product_image && (
                                        <div className="size-16 rounded-2xl overflow-hidden bg-black shrink-0 border border-white/10 shadow-inner">
                                            <img src={item.product_image} className="w-full h-full object-cover" alt={item.product_name} />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="bg-rose-500 text-white px-2 py-0.5 rounded-lg text-[8px] font-black uppercase italic tracking-tighter shadow-lg flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[10px]">bolt</span>
                                                {item.discount_percent}% OFF
                                            </div>
                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest truncate">{item.admin_users?.store_name}</p>
                                        </div>
                                        <h4 className="text-sm font-black text-white italic uppercase tracking-tighter truncate">{item.product_name}</h4>
                                    </div>
                                </div>
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
                                     <div className="flex flex-wrap gap-3 flex-1">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <span className="material-symbols-outlined text-lg">timer</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest">Expira em 24h</span>
                                        </div>
                                        {item.first_order_only && (
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                                                <span className="material-symbols-outlined text-[12px] text-indigo-400">shopping_cart_checkout</span>
                                                <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">1ª Compra</span>
                                            </div>
                                        )}
                                        {item.max_usage_per_user && (
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-500/10 border border-white/10 rounded-lg">
                                                <span className="material-symbols-outlined text-[12px] text-slate-400">person</span>
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Lmt: {item.max_usage_per_user}/CPF</span>
                                            </div>
                                        )}
                                     </div>
                                     <div className="flex gap-2">
                                         <button onClick={() => openEdit(item, 'flash')} className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all"><span className="material-symbols-outlined">edit</span></button>
                                          <button onClick={() => handleDelete(item.id!, 'flash')} className="size-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all"><span className="material-symbols-outlined">delete</span></button>
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
