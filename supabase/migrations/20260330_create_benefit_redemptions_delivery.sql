create extension if not exists pgcrypto;

create table if not exists public.benefit_redemptions_delivery (
  id uuid primary key default gen_random_uuid(),
  source_type text not null check (source_type in ('coupon', 'flash_offer')),
  source_id text not null,
  user_id uuid,
  cpf text,
  order_id uuid,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists benefit_redemptions_delivery_source_idx
  on public.benefit_redemptions_delivery (source_type, source_id);

create unique index if not exists benefit_redemptions_delivery_unique_user_idx
  on public.benefit_redemptions_delivery (source_type, source_id, user_id)
  where user_id is not null;

create unique index if not exists benefit_redemptions_delivery_unique_cpf_idx
  on public.benefit_redemptions_delivery (source_type, source_id, cpf)
  where cpf is not null and cpf <> '';

grant select, insert, update, delete on public.benefit_redemptions_delivery to authenticated;
grant select, insert, update, delete on public.benefit_redemptions_delivery to service_role;
