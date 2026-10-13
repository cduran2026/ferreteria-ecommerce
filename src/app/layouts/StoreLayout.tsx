import { CartFeedback } from '../../features/cart/CartFeedback'
import { StoreAssistant } from '../../components/store/assistant/StoreAssistant'
import { NavigationMenus } from '../../components/store/NavigationMenus'
import { Form, Link, NavLink, Outlet } from 'react-router-dom'
import { catalogHref } from '../../services/catalogTaxonomy'
import { Input, Button } from '../../components/ui'
import { Icon } from '../../components/store/Icon'
import { CartProvider } from '../../features/cart/Provider'
import { useCart } from '../../features/cart/useCart'
function Header() {
  const { lines, message } = useCart()

  const count = lines.reduce((n, l) => n + l.quantity, 0)
  return (
    <>
      <div className="sf-demo-bar">
        <span className="sf-demo-dot" />
        Tienda demo · Sin pagos ni pedidos reales
      </div>
      <header className="sf-header">
        <div className="sf-container sf-header-main">
          <Link className="sf-brand" to="/" aria-label="All Store, inicio">
            <span className="sf-brand-symbol">
              a<span>↗</span>
            </span>
            <span>
              all store<small>FERRETERÍA · CHILE</small>
            </span>
          </Link>
          <Form action="/catalogo" className="sf-search" role="search">
            <Icon name="search" />
            <Input
              name="q"
              type="search"
              autoComplete="off"
              aria-label="Buscar productos"
              placeholder="Busca herramientas, materiales y más…"
            />
            <Button type="submit">Buscar</Button>
          </Form>
          <div className="sf-header-actions">
            <button
              className="sf-account"
              disabled
              title="Cuenta disponible en una etapa futura"
            >
              <Icon name="user" />
              <span>
                Mi cuenta<small>Próximamente</small>
              </span>
            </button>
            <Link
              className="sf-cart-link"
              to="/carrito"
              aria-label={`Carrito de demostración, ${count} presentaciones`}
            >
              <Icon name="cart" />
              <span>Carrito</span>
              <span className="sf-cart-count">{count}</span>
            </Link>
          </div>
        </div>
        <div className="sf-nav-border">
          <div className="sf-container sf-nav-row">
            <NavigationMenus />
            <nav className="sf-main-nav" aria-label="Tienda">
              <NavLink to="/" end>
                Inicio
              </NavLink>
              <NavLink to="/catalogo">Todos los productos</NavLink>
              <Link to={catalogHref({ category: 'discos' })}>
                Discos de corte
              </Link>
              <Link to={catalogHref({ wholesale: true })}>Por volumen</Link>
            </nav>
            <Link className="sf-wholesale-link" to="/catalogo?mayorista=1">
              <Icon name="stack" />
              Comprar por mayor
            </Link>
          </div>
        </div>
      </header>
      <CartFeedback message={message} />
    </>
  )
}
export function StoreLayout() {
  return (
    <CartProvider>
      <div className="storefront">
        <a href="#main" className="skip">
          Saltar al contenido
        </a>
        <Header />
        <main id="main" tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="sf-footer">
          <div className="sf-container sf-footer-grid">
            <div>
              <Link className="sf-brand" to="/">
                <span className="sf-brand-symbol">
                  a<span>↗</span>
                </span>
                <span>
                  all store<small>FERRETERÍA · CHILE</small>
                </span>
              </Link>
              <p>
                Soluciones para tus proyectos.
                <br />
                Al detalle y por mayor.
              </p>
            </div>
            <div>
              <h3>Explora</h3>
              <Link to="/catalogo">Todos los productos</Link>
              <Link to="/catalogo?mayorista=1">Compra por volumen</Link>
              <Link to="/carrito">Carrito de demostración</Link>
            </div>
            <div>
              <h3>Sobre esta tienda</h3>
              <p>
                Catálogo de referencia y ejemplos demostrativos.
                <br />
                Sin pagos, pedidos ni despacho habilitados.
              </p>
              <Link to="/admin">Administración demo ↗</Link>
            </div>
          </div>
          <div className="sf-container sf-footer-bottom">
            <span>Ferretería All Store Chile · Diseño en revisión</span>
            <span>Una experiencia simple, desde el primer clic.</span>
          </div>
        </footer>
        <StoreAssistant />
      </div>
    </CartProvider>
  )
}
