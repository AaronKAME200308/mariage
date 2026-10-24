import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ScanLine } from 'lucide-react'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { buttonStyles } from '@/components/ui/Button'
import { Alert, EmptyState, Spinner } from '@/components/ui/Feedback'
import { ProgressPanel } from '@/features/checkin/ProgressPanel'
import { ScannerPanel } from '@/features/checkin/ScannerPanel'
import { useAsync } from '@/hooks/useAsync'
import { requireSupabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import type { Wedding } from '@/types/domain'

type Row = Pick<Wedding, 'id' | 'slug' | 'partner_one_name' | 'partner_two_name' | 'wedding_date' | 'status' | 'timezone'>

async function fetchAssigned(): Promise<Row[]> {
  const { data, error } = await requireSupabase().from('weddings')
    .select('id, slug, partner_one_name, partner_two_name, wedding_date, status, timezone')
    .order('wedding_date', { ascending: true, nullsFirst: false })
  if (error) throw new Error('Impossible de charger vos mariages.')
  return data as Row[]
}

export function HostessHomePage() {
  useEffect(() => { document.title = 'Espace hôtesse — MariamCM' }, [])
  const state = useAsync(fetchAssigned, [])
  return (
    <DashboardShell title="Espace hôtesse">
      <section aria-labelledby="mes-mariages">
        <h2 id="mes-mariages" className="mb-4 text-2xl font-semibold text-forest">Mariages qui me sont attribués</h2>
        {state.status === 'loading' && <Spinner />}
        {state.status === 'error' && <Alert>{state.error.message}</Alert>}
        {state.status === 'success' && (state.data.length === 0
          ? <EmptyState title="Aucun mariage" description="Aucun mariage ne vous est attribué pour le moment. Contactez les mariés ou l’équipe MariamCM." />
          : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {state.data.map((w) => (
                <li key={w.id} className="rounded-2xl border border-forest/10 bg-white p-5 shadow-soft">
                  <h3 className="text-2xl font-semibold text-forest">{w.partner_one_name} &amp; {w.partner_two_name}</h3>
                  <p className="mt-1 text-sm text-ink-soft">{formatDate(w.wedding_date, w.timezone) || 'Date à définir'}</p>
                  {w.status === 'archived'
                    ? <p className="mt-4 text-sm text-ink-soft">Mariage archivé : contrôle d’accès désactivé.</p>
                    : <Link to={`/hotesse/${w.id}`} className={`${buttonStyles('primary', 'md')} mt-4`}><ScanLine className="size-4" aria-hidden />Contrôle d’accès</Link>}
                </li>
              ))}
            </ul>
          ))}
      </section>
    </DashboardShell>
  )
}

export function HostessCheckInPage() {
  const { id = '' } = useParams()
  const [refreshKey, setRefreshKey] = useState(0)
  const state = useAsync(async () => (await fetchAssigned()).find((w) => w.id === id) ?? null, [id])

  // Rafraîchit la progression : d'autres hôtesses peuvent scanner en parallèle.
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === 'visible') setRefreshKey((n) => n + 1) }, 20000)
    return () => clearInterval(t)
  }, [])
  useEffect(() => { document.title = 'Contrôle d’accès — MariamCM' }, [])

  const w = state.status === 'success' ? state.data : null
  return (
    <DashboardShell title="Contrôle d’accès">
      <Link to="/hotesse" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-forest hover:underline"><ArrowLeft className="size-4" aria-hidden />Mes mariages</Link>
      {state.status === 'loading' && <Spinner />}
      {state.status === 'error' && <Alert>{state.error.message}</Alert>}
      {state.status === 'success' && !w && <EmptyState title="Mariage introuvable" description="Ce mariage n’existe pas ou ne vous est pas attribué." />}
      {w && w.status === 'archived' && <Alert>Ce mariage est archivé : les contrôles d’accès sont désactivés.</Alert>}
      {w && w.status !== 'archived' && (
        <>
          <h2 className="mb-6 text-3xl font-semibold text-forest">{w.partner_one_name} &amp; {w.partner_two_name}</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <ScannerPanel weddingId={w.id} timeZone={w.timezone} onChecked={() => setRefreshKey((n) => n + 1)} />
            <ProgressPanel weddingId={w.id} timeZone={w.timezone} refreshKey={refreshKey} />
          </div>
        </>
      )}
    </DashboardShell>
  )
}
