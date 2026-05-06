# IZI Delivery - Contexto Técnico (Compacto)
Atualizado: 2026-05-06

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

- **Header Ultra-Minimalista:**
    - Remoção do título "Izi Entregador" e do status de conexão do topo da tela.
    - Ícones de Perfil e Notificações agora flutuam sem fundos, bordas ou sombras obstrutivas.
    - Badge de notificação simplificado para um ponto de destaque (*dot indicator*).
- **UX:** Header focado 100% em navegação rápida, eliminando qualquer ruído visual que compita com os dados operacionais.

### 📂 Arquivos Modificados
- `AppContext.tsx`, `ProductDetailView.tsx`, `App.tsx` (Serviços/Cliente)
- `OnboardingView.tsx`, `App.tsx` (Entregador - UI & Auth)
- `AdminProvider.tsx`, `DriverApplicationsTab.tsx` (Admin)
- Edge Functions: `manage-user-auth`, `manage-driver-auth`, `create-admin-user`.
- DB: Tabela `cart_sync_delivery`, Índices da tabela `drivers_delivery`, Trigger `handle_new_user_delivery`.
