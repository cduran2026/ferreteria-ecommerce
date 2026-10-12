# Etapa 1B — Identidad y asistente de compras

## Alcance y aislamiento

Trabajo incremental sobre feature/storefront-premium-redesign, base 47c1ab58d607207133b5661cf90ae889dd8120a2 confirmada en GitHub. Conserva portada, catálogo, fichas, administración y contratos comerciales de Etapa 1. No se modifica demoCommerce, CartProvider, SQL, Supabase, main ni producción. No hay endpoints nuevos, servicios de IA, pagos ni pedidos reales.

## Recursos gráficos e identidad

La propuesta adjunta “Mascota Toro Negro para Ferretería (1).png” es referencia conceptual. Es un póster compuesto con fondos, textos, logotipos y varios personajes; no se redistribuye ni se utiliza como botón. No se generó, reinterpretó, retocó ni recortó otro personaje o logotipo. Para evitar residuos del póster, se usa el icono temporal de casco permitido por el alcance. El avatar gráfico definitivo y su aprobación comercial siguen pendientes.

AssistantAvatar separa el recurso de los componentes. Para sustituirlo: aportar una ilustración individual autorizada, limpia y transparente; optimizarla (WebP/PNG, tamaño recomendado hasta 256 px para este uso); guardarla en public/images/assistant/; configurar avatar.src con ruta local y commercialAvatarApproved=true en src/config/storeAssistant.ts, después de la aprobación. Verificar recorte, contraste, móvil y licencia antes de publicar. No se descarga ni copia fotografía ajena.

Icon.tsx amplía la iconografía SVG existente, sin bibliotecas: discos, perforación, elevación, ruedas, cerraduras, fijaciones, grifería, jardín, pulverización, construcción, selladores y seguridad. categoryIcons centraliza la correspondencia. Los placeholders siguen diciendo “Fotografía pendiente”; los iconos no representan fotos comerciales.

Akilda se agrega a la lista central de marcas sin asignarle productos ficticios. Akilda, Stanford y Rex muestran catálogo pendiente.

## Arquitectura

- Configuración: src/config/storeAssistant.ts (enabled, avatar/aprobación y WhatsApp).
- Estado y consultas: services/assistant.ts (reducer, búsqueda, categorías, marcas, resumen del carrito).
- Teclado: services/assistantKeyboard.ts (límites del recorrido de foco).
- Presentación: StoreAssistant, AssistantAvatar, AssistantPanel, AssistantActions.
- Estilo: styles/assistant.css, limitado al storefront.
- Montaje: StoreLayout dentro del CartProvider existente, fuera de rutas administrativas.

assistantSearch usa queryCatalog; categorías/marcas usan catalogHref y la taxonomía existente. Las referencias pendientes usan cardPricing/ProductPrice para mostrar “Precio pendiente”, sin cálculos duplicados. El resumen lee useCart, cuenta productos distintos, combinaciones y cantidad de presentaciones; no crea otro carrito, no modifica cantidades ni realiza transacciones.

El estado del asistente y borrador de contacto vive en memoria. No agrega almacenamiento local, cookies, telemetría, fetch, formularios remotos ni variables de entorno. Su diseño permite cambiar la fuente de acciones en una etapa futura; no hay integración conversacional real.

## Acciones

| Acción               | Resultado                                                                                                                                      |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Buscar productos     | Consulta normalizada local, hasta tres referencias de resultados, ficha y enlace a catálogo con q. Sin término vacío ni resultados inventados. |
| Explorar categorías  | Padres y sus hijos, cantidad registrada o estado vacío, enlace al filtro existente.                                                            |
| Explorar marcas      | Toro Negro, YTS, Akilda, Stanford y Rex. Cuenta real del catálogo registrado, sin equiparar registros con stock disponible.                    |
| Comprar por volumen  | Explica unidad/caja/pack/embalaje según producto y escalones por presentaciones; enlace a mayorista=1.                                         |
| Consultar mi carrito | Consulta el estado actual, distingue presentaciones de unidades base, abre carrito o catálogo si está vacío.                                   |
| Solicitar ayuda      | Mensaje editable, contacto pendiente y enlace de retorno al catálogo.                                                                          |

WhatsApp configurado internacionalmente como 56928242288 (+56 9 2824 2288), approved=false. El número no se expone como enlace activo. El helper devuelve null hasta aprobación. Tras confirmación comercial, approved=true habilita wa.me con texto editable codificado; el usuario abre voluntariamente WhatsApp y decide si envía. Nunca se envían mensajes automáticamente ni se agregan datos del carrito, precios, stock o datos personales al mensaje.

