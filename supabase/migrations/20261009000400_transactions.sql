begin;
alter table public.receipts add column request_payload jsonb not null;
alter table public.orders add column request_payload jsonb not null;
alter table public.external_sales add column request_payload jsonb not null;

create function app_private.validate_lines(lines jsonb) returns void language plpgsql set search_path='' as $$
begin
 if lines is null or jsonb_typeof(lines)<>'array' or jsonb_array_length(lines) not between 1 and 100 then raise exception 'invalid_lines' using errcode='22023'; end if;
 if exists(select 1 from jsonb_array_elements(lines) x where jsonb_typeof(x)<>'object' or not (x ? 'presentation_id') or not (x ? 'quantity') or coalesce(x->>'quantity','') !~ '^[1-9][0-9]{0,8}$' or (x->>'presentation_id') is null) then raise exception 'invalid_line' using errcode='22023'; end if;
 if (select count(*) from jsonb_array_elements(lines)) <> (select count(distinct x->>'presentation_id') from jsonb_array_elements(lines) x) then raise exception 'duplicate_presentation' using errcode='22023'; end if;
end $$;
-- No expuesta a clientes; la operación pública valida identidad y llama a esta función interna.
create function app_private.lock_stock(ids uuid[]) returns void language plpgsql set search_path='' as $$
declare pid uuid;
begin
 for pid in select distinct unnest(ids) order by 1 loop
  insert into public.inventory_balances(product_id) values(pid) on conflict do nothing;
  perform 1 from public.inventory_balances where product_id=pid for update;
 end loop;
end $$;
create function app_private.move_stock(pid uuid, delta bigint, movement_kind text, source text, op_key text, ref text,
 receipt uuid default null, sale_order uuid default null, external_sale uuid default null, compensation uuid default null, why text default null)
returns uuid language plpgsql set search_path='' as $$
declare movement uuid;
begin
 if delta is null or delta=0 then raise exception 'invalid_delta' using errcode='22023'; end if;
 perform app_private.lock_stock(array[pid]);
 update public.inventory_balances set physical=physical+delta where product_id=pid;
 insert into public.inventory_movements(product_id,quantity,kind,channel,operation_key,operation_reference,actor_id,receipt_id,order_id,external_sale_id,compensates_id,reason)
 values(pid,delta,movement_kind,source,op_key,ref,auth.uid(),receipt,sale_order,external_sale,compensation,why) returning id into movement;
 return movement;
end $$;
create function app_private.price_at(pid uuid, qty bigint, at_time timestamptz) returns bigint language plpgsql set search_path='' as $$
declare price bigint;
begin
 select price_clp into price from public.volume_prices where presentation_id=pid and active and min_quantity<=qty and valid_from<=at_time and (valid_until is null or valid_until>at_time) order by min_quantity desc limit 1;
 if price is null then raise exception 'price_not_available' using errcode='22023'; end if;
 return price;
end $$;

