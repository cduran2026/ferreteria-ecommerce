import type { SVGProps } from 'react'
export type IconName =
  | 'search'
  | 'cart'
  | 'menu'
  | 'arrow'
  | 'close'
  | 'box'
  | 'tools'
  | 'shield'
  | 'check'
  | 'minus'
  | 'plus'
  | 'user'
  | 'sliders'
  | 'chevron'
const paths: Record<IconName, string> = {
  search: 'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  cart: 'M2 3h3l3 12h11l3-9H6M9 21h.01M19 21h.01',
  menu: 'M3 6h18M3 12h18M3 18h18',
  arrow: 'M4 12h16M14 6l6 6-6 6',
  close: 'M6 6l12 12M6 18L18 6',
  box: 'M12 3l9 5v9l-9 5-9-5V8l9-5M3 8l9 5 9-5M12 13v9M7 5l10 6',
  tools:
    'M14 4a6 6 0 0 0-7 7L2 16a3 3 0 0 0 4 4l5-5a6 6 0 0 0 7-7l-4 4-3-3 3-5',
  shield: 'M12 2l8 4v6c0 5-8 10-8 10S4 17 4 12V6l8-4M8 12l3 3 5-6',
  check: 'M4 12l5 5L20 6',
  minus: 'M5 12h14',
  plus: 'M5 12h14M12 5v14',
  user: 'M4 21v-2a8 8 0 0 1 16 0v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  sliders: 'M3 6h5m5 0h8M3 18h11m5 0h2M8 3v6m5 6v6',
  chevron: 'M6 9l6 6 6-6',
}
export function Icon({
  name,
  ...props
}: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  )
}
