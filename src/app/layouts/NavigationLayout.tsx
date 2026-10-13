import { useEffect, useRef } from 'react'
import {
  Outlet,
  ScrollRestoration,
  useLocation,
  useNavigationType,
} from 'react-router-dom'
import { shouldFocusPage, scrollEntryKey } from '../../services/navigation'
export function NavigationLayout() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const previousPath = useRef(location.pathname)
  const origins = useRef(new Map<string, { href: string; className: string }>())
  useEffect(() => {
    const rememberLink = (event: MouseEvent) => {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return
      const link =
        event.target instanceof Element ? event.target.closest('a[href]') : null
      if (link)
        origins.current.set(location.key, {
          href: link.getAttribute('href')!,
          className: link.className,
        })
    }
    document.addEventListener('click', rememberLink, true)
    return () => document.removeEventListener('click', rememberLink, true)
  }, [location.key])
  useEffect(() => {
    if (shouldFocusPage(previousPath.current, location.pathname)) {
      const origin =
        navigationType === 'POP' ? origins.current.get(location.key) : undefined
      const returnLink =
        origin &&
        Array.from(
          document.querySelectorAll<HTMLAnchorElement>('a[href]'),
        ).find(
          (link) =>
            link.getAttribute('href') === origin.href &&
            link.className === origin.className,
        )
      const heading = document.querySelector<HTMLElement>('main h1, h1')
      if (returnLink) returnLink.focus({ preventScroll: true })
      else if (heading) {
        heading.tabIndex = -1
        heading.focus({ preventScroll: true })
      }
    }
    previousPath.current = location.pathname
  }, [location.pathname, location.key, navigationType])
  return (
    <>
      <Outlet />
      <ScrollRestoration
        storageKey="allstore.scroll.v1"
        getKey={scrollEntryKey}
      />
    </>
  )
}
