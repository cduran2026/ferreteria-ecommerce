import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { categories, filterProducts } from '../../services/catalog'
import { tiersFor } from '../../services/demoCommerce'
import { ProductCard } from '../../components/store/ProductCard'
import { Icon } from '../../components/store/Icon'
import { Button, Input, Select } from '../../components/ui'
export function CatalogPage() {
  const [params, setParams] = useSearchParams(),
    [open, setOpen] = useState(false)
  const q = params.get('q') ?? '',
    category = params.get('categoria') ?? '',
    max = params.get('max') ?? '',
    sort = params.get('orden') ?? 'recommended',
    wholesale = params.get('mayorista') === '1'
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next)
  }
  const found = filterProducts(
    q,
    category,
    max ? Number(max) : Infinity,
  ).filter(
    (p) => !wholesale || p.presentations.some((x) => tiersFor(x).length > 1),
  )
  if (sort === 'price-up')
    found.sort((a, b) => a.presentations[0].price - b.presentations[0].price)
  if (sort === 'price-down')
    found.sort((a, b) => b.presentations[0].price - a.presentations[0].price)
  if (sort === 'name') found.sort((a, b) => a.name.localeCompare(b.name, 'es'))
  return (
    <div className="sf-container sf-page">
      <p className="sf-breadcrumb">
        <Link to="/">Inicio</Link>
        <span>/</span>Catálogo
      </p>
      <div className="sf-page-heading">
        <h1>{wholesale ? 'Compra por mayor' : 'Encuentra lo que necesitas'}</h1>
        <p>Tu próximo proyecto empieza con el producto correcto.</p>
      </div>
      <div className="sf-catalog-layout">
        <aside className={`sf-filters ${open ? 'is-open' : ''}`}>
          <div className="sf-filter-title">
            <h2>Filtrar productos</h2>
            <Button
              className="sf-icon-button sf-mobile-only"
              aria-label="Cerrar filtros"
              onClick={() => setOpen(false)}
            >
              <Icon name="close" />
            </Button>
          </div>
          <label>
            Buscar
            <Input
              value={q}
              onChange={(e) => update('q', e.target.value)}
              placeholder="Nombre, producto o SKU"
            />
          </label>
          <fieldset>
            <legend>Categoría</legend>
            <label className="sf-radio">
              <input
                type="radio"
                name="category"
                checked={!category}
                onChange={() => update('categoria', '')}
              />
              Todas las categorías
            </label>
            {categories.map((c) => (
              <label className="sf-radio" key={c}>
                <input
                  type="radio"
                  name="category"
                  checked={category === c}
                  onChange={() => update('categoria', c)}
                />
                {c}
              </label>
            ))}
          </fieldset>
          <label>
            Precio máximo por presentación
            <Input
              type="number"
              min="0"
              value={max}
              onChange={(e) => update('max', e.target.value)}
              placeholder="Sin límite"
            />
          </label>
          <label className="sf-radio">
            <input
              type="checkbox"
              checked={wholesale}
              onChange={(e) => update('mayorista', e.target.checked ? '1' : '')}
            />
            Con precios por volumen
          </label>
          <Button className="secondary" onClick={() => setParams({})}>
            Limpiar filtros
          </Button>
          <Button className="sf-mobile-only" onClick={() => setOpen(false)}>
            Ver {found.length} productos
          </Button>
          <p className="sf-muted">
            Precios y stock ilustrativos.
            <br />
            No constituyen ofertas comerciales.
          </p>
        </aside>
        <section className="sf-catalog-results" aria-label="Resultados">
          <div className="sf-catalog-toolbar">
            <span role="status">
              {found.length} {found.length === 1 ? 'producto' : 'productos'}
            </span>
            <Button
              className="secondary sf-mobile-only"
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              <Icon name="sliders" />
              Filtros
            </Button>
            <label>
              Ordenar
              <Select
                value={sort}
                onChange={(e) => update('orden', e.target.value)}
              >
                <option value="recommended">Recomendados</option>
                <option value="price-up">Menor precio</option>
                <option value="price-down">Mayor precio</option>
                <option value="name">Nombre</option>
              </Select>
            </label>
          </div>
          {(q || category || max || wholesale) && (
            <div className="sf-active-filters">
              <span>{q ? `Búsqueda: ${q}` : 'Filtros aplicados'}</span>
              <Button className="sf-link-button" onClick={() => setParams({})}>
                Borrar filtros
              </Button>
            </div>
          )}
          <div className="sf-product-grid sf-catalog-grid">
            {found.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          {!found.length && (
            <div className="sf-empty">
              <Icon name="search" width="40" height="40" />
              <h2>No encontramos productos</h2>
              <p>Prueba otra búsqueda o cambia los filtros.</p>
              <Button onClick={() => setParams({})}>
                Ver todos los productos
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
