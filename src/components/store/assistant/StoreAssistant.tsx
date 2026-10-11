import { assistantFocusDestination } from '../../../services/assistantKeyboard'
import { useReducer, useRef } from 'react'
import { storeAssistantConfig } from '../../../config/storeAssistant'
import {
  assistantReducer,
  initialAssistantState,
} from '../../../services/assistant'
import { AssistantAvatar } from './AssistantAvatar'
import { AssistantPanel } from './AssistantPanel'
import { Icon } from '../Icon'
export function StoreAssistant() {
  const [state, dispatch] = useReducer(assistantReducer, initialAssistantState)
  const dialog = useRef<HTMLDialogElement>(null)
  const launcher = useRef<HTMLButtonElement>(null)
  if (!storeAssistantConfig.enabled) return null
  const close = () => dialog.current?.close()
  const open = () => {
    dispatch({ type: 'open' })
    dialog.current?.showModal()
  }
  return (
    <aside className="sf-assistant" aria-label="Asistente de compras">
      <button
        ref={launcher}
        className="sf-assistant-launcher"
        type="button"
        aria-label="Abrir asistente Toro Negro"
        title="¿Te ayudo a encontrar? Toro Negro, asistente guiado"
        aria-haspopup="dialog"
        aria-controls="store-assistant-panel"
        aria-expanded={state.open}
        onClick={open}
      >
        <span className="sf-assistant-welcome">
          <strong>¿Te ayudo a encontrar?</strong>
          <small>Toro Negro · Asistente guiado</small>
        </span>
        <AssistantAvatar />
        <span className="sf-assistant-caption">Ayuda</span>
      </button>
      <dialog
        ref={dialog}
        id="store-assistant-panel"
        className="sf-assistant-dialog"
        aria-labelledby="assistant-title"
        aria-describedby="assistant-description"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            close()
            return
          }
          if (event.key !== 'Tab') return
          const controls = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>(
              'button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex="0"]',
            ),
          ).filter((control) => control.getClientRects().length > 0)
          const destination = assistantFocusDestination(
            event.shiftKey,
            controls.indexOf(document.activeElement as HTMLElement),
            controls.length,
          )
          if (destination !== null) {
            event.preventDefault()
            controls[destination].focus()
          }
        }}
        onClose={() => {
          dispatch({ type: 'close' })
          launcher.current?.focus()
        }}
      >
        <header className="sf-assistant-header">
          <AssistantAvatar />
          <div>
            <h2 id="assistant-title">Toro Negro</h2>
            <p id="assistant-description">Tu asistente de compras All Store</p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Minimizar asistente"
            title="Minimizar"
          >
            <Icon name="minus" />
          </button>
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar asistente"
            autoFocus
          >
            <Icon name="close" />
          </button>
        </header>
        <AssistantPanel state={state} dispatch={dispatch} onNavigate={close} />
      </dialog>
    </aside>
  )
}
