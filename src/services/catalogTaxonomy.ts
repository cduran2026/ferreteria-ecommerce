import type { Category } from '../types/catalog'
export const brands = ['Toro Negro', 'YTS', 'Stanford', 'Rex'] as const
export const categoryTree: Category[] = [
  {
    id: 'herramientas',
    name: 'Herramientas',
    slug: 'herramientas',
    parent_id: null,
  },
  {
    id: 'discos',
    name: 'Discos de corte',
    slug: 'discos-de-corte',
    parent_id: 'herramientas',
  },
  {
    id: 'perforacion',
    name: 'Perforación',
    slug: 'perforacion',
    parent_id: 'herramientas',
  },
  {
    id: 'elevacion',
    name: 'Elevación',
    slug: 'elevacion',
    parent_id: 'herramientas',
  },
  { id: 'ferreteria', name: 'Ferretería', slug: 'ferreteria', parent_id: null },
  { id: 'ruedas', name: 'Ruedas', slug: 'ruedas', parent_id: 'ferreteria' },
  {
    id: 'cerraduras',
    name: 'Cerraduras',
    slug: 'cerraduras',
    parent_id: 'ferreteria',
  },
  {
    id: 'fijaciones',
    name: 'Fijaciones',
    slug: 'fijaciones',
    parent_id: 'ferreteria',
  },
  { id: 'gasfiteria', name: 'Gasfitería', slug: 'gasfiteria', parent_id: null },
  {
    id: 'griferia',
    name: 'Grifería y accesorios',
    slug: 'griferia',
    parent_id: 'gasfiteria',
  },
  { id: 'jardin', name: 'Jardín', slug: 'jardin', parent_id: null },
  {
    id: 'pulverizacion',
    name: 'Pulverización',
    slug: 'pulverizacion',
    parent_id: 'jardin',
  },
  {
    id: 'construccion',
    name: 'Construcción',
    slug: 'construccion',
    parent_id: null,
  },
  {
    id: 'selladores',
    name: 'Selladores y adhesivos',
    slug: 'selladores',
    parent_id: 'construccion',
  },
  {
    id: 'seguridad',
    name: 'Seguridad',
    slug: 'seguridad',
    parent_id: 'ferreteria',
  },
]
export const rootCategories = categoryTree.filter((c) => !c.parent_id)
export function categoryContains(selected: string, target?: string) {
  let current = categoryTree.find((c) => c.id === target)
  const seen = new Set<string>()
  while (current && !seen.has(current.id)) {
    if (current.id === selected) return true
    seen.add(current.id)
    current = categoryTree.find((c) => c.id === current!.parent_id)
  }
  return false
}
export function catalogHref(filters: {
  category?: string
  brand?: string
  wholesale?: boolean
}) {
  const params = new URLSearchParams()
  if (filters.category) params.set('categoria', filters.category)
  if (filters.brand) params.set('marca', filters.brand)
  if (filters.wholesale) params.set('mayorista', '1')
  return '/catalogo' + (params.size ? '?' + params.toString() : '')
}
