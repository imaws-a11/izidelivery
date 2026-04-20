import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

interface NotificationBroadcast {
  id: string;
  created_at: string;
  title: string;
  message: string;
  target_type: 'all' | 'users' | 'drivers' | 'specific';
  type: 'push' | 'popup' | 'both';
  image_url?: string;
  status: 'sent' | 'scheduled';
}

const NotificationsTab = () => {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<NotificationBroadcast[]>([]);
  
  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<'all' | 'users' | 'drivers' | 'specific'>('all');
  const [notifType, setNotifType] = useState<'push' | 'popup' | 'both'>('push');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [menuItem, setMenuItem] = useState<NotificationBroadcast | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from('broadcast_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (!error && data) setHistory(data);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `notifs/${fileName}`;

      const { data, error } = await supabase.storage
        .from('banners')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('banners')
        .getPublicUrl(filePath);

      setImageUrl(publicUrl);
    } catch (err: any) {
      alert('Erro no upload: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async () => {
    if (!title || !message) {
      alert('Título e mensagem são obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('broadcast_notifications')
        .insert({
          title,
          message,
          target_type: target,
          type: notifType,
          image_url: imageUrl || null,
          status: 'sent'
        });

      if (error) throw error;

      // Disparar Push via Edge Function se necessário
      if (notifType === 'push' || notifType === 'both') {
        const { error: fnError } = await supabase.functions.invoke('broadcast-push', {
          body: {
            target_type: target,
            title,
            message,
            image_url: imageUrl || null
          }
        });
        if (fnError) console.error('Erro ao disparar broadcast push:', fnError);
      }

      // Reset form
      setTitle('');
      setMessage('');
      setImageUrl('');
      fetchHistory();
      alert('Notificação disparada com sucesso!');
    } catch (err: any) {
      alert('Erro ao enviar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplate = (item: NotificationBroadcast) => {
    setTitle(item.title);
    setMessage(item.message);
    setTarget(item.target_type);
    setNotifType(item.type);
    setImageUrl(item.image_url || '');
    setMenuItem(null);
    // Scroll para o topo para mostrar o formulário preenchido
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResendDirectly = async (item: NotificationBroadcast) => {
    setLoading(true);
    setMenuItem(null);
    try {
      const { error } = await supabase
        .from('broadcast_notifications')
        .insert({
          title: item.title,
          message: item.message,
          target_type: item.target_type,
          type: item.type,
          image_url: item.image_url || null,
          status: 'sent'
        });

      if (error) throw error;

      // Disparar Push via Edge Function se necessário
      if (item.type === 'push' || item.type === 'both') {
        await supabase.functions.invoke('broadcast-push', {
          body: {
            target_type: item.target_type,
            title: item.title,
            message: item.message,
            image_url: item.image_url || null
          }
        });
      }

      fetchHistory();
      alert('Notificação reenviada com sucesso!');
    } catch (err: any) {
      alert('Erro ao reenviar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Central de Notificações</h2>
        <p className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Gestão de Push e In-App Popups</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Enviar Notificação */}
        <section className="bg-white dark:bg-slate-900 rounded-[48px] p-10 border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
           <div className="flex items-center gap-4 mb-2">
              <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                 <span className="material-symbols-outlined font-black">campaign</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Nova Transmissão</h3>
           </div>

           <div className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Título da Notificação</label>
                 <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Super Promoção Izi! 🍔"
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-3xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                 />
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Mensagem / Conteúdo</label>
                 <textarea 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Descreva o conteúdo da notificação..."
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-[32px] px-6 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[120px]"
                 />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Público Alvo</label>
                    <select 
                       value={target}
                       onChange={(e) => setTarget(e.target.value as any)}
                       className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-full px-6 py-4 text-sm font-bold focus:outline-none appearance-none"
                    >
                       <option value="all">Todos (Apps)</option>
                       <option value="users">Apenas Usuários</option>
                       <option value="drivers">Apenas Entregadores</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Tipo de Alerta</label>
                    <select 
                       value={notifType}
                       onChange={(e) => setNotifType(e.target.value as any)}
                       className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-full px-6 py-4 text-sm font-bold focus:outline-none appearance-none"
                    >
                       <option value="push">Push Notification</option>
                       <option value="popup">In-App Popup (Card)</option>
                       <option value="both">Push + In-App Card</option>
                    </select>
                 </div>
              </div>

              {(notifType === 'popup' || notifType === 'both') && (
                <div className="space-y-4 animate-in slide-in-from-top-4">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Imagem do Card (Arquivo)</label>
                   
                   <div className="flex flex-col gap-4">
                      {imageUrl ? (
                        <div className="relative w-full h-40 rounded-[32px] overflow-hidden group">
                           <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                              <button 
                                onClick={() => setImageUrl('')}
                                className="size-12 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg"
                              >
                                <span className="material-symbols-outlined">delete</span>
                              </button>
                           </div>
                        </div>
                      ) : (
                        <label className={`w-full h-40 rounded-[32px] border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all
                           ${uploading ? 'bg-slate-50 border-slate-200' : 'bg-slate-50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/40'}`}
                        >
                           <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                           {uploading ? (
                             <>
                                <div className="size-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enviando Arquivo...</p>
                             </>
                           ) : (
                             <>
                                <div className="size-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                                   <span className="material-symbols-outlined text-slate-400">add_photo_alternate</span>
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clique para selecionar imagem</p>
                             </>
                           )}
                        </label>
                      )}
                   </div>
                </div>
              )}

              <button 
                onClick={handleSend}
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-slate-900 font-black py-5 rounded-full shadow-xl shadow-primary/20 uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? (
                   <div className="size-5 border-2 border-slate-900/20 border-t-slate-900 rounded-full animate-spin" />
                ) : (
                   <>
                      <span className="material-symbols-outlined text-xl">send</span>
                      Disparar Notificações
                   </>
                )}
              </button>
           </div>
        </section>

        {/* Histórico Recente */}
        <section className="space-y-6">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-6">Transmissões Recentes</h3>
           <div className="space-y-4">
              {history.map((item) => (
                <motion.div 
                   key={item.id}
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   onClick={() => setMenuItem(item)}
                   className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-[32px] flex items-center gap-5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 cursor-pointer transition-all group relative overflow-hidden"
                >
                   <div className={`size-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                      item.type === 'push' ? 'bg-blue-500/10 text-blue-500' : 
                      item.type === 'popup' ? 'bg-purple-500/10 text-purple-500' : 
                      'bg-amber-500/10 text-amber-500'
                   }`}>
                      <span className="material-symbols-outlined text-2xl font-black">
                         {item.type === 'push' ? 'notifications_active' : 'ad_units'}
                      </span>
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-slate-900 dark:text-white truncate uppercase italic">{item.title}</p>
                      <p className="text-xs text-slate-500 line-clamp-1">{item.message}</p>
                   </div>
                   <div className="text-right shrink-0">
                      <p className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-tighter">
                         {new Date(item.created_at).toLocaleDateString('pt-BR')}
                      </p>
                      <span className="text-[8px] font-black bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-full uppercase">Enviado</span>
                   </div>

                   {/* Indicador de Hover */}
                   <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-primary">more_vert</span>
                   </div>
                </motion.div>
              ))}

              <AnimatePresence>
                {menuItem && (
                   <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setMenuItem(null)}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                      />
                      <motion.div 
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="relative w-full max-w-xs bg-white dark:bg-slate-900 rounded-[40px] p-8 shadow-2xl border-4 border-white dark:border-slate-800 space-y-6"
                      >
                         <div className="text-center space-y-2">
                            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase italic">Opções da Transmissão</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{menuItem.title}</p>
                         </div>

                         <div className="flex flex-col gap-3">
                            <button 
                              onClick={() => loadTemplate(menuItem)}
                              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-primary hover:text-slate-900 transition-all font-black text-[10px] uppercase tracking-widest"
                            >
                               <span className="material-symbols-outlined text-sm">edit_note</span>
                               Editar & Carregar
                            </button>
                            <button 
                              onClick={() => handleResendDirectly(menuItem)}
                              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-emerald-500 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest"
                            >
                               <span className="material-symbols-outlined text-sm">replay</span>
                               Disparar Novamente
                            </button>
                            <button 
                              onClick={() => setMenuItem(null)}
                              className="w-full py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest"
                            >
                               Cancelar
                            </button>
                         </div>
                      </motion.div>
                   </div>
                )}
              </AnimatePresence>

              {history.length === 0 && (
                 <div className="py-20 text-center opacity-30">
                    <span className="material-symbols-outlined text-6xl mb-4">history_toggle_off</span>
                    <p className="text-xs font-black uppercase tracking-widest">Nenhuma transmissão encontrada</p>
                 </div>
              )}
           </div>
        </section>
      </div>
    </div>
  );
};

export default NotificationsTab;
