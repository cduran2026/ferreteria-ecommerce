begin;
-- Decisiones de la etapa 03: brutos CLP; IVA separado, TTL configurable y confirmación sólo admin.
create table app_private.commerce_settings (
 singleton boolean primary key default true check(singleton),
 reserve_minutes integer not null default 15 check(reserve_minutes between 1 and 120),
 tax_rate_bps integer not null default 1900 check(tax_rate_bps between 0 and 10000)
);
insert into app_private.commerce_settings default values;
revoke all on app_private.commerce_settings from public,anon,authenticated,service_role;
alter table app_private.commerce_settings enable row level security;
alter table public.orders add column tax_rate_bps integer not null default 1900 check(tax_rate_bps between 0 and 10000);
alter table public.orders add column net_clp bigint not null default 0 check(net_clp>=0);
alter table public.orders add column tax_clp bigint generated always as (total_clp-net_clp) stored;
create function app_private.order_tax() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='INSERT' then select tax_rate_bps into new.tax_rate_bps from app_private.commerce_settings where singleton; end if;
 new.net_clp:=round(new.total_clp::numeric*10000/(10000+new.tax_rate_bps))::bigint;
 return new;
end $$;
create trigger order_tax_snapshot before insert or update of total_clp on public.orders for each row execute function app_private.order_tax();
update public.orders set total_clp=total_clp;
create function app_private.reservation_expiry() returns trigger language plpgsql security definer set search_path='' as $$
begin new.expires_at:=clock_timestamp()+make_interval(mins => (select reserve_minutes from app_private.commerce_settings where singleton)); return new; end $$;
create trigger reservation_config before insert on public.stock_reservations for each row execute function app_private.reservation_expiry();
create function public.set_reservation_minutes(minutes integer) returns void language plpgsql security definer set search_path='' as $$
begin perform app_private.require_staff(array['admin']); update app_private.commerce_settings set reserve_minutes=minutes where singleton; end $$;

alter table public.inventory_movements drop constraint inventory_movements_compensates_id_key;
create index movements_compensation_idx on public.inventory_movements(compensates_id) where compensates_id is not null;
create table public.stock_returns (
 id uuid primary key default gen_random_uuid(), original_movement_id uuid not null references public.inventory_movements(id),
 quantity bigint not null check(quantity>0), sellable boolean not null, reason text not null check(length(btrim(reason))>0),
 request_key uuid not null unique, movement_id uuid unique references public.inventory_movements(id),
 actor_id uuid not null references auth.users(id), created_at timestamptz not null default now(),
 check(sellable=(movement_id is not null))
);
alter table public.stock_returns enable row level security;
revoke all on public.stock_returns from public,anon,authenticated,service_role;
grant select on public.stock_returns to authenticated;
create policy returns_admin on public.stock_returns for select to authenticated using(app_private.has_role(array['admin']));
create trigger stock_returns_immutable before update or delete on public.stock_returns for each row execute function app_private.reject_mutation();
create function public.return_stock(original uuid, units bigint, is_sellable boolean, reason text, request uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare m public.inventory_movements; r public.stock_returns; used bigint; movement uuid; rid uuid;
begin
 perform app_private.require_staff(array['admin']);
 if units is null or units<=0 or is_sellable is null or request is null or reason is null or btrim(reason)='' then raise exception 'invalid_return' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(hashtextextended('return:'||request,0));
 select * into r from public.stock_returns where request_key=request;
 if found then
  if r.original_movement_id<>original or r.quantity<>units or r.sellable<>is_sellable or r.reason<>reason then raise exception 'idempotency_conflict' using errcode='22023'; end if; return r.id;
 end if;
 select * into strict m from public.inventory_movements where id=original for update;
 if m.kind not in ('store_sale','external_sale') then raise exception 'not_sale_movement' using errcode='22023'; end if;
 select coalesce(sum(quantity),0) into used from public.stock_returns where original_movement_id=original;
 used:=used+coalesce((select sum(quantity) from public.inventory_movements c where c.compensates_id=original and not exists(select 1 from public.stock_returns x where x.movement_id=c.id)),0);
 if units > -m.quantity-used then raise exception 'return_exceeds_sale' using errcode='23514'; end if;
 if is_sellable then movement:=app_private.move_stock(m.product_id,units,'return','internal','return:'||request,original::text,null,null,null,original,reason); end if;
 insert into public.stock_returns(original_movement_id,quantity,sellable,reason,request_key,movement_id,actor_id) values(original,units,is_sellable,reason,request,movement,auth.uid()) returning id into rid;
 return rid;
end $$;
-- MIME/tamaño también se validan en el servidor Storage, no sólo en formularios.
update storage.buckets set file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp'] where id='ferreteria-product-images';
revoke all on function public.set_reservation_minutes(integer),public.return_stock(uuid,bigint,boolean,text,uuid) from public,anon,authenticated,service_role;
grant execute on function public.set_reservation_minutes(integer),public.return_stock(uuid,bigint,boolean,text,uuid) to authenticated;
revoke all on function app_private.order_tax(),app_private.reservation_expiry() from public,anon,authenticated,service_role;
create or replace function public.confirm_receipt(receipt uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare r public.receipts; line record;
begin
 perform app_private.require_staff(array['admin']);
 select * into strict r from public.receipts where id=receipt for update;
 if r.status='confirmed' then return r.id; end if;
 if not exists(select 1 from public.receipt_items where receipt_id=receipt) then raise exception 'empty_receipt' using errcode='22023'; end if;
 perform app_private.lock_stock(array(select product_id from public.receipt_items where receipt_id=receipt));
 for line in select product_id,sum(base_quantity)::bigint qty from public.receipt_items where receipt_id=receipt group by product_id order by product_id loop
  perform app_private.move_stock(line.product_id,line.qty,'receipt','internal','receipt:'||receipt,receipt::text,receipt);
 end loop;
 update public.receipts set status='confirmed',confirmed_at=now() where id=receipt;
 return receipt;
end $$;


create or replace function public.compensate_movement(original uuid, reason text) returns uuid language plpgsql security definer set search_path='' as $$
declare m public.inventory_movements; existing uuid;
begin
 perform app_private.require_staff(array['admin']);
 if reason is null or btrim(reason)='' then raise exception 'reason_required' using errcode='22023'; end if;
 select * into strict m from public.inventory_movements where id=original for update;
 if exists(select 1 from public.stock_returns where original_movement_id=original) then raise exception 'partial_return_exists' using errcode='22023'; end if;
 select id into existing from public.inventory_movements where compensates_id=original;
 if found then return existing; end if;
 if m.compensates_id is not null then raise exception 'compensation_of_compensation' using errcode='22023'; end if;
 return app_private.move_stock(m.product_id,-m.quantity,case when m.quantity<0 then 'return' else 'adjustment_out' end,'internal','compensate:'||original,original::text,null,null,null,original,reason);
end $$;


commit;
