import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toastSuccess, toastError, toast } from '../lib/useToast';
import { supabase } from '../lib/supabase';

interface DedicatedSlotStudioProps {
  slot: any;
  onClose: () => void;
  onSave: (slotData: any) => Promise<void>;
  merchantId: string;
}

export const DedicatedSlotStudio: React.FC<DedicatedSlotStudioProps> = ({ 
  slot, 
  onClose, 
  onSave, 
  merchantId 
}) => {
  const [editingItem, setEditingItem] = useState<any>({
    title: '',
    description: '',
    fee_per_day: 0,
    working_hours: '',
    is_active: true,
    metadata: {
      base_deliveries: 10,
      fee_per_extra_delivery: 5,
      benefits: [],
      custom_benefits: []
    },
    ...slot,
    merchant_id: merchantId
  });

  const [editingSpecialtyIdx, setEditingSpecialtyIdx] = useState<number | null>(null);
  const [editingDefaultSpecialtyId, setEditingDefaultSpecialtyId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showCockpit, setShowCockpit] = useState(false);
  const [showBairrosCockpit, setShowBairrosCockpit] = useState(false);
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('23:00');
  const [newCustomBenefit, setNewCustomBenefit] = useState('');
  const [newCustomBenefitValue, setNewCustomBenefitValue] = useState('');
  const [newBairro, setNewBairro] = useState('');
  const [newBairroFee, setNewBairroFee] = useState('');
  const [newCustomSpecialty, setNewCustomSpecialty] = useState('');
  
  const [activeTab, setActiveTab] = useState<'config' | 'candidates'>('config');
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(false);
  const [availableSpecialties, setAvailableSpecialties] = useState([
    { id: 'termica', label: 'Bag Térmica', icon: 'ac_unit' },
    { id: 'maquininha', label: 'Maquininha Própria', icon: 'credit_card' },
    { id: 'epi', label: 'EPI Completo', icon: 'engineering' },
    { id: 'refrigerado', label: 'Baú Refrigerado', icon: 'kitchen' },
    { id: 'documentos', label: 'Entrega de Documentos', icon: 'description' }
  ]);

  const toNumber = (val: string) => {
    const n = parseFloat(val);
    return isNaN(n) ? 0 : n;
  };

  useEffect(() => {
    if (slot?.id !== undefined) {
      if (slot?.working_hours && slot.working_hours.includes('às')) {
        const parts = slot.working_hours.split(' às ');
        if (parts.length === 2) {
          setStartTime(parts[0].trim());
          setEndTime(parts[1].trim());
        }
      }
      
      setEditingItem({
        title: '',
        description: '',
        fee_per_day: 0,
        working_hours: '',
        is_active: true,
        metadata: {
          base_deliveries: 10,
          fee_per_extra_delivery: 5,
          benefits: [],
          custom_benefits: []
        },
        ...slot,
        merchant_id: merchantId
      });

      if (slot.id !== 'new') {
        fetchApplications();
      }
    }
  }, [slot?.id, merchantId]);

  const fetchApplications = async () => {
    if (!slot.id || slot.id === 'new') return;
    setIsLoadingApps(true);
    try {
      const { data, error } = await supabase
        .from('slot_applications')
        .select(`
          *,
          driver:drivers_delivery(*)
        `)
        .eq('slot_id', slot.id);
      
      if (error) {
        // Fallback robusto
        const { data: simpleData } = await supabase.from('slot_applications').select('*').eq('slot_id', slot.id);
        if (simpleData && simpleData.length > 0) {
          const driverIds = simpleData.map(d => d.driver_id);
          const { data: drivers } = await supabase.from('drivers_delivery').select('*').in('id', driverIds);
          const enriched = simpleData.map(app => ({
            ...app,
            driver: drivers?.find(d => d.id === app.driver_id)
          }));
          setApplications(enriched);
        } else {
          setApplications([]);
        }
      } else {
        setApplications(data || []);
      }
    } catch (err) {
      console.error('Erro apps:', err);
    } finally {
      setIsLoadingApps(false);
    }
  };

  const handleApplicationAction = async (appId: string, status: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('slot_applications')
        .update({ status })
        .eq('id', appId);
      
      if (error) throw error;
      
      toastSuccess(status === 'accepted' ? 'Candidato aprovado!' : 'Candidatura recusada.');
      fetchApplications();
    } catch (err: any) {
      toastError('Erro ao atualizar: ' + err.message);
    }
  };

  const handleLocalSave = async () => {
    if (!editingItem.title?.trim()) {
      toastError('O título da vaga é obrigatório.');
      return;
    }

    setIsSaving(true);
    try {
      const finalItem = {
        ...editingItem,
        working_hours: `${startTime} às ${endTime}`
      };
      await onSave(finalItem);
      onClose();
    } catch (err: any) {
      toastError('Erro ao salvar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleBenefit = (benefit: string) => {
    const currentBenefits = editingItem.metadata?.benefits || [];
    const newBenefits = currentBenefits.includes(benefit)
      ? currentBenefits.filter((b: string) => b !== benefit)
      : [...currentBenefits, benefit];
    
    setEditingItem({
      ...editingItem,
      metadata: { ...editingItem.metadata, benefits: newBenefits }
    });
  };

  const toggleSpecialty = (specId: string) => {
    const currentSpecs = editingItem.metadata?.required_specialties || [];
    const newSpecs = currentSpecs.includes(specId)
      ? currentSpecs.filter((s: string) => s !== specId)
      : [...currentSpecs, specId];
    
    setEditingItem({
      ...editingItem,
      metadata: { ...editingItem.metadata, required_specialties: newSpecs }
    });
  };

  const addCustomBenefit = () => {
    if (!newCustomBenefit.trim()) return;
    const current = editingItem.metadata?.custom_benefits || [];
    setEditingItem({
      ...editingItem,
      metadata: {
        ...editingItem.metadata,
        custom_benefits: [...current, { 
          label: newCustomBenefit.trim(), 
          value: toNumber(newCustomBenefitValue) 
        }]
      }
    });
    setNewCustomBenefit('');
    setNewCustomBenefitValue('');
  };

  const removeCustomBenefit = (index: number) => {
    const current = editingItem.metadata?.custom_benefits || [];
    const updated = current.filter((_: any, i: number) => i !== index);
    setEditingItem({
      ...editingItem,
      metadata: { ...editingItem.metadata, custom_benefits: updated }
    });
  };

  const addCustomSpecialty = () => {
    if (!newCustomSpecialty.trim()) return;
    const current = editingItem.metadata?.custom_specialties || [];
    setEditingItem({
      ...editingItem,
      metadata: {
        ...editingItem.metadata,
        custom_specialties: [...current, newCustomSpecialty.trim()]
      }
    });
    setNewCustomSpecialty('');
  };

  const removeCustomSpecialty = (index: number) => {
    const current = editingItem.metadata?.custom_specialties || [];
    const updated = current.filter((_: any, i: number) => i !== index);
    setEditingItem({
      ...editingItem,
      metadata: { ...editingItem.metadata, custom_specialties: updated }
    });
  };

  const updateCustomSpecialty = (idx: number, newVal: string) => {
    const current = [...(editingItem.metadata?.custom_specialties || [])];
    current[idx] = newVal;
    setEditingItem({
      ...editingItem,
      metadata: { ...editingItem.metadata, custom_specialties: current }
    });
  };
  const removeAvailableSpecialty = (id: string) => {
    setAvailableSpecialties(prev => prev.filter(s => s.id !== id));
  };

  const updateDefaultSpecialty = (id: string, newLabel: string) => {
    setAvailableSpecialties(prev => prev.map(s => s.id === id ? { ...s, label: newLabel } : s));
  };

  const addBairroExtra = () => {
    if (!newBairro.trim()) return;
    const current = editingItem.metadata?.bairros_extras || [];
    setEditingItem({
      ...editingItem,
      metadata: {
        ...editingItem.metadata,
        bairros_extras: [...current, { 
          label: newBairro.trim(), 
          fee: toNumber(newBairroFee) 
        }]
      }
    });
    setNewBairro('');
    setNewBairroFee('');
  };

  const removeBairroExtra = (index: number) => {
    const current = editingItem.metadata?.bairros_extras || [];
    const updated = current.filter((_: any, i: number) => i !== index);
    setEditingItem({
      ...editingItem,
      metadata: { ...editingItem.metadata, bairros_extras: updated }
    });
  };

  const benefitsList = [
    { id: 'bag', label: 'Levar Bag Própria', icon: 'shopping_bag' },
    { id: 'meal', label: 'Lanche Incluso', icon: 'restaurant' },
    { id: 'bonus', label: 'Bônus Performance', icon: 'workspace_premium' },
  ];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-10 text-white overflow-hidden">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose}></div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-5xl bg-slate-950 rounded-[48px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)] relative z-10 flex flex-col border border-white/5 max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-8 md:px-10 py-6 border-b border-white/5 flex flex-col gap-6 bg-black/40">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="size-14 rounded-2xl bg-primary flex items-center justify-center text-slate-950 shadow-[0_0_30px_rgba(255,217,0,0.3)]">
                <span className="material-symbols-outlined text-3xl font-black">stars</span>
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight leading-none mb-1">Studio de Vagas</h2>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-primary"></span>
                  {editingItem.id === 'new' ? 'Nova Oportunidade' : `Vaga: ${editingItem.title || 'Carregando...'}`}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-primary transition-all border border-white/5">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab('config')} 
              className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'config' ? 'bg-primary text-slate-950 shadow-lg shadow-primary/20' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}
              title="Configurações e Detalhes da Vaga"
            >
              <span className="material-symbols-outlined text-sm">settings</span> Painel de Vaga
            </button>
            {slot.id && slot.id !== 'new' && (
              <button 
                onClick={() => setActiveTab('candidates')} 
                className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 relative ${activeTab === 'candidates' ? 'bg-primary text-slate-950 shadow-lg shadow-primary/20' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}
              >
                <span className="material-symbols-outlined text-sm">group</span> Candidatos 
                {applications.filter(a => a.status === 'pending').length > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white absolute -top-1 -right-1 shadow-lg border-2 border-slate-950">
                    {applications.filter(a => a.status === 'pending').length}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {activeTab === 'config' ? (
            <div className="p-10 space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Nome da Vaga</label>
                    <input 
                      type="text" 
                      value={editingItem.title}
                      onChange={e => setEditingItem({...editingItem, title: e.target.value})}
                      className="w-full bg-white/5 border border-white/5 rounded-3xl px-8 py-5 font-bold text-lg focus:ring-2 focus:ring-primary outline-none"
                      placeholder="Ex: Entregador Noturno"
                    />
                  </div>

                  <div className="bg-white/5 rounded-[40px] p-8 border border-white/5 space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Diária Fixa (R$)</label>
                        <input 
                          type="text" 
                          inputMode="decimal"
                          value={editingItem.fee_per_day} 
                          onChange={e => setEditingItem({...editingItem, fee_per_day: e.target.value.replace(/[^0-9.]/g, '')})} 
                          className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 font-black text-xl text-primary outline-none" 
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Meta Saídas</label>
                        <input 
                          type="text" 
                          inputMode="numeric"
                          value={editingItem.metadata?.base_deliveries || 0} 
                          onChange={e => setEditingItem({...editingItem, metadata: {...editingItem.metadata, base_deliveries: toNumber(e.target.value)}})} 
                          className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 font-black text-xl text-center outline-none" 
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Extra por Saída (R$)</label>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        value={editingItem.metadata?.fee_per_extra_delivery || 0} 
                        onChange={e => setEditingItem({...editingItem, metadata: {...editingItem.metadata, fee_per_extra_delivery: e.target.value.replace(/[^0-9.]/g, '')}})} 
                        className="w-full bg-emerald-500/5 border border-emerald-500/10 rounded-2xl px-6 py-4 font-black text-xl text-emerald-500 outline-none" 
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Horário</label>
                    <button onClick={() => setShowTimePicker(true)} className="w-full bg-white/5 border border-white/5 rounded-3xl px-8 py-5 flex items-center justify-between hover:bg-white/10 transition-all">
                      <p className="text-sm font-black text-white">{startTime} às {endTime}</p>
                      <span className="material-symbols-outlined text-slate-600">schedule</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-10">
                  <div className="grid grid-cols-2 gap-4">
                    {benefitsList.map((b) => (
                      <button key={b.id} onClick={() => toggleBenefit(b.id)} className={`p-5 rounded-3xl border transition-all text-left ${(editingItem.metadata?.benefits || []).includes(b.id) ? 'bg-primary/20 border-primary' : 'bg-white/5 border-white/5 text-slate-500'}`}>
                        <span className="text-[10px] font-black uppercase tracking-widest">{b.label}</span>
                      </button>
                    ))}
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Especialidades Desejadas</label>
                      <div className="flex flex-wrap gap-2">
                        {availableSpecialties.map(spec => (
                          <div key={spec.id} className="relative group/spec">
                            <div
                              className={`px-4 py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                                (editingItem.metadata?.required_specialties || []).includes(spec.id)
                                  ? 'bg-primary/20 border-primary text-primary'
                                  : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'
                              }`}
                            >
                              <span 
                                className="material-symbols-outlined text-sm cursor-pointer"
                                onClick={() => toggleSpecialty(spec.id)}
                              >
                                {spec.icon}
                              </span>
                              
                              {editingDefaultSpecialtyId === spec.id ? (
                                <input 
                                  autoFocus
                                  className="bg-transparent border-none text-[9px] font-black uppercase tracking-widest text-primary outline-none w-20"
                                  value={spec.label}
                                  onChange={(e) => updateDefaultSpecialty(spec.id, e.target.value)}
                                  onBlur={() => setEditingDefaultSpecialtyId(null)}
                                  onKeyDown={(e) => e.key === 'Enter' && setEditingDefaultSpecialtyId(null)}
                                />
                              ) : (
                                <span 
                                  onClick={() => setEditingDefaultSpecialtyId(spec.id)}
                                  className="cursor-text"
                                >
                                  {spec.label}
                                </span>
                              )}
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                removeAvailableSpecialty(spec.id);
                              }}
                              className="absolute -top-2 -right-2 size-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/spec:opacity-100 transition-opacity hover:bg-red-600 z-10"
                            >
                              <span className="material-symbols-outlined text-[10px]">close</span>
                            </button>
                          </div>
                        ))}

                        {(editingItem.metadata?.custom_specialties || []).map((spec: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary/50 bg-primary/10 text-primary">
                            {editingSpecialtyIdx === idx ? (
                              <input 
                                autoFocus
                                className="bg-transparent border-none text-[9px] font-black uppercase tracking-widest text-primary outline-none w-20"
                                value={spec}
                                onChange={(e) => updateCustomSpecialty(idx, e.target.value)}
                                onBlur={() => setEditingSpecialtyIdx(null)}
                                onKeyDown={(e) => e.key === 'Enter' && setEditingSpecialtyIdx(null)}
                              />
                            ) : (
                              <span 
                                onClick={() => setEditingSpecialtyIdx(idx)}
                                className="text-[9px] font-black uppercase tracking-widest cursor-text"
                              >
                                {spec}
                              </span>
                            )}
                            <button onClick={() => removeCustomSpecialty(idx)} className="hover:scale-125 transition-transform">
                              <span className="material-symbols-outlined text-xs">close</span>
                            </button>
                          </div>
                        ))}

                        <div className="flex items-center gap-2 ml-2">
                          <input 
                            type="text"
                            value={newCustomSpecialty}
                            onChange={e => setNewCustomSpecialty(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addCustomSpecialty()}
                            placeholder="+ Custom"
                            className="bg-transparent border-b border-white/10 text-[9px] font-black uppercase tracking-widest text-white outline-none w-16 px-1 focus:border-primary transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <button onClick={() => setShowCockpit(true)} className="w-full p-5 rounded-3xl border border-dashed border-primary/40 bg-primary/5 text-primary flex items-center justify-center gap-3 hover:bg-primary/10 transition-all">
                      <span className="material-symbols-outlined">add_circle</span>
                      <span className="text-[10px] font-black uppercase tracking-widest">Outros Adicionais & Custos</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Bairros Extras</label>
                    <button onClick={() => setShowBairrosCockpit(true)} className="w-full bg-white/5 border border-dashed border-primary/20 rounded-3xl p-5 flex items-center justify-between hover:bg-white/10 transition-all text-primary">
                      <div className="flex items-center gap-4">
                        <span className="material-symbols-outlined text-xl">near_me</span>
                        <div className="text-left">
                          <p className="text-sm font-black italic">Gerenciar Regiões de Atuação</p>
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{editingItem.metadata?.bairros_extras?.length || 0} bairros selecionados</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-slate-600">settings_applications</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Informações Extras</label>
                    <textarea value={editingItem.description} onChange={e => setEditingItem({...editingItem, description: e.target.value})} className="w-full bg-white/5 border border-white/5 rounded-[32px] px-8 py-8 font-bold text-sm h-[180px] resize-none outline-none" />
                  </div>

                  <div className="flex items-center gap-6 p-8 bg-black/40 rounded-[32px] border border-white/5">
                    <div className="flex-1">
                      <p className="text-sm font-black">Vaga Ativa</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Aparece para todos entregadores</p>
                    </div>
                    <button onClick={() => setEditingItem({...editingItem, is_active: !editingItem.is_active})} className={`w-16 h-10 rounded-full relative transition-all ${editingItem.is_active ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                      <div className={`absolute top-1 w-8 h-8 bg-white rounded-full transition-all ${editingItem.is_active ? 'left-7' : 'left-1'}`}></div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-8">
                <button onClick={handleLocalSave} disabled={isSaving} className="bg-primary text-slate-950 px-16 py-6 rounded-[32px] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:scale-105 active:scale-95 transition-all outline-none">
                  {isSaving ? 'Salvando...' : 'Publicar Alterações'}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-10 space-y-8">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-2xl font-black italic tracking-tight">Candidatos Interessados</h3>
                <button onClick={fetchApplications} className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all">
                  <span className="material-symbols-outlined text-sm">refresh</span>
                </button>
              </div>

              {isLoadingApps ? (
                <div className="py-24 flex flex-col items-center gap-6">
                  <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Conectando ao banco...</p>
                </div>
              ) : applications.length === 0 ? (
                <div className="py-32 border border-dashed border-white/10 rounded-[48px] flex flex-col items-center gap-6 opacity-40">
                  <span className="material-symbols-outlined text-6xl">person_search</span>
                  <p className="text-[10px] font-black uppercase tracking-widest">Ninguém se candidatou ainda</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {applications.map((app) => (
                    <div key={app.id} className={`p-8 rounded-[40px] border transition-all relative overflow-hidden group ${app.status === 'accepted' ? 'bg-emerald-500/10 border-emerald-500/20 shadow-lg shadow-emerald-500/5' : 'bg-white/5 border-white/5 hover:bg-white/[0.07]'}`}>
                      <div className="flex items-center gap-6 mb-8">
                        <div className="relative">
                          <div className="size-20 rounded-3xl bg-slate-900 border border-white/10 overflow-hidden shadow-2xl">
                            {app.driver?.photo_url ? (
                              <img src={app.driver.photo_url} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-primary bg-primary/5">
                                <span className="material-symbols-outlined text-4xl">person</span>
                              </div>
                            )}
                          </div>
                          {app.status === 'accepted' && (
                            <div className="absolute -top-2 -right-2 size-8 bg-emerald-500 text-slate-950 rounded-full flex items-center justify-center border-4 border-slate-950 shadow-lg">
                              <span className="material-symbols-outlined text-sm font-black">check</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xl font-black text-white italic tracking-tight">{app.driver?.full_name || 'Entregador'}</h4>
                          <div className="flex flex-wrap gap-3 mt-2">
                             <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-lg border border-white/5">
                                <span className="material-symbols-outlined text-[12px] text-amber-400 fill-1">star</span>
                                <span className="text-[10px] font-black text-slate-400">{app.driver?.rating || 'Novo'}</span>
                             </div>
                             <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-lg border border-white/5">
                                <span className="material-symbols-outlined text-[12px] text-blue-400">directions_bike</span>
                                <span className="text-[10px] font-black text-slate-400">{app.driver?.total_trips || 0} viagens</span>
                             </div>
                          </div>
                        </div>
                      </div>

                      {/* Especialidades do Entregador */}
                      {(app.driver?.metadata?.specialties || []).length > 0 && (
                        <div className="mb-8 flex flex-wrap gap-2">
                           {app.driver.metadata.specialties.map((spec: string) => {
                             const specInfo = availableSpecialties.find(s => s.id === spec);
                             return (
                               <div key={spec} className="px-3 py-1.5 rounded-xl bg-primary/5 border border-primary/10 flex items-center gap-2 group/spec">
                                  <span className="material-symbols-outlined text-[12px] text-primary">{specInfo?.icon || 'verified'}</span>
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{specInfo?.label || spec}</span>
                               </div>
                             );
                           })}
                        </div>
                      )}

                      <div className="flex gap-3 relative z-10">
                        {app.status === 'pending' ? (
                          <>
                            <button 
                              onClick={() => handleApplicationAction(app.id, 'rejected')} 
                              className="flex-1 h-14 bg-white/5 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-white/5 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all font-sans"
                            >
                              Recusar
                            </button>
                            <button 
                              onClick={() => handleApplicationAction(app.id, 'accepted')} 
                              className="flex-1 h-14 bg-primary text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-center font-sans"
                            >
                              Aceitar Candidato
                            </button>
                          </>
                        ) : (
                          <div className={`w-full py-4 text-center text-[10px] font-black uppercase tracking-[0.2em] italic rounded-2xl border ${
                            app.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/20' : 'bg-white/5 text-slate-500 border-white/5'
                          }`}>
                             {app.status === 'accepted' ? '✓ Candidato Selecionado' : 'Candidatura Arquivada'}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Time Picker Pop-up */}
        <AnimatePresence>
          {showTimePicker && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowTimePicker(false)}></motion.div>
               <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-slate-900 border border-white/10 rounded-[48px] p-10 w-full max-w-sm relative z-10 shadow-2xl">
                  <div className="text-center mb-8">
                     <h3 className="text-xl font-black italic">Definir Turno</h3>
                     <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Horário de início e término</p>
                  </div>
                  <div className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Início</label>
                        <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full bg-black/40 border-white/5 rounded-2xl px-6 py-4 font-black text-2xl text-center text-primary" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Término</label>
                        <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full bg-black/40 border-white/5 rounded-2xl px-6 py-4 font-black text-2xl text-center text-primary" />
                     </div>
                     <button onClick={() => setShowTimePicker(false)} className="w-full bg-primary text-slate-950 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest">Confirmar</button>
                  </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Cockpit de Adicionais Pop-up */}
        <AnimatePresence>
          {showCockpit && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setShowCockpit(false)}></motion.div>
               <motion.div initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }} className="bg-slate-900 border-l border-white/10 h-full max-w-md w-full absolute right-0 flex flex-col shadow-2xl">
                  <div className="p-10 border-b border-white/5 flex items-center justify-between">
                     <div>
                        <h3 className="text-lg font-black italic">Menu Cockpit</h3>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Customização Profissional</p>
                     </div>
                     <button onClick={() => setShowCockpit(false)} className="size-10 rounded-xl bg-white/5 text-slate-500 flex items-center justify-center"><span className="material-symbols-outlined">close</span></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-10 space-y-8">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Criar Novo</label>
                        <div className="flex gap-4">
                           <input type="text" value={newCustomBenefit} onChange={e => setNewCustomBenefit(e.target.value)} className="flex-1 bg-black/40 border-white/5 rounded-xl px-4 py-3 font-bold text-sm" placeholder="Ex: Lanche" />
                           <input type="number" value={newCustomBenefitValue} onChange={e => setNewCustomBenefitValue(e.target.value)} className="w-24 bg-black/40 border-white/5 rounded-xl px-4 py-3 font-black text-sm text-emerald-500" placeholder="R$" />
                        </div>
                        <button onClick={addCustomBenefit} className="w-full bg-primary text-slate-950 py-4 rounded-xl font-black text-[10px] uppercase shadow-lg">+ Adicionar</button>
                     </div>
                     <div className="space-y-4">
                        {editingItem.metadata?.custom_benefits?.map((b: any, i: number) => (
                           <div key={i} className="flex items-center justify-between p-5 bg-white/5 rounded-2xl">
                              <span className="text-sm font-black text-slate-300 uppercase">{typeof b === 'string' ? b : b.label}</span>
                              <div className="flex items-center gap-4">
                                 {b.value > 0 && <span className="text-[10px] font-black text-emerald-500">+ R$ {b.value}</span>}
                                 <button onClick={() => removeCustomBenefit(i)} className="text-rose-500 material-symbols-outlined text-sm">delete</button>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
                  <div className="p-10 border-t border-white/5"><button onClick={() => setShowCockpit(false)} className="w-full bg-white/5 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest">Fechar Menu</button></div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>
        {/* Cockpit de Bairros Extras Pop-up */}
        <AnimatePresence>
          {showBairrosCockpit && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setShowBairrosCockpit(false)}></motion.div>
               <motion.div initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }} className="bg-slate-900 border-l border-white/10 h-full max-w-md w-full absolute right-0 flex flex-col shadow-2xl">
                  <div className="p-10 border-b border-white/5 flex items-center justify-between">
                     <div>
                        <h3 className="text-lg font-black italic">Bairros de Atuação</h3>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Defina regiões extras</p>
                     </div>
                     <button onClick={() => setShowBairrosCockpit(false)} className="size-10 rounded-xl bg-white/5 text-slate-500 flex items-center justify-center"><span className="material-symbols-outlined">close</span></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-10 space-y-8">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Adicionar Bairro</label>
                        <div className="flex gap-4">
                           <input type="text" value={newBairro} onChange={e => setNewBairro(e.target.value)} className="flex-1 bg-black/40 border-white/5 rounded-xl px-6 py-4 font-bold text-sm outline-none focus:ring-1 focus:ring-primary" placeholder="Nome do bairro..." />
                           <input type="number" value={newBairroFee} onChange={e => setNewBairroFee(e.target.value)} className="w-24 bg-black/40 border-white/5 rounded-xl px-4 py-4 font-black text-sm text-emerald-500 outline-none" placeholder="R$" />
                        </div>
                        <button onClick={addBairroExtra} className="w-full bg-primary text-slate-950 py-4 rounded-xl font-black text-[10px] uppercase shadow-lg">+ Adicionar Bairro</button>
                     </div>
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Lista de Regiões</label>
                        {(!editingItem.metadata?.bairros_extras || editingItem.metadata.bairros_extras.length === 0) ? (
                          <div className="p-10 border border-dashed border-white/5 rounded-3xl text-center opacity-30">
                            <span className="material-symbols-outlined text-4xl mb-2">map</span>
                            <p className="text-[10px] font-black uppercase tracking-widest">Nenhum bairro extra</p>
                          </div>
                        ) : (
                          <div className="grid gap-3">
                            {editingItem.metadata.bairros_extras.map((b: any, i: number) => (
                               <div key={i} className="flex items-center justify-between p-5 bg-white/5 rounded-2xl hover:bg-white/10 transition-all group">
                                  <div className="flex items-center gap-4">
                                    <div className="size-2 bg-primary rounded-full"></div>
                                    <span className="text-sm font-black text-white uppercase italic">{typeof b === 'string' ? b : b.label}</span>
                                  </div>
                                  <div className="flex items-center gap-6">
                                    {b.fee > 0 && (
                                      <div className="bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                                        <p className="text-[10px] font-black text-emerald-500">R$ {parseFloat(b.fee).toFixed(2).replace('.', ',')}</p>
                                      </div>
                                    )}
                                    <button onClick={() => removeBairroExtra(i)} className="text-rose-500 material-symbols-outlined text-lg opacity-0 group-hover:opacity-100 transition-all">delete</button>
                                  </div>
                               </div>
                            ))}
                          </div>
                        )}
                     </div>
                  </div>
                  <div className="p-10 border-t border-white/5">
                    <button onClick={() => setShowBairrosCockpit(false)} className="w-full bg-primary text-slate-950 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Salvar e Voltar</button>
                  </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
