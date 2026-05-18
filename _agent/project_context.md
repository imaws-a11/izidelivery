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
- **Auditoria de Push Notifications**: O fluxo de envio de notificações via Firebase FCM (`broadcast-push` e `send-push-notification`) foi corrigido. As Edge Functions agora separam `driverTokens` e `userTokens` e enviam payloads distintos para garantir que o Android aplique corretamente a vibração e o som customizado (`mission_call.mp3`).
- **Canal Nativo Dinâmico (Android Cache Bypass)**: O canal do entregador foi renomeado de `izi_notifications` para `izi_mission_channel` no Capacitor para forçar o Android a recriar o canal ignorando o cache agressivo de permissões, reabilitando a vibração e som para entregadores.
- **Gestão de Candidaturas (Limpeza)**: Adicionado botão "Excluir Registro" para candidaturas rejeitadas na tela de Aprovações do Admin, apoiado por uma nova política de RLS (DELETE) permitindo aos administradores limparem o histórico.
- **Sincronização Radar & Botão Online/Offline**: Integradas propriedades `isOnline` e `handleToggleOnline` diretamente no `<DashboardView />` no App do Entregador, garantindo sincronicidade absoluta em tempo real do radar de ondas concêntricas amarelas com o switch de presença.
- **Correção de Cadastro Preso em "Pendente"**: Resolvido bug onde entregadores recém-aprovados permaneciam bloqueados na tela de onboarding até forçarem um F5 no app. Agora, a alteração de status (`is_active`) atualiza reativamente o estado React (`isApproved`) em tempo real no boot/login.
- **Correção de Crash na Avaliação (Cliente)**: Solucionado TypeError fatal (`showToast is not a function`) no `OrderFeedbackView.tsx` do App do Cliente (`app-servicos-completo`), criando uma função adaptadora local para as APIs reais de toast (`toastSuccess`, `toastWarning`, `toastError`) providas pelo super hook `useApp()`.
- **Redesenho do Card e Timer Izi Flash (Cliente)**: Aplicado design Glassmorphism elegante (fundo translúcido, desfoque de fundo, bordas finas semi-transparentes) e reduzido o arredondamento das bordas (de `rounded-[44px]` para `rounded-[24px]` na Home e `rounded-[20px]` na lista), além de **remover totalmente qualquer efeito de sombra (`shadow`)** e ajustar o tamanho do card na Home para um formato compacto e proporcional de **`w-[72vw] h-48`**. Desenvolvido e integrado um novo temporizador em formato de barra de progresso neon linear que reduz reativamente de tamanho, alterando de cor dourada/laranja para vermelho vibrante ao atingir o limite crítico de tempo (20%), com etiqueta em contagem regressiva reativa.
- **Glassmorphism Minimalista no Izi Pay (Cliente)**: Refatorado o componente [[IziPayView.tsx](file:///c:/Users/swami/.gemini/antigravity/scratch/izidelivery_git/izidelivery/app-servicos-completo/src/components/features/Wallet/IziPayView.tsx)] para **remover todo o design Claymorphic / Neomorphic**, as sombras tridimensionais pesadas e os fundos de cards internos sólidos. Aplicada uma estética Glassmorphic Ultra Minimalista com fundo translúcido e desfoque (`bg-white/10 backdrop-blur-lg`), grade de Dinheiro e Moedas com fundo 100% transparente dividida por borda sutil, barra de cotação com fundo **totalmente removido** (limpo e integrado), botões de ação (Escanear, Enviar, Meu QR e Extrato) **posicionados perfeitamente dentro do header escuro** (`mt-5 bg-white/5 border border-white/5` com QuickActions estilizados para fundo escuro) evitando desconforto visual na divisa de cores, botões planos (`h-13 rounded-2xl` e `h-12 rounded-xl`), e inputs com caixas translúcidas suaves (`bg-zinc-50/40 border border-zinc-200/30`). Toda a tela foi forçada a utilizar a fonte premium **`Plus Jakarta Sans` em negrito (`font-bold`)**.
- **Remoção da Tela Intermediária redundante do Clube Izi Black**: A tela intermediária que exibia a economia de `R$ 76,50` e o botão *"Quero entrar pro Clube"* (que ficava no `IziBlackPurchaseView.tsx`) foi completamente removida. Agora, preservamos a linda landing page nativa principal (`IziBlackView.tsx`) para usuários não membros, e ao clicar no botão dourado *"Desbloquear IZI Black"*, o app leva o usuário **diretamente para a tela de pagamento e entrada de dados (CPF, escolha de Pix/Cartão/Bitcoin)**, tornando a experiência de conversão imediata, limpa e sem etapas desnecessárias. O botão de voltar na tela de pagamentos agora retorna o usuário diretamente para a landing page de benefícios do clube.
- **Rastreamento em Tempo Real & Motor de Busca (Admin - Novo)**: Corrigido bug de closure assíncrona (state shadowing) no listener do Supabase no `AdminProvider.tsx`, garantindo que atualizações de coordenadas e status dos entregadores se propaguem instantaneamente para a Central de Operações sem dados estáticos. Desenvolvido e integrado um **"motor de busca" (campo de pesquisa glassmorphism de alta precisão)** dentro do painel da Central de Operações da tela de Rastreio (`TrackingTab.tsx`), permitindo aos administradores filtrar motoristas online por nome ou placa do veículo instantaneamente no mapa e na lista flutuante.
- **Pins de Mapa Ultra-Premium para Entregadores (Admin - Novo)**: Substituídos os marcadores circulares simples e genéricos do Google Maps por marcadores customizados de alta fidelidade usando `OverlayView`. Agora, os entregadores são representados no mapa por **pins fotográficos contendo suas fotos reais de perfil (avatar_url)** ou ícones de veículos vetorizados elegantes (como motos ou caminhões). Cada pin possui um **indicador flutuante de nome glassmorphism**, uma **aura neon dinâmica pulsante de atividade** (verde-esmeralda para disponível, amarelo-âmbar para ocupado em rota) e badges de status interativos que elevam o padrão visual a um nível comparável ao do aplicativo Uber.
- **Fallback de GPS com Offset Inteligente para Testes (Admin - Novo)**: Implementado no painel Admin (`TrackingTab.tsx`) um mecanismo de posicionamento resiliente para pilotos online sem sinal GPS ativo (coordenadas `NULL` no banco). Eles agora são posicionados em espiral no mapa ao redor do administrador, recebendo badges flutuantes com o texto `(SEM SINAL GPS)`, auras em tom cinza fosco/âmbar e indicador `?`, mantendo a central operacional 100% testável e sem ocultação silenciosa.
- **Atualização Segura de Localização com JWT e last_seen_at (Entregador - Novo)**: Refatorado o motor de geolocalização do aplicativo do entregador (`App.tsx`), realocando-o para sanar o temporal dead zone e integrando-o com a API REST nativa do Supabase (fetch PATCH). A atualização passa a injetar dinamicamente o cabeçalho seguro `Authorization: Bearer <TOKEN>` autenticado (obtido via `getSecureToken()`), superando as restrições estritas de RLS da tabela `drivers_delivery` em planos de fundo móveis. O payload atualiza concorrentemente os campos `lat`, `lng` e o sinal de atividade `last_seen_at` a cada 15 segundos.
- **Visualização & Geração Segura de Senhas no Estúdio do Entregador (Admin - Novo)**: Refatorado o input de senha em dados pessoais do motorista no Estúdio do Entregador ([DriversTab.tsx](file:///c:/Users/swami/.gemini/antigravity/scratch/izidelivery_git/izidelivery/app-admin-completo/src/components/DriversTab.tsx)). Implementado fallback elegante quando `plain_password` for nulo (representando criptografia nativa legacy), exibindo placeholder explicativo *(Senha criptografada - Não visível)*. Integrada ferramenta premium de geração de credenciais via ícone de chave (`vpn_key`) gerando strings legíveis de alta entropia instantaneamente. O motor de persistência foi otimizado para herdar o `plain_password` pré-existente caso nenhuma senha nova seja especificada.
- **Isolamento de Transações por target_app (Financeiro - Novo)**: Solucionado o bug em que ajustes manuais de `izi_coins` realizados para o cliente afetavam incorretamente o saldo da carteira do entregador no smartphone de teste (causado pelo compartilhamento do mesmo `user_id` / UUID). Foi introduzido o campo de metadados `{ target_app: 'customer' | 'driver' }` para a tabela `wallet_transactions_delivery`. A Central Administrativa (`UsersTab.tsx` e `AdminProvider.tsx`) foi atualizada para injetar esse metadado em todas as novas transações. Os aplicativos (`app-entregador-completo/src/App.tsx` e `app-servicos-completo/src/contexts/WalletContext.tsx`) foram adaptados para filtrar e isolar reativamente as transações financeiras de acordo com seu escopo, incluindo retrocompatibilidade inteligente para registros legados que analisa os descritores textuais de transações. Adicionalmente, foi executado um script SQL de higienização global diretamente no banco para normalizar retroativamente toda a base de transações históricas.
- **Histórico e Detalhes de Ganhos no App do Entregador (Novo)**: Implementada a tela de Histórico de Ganhos integrada na aba "Meus Ganhos" (`EarningsView.tsx`), exibindo as últimas 15 transações de depósitos, bônus e corridas com ícones dinâmicos, data/hora e saldo após a transação. Criada a tela de Detalhes dos Ganhos em modal glassmorphism contendo a composição financeira detalhada (Valor Bruto, Taxa de Intermediação IZI, Ganhos Líquidos), dados da rota (Origem e Destino com endereços sanitizados, distância percorrida e método de pagamento se houver), e auditoria completa da transação (tipo de registro, código único UUID, data/hora e saldo pós-transação). Desenvolvido um motor de vinculação inteligente (`findAssociatedOrder`) no frontend para cruzar e associar transações com o histórico local de corridas finalizadas (`ordersHistory`) via hashes de descrição e códigos de rastreamento.
- **Painel de Entrega Avulsa Premium (Admin/Lojista - Novo)**: Overhaul completo do componente `StandaloneDeliveryTab.tsx` do aplicativo administrativo/lojista, substituindo a interface anterior excessivamente branca por um layout ultra-premium e colorido baseado em glassmorphism avançado. Foram injetadas esferas flutuantes de gradiente desfocado (`backdrop-blur-xl`) ao fundo e bordas translúcidas sutis. A interface foi otimizada para o padrão tipográfico Plus Jakarta Sans com pesos extra-negrito (`font-black`) e espaçamento de caixa alta. As seleções de método de pagamento foram transformadas em cards reativos coloridos com reações cromáticas exclusivas (ex: PIX ciano, dinheiro amarelo, etc.). O painel lateral de resumo de frete foi reconstruído em formato dark-glass (`bg-slate-950/90`) exibindo o detalhamento matemático da taxa estimada de partida, adicional por quilometragem e o valor final piscante em neon, além de um widget indicador de saldo em tempo real que avisa se a carteira pré-paga do parceiro possui cobertura financeira para a chamada. Foi integrada também uma ferramenta rápida de simulação ("Preencher Teste") para testes rápidos da equipe técnica.
- **Seletor de Data e Hora Interativo Glassmorphic (Admin/Lojista - Novo)**: Desenvolvido um componente de agendamento 100% customizado sob medida para o painel de entregas avulsas. O campo nativo do navegador foi substituído por um carrossel horizontal de seleção dos próximos 7 dias (com badges reativos para "Hoje", "Amanhã" e dias da semana) e sliders translúcidos de ajuste de horas e minutos em tempo real com botões de ajuste fino. Um resumo dinâmico e minimalista em formato de badge de alarme exibe a seleção final formatada.
- **Unificação de Meios de Pagamento e Bitcoin Lightning (Admin e Entregador - Novo)**: Unificados os botões de cobrança "Crédito" e "Débito" em um único meio de pagamento intuitivo **"Cartão"** (id `cartao`). Ativada e estilizada a opção inovadora de **Bitcoin Lightning** (id `bitcoin_lightning`) com aura amarelada de cripto. Integrada compatibilidade reativa direta no aplicativo do entregador (`App.tsx`) na função `getPaymentLabel` mapeando as labels `⚡ Bitcoin Lightning` e `Cartão (Débito/Crédito)` automaticamente.
- **Fusão de Perfil em Configurações (Lojista - Novo)**: Removida a aba redundante "Perfil" (`merchant_profile`) da navegação dos lojistas de todos os planos de assinatura. Migrado todo o conteúdo de `MerchantProfileTab.tsx` (Dados Gerais cadastrais e Chave PIX para saques e recebimentos) para a aba "Configurações" (`settings` / `MyStoreTab.tsx`), unificando a gestão de conta e logística em um único painel. Os novos componentes utilizam design minimalista Glassmorphism com cards sem fundo sólido (`bg-transparent border border-slate-200 dark:border-slate-800`), tipografia crisp Plus Jakarta Sans em negrito e salvamento atômico instantâneo.
- **Otimização de Abas do Estúdio (Lojista Avulso - Novo)**: Removida a aba "Estande & Geral" da tela "Meu Estúdio" (`MyStudioTab.tsx`) exclusivamente para lojistas do plano "Entrega Avulsa", visto que este perfil não possui exposição direta na plataforma, redirecionando o fluxo de boot automaticamente para a aba "Financeiro & Saque".
