import React from 'react';
import { supabase } from '../lib/supabase';
import { useAdmin } from '../context/AdminContext';
import FlashOfferTimerModal from './FlashOfferTimerModal';


interface FlashOffersSectionProps {
  userRole: string;
  merchantId?: string;
}

const FlashOffersSection = ({ userRole, merchantId }: FlashOffersSectionProps) => {
  const { handleFileUpload } = useAdmin();
  const [offers, setOffers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);

  const [merchants, setMerchants] = React.useState<any[]>([]);
  const [dateModalOpen, setDateModalOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    id: '', product_name: '', product_image: '', original_price: '',
    discounted_price: '', merchant_id: '', expires_at: '', description: ''
  });

  const fetchOffers = async () => {
    let query = supabase.from('flash_offers').select('*, admin_users(store_name)');
    if (userRole === 'merchant' && merchantId) {
      query = query.eq('merchant_id', merchantId);
    }
    const { data } = await query.order('created_at', { ascending: false });
    if (data) setOffers(data);
  };

  const fetchMerchants = async () => {
    if (userRole === 'admin') {
      const { data } = await supabase.from('admin_users').select('id, store_name').eq('role', 'merchant').eq('is_active', true);
      if (data) setMerchants(data);
    } else if (merchantId) {
      const { data } = await supabase.from('admin_users').select('id, store_name').eq('id', merchantId).single();
      if (data) {
        setMerchants([data]);
        setForm(prev => ({ ...prev, merchant_id: merchantId }));
      }
    }
  };

  React.useEffect(() => { fetchOffers(); fetchMerchants(); }, []);

  const handleEdit = (offer: any) => {
    setForm({
      id: offer.id,
      product_name: offer.product_name || '',
      product_image: offer.product_image || '',
      original_price: offer.original_price?.toString() || '',
      discounted_price: offer.discounted_price?.toString() || '',
      merchant_id: offer.merchant_id || '',
      expires_at: offer.expires_at || '',
      description: offer.description || '',
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    setLoading(true);
    
    // Calcula o percentual de desconto se ambos os preços existirem
    let discountPct = 0;
    if (form.original_price && form.discounted_price) {
      discountPct = Math.round((1 - Number(form.discounted_price) / Number(form.original_price)) * 100);
    }

    const payload = {
      title: form.product_name || 'Sem título',
      description: form.description || null,
      merchant_id: form.merchant_id || null,
      product_name: form.product_name || 'Sem nome',
      product_image: form.product_image || null,
      original_price: form.original_price ? Number(form.original_price) : 0,
      discounted_price: form.discounted_price ? Number(form.discounted_price) : 0,
      discount_percent: discountPct,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    let error;
    if (form.id) {
      const { error: updateError } = await supabase.from('flash_offers').update(payload).eq('id', form.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('flash_offers').insert({ ...payload, is_active: true });
      error = insertError;
    }

    setLoading(false);
    if (!error) {
      setShowForm(false);
      setForm({ id: '', product_name: '', product_image: '', original_price: '', discounted_price: '', merchant_id: '', expires_at: '', description: '' });
      fetchOffers();
    } else {
      console.error('Erro ao salvar oferta:', error);
      alert('Erro ao salvar oferta: ' + error.message);
    }
  };


  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('flash_offers').update({ is_active: !current }).eq('id', id);
    fetchOffers();
  };

  const deleteOffer = async (id: string) => {
    if (!confirm('Excluir esta oferta flash?')) return;
    await supabase.from('flash_offers').delete().eq('id', id);
    fetchOffers();
  };

  const discountValue = form.original_price && form.discounted_price
    ? Number(form.original_price) - Number(form.discounted_price)
    : 0;

  return (
    <div className="space-y-6 border-t border-slate-100 dark:border-slate-800 pt-8 mt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
            <span className="material-symbols-outlined text-rose-500">flash_on</span>
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Izi Flash</h2>
            <p className="text-xs text-slate-400">Ofertas com tempo limitado e descontos exclusivos</p>

          </div>
        </div>
        <button
          onClick={() => {
            setForm({ id: '', product_name: '', product_image: '', original_price: '', discounted_price: '', merchant_id: '', expires_at: '', description: '' });
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 px-5 py-3 bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:brightness-110 transition-all"
        >
          <span className="material-symbols-outlined text-lg">add</span>Nova Oferta Flash
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[28px] p-6 space-y-5">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{form.id ? 'Editar Oferta Flash' : 'Nova Oferta Flash'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Produto</label>

              <input value={form.product_name} onChange={e => setForm({ ...form, product_name: e.target.value })} placeholder="Nome do produto" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold dark:text-white focus:outline-none focus:border-rose-400" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lojista</label>
              <select value={form.merchant_id} onChange={e => setForm({ ...form, merchant_id: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold dark:text-white focus:outline-none focus:border-rose-400">
                <option value="">Selecionar lojista</option>
                {merchants.map((m: any) => <option key={m.id} value={m.id}>{m.store_name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preço Original (R$)</label>

              <input type="number" value={form.original_price} onChange={e => setForm({ ...form, original_price: e.target.value })} placeholder="0,00" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold dark:text-white focus:outline-none focus:border-rose-400" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preço com Desconto (R$)</label>

              <input type="number" value={form.discounted_price} onChange={e => setForm({ ...form, discounted_price: e.target.value })} placeholder="0,00" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold dark:text-white focus:outline-none focus:border-rose-400" />
              {form.original_price && form.discounted_price && (
                <p className="text-[10px] font-black text-emerald-500">
                  Economia: R$ {discountValue.toFixed(2).replace('.', ',')} ✓
                </p>
              )}

            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Expira em</label>

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
                      : 'Definir expiração'}
                  </span>
                </div>
                <span className="material-symbols-outlined text-slate-400 group-hover:text-rose-500 transition-colors">calendar_month</span>
              </button>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Imagem do Produto</label>
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center group hover:border-rose-400 transition-colors">
                {form.product_image ? (
                  <>
                    <img src={form.product_image} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="bg-white text-slate-900 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">upload</span>
                        Trocar Foto
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-4 pointer-events-none">
                    {uploadingImage ? (
                      <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    ) : (
                      <span className="material-symbols-outlined text-3xl text-slate-300 mb-1">add_a_photo</span>
                    )}
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                      {uploadingImage ? 'Enviando...' : 'Selecionar Foto'}
                    </p>
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={uploadingImage}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadingImage(true);
                    try {
                      const url = await handleFileUpload(file, 'products');
                      if (url) {
                        setForm({ ...form, product_image: url });
                      }
                    } finally {
                      setUploadingImage(false);
                    }
                  }}
                />

              </div>
            </div>

            <FlashOfferTimerModal
              isOpen={dateModalOpen}
              onClose={() => setDateModalOpen(false)}
              initialDate={form.expires_at}
              onConfirm={(finalDate) => {
                setForm({ ...form, expires_at: finalDate });
              }}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={loading} className="px-8 py-3 bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:brightness-110 transition-all disabled:opacity-50">
              {loading ? 'Salvando...' : form.id ? 'Salvar Alterações' : 'Publicar Oferta Flash'}
            </button>
            <button onClick={() => {
              setShowForm(false);
              setForm({ id: '', product_name: '', product_image: '', original_price: '', discounted_price: '', merchant_id: '', expires_at: '', description: '' });
            }} className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest">Cancelar</button>
          </div>
        </div>
      )}

      {offers.length === 0 ? (
        <div className="py-12 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[28px] border border-dashed border-slate-200 dark:border-slate-700">
          <span className="material-symbols-outlined text-4xl text-slate-300 block mb-2">flash_off</span>
          <p className="text-sm font-black text-slate-400">Nenhuma oferta flash criada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {offers.map((offer: any) => {
            const isExpired = new Date(offer.expires_at) < new Date();
            const diffMs = new Date(offer.expires_at).getTime() - Date.now();
            const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
            const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            return (
              <div key={offer.id} className={`bg-white dark:bg-slate-900 border rounded-[24px] overflow-hidden shadow-sm ${isExpired || !offer.is_active ? 'opacity-50 border-slate-200 dark:border-slate-700' : 'border-slate-100 dark:border-slate-800'}`}>
                {offer.product_image && (
                  <div className="aspect-video overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img src={offer.product_image} className="w-full h-full object-cover" alt={offer.product_name} />
                  </div>
                )}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{offer.admin_users?.store_name || 'Sem lojista'}</p>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">{offer.product_name}</h4>
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
                      className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${offer.is_active ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-200 dark:border-emerald-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                    >
                      {offer.is_active ? '● Ativa' : '○ Pausada'}
                    </button>
                    <button onClick={() => handleEdit(offer)} className="px-3 py-2.5 bg-sky-50 dark:bg-sky-500/10 text-sky-500 rounded-xl border border-sky-100 dark:border-sky-500/20 text-[9px] font-black uppercase tracking-widest hover:bg-sky-100 dark:hover:bg-sky-500/20 transition-all">
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button onClick={() => deleteOffer(offer.id)} className="px-3 py-2.5 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-xl border border-red-100 dark:border-red-500/20 text-[9px] font-black uppercase tracking-widest hover:bg-red-100 dark:hover:bg-red-500/20 transition-all">
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
