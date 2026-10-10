import { Button, Input } from '../ui'
import { Icon } from './Icon'
export function QuantityControl({
  value,
  onChange,
  label = 'Cantidad',
  max,
}: {
  value: number
  onChange: (v: number) => void
  label?: string
  max?: number
}) {
  return (
    <div className="sf-quantity">
      <Button
        type="button"
        className="sf-icon-button"
        aria-label={`Disminuir ${label.toLowerCase()}`}
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
      >
        <Icon name="minus" />
      </Button>
      <Input
        type="number"
        aria-label={label}
        min="1"
        max={max}
        step="1"
        value={Number.isNaN(value) ? '' : value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <Button
        type="button"
        className="sf-icon-button"
        aria-label={`Aumentar ${label.toLowerCase()}`}
        disabled={max !== undefined && value >= max}
        onClick={() => onChange(value + 1)}
      >
        <Icon name="plus" />
      </Button>
    </div>
  )
}
