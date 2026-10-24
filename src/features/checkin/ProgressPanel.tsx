import { Badge } from '@/components/ui/Badge'
import { Alert, Spinner } from '@/components/ui/Feedback'
import { useAsync } from '@/hooks/useAsync'
import { formatTime } from '@/lib/time'
import { getCheckInStats, getRecentCheckIns } from '@/services/checkin'

export function ProgressPanel({ weddingId, timeZone, refreshKey }: { weddingId: string; timeZone: string; refreshKey: number }) {
  const stats = useAsync(() => getCheckInStats(weddingId), [weddingId, refreshKey])
  const recent = useAsync(() => getRecentCheckIns(weddingId), [weddingId, refreshKey])
  return (
    <div className="space-y-6">
      <section aria-labelledby="prog-title" className="rounded-2xl border border-forest/10 bg-white p-5">
        <h2 id="prog-title" className="text-2xl font-semibold text-forest">Arrivées</h2>
        {stats.status === 'loading' && <Spinner />}
        {stats.status === 'error' && <Alert className="mt-3">{stats.error.message}</Alert>}
        {stats.status === 'success' && (() => {
          const { expected_guests: exp, arrived_guests: arr, arrived_people: ppl } = stats.data
          const pct = exp > 0 ? Math.min(100, Math.round((arr / exp) * 100)) : 0
          return (
            <div className="mt-3">
              <p className="text-3xl font-semibold text-forest">{arr} <span className="text-lg font-normal text-ink-soft">/ {exp} invités attendus</span></p>
              <div role="progressbar" aria-label="Invités arrivés" aria-valuemin={0} aria-valuemax={exp} aria-valuenow={arr} className="mt-3 h-3 overflow-hidden rounded-full bg-ivory-200">
                <div className="h-full bg-forest transition-[width]" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-2 text-sm text-ink-soft">{pct} % · {ppl} personne(s) entrée(s) au total</p>
            </div>
          )
        })()}
      </section>

      <section aria-labelledby="recent-title" className="rounded-2xl border border-forest/10 bg-white p-5">
        <h2 id="recent-title" className="text-2xl font-semibold text-forest">Derniers contrôles</h2>
        {recent.status === 'loading' && <Spinner />}
        {recent.status === 'error' && <Alert className="mt-3">{recent.error.message}</Alert>}
        {recent.status === 'success' && (recent.data.length === 0
          ? <p className="mt-3 text-sm text-ink-soft">Aucune arrivée enregistrée pour le moment.</p>
          : (
            <ul className="mt-3 divide-y divide-forest/10">
              {recent.data.map((r, i) => (
                <li key={`${r.checked_in_at}-${i}`} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span>
                    <span className="font-medium text-ink">{r.guest_name}</span>
                    <span className="text-ink-soft"> · {r.party_size} pers. · table {r.table_name ?? '—'}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {r.method === 'manual' && <Badge>Manuel</Badge>}
                    <time dateTime={r.checked_in_at} className="text-ink-soft">{formatTime(r.checked_in_at, timeZone)}</time>
                  </span>
                </li>
              ))}
            </ul>
          ))}
      </section>
    </div>
  )
}
