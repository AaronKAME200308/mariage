import { Heart } from 'lucide-react'
import { formatDate, useSite } from '../../_kit'
import Marguerite from '../decor/Marguerite'

export default function Pied() {
  const { wedding, names } = useSite()
  return (
    <footer className="relative px-8 pt-10 text-center">
      <h2 className="sj-script text-4xl text-(--sj-blue)">Petit rappel</h2>
      <p className="sj-corps mx-auto mt-2 max-w-xs">
        Merci d’arriver 30 minutes avant la cérémonie et de prévoir une tenue adaptée au programme de la journée.
        Pour partager vos photos, utilisez notre hashtag.
      </p>
      <p className="sj-corps mx-auto mt-6 max-w-xs font-semibold text-(--sj-blue)">Nous espérons que vous pourrez venir. Que Dieu vous bénisse !</p>
      <Heart className="mx-auto mt-4 size-6 fill-(--sj-blue) text-(--sj-blue)" aria-hidden />
      <p className="sj-titre mt-3 text-sm">{names}</p>
      {wedding.wedding_date && <p className="sj-corps">{formatDate(wedding.wedding_date, wedding.timezone)}</p>}
      <Marguerite className="absolute -right-4 top-6 w-16 rotate-12" />
      <svg viewBox="0 0 1000 40" preserveAspectRatio="none" aria-hidden className="-mx-8 mt-10 block h-6 w-[calc(100%+4rem)] max-w-none">
        <path d="M0,40 L0,20 Q125,0 250,20 T500,20 T750,20 T1000,20 L1000,40 Z" fill="var(--sj-blue)" />
      </svg>
    </footer>
  )
}
