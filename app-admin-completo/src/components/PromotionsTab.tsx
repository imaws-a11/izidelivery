import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';
import { supabase } from '../lib/supabase';
import { toastSuccess, toastError, showConfirm } from '../lib/useToast';
import { uploadToCloudinary } from '../lib/cloudinary';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import FlashOffersSection from './FlashOffersSection';

export default function PromotionsTab() {
  const {
    promotionsList, fetchPromotions, stats
  } = useAdmin();

  const [activeView, setActiveView] = useState<'all' | 'banners' | 'coupons' | 'flash'>('all');
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<'banner' | 'coupon'>('banner');
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState<any>({
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
    merchant_id: null // Explicitly null for Global
  });

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const globalPromotions = promotionsList.filter(p => p.merchant_id === null);
  const banners = globalPromotions.filter(p => p.image_url && !p.coupon_code);
  const coupons = globalPromotions.filter(p => p.coupon_code);

  const filteredPromos = activeView === 'all' ? globalPromotions : activeView === 'banners' ? banners : coupons;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      toastSuccess('Processando imagem...');
      const url = await uploadToCloudinary(file);
      if (url) {
        setFormData({ ...formData, image_url: url });
        toastSuccess('Banner carregado!');
      }
    } catch (err) {
      toastError('Erro no upload');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Basic validation
      if (formType === 'coupon' && !formData.coupon_code) throw new Error('Código do cupom é obrigatório');
      if (formType === 'banner' && !formData.image_url) throw new Error('Imagem do banner é obrigatória');

      const dataToSave = {
        ...formData,
        type: formType,
        coupon_code: formType === 'coupon' ? formData.coupon_code.toUpperCase().trim() : null,
        image_url: formType === 'banner' ? formData.image_url : null,
        expires_at: formData.expires_at || null
      };

      const { error } = await supabase.from('promotions_delivery').upsert(dataToSave);
      if (error) throw error;

      toastSuccess(`Promoção ${formData.id ? 'atualizada' : 'criada'} com sucesso!`);
      setShowForm(false);
      resetForm();
      fetchPromotions();
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
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
      merchant_id: null
    });
  };

  const handleDelete = async (id: string) => {
    if (!await showConfirm({ message: 'Tem certeza que deseja excluir esta promoção global?' })) return;
    try {
      const { error } = await supabase.from('promotions_delivery').delete().eq('id', id);
      if (error) throw error;
      toastSuccess('Promoção removida');
      fetchPromotions();
    } catch (err) {
      toastError('Erro ao excluir');
    }
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">
             Central de <span className="text-primary">Promoções</span> 
          </h1>
          <p className="text-slate-500 font-bold text-sm mt-1 uppercase tracking-widest">
            Gestão Independente de Cupons e Banners Globais
          </p>
        </div>

        <div className="flex items-center gap-4">
             <button 
                onClick={() => { setFormType('banner'); setShowForm(true); }}
                className="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-2 hover:border-primary transition-all group"
             >
                <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">add_photo_alternate</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Novo Banner</span>
             </button>
             <button 
                onClick={() => { setFormType('coupon'); setShowForm(true); }}
                className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-primary/20"
             >
                <span className="material-symbols-outlined">confirmation_number</span>
                <span className="text-[10px] font-black uppercase tracking-widest">Novo Cupom</span>
             </button>
        </div>
      </div>

      {/* Global Marketing Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
                { label: 'Investimento Global', value: `R$ ${stats.couponInvestment.toLocaleString('pt-BR')}`, icon: 'payments', color: 'text-primary' },
                { label: 'Cupons Ativos', value: coupons.filter(c => c.is_active).length, icon: 'qr_code_2', color: 'text-emerald-500' },
                { label: 'Banners na Home', value: banners.length, icon: 'branding_watermark', color: 'text-sky-500' },
                { label: 'Cupons VIP', value: coupons.filter(c => c.is_vip).length, icon: 'workspace_premium', color: 'text-amber-500' },
            ].map((s, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <span className={`material-symbols-outlined p-2 rounded-xl bg-slate-100 dark:bg-slate-800/50 ${s.color}`}>{s.icon}</span>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                    </div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter uppercase">{s.value}</p>
                </div>
            ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-4 border-b border-slate-100 dark:border-slate-800 pb-0">
          {[
              { id: 'all', label: 'Tudo', icon: 'apps' },
              { id: 'banners', label: 'Banners Home', icon: 'image' },
              { id: 'coupons', label: 'Cupons Globais', icon: 'local_offer' },
              { id: 'flash', label: 'Izi Flash', icon: 'flash_on' }
          ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveView(t.id as any)}
                className={`flex items-center gap-3 px-6 py-4 border-b-2 transition-all group ${activeView === t.id ? 'border-primary text-slate-900 dark:text-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                  <span className="material-symbols-outlined text-lg">{t.icon}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
              </button>
          ))}
      </div>

      {/* Promotions Rendering */}
      {activeView === 'flash' ? (
          <FlashOffersSection userRole="admin" />
      ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
              {filteredPromos.map((promo) => (
              <motion.div
                key={promo.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-2xl hover:border-primary transition-all group relative"
              >
                  {promo.image_url ? (
                      <div className="h-48 relative overflow-hidden">
                           <img src={promo.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={promo.title} />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-6 flex flex-col justify-end">
                                <h3 className="text-xl font-black text-white italic uppercase">{promo.title}</h3>
                                {promo.is_vip && <span className="bg-primary text-slate-900 self-start px-3 py-1 rounded-full text-[9px] font-black uppercase italic mt-2">Exclusivo VIP</span>}
                           </div>
                      </div>
                  ) : (
                      <div className="p-8 pb-4">
                           <div className="flex items-center justify-between mb-4">
                               <div className="flex flex-col">
                                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Código do Cupom</p>
                                   <p className="text-2xl font-black text-primary italic tracking-widest uppercase">{promo.coupon_code}</p>
                               </div>
                               <span className="material-symbols-outlined text-4xl text-slate-100 dark:text-slate-800 font-black">confirmation_number</span>
                           </div>
                           <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase italic">{promo.title}</h3>
                      </div>
                  )}

                  <div className="p-8 pt-4 space-y-6">
                       <p className="text-xs font-bold text-slate-500 line-clamp-2">{promo.description}</p>
                       
                       <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                 <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Desconto</p>
                                 <p className="text-sm font-black text-slate-900 dark:text-white italic">
                                     {promo.discount_type === 'percent' ? `${promo.discount_value}%` : `R$ ${promo.discount_value}`}
                                 </p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                 <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Pedidos Mín.</p>
                                 <p className="text-sm font-black text-slate-900 dark:text-white italic">R$ {promo.min_order_value}</p>
                            </div>
                       </div>

                       <div className="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-slate-800">
                            <div className="flex flex-col">
                                 <p className="text-[9px] font-black text-slate-400 uppercase">Validade</p>
                                 <p className="text-[10px] font-bold text-slate-500">{promo.expires_at ? format(new Date(promo.expires_at), 'dd MMM yyyy', { locale: ptBR }) : 'Permanente'}</p>
                            </div>
                            <div className="flex gap-2">
                                 <button 
                                    onClick={() => { setFormData(promo); setFormType(promo.coupon_code ? 'coupon' : 'banner'); setShowForm(true); }}
                                    className="size-10 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-slate-900 transition-all"
                                 >
                                    <span className="material-symbols-outlined text-lg">edit</span>
                                 </button>
                                 <button 
                                    onClick={() => handleDelete(promo.id!)}
                                    className="size-10 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all underline decoration-rose-500/0 hover:decoration-rose-500/100"
                                 >
                                    <span className="material-symbols-outlined text-lg">delete</span>
                                 </button>
                            </div>
                       </div>
                  </div>
              </motion.div>
          ))}
          </AnimatePresence>
          </div>
      )}

      {/* Promotion Form Modal */}
      <AnimatePresence>
          {showForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowForm(false)} />
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[48px] shadow-2xl overflow-hidden relative z-10 p-10 border border-white/10"
                  >
                      <div className="flex items-center justify-between mb-10">
                           <div className="flex items-center gap-4">
                                <span className="material-symbols-outlined text-4xl text-primary font-black">{formType === 'banner' ? 'branding_watermark' : 'confirmation_number'}</span>
                                <div>
                                     <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">{formData.id ? 'Editar' : 'Criar Nova'} Promoção Global</h2>
                                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{formType === 'banner' ? 'Destaque visual na home do app' : 'Cupom de desconto para todos os pedidos'}</p>
                                </div>
                           </div>
                           <button onClick={() => setShowForm(false)} className="size-12 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">
                                <span className="material-symbols-outlined">close</span>
                           </button>
                      </div>

                      <form onSubmit={handleSave} className="space-y-8">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 md:col-span-2">
                                     <label className="text-[10px] font-black text-slate-400 uppercase ml-2 italic">Título Interno / Chamada Curta</label>
                                     <input 
                                        type="text" 
                                        required
                                        value={formData.title} 
                                        onChange={e => setFormData({...formData, title: e.target.value})}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 ring-primary/50"
                                        placeholder="Ex: Oferta de Lançamento"
                                     />
                                </div>

                                {formType === 'banner' ? (
                                     <div className="space-y-2 md:col-span-2">
                                          <label className="text-[10px] font-black text-slate-400 uppercase ml-2 italic">Imagem do Banner (1200x400 ideal)</label>
                                          <div className="relative group">
                                               {formData.image_url ? (
                                                    <div className="h-40 relative rounded-3xl overflow-hidden mb-4">
                                                         <img src={formData.image_url} className="w-full h-full object-cover" />
                                                         <button 
                                                            type="button"
                                                            onClick={() => setFormData({...formData, image_url: ''})}
                                                            className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-white font-black uppercase text-xs tracking-widest"
                                                         >
                                                            Trocar Imagem
                                                         </button>
                                                    </div>
                                               ) : (
                                                    <label className="h-40 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-all">
                                                         <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">add_photo_alternate</span>
                                                         <span className="text-[10px] font-black text-slate-400 uppercase">Clique para fazer upload</span>
                                                         <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                                    </label>
                                               )}
                                          </div>
                                     </div>
                                ) : (
                                     <div className="space-y-2 md:col-span-2">
                                          <label className="text-[10px] font-black text-slate-400 uppercase ml-2 italic">Código Único do Cupom</label>
                                          <input 
                                             type="text" 
                                             value={formData.coupon_code} 
                                             onChange={e => setFormData({...formData, coupon_code: e.target.value.toUpperCase()})}
                                             className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-6 text-xl font-black text-primary tracking-[0.2em] focus:ring-2 ring-primary/50 text-center"
                                             placeholder="EX: IZI10OFF"
                                          />
                                     </div>
                                )}

                                <div className="space-y-2">
                                     <label className="text-[10px] font-black text-slate-400 uppercase ml-2 italic">Tipo de Desconto</label>
                                     <select 
                                        value={formData.discount_type}
                                        onChange={e => setFormData({...formData, discount_type: e.target.value})}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 ring-primary/50"
                                     >
                                         <option value="percent">Porcentagem (%)</option>
                                         <option value="fixed">Valor Fixo (R$)</option>
                                     </select>
                                </div>

                                <div className="space-y-2">
                                     <label className="text-[10px] font-black text-slate-400 uppercase ml-2 italic">Valor do Desconto</label>
                                     <input 
                                        type="number" 
                                        step="0.01"
                                        value={formData.discount_value}
                                        onChange={e => setFormData({...formData, discount_value: parseFloat(e.target.value)})}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-6 text-sm font-black italic text-slate-900 dark:text-white focus:ring-2 ring-primary/50"
                                     />
                                </div>

                                <div className="space-y-2">
                                     <label className="text-[10px] font-black text-slate-400 uppercase ml-2 italic">Pedido Mínimo (R$)</label>
                                     <input 
                                        type="number" 
                                        value={formData.min_order_value}
                                        onChange={e => setFormData({...formData, min_order_value: parseFloat(e.target.value)})}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-6 text-sm font-black italic text-slate-900 dark:text-white focus:ring-2 ring-primary/50"
                                     />
                                </div>

                                <div className="space-y-2">
                                     <label className="text-[10px] font-black text-slate-400 uppercase ml-2 italic">Validar até (Opcional)</label>
                                     <input 
                                        type="date" 
                                        value={formData.expires_at}
                                        onChange={e => setFormData({...formData, expires_at: e.target.value})}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-6 text-sm font-black text-slate-900 dark:text-white focus:ring-2 ring-primary/50"
                                     />
                                </div>

                                <div className="md:col-span-2 pt-4 flex gap-6">
                                     <label className="flex-1 flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-3xl cursor-pointer group hover:bg-slate-100 transition-all">
                                          <div className="flex items-center gap-3">
                                               <span className="material-symbols-outlined text-primary">workspace_premium</span>
                                               <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Exclusivo VIP Black</span>
                                          </div>
                                          <input 
                                            type="checkbox" 
                                            checked={formData.is_vip}
                                            onChange={e => setFormData({...formData, is_vip: e.target.checked})}
                                            className="size-6 rounded-lg text-primary focus:ring-primary border-slate-300" 
                                          />
                                     </label>

                                     <label className="flex-1 flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-3xl cursor-pointer group hover:bg-slate-100 transition-all">
                                          <div className="flex items-center gap-3">
                                               <span className="material-symbols-outlined text-emerald-500">toggle_on</span>
                                               <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Ativado</span>
                                          </div>
                                          <input 
                                            type="checkbox" 
                                            checked={formData.is_active}
                                            onChange={e => setFormData({...formData, is_active: e.target.checked})}
                                            className="size-6 rounded-lg text-emerald-500 focus:ring-emerald-500 border-slate-300" 
                                          />
                                     </label>
                                </div>
                           </div>

                           <button 
                             disabled={isSaving}
                             className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[28px] text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl hover:translate-y-[-4px] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                           >
                                {isSaving ? (
                                     <>
                                         <div className="size-4 border-2 border-slate-400 border-t-white dark:border-t-slate-900 rounded-full animate-spin" />
                                         Salvando...
                                     </>
                                ) : (
                                     <>
                                         <span className="material-symbols-outlined">rocket_launch</span>
                                         Publicar Promoção Global
                                     </>
                                )}
                           </button>
                      </form>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>
    </div>
  );
}
