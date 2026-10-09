import { describe, expect, it } from 'vitest'
import {
  baseQuantity,
  filterProducts,
  money,
  products,
} from '../src/services/catalog'
describe('Catálogo y equivalencias demostrativas', () => {
  it('combina búsqueda, categoría y precio sin alterar el origen', () => {
    expect(filterProducts('TALADRO', 'Herramientas', 70000)).toHaveLength(1)
    expect(filterProducts('taladro', 'Seguridad')).toHaveLength(0)
    expect(filterProducts('taladro', '', 10000)).toHaveLength(0)
    expect(products).toHaveLength(4)
  })
  it('convierte cajas a unidad base y rechaza cantidades inválidas', () => {
    expect(baseQuantity(3, 100)).toBe(300)
    for (const value of [0, -1, 1.5, NaN])
      expect(() => baseQuantity(value, 100)).toThrow()
    expect(() => baseQuantity(1, 0)).toThrow()
  })
  it('muestra pesos chilenos sin decimales', () => {
    expect(money(69990)).toContain('69.990')
  })
})
