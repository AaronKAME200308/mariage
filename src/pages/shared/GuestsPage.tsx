import { useCallback, useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Download, Pencil, Plus, QrCode, Search, Trash2, Upload } from 'lucide-react'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Alert, EmptyState, Spinner } from '@/components/ui/Feedback'
import { SelectField } from '@/components/ui/Field'
import { ConfirmDialog, Modal } from '@/components/ui/Modal'
import { GuestForm } from '@/features/guests/GuestForm'
import { ImportDialog } from '@/features/guests/ImportDialog'
import { QrDialog } from '@/features/guests/QrDialog'
import { useWedding } from '@/features/weddings/WeddingContext'
import { useAsync } from '@/hooks/useAsync'
import { downloadTextFile, toCsv } from '@/lib/csv'
import { RSVP_LABEL } from '@/lib/seats'
import {
  deleteGuest, fetchActiveTokens, fetchRevokedGuestIds, listAllGuests, listGuestsPage, listTables, type GuestQuery,
} from '@/services/guests'
import type { Guest, RsvpStatus } from '@/types/domain'

const PAGE_SIZE = 20
const RSVP_TONE = { pending: 'neutral', confirmed: 'success', declined: 'danger' } as const

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value)
  useEffect(() => { const id = setTimeout(() => setV(value), ms); return () => clearTimeout(id) }, [value, ms])
  return v
}

