begin;
insert into public.categories(id,name,slug,active) values('a1000000-0000-0000-0000-000000000001','Herramientas','herramientas',true),('a1000000-0000-0000-0000-000000000002','Fijaciones','fijaciones',true) on conflict(id) do nothing;
insert into public.products(id,sku,name,description,category_id,base_unit,active) values
 ('a2000000-0000-0000-0000-000000000001','LOCAL-TALADRO','Taladro de prueba local','Producto ficticio para validar el catálogo. No es una oferta comercial.','a1000000-0000-0000-0000-000000000001','unidad',true),
 ('a2000000-0000-0000-0000-000000000002','LOCAL-TORNILLOS','Tornillos de prueba local','Datos de desarrollo, sin venta habilitada.','a1000000-0000-0000-0000-000000000002','unidad',true) on conflict(id) do nothing;
insert into public.presentations(id,product_id,kind,label,base_units,active) values
 ('a3000000-0000-0000-0000-000000000001','a2000000-0000-0000-0000-000000000001','unit','Unidad',1,true),
 ('a3000000-0000-0000-0000-000000000002','a2000000-0000-0000-0000-000000000002','box','Caja de 100',100,true) on conflict(id) do nothing;
insert into public.volume_prices(id,presentation_id,min_quantity,price_clp,valid_from,active) values
 ('a4000000-0000-0000-0000-000000000001','a3000000-0000-0000-0000-000000000001',1,69990,'2020-01-01',true),
 ('a4000000-0000-0000-0000-000000000002','a3000000-0000-0000-0000-000000000002',1,6990,'2020-01-01',true),
 ('a4000000-0000-0000-0000-000000000003','a3000000-0000-0000-0000-000000000002',10,5990,'2020-01-01',true) on conflict(id) do nothing;
commit;
