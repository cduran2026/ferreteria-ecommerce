import { createContext, useContext } from 'react'
import { storeProducts } from '../../services/catalog'
import { categoryTree, brands } from '../../services/catalogTaxonomy'
import type { Product, Category } from '../../types/catalog'
export interface CatalogState {
  products: Product[]
  categoryTree: Category[]
  rootCategories: Category[]
  brands: readonly string[]
  mode: 'demo' | 'supabase' | 'invalid'
  loading: boolean
  error: string
  reload: () => void
}
export const CatalogContext = createContext<CatalogState>({
  products: storeProducts,
  categoryTree,
  rootCategories: categoryTree.filter((c) => !c.parent_id),
  brands,
  mode: 'demo',
  loading: false,
  error: '',
  reload: () => {},
})
export const useCatalog = () => useContext(CatalogContext)
