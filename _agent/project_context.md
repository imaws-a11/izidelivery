# IZI Delivery - Contexto Técnico (Resumo Executivo)
Atualizado: 2026-05-14

---

## 🔒 REGRAS CRÍTICAS DE INFRAESTRUTURA

### 🔔 Push Notifications (FCM + Capacitor)
- **Edge Function `broadcast-push`**: DEVE usar `SERVICE_ROLE_KEY` para ler `users_delivery` (RLS restrito).
- **Canais**: `izi_notifications` no Android (Capacitor e Edge Functions devem coincidir).
- **Firebase**: Projeto `izi-delivery-40939`. Entregador (`com.izidelivery.entregador`), Cliente (`com.izidelivery.app`).

### 🛡️ Segurança e Banco de Dados (Hardened: 15/15)
- **RLS**: Ativo em 43 tabelas. Políticas granulares para `auth.uid()`.
- **Radar de Pedidos**: Política `"drivers: ver pedidos disponiveis no radar"` é essencial para persistência.
- **Webhooks**: Validação HMAC obrigatória em MP, OpenNode, PagBank.
- **Soft Delete**: `is_deleted = true` libera credenciais para novos cadastros.

### 🌐 Resiliência de Rede e Erros (NOVO)
- **iziFetch**: Wrapper global obrigatório no App do Entregador. Implementa timeout (12s) e Exponential Backoff para mitigar oscilações de 4G/5G.
- **UX de Erro**: Proibido falhas silenciosas. Validar `!response.ok` em fetchs críticos e disparar `toastError`. 
- **Anti-Concorrência**: Botões de ação (Aceitar, Sacar) DEVEM implementar estados `isLoading/isSubmitting` para evitar cliques duplos e inconsistência de estado.
- **Encoding UTF-8**: Todos os arquivos DEVEM ser mantidos em UTF-8 sem BOM. Executar `fix_encodings.cjs` em caso de detecção de mojibake (`Ã§Ã£o`).

---

## 🚀 FUNCIONALIDADES CORE & REGRAS DE NEGÓCIO

### 💰 Checkout e Pagamentos (Mercado Pago & OpenNode)
- **Unificação Transparente**: Uso obrigatório do `CardPaymentView` (Transparente). Cadastro prévio de cartões e `PaymentMethodsView` foram REMOVIDOS (Política Zero Lixo).
- **Bitcoin Lightning**: Edge Function `create-lightning-invoice` centraliza conversão BTC/BRL. Valor mínimo: $0.01 USD.
- **Anti-Hanging UI**: `ProcessingOverlay` (z-index 10000) e elevação de telas de tracking (z-index 150). `BottomNav` deve permanecer visível em todo o checkout.
- **Broadcasts e Popups**: Realtime via `broadcast_notifications` (Replica Identity FULL). Som de alerta obrigatório no app do entregador ao receber popups administrativos.

### 📦 Logística e Izi Entrega Avulsa
- **Arquitetura**: Reutiliza `orders_delivery` com `service_type = 'entrega_avulsa'`.
- **Mapeamento**: Entregadores da categoria `'motoboy'` visualizam entregas avulsas como pagas (taxa retida).

---

## 🛠️ DESENVOLVIMENTO & CLEAN CODE

- **Estado Global**: `AppContext` centraliza `subView`, `userLocation` e **Realtime User Profile**.
- **App do Entregador**:
  - **Fetch Nativo**: Radar e Vagas DEVEM usar `fetch` nativo para evitar *hanging promises* do client Supabase em redes móveis.
  - **Blindagem Nativa**: Checagem obrigatória de `Capacitor.isNativePlatform()` para evitar crashes em ambiente Web.
  - **Gamificação**: O incremento de progresso (`incrementMissionProgress`) usa `Bearer Token` via fetch nativo para respeitar RLS.
- **Painel Admin**:
  - **Taxonomia**: Cadastro de lojistas simplificado. Especialidades geridas via Centro de Taxonomia centralizado.
  - **Rastreio (Tracking)**: Mapa em estilo *Clean Light* (Uber-style) com auto-geolocalização do Admin.
  - **Gestão de Presença**: Limpeza automática de "pilotos fantasmas" (off-line após 1h de inatividade GPS) executada via `AdminProvider`.

---

## 📂 ESTRUTURA DE ARQUIVOS CHAVE
- **Core**: `AppContext.tsx`, `AdminProvider.tsx`.
- **App Entregador**: `App.tsx`, `DashboardView.tsx`, `iziFetch.ts`.
- **Financeiro**: `create-lightning-invoice` (EF), `mp-webhook` (EF), `IziPayView.tsx`.
- **Utils**: `iziFetch.ts`, `iziSounds.ts`, `telemetry.ts`.
- **Core App**: `App.tsx` (Serviços/Cliente) - Contém orquestração de subViews e Listeners Realtime.

### 🛡️ Atualizações Recentes (Maio/2026)
- **Plano 2 (Full-Screen Intent Hybrid)**: Permissão `USE_FULL_SCREEN_INTENT` e flags nativas em `MainActivity.java` (`setShowWhenLocked`) para acordar a tela e mostrar o app em novos pedidos.
- **Plano 4 (Interactive Overlay)**: Uso de `ForegroundService` com botões de ação dinâmica (Aceitar/Recusar) nas notificações de radar, permitindo aceitação de corridas sem abrir o app.
- **Auditoria de Encoding**: Varredura completa em todos os 3 módulos (Serviços, Admin, Entregador) para remoção de mojibake (caracteres `Ã§Ã£o`).
