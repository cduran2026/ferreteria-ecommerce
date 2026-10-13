import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { CartProvider } from '../src/features/cart/Provider'
import { ProductCard } from '../src/components/store/ProductCard'
import { NavigationMenus } from '../src/components/store/NavigationMenus'
import { HomePage } from '../src/features/catalog/HomePage'
import { CatalogPage } from '../src/features/catalog/CatalogPage'
import { products } from '../src/services/catalog'
import { referenceProducts } from '../src/services/referenceCatalog'
const render = (node: ReactNode, url = '/') =>
  renderToStaticMarkup(
    <MemoryRouter initialEntries={[url]}>
      <CartProvider>{node}</CartProvider>
    </MemoryRouter>,
  )
describe('Estados comerciales renderizados', () => {
  it('muestra referencia pendiente sin compra ni fotografía artificial', () => {
    const html = render(<ProductCard product={referenceProducts[0]} />)
    expect(html).toContain('Precio pendiente')
    expect(html).toContain('Fotografía pendiente')
    expect(html).toContain('Ver producto')
    expect(html).not.toContain('aria-label="Agregar')
    expect(html).not.toContain('<img')
    expect(html).not.toContain('%')
    expect(html).not.toContain('$')
  })
  it('mantiene precio y compra demo distinguidos de ofertas', () => {
    const html = render(<ProductCard product={products[0]} />)
    expect(html).toContain('69.990')
    expect(html).toContain('Por volumen')
    expect(html).toContain('Producto demo')
    expect(html).not.toContain('disabled=""')
  })
  it('da prioridad al producto de discos antes de las marcas y destacados', () => {
    const html = render(<HomePage />)
    expect(html.indexOf('/producto/discos-yts-50')).toBeLessThan(
      html.indexOf('Tus marcas'),
    )
    expect(html).toContain('No hay ofertas publicadas')
    expect((html.match(/sf-official-brand-logo/g) ?? []).length).toBe(5)
    expect(html).toContain('/images/brands/toro-negro.png')
  })
  it('enlaza categorías hijas y marcas mediante navegación semántica', () => {
    const html = render(<NavigationMenus />)
    expect(html).toContain('Menú de categorías')
    expect(html).toContain('categoria=elevacion')
    expect(html).toContain('marca=Toro+Negro')
    expect(html).toContain('Rex')
  })
  it('explica marcas sin catálogo y ofrece recuperación funcional', () => {
    const html = render(<CatalogPage />, '/catalogo?marca=Stanford')
    expect(html).toContain('No encontramos productos')
    expect(html).toContain('preparando el catálogo')
    expect(html).toContain('Ver todos los productos')
  })
  it('restaura filtros URL y muestra sólo la referencia que coincide', () => {
    const html = render(<CatalogPage />, '/catalogo?marca=YTS&categoria=discos')
    expect(html).toContain('Discos de corte YTS')
    expect(html).not.toContain('Tecle manual')
  })
})
