import { describe, expect, it } from 'vitest'
import { products, baseQuantity } from '../src/services/catalog'
import {
  appliedPrice,
  quote,
  addToCart,
  updateCart,
  removeFromCart,
  cartQuotes,
  restoreCart,
  lineKey,
} from '../src/services/demoCommerce'
const drill = products.find((p) => p.id === 'taladro')!,
  screws = products.find((p) => p.id === 'tornillos')!
describe('Precios y equivalencias demostrativas', () => {
  it('selecciona los bordes exactos de cada escalón', () => {
    const unit = drill.presentations[0]
    expect(appliedPrice(unit, 2)).toBe(69990)
    expect(appliedPrice(unit, 3)).toBe(64990)
    expect(appliedPrice(unit, 5)).toBe(64990)
    expect(appliedPrice(unit, 6)).toBe(59990)
  })
  it('calcula precio por caja y conserva equivalencia propia', () => {
    const q = quote(screws, 'caja', 10)
    expect(q.price).toBe(5990)
    expect(q.units).toBe(1000)
    expect(q.total).toBe(59900)
    expect(quote(drill, 'caja', 2).units).toBe(8)
  })
  it('rechaza cantidad inválida, presentación desconocida y sobrestock demo', () => {
    for (const n of [0, -1, 1.2, NaN, Infinity])
      expect(() => quote(drill, 'unidad', n)).toThrow()
    expect(() => quote(drill, 'missing', 1)).toThrow()
    expect(() => quote(drill, 'caja', 7)).toThrow()
  })
  it('evita desbordamientos numéricos', () => {
    expect(() => baseQuantity(Number.MAX_SAFE_INTEGER, 2)).toThrow()
    const p = {
      ...drill,
      stock: Number.MAX_SAFE_INTEGER,
      presentations: [
        {
          id: 'x',
          label: 'Unidad',
          baseUnits: 1,
          price: Number.MAX_SAFE_INTEGER,
        },
      ],
    }
    expect(() => quote(p, 'x', 2)).toThrow()
  })
})
describe('Carrito de demostración', () => {
  it('combina presentación idéntica y recalcula el escalón sin mutar el origen', () => {
    const first = addToCart([], {
      productId: 'taladro',
      presentationId: 'unidad',
      quantity: 2,
    })
    const next = addToCart(first, {
      productId: 'taladro',
      presentationId: 'unidad',
      quantity: 4,
    })
    expect(next).toHaveLength(1)
    expect(next[0].quantity).toBe(6)
    expect(cartQuotes(next)[0].total).toBe(359940)
    expect(first[0].quantity).toBe(2)
  })
  it('mantiene unidad y caja como líneas distintas', () => {
    const lines = addToCart(
      addToCart([], {
        productId: 'tornillos',
        presentationId: 'unidad',
        quantity: 10,
      }),
      { productId: 'tornillos', presentationId: 'caja', quantity: 2 },
    )
    expect(lines).toHaveLength(2)
    expect(cartQuotes(lines).map((q) => q.units)).toEqual([10, 200])
  })
  it('valida el stock combinado entre presentaciones', () => {
    const lines = addToCart([], {
      productId: 'taladro',
      presentationId: 'unidad',
      quantity: 20,
    })
    expect(() =>
      addToCart(lines, {
        productId: 'taladro',
        presentationId: 'caja',
        quantity: 2,
      }),
    ).toThrow()
    expect(lines[0].quantity).toBe(20)
  })
  it('actualiza subtotal y elimina de forma inmutable', () => {
    const lines = addToCart([], {
      productId: 'taladro',
      presentationId: 'unidad',
      quantity: 1,
    })
    const updated = updateCart(lines, lineKey(lines[0]), 3)
    expect(cartQuotes(updated)[0].total).toBe(194970)
    expect(removeFromCart(updated, lineKey(updated[0]))).toEqual([])
    expect(lines).toHaveLength(1)
    expect(() => updateCart(lines, 'missing', 1)).toThrow()
  })
  it('rechaza persistencia corrupta, duplicados y productos no disponibles', () => {
    expect(restoreCart('not json')).toEqual([])
    expect(
      restoreCart(
        '[{"productId":"unknown","presentationId":"unit","quantity":1}]',
      ),
    ).toEqual([])
    const line = { productId: 'taladro', presentationId: 'unidad', quantity: 3 }
    expect(restoreCart(JSON.stringify([line, line]))).toEqual([])
    expect(restoreCart(JSON.stringify([line]))).toEqual([line])
    expect(restoreCart(null)).toEqual([])
  })
  it('ignora precios inyectados en la persistencia y aplica catálogo vigente', () => {
    const line = {
      productId: 'taladro',
      presentationId: 'unidad',
      quantity: 1,
      price: 1,
      total: 1,
    }
    const restored = restoreCart(JSON.stringify([line]))
    expect(cartQuotes(restored)[0].total).toBe(69990)
    expect(restored[0]).not.toHaveProperty('price')
  })
})
