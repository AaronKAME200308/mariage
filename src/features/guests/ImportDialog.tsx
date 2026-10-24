import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Feedback'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { analyzeGuestCsv, ImportFormatError, MAX_IMPORT_BYTES, normalizeName, type ImportRow } from '@/lib/guestImport'
import { insertGuestsBatch, listAllGuests } from '@/services/guests'

export function ImportDialog({ open, weddingId, onClose, onImported }: { open: boolean; weddingId: string; onClose: () => void; onImported: () => void }) {
  const [rows, setRows] = useState<ImportRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  function reset() { setRows(null); setError(null); setResult(null) }
  function close() { reset(); onClose() }

  async function onFile(file: File | undefined) {
    if (!file) return
    reset()
    if (file.size > MAX_IMPORT_BYTES) { setError('Fichier trop volumineux (1 Mo maximum).'); return }
    if (!/\.(csv|txt)$/i.test(file.name)) { setError('Utilisez un fichier .csv.'); return }
    setBusy(true)
    try {
      const existing = new Set((await listAllGuests(weddingId)).map((g) => normalizeName(g.full_name)))
      setRows(analyzeGuestCsv(await file.text(), existing))
    } catch (e) {
      setError(e instanceof ImportFormatError || e instanceof Error ? e.message : 'Lecture impossible.')
    } finally { setBusy(false) }
  }

  const ok = rows?.filter((r) => r.status === 'ok') ?? []
  const errors = rows?.filter((r) => r.status === 'error') ?? []
  const dups = rows?.filter((r) => r.status === 'duplicate') ?? []

  async function confirm() {
    setBusy(true); setError(null)
    try {
      const { inserted, failed } = await insertGuestsBatch(weddingId, ok.map(({ full_name, phone, email, allowed_companions, notes }) => ({ full_name, phone, email, allowed_companions, notes })))
      setResult(`${inserted} invité${inserted > 1 ? 's' : ''} importé${inserted > 1 ? 's' : ''}${failed ? `, ${failed} refusé${failed > 1 ? 's' : ''} par la base` : ''}.`)
      setRows(null)
      onImported()
    } catch (e) { setError(e instanceof Error ? e.message : 'Import impossible.') }
    finally { setBusy(false) }
  }

  return (
    <Modal open={open} onClose={close} title="Importer des invités (CSV)" wide>
      <div className="space-y-4">
        {error && <Alert>{error}</Alert>}
        {result && <Alert tone="success">{result}</Alert>}
        {!rows && (
          <>
            <p className="text-sm text-ink-soft">
              Colonnes reconnues : <strong>Nom</strong> (obligatoire), Téléphone, Email, Accompagnants (0 à 20), Notes. Séparateur « ; » ou « , ».
              Les doublons (dans le fichier ou déjà présents) sont ignorés. L’affectation aux tables se fait ensuite dans « Tables ».
            </p>
            <input type="file" accept=".csv,.txt,text/csv" disabled={busy} onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = '' }} className="text-sm" />
          </>
        )}
        {rows && (
          <>
            <p className="flex flex-wrap gap-2 text-sm">
              <Badge tone="success">{ok.length} à importer</Badge>
              <Badge tone="warning">{dups.length} doublon{dups.length > 1 ? 's' : ''} ignoré{dups.length > 1 ? 's' : ''}</Badge>
              <Badge tone="danger">{errors.length} erreur{errors.length > 1 ? 's' : ''}</Badge>
            </p>
            {(errors.length > 0 || dups.length > 0) && (
              <ul className="max-h-48 space-y-1 overflow-y-auto rounded-xl bg-ivory-200 p-3 text-xs">
                {[...errors, ...dups].slice(0, 100).map((r) => <li key={r.line}>Ligne {r.line} — {r.full_name || '(vide)'} : {r.message}</li>)}
              </ul>
            )}
            <div className="flex gap-3">
              <Button onClick={() => void confirm()} loading={busy} disabled={ok.length === 0}>Importer {ok.length} invité{ok.length > 1 ? 's' : ''}</Button>
              <Button variant="secondary" onClick={reset} disabled={busy}>Choisir un autre fichier</Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
