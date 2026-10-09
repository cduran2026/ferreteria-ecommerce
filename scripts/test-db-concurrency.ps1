param([Parameter(Mandatory)][string]$Container)
$ErrorActionPreference = 'Stop'
$taskFirstSql = @'
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',true);
select public.create_order('[{"presentation_id":"30000000-0000-0000-0000-000000000001","quantity":4}]','50000000-0000-0000-0000-000000000021');
select pg_sleep(5);
commit;
'@
$taskSecondSql = @'
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000004',true);
select public.create_order('[{"presentation_id":"30000000-0000-0000-0000-000000000001","quantity":4}]','50000000-0000-0000-0000-000000000022');
commit;
'@
$taskJob = Start-Job -ArgumentList $Container,$taskFirstSql -ScriptBlock { param($c,$sql) $sql | docker exec -i $c psql -X -U postgres -d ferreteria_test -v ON_ERROR_STOP=1; if ($LASTEXITCODE -ne 0) { throw 'Primera reserva falló' } }
try {
 $taskLocked = $false
 for ($taskTry=0; $taskTry -lt 50; $taskTry++) {
  $taskWaiting = docker exec $Container psql -X -U postgres -d ferreteria_test -At -c "select count(*) from pg_stat_activity where datname='ferreteria_test' and wait_event='PgSleep'"
  if ($taskWaiting -eq '1') { $taskLocked=$true; break }
  Start-Sleep -Milliseconds 100
 }
 if (-not $taskLocked) { throw 'No se observó la primera transacción simultánea.' }
 $taskOutput = $taskSecondSql | docker exec -i $Container psql -X -U postgres -d ferreteria_test -v ON_ERROR_STOP=1 2>&1
 if ($LASTEXITCODE -eq 0 -or ($taskOutput -join '') -notmatch 'check constraint') { throw "Segunda reserva debía fallar por stock: $taskOutput" }
 Wait-Job $taskJob -Timeout 10 | Out-Null
 Receive-Job $taskJob -ErrorAction Stop
 $taskState = docker exec $Container psql -X -U postgres -d ferreteria_test -At -c "select physical||','||reserved||','||available from public.inventory_balances"
 if ($taskState -ne '5,4,1') { throw "Saldo incorrecto: $taskState" }
 $taskCount = docker exec $Container psql -X -U postgres -d ferreteria_test -At -c "select count(*) from public.orders"
 if ($taskCount -ne '1') { throw 'La reserva fallida dejó un pedido parcial.' }
 Write-Output 'PASS: dos sesiones simultáneas reservan 4 de 5; una confirma y la otra revierte sin sobreventa.'
} finally { Remove-Job $taskJob -Force }

# Dos confirmaciones reales simultáneas para el mismo pedido/evento.
$taskOrder = docker exec $Container psql -X -U postgres -d ferreteria_test -At -c 'select id from public.orders'
$taskPaymentSql = "begin; set local role service_role; select public.process_payment_event('$taskOrder','webpay','CONCURRENT-P','CONCURRENT-E',400,'approved');"
$taskJob = Start-Job -ArgumentList $Container,($taskPaymentSql + 'select pg_sleep(5); commit;') -ScriptBlock { param($c,$sql) $sql | docker exec -i $c psql -X -U postgres -d ferreteria_test -v ON_ERROR_STOP=1; if ($LASTEXITCODE -ne 0) { throw 'Primera confirmación falló' } }
try {
 $taskLocked = $false
 for ($taskTry=0; $taskTry -lt 50; $taskTry++) {
  $taskWaiting = docker exec $Container psql -X -U postgres -d ferreteria_test -At -c "select count(*) from pg_stat_activity where datname='ferreteria_test' and wait_event='PgSleep'"
  if ($taskWaiting -eq '1') { $taskLocked=$true; break }
  Start-Sleep -Milliseconds 100
 }
 if (-not $taskLocked) { throw 'No se observó la primera confirmación simultánea.' }
 ($taskPaymentSql + 'commit;') | docker exec -i $Container psql -X -U postgres -d ferreteria_test -v ON_ERROR_STOP=1
 if ($LASTEXITCODE -ne 0) { throw 'La segunda confirmación idempotente falló.' }
 Wait-Job $taskJob -Timeout 10 | Out-Null
 Receive-Job $taskJob -ErrorAction Stop
 $taskState = docker exec $Container psql -X -U postgres -d ferreteria_test -At -c "select physical||','||reserved||','||available from public.inventory_balances"
 $taskMovements = docker exec $Container psql -X -U postgres -d ferreteria_test -At -c 'select count(*) from public.inventory_movements'
 $taskEvents = docker exec $Container psql -X -U postgres -d ferreteria_test -At -c 'select count(*) from public.payment_events'
 if ($taskState -ne '1,0,1' -or $taskMovements -ne '1' -or $taskEvents -ne '1') { throw 'Confirmaciones simultáneas duplicaron efectos.' }
 Write-Output 'PASS: confirmaciones simultáneas del mismo evento generan un único movimiento y evento.'
} finally { Remove-Job $taskJob -Force }

