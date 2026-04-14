import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toastSuccess, toastError } from '../lib/useToast';

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
      benefits: []
    },
    ...slot,
    merchant_id: merchantId
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showCockpit, setShowCockpit] = useState(false);
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('23:00');
  const [newCustomBenefit, setNewCustomBenefit] = useState('');
  const [newCustomBenefitValue, setNewCustomBenefitValue] = useState('');

  const toNumber = (val: string) => {
    const n = parseFloat(val);
    return isNaN(n) ? 0 : n;
  };

  useEffect(() => {
    // Apenas resetar se o ID do slot mudar (ex: abriu outra vaga ou criou nova)
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
    }
  }, [slot?.id, merchantId]);

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
      metadata: {
        ...editingItem.metadata,
        benefits: newBenefits
      }
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
      metadata: {
        ...editingItem.metadata,
        custom_benefits: updated
      }
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
        <div className="p-8 md:p-10 border-b border-white/5 flex justify-between items-center bg-black/40">
          <div className="flex items-center gap-6">
            <div className="size-16 rounded-2xl bg-primary flex items-center justify-center text-slate-950 shadow-[0_0_30px_rgba(255,217,0,0.3)]">
              <span className="material-symbols-outlined text-4xl font-black">stars</span>
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight leading-none mb-2 underline decoration-primary/30 underline-offset-8">Studio de Vagas</h2>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>
                {editingItem.id === 'new' ? 'Nova Oportunidade Exclusiva' : `Configuração Profissional`}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="size-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-white/10 transition-all border border-white/5"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-10 space-y-12 scrollbar-hide">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Esquerda: Financeiro e Horários */}
            <div className="space-y-10">
              
              {/* Título */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Nome da Vaga / Posição</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-primary transition-colors">badge</span>
                  <input 
                    type="text" 
                    value={editingItem.title}
                    onChange={e => setEditingItem({...editingItem, title: e.target.value})}
                    className="w-full bg-white/5 border border-white/5 rounded-3xl pl-16 pr-8 py-5 font-bold text-lg focus:ring-2 focus:ring-primary focus:bg-white/10 transition-all shadow-inner outline-none"
                    placeholder="Ex: Entregador Meio Período"
                  />
                </div>
              </div>

              {/* Financeiro Estruturado */}
              <div className="bg-white/5 rounded-[48px] p-8 border border-white/5 space-y-8 shadow-2xl">
                 <div className="flex items-center gap-4 mb-4">
                    <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
                    <h3 className="text-sm font-black uppercase tracking-widest">Remuneração & Metas</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Valor Diária (Fixa)</label>
                      <div className="relative group">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-600 group-focus-within:text-primary transition-colors">R$</span>
                        <input 
                          type="number" 
                          value={editingItem.fee_per_day}
                          onChange={e => setEditingItem({...editingItem, fee_per_day: toNumber(e.target.value)})}
                          className="w-full bg-black/40 border border-white/5 rounded-2xl pl-14 pr-6 py-4 font-black text-xl focus:ring-2 focus:ring-primary outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Até quantas entregas?</label>
                      <div className="relative group">
                        <input 
                          type="number" 
                          value={editingItem.metadata?.base_deliveries || 0}
                          onChange={e => setEditingItem({
                            ...editingItem, 
                            metadata: {...editingItem.metadata, base_deliveries: toNumber(e.target.value)}
                          })}
                          className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 font-black text-xl focus:ring-2 focus:ring-emerald-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-center"
                          placeholder="10"
                        />
                      </div>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Adicional por entrega (após meta)</label>
                    <div className="relative group">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-emerald-500/50 group-focus-within:text-emerald-500 transition-colors">R$</span>
                      <input 
                        type="number" 
                        value={editingItem.metadata?.fee_per_extra_delivery || 0}
                        onChange={e => setEditingItem({
                          ...editingItem, 
                          metadata: {...editingItem.metadata, fee_per_extra_delivery: toNumber(e.target.value)}
                        })}
                        className="w-full bg-emerald-500/5 border border-emerald-500/10 rounded-2xl pl-14 pr-6 py-4 font-black text-xl text-emerald-500 focus:ring-2 focus:ring-emerald-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="5.00"
                      />
                    </div>
             </div>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest ml-2 italic">
                      * O entregador receberá R$ {editingItem.metadata?.fee_per_extra_delivery} a mais por cada entrega feita após a {editingItem.metadata?.base_deliveries}ª.
                    </p>
                 </div>
              </div>

              {/* Horários */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Horário de Atuação</label>
                <button 
                  onClick={() => setShowTimePicker(true)}
                  className="w-full bg-white/5 border border-white/5 rounded-3xl px-8 py-5 flex items-center justify-between group hover:bg-white/10 transition-all shadow-inner outline-none"
                >
                  <div className="flex items-center gap-6">
                    <div className="size-12 rounded-xl bg-slate-900 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                       <span className="material-symbols-outlined">schedule</span>
                    </div>
                    <div className="text-left">
                       <p className="text-sm font-black text-white">{startTime} às {endTime}</p>
                       <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Toque para alterar o turno</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-slate-600 group-hover:text-primary">expand_more</span>
                </button>
              </div>
            </div>

            {/* Direita: Benefícios e Descrição */}
            <div className="space-y-10">
              
              {/* Benefícios (Checkboxes) */}
              <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Benefícios & Adicionais</label>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {benefitsList.map((benefit) => (
                      <button
                        key={benefit.id}
                        onClick={() => toggleBenefit(benefit.id)}
                        className={`flex items-center gap-4 p-5 rounded-3xl border transition-all duration-300 text-left ${
                          (editingItem.metadata?.benefits || []).includes(benefit.id)
                            ? 'bg-primary/20 border-primary text-white shadow-lg shadow-primary/5'
                            : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'
                        }`}
                      >
                         <div className={`size-10 rounded-xl flex items-center justify-center transition-colors ${
                            (editingItem.metadata?.benefits || []).includes(benefit.id) ? 'bg-primary text-slate-950' : 'bg-slate-900 text-slate-600'
                         }`}>
                            <span className="material-symbols-outlined text-xl">{benefit.icon}</span>
                         </div>
                         <span className="text-[10px] font-black uppercase tracking-wider flex-1">{benefit.label}</span>
                         <div className={`size-5 rounded-md border flex items-center justify-center transition-all ${
                            (editingItem.metadata?.benefits || []).includes(benefit.id) ? 'bg-primary border-primary' : 'border-white/20'
                         }`}>
                            {(editingItem.metadata?.benefits || []).includes(benefit.id) && (
                              <span className="material-symbols-outlined text-xs text-slate-950 font-black">check</span>
                            )}
                         </div>
                      </button>
                    ))}

                    {/* Botão One-Click para Cockpit de Adicionais */}
                    <button
                      onClick={() => setShowCockpit(true)}
                      className="flex items-center gap-4 p-5 rounded-3xl border border-dashed border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 transition-all duration-300 text-left"
                    >
                       <div className="size-10 rounded-xl bg-primary text-slate-950 flex items-center justify-center shadow-lg shadow-primary/20">
                          <span className="material-symbols-outlined text-xl">add_circle</span>
                       </div>
                       <div className="flex-1">
                          <span className="text-[10px] font-black uppercase tracking-wider block">Outros Adicionais</span>
                          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                            {editingItem.metadata?.custom_benefits?.length || 0} configurados
                          </span>
                       </div>
                       <span className="material-symbols-outlined text-primary/40">arrow_forward_ios</span>
                    </button>
                 </div>
              </div>

              {/* Descrição */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Informações Extras (Opcional)</label>
                <div className="relative group">
                  <textarea 
                    value={editingItem.description}
                    onChange={e => setEditingItem({...editingItem, description: e.target.value})}
                    className="w-full bg-white/5 border border-white/5 rounded-[40px] px-8 py-8 font-bold text-sm focus:ring-2 focus:ring-primary focus:bg-white/10 transition-all shadow-inner h-[180px] resize-none outline-none leading-relaxed"
                    placeholder="Ex: Pagamento semanal, exigimos moto com documentação em dia..."
                  />
                </div>
              </div>

              {/* Toggle Ativa */}
              <div className="flex items-center gap-6 p-8 bg-black/40 rounded-[40px] border border-white/5 transition-all">
                <div className={`size-14 rounded-2xl flex items-center justify-center transition-colors ${editingItem.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>
                  <span className="material-symbols-outlined text-3xl">{editingItem.is_active ? 'visibility' : 'visibility_off'}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black">Status da Visibilidade</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                    {editingItem.is_active ? 'Vaga publicada e visível' : 'Vaga oculta nos anúncios'}
                  </p>
                </div>
                <button
                  onClick={() => setEditingItem({...editingItem, is_active: !editingItem.is_active})}
                  className={`w-16 h-10 rounded-full relative transition-all duration-500 ${editingItem.is_active ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-8 h-8 bg-white rounded-full transition-all duration-500 ${editingItem.is_active ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 md:p-10 border-t border-white/5 flex justify-end items-center gap-6 bg-black/40">
          <button 
            onClick={onClose}
            className="px-10 py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:text-white transition-all"
          >
            Cancelar
          </button>
          <button 
            onClick={handleLocalSave}
            disabled={isSaving}
            className="bg-primary text-slate-950 px-12 py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-[0_20px_40px_rgba(255,217,0,0.15)] hover:scale-110 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-3"
          >
            {isSaving ? (
              <div className="size-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></div>
            ) : (
              <>
                <span className="material-symbols-outlined text-xl">publish</span>
                Salvar Configurações
              </>
            )}
          </button>
        </div>

        {/* Time Picker Pop-up */}
        <AnimatePresence>
          {showTimePicker && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
               <motion.div 
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }} 
                 exit={{ opacity: 0 }}
                 className="absolute inset-0 bg-black/60 backdrop-blur-md" 
                 onClick={() => setShowTimePicker(false)}
               ></motion.div>
               <motion.div
                 initial={{ opacity: 0, scale: 0.9, y: 20 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.9, y: 20 }}
                 className="bg-slate-900 border border-white/10 rounded-[48px] p-10 w-full max-w-sm relative z-10 shadow-2xl"
               >
                  <div className="text-center mb-10">
                     <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-3xl">timer</span>
                     </div>
                     <h3 className="text-xl font-black italic">Definir Turno</h3>
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Horário de início e término</p>
                  </div>

                  <div className="space-y-8">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Início do Turno</label>
                        <input 
                          type="time" 
                          value={startTime}
                          onChange={e => setStartTime(e.target.value)}
                          className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 font-black text-2xl text-center focus:ring-2 focus:ring-primary outline-none"
                        />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Fim do Turno</label>
                        <input 
                          type="time" 
                          value={endTime}
                          onChange={e => setEndTime(e.target.value)}
                          className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 font-black text-2xl text-center focus:ring-2 focus:ring-primary outline-none"
                        />
                     </div>

                     <button
                       onClick={() => setShowTimePicker(false)}
                       className="w-full bg-primary text-slate-950 py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl"
                     >
                       Confirmar Horário
                     </button>
                  </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Cockpit de Adicionais Pop-up */}
        <AnimatePresence>
          {showCockpit && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
               <motion.div 
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }} 
                 exit={{ opacity: 0 }}
                 className="absolute inset-0 bg-black/80 backdrop-blur-xl" 
                 onClick={() => setShowCockpit(false)}
               ></motion.div>
               <motion.div
                 initial={{ opacity: 0, x: 100 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: 100 }}
                 className="bg-slate-900 border-l border-white/10 h-full max-w-md w-full absolute right-0 flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)]"
               >
                  <div className="p-10 border-b border-white/5 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="size-12 rounded-xl bg-primary text-slate-950 flex items-center justify-center">
                           <span className="material-symbols-outlined font-black">rocket</span>
                        </div>
                        <div>
                           <h3 className="text-lg font-black italic">Menu Cockpit</h3>
                           <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Customização de Adicionais</p>
                        </div>
                     </div>
                     <button onClick={() => setShowCockpit(false)} className="size-10 rounded-xl bg-white/5 text-slate-500 flex items-center justify-center hover:bg-white/10 transition-all">
                        <span className="material-symbols-outlined">close</span>
                     </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Criar Novo Adicional</label>
                        <div className="flex flex-col gap-4">
                           <div className="flex gap-4">
                              <div className="relative flex-1 group">
                                 <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-primary transition-colors">edit_note</span>
                                 <input 
                                   type="text" 
                                   value={newCustomBenefit}
                                   onChange={e => setNewCustomBenefit(e.target.value)}
                                   className="w-full bg-black/40 border border-white/5 rounded-2xl pl-12 pr-6 py-4 font-bold text-sm focus:ring-2 focus:ring-primary outline-none"
                                   placeholder="Nome (Ex: Ajuda de Custo)"
                                 />
                              </div>
                              <div className="relative w-32 group">
                                 <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-600 group-focus-within:text-emerald-500 text-xs transition-colors">R$</span>
                                 <input 
                                   type="number" 
                                   value={newCustomBenefitValue}
                                   onChange={e => setNewCustomBenefitValue(e.target.value)}
                                   className="w-full bg-black/40 border border-white/5 rounded-2xl pl-10 pr-4 py-4 font-black text-sm text-emerald-500 focus:ring-2 focus:ring-emerald-500 outline-none"
                                   placeholder="0,00"
                                 />
                              </div>
                           </div>
                           <button 
                             onClick={addCustomBenefit}
                             className="w-full bg-primary text-slate-950 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                           >
                              <span className="material-symbols-outlined text-sm font-black">add_circle</span>
                              Adicionar ao Portfólio
                           </button>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Lista de Ativos</label>
                        <div className="space-y-3">
                           {editingItem.metadata?.custom_benefits?.length > 0 ? (
                             editingItem.metadata.custom_benefits.map((benefit: any, idx: number) => (
                               <motion.div 
                                 initial={{ opacity: 0, y: 10 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 key={idx} 
                                 className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5 group hover:bg-white/10 transition-all"
                               >
                                  <div className="flex items-center gap-4">
                                     <div className="size-8 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-sm">check_circle</span>
                                     </div>
                                     <div>
                                        <span className="text-sm font-black text-slate-300 block">{typeof benefit === 'string' ? benefit : benefit.label}</span>
                                        {benefit.value > 0 && (
                                           <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">+ R$ {benefit.value}</span>
                                        )}
                                     </div>
                                  </div>
                                  <button onClick={() => removeCustomBenefit(idx)} className="size-8 rounded-lg bg-rose-500/10 text-rose-500 opacity-0 group-hover:opacity-100 flex items-center justify-center hover:bg-rose-500/20 transition-all">
                                     <span className="material-symbols-outlined text-sm">delete</span>
                                  </button>
                               </motion.div>
                             ))
                           ) : (
                             <div className="p-10 border border-dashed border-white/10 rounded-[40px] text-center">
                                <span className="material-symbols-outlined text-4xl text-slate-800 mb-4 block">inventory_2</span>
                                <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Nenhum adicional personalizado criado</p>
                             </div>
                           )}
                        </div>
                     </div>
                  </div>

                  <div className="p-10 bg-black/40 border-t border-white/5">
                     <button 
                       onClick={() => setShowCockpit(false)}
                       className="w-full bg-white/5 text-white py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest border border-white/10"
                     >
                       Fechar Cockpit
                     </button>
                  </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
};
