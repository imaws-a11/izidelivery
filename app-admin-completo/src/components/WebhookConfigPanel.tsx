import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toastSuccess, toastError } from '../lib/useToast';

interface WebhookConfigPanelProps {
  storeId: string;
}

export default function WebhookConfigPanel({ storeId }: WebhookConfigPanelProps) {
  const [loading, setLoading] = useState(true);
  const [configId, setConfigId] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (storeId && !storeId.toString().startsWith('new-')) {
      fetchConfig();
    } else {
      setLoading(false);
    }
  }, [storeId]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('store_webhook_configs')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setConfigId(data.id);
        setWebhookUrl(data.webhook_url);
        setSecretKey(data.secret_key);
        setIsActive(data.is_active);
      }
    } catch (err: any) {
      toastError('Erro ao carregar webhook: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
    let secret = 'izi_wh_';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSecretKey(secret);
  };

  const handleSave = async () => {
    if (!webhookUrl || !secretKey) {
      toastError('A URL e a Chave Secreta são obrigatórias.');
      return;
    }

    try {
      setIsSaving(true);
      if (configId) {
        // Atualizar
        const { error } = await supabase
          .from('store_webhook_configs')
          .update({
            webhook_url: webhookUrl,
            secret_key: secretKey,
            is_active: isActive
          })
          .eq('id', configId);

        if (error) throw error;
        toastSuccess('Webhook atualizado com sucesso!');
      } else {
        // Criar
        const { data, error } = await supabase
          .from('store_webhook_configs')
          .insert({
            store_id: storeId,
            webhook_url: webhookUrl,
            secret_key: secretKey,
            is_active: isActive
          })
          .select()
          .single();

        if (error) throw error;
        setConfigId(data.id);
        toastSuccess('Webhook configurado com sucesso!');
      }
    } catch (err: any) {
      toastError('Erro ao salvar webhook: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="size-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="size-12 rounded-2xl bg-fuchsia-500/20 flex items-center justify-center text-fuchsia-500">
          <span className="material-symbols-outlined text-2xl">webhook</span>
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter">Integração via Webhook</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Receba os status dos pedidos no seu sistema em tempo real.</p>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/30 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">URL do Webhook (Endpoint)</label>
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 font-bold text-sm focus:ring-2 focus:ring-fuchsia-500 transition-all dark:text-white"
            placeholder="https://api.seusistema.com.br/izi/webhook"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Chave Secreta (HMAC-SHA256)</label>
          <div className="relative">
            <input
              type="text"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 font-bold text-sm focus:ring-2 focus:ring-fuchsia-500 transition-all dark:text-white"
              placeholder="Gere ou insira uma chave de segurança"
            />
            <button
              type="button"
              onClick={generateSecret}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all"
            >
              Gerar Nova
            </button>
          </div>
          <p className="text-[10px] font-bold text-slate-400 ml-4 mt-2">Usaremos esta chave para assinar os payloads (Header: <span className="font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded">x-izi-signature</span>)</p>
        </div>

        <div className="flex items-center justify-between pt-4">
          <div className="flex flex-col justify-center">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2">Status da Integração</label>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${isActive ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30'}`}
            >
              {isActive ? 'Ativo (Enviando Eventos)' : 'Pausado'}
            </button>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-fuchsia-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2 mt-6 disabled:opacity-50"
          >
            {isSaving ? <div className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <span className="material-symbols-outlined text-sm">save</span>}
            Salvar Configurações
          </button>
        </div>
      </div>
      
      <div className="bg-slate-900 p-8 rounded-[40px] text-white">
        <h4 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-fuchsia-400">code</span>
          Exemplo de Payload
        </h4>
        <pre className="text-xs font-mono text-slate-300 overflow-x-auto p-4 bg-black/40 rounded-2xl">
{`{
  "event": "order.status_updated",
  "created_at": "2026-05-14T14:35:00Z",
  "data": {
    "izi_order_id": "b3e...",
    "merchant_order_id": "b3e...",
    "status": "saiu_para_entrega",
    "driver": {
      "name": "Carlos Silva",
      "phone": "11988888888",
      "vehicle": "Honda CG 160",
      "plate": "ABC-1234"
    },
    "tracking_code": "IZI-12345",
    "notes": null,
    "timestamp": "2026-05-14T14:35:00Z"
  }
}`}
        </pre>
      </div>
    </div>
  );
}