## UX y accesibilidad

Botón compacto inferior derecho con etiqueta “Ayuda” y nombre accesible “Abrir asistente Toro Negro”; bienvenida al abrir voluntariamente, sin ventanas automáticas ni notificaciones insistentes. La etiqueta inicial amplia produjo superposición en algunos anchos de escritorio y se corrigió antes de publicar: acceso compacto y margen lateral reservado entre 801–1350 px. Padding inferior y scroll-margin evitan que los controles enfocados queden al borde del acceso.

Panel con dialog.showModal, nombre/descripción asociados, fondo inerte y foco contenido. Tab/Shift+Tab ciclan entre controles visibles; cambios de vista enfocan el encabezado; Escape, cerrar y minimizar devuelven foco al botón. Al navegar se cierra el panel. Reabrir conserva la sección durante la visita, sin persistencia adicional.

Panel adapta ancho y alto con dvh, safe-area y scroll interno; etiqueta amplia oculta. Movimiento breve de apertura, hover/foco discretos y preferencia reduced-motion respetada. El feedback al agregar continúa usando el mensaje del proveedor original, desplazado por encima del botón. Sin carga artificial: el catálogo es local y síncrono.

## Validaciones

- 46 pruebas automatizadas en cinco archivos: las 32 existentes y 14 nuevas.
- Nuevas: reducer abrir/cerrar, edición/búsqueda, filtros/rutas, categorías vacías, cinco marcas, carrito compartido, precios pendientes, presentaciones, contacto bloqueado, fetch no invocado por consultas/render, semántica inicial de diálogo, configuración deshabilitada e iconos; límites de Tab/Shift+Tab.
- Interacciones reales automatizadas con navegador: apertura por clic/Enter, cierre/minimización/reapertura, Escape y retorno de foco; ciclo Tab/Shift+Tab; búsqueda discos y sin resultado; marca Akilda vacía; categoría Elevación; navegación por volumen; carrito vacío, agregar taladro y consultar el mismo carrito; contacto deshabilitado.
- Se corrigió el recorrido de foco después de comprobar que el comportamiento nativo del navegador podía salir hacia su interfaz. Se revalidó el ciclo explícito y Escape.
- 42 vistas de páginas: inicio, catálogo, referencia, producto demo, carrito con contenido, admin y admin/inventario, en 360/390/430/768/1024/1440 px. Sin overflow horizontal ni superposición del acceso con controles visibles comprobados. Asistente ausente de administración.
- 42 vistas del panel: inicio y seis opciones, en los mismos anchos. Dentro del viewport, sin overflow horizontal, foco dentro del diálogo.
- Registro: [responsive](assistant-stage1b/responsive.json). Capturas: [escritorio](assistant-stage1b/assistant-desktop.jpg), [móvil](assistant-stage1b/assistant-mobile.jpg), [marcas](assistant-stage1b/brands-mobile.jpg).
- Ejecutados y aprobados: npm run build, npm run typecheck, npm run lint, npm run format:check y npm run test (46/46). Commit y Preview se informan en la entrega final.

Las comprobaciones de navegador son pruebas sobre viewport, no certificación WCAG ni pruebas en dispositivos físicos. La prueba fetch verifica el código local, no una auditoría de red de Vercel; Vercel puede mostrar su propia barra de Preview. Durante HMR hubo un aviso de React por ampliar dependencias de un efecto; la comprobación final se hace sobre carga nueva y build terminado.

## Pendientes y entrega

Avatar individual autorizado y aprobación comercial; confirmación de uso de WhatsApp; fotografías, precios y stock reales; productos de marcas vacías. Integración de IA, promociones y Supabase requieren una etapa posterior aprobada. Ningún precio, equivalencia, inventario, descuento o regla de carrito cambia en 1B.

Desactivar fácilmente con storeAssistantConfig.enabled=false. Publicar únicamente feature/storefront-premium-redesign y revisar su Preview automática; no merge ni promoción a producción.

## Logos oficiales — 12 de octubre de 2026

Se incorporan los PNG oficiales entregados por el cliente a “Tus marcas, más cerca”: Toro Negro (03), YTS (04), Akilda (05), Rex (06) y Stanford (07). Copias idénticas en public/images/brands, sin recortar, recolorear ni modificar los archivos originales. Configuración central en src/config/brandLogos.ts. Mantienen proporción con object-fit: contain, texto alternativo, nombre accesible y el filtro de marca existente. Esta autorización aplica a estos logos; no habilita el avatar ni WhatsApp pendientes.
