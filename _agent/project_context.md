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
  - Uso obrigatório de `ProcessingOverlay` (via `isLoading` global) em todas as transações financeiras.
  - Padrão `try/finally` rigoroso para garantir que indicadores de loading sejam resetados mesmo em falhas de rede.
  - Fechamento imediato de modais de entrada (`setShowDepositModal(false)`) após a persistência da ordem para evitar estados de UI zumbis.
- **Sincronização**: O `mp-webhook` e `lightning-webhook` gerenciam a baixa de pedidos e o crédito automático de IZI Coins, roteando via metadados (`type: 'wallet_recharge' | 'order'`).

### 📦 Izi Entrega Avulsa (Logística)
- **Arquitetura**: Reutiliza `orders_delivery` com `service_type = 'entrega_avulsa'`.
- **Mapeamento Entregador**: Mapeado para categoria `'motoboy'`. Pedidos aparecem como pagos (taxa retida do lojista).
- **Frota Exclusiva**: Lojistas podem priorizar motoristas próprios via `dispatch_priority === 'exclusive'`.

### 🛒 Carrinho e Sincronização
- **Persistência**: Tabela `cart_sync_delivery` sincroniza itens em tempo real entre dispositivos via Realtime.
- **UI**: Design Claymorphic aplicado em todo o checkout e wizards de mobilidade.

---

## 🛠️ DESENVOLVIMENTO & CLEAN CODE
- **Estado Global**: `AppContext` centraliza `subView`, `tab`, `userLocation` e `cart`.
- **Navegação**: `navigateSubView` gerencia histórico e estados de visualização.
- **Auth**: Fonte de verdade é exclusivamente o banco de dados; `localStorage` apenas para persistência secundária.
- **Remoção de Legado**: Sempre excluir versões incorretas/legadas de funções ao realizar correções (Polítca de Zero Lixo).

---

## 📂 ESTRUTURA DE ARQUIVOS CHAVE
- **Contextos**: `AppContext.tsx`, `AdminProvider.tsx`.
- **Logística**: `StandaloneDeliveryTab.tsx` (Admin), `App.tsx` (Entregador).
- **Financeiro**: `create-lightning-invoice` (Edge Function), `LightningPaymentView.tsx` (Frontend).
- **Core App**: `App.tsx` (Serviços/Cliente) - Contém orquestração de subViews.
