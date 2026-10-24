import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Feedback'
import { RSVP_LABEL } from '@/lib/seats'
import { searchGuestsForCheckIn, type CheckInResult, type GuestHit } from '@/services/checkin'
import { ResultCard } from './ResultCard'

/** Alternative sans caméra ou si le QR est illisible. Le contrôle passe par la même règle côté base. */
export function GuestSearch({ weddingId, timeZone, onCheckIn, busy, manualResult, onDismiss }: {
  weddingId: string; timeZone: string; onCheckIn: (guestId: string) => Promise<void>; busy: boolean
  manualResult: CheckInResult | null; onDismiss: () => void
}) {
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<GuestHit[]>([])
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) { setHits([]); setSearched(false); return }
    let active = true
    const t = setTimeout(() => {
      searchGuestsForCheckIn(weddingId, q).then(
        (r) => { if (active) { setHits(r); setError(null); setSearched(true) } },
        (e: unknown) => { if (active) setError(e instanceof Error ? e.message : 'Recherche impossible.') },
      )
    }, 300)
    return () => { active = false; clearTimeout(t) }
  }, [query, weddingId, reload])

  return (
    <section aria-labelledby="search-title" className="rounded-2xl border border-forest/10 bg-white p-5">
      <h2 id="search-title" className="flex items-center gap-2 text-2xl font-semibold text-forest"><Search className="size-5" aria-hidden />Recherche par nom</h2>
      <p className="mt-1 text-sm text-ink-soft">À utiliser si la caméra ne fonctionne pas ou si le QR code est illisible.</p>
      <label htmlFor="guest-search" className="sr-only">Nom de l’invité</label>
      <input
        id="guest-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" maxLength={80}
        placeholder="Au moins 2 lettres du nom"
        className="mt-3 w-full rounded-xl border border-forest/25 bg-white px-4 py-3 text-base"
      />
      {error && <Alert className="mt-3">{error}</Alert>}
      {manualResult && (
        <div className="mt-4 space-y-3">
          <ResultCard result={manualResult} timeZone={timeZone} />
          <Button variant="secondary" onClick={onDismiss}>Fermer</Button>
        </div>
      )}
      {searched && hits.length === 0 && <p className="mt-4 text-sm text-ink-soft">Aucun invité ne correspond.</p>}
      <ul className="mt-4 divide-y divide-forest/10">
        {hits.map((h) => (
          <li key={h.guest_id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <p className="font-medium text-ink">{h.full_name}</p>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
                <span>Table : {h.table_name ?? 'non attribuée'}</span>
                <Badge tone={h.rsvp_status === 'declined' ? 'danger' : h.rsvp_status === 'confirmed' ? 'success' : 'neutral'}>{RSVP_LABEL[h.rsvp_status]}</Badge>
                {h.arrived_count > 0 && <Badge tone="warning">Déjà arrivé</Badge>}
              </p>
            </div>
            <Button size="sm" disabled={busy || h.arrived_count > 0 || h.rsvp_status === 'declined'}
              onClick={() => void onCheckIn(h.guest_id).then(() => setReload((n) => n + 1))}>
              Valider l’entrée
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}
