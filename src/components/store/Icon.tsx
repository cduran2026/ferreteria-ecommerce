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
  | 'disc'
  | 'drill'
  | 'hoist'
  | 'wheel'
  | 'lock'
  | 'bolt'
  | 'faucet'
  | 'leaf'
  | 'spray'
  | 'building'
  | 'sealant'
  | 'helmet'
  | 'tag'
  | 'chat'
  | 'stack'
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
  disc: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0M5 8l3-2M16 18l3-2',
  drill: 'M3 5h12v8H3V5M15 7h5v4h-5M20 9h3M6 13v8h5l1-8M6 17h5M2 7h1',
  hoist:
    'M3 3h18M8 3v5h8V3M8 8l4 4 4-4M12 12v3M12 15a3 3 0 1 1-3 3M5 3v8M19 3v8',
  wheel:
    'M4 3h12v4H4V3M10 7v4l5 2M20 17a5 5 0 1 1-10 0 5 5 0 0 1 10 0M15 17h.01M3 7v6h7',
  lock: 'M5 10h14v12H5V10M8 10V6a4 4 0 0 1 8 0v4M12 15v3',
  bolt: 'M8 2h8v4H8V2M9 6v12l3 4 3-4V6M8 10l8-2M8 14l8-2M8 18l8-2',
  faucet: 'M3 13h9V8h7v8h-5v-3M5 13v8M2 21h8M16 8V4M12 4h8M19 19v.01M17 21v.01',
  leaf: 'M20 3c-10-1-17 3-17 10a7 7 0 0 0 7 7c7 0 10-7 10-17M3 21l13-13M8 16V9M8 16h7',
  spray: 'M6 9h10v13H6V9M9 9V4h8v3h-4v2M17 4l3-2M18 6h4M17 8l3 2M9 13h4',
  building:
    'M3 22V7h10v15M13 11h8v11M1 22h22M6 10h.01M10 10h.01M6 14h.01M10 14h.01M6 18h4M16 14h2M16 18h2M6 3h7v4',
  sealant:
    'M4 13l11-8 4 5-11 8-4-5M15 5l2-3 2 1v3M8 18l-1 4M4 13H2v5h4M13 11l3 4',
  helmet:
    'M3 17v-3a9 9 0 0 1 18 0v3M10 5V3h4v2M7 7v7M17 7v7M2 17h20v4H2v-4M10 3v11M14 3v11',
  tag: 'M3 3h8l10 10-8 8L3 11V3M8 7h.01',
  chat: 'M21 11a9 9 0 0 1-9 9H3l2-5a9 9 0 1 1 16-4M7 11h.01M12 11h.01M17 11h.01',
  stack: 'M12 2l10 5-10 5L2 7l10-5M2 12l10 5 10-5M2 17l10 5 10-5',
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
