import { useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  brands,
  rootCategories,
  categoryTree,
  catalogHref,
} from '../../services/catalogTaxonomy'
import { Icon } from './Icon'
export function NavigationMenus() {
  const categoryRef = useRef<HTMLDetailsElement>(null),
    brandRef = useRef<HTMLDetailsElement>(null)
  const close = () => {
    if (categoryRef.current) categoryRef.current.open = false
    if (brandRef.current) brandRef.current.open = false
  }
  const escape = (e: React.KeyboardEvent<HTMLDetailsElement>) => {
    if (e.key === 'Escape') {
      e.currentTarget.open = false
      e.currentTarget.querySelector('summary')?.focus()
    }
  }
  return (
    <>
      <details
        ref={categoryRef}
        className="sf-category-menu sf-tree-menu"
        onKeyDown={escape}
        onToggle={() => {
          if (categoryRef.current?.open && brandRef.current)
            brandRef.current.open = false
        }}
      >
        <summary>
          <Icon name="menu" />
          Categorías
          <Icon name="chevron" />
        </summary>
        <nav aria-label="Menú de categorías" className="sf-category-tree">
          <Link className="sf-menu-all" to="/catalogo" onClick={close}>
            Todo el catálogo
            <Icon name="arrow" />
          </Link>
          {rootCategories.map((c) => (
            <div key={c.id}>
              <Link
                className="sf-menu-parent"
                to={catalogHref({ category: c.id })}
                onClick={close}
              >
                {c.name}
              </Link>
              {categoryTree
                .filter((child) => child.parent_id === c.id)
                .map((child) => (
                  <Link
                    key={child.id}
                    to={catalogHref({ category: child.id })}
                    onClick={close}
                  >
                    {child.name}
                  </Link>
                ))}
            </div>
          ))}
        </nav>
      </details>
      <details
        ref={brandRef}
        className="sf-category-menu sf-brands-menu"
        onKeyDown={escape}
        onToggle={() => {
          if (brandRef.current?.open && categoryRef.current)
            categoryRef.current.open = false
        }}
      >
        <summary>
          Marcas
          <Icon name="chevron" />
        </summary>
        <nav aria-label="Menú de marcas">
          {brands.map((b) => (
            <Link key={b} to={catalogHref({ brand: b })} onClick={close}>
              {b}
              <Icon name="arrow" />
            </Link>
          ))}
        </nav>
      </details>
    </>
  )
}
