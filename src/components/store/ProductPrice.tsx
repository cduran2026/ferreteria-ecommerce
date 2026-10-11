import { money } from '../../services/catalog'
// Punto de presentación único. Ofertas/vigencia se conectarán al cotizador de Etapa 2.
export function ProductPrice({
  price,
  label,
}: {
  price: number | null
  label?: string
}) {
  return (
    <div
      className={
        price === null ? 'sf-price-block is-pending' : 'sf-price-block'
      }
    >
      <strong className="sf-product-price">
        {price === null ? 'Precio pendiente' : money(price)}
      </strong>
      {price !== null && label && <small>por {label.toLowerCase()}</small>}
      <span className="sf-offer-slot" data-offer-slot="reserved" hidden />
    </div>
  )
}
