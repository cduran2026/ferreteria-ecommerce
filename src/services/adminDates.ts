const inputPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/
/** Las etiquetas administrativas expresan UTC: evitar reinterpretación de zona horaria. */
export function utcInput(value: string) {
  return inputPattern.test(value)
    ? value
    : new Date(value).toISOString().slice(0, 16)
}
export function utcValue(value: string) {
  return new Date(inputPattern.test(value) ? value + 'Z' : value).toISOString()
}
