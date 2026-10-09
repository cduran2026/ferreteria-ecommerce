import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { products, money } from '../../services/catalog'
import { Badge, Button, Card, Input, Modal, Table } from '../../components/ui'
export function DashboardPage() {
  return (
    <>
      <div className="section-heading">
        <div>
          <h2>Una mirada a tu negocio</h2>
          <p className="muted">Indicadores ficticios · Escenario de ejemplo</p>
        </div>
        <Link className="button secondary" to="/admin/inventario">
          Ver inventario →
        </Link>
      </div>
      <div className="metrics">
        {[
          ['Ventas del mes', '$2.480.000', 'Tienda y canal externo'],
          ['Pedidos', '38', 'Escenario demostrativo'],
          ['Productos', '4', 'En el catálogo de muestra'],
          ['Stock bajo', '1', 'Umbral ilustrativo: 10'],
        ].map(([label, value, note]) => (
          <Card key={label}>
            <span className="muted">{label}</span>
            <strong>{value}</strong>
            <small>{note}</small>
          </Card>
        ))}
      </div>
      <div className="dashboard-panels">
        <Card>
          <h2>Ventas por canal</h2>
          <p className="muted">Distribución ficticia del mes</p>
          <div className="channel">
            <span>Tienda propia</span>
            <strong>62%</strong>
          </div>
          <div className="bar">
            <span style={{ width: '62%' }} />
          </div>
          <div className="channel">
            <span>Mercado Libre · Registro manual</span>
            <strong>38%</strong>
          </div>
          <div className="bar yellow">
            <span style={{ width: '38%' }} />
          </div>
        </Card>
        <Card>
          <Badge>PRÓXIMA ETAPA</Badge>
          <h2>Inventario único, múltiples canales</h2>
          <p>
            Las futuras ventas de tienda y registros externos afectarán una
            misma unidad base, con trazabilidad por operación.
          </p>
          <Link to="/admin/inventario">Explorar inventario →</Link>
        </Card>
      </div>
      <Card>
        <div className="section-heading">
          <h2>Pedidos recientes · Ejemplos</h2>
          <Badge>Sin persistencia</Badge>
        </div>
        <Table headings={['Referencia', 'Canal', 'Total', 'Estado']}>
          <tr>
            <td>DEMO-003</td>
            <td>Tienda propia</td>
            <td>{money(69990)}</td>
            <td>
              <Badge>Ejemplo: pendiente</Badge>
            </td>
          </tr>
          <tr>
            <td>DEMO-002</td>
            <td>Mercado Libre · Manual</td>
            <td>{money(24990)}</td>
            <td>
              <Badge>Ejemplo: completado</Badge>
            </td>
          </tr>
        </Table>
      </Card>
    </>
  )
}
export function InventoryPage() {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState('')
  const found = products.filter((p) =>
    `${p.name} ${p.sku}`.toLowerCase().includes(query.toLowerCase()),
  )
  return (
    <>
      <div className="section-heading">
        <div>
          <h2>Control de existencias</h2>
          <p className="muted">
            Cantidades estáticas en unidad base. No se registran movimientos.
          </p>
        </div>
        <Button onClick={() => setSelected('Ingreso de mercadería')}>
          Vista de ingreso
        </Button>
      </div>
      <Card>
        <label className="inventory-search">
          Buscar producto o SKU
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nombre o código"
          />
        </label>
        <Table
          headings={[
            'Producto',
            'SKU',
            'Unidad base',
            'Stock demo',
            'Estado',
            'Acciones',
          ]}
        >
          {found.map((p) => (
            <tr key={p.id}>
              <td>
                <strong>{p.name}</strong>
                <small>{p.category}</small>
              </td>
              <td>{p.sku}</td>
              <td>
                {p.id === 'guantes'
                  ? 'Par'
                  : p.id === 'herramientas'
                    ? 'Set'
                    : 'Unidad'}
              </td>
              <td>{p.stock}</td>
              <td>
                <Badge>{p.stock < 10 ? 'Stock bajo' : 'Disponible'}</Badge>
              </td>
              <td>
                <Button
                  className="secondary"
                  onClick={() => setSelected(p.name)}
                >
                  Ver detalle
                </Button>
              </td>
            </tr>
          ))}
        </Table>
        {!found.length && <p role="status">Sin resultados.</p>}
      </Card>
      {selected && (
        <Modal title={selected} onClose={() => setSelected('')}>
          <p>
            Vista conceptual. Ingresos, ajustes y movimientos se implementarán
            con permisos y transacciones en una etapa posterior.
          </p>
        </Modal>
      )}
    </>
  )
}
export function ModulePage() {
  const { module } = useParams()
  return (
    <Card>
      <Badge>PLANIFICADO</Badge>
      <h2>{module}</h2>
      <p>
        Este módulo está contemplado en el alcance aprobado. Su implementación
        funcional corresponde a etapas posteriores.
      </p>
      <Link to="/admin">Volver al dashboard</Link>
    </Card>
  )
}
