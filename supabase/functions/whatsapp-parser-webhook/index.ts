import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()
    console.log("Receiving webhook payload:", JSON.stringify(body))

    let instance_name = body.instance_name
    let message = body.message
    let sender_phone = body.sender_phone
    let sender_name = body.sender_name

    // Detect and parse Evolution API webhook structure (messages.upsert)
    if (body.event === 'messages.upsert' && body.data) {
      instance_name = body.instance;
      sender_name = body.data.pushName || 'Cliente WhatsApp';
      
      const remoteJid = body.data.key?.remoteJid || '';
      sender_phone = remoteJid.split('@')[0] || '';
      
      // Extract text content from message object
      const msgObj = body.data.message;
      if (msgObj) {
        message = msgObj.conversation || 
                  msgObj.extendedTextMessage?.text || 
                  msgObj.imageMessage?.caption || 
                  msgObj.audioMessage?.text || 
                  '';
      }
      
      // If it's from me (outgoing message from the bot itself), ignore to prevent infinite loops!
      if (body.data.key?.fromMe) {
        return new Response(JSON.stringify({ success: true, message: 'Ignored outgoing message from bot itself' }), {
          status: 200,
          headers: corsHeaders
        })
      }
    }

    if (!message) {
      return new Response(JSON.stringify({ success: false, error: 'Message content is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 1. Fetch active settings for the WhatsApp Instance
    const { data: settings, error: settingsError } = await supabaseClient
      .from('whatsapp_bot_settings')
      .select('*')
      .eq('instance_name', instance_name)
      .single()

    if (settingsError || !settings) {
      return new Response(JSON.stringify({ success: false, error: `WhatsApp Instance '${instance_name}' not configured or found.` }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!settings.is_active) {
      return new Response(JSON.stringify({ success: false, error: 'Chatbot instance is currently deactivated by the merchant.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const merchantId = settings.merchant_id

    // Check if there is an order created in the last 15 minutes to decide if we send the welcome message
    const cleanPhone = (sender_phone || '').replace(/\D/g, '')
    let shouldSendWelcome = false
    
    if (cleanPhone && settings.welcome_message) {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
      const { data: recentOrders, error: recentError } = await supabaseClient
        .from('orders_delivery')
        .select('id')
        .eq('merchant_id', merchantId)
        .eq('customer_phone', sender_phone)
        .gt('created_at', fifteenMinutesAgo)
        .limit(1)

      if (!recentError && (!recentOrders || recentOrders.length === 0)) {
        shouldSendWelcome = true
      }
    }

    if (shouldSendWelcome && settings.welcome_message) {
      console.log(`Sending welcome message to ${sender_phone} for instance ${instance_name}`);
      await sendWhatsAppMessage(instance_name, sender_phone, settings.welcome_message);
    }

    // 2. Parse details using AI Parser (Mock / NLP regex extractor fallback)
    const parsedData = parseMessageWithAI(message, sender_name, sender_phone, settings.ai_instructions)

    // Detecção se a mensagem é apenas uma saudação inicial informal ou pergunta de funcionamento
    const normalizedMsg = message.trim().toLowerCase();
    const greetings = ['oi', 'ola', 'olá', 'bom dia', 'boa tarde', 'boa noite', 'quero pedir', 'como funciona', 'ajuda', 'menu', 'cardapio', 'cardápio', 'olá!', 'oi!'];
    const isGreeting = greetings.some(g => normalizedMsg.startsWith(g) || normalizedMsg === g || normalizedMsg.length < 5);

    // Se for apenas uma saudação inicial (e não tiver nenhum detalhe de pedido de fato), apenas respondemos a saudação
    if (isGreeting && 
        parsedData.delivery_address === 'Endereço não informado' && 
        parsedData.neighborhood === 'Não especificado' && 
        parsedData.items === 'Não especificado' && 
        parsedData.payment_method === 'Não especificado') {
      
      if (!shouldSendWelcome && settings.welcome_message) {
        await sendWhatsAppMessage(instance_name, sender_phone, settings.welcome_message);
      }

      return new Response(JSON.stringify({
        success: true,
        mode: 'greeting',
        message: 'Mensagem de saudação inicial. Boas-vindas enviada se configurada.'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Se NÃO for uma simples saudação (ou seja, o cliente já tentou pedir), validamos as informações essenciais!
    const missingFields = [];
    if (parsedData.delivery_address === 'Endereço não informado') {
      missingFields.push('📍 *Rua e Número da Residência* (ex: Rua Paulista, 1200)');
    } else if (parsedData.delivery_address === 'Endereço sem número') {
      missingFields.push('📍 *Número da Residência* (preciso do número do seu endereço para o motoboy achar!)');
    }
    
    if (parsedData.neighborhood === 'Não especificado') {
      missingFields.push('🏙️ *Bairro* (ex: Centro, Jardins)');
    }
    
    if (parsedData.items === 'Não especificado') {
      missingFields.push('🍔 *O que deseja pedir* (detalhes ou descrição dos itens do pedido)');
    }
    
    if (parsedData.payment_method === 'Não especificado') {
      missingFields.push('💳 *Forma de pagamento* (PIX, Cartão ou Dinheiro?)');
    }

    // Se houver qualquer campo obrigatório em falta, não criamos o pedido no banco e cobramos o cliente!
    if (missingFields.length > 0) {
      console.log(`Missing required delivery details for ${sender_phone}:`, missingFields.join(', '));
      
      let missingMessage = settings.msg_missing_info || 'Olá! Recebi seu contato, mas para criarmos o seu pedido e calcularmos a taxa de entrega, precisamos que nos informe os seguintes detalhes que faltaram:\n\n{missing_fields}\n\nPor favor, envie essas informações de forma clara por mensagem de texto ou em um novo áudio! 😉';
      missingMessage = missingMessage.replace('{missing_fields}', missingFields.join('\n'));
      
      await sendWhatsAppMessage(instance_name, sender_phone, missingMessage);

      return new Response(JSON.stringify({
        success: true,
        mode: 'missing_info',
        missing: missingFields,
        message: 'Pedido incompleto. Cliente notificado para fornecer detalhes pendentes.'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 3. Geocode / Calculate estimated delivery fee
    // We retrieve the dynamic zones for the merchant to check for zone matching
    const { data: zones } = await supabaseClient
      .from('merchant_delivery_zones')
      .select('*')
      .eq('merchant_id', merchantId)

    let estimatedFee = 9.90 // Base default delivery fee
    if (zones && zones.length > 0) {
      // Simple match based on neighborhood
      const matchingZone = zones.find((z: any) => 
        z.neighborhood_name?.toLowerCase().trim() === parsedData.neighborhood?.toLowerCase().trim()
      )
      if (matchingZone) {
        estimatedFee = Number(matchingZone.price) || 9.90
      }
    }

    // 4. Handle Operation Modes
    if (settings.operation_mode === 'copilot') {
      // COPILOT MODE: Insert a DRAFT order so the merchant can review it in the panel
      const newOrderId = crypto.randomUUID()
      const trackingCode = `TRK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

      const orderPayload = {
        id: newOrderId,
        merchant_id: merchantId,
        customer_name: parsedData.customer_name,
        customer_phone: parsedData.customer_phone,
        delivery_address: parsedData.delivery_address,
        neighborhood: parsedData.neighborhood,
        reference_point: parsedData.reference_point,
        delivery_payment_method: parsedData.payment_method,
        needs_change: parsedData.needs_change,
        status: 'draft', // DRAFT state
        service_type: 'standalone',
        origin: 'whatsapp',
        delivery_fee: estimatedFee,
        total_price: parsedData.total_price || 0,
        notes: `Itens: ${parsedData.items || 'Não descritos'}. Observações: ${parsedData.notes || 'Nenhuma'}.`,
        tracking_code: trackingCode,
        created_at: new Date().toISOString()
      }

      const { error: insertError } = await supabaseClient
        .from('orders_delivery')
        .insert(orderPayload)

      if (insertError) throw insertError

      // Send WhatsApp confirmation back to the customer
      let copilotConfirmMsg = settings.msg_copilot_confirm || 'Anotado! Recebemos o seu pedido ({tracking_code}). O nosso atendente já está revisando no painel e logo você receberá a confirmação!';
      copilotConfirmMsg = copilotConfirmMsg.replace('{tracking_code}', trackingCode);

      await sendWhatsAppMessage(
        instance_name,
        sender_phone,
        copilotConfirmMsg
      );

      return new Response(JSON.stringify({
        success: true,
        mode: 'copilot',
        order_id: newOrderId,
        status: 'draft',
        message: 'Rascunho criado com sucesso! Notificação visual disparada no Painel do Lojista.'
      }), {
        status: 201,
       } else {
      // AUTOPILOT MODE: 100% Autonomous validation and dispatch
      
      // Safety Shield 1: Fetch active merchant products to validate cardapio/menu
      const { data: activeProducts, error: productsErr } = await supabaseClient
        .from('products_delivery')
        .select('name, price, is_available, is_deleted')
        .eq('merchant_id', merchantId)
        .eq('is_available', true)
        .eq('is_deleted', false)

      let hasMenuInconsistency = false
      let inconsistencyReason = ''

      if (!productsErr && activeProducts && activeProducts.length > 0) {
        // Simple fuzzy match algorithm to cross-reference items in client order text
        const clientItemsText = (parsedData.items || '').toLowerCase()
        
        // Split client items by comma or newline to validate individually if possible
        const requestedItems = clientItemsText.split(/,|\n/).map(i => i.trim()).filter(Boolean)
        
        for (const reqItem of requestedItems) {
          // Check if this requested item matches any product name in the active products list
          const found = activeProducts.some((p: any) => {
            const prodName = p.name.toLowerCase()
            // Check if product name is inside requested string or vice-versa
            return prodName.includes(reqItem) || reqItem.includes(prodName)
          })

          if (!found) {
            hasMenuInconsistency = true
            inconsistencyReason = `Item '${reqItem}' não correspondido no cardápio ativo.`
            break
          }
        }
      } else {
        // If merchant has no active catalog on database, force safety fallback immediately
        hasMenuInconsistency = true
        inconsistencyReason = 'Catálogo ativo do lojista não encontrado ou vazio.'
      }

      // If cardapio is inconsistent or empty, demote flow to Copilot (Draft Approval)
      if (hasMenuInconsistency) {
        console.warn(`[Safety Fallback Activated] ${inconsistencyReason}. Reverting autopilot to copilot draft.`);
        
        const newOrderId = crypto.randomUUID()
        const trackingCode = `TRK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

        const orderPayload = {
          id: newOrderId,
          merchant_id: merchantId,
          customer_name: parsedData.customer_name,
          customer_phone: parsedData.customer_phone,
          delivery_address: parsedData.delivery_address,
          neighborhood: parsedData.neighborhood,
          reference_point: parsedData.reference_point,
          delivery_payment_method: parsedData.payment_method,
          needs_change: parsedData.needs_change,
          status: 'draft', // DRAFT state due to menu fallback
          service_type: 'standalone',
          origin: 'whatsapp',
          delivery_fee: estimatedFee,
          total_price: parsedData.total_price || 0,
          notes: `[⚠️ REVISÃO DE CARDÁPIO] ${inconsistencyReason} | Itens originais: ${parsedData.items || 'Não descritos'}.`,
          tracking_code: trackingCode,
          created_at: new Date().toISOString()
        }

        const { error: insertError } = await supabaseClient
          .from('orders_delivery')
          .insert(orderPayload)

        if (insertError) throw insertError

        // Send friendly safety notification back to the customer
        let safetyGuardMsg = settings.msg_menu_safety_guard || 'Anotado! Recebemos o seu pedido ({tracking_code}). Como temos itens personalizados ou uma atualização recente no cardápio, nossa equipe física da loja já está revisando o seu pedido para aprovação manual rápida. Em instantes confirmamos aqui! 🚀';
        safetyGuardMsg = safetyGuardMsg.replace('{tracking_code}', trackingCode);

        await sendWhatsAppMessage(
          instance_name,
          sender_phone,
          safetyGuardMsg
        );

        return new Response(JSON.stringify({
          success: true,
          mode: 'copilot_fallback',
          order_id: newOrderId,
          status: 'draft',
          reason: inconsistencyReason,
          message: 'Validação de cardápio falhou. Pedido rebaixado para Rascunho Copiloto com segurança.'
        }), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Fetch all wallet transactions for the merchant to check dynamic balance
      const { data: txs } = await supabaseClient
        .from('wallet_transactions_delivery')
        .select('*')
        .eq('user_id', merchantId)

      let currentBalance = 0
      if (txs) {
        currentBalance = txs.reduce((acc: number, t: any) => {
          if (t.status === 'cancelado' || t.status === 'estornado') return acc
          const amt = Number(t.amount) || 0
          return acc + (t.type === 'saque' || t.type === 'debit' ? -Math.abs(amt) : amt)
        }, 0)
      }

      if (currentBalance < estimatedFee) {
        // Insufficient prepaid balance: create as draft and ask for Pix dynamic recharge
        const newOrderId = crypto.randomUUID()
        const orderPayload = {
          id: newOrderId,
          merchant_id: merchantId,
          customer_name: parsedData.customer_name,
          customer_phone: parsedData.customer_phone,
          delivery_address: parsedData.delivery_address,
          neighborhood: parsedData.neighborhood,
          reference_point: parsedData.reference_point,
          delivery_payment_method: parsedData.payment_method,
          needs_change: parsedData.needs_change,
          status: 'draft',
          service_type: 'standalone',
          origin: 'whatsapp',
          delivery_fee: estimatedFee,
          total_price: parsedData.total_price || 0,
          notes: `[BLOQUEADO: Falta de Saldo] Itens: ${parsedData.items || 'Não descritos'}.`,
          created_at: new Date().toISOString()
        }

        await supabaseClient
          .from('orders_delivery')
          .insert(orderPayload)

        const randomPixKey = `00020101021226830014br.gov.bcb.pix2561api.mercadopago.com/v1/payments/ticket/123456789/qr_code5204000053039865405${estimatedFee.toFixed(2)}5802BR5912IZI_DELIVERY6009SAO_PAULO62070503***6304`

        // Send WhatsApp confirmation asking for recharge
        let insufficientBalanceMsg = settings.msg_insufficient_balance || 'Atenção: A carteira pré-paga da loja está temporariamente sem saldo para o envio de R$ {delivery_fee}. Por favor, realize a recarga rápida via chave Pix abaixo para liberar o envio imediato:\n\n{pix_key}';
        insufficientBalanceMsg = insufficientBalanceMsg.replace('{delivery_fee}', estimatedFee.toFixed(2).replace('.', ','))
          .replace('{pix_key}', randomPixKey);

        await sendWhatsAppMessage(
          instance_name,
          sender_phone,
          insufficientBalanceMsg
        );

        return new Response(JSON.stringify({
          success: false,
          mode: 'auto_error_balance',
          estimated_fee: estimatedFee,
          balance: currentBalance,
          pix_qr_code: randomPixKey,
          message: 'Saldo insuficiente. Pedido retido como Rascunho. Pix de recarga gerado!'
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Sufficient Balance: Deduct the fee from wallet and dispatch order directly
      const newOrderId = crypto.randomUUID()
      const trackingCode = `TRK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

      // Create transaction
      const txPayload = {
        id: crypto.randomUUID(),
        user_id: merchantId,
        amount: estimatedFee,
        type: 'debit',
        status: 'completado',
        description: `Taxa de Entrega Avulsa WhatsApp: ${parsedData.customer_name}`,
        created_at: new Date().toISOString()
      }

      const { error: txError } = await supabaseClient
        .from('wallet_transactions_delivery')
        .insert(txPayload)

      if (txError) throw txError

      // Create dispatched order safely
      // We change status to 'waiting_merchant' (or 'preparando') so it enters merchant's kitchen first,
      // preventing phantom drivers arriving before food starts preparing!
      const orderPayload = {
        id: newOrderId,
        merchant_id: merchantId,
        customer_name: parsedData.customer_name,
        customer_phone: parsedData.customer_phone,
        delivery_address: parsedData.delivery_address,
        neighborhood: parsedData.neighborhood,
        reference_point: parsedData.reference_point,
        delivery_payment_method: parsedData.payment_method,
        needs_change: parsedData.needs_change,
        status: 'waiting_merchant', // Enters 'Pendentes' in Order Center so kitchen validates physically!
        preparation_status: 'preparando',
        service_type: 'standalone',
        origin: 'whatsapp',
        delivery_fee: estimatedFee,
        total_price: parsedData.total_price || 0,
        notes: `[AUTO-PILOT] Itens validados com cardápio ativo: ${parsedData.items || 'Não descritos'}.`,
        tracking_code: trackingCode,
        created_at: new Date().toISOString()
      }

      const { error: insertError } = await supabaseClient
        .from('orders_delivery')
        .insert(orderPayload)

      if (insertError) throw insertError

      // Send WhatsApp confirmation back to the customer
      let autopilotConfirmMsg = settings.msg_autopilot_confirm || 'Sucesso! Seu pedido foi confirmado ({tracking_code}). A cozinha já está preparando e, assim que estiver pronto para sair, nosso sistema chamará o entregador parceiro mais próximo! 🚀';
      autopilotConfirmMsg = autopilotConfirmMsg.replace('{tracking_code}', trackingCode);

      await sendWhatsAppMessage(
        instance_name,
        sender_phone,
        autopilotConfirmMsg
      );

      return new Response(JSON.stringify({
        success: true,
        mode: 'auto',
        order_id: newOrderId,
        status: 'waiting_merchant',
        delivery_fee: estimatedFee,
        tracking_code: trackingCode,
        message: 'Sucesso! Saldo debitado e pedido enviado com segurança para a Central do Lojista.'
      }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

  } catch (error: any) {
    console.error('WhatsApp parser webhook error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// --- Robust AI Parser Fallback ---
function parseMessageWithAI(message: string, senderName: string, senderPhone: string, aiInstructions: string) {
  const normalized = message.toLowerCase();

  // 1. EXTRAÇÃO DE NOME
  let extractedName = senderName || 'Cliente WhatsApp';
  const nameMatch = message.match(/(?:nome|cliente|meu nome é|meu nome e):\s*([^\n]+)/i);
  if (nameMatch) {
    extractedName = nameMatch[1].trim();
  } else {
    // Tenta encontrar padrões como "me chamo [Nome]" ou "sou o [Nome]"
    const namePattern = message.match(/(?:me chamo|me chamo de|sou o|sou a|aqui é o|aqui é a)\s+([A-ZÀ-ÿ][a-zÀ-ÿ]+(?:\s+[A-ZÀ-ÿ][a-zÀ-ÿ]+)?)/i);
    if (namePattern) {
      extractedName = namePattern[1].trim();
    }
  }

  // 2. EXTRAÇÃO DE ENDEREÇO
  let extractedAddress = 'Endereço não informado';
  const addressMatch = message.match(/(?:endereço|endereco|rua|local|entregar em|entrega|enviar para):\s*([^\n]+)/i);
  if (addressMatch) {
    extractedAddress = addressMatch[1].trim();
  } else {
    // Tenta encontrar palavras chaves de endereço na mensagem seguido de número
    const streetRegex = /(?:rua|av\.|avenida|alameda|travessa|estrada|rodovia|praça|condominio|condomínio)\s+[A-ZÀ-ÿ0-9\s,.-]+?(?:,\s*|\s+)(?:nº\s*|n\s*|número\s*|numero\s*|casa\s*|apto\s*|apt\s*)?(\d+|s\/n)\b/i;
    const foundStreet = message.match(streetRegex);
    if (foundStreet) {
      extractedAddress = foundStreet[0].trim();
    } else {
      // Tenta pegar linhas que parecem endereço (ex: contendo número no final)
      const lines = message.split('\n');
      for (const line of lines) {
        if (/\d+/.test(line) && (line.toLowerCase().includes('rua') || line.toLowerCase().includes('av') || line.toLowerCase().includes('bairro') || line.toLowerCase().includes('nº') || line.toLowerCase().includes('número') || line.toLowerCase().includes('numero'))) {
          extractedAddress = line.trim();
          break;
        }
      }
    }
  }

  // Garantir que o endereço tenha um número para ser considerado válido
  const hasNumber = /\d+|s\/n/i.test(extractedAddress);
  if (extractedAddress !== 'Endereço não informado' && !hasNumber) {
    // Endereço foi detectado mas falta o número!
    extractedAddress = 'Endereço sem número';
  }

  // 3. EXTRAÇÃO DE BAIRRO (Sem default fictício)
  let extractedNeighborhood = 'Não especificado';
  const neighborhoodMatch = message.match(/(?:bairro):\s*([^\n]+)/i);
  if (neighborhoodMatch) {
    extractedNeighborhood = neighborhoodMatch[1].trim();
  } else {
    // Tenta achar "bairro [Nome]" ou "no [Nome]"
    const neighMatch = message.match(/(?:bairro|no bairro|bairro do|bairro da)\s+([A-ZÀ-ÿa-z0-9\s]+?)(?:\s*[-|]|\s*\n|$)/i);
    if (neighMatch) {
      extractedNeighborhood = neighMatch[1].trim();
    }
  }

  // 4. EXTRAÇÃO DE FORMA DE PAGAMENTO (Sem default fictício)
  let extractedPayment = 'Não especificado';
  if (normalized.includes('pix')) {
    extractedPayment = 'pix';
  } else if (normalized.includes('cartao') || normalized.includes('cartão') || normalized.includes('credito') || normalized.includes('crédito') || normalized.includes('debito') || normalized.includes('débito')) {
    extractedPayment = 'cartao';
  } else if (normalized.includes('dinheiro') || normalized.includes('em espécie') || normalized.includes('especie')) {
    extractedPayment = 'dinheiro';
  }

  // 5. EXTRAÇÃO DE TROCO
  let extractedNeedsChange = false;
  let needsChangeAmount = '';
  const changeMatch = message.match(/(?:troco|troco para):\s*([^\n]+)/i);
  if (changeMatch) {
    extractedNeedsChange = true;
    needsChangeAmount = changeMatch[1].trim();
  } else {
    const trocoRegex = /(?:troco para|troco p\/)\s*(?:r\$)?\s*(\d+(?:[.,]\d{2})?)/i;
    const trocoFound = message.match(trocoRegex);
    if (trocoFound) {
      extractedNeedsChange = true;
      needsChangeAmount = trocoFound[1].trim();
    }
  }

  // 6. EXTRAÇÃO DE ITENS / DETALHES DO PEDIDO (Sem default fictício)
  let extractedItems = 'Não especificado';
  const itemsMatch = message.match(/(?:pedido|itens|item|conteúdo|conteudo):\s*([^\n]+)/i);
  if (itemsMatch) {
    extractedItems = itemsMatch[1].trim();
  } else {
    // Se a mensagem for longa e tiver múltiplos itens por linha ou detalhes, tenta extrair
    const lines = message.split('\n').map(l => l.trim()).filter(Boolean);
    const itemLines = lines.filter(l => /^\d+\s*x|^\d+\s+-|^-|^\*/.test(l));
    if (itemLines.length > 0) {
      extractedItems = itemLines.join(', ');
    } else {
      // Procurar por termos que indicam comida, lanche ou itens específicos de pedido
      const itemKeywords = ['pizza', 'hamburguer', 'lanche', 'suco', 'refrigerante', 'coca', 'agua', 'açaí', 'porção', 'batata', 'pastel', 'marmita', 'combo', 'doce', 'bolo'];
      const hasKeywords = itemKeywords.some(kw => normalized.includes(kw));
      if (hasKeywords) {
        extractedItems = message.length > 60 ? message.substring(0, 57) + '...' : message;
      }
    }
  }

  // 7. EXTRAÇÃO DE VALOR TOTAL
  let extractedTotal = 0.00;
  const totalMatch = message.match(/(?:total|valor|preço|preco):\s*(?:r\$)?\s*(\d+(?:[.,]\d{2})?)/i);
  if (totalMatch) {
    extractedTotal = parseFloat(totalMatch[1].replace(',', '.'));
  } else {
    // Tenta achar qualquer padrão de R$ valor
    const moneyMatch = message.match(/(?:r\$)\s*(\d+(?:[.,]\d{2})?)/i);
    if (moneyMatch) {
      extractedTotal = parseFloat(moneyMatch[1].replace(',', '.'));
    }
  }

  return {
    customer_name: extractedName,
    customer_phone: senderPhone || '',
    delivery_address: extractedAddress,
    neighborhood: extractedNeighborhood,
    reference_point: 'Identificado via WhatsApp Chatbot',
    payment_method: extractedPayment,
    needs_change: extractedNeedsChange,
    change_amount: needsChangeAmount,
    items: extractedItems,
    notes: aiInstructions,
    total_price: extractedTotal > 0 ? extractedTotal : 0.00
  };
}

// --- Helper to Send WhatsApp Messages via Evolution API ---
async function sendWhatsAppMessage(instanceName: string, toPhone: string, text: string) {
  const EVOLUTION_API_URL = 'https://evolution-api-production-4ecca.up.railway.app';
  const EVOLUTION_API_KEY = 'd030a0d540bf1c4ab43a31b3b29b9baddaaabd776537608053e25cbc739c830f';

  // Sanitiza o telefone para garantir formato limpo ou JID completo
  const cleanPhone = toPhone.replace(/\D/g, '');
  if (!cleanPhone) return;
  const jid = toPhone.includes('@') ? toPhone : `${cleanPhone}@s.whatsapp.net`;

  try {
    const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        number: jid,
        text: text,
        delay: 1000,
        linkPreview: false
      })
    });
    
    if (!response.ok) {
      const errText = await response.text();
      console.error(`Error sending message via Evolution API (${response.status}):`, errText);
    } else {
      const data = await response.json();
      console.log(`Successfully sent message to ${jid}:`, JSON.stringify(data));
    }
  } catch (err) {
    console.error('Failed to send WhatsApp message via Evolution API:', err);
  }
}
