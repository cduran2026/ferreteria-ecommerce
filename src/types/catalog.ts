export interface PriceTier {
  minQuantity: number
  price: number
}
export interface Presentation {
  id: string
  label: string
  baseUnits: number
  price: number
  tiers?: PriceTier[]
}
export interface Product {
  id: string
  sku: string
  name: string
  category: string
  image: string
  stock: number
  description: string
  presentations: Presentation[]
  brand?: string
  featured?: boolean
}
