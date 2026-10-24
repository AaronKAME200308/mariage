import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Gère le défilement vers les ancres (/#contact) et remonte en haut à chaque changement de page. */
export function ScrollToHash() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)))
      if (el) {
        el.scrollIntoView()
        return
      }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}
