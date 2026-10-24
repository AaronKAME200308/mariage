import { useId } from 'react'

interface Couleurs { cire: string; cireClair: string; cireOmbre: string; encre: string }

/** Contour irrégulier de cire (courbe lissée passant par 14 points). */
function contour(): string {
  const n = 14
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2
    const r = 43 + Math.sin(i * 2.7) * 2.2 + Math.cos(i * 1.3) * 1.6
    return [50 + Math.cos(a) * r, 50 + Math.sin(a) * r] as const
  })
  let d = `M${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n]
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${c1[0].toFixed(2)} ${c1[1].toFixed(2)} ${c2[0].toFixed(2)} ${c2[1].toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`
  }
  return d + 'Z'
}
const CONTOUR = contour()

/** Sceau de cire en relief. `moitie` ne dessine que la moitié gauche ou droite (pour la fissure). */
export default function Sceau({ initiales, couleurs, moitie }: { initiales: [string, string]; couleurs: Couleurs; moitie?: 'g' | 'd' }) {
  const id = useId().replace(/:/g, '')
  const [a, b] = initiales
  const texte = (dx: number, dy: number, fill: string, op = 1) => (
    <g fill={fill} opacity={op} transform={`translate(${dx} ${dy})`} fontFamily="'Playfair Display', Georgia, serif" fontWeight="600" fontSize="24" textAnchor="middle">
      <text x="38" y="59">{a}</text>
      <text x="62" y="59">{b}</text>
    </g>
  )
  return (
    <svg viewBox="0 0 100 100" aria-hidden className="size-full overflow-visible">
      <defs>
        <radialGradient id={`${id}c`} cx="35%" cy="28%" r="80%">
          <stop offset="0" stopColor={couleurs.cireClair} />
          <stop offset="0.5" stopColor={couleurs.cire} />
          <stop offset="1" stopColor={couleurs.cireOmbre} />
        </radialGradient>
        <filter id={`${id}b`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="4" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="3" />
        </filter>
        <filter id={`${id}f`}><feGaussianBlur stdDeviation="2.2" /></filter>
        <clipPath id={`${id}m`} clipPathUnits="userSpaceOnUse">
          <path d={moitie === 'd' ? 'M100 0 L48 0 L53 14 L46 30 L54 47 L47 64 L53 82 L49 100 L100 100Z' : 'M0 0 L48 0 L53 14 L46 30 L54 47 L47 64 L53 82 L49 100 L0 100Z'} />
        </clipPath>
      </defs>
      <g clipPath={moitie ? `url(#${id}m)` : undefined}>
        <g filter={`url(#${id}b)`}>
          <path d={CONTOUR} fill={`url(#${id}c)`} />
          <path d={CONTOUR} fill="none" stroke="rgb(255 255 255 / .55)" strokeWidth="0.8" transform="translate(-0.6 -0.6)" />
        </g>
        {/* Anneau gravé */}
        <circle cx="50" cy="50" r="31" fill="none" stroke={couleurs.cireOmbre} strokeWidth="1.3" opacity=".55" />
        <circle cx="50" cy="50" r="31" fill="none" stroke="#fff" strokeWidth="0.7" opacity=".7" transform="translate(0.7 0.7)" />
        {/* Monogramme en relief : lumière en haut à gauche, ombre en bas à droite */}
        {texte(-0.7, -0.7, '#ffffff', 0.9)}
        {texte(0.7, 0.8, couleurs.cireOmbre, 0.9)}
        {texte(0, 0, couleurs.encre)}
        <path d="M50 38 V66" stroke={couleurs.encre} strokeWidth="1" opacity=".8" />
        {/* Reflet */}
        <ellipse cx="34" cy="30" rx="15" ry="8" fill="#fff" opacity=".5" filter={`url(#${id}f)`} transform="rotate(-30 34 30)" />
      </g>
    </svg>
  )
}
