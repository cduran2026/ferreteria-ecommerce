export interface PriceTier {
  minQuantity: number
  price: number
}
export interface Presentation {
  id: string
  label: string
  baseUnits: number
  price: number | null
  tiers?: PriceTier[]
}
export interface Category {
  id: string
  name: string
  slug: string
  parent_id: string | null
}
export interface Product {
  id: string
  sku: string
  name: string
  category: string
  categoryId?: string
  image: string
  stock: number | null
  description: string
  presentations: Presentation[]
  brand?: string
  featured?: boolean
  introducedAt?: string
  baseUnit?: string
  dataKind?: 'demo' | 'reference'
  referenceUrl?: string
}
export interface DemoProduct extends Product {
  stock: number
  presentations: (Presentation & { price: number })[]
}
