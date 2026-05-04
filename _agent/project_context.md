# Izi Delivery - Project Context & Progress
Ultima Atualização: 2026-05-04

## 🎯 Objetivos Concluídos

### 1. Estabilização e Design do Onboarding (App Entregador)
- **UI/UX Premium:** Migração completa da tela de onboarding para o padrão claymorphic (White/Yellow), alinhado com o app de serviços.
- **Timer de Feedback:** Implementação de um timer de 3 segundos na validação inicial. Se a resposta demorar, o app exibe "Cadastro ainda em análise" em vez de apenas um loading infinito.
- **Prevenção de Soft-locks:** Adicionado botão de fechar/voltar na tela de carregamento inicial para que o usuário não fique preso caso a conexão falhe.

### 2. Gestão de Dados e Exclusão Permanente (Admin)
- **Hard Delete Implementado:** As funções de exclusão de Clientes, Entregadores e Lojistas no `AdminProvider.tsx` agora realizam a remoção completa.
- **Integração com Supabase Auth:** Atualização das Edge Functions (`manage-user-auth`, `manage-driver-auth`, `create-admin-user`) para aceitar a ação `delete`.
- **Fluxo de Exclusão:**
    1. Remove o usuário do Supabase Auth (libera e-mail para novo cadastro).
    2. Tenta deletar o registro da tabela SQL.
    3. Caso existam vínculos (pedidos/histórico), o registro é marcado como `is_deleted: true` para integridade, mas o acesso é cortado definitivamente.

### 3. Feedback Visual de Status Online (App Entregador)
- **Modal Premium:** Substituição do `toast` de erro por um modal animado de alta fidelidade quando o entregador tenta ficar online com cadastro pendente.
- **Componente:** `renderPendingApprovalModal` no `App.tsx`, com ícones animados e opção de "Ver Detalhes" para redirecionar ao onboarding.

## 📂 Arquivos Chave Modificados
- `app-entregador-completo/src/components/features/OnboardingView.tsx` (UI e Timer)
- `app-entregador-completo/src/App.tsx` (Status Online e Modal de Feedback)
- `app-admin-completo/src/context/AdminProvider.tsx` (Lógica de Exclusão)
- `supabase/functions/manage-user-auth/index.ts` (Ação de Delete)
- `supabase/functions/manage-driver-auth/index.ts` (Ação de Delete)
- `supabase/functions/create-admin-user/index.ts` (Ação de Delete)

## 🚀 Próximos Passos Sugeridos
- Validar se existem outros fluxos de "soft delete" que deveriam ser "hard delete".
- Implementar notificações push automáticas quando o Admin aprova um cadastro.
