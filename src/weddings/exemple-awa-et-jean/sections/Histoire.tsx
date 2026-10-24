import { Section, useSite } from '../../_kit'

/** Texte écrit directement dans le fichier : aucune dépendance au tableau de bord. */
export default function Histoire() {
  const { data } = useSite()
  return (
    <Section id="histoire" title="Notre histoire">
      <p className="awa-jean-lettrine mx-auto max-w-2xl text-lg leading-relaxed">
        Tout a commencé par une erreur de salle à l’université : Awa cherchait l’amphi B, Jean avait déjà pris sa place.
        Dix ans plus tard, nous avons décidé de ne plus jamais nous perdre de vue. Nous avons hâte de partager ce jour avec vous.
      </p>
      <ol className="mx-auto mt-12 max-w-2xl border-l-2 border-(--w-accent) pl-6">
        {data.milestones.map((m) => (
          <li key={m.id} className="relative mb-8">
            <span className="absolute top-2 -left-[1.95rem] size-3 rounded-full bg-(--w-accent)" aria-hidden />
            {m.happened_on && <p className="text-sm text-(--w-text)/60">{new Date(m.happened_on).getFullYear()}</p>}
            <h3 className="text-2xl text-(--w-primary)">{m.title}</h3>
            {m.description && <p className="mt-1 text-(--w-text)/80">{m.description}</p>}
          </li>
        ))}
      </ol>
    </Section>
  )
}
