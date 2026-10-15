# Seguridad RLS y permisos

## Matriz implementada

L = lectura; CRUD = gestión directa con políticas; RPC = función validada. Un cliente es un usuario autenticado sin rol staff activo.

| Recurso                   | Anónimo                             | Cliente                                | Operador                                      | Administrador                                    | Backend service_role                               |
| ------------------------- | ----------------------------------- | -------------------------------------- | --------------------------------------------- | ------------------------------------------------ | -------------------------------------------------- |
| Catálogo                  | L publicado/vigente                 | L publicado/vigente                    | L también catálogo inactivo; precios públicos | CRUD                                             | Sin acceso directo concedido por estas migraciones |
| Imágenes/Storage          | L aprobadas de productos publicados | Igual                                  | Metadatos internos; archivos sólo aprobados   | Gestionar metadatos y archivos del bucket propio | No se concede gestión de archivos                  |
| Perfil                    | —                                   | Crear/leer propio; editar display_name | Igual                                         | Leer perfiles                                    | —                                                  |
| Roles                     | —                                   | Leer propio si existe                  | Leer propio; sin escritura                    | Leer y set_staff_role RPC                        | —                                                  |
| Saldos/movimientos        | —                                   | —                                      | L                                             | L, ajustes/compensaciones RPC                    | Operaciones internas de pago/expiración            |
| Proveedores               | —                                   | —                                      | L                                             | CRUD                                             | —                                                  |
| Recepciones/detalles      | —                                   | —                                      | L, crear/confirmar RPC sin costos             | L, crear/confirmar RPC con costos opcionales     | —                                                  |
| Costos de recepción       | —                                   | —                                      | —                                             | L, escribir al crear recepción RPC               | —                                                  |
| Ventas externas/detalles  | —                                   | —                                      | L, registrar RPC                              | L, registrar RPC                                 | —                                                  |
| Pedidos/detalles/reservas | —                                   | L propios, crear/cancelar RPC          | Sólo pedidos propios como cliente             | L todos; cancelar RPC                            | Expirar/confirmar pago RPC                         |
| Pagos                     | —                                   | L propios, sin confirmación            | L propios                                     | L todos                                          | process_payment_event RPC                          |
| Eventos de pago           | —                                   | —                                      | —                                             | L                                                | Registrar mediante RPC                             |

Todas las 20 tablas tienen RLS habilitada y grants explícitos. No se concede escritura directa en saldos, movimientos, recepciones, detalles, pedidos, reservas, pagos ni eventos. No hay políticas de escritura para estas tablas: las operaciones autorizadas usan RPC. La matriz no garantiza aislamiento frente al dueño SQL/superusuario: es el administrador de infraestructura confiable. `service_role` tampoco debe llegar al navegador.

## Políticas

Catálogo: `categories_read`, `products_read`, `images_read`, `presentations_read`, `prices_read`; `catalog_admin` para CRUD administrativo. La visibilidad del producto exige categoría activa. Las consultas dependientes respetan RLS de productos/presentaciones. Imágenes requieren aprobación.

Privadas: `profiles_read/insert/update`, `roles_read`, `staff_read` en saldos, proveedores, ingresos, ventas externas y movimientos; `suppliers_admin`; `costs_admin`; `orders_read`; detalles, reservas y pagos autorizados por pedido visible; `events_admin`. Sin rol válido, las filas privadas quedan ocultas o el grant impide la consulta.

Storage: bucket `ferreteria-product-images` **privado**; `ferreteria_image_read/insert/update/delete`. Anónimo sólo lee objetos cuya ruta corresponda a imagen aprobada y producto publicado. No existen URLs públicas irrestrictas para borradores. Descarga autenticada/URLs firmadas futuras deberán respetar esta política y un TTL acotado. Otros buckets no se modifican.

## Funciones y privilegios

`app_private.has_role` consulta `staff_roles` usando `auth.uid()`; no confía en campos de rol del frontend ni `user_metadata`. No recibe una identidad arbitraria. `set_staff_role` requiere administrador, serializa cambios y protege al último admin. Primera asignación: operador de infraestructura confiable debe insertar un UUID de usuario Auth ya existente mediante SQL revisado. No hay credencial, usuario ni administrador sembrado por migraciones.

Los SECURITY DEFINER son las RPC que deben modificar tablas sin dar CRUD al cliente, el helper has_role y la guardia de unidad base que consulta datos privados. Todos tienen `search_path=''` y referencias de tablas calificadas. require_staff y los helpers de cálculo/bloqueo/movimiento son invoker internos, sin EXECUTE cliente. Triggers internos tampoco son RPC. Se revoca EXECUTE de PUBLIC y se concede sólo a authenticated para operaciones de usuario; pagos y expiración sólo a service_role. Authenticated sólo obtiene acceso a helpers de comprobación del propio rol.

Supabase/PostgREST verifica JWT y establece identidad. El adaptador local usa `SET ROLE` y claims de sesión **sólo dentro de tests**; no es implementación de autenticación. No exponer SQL arbitrario ni permitir al navegador establecer variables de sesión. Cuentas Auth anónimas y MFA requeridos para staff quedan como decisiones antes de habilitar servicios.

## Verificación y límites

Las pruebas reales ejercitan RLS bajo anon/authenticated, permisos por rol, aislamiento entre clientes, bloqueo de costos, cambios de rol no autorizados y pago inaccesible desde navegador. La suite también comprueba search_path y habilitación RLS. Falta ejecutar integración en Supabase local completo (JWT, API de Storage, URLs firmadas, advisors), no se declara validada. No se modificaron pantallas ni se entregaron claves.

Referencias oficiales: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [PostgreSQL Row Security](https://www.postgresql.org/docs/17/ddl-rowsecurity.html).
