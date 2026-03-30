alter table public.flash_offers
  add column if not exists product_id text,
  add column if not exists discount_type text default 'percent',
  add column if not exists discount_value numeric(10,2) default 0;

create index if not exists flash_offers_product_id_idx
  on public.flash_offers (product_id);

create index if not exists flash_offers_merchant_product_active_idx
  on public.flash_offers (merchant_id, product_id, is_active);
