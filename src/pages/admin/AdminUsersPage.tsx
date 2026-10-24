import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Alert, EmptyState, Spinner } from '@/components/ui/Feedback'
import { ConfirmDialog } from '@/components/ui/Modal'
import { useAuth } from '@/features/auth/AuthProvider'
import { useAsync } from '@/hooks/useAsync'
import { formatDateTime } from '@/lib/time'
import { listUsers, setUserActive, type AdminUser } from '@/services/moderation'

const ROLE = { admin: 'Administrateur', couple: 'Marié(e)', hostess: 'Hôtesse' } as const

export default function AdminUsersPage() {
  const { session } = useAuth()
  useEffect(() => { document.title = 'Utilisateurs — MariamCM' }, [])
  const [version, setVersion] = useState(0)
  const state = useAsync(listUsers, [version])
  const [target, setTarget] = useState<AdminUser | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function toggle(u: AdminUser) {
    setBusy(true); setError(null)
    try { await setUserActive(u.id, !u.is_active); setVersion((n) => n + 1) }
    catch (e) { setError(e instanceof Error ? e.message : 'Action impossible.') }
    finally { setBusy(false); setTarget(null) }
  }

  return (
    <>
      <PageHeader title="Utilisateurs" description="Un compte désactivé est déconnecté et ne peut plus accéder à la plateforme. Les comptes se créent depuis la fiche d’un mariage." />
      {error && <Alert className="mb-4">{error}</Alert>}
      {state.status === 'loading' && <Spinner />}
      {state.status === 'error' && <Alert>{state.error.message}</Alert>}
      {state.status === 'success' && (state.data.length === 0 ? <EmptyState title="Aucun utilisateur" /> : (
        <ul className="divide-y divide-forest/10 rounded-2xl border border-forest/10 bg-white">
          {state.data.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
              <span>
                <span className="font-medium text-ink">{u.full_name || 'Sans nom'}</span>{' '}
                <Badge>{ROLE[u.role]}</Badge>{!u.is_active && <> <Badge tone="danger">Désactivé</Badge></>}
                <span className="ml-2 text-xs text-ink-soft">créé le {formatDateTime(u.created_at, 'Africa/Douala')}</span>
              </span>
              {u.id !== session?.user.id && (
                <Button size="sm" variant="secondary" onClick={() => setTarget(u)}>{u.is_active ? 'Désactiver' : 'Réactiver'}</Button>
              )}
            </li>
          ))}
        </ul>
      ))}
      <ConfirmDialog open={target !== null} busy={busy} danger={target?.is_active} title={target?.is_active ? 'Désactiver le compte' : 'Réactiver le compte'}
        confirmLabel={target?.is_active ? 'Désactiver' : 'Réactiver'}
        message={target?.is_active ? `${target.full_name || 'Cet utilisateur'} ne pourra plus se connecter.` : `${target?.full_name || 'Cet utilisateur'} pourra de nouveau se connecter.`}
        onCancel={() => setTarget(null)} onConfirm={() => target && void toggle(target)} />
    </>
  )
}
