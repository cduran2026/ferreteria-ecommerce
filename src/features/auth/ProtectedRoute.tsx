import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './useAuth'
import { LoadingState, Card } from '../../components/ui'
export function ProtectedRoute() {
  const { session, role, loading, error } = useAuth()
  if (loading) return <LoadingState />
  if (!session) return <Navigate to="/login" replace />
  if (error || !role)
    return (
      <div className="container section">
        <Card>
          <h1>Acceso restringido</h1>
          <p>
            {error || 'Tu cuenta no tiene un rol administrativo autorizado.'}
          </p>
          <a href="/login">Ir al inicio de sesión</a>
        </Card>
      </div>
    )
  return <Outlet />
}
