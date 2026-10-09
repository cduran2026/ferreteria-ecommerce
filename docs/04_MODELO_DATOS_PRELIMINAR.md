# Modelo de datos propuesto · Etapa 02

La propuesta conceptual del PROMPT 01 se materializa en cinco migraciones versionadas. Se conserva inventario único, unidad base, precios enteros CLP, snapshots e idempotencia. No se conecta React, no se aplica a Cloud y no se despliega.

El detalle vigente está en [08_MODELO_DATOS_DETALLADO.md](08_MODELO_DATOS_DETALLADO.md); permisos en [09_SEGURIDAD_RLS.md](09_SEGURIDAD_RLS.md) y operaciones en [10_REGLAS_INVENTARIO.md](10_REGLAS_INVENTARIO.md).

Se proponen 20 tablas: catálogo (5), identidad (2), inventario/movimientos (2), proveedores/recepciones/costos (4), pedidos/detalles (2), ventas externas/detalles (2), reservas (1), pagos/eventos (2).

Cambios justificados respecto del concepto inicial: costos en `receipt_item_costs` para aislarlos incluso del operador; funciones internas en `app_private` sin ejecución pública; bucket privado con lectura aprobada para evitar filtración de borradores; mínimos de precio con intervalos excluyentes; TTL propuesto de 15 minutos y pago tardío en revisión, sin reasignación automática.

Disponible = físico − reservado, calculado en PostgreSQL. Las presentaciones usan equivalencias enteras positivas. Pedidos, recepciones y ventas conservan equivalencias; los pedidos también conservan nombres, precio y total. La unidad base de un producto utilizado no puede cambiarse.

IVA incluido/neto, TTL definitivo, devoluciones parciales y aprobación de ingresos siguen pendientes. Las decisiones técnicas están propuestas para revisión, no representan aprobación de política comercial.
