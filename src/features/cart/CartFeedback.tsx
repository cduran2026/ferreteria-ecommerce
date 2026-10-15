import { Link } from 'react-router-dom'
import { Icon } from '../../components/store/Icon'
export function CartFeedback({ message }: { message: string }) {
  return (
    <div className="sf-live-message" role="status" aria-live="polite">
      {message}
      {message.startsWith('Producto agregado') && (
        <Link to="/carrito">
          Ver carrito <Icon name="arrow" />
        </Link>
      )}
    </div>
  )
}
