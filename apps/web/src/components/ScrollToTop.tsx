import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/**
 * BrowserRouter keeps the previous page's scroll position, so opening a
 * product from far down the catalog (or from "Productos relacionados") landed
 * on the footer. Scroll to top on every new navigation; back/forward (POP) is
 * left alone so returning to the catalog keeps your place.
 */
export function ScrollToTop() {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    if (navigationType !== 'POP') window.scrollTo(0, 0)
  }, [pathname, navigationType])

  return null
}
