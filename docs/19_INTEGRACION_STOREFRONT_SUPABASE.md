# PROMPT 04 · Integración del storefront y Supabase local

Fecha de validación: 15 de octubre de 2026.

## 1. Diagnóstico y protección inicial

- Storefront premium limpio: feature/storefront-premium-redesign, commit 4f69e66b9d2be3705c3bbb06e3f479f8a4a45c8f.
- PROMPT 03: feature/supabase-local-integration, HEAD 11385c86d4c8068f3240420508f84097d9a2487a. No existían commits de integración: 21 archivos rastreados modificados y 20 archivos nuevos relevantes.
- Ese HEAD corresponde a feature/database-foundation (PROMPT 02). Main permanece en 41f105bb7b212019e1351a641ea8dd25564aa05d.
- Se revisaron ambos worktrees, diferencias, archivos ignorados y las cinco migraciones del PROMPT 02 antes de editar.
- No se hizo stash, reset, clean, cambio de rama ni edición en los worktrees originales.

### Respaldo privado verificado

Directorio externo al repositorio: C:/Users/cduran/.codex/backups/ferreteria-prompt03-20261015.

Contiene 41 archivos fuente/documentación pendientes, manifest.json con SHA-256, status.txt y HEAD.txt. Se verificó cada copia contra su origen. Los dos archivos sensibles locales (.env.local y .local/ui-auth.json) se preservaron cifrados con DPAPI CurrentUser, verificando la recuperación en memoria. No se copiaron secretos en texto plano al respaldo ni a Git. El respaldo es privado, no se publica.

Se excluyeron node_modules, dist, cachés temporales de Supabase y logs de ejecución; son regenerables. No se modificaron los archivos originales excluidos.

## 2. Estado recuperado del PROMPT 03

| Área                | Estado recuperado                                                                         | Consolidación                                                               |
| ------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Auth                | Login, recuperación, verificación de identidad, roles y revocación periódica              | Proveedor integrado, errores de red tratados, rutas protegidas              |
| Catálogo            | Consultas anónimas, precios con vigencia, imágenes firmadas                               | Adaptador al contrato premium, marcas, jerarquía, disponibilidad            |
| Administración      | Productos, categorías, presentaciones, precios, aprobación de imágenes                    | Formularios y persistencia existentes recuperados; sin pantallas duplicadas |
| Marcas              | Columna products.brand, sin tabla de marcas                                               | Edición dentro de producto y navegación por valores publicados              |
| Inventario          | Consulta de saldos para personal                                                          | Sigue siendo sólo consulta en React                                         |
| Seguridad           | RLS, bucket privado, permisos admin/operador                                              | Pruebas reales repetidas y ampliadas                                        |
| SQL adicional       | Impuestos, expiración, devoluciones parciales y restricciones de Storage en migración 006 | Recuperada intacta, validada localmente                                     |
| Operación comercial | RPC transaccionales de base de datos; React sin checkout real                             | No se habilitaron pedidos, pagos, ingresos ni ajustes desde la tienda       |

Los 44 resultados históricos del PROMPT 03 no se tomaron como validación actual: se repitieron contra el entorno aislado.

## 3. Estrategia y referencias

Nueva rama: feature/storefront-supabase-integration. Nuevo worktree: C:/Users/cduran/.codex/worktrees/storefront-supabase-integration/Ferreteria All Store.

Se partió del commit premium validado. Se incorporaron los archivos SQL y pruebas del commit de fundación, más los archivos pendientes respaldados del PROMPT 03. No se hizo un merge automático ni se reemplazaron las páginas públicas premium con las versiones antiguas de Supabase. Las adaptaciones quedaron en esta rama; los dos originales siguen separados.

Se conservan portada, logos, imágenes existentes, asistente y configuración de avatar, carrito, equivalencias, navegación, gestión de scroll/foco, estilos responsive y fallback SPA de Vercel. No se generaron imágenes ni se cambió el avatar.

## 4. Componentes y contratos

