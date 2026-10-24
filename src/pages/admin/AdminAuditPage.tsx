import { useEffect } from 'react'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { Alert, EmptyState, Spinner } from '@/components/ui/Feedback'
import { useAsync } from '@/hooks/useAsync'
import { formatDateTime } from '@/lib/time'
import { listAudit } from '@/services/moderation'
import { ACTION_LABELS } from '@/services/stats'

export default function AdminAuditPage() {
  useEffect(() => { document.title = 'Journal — MariamCM' }, [])
  const state = useAsync(() => listAudit(200), [])
  return (
    <>
      <PageHeader title="Journal d’activité" description="Les 200 derniers événements sensibles. Ce journal n’est pas modifiable depuis l’application." />
      {state.status === 'loading' && <Spinner />}
      {state.status === 'error' && <Alert>{state.error.message}</Alert>}
      {state.status === 'success' && (state.data.length === 0 ? <EmptyState title="Journal vide" /> : (
        <div className="overflow-x-auto rounded-2xl border border-forest/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-forest/10 text-ink-soft"><tr><th scope="col" className="px-4 py-3">Date</th><th scope="col" className="px-4 py-3">Événement</th><th scope="col" className="px-4 py-3">Objet</th></tr></thead>
            <tbody className="divide-y divide-forest/10">
              {state.data.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap px-4 py-2.5">{formatDateTime(r.created_at, 'Africa/Douala')}</td>
                  <td className="px-4 py-2.5">{ACTION_LABELS[r.action] ?? r.action}</td>
                  <td className="px-4 py-2.5 text-ink-soft">{r.entity ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </>
  )
}
