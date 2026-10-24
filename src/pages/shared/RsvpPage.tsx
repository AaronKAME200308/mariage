import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { Badge } from '@/components/ui/Badge'
import { Alert, EmptyState, Spinner } from '@/components/ui/Feedback'
import { useWedding } from '@/features/weddings/WeddingContext'
import { useAsync } from '@/hooks/useAsync'
import { formatDateTime } from '@/lib/time'
import { computeWeddingStats } from '@/lib/weddingStats'
import { listAllGuests, listRsvpResponses, listTables } from '@/services/guests'

function Tile({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-forest/10 bg-white p-5 shadow-soft">
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="mt-2 font-serif text-5xl font-semibold text-forest">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </div>
  )
}

export default function RsvpPage() {
  const { wedding } = useWedding()
  useEffect(() => { document.title = 'RSVP — MariamCM' }, [])
  const state = useAsync(async () => {
    const [guests, tables, responses] = await Promise.all([listAllGuests(wedding.id), listTables(wedding.id), listRsvpResponses(wedding.id, 200)])
    return { guests, responses, stats: computeWeddingStats(guests, tables, responses) }
  }, [wedding.id])
  const [tab, setTab] = useState<'responses' | 'pending'>('responses')

  if (state.status === 'loading') return <Spinner />
  if (state.status === 'error') return <Alert>{state.error.message}</Alert>
  const { guests, responses, stats } = state.data
  const pending = guests.filter((g) => g.rsvp_status === 'pending')

  return (
    <>
      <PageHeader title="Confirmations de présence" description="Suivi des réponses reçues depuis votre site. La confirmation de présence est distincte de l’arrivée effective le jour J." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile label="Présences confirmées" value={stats.confirmed} hint={`${stats.confirmedPeople} personne${stats.confirmedPeople > 1 ? 's' : ''} avec accompagnants`} />
        <Tile label="Absences" value={stats.declined} />
        <Tile label="En attente de réponse" value={stats.pending} />
        <Tile label="Invités au total" value={stats.invitedGuests} />
      </div>

      <div role="tablist" aria-label="Réponses" className="mt-10 mb-4 flex gap-2">
        {([['responses', `Réponses reçues (${responses.length})`], ['pending', `En attente (${pending.length})`]] as const).map(([key, label]) => (
          <button key={key} role="tab" aria-selected={tab === key} type="button" onClick={() => setTab(key)}
            className={`rounded-full px-4 py-2 text-sm font-medium ${tab === key ? 'bg-forest text-ivory' : 'bg-white text-forest ring-1 ring-forest/20 hover:bg-forest/5'}`}>{label}</button>
        ))}
      </div>

      {tab === 'responses' && (responses.length === 0
        ? <EmptyState title="Aucune réponse" description="Les réponses envoyées depuis votre site apparaîtront ici." />
        : (
          <ul className="divide-y divide-forest/10 rounded-2xl border border-forest/10 bg-white">
            {responses.map((r) => (
              <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 text-sm">
                <div>
                  <p className="font-medium text-ink">{r.submitted_name} <Badge tone={r.status === 'confirmed' ? 'success' : 'danger'}>{r.status === 'confirmed' ? `Présent${r.companions ? ` +${r.companions}` : ''}` : 'Absent'}</Badge></p>
                  {r.message && <p className="mt-1 text-ink-soft">« {r.message} »</p>}
                </div>
                <time className="text-xs text-ink-soft" dateTime={r.created_at}>{formatDateTime(r.created_at, wedding.timezone)}</time>
              </li>
            ))}
          </ul>
        ))}
      {tab === 'pending' && (pending.length === 0
        ? <EmptyState title="Tout le monde a répondu" />
        : (
          <ul className="divide-y divide-forest/10 rounded-2xl border border-forest/10 bg-white">
            {pending.map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <span className="font-medium text-ink">{g.full_name}</span>
                <span className="text-ink-soft">{[g.phone, g.email].filter(Boolean).join(' · ') || 'Pas de coordonnées'}</span>
              </li>
            ))}
          </ul>
        ))}
    </>
  )
}
