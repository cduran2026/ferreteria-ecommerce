import type { Product, Category } from '../types/catalog'
import { storeProducts } from './catalog'
import { queryCatalog } from './catalogQuery'
import { brands, categoryTree, catalogHref } from './catalogTaxonomy'
import type { CartLine } from './demoCommerce'

export type AssistantView =
  'home' | 'search' | 'categories' | 'brands' | 'volume' | 'cart' | 'help'
export interface AssistantState {
  open: boolean
  view: AssistantView
  query: string
  searched: boolean
}
export const initialAssistantState: AssistantState = {
  open: false,
  view: 'home',
  query: '',
  searched: false,
}
export type AssistantAction =
  | { type: 'open' | 'close' | 'search' }
  | { type: 'view'; view: AssistantView }
  | { type: 'query'; value: string }
export function assistantReducer(
  state: AssistantState,
  action: AssistantAction,
): AssistantState {
  switch (action.type) {
    case 'open':
      return { ...state, open: true }
    case 'close':
      return { ...state, open: false }
    case 'view':
      return { ...state, view: action.view }
    case 'query':
      return { ...state, query: action.value, searched: false }
    case 'search':
      return { ...state, searched: Boolean(state.query.trim()) }
  }
}
export function assistantSearch(
  query: string,
  catalog: Product[] = storeProducts,
) {
  return query.trim() ? queryCatalog(catalog, { query }) : []
}
export function assistantSearchHref(query: string) {
  const params = new URLSearchParams({ q: query.trim() })
  return '/catalogo?' + params.toString()
}
export function assistantBrands(
  catalog: Product[] = storeProducts,
  names: readonly string[] = brands,
) {
  return names.map((name) => ({
    name,
    count: queryCatalog(catalog, { brand: name }).length,
    href: catalogHref({ brand: name }),
  }))
}
export function assistantCategories(
  catalog: Product[] = storeProducts,
  tree: Category[] = categoryTree,
) {
  const ordered = tree
  return ordered.map((category) => ({
    ...category,
    count: queryCatalog(catalog, { category: category.id }, tree).length,
    href: catalogHref({ category: category.id }),
  }))
}
export function assistantCartSummary(lines: CartLine[]) {
  return {
    products: new Set(lines.map((line) => line.productId)).size,
    presentations: lines.length,
    quantity: lines.reduce((sum, line) => sum + line.quantity, 0),
  }
}
