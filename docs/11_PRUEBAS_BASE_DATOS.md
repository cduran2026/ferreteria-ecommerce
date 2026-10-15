# Pruebas de base de datos · Etapa 02

## Entorno ejecutado

Docker Desktop disponible; Supabase CLI y PostgreSQL nativo no disponibles en PATH. Se ejecutaron migraciones y pruebas sobre PostgreSQL 17 oficial en un contenedor exclusivo, con red deshabilitada, sin puertos publicados y datos en tmpfs. El contenedor de cada corrida fue eliminado al finalizar. No se consultó ni modificó Cloud ni bases de otros proyectos.

Se utiliza un mecanismo equivalente a pgTAP: funciones SQL de aserción que abortan con error ante cualquier diferencia; psql con ON_ERROR_STOP y códigos SQLSTATE esperados. No es una simulación del motor. El adaptador `000_local_contract.sql` representa contratos mínimos de auth.uid(), usuarios, roles y tablas Storage; no representa validación de JWT ni del servicio de objetos real.

## Ejecución reproducible

```powershell
pwsh -NoProfile -File scripts/test-db.ps1
```

El script aplica adaptador local, cinco migraciones ordenadas, pruebas de integridad/RLS y tres escenarios concurrentes mediante conexiones psql independientes. `-KeepContainer` permite inspección posterior del contenedor propio; por defecto limpia automáticamente sólo el contenedor que creó. Docker descargará la imagen oficial si no existe. La configuración trust es exclusiva del contenedor sin red y no debe trasladarse a entornos persistentes.

## Cobertura

| Grupo          | Casos reales                                                                                                                                                                                                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catálogo       | SKU duplicado, categoría inexistente, ciclos directos/indirectos, equivalencia cero, barcode duplicado, ocultamiento de catálogo no publicado                                                                                                                                    |
| Precios        | Mínimo inválido, negativo, vigencia inversa, solapamiento excluido, selección de escalones y ausencia de precio vigente                                                                                                                                                          |
| Inventario     | Recepción draft/confirmada, repetición, unidades/cajas/embalajes, ajustes ±, negativo bloqueado, movimientos, compensación, devolución y unidad base protegida                                                                                                                   |
| Multicanal     | Venta externa manual y tienda, referencia duplicada/payload diferente, rollback completo sin stock, saldo único físico/reservado                                                                                                                                                 |
| Reservas       | Sin disponibilidad, repetición de creación, liberación por cancelación, expiración en lote idempotente                                                                                                                                                                           |
| Seguridad      | Lectura pública, imágenes aprobadas, Storage privado, costos ocultos, pedidos/detalles ajenos ocultos, cancelación ajena denegada, operador sin administración de roles/costos, anónimo sin escritura/RPC, cliente sin helper/funciones privilegiadas, todos los RLS/search_path |
| Pagos          | Precio calculado en servidor, evento duplicado, confirmación repetida, transición inválida, monto incorrecto, rechazo libera stock, pago tardío en revisión                                                                                                                      |
| Concurrencia 1 | Dos usuarios reservan 4 de 5 unidades simultáneamente: uno confirma, otro revierte sin pedido parcial; saldo 5/4/1                                                                                                                                                               |
| Concurrencia 2 | Dos confirmaciones simultáneas del mismo evento: un pago, un evento y un movimiento; saldo 1/0/1                                                                                                                                                                                 |
| Concurrencia 3 | Vencimiento durante espera de bloqueo: pago en revisión, sin consumo, saldo 1/0/1                                                                                                                                                                                                |

## Resultados

Corrida final en PostgreSQL **17.11**: **85 comprobaciones aprobadas** (78 aserciones SQL, 4 controles de denegación entre migraciones y 3 escenarios concurrentes). Evidencia resumida: [database-test-results.txt](database-test-results.txt). Build, lint y typecheck del frontend correctos; Vitest: 3 pruebas aprobadas. Prettier comprobado al finalizar. Los errores encontrados durante las corridas iniciales se corrigieron antes de la publicación: referencia ambigua de nombre en política Storage; comprobación de expiración también después de adquirir el bloqueo; FK de evento al proveedor del pago. Las pruebas que fallaron inicialmente no se presentan como aprobadas antes de su corrección.

La suite SQL de integridad revierte sus fixtures; las pruebas concurrentes usan fixtures separados que desaparecen con el contenedor. No se incluyen datos ficticios en migraciones estructurales. Frontend: ejecutar build, lint, typecheck, Vitest y Prettier; no hay cambios en src ni conexión a Supabase.

## Pendientes

Integración con Supabase local completo (CLI, Auth/JWT, PostgREST, API Storage/URLs firmadas/advisors), carga sostenida y matriz de deadlocks/reintentos multiproducto. No se validó firma de proveedor, entrega de webhook ni pasarela porque esa integración está excluida de la etapa. No se aplicó una migración ni rollback a producción. SQL superusuario es un límite de confianza, no un adversario restringido por RLS.

Referencias: [Supabase pruebas de base de datos](https://supabase.com/docs/guides/database/testing), [Pruebas de RLS](https://supabase.com/docs/guides/local-development/testing/overview).
