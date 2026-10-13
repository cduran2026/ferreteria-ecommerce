import { Icon, type IconName } from '../Icon'
import type { AssistantView } from '../../../services/assistant'
const actions: {
  view: AssistantView
  label: string
  icon: IconName
  hint: string
}[] = [
  {
    view: 'search',
    label: 'Buscar productos',
    icon: 'search',
    hint: 'Encuentra lo que necesitas',
  },
  {
    view: 'categories',
    label: 'Explorar categorías',
    icon: 'tools',
    hint: 'Elige una familia de productos',
  },
  {
    view: 'brands',
    label: 'Explorar marcas',
    icon: 'tag',
    hint: 'Consulta el catálogo de cada marca',
  },
  {
    view: 'volume',
    label: 'Comprar por volumen',
    icon: 'stack',
    hint: 'Presentaciones y precios por cantidad',
  },
  {
    view: 'cart',
    label: 'Consultar mi carrito',
    icon: 'cart',
    hint: 'Revisa tu selección de demostración',
  },
  {
    view: 'help',
    label: 'Solicitar ayuda',
    icon: 'chat',
    hint: 'Contacto comercial pendiente',
  },
]
export function AssistantActions({
  onSelect,
}: {
  onSelect: (view: AssistantView) => void
}) {
  return (
    <div className="sf-assistant-actions">
      {actions.map((action) => (
        <button
          key={action.view}
          type="button"
          onClick={() => onSelect(action.view)}
        >
          <Icon name={action.icon} />
          <span>
            <strong>{action.label}</strong>
          </span>
          <Icon name="arrow" />
        </button>
      ))}
    </div>
  )
}
