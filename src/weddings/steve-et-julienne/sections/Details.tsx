import { useSite } from '../../_kit'
import Bande from '../decor/Bande'
import Marguerite from '../decor/Marguerite'
import { Costume, Robe } from '../decor/Silhouettes'

/** Section propre à ce mariage : tenue, couleurs, cadeaux, partage de photos. Tout est écrit ici. */
const COULEURS = ['#1f3f8f', '#4a78c4', '#a9c4ee', '#c9d6ee', '#f4f0e8']
const HASHTAG = '#SteveEtJulienneForever'

export default function Details() {
  const { wedding } = useSite()
  return (
    <section id="details" className="relative pb-16 text-center">
      <Bande titre="Les détails" graine={5} hauteur="h-48" />
      <div className="mt-6 px-8">
        <h3 className="sj-script text-4xl text-(--sj-blue)">Tenue</h3>
        <p className="sj-corps mt-1">Tenue de cérémonie</p>
        <div className="mt-3 flex items-end justify-center gap-5" role="img" aria-label="Une robe et un costume">
          <Robe className="h-24" />
          <Costume className="h-24" />
        </div>

        <h3 className="sj-script mt-8 text-4xl text-(--sj-blue)">Palette de couleurs</h3>
        <p className="sj-corps mt-1">Bleu</p>
        <ul className="mt-3 flex justify-center gap-2" aria-label="Couleurs suggérées">
          {COULEURS.map((c) => <li key={c} className="size-7 rounded-full border border-(--sj-blue)/25" style={{ background: c }} />)}
        </ul>

        <h3 className="sj-script mt-8 text-4xl text-(--sj-blue)">Guide des cadeaux</h3>
        <p className="sj-corps mx-auto mt-1 max-w-xs">
          Votre présence et vos prières sont tout ce que nous demandons. Si toutefois vous souhaitez nous offrir un présent,
          un geste financier nous ferait très plaisir.
        </p>

        <h3 className="sj-script mt-8 text-4xl text-(--sj-blue)">Partagez vos photos</h3>
        <p className="sj-corps mx-auto mt-1 max-w-xs">Aidez-nous à garder tous les souvenirs : publiez vos photos avec le hashtag</p>
        <p className="sj-titre mt-2 text-sm">{HASHTAG}</p>
        <p className="sr-only">Mariage de {wedding.partner_one_name} et {wedding.partner_two_name}</p>
      </div>
      <Marguerite className="absolute -right-5 top-56 w-20 rotate-12" />
      <Marguerite className="absolute -left-5 bottom-10 w-16 -rotate-12" />
    </section>
  )
}
