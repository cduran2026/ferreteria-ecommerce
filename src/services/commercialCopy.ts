import type { Presentation, Product } from '../types/catalog'
/** Etiquetas de presentación, no reglas de precio ni cambios de inventario. */
export function presentationCount(p: Presentation, count: number) {
  const label = p.label.toLocaleLowerCase('es-CL')
  const noun = label.startsWith('caja')
    ? ['caja', 'cajas']
    : label.startsWith('embalaje')
      ? ['embalaje', 'embalajes']
      : label.startsWith('pack')
        ? ['pack', 'packs']
        : label.startsWith('par')
          ? ['par', 'pares']
          : label.startsWith('set')
            ? ['set', 'sets']
            : label.startsWith('unidad')
              ? ['unidad', 'unidades']
              : [p.label, p.label]
  return count + ' ' + noun[count === 1 ? 0 : 1]
}
export function contentsCount(product: Product, count: number) {
  // La presentación de un guante se inventaría como un par, no dos guantes.
  const single = product.presentations
    .find((p) => p.baseUnits === 1)
    ?.label.toLocaleLowerCase('es-CL')
  const noun = single?.startsWith('par')
    ? ['par', 'pares']
    : single?.startsWith('set')
      ? ['set', 'sets']
      : product.baseUnit === 'discos'
        ? ['disco', 'discos']
        : product.baseUnit === 'ruedas'
          ? ['rueda', 'ruedas']
          : ['unidad', 'unidades']
  return count + ' ' + noun[count === 1 ? 0 : 1]
}
export function equivalenceCopy(
  product: Product,
  presentation: Presentation,
  quantity: number,
  units: number,
) {
  return (
    presentationCount(presentation, quantity) +
    ' = ' +
    contentsCount(product, units)
  )
}
