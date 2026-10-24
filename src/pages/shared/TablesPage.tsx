import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Alert, EmptyState, Spinner } from '@/components/ui/Feedback'
import { SelectField, TextField } from '@/components/ui/Field'
import { ConfirmDialog, Modal } from '@/components/ui/Modal'
import { useWedding } from '@/features/weddings/WeddingContext'
import { useAsync } from '@/hooks/useAsync'
import { guestSeats, tableOccupancy } from '@/lib/seats'
import { assignGuestToTable, deleteTable, listAllGuests, listTables, saveTable } from '@/services/guests'
import type { Guest, TableRow } from '@/types/domain'

const schema = z.object({
  name: z.string().trim().min(1, 'Indiquez un nom.').max(60, '60 caractères maximum.'),
  capacity: z.number('Indiquez un nombre.').int().min(1, 'Minimum 1.').max(500, 'Maximum 500.'),
})
type Values = z.infer<typeof schema>

function TableForm({ weddingId, table, onDone }: { weddingId: string; table: TableRow | null; onDone: () => void }) {
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema), defaultValues: { name: table?.name ?? '', capacity: table?.capacity ?? 8 },
  })
  const submit = handleSubmit(async (v) => {
    setError(null)
    try { await saveTable(weddingId, v, table?.id); onDone() }
    catch (e) { setError(e instanceof Error ? e.message : 'Enregistrement impossible.') }
  })
  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {error && <Alert>{error}</Alert>}
      <TextField label="Nom de la table" placeholder="Table 1" error={errors.name?.message} {...register('name')} />
      <TextField label="Capacité (places)" type="number" min={1} max={500} error={errors.capacity?.message} {...register('capacity', { valueAsNumber: true })} />
      <Button type="submit" loading={isSubmitting} className="w-full">Enregistrer</Button>
    </form>
  )
}

export default function TablesPage() {
  const { wedding } = useWedding()
  useEffect(() => { document.title = 'Tables — MariamCM' }, [])
  const [version, setVersion] = useState(0)
  const refresh = () => setVersion((n) => n + 1)
  const state = useAsync(async () => {
    const [tables, guests] = await Promise.all([listTables(wedding.id), listAllGuests(wedding.id)])
    return { tables, guests }
  }, [wedding.id, version])

  const [editing, setEditing] = useState<TableRow | 'new' | null>(null)
  const [deleting, setDeleting] = useState<TableRow | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  async function assign(guest: Guest, tableId: string | null) {
    setBusy(true); setNotice(null)
    try { await assignGuestToTable(guest.id, tableId); refresh() }
    catch (e) { setNotice({ tone: 'error', text: e instanceof Error ? e.message : 'Affectation impossible.' }); refresh() }
    finally { setBusy(false) }
  }
  async function remove(t: TableRow) {
    setBusy(true); setNotice(null)
    try { await deleteTable(t.id); setNotice({ tone: 'success', text: `${t.name} supprimée : ses invités n’ont plus de table.` }); refresh() }
    catch (e) { setNotice({ tone: 'error', text: e instanceof Error ? e.message : 'Suppression impossible.' }) }
    finally { setBusy(false); setDeleting(null) }
  }

  const tables = state.status === 'success' ? state.data.tables : []
  const guests = state.status === 'success' ? state.data.guests : []
  const unassigned = guests.filter((g) => !g.table_id && g.rsvp_status !== 'declined')

  return (
    <>
      <PageHeader title="Tables" description="Créez vos tables et affectez vos invités. Les places d’un invité incluent ses accompagnants ; la capacité ne peut jamais être dépassée."
        actions={<Button onClick={() => setEditing('new')}><Plus className="size-4" aria-hidden />Nouvelle table</Button>} />
      {notice && <Alert tone={notice.tone} className="mb-6">{notice.text}</Alert>}
      {state.status === 'loading' && <Spinner />}
      {state.status === 'error' && <Alert>{state.error.message}</Alert>}
      {state.status === 'success' && (tables.length === 0
        ? <EmptyState title="Aucune table" description="Créez votre première table pour commencer à placer vos invités." action={<Button onClick={() => setEditing('new')}>Nouvelle table</Button>} />
        : (
          <>
            <ul className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
              {tables.map((t) => {
                const { used, free } = tableOccupancy(t, guests)
                const seated = guests.filter((g) => g.table_id === t.id)
                const candidates = unassigned.filter((g) => guestSeats(g) <= free)
                const pct = Math.min(100, Math.round((used / t.capacity) * 100))
                return (
                  <li key={t.id} className="rounded-2xl border border-forest/10 bg-white p-5 shadow-soft">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-2xl font-semibold text-forest">{t.name}</h2>
                        <p className="text-sm text-ink-soft">{used} / {t.capacity} places occupées · {free} disponible{free > 1 ? 's' : ''}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditing(t)} aria-label={`Modifier ${t.name}`}><Pencil className="size-4" aria-hidden /></Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleting(t)} aria-label={`Supprimer ${t.name}`}><Trash2 className="size-4" aria-hidden /></Button>
                      </div>
                    </div>
                    <div role="progressbar" aria-label={`Occupation de ${t.name}`} aria-valuemin={0} aria-valuemax={t.capacity} aria-valuenow={used} className="mt-3 h-2 overflow-hidden rounded-full bg-sage-100">
                      <div className={`h-full rounded-full ${free === 0 ? 'bg-champagne-700' : 'bg-forest'}`} style={{ width: `${pct}%` }} />
                    </div>
                    {seated.length > 0 && (
                      <ul className="mt-4 divide-y divide-forest/10 text-sm">
                        {seated.map((g) => (
                          <li key={g.id} className="flex items-center justify-between gap-2 py-2">
                            <span>{g.full_name} <span className="text-xs text-ink-soft">({guestSeats(g)} place{guestSeats(g) > 1 ? 's' : ''})</span></span>
                            <Button variant="ghost" size="sm" disabled={busy} onClick={() => void assign(g, null)} aria-label={`Retirer ${g.full_name} de ${t.name}`}><X className="size-4" aria-hidden /></Button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-4">
                      <SelectField label="Ajouter un invité" value="" disabled={busy || candidates.length === 0}
                        onChange={(e) => { const g = guests.find((x) => x.id === e.target.value); if (g) void assign(g, t.id) }}
                        hint={candidates.length === 0 ? (unassigned.length === 0 ? 'Tous les invités sont placés.' : 'Aucun invité sans table ne tient dans les places restantes.') : undefined}>
                        <option value="">Choisir…</option>
                        {candidates.map((g) => <option key={g.id} value={g.id}>{g.full_name} ({guestSeats(g)} place{guestSeats(g) > 1 ? 's' : ''})</option>)}
                      </SelectField>
                    </div>
                  </li>
                )
              })}
            </ul>
            <p className="mt-6 text-sm text-ink-soft">{unassigned.length} invité{unassigned.length > 1 ? 's' : ''} sans table (hors invités ayant décliné).</p>
          </>
        ))}
      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'Nouvelle table' : 'Modifier la table'}>
        {editing !== null && <TableForm weddingId={wedding.id} table={editing === 'new' ? null : editing} onDone={() => { setEditing(null); refresh() }} />}
      </Modal>
      <ConfirmDialog open={deleting !== null} danger busy={busy} title="Supprimer la table" confirmLabel="Supprimer"
        message={`Supprimer « ${deleting?.name ?? ''} » ? Les invités placés à cette table n’auront plus de table.`} onCancel={() => setDeleting(null)} onConfirm={() => deleting && void remove(deleting)} />
    </>
  )
}
