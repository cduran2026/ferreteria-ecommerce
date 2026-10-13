import { useEffect, useRef, useState } from 'react'
import type { Dispatch } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../../../features/cart/useCart'
import {
  storeAssistantConfig,
  whatsappContactUrl,
} from '../../../config/storeAssistant'
import {
  assistantBrands,
  assistantCategories,
  assistantCartSummary,
  assistantSearch,
  assistantSearchHref,
} from '../../../services/assistant'
import type {
  AssistantAction,
  AssistantState,
} from '../../../services/assistant'
import { catalogHref } from '../../../services/catalogTaxonomy'
import { Icon } from '../Icon'
import { categoryIcon } from '../categoryIcons'
import { AssistantActions } from './AssistantActions'
import { ProductPrice } from '../ProductPrice'
import { cardPricing } from '../../../services/demoCommerce'

export function AssistantPanel({
  state,
  dispatch,
  onNavigate,
}: {
  state: AssistantState
  dispatch: Dispatch<AssistantAction>
  onNavigate: () => void
}) {
  const { lines } = useCart()
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if (state.open) heading.current?.focus()
  }, [state.view, state.open])
  const [message, setMessage] = useState(
    storeAssistantConfig.whatsapp.initialMessage,
  )
  const contact = whatsappContactUrl(message)
  const results = state.searched ? assistantSearch(state.query) : []
  const cart = assistantCartSummary(lines)
  const titles = {
    home: '¿Qué necesitas encontrar hoy?',
    search: 'Busquemos tu producto',
    categories: 'Explora por categoría',
    brands: 'Tus marcas',
    volume: 'Compra por presentación',
    cart: 'Tu selección actual',
    help: 'Hablemos de tu proyecto',
  }
  return (
    <>
      <div className="sf-assistant-body">
        {state.view !== 'home' && (
          <button
            type="button"
            className="sf-assistant-back"
            onClick={() => dispatch({ type: 'view', view: 'home' })}
          >
            <Icon name="arrow" /> Volver a opciones
          </button>
        )}
        <h3 ref={heading} tabIndex={-1}>
          {titles[state.view]}
        </h3>
        {state.view === 'home' && (
          <>
            <p className="sf-assistant-greeting">
              Soy Toro Negro. Elige cómo te ayudo.
            </p>
            <AssistantActions
              onSelect={(view) => dispatch({ type: 'view', view })}
            />
          </>
        )}
        {state.view === 'search' && (
          <>
            <form
              className="sf-assistant-search"
              onSubmit={(event) => {
                event.preventDefault()
                dispatch({ type: 'search' })
              }}
            >
              <label htmlFor="assistant-query">¿Qué producto buscas?</label>
              <div>
                <input
                  id="assistant-query"
                  type="search"
                  maxLength={120}
                  value={state.query}
                  placeholder="Por ejemplo, discos o taladro"
                  onChange={(event) =>
                    dispatch({ type: 'query', value: event.target.value })
                  }
                  required
                />
                <button type="submit" className="button">
                  Buscar
                </button>
              </div>
            </form>
            {state.searched && (
              <div role="status" className="sf-assistant-results">
                <p>
                  {results.length
                    ? `${results.length} ${results.length === 1 ? 'resultado' : 'resultados'} en el catálogo`
                    : 'No encontramos productos. Prueba otro término.'}
                </p>
                {results.slice(0, 3).map((product) => (
                  <Link
                    key={product.id}
                    className="sf-assistant-result"
                    to={'/producto/' + product.id}
                    onClick={onNavigate}
                  >
                    <Icon name={categoryIcon(product.categoryId)} />
                    <span>
                      <strong>{product.name}</strong>
                      <ProductPrice price={cardPricing(product).price} />
                      <small>
                        {product.dataKind === 'reference'
                          ? 'Precio y disponibilidad por confirmar'
                          : 'Datos demostrativos'}
                      </small>
                    </span>
                    <Icon name="arrow" />
                  </Link>
                ))}
                <Link
                  className="sf-assistant-primary"
                  to={assistantSearchHref(state.query)}
                  onClick={onNavigate}
                >
                  Ver búsqueda en el catálogo <Icon name="arrow" />
                </Link>
              </div>
            )}
          </>
        )}
        {state.view === 'categories' && (
          <div className="sf-assistant-options">
            {assistantCategories().map((category) => (
              <Link
                className={category.parent_id ? 'is-child' : ''}
                key={category.id}
                to={category.href}
                onClick={onNavigate}
              >
                <Icon name={categoryIcon(category.id)} />
                <span>
                  <strong>{category.name}</strong>
                  <small>
                    {category.count
                      ? `${category.count} ${category.count === 1 ? 'producto registrado' : 'productos registrados'}`
                      : 'Sin productos cargados todavía'}
                  </small>
                </span>
                <Icon name="arrow" />
              </Link>
            ))}
          </div>
        )}
        {state.view === 'brands' && (
          <>
            <p className="sf-assistant-note">
              Consulta únicamente los productos registrados. No implica precio
              ni stock confirmado.
            </p>
            <div className="sf-assistant-options">
              {assistantBrands().map((brand) => (
                <Link key={brand.name} to={brand.href} onClick={onNavigate}>
                  <Icon name="tag" />
                  <span>
                    <strong>{brand.name}</strong>
                    <small>
                      {brand.count
                        ? `${brand.count} ${brand.count === 1 ? 'producto registrado' : 'productos registrados'}`
                        : 'Sin productos cargados todavía'}
                    </small>
                  </span>
                  <Icon name="arrow" />
                </Link>
              ))}
            </div>
          </>
        )}
        {state.view === 'volume' && (
          <>
            <p>
              El precio corresponde a la presentación elegida. Las equivalencias
              cambian según el producto.
            </p>
            <dl className="sf-assistant-volume">
              <dt>Unidad</dt>
              <dd>Una pieza, par o set, según lo que indique la ficha.</dd>
              <dt>Caja, pack o embalaje</dt>
              <dd>
                Un conjunto con la cantidad indicada en la ficha. No todos los
                productos tienen las mismas presentaciones.
              </dd>
              <dt>Precio por cantidad</dt>
              <dd>
                Algunos productos tienen precios por cantidad de unidades, cajas
                o packs. Revisa equivalencias, precio aplicado y total antes de
                agregar.
              </dd>
            </dl>
            <p className="sf-assistant-note">
              Sin descuentos universales. Las referencias sin precio o
              disponibilidad no se pueden agregar; los ejemplos permiten probar
              el carrito.
            </p>
            <Link
              className="sf-assistant-primary"
              to={catalogHref({ wholesale: true })}
              onClick={onNavigate}
            >
              Explorar precios por volumen <Icon name="arrow" />
            </Link>
          </>
        )}
        {state.view === 'cart' && (
          <>
            <div className="sf-assistant-cart">
              <Icon name="cart" width="32" height="32" />
              <p>
                {cart.products
                  ? `${cart.products} ${cart.products === 1 ? 'producto' : 'productos'} · ${cart.presentations} ${cart.presentations === 1 ? 'combinación de producto/presentación' : 'combinaciones de producto/presentación'} · ${cart.quantity} ${cart.quantity === 1 ? 'presentación' : 'presentaciones'} en total.`
                  : 'Tu carrito de demostración está vacío.'}
              </p>
            </div>
            <p className="sf-assistant-note">
              Revisa cantidades, contenido y total en tu carrito de
              demostración.
            </p>
            <Link
              className="sf-assistant-primary"
              to={cart.products ? '/carrito' : '/catalogo'}
              onClick={onNavigate}
            >
              {cart.products ? 'Ver mi carrito' : 'Explorar productos'}{' '}
              <Icon name="arrow" />
            </Link>
          </>
        )}
        {state.view === 'help' && (
          <>
            <p>
              El contacto por WhatsApp está pendiente de aprobación comercial.
            </p>
            <label
              className="sf-assistant-contact"
              htmlFor="assistant-contact-message"
            >
              Mensaje inicial editable
              <textarea
                id="assistant-contact-message"
                rows={3}
                maxLength={300}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
            </label>
            {contact ? (
              <a
                className="sf-assistant-primary"
                href={contact}
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir WhatsApp <Icon name="chat" />
              </a>
            ) : (
              <button type="button" className="sf-assistant-primary" disabled>
                <Icon name="chat" /> WhatsApp pendiente de activación
              </button>
            )}
            <p className="sf-assistant-note">
              No se envían mensajes automáticamente. Tu borrador sólo vive en
              memoria; no incluyas datos personales. Puedes explorar productos
              mientras habilitamos el contacto.
            </p>
            <Link className="sf-text-link" to="/catalogo" onClick={onNavigate}>
              Ir al catálogo <Icon name="arrow" />
            </Link>
          </>
        )}
      </div>
      <div className="sf-assistant-disclaimer">
        Orientación de demostración · Sin precios ni stock reales conectados.
      </div>
    </>
  )
}
