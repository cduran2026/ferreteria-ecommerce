import { ProductMedia } from '../../components/store/ProductMedia'
import { ProductPrice } from '../../components/store/ProductPrice'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { storeProducts, money, baseQuantity } from '../../services/catalog'
import type { Product } from '../../types/catalog'
import { quote, tiersFor } from '../../services/demoCommerce'
import { useCart } from '../cart/useCart'
import { Button } from '../../components/ui'
import { Icon } from '../../components/store/Icon'
import { QuantityControl } from '../../components/store/QuantityControl'
import { ProductCard } from '../../components/store/ProductCard'
export function ProductPage() {
  const { id } = useParams()
  const product = storeProducts.find((p) => p.id === id)
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
  let equivalentUnits: number | null = null
  try {
    equivalentUnits = baseQuantity(quantity, presentation.baseUnits)
  } catch {
    /* Cantidad inválida: se informa mediante el cotizador. */
  }
  try {
    pricing = quote(p, presentation.id, quantity)
  } catch (e) {
    error = e instanceof Error ? e.message : 'Cantidad no válida.'
  }
  const related = storeProducts
    .filter(
      (x) =>
        x.id !== p.id &&
        (p.brand ? x.brand === p.brand : x.category === p.category),
    )
    .slice(0, 3)
  return (
    <div className="sf-container sf-page">
      <p className="sf-breadcrumb">
        <Link to="/">Inicio</Link>
        <span>/</span>
        <Link
          to={`/catalogo?categoria=${encodeURIComponent(p.categoryId ?? p.category)}`}
        >
          {p.category}
        </Link>
        <span>/</span>
        <span>{p.name}</span>
      </p>
      <div className="sf-product-detail">
        <section className="sf-gallery" aria-label="Galería del producto">
          {p.image ? (
            <>
              <button
                className={`sf-gallery-main ${zoom ? 'is-zoomed' : ''}`}
                aria-label={zoom ? 'Reducir imagen' : 'Ampliar imagen'}
                aria-pressed={zoom}
                onClick={() => setZoom(!zoom)}
              >
                <ProductMedia product={p} priority />
              </button>
              <Button className="sf-link-button" onClick={() => setZoom(!zoom)}>
                {zoom ? 'Vista completa' : 'Ver detalle'}
              </Button>
            </>
          ) : (
            <div className="sf-gallery-placeholder">
              <ProductMedia product={p} />
            </div>
          )}
          <div className="sf-gallery-bottom">
            <span>
              Fotografías autorizadas pendientes. No se usan imágenes de
              terceros.
            </span>
          </div>
        </section>
        <section
          className="sf-buy-panel"
          aria-label="Configurar compra demostrativa"
        >
          <span className="sf-eyebrow">{p.brand ?? p.category}</span>
          <h1>{p.name}</h1>
          <p className="sf-product-sku">
            {p.sku
              ? 'SKU ' + p.sku + ' · Ejemplo demo'
              : 'Referencia comercial · Datos pendientes'}
          </p>
          <div className="sf-detail-price">
            <ProductPrice
              price={pricing?.price ?? presentation.price}
              label={presentation.label}
            />
          </div>
          <p className="sf-detail-equivalence">
            {presentation.label}: {presentation.baseUnits}{' '}
            {p.baseUnit ?? 'unidades base'}.{' '}
            {presentation.baseUnits > 1 && presentation.price !== null && (
              <span>
                Equivalente aproximado:{' '}
                {money(
                  (pricing?.price ?? presentation.price) /
                    presentation.baseUnits,
                )}{' '}
                por unidad base.
              </span>
            )}
          </p>
          <p className="sf-demo-stock">
            {p.stock === null
              ? 'Disponibilidad pendiente de confirmar'
              : `Stock de ejemplo: ${p.stock} unidades base · Demo`}
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
                <span>
                  {x.price === null ? 'Precio pendiente' : money(x.price)}
                </span>
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
            <span id="product-quantity-heading">
              Cantidad de presentaciones
            </span>
            <QuantityControl
              value={quantity}
              onChange={(v) => {
                setQuantity(v)
                setAdded(false)
              }}
              max={
                p.stock === null
                  ? undefined
                  : Math.floor(p.stock / presentation.baseUnits)
              }
              disabled={p.stock === null || presentation.price === null}
            />
          </div>
          {error && (
            <p
              className={
                p.stock === null || presentation.price === null
                  ? 'sf-data-notice'
                  : 'sf-error'
              }
              role={
                p.stock === null || presentation.price === null
                  ? 'status'
                  : 'alert'
              }
            >
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
              <strong>{equivalentUnits ?? '—'}</strong>
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
            {presentation.price === null
              ? 'Compra pendiente de datos'
              : added
                ? 'Agregado al carrito'
                : 'Agregar al carrito'}
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
        {p.referenceUrl && (
          <a
            className="sf-text-link"
            href={p.referenceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Ver referencia proporcionada por el cliente ↗
          </a>
        )}
        <div>
          <span>SKU</span>
          <strong>{p.sku || 'Pendiente de catálogo definitivo'}</strong>
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
      {related.length > 0 && (
        <section className="sf-section">
          <div className="sf-section-heading">
            <h2>
              {p.brand ? 'Más de ' + p.brand : 'También para tu proyecto'}
            </h2>
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
      )}
    </div>
  )
}
