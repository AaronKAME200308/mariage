import { formatDate, formatTime, Section, useSite } from '../../_kit'

export default function Programme() {
  const { data, wedding } = useSite()
  if (data.events.length === 0) return null
  return (
    <Section id="programme" title="Programme" tinted>
      <ul className="mx-auto max-w-2xl divide-y divide-(--w-primary)/15">
        {data.events.map((e) => (
          <li key={e.id} className="py-5">
            {e.starts_at && <p className="text-sm text-(--w-text)/70">{formatDate(e.starts_at, wedding.timezone)} · {formatTime(e.starts_at, wedding.timezone)}</p>}
            <h3 className="text-2xl text-(--w-primary)">{e.title}</h3>
            {e.venue_name && <p className="text-sm">{e.venue_name}{e.address ? ` — ${e.address}` : ''}</p>}
            {e.description && <p className="mt-1 text-sm text-(--w-text)/80">{e.description}</p>}
          </li>
        ))}
      </ul>
    </Section>
  )
}
