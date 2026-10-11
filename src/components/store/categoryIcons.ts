import type { IconName } from './Icon'
const categoryIcons: Record<string, IconName> = {
  herramientas: 'tools',
  discos: 'disc',
  perforacion: 'drill',
  elevacion: 'hoist',
  ferreteria: 'bolt',
  ruedas: 'wheel',
  cerraduras: 'lock',
  fijaciones: 'bolt',
  gasfiteria: 'faucet',
  griferia: 'faucet',
  jardin: 'leaf',
  pulverizacion: 'spray',
  construccion: 'building',
  selladores: 'sealant',
  seguridad: 'helmet',
}
export function categoryIcon(id?: string): IconName {
  return categoryIcons[id ?? ''] ?? 'tools'
}
