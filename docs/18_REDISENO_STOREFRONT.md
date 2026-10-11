# Rediseño premium del storefront

Fecha: 10 de octubre de 2026. Rama: `feature/storefront-premium-redesign`.
Base: `main` en `41f105bb7b212019e1351a641ea8dd25564aa05d`.

## Objetivos y aislamiento

Convertir el prototipo en una vitrina comercial clara para compra por unidad y volumen, manteniendo React, TypeScript, Vite, Tailwind y React Router. Se reutilizan las primitivas, rutas, catálogo de cuatro productos y arquitectura modular existentes. No se añaden dependencias.

El trabajo se realiza en un worktree independiente. El directorio de `feature/supabase-local-integration`, incluyendo sus archivos sin commit, se conserva intacto. No se fusiona con main, no se ejecutan despliegues manuales y no se cambia Supabase, SQL, inventario real ni administración.

## Referencia competitiva

Se consultó visualmente [Importadora Oro](https://www.importadoraoro.cl/) en escritorio y móvil. Presenta navegación por categorías, búsqueda, promociones, tarjetas con condiciones de cantidad y carrito. La portada concentra banners y bloques promocionales; en la vista móvil observada el buscador no aparece en el encabezado y el banner recorta su contenido.

Las oportunidades aplicadas son búsqueda visible en móvil, jerarquía comercial más ligera, menos etiquetas por tarjeta y distinción explícita entre precio por presentación y equivalencia en unidades base. Estas observaciones no constituyen una auditoría completa de su checkout ni de sus políticas. No se reutilizaron fotografías, textos, logotipos ni código del competidor.

La consulta HTTP del [piloto publicado](https://ferreteria-allstore-piloto.vercel.app/) no pudo completarse mediante la herramienta web. La comparación inicial y la implementación se basaron en el código de main y el prototipo ejecutado localmente. No se modificó el despliegue productivo.

## Decisiones visuales

Encabezado blanco, identidad provisional propia, amarillo #FFE600 en marca y acentos; azul #3483FA para detalles, azul oscuro #183B70 para jerarquía, fondo #F5F6F8 y superficies blancas. Los botones conservan el azul accesible #175EBF de la guía. Tipografía de sistema, bordes sutiles, sombras suaves y foco visible. Sin fuentes externas ni animaciones excesivas.

Los estilos públicos están aislados bajo `.storefront` y clases `sf-` en `src/styles/storefront.css`, conservando los estilos administrativos. La página principal combina hero, categorías disponibles, destacados, explicación de compra por volumen y beneficios sin promesas comerciales no verificadas.

## Pantallas y componentes

- Inicio: banner, tres categorías del catálogo, cuatro productos, sección mayorista y beneficios.
- Catálogo: búsqueda, categoría, precio máximo por presentación inicial, filtro de precios por volumen, orden y número de resultados; filtros desplegables en móvil y estado vacío.
- Ficha: imagen con zoom y miniatura, presentación, equivalencias, escalones, cantidad, precio aplicado y total; SKU secundario, descripción y relacionados.
- Carrito: líneas por producto/presentación, modificación de cantidades, eliminación, subtotales, equivalencias y total demostrativo. Checkout deshabilitado.
- Administración: estructura y funciones demo existentes conservadas; revisadas las rutas de inicio e inventario.

Nuevos módulos: `HomePage`, `CatalogPage`, `ProductPage`, `WholesaleSection`, `CartPage`, proveedor/contexto/hook de carrito, `ProductCard`, `QuantityControl`, iconos SVG propios y servicio central `demoCommerce`. `Pages.tsx` mantiene las exportaciones de las rutas existentes.

## Navegación

Rutas públicas preservadas: `/`, `/catalogo`, `/producto/:id`, `/carrito`. Búsqueda y filtros se reflejan en parámetros de URL; las categorías del encabezado y portada llevan a resultados filtrados. Cuenta aparece como funcionalidad futura deshabilitada. El pie enlaza a administración identificada como demo. No se agrega autenticación ni navegación a pagos.

## Reglas de demostración

Datos centralizados en `src/services/catalog.ts`; las reglas de precios y carrito viven en `src/services/demoCommerce.ts`. Cada presentación tiene su propia equivalencia y escalones. La cantidad del escalón corresponde al número de presentaciones seleccionadas, nunca a unidades base. El total es cantidad de presentaciones × precio aplicado; unidades equivalentes es cantidad × equivalencia.

Ejemplo verificado: taladro, caja de 4, cantidad 3: 12 unidades equivalentes, $239.960 por caja y total $719.880. Al bajar a 2 cajas: $259.960 por caja y total $519.920. Todos son precios ficticios.

Las líneas iguales se combinan y recalculan. Presentaciones diferentes se conservan separadas; su suma se valida contra el stock ficticio del producto. Cantidades fraccionarias, negativas, cero, fuera de stock o de rango numérico se rechazan. No se descuenta ni reserva stock. Las tarjetas sólo destacan escalones alcanzables con el stock demo disponible.

El carrito persiste identificadores y cantidades en `localStorage` (`allstore.demo-cart.v1`). Al restaurar se recalculan los importes desde el catálogo, se rechazan entradas corruptas y no se confía en precios almacenados. Si el almacenamiento no está disponible, funciona en memoria. No se guardan datos personales, credenciales ni información de pago.

## Responsive y accesibilidad

Validación a 360, 390, 430, 768, 1024 y 1440 px sobre inicio, catálogo, ficha, carrito con contenido, administración e inventario: 36 comprobaciones sin overflow horizontal de página. Registro: [responsive.json](redesign/responsive.json). Las tablas administrativas mantienen su scroll interno existente.

En móvil: buscador en fila propia, carrito visible, menú compacto, filtros desplegables, grilla de dos columnas, hero y ficha apilados, resumen de carrito bajo los productos. Inputs con nombres accesibles, botones de cantidad y eliminación etiquetados, radios semánticos, aviso de errores y notificaciones anunciados, salto al contenido, foco visible y reducción de movimiento. No se afirma certificación WCAG ni auditoría con lector de pantalla.

Capturas de revisión: [inicio escritorio](redesign/home-desktop.jpg), [inicio móvil](redesign/home-mobile.jpg), [ficha escritorio](redesign/product-desktop.jpg), [ficha móvil](redesign/product-mobile.jpg), [carrito móvil](redesign/cart-mobile.jpg).

## Imágenes y procedencia

No había fotografías de producto aprobadas en main. Se generaron cuatro ilustraciones originales con la herramienta ImageGen integrada, sin marcas ni recursos del competidor. Son fotografías sintéticas de productos ficticios, indicadas como ilustrativas en la tienda. Los PNG originales permanecen en el directorio de imágenes generadas; los activos de la rama se codificaron en JPEG calidad 85 sin cambiar su composición, aproximadamente 1 MB en conjunto.

Prompts de producción (descripción esencial): fotografía de estudio de producto ficticio sobre fondo blanco cálido, iluminación suave, sin logos, marcas, texto ni marca de agua; (1) taladro inalámbrico azul oscuro, (2) set de herramientas de mano con estuche negro y mangos azules, (3) caja kraft con tornillos plateados para madera, (4) guantes de trabajo grises y azules. Generación desde texto, sin imágenes del competidor.

Activos finales: `public/products/drill-demo.jpg`, `tools-demo.jpg`, `screws-demo.jpg`, `gloves-demo.jpg`. Deben reemplazarse por fotografías verificadas del inventario real antes de habilitar ventas. Los SVG originales se conservaron.

## Pruebas y controles

Ejecutados: `npm run build`, `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test`. La suite suma 13 pruebas: tres del catálogo existente y diez nuevas de escalones, límites, equivalencias, stock, combinación, actualización, eliminación y restauración del carrito.

En navegador se probaron búsqueda de taladro, precio máximo con resultado vacío, limpieza de filtros, orden ascendente, presentación caja, cambio de cantidad y escalón, agregado al carrito, recarga persistente, eliminación y estado vacío. En móvil se verificó abrir filtros, seleccionar Fijaciones y cerrar con el resultado filtrado. La herramienta emitió una advertencia al marcar el radio durante el cambio de URL, pero el estado visible confirmó selección y un resultado.

## Pendientes e integración futura

No están habilitados autenticación, pagos, pedidos, despacho, reserva de inventario, facturación ni Mercado Libre. Los datos, imágenes, precios y stock son de ejemplo. La galería sólo dispone de una imagen por producto. Falta contenido comercial aprobado y auditoría completa de accesibilidad antes de venta real.

Integrar PROMPT 03 de forma revisada posteriormente: sustituir el adaptador de catálogo manteniendo tipos y componentes; definir contratos explícitos de equivalencias y precios; calcular y validar el importe definitivo en servidor. El carrito local nunca debe ser fuente de verdad para stock, permisos ni precios. Revisar RLS y autenticación en la rama de integración antes de habilitar operaciones. Este rediseño no cambia migraciones ni funciones PostgreSQL.

La rama se publica para revisión, sin merge automático. Una vista previa de Vercel sólo se reportará si se verifica una URL generada automáticamente; no se activa ningún despliegue manual.

## Evolución posterior

La [Etapa 1 comercial](19_ETAPA_1_EVOLUCION_COMERCIAL.md) reemplaza la distribución inicial de portada, incorpora referencias y marcas y deja de usar las imágenes sintéticas anteriores. Este documento conserva el registro histórico del primer rediseño.
