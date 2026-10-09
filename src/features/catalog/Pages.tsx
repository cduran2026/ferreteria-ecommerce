import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  categories,
  filterProducts,
  money,
  products,
  baseQuantity,
} from '../../services/catalog'
import { ProductCard } from '../../components/store/ProductCard'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  Select,
} from '../../components/ui'
export function HomePage() {
  return (
    <div className="container">
      <section className="hero">
        <div>
          <Badge>PARA LOS QUE HACEN</Badge>
          <h1>
            Tu próximo proyecto
            <br />
            <span>empieza aquí.</span>
          </h1>
          <p>
            Herramientas, materiales y soluciones.
            <br />
            Por unidad o por caja, a tu medida.
          </p>
          <Link className="button" to="/catalogo">
            Explorar catálogo →
          </Link>
          <small>Selección ilustrativa · Marca provisional</small>
        </div>
        <div className="hero-art">
          <span className="hero-circle" />
          <img
            src="/products/drill.svg"
            alt="Ilustración de taladro inalámbrico"
          />
          <span className="hero-note">
            TODO PARA
            <br />
            <strong>hacerlo posible.</strong>
          </span>
        </div>
      </section>
      <div className="benefits">
        <div>
          <strong>01 / Compra a tu medida</strong>
          <p>Unidad, caja y embalaje</p>
        </div>
        <div>
          <strong>02 / Encuentra lo que necesitas</strong>
          <p>Categorías y búsqueda sencilla</p>
        </div>
        <div>
          <strong>03 / Una tienda cercana</strong>
          <p>Pensada para tus proyectos</p>
        </div>
      </div>
      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">EQUIPA TU PRÓXIMO PROYECTO</span>
            <h2>Productos destacados</h2>
          </div>
          <Link to="/catalogo">Ver todos →</Link>
        </div>
        <div className="product-grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
      <section className="category-banner">
        <div>
          <span className="eyebrow">
            DE PEQUEÑAS REPARACIONES A GRANDES IDEAS
          </span>
          <h2>Una solución para cada trabajo.</h2>
        </div>
        <div className="category-links">
          {categories.map((c) => (
            <Link key={c} to={`/catalogo?categoria=${encodeURIComponent(c)}`}>
              {c} ↗
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
export function CatalogPage() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const category = params.get('categoria') ?? ''
  const max = params.get('max') ?? ''
  const found = filterProducts(q, category, max ? Number(max) : Infinity)
  const update = (name: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(name, value)
    else next.delete(name)
    setParams(next)
  }
  return (
    <div className="container section">
      <p className="breadcrumb">
        <Link to="/">Inicio</Link> / Catálogo
      </p>
      <h1>Todo para tu proyecto</h1>
      <p className="muted">Explora nuestro catálogo demostrativo.</p>
      <div className="catalog-layout">
        <Card className="filters">
          <h2>Filtros</h2>
          <label>
            Buscar
            <Input value={q} onChange={(e) => update('q', e.target.value)} />
          </label>
          <label>
            Categoría
            <Select
              value={category}
              onChange={(e) => update('categoria', e.target.value)}
            >
              <option value="">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </label>
          <label>
            Precio máximo
            <Select value={max} onChange={(e) => update('max', e.target.value)}>
              <option value="">Sin límite</option>
              <option value="10000">$10.000</option>
              <option value="30000">$30.000</option>
              <option value="70000">$70.000</option>
            </Select>
          </label>
          <Button className="secondary" onClick={() => setParams({})}>
            Limpiar filtros
          </Button>
        </Card>
        <div>
          <p role="status" className="muted">
            {found.length} productos · Precios de ejemplo en CLP
          </p>
          <div className="product-grid catalog-grid">
            {found.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          {!found.length && (
            <EmptyState>
              No encontramos productos. Prueba otros filtros.
            </EmptyState>
          )}
        </div>
      </div>
    </div>
  )
}
export function ProductPage() {
  const { id } = useParams()
  const p = products.find((product) => product.id === id)
  const [presentationId, setPresentation] = useState('unidad')
  const [quantity, setQuantity] = useState(1)
  const [message, setMessage] = useState('')
  const [view, setView] = useState(0)
  if (!p)
    return (
      <div className="container section">
        <EmptyState>
          Producto no encontrado. <Link to="/catalogo">Volver al catálogo</Link>
        </EmptyState>
      </div>
    )
  const presentation =
    p.presentations.find((item) => item.id === presentationId) ??
    p.presentations[0]
  const valid = Number.isSafeInteger(quantity) && quantity > 0
  const enough =
    valid && baseQuantity(quantity, presentation.baseUnits) <= p.stock
  return (
    <div className="container section">
      <p className="breadcrumb">
        <Link to="/catalogo">Catálogo</Link> / {p.category} / {p.name}
      </p>
      <div className="detail">
        <Card className="gallery">
          <img
            className={view ? 'zoom-image' : ''}
            src={p.image}
            alt={`${p.name}, ${view ? 'detalle de ilustración' : 'vista principal'}`}
          />
          <div className="thumbnails">
            {['Vista principal', 'Detalle ilustrado'].map((label, i) => (
              <button
                aria-pressed={view === i}
                onClick={() => setView(i)}
                key={label}
              >
                <img src={p.image} alt="" />
                {label}
              </button>
            ))}
          </div>
          <small>
            Ilustraciones de referencia; no fotografías comerciales.
          </small>
        </Card>
        <Card className="product-info">
          <span className="eyebrow">
            {p.category} · {p.sku}
          </span>
          <h1>{p.name}</h1>
          <strong className="price">{money(presentation.price)}</strong>
          <p className="stock">{p.stock} unidades base · Stock de ejemplo</p>
          <label>
            Presentación
            <Select
              value={presentation.id}
              onChange={(e) => setPresentation(e.target.value)}
            >
              {p.presentations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </Select>
          </label>
          <label>
            Cantidad
            <Input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </label>
          <p>
            Total ilustrativo:{' '}
            <strong>
              {valid ? money(presentation.price * quantity) : '—'}
            </strong>
          </p>
          {!enough && (
            <p role="alert">
              La cantidad supera el stock de ejemplo o no es válida.
            </p>
          )}
          <Button
            disabled={!enough}
            onClick={() => setMessage('Agregar al carrito')}
          >
            Agregar al carrito · Demo
          </Button>
          <Button
            disabled={!enough}
            className="secondary"
            onClick={() => setMessage('Comprar ahora')}
          >
            Comprar ahora · Demo
          </Button>
          <small>Sin carrito persistente ni pagos habilitados.</small>
        </Card>
      </div>
      <Card className="description">
        <h2>Descripción y especificaciones</h2>
        <p>{p.description}</p>
        <p>
          Equivalencia de la presentación: {presentation.baseUnits} unidades
          base.
        </p>
      </Card>
      {message && (
        <Modal
          title={`${message}: vista demostrativa`}
          onClose={() => setMessage('')}
        >
          <p>No se ha creado una compra ni se ha modificado inventario.</p>
        </Modal>
      )}
    </div>
  )
}
