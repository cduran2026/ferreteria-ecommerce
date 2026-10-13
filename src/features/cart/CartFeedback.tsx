import { Link } from 'react-router-dom'
import { Icon } from '../../components/store/Icon'
export function CartFeedback({ message }: { message: string }) {
  return (
    <div className="sf-live-message" role="status" aria-live="polite">
      {message}
      {message === 'Producto agregado al carrito de demostración.' && (
        <Link to="/carrito">
          Ver carrito <Icon name="arrow" />
        </Link>
      )}
    </div>
  )
}
