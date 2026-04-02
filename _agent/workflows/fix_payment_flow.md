---
description: Consertar o Fluxo de Pagamento e Checkout do IziDelivery
---

// turbo-all
Para garantir que o fluxo de checkout e pagamentos esteja 100% funcional sem quebras, siga estes passos:

1. Analisar a função handlePlaceOrder no App.tsx
   - Localizar a definição da função.
   - Verificar como o `supabase.from('orders_delivery').insert(...)` está sendo chamado.
   - Checar se todos os campos obrigatórios (user_id, merchant_id, amount, status) estão presentes.

2. Validar Restrições do Banco de Dados
   - Executar SQL para ver as colunas obrigatórias (NOT NULL) da tabela `orders_delivery`.
   - Comparar se o que o App.tsx está enviando bate com o que o banco exige.

3. Testar a Chamada da Edge Function
   - Verificar se as Edge Functions `create-mp-pix` e `process-mp-payment` recebem os dados extras corretamente (email, customer).

4. Corrigir o Realtime Listener (Se necessário)
   - Adicionar ou consertar o `channel` do Supabase no App.tsx que ouve atualizações de status para fechar modais de pagamento assim que o webhook responder.

5. Limpeza de Encoding
   - Rodar um comando shell para garantir que o App.tsx permaneça em formato UTF-8 (sem BOM) após as edições.
