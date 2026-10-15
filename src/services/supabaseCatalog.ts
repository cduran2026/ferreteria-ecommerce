import { catalogClient } from '../lib/supabase'
import type { Category, Product } from '../types/catalog'
import type { DatabasePriceTier } from './catalogUtils'
export interface CatalogRow {
  id: string
  sku: string
  name: string
  description: string | null
  category_id: string
  brand: string | null
  base_unit: string
  created_at: string
  presentations: {
    id: string
    label: string
    base_units: number
    active: boolean
    volume_prices: DatabasePriceTier[]
  }[]
  product_images: {
    id: string
    storage_path: string
    alt_text: string
    display_order: number
    is_primary: boolean
    approved: boolean
  }[]
}
export function mapProduct(
  p: CatalogRow,
  categories: Category[],
  stock: number | null,
  now = new Date(),
): Product {
  const presentations = p.presentations
    .filter(
      (x) => x.active && Number.isSafeInteger(x.base_units) && x.base_units > 0,
    )
    .sort((a, b) => a.base_units - b.base_units)
    .map((x) => {
      const tiers = x.volume_prices
        .filter(
          (t) =>
            t.active &&
            new Date(t.valid_from) <= now &&
            (!t.valid_until || new Date(t.valid_until) > now) &&
            Number.isSafeInteger(t.min_quantity) &&
            t.min_quantity > 0 &&
            Number.isSafeInteger(t.price_clp) &&
            t.price_clp >= 0,
        )
        .map((t) => ({
          minQuantity: t.min_quantity,
          price: t.price_clp,
          validFrom: t.valid_from,
          validUntil: t.valid_until,
        }))
        .sort((a, b) => a.minQuantity - b.minQuantity)
      return {
        id: x.id,
        label: x.label,
        baseUnits: x.base_units,
        price: tiers.find((t) => t.minQuantity === 1)?.price ?? null,
        tiers,
      }
    })
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    description: p.description ?? '',
    category: categories.find((c) => c.id === p.category_id)?.name ?? '',
    categoryId: p.category_id,
    brand: p.brand?.trim() || undefined,
    baseUnit: p.base_unit,
    introducedAt: p.created_at,
    dataKind: 'supabase',
    image: '',
    stock:
      stock !== null && Number.isSafeInteger(stock) && stock >= 0
        ? stock
        : null,
    presentations,
  }
}
export async function fetchCatalog() {
  if (!catalogClient) throw new Error('Configuración local no válida.')
  const signal = AbortSignal.timeout(10000)
  const [catalog, categories, availability] = await Promise.all([
    catalogClient
      .from('products')
      .select(
        'id,sku,name,description,category_id,brand,base_unit,created_at,presentations(id,label,base_units,active,volume_prices(min_quantity,price_clp,valid_from,valid_until,active)),product_images(id,storage_path,alt_text,display_order,is_primary,approved)',
      )
      .eq('active', true)
      .order('name')
      .abortSignal(signal),
    catalogClient
      .from('categories')
      .select('id,name,slug,parent_id')
      .eq('active', true)
      .order('display_order')
      .abortSignal(signal),
    catalogClient.rpc('storefront_availability').abortSignal(signal),
  ])
  for (const result of [catalog, categories, availability])
    if (result.error) throw result.error
  // Evitar truncamiento silencioso del límite PostgREST: ampliar con paginación antes de superar este piloto.
  if (
    (catalog.data ?? []).length >= 1000 ||
    (categories.data ?? []).length >= 1000 ||
    availability.data.length >= 1000
  )
    throw new Error('Catálogo excede el tamaño admitido por este piloto.')
  const tree = categories.data as Category[]
  const balances = new Map<string, number>(
    (availability.data as { product_id: string; available: number }[]).map(
      (x) => [x.product_id, Number(x.available)],
    ),
  )
  const now = new Date()
  const products = await Promise.all(
    (catalog.data as unknown as CatalogRow[])
      .filter((p) => tree.some((c) => c.id === p.category_id))
      .map(async (p) => {
        const product = mapProduct(p, tree, balances.get(p.id) ?? null, now)
        const images = await Promise.all(
          p.product_images
            .filter((i) => i.approved)
            .sort(
              (a, b) =>
                Number(b.is_primary) - Number(a.is_primary) ||
                a.display_order - b.display_order,
            )
            .map(async (i) => {
              const { data, error } = await catalogClient!.storage
                .from('ferreteria-product-images')
                .createSignedUrl(i.storage_path, 300)
              return {
                id: i.id,
                url: error ? '' : data.signedUrl,
                alt: i.alt_text,
              }
            }),
        )
        product.images = images.filter((i) => i.url)
        product.image = product.images[0]?.url ?? ''
        return product
      }),
  )
  return { products, categories: tree }
}
