/** Bordes del recorrido de teclado de un panel modal. */
export function assistantFocusDestination(
  shift: boolean,
  current: number,
  count: number,
) {
  if (!count) return null
  if (shift && current <= 0) return count - 1
  if (!shift && (current < 0 || current === count - 1)) return 0
  return null
}
