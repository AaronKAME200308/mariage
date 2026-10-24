import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Alert, EmptyState, Spinner } from '@/components/ui/Feedback'
import { ConfirmDialog } from '@/components/ui/Modal'
import { useAsync } from '@/hooks/useAsync'
import { formatDateTime } from '@/lib/time'
import { deleteContact, listContactMessages, markContactRead, type ContactRow } from '@/services/moderation'

export default function AdminMessagesPage() {
  useEffect(() => { document.title = 'Messages — MariamCM' }, [])
  const [version, setVersion] = useState(0)
  const state = useAsync(listContactMessages, [version])
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<ContactRow | null>(null)
  const run = (fn: () => Promise<void>) => { setError(null); fn().then(() => setVersion((n) => n + 1)).catch((e: Error) => setError(e.message)).finally(() => setDeleting(null)) }

  return (
    <>
      <PageHeader title="Messages de contact" description="Messages reçus depuis le formulaire du site MariamCM." />
      {error && <Alert className="mb-4">{error}</Alert>}
      {state.status === 'loading' && <Spinner />}
      {state.status === 'error' && <Alert>{state.error.message}</Alert>}
      {state.status === 'success' && (state.data.length === 0 ? <EmptyState title="Aucun message" /> : (
        <ul className="space-y-4">
          {state.data.map((m) => (
            <li key={m.id} className="rounded-2xl border border-forest/10 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-ink">{m.name} · <a className="text-forest underline" href={`mailto:${encodeURIComponent(m.email).replace('%40', '@')}`}>{m.email}</a></p>
                <span className="flex items-center gap-2 text-xs text-ink-soft">{!m.is_read && <Badge tone="warning">Nouveau</Badge>}{formatDateTime(m.created_at, 'Africa/Douala')}</span>
              </div>
              {m.subject && <p className="mt-1 text-sm font-medium">{m.subject}</p>}
              <p className="mt-2 whitespace-pre-wrap break-words text-sm text-ink">{m.message}</p>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => run(() => markContactRead(m.id, !m.is_read))}>{m.is_read ? 'Marquer non lu' : 'Marquer lu'}</Button>
                <Button size="sm" variant="ghost" onClick={() => setDeleting(m)}>Supprimer</Button>
              </div>
            </li>
          ))}
        </ul>
      ))}
      <ConfirmDialog open={deleting !== null} title="Supprimer le message" danger confirmLabel="Supprimer" message="Ce message sera supprimé définitivement."
        onCancel={() => setDeleting(null)} onConfirm={() => deleting && run(() => deleteContact(deleting.id))} />
    </>
  )
}
