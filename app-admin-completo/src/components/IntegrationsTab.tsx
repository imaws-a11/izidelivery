import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';
import { supabase } from '../lib/supabase';
import { toastSuccess, toastError } from '../lib/useToast';

export default function IntegrationsTab() {
  const { userRole, merchantProfile } = useAdmin();
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [newLabel, setNewLabel] = useState('');

  // Fetch keys for the current merchant
  const fetchKeys = async () => {
    if (userRole !== 'merchant' || !merchantProfile?.merchant_id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('merchant_api_keys')
      .select('*')
      .eq('merchant_id', merchantProfile.merchant_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setApiKeys(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchKeys();
  }, [userRole, merchantProfile]);

  const generateKey = async () => {
    if (!newLabel.trim()) {
      toastError('Dê um nome para identificar a chave (ex: TchauFome)');
      return;
    }
    setGenerating(true);
    
    // Generate a secure random token
    const randomToken = `sk_izi_${crypto.randomUUID().replace(/-/g, '')}${Math.random().toString(36).substring(2, 10)}`;

    const { error } = await supabase
      .from('merchant_api_keys')
      .insert({
        merchant_id: merchantProfile?.merchant_id,
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

  if (userRole !== 'merchant') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-xl font-bold text-slate-400">Página exclusiva para lojistas.</h2>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
              <span className="material-symbols-outlined text-indigo-500">api</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">API & Integrações</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1 ml-1">
            Conecte seu sistema Izi Delivery com plataformas externas (TchauFome, ERPs, etc).
          </p>
        </div>
        <a 
          href="/API_INTEGRATION_DOCS.md" 
          target="_blank"
          className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-base">description</span>
          Documentação da API
        </a>
      </div>

      {/* Main Section */}
      <section className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
        
        {/* Create Key Area */}
        <div className="bg-indigo-50 dark:bg-indigo-500/5 p-6 rounded-[32px] border border-indigo-100 dark:border-indigo-500/20 flex flex-col md:flex-row items-center gap-4 mb-10">
          <div className="flex-1 w-full">
             <h3 className="text-base font-black text-slate-900 dark:text-white mb-1">Gerar Nova Chave</h3>
             <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Crie tokens de acesso para seus parceiros.</p>
          </div>
          <div className="flex-1 w-full flex items-center gap-3">
            <input 
              type="text" 
              placeholder="Nome do App Parceiro (ex: TchauFome)"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 text-sm font-medium outline-none dark:text-white shadow-sm"
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

        {/* Keys List */}
        <div>
           <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6 ml-2">Suas Chaves Ativas</h3>
           
           {loading ? (
             <div className="animate-pulse flex flex-col gap-4">
                <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl w-full"></div>
                <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl w-full"></div>
             </div>
           ) : apiKeys.length === 0 ? (
             <div className="text-center py-10 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[32px]">
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
    </div>
  );
}
