import { CartPage } from '../../features/cart/CartPage'
import { RouteError } from '../../components/ui/RouteError'
import { createBrowserRouter, Link } from 'react-router-dom'
import { StoreLayout } from '../layouts/StoreLayout'
import { AdminLayout } from '../layouts/AdminLayout'
import {
  HomePage,
  CatalogPage,
  ProductPage,
} from '../../features/catalog/Pages'
import {
  DashboardPage,
  InventoryPage,
  ModulePage,
} from '../../features/admin/Pages'
import { EmptyState } from '../../components/ui'
export const router = createBrowserRouter([
  {
    element: <StoreLayout />,
    errorElement: <RouteError />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/catalogo', element: <CatalogPage /> },
      { path: '/producto/:id', element: <ProductPage /> },
      {
        path: '/carrito',
        element: <CartPage />,
      },
      {
        path: '*',
        element: (
          <div className="container section">
            <EmptyState>
              Página no encontrada. <Link to="/">Volver al inicio</Link>
            </EmptyState>
          </div>
        ),
      },
    ],
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'inventario', element: <InventoryPage /> },
      { path: 'modulo/:module', element: <ModulePage /> },
    ],
  },
])
