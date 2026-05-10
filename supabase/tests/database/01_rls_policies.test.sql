BEGIN;
SELECT plan(8);

-- 1. Verificar se o RLS está habilitado nas tabelas críticas (Impede vazamento total)
SELECT is(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'orders_delivery'),
    true,
    'RLS DEVE estar habilitado em orders_delivery'
);

SELECT is(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'drivers_delivery'),
    true,
    'RLS DEVE estar habilitado em drivers_delivery'
);

SELECT is(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'users_delivery'),
    true,
    'RLS DEVE estar habilitado em users_delivery'
);

SELECT is(
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'wallet_transactions_delivery'),
    true,
    'RLS DEVE estar habilitado em wallet_transactions_delivery'
);

-- 2. Verificar a existência da política que previne o IDOR de motoristas (Driver IDOR fix)
SELECT results_eq(
    $$ SELECT policyname::text FROM pg_policies WHERE tablename = 'orders_delivery' AND policyname = 'orders: driver vê apenas pedidos atribuídos' $$,
    ARRAY['orders: driver vê apenas pedidos atribuídos'],
    'Prevenção de IDOR: A política de leitura de motoristas (auth.uid() = driver_id) deve existir.'
);

SELECT results_eq(
    $$ SELECT policyname::text FROM pg_policies WHERE tablename = 'orders_delivery' AND policyname = 'orders: driver atualiza apenas pedidos atribuídos' $$,
    ARRAY['orders: driver atualiza apenas pedidos atribuídos'],
    'Prevenção de IDOR: A política de update de motoristas deve existir.'
);

-- 3. Verificar políticas de Isolamento de Lojistas (Merchants)
SELECT results_eq(
    $$ SELECT policyname::text FROM pg_policies WHERE tablename = 'orders_delivery' AND policyname = 'orders: merchant vê pedidos do próprio estabelecimento' $$,
    ARRAY['orders: merchant vê pedidos do próprio estabelecimento'],
    'Isolamento Merchant: A política de leitura do lojista (auth.uid() = merchant_id) deve existir.'
);

-- 4. Verificar ausência de políticas globais permissivas em dados sensíveis
-- Garante que ninguém acidentalmente suba uma migration com `USING (true)` para o público em orders_delivery
SELECT is_empty(
    $$ SELECT policyname FROM pg_policies WHERE tablename = 'orders_delivery' AND (qual = 'true' OR qual IS NULL) AND policyname NOT ILIKE '%admin%' $$,
    'Zero Trust: Não devem existir políticas de permissão total (qual = true) em orders_delivery para não-admins.'
);

SELECT * FROM finish();
ROLLBACK;
