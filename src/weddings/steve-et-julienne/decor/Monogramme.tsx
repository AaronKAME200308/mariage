import { useSite } from '../../_kit'

/** Monogramme composé des initiales du couple (texte, pas une image). */
export default function Monogramme({ className = '' }: { className?: string }) {
  const { wedding } = useSite()
  const a = wedding.partner_one_name.trim().charAt(0).toUpperCase()
  const b = wedding.partner_two_name.trim().charAt(0).toUpperCase()
  return (
    <p aria-hidden className={`sj-monogramme flex items-center justify-center leading-none ${className}`}>
      <span className="text-7xl font-semibold">{a}</span>
      <span className="sj-script mx-1 text-5xl">&amp;</span>
      <span className="text-7xl font-semibold">{b}</span>
    </p>
  )
}
