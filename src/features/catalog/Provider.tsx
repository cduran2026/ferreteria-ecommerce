import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { dataMode } from '../../lib/supabase'
import { fetchCatalog } from '../../services/supabaseCatalog'
import { storeProducts } from '../../services/catalog'
import { categoryTree, brands } from '../../services/catalogTaxonomy'
import { CatalogContext } from './context'
export function CatalogProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchCatalog>>>({
    products: dataMode === 'demo' ? storeProducts : [],
    categories: dataMode === 'demo' ? categoryTree : [],
  })
  const [loading, setLoading] = useState(dataMode === 'supabase'),
    [error, setError] = useState(
      dataMode === 'invalid'
        ? 'La configuración del catálogo no es válida. No se cargaron datos demostrativos.'
        : '',
    ),
    [revision, setRevision] = useState(0)
  useEffect(() => {
    if (dataMode !== 'supabase') return
    let live = true
    let version = 0
    const load = async () => {
      const request = ++version
      try {
        const next = await fetchCatalog()
        if (live && request === version) {
          setData(next)
          setError('')
        }
      } catch {
        if (live && request === version) {
          setData({ products: [], categories: [] })
          setError(
            'No pudimos consultar el catálogo conectado. Reintenta; no se reemplazaron datos por ejemplos.',
          )
        }
      } finally {
        if (live && request === version) setLoading(false)
      }
    }
    void load()
    const timer = setInterval(() => void load(), 60000)
    const focus = () => void load()
    window.addEventListener('focus', focus)
    return () => {
      live = false
      clearInterval(timer)
      window.removeEventListener('focus', focus)
    }
  }, [revision])
  const knownBrands =
    dataMode === 'demo'
      ? brands
      : [
          ...new Set(data.products.flatMap((p) => (p.brand ? [p.brand] : []))),
        ].sort((a, b) => a.localeCompare(b, 'es'))
  return (
    <CatalogContext.Provider
      value={{
        products: data.products,
        categoryTree: data.categories,
        rootCategories: data.categories.filter((c) => !c.parent_id),
        brands: knownBrands,
        mode: dataMode,
        loading,
        error,
        reload: () => {
          setLoading(true)
          setRevision((v) => v + 1)
        },
      }}
    >
      {children}
    </CatalogContext.Provider>
  )
}
export function CatalogGate({ children }: { children: ReactNode }) {
  return <CatalogStatus>{children}</CatalogStatus>
}
import { useCatalog } from './context'
function CatalogStatus({ children }: { children: ReactNode }) {
  const { loading, error, reload } = useCatalog()
  if (loading)
    return (
      <div className="sf-container sf-page" role="status">
        Cargando catálogo…
      </div>
    )
  if (error)
    return (
      <div className="sf-container sf-page">
        <h1>Catálogo no disponible</h1>
        <p role="alert">{error}</p>
        <button className="button" onClick={reload}>
          Reintentar
        </button>
      </div>
    )
  return children
}
