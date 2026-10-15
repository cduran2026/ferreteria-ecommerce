import { requireClient } from '../lib/supabase'
import { validateImage } from './catalogUtils'
export type CatalogTable =
  | 'categories'
  | 'products'
  | 'presentations'
  | 'volume_prices'
  | 'product_images'
export type Row = Record<string, string | number | boolean | null>
export async function readRows(table: CatalogTable) {
  const { data, error } = await requireClient()
    .from(table)
    .select('*')
    .order('id')
  if (error) throw error
  return data as Row[]
}
export async function saveRow(table: CatalogTable, row: Row) {
  const c = requireClient()
  const result = row.id
    ? await c.from(table).update(row).eq('id', row.id).select().single()
    : await c.from(table).insert(row).select().single()
  if (result.error) throw result.error
  return result.data as Row
}
export async function inventoryRows() {
  const { data, error } = await requireClient()
    .from('inventory_balances')
    .select(
      'product_id,physical,reserved,available,products(name,sku,base_unit)',
    )
  if (error) throw error
  return data
}
export async function uploadImage(product: string, file: File, alt: string) {
  validateImage(file)
  if (!alt.trim()) throw new Error('Texto alternativo obligatorio')
  const c = requireClient()
  const ext =
    file.type === 'image/png'
      ? 'png'
      : file.type === 'image/webp'
        ? 'webp'
        : 'jpg'
  const path = `${product}/${crypto.randomUUID()}.${ext}`
  const upload = await c.storage
    .from('ferreteria-product-images')
    .upload(path, file, { contentType: file.type, upsert: false })
  if (upload.error) throw upload.error
  const record = await c.from('product_images').insert({
    product_id: product,
    storage_path: path,
    alt_text: alt,
    approved: false,
    is_primary: false,
    display_order: 0,
  })
  if (record.error) {
    await c.storage.from('ferreteria-product-images').remove([path])
    throw record.error
  }
}
