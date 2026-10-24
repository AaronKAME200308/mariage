/** Brin de gypsophile au trait fin (dessin généré, déterministe : même `graine` = même brin). */
function alea(graine: number) {
  let a = graine >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const P = [[50, 196], [36, 130], [66, 76], [48, 6]] as const
function bezier(t: number): [number, number, number] {
  const u = 1 - t
  const x = u ** 3 * P[0][0] + 3 * u * u * t * P[1][0] + 3 * u * t * t * P[2][0] + t ** 3 * P[3][0]
  const y = u ** 3 * P[0][1] + 3 * u * u * t * P[1][1] + 3 * u * t * t * P[2][1] + t ** 3 * P[3][1]
  const dx = 3 * u * u * (P[1][0] - P[0][0]) + 6 * u * t * (P[2][0] - P[1][0]) + 3 * t * t * (P[3][0] - P[2][0])
  const dy = 3 * u * u * (P[1][1] - P[0][1]) + 6 * u * t * (P[2][1] - P[1][1]) + 3 * t * t * (P[3][1] - P[2][1])
  return [x, y, Math.atan2(dy, dx)]
}

export default function Gypsophile({ graine = 1, className = '' }: { graine?: number; className?: string }) {
  const r = alea(graine)
  const traits: string[] = []
  const fleurs: [number, number, number][] = []
  const N = 13
  for (let i = 0; i < N; i++) {
    const t = 0.22 + (i / (N - 1)) * 0.74
    const [x, y, a] = bezier(t)
    for (const cote of [-1, 1]) {
      if (r() < 0.22) continue
      const ang = a + cote * (0.5 + r() * 0.5)
      const L = 34 - t * 22 + r() * 8
      const mx = x + Math.cos(ang) * L * 0.55 + (r() - 0.5) * 4
      const my = y + Math.sin(ang) * L * 0.55 + (r() - 0.5) * 4
      const ex = x + Math.cos(ang + cote * 0.25) * L
      const ey = y + Math.sin(ang + cote * 0.25) * L
      traits.push(`M${x.toFixed(1)} ${y.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`)
      fleurs.push([ex, ey, 1.6 + r() * 1.1])
      for (let k = 0; k < 2; k++) {
        const bx = ex + Math.cos(ang + (k ? 0.7 : -0.7)) * (5 + r() * 4)
        const by = ey + Math.sin(ang + (k ? 0.7 : -0.7)) * (5 + r() * 4)
        traits.push(`M${ex.toFixed(1)} ${ey.toFixed(1)} L${bx.toFixed(1)} ${by.toFixed(1)}`)
        fleurs.push([bx, by, 1.2 + r() * 0.9])
      }
    }
  }
  const [tx, ty] = bezier(1)
  fleurs.push([tx, ty, 2.2])
  return (
    <svg viewBox="0 0 100 200" aria-hidden fill="none" className={`pointer-events-none ${className}`}>
      <path d="M50 196 C36 130 66 76 48 6" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
      <path d={traits.join(' ')} stroke="currentColor" strokeWidth="0.55" strokeLinecap="round" />
      {fleurs.map(([x, y, rayon], i) => <circle key={i} cx={x} cy={y} r={rayon} fill="currentColor" />)}
    </svg>
  )
}
