alter table if exists public.promotions_delivery
  add column if not exists is_free_shipping boolean not null default false;

update public.promotions_delivery
set is_free_shipping = true
where discount_type = 'free_shipping';

do $$
declare
  discount_constraint_name text;
begin
  if to_regclass('public.promotions_delivery') is null then
    return;
  end if;

  select con.conname
    into discount_constraint_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace nsp on nsp.oid = rel.relnamespace
  where nsp.nspname = 'public'
    and rel.relname = 'promotions_delivery'
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) ilike '%discount_type%'
  limit 1;

  if discount_constraint_name is not null then
    execute format(
      'alter table public.promotions_delivery drop constraint %I',
      discount_constraint_name
    );
  end if;
end $$;

do $$
begin
  if to_regclass('public.promotions_delivery') is null then
    return;
  end if;

  alter table public.promotions_delivery
    add constraint promotions_delivery_discount_type_check
    check (discount_type in ('percent', 'fixed', 'free_shipping'));
exception
  when duplicate_object then null;
end $$;