- CatalogProvider/context: fuente única para portada, filtros, categorías, marcas, fichas, carrito y asistente. Estado de carga/error y reintento explícitos.
- supabaseCatalog: convierte filas PostgreSQL al Product/Presentation premium. Conserva UUID, SKU, marca, unidad, equivalencias, vigencias e imágenes autorizadas. Filtra equivalencias e importes no representables con seguridad en JavaScript.
- demoCommerce: conserva el calculador y acepta el catálogo como argumento. Los valores por defecto mantienen compatibilidad con las pruebas originales; el modo conectado siempre pasa su catálogo explícitamente.
- CartProvider: único carrito existente. Almacena IDs, presentación y cantidad, nunca precios persistidos. Revalida al cargar/actualizar catálogo. Almacenamiento separado: allstore.demo-cart.v1 y allstore.supabase-local-61321.cart.v1.
- Ficha sin presentaciones: informa datos pendientes sin intentar comprar ni producir un error de renderizado. Fotografías autorizadas pueden seleccionarse en la galería existente.
- AuthProvider/ProtectedRoute: sesión verificada con getUser y staff_roles; se limpia el rol al cambiar de identidad. Revocación revisada cada 30 segundos y al recuperar foco; RLS restringe inmediatamente cada operación de backend.
- Administración: guarda mediante PostgREST/Storage. Los formularios leen los valores nativos y las vigencias UTC sin reinterpretarlas como hora local. Los errores no muestran éxito.

### Modos de datos

- Sin variables o con VITE_CATALOG_MODE=demo y sin URL/clave: demostración explícita. Conserva referencias sin precio y ejemplos identificados; administración inhabilitada.
- VITE_CATALOG_MODE=supabase, URL local autorizada y clave pública: catálogo conectado. Las filas de desarrollo mantienen sus nombres/descripciones ficticios; conexión no equivale a validación comercial.
- Configuración parcial, Cloud, otra instancia local o clave privilegiada: estado de configuración inválida. No se usa fallback demo.
- Fallo de consulta: se retiran los resultados y se muestra error/reintento; nunca se sustituyen por datos ficticios. Tiempo máximo de consulta comercial: diez segundos.

El cliente del catálogo es independiente de la sesión administrativa, sin persistencia ni renovación de Auth. Así una sesión admin no amplía la lectura de la vitrina.

### Precio y disponibilidad

Cada precio es CLP por presentación, con IVA incluido según el modelo existente. La cantidad del escalón cuenta presentaciones; unidades equivalentes = cantidad × base_units. Se excluyen precios inactivos, futuros y vencidos. Una vigencia vencida en memoria tampoco permite cotizar. Sin precio o saldo confirmado no se agrega al carrito.

Las imágenes del bucket privado se firman por 300 segundos. El catálogo se refresca cada 60 segundos y al recuperar foco; la desaprobación bloquea nuevas URLs, las ya emitidas conservan su TTL. Una imagen no disponible muestra el placeholder aprobado.

## 5. Migraciones

Las migraciones 001–005 se recuperaron del PROMPT 02. La 006 se recuperó del trabajo pendiente del PROMPT 03 sin alterar su SQL. Al incorporarlas sólo se normalizaron finales de línea y líneas vacías finales. No se aplicaron migraciones a la instancia original ni a Cloud.

Nueva migración no destructiva 20261015000700_storefront_contract.sql:

1. category_is_public: comprueba que todos los ancestros estén activos, con detección de ciclos. Las políticas públicas de categorías/productos respetan esa jerarquía, manteniendo los permisos del personal.
2. storefront_availability(): sólo devuelve product_id y disponibilidad comercial calculada para productos publicados. No concede acceso a inventory_balances ni expone físico, reservado, movimientos, costos o roles.
3. storefront_quote(lines): función estable de sólo lectura. Recibe presentation_id y quantity; ignora importes enviados por el cliente y reutiliza app_private.price_at. Valida publicación, equivalencias, precios vigentes, cantidades enteras, límites numéricos y disponibilidad agregada del producto. Máximo 100 líneas y 999.999.999 presentaciones por línea.

