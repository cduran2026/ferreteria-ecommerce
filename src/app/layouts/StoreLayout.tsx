import { Form, Link, NavLink, Outlet } from 'react-router-dom'
import { categories } from '../../services/catalog'
import { Input, Button } from '../../components/ui'
export function StoreLayout() {
  return (
    <>
      <a href="#main" className="skip">
        Saltar al contenido
      </a>
      <div className="demo-strip">
        PROTOTIPO · Datos e interacciones de demostración · Sin compras reales
      </div>
      <header className="store-header">
        <div className="container header-row">
          <Link className="brand" to="/">
            <span className="brand-mark">
              AS<span>↗</span>
            </span>
            <span>
              ALL STORE<small>FERRETERÍA · CHILE</small>
            </span>
          </Link>
          <Form action="/catalogo" className="search" role="search">
            <Input
              name="q"
              aria-label="Buscar productos"
              placeholder="¿Qué necesitas para tu próximo proyecto?"
            />
            <Button type="submit" aria-label="Buscar">
              ⌕
            </Button>
          </Form>
          <Link className="cart-link" to="/carrito">
            Carrito <span>Demo</span>
          </Link>
        </div>
        <nav className="container store-nav" aria-label="Tienda">
          <NavLink to="/" end>
            Inicio
          </NavLink>
          <NavLink to="/catalogo">Todos los productos</NavLink>
          {categories.map((c) => (
            <Link key={c} to={`/catalogo?categoria=${encodeURIComponent(c)}`}>
              {c}
            </Link>
          ))}
          <Link className="admin-link" to="/admin">
            Administración demo ↗
          </Link>
        </nav>
      </header>
      <main id="main">
        <Outlet />
      </main>
      <footer>
        <div className="container footer-row">
          <div>
            <strong>Ferretería All Store Chile</strong>
            <p>Una nueva tienda para construir tus proyectos.</p>
          </div>
          <p>
            Identidad provisional · Etapa 01
            <br />
            Catálogo ilustrativo, sin venta ni pagos habilitados.
          </p>
        </div>
      </footer>
    </>
  )
}
