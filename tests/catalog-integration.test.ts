import { describe, it, expect } from 'vitest'
import { isLocalProjectUrl } from '../src/lib/config'
import {
  priceFor,
  filterCatalog,
  validateImage,
} from '../src/services/catalogUtils'
import { safeError } from '../src/lib/errors'
import { products } from './fixtures/catalog'
describe('Catálogo conectado y validación del entorno', () => {
  it('rechaza Cloud, otros proyectos locales y configuración inválida', () => {
    expect(isLocalProjectUrl('http://127.0.0.1:61321')).toBe(true)
    for (const url of [
      '',
      'broken',
      'https://x.supabase.co',
      'http://localhost:54321',
      'http://localhost:61321/other',
    ])
      expect(isLocalProjectUrl(url)).toBe(false)
  })
  it('elige escalones vigentes y excluye expirados/futuros', () => {
    const tiers = [
      {
        min_quantity: 1,
        price_clp: 1990,
        valid_from: '2020-01-01',
        valid_until: null,
        active: true,
      },
      {
        min_quantity: 10,
        price_clp: 1790,
        valid_from: '2020-01-01',
        valid_until: null,
        active: true,
      },
      {
        min_quantity: 1,
        price_clp: 1,
        valid_from: '2030-01-01',
        valid_until: null,
        active: true,
      },
    ]
    expect(priceFor(tiers, 10, new Date('2026-10-09'))).toBe(1790)
    expect(priceFor(tiers, 0, new Date('2026-10-09'))).toBeNull()
  })
  it('combina filtros y orden sin modificar la colección', () => {
    const data = products.map((p) => ({ ...p, categoryId: p.category }))
    expect(filterCatalog(data, 'TALADRO', 'Herramientas', 70000)).toHaveLength(
      1,
    )
    const sorted = filterCatalog(data, '', '', Infinity, 'price-up')
    expect(sorted[0].id).toBe('tornillos')
    expect(data[0].id).toBe('taladro')
  })
  it('rechaza archivos arbitrarios y demasiado grandes', () => {
    expect(() =>
      validateImage(new File(['x'], 'a.html', { type: 'text/html' })),
    ).toThrow()
    expect(() =>
      validateImage(
        new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'a.png', {
          type: 'image/png',
        }),
      ),
    ).toThrow()
    expect(() =>
      validateImage(new File(['x'], 'a.png', { type: 'image/png' })),
    ).not.toThrow()
  })
  it('mensajes no exponen errores privados del backend', () => {
    expect(
      safeError({ code: '42501', message: 'private internal detail' }),
    ).not.toContain('private')
    expect(safeError({ code: '23P01' })).toContain('superpone')
  })
})
