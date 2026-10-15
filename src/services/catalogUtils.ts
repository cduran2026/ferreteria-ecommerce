import type { Product } from '../types/catalog'
export interface DatabasePriceTier {
  min_quantity: number
  price_clp: number
  valid_from: string
  valid_until: string | null
  active: boolean
}
export const money = (value: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value)
export function priceFor(
  tiers: DatabasePriceTier[],
  quantity: number,
  now = new Date(),
) {
  return (
    tiers
      .filter(
        (t) =>
          t.active &&
          t.min_quantity <= quantity &&
          new Date(t.valid_from) <= now &&
          (!t.valid_until || new Date(t.valid_until) > now),
      )
      .sort((a, b) => b.min_quantity - a.min_quantity)[0]?.price_clp ?? null
  )
}
export function filterCatalog(
  products: Product[],
  q: string,
  category: string,
  max = Infinity,
  sort = 'name',
) {
  const list = products.filter(
    (p) =>
      p.name
        .toLocaleLowerCase('es-CL')
        .includes(q.toLocaleLowerCase('es-CL')) &&
      (!category || p.categoryId === category) &&
      (p.presentations[0]?.price ?? Infinity) <= max,
  )
  return list.sort((a, b) =>
    sort === 'price-up'
      ? (a.presentations[0]?.price ?? Infinity) -
        (b.presentations[0]?.price ?? Infinity)
      : sort === 'price-down'
        ? (b.presentations[0]?.price ?? -1) - (a.presentations[0]?.price ?? -1)
        : a.name.localeCompare(b.name, 'es'),
  )
}
export function validateImage(file: File) {
  if (
    !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) ||
    file.size > 5 * 1024 * 1024 ||
    file.size === 0
  )
    throw new Error('Utiliza una imagen PNG, JPEG o WebP de hasta 5 MB.')
}
