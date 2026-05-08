# IZI Delivery - Contexto Técnico (Compacto)
Atualizado: 2026-05-08

---

## 🔒 REGRAS CRÍTICAS — NÃO ALTERAR SEM REVISÃO

### 🚫 Push Notifications — Configuração Blindada
> **NUNCA** altere os itens abaixo sem testar em ambos os apps (Entregador + Serviços).
> Cada item foi debuggado individualmente e representa uma peça essencial da cadeia.

#### Edge Function `broadcast-push`
- **OBRIGATÓRIO:** Usar `SUPABASE_SERVICE_ROLE_KEY` (NÃO `SUPABASE_ANON_KEY`).
  - Motivo: A tabela `users_delivery` tem RLS que impede leitura com anon key. A `drivers_delivery` tem RLS aberta (`true`), por isso funcionava antes. Com service_role_key, ambas as tabelas são lidas corretamente.
- **Canal Android:** `channelId: 'izi_notifications'` — deve ser idêntico ao canal criado no Capacitor.
- **Firebase Secret:** O secret `FIREBASE_SERVICE_ACCOUNT` deve estar configurado no Supabase Dashboard (Settings > Edge Functions > Secrets). Sem ele, a função retorna `warning` e não envia nada.
- **Payload:** Sempre incluir `android.notification.priority: 'high'` e `sound: 'default'`.

#### App Entregador (`app-entregador-completo`)
- **`capacitor.config.ts`:** DEVE conter `PushNotifications: { presentationOptions: ["badge", "sound", "alert"] }`.
- **Canal Capacitor:** `PushNotifications.createChannel({ id: 'izi_notifications', importance: 5 })`.
- **Token:** Salvo em `drivers_delivery.push_token` via `supabase.from('drivers_delivery').update(...)`.
- **Som:** `playIziSound('driver', false)` — segundo parâmetro DEVE ser `false` (sem loop).
- **Alerta verde:** Removido o `toastSuccess` do listener `pushNotificationReceived` para evitar duplicidade.
- **`google-services.json`:** Projeto Firebase `izi-delivery-40939`, package `com.izidelivery.entregador`.

#### App Serviços/Cliente (`app-servicos-completo`)
- **`capacitor.config.ts`:** DEVE conter `PushNotifications: { presentationOptions: ["badge", "sound", "alert"] }`.
- **Canal Capacitor:** `PushNotifications.createChannel({ id: 'izi_notifications', importance: 5 })`.
- **Token:** Salvo em `users_delivery.push_token` via `supabase.from('users_delivery').update(...)`.
- **`AndroidManifest.xml`:** DEVE conter `<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />`.
- **`google-services.json`:** Projeto Firebase `izi-delivery-40939`, package `com.izidelivery.app`.

