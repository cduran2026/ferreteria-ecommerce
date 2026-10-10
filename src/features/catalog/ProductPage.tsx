import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { products, money } from '../../services/catalog'
import type { Product } from '../../types/catalog'
import { quote, tiersFor } from '../../services/demoCommerce'
import { useCart } from '../cart/useCart'
import { Button } from '../../components/ui'
import { Icon } from '../../components/store/Icon'
import { QuantityControl } from '../../components/store/QuantityControl'
import { ProductCard } from '../../components/store/ProductCard'
export function ProductPage() {
  const { id } = useParams()
  const product = products.find((p) => p.id === id)
  return product ? (
    <ProductDetail key={product.id} product={product} />
  ) : (
    <div className="sf-container sf-page sf-empty">
      <h1>Producto no encontrado</h1>
      <Link className="button" to="/catalogo">
        Volver al catálogo
      </Link>
    </div>
  )
}
function ProductDetail({ product: p }: { product: Product }) {
  const [presentationId, setPresentation] = useState(p.presentations[0].id),
    [quantity, setQuantity] = useState(1),
    [zoom, setZoom] = useState(false),
    [added, setAdded] = useState(false)
  const { add } = useCart()
  const presentation = p.presentations.find((x) => x.id === presentationId)!
  const tiers = tiersFor(presentation)
  let pricing: ReturnType<typeof quote> | null = null,
    error = ''
  try {
    pricing = quote(p, presentation.id, quantity)
  } catch (e) {
    error = e instanceof Error ? e.message : 'Cantidad no válida.'
  }
  const related = products.filter((x) => x.id !== p.id).slice(0, 3)
  return (
    <div className="sf-container sf-page">
      <p className="sf-breadcrumb">
        <Link to="/">Inicio</Link>
        <span>/</span>
        <Link to={`/catalogo?categoria=${encodeURIComponent(p.category)}`}>
          {p.category}
        </Link>
        <span>/</span>
        <span>{p.name}</span>
      </p>
      <div className="sf-product-detail">
        <section className="sf-gallery" aria-label="Galería del producto">
          <button
            className={`sf-gallery-main ${zoom ? 'is-zoomed' : ''}`}
            aria-label={zoom ? 'Reducir imagen' : 'Ampliar imagen'}
            aria-pressed={zoom}
            onClick={() => setZoom(!zoom)}
          >
            <img src={p.image} alt={p.name} width="620" height="620" />
          </button>
          <div className="sf-gallery-bottom">
            <span>Imagen ilustrativa generada · Producto demo</span>
            <Button className="sf-link-button" onClick={() => setZoom(!zoom)}>
              {zoom ? 'Vista completa' : 'Ver detalle'}
            </Button>
          </div>
          <button
            className="sf-thumbnail"
            aria-label="Vista principal"
            aria-pressed={!zoom}
            onClick={() => setZoom(false)}
          >
            <img src={p.image} alt="" width="70" height="70" />
          </button>
        </section>
        <section
          className="sf-buy-panel"
          aria-label="Configurar compra demostrativa"
        >
          <span className="sf-eyebrow">{p.brand ?? p.category}</span>
          <h1>{p.name}</h1>
          <p className="sf-product-sku">
            SKU {p.sku} · Catálogo de demostración
          </p>
          <div className="sf-detail-price">
            <strong>{money(pricing?.price ?? presentation.price)}</strong>
            <span>por {presentation.label.toLowerCase()}</span>
          </div>
          <p className="sf-demo-stock">
            <span />
            Stock de ejemplo: {p.stock} unidades base
          </p>
          <fieldset className="sf-presentations">
            <legend>Elige tu presentación</legend>
            {p.presentations.map((x) => (
              <label
                className={presentation.id === x.id ? 'is-selected' : ''}
                key={x.id}
              >
                <input
                  type="radio"
                  name="presentation"
                  value={x.id}
                  checked={presentation.id === x.id}
                  onChange={() => {
                    setPresentation(x.id)
                    setQuantity(1)
                    setAdded(false)
                  }}
                />
                <strong>{x.label}</strong>
                <small>
                  {x.baseUnits}{' '}
                  {x.baseUnits === 1 ? 'unidad base' : 'unidades base'}
                </small>
                <span>{money(x.price)}</span>
              </label>
            ))}
          </fieldset>
          {tiers.length > 1 && (
            <section className="sf-price-tiers" aria-labelledby="tier-title">
              <h2 id="tier-title">
                <Icon name="box" />
                Tu precio mejora con la cantidad
              </h2>
              <p>Cantidades de la presentación seleccionada.</p>
              <div className="sf-tier-grid">
                {tiers.map((tier, i) => {
                  const next = tiers[i + 1]?.minQuantity
                  const active =
                    pricing &&
                    quantity >= tier.minQuantity &&
                    (!next || quantity < next)
                  return (
                    <button
                      key={tier.minQuantity}
                      className={active ? 'is-applied' : ''}
                      onClick={() => {
                        setQuantity(tier.minQuantity)
                        setAdded(false)
                      }}
                      aria-pressed={Boolean(active)}
                    >
                      <small>
                        {next
                          ? `${tier.minQuantity} a ${next - 1}`
                          : `${tier.minQuantity} o más`}
                      </small>
                      <strong>{money(tier.price)}</strong>
                      <span>por presentación</span>
                    </button>
                  )
                })}
              </div>
            </section>
          )}
          <div className="sf-quantity-row">
            <label id="product-quantity-heading">Cantidad</label>
            <QuantityControl
              value={quantity}
              onChange={(v) => {
                setQuantity(v)
                setAdded(false)
              }}
              max={Math.floor(p.stock / presentation.baseUnits)}
            />
          </div>
          {error && (
            <p className="sf-error" role="alert">
              {error}
            </p>
          )}
          <div className="sf-purchase-summary">
            <div>
              <span>Presentación</span>
              <strong>{presentation.label}</strong>
            </div>
            <div>
              <span>Unidades equivalentes</span>
              <strong>{pricing?.units ?? '—'}</strong>
            </div>
            <div>
              <span>Precio aplicado</span>
              <strong>{pricing ? money(pricing.price) : '—'}</strong>
            </div>
            <div className="sf-summary-total">
              <span>
                Total · {quantity || '—'}{' '}
                {quantity === 1 ? 'presentación' : 'presentaciones'}
              </span>
              <strong>{pricing ? money(pricing.total) : '—'}</strong>
            </div>
          </div>
          <Button
            className="sf-add-main"
            disabled={!pricing}
            onClick={() => {
              if (
                add({
                  productId: p.id,
                  presentationId: presentation.id,
                  quantity,
                })
              )
                setAdded(true)
            }}
          >
            <Icon name="cart" />
            {added ? 'Agregado al carrito' : 'Agregar al carrito'}
          </Button>
          {added && (
            <Link className="sf-after-add" to="/carrito">
              Ver mi carrito
              <Icon name="arrow" />
            </Link>
          )}
          <p className="sf-purchase-note">
            <Icon name="shield" />
            Compra demostrativa. No se generan pedidos ni se descuenta
            inventario.
          </p>
        </section>
      </div>
      <section className="sf-product-description">
        <h2>Sobre este producto</h2>
        <p>{p.description}</p>
        <div>
          <span>SKU</span>
          <strong>{p.sku}</strong>
        </div>
        <div>
          <span>Categoría</span>
          <strong>{p.category}</strong>
        </div>
        <div>
          <span>Equivalencias</span>
          <strong>Según cada presentación, en unidades base.</strong>
        </div>
      </section>
      <section className="sf-section">
        <div className="sf-section-heading">
          <h2>También para tu proyecto</h2>
          <Link className="sf-text-link" to="/catalogo">
            Ver todos
            <Icon name="arrow" />
          </Link>
        </div>
        <div className="sf-product-grid sf-related-grid">
          {related.map((x) => (
            <ProductCard key={x.id} product={x} />
          ))}
        </div>
      </section>
    </div>
  )
}
