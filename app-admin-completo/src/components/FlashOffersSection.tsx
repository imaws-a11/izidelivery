import React from 'react';
import { supabase } from '../lib/supabase';
import FlashOfferTimerModal from './FlashOfferTimerModal';
import { MerchantSelectorModal } from './MerchantSelectorModal';
import { ProductSelectorModal } from './ProductSelectorModal';

interface FlashOffersSectionProps {
  userRole: string;
  merchantId?: string;
}

const EMPTY_FORM = {
  id: '',
  title: '',
  merchant_ids: [] as string[],
  selected_product_ids: [] as string[],
  discount_type: 'percent' as 'percent' | 'fixed',
  discount_value: '',
  expires_at: '',
  description: '',
  fallback_original_price: 0,
  fallback_product_name: '',
  fallback_product_image: '',
  fallback_product_id: ''
};

const FlashOffersSection = ({ userRole, merchantId }: FlashOffersSectionProps) => {
  const [offers, setOffers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);
  const [merchants, setMerchants] = React.useState<any[]>([]);
  const [dateModalOpen, setDateModalOpen] = React.useState(false);
  const [merchantModalOpen, setMerchantModalOpen] = React.useState(false);
  const [productModalOpen, setProductModalOpen] = React.useState(false);
  const [availableProducts, setAvailableProducts] = React.useState<any[]>([]);
  const [form, setForm] = React.useState(EMPTY_FORM);

  const defaultMerchantIds = React.useMemo(() => (
    userRole === 'merchant' && merchantId ? [merchantId] : []
  ), [merchantId, userRole]);

  const resetForm = React.useCallback(() => {
    setForm({
      ...EMPTY_FORM,
      merchant_ids: defaultMerchantIds
    });
  }, [defaultMerchantIds]);

  const parseNumber = (value: any) => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    return Number(String(value).replace(',', '.'));
  };

  const calculateDiscountedPrice = React.useCallback((originalPrice: number) => {
    const discountValue = Math.max(parseNumber(form.discount_value), 0);
    if (form.discount_type === 'fixed') {
      return Math.max(originalPrice - discountValue, 0);
    }
    const percent = Math.min(discountValue, 100);
    return Math.max(originalPrice * (1 - (percent / 100)), 0);
  }, [form.discount_type, form.discount_value]);

  const fetchOffers = React.useCallback(async () => {
    let query = supabase.from('flash_offers').select('*, admin_users(store_name)');
    if (userRole === 'merchant' && merchantId) {
      query = query.eq('merchant_id', merchantId);
    }

    const { data } = await query.order('created_at', { ascending: false });
    if (data) setOffers(data);
  }, [merchantId, userRole]);

  const fetchMerchants = React.useCallback(async () => {
    if (userRole === 'admin') {
      const { data } = await supabase
        .from('admin_users')
        .select('id, store_name')
        .eq('role', 'merchant')
        .eq('is_active', true);
      if (data) setMerchants(data);
      return;
    }

    if (!merchantId) return;
    const { data } = await supabase
      .from('admin_users')
      .select('id, store_name')
      .eq('id', merchantId)
      .single();

    if (data) setMerchants([data]);
  }, [merchantId, userRole]);

  React.useEffect(() => {
    fetchOffers();
    fetchMerchants();
    resetForm();
  }, [fetchMerchants, fetchOffers, resetForm]);

  React.useEffect(() => {
    const merchantIds = form.merchant_ids;
    if (!merchantIds.length) {
      setAvailableProducts([]);
      return;
    }

    supabase
      .from('products_delivery')
      .select('*')
      .in('merchant_id', merchantIds)
      .eq('is_available', true)
      .then(({ data }) => setAvailableProducts(data || []));
  }, [form.merchant_ids]);

  const selectedProducts = React.useMemo(() => {
    if (!form.selected_product_ids.length && !form.fallback_product_id) return [];
    const byId = new Map(availableProducts.map((product: any) => [String(product.id), product]));
    
    const products = form.selected_product_ids
      .map(productId => byId.get(String(productId)))
      .filter(Boolean);

    if (products.length === 0 && form.id && form.fallback_product_id) {
       // Se estamos editando mas a lista de disponíveis não carregou (ou o produto foi inativado)
       return [{
          id: form.fallback_product_id,
          name: form.fallback_product_name,
          image_url: form.fallback_product_image,
          price: form.fallback_original_price,
          merchant_id: form.merchant_ids[0]
       }];
    }
    return products;
  }, [availableProducts, form.selected_product_ids, form.id, form.fallback_product_id, form.fallback_product_name, form.fallback_product_image, form.fallback_original_price, form.merchant_ids]);

  const handleEdit = (offer: any) => {
    const originalPrice = Number(offer.original_price || 0);
    const discountedPrice = Number(offer.discounted_price || 0);
    const inferredDiscountType = offer.discount_type || (offer.discount_percent ? 'percent' : 'fixed');
    const inferredDiscountValue = offer.discount_value ?? (
      inferredDiscountType === 'percent'
        ? Number(offer.discount_percent || 0)
        : Math.max(originalPrice - discountedPrice, 0)
    );
    const matchedProduct = availableProducts.find((product: any) => (
      (offer.product_id && String(product.id) === String(offer.product_id)) ||
      (product.merchant_id === offer.merchant_id && product.name === offer.product_name)
    ));

    const targetProductId = matchedProduct ? matchedProduct.id : (offer.product_id || '');
    
    setForm({
      ...EMPTY_FORM,
      id: offer.id,
      title: offer.title || '',
      merchant_ids: offer.merchant_id ? [offer.merchant_id] : defaultMerchantIds,
      selected_product_ids: targetProductId ? [targetProductId] : [],
      discount_type: inferredDiscountType === 'fixed' ? 'fixed' : 'percent',
      discount_value: inferredDiscountValue ? String(inferredDiscountValue) : '',
      expires_at: offer.expires_at || '',
      description: offer.description || '',
      fallback_original_price: originalPrice,
      fallback_product_name: offer.product_name,
      fallback_product_image: offer.product_image,
      fallback_product_id: targetProductId
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    const merchantIds = form.merchant_ids.length > 0 ? form.merchant_ids : defaultMerchantIds;
    const numericDiscount = parseNumber(form.discount_value);

    if (!merchantIds.length) {
      alert('Selecione pelo menos um lojista.');
      return;
    }

    if (!selectedProducts.length) {
      alert('Selecione pelo menos um produto participante.');
      return;
    }

    if (!Number.isFinite(numericDiscount) || numericDiscount <= 0) {
      alert('Informe um desconto valido para a oferta.');
      return;
    }

    const expiresAt = form.expires_at
      ? new Date(form.expires_at).toISOString()
      : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    setLoading(true);

    try {
      const payloads = selectedProducts.map((product: any) => {
        const originalPrice = Number(product.price || 0);
        const discountedPrice = Number(calculateDiscountedPrice(originalPrice).toFixed(2));
        const discountPercent = originalPrice > 0
          ? Math.round((1 - (discountedPrice / originalPrice)) * 100)
          : 0;

        return {
          title: form.title || `Oferta ${product.name}`,
          description: form.description || null,
          merchant_id: product.merchant_id || merchantIds[0] || null,
          product_name: product.name || 'Produto sem nome',
          product_image: product.image_url || null,
          original_price: originalPrice,
          discounted_price: discountedPrice,
          discount_percent: discountPercent,
          expires_at: expiresAt,
          is_active: true
        };
      });

      if (form.id) {
        const [primaryPayload, ...extraPayloads] = payloads;
        const { error: updateError } = await supabase
          .from('flash_offers')
          .update(primaryPayload)
          .eq('id', form.id);

        if (updateError) throw updateError;

        if (extraPayloads.length > 0) {
          const { error: insertExtrasError } = await supabase
            .from('flash_offers')
            .insert(extraPayloads);
          if (insertExtrasError) throw insertExtrasError;
        }
      } else {
        const { error: insertError } = await supabase
          .from('flash_offers')
          .insert(payloads);
        if (insertError) throw insertError;
      }

      setShowForm(false);
      resetForm();
      fetchOffers();
    } catch (error: any) {
      console.error('Erro ao salvar oferta:', error);
      alert(`Erro ao salvar oferta: ${error.message || JSON.stringify(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('flash_offers').update({ is_active: !current }).eq('id', id);
    fetchOffers();
  };

  const deleteOffer = async (id: string) => {
    if (!confirm('Excluir esta oferta?')) return;
    await supabase.from('flash_offers').delete().eq('id', id);
    fetchOffers();
  };

  const offerPreview = selectedProducts.map((product: any) => {
    const originalPrice = Number(product.price || 0);
    const discountedPrice = Number(calculateDiscountedPrice(originalPrice).toFixed(2));

    return {
      id: product.id,
      name: product.name,
      image: product.image_url,
      originalPrice,
      discountedPrice
    };
  });

  return (
    <div className="space-y-6 border-t border-slate-100 dark:border-slate-800 pt-8 mt-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
            <span className="material-symbols-outlined text-rose-500">local_fire_department</span>
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {userRole === 'merchant' ? 'Ofertas nos Produtos' : 'Izi Flash'}
            </h2>
            <p className="text-xs text-slate-400">
              {userRole === 'merchant'
                ? 'Escolha produtos do seu cardapio e aplique desconto direto neles'
                : 'Crie ofertas por produto com desconto aplicado no item participante'}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            if (!showForm) resetForm();
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 px-5 py-3 bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:brightness-110 transition-all"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Nova Oferta
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[28px] p-6 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                {form.id ? 'Editar Oferta' : 'Nova Oferta'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                O desconto sera aplicado diretamente em cada produto participante.
              </p>
            </div>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-rose-500 transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome da campanha</label>
              <input
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Festival do Hamburguer"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold dark:text-white focus:outline-none focus:border-rose-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expira em</label>
              <button
                type="button"
                onClick={() => setDateModalOpen(true)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-sm font-bold dark:text-white flex items-center justify-between group hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-rose-500">event</span>
                  <span>
                    {form.expires_at
                      ? new Date(form.expires_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
                      : 'Definir expiracao'}
                  </span>
                </div>
                <span className="material-symbols-outlined text-slate-400 group-hover:text-rose-500 transition-colors">calendar_month</span>
              </button>
            </div>

            {userRole === 'admin' && (
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lojistas associados</label>
                <button
                  type="button"
                  onClick={() => setMerchantModalOpen(true)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-sm font-bold dark:text-white flex items-center justify-between group hover:border-yellow-400 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-yellow-400/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-yellow-500 text-sm">storefront</span>
                    </div>
                    <div className="flex flex-col leading-tight">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">Selecionar lojistas</span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest">
                        {form.merchant_ids.length} lojista(s) selecionado(s)
                      </span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 group-hover:text-yellow-400 transition-colors">chevron_right</span>
                </button>
              </div>
            )}

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Produtos participantes</label>
              <button
                type="button"
                onClick={() => setProductModalOpen(true)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm font-bold dark:text-white flex items-center justify-between group hover:border-rose-400 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-rose-500 text-base">inventory_2</span>
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">Selecionar produtos do cardapio</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest">
                      {form.selected_product_ids.length > 0
                        ? `${form.selected_product_ids.length} produto(s) selecionado(s)`
                        : 'Nenhum produto selecionado'}
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-400 group-hover:text-rose-500 transition-colors">chevron_right</span>
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo de desconto</label>
              <select
                value={form.discount_type}
                onChange={e => setForm(prev => ({ ...prev, discount_type: e.target.value as 'percent' | 'fixed' }))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold dark:text-white focus:outline-none focus:border-rose-400"
              >
                <option value="percent">Porcentagem</option>
                <option value="fixed">Valor fixo</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {form.discount_type === 'percent' ? 'Desconto (%)' : 'Desconto em R$'}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.discount_value}
                onChange={e => setForm(prev => ({ ...prev, discount_value: e.target.value }))}
                placeholder={form.discount_type === 'percent' ? '10' : '5,00'}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold dark:text-white focus:outline-none focus:border-rose-400"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descricao</label>
              <textarea
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Ex: Oferta valida hoje no jantar"
                rows={3}
                className="w-full resize-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold dark:text-white focus:outline-none focus:border-rose-400"
              />
            </div>
          </div>

          {offerPreview.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preview dos produtos em oferta</h4>
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">
                  {form.discount_type === 'percent'
                    ? `${parseNumber(form.discount_value) || 0}% OFF`
                    : `R$ ${(parseNumber(form.discount_value) || 0).toFixed(2).replace('.', ',')} OFF`}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {offerPreview.map((product) => (
                  <div key={product.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <span className="material-symbols-outlined">fastfood</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-slate-900 dark:text-white truncate">{product.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-400 line-through">
                          R$ {product.originalPrice.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-sm font-black text-rose-500">
                          R$ {product.discountedPrice.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-8 py-3 bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:brightness-110 transition-all disabled:opacity-50"
            >
              {loading ? 'Salvando...' : form.id ? 'Salvar Alteracoes' : 'Publicar Oferta'}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest"
            >
              Cancelar
            </button>
          </div>

          <FlashOfferTimerModal
            isOpen={dateModalOpen}
            onClose={() => setDateModalOpen(false)}
            initialDate={form.expires_at}
            onConfirm={(finalDate) => setForm(prev => ({ ...prev, expires_at: finalDate }))}
          />

          {userRole === 'admin' && (
            <MerchantSelectorModal
              isOpen={merchantModalOpen}
              onClose={() => setMerchantModalOpen(false)}
              merchants={merchants}
              selectedIds={form.merchant_ids}
              onConfirm={(ids) => {
                setForm(prev => ({
                  ...prev,
                  merchant_ids: ids,
                  selected_product_ids: []
                }));
                setMerchantModalOpen(false);
              }}
            />
          )}

          <ProductSelectorModal
            isOpen={productModalOpen}
            onClose={() => setProductModalOpen(false)}
            products={availableProducts}
            selectedProducts={selectedProducts}
            onConfirm={(selected) => {
              setForm(prev => ({
                ...prev,
                selected_product_ids: selected.map((product: any) => product.id)
              }));
              setProductModalOpen(false);
            }}
          />
        </div>
      )}

      {offers.length === 0 ? (
        <div className="py-12 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[28px] border border-dashed border-slate-200 dark:border-slate-700">
          <span className="material-symbols-outlined text-4xl text-slate-300 block mb-2">local_fire_department</span>
          <p className="text-sm font-black text-slate-400">Nenhuma oferta criada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {offers.map((offer: any) => {
            const isExpired = new Date(offer.expires_at) < new Date();
            const diffMs = new Date(offer.expires_at).getTime() - Date.now();
            const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
            const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

            return (
              <div
                key={offer.id}
                className={`bg-white dark:bg-slate-900 border rounded-[24px] overflow-hidden shadow-sm ${
                  isExpired || !offer.is_active
                    ? 'opacity-50 border-slate-200 dark:border-slate-700'
                    : 'border-slate-100 dark:border-slate-800'
                }`}
              >
                {offer.product_image && (
                  <div className="aspect-video overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img src={offer.product_image} className="w-full h-full object-cover" alt={offer.product_name} />
                  </div>
                )}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        {offer.admin_users?.store_name || 'Sem lojista'}
                      </p>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                        {offer.product_name}
                      </h4>
                    </div>
                    <span className="text-[10px] font-black text-white bg-rose-500 px-2.5 py-1 rounded-xl shrink-0">
                      -R$ {(Number(offer.original_price) - Number(offer.discounted_price)).toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 line-through">R$ {Number(offer.original_price).toFixed(2)}</span>
                    <span className="text-sm font-black text-rose-500">R$ {Number(offer.discounted_price).toFixed(2)}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-slate-400">timer</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isExpired ? 'text-red-500' : diffHrs < 2 ? 'text-amber-500' : 'text-slate-400'}`}>
                      {isExpired ? 'Expirada' : diffHrs > 0 ? `${diffHrs}h ${diffMins}m restantes` : `${diffMins}min restantes`}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => toggleActive(offer.id, offer.is_active)}
                      className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                        offer.is_active
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {offer.is_active ? 'Ativa' : 'Pausada'}
                    </button>
                    <button
                      onClick={() => handleEdit(offer)}
                      className="px-3 py-2.5 bg-sky-50 dark:bg-sky-500/10 text-sky-500 rounded-xl border border-sky-100 dark:border-sky-500/20 text-[9px] font-black uppercase tracking-widest hover:bg-sky-100 dark:hover:bg-sky-500/20 transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button
                      onClick={() => deleteOffer(offer.id)}
                      className="px-3 py-2.5 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-xl border border-red-100 dark:border-red-500/20 text-[9px] font-black uppercase tracking-widest hover:bg-red-100 dark:hover:bg-red-500/20 transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FlashOffersSection;
