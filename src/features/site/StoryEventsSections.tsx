import { CalendarDays, Clock, MapPin, Shirt } from 'lucide-react'
import { publicUrl } from '@/lib/storage'
import { formatDate } from '@/lib/utils'
import { formatTime } from '@/lib/time'
import type { StoryMilestone, WeddingEvent } from '@/types/domain'
import { SiteSection } from './SiteSection'

export function StorySection({ title, text, milestones }: { title: string; text: string; milestones: StoryMilestone[] }) {
  return (
    <SiteSection id="histoire" title={title} intro={text}>
      {milestones.length > 0 && (
        <ol className="relative space-y-12 border-l border-(--w-accent)/60 pl-8 sm:pl-12">
          {milestones.map((m) => {
            const img = publicUrl('image', m.image_path)
            return (
              <li key={m.id} className="relative">
                <span className="absolute top-2 -left-[2.4rem] size-3 rounded-full bg-(--w-accent) ring-4 ring-(--w-bg) sm:-left-[3.4rem]" aria-hidden />
                {m.happened_on && <p className="text-sm tracking-wide text-(--w-accent) uppercase">{formatDate(m.happened_on + 'T12:00:00Z', 'UTC')}</p>}
                <h3 className="mt-1 text-3xl font-semibold text-(--w-primary)">{m.title}</h3>
                {m.description && <p className="mt-3 whitespace-pre-line text-(--w-text)/85">{m.description}</p>}
                {img && <img src={img} alt="" loading="lazy" className="mt-5 max-h-96 w-full rounded-2xl object-cover shadow" />}
              </li>
            )
          })}
        </ol>
      )}
    </SiteSection>
  )
}

export function EventsSection({ title, events, timeZone }: { title: string; events: WeddingEvent[]; timeZone: string }) {
  return (
    <SiteSection id="programme" title={title} tinted>
      <ol className="space-y-6">
        {events.map((e) => (
          <li key={e.id} className="rounded-3xl bg-(--w-bg) p-6 shadow-sm ring-1 ring-(--w-primary)/10 sm:p-8">
            <h3 className="text-3xl font-semibold text-(--w-primary)">{e.title}</h3>
            <ul className="mt-4 space-y-2 text-sm text-(--w-text)/85">
              {e.starts_at && (
                <li className="flex items-start gap-3"><CalendarDays className="mt-0.5 size-4 shrink-0 text-(--w-accent)" aria-hidden />{formatDate(e.starts_at, timeZone)}</li>
              )}
              {e.starts_at && (
                <li className="flex items-start gap-3"><Clock className="mt-0.5 size-4 shrink-0 text-(--w-accent)" aria-hidden />
                  {formatTime(e.starts_at, timeZone)}{e.ends_at ? ` – ${formatTime(e.ends_at, timeZone)}` : ''}
                </li>
              )}
              {(e.venue_name || e.address) && (
                <li className="flex items-start gap-3"><MapPin className="mt-0.5 size-4 shrink-0 text-(--w-accent)" aria-hidden />
                  <span>{[e.venue_name, e.address].filter(Boolean).join(' — ')}</span>
                </li>
              )}
              {e.dress_code && (
                <li className="flex items-start gap-3"><Shirt className="mt-0.5 size-4 shrink-0 text-(--w-accent)" aria-hidden />Tenue : {e.dress_code}</li>
              )}
            </ul>
            {e.description && <p className="mt-4 whitespace-pre-line text-(--w-text)/85">{e.description}</p>}
            {e.map_url && (
              <a href={e.map_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm font-medium text-(--w-primary) underline underline-offset-4">
                Voir sur la carte
              </a>
            )}
          </li>
        ))}
      </ol>
    </SiteSection>
  )
}
