-- ============================================================
-- IZI DELIVERY — RLS em todas as tabelas desprotegidas
-- Migration: 20260510_rls_all_tables.sql
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- HELPER: função que verifica se o chamador é admin
-- Usada dentro das políticas para evitar repetição
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE id = auth.uid()
      AND role = 'admin'
      AND is_active = TRUE
  );
$$;


-- ============================================================
-- 1. ADMIN_USERS
-- Quem acessa: app-admin (lojistas leem seu próprio perfil,
--              admin lê/escreve tudo)
-- ============================================================
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Cada lojista/admin lê apenas o próprio registro
CREATE POLICY "admin_users: leitura própria"
  ON public.admin_users FOR SELECT
  USING (auth.uid() = id);

-- Admin pode ler todos os registros
CREATE POLICY "admin_users: admin lê tudo"
  ON public.admin_users FOR SELECT
  USING (public.is_admin());

-- Apenas admin pode inserir novos usuários admin (via Edge Function com service_role)
-- O INSERT é feito via service_role key — nenhuma policy de INSERT necessária para anon/authenticated

-- Cada usuário atualiza apenas seu próprio perfil
CREATE POLICY "admin_users: atualização própria"
  ON public.admin_users FOR UPDATE
  USING (auth.uid() = id);

-- Admin pode atualizar qualquer registro
CREATE POLICY "admin_users: admin atualiza tudo"
  ON public.admin_users FOR UPDATE
  USING (public.is_admin());

-- Apenas admin pode deletar
CREATE POLICY "admin_users: admin deleta"
  ON public.admin_users FOR DELETE
  USING (public.is_admin());


-- ============================================================
-- 2. CATEGORIES_DELIVERY
-- Leitura pública (usuários veem categorias sem login)
-- Escrita apenas admin
-- ============================================================
ALTER TABLE public.categories_delivery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories: leitura pública"
  ON public.categories_delivery FOR SELECT
  USING (true);

CREATE POLICY "categories: admin escreve"
  ON public.categories_delivery FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "categories: admin atualiza"
  ON public.categories_delivery FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "categories: admin deleta"
  ON public.categories_delivery FOR DELETE
  USING (public.is_admin());


-- ============================================================
-- 3. MERCHANTS_DELIVERY
-- Leitura pública (lista de estabelecimentos)
-- Escrita: lojista edita o próprio, admin edita tudo
-- ============================================================
ALTER TABLE public.merchants_delivery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "merchants: leitura pública"
  ON public.merchants_delivery FOR SELECT
  USING (true);

CREATE POLICY "merchants: lojista atualiza próprio"
  ON public.merchants_delivery FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "merchants: admin atualiza tudo"
  ON public.merchants_delivery FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "merchants: admin insere"
  ON public.merchants_delivery FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "merchants: admin deleta"
  ON public.merchants_delivery FOR DELETE
  USING (public.is_admin());


-- ============================================================
-- 4. PRODUCTS_DELIVERY
-- Leitura pública
-- Escrita: lojista dono do merchant, admin
-- ============================================================
ALTER TABLE public.products_delivery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products: leitura pública"
  ON public.products_delivery FOR SELECT
  USING (true);

CREATE POLICY "products: lojista insere no próprio merchant"
  ON public.products_delivery FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.merchants_delivery m
      WHERE m.id = merchant_id AND m.owner_id = auth.uid()
    )
  );

CREATE POLICY "products: lojista atualiza no próprio merchant"
  ON public.products_delivery FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.merchants_delivery m
      WHERE m.id = merchant_id AND m.owner_id = auth.uid()
    )
  );

CREATE POLICY "products: lojista deleta no próprio merchant"
  ON public.products_delivery FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.merchants_delivery m
      WHERE m.id = merchant_id AND m.owner_id = auth.uid()
    )
  );

CREATE POLICY "products: admin escreve tudo"
  ON public.products_delivery FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ============================================================
-- 5. DRIVERS_DELIVERY
-- Driver lê/atualiza apenas o próprio registro
-- Admin lê e atualiza tudo
-- ============================================================
ALTER TABLE public.drivers_delivery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "drivers: leitura própria"
  ON public.drivers_delivery FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "drivers: admin lê tudo"
  ON public.drivers_delivery FOR SELECT
  USING (public.is_admin());

CREATE POLICY "drivers: inserção própria"
  ON public.drivers_delivery FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "drivers: atualização própria"
  ON public.drivers_delivery FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "drivers: admin atualiza tudo"
  ON public.drivers_delivery FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "drivers: admin deleta"
  ON public.drivers_delivery FOR DELETE
  USING (public.is_admin());


