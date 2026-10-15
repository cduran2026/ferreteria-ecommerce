import { useState } from 'react'
import { requestServerQuote } from '../../services/serverQuote'
import { useCatalog } from '../catalog/context'
import {
  contentsCount,
  presentationCount,
  equivalenceCopy,
} from '../../services/commercialCopy'
import { ProductMedia } from '../../components/store/ProductMedia'
import { Link } from 'react-router-dom'
import { useCart } from './useCart'
import { cartQuotes, lineKey } from '../../services/demoCommerce'
import { money } from '../../services/catalog'
import { Icon } from '../../components/store/Icon'
import { QuantityControl } from '../../components/store/QuantityControl'
import { Button } from '../../components/ui'
export function CartPage() {
  const { products: storeProducts, mode } = useCatalog()
  const { lines, update, remove } = useCart()
  const [checking, setChecking] = useState(false),
    [verified, setVerified] = useState({ fingerprint: '', message: '' })
  const fingerprint = JSON.stringify(lines)
  const check = async () => {
    setChecking(true)
    try {
      const result = await requestServerQuote(lines)
      setVerified({
        fingerprint,
        message:
          'Selección validada en servidor: ' +
          money(result.total_clp) +
          '. No reserva stock ni habilita la compra.',
      })
    } catch (e) {
      setVerified({
        fingerprint,
        message:
          e instanceof Error ? e.message : 'No pudimos verificar la selección.',
      })
    } finally {
      setChecking(false)
    }
  }
  const quotes = cartQuotes(lines, storeProducts),
    total = quotes.reduce((n, q) => n + q.total, 0)
  return (
    <div className="sf-container sf-page">
      <p className="sf-breadcrumb">
        <Link to="/">Inicio</Link>
        <span>/</span>Carrito
      </p>
      <div className="sf-page-heading">
        <h1>Tu carrito</h1>
        <p>
          {lines.length
            ? `${lines.length} ${lines.length === 1 ? 'producto y presentación' : 'productos y presentaciones'} para tu proyecto.`
            : 'Todo gran proyecto comienza con una idea.'}
        </p>
      </div>
      {!lines.length ? (
        <div className="sf-empty sf-empty-cart">
          <div>
            <Icon name="cart" width="42" height="42" />
          </div>
          <h2>Tu carrito está esperando</h2>
          <p>Explora productos y elige la presentación que necesitas.</p>
          <Link className="button" to="/catalogo">
            Explorar productos
            <Icon name="arrow" />
          </Link>
          <small>Carrito de demostración · Sin compras reales</small>
        </div>
      ) : (
        <div className="sf-cart-layout">
          <section
            className="sf-cart-items"
            aria-label="Productos en el carrito"
          >
            {quotes.map((q) => (
              <article className="sf-cart-item" key={lineKey(q.line)}>
                <Link
                  className="sf-cart-image"
                  to={`/producto/${q.product.id}`}
                >
                  <ProductMedia product={q.product} />
                </Link>
                <div className="sf-cart-item-info">
                  <Link to={`/producto/${q.product.id}`}>
                    <h2>{q.product.name}</h2>
                  </Link>
                  <p>
                    {q.presentation.label} ·{' '}
                    {contentsCount(q.product, q.presentation.baseUnits)}
                  </p>
                  <span className="sf-cart-unit-price">
                    {money(q.price)} por{' '}
                    {presentationCount(q.presentation, 1).slice(2)}
                  </span>
                  <div className="sf-cart-controls">
                    <QuantityControl
                      value={q.quantity}
                      label={`Cantidad de ${q.product.name}, ${q.presentation.label}`}
                      max={Math.floor(
                        (q.product.stock ?? 0) / q.presentation.baseUnits,
                      )}
                      onChange={(v) => update(lineKey(q.line), v)}
                    />
                    <Button
                      className="sf-link-button"
                      onClick={() => remove(lineKey(q.line))}
                      aria-label={`Eliminar ${q.product.name}, ${q.presentation.label}`}
                    >
                      Eliminar
                    </Button>
                  </div>
                  <small>
                    {equivalenceCopy(
                      q.product,
                      q.presentation,
                      q.quantity,
                      q.units,
                    )}
                  </small>
                </div>
                <strong className="sf-cart-subtotal">
                  {money(q.total)}
                  <small>Subtotal</small>
                </strong>
              </article>
            ))}
            <Link className="sf-text-link" to="/catalogo">
              ← Seguir explorando
            </Link>
          </section>
          <aside className="sf-cart-summary">
            <h2>Resumen de tu selección</h2>
            <div>
              <span>Artículos y paquetes</span>
              <strong>{quotes.reduce((n, q) => n + q.quantity, 0)}</strong>
            </div>
            <div>
              <span>Productos diferentes</span>
              <strong>
                {new Set(lines.map((line) => line.productId)).size}
              </strong>
            </div>
            <div>
              <span>Subtotal</span>
              <strong>{money(total)}</strong>
            </div>
            <div className="sf-summary-total">
              <span>
                {mode === 'demo' ? 'Total demostrativo' : 'Total de referencia'}
              </span>
              <strong>{money(total)}</strong>
            </div>
            {mode === 'supabase' && (
              <>
                <Button
                  className="secondary"
                  disabled={checking}
                  onClick={() => void check()}
                >
                  {checking ? 'Verificando…' : 'Verificar valores en servidor'}
                </Button>
                {verified.fingerprint === fingerprint && (
                  <p className="sf-server-quote" role="status">
                    {verified.message}
                  </p>
                )}
              </>
            )}
            <Button disabled>Compra aún no habilitada</Button>
            <p>
              <Icon name="shield" />
              Este carrito no genera pagos, pedidos, reservas ni descuentos de
              stock.
            </p>
            <small>
              Los productos se conservan sólo en este navegador. No se han
              calculado despacho ni cargos adicionales.
            </small>
          </aside>
        </div>
      )}
    </div>
  )
}
