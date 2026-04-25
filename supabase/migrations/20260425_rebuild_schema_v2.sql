-- IZI DELIVERY - SCHEMA REBUILD V2 (CLEAN MIGRATION)

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELAS DE USUÁRIOS E PERFIS
CREATE TABLE IF NOT EXISTS public.users_delivery (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    name TEXT,
    email TEXT,
    phone TEXT,
    avatar_url TEXT,
    izi_coins DECIMAL(12,2) DEFAULT 0,
    user_level INTEGER DEFAULT 1,
    user_xp INTEGER DEFAULT 0,
    is_izi_black BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    role TEXT DEFAULT 'staff',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ESTABELECIMENTOS E CATEGORIAS
CREATE TABLE IF NOT EXISTS public.categories_delivery (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    "order" INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.merchants_delivery (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    owner_id UUID REFERENCES auth.users,
    name TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES public.categories_delivery,
    logo_url TEXT,
    cover_url TEXT,
    address TEXT,
    rating DECIMAL(3,1) DEFAULT 5.0,
    is_open BOOLEAN DEFAULT FALSE,
    delivery_time TEXT,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    min_order DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. PRODUTOS
CREATE TABLE IF NOT EXISTS public.products_delivery (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    merchant_id UUID REFERENCES public.merchants_delivery ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    discount_price DECIMAL(10,2),
    image_url TEXT,
    category TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. ENTREGADORES
CREATE TABLE IF NOT EXISTS public.drivers_delivery (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    name TEXT,
    status TEXT DEFAULT 'offline', -- online, offline, busy
    vehicle_type TEXT,
    current_lat DOUBLE PRECISION,
    current_lng DOUBLE PRECISION,
    rating DECIMAL(3,1) DEFAULT 5.0,
    wallet_balance DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. PEDIDOS
CREATE TABLE IF NOT EXISTS public.orders_delivery (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users,
    merchant_id UUID REFERENCES public.merchants_delivery,
    driver_id UUID REFERENCES public.drivers_delivery,
    status TEXT DEFAULT 'pending', -- pending, accepted, preparing, ready, delivering, completed, cancelled
    total_amount DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending',
    delivery_address JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items_delivery (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders_delivery ON DELETE CASCADE,
    product_id UUID REFERENCES public.products_delivery,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    options JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. FINANCEIRO E CARTEIRA
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users,
    type TEXT NOT NULL, -- deposit, withdrawal, payment, cashback, loan
    amount DECIMAL(12,2) NOT NULL,
    status TEXT DEFAULT 'completed',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.loans_delivery (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users,
    amount DECIMAL(12,2) NOT NULL,
    interest_rate DECIMAL(5,2),
    total_to_pay DECIMAL(12,2),
    paid_amount DECIMAL(12,2) DEFAULT 0,
    status TEXT DEFAULT 'active', -- active, paid, overdue
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. CONFIGURAÇÕES E PROMOÇÕES
CREATE TABLE IF NOT EXISTS public.admin_settings_delivery (
    key TEXT PRIMARY KEY,
    value JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.promotions_delivery (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT,
    description TEXT,
    image_url TEXT,
    coupon_code TEXT,
    discount_value DECIMAL(10,2),
    type TEXT, -- banner, coupon, flash_offer
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. ENDEREÇOS E MÉTODOS DE PAGAMENTO
CREATE TABLE IF NOT EXISTS public.saved_addresses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    label TEXT, -- Home, Work, etc
    address_line TEXT,
    number TEXT,
    complement TEXT,
    neighborhood TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    card_brand TEXT,
    last_digits TEXT,
    card_token TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. HABILITAR RLS (Segurança básica)
ALTER TABLE public.users_delivery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders_delivery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- 11. POLÍTICAS BÁSICAS (Exemplo)
CREATE POLICY "Users can view their own profile" ON public.users_delivery FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users_delivery FOR UPDATE USING (auth.uid() = id);
