import { referenceProducts } from './referenceCatalog'
import type { DemoProduct } from '../types/catalog'
export const products: DemoProduct[] = [
  {
    id: 'taladro',
    categoryId: 'perforacion',
    dataKind: 'demo',
    introducedAt: '2026-10-09',
    baseUnit: 'unidades base',
    sku: 'HER-001',
    name: 'Taladro percutor inalámbrico 20V',
    category: 'Herramientas',
    image: '',
    stock: 24,
    description:
      'Equipo de ejemplo para perforación y montaje. Incluye batería y cargador. Especificaciones ilustrativas; no corresponde a una oferta comercial.',
    presentations: [
      {
        id: 'unidad',
        label: 'Unidad',
        baseUnits: 1,
        price: 69990,
        tiers: [
          { minQuantity: 1, price: 69990 },
          { minQuantity: 3, price: 64990 },
          { minQuantity: 6, price: 59990 },
        ],
      },
      {
        id: 'caja',
        label: 'Caja de 4 unidades',
        baseUnits: 4,
        price: 259960,
        tiers: [
          { minQuantity: 1, price: 259960 },
          { minQuantity: 3, price: 239960 },
        ],
      },
    ],
  },
  {
    id: 'herramientas',
    categoryId: 'herramientas',
    dataKind: 'demo',
    introducedAt: '2026-10-09',
    baseUnit: 'unidades base',
    sku: 'HER-002',
    name: 'Set de herramientas de mano · 12 piezas',
    category: 'Herramientas',
    image: '',
    stock: 36,
    description: 'Set demostrativo para mantenimiento y reparación.',
    presentations: [
      {
        id: 'unidad',
        label: 'Set',
        baseUnits: 1,
        price: 24990,
        tiers: [
          { minQuantity: 1, price: 24990 },
          { minQuantity: 6, price: 21990 },
          { minQuantity: 12, price: 19990 },
        ],
      },
    ],
  },
  {
    id: 'tornillos',
    categoryId: 'fijaciones',
    dataKind: 'demo',
    introducedAt: '2026-10-09',
    baseUnit: 'unidades base',
    sku: 'FIJ-001',
    name: 'Tornillos para madera 4 × 40 mm',
    category: 'Fijaciones',
    image: '',
    stock: 2400,
    description: 'Tornillos de ejemplo para fijaciones en madera.',
    presentations: [
      {
        id: 'unidad',
        label: 'Unidad',
        baseUnits: 1,
        price: 90,
        tiers: [
          { minQuantity: 1, price: 90 },
          { minQuantity: 10, price: 80 },
          { minQuantity: 50, price: 70 },
        ],
      },
      {
        id: 'caja',
        label: 'Caja de 100 unidades',
        baseUnits: 100,
        price: 6990,
        tiers: [
          { minQuantity: 1, price: 6990 },
          { minQuantity: 10, price: 5990 },
        ],
      },
    ],
  },
  {
    id: 'guantes',
    categoryId: 'seguridad',
    dataKind: 'demo',
    introducedAt: '2026-10-09',
    baseUnit: 'unidades base',
    sku: 'SEG-001',
    name: 'Guantes de trabajo con recubrimiento',
    category: 'Seguridad',
    image: '',
    stock: 8,
    description:
      'Guantes ilustrativos. No constituyen una certificación de protección.',
    presentations: [
      {
        id: 'unidad',
        label: 'Par',
        baseUnits: 1,
        price: 3990,
        tiers: [
          { minQuantity: 1, price: 3990 },
          { minQuantity: 6, price: 3690 },
          { minQuantity: 12, price: 3290 },
        ],
      },
      {
        id: 'embalaje',
        label: 'Embalaje de 12 pares',
        baseUnits: 12,
        price: 39900,
        tiers: [
          { minQuantity: 1, price: 39900 },
          { minQuantity: 3, price: 36900 },
        ],
      },
    ],
  },
]
export const storeProducts = [...referenceProducts, ...products]
export const categories = [...new Set(products.map((p) => p.category))]
export const money = (value: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value)
export function filterProducts(
  query: string,
  category: string,
  maxPrice = Infinity,
) {
  return products.filter(
    (p) =>
      [p.name, p.sku, p.brand ?? '']
        .join(' ')
        .toLocaleLowerCase('es-CL')
        .includes(query.trim().toLocaleLowerCase('es-CL')) &&
      (!category || p.category === category) &&
      p.presentations[0].price <= maxPrice,
  )
}
export function baseQuantity(quantity: number, units: number) {
  if (
    !Number.isSafeInteger(quantity) ||
    quantity < 1 ||
    !Number.isSafeInteger(units) ||
    units < 1
  )
    throw new Error('Cantidad y equivalencia deben ser enteros positivos')
  const result = quantity * units
  if (!Number.isSafeInteger(result))
    throw new Error('Cantidad fuera del rango permitido')
  return result
}
