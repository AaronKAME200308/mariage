/** Balises <meta> gérées côté client (SPA). Les robots qui n'exécutent pas JavaScript ne les voient pas. */
function setMeta(attr: 'name' | 'property', key: string, content: string | null) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (content === null) { el?.remove(); return }
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el) }
  el.setAttribute('content', content)
}

export function applySeo(opts: { title: string; description: string; image?: string | null; noindex?: boolean; url?: string }) {
  document.title = opts.title
  setMeta('name', 'description', opts.description)
  setMeta('property', 'og:type', 'website')
  setMeta('property', 'og:title', opts.title)
  setMeta('property', 'og:description', opts.description)
  setMeta('property', 'og:url', opts.url ?? null)
  setMeta('property', 'og:image', opts.image ?? null)
  setMeta('name', 'robots', opts.noindex ? 'noindex, nofollow' : null)
}

export const PRIVATE_PREFIXES = ['/admin', '/couple', '/hotesse', '/acces/', '/exemples', '/connexion', '/mot-de-passe-oublie', '/reinitialiser-mot-de-passe', '/acces-refuse']
