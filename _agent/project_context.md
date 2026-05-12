# IZI Delivery - Contexto Técnico (Resumo Executivo)
Atualizado: 2026-05-11

---

## 🔒 REGRAS CRÍTICAS DE INFRAESTRUTURA

### 🔔 Push Notifications (FCM + Capacitor)
- **Edge Function `broadcast-push`**: DEVE usar `SERVICE_ROLE_KEY` para ler `users_delivery` (RLS restrito).
- **Canais**: `izi_notifications` no Android (Capacitor e Edge Functions devem coincidir).
- **Configuração App**: `capacitor.config.ts` com `presentationOptions: ["badge", "sound", "alert"]`.
- **Firebase**: Projeto `izi-delivery-40939`. Entregador (`com.izidelivery.entregador`), Cliente (`com.izidelivery.app`).

### 🛡️ Segurança e Banco de Dados (Hardened: 15/15)
- **RLS**: Ativo em 43 tabelas. Políticas granulares para `auth.uid()`.
- **Radar de Pedidos**: Política `"drivers: ver pedidos disponiveis no radar"` é essencial para persistência de pedidos não aceitos no App do Entregador.
- **Webhooks**: Validação de assinatura HMAC obrigatória em todos os endpoints financeiros (MP, OpenNode, PagBank).
- **Soft Delete**: `is_deleted = true` libera e-mail/telefone para novos cadastros (índices parciais).

---

## 🚀 FUNCIONALIDADES CORE & REGRAS DE NEGÓCIO

### 💰 Pagamentos Bitcoin Lightning (OpenNode)
- **Fluxo Centralizado**: `AppContext.handleResumePayment` é a única fonte de verdade para retomar pagamentos pendentes.
- **Edge Function `create-lightning-invoice`**:
  - Conversão precisa BTC/BRL/USD via Coinbase API com fallbacks.
  - Checkpoints de diagnóstico integrados para resolução rápida de erros 401/404/500.
  - Valor mínimo forçado em $0.01 USD conforme requisitos do OpenNode.
- **Estabilização de UI (Anti-Hanging)**:
  - Uso obrigatório de `ProcessingOverlay` (z-index 10000) e elevação de telas de pagamento/tracking para z-index 150 (mantendo BottomNav visível).
  - Navegação via `navigateSubView` para garantir consistência de histórico e re-renderização correta.
  - O `BottomNav` permanece visível durante fluxos de pagamento (`card_payment`, `pix_payment`, `lightning_payment`) para evitar a sensação de "tela sumida".
- **Sincronização**: O `mp-webhook` e `lightning-webhook` gerenciam a baixa de pedidos e o crédito automático de IZI Coins, roteando via metadados (`type: 'wallet_recharge' | 'order'`).

### 📦 Izi Entrega Avulsa (Logística)
- **Arquitetura**: Reutiliza `orders_delivery` com `service_type = 'entrega_avulsa'`.
- **Mapeamento Entregador**: Mapeado para categoria `'motoboy'`. Pedidos aparecem como pagos (taxa retida do lojista).
- **Frota Exclusiva**: Lojistas podem priorizar motoristas próprios via `dispatch_priority === 'exclusive'`.

### 💰 Pagamentos e Checkout
- **Unificação Transparente**: O checkout de cartões foi unificado no `CardPaymentView` (Mercado Pago Transparente), eliminando a necessidade de cadastro prévio de cartões.
- **Remoção de Legado**: A subView `payments`, o componente `PaymentMethodsView` e toda a lógica de `savedCards` foram removidos do código (front, contexto e hooks), seguindo a política de Zero Lixo.
- **Renomeação**: Métodos de pagamento simplificados para "Cartão" em toda a interface.
- **Recargas (Izi Coin)**: O fluxo de depósito agora ignora atalhos de cartões salvos legados, forçando o uso do fluxo transparente para maior segurança e sucesso na transação.
- **Estética Premium**: Telas de pagamento agora seguem o tema claro (#F7F7F7) para manter consistência com o restante do app e garantir legibilidade.
- **Sincronização Realtime**: Monitoramento ativo de `users_delivery` para atualização instantânea de saldo após webhook.

### 🔔 Notificações e Push (FCM + Capacitor)
- **Resiliência**: Edge Functions de notificação (como `send-push-notification`) agora retornam status 200 com erro `no_token` para evitar falhas de rede no console do frontend.
- **Fallback In-App**: Notificações internas disparam um `showToast` local imediato no App do cliente como fallback visual para usuários sem push token registrado ou em plataforma Web.
- **Registro de Token**: O registro ocorre via `PushNotifications.addListener('registration')` condicionado à existência de `userId` no `AppContext`.

---

## 🛠️ DESENVOLVIMENTO & CLEAN CODE
- **Estado Global**: `AppContext` centraliza `subView`, `tab`, `userLocation`, `cart` e **Realtime User Profile**.
- **Navegação**: `navigateSubView` gerencia histórico e estados de visualização.
- **Auth**: Fonte de verdade é exclusivamente o banco de dados; `localStorage` apenas para persistência secundária.
- **App do Entregador (Radar & APK)**:
  - **Fetch Nativo**: O Radar DEVE usar `fetch` nativo com o REST API do Supabase em vez da biblioteca client para evitar travamentos (hanging promises) em redes instáveis ou no APK.
  - **Blindagem Nativa**: Todas as chamadas a APIs de navegador (como `Notification`) ou plugins (como `ForegroundService`) devem ser protegidas com `typeof ... !== 'undefined'` e `Capacitor.isNativePlatform()` para evitar crashes (ReferenceErrors).
  - **Persistência Online**: O status `is_online` no boot deve priorizar o `localStorage` para evitar que o refresh da página "derrube" o entregador indevidamente.
- **Remoção de Legado**: Sempre excluir versões incorretas/legadas de funções ao realizar correções (Política de Zero Lixo).

---

## 📂 ESTRUTURA DE ARQUIVOS CHAVE
- **Contextos**: `AppContext.tsx`, `AdminProvider.tsx`.
- **Logística**: `StandaloneDeliveryTab.tsx` (Admin), `App.tsx` (Entregador).
- **Financeiro**: `create-lightning-invoice` (Edge Function), `mp-webhook` (Edge Function), `IziPayView.tsx` (Recargas).
- **Core App**: `App.tsx` (Serviços/Cliente) - Contém orquestração de subViews e Listeners Realtime.
