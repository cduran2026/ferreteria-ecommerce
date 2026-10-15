# Decisiones pendientes

1. **IVA:** confirmar neto o incluido, redondeos y desglose. El modelo almacena CLP enteros sin calcular impuestos; esta etapa no decide tributación.
2. **Reserva:** aprobar TTL propuesto de 15 minutos y cuándo reservar en el checkout; definir frecuencia del worker de expiración. Ningún scheduler instalado.
3. **Ingresos autorizados:** actualmente el rol operator activo permite crear/confirmar recepciones sin costos. Confirmar si requiere aprobación por recepción, límites o permiso adicional antes de habilitar operaciones reales.
4. **Costos:** costo por presentación recibida opcional, sólo admin. Definir valoración del inventario y unidades contables; no se implementa contabilidad.
5. **Presentaciones:** equivalencias enteras y unidad base única; confirmar si existen productos fraccionables. Cambios de unidad base después de uso se bloquean; crear nuevo producto o migración revisada si se necesita conversión.
6. **Precios:** confirmar precio minorista/mayorista sólo por volumen o por tipo de cliente; política de escalones monotónicos, mínimos, gratuidad/precio cero y normalización de SKU/barcode.
7. **Devoluciones:** decidir parcial/completa, autorización, estado de mercadería y reembolso. Compensación actual es completa y sólo inventario.
8. **Pedidos:** definir dirección, entrega/retiro, descuentos, costos de despacho y estados logísticos en la próxima etapa comercial; no se añadieron sin definición.
9. **Pagos:** elegir Webpay o Mercado Pago, estados del proveedor, verificación de webhooks, reconciliación, intentos/reintentos, resolución/reembolso de pago tardío. Sólo estructura/RPC, ninguna pasarela real.
10. **Identidad:** UUID del primer administrador mediante operación de infraestructura revisada, MFA staff, cuentas Auth anónimas, perfiles y retención/anonimización de datos. Ningún usuario Cloud creado.
11. **Imágenes:** formatos/tamaño, aprobación, URLs firmadas y TTL; pruebas de integración con Storage real. Bucket privado propuesto.
12. **Operación técnica:** entorno Supabase local completo, pruebas PostgREST/JWT/Storage, retry de deadlock y monitoreo, backups y carga real antes de producción.

Estas decisiones no bloquean la entrega del diseño propuesto, pero requieren revisión antes de conectar pantallas o habilitar operaciones comerciales. No amplían el alcance hacia facturación, sincronización Mercado Libre ni servicios de otros proyectos.

PROMPT 03 sugerido: revisar/aprobar decisiones prioritarias, levantar Supabase **local propio**, validar Auth/Storage/RLS con stack completo y preparar tipos/servicios de catálogo. No conectar operaciones de compra/pagos ni crear Cloud sin autorización expresa de esa etapa.
