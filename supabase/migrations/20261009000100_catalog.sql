-- Catálogo público sin información de costos. PostgreSQL 17 / Supabase.
begin;
create schema if not exists extensions;
create extension if not exists btree_gist with schema extensions;
create schema app_private;
revoke all on schema app_private from public;
alter default privileges in schema app_private revoke execute on functions from public,anon,authenticated,service_role;
alter default privileges in schema public revoke execute on functions from public,anon,authenticated,service_role;

create table public.categories (
 id uuid primary key default gen_random_uuid(), name text not null check (length(btrim(name)) between 1 and 150),
 description text, slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 parent_id uuid references public.categories(id) on delete restrict,
 active boolean not null default false, display_order integer not null default 0,
 check (parent_id is distinct from id)
);
create table public.products (
 id uuid primary key default gen_random_uuid(), sku text not null unique check (sku = btrim(sku) and length(sku) between 1 and 80),
 name text not null check (length(btrim(name)) between 1 and 200), description text not null default '',
 category_id uuid not null references public.categories(id) on delete restrict, brand text,
 base_unit text not null check (length(btrim(base_unit)) between 1 and 30), active boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.product_images (
 id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete restrict,
 storage_path text not null unique check (storage_path <> '' and storage_path !~ '(^/|\.\.)'),
 display_order integer not null default 0, is_primary boolean not null default false,
 alt_text text not null check (length(btrim(alt_text)) > 0), approved boolean not null default false
);
create unique index product_one_primary_image on public.product_images(product_id) where is_primary;
create table public.presentations (
 id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete restrict,
 kind text not null check (kind in ('unit','box','package')), label text not null check (length(btrim(label)) > 0),
 base_units bigint not null check (base_units > 0), barcode text unique check (barcode is null or (barcode = btrim(barcode) and length(barcode) > 0)),
 active boolean not null default false, unique (id, product_id)
);
-- Escalones por presentación y mínimo; intervalos [desde,hasta), sin solapes del mismo mínimo activo.
create table public.volume_prices (
 id uuid primary key default gen_random_uuid(), presentation_id uuid not null references public.presentations(id) on delete restrict,
 min_quantity bigint not null check (min_quantity > 0), price_clp bigint not null check (price_clp >= 0),
 valid_from timestamptz not null, valid_until timestamptz, active boolean not null default false,
 check (valid_until is null or valid_until > valid_from),
 exclude using gist (presentation_id with =, min_quantity with =, tstzrange(valid_from, valid_until, '[)') with &&) where (active)
);
create function app_private.touch_product() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := clock_timestamp(); return new; end $$;
create trigger products_updated before update on public.products for each row execute function app_private.touch_product();
-- Evita ciclos de categorías incluso entre dos escrituras concurrentes.
create function app_private.category_tree_guard() returns trigger language plpgsql set search_path = '' as $$
begin
 perform pg_advisory_xact_lock(721032);
 if new.parent_id is not null and exists (
  with recursive ancestors as (
   select id,parent_id from public.categories where id=new.parent_id
   union select c.id,c.parent_id from public.categories c join ancestors a on c.id=a.parent_id
  ) select 1 from ancestors where id=new.id
 ) then raise exception 'category_cycle' using errcode='23514'; end if;
 return new;
end $$;
create trigger category_tree before insert or update of parent_id on public.categories for each row execute function app_private.category_tree_guard();
-- Denegación desde la creación; grants/políticas específicos se agregan en la migración final.
alter table public.categories enable row level security;
revoke all on public.categories from public,anon,authenticated,service_role;
alter table public.products enable row level security;
revoke all on public.products from public,anon,authenticated,service_role;
alter table public.product_images enable row level security;
revoke all on public.product_images from public,anon,authenticated,service_role;
alter table public.presentations enable row level security;
revoke all on public.presentations from public,anon,authenticated,service_role;
alter table public.volume_prices enable row level security;
revoke all on public.volume_prices from public,anon,authenticated,service_role;
revoke all on all functions in schema app_private from public,anon,authenticated,service_role;
commit;
