import { useEffect, useState, useRef } from 'react'
import type { ReactNode } from 'react'
import {
  addToCart,
  removeFromCart,
  restoredCartState,
  updateCart,
  verifyCart,
} from '../../services/demoCommerce'
import type { CartLine } from '../../services/demoCommerce'
import { CartContext } from './context'
import { useCatalog } from '../catalog/context'
export function CartProvider({ children }: { children: ReactNode }) {
  const { products, mode, loading, error } = useCatalog()
  const storageKey =
    mode === 'demo'
      ? 'allstore.demo-cart.v1'
      : 'allstore.supabase-local-61321.cart.v1'
  const hydrated = useRef(products)
  const [lines, setLines] = useState<CartLine[]>(() => {
      try {
        return loading || error
          ? []
          : restoredCartState(localStorage.getItem(storageKey), products).lines
      } catch {
        return []
      }
    }),
    [message, setMessage] = useState(''),
    [restored, setRestored] = useState(!loading && !error)
  useEffect(() => {
    if (loading || error) return
    let live = true
    queueMicrotask(() => {
      if (!live) return
      try {
        const saved = restoredCartState(
          localStorage.getItem(storageKey),
          products,
        )
        setLines(saved.lines)
        setMessage(saved.message)
      } catch {
        /* Navegación privada. */
      }
      hydrated.current = products
      setRestored(true)
    })
    return () => {
      live = false
    }
  }, [loading, error, products, storageKey])
  useEffect(() => {
    if (!restored || loading || error || hydrated.current !== products) return
    try {
      localStorage.setItem(storageKey, JSON.stringify(lines))
    } catch {
      /* Carrito en memoria. */
    }
  }, [lines, storageKey, restored, loading, error, products])
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => setMessage(''), 5000)
    return () => clearTimeout(timer)
  }, [message])
  const add = (line: CartLine) => {
    try {
      if (loading || error || !restored || hydrated.current !== products)
        throw new Error('Espera a que el catálogo esté disponible.')
      setLines(addToCart(lines, line, products))
      setMessage(
        mode === 'demo'
          ? 'Producto agregado al carrito de demostración.'
          : 'Producto agregado. Precio y disponibilidad sujetos a validación del servidor.',
      )
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
      setLines(updateCart(lines, key, quantity, products))
      setMessage('Cantidad y precio actualizados.')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Cantidad inválida.')
    }
  }
  let validLines = lines
  try {
    verifyCart(lines, products)
  } catch {
    validLines = []
  }
  return (
    <CartContext.Provider
      value={{
        lines: validLines,
        message,
        add,
        update,
        remove: (key) => {
          setLines(removeFromCart(lines, key))
          setMessage('Producto eliminado del carrito.')
        },
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
