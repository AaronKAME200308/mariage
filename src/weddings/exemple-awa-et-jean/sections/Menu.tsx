import { useSite } from '../../_kit'

const LINKS = [['histoire', 'Notre histoire'], ['programme', 'Programme'], ['infos', 'Infos pratiques'], ['rsvp', 'Répondre']] as const

/** Barre de navigation collée en haut : ancres vers les sections de la même page. */
export default function Menu() {
  const { names } = useSite()
  return (
    <nav aria-label="Sections du site" className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-(--w-primary)/10 bg-(--w-bg)/90 px-5 py-3 backdrop-blur">
      <a href="#haut" className="font-(family-name:--w-heading) text-xl text-(--w-primary)">{names}</a>
      <ul className="hidden gap-6 text-sm sm:flex">
        {LINKS.map(([id, label]) => <li key={id}><a href={`#${id}`} className="hover:text-(--w-primary) hover:underline">{label}</a></li>)}
      </ul>
    </nav>
  )
}
