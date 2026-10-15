import { catalogMode } from './config'
import { createClient } from '@supabase/supabase-js'
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
export const dataMode = catalogMode(import.meta.env.VITE_CATALOG_MODE, url, key)
export const supabase =
  dataMode === 'supabase' ? createClient(url!, key!) : null
export const catalogClient =
  dataMode === 'supabase'
    ? createClient(url!, key!, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      })
    : null
export function requireClient() {
  if (!supabase) throw new Error('Entorno Supabase local no configurado.')
  return supabase
}
