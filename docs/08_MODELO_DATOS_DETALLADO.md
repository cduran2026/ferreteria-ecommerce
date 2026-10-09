# Modelo de datos detallado

## Convenciones

PostgreSQL 17; UUID con `gen_random_uuid()`; timestamps con zona; cantidades y CLP `bigint` sin punto flotante. FK con `ON DELETE RESTRICT` preservan trazabilidad. Borrado de cuentas Auth con historial requiere una futura política de anonimización, no cascadas. Campos obligatorios salvo aquellos explícitamente opcionales. Estado de catálogo inactivo por defecto. SKU y códigos de barras son sensibles a mayúsculas; normalización comercial pendiente.

## Entidades y campos

| Tabla               | Campos y claves                                                                                                                                                                                                                                                                    |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| categories          | PK id; name, description opcional, slug UNIQUE, parent_id FK categories opcional, active, display_order. Slug kebab; trigger impide ciclos                                                                                                                                         |
| products            | PK id; sku UNIQUE, name, description, category_id FK, brand opcional, base_unit, active, created_at, updated_at. Actualización de fecha por trigger                                                                                                                                |
| product_images      | PK id; product_id FK, storage_path UNIQUE, display_order, is_primary, alt_text obligatorio, approved. Sólo una principal por producto                                                                                                                                              |
| presentations       | PK id; product_id FK, kind unit/box/package, label, base_units > 0, barcode opcional UNIQUE, active; UNIQUE(id,product_id) para FK compuestas                                                                                                                                      |
| volume_prices       | PK id; presentation_id FK, min_quantity > 0, price_clp >= 0, valid_from, valid_until opcional, active. Exclusión GiST de solapes por presentación/mínimo activo                                                                                                                    |
| profiles            | PK id y FK auth.users; display_name, created_at; ningún rol editable en perfil                                                                                                                                                                                                     |
| staff_roles         | PK user_id FK auth.users; role admin/operator, active, assigned_by FK opcional, assigned_at                                                                                                                                                                                        |
| inventory_balances  | PK product_id FK; physical >= 0, reserved >= 0, available generado; CHECK physical >= reserved                                                                                                                                                                                     |
| inventory_movements | PK id; product_id FK, kind, quantity con signo, channel, operation_key, operation_reference, actor_id FK opcional, created_at, reason opcional; receipt_id/order_id/external_sale_id FK opcionales según tipo; compensates_id FK UNIQUE opcional; UNIQUE(product_id,operation_key) |
| suppliers           | PK id; name, rut opcional UNIQUE, contact opcional, active                                                                                                                                                                                                                         |
| receipts            | PK id; supplier_id FK, received_at, document_reference, status draft/confirmed, created_by FK Auth, confirmed_at opcional coherente con estado; request_key UNIQUE, request_payload                                                                                                |
| receipt_items       | PK id; receipt_id/product_id FK, presentation_id, quantity/base_units > 0, base_quantity generado; FK compuesta presentación-producto; UNIQUE(receipt_id,presentation_id)                                                                                                          |
| receipt_item_costs  | PK receipt_item_id FK; unit_cost_clp >= 0. Costo por presentación recibida, separado para permisos                                                                                                                                                                                 |
| orders              | PK id; customer_id FK Auth, status reserved/paid/cancelled/expired/payment_review, total_clp >= 0, created_at, request_key, request_payload; UNIQUE(customer_id,request_key)                                                                                                       |
| order_items         | PK id; order_id/product_id FK, presentation_id, product_name, presentation_label, quantity/base_units > 0, base_quantity generado, unit_price_clp >= 0 y line_total_clp generado; FK compuesta; UNIQUE(order_id,presentation_id)                                                   |
| external_sales      | PK id; channel mercado_libre, external_reference, sold_at, created_by FK Auth, request_payload; UNIQUE(channel,external_reference)                                                                                                                                                 |
| external_sale_items | PK id; sale_id/product_id FK, presentation_id, quantity/base_units > 0, base_quantity generado, unit_price_clp opcional >= 0; FK compuesta; UNIQUE(sale_id,presentation_id)                                                                                                        |
| stock_reservations  | PK(order_id,product_id), ambas FK; quantity > 0, expires_at, status active/released/consumed/expired                                                                                                                                                                               |
| payments            | PK id; order_id FK, provider webpay/mercado_pago, external_id, amount_clp >= 0, status pending/approved/rejected/cancelled/review, created_at; UNIQUE(provider,external_id), UNIQUE(id,provider)                                                                                   |
| payment_events      | PK id; payment_id FK, provider, external_event_id, requested_state, received_at, outcome; UNIQUE(provider,external_event_id), FK compuesta pago/proveedor                                                                                                                          |

