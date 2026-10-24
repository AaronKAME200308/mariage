import { Section, useSite } from '../../_kit'

export default function Histoire() {
  const { data, content } = useSite()
  return (
    <Section id="histoire" title="Notre histoire">
      {/* Remplacez ce paragraphe par votre propre texte. */}
      {content.storyText && <p className="mx-auto max-w-2xl whitespace-pre-line text-center text-lg">{content.storyText}</p>}
      <ol className="mx-auto mt-10 max-w-2xl space-y-6">
        {data.milestones.map((m) => (
          <li key={m.id}>
            <h3 className="text-2xl text-(--w-primary)">{m.title}</h3>
            {m.description && <p className="mt-1 text-(--w-text)/80">{m.description}</p>}
          </li>
        ))}
      </ol>
    </Section>
  )
}
