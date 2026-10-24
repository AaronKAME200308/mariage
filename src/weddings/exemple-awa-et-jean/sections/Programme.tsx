import { formatTime, Section, useSite } from '../../_kit'

export default function Programme() {
  const { data, wedding } = useSite()
  return (
    <Section id="programme" title="Programme de la journée" tinted>
      <ul className="grid gap-5 sm:grid-cols-2">
        {data.events.map((e) => (
          <li key={e.id} className="rounded-2xl bg-white p-6 shadow-sm">
            {e.starts_at && <p className="font-(family-name:--w-heading) text-3xl text-(--w-accent)">{formatTime(e.starts_at, wedding.timezone)}</p>}
            <h3 className="mt-1 text-2xl text-(--w-primary)">{e.title}</h3>
            {e.venue_name && <p className="mt-2 text-sm font-medium">{e.venue_name}</p>}
            {e.address && <p className="text-sm text-(--w-text)/70">{e.address}</p>}
            {e.dress_code && <p className="mt-3 text-sm">Tenue : {e.dress_code}</p>}
          </li>
        ))}
      </ul>
    </Section>
  )
}
