# Plan de desarrollo

1. **Base y prototipo (actual):** estructura, diseño, cinco vistas y calidad. Aceptación: build, lint, pruebas, navegación y responsive; limitaciones registradas.
2. **Dominio y seguridad (PROMPT 02 propuesto, requiere autorización):** confirmar unidad base, equivalencias, precios/IVA, roles y estados; diseñar esquema y matriz RLS. Aceptación: revisión del modelo y casos de acceso/concurrencia antes de conectar datos.
3. **Catálogo y administración:** productos, categorías, imágenes privadas/públicas según propósito, presentaciones y precios por volumen. Depende de Auth/RLS y modelo aprobados.
4. **Inventario:** ingresos, ajustes, movimientos, reservas y registro manual de ventas externas. Aceptación: integridad transaccional, trazabilidad, duplicados y concurrencia.
5. **Compra y pagos:** carrito, checkout, pedidos y un proveedor elegido (Webpay o Mercado Pago). Depende de inventario seguro; probar webhooks, idempotencia, cancelación y reconciliación en sandbox.
6. **Validación y entrega:** seguridad, accesibilidad, rendimiento, pruebas de negocio, backup, observabilidad y aprobación del cliente. Recién entonces preparar Vercel/producción.

Pendientes comerciales: marca final, fotografías, catálogo real, precios minoristas/mayoristas, impuestos, entrega/retiro, devoluciones, roles y proveedor de pagos. No implementar fases posteriores durante el PROMPT 01.
