import { forwardRef } from 'react'
import { grain } from './grain'

interface Props {
  couleur: string
  clair: string
  doublureClair: string
  doublureSombre: string
  dessous: boolean
}

/**
 * Rabat triangulaire en 3D. Face extérieure noire ; face intérieure = doublure pied-de-poule,
 * visible quand le rabat se retourne. Il pivote autour de son bord haut (data-p="rabat").
 */
const Rabat = forwardRef<HTMLDivElement, Props>(function Rabat({ couleur, clair, doublureClair, doublureSombre, dessous }, ref) {
  const triangle = 'polygon(0 0, 100% 0, 50% 100%)'
  const pdp = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"><rect width="14" height="14" fill="${doublureClair}"/><path d="M0 0h7v7H0zM7 7h7v7H7zM7 0l7 7V0zM0 7l7 7H0z" fill="${doublureSombre}"/></svg>`
  return (
    <div
      ref={ref}
      data-p="rabat"
      data-piece
      aria-hidden
      className="absolute top-0 left-0 h-[56.5%] w-full"
      style={{ transformStyle: 'preserve-3d', transformOrigin: '50% 0%', zIndex: dessous ? 1 : 4 }}
    >
      {/* Face extérieure */}
      <div
        className="absolute inset-0"
        style={{
          clipPath: triangle, backfaceVisibility: 'hidden', backgroundColor: couleur,
          backgroundImage: `${grain('clair', 0.5)}, linear-gradient(180deg, ${clair}, ${couleur} 70%)`,
          backgroundSize: '240px, 100% 100%', backgroundBlendMode: 'soft-light, normal',
        }}
      />
      {/* Face intérieure (doublure) */}
      <div
        className="absolute inset-0"
        style={{
          clipPath: triangle, backfaceVisibility: 'hidden', transform: 'rotateX(180deg)',
          backgroundImage: `linear-gradient(0deg, rgb(0 0 0 / .22), transparent 55%), url("data:image/svg+xml;utf8,${encodeURIComponent(pdp)}")`,
          backgroundSize: '100% 100%, 14px 14px',
        }}
      />
    </div>
  )
})
export default Rabat
