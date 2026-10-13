# Corrección integral UX/UI y conversión — 13 de octubre de 2026

## Alcance

Implementación incremental de las diez oportunidades aprobadas sobre feature/storefront-premium-redesign, base 83fc2e9e1998222df85d7aef62bdfe4e1caa4fc3. Mantiene React/TypeScript/Vite/Tailwind, identidad azul/amarillo, secciones actuales, logos originales y asistente. Sin cambios SQL, Supabase, PROMPT 03, main ni producción. No se generaron imágenes comerciales ni se modificó el avatar.

Criterios: frontend-design (Anthropic) y web-design-guidelines (Vercel). Referencias: [Vite en Vercel](https://vercel.com/docs/frameworks/frontend/vite), [ScrollRestoration](https://reactrouter.com/api/components/ScrollRestoration) y [guías de interfaz](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md).

## Diez correcciones

| Nº  | Problema                                          | Corrección                                                                                                                                                                                                                                                                                                                                           |
| --- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 404 al abrir o recargar rutas internas            | vercel.json reescribe páginas hacia index.html. Excluye assets/, images/ y archivos con extensión: conserva recursos físicos y sus 404 reales. Catálogo, producto, carrito y admin conservan rutas actuales.                                                                                                                                         |
| 2   | Scroll heredado al entrar a ficha                 | NavigationLayout compartido monta una única ScrollRestoration por historial. Nuevas páginas comienzan arriba; Atrás/Adelante restaura la posición de cada entrada. Foco al h1 al cambiar de página, sin desplazar scroll; al volver se enfoca el enlace de origen si existe. Los filtros mantienen scroll y foco de edición con preventScrollReset.  |
| 3   | Botón Agregar deshabilitado como acción dominante | ProductCard presenta Ver producto como acción principal cuando cardPricing no permite comprar, incluidos precio/stock desconocido y stock insuficiente. Mantiene información pendiente y cotizador original.                                                                                                                                         |
| 4   | Texto comercial de 9–10 px                        | Disponibilidad, condiciones, presentación y placeholders pasan a 12 px como mínimo, color #596579 y jerarquía comercial. Nombres de tarjetas a 14 px. Ficha comercial usa 13 px para equivalencias y condiciones.                                                                                                                                    |
| 5   | Lenguaje de inventario poco comprensible          | commercialCopy deriva unidades/cajas/sets/pares/packs/embalajes de las presentaciones. 3 cajas = 12 unidades, 12 pares, 50 discos, según datos registrados. No cambia baseUnits, precios, stock ni escalones. El carrito no suma pares y sets como una supuesta cantidad universal de unidades.                                                      |
| 6   | Ficha móvil demasiado larga antes de comprar      | Placeholder de 92 px cuando no hay imagen, distribución de presentaciones adaptable y espaciado compacto. Escalones se conservan después de la acción principal, en el mismo orden DOM y visual. SKU y descripción técnica siguen disponibles. A 390 px, el botón del taladro pasa de ~1.381 a ~989 px desde el inicio.                              |
| 7   | Flecha de detalles de 28 px                       | Acciones de tarjetas, cantidad, navegación, filtros y botones principales usan un área práctica mínima de 44 × 44 px. Radios se activan mediante su etiqueta amplia. Hover, teclado y foco visible conservados.                                                                                                                                      |
| 8   | Confirmación sin siguiente paso                   | CartFeedback mantiene el mensaje del proveedor y añade Ver carrito sólo ante agregado correcto. Sin otro carrito ni estados comerciales paralelos; errores conservan su mensaje sin enlace de éxito.                                                                                                                                                 |
| 9   | Redacción genérica/repetitiva                     | Titular Herramientas y ferretería al detalle y por mayor. Producto demo identifica ejemplos; cantidades usan sus nombres comerciales. Se conserva aviso global sin pagos ni pedidos, estados pendientes y precios demostrativos. Se eliminó de la galería la explicación interna sobre derechos de terceros; no es información técnica del producto. |
| 10  | Asistente con opciones ocultas por texto          | Bienvenida breve y opciones sin subtítulos redundantes. Seis acciones visibles en todos los anchos comprobados. Avatar intacto, teclado/Escape/foco y contacto pendiente conservados.                                                                                                                                                                |

## Decisiones de datos y arquitectura

commercialCopy sólo formatea texto desde Presentation y Product. Un set de doce piezas continúa siendo un set en el inventario, y un par de guantes continúa siendo un par; no se convierten en piezas individuales sin configuración. Cuando una presentación contiene más unidades, la equivalencia usa baseQuantity/cotizador existentes.

El carrito muestra equivalencia por línea y productos diferentes en el resumen; no mezcla unidades de productos heterogéneos. Cálculos monetarios siguen en demoCommerce, sin nuevas reglas de negocio.

NavigationLayout es padre común de los layouts públicos y administrativos, sin alterar pantallas admin. ScrollRestoration usa una clave propia allstore.scroll.v1 en sessionStorage; sólo posiciones por historial, sin datos personales. La clave combina entrada, ruta y filtros para evitar heredar posiciones entre cargas directas distintas con key=default. Memoria de enlaces de origen en RAM, ignorando clics con modificadores para preservar apertura en otra pestaña. No hay servicios externos ni dependencias nuevas.

Las nuevas rutas no simulan autorización: administración continúa en modo demo. Productos pendientes y checkout siguen bloqueados. WhatsApp y recurso gráfico del asistente no se habilitan.

## Validación local

55 pruebas en seis archivos: se mantienen las 46 anteriores (dos expectativas de texto/CTA actualizadas para la conducta aprobada), más nueve de correcciones. Cobertura nueva: fallback/exclusiones, cambio de foco, layout/ruta anidada con ScrollRestoration, producto sin precio/stock, nombres comerciales, equivalencias/precios de caja, carrito mixto y feedback de éxito/error.

Navegador automatizado:

- Producto de sección inferior de portada abre con scrollY=0 y foco en su título.
- Regreso a catálogo desde guantes restaura scrollY=2.228 y enlace de origen.
- Selección de 3 cajas del taladro: 12 unidades, $239.960 por caja, total $719.880. Ver carrito en feedback lleva al mismo carrito.
- 42 vistas de páginas (inicio, catálogo, referencia, producto demo, carrito, admin, inventario) en 360/390/430/768/1024/1440: sin overflow horizontal, textos de disponibilidad >=12 px y acciones de tarjetas >=44 px.
- Asistente en seis anchos: dentro de viewport, sin overflow y seis opciones visibles.
- SKU conservado; no se afirma certificación WCAG ni validación en dispositivos físicos.

[Registro responsive](ux-corrections/responsive.json). [Inicio](ux-corrections/home-desktop.jpg), [ficha móvil](ux-corrections/product-mobile.jpg), [asistente móvil](ux-corrections/assistant-mobile.jpg).

Build, typecheck, lint, formato y suite se ejecutan antes de publicar. La aceptación del fallback no depende del build: requiere abrir y recargar rutas en la nueva Preview real; resultados, URL y commit se incluyen en la entrega final.

## Validación obligatoria en Preview

Comprobar catálogo directo y recarga; ficha directa y recarga; carrito y rutas administrativas; navegación desde producto inferior de portada; Atrás al catálogo con posición restaurada; agregar demo y Ver carrito; asistente en móvil. Comprobar JS/CSS e imágenes servidos como recursos estáticos y archivo ausente como 404. No promoción ni despliegue manual productivo.

## Pendientes

Precios/stock/fotografías autorizadas de referencias, catálogo de marcas vacías, avatar individual comercial y WhatsApp continúan pendientes. Promociones, autenticación, pagos e integración Supabase se mantienen fuera del alcance. Los errores de negocio y límites de cantidad conservan el cotizador existente.
