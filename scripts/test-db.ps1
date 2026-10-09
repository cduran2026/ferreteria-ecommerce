param([switch]$KeepContainer)
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path $PSScriptRoot -Parent
$taskContainer = 'ferreteria-db-test-' + [guid]::NewGuid().ToString('N').Substring(0,12)
function Invoke-DbFile([string]$File) {
 Get-Content -LiteralPath $File -Raw | docker exec -i $taskContainer psql -X -U postgres -d ferreteria_test -v ON_ERROR_STOP=1
 if ($LASTEXITCODE -ne 0) { throw "SQL failed: $File" }
}
try {
 docker run -d --name $taskContainer --network none --label project=ferreteria-ecommerce --tmpfs /var/lib/postgresql/data -e POSTGRES_HOST_AUTH_METHOD=trust -e POSTGRES_DB=ferreteria_test postgres:17
 if ($LASTEXITCODE -ne 0) { throw 'Docker no pudo iniciar la base aislada.' }
 $taskReady = $false
 for ($taskTry=0; $taskTry -lt 30; $taskTry++) {
  docker exec $taskContainer pg_isready -U postgres -d ferreteria_test | Out-Null
  if ($LASTEXITCODE -eq 0) { $taskReady=$true; break }
  Start-Sleep -Milliseconds 500
 }
 if (-not $taskReady) { throw 'PostgreSQL no está disponible.' }
 Invoke-DbFile (Join-Path $taskRoot 'supabase/tests/000_local_contract.sql')
 docker exec $taskContainer psql -X -U postgres -d ferreteria_test -At -c 'select version()'
 Get-ChildItem -LiteralPath (Join-Path $taskRoot 'supabase/migrations') -Filter '*.sql' | Sort-Object Name | ForEach-Object {
  Invoke-DbFile $_.FullName
  if ($_.Name -notmatch '_security.sql$') {
   $taskDenied = docker exec $taskContainer psql -X -U postgres -d ferreteria_test -At -c "select not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and (not c.relrowsecurity or has_table_privilege('anon',c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE') or has_table_privilege('authenticated',c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE'))) and not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','app_private') and (has_function_privilege('anon',p.oid,'EXECUTE') or has_function_privilege('authenticated',p.oid,'EXECUTE') or has_function_privilege('service_role',p.oid,'EXECUTE')))"
   if ($LASTEXITCODE -ne 0 -or $taskDenied -ne 't') { throw "Acceso concedido antes de políticas finales: $($_.Name)" }
   Write-Output "PASS: denegación de acceso tras $($_.Name), antes de grants finales."
  }
 }
 Invoke-DbFile (Join-Path $taskRoot 'supabase/tests/010_integrity.sql')
 Invoke-DbFile (Join-Path $taskRoot 'supabase/tests/020_concurrency_setup.sql')
 & (Join-Path $PSScriptRoot 'test-db-concurrency.ps1') -Container $taskContainer
 if (-not $?) { throw 'Concurrencia falló.' }
 Write-Output 'BASE DE DATOS: migraciones, integridad, RLS y concurrencia completadas.'
} finally {
 if ($KeepContainer) { Write-Output "Contenedor retenido para inspección: $taskContainer (sin puertos ni red)" }
 else { docker rm -f $taskContainer | Out-Null }
}
