import { useContext } from 'react'
import { CartContext } from './context'
export function useCart() {
  return useContext(CartContext)
}
