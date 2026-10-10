import { Link } from 'react-router-dom'
import { products, categories } from '../../services/catalog'
import { ProductCard } from '../../components/store/ProductCard'
import { Icon } from '../../components/store/Icon'
import { WholesaleSection } from './WholesaleSection'
const categoryImages: Record<string, string> = {
  Herramientas: '/products/tools-demo.jpg',
  Fijaciones: '/products/screws-demo.jpg',
  Seguridad: '/products/gloves-demo.jpg',
}
export function HomePage() {
  return (
    <div className="sf-container">
      <section className="sf-hero">
        <div className="sf-hero-copy">
          <span className="sf-eyebrow">
            <span />
            HECHO PARA LOS QUE HACEN
          </span>
          <h1>
            Todo para tus proyectos,
            <br />
            <em>en un solo lugar.</em>
          </h1>
          <p>
            Herramientas, materiales y productos de ferretería para comprar al
            detalle o por mayor.
          </p>
          <div className="sf-hero-actions">
            <Link className="button sf-primary" to="/catalogo">
              Explorar productos
              <Icon name="arrow" />
            </Link>
            <Link className="sf-text-link" to="/catalogo?mayorista=1">
              Comprar por mayor
              <Icon name="arrow" />
            </Link>
          </div>
          <div className="sf-hero-foot">
            <Icon name="check" />
            Por unidad, caja o embalaje.
          </div>
        </div>
        <div className="sf-hero-visual">
          <img
            src="/products/drill-demo.jpg"
            alt="Imagen ilustrativa de taladro inalámbrico azul"
            width="540"
            height="540"
            fetchPriority="high"
          />
          <span className="sf-hero-caption">
            Herramientas para hacerlo posible.
            <small>Imagen ilustrativa · Producto demo</small>
          </span>
        </div>
      </section>
      <section className="sf-category-section">
        <div className="sf-section-heading">
          <div>
            <span className="sf-eyebrow">ENCUENTRA LO QUE NECESITAS</span>
            <h2>¿Qué tienes en mente?</h2>
          </div>
          <Link className="sf-text-link" to="/catalogo">
            Ver catálogo
            <Icon name="arrow" />
          </Link>
        </div>
        <div className="sf-categories">
          {categories.map((c) => (
            <Link
              className="sf-category-card"
              key={c}
              to={`/catalogo?categoria=${encodeURIComponent(c)}`}
            >
              <img
                src={categoryImages[c]}
                alt=""
                width="120"
                height="120"
                loading="lazy"
              />
              <div>
                <h3>
                  {c === 'Fijaciones'
                    ? 'Tornillos y fijaciones'
                    : c === 'Seguridad'
                      ? 'Seguridad industrial'
                      : c}
                </h3>
                <span>
                  Explorar productos
                  <Icon name="arrow" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="sf-section">
        <div className="sf-section-heading">
          <div>
            <span className="sf-eyebrow">PARA TU PRÓXIMO PROYECTO</span>
            <h2>Productos destacados</h2>
          </div>
          <Link className="sf-text-link" to="/catalogo">
            Ver todos
            <Icon name="arrow" />
          </Link>
        </div>
        <div className="sf-product-grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
      <WholesaleSection />
      <section className="sf-benefits" aria-label="Cómo comprar">
        <div>
          <Icon name="box" />
          <h3>Compra a tu medida</h3>
          <p>Elige la presentación que necesitas: unidad, caja o embalaje.</p>
        </div>
        <div>
          <Icon name="sliders" />
          <h3>Precios por volumen</h3>
          <p>Encuentra escalones de precio en productos seleccionados.</p>
        </div>
        <div>
          <Icon name="search" />
          <h3>Todo más fácil de encontrar</h3>
          <p>Explora categorías y filtra productos sin complicaciones.</p>
        </div>
      </section>
    </div>
  )
}
