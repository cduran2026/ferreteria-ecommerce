begin;
-- Índices de FK y rutas de consulta; PK/UNIQUE ya crean sus propios índices.
create index categories_parent_idx on public.categories(parent_id);
create index products_category_idx on public.products(category_id);
create index product_images_product_idx on public.product_images(product_id);
create index presentations_product_idx on public.presentations(product_id);
create index prices_lookup_idx on public.volume_prices(presentation_id,min_quantity desc,valid_from) where active;
create index receipts_supplier_idx on public.receipts(supplier_id);
create index receipts_actor_idx on public.receipts(created_by);
create index receipt_items_product_idx on public.receipt_items(product_id);
create index receipt_items_presentation_idx on public.receipt_items(presentation_id);
create index orders_customer_idx on public.orders(customer_id,created_at desc);
create index order_items_product_idx on public.order_items(product_id);
create index order_items_presentation_idx on public.order_items(presentation_id);
create index external_sales_actor_idx on public.external_sales(created_by);
create index external_items_product_idx on public.external_sale_items(product_id);
create index external_items_presentation_idx on public.external_sale_items(presentation_id);
create index reservations_product_idx on public.stock_reservations(product_id);
create index reservations_expiry_idx on public.stock_reservations(expires_at,order_id) where status='active';
create index payments_order_idx on public.payments(order_id);
create index events_payment_idx on public.payment_events(payment_id);
create index movements_product_time_idx on public.inventory_movements(product_id,created_at desc);
create index movements_receipt_idx on public.inventory_movements(receipt_id) where receipt_id is not null;
create index movements_order_idx on public.inventory_movements(order_id) where order_id is not null;
create index movements_external_idx on public.inventory_movements(external_sale_id) where external_sale_id is not null;
create index movements_actor_idx on public.inventory_movements(actor_id);
create index roles_assigner_idx on public.staff_roles(assigned_by);

-- Prohibir reinterpretar la unidad base de un producto ya utilizado.
create function app_private.base_unit_guard() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.base_unit<>old.base_unit and (exists(select 1 from public.inventory_balances where product_id=old.id) or exists(select 1 from public.receipt_items where product_id=old.id) or exists(select 1 from public.order_items where product_id=old.id) or exists(select 1 from public.external_sale_items where product_id=old.id)) then raise exception 'base_unit_in_use' using errcode='23514'; end if;
 return new;
end $$;
create trigger base_unit_immutable before update of base_unit on public.products for each row execute function app_private.base_unit_guard();

