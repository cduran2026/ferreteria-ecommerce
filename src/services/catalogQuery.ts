import type { Product } from '../types/catalog'
import { categoryContains } from './catalogTaxonomy'
import { availability, tiersFor } from './demoCommerce'
export type CatalogSort =
  'featured' | 'newest' | 'price-up' | 'price-down' | 'name'
export interface CatalogFilters {
  query?: string
  category?: string
  brand?: string
  min?: number
  max?: number
  availability?: string
  wholesale?: boolean
  sort?: string
}
const normalized = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es-CL')
    .trim()
export function queryCatalog(products: Product[], filters: CatalogFilters) {
  const q = normalized(filters.query ?? '')
  const found = products.filter((p) => {
    const price = p.presentations[0]?.price ?? null
    return (
      normalized([p.name, p.sku, p.brand ?? '', p.category].join(' ')).includes(
        q,
      ) &&
      (!filters.category ||
        categoryContains(filters.category, p.categoryId) ||
        p.category === filters.category) &&
      (!filters.brand || p.brand === filters.brand) &&
      (filters.min === undefined || (price !== null && price >= filters.min)) &&
      (filters.max === undefined || (price !== null && price <= filters.max)) &&
      (!filters.availability || availability(p) === filters.availability) &&
      (!filters.wholesale ||
        p.presentations.some((x) => tiersFor(x).length > 1))
    )
  })
  return found.sort((a, b) => {
    const ap = a.presentations[0]?.price ?? null,
      bp = b.presentations[0]?.price ?? null
    if (filters.sort === 'price-up' || filters.sort === 'price-down') {
      if (ap === null || bp === null)
        return ap === bp ? 0 : ap === null ? 1 : -1
      return filters.sort === 'price-up' ? ap - bp : bp - ap
    }
    if (filters.sort === 'newest')
      return (b.introducedAt ?? '').localeCompare(a.introducedAt ?? '')
    if (filters.sort === 'name') return a.name.localeCompare(b.name, 'es')
    return Number(Boolean(b.featured)) - Number(Boolean(a.featured))
  })
}
export function readCatalogFilters(params: URLSearchParams): CatalogFilters {
  const number = (key: string) => {
    const raw = params.get(key)
    if (!raw?.trim()) return undefined
    const n = Number(raw)
    return Number.isFinite(n) && n >= 0 ? n : undefined
  }
  return {
    query: params.get('q') ?? '',
    category: params.get('categoria') ?? '',
    brand: params.get('marca') ?? '',
    min: number('min'),
    max: number('max'),
    availability: params.get('disponibilidad') ?? '',
    wholesale: params.get('mayorista') === '1',
    sort: params.get('orden') ?? 'featured',
  }
}