#### Popup In-App (Notificação do Sistema)
- Design **minimalista**: fundo branco, borda amarela 2px, sombra sutil.
- Ícones: SVG inline direto (NÃO usar `<Icon name="..." />` — renderiza texto em vez de ícone no Android).
- Bell SVG: `<svg width="22" height="22" viewBox="0 0 24 24" ...><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>`
- Close SVG: `<svg width="16" height="16" ...><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
- Auto-hide: 8 segundos via `setTimeout(() => setSystemNotification(null), 8000)`.
- Trigger: Listener Realtime em `broadcast_notifications` (INSERT) seta `setSystemNotification(...)`.

#### RLS — Políticas Relevantes
| Tabela | SELECT | Impacto |
|--------|--------|---------|
| `drivers_delivery` | `true` (aberto) | Edge Function lê tokens com qualquer key |
| `users_delivery` | `auth.uid() = id` (restrito) | Edge Function PRECISA de `SERVICE_ROLE_KEY` |

---

### ✅ Separação de Perfis (Usuário vs Entregador)
- **Desvinculação:** Implementada a separação total entre contas de Cliente (`users_delivery`) e Entregador (`drivers_delivery`).
- **Gatilho Inteligente:** A função `handle_new_user_delivery` agora ignora usuários com metadado `role: 'driver'`, impedindo a criação automática de perfis de cliente para entregadores.
- **Independência de Dados:** Removida a dependência de chave estrangeira entre `driver_applications_delivery` e `users_delivery`, permitindo que candidatos não possuam conta de cliente.
- **Limpeza:** Realizada a limpeza de 15 perfis de clientes que foram criados indevidamente para motoristas que não possuem histórico de compras.

### ✅ Resolução de Conflitos na Aprovação (Admin)
- **Tripla Trava:** Refatorada a inicialização do app para impedir bypass do onboarding.
  - **Auth Sync:** Removida a confiança no `localStorage` para o estado `isAuthenticated`; agora o app aguarda a resposta real do Supabase antes de liberar o Dashboard.
  - **Foreground Enforcement:** Adicionado listener de `visibilitychange` que força a re-verificação do status de aprovação sempre que o app volta do background.
  - **Sequential Loading:** Centralizada a lógica em `loadProfileAndEnforceOnboarding` para garantir que o perfil seja validado antes de qualquer interação online.
- **UX de Status:** 
  - **Card Permanente:** Implementado card vermelho de "Cadastro Pendente" no Dashboard que persiste enquanto `is_active` for falso.
  - **Navegação Livre:** Adicionado botão "Voltar ao Início" em todas as etapas do onboarding (inclusive Boas-vindas), permitindo que o motorista navegue no app em modo leitura enquanto aguarda.

### ✅ Estabilização Onboarding (Entregador)
- **UI/UX:** Design Claymorphic aplicado.
- **Timer:** Feedback "Cadastro em análise" após 3s de loading.
- **Correção:** Adicionado botão de retorno no carregamento (anti-travamento).

### ✅ Exclusão Permanente (Admin & Auth)
- **Sincronia:** `AdminProvider.tsx` sincronizado com Supabase Auth.
- **Edge Functions:** `manage-user-auth`, `manage-driver-auth` e `create-admin-user` atualizadas com `action: 'delete'`.
- **Lógica:** Remove do Auth -> Tenta remover da Tabela -> Fallback p/ `is_deleted` se houver pedidos.

### ✅ Modernização Izi Flash (Cliente)
- **UI:** Fluxo padronizado como Bottom Sheet (z-index: 500) para evitar sobreposição da Home.
- **Visual:** Estilo "Flat" no ProductDetailView, removendo sombras e gradientes obstrutivos.
- **Feedback:** Overlay premium de "Produto Adicionado" com AnimatePresence e ícones dinâmicos.

### **Despacho Exclusivo (Merchant Fleet)**
- **Configuração:** O lojista define em "Minha Frota" se deseja priorizar seus próprios motoboys.
- **Regra de Negócio:** Se `dispatch_priority === 'exclusive'`, as notificações de novos pedidos são filtradas no backend para atingir apenas entregadores com o `merchant_id` correspondente.
- **Autenticação:** Motoboys próprios possuem conta no `auth.users` criada pelo lojista. O `id` na tabela `drivers_delivery` é sincronizado com o `id` do Auth.

### **Notificações Push**
- **Edge Function:** `send-push-notification` centraliza a lógica de roteamento (Global vs Exclusivo).
- **Android:** Utiliza o canal `izi_notifications` com prioridade alta para garantir o "toque" sonoro mesmo em background.

### ✅ Sincronização Multidispositivos
- **Banco:** Criada tabela `cart_sync_delivery` para persistência global.
- **Escopo:** Sincronização em tempo real (Supabase Realtime) de:
  - **Carrinho:** Itens, Cupons e Metadados.
- [x] Modernização do Fluxo de Mobilidade (Izi Logistics)
    - [x] Remoção de inputs redundantes de endereço nos Wizards (Taxi, Van, Frete).
    - [x] Migração do estado `mobilityStep` para o `AppContext` (Centralização).
    - [x] Unificação dos extras do FreightWizard na tela de resumo.
    - [x] Gatilho automático de cálculo de preços no ExploreEnviosUberView.
    - [x] Design Premium Claymorphic aplicado em todos os Wizards e telas de Checkout.
- **Sincronia:** Consistência instantânea entre todos os dispositivos do usuário ao realizar ações ou logar.

### ✅ Resolução de Conflitos na Aprovação (Admin)
- **Correção de Constraint:** Resolvido o erro `duplicate key value violates unique constraint 'drivers_delivery_phone_unique'` ao aprovar motoristas.
- **Índices Parciais (DB):** Alteradas as constraints de `phone` e `email` na tabela `drivers_delivery` para **Índices Parciais** (`WHERE is_deleted = false`). 
  - Isso permite que motoristas excluídos (soft-delete) "liberem" seus números e e-mails para novos cadastros sem causar erros de 409 Conflict.
- **Feedback no Admin:** Refatorado `handleApprove` em `DriverApplicationsTab.tsx` para realizar um check prévio de duplicidade e exibir uma mensagem de erro clara, indicando o nome e o ID do motorista que já possui aquele telefone/e-mail.
- **Limpeza de Dados:** Removidos registros de teste que bloqueavam aprovações reais.

### ✅ Header Ultra-Minimalista (Entregador)
- Remoção do título "Izi Entregador" e do status de conexão do topo da tela.
- Ícones de Perfil e Notificações agora flutuam sem fundos, bordas ou sombras obstrutivas.
- Badge de notificação simplificado para um ponto de destaque (*dot indicator*).
- Header focado 100% em navegação rápida, eliminando qualquer ruído visual.

### **Fleet Exclusivity & Dispatch Logic**
- **Trigger Source**: Notifications for new orders to drivers are triggered in `OrdersMerchantTab.tsx` when a merchant (or admin) accepts an order (status `waiting_driver`).
- **Merchant ID Integrity**: Fixed a bug where accepting an order as a Master Admin would send an `undefined` merchant ID, bypassing the exclusivity filter. Now the `merchant_id` is extracted directly from the order object before the push call.
- **Edge Function Enforcement**: The `send-push-notification` function now explicitly logs the dispatch priority and prevents global broadcasts if a merchant is set to `exclusive` mode.

### **Session Protection & Data Integrity**
- **Anti-Cache Measures**: The Driver App now performs a full purge of `localStorage` on logout and forces a database re-fetch before opening sensitive profile modals.
- **Source of Truth**: `loadProfileAndEnforceOnboarding` is the single point of synchronization between Supabase and the application state.
- **Fonte de Verdade:** O `loadProfileAndEnforceOnboarding` Ã© o Ãºnico responsÃ¡vel por sincronizar o banco -> estado -> localStorage. NÃ£o use `useEffect` paralelos para ler do localStorage no preenchimento de formulÃ¡rios.

### 📂 Arquivos Modificados
- `AppContext.tsx`, `ProductDetailView.tsx`, `App.tsx` (Serviços/Cliente)
- `OnboardingView.tsx`, `App.tsx` (Entregador - UI & Auth)
- `AdminProvider.tsx`, `DriverApplicationsTab.tsx` (Admin)
- `AdminProvider.tsx`, `MyDriversTab.tsx`, `MyStudioTab.tsx` (Merchant Fleet)
- Edge Functions: `manage-user-auth`, `manage-driver-auth`, `create-admin-user`, `broadcast-push`, `send-push-notification`.
- DB: Tabela `cart_sync_delivery`, Índices da tabela `drivers_delivery`, Trigger `handle_new_user_delivery`.
- Android: `AndroidManifest.xml`, `capacitor.config.ts`, `google-services.json` (ambos os apps).
