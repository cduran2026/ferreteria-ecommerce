import { Suspense } from 'react'
import { AuthProvider } from './features/auth/Provider'
import './styles/integration.css'
import { RouterProvider } from 'react-router-dom'
import { router } from './app/router'
export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<p role="status">Cargando…</p>}>
        <RouterProvider router={router} />
      </Suspense>
    </AuthProvider>
  )
}