do $$ declare t text; begin
 foreach t in array array['categories','products','product_images','presentations','volume_prices','profiles','staff_roles','inventory_balances','suppliers','receipts','receipt_items','receipt_item_costs','orders','order_items','external_sales','external_sale_items','stock_reservations','payments','payment_events','inventory_movements'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public, anon, authenticated, service_role',t);
 end loop;
end $$;
grant usage on schema public to anon,authenticated,service_role;
grant usage on schema app_private to anon,authenticated;
revoke all on all functions in schema app_private from public,anon,authenticated,service_role;
grant execute on function app_private.has_role(text[]) to anon,authenticated;
alter default privileges in schema app_private revoke execute on functions from public,anon,authenticated,service_role;
alter default privileges in schema public revoke execute on functions from public,anon,authenticated,service_role;

grant select on public.categories,public.products,public.product_images,public.presentations,public.volume_prices to anon,authenticated;
grant insert,update,delete on public.categories,public.products,public.product_images,public.presentations,public.volume_prices to authenticated;
create policy categories_read on public.categories for select to anon,authenticated using(active or app_private.has_role(array['admin','operator']));
create policy products_read on public.products for select to anon,authenticated using((active and exists(select 1 from public.categories c where c.id=category_id and c.active)) or app_private.has_role(array['admin','operator']));
create policy images_read on public.product_images for select to anon,authenticated using((approved and exists(select 1 from public.products p where p.id=product_id and p.active)) or app_private.has_role(array['admin','operator']));
create policy presentations_read on public.presentations for select to anon,authenticated using((active and exists(select 1 from public.products p where p.id=product_id and p.active)) or app_private.has_role(array['admin','operator']));
create policy prices_read on public.volume_prices for select to anon,authenticated using((active and valid_from<=now() and (valid_until is null or valid_until>now()) and exists(select 1 from public.presentations p where p.id=presentation_id and p.active)) or app_private.has_role(array['admin']));
do $$ declare t text; begin
 foreach t in array array['categories','products','product_images','presentations','volume_prices'] loop
  execute format('create policy catalog_admin on public.%I for all to authenticated using(app_private.has_role(array[''admin''])) with check(app_private.has_role(array[''admin'']))',t);
 end loop;
end $$;

grant select on public.profiles,public.staff_roles,public.inventory_balances,public.suppliers,public.receipts,public.receipt_items,public.receipt_item_costs,public.orders,public.order_items,public.external_sales,public.external_sale_items,public.stock_reservations,public.payments,public.payment_events,public.inventory_movements to authenticated;
grant insert on public.profiles to authenticated;
grant update(display_name) on public.profiles to authenticated;
create policy profiles_read on public.profiles for select to authenticated using(id=auth.uid() or app_private.has_role(array['admin']));
create policy profiles_insert on public.profiles for insert to authenticated with check(id=auth.uid());
create policy profiles_update on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy roles_read on public.staff_roles for select to authenticated using(user_id=auth.uid() or app_private.has_role(array['admin']));
grant insert,update,delete on public.suppliers to authenticated;
create policy suppliers_admin on public.suppliers for all to authenticated using(app_private.has_role(array['admin'])) with check(app_private.has_role(array['admin']));
create policy costs_admin on public.receipt_item_costs for select to authenticated using(app_private.has_role(array['admin']));
do $$ declare t text; begin
 foreach t in array array['inventory_balances','suppliers','receipts','receipt_items','external_sales','external_sale_items','inventory_movements'] loop
  execute format('create policy staff_read on public.%I for select to authenticated using(app_private.has_role(array[''admin'',''operator'']))',t);
 end loop;
end $$;
create policy orders_read on public.orders for select to authenticated using(customer_id=auth.uid() or app_private.has_role(array['admin']));
create policy order_items_read on public.order_items for select to authenticated using(exists(select 1 from public.orders o where o.id=order_id));
create policy reservations_read on public.stock_reservations for select to authenticated using(exists(select 1 from public.orders o where o.id=order_id));
create policy payments_read on public.payments for select to authenticated using(exists(select 1 from public.orders o where o.id=order_id));
create policy events_admin on public.payment_events for select to authenticated using(app_private.has_role(array['admin']));

-- Ejecutar sólo las RPC expresamente autorizadas. Helpers privados sin EXECUTE cliente.
revoke all on function public.set_staff_role(uuid,text,boolean),public.create_receipt(uuid,text,jsonb,uuid),public.confirm_receipt(uuid),public.register_external_sale(text,timestamptz,jsonb),public.adjust_inventory(uuid,bigint,text,uuid),public.compensate_movement(uuid,text),public.create_order(jsonb,uuid),public.cancel_order(uuid),public.expire_reservations(integer),public.process_payment_event(uuid,text,text,text,bigint,text) from public,anon,authenticated,service_role;
grant execute on function public.set_staff_role(uuid,text,boolean),public.create_receipt(uuid,text,jsonb,uuid),public.confirm_receipt(uuid),public.register_external_sale(text,timestamptz,jsonb),public.adjust_inventory(uuid,bigint,text,uuid),public.compensate_movement(uuid,text),public.create_order(jsonb,uuid),public.cancel_order(uuid) to authenticated;
grant execute on function public.expire_reservations(integer),public.process_payment_event(uuid,text,text,text,bigint,text) to service_role;

-- Bucket PRIVADO: publicación mediante lectura autorizada o URL firmada futura, nunca URL pública irrestricta.
insert into storage.buckets(id,name,public) values('ferreteria-product-images','ferreteria-product-images',false) on conflict(id) do nothing;
do $$ begin if exists(select 1 from storage.buckets where id='ferreteria-product-images' and public) then raise exception 'image_bucket_must_be_private'; end if; end $$;
create policy ferreteria_image_read on storage.objects for select to anon,authenticated using(bucket_id='ferreteria-product-images' and (app_private.has_role(array['admin']) or exists(select 1 from public.product_images i join public.products p on p.id=i.product_id where i.storage_path=storage.objects.name and i.approved and p.active)));
create policy ferreteria_image_insert on storage.objects for insert to authenticated with check(bucket_id='ferreteria-product-images' and app_private.has_role(array['admin']));
create policy ferreteria_image_update on storage.objects for update to authenticated using(bucket_id='ferreteria-product-images' and app_private.has_role(array['admin'])) with check(bucket_id='ferreteria-product-images' and app_private.has_role(array['admin']));
create policy ferreteria_image_delete on storage.objects for delete to authenticated using(bucket_id='ferreteria-product-images' and app_private.has_role(array['admin']));
commit;
