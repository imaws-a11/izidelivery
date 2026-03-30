create extension if not exists pgcrypto;

create table if not exists public.merchant_product_option_templates_delivery (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null,
  name text not null,
  sort_order integer not null default 0,
  template_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists merchant_product_option_templates_delivery_merchant_idx
  on public.merchant_product_option_templates_delivery (merchant_id, sort_order);

create or replace function public.set_merchant_product_option_templates_delivery_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_merchant_product_option_templates_delivery_updated_at
  on public.merchant_product_option_templates_delivery;

create trigger trg_merchant_product_option_templates_delivery_updated_at
before update on public.merchant_product_option_templates_delivery
for each row
execute function public.set_merchant_product_option_templates_delivery_updated_at();

grant select, insert, update, delete on public.merchant_product_option_templates_delivery to authenticated;
grant select, insert, update, delete on public.merchant_product_option_templates_delivery to service_role;
