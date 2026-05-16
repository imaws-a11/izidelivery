# IZI Delivery - Contexto Técnico (Resumo Executivo)
Atualizado: 2026-05-16 (Sessao: Hardened Onboarding & Document Audit)

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
- **Sincronização Resiliente (Boot)**: Todas as chamadas de sincronização de perfil e dados críticos no `App.tsx` DEVEM implementar um `Promise.race` com timeout de 5 segundos. Isso garante que o app nunca fique travado na tela de carregamento ("Sincronizando") caso o Supabase demore a responder.
- **Fluxo Autoritativo de Auth**: A inicialização do app DEVE ser regida exclusivamente pelo listener `onAuthStateChange`. Chamadas manuais de `getSession` no boot (bootstrap) são PROIBIDAS para evitar duplicidade de sincronização e concorrência de dados.
- **UX de Erro**: Proibido falhas silenciosas. Validar `!response.ok` em fetchs críticos e disparar `toastError`. 
- **Anti-Concorrência & Duplicidade (CRÍTICO)**: Botões de ação (Aceitar, Sacar) DEVEM implementar estados `isLoading/isSubmitting`. Adicionalmente, o `handleUpdateStatus` deve implementar uma trava via `localStorage` (ex: `tx_sent_${missionId}`) para evitar que a mesma missão gere múltiplas transações financeiras em caso de retentativas rápidas ou loops de UI.
- **Encoding UTF-8**: Todos os arquivos DEVEM ser mantidos em UTF-8 sem BOM. Executar `fix_encodings.cjs` em caso de detecção de mojibake (`Ã§Ã£o`).

### 🚀 PERSISTÊNCIA & RESILIÊNCIA DO ENTREGADOR (NOVO: Maio/2026)
- **Cache-First (Hydration)**: O App do Entregador DEVE usar `localStorage` como buffer de leitura imediata. Estados críticos (`stats`, `history`, `earningsHistory`, `withdrawHistory`, `scheduledOrders`) devem ser hidratados do cache no `useState` inicial para evitar telas zeradas ("flicker") durante o boot.
- **Sticky Auth**: Requisições financeiras e de histórico DEVEM aguardar um token de sessão válido. Se o `driverId` estiver presente mas o token for a `ANON_KEY`, a sincronização DEVE ser abortada ou retardada para evitar que o RLS retorne arrays vazios que sobrescrevam o cache local.
- **Isolamento de Sessão**: O `clearDriverSessionState` DEVE limpar explicitamente todas as chaves `izi_driver_*` no logout para garantir que dados de um motorista não vazem para a próxima sessão no mesmo dispositivo.
- **Sincronização Atômica**: Atualizações de estado via `setHistory`, `setStats`, etc., DEVEM disparar persistência imediata no `localStorage` via `useEffect` para garantir que o cache reflita sempre a última versão do banco de dados.
- **Hardened Onboarding**: O acesso ao Dashboard é estritamente condicionado ao carregamento do perfil (`isProfileLoaded`). Se o motorista não estiver ativo (`is_active: false`), ele DEVE ser retido na `OnboardingView` sem possibilidade de bypass via refresh ou navegação.
- **Opaque UI Guards**: Telas de carregamento de credenciais e restrição de acesso DEVEM ser 100% opacas (`bg-white` ou `bg-zinc-50`) e usar `z-index` extremo (5000+) para impedir que o dashboard seja visível por baixo, evitando a percepção de bug.
- **Glassmorphism Logout**: O processo de logout deve ser mascarado por uma tela de transição premium com efeito de vidro fosco (`backdrop-blur`) para garantir uma experiência fluida.

---

## 🚀 FUNCIONALIDADES CORE & REGRAS DE NEGÓCIO

### 💰 Checkout e Pagamentos (Mercado Pago & OpenNode)
- **Unificação Transparente**: Uso obrigatório do `CardPaymentView` (Transparente). Cadastro prévio de cartões e `PaymentMethodsView` foram REMOVIDOS (Política Zero Lixo).
- **Bitcoin Lightning**: Edge Function `create-lightning-invoice` centraliza conversão BTC/BRL. Valor mínimo: $0.01 USD.
- **Anti-Hanging UI**: `ProcessingOverlay` (z-index 10000) e elevação de telas de tracking (z-index 150). `BottomNav` deve permanecer visível em todo o checkout.
- **Broadcasts e Popups**: Realtime via `broadcast_notifications` (Replica Identity FULL). Som de alerta obrigatório no app do entregador ao receber popups administrativos.

