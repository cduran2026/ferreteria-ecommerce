import { assistantFocusDestination } from '../src/services/assistantKeyboard'
import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import {
  assistantReducer,
  initialAssistantState,
  assistantSearch,
  assistantSearchHref,
  assistantBrands,
  assistantCategories,
  assistantCartSummary,
} from '../src/services/assistant'
import {
  storeAssistantConfig,
  whatsappContactUrl,
} from '../src/config/storeAssistant'
import { StoreAssistant } from '../src/components/store/assistant/StoreAssistant'
import { AssistantPanel } from '../src/components/store/assistant/AssistantPanel'
import { categoryIcon } from '../src/components/store/categoryIcons'
import { CartContext } from '../src/features/cart/context'
const render = (view: ReactNode) =>
  renderToStaticMarkup(<MemoryRouter>{view}</MemoryRouter>)
const panel = (view: typeof initialAssistantState.view, extra = {}) =>
  render(
    <AssistantPanel
      state={{ ...initialAssistantState, open: true, view, ...extra }}
      dispatch={() => {}}
      onNavigate={() => {}}
    />,
  )
describe('Asistente guiado y navegación compartida', () => {
  it('mantiene Tab y Shift+Tab dentro del panel incluso desde su encabezado', () => {
    expect(assistantFocusDestination(false, 4, 5)).toBe(0)
    expect(assistantFocusDestination(true, 0, 5)).toBe(4)
    expect(assistantFocusDestination(true, -1, 5)).toBe(4)
    expect(assistantFocusDestination(false, -1, 5)).toBe(0)
    expect(assistantFocusDestination(false, 2, 5)).toBeNull()
    expect(assistantFocusDestination(false, 0, 0)).toBeNull()
  })
  it('no abre automáticamente y conserva la opción al cerrar y reabrir', () => {
    expect(initialAssistantState.open).toBe(false)
    const opened = assistantReducer(initialAssistantState, { type: 'open' })
    const brands = assistantReducer(opened, { type: 'view', view: 'brands' })
    const closed = assistantReducer(brands, { type: 'close' })
    expect(closed.open).toBe(false)
    expect(assistantReducer(closed, { type: 'open' })).toEqual({
      ...brands,
      open: true,
    })
  })
  it('reinicia resultados al editar y rechaza búsqueda vacía', () => {
    let state = assistantReducer(initialAssistantState, { type: 'search' })
    expect(state.searched).toBe(false)
    state = assistantReducer(state, { type: 'query', value: 'discos' })
    state = assistantReducer(state, { type: 'search' })
    expect(state.searched).toBe(true)
    expect(
      assistantReducer(state, { type: 'query', value: 'tecle' }).searched,
    ).toBe(false)
  })
  it('reutiliza búsqueda normalizada del catálogo sin fabricar resultados', () => {
    expect(assistantSearch('GRIFERIA').map((p) => p.id)).toEqual([
      'griferia-yts',
    ])
    expect(assistantSearch('discos')).toHaveLength(1)
    expect(assistantSearch('inexistente')).toEqual([])
    expect(assistantSearch('  ')).toEqual([])
    const url = assistantSearchHref(' discos & tecle ')
    expect(new URLSearchParams(url.split('?')[1]).get('q')).toBe(
      'discos & tecle',
    )
  })
  it('enlaza categorías existentes incluidas hijas y explica categorías vacías', () => {
    const categories = assistantCategories()
    expect(categories.find((c) => c.id === 'discos')).toMatchObject({
      count: 1,
      href: '/catalogo?categoria=discos',
    })
    expect(categories.find((c) => c.id === 'herramientas')?.count).toBe(4)
    expect(categories.find((c) => c.id === 'selladores')?.count).toBe(0)
    expect(panel('categories')).toContain('Sin productos cargados todavía')
  })
  it('muestra cinco marcas sin adjudicar productos a Akilda, Stanford o Rex', () => {
    const entries = assistantBrands()
    expect(entries.map((b) => b.name)).toEqual([
      'Toro Negro',
      'YTS',
      'Akilda',
      'Stanford',
      'Rex',
    ])
    expect(entries.find((b) => b.name === 'Toro Negro')?.count).toBe(3)
    expect(entries.filter((b) => !b.count).map((b) => b.name)).toEqual([
      'Akilda',
      'Stanford',
      'Rex',
    ])
    expect(panel('brands')).toContain('marca=Akilda')
  })
  it('cuenta productos distintos y presentaciones desde el carrito existente', () => {
    const lines = [
      { productId: 'taladro', presentationId: 'unidad', quantity: 2 },
      { productId: 'taladro', presentationId: 'caja', quantity: 3 },
    ]
    expect(assistantCartSummary(lines)).toEqual({
      products: 1,
      presentations: 2,
      quantity: 5,
    })
    const html = render(
      <CartContext.Provider
        value={{
          lines,
          message: '',
          add: () => false,
          update: () => {},
          remove: () => {},
        }}
      >
        <AssistantPanel
          state={{ ...initialAssistantState, view: 'cart' }}
          dispatch={() => {}}
          onNavigate={() => {}}
        />
      </CartContext.Provider>,
    )
    expect(html).toContain('5 presentaciones en total')
    expect(html).toContain('href="/carrito"')
    expect(panel('cart')).toContain('carrito de demostración está vacío')
  })
  it('muestra precio pendiente en referencias y estado vacío sin inventar importes', () => {
    const result = panel('search', { query: 'discos', searched: true })
    expect(result).toContain('Precio pendiente')
    expect(result).not.toContain('$')
    expect(result).not.toContain('%')
    expect(panel('search', { query: 'inexistente', searched: true })).toContain(
      'No encontramos productos',
    )
  })
  it('orienta presentaciones sin inventar descuentos ni equivalencias universales', () => {
    const html = panel('volume')
    expect(html).toContain('Caja, pack o embalaje')
    expect(html).toContain('equivalencias cambian según el producto')
    expect(html).toContain('mayorista=1')
    expect(html).not.toContain('%')
  })
  it('contacto requiere aprobación y borrador no envía ni publica el número', () => {
    expect(storeAssistantConfig.whatsapp.approved).toBe(false)
    expect(whatsappContactUrl('Hola')).toBeNull()
    const html = panel('help')
    expect(html).toContain('WhatsApp pendiente de activación')
    expect(html).not.toContain('href="https://')
    expect(html).not.toContain('56928242288')
  })
  it('no ejecuta fetch al consultar catálogo o renderizar el asistente', () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    try {
      assistantSearch('taladro')
      assistantBrands()
      assistantCategories()
      render(<StoreAssistant />)
      panel('search', { query: 'discos', searched: true })
      expect(fetch).not.toHaveBeenCalled()
    } finally {
      vi.unstubAllGlobals()
    }
  })
  it('reserva diálogo semántico, controles accesibles e icono temporal', () => {
    const html = render(<StoreAssistant />)
    expect(html).toContain('aria-haspopup="dialog"')
    expect(html).toContain('aria-expanded="false"')
    expect(html).toContain('aria-labelledby="assistant-title"')
    expect(html).toContain('Cerrar asistente')
    expect(html).toContain('Minimizar asistente')
    expect(html).not.toContain('<dialog open')
    expect(html).not.toContain('<img')
  })
  it('permite deshabilitar asistente desde configuración', () => {
    storeAssistantConfig.enabled = false
    try {
      expect(render(<StoreAssistant />)).toBe('')
    } finally {
      storeAssistantConfig.enabled = true
    }
  })
  it('asigna iconos distintos a familias sin crear imágenes comerciales', () => {
    const ids = [
      'discos',
      'perforacion',
      'elevacion',
      'ruedas',
      'griferia',
      'pulverizacion',
      'fijaciones',
      'seguridad',
    ]
    expect(new Set(ids.map(categoryIcon)).size).toBe(ids.length)
    expect(categoryIcon('unknown')).toBe('tools')
  })
})
