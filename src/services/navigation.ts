/** Sólo los cambios de página mueven el foco; los filtros no interrumpen escritura. */
export function shouldFocusPage(previous: string, next: string) {
  return previous !== next
}

/** Evita compartir la clave default entre rutas cargadas directamente. */
export function scrollEntryKey(location: {
  key: string
  pathname: string
  search: string
}) {
  return location.key + ':' + location.pathname + location.search
}
