import { createContext } from 'react'
import type { CartLine } from '../../services/demoCommerce'
export interface CartState {
  lines: CartLine[]
  message: string
  add: (line: CartLine) => boolean
  update: (key: string, quantity: number) => void
  remove: (key: string) => void
}
export const CartContext = createContext<CartState>({
  lines: [],
  message: '',
  add: () => false,
  update: () => {},
  remove: () => {},
})
