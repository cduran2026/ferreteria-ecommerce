# Guía de diseño

Identidad provisional: Ferretería All Store Chile. NEXORA no estuvo disponible entre los proyectos visibles; se aplican las especificaciones entregadas, sin copiar otro proyecto. El sitio actual se consultó como contexto; no se modifica ni se reutilizan marcas distintivas de Mercado Libre.

| Token            | Color   | Uso                                |
| ---------------- | ------- | ---------------------------------- |
| Amarillo         | #FFE600 | Header comercial, acentos          |
| Azul             | #3483FA | Barras, detalles interactivos      |
| Azul oscuro      | #183B70 | Marca, textos destacados           |
| Fondo            | #F5F6F8 | Área general                       |
| Superficie       | #FFFFFF | Tarjetas y formularios             |
| Texto            | #242A35 | Lectura principal                  |
| Secundario       | #697386 | Ayuda y metadatos                  |
| Borde            | #E5E7EB | Separadores                        |
| Éxito            | #16A34A | Estados positivos                  |
| Error            | #DC2626 | Validación                         |
| Acción accesible | #175EBF | Botones con texto blanco y enlaces |

Los tokens viven en `src/styles/tokens.css`. El azul de acciones se oscurece para mejorar el contraste del texto blanco. Tipografía de sistema, radios 7–18 px, espaciado consistente y sombras discretas. Administración blanca/gris con sidebar y header; amarillo sólo en acentos pequeños.

Primitivas: Button, Input, Select, Card, Badge, Modal con dialog nativo, Table con scroll horizontal, EmptyState y LoadingState. Componentes especializados: ProductCard, Sidebar y Header.

Tarjetas priorizan imagen, nombre, precio CLP, presentación y acceso a ficha. Ficha: ilustración principal y zoom, presentación, cantidad, disponibilidad y acciones explícitamente demo; descripción secundaria. Las ilustraciones SVG locales son propias y temporales: reemplazarlas por fotografías aprobadas y una galería real antes de publicar.

Responsive: grids de 4/3 a 2 columnas, ficha apilada, filtros sobre catálogo en móvil; navegación administrativa horizontal en pantallas pequeñas. Inputs etiquetados, enlaces semánticos, navegación por teclado, foco visible, enlace de salto y modal con Escape y foco nativo. No inferir disponibilidad real ni certificaciones de productos desde datos demo.

## Storefront premium (etapa 18)

El encabezado público ahora es blanco; el amarillo se reserva para identidad y pequeños acentos. Los estilos de tienda están aislados en storefront.css. Se incorporan ilustraciones originales de productos ficticios en JPEG, filtros móviles, tarjetas compactas, escalones por presentación y carrito local demostrativo. Se conservan tokens, primitivas y estilos administrativos. Decisiones, reglas, capturas y validaciones en [Rediseño del storefront](18_REDISENO_STOREFRONT.md).

## Evolución comercial — Etapa 1

Banner reducido, discos de corte primero, navegación jerárquica y por marcas. Tarjetas compactas y placeholders neutros hasta recibir fotografías autorizadas; las imágenes sintéticas anteriores dejan de mostrarse. Precios/stock desconocidos se informan y bloquean compra. Los estilos públicos incrementales viven en commercial.css. Ofertas sin datos válidos no muestran porcentajes ni tachados. Ver [Etapa 1](19_ETAPA_1_EVOLUCION_COMERCIAL.md).
