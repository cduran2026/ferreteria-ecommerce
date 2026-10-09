# Arquitectura

React + TypeScript estricto + Vite; Tailwind CSS mediante plugin oficial Vite; React Router; Supabase (PostgreSQL, Auth, Storage, Edge Functions) preparado mediante variables. Vitest, ESLint y Prettier. Hosting futuro Vercel; no configurado.

- `src/app/router`: rutas y gestión de errores de navegación.
- `src/app/layouts`: tienda pública y administración separados.
- `src/components/ui`, `store`, `admin`: primitivas y componentes especializados.
- `src/features/catalog`, `admin`: pantallas de la etapa.
- `src/features/cart`, `checkout`, `inventory`, `orders`: espacios reservados, sin operaciones reales.
- `src/services/catalog.ts`: datos públicos de muestra y funciones puras.
- `src/types`: contratos tipados. `src/lib`: configuración de proveedores.
- `src/styles`: tokens y estilos compartidos. `src/hooks`: reservado para lógica reutilizable.
- `supabase/migrations`, `functions`: reservados; sin infraestructura productiva.
- `tests`: reglas demostrativas de búsqueda y equivalencias.

Se mantiene el proyecto en la raíz del directorio proporcionado, evitando un nivel redundante. Sin librería adicional de componentes/iconos/estado: HTML semántico, SVG propios y estado local de React bastan. Tailwind disponible junto a clases semánticas reutilizables para evitar duplicación. `package-lock.json` fija versiones efectivas. El generador actual trae oxlint; se sustituye por ESLint para cumplir el stack aprobado.

## Límites de seguridad

El administrador demo es público y sólo contiene datos ficticios. El router no es una barrera de seguridad. En futuras etapas, permisos reales se verificarán en PostgreSQL/RLS y funciones backend. El cliente público sólo recibirá proyecciones de catálogo sin costos ni movimientos internos. Tablas de clientes y pedidos se aislarán por identidad; personal administrativo tendrá roles verificados por backend. Nunca confiar en precio, stock o rol enviados por el navegador.

Sólo URL y clave publicable pueden aparecer en variables `VITE_*`. Claves service-role, secretos de pagos y credenciales privadas pertenecen exclusivamente al backend. `.env` se excluye de Git. Sin variables, Supabase es `null`; las pantallas no importan ni llaman al cliente. Producción requiere HTTPS, RLS probada, separación de ambientes, validación de entradas, monitoreo y revisión de seguridad.

Operaciones críticas futuras: funciones transaccionales PostgreSQL para reservas/descuentos, bloqueo de filas y restricciones de integridad, permisos mínimos e idempotencia. Edge Functions validarán firmas de pagos y delegarán una única transacción de negocio. Errores esperados usarán códigos de dominio; detalles privados quedarán en logs backend, sin exponerlos al usuario.
