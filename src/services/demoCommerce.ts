import type { Product, Presentation, PriceTier } from '../types/catalog'
import { baseQuantity, storeProducts } from './catalog'
export function tiersFor(presentation: Presentation): PriceTier[] {
  if (presentation.price === null && !presentation.tiers?.length) return []
  const tiers = presentation.tiers ?? [
    { minQuantity: 1, price: presentation.price! },
  ]
  const now = new Date()
  return [...tiers]
    .filter(
      (t) =>
        (!t.validFrom || new Date(t.validFrom) <= now) &&
        (!t.validUntil || new Date(t.validUntil) > now),
    )
    .sort((a, b) => a.minQuantity - b.minQuantity)
}
export function appliedPrice(presentation: Presentation, quantity: number) {
  if (!Number.isSafeInteger(quantity) || quantity < 1)
    throw new Error('Ingresa una cantidad entera positiva.')
  const tier = tiersFor(presentation)
    .filter((t) => t.minQuantity <= quantity)
    .at(-1)
  if (!tier || !Number.isSafeInteger(tier.price) || tier.price < 0)
    throw new Error('No hay un precio válido para esta cantidad.')
  return tier.price
}
export function quote(
  product: Product,
  presentationId: string,
  quantity: number,
) {
  const presentation = product.presentations.find(
    (p) => p.id === presentationId,
  )
  if (!presentation) throw new Error('Presentación no disponible.')
  if (product.stock === null)
    throw new Error('Disponibilidad pendiente de confirmar.')
  const units = baseQuantity(quantity, presentation.baseUnits),
    price = appliedPrice(presentation, quantity),
    total = price * quantity
  if (!Number.isSafeInteger(total))
    throw new Error('Total fuera del rango permitido.')
  if (units > product.stock)
    throw new Error('La cantidad supera el stock disponible.')
  return { presentation, quantity, units, price, total }
}
export interface CartLine {
  productId: string
  presentationId: string
  quantity: number
}
export function lineKey(line: Pick<CartLine, 'productId' | 'presentationId'>) {
  return `${line.productId}:${line.presentationId}`
}
export function verifyCart(
  lines: CartLine[],
  catalog: Product[] = storeProducts,
) {
  const totals = new Map<string, number>()
  for (const line of lines) {
    const p = catalog.find((p) => p.id === line.productId)
    if (!p) throw new Error('Producto no disponible.')
    const q = quote(p, line.presentationId, line.quantity)
    totals.set(p.id, (totals.get(p.id) ?? 0) + q.units)
    if (p.stock !== null && totals.get(p.id)! > p.stock)
      throw new Error(
        'Superas el stock disponible entre las presentaciones de este producto.',
      )
  }
  return lines
}
export function addToCart(
  lines: CartLine[],
  newLine: CartLine,
  catalog: Product[] = storeProducts,
) {
  const existing = lines.find((l) => lineKey(l) === lineKey(newLine))
  if (!Number.isSafeInteger(newLine.quantity) || newLine.quantity < 1)
    throw new Error('Cantidad inválida.')
  const next = existing
    ? lines.map((l) =>
        lineKey(l) === lineKey(newLine)
          ? { ...l, quantity: l.quantity + newLine.quantity }
          : l,
      )
    : [...lines, { ...newLine }]
  return verifyCart(next, catalog)
}
export function updateCart(
  lines: CartLine[],
  key: string,
  quantity: number,
  catalog: Product[] = storeProducts,
) {
  if (!lines.some((l) => lineKey(l) === key))
    throw new Error('Línea no disponible.')
  return verifyCart(
    lines.map((l) => (lineKey(l) === key ? { ...l, quantity } : l)),
    catalog,
  )
}
export function removeFromCart(lines: CartLine[], key: string) {
  return lines.filter((l) => lineKey(l) !== key)
}
export function cartQuotes(
  lines: CartLine[],
  catalog: Product[] = storeProducts,
) {
  return lines.map((line) => {
    const product = catalog.find((p) => p.id === line.productId)
    if (!product) throw new Error('Producto no disponible.')
    return {
      line,
      product,
      ...quote(product, line.presentationId, line.quantity),
    }
  })
}
export function restoreCart(
  raw: string | null,
  catalog: Product[] = storeProducts,
): CartLine[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length > 100) return []
    const lines: CartLine[] = []
    for (const item of parsed) {
      if (
        typeof item !== 'object' ||
        item === null ||
        !('productId' in item) ||
        !('presentationId' in item) ||
        !('quantity' in item) ||
        typeof item.productId !== 'string' ||
        typeof item.presentationId !== 'string' ||
        typeof item.quantity !== 'number'
      )
        return []
      if (lines.some((l) => lineKey(l) === lineKey(item as CartLine))) return []
      lines.push({
        productId: item.productId,
        presentationId: item.presentationId,
        quantity: item.quantity,
      })
    }
    return verifyCart(lines, catalog)
  } catch {
    return []
  }
}

export function availability(
  product: Product,
  presentation = product.presentations[0],
) {
  if (product.stock === null) return 'unknown'
  return presentation && product.stock >= presentation.baseUnits
    ? 'available'
    : 'unavailable'
}
export function cardPricing(product: Product) {
  const presentation = product.presentations[0]
  const price = presentation?.price ?? null
  const state = availability(product, presentation)
  const volume = presentation
    ? tiersFor(presentation)
        .filter(
          (t) =>
            t.minQuantity > 1 &&
            price !== null &&
            t.price < price &&
            product.stock !== null &&
            t.minQuantity * presentation.baseUnits <= product.stock,
        )
        .at(-1)
    : undefined
  let purchasable = false
  if (presentation) {
    try {
      quote(product, presentation.id, 1)
      purchasable = true
    } catch {
      /* Datos incompletos o disponibilidad insuficiente. */
    }
  }
  return { price, availability: state, volume, purchasable }
}

export function restoredCartState(
  raw: string | null,
  catalog: Product[] = storeProducts,
) {
  const lines = restoreCart(raw, catalog)
  let hadItems: boolean
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : []
    hadItems = !Array.isArray(parsed) || parsed.length > 0
  } catch {
    hadItems = true
  }
  return {
    lines,
    message:
      hadItems && !lines.length
        ? 'El carrito guardado no pudo recuperarse: contiene datos inválidos o productos sin precio o disponibilidad. Vuelve a seleccionar los productos.'
        : '',
  }
}
