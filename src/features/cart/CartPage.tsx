import { Link } from 'react-router-dom'
import { useCart } from './useCart'
import { cartQuotes, lineKey } from '../../services/demoCommerce'
import { money } from '../../services/catalog'
import { Icon } from '../../components/store/Icon'
import { QuantityControl } from '../../components/store/QuantityControl'
import { Button } from '../../components/ui'
export function CartPage() {
  const { lines, update, remove } = useCart()
  const quotes = cartQuotes(lines),
    total = quotes.reduce((n, q) => n + q.total, 0),
    units = quotes.reduce((n, q) => n + q.units, 0)
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
                  <img
                    src={q.product.image}
                    alt={q.product.name}
                    width="150"
                    height="150"
                  />
                </Link>
                <div className="sf-cart-item-info">
                  <Link to={`/producto/${q.product.id}`}>
                    <h2>{q.product.name}</h2>
                  </Link>
                  <p>
                    {q.presentation.label} · {q.presentation.baseUnits} unidades
                    base por presentación
                  </p>
                  <span className="sf-cart-unit-price">
                    {money(q.price)} por presentación
                  </span>
                  <div className="sf-cart-controls">
                    <QuantityControl
                      value={q.quantity}
                      label={`Cantidad de ${q.product.name}, ${q.presentation.label}`}
                      max={Math.floor(
                        q.product.stock / q.presentation.baseUnits,
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
                    {q.units} unidades equivalentes · Precio recalculado por
                    volumen
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
              <span>Presentaciones</span>
              <strong>{quotes.reduce((n, q) => n + q.quantity, 0)}</strong>
            </div>
            <div>
              <span>Unidades equivalentes</span>
              <strong>{units}</strong>
            </div>
            <div>
              <span>Subtotal</span>
              <strong>{money(total)}</strong>
            </div>
            <div className="sf-summary-total">
              <span>Total demostrativo</span>
              <strong>{money(total)}</strong>
            </div>
            <Button disabled>Compra aún no habilitada</Button>
            <p>
              <Icon name="shield" />
              Este carrito es una demostración. No hay pagos, pedidos, reservas
              ni descuentos de stock.
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
