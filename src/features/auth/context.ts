import { createContext } from 'react'
import type { Session } from '@supabase/supabase-js'
export interface AuthState {
  session: Session | null
  role: 'admin' | 'operator' | null
  loading: boolean
  error: string
  refresh: () => Promise<void>
}
export const AuthContext = createContext<AuthState>({
  session: null,
  role: null,
  loading: true,
  error: '',
  refresh: async () => {},
})
