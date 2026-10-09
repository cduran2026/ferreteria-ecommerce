import { NavLink, Link } from 'react-router-dom'
const modules = [
  'Productos',
  'Categorías',
  'Ingreso de mercadería',
  'Ventas',
  'Pedidos',
  'Configuración',
]
export function Sidebar() {
  return (
    <aside className="sidebar">
      <Link className="brand" to="/">
        <span className="brand-mark">AS</span>
        <span>
          ALL STORE<small>ADMINISTRACIÓN</small>
        </span>
      </Link>
      <p className="eyebrow">ESPACIO DE TRABAJO</p>
      <nav aria-label="Administración">
        <NavLink to="/admin" end>
          ▦ Dashboard
        </NavLink>
        <NavLink to="/admin/inventario">▤ Inventario</NavLink>
        {modules.map((m) => (
          <NavLink key={m} to={`/admin/modulo/${encodeURIComponent(m)}`}>
            {m}
          </NavLink>
        ))}
      </nav>
      <Link className="back-store" to="/">
        ← Volver a la tienda
      </Link>
    </aside>
  )
}
export function Header({ title }: { title: string }) {
  return (
    <header className="admin-header">
      <div>
        <small>Administración / Vista demostrativa</small>
        <h1>{title}</h1>
      </div>
      <span className="user-chip">
        AD{' '}
        <span>
          Usuario demo<small>Sin autenticación</small>
        </span>
      </span>
    </header>
  )
}
