import { utcInput, utcValue } from '../../services/adminDates'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  readRows,
  saveRow,
  inventoryRows,
  uploadImage,
} from '../../services/adminCatalog'
import type { Row, CatalogTable } from '../../services/adminCatalog'
import { safeError } from '../../lib/errors'
import { useAuth } from '../auth/useAuth'
import {
  Badge,
  Button,
  Card,
  Input,
  LoadingState,
  Modal,
  Select,
  Table,
} from '../../components/ui'
interface Field {
  key: string
  label: string
  type?: 'number' | 'boolean' | 'datetime-local' | 'select'
  optional?: boolean
  min?: number
  options?: { value: string; label: string }[]
}
const categoryFields: Field[] = [
  { key: 'name', label: 'Nombre' },
  { key: 'slug', label: 'Slug' },
  { key: 'description', label: 'Descripción', optional: true },
  { key: 'parent_id', label: 'Categoría padre (UUID)', optional: true },
  { key: 'display_order', label: 'Orden', type: 'number' },
  { key: 'active', label: 'Activa', type: 'boolean' },
]
function FormEditor({
  table,
  initial,
  fields,
  onDone,
  onClose,
}: {
  table: CatalogTable
  initial: Row
  fields: Field[]
  onDone: () => void
  onClose: () => void
}) {
  const [values, setValues] = useState<Row>(initial),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false)
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      const form = new FormData(e.currentTarget)
      const row: Row = {}
      if (initial.id) row.id = initial.id
      for (const f of fields) {
        const v =
          f.type === 'boolean' ? form.has(f.key) : String(form.get(f.key) ?? '')
        row[f.key] =
          f.type === 'boolean'
            ? Boolean(v)
            : f.type === 'number'
              ? Number(v ?? 0)
              : f.type === 'datetime-local'
                ? v
                  ? utcValue(String(v))
                  : null
                : v === '' && f.optional
                  ? null
                  : (v ?? null)
        if (!f.optional && f.type !== 'boolean' && (v == null || v === ''))
          throw new Error('missing')
      }
      await saveRow(table, row)
      onDone()
      onClose()
    } catch (err) {
      setMessage(safeError(err))
    } finally {
      setBusy(false)
    }
  }
  return (
    <form onSubmit={submit}>
      {fields.map((f) => (
        <label key={f.key}>
          {f.label}
          {f.type === 'boolean' ? (
            <input
              name={f.key}
              type="checkbox"
              checked={Boolean(values[f.key])}
              onChange={(e) =>
                setValues({ ...values, [f.key]: e.target.checked })
              }
            />
          ) : f.type === 'select' ? (
            <Select
              name={f.key}
              aria-label={f.label}
              required={!f.optional}
              value={String(values[f.key] ?? '')}
              onChange={(e) =>
                setValues({ ...values, [f.key]: e.target.value })
              }
            >
              <option value="">Seleccionar</option>
              {f.options?.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          ) : (
            <Input
              name={f.key}
              required={!f.optional}
              type={f.type ?? 'text'}
              step={f.type === 'number' ? 1 : undefined}
              min={f.min}
              value={
                f.type === 'datetime-local' && values[f.key]
                  ? utcInput(String(values[f.key]))
                  : String(values[f.key] ?? '')
              }
              onChange={(e) =>
                setValues({ ...values, [f.key]: e.target.value })
              }
            />
          )}
        </label>
      ))}
      <small>Vigencias ingresadas en UTC.</small>
      {message && <p role="alert">{message}</p>}
      <Button disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</Button>
    </form>
  )
}
function RowsManager({
  table,
  title,
  fields,
  rows,
  filter = {},
  reload,
}: {
  table: CatalogTable
  title: string
  fields: Field[]
  rows: Row[]
  filter?: Row
  reload: () => void
}) {
  const [editing, setEditing] = useState<Row | null>(null),
    [status, setStatus] = useState('')
  const list = rows.filter((r) =>
    Object.entries(filter).every(([k, v]) => r[k] === v),
  )
  return (
    <Card>
      <div className="section-heading">
        <h2>{title}</h2>
        {table !== 'product_images' && (
          <Button
            onClick={() =>
              setEditing({ ...filter, active: false, display_order: 0 })
            }
          >
            Crear {title.toLowerCase()}
          </Button>
        )}
      </div>
      <p className="success" role="status">
        {status}
      </p>
      <Table headings={['Registro', 'Estado', 'Acciones']}>
        {list.map((row) => (
          <tr key={String(row.id)}>
            <td>
              {String(
                row.name ??
                  row.label ??
                  row.alt_text ??
                  `Desde ${row.min_quantity}: $${row.price_clp}`,
              )}
              <small>
                {String(
                  row.sku ??
                    row.barcode ??
                    row.valid_from ??
                    row.slug ??
                    row.storage_path ??
                    '',
                )}
              </small>
            </td>
            <td>
              <Badge>
                {row.active || row.approved
                  ? 'Activo / aprobado'
                  : 'Inactivo / borrador'}
              </Badge>
            </td>
            <td>
              <Button className="secondary" onClick={() => setEditing(row)}>
                Editar
              </Button>
              {table === 'products' && (
                <Link to={`/admin/productos/${row.id}`}>
                  {' '}
                  Presentaciones, precios e imágenes →
                </Link>
              )}
            </td>
          </tr>
        ))}
      </Table>
      {!list.length && <p>No hay registros.</p>}
      {editing && (
        <Modal
          title={`Editar ${title.toLowerCase()}`}
          onClose={() => setEditing(null)}
        >
          <FormEditor
            table={table}
            initial={editing}
            fields={fields}
            onDone={() => {
              setStatus('Cambios guardados.')
              reload()
            }}
            onClose={() => setEditing(null)}
          />
        </Modal>
      )}
    </Card>
  )
}
function useCatalogAdmin() {
  const [data, setData] = useState<Record<CatalogTable, Row[]>>({
      categories: [],
      products: [],
      presentations: [],
      volume_prices: [],
      product_images: [],
    }),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [revision, setRevision] = useState(0)
  useEffect(() => {
    let live = true
    Promise.all(
      (
        [
          'categories',
          'products',
          'presentations',
          'volume_prices',
          'product_images',
        ] as CatalogTable[]
      ).map(async (table) => [table, await readRows(table)] as const),
    )
      .then((entries) => {
        if (live) {
          setData(Object.fromEntries(entries) as Record<CatalogTable, Row[]>)
          setError('')
        }
      })
      .catch((e) => {
        if (live) setError(safeError(e))
      })
      .finally(() => {
        if (live) setLoading(false)
      })
    return () => {
      live = false
    }
  }, [revision])
  return {
    data,
    loading,
    error,
    reload: () => {
      setLoading(true)
      setRevision((x) => x + 1)
    },
  }
}
function AdminOnly({ children }: { children: React.ReactNode }) {
  const { role } = useAuth()
  return role === 'admin' ? (
    children
  ) : (
    <Card>
      <h2>Acceso restringido</h2>
      <p>El catálogo requiere rol administrador.</p>
    </Card>
  )
}
export function CatalogAdminPage({
  table,
}: {
  table: 'categories' | 'products'
}) {
  return (
    <AdminOnly>
      <CatalogAdminContent table={table} />
    </AdminOnly>
  )
}
function CatalogAdminContent({ table }: { table: 'categories' | 'products' }) {
  const { data, loading, error, reload } = useCatalogAdmin()
  if (loading) return <LoadingState />
  if (error) return <p role="alert">{error}</p>
  const fields: Field[] =
    table === 'categories'
      ? categoryFields
      : [
          { key: 'sku', label: 'SKU' },
          { key: 'name', label: 'Nombre' },
          { key: 'description', label: 'Descripción', optional: true },
          {
            key: 'category_id',
            label: 'Categoría',
            type: 'select',
            options: data.categories.map((c) => ({
              value: String(c.id),
              label: String(c.name),
            })),
          },
          { key: 'brand', label: 'Marca', optional: true },
          { key: 'base_unit', label: 'Unidad base' },
          { key: 'active', label: 'Activo', type: 'boolean' },
        ]
  return (
    <RowsManager
      table={table}
      title={table === 'categories' ? 'Categorías' : 'Productos'}
      fields={fields}
      rows={data[table]}
      reload={reload}
    />
  )
}
export function ProductAdminPage() {
  return (
    <AdminOnly>
      <ProductAdminContent />
    </AdminOnly>
  )
}
function ProductAdminContent() {
  const { id } = useParams()
  const { data, loading, error, reload } = useCatalogAdmin()
  const [file, setFile] = useState<File | null>(null),
    [alt, setAlt] = useState(''),
    [status, setStatus] = useState(''),
    [busy, setBusy] = useState(false)
  if (loading) return <LoadingState />
  if (error) return <p role="alert">{error}</p>
  const p = data.products.find((x) => x.id === id)
  if (!p) return <Card>Producto no encontrado.</Card>
  const presentations = data.presentations.filter((x) => x.product_id === id),
    prices = data.volume_prices.filter((x) =>
      presentations.some((y) => y.id === x.presentation_id),
    )
  return (
    <>
      <h2>{String(p.name)}</h2>
      <p className="muted">
        Precios CLP con IVA incluido. Equivalencias en unidad base.
      </p>
      <div className="editor-grid">
        <RowsManager
          table="presentations"
          title="Presentaciones"
          rows={data.presentations}
          filter={{ product_id: id! }}
          reload={reload}
          fields={[
            { key: 'product_id', label: 'Producto UUID' },
            {
              key: 'kind',
              label: 'Tipo',
              type: 'select',
              options: [
                { value: 'unit', label: 'Unidad' },
                { value: 'box', label: 'Caja' },
                { value: 'package', label: 'Embalaje' },
              ],
            },
            { key: 'label', label: 'Nombre de presentación' },
            {
              key: 'base_units',
              label: 'Equivalencia',
              type: 'number',
              min: 1,
            },
            { key: 'barcode', label: 'Código de barras', optional: true },
            { key: 'active', label: 'Activa', type: 'boolean' },
          ]}
        />
        <RowsManager
          table="volume_prices"
          title="Precios"
          rows={prices}
          reload={reload}
          fields={[
            {
              key: 'presentation_id',
              label: 'Presentación',
              type: 'select',
              options: presentations.map((x) => ({
                value: String(x.id),
                label: String(x.label),
              })),
            },
            {
              key: 'min_quantity',
              label: 'Cantidad mínima',
              type: 'number',
              min: 1,
            },
            {
              key: 'price_clp',
              label: 'Precio CLP con IVA incluido',
              type: 'number',
              min: 0,
            },
            { key: 'valid_from', label: 'Desde UTC', type: 'datetime-local' },
            {
              key: 'valid_until',
              label: 'Hasta UTC',
              type: 'datetime-local',
              optional: true,
            },
            { key: 'active', label: 'Activo', type: 'boolean' },
          ]}
        />
      </div>
      <Card>
        <h2>Subir imagen</h2>
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            if (!file) return
            setBusy(true)
            try {
              await uploadImage(id!, file, alt)
              setStatus('Imagen subida como borrador.')
              setFile(null)
              reload()
            } catch (err) {
              setStatus(
                err instanceof Error && err.message.startsWith('Utiliza')
                  ? err.message
                  : safeError(err),
              )
            } finally {
              setBusy(false)
            }
          }}
        >
          <label>
            Imagen JPEG, PNG o WebP · Máximo 5 MB
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <label>
            Texto alternativo
            <Input
              required
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
            />
          </label>
          <Button disabled={busy || !file}>Subir como borrador</Button>
        </form>
        <p role="status">{status}</p>
      </Card>
      <RowsManager
        table="product_images"
        title="Imágenes"
        rows={data.product_images}
        filter={{ product_id: id! }}
        reload={reload}
        fields={[
          { key: 'alt_text', label: 'Texto alternativo' },
          { key: 'display_order', label: 'Orden', type: 'number' },
          { key: 'is_primary', label: 'Principal', type: 'boolean' },
          { key: 'approved', label: 'Aprobar publicación', type: 'boolean' },
        ]}
      />
    </>
  )
}
export function DashboardPage() {
  const { data, loading, error } = useCatalogAdmin()
  if (loading) return <LoadingState />
  if (error) return <p role="alert">{error}</p>
  const metrics = [
    ['Productos', data.products.length],
    ['Productos activos', data.products.filter((p) => p.active).length],
    ['Categorías', data.categories.length],
    [
      'Productos sin imágenes',
      data.products.filter(
        (p) => !data.product_images.some((i) => i.product_id === p.id),
      ).length,
    ],
  ]
  return (
    <>
      <h2>Una mirada a tu catálogo</h2>
      <p className="muted">
        Indicadores de la base local, sin métricas de ventas.
      </p>
      <div className="metrics">
        {metrics.map(([label, value]) => (
          <Card key={label}>
            <span className="muted">{label}</span>
            <strong>{value}</strong>
          </Card>
        ))}
      </div>
      <Card>
        <Badge>PRÓXIMAS ETAPAS</Badge>
        <h2>Compra e inventario operativo</h2>
        <p>Pedidos, ingresos y pagos aún no se operan desde React.</p>
      </Card>
    </>
  )
}
export function InventoryPage() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof inventoryRows>>>(
      [],
    ),
    [query, setQuery] = useState(''),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true)
  useEffect(() => {
    let live = true
    inventoryRows()
      .then((data) => {
        if (live) setRows(data)
      })
      .catch((e) => {
        if (live) setError(safeError(e))
      })
      .finally(() => {
        if (live) setLoading(false)
      })
    return () => {
      live = false
    }
  }, [])
  return (
    <>
      <h2>Existencias · Sólo consulta</h2>
      <p>No se habilitan ingresos, ajustes ni ventas desde React.</p>
      <label>
        Buscar producto o SKU
        <Input value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      {loading ? (
        <LoadingState />
      ) : error ? (
        <p role="alert">{error}</p>
      ) : (
        <Card>
          <Table headings={['Producto', 'Físico', 'Reservado', 'Disponible']}>
            {rows
              .filter((r) =>
                JSON.stringify(r.products)
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              )
              .map((r) => (
                <tr key={r.product_id}>
                  <td>
                    {(r.products as unknown as { name: string })?.name ??
                      r.product_id}
                  </td>
                  <td>{r.physical}</td>
                  <td>{r.reserved}</td>
                  <td>{r.available}</td>
                </tr>
              ))}
          </Table>
          {!rows.length && <p>No hay existencias registradas.</p>}
        </Card>
      )}
    </>
  )
}
export function ModulePage() {
  const { module } = useParams()
  return (
    <Card>
      <Badge>PENDIENTE</Badge>
      <h2>{module}</h2>
      <p>Operación aún no habilitada en React.</p>
    </Card>
  )
}
