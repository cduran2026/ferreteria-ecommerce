import { useCatalog } from './context'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { queryCatalog, readCatalogFilters } from '../../services/catalogQuery'
import { ProductCard } from '../../components/store/ProductCard'
import { Icon } from '../../components/store/Icon'
import { Button, Input, Select } from '../../components/ui'
export function CatalogPage() {
  const { products: storeProducts, categoryTree, brands, mode } = useCatalog()
  const [params, setParams] = useSearchParams(),
    [open, setOpen] = useState(false)
  const filters = readCatalogFilters(params)
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { preventScrollReset: true })
  }
  const found = queryCatalog(storeProducts, filters, categoryTree)
  const active = [
    'q',
    'categoria',
    'marca',
    'min',
    'max',
    'disponibilidad',
    'mayorista',
  ].some((k) => params.has(k))
  const title = filters.brand
    ? `Productos ${filters.brand}`
    : filters.category
      ? (categoryTree.find((c) => c.id === filters.category)?.name ??
        'Catálogo')
      : filters.wholesale
        ? 'Compra por volumen'
        : 'Todo para tu proyecto'
  return (
    <div className="sf-container sf-page sf-commercial-catalog">
      <p className="sf-breadcrumb">
        <Link to="/">Inicio</Link>
        <span>/</span>Catálogo
        {filters.brand && (
          <>
            <span>/</span>
            {filters.brand}
          </>
        )}
      </p>
      <div className="sf-page-heading">
        <span className="sf-eyebrow">EXPLORA · COMPARA · ELIGE</span>
        <h1>{title}</h1>
        <p>
          {mode === 'demo'
            ? 'Referencias comerciales y ejemplos de compra. Precios y stock demo identificados.'
            : 'Catálogo de Supabase local. Revisa presentación, precio y disponibilidad; compra aún no habilitada.'}
        </p>
      </div>
      <div className="sf-catalog-layout">
        <aside
          id="catalog-filters"
          className={`sf-filters ${open ? 'is-open' : ''}`}
          aria-label="Filtros de catálogo"
        >
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
            Buscar en catálogo
            <Input
              value={filters.query}
              onChange={(e) => update('q', e.target.value)}
              placeholder="Producto, marca o SKU"
            />
          </label>
          <label>
            Categoría
            <Select
              value={filters.category}
              onChange={(e) => update('categoria', e.target.value)}
            >
              <option value="">Todas las categorías</option>
              {categoryTree.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.parent_id ? '— ' : ''}
                  {c.name}
                </option>
              ))}
            </Select>
          </label>
          <label>
            Marca
            <Select
              value={filters.brand}
              onChange={(e) => update('marca', e.target.value)}
            >
              <option value="">Todas las marcas</option>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </Select>
          </label>
          <fieldset className="sf-price-range">
            <legend>Precio por presentación</legend>
            <label>
              Desde
              <Input
                type="number"
                min="0"
                value={params.get('min') ?? ''}
                placeholder="Sin mínimo"
                onChange={(e) => update('min', e.target.value)}
              />
            </label>
            <label>
              Hasta
              <Input
                type="number"
                min="0"
                value={params.get('max') ?? ''}
                placeholder="Sin máximo"
                onChange={(e) => update('max', e.target.value)}
              />
            </label>
          </fieldset>
          <label>
            Disponibilidad
            <Select
              value={filters.availability}
              onChange={(e) => update('disponibilidad', e.target.value)}
            >
              <option value="">Todas</option>
              <option value="available">
                {mode === 'demo' ? 'Disponible en demo' : 'Disponible'}
              </option>
              <option value="unavailable">
                {mode === 'demo'
                  ? 'Sin disponibilidad demo'
                  : 'Sin disponibilidad'}
              </option>
              <option value="unknown">Por confirmar</option>
            </Select>
          </label>
          <label className="sf-radio">
            <input
              type="checkbox"
              checked={filters.wholesale}
              onChange={(e) => update('mayorista', e.target.checked ? '1' : '')}
            />
            Con precios por volumen
          </label>
          <Button
            className="secondary"
            onClick={() => setParams({}, { preventScrollReset: true })}
          >
            Limpiar filtros
          </Button>
          <Button className="sf-mobile-only" onClick={() => setOpen(false)}>
            Ver {found.length} {found.length === 1 ? 'producto' : 'productos'}
          </Button>
          <p className="sf-muted">
            Los rangos y el orden de precio utilizan una presentación de cada
            producto. Los productos sin precio se excluyen del rango.
          </p>
        </aside>
        <section className="sf-catalog-results" aria-label="Resultados">
          <div className="sf-catalog-toolbar">
            <span role="status">
              {found.length} {found.length === 1 ? 'producto' : 'productos'}
            </span>
            <Button
              className="secondary sf-mobile-only"
              aria-controls="catalog-filters"
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              <Icon name="sliders" />
              Filtros
            </Button>
            <label>
              Ordenar
              <Select
                value={filters.sort}
                onChange={(e) => update('orden', e.target.value)}
              >
                <option value="featured">Destacados</option>
                <option value="newest">Novedades del catálogo</option>
                <option value="price-up">Menor precio</option>
                <option value="price-down">Mayor precio</option>
                <option value="name">Nombre</option>
              </Select>
            </label>
          </div>
          {active && (
            <div className="sf-active-filters">
              <span>
                {[
                  filters.query,
                  filters.brand,
                  categoryTree.find((c) => c.id === filters.category)?.name,
                ]
                  .filter(Boolean)
                  .join(' · ') || 'Filtros aplicados'}
              </span>
              <Button
                className="sf-link-button"
                onClick={() => setParams({}, { preventScrollReset: true })}
              >
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
              <p>
                {filters.brand === 'Stanford' ||
                filters.brand === 'Rex' ||
                filters.brand === 'Akilda'
                  ? 'Estamos preparando el catálogo de esta marca.'
                  : 'Prueba otra búsqueda o ajusta los filtros.'}
              </p>
              <Button
                onClick={() => setParams({}, { preventScrollReset: true })}
              >
                Ver todos los productos
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
