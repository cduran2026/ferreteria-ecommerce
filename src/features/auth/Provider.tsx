import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { AuthContext } from './context'
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null),
    [role, setRole] = useState<'admin' | 'operator' | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('')
  const version = useRef(0)
  const identity = useRef<string | null>(null)
  const refresh = useCallback(async () => {
    const request = ++version.current
    if (!supabase) {
      setLoading(false)
      setError('Entorno local no configurado.')
      return
    }
    try {
      const { data, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError
      if (request !== version.current) return
      if (identity.current !== (data.session?.user.id ?? null)) {
        identity.current = data.session?.user.id ?? null
        setRole(null)
      }
      setSession(data.session)
      if (!data.session) {
        setRole(null)
        setError('')
        setLoading(false)
        return
      }
      const verified = await supabase.auth.getUser()
      const result = verified.error
        ? null
        : await supabase
            .from('staff_roles')
            .select('role')
            .eq('user_id', verified.data.user!.id)
            .eq('active', true)
            .maybeSingle()
      if (request !== version.current) return
      if (verified.error || result?.error) {
        setRole(null)
        setError('La sesión no pudo validarse. Inicia sesión nuevamente.')
      } else {
        setRole(result?.data?.role ?? null)
        setError('')
      }
      setLoading(false)
    } catch {
      if (request === version.current) {
        setSession(null)
        setRole(null)
        setError('No pudimos verificar la sesión.')
        setLoading(false)
      }
    }
  }, [])
  useEffect(() => {
    const requests = version
    let live = true
    queueMicrotask(() => {
      if (live) void refresh()
    })
    const subscription = supabase?.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') window.location.replace('/restablecer')
      queueMicrotask(() => {
        if (live) void refresh()
      })
    })
    const focus = () => {
      queueMicrotask(() => {
        if (live) void refresh()
      })
    }
    window.addEventListener('focus', focus)
    const timer = setInterval(focus, 30000)
    return () => {
      live = false
      requests.current++

      subscription?.data.subscription.unsubscribe()
      window.removeEventListener('focus', focus)
      clearInterval(timer)
    }
  }, [refresh])
  return (
    <AuthContext.Provider value={{ session, role, loading, error, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}