La respuesta incluye líneas, equivalencias, precio aplicado, total_clp, quoted_at y checkout_enabled=false. No escribe pedidos ni reservas. La futura operación de compra deberá revalidar dentro de su propia transacción: una cotización no garantiza stock posterior.

Todas las funciones nuevas tienen search_path vacío, objetos cualificados y EXECUTE revocado por defecto, con permisos explícitos para la consulta comercial. No se deshabilitó RLS ni se añadieron tablas de marcas, promociones o administración.

## 6. Entorno aislado

Proyecto Supabase local: ferreteria_storefront_integration.

| Servicio        | Dirección/puerto       |
| --------------- | ---------------------- |
| API             | http://127.0.0.1:61321 |
| PostgreSQL      | 61322                  |
| Studio          | 61323                  |
| Correo local    | 61324                  |
| Shadow DB       | 61320                  |
| Vite conectado  | http://127.0.0.1:61380 |
| Vite demo de QA | http://127.0.0.1:61381 |
| Inspector edge  | 61383                  |

Windows rechazó el rango 573xx inicialmente propuesto. Se verificó y utilizó 613xx. La instancia original ferreteria_ecommerce en 563xx, ALEN_CONTROL y La Carpintería no se alteraron.

La configuración del frontend acepta únicamente localhost/127.0.0.1:61321 por HTTP, sin credenciales embebidas, ruta, query ni fragmentos adicionales. Rechaza service_role y claves secretas. Las claves privilegiadas usadas por las pruebas Node permanecen sólo en ese proceso local, nunca en el bundle o documentación.

## 7. Validaciones ejecutadas

- Build, TypeScript, lint y formato del proyecto.
- 71 pruebas Vitest: las 55 originales del storefront, cinco recuperadas del PROMPT 03 y once nuevas de integración. No se eliminó ninguna prueba. La prueba recuperada de URL se adaptó al puerto 61321; los contratos visuales originales se conservan.
- scripts/test-db.ps1: 94 comprobaciones PASS entre migraciones, denegación inicial, integridad, RLS y concurrencia. Las tres pruebas simultáneas cubren sobreventa, pago duplicado y reserva que vence esperando un bloqueo.
- scripts/test-db-supabase.ps1: suite de integridad/RLS sobre la instancia aislada dentro de una transacción revertida.
- scripts/test-supabase.mjs: 62 comprobaciones HTTP reales, incluidas las 44 recuperadas. Auth, JWT inválido/vencido, anon/cliente/operador/admin, escrituras denegadas, revocación, CRUD, Storage privado/aprobación/MIME/tamaño y cotización comercial.
- Dos correcciones del harness Windows PowerShell conservan las aserciones: captura del stderr esperado de sobrestock y envío del JSON por stdin para evitar pérdida de comillas.
- Navegador: categoría nueva, marca editada y escalón UTC guardados y presentes tras recargar. Login/logout, operador sin edición, inventario de consulta, cliente bloqueado y anónimo redirigido.
- Compra de revisión: tres unidades × 64.990 = 194.970, mismo total en servidor; carrito restaurado tras recargar. Ningún pedido/reserva creado por esa acción.
- Acceso directo y recarga de catálogo y ficha locales, búsqueda/filtros de marca, datos pendientes, asistente conectado, Escape y retorno de foco.
- Navegación demo desde producto al final del catálogo: ficha en scroll 0 con foco en h1; regreso al catálogo en scroll 1314 y foco en el enlace de origen.
- 60 comprobaciones responsive sin desbordamiento horizontal: cinco pantallas × seis anchos × dos modos. Anchos 360, 390, 430, 768, 1024 y 1440. Evidencia: integracion/responsive.json.
- Fallo real: se detuvo únicamente PostgREST aislado; apareció error y cero tarjetas. Se restauró el servicio y Reintentar recuperó el catálogo.

Las pruebas usan exclusivamente datos ficticios locales. Los scripts HTTP crean fixtures y usuarios; no deben ejecutarse contra otra instancia. No se probó una base remota ni producción. Las verificaciones de rutas desplegadas se consignan en el informe final, según exista Preview accesible.

