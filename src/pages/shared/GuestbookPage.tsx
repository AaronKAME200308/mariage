import { useEffect, useState } from 'react'
import { Check, Trash2, X } from 'lucide-react'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Alert, EmptyState, Spinner } from '@/components/ui/Feedback'
import { ConfirmDialog } from '@/components/ui/Modal'
import { useAuth } from '@/features/auth/AuthProvider'
import { useWedding } from '@/features/weddings/WeddingContext'
import { useAsync } from '@/hooks/useAsync'
import { formatDateTime } from '@/lib/time'
import { deleteMessage, listGuestbook, moderateMessage, type GuestbookRow, type ModerationStatus } from '@/services/moderation'

const TABS: { id: ModerationStatus; label: string }[] = [
  { id: 'pending', label: 'À modérer' }, { id: 'approved', label: 'Publiés' }, { id: 'rejected', label: 'Refusés' },
]

export default function GuestbookPage() {
  const { wedding } = useWedding()
  const { session } = useAuth()
  useEffect(() => { document.title = 'Livre d’or — MariamCM' }, [])
  const [version, setVersion] = useState(0)
  const state = useAsync(() => listGuestbook(wedding.id), [wedding.id, version])
  const [tab, setTab] = useState<ModerationStatus>('pending')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<GuestbookRow | null>(null)

  async function act(id: string, fn: () => Promise<void>) {
    setBusy(id); setError(null)
    try { await fn(); setVersion((n) => n + 1) } catch (e) { setError(e instanceof Error ? e.message : 'Action impossible.') } finally { setBusy(null); setDeleting(null) }
  }

  const rows = state.status === 'success' ? state.data : []
  const count = (s: ModerationStatus) => rows.filter((r) => r.status === s).length
  const shown = rows.filter((r) => r.status === tab)
  const autoApprove = (wedding.settings as { guestbook?: { auto_approve?: boolean } } | null)?.guestbook?.auto_approve

  return (
    <>
      <PageHeader title="Livre d’or" description="Seuls les messages publiés apparaissent sur le site. Les textes sont affichés tels quels, sans mise en forme." />
      {autoApprove && <Alert tone="info" className="mb-4">La publication automatique est activée : les nouveaux messages sont publiés sans validation (réglage dans Personnalisation).</Alert>}
      {error && <Alert className="mb-4">{error}</Alert>}
      <div role="tablist" aria-label="Statut des messages" className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium ${tab === t.id ? 'bg-forest text-ivory' : 'border border-forest/25 text-forest'}`}>
            {t.label} ({count(t.id)})
          </button>
        ))}
      </div>
      {state.status === 'loading' && <Spinner />}
      {state.status === 'error' && <Alert>{state.error.message}</Alert>}
      {state.status === 'success' && (shown.length === 0
        ? <EmptyState title="Aucun message" description="Rien dans cette catégorie pour le moment." />
        : (
          <ul className="space-y-4">
            {shown.map((m) => (
              <li key={m.id} className="rounded-2xl border border-forest/10 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-ink">{m.author_name}</p>
                  <span className="flex items-center gap-2 text-xs text-ink-soft"><Badge tone={m.status === 'approved' ? 'success' : m.status === 'rejected' ? 'danger' : 'warning'}>{TABS.find((t) => t.id === m.status)?.label}</Badge>{formatDateTime(m.created_at, wedding.timezone)}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm text-ink">{m.message}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {m.status !== 'approved' && <Button size="sm" disabled={busy === m.id} onClick={() => session && void act(m.id, () => moderateMessage(m.id, 'approved', session.user.id))}><Check className="size-4" aria-hidden />Publier</Button>}
                  {m.status !== 'rejected' && <Button size="sm" variant="secondary" disabled={busy === m.id} onClick={() => session && void act(m.id, () => moderateMessage(m.id, 'rejected', session.user.id))}><X className="size-4" aria-hidden />Refuser</Button>}
                  <Button size="sm" variant="ghost" disabled={busy === m.id} onClick={() => setDeleting(m)}><Trash2 className="size-4" aria-hidden />Supprimer</Button>
                </div>
              </li>
            ))}
          </ul>
        ))}
      <ConfirmDialog open={deleting !== null} title="Supprimer le message" danger confirmLabel="Supprimer" busy={busy !== null}
        message="Ce message sera supprimé définitivement." onCancel={() => setDeleting(null)}
        onConfirm={() => deleting && void act(deleting.id, () => deleteMessage(deleting.id))} />
    </>
  )
}
