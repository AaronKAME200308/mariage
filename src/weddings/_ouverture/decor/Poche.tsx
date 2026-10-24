import { grain } from './grain'

/**
 * Face avant de l'enveloppe : trois plis (gauche, droite, bas) qui forment le « V » de la poche.
 * Chaque pli a un éclairage différent, comme du vrai papier plié.
 */
export default function Poche({ couleur, clair }: { couleur: string; clair: string }) {
  const base = (angle: number, a: string, b: string) => ({
    backgroundColor: couleur,
    backgroundImage: `${grain('clair', 0.5)}, linear-gradient(${angle}deg, ${a}, ${b})`,
    backgroundSize: '240px, 100% 100%',
    backgroundBlendMode: 'soft-light, normal',
  })
  return (
    <div data-piece aria-hidden className="pointer-events-none absolute inset-0 z-[3]">
      <div className="absolute inset-0" style={{ ...base(90, clair, couleur), clipPath: 'polygon(0 0, 50% 56.5%, 0 100%)' }} />
      <div className="absolute inset-0" style={{ ...base(270, clair, couleur), clipPath: 'polygon(100% 0, 50% 56.5%, 100% 100%)' }} />
      <div className="absolute inset-0" style={{ ...base(0, '#2a2a2a', couleur), clipPath: 'polygon(0 100%, 50% 52%, 100% 100%)' }} />
      {/* Arêtes des plis : fine lumière + ombre portée */}
      <svg viewBox="0 0 100 138" preserveAspectRatio="none" className="absolute inset-0 size-full" fill="none">
        <path d="M0 0 L50 78 L0 138 M100 0 L50 78 L100 138 M0 138 L50 71.5 L100 138" stroke="rgb(255 255 255 / .16)" strokeWidth="0.35" vectorEffect="non-scaling-stroke" />
        <path d="M0 0 L50 78 L100 0" stroke="rgb(0 0 0 / .5)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" opacity="0" />
      </svg>
    </div>
  )
}
