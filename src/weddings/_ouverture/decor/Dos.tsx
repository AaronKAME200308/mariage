import { grain } from './grain'

/** Fond de l'enveloppe (face arrière, visible derrière la carte). */
export default function Dos({ couleur, clair }: { couleur: string; clair: string }) {
  return (
    <div
      data-piece
      aria-hidden
      className="absolute inset-0 z-[1] rounded-[3px]"
      style={{
        backgroundColor: couleur,
        backgroundImage: `${grain('clair', 0.5)}, linear-gradient(160deg, ${clair}, ${couleur} 60%)`,
        backgroundSize: '240px, 100% 100%',
        backgroundBlendMode: 'soft-light, normal',
        boxShadow: 'inset 0 0 0 1px rgb(255 255 255 / .06)',
      }}
    />
  )
}
