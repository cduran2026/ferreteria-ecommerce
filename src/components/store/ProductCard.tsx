import { Link } from 'react-router-dom'
import type { Product } from '../../types/catalog'
import { money } from '../../services/catalog'
import { tiersFor } from '../../services/demoCommerce'
import { useCart } from '../../features/cart/useCart'
import { Icon } from './Icon'
import { Button } from '../ui'
export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart()
  const presentation = product.presentations[0],
    last =
      tiersFor(presentation)
        .filter(
          (tier) => tier.minQuantity * presentation.baseUnits <= product.stock,
        )
        .at(-1) ?? tiersFor(presentation)[0]
  const wholesale = last.minQuantity > 1 && last.price < presentation.price
  return (
    <article className="sf-product-card">
      <Link className="sf-product-photo" to={`/producto/${product.id}`}>
        <img
          src={product.image}
          alt={product.name}
          width="300"
          height="300"
          loading="lazy"
        />
      </Link>
      <div className="sf-product-content">
        <span className="sf-product-category">
          {product.brand ?? product.category}
        </span>
        <Link className="sf-product-name" to={`/producto/${product.id}`}>
          <h3>{product.name}</h3>
        </Link>
        <p className="sf-presentation-label">{presentation.label}</p>
        <strong className="sf-product-price">
          {money(presentation.price)}
        </strong>
        <div className="sf-card-wholesale">
          {wholesale ? (
            <>
              <span>Por mayor: {money(last.price)}</span>
              <small>Desde {last.minQuantity} presentaciones</small>
            </>
          ) : (
            <small>Precio por presentación</small>
          )}
        </div>
        <div className="sf-product-actions">
          <Button
            onClick={() =>
              add({
                productId: product.id,
                presentationId: presentation.id,
                quantity: 1,
              })
            }
            disabled={product.stock < presentation.baseUnits}
            aria-label={`Agregar ${product.name} al carrito`}
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
