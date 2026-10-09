# Ferretería All Store Chile

Base de e-commerce · PROMPT 01 · Prototipo local, sin operaciones comerciales.

## Inicio

Requiere Node.js 24 LTS y npm. Ejecutar desde este directorio:

```powershell
npm ci
npm run dev
```

Abrir la URL Local indicada por Vite. Rutas: `/`, `/catalogo`, `/producto/taladro`, `/admin`, `/admin/inventario`. El buscador y filtros consultan datos estáticos. Las acciones de compra y stock muestran avisos; no persisten ni modifican datos. No usar este administrador demo con información real.

## Calidad

```powershell
npm run build
npm run typecheck
npm run lint
npm test
npm run format:check
```

`npm run format` aplica Prettier. Ver [informe de validación](docs/07_VALIDACION.md) para resultados ejecutados.

## Configuración

Copiar `.env.example` a `.env.local` sólo si se desea preparar el cliente Supabase. Usar URL y clave publicable; nunca service-role ni secretos en VITE. Sin variables no se crea cliente. Esta etapa no requiere cuenta Supabase. Las pantallas no tienen autenticación real; las migraciones de la etapa 02 se validan por separado y no se usan desde React. En producción, BrowserRouter requerirá fallback a `index.html`; configurar al preparar Vercel, no ahora.

## Estructura y documentación

`src/app` rutas/layouts; `components` primitivas/store/admin; `features` módulos; `services` datos públicos demo; `types` contratos; `lib` proveedores; `styles` tokens. `supabase` reservado sin SQL productivo. `tests` reglas puras.

- [Resumen](docs/01_RESUMEN_PROYECTO.md)
- [Alcance](docs/02_ALCANCE_FUNCIONAL.md)
- [Arquitectura](docs/03_ARQUITECTURA.md)
- [Modelo conceptual](docs/04_MODELO_DATOS_PRELIMINAR.md)
- [Plan](docs/05_PLAN_DESARROLLO.md)
- [Diseño](docs/06_GUIA_DISENO.md)

## Repositorio

Repositorio privado: [cduran2026/ferreteria-ecommerce](https://github.com/cduran2026/ferreteria-ecommerce). `origin` ya está configurado. La etapa 01 está publicada en `main`; la etapa 02 se publica para revisión en `feature/database-foundation`, sin fusión ni despliegue automático.

## Etapa 02 · Fundación de base de datos

Migraciones SQL y RLS listas para revisión en `feature/database-foundation`; las pantallas siguen usando datos demo. No hay Supabase Cloud ni pasarela conectada.

```powershell
pwsh -NoProfile -File scripts/test-db.ps1
```

Requiere Docker Desktop y PowerShell 7. La prueba crea y elimina su propio PostgreSQL aislado. No utilizar los fixtures/adaptador local en Cloud. Documentación: [modelo detallado](docs/08_MODELO_DATOS_DETALLADO.md), [permisos RLS](docs/09_SEGURIDAD_RLS.md), [reglas de inventario](docs/10_REGLAS_INVENTARIO.md), [pruebas](docs/11_PRUEBAS_BASE_DATOS.md), [decisiones pendientes](docs/12_DECISIONES_PENDIENTES.md).

El repositorio privado ya se vinculó y publicó en https://github.com/cduran2026/ferreteria-ecommerce después del informe histórico de la etapa 01. No se fusiona esta rama automáticamente.
