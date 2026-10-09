# Reglas de inventario y operaciones

## Unidad única y trazabilidad

Cantidad base = presentaciones × equivalencia snapshot. Ejemplo: dos cajas de 25 descuentan 50 del mismo saldo usado por unidades y embalajes. Disponible calculado = físico − reservado; CHECK evita valores negativos. Costos/precios no se usan para determinar unidades.

Movimientos: receipt (+), store_sale (−), external_sale (−), return (+), adjustment_in (+), adjustment_out (−). Incluyen producto, signo, canal, referencia, operación idempotente, fecha y responsable. Actor Auth en operaciones de staff; null identifica operación de sistema desde backend de pago verificado, vinculada al pedido/pago. No se eliminan ni editan movimientos, incluso con SQL del propietario el trigger rechaza UPDATE/DELETE.

## RPC implementadas

| Función                | Validación y efecto                                                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| create_receipt         | Admin/operador; valida proveedor activo y líneas, captura equivalencias; draft sin stock; costos sólo admin                                       |
| confirm_receipt        | Admin/operador; bloquea cabecera y saldos; suma unidades agrupadas por producto; marca confirmed y genera movimientos una sola vez                |
| register_external_sale | Admin/operador; Mercado Libre manual, referencia única por canal; captura unidades, bloquea saldo, descuenta y registra movimiento; todo o nada   |
| adjust_inventory       | Sólo admin; delta distinto de cero, motivo y UUID; stock no negativo; movimiento compensable                                                      |
| compensate_movement    | Sólo admin; reversa completa del signo original, motivo obligatorio y una compensación por original; una venta revertida produce return           |
| create_order           | Usuario Auth; precios servidor, producto/categoría/presentación activos, snapshots, total; reserva stock atómicamente                             |
| cancel_order           | Dueño o admin; sólo pedido reservado; libera una vez; pedidos pagados requieren proceso distinto                                                  |
| expire_reservations    | Sólo backend; lote acotado, cabeceras SKIP LOCKED, libera reservas vencidas; sin scheduler instalado                                              |
| process_payment_event  | Sólo backend tras verificar proveedor; valida monto/referencias/transición; consume reserva, registra venta y pago una sola vez o pasa a revisión |
| set_staff_role         | Sólo admin; asignación/activación controlada y protección último admin                                                                            |

## Concurrencia

Transacción del llamador envuelve todos los efectos de cada RPC. Bloqueo de cabecera antes de saldo; saldos se bloquean en orden UUID por producto dentro de una operación. Se agrupan líneas de distintas presentaciones del mismo producto para evitar doble contabilidad. Insertar saldo utiliza ON CONFLICT y bloqueo de fila. CHECK y FK son la última defensa, no se depende de React.

Advisory locks por clave serializan reintentos de creación; cabeceras `FOR UPDATE` serializan confirmaciones. En concurrencia de reserva, la segunda sesión espera el saldo y valida el valor actualizado; si no alcanza, toda su operación revierte. El proceso de pago vuelve a comprobar vencimiento después de obtener bloqueos, incluso si comenzó antes de expirar. Lotes o cambios de catálogo concurrentes podrían producir deadlock: PostgreSQL revierte una transacción, preserva integridad; el backend futuro debe reintentar SQLSTATE 40P01/40001 con la misma clave y retroceso acotado.

## Reservas

TTL **propuesto**: 15 minutos. Cancelación o vencimiento libera reserved sin tocar physical. Confirmación verificada de pago resta reserved y physical, marca consumed y agrega movimiento. El vencimiento no libera por sí solo hasta ejecutar expire_reservations o recibir un pago tardío; esto reduce disponibilidad temporalmente, nunca permite sobreventa. Frecuencia del worker, alertas y política de reserva final quedan pendientes; no se instala automatización en esta etapa.

## Idempotencia

Recepción: request_key global y payload/actor idéntico. Pedido: customer_id + request_key con payload idéntico. Venta externa: canal + external_reference; payload distinto se rechaza. Ajuste: producto + request UUID; delta/motivo diferente se rechaza. Confirmaciones de recepción y cancelaciones son repetibles sin efectos adicionales. Compensación: única por movimiento original. Evento de pago: proveedor + ID de evento; la referencia y el monto deben coincidir. La igualdad JSONB conserva orden de líneas, por lo que reintentos deben reenviar el mismo contenido y orden.

## Pagos

No hay HTTP hacia pasarelas. La futura Edge Function debe verificar firma/estado con proveedor y llamar process_payment_event con credencial backend. Rejected/cancelled libera pedido reservado. Approved consume sólo reserva activa no vencida. Repetir approved no descuenta de nuevo; cambiar un estado terminal a otro incompatible se rechaza. Un segundo pago aprobado de otro intento sobre pedido ya pagado queda en review para reconciliación sin otro descuento.

Aprobación tardía con reserva vencida/cancelada libera lo aún reservado y marca payment_review/review; no vuelve a reservar ni descuenta stock. Reembolso, resolución manual y pago rechazado que luego cambia a aprobado requieren políticas explícitas y futuras RPC; no se simulan.

## Devoluciones y correcciones

Compensación íntegra referenciada, no edición del historial. Si devolver un ingreso compromete reservas actuales, se rechaza por stock disponible. No se permite compensar una compensación. Devoluciones parciales, límites por línea y efectos financieros quedan pendientes: esta etapa sólo corrige inventario completo del movimiento; no reembolsa ni cambia automáticamente el estado financiero del pedido.