### 📦 Logística e Izi Entrega Avulsa
- **Arquitetura**: Reutiliza `orders_delivery` with `service_type = 'entrega_avulsa'`.
- **Mapeamento**: Entregadores da categoria `'motoboy'` visualizam entregas avulsas como pagas (taxa retida).
- **Auditoria Financeira & Transparência:**
    *   Implementado pop-up de detalhes de ganho no histórico do entregador, exibindo Valor Bruto, Taxas IZI, Valor Líquido e Forma de Pagamento real.
    *   **Monitoramento Premium (Lojista):** O `LiveOrderTracking` e `MerchantOrdersTracking` agora exibem detalhes completos: itens do pedido, resumo financeiro, observações e um card de destaque do entregador com botões de **Ligação Direta** e **WhatsApp**.
    *   **Feedback de Radar:** Visual dinâmico (ícones animados de Zap/Radar) enquanto o sistema busca pilotos, garantindo ao lojista que o pedido está sendo processado.
    *   **Sincronização Global:** Executada varredura completa no banco de dados para recalcular e sincronizar o saldo de toda a base de entregadores com base no histórico de transações.
- **Melhorias Estruturais:**
    - **Encoding & Caracteres Especiais:** Como o ambiente é Windows, sempre verifique se o arquivo está em UTF-8 (sem BOM). Após edições via script ou regex, valide se caracteres como `ç`, `ã` e `õ` não foram corrompidos (mojibake como `Ã§`). Caso ocorra, use o script `fix_encoding.cjs` para restaurar.
    - **Sintaxe JSX:** Sempre valide o fechamento de tags após edições estruturais no `App.tsx`. Um erro de sintaxe pode causar Erro 500 no Vite.
    *   Ajustada lógica de busca de pedidos por range de UUID para evitar erros 404 em consultas parciais.
    *   Implementada visualização de senha em texto simples (`plain_password`) para suporte administrativo.
    *   Exibição de fotos reais (`avatar_url`) na listagem e edição de entregadores.
- **Compatibilidade de Tipos (Radar)**: O `normalizeServiceType` em `lib/utils.ts` DEVE mapear TODOS os `service_type` usados pela API de integracao (incluindo `standalone`, `avulsa`, `avulso`, `shipping`) para tipos canonicos reconhecidos pelo `VEHICLE_COMPATIBILITY`. **Ao adicionar novos tipos na API, ATUALIZAR SEMPRE o normalizeServiceType.**
- **Toggle Online -> fetchOrders**: Quando o motorista fica online, o `toggleOnline` DEVE chamar `fetchOrdersRef.current()` para popular o radar com pedidos `waiting_driver` pre-existentes. Sem isso, pedidos criados via API antes do toggle ficam invisiveis.
- **Realtime vs FetchOrders**: Os mapeamentos de campos (`store_name`, `customer`, `pickup_lat`) no handler Realtime (INSERT) DEVEM ser identicos aos do `fetchOrders` para evitar inconsistencias de dados.
- **Precificação (Novo)**: Implementação de modelo linear contínuo configurado dinamicamente no painel Admin, garantindo paridade com as taxas locais.

### 📅 Fluxo de Agendamento (Novo: Maio/2026)
- **Status Inicial**: Pedidos agendados DEVEM ser criados com `status = 'agendado'` e `subtype = 'agendado'`. Isso impede que o radar global dispare alertas sonoros imediatos para os entregadores.
- **Navegação Checkout**: Ao confirmar um agendamento no app de serviços, deve-se usar `navigateSubView("orders")` para garantir que o usuário seja levado à aba correta e a `subView` de checkout seja limpa.
- **Visibilidade**: Pedidos com status `'agendado'` são ocultados do Radar de Entregas (Mapa) e exibidos exclusivamente na aba **Agenda** do aplicativo do entregador.

### 🏪 Filtros de Radar e Aceite de Lojistas
- **Proteção de Lojista**: Pedidos originados em lojas (com `merchant_id` ou tipos `restaurant`, `market`, `pharmacy`, etc.) com status iniciais (`novo`, `pending`, `paid`, `waiting_merchant`) DEVEM ser ocultados do radar dos entregadores até que o lojista aceite o pedido.
- **Exceção**: Envios manuais e agendamentos diretos (`service_type = 'shipping'` ou `'package'`) sem lojista vinculado ignoram esse filtro e aparecem imediatamente no radar (se o status for compatível).

