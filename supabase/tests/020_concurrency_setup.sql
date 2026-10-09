insert into auth.users values('00000000-0000-0000-0000-000000000003'),('00000000-0000-0000-0000-000000000004');
insert into public.categories(id,name,slug,active) values('10000000-0000-0000-0000-000000000001','Concurrencia','concurrencia',true);
insert into public.products(id,sku,name,category_id,base_unit,active) values('20000000-0000-0000-0000-000000000001','CONCURRENT','Concurrente','10000000-0000-0000-0000-000000000001','unidad',true);
insert into public.presentations(id,product_id,kind,label,base_units,active) values('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','unit','Unidad',1,true);
insert into public.volume_prices(presentation_id,min_quantity,price_clp,valid_from,active) values('30000000-0000-0000-0000-000000000001',1,100,'2020-01-01',true);
insert into public.inventory_balances(product_id,physical) values('20000000-0000-0000-0000-000000000001',5);
