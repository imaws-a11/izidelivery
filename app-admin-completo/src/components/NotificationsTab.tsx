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

interface PushTemplate {
  title: string;
  message: string;
}

const NotificationsTab = () => {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<NotificationBroadcast[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  
  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<'all' | 'users' | 'drivers' | 'specific'>('all');
  const [notifType, setNotifType] = useState<'push' | 'popup' | 'both'>('push');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [menuItem, setMenuItem] = useState<NotificationBroadcast | null>(null);

  // Templates State
  const [templates, setTemplates] = useState<Record<string, PushTemplate>>({});
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
    fetchTemplates();
  }, []);

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from('broadcast_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (!error && data) setHistory(data);
  };

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from('app_settings_delivery')
      .select('push_templates')
      .limit(1)
      .single();
    
    if (!error && data?.push_templates) {
      setTemplates(data.push_templates);
    }
  };

  const handleSaveTemplate = async (key: string, title: string, message: string) => {
    setLoading(true);
    try {
      const newTemplates = { ...templates, [key]: { title, message } };
      
      const { data: settings } = await supabase.from('app_settings_delivery').select('id').limit(1).single();
      if (settings?.id) {
        const { error } = await supabase
          .from('app_settings_delivery')
          .update({ push_templates: newTemplates })
          .eq('id', settings.id);
          
        if (error) throw error;
        setTemplates(newTemplates);
        setEditingTemplate(null);
        alert('Template salvo com sucesso!');
      }
    } catch (err: any) {
      alert('Erro ao salvar template: ' + err.message);
    } finally {
      setLoading(false);
    }
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

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta transmissão do histórico?')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('broadcast_notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setHistory(prev => prev.filter(item => item.id !== id));
      setMenuItem(null);
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      alert('Transmissão excluída com sucesso!');
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;
    if (!confirm(`Tem certeza que deseja excluir as ${selectedItems.size} transmissões selecionadas?`)) return;

    setLoading(true);
    try {
      const idsToDelete = Array.from(selectedItems);
      const { error } = await supabase
        .from('broadcast_notifications')
        .delete()
        .in('id', idsToDelete);

      if (error) throw error;

      setHistory(prev => prev.filter(item => !selectedItems.has(item.id)));
      setSelectedItems(new Set());
      alert('Transmissões excluídas com sucesso!');
    } catch (err: any) {
      alert('Erro ao excluir em massa: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === history.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(history.map(item => item.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const templateNames: Record<string, string> = {
    'coin_purchase': 'Compra de IZI Coin',
    'izi_black': 'Assinatura IZI Black',
    'order_status_concluido': 'Pedido Entregue (Concluído)',
    'order_status_novo': 'Novo Pedido',
    'order_status_saiu_para_entrega': 'Saiu para Entrega',
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col gap-3 ml-6">
        <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Central de Notificações</h2>
        <p className="text-[10px] font-black text-slate-900 dark:text-slate-900 uppercase tracking-[0.4em] opacity-60">Gestão de Push e In-App Popups</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-10">
          {/* Enviar Notificação */}
          <section className="bg-white/40 backdrop-blur-2xl rounded-[48px] p-12 border border-white/50 shadow-xl space-y-10">
            <div className="flex items-center gap-5">
                <div className="size-14 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-inner">
                  <span className="material-symbols-outlined text-2xl font-black">campaign</span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Nova Transmissão</h3>
            </div>

            <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-6">Título da Notificação</label>
                  <input 
                      type="text" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ex: Super Promoção Izi! 🍔"
                      className="w-full bg-white/60 dark:bg-black/20 border border-white/80 dark:border-white/5 rounded-full px-8 py-5 text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-6">Mensagem / Conteúdo</label>
                  <textarea 
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Descreva o conteúdo da notificação..."
                      className="w-full bg-white/60 dark:bg-black/20 border border-white/80 dark:border-white/5 rounded-[40px] px-8 py-6 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[160px] shadow-inner"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-6">Público Alvo</label>
                      <div className="relative">
                        <select 
                          value={target}
                          onChange={(e) => setTarget(e.target.value as any)}
                          className="w-full bg-white/60 dark:bg-black/20 border border-white/80 dark:border-white/5 rounded-full px-8 py-5 text-sm font-black text-slate-900 dark:text-white focus:outline-none appearance-none shadow-inner cursor-pointer"
                        >
                          <option value="all">Todos (Apps)</option>
                          <option value="users">Apenas Usuários</option>
                          <option value="drivers">Apenas Entregadores</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-900">expand_more</span>
                      </div>
                  </div>
                  <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-6">Tipo de Alerta</label>
                      <div className="relative">
                        <select 
                          value={notifType}
                          onChange={(e) => setNotifType(e.target.value as any)}
                          className="w-full bg-white/60 dark:bg-black/20 border border-white/80 dark:border-white/5 rounded-full px-8 py-5 text-sm font-black text-slate-900 dark:text-white focus:outline-none appearance-none shadow-inner cursor-pointer"
                        >
                          <option value="push">Push Notification</option>
                          <option value="popup">In-App Popup</option>
                          <option value="both">Push + Popup</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-900">expand_more</span>
                      </div>
                  </div>
                </div>

                {(notifType === 'popup' || notifType === 'both') && (
                  <div className="space-y-4 animate-in slide-in-from-top-4">
                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-6">Imagem do Card</label>
                    
                    <div className="flex flex-col gap-4">
                        {imageUrl ? (
                          <div className="relative w-full h-52 rounded-[40px] overflow-hidden group shadow-lg">
                            <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                <button 
                                  onClick={() => setImageUrl('')}
                                  className="size-14 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all"
                                >
                                  <span className="material-symbols-outlined text-2xl font-black">delete</span>
                                </button>
                            </div>
                          </div>
                        ) : (
                          <label className={`w-full h-52 rounded-[40px] border-2 border-dashed flex flex-col items-center justify-center gap-4 cursor-pointer transition-all shadow-inner
                            ${uploading ? 'bg-white/30 border-slate-300' : 'bg-white/30 border-slate-300 hover:bg-white/50 border-primary/40'}`}
                          >
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                            {uploading ? (
                              <>
                                  <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                  <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Enviando Arquivo...</p>
                              </>
                            ) : (
                              <>
                                  <div className="size-14 rounded-2xl bg-white flex items-center justify-center shadow-md text-primary">
                                    <span className="material-symbols-outlined text-3xl">add_photo_alternate</span>
                                  </div>
                                  <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Selecione uma imagem promocional</p>
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
                  className="w-full bg-slate-900 hover:bg-black text-white font-black py-6 rounded-full shadow-2xl uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="size-6 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                        <span className="material-symbols-outlined text-2xl">send</span>
                        Disparar Campanha
                    </>
                  )}
                </button>
            </div>
          </section>

          {/* Templates do Sistema */}
          <section className="bg-white/40 backdrop-blur-2xl rounded-[48px] p-12 border border-white/50 shadow-xl space-y-10">
            <div className="flex items-center gap-5">
                <div className="size-14 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shadow-inner">
                  <span className="material-symbols-outlined text-2xl font-black">mark_email_unread</span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Templates do Sistema</h3>
            </div>
            <p className="text-[11px] font-bold text-slate-900 leading-relaxed uppercase opacity-60">Mensagens transacionais disparadas automaticamente por eventos do núcleo operacional.</p>
            
            <div className="space-y-6">
              {Object.entries(templateNames).map(([key, label]) => {
                const tpl = templates[key] || { title: '', message: '' };
                const isEditing = editingTemplate === key;

                return (
                  <div key={key} className={`p-8 rounded-[32px] border transition-all ${isEditing ? 'bg-white ring-2 ring-primary shadow-2xl' : 'bg-white/40 border-white/80 hover:bg-white/60 shadow-sm'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex flex-col">
                        <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">{label}</h4>
                        <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em] mt-1">{key}</span>
                      </div>
                      <button 
                        onClick={() => isEditing ? setEditingTemplate(null) : setEditingTemplate(key)}
                        className={`size-10 rounded-xl flex items-center justify-center transition-all ${isEditing ? 'bg-rose-500 text-white' : 'bg-primary/10 text-primary hover:bg-primary hover:text-slate-900'}`}
                      >
                        <span className="material-symbols-outlined text-xl font-black">{isEditing ? 'close' : 'edit'}</span>
                      </button>
                    </div>

                    {isEditing ? (
                      <form 
                        className="space-y-6 animate-in fade-in"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          handleSaveTemplate(key, formData.get('title') as string, formData.get('message') as string);
                        }}
                      >
                        <div className="space-y-2">
                          <label className="text-[8px] font-black text-slate-900 uppercase tracking-widest ml-4">Título</label>
                          <input 
                            name="title" 
                            defaultValue={tpl.title} 
                            placeholder="Título do Push"
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 text-sm font-black focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-inner"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[8px] font-black text-slate-900 uppercase tracking-widest ml-4">Corpo da Mensagem</label>
                          <textarea 
                            name="message" 
                            defaultValue={tpl.message} 
                            placeholder="Texto da mensagem..."
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[24px] px-6 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px] shadow-inner"
                            required
                          />
                        </div>
                        <button type="submit" disabled={loading} className="w-full py-4 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                          Atualizar Template
                        </button>
                      </form>
                    ) : (
                      <div className="space-y-3 bg-white/30 rounded-2xl p-4 border border-white/50 shadow-inner">
                        <p className="text-sm font-black text-slate-900">{tpl.title || 'Sem título configurado'}</p>
                        <p className="text-xs font-bold text-slate-900 opacity-60 leading-relaxed">{tpl.message || 'Sem mensagem configurada'}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Histórico Recente */}
        <section className="space-y-8">
          <div className="flex items-center justify-between ml-8 mr-2">
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.5em]">Histórico de Transmissões</h3>
            
            <div className="flex items-center gap-4">
              {history.length > 0 && (
                <button 
                  onClick={toggleSelectAll}
                  className="text-[9px] font-black text-primary uppercase tracking-widest hover:opacity-80 transition-opacity bg-primary/10 px-4 py-2 rounded-full border border-primary/20 shadow-sm"
                >
                  {selectedItems.size === history.length ? 'Desmarcar' : 'Marcar Todos'}
                </button>
              )}
              {selectedItems.size > 0 && (
                <button 
                  onClick={handleBulkDelete}
                  disabled={loading}
                  className="flex items-center gap-2 text-[9px] font-black bg-rose-500 text-white px-5 py-2.5 rounded-full uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm font-black">delete</span>
                  Excluir ({selectedItems.size})
                </button>
              )}
            </div>
          </div>
            <div className="space-y-5 max-h-[1200px] overflow-y-auto pr-4 custom-scrollbar">
              {history.map((item) => {
                const isSelected = selectedItems.has(item.id);
                return (
                <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`bg-white/40 backdrop-blur-xl border p-8 rounded-[40px] flex items-center gap-6 transition-all group relative overflow-hidden ${isSelected ? 'border-primary ring-2 ring-primary/20 shadow-2xl scale-[1.02] z-10' : 'border-white/80 hover:border-primary/40 shadow-sm'}`}
                >
                    <button 
                      onClick={() => toggleSelect(item.id)}
                      className={`shrink-0 size-7 rounded-xl border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary text-slate-900 shadow-lg shadow-primary/20' : 'border-slate-200 bg-white/50 text-transparent'}`}
                    >
                      <span className="material-symbols-outlined text-sm font-black">check</span>
                    </button>
                    
                    <div 
                      className={`size-16 rounded-[24px] flex items-center justify-center shrink-0 shadow-inner cursor-pointer transition-transform group-hover:scale-110 ${
                        item.type === 'push' ? 'bg-blue-500/10 text-blue-500' : 
                        item.type === 'popup' ? 'bg-purple-500/10 text-purple-500' : 
                        'bg-amber-500/10 text-amber-500'
                      }`}
                      onClick={() => setMenuItem(item)}
                    >
                      <span className="material-symbols-outlined text-3xl font-black">
                          {item.type === 'push' ? 'notifications_active' : 'ad_units'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setMenuItem(item)}>
                      <p className="text-lg font-black text-slate-900 truncate uppercase tracking-tight">{item.title}</p>
                      <p className="text-xs font-bold text-slate-900 opacity-60 line-clamp-1 mt-1 uppercase tracking-tight">{item.message}</p>
                    </div>
                    <div className="text-right shrink-0 cursor-pointer pl-4" onClick={() => setMenuItem(item)}>
                      <p className="text-[10px] font-black text-slate-900 uppercase tracking-tighter opacity-40">
                          {new Date(item.created_at).toLocaleDateString('pt-BR')}
                      </p>
                      <span className="text-[8px] font-black bg-emerald-500/10 text-emerald-500 px-3 py-1.5 rounded-full uppercase mt-2 inline-block shadow-sm">Enviado</span>
                    </div>

                    <div className="absolute right-6 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-primary">
                      <span className="material-symbols-outlined text-2xl font-black">more_horiz</span>
                    </div>
                </motion.div>
                );
              })}

              <AnimatePresence>
                {menuItem && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setMenuItem(null)}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
                      />
                      <motion.div 
                        initial={{ scale: 0.9, y: 30 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 30 }}
                        className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[56px] p-12 shadow-2xl border border-white/20 space-y-10"
                      >
                          <div className="text-center space-y-4">
                            <h4 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Operações</h4>
                            <div className="p-4 bg-slate-50 dark:bg-black/20 rounded-3xl border border-slate-100 dark:border-white/5">
                               <p className="text-[10px] text-slate-900 font-black uppercase tracking-widest opacity-60">Título da Transmissão</p>
                               <p className="text-sm font-black text-primary mt-1 uppercase">{menuItem.title}</p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-4">
                            <button 
                              onClick={() => loadTemplate(menuItem)}
                              className="w-full flex items-center justify-between p-6 rounded-[28px] bg-slate-50 dark:bg-slate-800/50 hover:bg-primary group transition-all"
                            >
                                <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover:text-slate-900">Editar & Carregar</span>
                                <span className="material-symbols-outlined text-xl font-black group-hover:text-slate-900 text-slate-400">edit_note</span>
                            </button>
                            <button 
                              onClick={() => handleResendDirectly(menuItem)}
                              className="w-full flex items-center justify-between p-6 rounded-[28px] bg-slate-50 dark:bg-slate-800/50 hover:bg-emerald-500 group transition-all"
                            >
                                <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover:text-white">Reenviar Agora</span>
                                <span className="material-symbols-outlined text-xl font-black group-hover:text-white text-slate-400">replay</span>
                            </button>
                            <button 
                              onClick={() => handleDelete(menuItem.id)}
                              className="w-full flex items-center justify-between p-6 rounded-[28px] bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white group transition-all"
                            >
                                <span className="text-xs font-black uppercase tracking-widest group-hover:text-white">Excluir Registro</span>
                                <span className="material-symbols-outlined text-xl font-black group-hover:text-white">delete</span>
                            </button>
                            <button 
                              onClick={() => setMenuItem(null)}
                              className="w-full py-6 text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.3em] opacity-40 hover:opacity-100 transition-opacity"
                            >
                                Fechar Menu
                            </button>
                          </div>
                      </motion.div>
                    </div>
                )}
              </AnimatePresence>

              {history.length === 0 && (
                  <div className="py-32 text-center opacity-20">
                    <span className="material-symbols-outlined text-8xl mb-6">history_toggle_off</span>
                    <p className="text-sm font-black uppercase tracking-[0.5em]">Histórico Vazio</p>
                  </div>
              )}
            </div>
        </section>
      </div>
    </div>
  );
};

export default NotificationsTab;
