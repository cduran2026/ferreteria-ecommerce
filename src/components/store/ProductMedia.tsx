import type { Product } from '../../types/catalog'
import { Icon } from './Icon'
import { categoryIcon } from './categoryIcons'
export function ProductMedia({
  product,
  priority = false,
}: {
  product: Product
  priority?: boolean
}) {
  return product.image ? (
    <img
      src={product.image}
      alt={product.name}
      width="360"
      height="360"
      loading={priority ? 'eager' : 'lazy'}
    />
  ) : (
    <div
      className="sf-photo-pending"
      aria-label={`Fotografía pendiente de ${product.name}`}
    >
      <span className="sf-placeholder-mark">
        <Icon name={categoryIcon(product.categoryId)} width="38" height="38" />
      </span>
      <span className="sf-placeholder-category">{product.category}</span>
      <small>Fotografía pendiente</small>
    </div>
  )
}
