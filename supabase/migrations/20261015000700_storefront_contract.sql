begin;
-- Sólo lectura comercial. No se conceden permisos sobre los saldos privados.
create function app_private.category_is_public(category uuid) returns boolean
language sql stable security definer set search_path='' as $$
 with recursive ancestry as (
  select c.id,c.parent_id,c.active,array[c.id] as visited,false as cycle from public.categories c where c.id=category
  union all
  select c.id,c.parent_id,c.active,a.visited||c.id,c.id=any(a.visited)
  from public.categories c join ancestry a on c.id=a.parent_id where not a.cycle
 ) select coalesce(bool_and(active and not cycle) and bool_or(parent_id is null),false) from ancestry
$$;
revoke all on function app_private.category_is_public(uuid) from public,anon,authenticated,service_role;
grant execute on function app_private.category_is_public(uuid) to anon,authenticated;
drop policy categories_read on public.categories;
create policy categories_read on public.categories for select to anon,authenticated using(app_private.category_is_public(id) or app_private.has_role(array['admin','operator']));
drop policy products_read on public.products;
create policy products_read on public.products for select to anon,authenticated using((active and app_private.category_is_public(category_id)) or app_private.has_role(array['admin','operator']));
create function public.storefront_availability() returns table(product_id uuid,available bigint)
language sql stable security definer set search_path='' as $$
 select p.id,b.available from public.products p join public.inventory_balances b on b.product_id=p.id
 where p.active and app_private.category_is_public(p.category_id)
$$;
revoke all on function public.storefront_availability() from public,anon,authenticated,service_role;
grant execute on function public.storefront_availability() to anon,authenticated;
-- Cotización efímera: reusa price_at, nunca acepta precios del navegador.
create function public.storefront_quote(lines jsonb) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare line jsonb; p record; qty bigint; units bigint; price bigint; subtotal bigint; total bigint:=0; result jsonb:='[]'; consumed jsonb:='{}'; used bigint;
begin
 if jsonb_typeof(lines) is distinct from 'array' or jsonb_array_length(lines)<1 or jsonb_array_length(lines)>100 then raise exception 'invalid_cart' using errcode='22023'; end if;
 for line in select value from jsonb_array_elements(lines) loop
  if jsonb_typeof(line) is distinct from 'object' or coalesce(line->>'quantity','') !~ '^[1-9][0-9]{0,8}$' then raise exception 'invalid_quantity' using errcode='22023'; end if;
  qty:=(line->>'quantity')::bigint;
  select pr.id,pr.product_id,pr.base_units,b.available into p from public.presentations pr join public.products pd on pd.id=pr.product_id left join public.inventory_balances b on b.product_id=pd.id where pr.id=(line->>'presentation_id')::uuid and pr.active and pd.active and app_private.category_is_public(pd.category_id);
  if not found or p.available is null then raise exception 'product_unavailable' using errcode='22023'; end if;
  units:=qty*p.base_units; used:=coalesce((consumed->>p.product_id::text)::bigint,0)+units;
  if used>p.available then raise exception 'insufficient_availability' using errcode='22023'; end if;
  consumed:=jsonb_set(consumed,array[p.product_id::text],to_jsonb(used));
  price:=app_private.price_at(p.id,qty,now()); subtotal:=qty*price; total:=total+subtotal;
  if total>9007199254740991 or units>9007199254740991 then raise exception 'numeric_limit' using errcode='22023'; end if;
  result:=result||jsonb_build_array(jsonb_build_object('product_id',p.product_id,'presentation_id',p.id,'quantity',qty,'base_units',p.base_units,'units',units,'unit_price_clp',price,'total_clp',subtotal));
 end loop;
 return jsonb_build_object('lines',result,'total_clp',total,'quoted_at',now(),'checkout_enabled',false);
end $$;
revoke all on function public.storefront_quote(jsonb) from public,anon,authenticated,service_role;
grant execute on function public.storefront_quote(jsonb) to anon,authenticated;
commit;
