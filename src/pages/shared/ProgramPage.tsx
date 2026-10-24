import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Alert, EmptyState, Spinner } from '@/components/ui/Feedback'
import { SelectField, TextAreaField, TextField } from '@/components/ui/Field'
import { ConfirmDialog, Modal } from '@/components/ui/Modal'
import { useWedding } from '@/features/weddings/WeddingContext'
import { useAsync } from '@/hooks/useAsync'
import { formatDateTime, isoToLocalInput, localInputToIso } from '@/lib/time'
import { deleteEvent, listEvents, saveEvent } from '@/services/siteContent'
import type { EventKind, WeddingEvent } from '@/types/domain'

const KINDS: Record<EventKind, string> = {
  civil_ceremony: 'Cérémonie civile', religious_ceremony: 'Cérémonie religieuse', reception: 'Réception',
  cocktail: 'Cocktail', dinner: 'Dîner', party: 'Soirée', other: 'Autre',
}

const schema = z.object({
  kind: z.enum(Object.keys(KINDS) as [EventKind, ...EventKind[]]),
  title: z.string().trim().min(1, 'Indiquez un titre.').max(120),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
  venue_name: z.string().trim().max(160).optional(),
  address: z.string().trim().max(300).optional(),
  map_url: z.string().trim().max(500).refine((v) => v === '' || /^https:\/\//i.test(v), 'Le lien doit commencer par https://').optional(),
  dress_code: z.string().trim().max(160).optional(),
  description: z.string().trim().max(2000, '2 000 caractères maximum.').optional(),
}).refine((v) => !v.starts_at || !v.ends_at || v.ends_at >= v.starts_at, { path: ['ends_at'], message: 'La fin doit être après le début.' })
type Values = z.infer<typeof schema>

function EventForm({ weddingId, tz, item, onDone }: { weddingId: string; tz: string; item: WeddingEvent | null; onDone: () => void }) {
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      kind: item?.kind ?? 'civil_ceremony', title: item?.title ?? '', starts_at: isoToLocalInput(item?.starts_at, tz),
      ends_at: isoToLocalInput(item?.ends_at, tz), venue_name: item?.venue_name ?? '', address: item?.address ?? '',
      map_url: item?.map_url ?? '', dress_code: item?.dress_code ?? '', description: item?.description ?? '',
    },
  })
  const submit = handleSubmit(async (v) => {
    setError(null)
    try {
      await saveEvent(weddingId, {
        kind: v.kind, title: v.title,
        starts_at: v.starts_at ? localInputToIso(v.starts_at, tz) : null, ends_at: v.ends_at ? localInputToIso(v.ends_at, tz) : null,
        venue_name: v.venue_name || null, address: v.address || null, map_url: v.map_url || null,
        dress_code: v.dress_code || null, description: v.description || null,
      }, item?.id)
      onDone()
    } catch (e) { setError(e instanceof Error ? e.message : 'Enregistrement impossible.') }
  })
  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {error && <Alert>{error}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Type" {...register('kind')}>
          {(Object.entries(KINDS) as Array<[EventKind, string]>).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </SelectField>
        <TextField label="Titre" error={errors.title?.message} {...register('title')} />
        <TextField label="Début" type="datetime-local" hint={`Heure locale (${tz})`} {...register('starts_at')} />
        <TextField label="Fin (facultatif)" type="datetime-local" error={errors.ends_at?.message} {...register('ends_at')} />
      </div>
      <TextField label="Lieu" {...register('venue_name')} />
      <TextField label="Adresse" {...register('address')} />
      <TextField label="Lien cartographique (https://…)" type="url" error={errors.map_url?.message} {...register('map_url')} />
      <TextField label="Code vestimentaire" {...register('dress_code')} />
      <TextAreaField label="Description" error={errors.description?.message} {...register('description')} />
      <Button type="submit" loading={isSubmitting} className="w-full">Enregistrer</Button>
    </form>
  )
}

export default function ProgramPage() {
  const { wedding } = useWedding()
  useEffect(() => { document.title = 'Programme — MariamCM' }, [])
  const [version, setVersion] = useState(0)
  const state = useAsync(() => listEvents(wedding.id), [wedding.id, version])
  const [editing, setEditing] = useState<WeddingEvent | 'new' | null>(null)
  const [deleting, setDeleting] = useState<WeddingEvent | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function remove(e: WeddingEvent) {
    setBusy(true); setError(null)
    try { await deleteEvent(e.id); setVersion((n) => n + 1) }
    catch (err) { setError(err instanceof Error ? err.message : 'Suppression impossible.') }
    finally { setBusy(false); setDeleting(null) }
  }

  return (
    <>
      <PageHeader title="Programme" description="Cérémonies, cocktail, dîner, soirée… Les événements s’affichent dans l’ordre chronologique sur votre site."
        actions={<Button onClick={() => setEditing('new')}><Plus className="size-4" aria-hidden />Ajouter un événement</Button>} />
      {error && <Alert className="mb-6">{error}</Alert>}
      {state.status === 'loading' && <Spinner />}
      {state.status === 'error' && <Alert>{state.error.message}</Alert>}
      {state.status === 'success' && (state.data.length === 0
        ? <EmptyState title="Aucun événement" description="Ajoutez la cérémonie, la réception… avec les horaires et les lieux." action={<Button onClick={() => setEditing('new')}>Ajouter un événement</Button>} />
        : (
          <ul className="space-y-3">
            {[...state.data].sort((a, b) => (a.starts_at ?? '9').localeCompare(b.starts_at ?? '9')).map((e) => (
              <li key={e.id} className="flex items-start justify-between gap-4 rounded-2xl border border-forest/10 bg-white p-4">
                <div className="min-w-0">
                  <p className="text-xs font-medium tracking-wide text-champagne-700 uppercase">{KINDS[e.kind]}</p>
                  <p className="font-medium text-forest">{e.title}</p>
                  <p className="text-sm text-ink-soft">{formatDateTime(e.starts_at, wedding.timezone) || 'Date à définir'}{e.venue_name ? ` · ${e.venue_name}` : ''}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(e)} aria-label={`Modifier ${e.title}`}><Pencil className="size-4" aria-hidden /></Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleting(e)} aria-label={`Supprimer ${e.title}`}><Trash2 className="size-4" aria-hidden /></Button>
                </div>
              </li>
            ))}
          </ul>
        ))}
      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'Nouvel événement' : 'Modifier l’événement'} wide>
        {editing !== null && <EventForm weddingId={wedding.id} tz={wedding.timezone} item={editing === 'new' ? null : editing} onDone={() => { setEditing(null); setVersion((n) => n + 1) }} />}
      </Modal>
      <ConfirmDialog open={deleting !== null} danger busy={busy} title="Supprimer l’événement" confirmLabel="Supprimer"
        message={`Supprimer « ${deleting?.title ?? ''} » ?`} onCancel={() => setDeleting(null)} onConfirm={() => deleting && void remove(deleting)} />
    </>
  )
}
