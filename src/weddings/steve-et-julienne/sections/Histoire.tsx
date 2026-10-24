import { useSite } from '../../_kit'
import Bande from '../decor/Bande'
import Marguerite from '../decor/Marguerite'

/** Texte de secours écrit dans le fichier ; le texte saisi dans « Personnalisation » prend le dessus s'il existe. */
const TEXTE_PAR_DEFAUT =
  'Steve et Julienne se sont rencontrés à Douala, un dimanche de pluie, sous le même abri de bus. ' +
  'Ce qui devait être cinq minutes d’attente est devenu une conversation de trois heures. ' +
  'Aujourd’hui, ils ont décidé d’écrire la suite ensemble, entourés de ceux qu’ils aiment.'

export default function Histoire() {
  const { data, content } = useSite()
  return (
    <section id="histoire" className="relative pb-16">
      <Bande titre="Notre histoire" graine={2} />
      <p className="sj-corps mx-auto mt-4 max-w-xs px-6 text-center">{content.storyText.trim() || TEXTE_PAR_DEFAUT}</p>
      {data.milestones.length > 0 && (
        <ol className="sj-corps mx-auto mt-8 max-w-xs space-y-4 px-6 text-center">
          {data.milestones.map((m) => (
            <li key={m.id}>
              {m.happened_on && <span className="sj-titre block text-xs">{new Date(m.happened_on).getFullYear()}</span>}
              <span className="font-semibold">{m.title}</span>
              {m.description && <span className="block text-(--w-text)/80">{m.description}</span>}
            </li>
          ))}
        </ol>
      )}
      <Marguerite className="absolute -right-4 bottom-4 w-24 rotate-12" />
      <Marguerite className="absolute -left-6 bottom-24 hidden w-16 -rotate-12 min-[420px]:block" />
    </section>
  )
}
