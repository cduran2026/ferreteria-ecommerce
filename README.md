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

Copiar `.env.example` a `.env.local` sólo si se desea preparar el cliente Supabase. Usar URL y clave publicable; nunca service-role ni secretos en VITE. Sin variables no se crea cliente. Esta etapa no requiere cuenta Supabase. No existen migraciones ni autenticación. En producción, BrowserRouter requerirá fallback a `index.html`; configurar al preparar Vercel, no ahora.

## Estructura y documentación

`src/app` rutas/layouts; `components` primitivas/store/admin; `features` módulos; `services` datos públicos demo; `types` contratos; `lib` proveedores; `styles` tokens. `supabase` reservado sin SQL productivo. `tests` reglas puras.

- [Resumen](docs/01_RESUMEN_PROYECTO.md)
- [Alcance](docs/02_ALCANCE_FUNCIONAL.md)
- [Arquitectura](docs/03_ARQUITECTURA.md)
- [Modelo conceptual](docs/04_MODELO_DATOS_PRELIMINAR.md)
- [Plan](docs/05_PLAN_DESARROLLO.md)
- [Diseño](docs/06_GUIA_DISENO.md)

## Publicación privada en GitHub pendiente

Git disponible; GitHub CLI no instalado ni accesible en PATH. No fue posible verificar cuenta autenticada, existencia del remoto o publicar. No hay URL remota confirmada. Instalar GitHub CLI desde su distribución oficial e iniciar sesión sin guardar credenciales en este proyecto:

```powershell
gh auth login
gh auth status
$account = gh api user --jq .login
gh repo view "$account/ferreteria-ecommerce"
```

Si existe, detenerse y revisar su propósito; no sobrescribir. Si devuelve 404 con autenticación/permisos correctos, crear exclusivamente este repositorio:

```powershell
gh repo create ferreteria-ecommerce --private --source . --remote origin --push
gh repo view --json url,isPrivate
git remote -v
git status --short
```

Si existe otro error (red/permisos), resolverlo antes de crear. No configurar workflows de despliegue. El commit local de esta etapa debe existir antes de `--push`.