## 8. Seguridad y limitaciones

- No hay service_role en frontend, ni acceso público a saldos internos/costos, ni escrituras anónimas al catálogo.
- Admin modifica catálogo; operador consulta inventario y no edita catálogo; cliente no accede al panel. La protección real se verifica mediante peticiones al backend, además de las rutas React.
- No hay registro público, checkout, pago, facturación, promociones ni operaciones de inventario desde la interfaz.
- Marcas se administran como atributo del producto, acorde con el esquema; no existe un ABM independiente ni se creó uno.
- El orden Destacados conserva el comportamiento existente; el esquema todavía no tiene un atributo editorial persistido de destacados.
- El catálogo piloto detecta el límite de 1.000 filas y falla explícitamente; antes de ampliar el catálogo se debe implementar paginación de servidor. No se simula que un resultado truncado sea completo.
- URLs firmadas mantienen acceso hasta su vencimiento; no equivalen a revocación instantánea de URLs ya emitidas.
- El build advierte sobre un chunk principal superior a 500 kB. Es una oportunidad posterior de partición/carga diferida; no se ocultó el aviso elevando el umbral.
- Recuperación de contraseña por correo local conservada; no se validó entrega de correo externa ni se cambiaron contraseñas reales.
- Sin entorno remoto de pruebas autorizado, la Preview debe permanecer en demo. No está conectada a PostgreSQL de producción.

## 9. Ejecución y despliegue

1. En este worktree, npm ci y node node_modules/supabase/dist/supabase.js start. Confirmar project_id y puertos antes de usar scripts de datos.
2. Configurar un .env.local privado con VITE_CATALOG_MODE=supabase, VITE_SUPABASE_URL=http://127.0.0.1:61321 y la clave anon/publicable de esa instancia. No copiar claves privilegiadas. .env.example contiene la plantilla segura de demo.
3. Cargar supabase/local-catalog.sql sólo en la base aislada y ejecutar las suites indicadas. Los datos de prueba no constituyen catálogo comercial aprobado.
4. npm run dev -- --host 127.0.0.1 --port 61380 --strictPort. Las pruebas SQL se ejecutan con PowerShell; las pruebas HTTP con Node.
5. Publicar únicamente feature/storefront-supabase-integration. La integración Git de Vercel puede generar Preview; confirmar commit y estado Ready antes de darla por validada.
6. Preview demo: no configurar URL ni claves Supabase. No promover a producción, no fusionar main, no ejecutar migraciones Cloud.

La CLI de Vercel no dispone de sesión autenticada en este entorno. Si GitHub no genera Preview automáticamente, entrar en el proyecto ferreteria-allstore-piloto y crear un despliegue Preview de esta rama. No usar --prod ni crear otro proyecto temporal.

## 10. Recuperación

- Los worktrees originales siguen disponibles con sus ramas y archivos pendientes originales; no necesitan restauración.
- Para recuperar el respaldo, verificar SHA-256 de manifest.json y copiar files a un directorio de recuperación nuevo. No sobrescribir el original sin comparar.
- Los archivos .dpapi sólo se descifran con ProtectedData.Unprotect, ámbito CurrentUser, en el mismo usuario Windows. Validar el SHA-256 recuperado antes de uso; mantenerlos fuera de Git y de copias compartidas.
- La integración se recupera desde la nueva rama publicada. No requiere reemplazar ninguna de las ramas originales.
- Para retirar únicamente el entorno de pruebas, ejecutar supabase stop desde este worktree con project_id ferreteria_storefront_integration. No ejecutar comandos globales de limpieza de Docker ni stop desde otro proyecto.

## 11. Siguiente etapa recomendada

Revisar esta rama y su diseño en demo; después autorizar un Supabase remoto exclusivo de pruebas. Validar datos comerciales, fotografías y permisos con usuarios de prueba antes de planificar integración a main. Promociones/ofertas y checkout requieren una etapa separada, con revalidación transaccional de precios y stock. No se creó ningún servicio Cloud durante este trabajo.