export default function GuestsPage() {
  const { wedding } = useWedding()
  useEffect(() => { document.title = 'Invités — MariamCM' }, [])

  const [search, setSearch] = useState('')
  const debounced = useDebounced(search, 300)
  const [rsvp, setRsvp] = useState<RsvpStatus | 'all'>('all')
  const [table, setTable] = useState('all')
  const [arrival, setArrival] = useState<GuestQuery['arrival']>('all')
  const [sort, setSort] = useState<GuestQuery['sort']>('full_name')
  const [ascending, setAscending] = useState(true)
  const [page, setPage] = useState(0)
  const [version, setVersion] = useState(0)
  const refresh = useCallback(() => setVersion((n) => n + 1), [])

  const tables = useAsync(() => listTables(wedding.id), [wedding.id, version])
  const list = useAsync(async () => {
    const res = await listGuestsPage({ weddingId: wedding.id, page, pageSize: PAGE_SIZE, search: debounced, rsvp, table, arrival, sort, ascending })
    const ids = res.rows.map((g) => g.id)
    const [tokens, revoked] = await Promise.all([fetchActiveTokens(ids), fetchRevokedGuestIds(ids)])
    return { ...res, tokens, revoked }
  }, [wedding.id, page, debounced, rsvp, table, arrival, sort, ascending, version])

  const [editing, setEditing] = useState<Guest | 'new' | null>(null)
  const [qrGuest, setQrGuest] = useState<Guest | null>(null)
  const [deleting, setDeleting] = useState<Guest | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  const tableList = tables.status === 'success' ? tables.data : []
  const tableName = (id: string | null) => tableList.find((t) => t.id === id)?.name ?? null
  const resetPage = () => setPage(0)

  async function remove(g: Guest) {
    setBusy(true); setNotice(null)
    try { await deleteGuest(g.id); setNotice({ tone: 'success', text: `${g.full_name} a été supprimé.` }); refresh() }
    catch (e) { setNotice({ tone: 'error', text: e instanceof Error ? e.message : 'Suppression impossible.' }) }
    finally { setBusy(false); setDeleting(null) }
  }

  async function exportCsv() {
    setBusy(true); setNotice(null)
    try {
      const [all, tbls] = await Promise.all([listAllGuests(wedding.id), listTables(wedding.id)])
      const name = (id: string | null) => tbls.find((t) => t.id === id)?.name ?? ''
      const rows = [
        ['Nom', 'Téléphone', 'Email', 'RSVP', 'Accompagnants autorisés', 'Accompagnants confirmés', 'Table', 'Arrivé', 'Personnes entrées', 'Notes'],
        ...all.map((g) => [g.full_name, g.phone, g.email, RSVP_LABEL[g.rsvp_status], g.allowed_companions, g.confirmed_companions, name(g.table_id), g.arrived_count > 0 ? 'Oui' : 'Non', g.arrived_count, g.notes]),
      ]
      downloadTextFile(`invites-${wedding.slug}.csv`, toCsv(rows))
    } catch (e) { setNotice({ tone: 'error', text: e instanceof Error ? e.message : 'Export impossible.' }) }
    finally { setBusy(false) }
  }

  const SortHeader = ({ col, children }: { col: GuestQuery['sort']; children: React.ReactNode }) => (
    <th scope="col" aria-sort={sort === col ? (ascending ? 'ascending' : 'descending') : 'none'} className="px-4 py-3 text-left font-medium">
      <button type="button" className="inline-flex items-center gap-1 hover:text-forest" onClick={() => { if (sort === col) setAscending(!ascending); else { setSort(col); setAscending(true) } resetPage() }}>
        {children}{sort === col && (ascending ? <ArrowUp className="size-3" aria-hidden /> : <ArrowDown className="size-3" aria-hidden />)}
      </button>
    </th>
  )

  const data = list.status === 'success' ? list.data : null
  const pages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1
  const filtered = debounced !== '' || rsvp !== 'all' || table !== 'all' || arrival !== 'all'

  return (
    <>
      <PageHeader title="Invités" description="Liste des invités, confirmations de présence, tables et QR codes de contrôle d’accès."
        actions={<>
          <Button variant="secondary" size="sm" onClick={() => setImportOpen(true)}><Upload className="size-4" aria-hidden />Importer CSV</Button>
          <Button variant="secondary" size="sm" onClick={() => void exportCsv()} disabled={busy}><Download className="size-4" aria-hidden />Exporter CSV</Button>
          <Button onClick={() => setEditing('new')}><Plus className="size-4" aria-hidden />Ajouter un invité</Button>
        </>} />
      {notice && <Alert tone={notice.tone} className="mb-6">{notice.text}</Alert>}

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="relative sm:col-span-2 xl:col-span-1">
          <label htmlFor="g-search" className="sr-only">Rechercher un invité</label>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-soft" aria-hidden />
          <input id="g-search" type="search" placeholder="Nom, e-mail, téléphone…" value={search} onChange={(e) => { setSearch(e.target.value); resetPage() }}
            className="w-full rounded-xl border border-forest/20 bg-white py-3 pr-4 pl-9 text-sm focus:border-forest focus:ring-2 focus:ring-forest/20 focus:outline-none" />
        </div>
        <SelectField label="Réponse" value={rsvp} onChange={(e) => { setRsvp(e.target.value as RsvpStatus | 'all'); resetPage() }} className="py-2.5">
          <option value="all">Toutes les réponses</option>
          {(Object.keys(RSVP_LABEL) as RsvpStatus[]).map((s) => <option key={s} value={s}>{RSVP_LABEL[s]}</option>)}
        </SelectField>
        <SelectField label="Table" value={table} onChange={(e) => { setTable(e.target.value); resetPage() }} className="py-2.5">
          <option value="all">Toutes les tables</option>
          <option value="none">Sans table</option>
          {tableList.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </SelectField>
        <SelectField label="Arrivée" value={arrival} onChange={(e) => { setArrival(e.target.value as GuestQuery['arrival']); resetPage() }} className="py-2.5">
          <option value="all">Tous</option>
          <option value="arrived">Déjà entrés</option>
          <option value="not_arrived">Pas encore entrés</option>
        </SelectField>
      </div>

      {list.status === 'loading' && !data && <Spinner />}
      {list.status === 'error' && <Alert>{list.error.message}</Alert>}
      {data && (data.total === 0 ? (
        <EmptyState title={filtered ? 'Aucun résultat' : 'Aucun invité'} description={filtered ? 'Modifiez vos filtres ou votre recherche.' : 'Ajoutez vos invités un par un ou importez un fichier CSV.'}
          action={!filtered ? <Button onClick={() => setEditing('new')}>Ajouter un invité</Button> : undefined} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-forest/10 bg-white">
            <table className="w-full min-w-[56rem] text-sm">
              <caption className="sr-only">Liste des invités</caption>
              <thead className="border-b border-forest/10 bg-ivory-200 text-xs text-ink-soft uppercase">
                <tr>
                  <SortHeader col="full_name">Nom</SortHeader>
                  <SortHeader col="rsvp_status">Réponse</SortHeader>
                  <SortHeader col="allowed_companions">Accompagnants</SortHeader>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Table</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">QR code</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Accès</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forest/10">
                {data.rows.map((g) => (
                  <tr key={g.id}>
                    <th scope="row" className="px-4 py-3 text-left font-medium text-ink">
                      {g.full_name}
                      {(g.email || g.phone) && <span className="block text-xs font-normal text-ink-soft">{[g.phone, g.email].filter(Boolean).join(' · ')}</span>}
                    </th>
                    <td className="px-4 py-3"><Badge tone={RSVP_TONE[g.rsvp_status]}>{RSVP_LABEL[g.rsvp_status]}</Badge></td>
                    <td className="px-4 py-3 text-ink-soft">{g.confirmed_companions} confirmé{g.confirmed_companions > 1 ? 's' : ''} / {g.allowed_companions} autorisé{g.allowed_companions > 1 ? 's' : ''}</td>
                    <td className="px-4 py-3 text-ink-soft">{tableName(g.table_id) ?? '—'}</td>
                    <td className="px-4 py-3">{data.tokens[g.id] ? <Badge tone="success">Actif</Badge> : data.revoked.has(g.id) ? <Badge tone="danger">Révoqué</Badge> : <Badge>Aucun</Badge>}</td>
                    <td className="px-4 py-3">{g.arrived_count > 0 ? <Badge tone="success">Entré ({g.arrived_count})</Badge> : <Badge>Non arrivé</Badge>}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setQrGuest(g)} aria-label={`QR code de ${g.full_name}`}><QrCode className="size-4" aria-hidden /></Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditing(g)} aria-label={`Modifier ${g.full_name}`}><Pencil className="size-4" aria-hidden /></Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleting(g)} aria-label={`Supprimer ${g.full_name}`}><Trash2 className="size-4" aria-hidden /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm text-ink-soft">
            <p>{data.total} invité{data.total > 1 ? 's' : ''} · page {page + 1} / {pages}</p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Précédent</Button>
              <Button variant="secondary" size="sm" disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)}>Suivant</Button>
            </div>
          </nav>
        </>
      ))}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'Nouvel invité' : 'Modifier l’invité'} wide>
        {editing !== null && <GuestForm weddingId={wedding.id} guest={editing === 'new' ? null : editing} tables={tableList} onDone={() => { setEditing(null); refresh() }} />}
      </Modal>
      <QrDialog guest={qrGuest} token={qrGuest && data ? data.tokens[qrGuest.id] ?? null : null} tableName={qrGuest ? tableName(qrGuest.table_id) : null}
        onClose={() => setQrGuest(null)} onChanged={refresh} />
      <ImportDialog open={importOpen} weddingId={wedding.id} onClose={() => setImportOpen(false)} onImported={refresh} />
      <ConfirmDialog open={deleting !== null} danger busy={busy} title="Supprimer l’invité" confirmLabel="Supprimer"
        message={`Supprimer « ${deleting?.full_name ?? ''} » ? Son QR code et son historique de contrôle seront définitivement supprimés.`}
        onCancel={() => setDeleting(null)} onConfirm={() => deleting && void remove(deleting)} />
    </>
  )
}
