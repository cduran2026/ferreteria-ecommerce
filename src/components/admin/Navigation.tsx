import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '../../features/auth/useAuth'
import { requireClient } from '../../lib/supabase'
import { Button } from '../ui'
const modules = ['Ingreso de mercadería', 'Ventas', 'Pedidos', 'Configuración']
export function Sidebar() {
  const { role } = useAuth()
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
        {role === 'admin' && (
          <>
            <NavLink to="/admin/productos">Productos</NavLink>
            <NavLink to="/admin/categorias">Categorías</NavLink>
          </>
        )}
        <NavLink to="/admin/inventario">Inventario · Consulta</NavLink>
        {modules.map((m) => (
          <NavLink key={m} to={`/admin/modulo/${encodeURIComponent(m)}`}>
            {m} · Pendiente
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
  const { role, refresh } = useAuth()
  return (
    <header className="admin-header">
      <div>
        <small>Administración · Entorno local</small>
        <h1>{title}</h1>
      </div>
      <div className="header-actions">
        <span>{role === 'admin' ? 'Administrador' : 'Operador'}</span>
        <Button
          className="secondary"
          onClick={() => {
            void refresh()
          }}
        >
          Actualizar permisos
        </Button>
        <Button
          className="secondary"
          onClick={async () => {
            await requireClient().auth.signOut()
            await refresh()
          }}
        >
          Cerrar sesión
        </Button>
      </div>
    </header>
  )
}