create function public.create_receipt(supplier uuid, reference text, lines jsonb, request uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare rid uuid; existing public.receipts; line jsonb; p public.presentations; item uuid; payload jsonb;
begin
 perform app_private.require_staff(array['admin','operator']); perform app_private.validate_lines(lines);
 if request is null or reference is null or btrim(reference)='' then raise exception 'invalid_receipt' using errcode='22023'; end if;
 payload := jsonb_build_object('supplier',supplier,'reference',reference,'lines',lines);
 perform pg_advisory_xact_lock(hashtextextended('receipt:'||request::text,0));
 select * into existing from public.receipts where request_key=request;
 if found then
  if existing.request_payload<>payload or existing.created_by<>auth.uid() then raise exception 'idempotency_conflict' using errcode='22023'; end if;
  return existing.id;
 end if;
 if not exists(select 1 from public.suppliers where id=supplier and active) then raise exception 'supplier_not_active' using errcode='22023'; end if;
 insert into public.receipts(supplier_id,document_reference,created_by,request_key,request_payload) values(supplier,reference,auth.uid(),request,payload) returning id into rid;
 for line in select value from jsonb_array_elements(lines) loop
  select * into strict p from public.presentations where id=(line->>'presentation_id')::uuid for share;
  insert into public.receipt_items(receipt_id,product_id,presentation_id,quantity,base_units) values(rid,p.product_id,p.id,(line->>'quantity')::bigint,p.base_units) returning id into item;
  if line ? 'unit_cost_clp' and line->>'unit_cost_clp' is not null then
   perform app_private.require_staff(array['admin']);
   insert into public.receipt_item_costs values(item,(line->>'unit_cost_clp')::bigint);
  end if;
 end loop;
 return rid;
end $$;
create function public.confirm_receipt(receipt uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare r public.receipts; line record;
begin
 perform app_private.require_staff(array['admin','operator']);
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

create function public.register_external_sale(reference text, sold_at timestamptz, lines jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare sid uuid; existing public.external_sales; line jsonb; p public.presentations; payload jsonb; item record;
begin
 perform app_private.require_staff(array['admin','operator']); perform app_private.validate_lines(lines);
 if reference is null or btrim(reference)='' or sold_at is null then raise exception 'invalid_external_sale' using errcode='22023'; end if;
 payload:=jsonb_build_object('sold_at',sold_at,'lines',lines);
 perform pg_advisory_xact_lock(hashtextextended('external:mercado_libre:'||reference,0));
 select * into existing from public.external_sales where channel='mercado_libre' and external_reference=reference;
 if found then
  if existing.request_payload<>payload then raise exception 'idempotency_conflict' using errcode='22023'; end if; return existing.id;
 end if;
 insert into public.external_sales(channel,external_reference,sold_at,created_by,request_payload) values('mercado_libre',reference,sold_at,auth.uid(),payload) returning id into sid;
 for line in select value from jsonb_array_elements(lines) loop
  select * into strict p from public.presentations where id=(line->>'presentation_id')::uuid and active for share;
  insert into public.external_sale_items(sale_id,product_id,presentation_id,quantity,base_units,unit_price_clp)
  values(sid,p.product_id,p.id,(line->>'quantity')::bigint,p.base_units,(line->>'unit_price_clp')::bigint);
 end loop;
 perform app_private.lock_stock(array(select product_id from public.external_sale_items where sale_id=sid));
 for item in select product_id,sum(base_quantity)::bigint qty from public.external_sale_items where sale_id=sid group by product_id order by product_id loop
  perform app_private.move_stock(item.product_id,-item.qty,'external_sale','mercado_libre','external:'||sid,reference,null,null,sid);
 end loop;
 return sid;
end $$;
create function public.adjust_inventory(product uuid, delta bigint, reason text, request uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare existing public.inventory_movements;
begin
 perform app_private.require_staff(array['admin']);
 if request is null or reason is null or btrim(reason)='' or delta is null or delta=0 then raise exception 'invalid_adjustment' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(hashtextextended('adjust:'||request,0));
 select * into existing from public.inventory_movements where product_id=product and operation_key='adjust:'||request;
 if found then
  if existing.quantity<>delta or existing.reason<>reason then raise exception 'idempotency_conflict' using errcode='22023'; end if; return existing.id;
 end if;
 return app_private.move_stock(product,delta,case when delta>0 then 'adjustment_in' else 'adjustment_out' end,'internal','adjust:'||request,request::text,null,null,null,null,reason);
end $$;
create function public.compensate_movement(original uuid, reason text) returns uuid language plpgsql security definer set search_path='' as $$
declare m public.inventory_movements; existing uuid;
begin
 perform app_private.require_staff(array['admin']);
 if reason is null or btrim(reason)='' then raise exception 'reason_required' using errcode='22023'; end if;
 select * into strict m from public.inventory_movements where id=original for update;
 select id into existing from public.inventory_movements where compensates_id=original;
 if found then return existing; end if;
 if m.compensates_id is not null then raise exception 'compensation_of_compensation' using errcode='22023'; end if;
 return app_private.move_stock(m.product_id,-m.quantity,case when m.quantity<0 then 'return' else 'adjustment_out' end,'internal','compensate:'||original,original::text,null,null,null,original,reason);
end $$;

create function public.create_order(lines jsonb, request uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare oid uuid; existing public.orders; line jsonb; p public.presentations; product public.products; price bigint; item record;
begin
 if auth.uid() is null then raise exception 'authentication_required' using errcode='42501'; end if;
 perform app_private.validate_lines(lines);
 if request is null then raise exception 'request_required' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(hashtextextended('order:'||auth.uid()||':'||request,0));
 select * into existing from public.orders where customer_id=auth.uid() and request_key=request;
 if found then
  if existing.request_payload<>lines then raise exception 'idempotency_conflict' using errcode='22023'; end if; return existing.id;
 end if;
 insert into public.orders(customer_id,total_clp,request_key,request_payload) values(auth.uid(),0,request,lines) returning id into oid;
 for line in select value from jsonb_array_elements(lines) loop
  select * into strict p from public.presentations where id=(line->>'presentation_id')::uuid and active for share;
  select * into strict product from public.products where id=p.product_id and active and exists(select 1 from public.categories c where c.id=category_id and c.active) for share;
  price:=app_private.price_at(p.id,(line->>'quantity')::bigint,now());
  insert into public.order_items(order_id,product_id,presentation_id,product_name,presentation_label,quantity,base_units,unit_price_clp)
  values(oid,p.product_id,p.id,product.name,p.label,(line->>'quantity')::bigint,p.base_units,price);
 end loop;
 perform app_private.lock_stock(array(select product_id from public.order_items where order_id=oid));
 for item in select product_id,sum(base_quantity)::bigint qty from public.order_items where order_id=oid group by product_id order by product_id loop
  update public.inventory_balances set reserved=reserved+item.qty where product_id=item.product_id;
  insert into public.stock_reservations(order_id,product_id,quantity,expires_at) values(oid,item.product_id,item.qty,clock_timestamp()+interval '15 minutes');
 end loop;
 update public.orders set total_clp=(select sum(line_total_clp)::bigint from public.order_items where order_id=oid) where id=oid;
 return oid;
end $$;
create function app_private.release_order(oid uuid, new_state text) returns void language plpgsql set search_path='' as $$
declare r record;
begin
 perform app_private.lock_stock(array(select product_id from public.stock_reservations where order_id=oid and status='active'));
 for r in select * from public.stock_reservations where order_id=oid and status='active' order by product_id for update loop
  update public.inventory_balances set reserved=reserved-r.quantity where product_id=r.product_id;
  update public.stock_reservations set status=case when new_state='expired' then 'expired' else 'released' end where order_id=oid and product_id=r.product_id;
 end loop;
 update public.orders set status=new_state where id=oid;
end $$;
create function public.cancel_order(oid uuid) returns void language plpgsql security definer set search_path='' as $$
declare o public.orders;
begin
 select * into strict o from public.orders where id=oid for update;
 if auth.uid() is null or (o.customer_id<>auth.uid() and not app_private.has_role(array['admin'])) then raise exception 'forbidden' using errcode='42501'; end if;
 if o.status in ('cancelled','expired') then return; end if;
 if o.status<>'reserved' then raise exception 'invalid_order_transition' using errcode='22023'; end if;
 perform app_private.release_order(oid,'cancelled');
end $$;
-- Sólo backend service_role; no scheduler ni servicios externos se instalan en esta etapa.
create function public.expire_reservations(batch_size integer default 100) returns integer language plpgsql security definer set search_path='' as $$
declare o record; n integer:=0;
begin
 if batch_size not between 1 and 1000 or batch_size is null then raise exception 'invalid_batch' using errcode='22023'; end if;
 for o in select id from public.orders where status='reserved' and exists(select 1 from public.stock_reservations where order_id=orders.id and status='active' and expires_at<=clock_timestamp()) order by id limit batch_size for update skip locked loop
  perform app_private.release_order(o.id,'expired'); n:=n+1;
 end loop; return n;
end $$;
-- Invocación futura exclusivamente backend tras verificar firma/proveedor/monto. No acepta confirmación del navegador.
create function public.process_payment_event(oid uuid, provider_name text, payment_ref text, event_ref text, amount bigint, target_state text) returns uuid language plpgsql security definer set search_path='' as $$
declare o public.orders; p public.payments; e public.payment_events; r record; outcome text;
begin
 if provider_name is null or provider_name not in ('webpay','mercado_pago') or payment_ref is null or btrim(payment_ref)='' or event_ref is null or btrim(event_ref)='' or amount is null or amount<0 or target_state is null or target_state not in ('approved','rejected','cancelled') then raise exception 'invalid_payment_event' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(hashtextextended('payment-event:'||provider_name||':'||event_ref,0));
 select * into strict o from public.orders where id=oid for update;
 if o.total_clp<>amount then raise exception 'amount_mismatch' using errcode='22023'; end if;
 select * into e from public.payment_events where provider=provider_name and external_event_id=event_ref;
 if found then
  select * into strict p from public.payments where id=e.payment_id;
  if p.order_id<>oid or p.external_id<>payment_ref or p.amount_clp<>amount or e.requested_state<>target_state then raise exception 'idempotency_conflict' using errcode='22023'; end if;
  return p.id;
 end if;
 insert into public.payments(order_id,provider,external_id,amount_clp) values(oid,provider_name,payment_ref,amount) on conflict(provider,external_id) do nothing;
 select * into strict p from public.payments where provider=provider_name and external_id=payment_ref for update;
 if p.order_id<>oid or p.amount_clp<>amount then raise exception 'payment_reference_conflict' using errcode='22023'; end if;
 if p.status<>'pending' then
  if p.status<>target_state and not (p.status='review' and target_state='approved') then raise exception 'invalid_payment_transition' using errcode='22023'; end if;
  outcome:='duplicate_confirmation';
 elsif target_state in ('rejected','cancelled') then
  update public.payments set status=target_state where id=p.id;
  if o.status='reserved' then perform app_private.release_order(oid,'cancelled'); end if;
  outcome:=target_state;
 elsif o.status<>'reserved' or not exists(select 1 from public.stock_reservations where order_id=oid and status='active') or exists(select 1 from public.stock_reservations where order_id=oid and status='active' and expires_at<=clock_timestamp()) then
  if o.status='reserved' then perform app_private.release_order(oid,'expired'); end if;
  update public.payments set status='review' where id=p.id;
  if o.status<>'paid' then update public.orders set status='payment_review' where id=oid; end if;
  outcome:='manual_review';
 else
  perform app_private.lock_stock(array(select product_id from public.stock_reservations where order_id=oid));
  if exists(select 1 from public.stock_reservations where order_id=oid and status='active' and expires_at<=clock_timestamp()) then
   perform app_private.release_order(oid,'expired');
   update public.payments set status='review' where id=p.id;
   update public.orders set status='payment_review' where id=oid; outcome:='manual_review';
  else
  for r in select * from public.stock_reservations where order_id=oid and status='active' order by product_id for update loop
   update public.inventory_balances set reserved=reserved-r.quantity where product_id=r.product_id;
   perform app_private.move_stock(r.product_id,-r.quantity,'store_sale','store','order:'||oid,oid::text,null,oid);
   update public.stock_reservations set status='consumed' where order_id=oid and product_id=r.product_id;
  end loop;
  update public.orders set status='paid' where id=oid;
  update public.payments set status='approved' where id=p.id; outcome:='approved';
  end if;
 end if;
 insert into public.payment_events(payment_id,provider,external_event_id,requested_state,outcome) values(p.id,provider_name,event_ref,target_state,outcome);
 return p.id;
end $$;
revoke all on all functions in schema app_private from public,anon,authenticated,service_role;
revoke all on function public.create_receipt(uuid,text,jsonb,uuid),public.confirm_receipt(uuid),public.register_external_sale(text,timestamptz,jsonb),public.adjust_inventory(uuid,bigint,text,uuid),public.compensate_movement(uuid,text),public.create_order(jsonb,uuid),public.cancel_order(uuid),public.expire_reservations(integer),public.process_payment_event(uuid,text,text,text,bigint,text) from public,anon,authenticated,service_role;
commit;
