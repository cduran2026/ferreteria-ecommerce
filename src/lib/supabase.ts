import { createClient } from '@supabase/supabase-js'
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
// Las pantallas demostrativas no utilizan el cliente.
export const supabase = url && key ? createClient(url, key) : null
