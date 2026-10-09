import { Link } from 'react-router-dom'
import type { Product } from '../../types/catalog'
import { money } from '../../services/catalog'
import { Card } from '../ui'
export function ProductCard({ product }: { product: Product }) {
  return (
    <Card className="product">
      <Link to={`/producto/${product.id}`}>
        <div className="product-image">
          <img src={product.image} alt={product.name} />
        </div>
        <span className="eyebrow">{product.category}</span>
        <h3>{product.name}</h3>
        <strong className="price">
          {money(product.presentations[0].price)}
        </strong>
        <p>{product.presentations[0].label}</p>
        <span className="product-link">
          Ver producto <span aria-hidden="true">↗</span>
        </span>
      </Link>
    </Card>
  )
}
