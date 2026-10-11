# Etapa 1 — Evolución comercial del storefront

Fecha: 10 de octubre de 2026. Rama: feature/storefront-premium-redesign.
Base de esta etapa: 1db95369ac2f1e3317042f8042d45e4107070714.

## Alcance y aislamiento

Rediseño incremental público, sin reconstruir el carrito ni la administración. Se conserva React, TypeScript, Vite, Tailwind y React Router, sin dependencias adicionales. Se trabaja exclusivamente en el worktree existente. PROMPT 03 y sus archivos sin commit no se modifican. No se modifican SQL, Supabase, producción, main ni servicios de otros proyectos. Etapas 2 y 3 permanecen pendientes de aprobación.

## Distribución comercial

Encabezado compacto con búsqueda, cuenta futura deshabilitada y carrito. Menús de categorías jerárquicas y marcas; banner horizontal reducido; producto protagonista de discos de corte; accesos a Toro Negro, YTS, Stanford y Rex; referencias destacadas; productos demo de volumen; espacio de ofertas sin promociones publicadas; categorías adicionales, explicación de volumen y beneficios.

El pack de discos aparece antes de marcas y categorías adicionales. Sólo existe un caso confirmado de esta familia: no se inventaron otros discos para llenar la portada. La primera tarjeta completa queda dentro del viewport probado en los seis anchos (altura 800 px para móvil, 900 px para tablet/escritorio). En teléfonos más bajos puede verse parcialmente; buscador y acceso a carrito permanecen al inicio.

## Catálogo y fuentes

Se mantienen los cuatro ejemplos originales en products, usados por administración y pruebas. storeProducts reúne esos ejemplos y las cinco referencias en referenceCatalog. Los imports administrativos y sus componentes no se alteran.

- Ejemplos demo: importes y stock ficticios originales, sin asignarles marcas reales.
- Referencias del cliente: marca/presentación verificadas, sin precio ni stock asignados. SKU pendiente y fotografías pendientes. Agregado bloqueado.
- introducedAt indica incorporación a esta vitrina; novedades no significa lanzamiento de fabricante.
- featured identifica selección editorial, no ventas históricas. No se utiliza Más vendidos sin datos.

Productos de referencia:

1. YTS, pack de 50 discos: https://www.mercadolibre.cl/50-discos-yts-de-corte-fino-para-metal-4-12-pulgadas-45/up/MLCU17791741
2. Toro Negro, tecle manual de una tonelada: https://www.mercadolibre.cl/tecle-con-cadena-manual-1-tonelada-3-metros-de-cadena/p/MLC63364782
3. YTS, grifería de lavaplatos: https://www.mercadolibre.cl/llave-grifo-lavaloza-de-acero-inoxidable-lavaplatos/up/MLCU3497084873
4. Toro Negro, fumigador de 15 litros: https://www.mercadolibre.cl/fumigador-pulverizador-rociador-15litros-bomba-tn0453/up/MLCU21501643
5. Toro Negro, pack de cuatro ruedas: https://www.mercadolibre.cl/4-ruedas-giratorias-3-pulgada-con-freno-para-mueble-carrito/up/MLCU3694142116

Se verificaron en el análisis anterior las publicaciones aportadas por el cliente. No se importaron precios, descuentos, inventario ni fotografías. Medidas contradictorias de publicaciones no se incorporan. La ficha técnica definitiva y la relación con SKU interno siguen pendientes.

## Fotografías e identidad

Amarillo para acciones/acento comercial, azul oscuro como identidad y blanco como base. Nombres de marcas en texto; no se descargan logotipos. ProductMedia admite fotografías autorizadas y, cuando faltan, presenta un placeholder de icono/categoría, sin simular una foto.
Las imágenes sintéticas del rediseño anterior ya no se utilizan en las pantallas públicas. Los activos antiguos se conservan en el repositorio para mantener el historial; no se generan nuevas imágenes. Capturas de navegador sólo documentan la interfaz, no son recursos comerciales.

## Taxonomía y navegación

catalogTaxonomy centraliza id, name, slug y parent_id, compatibles con el modelo existente sin migraciones. Incluye cinco familias propuestas y sus subcategorías; Seguridad se conserva para el ejemplo de guantes bajo Ferretería. Categoría padre incluye descendientes. Desconocidos y ciclos se manejan sin bucles en la exploración del árbol.
Menús con links semánticos, apertura nativa, cierre al navegar y Escape con devolución del foco. Marcas Stanford y Rex no tienen productos confirmados y muestran estado vacío informativo, sin asignaciones falsas.

URL: q, categoria, marca, min, max, disponibilidad, mayorista, orden. Filtros combinados, recarga y navegación compartible. Se conserva búsqueda por nombre/SKU/marca y se normalizan acentos. Orden por destacados, novedades del catálogo, precio ascendente/descendente y nombre. Precios desconocidos al final en ambos órdenes; se excluyen si hay rango de precio. Rango y orden se refieren a la presentación identificada en cada tarjeta, no a precio equivalente de unidad base.

## Ficha, precios y carrito

