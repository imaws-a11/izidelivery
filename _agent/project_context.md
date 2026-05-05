# IZI Delivery - Contexto Técnico (Compacto)
Atualizado: 2026-05-05

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
  - **Financeiro:** Saldo da Carteira e Izi Coins.
  - **Perfil:** Status de Membro Izi Black e Método de Pagamento preferido.
- **Sincronia:** Consistência instantânea entre todos os dispositivos do usuário ao realizar ações ou logar.

### 📂 Arquivos Modificados
- `AppContext.tsx`, `ProductDetailView.tsx`, `App.tsx` (Serviços/Cliente)
- `OnboardingView.tsx`, `App.tsx` (Entregador)
- `AdminProvider.tsx` (Admin)
- Edge Functions: `manage-user-auth`, `manage-driver-auth`, `create-admin-user`.
- DB: Tabela `cart_sync_delivery`.
