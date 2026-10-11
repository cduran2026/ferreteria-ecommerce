import { Link } from 'react-router-dom'
import type { Product } from '../../types/catalog'
import { money } from '../../services/catalog'
import { cardPricing } from '../../services/demoCommerce'
import { useCart } from '../../features/cart/useCart'
import { Icon } from './Icon'
import { Button } from '../ui'
import { ProductMedia } from './ProductMedia'
import { ProductPrice } from './ProductPrice'
export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart()
  const presentation = product.presentations[0]
  const pricing = cardPricing(product)
  return (
    <article className="sf-product-card">
      <Link className="sf-product-photo" to={`/producto/${product.id}`}>
        <ProductMedia product={product} />
      </Link>
      <div className="sf-product-content">
        <span className="sf-product-category">
          {product.brand ?? 'Ejemplo sin marca'}
        </span>
        <Link className="sf-product-name" to={`/producto/${product.id}`}>
          <h3>{product.name}</h3>
        </Link>
        <p className="sf-presentation-label">
          {presentation?.label ?? 'Presentación pendiente'}
        </p>
        <ProductPrice price={pricing.price} />
        <div className="sf-card-wholesale">
          {pricing.volume ? (
            <>
              <span>Por volumen: {money(pricing.volume.price)}</span>
              <small>
                Desde {pricing.volume.minQuantity} presentaciones · Demo
              </small>
            </>
          ) : (
            <small>
              {product.dataKind === 'reference'
                ? 'Condiciones comerciales pendientes'
                : 'Precio de ejemplo · Sin venta real'}
            </small>
          )}
        </div>
        <small className="sf-availability">
          {pricing.availability === 'unknown'
            ? 'Disponibilidad por confirmar'
            : pricing.availability === 'unavailable'
              ? 'Sin disponibilidad demo'
              : 'Disponible en demo'}
        </small>
        <div className="sf-product-actions">
          <Button
            disabled={!pricing.purchasable}
            aria-label={`Agregar ${product.name} al carrito`}
            onClick={() =>
              add({
                productId: product.id,
                presentationId: presentation.id,
                quantity: 1,
              })
            }
          >
            <Icon name="plus" />
            Agregar
          </Button>
          <Link
            to={`/producto/${product.id}`}
            aria-label={`Ver detalles de ${product.name}`}
          >
            <Icon name="arrow" />
          </Link>
        </div>
      </div>
    </article>
  )
}