Se mantiene demoCommerce como cotizador y validador. BaseQuantity convierte equivalencias de forma segura. cardPricing y availability centralizan el estado de la tarjeta. Precio y stock desconocidos se representan como null, nunca como cero. Sin datos válidos no hay agregado.
Las referencias de pack sólo tienen su pack configurado: no se ofrece venta suelta ni se inventan caja/embalaje. Discos: 50 unidades equivalentes; ruedas: 4. Estas equivalencias describen la referencia y deberán validarse contra el inventario definitivo antes de integración.

La ficha separa precio por presentación de equivalente aproximado por unidad base cuando existe importe y equivalencia mayor a uno. Cantidades extremas producen aviso y bloqueo, no excepción de render. Fichas con imagen ausente no muestran controles de zoom decorativos. Relacionados se basan en marca confirmada o categoría, y la sección se oculta si no hay coincidencias.

Carrito original: agregar, combinar igual presentación, mantener diferentes presentaciones, actualizar, eliminar, subtotales y totales. Stock demo se valida entre presentaciones, sin descontar inventario. Persistencia original localStorage mantenida. Restauración inválida o de producto con datos faltantes informa al usuario; no se confían importes almacenados.
Ejemplo verificado: 3 cajas de 4 taladros = 12 unidades, $239.960 por caja y $719.880 total; 2 cajas = 8 unidades, $259.960 por caja y $519.920 total. Todo ficticio, checkout deshabilitado.

## Preparación visual de ofertas

ProductPrice centraliza la presentación del precio y reserva un punto oculto para ofertas. La portada incluye un estado explícito sin ofertas publicadas. No se representan precio tachado, porcentaje ni vigencia sin una oferta válida.
La Etapa 2 conectará precio normal/promocional, porcentaje y vigencia a este componente y a la sección de portada mediante el motor central aprobado. No existe motor, panel ficticio, descuento decorativo ni migración de promociones en esta etapa.

## Componentes y decisiones técnicas

Nuevos: NavigationMenus, ProductMedia, ProductPrice, catalogTaxonomy, referenceCatalog, catalogQuery.
Reutilizados/ampliados: StoreLayout, HomePage, CatalogPage, ProductCard, ProductPage, QuantityControl, CartPage, CartProvider y demoCommerce. Productos demo y contratos existentes se conservan con extensión explícita para referencias.
commercial.css ajusta únicamente clases públicas existentes y nuevas, importado después de storefront.css; estilos y layout administrativos siguen intactos.
Vitest incluye también archivos test.tsx para pruebas de render con react-dom/server, sin jsdom ni nuevas dependencias.

## Validación ejecutada

Suite: 32 pruebas en cuatro archivos (13 existentes y 19 nuevas). Nuevas pruebas: jerarquía, filtros combinados, orden con precios desconocidos, novedades/destacados, URL, marcas vacías, ausencia de datos inventados, equivalencias de pack, stock desconocido, bloqueo de compra, recuperación de carrito, tarjetas y navegación renderizadas.
Ejecutados y aprobados: build, typecheck, lint sin warnings, format:check y test (32/32). El control final de lint detectó una asignación inicial innecesaria en la recuperación del carrito; se corrigió y se volvió a validar.

Navegador:

- Menú jerárquico a Elevación y menú de marcas a Rex.
- Búsqueda de taladro desde encabezado.
- Filtros de categoría/marca/disponibilidad/búsqueda con recarga.
- Rango 3.000–10.000 + disponibilidad demo: un resultado (guantes).
- Limpieza, recuperación desde marca vacía Stanford y orden por precio con pendientes al final.
- Filtros móviles YTS + discos, cierre y resultado único.
- Bloqueo de referencia sin precio y cantidad extrema sin romper ficha.
- Compra demo por caja, cambio de escalón, recarga persistente, eliminación y estado vacío.
- Teclado: cierre de menú Escape y acceso de salto al contenido; foco visible. Cuenta y checkout son funcionalidades futuras explícitamente deshabilitadas.
- Sin errores de consola durante la revisión.
- 42 comprobaciones: inicio, catálogo, ficha de referencia, ficha demo, carrito con contenido, admin y admin/inventario × 360/390/430/768/1024/1440. Sin overflow horizontal de página; tablas administrativas mantienen scroll interno.
- Menú abierto a 390 px sin overflow adicional. No se afirma certificación WCAG ni auditoría con lector de pantalla.

Registro: [responsive](commercial-stage1/responsive.json).
Capturas: [inicio escritorio](commercial-stage1/home-desktop.jpg), [inicio móvil](commercial-stage1/home-mobile.jpg), [catálogo escritorio](commercial-stage1/catalog-desktop.jpg), [catálogo móvil](commercial-stage1/catalog-mobile.jpg), [ficha referencia móvil](commercial-stage1/reference-mobile.jpg), [carrito móvil](commercial-stage1/cart-mobile.jpg).

## Pendientes

Catálogo definitivo, fotografías y logos autorizados, precios/stock/ficha técnica de cinco referencias, productos Stanford/Rex, SKU internos, políticas comerciales y futuras ofertas. Estos datos condicionan una vitrina con fotografías reales y compra habilitada de referencias. Con placeholders y precios pendientes no se presenta el sitio como comercio operativo.
Motor de promociones y administración (Etapa 2), integración Supabase (Etapa 3), pagos y operaciones reales no habilitados.
Se publicará sólo esta rama y su Preview automática. No merge ni promoción a producción.
