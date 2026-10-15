begin;
create table public.inventory_balances (
 product_id uuid primary key references public.products(id) on delete restrict,
 physical bigint not null default 0 check (physical >= 0), reserved bigint not null default 0 check (reserved >= 0),
 available bigint generated always as (physical-reserved) stored, check (physical >= reserved)
);
create table public.suppliers (
 id uuid primary key default gen_random_uuid(), name text not null check (length(btrim(name))>0), rut text unique,
 contact text, active boolean not null default true
);
create table public.receipts (
 id uuid primary key default gen_random_uuid(), supplier_id uuid not null references public.suppliers(id) on delete restrict,
 received_at timestamptz not null default now(), document_reference text not null check (length(btrim(document_reference))>0),
 status text not null default 'draft' check (status in ('draft','confirmed')),
 created_by uuid not null references auth.users(id) on delete restrict, confirmed_at timestamptz,
 request_key uuid not null unique, check ((status='confirmed')=(confirmed_at is not null))
);
create table public.receipt_items (
 id uuid primary key default gen_random_uuid(), receipt_id uuid not null references public.receipts(id) on delete restrict,
 product_id uuid not null references public.products(id) on delete restrict, presentation_id uuid not null,
 quantity bigint not null check (quantity>0), base_units bigint not null check (base_units>0),
 base_quantity bigint generated always as (quantity*base_units) stored,
 foreign key (presentation_id,product_id) references public.presentations(id,product_id) on delete restrict,
 unique(receipt_id,presentation_id)
);
create table public.receipt_item_costs (
 receipt_item_id uuid primary key references public.receipt_items(id) on delete restrict,
 unit_cost_clp bigint not null check (unit_cost_clp>=0)
);
create table public.orders (
 id uuid primary key default gen_random_uuid(), customer_id uuid not null references auth.users(id) on delete restrict,
 status text not null default 'reserved' check (status in ('reserved','paid','cancelled','expired','payment_review')),
 total_clp bigint not null check (total_clp>=0), created_at timestamptz not null default now(),
 request_key uuid not null, unique(customer_id,request_key)
);
create table public.order_items (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete restrict,
 product_id uuid not null references public.products(id) on delete restrict, presentation_id uuid not null,
 product_name text not null, presentation_label text not null,
 quantity bigint not null check(quantity>0), base_units bigint not null check(base_units>0),
 base_quantity bigint generated always as (quantity*base_units) stored,
 unit_price_clp bigint not null check(unit_price_clp>=0), line_total_clp bigint generated always as (quantity*unit_price_clp) stored,
 foreign key(presentation_id,product_id) references public.presentations(id,product_id) on delete restrict,
 unique(order_id,presentation_id)
);
create table public.external_sales (
 id uuid primary key default gen_random_uuid(), channel text not null check(channel='mercado_libre'),
 external_reference text not null check(external_reference=btrim(external_reference) and length(external_reference)>0),
 sold_at timestamptz not null, created_by uuid not null references auth.users(id) on delete restrict,
 unique(channel,external_reference)
);
create table public.external_sale_items (
 id uuid primary key default gen_random_uuid(), sale_id uuid not null references public.external_sales(id) on delete restrict,
 product_id uuid not null references public.products(id) on delete restrict, presentation_id uuid not null,
 quantity bigint not null check(quantity>0), base_units bigint not null check(base_units>0),
 base_quantity bigint generated always as (quantity*base_units) stored,
 unit_price_clp bigint check(unit_price_clp>=0), foreign key(presentation_id,product_id) references public.presentations(id,product_id) on delete restrict,
 unique(sale_id,presentation_id)
);
create table public.stock_reservations (
 order_id uuid not null references public.orders(id) on delete restrict,
 product_id uuid not null references public.products(id) on delete restrict,
 quantity bigint not null check(quantity>0), expires_at timestamptz not null,
 status text not null default 'active' check(status in ('active','released','consumed','expired')),
 primary key(order_id,product_id)
);
create table public.payments (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete restrict,
 provider text not null check(provider in ('webpay','mercado_pago')), external_id text not null check(length(btrim(external_id))>0),
 amount_clp bigint not null check(amount_clp>=0), status text not null default 'pending' check(status in ('pending','approved','rejected','cancelled','review')),
 created_at timestamptz not null default now(), unique(provider,external_id), unique(id,provider)
);
create table public.payment_events (
 id uuid primary key default gen_random_uuid(), payment_id uuid not null references public.payments(id) on delete restrict,
 provider text not null, external_event_id text not null check(length(btrim(external_event_id))>0),
 requested_state text not null check(requested_state in ('approved','rejected','cancelled')),
 received_at timestamptz not null default now(), outcome text not null,
 unique(provider,external_event_id), foreign key(payment_id,provider) references public.payments(id,provider) on delete restrict
);
create table public.inventory_movements (
 id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete restrict,
 kind text not null check(kind in ('receipt','store_sale','external_sale','return','adjustment_in','adjustment_out')),
 quantity bigint not null check(quantity<>0), channel text not null check(channel in ('store','mercado_libre','internal')),
 operation_key text not null, operation_reference text not null check(length(btrim(operation_reference))>0),
 actor_id uuid references auth.users(id) on delete restrict, created_at timestamptz not null default now(), reason text,
 receipt_id uuid references public.receipts(id) on delete restrict, order_id uuid references public.orders(id) on delete restrict,
 external_sale_id uuid references public.external_sales(id) on delete restrict,
 compensates_id uuid unique references public.inventory_movements(id) on delete restrict,
 unique(product_id,operation_key),
 check ((kind in ('receipt','return','adjustment_in') and quantity>0) or (kind in ('store_sale','external_sale','adjustment_out') and quantity<0)),
 check ((kind='store_sale' and channel='store' and order_id is not null) or (kind='external_sale' and channel='mercado_libre' and external_sale_id is not null) or (kind='receipt' and channel='internal' and receipt_id is not null) or (kind in ('return','adjustment_in','adjustment_out') and channel='internal'))
);
-- El libro y los snapshots confirmados se cambian sólo mediante operaciones autorizadas, nunca CRUD cliente.
create function app_private.reject_mutation() returns trigger language plpgsql set search_path = '' as $$
begin raise exception 'immutable_record' using errcode='55000'; end $$;
create trigger movements_immutable before update or delete on public.inventory_movements for each row execute function app_private.reject_mutation();
create trigger payment_events_immutable before update or delete on public.payment_events for each row execute function app_private.reject_mutation();
-- Denegación desde la creación; grants/políticas específicos se agregan en la migración final.
alter table public.inventory_balances enable row level security;
revoke all on public.inventory_balances from public,anon,authenticated,service_role;
alter table public.suppliers enable row level security;
revoke all on public.suppliers from public,anon,authenticated,service_role;
alter table public.receipts enable row level security;
revoke all on public.receipts from public,anon,authenticated,service_role;
alter table public.receipt_items enable row level security;
revoke all on public.receipt_items from public,anon,authenticated,service_role;
alter table public.receipt_item_costs enable row level security;
revoke all on public.receipt_item_costs from public,anon,authenticated,service_role;
alter table public.orders enable row level security;
revoke all on public.orders from public,anon,authenticated,service_role;
alter table public.order_items enable row level security;
revoke all on public.order_items from public,anon,authenticated,service_role;
alter table public.external_sales enable row level security;
revoke all on public.external_sales from public,anon,authenticated,service_role;
alter table public.external_sale_items enable row level security;
revoke all on public.external_sale_items from public,anon,authenticated,service_role;
alter table public.stock_reservations enable row level security;
revoke all on public.stock_reservations from public,anon,authenticated,service_role;
alter table public.payments enable row level security;
revoke all on public.payments from public,anon,authenticated,service_role;
alter table public.payment_events enable row level security;
revoke all on public.payment_events from public,anon,authenticated,service_role;
alter table public.inventory_movements enable row level security;
revoke all on public.inventory_movements from public,anon,authenticated,service_role;
revoke all on all functions in schema app_private from public,anon,authenticated,service_role;
commit;
