import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  addToCart,
  removeFromCart,
  restoreCart,
  updateCart,
} from '../../services/demoCommerce'
import type { CartLine } from '../../services/demoCommerce'
import { CartContext } from './context'
const storageKey = 'allstore.demo-cart.v1'
function initialCart() {
  try {
    return restoreCart(localStorage.getItem(storageKey))
  } catch {
    return []
  }
}
export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(initialCart),
    [message, setMessage] = useState('')
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(lines))
    } catch {
      /* Modo privado: el carrito sigue funcionando en memoria. */
    }
  }, [lines])
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => setMessage(''), 5000)
    return () => clearTimeout(timer)
  }, [message])
  const add = (line: CartLine) => {
    try {
      setLines(addToCart(lines, line))
      setMessage('Producto agregado al carrito de demostración.')
      return true
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : 'No pudimos agregar el producto.',
      )
      return false
    }
  }
  const update = (key: string, quantity: number) => {
    try {
      setLines(updateCart(lines, key, quantity))
      setMessage('Cantidad y precio actualizados.')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Cantidad inválida.')
    }
  }
  const remove = (key: string) => {
    setLines(removeFromCart(lines, key))
    setMessage('Producto eliminado del carrito.')
  }
  return (
    <CartContext.Provider value={{ lines, message, add, update, remove }}>
      {children}
    </CartContext.Provider>
  )
}
