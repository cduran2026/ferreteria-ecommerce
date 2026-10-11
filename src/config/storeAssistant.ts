/** Configuración local: ninguna acción envía datos a servicios externos. */
export const storeAssistantConfig = {
  enabled: true,
  name: 'Toro Negro',
  avatar: { src: '', alt: 'Toro Negro, tu asistente de compras All Store' },
  commercialAvatarApproved: false,
  whatsapp: {
    number: '56928242288',
    approved: false,
    initialMessage:
      'Hola All Store Chile, quisiera orientación sobre sus productos.',
  },
}
export function whatsappContactUrl(message: string) {
  if (!storeAssistantConfig.whatsapp.approved) return null
  const params = new URLSearchParams({ text: message.trim() })
  return 'https://wa.me/' + storeAssistantConfig.whatsapp.number + '?' + params
}
