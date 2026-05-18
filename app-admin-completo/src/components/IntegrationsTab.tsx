import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';
import { supabase } from '../lib/supabase';
import { toastSuccess, toastError, toastInfo } from '../lib/useToast';

export default function IntegrationsTab() {
  const { userRole, merchantProfile } = useAdmin();
  const [activeSubTab, setActiveSubTab] = useState<'api' | 'whatsapp'>('api');
  
  // API Keys States
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [newLabel, setNewLabel] = useState('');

  // WhatsApp Chatbot States
  const [whatsappSettings, setWhatsappSettings] = useState<any>({
    is_active: false,
    phone_number: '',
    operation_mode: 'copilot',
    welcome_message: 'Olá! Sou o assistente virtual da nossa loja. Envie o seu pedido ou os detalhes da entrega por texto ou áudio que organizamos tudo para você!',
    ai_instructions: 'Trate o cliente com extrema cordialidade. Não aceitamos pedidos fora do horário comercial (08:00 às 23:00). Nossos produtos são todos perecíveis e frágeis.',
    instance_name: ''
  });
  const [loadingWhatsapp, setLoadingWhatsapp] = useState(false);
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [qrProgress, setQrProgress] = useState(0);

  // Simulated live logs of WhatsApp AI parser
  const [simulatedLogs, setSimulatedLogs] = useState<any[]>([
    {
      id: 1,
      customer: 'Carlos (79) 99888-1122',
      time: 'Há 5 minutos',
      address: 'Av. Paulista, 1500 - Bela Vista',
      neighborhood: 'Bela Vista',
      payment: 'PIX (Pago na Loja)',
      fee: 12.50,
      status: 'success',
      statusText: 'Rascunho Criado',
      details: 'Pedido parsed com sucesso e injetado nos rascunhos do painel.'
    },
    {
      id: 2,
      customer: 'Ana Beatriz (79) 99911-3344',
      time: 'Há 12 minutos',
      address: 'Rua Haddock Lobo, 400 - Jardins',
      neighborhood: 'Jardins',
      payment: 'Dinheiro (Troco para R$ 50)',
      fee: 10.00,
      status: 'auto_dispatched',
      statusText: 'Despachado Automático',
      details: 'Carteira possui saldo suficiente. Piloto chamado com sucesso!'
    },
    {
      id: 3,
      customer: 'Marcos Souza (79) 99822-4455',
      time: 'Há 1 hora',
      address: 'Rua Bela Cintra, 800 - Consolação',
      neighborhood: 'Consolação',
      payment: 'Cartão de Crédito',
      fee: 11.00,
      status: 'no_balance',
      statusText: 'Aguardando Saldo',
      details: 'Saldo de carteira insuficiente (Saldo: R$ 4,50). Alerta Pix enviado no chat.'
    }
  ]);

  // Fetch keys for the current merchant
  const fetchKeys = async () => {
    if (userRole !== 'merchant') return;
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    const activeMerchantId = user?.id || merchantProfile?.id;
    
    if (!activeMerchantId) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('merchant_api_keys')
      .select('*')
      .eq('merchant_id', activeMerchantId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setApiKeys(data || []);
    }
    setLoading(false);
  };

  // Fetch WhatsApp Settings
  const fetchWhatsappSettings = async () => {
    if (userRole !== 'merchant') return;
    setLoadingWhatsapp(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const activeMerchantId = user?.id || merchantProfile?.id;
      if (!activeMerchantId) return;

      const { data, error } = await supabase
        .from('whatsapp_bot_settings')
        .select('*')
        .eq('merchant_id', activeMerchantId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setWhatsappSettings(data);
      } else {
        const initial = {
          merchant_id: activeMerchantId,
          is_active: false,
          phone_number: '',
          operation_mode: 'copilot',
          welcome_message: 'Olá! Sou o assistente virtual da nossa loja. Envie o seu pedido ou os detalhes da entrega por texto ou áudio que organizamos tudo para você!',
          ai_instructions: 'Trate o cliente com extrema cordialidade. Não aceitamos pedidos fora do horário comercial (08:00 às 23:00). Nossos produtos são todos perecíveis e frágeis.',
          instance_name: `izi_instance_${activeMerchantId.substring(0, 8)}`
        };
        const { data: created, error: insertError } = await supabase
          .from('whatsapp_bot_settings')
          .insert([initial])
          .select()
          .single();
        if (!insertError && created) {
          setWhatsappSettings(created);
        }
      }
    } catch (err: any) {
      console.error('Erro ao buscar configurações do WhatsApp:', err);
    } finally {
      setLoadingWhatsapp(false);
    }
  };

  useEffect(() => {
    fetchKeys();
    fetchWhatsappSettings();
  }, [userRole, merchantProfile]);

  const generateKey = async () => {
    if (!newLabel.trim()) {
      toastError('Dê um nome para identificar a chave (ex: TchauFome)');
      return;
    }
    setGenerating(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    const activeMerchantId = user?.id || merchantProfile?.id;

    if (!activeMerchantId) {
      toastError('Erro ao identificar o lojista logado.');
      setGenerating(false);
      return;
    }
    
    const randomToken = `sk_izi_${crypto.randomUUID().replace(/-/g, '')}${Math.random().toString(36).substring(2, 10)}`;

    const { error } = await supabase
      .from('merchant_api_keys')
      .insert({
        merchant_id: activeMerchantId,
        api_key: randomToken,
        label: newLabel.trim()
      });

    if (error) {
      toastError('Erro ao gerar chave: ' + error.message);
    } else {
      toastSuccess('Chave de API gerada com sucesso!');
      setNewLabel('');
      await fetchKeys();
    }
    setGenerating(false);
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('merchant_api_keys')
      .update({ is_active: !currentStatus })
      .eq('id', id);
    if (!error) {
      fetchKeys();
      toastSuccess(`Chave ${currentStatus ? 'desativada' : 'ativada'}.`);
    } else {
      toastError('Erro ao atualizar status.');
    }
  };

  const revokeKey = async (id: string) => {
    if (!confirm("Tem certeza que deseja revogar e excluir permanentemente esta chave? Quem estiver usando ela perderá o acesso imediatamente.")) return;
    const { error } = await supabase
      .from('merchant_api_keys')
      .delete()
      .eq('id', id);
    if (!error) {
      fetchKeys();
      toastSuccess('Chave revogada.');
    } else {
      toastError('Erro ao revogar chave.');
    }
  };

  const handleSaveWhatsappSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingWhatsapp(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const activeMerchantId = user?.id || merchantProfile?.id;
      if (!activeMerchantId) throw new Error('Lojista não identificado.');

      const { error } = await supabase
        .from('whatsapp_bot_settings')
        .upsert({
          ...whatsappSettings,
          merchant_id: activeMerchantId,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      toastSuccess('Configurações do WhatsApp IA salvas no Supabase!');
    } catch (err: any) {
      toastError('Erro ao salvar configurações: ' + err.message);
    } finally {
      setSavingWhatsapp(false);
    }
  };

  // Simulated QR Code generator progress
  const startQrSimulation = () => {
    setShowQrCode(true);
    setQrProgress(0);
    const interval = setInterval(() => {
      setQrProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          // Simulate dynamic connection after 3 seconds of QR code display
          setTimeout(() => {
            setWhatsappSettings((prevSettings: any) => ({
              ...prevSettings,
              phone_number: '+55 (79) 99888-7766',
              is_active: true
            }));
            setShowQrCode(false);
            toastSuccess('Instância pareada via QR Code com sucesso!');
          }, 3000);
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  const disconnectWhatsapp = async () => {
    if (!confirm('Desconectar sua instância do WhatsApp? O bot parará de receber mensagens imediatamente.')) return;
    const updated = {
      ...whatsappSettings,
      phone_number: '',
      is_active: false
    };
    setWhatsappSettings(updated);
    
    // Save to DB
    const { data: { user } } = await supabase.auth.getUser();
    const activeMerchantId = user?.id || merchantProfile?.id;
    if (activeMerchantId) {
      await supabase
        .from('whatsapp_bot_settings')
        .upsert({
          ...updated,
          merchant_id: activeMerchantId,
          updated_at: new Date().toISOString()
        });
    }
    toastInfo('Instância desconectada.');
  };

  if (userRole !== 'merchant') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-xl font-bold text-slate-400">Página exclusiva para lojistas.</h2>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 font-sans">
      
      {/* Tab Header Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
              <span className="material-symbols-outlined text-indigo-500">settings_input_component</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-tight tracking-tight uppercase italic">
              Integrações Logísticas
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-bold mt-1 ml-1 text-xs uppercase tracking-wider">
            Escolha o canal logístico ideal para turbinar seu faturamento
          </p>
        </div>

        {/* Tab Toggle (Claymorphic Horizontal Selector) */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 w-fit shrink-0">
          <button
            onClick={() => setActiveSubTab('api')}
            className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
              activeSubTab === 'api'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">api</span>
            Chaves de API
          </button>
          <button
            onClick={() => setActiveSubTab('whatsapp')}
            className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all relative ${
              activeSubTab === 'whatsapp'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">chat</span>
            WhatsApp IA Bot
            <span className={`size-2 rounded-full absolute top-2 right-2 animate-ping ${whatsappSettings.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'api' ? (
          <motion.div
            key="api_tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {/* API Keys Panel */}
            <section className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
              <div className="bg-indigo-50 dark:bg-indigo-500/5 p-6 rounded-[32px] border border-indigo-100 dark:border-indigo-500/20 flex flex-col md:flex-row items-center gap-4 mb-10">
                <div className="flex-1 w-full">
                   <h3 className="text-base font-black text-slate-900 dark:text-white mb-1">Gerar Nova Chave</h3>
                   <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Crie tokens de acesso para seus parceiros ou ERPs.</p>
                </div>
                <div className="flex-1 w-full flex items-center gap-3">
                  <input 
                    type="text" 
                    placeholder="Nome do App Parceiro (ex: TchauFome)"
                    value={newLabel}
                    onChange={e => setNewLabel(e.target.value)}
                    className="w-full bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none dark:text-white shadow-sm"
                  />
                  <button 
                    onClick={generateKey}
                    disabled={generating}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white font-black text-xs uppercase tracking-widest px-6 py-4 rounded-2xl shadow-lg shadow-indigo-500/30 transition-all active:scale-95 whitespace-nowrap disabled:opacity-50"
                  >
                    {generating ? 'Gerando...' : 'Gerar Chave'}
                  </button>
                </div>
              </div>

              <div>
                 <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6 ml-2">Suas Chaves Ativas</h3>
                 
                 {loading ? (
                   <div className="animate-pulse flex flex-col gap-4">
                      <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl w-full"></div>
                      <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl w-full"></div>
                   </div>
                 ) : apiKeys.length === 0 ? (
                   <div className="text-center py-12 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[32px]">
                      <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">key_off</span>
                      <p className="text-slate-500 font-bold">Nenhuma chave de API gerada ainda.</p>
                   </div>
                 ) : (
                   <div className="space-y-4">
                      {apiKeys.map(key => (
                        <div key={key.id} className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-[28px] border transition-all ${key.is_active ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 opacity-70'}`}>
                           <div className="flex items-center gap-4">
                              <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 ${key.is_active ? 'bg-indigo-50 text-indigo-500' : 'bg-slate-200 text-slate-400'}`}>
                                <span className="material-symbols-outlined">{key.is_active ? 'vpn_key' : 'lock'}</span>
                              </div>
                              <div>
                                 <h4 className="text-base font-black text-slate-900 dark:text-white truncate">{key.label}</h4>
                                 <div className="flex items-center gap-2 mt-1">
                                   <code className="text-[11px] font-bold bg-slate-100 dark:bg-slate-900 text-slate-500 px-2 py-0.5 rounded-lg font-mono">
                                     {key.api_key}
                                   </code>
                                   <button onClick={() => {
                                     navigator.clipboard.writeText(key.api_key);
                                     toastSuccess('Copiado!');
                                   }} className="text-indigo-500 hover:text-indigo-600">
                                     <span className="material-symbols-outlined text-sm">content_copy</span>
                                   </button>
                                 </div>
                              </div>
                           </div>
                           <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
                              <div className="text-right hidden sm:block">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Criado em</p>
                                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{new Date(key.created_at).toLocaleDateString('pt-BR')}</p>
                              </div>
                              <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-2 hidden sm:block"></div>
                              <button 
                                onClick={() => toggleStatus(key.id, key.is_active)}
                                className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${key.is_active ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                              >
                                {key.is_active ? 'Pausar' : 'Ativar'}
                              </button>
                              <button 
                                onClick={() => revokeKey(key.id)}
                                className="size-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-100 transition-all shrink-0"
                                title="Revogar chave"
                              >
                                <span className="material-symbols-outlined text-lg">delete_forever</span>
                              </button>
                           </div>
                        </div>
                      ))}
                   </div>
                 )}
              </div>
            </section>
          </motion.div>
        ) : (
          <motion.div
            key="whatsapp_tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Left 2 Columns: Main Setup Forms */}
            <div className="lg:col-span-2 space-y-8">
              <form onSubmit={handleSaveWhatsappSettings} className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 p-8 md:p-10 shadow-sm space-y-10">
                
                {/* Connection Status Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                    <div className="size-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                      <span className="material-symbols-outlined text-xl font-bold">whatsapp</span>
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.15em] leading-none mb-1">
                        Status de Conexão WhatsApp
                      </h2>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pareamento em tempo real com seu dispositivo</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className={`size-14 rounded-2xl flex items-center justify-center shrink-0 ${whatsappSettings.is_active ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                        <span className="material-symbols-outlined text-2xl font-bold">
                          {whatsappSettings.is_active ? 'phone_iphone' : 'phonelink_erase'}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`size-2.5 rounded-full ${whatsappSettings.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                          <h4 className="text-sm font-black text-slate-900 dark:text-white">
                            {whatsappSettings.is_active ? 'Dispositivo Conectado' : 'Aguardando Pareamento'}
                          </h4>
                        </div>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                          {whatsappSettings.is_active ? `Número ativo: ${whatsappSettings.phone_number}` : 'Vincule seu WhatsApp Business para receber as entregas avulsas.'}
                        </p>
                      </div>
                    </div>

                    <div>
                      {whatsappSettings.is_active ? (
                        <button
                          type="button"
                          onClick={disconnectWhatsapp}
                          className="px-5 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                        >
                          Desconectar
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={startQrSimulation}
                          className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/25 active:scale-95"
                        >
                          Gerar QR Code
                        </button>
                      )}
                    </div>
                  </div>

                  {/* QR Code Progress Simulated Panel */}
                  <AnimatePresence>
                    {showQrCode && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="border border-slate-100 dark:border-slate-800 rounded-[32px] p-8 flex flex-col items-center justify-center bg-white dark:bg-slate-950 space-y-6">
                          <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                            Escaneie com o WhatsApp no celular
                          </p>

                          {qrProgress < 100 ? (
                            <div className="flex flex-col items-center justify-center h-48 space-y-4">
                              <span className="material-symbols-outlined text-4xl text-emerald-500 animate-spin">sync</span>
                              <div className="w-48 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${qrProgress}%` }}></div>
                              </div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Iniciando instância segura...</p>
                            </div>
                          ) : (
                            <div className="bg-white p-4 rounded-3xl border-4 border-emerald-500 shadow-xl relative group">
                              <svg className="size-48 text-slate-950" viewBox="0 0 100 100">
                                <path fill="currentColor" d="M0,0 h30 v10 h-20 v20 h-10 z M70,0 h30 v30 h-10 v-20 h-20 z M0,70 h10 v20 h20 v10 h-30 z M90,90 v-20 h10 v30 h-30 v-10 z M15,15 h10 v10 h-10 z M20,25 h5 v5 h-5 z M75,15 h10 v10 h-10 z M15,75 h10 v10 h-10 z M45,45 h10 v10 h-10 z M35,35 h5 v5 h-5 z M60,60 h5 v5 h-5 z M45,15 h10 v5 h-10 z M15,45 h5 v10 h-5 z M75,45 h10 v5 h-10 z M45,75 h5 v10 h-5 z M60,35 h15 v5 h-15 z" />
                                <rect fill="currentColor" x="40" y="40" width="8" height="8" rx="1" />
                                <rect fill="currentColor" x="65" y="70" width="10" height="10" rx="1.5" />
                              </svg>
                              <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px] rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white text-[10px] font-black uppercase tracking-widest">Validade: 60s</span>
                              </div>
                            </div>
                          )}

                          <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 dark:bg-rose-950/20 px-3 py-1.5 rounded-lg border border-rose-100 dark:border-rose-500/10">
                            Aviso: Não compartilhe esta tela com terceiros.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Operation Mode */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                    <div className="size-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                      <span className="material-symbols-outlined text-xl font-bold">psychology</span>
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.15em] leading-none mb-1">
                        Modo de Operação Logística
                      </h2>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nível de autonomia da Inteligência Artificial</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Copilot Option */}
                    <button
                      type="button"
                      onClick={() => setWhatsappSettings({ ...whatsappSettings, operation_mode: 'copilot' })}
                      className={`p-6 rounded-[32px] border-2 text-left transition-all active:scale-[0.98] ${
                        whatsappSettings.operation_mode === 'copilot'
                          ? 'border-indigo-500 bg-indigo-500/5 text-slate-900 dark:text-white shadow-lg shadow-indigo-500/5'
                          : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className={`size-11 rounded-2xl flex items-center justify-center ${whatsappSettings.operation_mode === 'copilot' ? 'bg-indigo-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                          <span className="material-symbols-outlined">assignment</span>
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] bg-indigo-100 dark:bg-indigo-950 text-indigo-600 px-2.5 py-1.5 rounded-lg border border-indigo-200/20">
                          Semiautomático
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white mb-1">📋 Assistente Copiloto</h4>
                      <p className="text-xs font-bold text-slate-400 leading-relaxed">
                        A IA analisa as mensagens recebidas e monta um rascunho de Entrega Avulsa pré-preenchido no seu painel. Você só precisa clicar em um único botão para aprovar e despachar.
                      </p>
                    </button>

                    {/* Auto-Pilot Option */}
                    <button
                      type="button"
                      onClick={() => setWhatsappSettings({ ...whatsappSettings, operation_mode: 'auto' })}
                      className={`p-6 rounded-[32px] border-2 text-left transition-all active:scale-[0.98] ${
                        whatsappSettings.operation_mode === 'auto'
                          ? 'border-emerald-500 bg-emerald-500/5 text-slate-900 dark:text-white shadow-lg shadow-emerald-500/5'
                          : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className={`size-11 rounded-2xl flex items-center justify-center ${whatsappSettings.operation_mode === 'auto' ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                          <span className="material-symbols-outlined">smart_toy</span>
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] bg-emerald-100 dark:bg-emerald-950 text-emerald-600 px-2.5 py-1.5 rounded-lg border border-emerald-200/20">
                          100% Autônomo
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white mb-1">🤖 Piloto Automático</h4>
                      <p className="text-xs font-bold text-slate-400 leading-relaxed">
                        A IA interpreta o endereço, calcula as distâncias, cobra o saldo de frete na sua carteira pré-paga e aciona o piloto parceiro instantaneamente. Sem intervenção humana!
                      </p>
                    </button>
                  </div>
                </div>

                {/* AI Tuning Settings */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                    <div className="size-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                      <span className="material-symbols-outlined text-xl font-bold">tune</span>
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.15em] leading-none mb-1">
                        Ajustes da IA Parser
                      </h2>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Instruções comportamentais do seu robô</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {/* Welcome Message */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">
                        Mensagem de Boas-Vindas Automatizada
                      </label>
                      <textarea
                        value={whatsappSettings.welcome_message}
                        onChange={e => setWhatsappSettings({ ...whatsappSettings, welcome_message: e.target.value })}
                        placeholder="Escreva a resposta de recepção enviada aos clientes..."
                        className="w-full h-24 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm resize-none"
                      />
                    </div>

                    {/* AI Prompt / Instructions */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">
                        Regras do Lojista (Instruções Comportamentais para o Parser)
                      </label>
                      <textarea
                        value={whatsappSettings.ai_instructions}
                        onChange={e => setWhatsappSettings({ ...whatsappSettings, ai_instructions: e.target.value })}
                        placeholder="Ex: Não aceitamos pedidos após as 23h. Nossos produtos são todos perecíveis e frágeis."
                        className="w-full h-24 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm resize-none"
                      />
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider ml-3 leading-relaxed">
                        A IA lerá estas instruções no prompt antes de decidir se cria o rascunho de entrega ou responde ao cliente sobre limitações de entrega.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingWhatsapp || loadingWhatsapp}
                    className="px-10 py-4.5 bg-indigo-500 hover:bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {savingWhatsapp ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column: Console/Live Logs */}
            <div className="space-y-8">
              <div className="bg-slate-900 text-slate-200 rounded-[40px] p-8 border border-slate-800 shadow-2xl relative overflow-hidden h-[680px] flex flex-col font-sans">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[60px]" />
                
                {/* Console Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-5 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="size-2 bg-emerald-500 rounded-full animate-ping" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Console de IA Ativo</span>
                  </div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Real-time Webhook</span>
                </div>

                {/* Console Log Body */}
                <div className="flex-1 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent pr-1">
                  {simulatedLogs.map(log => (
                    <div key={log.id} className="bg-slate-950/60 p-4.5 rounded-3xl border border-slate-800 space-y-3 font-mono text-[11px] relative overflow-hidden group">
                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-black text-slate-300">{log.customer}</p>
                          <p className="text-[8px] text-slate-600 uppercase font-black">{log.time}</p>
                        </div>

                        {log.status === 'success' && (
                          <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded text-[8px] font-black uppercase">
                            {log.statusText}
                          </span>
                        )}
                        {log.status === 'auto_dispatched' && (
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[8px] font-black uppercase">
                            {log.statusText}
                          </span>
                        )}
                        {log.status === 'no_balance' && (
                          <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded text-[8px] font-black uppercase">
                            {log.statusText}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5 border-t border-slate-900 pt-2.5 text-slate-400">
                        <p className="truncate"><span className="text-slate-600 font-bold uppercase">Endereço:</span> {log.address}</p>
                        <p><span className="text-slate-600 font-bold uppercase">Bairro:</span> {log.neighborhood}</p>
                        <p><span className="text-slate-600 font-bold uppercase">Cobrança:</span> {log.payment}</p>
                        <p><span className="text-slate-600 font-bold uppercase">Taxa:</span> R$ {log.fee.toFixed(2)}</p>
                      </div>

                      <div className="bg-slate-900/50 p-2.5 rounded-xl text-[9px] text-slate-500 leading-normal border border-slate-800/40">
                        {log.details}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Console Stats Footer */}
                <div className="border-t border-slate-800 pt-4 mt-6 flex justify-between items-center text-[10px] text-slate-500">
                  <span>Modo Atual: <strong className="text-indigo-400 uppercase">{whatsappSettings.operation_mode}</strong></span>
                  <span>Extrações Hoje: <strong className="text-white">12</strong></span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
