import { brandLogos } from '../../config/brandLogos'
import { Link } from 'react-router-dom'
import { storeProducts } from '../../services/catalog'
import {
  brands,
  rootCategories,
  catalogHref,
} from '../../services/catalogTaxonomy'
import { ProductCard } from '../../components/store/ProductCard'
import { Icon } from '../../components/store/Icon'
import { categoryIcon } from '../../components/store/categoryIcons'
import { WholesaleSection } from './WholesaleSection'
function Shelf({
  id,
  title,
  subtitle,
  items,
  to,
}: {
  id: string
  title: string
  subtitle: string
  items: typeof storeProducts
  to: string
}) {
  return (
    <section className="sf-commercial-shelf" aria-labelledby={id}>
      <div className="sf-section-heading">
        <div>
          <span className="sf-eyebrow">{subtitle}</span>
          <h2 id={id}>{title}</h2>
        </div>
        <Link className="sf-text-link" to={to}>
          Ver productos
          <Icon name="arrow" />
        </Link>
      </div>
      <div className="sf-product-grid">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}
export function HomePage() {
  const discs = storeProducts.filter((p) => p.categoryId === 'discos')
  const featured = storeProducts.filter(
    (p) => p.dataKind === 'reference' && p.categoryId !== 'discos',
  )
  const volume = storeProducts.filter((p) => p.dataKind === 'demo')
  return (
    <div className="sf-container sf-commercial-home">
      <section className="sf-promo-strip" aria-labelledby="home-heading">
        <div>
          <span className="sf-eyebrow">
            ALL STORE · AL DETALLE Y POR VOLUMEN
          </span>
          <h1 id="home-heading">Encuentra lo que mueve tu proyecto.</h1>
        </div>
        <Link to={catalogHref({ category: 'discos' })} className="button">
          Explorar discos
          <Icon name="arrow" />
        </Link>
      </section>
      <Shelf
        id="discs-title"
        title="Discos de corte"
        subtitle="Una familia protagonista"
        items={discs}
        to={catalogHref({ category: 'discos' })}
      />
      <section className="sf-brand-section" aria-label="Explorar por marca">
        <div>
          <h2>Tus marcas, más cerca</h2>
          <p>Explora nuestro catálogo por marca.</p>
        </div>
        <div className="sf-brand-grid">
          {brands.map((b) => (
            <Link
              to={catalogHref({ brand: b })}
              key={b}
              aria-label={`Explorar productos de ${b}`}
              title={b}
            >
              {brandLogos[b] ? (
                <img
                  className="sf-official-brand-logo"
                  src={brandLogos[b]}
                  alt={b}
                  width="850"
                  height="567"
                  loading="lazy"
                />
              ) : (
                <strong>{b}</strong>
              )}
              <Icon name="arrow" />
            </Link>
          ))}
        </div>
      </section>
      <Shelf
        id="featured-title"
        title="Destacados para tu proyecto"
        subtitle="Referencias del catálogo · Datos por confirmar"
        items={featured}
        to="/catalogo?orden=featured"
      />
      <Shelf
        id="volume-title"
        title="Explora la compra por volumen"
        subtitle="Prueba el carrito con estos ejemplos"
        items={volume}
        to={catalogHref({ wholesale: true })}
      />
      <section className="sf-offers-ready" aria-labelledby="offers-heading">
        <Icon name="check" />
        <div>
          <h2 id="offers-heading">Ofertas claras, cuando estén disponibles</h2>
          <p>
            No hay ofertas publicadas. Aquí encontrarás promociones con precio y
            vigencia confirmados.
          </p>
        </div>
        <Link to="/catalogo" className="sf-text-link">
          Explorar catálogo
          <Icon name="arrow" />
        </Link>
      </section>
      <section
        className="sf-additional-categories"
        aria-labelledby="categories-heading"
      >
        <div className="sf-section-heading">
          <h2 id="categories-heading">Más para explorar</h2>
        </div>
        <div className="sf-category-links">
          {rootCategories.map((c) => (
            <Link key={c.id} to={catalogHref({ category: c.id })}>
              <Icon name={categoryIcon(c.id)} />
              <strong>{c.name}</strong>
              <Icon name="arrow" />
            </Link>
          ))}
        </div>
      </section>
      <WholesaleSection />
      <section className="sf-benefits" aria-label="Cómo comprar">
        <div>
          <Icon name="box" />
          <h3>La presentación correcta</h3>
          <p>Compara unidad, caja o pack según cada producto.</p>
        </div>
        <div>
          <Icon name="sliders" />
          <h3>Precios por volumen</h3>
          <p>Revisa cantidades y equivalencias antes de agregar.</p>
        </div>
        <div>
          <Icon name="search" />
          <h3>Encuentra más rápido</h3>
          <p>Explora por familia, marca y disponibilidad.</p>
        </div>
      </section>
    </div>
  )
}
