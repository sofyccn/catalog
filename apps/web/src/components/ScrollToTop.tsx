import { useEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/**
 * BrowserRouter keeps the previous page's scroll position, so opening a
 * product from far down the catalog (or from "Productos relacionados") landed
 * on the footer. Scroll to top when moving to a different page; back/forward
 * (POP) is left alone so returning to the catalog keeps your place. Changes to
 * the query string alone (catalog filters, page number) don't count: the page
 * handles its own scrolling there.
 */
export function ScrollToTop() {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()
  const prevPathname = useRef(pathname)

  useEffect(() => {
    if (prevPathname.current !== pathname && navigationType !== 'POP') window.scrollTo(0, 0)
    prevPathname.current = pathname
  }, [pathname, navigationType])

  return null
}