`request_payload` conserva únicamente la entrada de la operación para detectar reintentos conflictivos; no incluir direcciones, secretos ni tokens. Las entradas se limitan a 100 líneas y cantidades de 1 a 999.999.999; el desbordamiento aritmético se rechaza por PostgreSQL. Equivalencias y totales no se aceptan desde el navegador.

## Relaciones

Categoría 1:N productos; producto 1:N imágenes/presentaciones y 1:1 saldo. Presentación 1:N escalones y detalles comerciales. Pedido 1:N detalles, reservas, pagos; pago 1:N eventos. Recepción 1:N detalles con costo 0:1. Venta externa 1:N detalles. Movimiento relaciona producto y operación; una compensación completa por movimiento original. No existe inventario por canal ni por presentación.

## Precios

Selección en servidor: presentación activa, intervalo vigente `[desde,hasta)`, mínimo <= cantidad; elegir el mayor mínimo. Dos intervalos activos del mismo mínimo no se superponen. Mínimos diferentes son escalones compatibles, no ambigüedad. No se exige descuento monotónico; esa regla comercial está pendiente. Sin escalón aplicable, el pedido se rechaza. El cliente no puede fijar precio efectivo. El número almacenado no presupone neto ni IVA incluido; no hay cálculo tributario.

## Migraciones

1. `20261009000100_catalog.sql`: catálogo, precios, extensión btree_gist y triggers.
2. `20261009000200_identity.sql`: perfiles, roles y autorización.
3. `20261009000300_operations.sql`: inventario, ingresos, pedidos, reservas, ventas, pagos y libro.
4. `20261009000400_transactions.sql`: RPC, snapshots e idempotencia.
5. `20261009000500_security.sql`: índices, guardia de unidad base, grants, RLS y Storage.

La agrupación sigue dependencias: tipos/FK antes de funciones, políticas al final. Todas las migraciones son transaccionales y sin productos/usuarios comerciales de prueba. Ninguna migración anterior aplicada se reemplazó: sólo existía `.gitkeep`.

## Índices

PK/UNIQUE cubren identidad, SKU, barcode, referencias idempotentes y detalles por cabecera. Índices adicionales cubren FK de catálogo, proveedor, usuario, producto, presentación y operación; pedidos por cliente/fecha; movimientos por producto/fecha; reservas activas por vencimiento. El índice de precio soporta presentación/mínimo. El índice parcial de imagen principal y la exclusión GiST sostienen restricciones. Medir con EXPLAIN sobre volumen real antes de agregar más índices.

## Aplicación y reversión en desarrollo

Para pruebas aisladas, desde la raíz ejecutar `pwsh -NoProfile -File scripts/test-db.ps1`. Crea PostgreSQL 17 en Docker, sin puertos, sin red y con almacenamiento temporal; aplica el adaptador de contratos locales, cinco migraciones, pruebas SQL y concurrencia; elimina exclusivamente su contenedor al finalizar. `-KeepContainer` lo conserva para inspección y muestra su nombre. Nunca aplicar `000_local_contract.sql` a Supabase: sólo sustituye Auth/Storage para pruebas del motor.

Para un futuro Supabase **local dedicado y vacío**, instalar CLI oficial, inicializar configuración local y levantar el stack con `supabase start`. Verificar host y proyecto antes de usar `supabase migration up --local`. No usar `--linked` ni variables de otros proyectos. Ejecutar luego las pruebas adaptadas a Auth/Storage reales. Este flujo no se ejecutó en esta etapa, no se creó Cloud y no hay configuración CLI añadida.

No se incluye rollback SQL destructivo automático. Si una migración falla, su transacción revierte; las anteriores quedan aplicadas. En una base de desarrollo desechable puede reconstruirse desde cero, **sólo tras confirmar que no contiene datos necesarios**. Con datos persistentes, usar respaldo y nueva migración correctiva; no editar historial ni hacer DROP para deshacer cambios. Las reversas de negocio se realizan por compensaciones, no rollback estructural.
