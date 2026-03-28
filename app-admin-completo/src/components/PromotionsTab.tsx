import React from 'react';
import { motion } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';
import { supabase } from '../lib/supabase';
import { showConfirm, toastError } from '../lib/useToast';
import FlashOffersSection from './FlashOffersSection';

// Promoções e Banners
export default function PromotionsTab() {
  const {
    promotionsList, promoFilter, setPromoFilter, promoSearch, setPromoSearch, showPromoForm, setShowPromoForm, promoFormType, setPromoFormType, promoForm, setPromoForm, promoSaving, promoSaveStatus, userRole, merchantProfile, fetchPromotions,
    savePromotion, autoSavePromo, fetchMerchants, merchantsList, handleFileUpload
  } = useAdmin();

  const [dateModalOpen, setDateModalOpen] = React.useState(false);
  const [tempDate, setTempDate] = React.useState('');
  const [tempTime, setTempTime] = React.useState('');

  React.useEffect(() => {
    fetchPromotions();
    if (userRole === 'admin') {
      fetchMerchants();
    }
  }, [fetchPromotions, fetchMerchants, userRole]);

  return (
    <div className="space-y-8">

{/* ── Header ── */}
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
    <div>
      <div className="flex items-center gap-3 mb-1">
        <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20">
          <span className="material-symbols-outlined text-primary">percent</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">Gestão de Promoções</h1>
      </div>
      <p className="text-slate-500 dark:text-slate-400 text-sm ml-1">Gerencie banners, cupons de desconto e campanhas ativas da plataforma.</p>
    </div>
    <div className="flex items-center gap-3">
      <button
        onClick={() => { 
          setPromoFormType('banner'); 
          setPromoForm({ 
            title:'', description:'', image_url:'', coupon_code:'', 
            discount_type:'percent', discount_value:10, min_order_value:0, 
            max_usage:100, expires_at:'', is_active:true, is_vip:false,
            merchant_id: userRole === 'merchant' ? merchantProfile?.merchant_id : undefined
          }); 
          setShowPromoForm(true); 
        }}
        className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-all"
      >
        <span className="material-symbols-outlined text-lg">add_photo_alternate</span>
        Novo Banner
      </button>
      <button
        onClick={() => { 
          setPromoFormType('coupon'); 
          setPromoForm({ 
            title:'', description:'', image_url:'', coupon_code:'', 
            discount_type:'percent', discount_value:10, min_order_value:0, 
            max_usage:100, expires_at:'', is_active:true, is_vip:false,
            merchant_id: userRole === 'merchant' ? merchantProfile?.merchant_id : undefined
          }); 
          setShowPromoForm(true); 
        }}
        className="flex items-center gap-2 px-6 py-3 bg-primary text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:brightness-110 transition-all"
      >
        <span className="material-symbols-outlined text-lg">confirmation_number</span>
        Criar Cupom
      </button>
    </div>
  </div>

{/* ── Stats ── */}
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {[
      { label: 'Total de Promoções', val: promotionsList.length, icon: 'campaign', color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
      { label: 'Ativas', val: promotionsList.filter(p => p.is_active).length, icon: 'check_circle', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20' },
      { label: 'Cupons', val: promotionsList.filter(p => p.coupon_code).length, icon: 'confirmation_number', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20' },
      { label: 'Banners', val: promotionsList.filter(p => p.image_url).length, icon: 'view_carousel', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20' },
    ].map((s, i) => (
      <motion.div key={i} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.07 }}
        className={`bg-white dark:bg-slate-900 rounded-[28px] p-6 border ${s.bg} flex items-center gap-4`}>
        <div className={`p-3 rounded-2xl ${s.bg.split(' ').slice(0,2).join(' ')}`}>
          <span className={`material-symbols-outlined ${s.color}`}>{s.icon}</span>
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
          <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
        </div>
      </motion.div>
    ))}
  </div>

{/* ── Filter Bar ── */}
  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl gap-1">
      {([
        { id: 'all', label: 'Todos' },
        { id: 'coupon', label: 'Cupons' },
        { id: 'banner', label: 'Banners' },
        { id: 'active', label: 'Ativos' },
        { id: 'expired', label: 'Expirados' },
      ] as { id: typeof promoFilter; label: string }[]).map(f => (
        <button key={f.id} onClick={() => setPromoFilter(f.id)}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${promoFilter === f.id ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-400'}`}>
          {f.label}
        </button>
      ))}
    </div>
    <div className="relative">
      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
      <input
        type="text" value={promoSearch} onChange={e => setPromoSearch(e.target.value)}
        placeholder="Buscar promoção ou cupom..."
        className="pl-11 pr-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary dark:text-white w-72"
      />
    </div>
  </div>

{/* ── Inline Create Form ── */}
  {showPromoForm && (
    <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }}
      className="bg-white dark:bg-slate-900 border border-primary/30 rounded-[40px] p-8 shadow-xl shadow-primary/5">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20">
            <span className="material-symbols-outlined text-primary">{promoFormType === 'coupon' ? 'confirmation_number' : 'add_photo_alternate'}</span>
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              {promoFormType === 'coupon' ? 'Criar Cupom de Desconto' : 'Criar Banner Promocional'}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Preencha os campos abaixo</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {promoSaveStatus !== 'idle' && (
            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5 ${
              promoSaveStatus === 'saved' ? 'bg-emerald-50 text-emerald-600' :
              promoSaveStatus === 'saving' ? 'bg-amber-50 text-amber-600' :
              'bg-red-50 text-red-600'}`}>
              <span className={`material-symbols-outlined text-xs ${promoSaveStatus === 'saving' ? 'animate-spin' : ''}`}>
                {promoSaveStatus === 'saved' ? 'check_circle' : promoSaveStatus === 'saving' ? 'sync' : 'error'}
              </span>
              {promoSaveStatus === 'saved' ? 'Salvo' : promoSaveStatus === 'saving' ? 'Salvando...' : 'Erro'}
            </span>
          )}
          <button
            onClick={() => setShowPromoForm(false)}
            className="size-9 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-500 flex items-center justify-center transition-all">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título *</label>
          <input type="text" value={promoForm.title}
            onChange={e => autoSavePromo({...promoForm, title: e.target.value})}
            placeholder="Ex: Frete Grátis no Fim de Semana"
            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição</label>
          <input type="text" value={promoForm.description}
            onChange={e => autoSavePromo({...promoForm, description: e.target.value})}
            placeholder="Válido apenas para primeiros pedidos"
            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white" />
        </div>

        {userRole === 'admin' && (
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vincular a Lojista (Opcional)</label>
            <select 
              value={promoForm.merchant_id || ''} 
              onChange={e => autoSavePromo({...promoForm, merchant_id: e.target.value || null})}
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white"
            >
              <option value="">Promoção Global (Plataforma)</option>
              {merchantsList.map(m => (
                <option key={m.id} value={m.id}>{m.store_name}</option>
              ))}
            </select>
          </div>
        )}

        {promoFormType === 'coupon' && (
          <>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Código do Cupom *</label>
              <input type="text" value={promoForm.coupon_code}
                onChange={e => autoSavePromo({...promoForm, coupon_code: e.target.value.toUpperCase()})}
                placeholder="EX: FRETE10"
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 font-black text-sm tracking-widest focus:ring-2 focus:ring-primary dark:text-white font-mono" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Desconto</label>
              <div className="flex gap-2">
                <button onClick={() => setPromoForm({...promoForm, discount_type: 'percent'})}
                  className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${promoForm.discount_type === 'percent' ? 'bg-primary text-slate-900' : 'bg-slate-50 dark:bg-slate-800 text-slate-500'}`}>
                  % Percentual
                </button>
                <button onClick={() => setPromoForm({...promoForm, discount_type: 'fixed'})}
                  className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${promoForm.discount_type === 'fixed' ? 'bg-primary text-slate-900' : 'bg-slate-50 dark:bg-slate-800 text-slate-500'}`}>
                  R$ Fixo
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Valor do Desconto ({promoForm.discount_type === 'percent' ? '%' : 'R$'})
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">
                  {promoForm.discount_type === 'percent' ? '%' : 'R$'}
                </span>
                <input type="number" min="0" max={promoForm.discount_type === 'percent' ? 100 : 999}
                  value={promoForm.discount_value}
                  onChange={e => autoSavePromo({...promoForm, discount_value: parseFloat(e.target.value)||0})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl pl-10 pr-5 py-4 font-black text-xl focus:ring-2 focus:ring-primary dark:text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pedido Mínimo (R$)</label>
              <input type="number" min="0" value={promoForm.min_order_value}
                onChange={e => autoSavePromo({...promoForm, min_order_value: parseFloat(e.target.value)||0})}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Limite de Usos</label>
              <input type="number" min="1" value={promoForm.max_usage}
                onChange={e => autoSavePromo({...promoForm, max_usage: parseInt(e.target.value)||1})}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white" />
            </div>
          </>
        )}

        {promoFormType === 'banner' && (
          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Imagem do Banner *</label>
            <div className="relative aspect-[3/1] rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center group hover:border-primary transition-colors">
              {promoForm.image_url ? (
                <>
                  <img src={promoForm.image_url} alt="Banner Preview" className="w-full h-full object-cover" />
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
                  if (!file) return;
                  const url = await handleFileUpload(file, 'banners');
                  if (url) {
                    autoSavePromo({ ...promoForm, image_url: url });
                  }
                }}
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data e Hora de Expiração</label>
          <button
            type="button"
            onClick={() => {
              if (promoForm.expires_at) {
                const d = new Date(promoForm.expires_at);
                setTempDate(d.toISOString().split('T')[0]);
                setTempTime(d.toTimeString().slice(0, 5));
              } else {
                setTempDate(new Date().toISOString().split('T')[0]);
                setTempTime('23:59');
              }
              setDateModalOpen(true);
            }}
            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white flex items-center justify-between group hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">event</span>
              <span>
                {promoForm.expires_at 
                  ? new Date(promoForm.expires_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
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
                  className="py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black text-xs uppercase tracking-widest rounded-3xl hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (tempDate && tempTime) {
                      const finalDate = new Date(`${tempDate}T${tempTime}:00`);
                      autoSavePromo({ ...promoForm, expires_at: finalDate.toISOString() });
                    }
                    setDateModalOpen(false);
                  }}
                  className="py-4 bg-primary text-slate-900 font-black text-xs uppercase tracking-widest rounded-3xl shadow-lg shadow-primary/20 hover:brightness-105 transition-all"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
          <div className="flex items-center gap-3 h-[58px] bg-slate-50 dark:bg-slate-800 rounded-2xl px-5">
            <button onClick={() => autoSavePromo({...promoForm, is_active: !promoForm.is_active})}
              className={`w-12 h-7 rounded-full relative transition-all ${promoForm.is_active ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}>
              <div className={`absolute top-1 size-5 bg-white rounded-full shadow-md transition-all ${promoForm.is_active ? 'right-1' : 'left-1'}`}></div>
            </button>
            <span className="text-sm font-bold text-slate-900 dark:text-white">{promoForm.is_active ? 'Ativo' : 'Inativo'}</span>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Oferta VIP</label>
          <div className="flex items-center gap-3 h-[58px] bg-slate-50 dark:bg-slate-800 rounded-2xl px-5 border-2 border-transparent hover:border-amber-500/20 transition-all">
            <button onClick={() => autoSavePromo({...promoForm, is_vip: !promoForm.is_vip})}
              className={`w-12 h-7 rounded-full relative transition-all ${promoForm.is_vip ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
              <div className={`absolute top-1 size-5 bg-white rounded-full shadow-md transition-all ${promoForm.is_vip ? 'right-1' : 'left-1'}`}></div>
            </button>
            <div className="flex flex-col">
              <span className="text-sm font-black text-slate-900 dark:text-white leading-none">VIP Exclusive</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Destaque especial</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-8">
        <button onClick={() => setShowPromoForm(false)}
          className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all">
          Cancelar
        </button>
        <button
          onClick={() => savePromotion(promoForm)}
          disabled={promoSaving || !promoForm.title || (promoFormType === 'coupon' && !promoForm.coupon_code) || (promoFormType === 'banner' && !promoForm.image_url)}
          className="px-8 py-3 bg-primary text-slate-900 font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 flex items-center gap-2 hover:brightness-110 transition-all disabled:opacity-50">
          <span className={`material-symbols-outlined text-base ${promoSaving ? 'animate-spin' : ''}`}>{promoSaving ? 'sync' : 'check_circle'}</span>
          {promoSaving ? 'Publicando...' : promoFormType === 'coupon' ? 'Publicar Cupom' : 'Publicar Banner'}
        </button>
      </div>
    </motion.div>
  )}

{/* ── Banners Grid ── */}
  {(promoFilter === 'all' || promoFilter === 'banner' || promoFilter === 'active' || promoFilter === 'expired') && (() => {
    const banners = promotionsList.filter(p => {
      if (!p.image_url) return false;
      if (promoFilter === 'active') return p.is_active;
      if (promoFilter === 'expired') return p.expires_at && new Date(p.expires_at) < new Date();
      if (promoSearch) return p.title?.toLowerCase().includes(promoSearch.toLowerCase());
      return true;
    });
    if (!banners.length) return null;
    return (
      <div className="space-y-5">
        <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-3">
          <span className="material-symbols-outlined text-amber-500">view_carousel</span>
          Banners Promocionais
          <span className="text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{banners.length}</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map((bn ,i) => (
            <motion.div key={bn.id || i} initial={{ opacity:0, scale:0.97 }} animate={{ opacity:1, scale:1 }} transition={{ delay: i*0.05 }}
              className={`bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 overflow-hidden group shadow-sm hover:shadow-lg transition-all ${!bn.is_active ? 'opacity-60' : ''}`}>
              <div className="aspect-video relative overflow-hidden bg-slate-100">
                <img src={bn.image_url} alt={bn.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white ${bn.is_active ? 'bg-emerald-500' : 'bg-slate-500'}`}>
{bn.is_active ? ' • Ativo' : ' • • Inativo'}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-sm font-black text-slate-900 dark:text-white mb-1">{bn.title}</h3>
                {bn.description && <p className="text-[11px] font-bold text-slate-400 mb-3">{bn.description}</p>}
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                  <span className="material-symbols-outlined text-xs">calendar_month</span>
                  Expira: {bn.expires_at ? new Date(bn.expires_at).toLocaleDateString('pt-BR') : 'Sem data'}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex gap-2">
                    <button onClick={async () => { setPromoFormType('banner'); setPromoForm({...bn, expires_at: bn.expires_at?.slice(0,10)||''}); setShowPromoForm(true); }}
                      className="size-8 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary transition-colors flex items-center justify-center">
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button onClick={async () => { if(await showConfirm({ message: 'Excluir banner?' })) { await supabase.from('promotions_delivery').delete().eq('id', bn.id); fetchPromotions(); }}}
                      className="size-8 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center">
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                  <button onClick={async () => { await supabase.from('promotions_delivery').update({ is_active: !bn.is_active }).eq('id', bn.id); fetchPromotions(); }}
                    className={`w-11 h-6 rounded-full relative transition-all ${bn.is_active ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}>
                    <div className={`absolute top-1 size-4 bg-white rounded-full shadow-md transition-all ${bn.is_active ? 'right-1' : 'left-1'}`}></div>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  })()}

{/* ── Coupons Table ── */}
  {(promoFilter === 'all' || promoFilter === 'coupon' || promoFilter === 'active' || promoFilter === 'expired') && (() => {
    const coupons = promotionsList.filter(p => {
      if (!p.coupon_code) return false;
      if (promoFilter === 'active') return p.is_active;
      if (promoFilter === 'expired') return p.expires_at && new Date(p.expires_at) < new Date();
      if (promoSearch) return p.coupon_code?.toLowerCase().includes(promoSearch.toLowerCase()) || p.title?.toLowerCase().includes(promoSearch.toLowerCase());
      return true;
    });
    if (!coupons.length) return null;
    return (
      <div className="space-y-5">
        <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-3">
          <span className="material-symbols-outlined text-blue-500">confirmation_number</span>
          Cupons de Desconto
          <span className="text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{coupons.length}</span>
        </h2>
        <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Código</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Desconto</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pedido Mín.</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Expira</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usos</th>
                  <th className="px-8 py-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {coupons.map((cp, i) => {
                  const usagePct = Math.min(100, Math.round(((cp.usage_count||0) / (cp.max_usage || 100)) * 100));
                  const isExpired = cp.expires_at && new Date(cp.expires_at) < new Date();
                  return (
                    <tr key={cp.id || i} className="hover:bg-primary/[0.02] transition-colors group">
                      <td className="px-8 py-5">
                        <button onClick={() => navigator.clipboard.writeText(cp.coupon_code || '')}
                          className="font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl text-primary font-black text-xs tracking-widest border border-primary/10 shadow-sm hover:bg-primary hover:text-slate-900 transition-all group/code flex items-center gap-1"
                          title="Clique para copiar">
                          {cp.coupon_code}
                          <span className="material-symbols-outlined text-[10px] opacity-0 group-hover/code:opacity-100 transition-opacity">content_copy</span>
                        </button>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-sm font-black text-slate-900 dark:text-white">{cp.title}</p>
                        <p className="text-[10px] font-bold text-primary mt-0.5">
                          {cp.discount_type === 'fixed' ? `R$ ${cp.discount_value?.toFixed(2)} de desconto` : `${cp.discount_value}% OFF`}
                        </p>
                      </td>
                      <td className="px-8 py-5 text-xs font-bold text-slate-500">
                        {cp.min_order_value > 0 ? `R$ ${cp.min_order_value?.toFixed(2)}` : <span className="text-slate-300">Sem mínimo</span>}
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          isExpired ? 'bg-red-50 text-red-500 border border-red-100' :
                          cp.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20' :
                          'bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
                          <span className="size-1.5 rounded-full bg-current"></span>
                          {isExpired ? 'Expirado' : cp.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-xs font-bold text-slate-500">
                        {cp.expires_at ? new Date(cp.expires_at).toLocaleDateString('pt-BR') : <span className="text-slate-300">Sem data</span>}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3 min-w-[100px]">
                          <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${usagePct >= 90 ? 'bg-red-400' : usagePct >= 70 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${usagePct}%` }}></div>
                          </div>
                          <span className="text-[10px] font-black text-slate-500 whitespace-nowrap">{cp.usage_count||0}/{cp.max_usage||100}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={async () => { setPromoFormType('coupon'); setPromoForm({...cp, expires_at: cp.expires_at?.slice(0,10)||''}); setShowPromoForm(true); }}
                            className="size-8 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary transition-colors flex items-center justify-center">
                            <span className="material-symbols-outlined text-base">edit</span>
                          </button>
                          <button onClick={async () => { await supabase.from('promotions_delivery').update({ is_active: !cp.is_active }).eq('id', cp.id); fetchPromotions(); }}
                            className={`w-11 h-6 rounded-full relative transition-all ${cp.is_active ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}>
                            <div className={`absolute top-1 size-4 bg-white rounded-full shadow-md transition-all ${cp.is_active ? 'right-1' : 'left-1'}`}></div>
                          </button>
                          <button onClick={async () => { if(await showConfirm({ message: 'Excluir cupom?' })) { await supabase.from('promotions_delivery').delete().eq('id', cp.id); fetchPromotions(); }}}
                            className="size-8 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center">
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  })()}

  {/* Empty state */}
  {promotionsList.length === 0 && !showPromoForm && (
    <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[40px] border border-dashed border-slate-200 dark:border-slate-700">
      <span className="material-symbols-outlined text-6xl text-slate-200 dark:text-slate-700 mb-4 block">campaign</span>
      <p className="text-lg font-black text-slate-400">Nenhuma promoção criada ainda</p>
      <p className="text-sm font-bold text-slate-300 mt-1">Crie seu primeiro cupom ou banner acima</p>
    </div>
  )}

  {/* IZI FLASH MANAGEMENT */}
  {(userRole === 'admin' || userRole === 'merchant') && (
    <FlashOffersSection 
      userRole={userRole} 
      merchantId={userRole === 'merchant' ? merchantProfile?.merchant_id : undefined} 
    />
  )}
    </div>
  );
}
