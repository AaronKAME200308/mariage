/**
 * Grain de papier : petite image SVG de bruit, générée par le code (aucun fichier à fournir),
 * répétée en mosaïque. `clair` = points blancs (sur papier sombre), `sombre` = points noirs (sur papier clair).
 */
export function grain(ton: 'clair' | 'sombre', opacite = 0.55): string {
  const c = ton === 'clair' ? '1 1 1' : '0 0 0'
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240">` +
    `<filter id="n" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/>` +
    `<feColorMatrix values="0 0 0 0 ${c.split(' ')[0]} 0 0 0 0 ${c.split(' ')[1]} 0 0 0 0 ${c.split(' ')[2]} 0 0 0 ${opacite} 0"/></filter>` +
    `<rect width="100%" height="100%" filter="url(#n)"/></svg>`
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`
}
