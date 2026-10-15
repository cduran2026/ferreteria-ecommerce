import { AuthPage } from '../../features/auth/Pages'
import { ProtectedRoute } from '../../features/auth/ProtectedRoute'
import {
  CatalogAdminPage,
  ProductAdminPage,
} from '../../features/admin/LazyPages'
import { NavigationLayout } from '../layouts/NavigationLayout'
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
} from '../../features/admin/LazyPages'
import { EmptyState } from '../../components/ui'
export const router = createBrowserRouter([
  {
    element: <NavigationLayout />,
    children: [
      { path: '/login', element: <AuthPage /> },
      { path: '/restablecer', element: <AuthPage recovery /> },
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
        element: <ProtectedRoute />,
        children: [
          {
            path: '/admin',
            element: <AdminLayout />,
            errorElement: <RouteError />,
            children: [
              { index: true, element: <DashboardPage /> },
              { path: 'inventario', element: <InventoryPage /> },
              {
                path: 'productos',
                element: <CatalogAdminPage table="products" />,
              },
              {
                path: 'categorias',
                element: <CatalogAdminPage table="categories" />,
              },
              { path: 'productos/:id', element: <ProductAdminPage /> },
              { path: 'modulo/:module', element: <ModulePage /> },
            ],
          },
        ],
      },
    ],
  },
])
