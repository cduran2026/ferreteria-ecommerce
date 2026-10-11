import { describe, it, expect } from 'vitest'
import { products, storeProducts } from '../src/services/catalog'
import { referenceProducts } from '../src/services/referenceCatalog'
import { queryCatalog, readCatalogFilters } from '../src/services/catalogQuery'
import {
  categoryContains,
  catalogHref,
  categoryTree,
} from '../src/services/catalogTaxonomy'
import {
  availability,
  cardPricing,
  quote,
  addToCart,
  restoreCart,
  restoredCartState,
} from '../src/services/demoCommerce'
describe('Catálogo comercial y navegación', () => {
  it('conserva ejemplos originales y no inventa datos de referencias', () => {
    expect(products).toHaveLength(4)
    expect(storeProducts).toHaveLength(9)
    expect(
      referenceProducts.every(
        (p) =>
          p.stock === null &&
          p.presentations.every((x) => x.price === null) &&
          !p.image,
      ),
    ).toBe(true)
    expect(
      storeProducts.filter((p) => p.dataKind === 'demo').every((p) => !p.brand),
    ).toBe(true)
  })
  it('filtra un padre incluyendo sus descendientes', () => {
    expect(categoryContains('herramientas', 'discos')).toBe(true)
    expect(
      queryCatalog(storeProducts, { category: 'herramientas' }).map(
        (p) => p.id,
      ),
    ).toEqual(
      expect.arrayContaining([
        'discos-yts-50',
        'tecle-toro-negro',
        'taladro',
        'herramientas',
      ]),
    )
    expect(
      queryCatalog(storeProducts, { category: 'discos' }).map((p) => p.id),
    ).toEqual(['discos-yts-50'])
    expect(categoryContains('discos', 'herramientas')).toBe(false)
    expect(categoryContains('unknown', 'missing')).toBe(false)
    expect(new Set(categoryTree.map((c) => c.id)).size).toBe(
      categoryTree.length,
    )
  })
  it('combina búsqueda, jerarquía, marca y disponibilidad', () => {
    expect(
      queryCatalog(storeProducts, {
        query: 'tecle',
        category: 'herramientas',
        brand: 'Toro Negro',
        availability: 'unknown',
      }).map((p) => p.id),
    ).toEqual(['tecle-toro-negro'])
    expect(
      queryCatalog(storeProducts, { query: 'tecle', brand: 'YTS' }),
    ).toEqual([])
    expect(
      queryCatalog(storeProducts, { query: 'GRIFERIA' }).map((p) => p.id),
    ).toEqual(['griferia-yts'])
  })
  it('combina rango y stock sin transformar precio desconocido en cero', () => {
    expect(
      queryCatalog(storeProducts, {
        min: 3000,
        max: 10000,
        availability: 'available',
      }).map((p) => p.id),
    ).toEqual(['guantes'])
    expect(
      queryCatalog(storeProducts, { min: 0 }).every(
        (p) => p.dataKind === 'demo',
      ),
    ).toBe(true)
    expect(queryCatalog(storeProducts, { min: 10000, max: 3000 })).toEqual([])
    expect(
      queryCatalog(storeProducts, { availability: 'unknown' }),
    ).toHaveLength(5)
  })
  it('ordena precio con desconocidos al final en ambas direcciones', () => {
    const asc = queryCatalog(storeProducts, { sort: 'price-up' }),
      desc = queryCatalog(storeProducts, { sort: 'price-down' })
    expect(asc.slice(0, 4).map((p) => p.id)).toEqual([
      'tornillos',
      'guantes',
      'herramientas',
      'taladro',
    ])
    expect(desc.slice(0, 4).map((p) => p.id)).toEqual([
      'taladro',
      'herramientas',
      'guantes',
      'tornillos',
    ])
    expect(asc.slice(4).every((p) => p.presentations[0].price === null)).toBe(
      true,
    )
  })
  it('ordena destacados y fecha de incorporación sin mutar origen', () => {
    const source = storeProducts.map((p) => p.id)
    expect(queryCatalog(storeProducts, { sort: 'featured' })[0].featured).toBe(
      true,
    )
    expect(
      queryCatalog([...storeProducts].reverse(), { sort: 'newest' })[0]
        .introducedAt,
    ).toBe('2026-10-10')
    expect(storeProducts.map((p) => p.id)).toEqual(source)
  })
  it('permite marcas vacías sin asignaciones falsas', () => {
    expect(queryCatalog(storeProducts, { brand: 'Stanford' })).toEqual([])
    expect(queryCatalog(storeProducts, { brand: 'Rex' })).toEqual([])
    expect(queryCatalog(storeProducts, { brand: 'YTS' })).toHaveLength(2)
  })
  it('genera y restaura enlaces con marca y categoría sin perder espacios', () => {
    const url = catalogHref({
      category: 'elevacion',
      brand: 'Toro Negro',
      wholesale: true,
    })
    const params = new URLSearchParams(url.split('?')[1])
    expect(readCatalogFilters(params)).toMatchObject({
      brand: 'Toro Negro',
      category: 'elevacion',
      wholesale: true,
    })
    expect(catalogHref({})).toBe('/catalogo')
    expect(
      readCatalogFilters(new URLSearchParams('min=bad&max=-1')).min,
    ).toBeUndefined()
    expect(
      readCatalogFilters(new URLSearchParams('max=Infinity')).max,
    ).toBeUndefined()
  })
  it('no confunde disponibilidad desconocida con agotado', () => {
    expect(availability(referenceProducts[0])).toBe('unknown')
    expect(availability({ ...products[0], stock: 0 })).toBe('unavailable')
    expect(availability(products[0])).toBe('available')
  })
  it('conserva pack sin asumir venta por unidad ni otros embalajes', () => {
    const discs = referenceProducts[0]
    expect(discs.presentations).toHaveLength(1)
    expect(discs.presentations[0].baseUnits).toBe(50)
    expect(
      referenceProducts.find((p) => p.id === 'ruedas-toro-negro')!
        .presentations[0].baseUnits,
    ).toBe(4)
  })
})
describe('Compra segura de datos incompletos', () => {
  it('bloquea referencias y precios ausentes en ficha, tarjeta y carrito', () => {
    const p = referenceProducts[0]
    expect(cardPricing(p)).toMatchObject({
      price: null,
      purchasable: false,
      availability: 'unknown',
    })
    expect(() => quote(p, p.presentations[0].id, 1)).toThrow()
    expect(() =>
      addToCart([], {
        productId: p.id,
        presentationId: p.presentations[0].id,
        quantity: 1,
      }),
    ).toThrow()
    expect(
      restoreCart(
        JSON.stringify([
          {
            productId: p.id,
            presentationId: p.presentations[0].id,
            quantity: 1,
          },
        ]),
      ),
    ).toEqual([])
    expect(() =>
      quote(
        {
          ...products[0],
          presentations: [
            { ...products[0].presentations[0], price: null, tiers: undefined },
          ],
        },
        'unidad',
        1,
      ),
    ).toThrow()
  })
  it('destaca sólo precios de volumen alcanzables en stock demo', () => {
    const gloves = products.find((p) => p.id === 'guantes')!
    expect(cardPricing(gloves).volume?.minQuantity).toBe(6)
    expect(cardPricing(gloves).volume?.price).toBe(3690)
  })
})

describe('Avisos de recuperación del carrito', () => {
  it('informa datos inválidos o pendientes y conserva líneas válidas', () => {
    expect(restoredCartState('invalid').message).toContain(
      'no pudo recuperarse',
    )
    expect(restoredCartState(null).message).toBe('')
    const raw = JSON.stringify([
      {
        productId: 'discos-yts-50',
        presentationId: 'presentacion',
        quantity: 1,
      },
    ])
    expect(restoredCartState(raw).message).toContain('sin precio')
    const valid = JSON.stringify([
      { productId: 'taladro', presentationId: 'unidad', quantity: 1 },
    ])
    expect(restoredCartState(valid).lines).toHaveLength(1)
    expect(restoredCartState(valid).message).toBe('')
  })
})
