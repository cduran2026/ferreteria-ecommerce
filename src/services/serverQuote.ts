import { catalogClient } from '../lib/supabase'
import type { CartLine } from './demoCommerce'
export interface ServerQuote {
  lines: {
    product_id: string
    presentation_id: string
    quantity: number
    base_units: number
    units: number
    unit_price_clp: number
    total_clp: number
  }[]
  total_clp: number
  quoted_at: string
  checkout_enabled: false
}
/** Sólo lectura; la siguiente etapa deberá revalidar dentro de una transacción al crear un pedido. */
export async function requestServerQuote(
  lines: CartLine[],
): Promise<ServerQuote> {
  if (!catalogClient) throw new Error('Catálogo conectado no disponible.')
  const { data, error } = await catalogClient
    .rpc('storefront_quote', {
      lines: lines.map((l) => ({
        presentation_id: l.presentationId,
        quantity: l.quantity,
      })),
    })
    .abortSignal(AbortSignal.timeout(10000))
  if (error)
    throw new Error(
      'No pudimos validar la selección. Actualiza el catálogo y revisa precios y disponibilidad.',
    )
  return data as ServerQuote
}
