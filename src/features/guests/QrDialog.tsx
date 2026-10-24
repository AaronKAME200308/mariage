import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Feedback'
import { ConfirmDialog, Modal } from '@/components/ui/Modal'
import { cancelGuestCheckIn, renewGuestQr, revokeGuestQr } from '@/services/guests'
import type { Guest, QrTokenRow } from '@/types/domain'

export function verificationUrl(token: string): string {
  const origin = (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined) || window.location.origin
  return `${origin.replace(/\/$/, '')}/acces/${token}`
}

type Action = 'revoke' | 'renew' | 'cancel'
const COPY: Record<Action, { title: string; message: string; label: string }> = {
  revoke: { title: 'Révoquer le QR code', label: 'Révoquer', message: 'Ce code ne sera plus accepté à l’entrée. Vous pourrez en générer un nouveau ensuite.' },
  renew: { title: 'Renouveler le QR code', label: 'Renouveler', message: 'L’ancien code sera révoqué et un nouveau code sera généré. Le nouveau code devra être redonné à l’invité.' },
  cancel: { title: 'Annuler l’arrivée', label: 'Annuler l’arrivée', message: 'L’invité ne sera plus marqué comme présent et pourra être contrôlé à nouveau.' },
}

export function QrDialog({
  guest, token, tableName, onClose, onChanged,
}: { guest: Guest | null; token: QrTokenRow | null; tableName: string | null; onClose: () => void; onChanged: () => void }) {
  const [action, setAction] = useState<Action | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(a: Action) {
    if (!guest) return
    setBusy(true); setError(null)
    try {
      await (a === 'revoke' ? revokeGuestQr(guest.id) : a === 'renew' ? renewGuestQr(guest.id) : cancelGuestCheckIn(guest.id))
      setAction(null)
      onChanged()
      if (a !== 'renew') onClose()
    } catch (e) { setError(e instanceof Error ? e.message : 'Action impossible.'); setAction(null) }
    finally { setBusy(false) }
  }

  return (
    <>
      <Modal open={guest !== null} onClose={onClose} title={guest ? `QR code — ${guest.full_name}` : 'QR code'}>
        {guest && (
          <div className="space-y-4">
            {error && <Alert>{error}</Alert>}
            {token ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-forest/10">
                <QRCodeSVG value={verificationUrl(token.token)} size={220} level="M" marginSize={2} title={`QR code d’accès de ${guest.full_name}`} />
                <p className="text-center text-sm text-ink-soft">
                  {tableName ? <>Table : <strong className="text-ink">{tableName}</strong></> : 'Aucune table attribuée'}
                  {' · '}{guest.allowed_companions + 1} personne{guest.allowed_companions > 0 ? 's' : ''} maximum
                </p>
              </div>
            ) : (
              <Alert tone="info">Aucun QR code actif : il a été révoqué. Générez-en un nouveau pour que cet invité puisse entrer.</Alert>
            )}
            <p className="text-xs text-ink-soft">
              Ce code sert uniquement au contrôle d’accès le jour du mariage. Il ne contient aucune information personnelle.
            </p>
            <div className="flex flex-wrap gap-3">
              {token && <Button variant="secondary" size="sm" onClick={() => setAction('revoke')}>Révoquer</Button>}
              <Button variant="secondary" size="sm" onClick={() => setAction('renew')}>{token ? 'Renouveler' : 'Générer un nouveau code'}</Button>
              {guest.arrived_count > 0 && <Button variant="ghost" size="sm" onClick={() => setAction('cancel')}>Annuler l’arrivée</Button>}
            </div>
          </div>
        )}
      </Modal>
      <ConfirmDialog open={action !== null} danger busy={busy} title={action ? COPY[action].title : ''} message={action ? COPY[action].message : ''}
        confirmLabel={action ? COPY[action].label : ''} onCancel={() => setAction(null)} onConfirm={() => action && void run(action)} />
    </>
  )
}