# El pago empieza a tiempo, pero la reserva vence mientras espera el bloqueo de stock.
$taskLateOrder = docker exec $Container psql -X -U postgres -d ferreteria_test -At -v ON_ERROR_STOP=1 -c "set role authenticated; set request.jwt.claim.sub='00000000-0000-0000-0000-000000000004'; select public.create_order('[{`"presentation_id`":`"30000000-0000-0000-0000-000000000001`",`"quantity`":1}]','50000000-0000-0000-0000-000000000023');"
if ($LASTEXITCODE -ne 0) { throw 'Pedido de prueba de vencimiento falló.' }
$taskLateOrder = @($taskLateOrder)[-1]
$taskJob = Start-Job -ArgumentList $Container -ScriptBlock { param($c) docker exec $c psql -X -U postgres -d ferreteria_test -v ON_ERROR_STOP=1 -c 'begin; select product_id from public.inventory_balances for update; select pg_sleep(5); commit;'; if ($LASTEXITCODE -ne 0) { throw 'Bloqueo de prueba falló' } }
try {
 $taskLocked = $false
 for ($taskTry=0; $taskTry -lt 50; $taskTry++) {
  $taskWaiting = docker exec $Container psql -X -U postgres -d ferreteria_test -At -c "select count(*) from pg_stat_activity where datname='ferreteria_test' and wait_event='PgSleep'"
  if ($taskWaiting -eq '1') { $taskLocked=$true; break }
  Start-Sleep -Milliseconds 100
 }
 if (-not $taskLocked) { throw 'No se observó el bloqueo de stock.' }
 docker exec $Container psql -X -U postgres -d ferreteria_test -v ON_ERROR_STOP=1 -c "update public.stock_reservations set expires_at=clock_timestamp()+interval '2 seconds' where order_id='$taskLateOrder';"
 if ($LASTEXITCODE -ne 0) { throw 'No se pudo preparar el vencimiento.' }
 docker exec $Container psql -X -U postgres -d ferreteria_test -v ON_ERROR_STOP=1 -c "set role service_role; select public.process_payment_event('$taskLateOrder','webpay','WAIT-P','WAIT-E',100,'approved');"
 if ($LASTEXITCODE -ne 0) { throw 'Pago que espera un bloqueo falló.' }
 Wait-Job $taskJob -Timeout 10 | Out-Null
 Receive-Job $taskJob -ErrorAction Stop
 $taskState = docker exec $Container psql -X -U postgres -d ferreteria_test -At -c "select physical||','||reserved||','||available from public.inventory_balances"
 $taskReview = docker exec $Container psql -X -U postgres -d ferreteria_test -At -c "select status from public.orders where id='$taskLateOrder'"
 if ($taskState -ne '1,0,1' -or $taskReview -ne 'payment_review') { throw 'Se consumió una reserva vencida al esperar un bloqueo.' }
 Write-Output 'PASS: reserva vencida durante espera de bloqueo no descuenta stock y requiere revisión.'
} finally { Remove-Job $taskJob -Force }