-- ============================================================
-- 6. ORDER_ITEMS_DELIVERY
-- Usuário vê itens dos próprios pedidos
-- Lojista vê itens dos pedidos do próprio merchant
-- Driver vê itens do pedido que está entregando
-- Admin vê tudo
-- ============================================================
ALTER TABLE public.order_items_delivery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_items: usuário vê próprios itens"
  ON public.order_items_delivery FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders_delivery o
      WHERE o.id = order_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "order_items: lojista vê itens do próprio merchant"
  ON public.order_items_delivery FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders_delivery o
      JOIN public.merchants_delivery m ON m.id = o.merchant_id
      WHERE o.id = order_id AND m.owner_id = auth.uid()
    )
  );

CREATE POLICY "order_items: driver vê itens do pedido atribuído"
  ON public.order_items_delivery FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders_delivery o
      WHERE o.id = order_id AND o.driver_id = auth.uid()
    )
  );

CREATE POLICY "order_items: admin vê tudo"
  ON public.order_items_delivery FOR SELECT
  USING (public.is_admin());

CREATE POLICY "order_items: inserção autenticada"
  ON public.order_items_delivery FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders_delivery o
      WHERE o.id = order_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "order_items: admin escreve tudo"
  ON public.order_items_delivery FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ============================================================
-- 7. LOANS_DELIVERY
-- Usuário vê e opera apenas os próprios empréstimos
-- Admin vê e opera tudo
-- ============================================================
ALTER TABLE public.loans_delivery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "loans: usuário lê próprios"
  ON public.loans_delivery FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "loans: admin lê tudo"
  ON public.loans_delivery FOR SELECT
  USING (public.is_admin());

CREATE POLICY "loans: usuário insere próprio"
  ON public.loans_delivery FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "loans: usuário atualiza próprio"
  ON public.loans_delivery FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "loans: admin escreve tudo"
  ON public.loans_delivery FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ============================================================
-- 8. ADMIN_SETTINGS_DELIVERY
-- Leitura autenticada (apps leem configurações globais)
-- Escrita apenas admin
-- ============================================================
ALTER TABLE public.admin_settings_delivery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings: leitura autenticada"
  ON public.admin_settings_delivery FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "settings: admin escreve"
  ON public.admin_settings_delivery FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "settings: admin atualiza"
  ON public.admin_settings_delivery FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "settings: admin deleta"
  ON public.admin_settings_delivery FOR DELETE
  USING (public.is_admin());


-- ============================================================
-- 9. PROMOTIONS_DELIVERY
-- Leitura pública (banners, cupons visíveis sem login)
-- Escrita apenas admin
-- ============================================================
ALTER TABLE public.promotions_delivery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "promotions: leitura pública"
  ON public.promotions_delivery FOR SELECT
  USING (true);

CREATE POLICY "promotions: admin escreve"
  ON public.promotions_delivery FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "promotions: admin atualiza"
  ON public.promotions_delivery FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "promotions: admin deleta"
  ON public.promotions_delivery FOR DELETE
  USING (public.is_admin());


-- ============================================================
-- 10. SAVED_ADDRESSES
-- Usuário acessa apenas os próprios endereços
-- Admin acessa tudo
-- ============================================================
ALTER TABLE public.saved_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "addresses: usuário lê próprios"
  ON public.saved_addresses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "addresses: usuário insere próprio"
  ON public.saved_addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "addresses: usuário atualiza próprio"
  ON public.saved_addresses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "addresses: usuário deleta próprio"
  ON public.saved_addresses FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "addresses: admin acessa tudo"
  ON public.saved_addresses FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ============================================================
-- 11. PAYMENT_METHODS
-- Usuário acessa apenas os próprios métodos de pagamento
-- Admin acessa tudo
-- ============================================================
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_methods: usuário lê próprios"
  ON public.payment_methods FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "payment_methods: usuário insere próprio"
  ON public.payment_methods FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "payment_methods: usuário atualiza próprio"
  ON public.payment_methods FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "payment_methods: usuário deleta próprio"
  ON public.payment_methods FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "payment_methods: admin acessa tudo"
  ON public.payment_methods FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ============================================================
-- CORRIGIR: orders_delivery — adicionar política DELETE ausente
-- (já tinha RLS ativo mas faltava DELETE e política para driver/lojista)
-- ============================================================

-- Lojista vê pedidos do próprio merchant
CREATE POLICY "orders: lojista lê próprio merchant"
  ON public.orders_delivery FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.merchants_delivery m
      WHERE m.id = merchant_id AND m.owner_id = auth.uid()
    )
  );

-- Driver vê pedido atribuído a ele
CREATE POLICY "orders: driver lê pedido atribuído"
  ON public.orders_delivery FOR SELECT
  USING (auth.uid() = driver_id);

-- Admin vê tudo
CREATE POLICY "orders: admin acessa tudo"
  ON public.orders_delivery FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Nenhum usuário pode deletar pedido (apenas admin via service_role)
-- (política de DELETE não criada para authenticated — bloqueia por padrão)
