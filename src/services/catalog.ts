import type { Product } from '../types/catalog'
export const products: Product[] = [
  {
    id: 'taladro',
    sku: 'HER-001',
    name: 'Taladro percutor inalámbrico 20V',
    category: 'Herramientas',
    image: '/products/drill.svg',
    stock: 24,
    description:
      'Equipo de ejemplo para perforación y montaje. Incluye batería y cargador. Especificaciones ilustrativas; no corresponde a una oferta comercial.',
    presentations: [
      { id: 'unidad', label: 'Unidad', baseUnits: 1, price: 69990 },
      { id: 'caja', label: 'Caja de 4 unidades', baseUnits: 4, price: 259960 },
    ],
  },
  {
    id: 'herramientas',
    sku: 'HER-002',
    name: 'Set de herramientas de mano · 12 piezas',
    category: 'Herramientas',
    image: '/products/tools.svg',
    stock: 36,
    description: 'Set demostrativo para mantenimiento y reparación.',
    presentations: [{ id: 'unidad', label: 'Set', baseUnits: 1, price: 24990 }],
  },
  {
    id: 'tornillos',
    sku: 'FIJ-001',
    name: 'Tornillos para madera 4 × 40 mm',
    category: 'Fijaciones',
    image: '/products/screws.svg',
    stock: 2400,
    description:
      'Fijación de ejemplo. El inventario se expresa en tornillos como unidad base.',
    presentations: [
      { id: 'unidad', label: 'Unidad', baseUnits: 1, price: 90 },
      {
        id: 'caja',
        label: 'Caja de 100 unidades',
        baseUnits: 100,
        price: 6990,
      },
    ],
  },
  {
    id: 'guantes',
    sku: 'SEG-001',
    name: 'Guantes de trabajo con recubrimiento',
    category: 'Seguridad',
    image: '/products/gloves.svg',
    stock: 8,
    description:
      'Guantes ilustrativos. No constituyen una certificación de protección.',
    presentations: [
      { id: 'unidad', label: 'Par', baseUnits: 1, price: 3990 },
      {
        id: 'embalaje',
        label: 'Embalaje de 12 pares',
        baseUnits: 12,
        price: 39900,
      },
    ],
  },
]
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
      p.name
        .toLocaleLowerCase('es-CL')
        .includes(query.toLocaleLowerCase('es-CL')) &&
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
  return quantity * units
}
