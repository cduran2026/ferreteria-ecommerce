import { CartFeedback } from '../src/features/cart/CartFeedback'
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  createMemoryRouter,
  MemoryRouter,
  RouterProvider,
} from 'react-router-dom'
import { NavigationLayout } from '../src/app/layouts/NavigationLayout'
import { shouldFocusPage } from '../src/services/navigation'
import { products } from '../src/services/catalog'
import { referenceProducts } from '../src/services/referenceCatalog'
import {
  presentationCount,
  contentsCount,
  equivalenceCopy,
} from '../src/services/commercialCopy'
import { ProductCard } from '../src/components/store/ProductCard'
import { CartPage } from '../src/features/cart/CartPage'
import { CartContext } from '../src/features/cart/context'
import {
  cardPricing,
  cartQuotes,
  addToCart,
  restoreCart,
} from '../src/services/demoCommerce'
describe('Correcciones de recorrido comercial', () => {
  it('el feedback enlaza al mismo carrito tras agregar y no muestra éxito ante error', () => {
    const success = renderToStaticMarkup(
      <MemoryRouter>
        <CartFeedback message="Producto agregado al carrito de demostración." />
      </MemoryRouter>,
    )
    expect(success).toContain('href="/carrito"')
    expect(success).toContain('Ver carrito')
    const error = renderToStaticMarkup(
      <MemoryRouter>
        <CartFeedback message="No hay disponibilidad." />
      </MemoryRouter>,
    )
    expect(error).not.toContain('href="/carrito"')
    expect(error).toContain('aria-live="polite"')
  })
  it('fallback sólo aplica a páginas, preservando archivos y recursos estáticos', () => {
    const config = JSON.parse(
      readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'),
    )
    const pattern = new RegExp('^' + config.rewrites[0].source + '$')
    for (const path of [
      '/',
      '/catalogo',
      '/producto/taladro',
      '/carrito',
      '/admin',
      '/admin/inventario',
      '/admin/modulo/compras',
    ])
      expect(pattern.test(path)).toBe(true)
    for (const path of [
      '/assets/app.js',
      '/images/brands/yts.png',
      '/images/no-existe',
      '/favicon.ico',
    ])
      expect(pattern.test(path)).toBe(false)
    expect(config.rewrites[0].destination).toBe('/index.html')
  })
  it('foco sólo cambia entre páginas, no al filtrar el catálogo', () => {
    expect(shouldFocusPage('/catalogo', '/producto/taladro')).toBe(true)
    expect(shouldFocusPage('/producto/taladro', '/catalogo')).toBe(true)
    expect(shouldFocusPage('/catalogo', '/catalogo')).toBe(false)
  })
  it('renderiza el layout compartido y la restauración de scroll con rutas anidadas', () => {
    const router = createMemoryRouter(
      [
        {
          element: <NavigationLayout />,
          children: [
            { path: '/catalogo', element: <h1>Catálogo</h1> },
            { path: '/producto/:id', element: <h1>Producto</h1> },
          ],
        },
      ],
      { initialEntries: ['/producto/taladro'] },
    )
    expect(renderToStaticMarkup(<RouterProvider router={router} />)).toContain(
      'Producto',
    )
    router.dispose()
  })
  it('referencias, stock desconocido o inexistente conducen a ficha sin botón de compra', () => {
    for (const product of [
      referenceProducts[0],
      { ...products[0], stock: null },
      { ...products[0], stock: 0 },
    ]) {
      const html = renderToStaticMarkup(
        <MemoryRouter>
          <ProductCard product={product} />
        </MemoryRouter>,
      )
      expect(html).toContain('sf-view-product')
      expect(html).toContain('Ver producto')
      expect(html).not.toContain('aria-label="Agregar')
      expect(cardPricing(product).purchasable).toBe(false)
    }
  })
  it('no confunde unidades, cajas, sets, pares, packs ni embalajes', () => {
    expect(presentationCount(products[0].presentations[1], 3)).toBe('3 cajas')
    expect(presentationCount(products[1].presentations[0], 6)).toBe('6 sets')
    expect(presentationCount(products[3].presentations[0], 6)).toBe('6 pares')
    expect(presentationCount(products[3].presentations[1], 3)).toBe(
      '3 embalajes',
    )
    expect(presentationCount(referenceProducts[0].presentations[0], 2)).toBe(
      '2 packs',
    )
    expect(contentsCount(products[3], 12)).toBe('12 pares')
    expect(contentsCount(referenceProducts[0], 50)).toBe('50 discos')
  })
  it('equivalencias y precios por caja conservan el cotizador original', () => {
    const lines = addToCart([], {
      productId: 'taladro',
      presentationId: 'caja',
      quantity: 3,
    })
    const q = cartQuotes(lines)[0]
    expect(
      equivalenceCopy(q.product, q.presentation, q.quantity, q.units),
    ).toBe('3 cajas = 12 unidades')
    expect(q.price).toBe(239960)
    expect(q.total).toBe(719880)
    expect(restoreCart(JSON.stringify(lines))).toEqual(lines)
  })
  it('carrito mantiene equivalencias por producto y no suma pares con sets como unidades', () => {
    const lines = [
      { productId: 'taladro', presentationId: 'caja', quantity: 3 },
      { productId: 'guantes', presentationId: 'unidad', quantity: 2 },
    ]
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <CartContext.Provider
          value={{
            lines,
            message: '',
            add: () => false,
            update: () => {},
            remove: () => {},
          }}
        >
          <CartPage />
        </CartContext.Provider>
      </MemoryRouter>,
    )
    expect(html).toContain('3 cajas = 12 unidades')
    expect(html).toContain('2 pares = 2 pares')
    expect(html).not.toContain('unidades base')
    expect(html).toContain('Productos diferentes')
  })
})
