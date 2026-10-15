import { Outlet, useLocation } from 'react-router-dom'
import { Header, Sidebar } from '../../components/admin/Navigation'
export function AdminLayout() {
  const location = useLocation()
  const title = location.pathname.includes('inventario')
    ? 'Inventario'
    : location.pathname.includes('modulo')
      ? decodeURIComponent(location.pathname.split('/').pop() ?? '')
      : location.pathname.includes('productos')
        ? 'Productos'
        : location.pathname.includes('categorias')
          ? 'Categorías'
          : 'Dashboard'
  return (
    <div className="admin-shell">
      <a href="#admin-main" className="skip">
        Saltar al contenido
      </a>
      <Sidebar />
      <div className="admin-body">
        <Header title={title} />
        <main id="admin-main" className="admin-content">
          <div className="notice">
            Entorno local autenticado. Datos de desarrollo; sin operaciones
            comerciales habilitadas.
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
