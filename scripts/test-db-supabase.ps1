param()
$ErrorActionPreference='Stop'
if((Get-Content supabase/config.toml -Raw) -notmatch 'project_id = "ferreteria_storefront_integration"'){throw 'Proyecto incorrecto'}
$taskSql=Get-Content supabase/tests/010_integrity.sql -Raw
# Aislamiento transaccional: datos locales restaurados por ROLLBACK; no db reset.
$taskSql=$taskSql.Replace('begin;', 'begin; truncate public.categories,public.profiles,public.staff_roles,public.suppliers,public.receipts,public.orders,public.external_sales,public.inventory_movements,public.stock_returns cascade;')
$taskSql | docker exec -i supabase_db_ferreteria_storefront_integration psql -X -U postgres -d postgres -v ON_ERROR_STOP=1
if($LASTEXITCODE -ne 0){throw 'Regresión SQL sobre Supabase falló.'}
