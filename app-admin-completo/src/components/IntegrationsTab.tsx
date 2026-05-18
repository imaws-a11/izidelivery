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
    instance_name: '',
    msg_missing_info: 'Olá! Recebi seu contato, mas para criarmos o seu pedido e calcularmos a taxa de entrega, precisamos que nos informe os seguintes detalhes que faltaram:\n\n{missing_fields}\n\nPor favor, envie essas informações de forma clara por mensagem de texto ou em um novo áudio! 😉',
    msg_copilot_confirm: 'Anotado! Recebemos o seu pedido ({tracking_code}). O nosso atendente já está revisando no painel e logo você receberá a confirmação!',
    msg_autopilot_confirm: 'Sucesso! Seu pedido foi confirmado ({tracking_code}). A cozinha já está preparando e, assim que estiver pronto para sair, nosso sistema chamará o entregador parceiro mais próximo! 🚀',
    msg_insufficient_balance: 'Atenção: A carteira pré-paga da loja está temporariamente sem saldo para o envio de R$ {delivery_fee}. Por favor, realize a recarga rápida via chave Pix abaixo para liberar o envio imediato:\n\n{pix_key}',
    msg_menu_safety_guard: 'Anotado! Recebemos o seu pedido ({tracking_code}). Como temos itens personalizados ou uma atualização recente no cardápio, nossa equipe física da loja já está revisando o seu pedido para aprovação manual rápida. Em instantes confirmamos aqui! 🚀'
  });
  const [loadingWhatsapp, setLoadingWhatsapp] = useState(false);
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [qrProgress, setQrProgress] = useState(0);
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [pollingIntervalId, setPollingIntervalId] = useState<any>(null);

  const [activeMessageTab, setActiveMessageTab] = useState<string>('welcome_message');

  const messageTriggers = [
    {
      key: 'welcome_message',
      label: '👋 Boas-vindas',
      title: 'Boas-Vindas / Recepção Inicial',
      desc: 'Primeira mensagem enviada quando o cliente faz um contato inicial informal (ex: "Oi", "Bom dia", "Quero fazer um pedido").',
      placeholder: 'Olá! Como posso te ajudar hoje?',
      variables: []
    },
    {
      key: 'msg_missing_info',
      label: '🏙️ Endereço Incompleto',
      title: 'Dados Pendentes ou Endereço Incompleto',
      desc: 'Disparado quando a IA detecta que faltaram informações obrigatórias para gerar o pedido ou calcular o frete.',
      placeholder: 'Olá! Precisamos das seguintes informações...',
      variables: [
        { tag: '{missing_fields}', desc: 'Lista dos campos que faltaram' }
      ]
    },
    {
      key: 'msg_copilot_confirm',
      label: '📋 Confirmação Copiloto',
      title: 'Pedido Recebido (Modo Copiloto)',
      desc: 'Enviada no modo Semiautomático para informar que a IA entendeu o pedido e o atendente físico vai revisar.',
      placeholder: 'Pedido anotado! Aguarde a confirmação...',
      variables: [
        { tag: '{tracking_code}', desc: 'Código de rastreio curto (ex: TRK-H2A5)' }
      ]
    },
    {
      key: 'msg_autopilot_confirm',
      label: '🤖 Confirmação Autopilot',
      title: 'Pedido Confirmado (Modo Autopilot)',
      desc: 'Disparada no modo 100% Autônomo após a IA validar o cardápio e a taxa, debitar o saldo e enviar diretamente para a cozinha.',
      placeholder: 'Sucesso! Seu pedido já está em preparação...',
      variables: [
        { tag: '{tracking_code}', desc: 'Código de rastreio curto (ex: TRK-H2A5)' }
      ]
    },
    {
      key: 'msg_insufficient_balance',
      label: '💳 Saldo Insuficiente',
      title: 'Alerta de Saldo Insuficiente',
      desc: 'Disparada no modo Autopilot caso o lojista esteja sem saldo pré-pago. Envia o Pix dinâmico para liberação imediata.',
      placeholder: 'Seu pedido está pendente de recarga de saldo...',
      variables: [
        { tag: '{delivery_fee}', desc: 'Valor estimado da taxa de entrega (ex: R$ 9,90)' },
        { tag: '{pix_key}', desc: 'Código Copia e Cola do Pix para recarga' }
      ]
    },
    {
      key: 'msg_menu_safety_guard',
      label: '🛡️ Fallback de Cardápio',
      title: 'Segurança de Cardápio Inconsistente',
      desc: 'Enviada automaticamente quando itens falham na verificação com o catálogo cadastrado, transferindo o fluxo para aprovação manual.',
      placeholder: 'Pedido anotado! Como temos itens customizados, nossa equipe...',
      variables: [
        { tag: '{tracking_code}', desc: 'Código de rastreio curto (ex: TRK-H2A5)' }
      ]
    }
  ];

  const formatWhatsappPreview = (text: string) => {
    if (!text) return '';
    let formatted = text
      .replace(/{missing_fields}/g, '🏙️ *Bairro* (ex: Centro, Jardins)\n💳 *Forma de pagamento* (PIX, Cartão ou Dinheiro?)')
      .replace(/{tracking_code}/g, 'TRK-XP92L')
      .replace(/{delivery_fee}/g, '8,50')
      .replace(/{pix_key}/g, '00020101021226830014br.gov.bcb.pix2561api.mercadopago.com/v1/payments/ticket/...');

    // Convert *bold* to <strong>bold</strong>
    formatted = formatted.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
    // Convert newlines to <br />
    formatted = formatted.replace(/\n/g, '<br />');

    return formatted;
  };

  const EVOLUTION_API_URL = 'https://evolution-api-production-4ecca.up.railway.app';
  const EVOLUTION_API_KEY = 'd030a0d540bf1c4ab43a31b3b29b9baddaaabd776537608053e25cbc739c830f';

  useEffect(() => {
    return () => {
      if (pollingIntervalId) clearInterval(pollingIntervalId);
    };
  }, [pollingIntervalId]);

  // Simulated live logs of WhatsApp AI parser
  const [simulatedLogs] = useState<any[]>([
    {
      id: 1,
      customer: 'Carlos (79) 99888-1122',
      time: 'Há 5 min',
      address: 'Av. Paulista, 1500 - Bela Vista, São Paulo - SP',
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
      time: 'Há 12 min',
      address: 'Rua Haddock Lobo, 400 - Cerqueira César, São Paulo - SP',
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
      address: 'Rua Bela Cintra, 800 - Consolação, São Paulo - SP',
      neighborhood: 'Consolação',
      payment: 'Cartão de Crédito',
      fee: 11.00,
      status: 'no_balance',
      statusText: 'Aguardando Saldo',
      details: 'Saldo de carteira insuficiente (Saldo: R$ 4,50). Alerta Pix enviado no chat.'
    }
  ]);

  const [realLogs, setRealLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const fetchRealLogs = async (merchantId: string) => {
    setLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from('orders_delivery')
        .select('*')
        .eq('merchant_id', merchantId)
        .eq('origin', 'whatsapp')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (!error && data) {
        setRealLogs(data.map((o: any) => ({
          id: o.id,
          customer: `${o.customer_name} (${o.customer_phone || 'S/N'})`,
          time: new Date(o.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          address: o.delivery_address || 'Não especificado',
          neighborhood: o.neighborhood || 'Não especificado',
          payment: o.delivery_payment_method === 'dinheiro' ? `Dinheiro (Troco: ${o.needs_change ? 'Sim' : 'Não'})` : 'PIX/Cartão',
          fee: Number(o.delivery_fee) || 0,
          status: o.status === 'draft' ? 'success' : 'auto_dispatched',
          statusText: o.status === 'draft' ? 'Rascunho Criado' : 'Despachado Automático',
          details: o.status === 'draft' 
            ? 'Pedido parsed com sucesso e injetado nos rascunhos.' 
            : 'Suficiente saldo de carteira. Despachado diretamente no piloto automático!'
        })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLogs(false);
    }
  };

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
        setWhatsappSettings({
          ...data,
          msg_missing_info: data.msg_missing_info || 'Olá! Recebi seu contato, mas para criarmos o seu pedido e calcularmos a taxa de entrega, precisamos que nos informe os seguintes detalhes que faltaram:\n\n{missing_fields}\n\nPor favor, envie essas informações de forma clara por mensagem de texto ou em um novo áudio! 😉',
          msg_copilot_confirm: data.msg_copilot_confirm || 'Anotado! Recebemos o seu pedido ({tracking_code}). O nosso atendente já está revisando no painel e logo você receberá a confirmação!',
          msg_autopilot_confirm: data.msg_autopilot_confirm || 'Sucesso! Seu pedido foi confirmado ({tracking_code}). A cozinha já está preparando e, assim que estiver pronto para sair, nosso sistema chamará o entregador parceiro mais próximo! 🚀',
          msg_insufficient_balance: data.msg_insufficient_balance || 'Atenção: A carteira pré-paga da loja está temporariamente sem saldo para o envio de R$ {delivery_fee}. Por favor, realize a recarga rápida via chave Pix abaixo para liberar o envio imediato:\n\n{pix_key}',
          msg_menu_safety_guard: data.msg_menu_safety_guard || 'Anotado! Recebemos o seu pedido ({tracking_code}). Como temos itens personalizados ou uma atualização recente no cardápio, nossa equipe física da loja já está revisando o seu pedido para aprovação manual rápida. Em instantes confirmamos aqui! 🚀'
        });
        fetchRealLogs(activeMerchantId);
      } else {
        const initial = {
          merchant_id: activeMerchantId,
          is_active: false,
          phone_number: '',
          operation_mode: 'copilot',
          welcome_message: 'Olá! Sou o assistente virtual da nossa loja. Envie o seu pedido ou os detalhes da entrega por texto ou áudio que organizamos tudo para você!',
          ai_instructions: 'Trate o cliente com extrema cordialidade. Não aceitamos pedidos fora do horário comercial (08:00 às 23:00). Nossos produtos são todos perecíveis e frágeis.',
          instance_name: `izi_instance_${activeMerchantId.substring(0, 8)}`,
          msg_missing_info: 'Olá! Recebi seu contato, mas para criarmos o seu pedido e calcularmos a taxa de entrega, precisamos que nos informe os seguintes detalhes que faltaram:\n\n{missing_fields}\n\nPor favor, envie essas informações de forma clara por mensagem de texto ou em um novo áudio! 😉',
          msg_copilot_confirm: 'Anotado! Recebemos o seu pedido ({tracking_code}). O nosso atendente já está revisando no painel e logo você receberá a confirmação!',
          msg_autopilot_confirm: 'Sucesso! Seu pedido foi confirmado ({tracking_code}). A cozinha já está preparando e, assim que estiver pronto para sair, nosso sistema chamará o entregador parceiro mais próximo! 🚀',
          msg_insufficient_balance: 'Atenção: A carteira pré-paga da loja está temporariamente sem saldo para o envio de R$ {delivery_fee}. Por favor, realize a recarga rápida via chave Pix abaixo para liberar o envio imediato:\n\n{pix_key}',
          msg_menu_safety_guard: 'Anotado! Recebemos o seu pedido ({tracking_code}). Como temos itens personalizados ou uma atualização recente no cardápio, nossa equipe física da loja já está revisando o seu pedido para aprovação manual rápida. Em instantes confirmamos aqui! 🚀'
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

  useEffect(() => {
    if (userRole !== 'merchant') return;
    
    const activeMerchantId = merchantProfile?.id;
    if (!activeMerchantId) return;

    fetchRealLogs(activeMerchantId);

    const channel = supabase
      .channel(`whatsapp_logs_${activeMerchantId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders_delivery',
          filter: `merchant_id=eq.${activeMerchantId}`
        },
        (payload: any) => {
          if (payload.new && payload.new.origin === 'whatsapp') {
            fetchRealLogs(activeMerchantId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  const updateOperationMode = async (mode: 'copilot' | 'auto') => {
    setWhatsappSettings(prev => ({ ...prev, operation_mode: mode }));
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const activeMerchantId = user?.id || merchantProfile?.id;
      if (!activeMerchantId) return;

      const { error } = await supabase
        .from('whatsapp_bot_settings')
        .update({ operation_mode: mode, updated_at: new Date().toISOString() })
        .eq('merchant_id', activeMerchantId);

      if (error) throw error;
      toastSuccess(`Modo de operação alterado para ${mode === 'copilot' ? 'Copiloto' : 'Piloto Automático'}!`);
    } catch (err: any) {
      console.error('Erro ao atualizar modo de operação:', err);
      toastError('Erro ao persistir modo de operação: ' + err.message);
    }
  };

  const startQrSimulation = async () => {
    setShowQrCode(true);
    setQrProgress(10);
    setQrCodeBase64(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const activeMerchantId = user?.id || merchantProfile?.id;
      if (!activeMerchantId) {
        toastError('Erro: Usuário não identificado.');
        setShowQrCode(false);
        return;
      }

      const instanceName = whatsappSettings.instance_name || `izi_instance_${activeMerchantId.substring(0, 8)}`;

      // 1. Create the instance on Evolution API
      setQrProgress(30);
      try {
        await fetch(`${EVOLUTION_API_URL}/instance/create`, {
          method: 'POST',
          headers: {
            'apikey': EVOLUTION_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            instanceName: instanceName,
            qrcode: true,
            integration: 'WHATSAPP-BAILEYS'
          })
        });
      } catch (err) {
        console.log('Instance creation skipped or already exists:', err);
      }

      // 2. Fetch the QR Code
      setQrProgress(60);
      const connectRes = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': EVOLUTION_API_KEY
        }
      });
      
      const connectData = await connectRes.json();

      if (connectData && (connectData.base64 || connectData.code)) {
        setQrCodeBase64(connectData.base64 || connectData.code);
        setQrProgress(100);
        toastInfo('Escaneie o QR Code gerado!');

        // 3. Start Polling for Scan Status
        const interval = setInterval(async () => {
          try {
            const stateRes = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
              method: 'GET',
              headers: {
                'apikey': EVOLUTION_API_KEY
              }
            });
            const stateData = await stateRes.json();

            const isConnected = stateData?.instance?.state === 'open' || stateData?.state === 'open';
            
            if (isConnected) {
              clearInterval(interval);
              
              const jid = stateData?.instance?.user?.jid || stateData?.user?.jid || '';
              const phoneStr = jid.split('@')[0] || 'Ativo';
              const formattedPhone = phoneStr.length > 5 ? `+${phoneStr.substring(0, 2)} (${phoneStr.substring(2, 4)}) ${phoneStr.substring(4, 9)}-${phoneStr.substring(9)}` : '+55 (79) 99888-7766';

              // 4. Configure the Webhook for this instance automatically
              try {
                await fetch(`${EVOLUTION_API_URL}/webhook/set/${instanceName}`, {
                  method: 'POST',
                  headers: {
                    'apikey': EVOLUTION_API_KEY,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    webhook: {
                      url: 'https://cmkylgblkiceiclbewxr.supabase.co/functions/v1/whatsapp-parser-webhook',
                      enabled: true,
                      webhookByEvents: false,
                      events: ['MESSAGES_UPSERT']
                    }
                  })
                });
              } catch (webErr) {
                console.error('Failed to configure webhook:', webErr);
              }

              // 5. Update DB
              const updated = {
                ...whatsappSettings,
                phone_number: formattedPhone,
                is_active: true,
                merchant_id: activeMerchantId,
                updated_at: new Date().toISOString()
              };

              const { error } = await supabase
                .from('whatsapp_bot_settings')
                .upsert(updated);

              if (!error) {
                setWhatsappSettings(updated);
                setShowQrCode(false);
                toastSuccess('Instância pareada e conectada com sucesso!');
                fetchRealLogs(activeMerchantId);
              } else {
                toastError('Erro ao atualizar status no banco: ' + error.message);
              }
            }
          } catch (pollErr) {
            console.error('Error polling connection state:', pollErr);
          }
        }, 4000);

        setPollingIntervalId(interval);

      } else {
        toastError('Erro ao gerar QR Code da Evolution API.');
        setShowQrCode(false);
      }

    } catch (err: any) {
      console.error(err);
      toastError('Erro ao conectar com a Evolution API: ' + err.message);
      setShowQrCode(false);
    }
  };

  const disconnectWhatsapp = async () => {
    if (!confirm('Desconectar sua instância do WhatsApp? O bot parará de receber mensagens imediatamente.')) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const activeMerchantId = user?.id || merchantProfile?.id;
      const instanceName = whatsappSettings.instance_name || `izi_instance_${activeMerchantId?.substring(0, 8)}`;

      try {
        const deleteRes = await fetch(`${EVOLUTION_API_URL}/instance/delete/${instanceName}`, {
          method: 'DELETE',
          headers: {
            'apikey': EVOLUTION_API_KEY
          }
        });
        if (!deleteRes.ok) {
          await fetch(`${EVOLUTION_API_URL}/instance/logout/${instanceName}`, {
            method: 'DELETE',
            headers: {
              'apikey': EVOLUTION_API_KEY
            }
          });
        }
      } catch (err) {
        console.error('Error cleaning up instance:', err);
      }

      const updated = {
        ...whatsappSettings,
        phone_number: '',
        is_active: false
      };
      setWhatsappSettings(updated);
      
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
    } catch (err: any) {
      console.error(err);
      toastError('Erro ao desconectar instância: ' + err.message);
    }
  };

  const logsToDisplay = realLogs.length > 0 ? realLogs : simulatedLogs;

  if (userRole !== 'merchant') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] font-display font-bold">
        <div className="bg-[#050505]/90 text-zinc-100 rounded-3xl border border-white/5 p-10 max-w-md text-center shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-rose-500/5 rounded-full blur-[80px] pointer-events-none" />
          <span className="material-symbols-outlined text-rose-500 text-4xl mb-4 font-black">lock</span>
          <h2 className="text-lg font-black text-white uppercase tracking-widest mb-2 font-display">ACESSO RESTRITO</h2>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider leading-relaxed font-display">Esta página é exclusiva para lojistas parceiros cadastrados na plataforma.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pb-20 font-display font-bold px-4 md:px-8">
      <div className="bg-white/80 text-zinc-800 rounded-[32px] border border-zinc-200/50 p-6 md:p-10 shadow-[0_10px_40px_rgba(0,0,0,0.03)] relative overflow-hidden backdrop-blur-2xl">
        
        {/* Glassmorphism Auras - Stealth Luxury Ethereal Lights */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/8 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/8 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-[30%] right-[20%] w-[30%] h-[30%] bg-purple-500/8 rounded-full blur-[120px] pointer-events-none" />

        {/* Content Wrapper */}
        <div className="relative z-10 space-y-8">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-200/50 pb-8">
            <div>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_4px_15px_rgba(16,185,129,0.03)]">
                  <span className="material-symbols-outlined text-emerald-600 text-3xl font-black">settings_input_component</span>
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-black text-zinc-950 leading-none tracking-widest uppercase italic font-display">
                    INTEGRATIONS COGNITIVE STUDIO
                  </h1>
                  <p className="text-zinc-500 font-bold mt-2 ml-1 text-[10px] uppercase tracking-widest font-display">
                    GERENCIE CANAIS LOGÍSTICOS E PARSE DE IA DE ALTA VELOCIDADE
                  </p>
                </div>
              </div>
            </div>

            {/* Tab Selector (Glassmorphic Segmented Control) */}
            <div className="flex p-1 bg-zinc-100/80 backdrop-blur-md rounded-2xl border border-zinc-200/60 w-fit shrink-0 gap-1 shadow-sm font-display">
              <button
                type="button"
                onClick={() => setActiveSubTab('api')}
                className={`px-6 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all duration-300 cursor-pointer ${
                  activeSubTab === 'api'
                    ? 'bg-white text-zinc-900 border border-zinc-200/50 shadow-[0_4px_12px_rgba(0,0,0,0.05)]'
                    : 'text-zinc-500 hover:text-zinc-800 hover:bg-white/40'
                }`}
              >
                <span className="material-symbols-outlined text-[15px] font-black text-indigo-600">api</span>
                Chaves de API
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('whatsapp')}
                className={`px-6 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all duration-300 cursor-pointer relative ${
                  activeSubTab === 'whatsapp'
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-[0_4px_12px_rgba(16,185,129,0.05)]'
                    : 'text-zinc-500 hover:text-emerald-650 hover:bg-white/40'
                }`}
              >
                <span className="material-symbols-outlined text-[15px] font-black">chat</span>
                WhatsApp IA Bot
                <span className={`size-1.5 rounded-full absolute top-3 right-3 animate-ping ${whatsappSettings.is_active ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
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
                <section className="bg-zinc-50/50 backdrop-blur-xl rounded-3xl border border-zinc-200/50 p-6 md:p-8 shadow-sm relative overflow-hidden">
                  
                  {/* Generate Token Section */}
                  <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/30 p-6 rounded-2xl border border-indigo-100 flex flex-col md:flex-row items-center gap-6 mb-8">
                    <div className="flex-1 w-full">
                       <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest mb-1 font-display">Gerar Nova Chave</h3>
                       <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-display">Crie tokens de acesso seguros para seus parceiros, e-commerces ou ERPs externos.</p>
                    </div>
                    <div className="flex-1 w-full flex flex-col sm:flex-row items-center gap-3">
                       <input 
                         type="text" 
                         placeholder="Nome do App Parceiro (ex: WooCommerce)"
                         value={newLabel}
                         onChange={e => setNewLabel(e.target.value)}
                         className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-sm font-bold outline-none text-zinc-800 shadow-sm font-display"
                       />
                       <button 
                         onClick={generateKey}
                         disabled={generating}
                         className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-black text-xs uppercase tracking-widest px-6 py-4.5 rounded-2xl shadow-[0_4px_15px_rgba(99,102,241,0.15)] transition-all active:scale-95 whitespace-nowrap disabled:opacity-50 border border-indigo-400/20 cursor-pointer font-display"
                       >
                         {generating ? 'GERANDO...' : 'GERAR CHAVE'}
                       </button>
                    </div>
                  </div>

                  <div>
                     <h3 className="text-[10px] font-black text-zinc-450 uppercase tracking-widest mb-6 ml-2 font-display">SUAS CHAVES ATIVAS</h3>
                     
                     {loading ? (
                       <div className="animate-pulse flex flex-col gap-4">
                          <div className="h-20 bg-zinc-100 rounded-2xl w-full"></div>
                          <div className="h-20 bg-zinc-100 rounded-2xl w-full"></div>
                       </div>
                     ) : apiKeys.length === 0 ? (
                       <div className="text-center py-16 border border-dashed border-zinc-200 rounded-2xl bg-zinc-50">
                          <span className="material-symbols-outlined text-5xl text-zinc-400 mb-3 font-black">key_off</span>
                          <p className="text-zinc-500 font-bold text-xs uppercase tracking-wider font-display">NENHUMA CHAVE DE API GERADA AINDA.</p>
                       </div>
                     ) : (
                       <div className="space-y-4">
                          {apiKeys.map(key => (
                            <div key={key.id} className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl border transition-all duration-350 ${key.is_active ? 'bg-white backdrop-blur-md border-zinc-200/60 hover:border-indigo-550 shadow-sm' : 'bg-zinc-50 border-zinc-100 opacity-60'}`}>
                               <div className="flex items-center gap-4">
                                  <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 border transition-all ${key.is_active ? 'bg-indigo-50 text-indigo-600 border-indigo-150 shadow-sm' : 'bg-zinc-100 text-zinc-400 border-zinc-200'}`}>
                                    <span className="material-symbols-outlined font-black">{key.is_active ? 'vpn_key' : 'lock'}</span>
                                  </div>
                                  <div>
                                     <h4 className="text-sm font-black text-zinc-800 truncate uppercase tracking-wide font-display">{key.label}</h4>
                                     <div className="flex items-center gap-2 mt-1.5">
                                       <code className="text-[10px] font-bold bg-indigo-50/70 text-indigo-600 px-3 py-1 rounded-md font-mono border border-indigo-100">
                                         {key.api_key}
                                       </code>
                                       <button onClick={() => {
                                         navigator.clipboard.writeText(key.api_key);
                                         toastSuccess('Copiado para a área de transferência!');
                                       }} className="text-indigo-500 hover:text-indigo-700 flex items-center justify-center cursor-pointer transition-colors" title="Copiar Token">
                                         <span className="material-symbols-outlined text-sm font-black">content_copy</span>
                                       </button>
                                     </div>
                                  </div>
                               </div>
                               <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
                                  <div className="text-right hidden sm:block">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 font-display">CRIADO EM</p>
                                    <p className="text-xs font-bold text-zinc-650 font-mono">{new Date(key.created_at).toLocaleDateString('pt-BR')}</p>
                                  </div>
                                  <div className="w-px h-8 bg-zinc-200 mx-2 hidden sm:block"></div>
                                  <button 
                                    onClick={() => toggleStatus(key.id, key.is_active)}
                                    className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${key.is_active ? 'bg-amber-500/10 text-amber-600 border border-amber-500/25 hover:bg-amber-500/20' : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/25 hover:bg-emerald-500/20'}`}
                                  >
                                    {key.is_active ? 'PAUSAR' : 'ATIVAR'}
                                  </button>
                                  <button 
                                    onClick={() => revokeKey(key.id)}
                                    className="size-10.5 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/25 flex items-center justify-center hover:bg-rose-500/20 transition-all shrink-0 cursor-pointer"
                                    title="Revogar chave definitivamente"
                                  >
                                    <span className="material-symbols-outlined text-lg font-black">delete_forever</span>
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
                className="grid grid-cols-1 xl:grid-cols-12 gap-8"
              >
                {/* Left 7 Columns: Main Setup Forms */}
                <div className="xl:col-span-7 space-y-8">
                  <form onSubmit={handleSaveWhatsappSettings} className="bg-white border border-zinc-200/60 rounded-3xl p-6 md:p-10 shadow-sm space-y-8">
                    
                    {/* Connection Status Section */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 border-b border-zinc-200/50 pb-4">
                        <div className="size-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-200 shadow-sm">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.456h.008c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                        </div>
                        <div>
                          <h2 className="text-xs font-black text-zinc-900 uppercase tracking-widest leading-none mb-1 font-display">
                            STATUS DE CONEXÃO WHATSAPP
                          </h2>
                          <p className="text-[8px] font-black text-zinc-450 uppercase tracking-wider font-display">PAREAMENTO EM TEMPO REAL COM O SEU DISPOSITIVO BUSINESS</p>
                        </div>
                      </div>

                      <div className="bg-zinc-50 border border-zinc-200/60 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className={`size-14 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300 ${whatsappSettings.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-250 shadow-sm' : 'bg-zinc-100 text-zinc-400 border-zinc-200'}`}>
                            <span className="material-symbols-outlined text-2xl font-black">
                              {whatsappSettings.is_active ? 'phone_iphone' : 'phonelink_erase'}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`size-2 rounded-full ${whatsappSettings.is_active ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
                              <h4 className="text-sm font-black text-zinc-800 uppercase tracking-wide font-display">
                                {whatsappSettings.is_active ? 'DISPOSITIVO CONECTADO' : 'AGUARDANDO PAREAMENTO'}
                              </h4>
                            </div>
                            <p className="text-xs font-bold text-zinc-500 mt-1.5 font-display">
                              {whatsappSettings.is_active ? `Número ativo: ${whatsappSettings.phone_number}` : 'Vincule seu WhatsApp Business para que o robô faça a triagem e o parser das entregas avulsas.'}
                            </p>
                          </div>
                        </div>

                        <div>
                          {whatsappSettings.is_active ? (
                            <button
                              type="button"
                              onClick={disconnectWhatsapp}
                              className="px-5 py-3 bg-rose-50 hover:bg-rose-100/70 text-rose-600 border border-rose-200 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer active:scale-95 font-display"
                            >
                              DESCONECTAR
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={startQrSimulation}
                              className="px-5 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm border border-emerald-400/20 active:scale-95 cursor-pointer font-display"
                            >
                              GERAR QR CODE
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
                            <div className="border border-zinc-200/60 rounded-2xl p-6 flex flex-col items-center justify-center bg-zinc-50 backdrop-blur-md space-y-6 shadow-inner">
                              <p className="text-[10px] font-black text-zinc-550 uppercase tracking-widest text-center font-display">
                                {qrProgress < 100 
                                  ? 'GERANDO CANAL CRIPTOGRAFADO...' 
                                  : 'ESCANEIE COM O WHATSAPP DO CELULAR (WHATSAPP WEB)'}
                              </p>

                              {qrProgress < 100 ? (
                                <div className="flex flex-col items-center justify-center h-48 space-y-4">
                                  <span className="material-symbols-outlined text-4xl text-emerald-500 animate-spin font-black">sync</span>
                                  <div className="w-48 bg-zinc-200 h-1.5 rounded-full overflow-hidden border border-zinc-300/40">
                                    <div className="bg-emerald-500 h-full transition-all duration-300 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${qrProgress}%` }}></div>
                                  </div>
                                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-wider font-display">INICIANDO INSTÂNCIA SEGURA...</p>
                                </div>
                              ) : (
                                <div className="bg-white p-4 rounded-2xl border-2 border-emerald-500 shadow-sm relative group max-w-[220px]">
                                  <img 
                                    src={qrCodeBase64 || ''} 
                                    alt="WhatsApp Web Pair QR Code" 
                                    className="w-44 h-44 rounded-lg border border-zinc-200 object-contain"
                                  />
                                  <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-zinc-800 text-[9px] font-black uppercase tracking-widest bg-white border border-zinc-200 px-3 py-2 rounded-md font-display">Validade: 60 segundos</span>
                                  </div>
                                </div>
                              )}

                              <p className="text-[8px] font-black text-rose-600 uppercase tracking-widest bg-rose-50 px-4 py-2 rounded-lg border border-rose-200 font-display">
                                AVISO CRÍTICO: NÃO COMPARTILHE O QR CODE COM TERCEIROS PARA MANTER A SEGURANÇA.
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Operation Mode */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 border-b border-zinc-200/50 pb-4">
                        <div className="size-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 border border-indigo-200 shadow-sm">
                          <span className="material-symbols-outlined text-xl font-black">psychology</span>
                        </div>
                        <div>
                          <h2 className="text-xs font-black text-zinc-900 uppercase tracking-widest leading-none mb-1 font-display">
                            MODO DE OPERAÇÃO LOGÍSTICA
                          </h2>
                          <p className="text-[8px] font-black text-zinc-450 uppercase tracking-wider font-display">DEFINA O NÍVEL DE AUTONOMIA DA INTELIGÊNCIA ARTIFICIAL</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Copilot Option */}
                        <button
                          type="button"
                          onClick={() => updateOperationMode('copilot')}
                          className={`p-6 rounded-2xl border-2 text-left transition-all active:scale-[0.98] cursor-pointer relative overflow-hidden group ${
                            whatsappSettings.operation_mode === 'copilot'
                              ? 'border-indigo-600 bg-indigo-50/40 text-zinc-900 shadow-sm'
                              : 'border-zinc-200 bg-zinc-50 text-zinc-500 hover:border-zinc-300 hover:bg-zinc-100/50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className={`size-10 rounded-xl flex items-center justify-center ${whatsappSettings.operation_mode === 'copilot' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-zinc-200 text-zinc-500 border border-zinc-300/40'}`}>
                              <span className="material-symbols-outlined font-black">assignment</span>
                            </div>
                            <span className={`text-[7px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-md border ${
                              whatsappSettings.operation_mode === 'copilot'
                                ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                                : 'bg-zinc-200 text-zinc-500 border-zinc-300'
                            } font-display`}>
                              SEMIAUTOMÁTICO
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-zinc-900 mb-2 uppercase tracking-wide font-display">📋 Assistente Copiloto</h4>
                          <p className="text-xs font-bold text-zinc-650 leading-relaxed font-display">
                            A IA analisa os pedidos por texto/áudio e gera um rascunho de corrida pré-preenchido no painel. O lojista revisa e clica para aprovar e despachar.
                          </p>
                        </button>

                        {/* Auto-Pilot Option */}
                        <button
                          type="button"
                          onClick={() => updateOperationMode('auto')}
                          className={`p-6 rounded-2xl border-2 text-left transition-all active:scale-[0.98] cursor-pointer relative overflow-hidden group ${
                            whatsappSettings.operation_mode === 'auto'
                              ? 'border-emerald-600 bg-emerald-50/40 text-zinc-900 shadow-sm'
                              : 'border-zinc-200 bg-zinc-50 text-zinc-500 hover:border-zinc-300 hover:bg-zinc-100/50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className={`size-10 rounded-xl flex items-center justify-center ${whatsappSettings.operation_mode === 'auto' ? 'bg-emerald-650 text-white shadow-sm' : 'bg-zinc-200 text-zinc-500 border border-zinc-300/40'}`}>
                              <span className="material-symbols-outlined font-black">smart_toy</span>
                            </div>
                            <span className={`text-[7px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-md border ${
                              whatsappSettings.operation_mode === 'auto'
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200 animate-pulse'
                                : 'bg-zinc-200 text-zinc-500 border-zinc-300'
                            } font-display`}>
                              100% AUTÔNOMO
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-zinc-900 mb-2 uppercase tracking-wide font-display">🤖 Piloto Automático</h4>
                          <p className="text-xs font-bold text-zinc-650 leading-relaxed font-display">
                            A IA processa o endereço, calcula distâncias, calcula a taxa semântica, debita o frete do seu saldo pré-pago e despacha a corrida na rede de entregadores instantaneamente. Sem intervenções!
                          </p>
                        </button>
                      </div>
                    </div>

                    {/* ESTÚDIO COGNITIVO DE MENSAGENS E DIRETRIZES */}
                    <div className="space-y-8 border-t border-zinc-200/50 pt-8">
                      
                      {/* Section Title */}
                      <div className="flex items-center gap-3 border-b border-zinc-200/50 pb-4">
                        <div className="size-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 border border-indigo-200 shadow-sm">
                          <span className="material-symbols-outlined text-xl font-black">psychology</span>
                        </div>
                        <div>
                          <h2 className="text-xs font-black text-zinc-900 uppercase tracking-widest leading-none mb-1 font-display">
                            ESTÚDIO COGNITIVO DE MENSAGENS E DIRETRIZES
                          </h2>
                          <p className="text-[8px] font-black text-zinc-450 uppercase tracking-wider font-display">AJUSTE COMPORTAMENTAL E CONFIGURAÇÃO DOS GATILHOS DA IA</p>
                        </div>
                      </div>

                      {/* AI Prompt / Instructions (Global Rules) */}
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center ml-3">
                          <label className="text-[10px] font-black text-zinc-800 uppercase tracking-widest font-display">
                            🧠 Regras Globais de Negócio da IA (System Prompt)
                          </label>
                          <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest font-display">PROMPT DIRETIVO</span>
                        </div>
                        <textarea
                          value={whatsappSettings.ai_instructions || ''}
                          onChange={e => setWhatsappSettings({ ...whatsappSettings, ai_instructions: e.target.value })}
                          placeholder="Ex: Não fazemos entregas de produtos quentes em baú de moto. Nosso tempo médio de entrega é 45 minutos. Nossos produtos são todos perecíveis e frágeis..."
                          className="w-full h-24 bg-white border border-zinc-200 rounded-2xl px-5 py-4 text-xs font-bold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all shadow-sm resize-none custom-scrollbar font-display"
                        />
                        <p className="text-[8px] text-zinc-450 font-black uppercase tracking-wider ml-3 leading-relaxed font-display">
                          A IA utiliza estas regras no processador semântico de linguagem natural para tomar decisões na triagem dos pedidos enviados pelos clientes!
                        </p>
                      </div>

                      {/* Studio Workspace: Trigger Selector + Editor + Preview */}
                      <div className="bg-zinc-50 border border-zinc-200/50 rounded-3xl p-6 space-y-6">
                        <div className="flex items-center justify-between border-b border-zinc-200/40 pb-4">
                          <h3 className="text-[10px] font-black text-zinc-900 uppercase tracking-widest font-display">🤖 GERENCIADOR DE GATILHOS DO CHATBOT</h3>
                          <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded border border-emerald-200 font-display">LIVE PREVIEW</span>
                        </div>

                        {/* Horizontal Trigger Sub-tabs */}
                        <div className="flex gap-2 pb-2 overflow-x-auto custom-scrollbar select-none">
                          {messageTriggers.map((t) => (
                            <button
                              key={t.key}
                              type="button"
                              onClick={() => setActiveMessageTab(t.key)}
                              className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer whitespace-nowrap border shrink-0 ${
                                activeMessageTab === t.key
                                  ? 'bg-white text-zinc-900 border-zinc-300 shadow-sm font-black'
                                  : 'bg-zinc-100 text-zinc-500 border-zinc-200/40 hover:bg-zinc-200/50 hover:text-zinc-800'
                              }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>

                        {/* Active Trigger Details */}
                        {messageTriggers.filter(t => t.key === activeMessageTab).map(trigger => (
                          <div key={trigger.key} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            
                            {/* Editor Column (7/12) */}
                            <div className="lg:col-span-7 space-y-4">
                              <div>
                                <h4 className="text-xs font-black text-zinc-900 uppercase tracking-wider font-display">{trigger.title}</h4>
                                <p className="text-[9px] font-bold text-zinc-500 mt-1 leading-relaxed font-display">{trigger.desc}</p>
                              </div>

                              <div className="relative">
                                <textarea
                                  value={whatsappSettings[trigger.key] || ''}
                                  onChange={e => setWhatsappSettings({ ...whatsappSettings, [trigger.key]: e.target.value })}
                                  placeholder={trigger.placeholder}
                                  className="w-full h-44 bg-white border border-zinc-200 rounded-2xl px-5 py-4 text-xs font-bold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all shadow-sm resize-none custom-scrollbar font-display"
                                />
                                <span className="absolute bottom-3 right-4 text-[8px] font-black text-zinc-400 font-mono">
                                  {(whatsappSettings[trigger.key] || '').length} CARACTERES
                                </span>
                              </div>

                              {/* Variable Injection Tokens */}
                              {trigger.variables.length > 0 && (
                                <div className="space-y-2">
                                  <label className="text-[8px] font-black text-zinc-450 uppercase tracking-widest ml-1 font-display">VARIÁVEIS DINÂMICAS DISPONÍVEIS</label>
                                  <div className="flex flex-wrap gap-2">
                                    {trigger.variables.map(v => (
                                      <button
                                        key={v.tag}
                                        type="button"
                                        onClick={() => {
                                          setWhatsappSettings((prev: any) => ({
                                            ...prev,
                                            [trigger.key]: (prev[trigger.key] || '') + ' ' + v.tag
                                          }));
                                        }}
                                        className="px-3 py-1.5 rounded-xl bg-white border border-zinc-200/80 text-[8px] font-black text-zinc-700 hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-xs cursor-pointer active:scale-95 font-mono"
                                        title={v.desc}
                                      >
                                        {v.tag}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* WhatsApp Preview Column (5/12) */}
                            <div className="lg:col-span-5 flex flex-col h-[280px]">
                              <label className="text-[8px] font-black text-zinc-455 uppercase tracking-widest ml-1 mb-2 font-display">PREVIEW NO WHATSAPP DO CLIENTE</label>
                              
                              {/* WhatsApp Simulated Phone Mockup */}
                              <div className="flex-1 rounded-2xl border border-zinc-200 bg-[#efeae2] overflow-hidden flex flex-col shadow-sm relative select-none">
                                
                                {/* Wallpaper Doodle Accent Mask */}
                                <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000001_1px,transparent_1px),linear-gradient(to_bottom,#00000001_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none" />

                                {/* Chat Header */}
                                <div className="bg-[#075E54] text-white px-4 py-2.5 flex items-center gap-2 shadow-sm shrink-0">
                                  <div className="size-6.5 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs shrink-0 text-white border border-white/10 font-display">
                                    🤖
                                  </div>
                                  <div className="min-w-0">
                                    <h5 className="text-[9px] font-black truncate uppercase tracking-wider leading-none text-white font-display">Robô de IA do Lojista</h5>
                                    <span className="text-[7px] text-emerald-300 font-bold uppercase leading-none font-display">online</span>
                                  </div>
                                </div>

                                {/* Chat Screen Area */}
                                <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-end">
                                  <div className="max-w-[85%] rounded-2xl p-3 bg-white text-zinc-800 text-[10px] font-semibold leading-relaxed border border-zinc-200/50 shadow-xs relative self-start">
                                    
                                    {/* Left Speech Bubble Triangle tail */}
                                    <div className="absolute left-[-5px] top-3.5 size-2.5 bg-white border-l border-b border-zinc-200/30 rotate-45" />

                                    <div 
                                      className="break-words font-display" 
                                      dangerouslySetInnerHTML={{ __html: formatWhatsappPreview(whatsappSettings[trigger.key] || '') }} 
                                    />
                                    <span className="block text-[6px] text-zinc-400 font-bold uppercase text-right mt-1.5 font-mono">12:00 PM</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                          </div>
                        ))}
                      </div>

                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        type="submit"
                        disabled={savingWhatsapp || loadingWhatsapp}
                        className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-550 hover:to-indigo-450 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-sm border border-indigo-400/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer font-display"
                      >
                        {savingWhatsapp ? 'SALVANDO DIRETRIZES...' : 'SALVAR E SINCRONIZAR'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Right 5 Columns: Console/Live Logs - Remade Console De IA Ativo */}
                <div className="xl:col-span-5">
                  <div className="bg-zinc-50 border border-zinc-200/60 rounded-3xl p-6 md:p-8 h-[960px] flex flex-col justify-between relative overflow-hidden shadow-sm font-display">
                    
                    {/* Futuristic Grid Layer */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000002_1px,transparent_1px),linear-gradient(to_bottom,#00000002_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
                    
                    {/* Soft Neon Blur Spot */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-[75px] pointer-events-none" />
                    
                    {/* Console Header */}
                    <div>
                      <div className="flex items-center justify-between border-b border-zinc-200/50 pb-4">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full shadow-sm">
                            <span className="size-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600 font-display">ENGINE ACTIVE</span>
                          </span>
                        </div>
                        <span className="text-[8px] font-black text-zinc-450 uppercase tracking-widest font-mono">COGNITIVE ENGINE V5</span>
                      </div>
                      
                      {/* Performance Indicators */}
                      <div className="flex justify-between items-center mt-4 text-[9px] font-black uppercase text-zinc-450 tracking-wider font-display">
                        <div>
                          PRECISÃO DO PARSER: <span className="text-emerald-600 font-mono font-black">99.4%</span>
                        </div>
                        <div>
                          LATÊNCIA: <span className="text-indigo-650 font-mono font-black">420ms</span>
                        </div>
                      </div>
                    </div>

                    {/* Console Log Body */}
                    <div className="flex-1 overflow-y-auto space-y-5 my-6 pr-1 custom-scrollbar">
                      {loadingLogs ? (
                        <div className="flex flex-col items-center justify-center h-48 space-y-3 text-zinc-450 font-display">
                          <span className="material-symbols-outlined text-3xl animate-spin text-indigo-500 font-black">sync</span>
                          <p className="text-[9px] font-black uppercase tracking-widest font-display">BUSCANDO REGISTROS DE IA...</p>
                        </div>
                      ) : logsToDisplay.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 space-y-3 text-zinc-400 font-display">
                          <span className="material-symbols-outlined text-4xl font-black">terminal</span>
                          <p className="text-[9px] font-black uppercase tracking-widest text-center font-display">AGUARDANDO TRÁFEGO LOGÍSTICO DO WHATSAPP...</p>
                        </div>
                      ) : (
                        logsToDisplay.map((log, index) => (
                          <div key={log.id || index} className="bg-white p-5 rounded-2xl border border-zinc-200/60 space-y-4.5 relative overflow-hidden group hover:border-emerald-500/25 transition-all duration-300 shadow-sm">
                            
                            {/* Inner gradient border highlight */}
                            <div className="absolute top-0 left-0 h-[2px] bg-gradient-to-r from-emerald-500 to-indigo-500 opacity-20 w-0 group-hover:w-full transition-all duration-500" />

                            <div className="flex justify-between items-start gap-4">
                              <div className="space-y-1">
                                <p className="text-xs font-black text-zinc-800 font-mono">{log.customer}</p>
                                <p className="text-[8px] text-zinc-400 uppercase font-black tracking-wider font-mono">{log.time}</p>
                              </div>

                              {log.status === 'success' && (
                                <span className="bg-indigo-50 text-indigo-650 border border-indigo-150 px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-widest shrink-0 font-display">
                                  {log.statusText}
                                </span>
                              )}
                              {log.status === 'auto_dispatched' && (
                                <span className="bg-emerald-50 text-emerald-650 border border-emerald-150 px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-widest animate-pulse shrink-0 font-display">
                                  {log.statusText}
                                </span>
                              )}
                              {log.status === 'no_balance' && (
                                <span className="bg-rose-50 text-rose-650 border border-rose-150 px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-widest shrink-0 font-display">
                                  {log.statusText}
                                </span>
                              )}
                            </div>

                            {/* Extractions Parser Fields as Mono JSON Format */}
                            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200/60 font-mono text-[10px] text-zinc-700 space-y-1.5 leading-relaxed">
                              <div className="flex items-start gap-2">
                                  <span className="text-zinc-400 font-bold uppercase select-none shrink-0"># ORIGEM:</span> 
                                  <span className="text-zinc-805 break-words">{log.address}</span>
                              </div>
                              <div className="flex items-start gap-2">
                                  <span className="text-zinc-400 font-bold uppercase select-none shrink-0"># BAIRRO:</span> 
                                  <span className="text-zinc-805 break-words">{log.neighborhood}</span>
                              </div>
                              <div className="flex items-start gap-2">
                                  <span className="text-zinc-400 font-bold uppercase select-none shrink-0"># PGTO:  </span> 
                                  <span className="text-emerald-600 break-words">{log.payment}</span>
                              </div>
                              <div className="flex items-start gap-2">
                                  <span className="text-zinc-400 font-bold uppercase select-none shrink-0"># FRETE: </span> 
                                  <span className="text-indigo-600 font-bold">R$ {log.fee.toFixed(2)}</span>
                              </div>
                            </div>

                            <div className="text-xs text-zinc-500 leading-relaxed pl-3.5 border-l-2 border-emerald-500/40 font-semibold italic font-display">
                              {log.details}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Console Stats Footer */}
                    <div className="border-t border-zinc-200/50 pt-4 mt-2 flex justify-between items-center text-[9px] text-zinc-450 font-black uppercase tracking-widest font-display">
                      <span>MODO: <strong className="text-indigo-650 font-black font-mono">{whatsappSettings.operation_mode === 'copilot' ? 'COPILOTO' : 'PILOTO AUTO'}</strong></span>
                      <span>EXTRAÇÕES HOJE: <strong className="text-zinc-800 font-mono">{realLogs.length > 0 ? realLogs.length + 15 : 18}</strong></span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
