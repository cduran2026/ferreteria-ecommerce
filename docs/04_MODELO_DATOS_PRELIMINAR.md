# Modelo de datos preliminar

Propuesta conceptual, no migración ni contrato definitivo.

| Entidad                 | Relación y responsabilidad                                                                                  |
| ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| Categoría               | Agrupa productos; slug único                                                                                |
| Producto                | SKU único, nombre, descripción, categoría, unidad base y estado                                             |
| Imagen de producto      | Producto 1:N imágenes; orden y texto alternativo                                                            |
| Presentación            | Producto 1:N; unidad/caja/embalaje, equivalencia entera positiva, código de barras                          |
| Precio por volumen      | Presentación 1:N escalones; mínimo de cantidad, precio CLP y vigencia                                       |
| Costo interno           | Acceso administrativo, separado del catálogo público                                                        |
| Saldo de inventario     | Uno por producto; cantidades físicas y reservadas en unidad base                                            |
| Movimiento              | Libro de trazabilidad inmutable; producto, cantidad con signo, tipo, canal, fecha, responsable y referencia |
| Reserva                 | Producto, cantidad base, vencimiento, operación y estado                                                    |
| Pedido y detalle        | Cliente y presentaciones; snapshots de nombre, equivalencia y precio; canal tienda                          |
| Venta externa y detalle | Registro manual de Mercado Libre; referencia externa única por canal                                        |
| Pago y evento           | Pedido, proveedor, ID externo único, monto y estado verificado                                              |
| Perfil y rol            | Referencia a Auth; capacidades administrativas verificadas en servidor                                      |

## Invariantes

Cantidad base = cantidad de presentaciones × equivalencia. Ejemplo: 3 cajas de 100 tornillos = 300 tornillos. Todos los canales afectan el mismo saldo; no se crean existencias separadas por canal. Disponible = físico menos reservado. Ninguna operación puede dejar disponible negativo.

Precios se expresarán como pesos enteros CLP; definir política de IVA, redondeo, minorista/mayorista y vigencia antes del esquema definitivo. El servidor determinará el escalón aplicable y calculará el total, conservando snapshot en el detalle. No confiar en cálculos del frontend.

Registro de movimiento, saldo, reserva y operación se actualizarán en la misma transacción con bloqueo del producto. Las reservas se consumen una única vez al confirmar la venta o se liberan al expirar/cancelar. El flujo definitivo de pagos decidirá cuándo reservar y cuándo descontar físico. Reintentos concurrentes de webhook utilizarán clave idempotente y una transición de estado válida; pago tardío sin reserva disponible requiere resolución explícita.

Movimientos no se borran ni reescriben: errores se corrigen mediante movimientos compensatorios. Referencias únicas impiden registrar dos veces una venta externa. Las políticas RLS y funciones limitarán lectura/escritura según propietario y rol. Probar concurrencia, pagos repetidos, cancelaciones, reserva expirada y reversas antes de producción.
