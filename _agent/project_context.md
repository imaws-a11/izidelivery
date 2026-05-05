# IZI Delivery - Contexto Técnico (Compacto)
Atualizado: 2026-05-04

### ✅ Estabilização Onboarding (Entregador)
- **UI/UX:** Design Claymorphic aplicado.
- **Timer:** Feedback "Cadastro em análise" após 3s de loading.
- **Correção:** Adicionado botão de retorno no carregamento (anti-travamento).

### ✅ Exclusão Permanente (Admin & Auth)
- **Sincronia:** `AdminProvider.tsx` sincronizado com Supabase Auth.
- **Edge Functions:** `manage-user-auth`, `manage-driver-auth` e `create-admin-user` atualizadas com `action: 'delete'`.
- **Lógica:** Remove do Auth -> Tenta remover da Tabela -> Fallback p/ `is_deleted` se houver pedidos.

### ✅ Feedback Visual Online (Entregador)
- **UI:** Modal Premium animado para cadastro pendente (substitui Toast).
- **Navegação:** Botão "Ver Detalhes" integrado ao fluxo de onboarding.

### 📂 Arquivos Modificados
- `OnboardingView.tsx`, `App.tsx` (Entregador)
- `AdminProvider.tsx` (Admin)
- Edge Functions: `manage-user-auth`, `manage-driver-auth`, `create-admin-user`.
