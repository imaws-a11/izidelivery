alter table if exists public.app_settings_delivery
  add column if not exists "driverFreightCommission" numeric not null default 12,
  add column if not exists "privateDriverCommission" numeric not null default 12;

update public.app_settings_delivery
set
  "driverFreightCommission" = coalesce("driverFreightCommission", "appCommission", 12),
  "privateDriverCommission" = coalesce("privateDriverCommission", "driverFreightCommission", "appCommission", 12);
