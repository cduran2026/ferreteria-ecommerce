export function isLocalProjectUrl(value: string) {
  try {
    const u = new URL(value)
    return (
      u.protocol === 'http:' &&
      ['127.0.0.1', 'localhost'].includes(u.hostname) &&
      u.port === '61321' &&
      u.pathname === '/' &&
      !u.username &&
      !u.password &&
      !u.search &&
      !u.hash
    )
  } catch {
    return false
  }
}
export function isPublicKey(key: string) {
  if (key.startsWith('sb_publishable_')) return true
  try {
    return (
      JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
        .role === 'anon'
    )
  } catch {
    return false
  }
}
export function catalogMode(mode?: string, url?: string, key?: string) {
  if ((!mode || mode === 'demo') && !url && !key) return 'demo'
  if (
    mode === 'supabase' &&
    url &&
    key &&
    isLocalProjectUrl(url) &&
    isPublicKey(key)
  )
    return 'supabase'
  return 'invalid'
}
