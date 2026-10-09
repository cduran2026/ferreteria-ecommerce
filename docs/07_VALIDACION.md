# Validación de la etapa 01

Fecha: 9 de octubre de 2026. Datos comerciales ficticios.

| Comprobación ejecutada    | Resultado                                                                                                                                      |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Instalación npm           | Completada, lockfile generado                                                                                                                  |
| `npm run build`           | Correcto: TypeScript y bundle Vite                                                                                                             |
| `npm run typecheck`       | Correcto, modo estricto                                                                                                                        |
| `npm run lint`            | Correcto, cero advertencias tras separar RouteError                                                                                            |
| `npm test`                | 1 archivo, 3 pruebas aprobadas                                                                                                                 |
| `npm run format:check`    | Correcto                                                                                                                                       |
| HTTP local                | 200 en inicio                                                                                                                                  |
| Navegación en navegador   | Inicio → catálogo → ficha → dashboard → inventario → inicio                                                                                    |
| Interacciones verificadas | Búsqueda de taladro, filtro de precio sin resultados, limpieza, presentación caja, bloqueo de cantidad excesiva, modal demo y búsqueda por SKU |
| Responsive                | Cinco vistas a 390 × 844; sin desbordamiento global; tablas y menú administrativo con scroll interno                                           |
| Inspección visual         | Inicio y dashboard en escritorio; inicio, catálogo, ficha y dashboard en móvil                                                                 |
| Secretos                  | Búsqueda de patrones de claves privadas sin coincidencias en src/public/tests/env ejemplo; no se ingresaron credenciales                       |
| Exclusiones Git           | `.env`, `.env.local`, `.env.production`, node_modules y dist ignorados; `.env.example` incluido                                                |

Pruebas Vitest: combinación de búsqueda/categoría/precio, conversión de cajas a unidades base y rechazo de cantidades inválidas, formato CLP. No son pruebas de inventario productivo ni de pagos.

Stack efectivamente instalado: React/React DOM 19.3.0, TypeScript 6.0.3, Vite 8.3.4, Tailwind 4.3.3, React Router 7.18.4, Supabase JS 2.117.3, Vitest 5.0.3, ESLint 10.12.0 y Prettier 3.9.9. Ver `package-lock.json` para versiones transitivas.

## Pendientes y límites

GitHub CLI ausente en PATH y ubicaciones habituales: no se pudo verificar autenticación ni existencia del repositorio privado remoto. No hay publicación ni URL confirmada. Seguir README para publicar tras verificar cuenta y nombre. Git local usa main; consultar `git log -1 --oneline` para el commit inicial.

NEXORA no disponible en los directorios visibles. Fotografías comerciales y galería real pendientes; el prototipo usa SVG propios y zoom ilustrativo. No hay servicios productivos ni despliegue. La revisión de secretos por patrones no sustituye una auditoría para producción; no se realizó auditoría completa de accesibilidad ni matriz de navegadores/dispositivos.

PROMPT 02 recomendado: validar dominio (unidad base, equivalencias, precios/IVA, reservas, canales, roles) y diseñar esquema/RLS con casos de integridad e idempotencia. Implementar sólo después de la autorización correspondiente.
