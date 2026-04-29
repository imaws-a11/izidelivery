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
  const [slotType, setSlotType] = useState<'recurring' | 'fixed'>(slot?.slot_date ? 'fixed' : 'recurring');
  
  
  const [activeTab, setActiveTab] = useState<'config' | 'candidates'>('config');
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(false);
  const [availableSpecialties, setAvailableSpecialties] = useState([]);

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
      const application = applications.find(a => a.id === appId);
      
      const { error } = await supabase
        .from('slot_applications')
        .update({ status })
        .eq('id', appId);
      
      if (error) throw error;
      
      // Se aprovado, desativa a vaga para novos candidatos e dispara push
      if (status === 'accepted') {
        const { error: slotErr } = await supabase
          .from('dedicated_slots_delivery')
          .update({ is_active: false })
          .eq('id', editingItem.id);
        
        if (!slotErr) {
          setEditingItem(prev => ({ ...prev, is_active: false }));
        }

        if (application?.driver_id) {
          try {
            await supabase.functions.invoke('send-push-notification', {
              body: {
                driver_id: application.driver_id,
                title: 'Vaga Confirmada! 🏁',
                body: `Sua candidatura para a vaga "${editingItem.title}" foi aprovada pelo lojista!`,
                data: { type: 'dedicated_slot_confirmed', slot_id: editingItem.id }
              }
            });
          } catch (pushErr) {
            console.error('[PUSH] Erro ao disparar notificação:', pushErr);
          }
        }
      }
      
      toastSuccess(status === 'accepted' ? 'Candidato aprovado!' : 'Candidatura recusada.');
      fetchApplications();
    } catch (err: any) {
      toastError('Erro ao atualizar: ' + err.message);
    }
  };

  const openWhatsApp = (phone: string, name: string) => {
    if (!phone) {
      toastError('Telefone não cadastrado');
      return;
    }
    const text = `Olá ${name}, vi sua candidatura para a nossa vaga dedicada no IziDelivery. Podemos conversar?`;
    window.open(`https://wa.me/55${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
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
    const currentMetadata = editingItem.metadata || {};
    const currentBenefits = currentMetadata.custom_benefits || [];
    
    setEditingItem({
      ...editingItem,
      metadata: {
        ...currentMetadata,
        custom_benefits: [...currentBenefits, { 
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
    const currentMetadata = editingItem.metadata || {};
    const currentSpecs = currentMetadata.custom_specialties || [];
    
    setEditingItem({
      ...editingItem,
      metadata: {
        ...currentMetadata,
        custom_specialties: [...currentSpecs, newCustomSpecialty.trim()]
      }
    });
    setNewCustomSpecialty('');
  };

  const removeCustomSpecialty = (index: number) => {
    const currentMetadata = editingItem.metadata || {};
    const currentSpecs = currentMetadata.custom_specialties || [];
    const updated = currentSpecs.filter((_: any, i: number) => i !== index);
    
    setEditingItem({
      ...editingItem,
      metadata: { ...currentMetadata, custom_specialties: updated }
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
    const currentMetadata = editingItem.metadata || {};
    const currentBairros = currentMetadata.bairros_extras || [];
    
    setEditingItem({
      ...editingItem,
      metadata: {
        ...currentMetadata,
        bairros_extras: [...currentBairros, { 
          label: newBairro.trim(), 
          fee: toNumber(newBairroFee) 
        }]
      }
    });
    setNewBairro('');
    setNewBairroFee('');
  };

  const removeBairroExtra = (index: number) => {
    const currentMetadata = editingItem.metadata || {};
    const currentBairros = currentMetadata.bairros_extras || [];
    const updated = currentBairros.filter((_: any, i: number) => i !== index);
    
    setEditingItem({
      ...editingItem,
      metadata: { ...currentMetadata, bairros_extras: updated }
    });
  };



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
            <div className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-primary text-slate-950 shadow-lg shadow-primary/20 flex items-center gap-2`}>
              <span className="material-symbols-outlined text-sm">settings</span> Detalhes da Vaga
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
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
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Data ou Recorrência</label>
                  <div className="flex gap-4">
                    <button 
                      type="button"
                      onClick={() => {
                        setSlotType('recurring');
                        setEditingItem(prev => ({ ...prev, slot_date: null }));
                      }}
                      className={`flex-1 p-5 rounded-3xl border transition-all flex flex-col items-center gap-2 ${slotType === 'recurring' ? 'border-primary bg-primary/10 text-primary' : 'border-white/5 bg-white/5 text-slate-500'}`}
                    >
                      <span className="material-symbols-outlined">repeat</span>
                      <span className="text-[9px] font-black uppercase tracking-widest">Recorrente</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setSlotType('fixed');
                        setEditingItem(prev => ({ ...prev, day_of_week: null }));
                      }}
                      className={`flex-1 p-5 rounded-3xl border transition-all flex flex-col items-center gap-2 ${slotType === 'fixed' ? 'border-primary bg-primary/10 text-primary' : 'border-white/5 bg-white/5 text-slate-500'}`}
                    >
                      <span className="material-symbols-outlined">calendar_today</span>
                      <span className="text-[9px] font-black uppercase tracking-widest">Data Única</span>
                    </button>
                  </div>
                     {slotType === 'recurring' ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {[
                        { val: 'Monday', label: 'Seg' },
                        { val: 'Tuesday', label: 'Ter' },
                        { val: 'Wednesday', label: 'Qua' },
                        { val: 'Thursday', label: 'Qui' },
                        { val: 'Friday', label: 'Sex' },
                        { val: 'Saturday', label: 'Sáb' },
                        { val: 'Sunday', label: 'Dom' }
                      ].map(day => {
                        const isSelected = editingItem.day_of_week?.split(',').includes(day.val);
                        return (
                          <button
                            key={day.val}
                            type="button"
                            onClick={() => {
                              const currentStr = editingItem.day_of_week || '';
                              let current = currentStr === 'Daily' ? [] : currentStr.split(',').filter(Boolean);
                              const next = current.includes(day.val) 
                                ? current.filter(d => d !== day.val)
                                : [...current, day.val];
                              setEditingItem({ ...editingItem, day_of_week: next.join(',') });
                            }}
                            className={`px-4 py-3 rounded-2xl border font-bold text-xs transition-all ${
                              isSelected 
                                ? 'bg-primary border-primary text-black shadow-lg shadow-primary/20' 
                                : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                            }`}
                          >
                            {day.label}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setEditingItem({ ...editingItem, day_of_week: 'Daily' })}
                        className={`px-4 py-3 rounded-2xl border font-bold text-xs transition-all ${
                          editingItem.day_of_week === 'Daily'
                            ? 'bg-primary border-primary text-black shadow-lg shadow-primary/20' 
                            : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        Diário
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <input 
                        type="date" 
                        value={editingItem.slot_date || ''} 
                        onChange={e => setEditingItem({...editingItem, slot_date: e.target.value})}
                        className="w-full bg-white/5 border border-white/5 rounded-3xl px-8 py-5 font-bold text-sm outline-none text-white [color-scheme:dark]"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Horário</label>
                  <button onClick={() => setShowTimePicker(true)} className="w-full bg-white/5 border border-white/5 rounded-3xl px-8 py-5 flex items-center justify-between hover:bg-white/10 transition-all">
                    <p className="text-sm font-black text-white">{startTime} às {endTime}</p>
                    <span className="material-symbols-outlined text-slate-600">schedule</span>
                  </button>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Incentivos Financeiros</label>
                  <button onClick={() => setShowCockpit(true)} className="w-full p-6 rounded-3xl border border-dashed border-primary/40 bg-primary/5 text-primary flex items-center justify-center gap-3 hover:bg-primary/10 transition-all group">
                    <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">add_circle</span>
                    <span className="text-[11px] font-black uppercase tracking-widest">Gerenciar Bônus e Benefícios</span>
                  </button>
                  {(editingItem.metadata?.custom_benefits || []).length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2 ml-4">
                      {editingItem.metadata.custom_benefits.map((b: any, i: number) => (
                        <span key={i} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                          + {typeof b === 'string' ? b : b.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-10">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4 col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Requisitos e Especialidades</label>
                    
                    <div className="bg-black/20 rounded-[32px] p-6 border border-white/5">
                      <div className="flex flex-wrap gap-3 mb-6">
                        {(editingItem.metadata?.custom_specialties || []).length === 0 && (
                          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest py-4 px-4">Nenhum requisito específico adicionado</p>
                        )}
                        {(editingItem.metadata?.custom_specialties || []).map((spec: string, idx: number) => (
                          <motion.div 
                            layout
                            key={idx} 
                            className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary group"
                          >
                            {editingSpecialtyIdx === idx ? (
                              <input 
                                autoFocus
                                className="bg-transparent border-none text-[11px] font-black uppercase tracking-widest text-primary outline-none min-w-[100px]"
                                value={spec}
                                onChange={(e) => updateCustomSpecialty(idx, e.target.value)}
                                onBlur={() => setEditingSpecialtyIdx(null)}
                                onKeyDown={(e) => e.key === 'Enter' && setEditingSpecialtyIdx(null)}
                              />
                            ) : (
                              <span 
                                onClick={() => setEditingSpecialtyIdx(idx)}
                                className="text-[11px] font-black uppercase tracking-widest cursor-text"
                              >
                                {spec}
                              </span>
                            )}
                            <button onClick={() => removeCustomSpecialty(idx)} className="size-6 rounded-full bg-primary/20 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">
                              <span className="material-symbols-outlined text-[14px]">close</span>
                            </button>
                          </motion.div>
                        ))}
                      </div>

                      <div className="relative group">
                        <input 
                          type="text"
                          value={newCustomSpecialty}
                          onChange={e => setNewCustomSpecialty(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && addCustomSpecialty()}
                          placeholder="Adicionar novo requisito (ex: Moto Própria, Disponibilidade Imediata...)"
                          className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-primary/50 transition-all pr-16 placeholder:text-slate-600"
                        />
                        <button 
                          onClick={addCustomSpecialty}
                          className="absolute right-2 top-2 bottom-2 px-4 bg-primary text-slate-950 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all"
                        >
                          Adicionar
                        </button>
                      </div>
                    </div>
                  </div>


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
