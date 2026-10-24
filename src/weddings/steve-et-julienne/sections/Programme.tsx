import { formatTime, useSite } from '../../_kit'
import Marguerite from '../decor/Marguerite'
import Monogramme from '../decor/Monogramme'

/** Cadre en arche avec les horaires, puis les lieux. */
export default function Programme() {
  const { data, wedding } = useSite()
  const horaires = data.events.filter((e) => e.starts_at)
  const lieux = data.events.filter((e) => e.venue_name)
  if (data.events.length === 0) return null
  return (
    <section id="programme" className="relative px-6 pb-16 text-center">
      <div className="mx-auto max-w-[19rem] rounded-t-full rounded-b-[3rem] border-2 border-(--sj-blue) p-2">
        <div className="rounded-t-full rounded-b-[2.6rem] border border-(--sj-blue) px-6 pt-12 pb-10">
          <h2 className="sj-script -rotate-6 whitespace-nowrap text-4xl text-(--sj-blue)">Le programme</h2>
          <Monogramme className="mt-2 scale-75" />
          <dl className="mx-auto mt-4 inline-grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-left text-sm">
            {horaires.map((e) => (
              <div key={e.id} className="contents">
                <dt className="font-semibold tabular-nums text-(--sj-blue)">{formatTime(e.starts_at, wedding.timezone)}</dt>
                <dd>{e.title}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {lieux.length > 0 && (
        <div className="mt-14">
          <h2 className="sj-script text-5xl text-(--sj-blue)">Les lieux</h2>
          <ul className="mt-6 space-y-8">
            {lieux.map((e) => (
              <li key={e.id}>
                <div aria-hidden className="mx-auto h-40 w-full max-w-xs rounded-sm" style={{ background: 'linear-gradient(180deg, #3f78c0, #78a8e2)' }} />
                <h3 className="sj-titre mt-4 text-2xl">{e.title}</h3>
                <p className="sj-corps mx-auto mt-2 max-w-xs">
                  {e.venue_name}{e.address ? <><br />{e.address}</> : null}
                  {e.description ? <><br />{e.description}</> : null}
                  {e.dress_code ? <><br />Tenue : {e.dress_code}</> : null}
                </p>
                {e.map_url?.startsWith('https://') && (
                  <a href={e.map_url} target="_blank" rel="noreferrer" className="sj-titre mt-3 inline-block border-b border-(--sj-blue) text-xs">Voir sur la carte</a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      <Marguerite className="absolute -left-5 top-10 w-20 -rotate-12" />
    </section>
  )
}
