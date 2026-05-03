import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

const DriverApplicationsTab = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: supabaseError } = await supabase
        .from('driver_applications_delivery')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (supabaseError) throw supabaseError;
      setApplications(data || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleApprove = async (app: any) => {
    setActionLoading(true);
    try {
      const { error: driverError } = await supabase
        .from('drivers_delivery')
        .upsert({
          id: app.user_id,
          name: app.full_name,
          email: app.email,
          phone: app.phone,
          vehicle_type: app.vehicle_type,
          vehicle_model: app.vehicle_model,
          license_plate: app.vehicle_plate,
          status: 'online',
          rating: 5.0,
          is_active: true
        }, { onConflict: 'id' });

      if (driverError) throw driverError;

      const { error: updateError } = await supabase
        .from('driver_applications_delivery')
        .update({ status: 'approved' })
        .eq('id', app.id);

      if (updateError) throw updateError;

      await supabase.from('notifications_delivery').insert({
        user_id: app.user_id,
        title: '🎊 Cadastro Aprovado!',
        body: `Parabéns, ${app.full_name.split(' ')[0]}! Sua conta de entregador foi ativada.`,
        status: 'pending'
      });

      alert('Candidatura aprovada com sucesso!');
      setSelectedApp(null);
      fetchApplications();
    } catch (err: any) {
      alert('Erro ao aprovar: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Rejeitar esta candidatura?')) return;
    setActionLoading(true);
    try {
      await supabase.from('driver_applications_delivery').update({ status: 'rejected' }).eq('id', id);
      setSelectedApp(null);
      fetchApplications();
    } catch (err: any) {
      alert('Erro ao rejeitar: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-widest">Aprovado</span>;
      case 'rejected': return <span className="px-3 py-1 bg-rose-500/10 text-rose-500 rounded-full text-[10px] font-black uppercase tracking-widest">Rejeitado</span>;
      default: return <span className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-black uppercase tracking-widest">Pendente</span>;
    }
  };

  return (
    <div className="space-y-8 font-display">
      <div className="flex items-center justify-between">
         <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Candidaturas</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Gestão de novos motoristas</p>
         </div>
         <button onClick={fetchApplications} className="size-12 rounded-2xl bg-white dark:bg-white/5 flex items-center justify-center text-slate-400 hover:text-primary transition-colors border border-slate-100 dark:border-white/5">
           <span className="material-symbols-outlined">refresh</span>
         </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="py-20 flex justify-center"><div className="size-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
        ) : error ? (
          <div className="p-10 bg-rose-50 dark:bg-rose-500/5 rounded-[32px] text-center text-rose-500 font-bold uppercase text-[10px]">{error}</div>
        ) : applications.length === 0 ? (
          <div className="p-20 bg-white dark:bg-white/[0.02] rounded-[48px] text-center border border-slate-100 dark:border-white/5"><p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Sem candidaturas</p></div>
        ) : (
          applications.map((app) => (
            <div key={app.id} className="bg-white dark:bg-white/[0.02] p-6 rounded-[32px] border border-slate-100 dark:border-white/5 flex items-center justify-between group hover:border-primary/30 transition-all">
              <div className="flex items-center gap-5">
                 <div className="size-14 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400">
                    <span className="material-symbols-outlined">{app.vehicle_type === 'moto' ? 'moped' : 'directions_car'}</span>
                 </div>
                 <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{app.full_name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{app.vehicle_model} • {app.vehicle_plate}</p>
                 </div>
              </div>
              <div className="flex items-center gap-6">
                 {getStatusBadge(app.status)}
                 <button onClick={() => setSelectedApp(app)} className="h-12 px-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all">Ver Dossiê</button>
              </div>
            </div>
          ))
        )}
      </div>

      <AnimatePresence>
        {selectedApp && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 lg:p-10">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" onClick={() => !actionLoading && setSelectedApp(null)} />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white dark:bg-[#111] w-full max-w-6xl max-h-[95vh] rounded-[48px] overflow-hidden shadow-2xl relative z-10 border border-white/10 flex flex-col">
              <div className="p-8 lg:p-10 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-[9px] font-black uppercase tracking-[0.2em]">Candidato #{selectedApp.id.slice(0,8)}</span>
                    {getStatusBadge(selectedApp.status)}
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">{selectedApp.full_name}</h2>
                </div>
                <button onClick={() => !actionLoading && setSelectedApp(null)} className="size-12 rounded-2xl bg-white dark:bg-white/5 flex items-center justify-center shadow-sm"><span className="material-symbols-outlined">close</span></button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 scrollbar-hide">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  <div className="lg:col-span-7 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-50 dark:bg-white/[0.03] p-6 rounded-[28px] border border-slate-100 dark:border-white/5">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">E-mail</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedApp.email}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-white/[0.03] p-6 rounded-[28px] border border-slate-100 dark:border-white/5">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">WhatsApp</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedApp.phone}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-white/[0.03] p-6 rounded-[28px] border border-slate-100 dark:border-white/5 md:col-span-2">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Endereço</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedApp.address}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-slate-900 dark:bg-white p-6 rounded-[28px] text-center">
                        <span className="material-symbols-outlined text-primary dark:text-slate-900 mb-1">{selectedApp.vehicle_type === 'moto' ? 'moped' : 'directions_car'}</span>
                        <p className="text-[10px] font-black text-white dark:text-slate-900 uppercase">{selectedApp.vehicle_type}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-white/[0.03] p-6 rounded-[28px] border border-slate-100 dark:border-white/5">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Modelo</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase">{selectedApp.vehicle_model}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-white/[0.03] p-6 rounded-[28px] border border-slate-100 dark:border-white/5">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Placa</p>
                        <p className="text-sm font-black text-primary uppercase">{selectedApp.vehicle_plate}</p>
                      </div>
                    </div>

                    <div className="pt-6 flex items-center gap-4">
                      <button disabled={actionLoading || selectedApp.status !== 'pending'} onClick={() => handleApprove(selectedApp)} className="flex-1 h-20 bg-emerald-500 text-white rounded-[32px] font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-3">
                        {actionLoading ? 'Processando...' : <>Aprovar Cadastro <span className="material-symbols-outlined text-sm">verified</span></>}
                      </button>
                      <button disabled={actionLoading || selectedApp.status !== 'pending'} onClick={() => handleReject(selectedApp.id)} className="w-1/3 h-20 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-[32px] font-black uppercase text-[11px] tracking-[0.2em] transition-all">Rejeitar</button>
                    </div>
                  </div>

                  <div className="lg:col-span-5 space-y-6">
                    {[{ label: 'CNH (Frente)', url: selectedApp.document_cnh }, { label: 'CRLV (Documento)', url: selectedApp.document_vehicle }].map((doc, idx) => (
                      <div key={idx} className="space-y-3">
                        <div className="flex items-center justify-between px-2">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{doc.label}</p>
                          <a href={doc.url} target="_blank" rel="noreferrer" className="text-[9px] font-black text-primary uppercase underline">Abrir</a>
                        </div>
                        <div className="aspect-video bg-slate-100 dark:bg-white/[0.02] rounded-[32px] overflow-hidden border border-slate-100 dark:border-white/5 shadow-inner group">
                          {doc.url ? <img src={doc.url} className="size-full object-cover group-hover:scale-105 transition-transform duration-700" alt={doc.label} /> : <div className="size-full flex items-center justify-center text-slate-300">Sem foto</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DriverApplicationsTab;
