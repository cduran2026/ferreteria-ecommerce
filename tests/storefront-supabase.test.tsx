import { utcInput, utcValue } from '../src/services/adminDates'
import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { catalogMode, isPublicKey, isLocalProjectUrl } from '../src/lib/config'
import { mapProduct } from '../src/services/supabaseCatalog'
import type { CatalogRow } from '../src/services/supabaseCatalog'
import { queryCatalog } from '../src/services/catalogQuery'
import {
  addToCart,
  cartQuotes,
  restoredCartState,
  quote,
} from '../src/services/demoCommerce'
import { CatalogContext } from '../src/features/catalog/context'
import { CatalogGate } from '../src/features/catalog/Provider'
import { ProductCard } from '../src/components/store/ProductCard'
import { CartFeedback } from '../src/features/cart/CartFeedback'
const tree = [
  { id: 'parent-uuid', name: 'Familia', slug: 'familia', parent_id: null },
  {
    id: 'child-uuid',
    name: 'Discos',
    slug: 'discos-de-corte',
    parent_id: 'parent-uuid',
  },
]
const row: CatalogRow = {
  id: 'real-uuid',
  sku: 'SQL-01',
  name: 'Producto SQL',
  description: null,
  category_id: 'child-uuid',
  brand: 'YTS',
  base_unit: 'discos',
  created_at: '2026-10-10',
  product_images: [],
  presentations: [
    {
      id: 'box-uuid',
      label: 'Caja de 25',
      base_units: 25,
      active: true,
      volume_prices: [
        {
          min_quantity: 1,
          price_clp: 50000,
          valid_from: '2020-01-01',
          valid_until: null,
          active: true,
        },
        {
          min_quantity: 3,
          price_clp: 45000,
          valid_from: '2020-01-01',
          valid_until: null,
          active: true,
        },
      ],
    },
  ],
}
const anon = 'x.' + btoa(JSON.stringify({ role: 'anon' })) + '.x'
describe('Integración sin reemplazar el storefront', () => {
  it('vigencias administrativas no cambian la hora UTC al editar', () => {
    expect(utcInput('2020-01-01T00:00')).toBe('2020-01-01T00:00')
    expect(utcValue('2020-01-01T00:00')).toBe('2020-01-01T00:00:00.000Z')
    expect(utcValue('2020-01-01T00:00:00+00:00')).toBe(
      '2020-01-01T00:00:00.000Z',
    )
    expect(utcInput('2020-01-01T00:00:00+00:00')).toBe('2020-01-01T00:00')
  })
  it('demo sólo sin configuración; nunca fallback con configuración parcial o privilegiada', () => {
    expect(catalogMode()).toBe('demo')
    expect(catalogMode('supabase', 'http://localhost:61321', anon)).toBe(
      'supabase',
    )
    for (const mode of ['demo', 'supabase', 'production'])
      expect(catalogMode(mode, 'https://private.supabase.co', anon)).toBe(
        'invalid',
      )
    expect(catalogMode('supabase')).toBe('invalid')
    expect(catalogMode('demo', 'http://localhost:61321', anon)).toBe('invalid')
  })
  it('rechaza claves service_role, secret y URLs de otros proyectos o con credenciales', () => {
    expect(
      isPublicKey('x.' + btoa(JSON.stringify({ role: 'service_role' })) + '.x'),
    ).toBe(false)
    expect(isPublicKey('sb_secret_private')).toBe(false)
    expect(isLocalProjectUrl('http://user:pass@localhost:61321')).toBe(false)
    expect(isLocalProjectUrl('http://localhost:56321')).toBe(false)
  })
  it('adapta marca, jerarquía, presentación y precios sin importar precios ficticios', () => {
    const product = mapProduct(row, tree, 200)
    expect(product.dataKind).toBe('supabase')
    expect(product.brand).toBe('YTS')
    expect(product.presentations[0].baseUnits).toBe(25)
    expect(
      queryCatalog([product], { category: 'parent-uuid', brand: 'YTS' }, tree),
    ).toHaveLength(1)
    expect(quote(product, 'box-uuid', 3)).toMatchObject({
      units: 75,
      price: 45000,
      total: 135000,
    })
  })
  it('descarta presentaciones inactivas y equivalencias inválidas', () => {
    const bad = {
      ...row,
      presentations: row.presentations.map((p) => ({ ...p, active: false })),
    }
    expect(mapProduct(bad, tree, 200).presentations).toEqual([])
    expect(
      mapProduct(
        {
          ...row,
          presentations: row.presentations.map((p) => ({
            ...p,
            base_units: 0,
          })),
        },
        tree,
        200,
      ).presentations,
    ).toEqual([])
  })
  it('no compra sin saldo, sin precio vigente o con disponibilidad insegura', () => {
    for (const stock of [null, NaN, Number.MAX_SAFE_INTEGER + 1])
      expect(() => quote(mapProduct(row, tree, stock), 'box-uuid', 1)).toThrow()
    const expired = {
      ...row,
      presentations: row.presentations.map((p) => ({
        ...p,
        volume_prices: p.volume_prices.map((t) => ({
          ...t,
          valid_until: '2020-02-01',
        })),
      })),
    }
    const p = mapProduct(expired, tree, 200)
    expect(p.presentations[0].price).toBeNull()
    expect(() => quote(p, 'box-uuid', 1)).toThrow()
  })
  it('carrito reutilizado valida IDs UUID, volumen, restauración y saldo agregado', () => {
    const p = mapProduct(row, tree, 100),
      line = { productId: p.id, presentationId: 'box-uuid', quantity: 3 }
    const lines = addToCart([], line, [p])
    expect(cartQuotes(lines, [p])[0].total).toBe(135000)
    expect(restoredCartState(JSON.stringify(lines), [p]).lines).toEqual(lines)
    expect(restoredCartState(JSON.stringify(lines), []).lines).toEqual([])
    expect(() => addToCart(lines, { ...line, quantity: 2 }, [p])).toThrow()
    expect(() => addToCart([], line, [])).toThrow()
  })
  it('precio que vence en memoria ya no permite cotizar', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-15'))
    const p = mapProduct(
      {
        ...row,
        presentations: row.presentations.map((x) => ({
          ...x,
          volume_prices: x.volume_prices.map((t) => ({
            ...t,
            valid_until: '2026-10-16',
          })),
        })),
      },
      tree,
      200,
    )
    expect(quote(p, 'box-uuid', 1).price).toBe(50000)
    vi.setSystemTime(new Date('2026-10-17'))
    expect(() => quote(p, 'box-uuid', 1)).toThrow()
    vi.useRealTimers()
  })
  it('fallo conectado muestra error sin renderizar contenido demo', () => {
    const state = {
      products: [],
      categoryTree: [],
      rootCategories: [],
      brands: [],
      mode: 'supabase' as const,
      loading: false,
      error: 'Consulta fallida',
      reload: () => {},
    }
    const html = renderToStaticMarkup(
      <CatalogContext.Provider value={state}>
        <CatalogGate>
          <p>PRODUCTO_FICTICIO</p>
        </CatalogGate>
      </CatalogContext.Provider>,
    )
    expect(html).toContain('Consulta fallida')
    expect(html).not.toContain('PRODUCTO_FICTICIO')
  })
  it('tarjeta sin presentaciones es visible pero no comprable', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <ProductCard
          product={{ ...mapProduct(row, tree, 200), presentations: [] }}
        />
      </MemoryRouter>,
    )
    expect(html).toContain('Ver producto')
    expect(html).not.toContain('Agregar')
    expect(html).not.toContain('Producto demo')
  })
  it('feedback conectado conserva acción de ver carrito', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <CartFeedback message="Producto agregado. Precio sujeto a validación." />
      </MemoryRouter>,
    )
    expect(html).toContain('Ver carrito')
  })
})
