/** Sólo los cambios de página mueven el foco; los filtros no interrumpen escritura. */
export function shouldFocusPage(previous: string, next: string) {
  return previous !== next
}
