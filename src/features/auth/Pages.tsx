import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, requireClient } from '../../lib/supabase'
import { useAuth } from './useAuth'
import { Button, Card, Input } from '../../components/ui'
export function AuthPage({ recovery = false }: { recovery?: boolean }) {
  const [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false),
    [reset, setReset] = useState(false)
  const { session, refresh } = useAuth()
  const navigate = useNavigate()
  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      const client = requireClient()
      if (recovery) {
        if (!session) throw new Error()
        const { error } = await client.auth.updateUser({ password })
        if (error) throw error
        await client.auth.signOut()
        navigate('/login')
        return
      }
      if (reset) {
        const { error } = await client.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/restablecer`,
        })
        if (error) throw error
        setMessage(
          'Si el correo corresponde a una cuenta, recibirás instrucciones en el correo local.',
        )
        return
      }
      const { error } = await client.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      await refresh()
      navigate('/admin')
    } catch {
      setMessage(
        'No pudimos completar la solicitud. Revisa tus datos y el entorno local.',
      )
    } finally {
      setBusy(false)
    }
  }
  if (!supabase)
    return (
      <div className="auth-page">
        <Card>
          <h1>Administración no disponible</h1>
          <p>
            Esta vista utiliza datos demostrativos. El acceso administrativo
            requiere configurar el entorno Supabase local aislado.
          </p>
          <Link to="/">Volver a la tienda</Link>
        </Card>
      </div>
    )
  return (
    <div className="auth-page">
      <Card>
        <Link className="brand" to="/">
          ALL STORE · CHILE
        </Link>
        <h1>
          {recovery
            ? 'Restablecer contraseña'
            : reset
              ? 'Recuperar acceso'
              : 'Administración'}
        </h1>
        <p className="muted">
          Entorno local · Acceso sólo para personal autorizado.
        </p>
        <form onSubmit={submit}>
          {!recovery && (
            <label>
              Correo
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
              />
            </label>
          )}
          {!reset && (
            <label>
              {recovery ? 'Nueva contraseña' : 'Contraseña'}
              <Input
                type="password"
                required
                minLength={recovery ? 12 : 1}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={recovery ? 'new-password' : 'current-password'}
              />
            </label>
          )}
          <Button disabled={busy || (recovery && !session)}>
            {busy
              ? 'Procesando…'
              : recovery
                ? 'Guardar contraseña'
                : reset
                  ? 'Enviar instrucciones'
                  : 'Iniciar sesión'}
          </Button>
        </form>
        {message && <p role="status">{message}</p>}
        {!recovery && (
          <Button
            className="secondary"
            onClick={() => {
              setReset((x) => !x)
              setMessage('')
            }}
          >
            {reset ? 'Volver al login' : 'Olvidé mi contraseña'}
          </Button>
        )}
        {session && (
          <Button
            className="secondary"
            onClick={async () => {
              await requireClient().auth.signOut()
              await refresh()
            }}
          >
            Cerrar sesión actual
          </Button>
        )}
        <small>
          No hay registro público ni asignación automática de roles.
        </small>
      </Card>
    </div>
  )
}
