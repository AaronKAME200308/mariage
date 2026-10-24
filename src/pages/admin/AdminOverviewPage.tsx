import { useEffect } from 'react'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { Alert, Spinner } from '@/components/ui/Feedback'
import { useAsync } from '@/hooks/useAsync'
import { formatDateTime } from '@/lib/time'
import { ACTION_LABELS, fetchPlatformStats, fetchRecentActivity } from '@/services/stats'

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-forest/10 bg-white p-5 shadow-soft">
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="mt-2 font-serif text-5xl font-semibold text-forest">{value}</p>
    </div>
  )
}

export default function AdminOverviewPage() {
  useEffect(() => { document.title = 'Administration — MariamCM' }, [])
  const stats = useAsync(fetchPlatformStats, [])
  const activity = useAsync(() => fetchRecentActivity(8), [])

  return (
    <>
      <PageHeader title="Vue d’ensemble" description="Chiffres calculés à partir des données réelles de la plateforme." />
      {stats.status === 'loading' && <Spinner />}
      {stats.status === 'error' && <Alert>{stats.error.message}</Alert>}
      {stats.status === 'success' && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Mariages" value={stats.data.weddings} />
          <Stat label="Sites publiés" value={stats.data.published} />
          <Stat label="Mariages à venir" value={stats.data.upcoming} />
          <Stat label="Invités" value={stats.data.guests} />
          <Stat label="Présences confirmées" value={stats.data.confirmed} />
          <Stat label="Réponses en attente" value={stats.data.pending} />
          <Stat label="Contrôles d’accès réalisés" value={stats.data.checkIns} />
        </div>
      )}

      <section aria-labelledby="activite" className="mt-12">
        <h2 id="activite" className="mb-4 text-2xl font-semibold text-forest">Activité récente</h2>
        {activity.status === 'loading' && <Spinner />}
        {activity.status === 'error' && <Alert>{activity.error.message}</Alert>}
        {activity.status === 'success' && (activity.data.length === 0
          ? <p className="text-sm text-ink-soft">Aucune activité enregistrée pour le moment.</p>
          : (
            <ul className="divide-y divide-forest/10 rounded-2xl border border-forest/10 bg-white">
              {activity.data.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                  <span>{ACTION_LABELS[a.action] ?? a.action}</span>
                  <time className="text-ink-soft" dateTime={a.created_at}>{formatDateTime(a.created_at, 'Africa/Douala')}</time>
                </li>
              ))}
            </ul>
          ))}
      </section>
    </>
  )
}