### 🔌 Integrações Externas (API & Webhooks)
- **API Pública (Inbound)**: Edge Function `integration-api` permite criar pedidos e cotar fretes via API Key, facilitando a injeção de corridas por ERPs ou apps como TchauFome.
- **Webhooks (Outbound)**: Sistema nativo no painel dispara notificações (HMAC) em tempo real quando o status do motoboy altera.
- **Autenticação**: Gestão de chaves no painel do lojista com base na tabela segura `merchant_api_keys`.

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
- **Integrações**: `integration-api` (EF), `API_INTEGRATION_DOCS.md`, `IntegrationsTab.tsx`.
- **Utils**: `iziFetch.ts`, `iziSounds.ts`, `telemetry.ts`.
- **Core App**: `App.tsx` (Serviços/Cliente) - Contém orquestração de subViews e Listeners Realtime.

### 🛡️ Atualizações Recentes (Maio/2026)
- **Plano 2 (Full-Screen Intent Hybrid)**: Permissão `USE_FULL_SCREEN_INTENT` e flags nativas em `MainActivity.java` (`setShowWhenLocked`) para acordar a tela e mostrar o app em novos pedidos.
- **Plano 4 (Interactive Overlay)**: Uso de `ForegroundService` com botões de ação dinâmica (Aceitar/Recusar) nas notificações de radar, permitindo aceitação de corridas sem abrir o app.
- **Auditoria de Encoding**: Varredura completa em todos os 3 módulos (Serviços, Admin, Entregador) para remoção de mojibake (caracteres `Ã§Ã£o`).
- **Gestão de Entregadores & UX Lojista**: Refatoração do `AdminProvider` e componentes de tracking para injetar os dados REAIS dos entregadores (`name, phone, vehicle_type, license_plate`) via *JOIN* com a tabela `drivers_delivery`. Implementado design Claymorphic e botões de contato direto (Phone/WhatsApp) no monitor de pedidos ativos para garantir visibilidade total ao lojista.
- **Hardened Onboarding (Default-Deny)**: O acesso ao Dashboard é regido pela política de "Bloqueio por Padrão". O estado inicial de `showOnboarding` é SEMPRE `true` e `isProfileLoaded` é SEMPRE `false`. A liberação do Dashboard só ocorre após o servidor confirmar que o motorista está ativo E possui os 5 documentos obrigatórios preenchidos. Isso elimina brechas de segurança por recarregamento de tela (F5).
- **Atualização Inteligente de Dossiê**: O sistema identifica automaticamente quais dos 5 documentos estão nulos no banco de dados e apresenta uma tela de atualização parcial (`update_docs`) focada apenas nos itens pendentes. Motoristas ativos com documentos incompletos são retidos nesta tela com design Glassmorphism Stealth Luxury até a regularização. O bug que desativava o botão de envio foi corrigido (validação agora olha para os anexos, não para campos de texto).
- **Segurança Autoritativa (NOVO)**: A lógica de autorização foi movida para ser puramente baseada em estado reativo do banco de dados, ignorando cache local para decisões de desbloqueio sensíveis. Isso garante que um motorista bloqueado remotamente nunca consiga acessar o app apenas manipulando o `localStorage`.
- **Diferenciação de Candidaturas no Admin**: Candidaturas de motoristas que já são ativos mas estão atualizando documentos são sinalizadas com o badge azul **"ATUALIZAÇÃO"**. O processo de aprovação usa `upsert` com `onConflict: id` para manter a integridade do registro do motorista e seus dados financeiros.
- **Sincronização de Documentos no Estúdio**: O Estúdio do Entregador (Admin) agora sincroniza documentos de candidaturas pendentes e legadas usando o e-mail como chave secundária. Isso garante que o administrador consiga visualizar e aprovar os documentos mesmo para motoristas que ainda não possuem vínculo de ID (`user_id`).
- **Resgate de Identidade (Limpeza de Fantasmas)**: Usuários que existiam na lista de motoristas mas não possuíam conta de acesso (como Luiz Joviano e Lucas Rovesse) foram resetados para permitir que criem suas contas de login corretamente pelo fluxo oficial do App.
