/** Bord de papier déchiré (SVG original, généré de façon déterministe). */
function chemin(graine: number): string {
  let d = 'M0,40 L0,18'
  for (let x = 20; x <= 1000; x += 20) {
    const y = 14 + ((Math.sin(x * 0.07 + graine) + Math.sin(x * 0.21 + graine * 2)) * 0.5 + 1) * 9 + ((x * 7 + graine * 13) % 5)
    d += ` L${x},${y.toFixed(1)}`
  }
  return d + ' L1000,40 Z'
}

/** `position="bas"` : le papier crème monte vers la photo ; `"haut"` : il descend depuis le haut. */
export default function Dechirure({ position, graine = 1 }: { position: 'haut' | 'bas'; graine?: number }) {
  return (
    <svg
      viewBox="0 0 1000 40" preserveAspectRatio="none" aria-hidden
      className={`absolute inset-x-0 z-10 h-7 w-full ${position === 'bas' ? 'bottom-[-1px]' : 'top-[-1px] rotate-180'}`}
    >
      <path d={chemin(graine)} fill="var(--sj-cream)" />
    </svg>
  )
}
