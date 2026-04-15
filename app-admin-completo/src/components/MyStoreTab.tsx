import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';
import { supabase } from '../lib/supabase';
import { AddressSearchInput } from './AddressSearchInput';

// Componente de Toggle Premium
const PremiumToggle = ({ active, onClick, color = 'emerald' }: { active: boolean; onClick: () => void; color?: string }) => {
  const colors: Record<string, string> = {
    emerald: active ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-slate-200 dark:bg-slate-700',
    blue: active ? 'bg-blue-500 shadow-lg shadow-blue-500/20' : 'bg-slate-200 dark:bg-slate-700',
    rose: active ? 'bg-rose-500 shadow-lg shadow-rose-500/20' : 'bg-slate-200 dark:bg-slate-700',
  };

  return (
    <button
      onClick={onClick}
      className={`w-14 h-7 rounded-full relative p-1 transition-all flex items-center ${colors[color]}`}
    >
      <div className={`w-5 h-5 bg-white rounded-full transition-all shadow-sm ${active ? 'translate-x-7' : 'translate-x-0'}`}></div>
    </button>
  );
};

export default function MyStoreTab() {
  const {
    merchantProfile, 
    setMerchantProfile, 
    isSaving,
    setIsSaving
  } = useAdmin();

  const [localRadius, setLocalRadius] = useState(merchantProfile?.delivery_radius || 0);
  const [coverageMode, setCoverageMode] = useState<'radius' | 'neighborhoods'>(
    merchantProfile?.delivery_coverage_mode || 'radius'
  );
  const [cityNeighborhoods, setCityNeighborhoods] = useState<string[]>([]);
  // mapa: bairro -> { active, price }
  const [deliveryZones, setDeliveryZones] = useState<Record<string, { active: boolean; price: number }>>({});
  const [zonesLoading, setZonesLoading] = useState(false);
  const [zonesSaving, setZonesSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Busca bairros ativos da cidade
  useEffect(() => {
    supabase
      .from('city_neighborhoods_delivery')
      .select('name')
      .eq('active', true)
      .order('name', { ascending: true })
      .then(({ data }) => {
        if (data) setCityNeighborhoods(data.map((r: any) => r.name));
      });
  }, []);

  // Busca zonas configuradas pelo lojista
  useEffect(() => {
    if (!merchantProfile?.id) return;
    setZonesLoading(true);
    supabase
      .from('merchant_delivery_zones')
      .select('neighborhood_name, delivery_price, active')
      .eq('merchant_id', merchantProfile.id)
      .then(({ data }) => {
        const map: Record<string, { active: boolean; price: number }> = {};
        (data || []).forEach((z: any) => {
          map[z.neighborhood_name] = { active: z.active, price: Number(z.delivery_price) };
        });
        setDeliveryZones(map);
        setZonesLoading(false);
      });
  }, [merchantProfile?.id]);

  // Sync coverageMode se merchantProfile mudar depois do mount
  useEffect(() => {
    if (merchantProfile?.delivery_coverage_mode) {
      setCoverageMode(merchantProfile.delivery_coverage_mode);
    }
  }, [merchantProfile?.id]);

  const handleSaveZones = async () => {
    if (!merchantProfile?.id) return;
    setZonesSaving(true);
    setSaveSuccess(false);
    
    const rows = Object.entries(deliveryZones).map(([neighborhood_name, z]) => ({
      merchant_id: merchantProfile.id,
      neighborhood_name,
      delivery_price: z.price,
      active: z.active,
    }));
    
    await supabase
      .from('merchant_delivery_zones')
      .upsert(rows, { onConflict: 'merchant_id,neighborhood_name' });
      
    setZonesSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const toggleZone = (name: string) => {
    setDeliveryZones(prev => ({
      ...prev,
      [name]: { active: !(prev[name]?.active ?? false), price: prev[name]?.price ?? 0 },
    }));
  };

  const setZonePrice = (name: string, price: number) => {
    setDeliveryZones(prev => ({
      ...prev,
      [name]: { active: prev[name]?.active ?? true, price },
    }));
  };

  const activeZonesCount = Object.values(deliveryZones).filter(z => z.active).length;

  if (!merchantProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] animate-pulse">Sincronizando Estabelecimento...</p>
      </div>
    );
  }

  const updateProfileField = async (field: string, value: any) => {
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('admin_users')
        .update({ [field]: value })
        .eq('id', merchantProfile.merchant_id);
      
      if (error) throw error;
      setMerchantProfile({ ...merchantProfile, [field]: value });
      return true;
    } catch (err: any) {
      alert('Erro ao atualizar: ' + err.message);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const updateProfileFields = async (updates: Record<string, any>) => {
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('admin_users')
        .update(updates)
        .eq('id', merchantProfile.merchant_id);
      
      if (error) throw error;
      setMerchantProfile({ ...merchantProfile, ...updates });
      return true;
    } catch (err: any) {
      alert('Erro ao atualizar: ' + err.message);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const isStoreOpen = (openingHours: any, manualOpen: boolean, mode: string = 'auto') => {
    if (manualOpen === false) return false;
    if (mode === 'manual') return manualOpen === true;
    if (!openingHours || Object.keys(openingHours).length === 0) return true;

    const now = new Date();
    const days = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
    const today = days[now.getDay()];
    const config = openingHours[today];

    if (!config || !config.active) return false;

    try {
      const [openH, openM] = config.open.split(':').map(Number);
      const [closeH, closeM] = config.close.split(':').map(Number);
      const nowH = now.getHours();
      const nowM = now.getMinutes();
      const nowInMinutes = nowH * 60 + nowM;
      const openInMinutes = openH * 60 + openM;
      let closeInMinutes = closeH * 60 + closeM;

      if (closeInMinutes < openInMinutes) {
        return nowInMinutes >= openInMinutes || nowInMinutes <= closeInMinutes;
      }
      return nowInMinutes >= openInMinutes && nowInMinutes <= closeInMinutes;
    } catch (e) {
      return true;
    }
  };

  const handleSaveHours = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('admin_users')
        .update({ opening_hours: merchantProfile.opening_hours, opening_mode: 'auto' })
        .eq('id', merchantProfile.merchant_id);
      
      if (error) throw error;
      setMerchantProfile({ ...merchantProfile, opening_mode: 'auto' });
      alert('Horários de funcionamento atualizados e sistema automático ATIVADO! 🕒');
    } catch (err: any) {
      alert('Erro ao atualizar horários: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const dayNames: Record<string, string> = {
    seg: 'Segunda', ter: 'Terça', qua: 'Quarta', qui: 'Quinta', sex: 'Sexta', sab: 'Sábado', dom: 'Domingo'
  };

  return (
    <div className="space-y-10 p-4 md:p-8 max-w-7xl mx-auto pb-20">
      
      {/* HEADER: STORE STATUS & QUICK CONTROLS */}
      <div className="relative group overflow-hidden bg-white dark:bg-slate-900 p-8 rounded-[48px] border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/40 dark:shadow-none transition-all">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
           <span className="material-symbols-outlined text-[160px] text-primary">storefront</span>
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          <div className="flex items-center gap-8">
            <div className="relative">
              <div className="size-32 rounded-[40px] overflow-hidden border-8 border-slate-50 dark:border-slate-800 shadow-xl bg-slate-100 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                {merchantProfile.store_logo ? (
                  <img src={merchantProfile.store_logo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-5xl text-slate-300">storefront</span>
                )}
              </div>
              {(() => {
                const isOpen = isStoreOpen(merchantProfile.opening_hours, !!merchantProfile.is_open, merchantProfile.opening_mode);
                return (
                  <div className={`absolute -bottom-2 -right-2 size-12 rounded-[22px] flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-2xl ${isOpen ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                    <span className="material-symbols-outlined text-2xl">{isOpen ? 'check' : 'close'}</span>
                  </div>
                );
              })()}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full border border-primary/20">Lojista Parceiro</span>
                <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{merchantProfile.store_name}</h2>
              </div>
              <p className="text-slate-400 font-bold text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-primary">pin_drop</span>
                {merchantProfile.store_address || 'Cadastre seu endereço nas configurações'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            {/* STATUS LOJA */}
            <div className="flex flex-col gap-3 px-8 py-6 bg-slate-50 dark:bg-slate-800/50 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-inner">
              <div className="flex items-center gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Sinal da Loja</p>
                  {(() => {
                    const isOpen = isStoreOpen(merchantProfile.opening_hours, !!merchantProfile.is_open, merchantProfile.opening_mode);
                    return (
                      <p className={`text-sm font-black uppercase tracking-widest ${isOpen ? 'text-emerald-500 shadow-emerald-500/20' : 'text-rose-500 shadow-rose-500/20'}`}>
                        {isOpen ? 'Aberta agora' : 'Fechada'}
                      </p>
                    );
                  })()}
                </div>
                <PremiumToggle active={!!merchantProfile.is_open} onClick={async () => {
                   setIsSaving(true);
                   const nextOpen = !merchantProfile.is_open;
                   const { error } = await supabase.from('admin_users').update({ is_open: nextOpen, opening_mode: 'manual' }).eq('id', merchantProfile.merchant_id);
                   if (!error) setMerchantProfile({ ...merchantProfile, is_open: nextOpen, opening_mode: 'manual' });
                   setIsSaving(false);
                }} />
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/5 pt-3 mt-1">
                 <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">
                   Modo: <span className={merchantProfile.opening_mode === 'manual' ? 'text-amber-500' : 'text-primary'}>
                     {merchantProfile.opening_mode === 'manual' ? 'Manual (Padrão Override)' : 'Automático (Horários)'}
                   </span>
                 </p>
                 {merchantProfile.opening_mode === 'manual' && (
                   <button 
                     onClick={async () => {
                        setIsSaving(true);
                        const { error } = await supabase.from('admin_users').update({ opening_mode: 'auto' }).eq('id', merchantProfile.merchant_id);
                        if (!error) setMerchantProfile({ ...merchantProfile, opening_mode: 'auto' });
                        setIsSaving(false);
                     }}
                     className="text-[8px] font-black uppercase text-primary hover:underline"
                   >
                     Resetar para Automático
                   </button>
                 )}
              </div>
            </div>

            {/* FRETE GRÁTIS */}
            <div className="flex items-center gap-6 px-8 py-6 bg-slate-50 dark:bg-slate-800/50 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-inner">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Frete Grátis</p>
                <p className={`text-sm font-black uppercase tracking-widest ${merchantProfile.free_delivery ? 'text-blue-500' : 'text-slate-400'}`}>
                  {merchantProfile.free_delivery ? 'Ativado' : 'Inativo'}
                </p>
              </div>
              <PremiumToggle active={!!merchantProfile.free_delivery} onClick={() => updateProfileField('free_delivery', !merchantProfile.free_delivery)} color="blue" />
            </div>

            {/* TEMPO DE ENTREGA */}
            <button 
              onClick={async () => {
                const newTime = prompt('Defina o tempo de preparo + entrega (ex: 30-45 min):', merchantProfile.estimated_time || '30-45 min');
                if (newTime !== null) {
                  updateProfileField('estimated_time', newTime);
                }
              }}
              className="flex items-center gap-6 px-8 py-6 bg-slate-50 dark:bg-slate-800/50 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-inner hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group/time"
            >
              <div className="space-y-1 text-left">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Preparo + Entrega</p>
                <p className="text-sm font-black uppercase tracking-widest text-primary">
                  {merchantProfile.estimated_time || '30-45 min'}
                </p>
              </div>
              <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center group-hover/time:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined text-primary text-xl">timer</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          
          {/* ENDEREÇO & LOCALIZAÇÃO */}
          <section className="bg-white dark:bg-slate-900 p-10 rounded-[56px] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
             <div className="relative z-10 flex flex-col gap-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Endereço & Localização</h3>
                  <p className="text-slate-400 text-sm font-medium">Assegure que sua localização no mapa esteja correta para o roteamento dos entregadores.</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-[2]">
                       <AddressSearchInput
                         initialValue={merchantProfile.store_address || ''}
                         placeholder="Buscar endereço no Google..."
                         userCoords={merchantProfile.latitude && merchantProfile.longitude ? {
                            lat: merchantProfile.latitude,
                            lng: merchantProfile.longitude
                         } : null}
                         onSelect={(addr) => {
                            updateProfileFields({
                              store_address: addr.formatted_address,
                              latitude: addr.lat,
                              longitude: addr.lng
                            });
                         }}
                       />
                    </div>
                    <div className="flex-1">
                      <button 
                        onClick={() => {
                          if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(async (pos) => {
                              const { latitude, longitude } = pos.coords;
                              updateProfileFields({ latitude, longitude });
                              alert('Localização GPS capturada com sucesso! 📍');
                            });
                          }
                        }}
                        className="w-full h-[72px] bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-3xl flex items-center justify-center gap-3 text-slate-500 hover:text-primary hover:border-primary transition-all group"
                      >
                        <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">my_location</span>
                        <span className="text-xs font-black uppercase tracking-widest text-center">Usar GPS Atual</span>
                      </button>
                    </div>
                  </div>
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-500/5 rounded-3xl border border-emerald-100 dark:border-emerald-500/10 flex items-center gap-4">
                    <div className="size-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-emerald-500">pin_drop</span>
                    </div>
                    <div className="text-[10px] font-bold text-emerald-600/80 leading-tight">
                      Coordenadas Atuais: <span className="font-black text-emerald-600">{Number(merchantProfile.latitude || 0).toFixed(6)}, {Number(merchantProfile.longitude || 0).toFixed(6)}</span>
                    </div>
                  </div>
                </div>
             </div>
          </section>

          {/* LOGÍSTICA & COBERTURA - MODO DUAL */}
          <section className="bg-white dark:bg-slate-900 p-10 rounded-[56px] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-1">Gestão de Cobertura</h3>
                  <p className="text-slate-400 text-sm font-medium">Escolha como definir a área de entrega do seu estabelecimento.</p>
                </div>
                <div className="size-14 rounded-3xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-violet-500 text-2xl">radar</span>
                </div>
              </div>

              {/* Seletor de Modo */}
              <div className="grid grid-cols-2 gap-3 mb-8 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-[32px] border border-slate-100 dark:border-white/5">
                {[
                  { id: 'radius', icon: 'radar', label: 'Por Raio de Entrega', desc: 'Distância em km do estabelecimento' },
                  { id: 'neighborhoods', icon: 'location_city', label: 'Por Bairros', desc: 'Selecione os bairros atendidos' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => {
                      setCoverageMode(mode.id as 'radius' | 'neighborhoods');
                      updateProfileField('delivery_coverage_mode', mode.id);
                    }}
                    className={`flex items-center gap-4 p-5 rounded-[24px] font-black text-left transition-all ${
                      coverageMode === mode.id
                        ? 'bg-white dark:bg-slate-900 shadow-md border border-violet-200 dark:border-violet-500/30 text-violet-600 dark:text-violet-400'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 border border-transparent'
                    }`}
                  >
                    <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                      coverageMode === mode.id ? 'bg-violet-100 dark:bg-violet-500/20' : 'bg-slate-100 dark:bg-slate-700'
                    }`}>
                      <span className={`material-symbols-outlined text-xl ${coverageMode === mode.id ? 'text-violet-500' : 'text-slate-400'}`}>{mode.icon}</span>
                    </div>
                    <div>
                      <p className={`text-xs uppercase tracking-widest font-black ${coverageMode === mode.id ? 'text-violet-600 dark:text-violet-400' : 'text-slate-500'}`}>{mode.label}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5 normal-case tracking-normal">{mode.desc}</p>
                    </div>
                    {coverageMode === mode.id && (
                      <div className="ml-auto size-5 rounded-full bg-violet-500 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-white text-sm">check</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Conteúdo condicional */}
              <AnimatePresence mode="wait">
                {coverageMode === 'radius' ? (
                  <motion.div
                    key="radius"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-5"
                  >
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Raio de Operação (km)</label>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          step="0.1"
                          value={localRadius}
                          onChange={(e) => setLocalRadius(parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-[32px] px-8 h-20 text-3xl font-black text-slate-900 dark:text-white focus:border-violet-400 transition-all pr-32"
                          placeholder="0"
                        />
                        <div className="absolute right-4">
                          <button
                            onClick={() => updateProfileField('delivery_radius', localRadius)}
                            disabled={isSaving}
                            className="px-8 h-12 bg-violet-500 hover:bg-violet-600 text-white font-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-violet-500/20 disabled:grayscale"
                          >
                            {isSaving ? '...' : 'Salvar'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="flex items-center justify-center p-8 bg-violet-500/5 dark:bg-violet-500/10 rounded-[40px] border border-dashed border-violet-200 dark:border-violet-500/20">
                        <div className="text-center">
                          <span className="text-5xl font-black text-violet-500">{localRadius}</span>
                          <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest mt-1">km raio</p>
                        </div>
                      </div>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed flex-1">
                        Clientes a mais de <span className="text-violet-500 font-black">{localRadius}km</span> não verão seu card. Use com sabedoria para garantir qualidade na entrega.
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="neighborhoods"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    {/* Header de contagem */}
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Zonas de Entrega</p>
                      <div className="flex items-center gap-2">
                        {activeZonesCount > 0 && (
                          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                            {activeZonesCount} ativo{activeZonesCount !== 1 ? 's' : ''}
                          </span>
                        )}
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-400">
                          {cityNeighborhoods.length} bairros
                        </span>
                      </div>
                    </div>

                    {/* Lista de bairros com preço */}
                    {zonesLoading || cityNeighborhoods.length === 0 ? (
                      <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <span className="material-symbols-outlined text-slate-300 animate-spin text-xl">sync</span>
                        <p className="text-xs font-bold text-slate-400">Carregando bairros...</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[360px] overflow-y-auto pr-1">
                        {cityNeighborhoods.map((nome) => {
                          const zone = deliveryZones[nome];
                          const isActive = zone?.active ?? false;
                          const price = zone?.price ?? 0;
                          return (
                            <div
                              key={nome}
                              className={`flex items-center justify-between gap-2 p-3 rounded-2xl border transition-all ${
                                isActive
                                  ? 'bg-white dark:bg-slate-800 border-violet-200 dark:border-violet-500/30 shadow-sm'
                                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-700 opacity-60'
                              }`}
                            >
                              {/* Lado Esquerdo: Toggle + Nome */}
                              <div className="flex items-center gap-2 min-w-0">
                                <PremiumToggle
                                  active={isActive}
                                  onClick={() => toggleZone(nome)}
                                  color="emerald"
                                />
                                <p className={`truncate text-xs font-black ${
                                  isActive ? 'text-slate-800 dark:text-white' : 'text-slate-400'
                                }`} title={nome}>
                                  {nome}
                                </p>
                              </div>

                              {/* Lado Direito: Preço */}
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="text-[10px] font-black text-slate-400">R$</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.50"
                                  value={price}
                                  onChange={(e) => setZonePrice(nome, parseFloat(e.target.value) || 0)}
                                  disabled={!isActive}
                                  className="w-16 h-8 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-center text-xs font-black text-slate-900 dark:text-white focus:border-violet-400 focus:ring-1 focus:ring-violet-400 outline-none transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                  placeholder="0.00"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Rodapé com resumo e salvar */}
                    {activeZonesCount > 0 && (
                      <div className="p-4 bg-violet-50 dark:bg-violet-500/10 rounded-[24px] border border-violet-100 dark:border-violet-500/20">
                        <p className="text-[10px] font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest mb-2">Previsão de entrega</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(deliveryZones)
                            .filter(([, z]) => z.active)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([nome, z]) => (
                              <span key={nome} className="px-2.5 py-1 bg-white dark:bg-slate-800 rounded-xl text-[10px] font-black text-violet-600 dark:text-violet-300 border border-violet-100 dark:border-violet-500/20">
                                {nome} · R$ {z.price.toFixed(2)}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleSaveZones}
                      disabled={zonesSaving || saveSuccess}
                      className={`w-full py-4 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl transition-all active:scale-95 disabled:grayscale flex items-center justify-center gap-2 ${
                        saveSuccess 
                          ? 'bg-emerald-500 shadow-emerald-500/20' 
                          : 'bg-violet-500 hover:bg-violet-600 shadow-violet-500/20'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">
                        {saveSuccess ? 'check_circle' : 'save'}
                      </span>
                      {saveSuccess ? 'Zonas Salvas!' : zonesSaving ? 'Salvando...' : 'Salvar Zonas de Entrega'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* AI ANALYTICS CARD */}
          <section className="bg-slate-900 dark:bg-black p-10 rounded-[56px] border border-white/5 shadow-[0_40px_100px_rgba(0,0,0,0.4)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 mix-blend-overlay opacity-20 group-hover:scale-110 transition-transform duration-1000">
               <span className="material-symbols-outlined text-[200px] text-white">neurology</span>
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-10">
                <div className="size-14 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                   <span className="material-symbols-outlined text-primary text-3xl">insights</span>
                </div>
                <div>
                   <h3 className="text-2xl font-black text-white">Inteligência Operacional</h3>
                   <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Insights em tempo real</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {[
                   { label: 'Pessoas na Loja', val: Math.floor(Math.random()*40)+10, icon: 'groups' },
                   { label: 'Conversão Média', val: '12.4%', icon: 'ads_click' },
                   { label: 'Preparo + Entrega', val: merchantProfile.estimated_time || '30-45 min', icon: 'timer' }
                 ].map((stat, i) => (
                   <div key={i} className="p-8 bg-white/5 rounded-[40px] border border-white/5 hover:bg-white/[0.08] transition-all group/stat">
                      <div className="flex items-center justify-between mb-4">
                        <span className="material-symbols-outlined text-slate-500 text-xl group-hover/stat:text-primary transition-colors">{stat.icon}</span>
                        <div className="size-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                      </div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                      <h4 className="text-3xl font-black text-white tracking-tighter">{stat.val}</h4>
                   </div>
                 ))}
              </div>
            </div>
          </section>
        </div>

        {/* COLUNA DIREITA: HORÁRIOS */}
        <div className="lg:col-span-1">
          <section className="bg-white dark:bg-slate-900 rounded-[56px] p-10 border border-slate-200 dark:border-slate-800 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-4">
                  Horários
                </h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Funcionamento Semanal</p>
              </div>
              <div className="size-14 rounded-3xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                 <span className="material-symbols-outlined text-orange-500 text-3xl">schedule</span>
              </div>
            </div>
            
            <div className="space-y-4 flex-1">
              {['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'].map((day) => {
                const dayConfig = merchantProfile.opening_hours?.[day] || { active: true, open: '08:00', close: '22:00' };
                return (
                  <div key={day} className="flex flex-col gap-4 p-5 bg-slate-50 dark:bg-slate-800/40 rounded-[32px] border border-slate-100 dark:border-white/5 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xs uppercase shadow-sm transition-all ${dayConfig.active ? 'bg-primary text-slate-900 border-none' : 'bg-slate-200 text-slate-400 dark:bg-slate-700 opacity-50 border border-slate-300 dark:border-slate-600'}`}>
                          {day}
                        </div>
                        <span className={`text-xs font-black uppercase tracking-widest ${dayConfig.active ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                          {dayNames[day]}
                        </span>
                      </div>
                      <PremiumToggle active={dayConfig.active} onClick={() => {
                        const next = { ...merchantProfile.opening_hours, [day]: { ...dayConfig, active: !dayConfig.active } };
                        setMerchantProfile({ ...merchantProfile, opening_hours: next });
                      }} color="emerald" />
                    </div>
                    
                    <AnimatePresence>
                      {dayConfig.active && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }} 
                          animate={{ height: 'auto', opacity: 1 }} 
                          exit={{ height: 0, opacity: 0 }}
                          className="flex items-center gap-3 px-2 overflow-hidden"
                        >
                          <div className="flex-1 flex items-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-2 overflow-hidden shadow-inner">
                            <input
                              type="text"
                              className="w-full bg-transparent border-none text-center font-black text-slate-900 dark:text-white focus:ring-0 placeholder:text-slate-300"
                              value={dayConfig.open}
                              onChange={(e) => {
                                const next = { ...merchantProfile.opening_hours, [day]: { ...dayConfig, open: e.target.value } };
                                setMerchantProfile({ ...merchantProfile, opening_hours: next });
                              }}
                            />
                          </div>
                          <span className="text-[10px] font-black text-slate-400 uppercase">at´e</span>
                          <div className="flex-1 flex items-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-2 overflow-hidden shadow-inner">
                            <input
                              type="text"
                              className="w-full bg-transparent border-none text-center font-black text-slate-900 dark:text-white focus:ring-0 placeholder:text-slate-300"
                              value={dayConfig.close}
                              onChange={(e) => {
                                const next = { ...merchantProfile.opening_hours, [day]: { ...dayConfig, close: e.target.value } };
                                setMerchantProfile({ ...merchantProfile, opening_hours: next });
                              }}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            <button
              disabled={isSaving}
              onClick={handleSaveHours}
              className="w-full mt-10 bg-emerald-500 hover:bg-emerald-600 text-white font-black py-7 rounded-[32px] text-xs uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(16,185,129,0.3)] hover:shadow-emerald-500/40 transition-all active:scale-[0.98] disabled:grayscale flex items-center justify-center gap-3 group"
            >
              {isSaving ? (
                <div className="size-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">save</span>
                  Confirmar Escala
                </>
              )}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
