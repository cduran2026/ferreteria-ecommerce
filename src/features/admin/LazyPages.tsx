import { lazy } from 'react'
export const DashboardPage = lazy(() =>
  import('./Pages').then((m) => ({
    default: m.DashboardPage,
  })),
)
export const InventoryPage = lazy(() =>
  import('./Pages').then((m) => ({
    default: m.InventoryPage,
  })),
)
export const ModulePage = lazy(() =>
  import('./Pages').then((m) => ({ default: m.ModulePage })),
)
export const CatalogAdminPage = lazy(() =>
  import('./Pages').then((m) => ({
    default: m.CatalogAdminPage,
  })),
)
export const ProductAdminPage = lazy(() =>
  import('./Pages').then((m) => ({
    default: m.ProductAdminPage,
  })),
)
