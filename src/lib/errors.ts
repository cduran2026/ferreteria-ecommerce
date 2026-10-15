export function safeError(error: unknown) {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String(error.code)
      : ''
  if (code === '23505') return 'Ese SKU, código o identificador ya existe.'
  if (code === '23P01')
    return 'La vigencia se superpone con otro precio del mismo escalón.'
  if (code === '42501')
    return 'No tienes permisos para realizar esta operación.'
  if (code === '23514' || code === '22023' || code === '23503')
    return 'Revisa los datos y las relaciones antes de guardar.'
  return 'No pudimos completar la solicitud. Revisa la conexión al entorno local e inténtalo nuevamente.'
}
