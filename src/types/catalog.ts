export interface Presentation {
  id: string
  label: string
  baseUnits: number
  price: number
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
}
