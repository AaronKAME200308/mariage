import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Gift as GiftIcon, Pencil, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Alert, EmptyState, Spinner } from '@/components/ui/Feedback'
import { SelectField, TextAreaField, TextField } from '@/components/ui/Field'
import { ConfirmDialog, Modal } from '@/components/ui/Modal'
import { useWedding } from '@/features/weddings/WeddingContext'
import { useAsync } from '@/hooks/useAsync'
import { publicUrl, removeWeddingFile, uploadWeddingFile, validateFile } from '@/lib/storage'
import { deleteGift, listGifts, saveGift, type GiftRow } from '@/services/moderation'

const STATUS = { available: 'Disponible', reserved: 'Réservé', unavailable: 'Indisponible' } as const
const schema = z.object({
  name: z.string().trim().min(1, 'Indiquez un nom.').max(120, '120 caractères maximum.'),
  description: z.string().trim().max(1000, '1 000 caractères maximum.').optional(),
  suggested_amount: z.union([z.literal(''), z.coerce.number('Montant invalide.').min(0, 'Montant invalide.').max(1e9, 'Montant trop élevé.')]).optional(),
  currency: z.string().regex(/^[A-Z]{3}$/, '3 lettres majuscules (ex. XAF).'),
  external_url: z.union([z.literal(''), z.url('Lien invalide.').refine((u) => u.startsWith('https://'), 'Le lien doit commencer par https://')]).optional(),
  status: z.enum(['available', 'reserved', 'unavailable']),
})
type Values = z.input<typeof schema>

function GiftForm({ weddingId, gift, nextOrder, onDone }: { weddingId: string; gift: GiftRow | null; nextOrder: number; onDone: () => void }) {
  const [error, setError] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: gift?.name ?? '', description: gift?.description ?? '', suggested_amount: gift?.suggested_amount?.toString() ?? '', currency: gift?.currency ?? 'XAF', external_url: gift?.external_url ?? '', status: gift?.status ?? 'available' },
  })
  const submit = handleSubmit(async (raw) => {
    setError(null)
    const v = schema.parse(raw)
    let uploaded: string | null = null
    try {
      if (file) {
        const problem = validateFile(file, 'image')
        if (problem) { setError(problem); return }
        uploaded = await uploadWeddingFile(weddingId, 'gifts', file, 'image')
      }
      await saveGift(weddingId, {
        name: v.name, description: v.description || null, suggested_amount: v.suggested_amount === '' || v.suggested_amount === undefined ? null : Number(v.suggested_amount),
        currency: v.currency, external_url: v.external_url || null, status: v.status, ...(uploaded ? { image_path: uploaded } : {}),
      }, gift?.id, nextOrder)
      if (uploaded && gift?.image_path) void removeWeddingFile('image', gift.image_path).catch(() => undefined)
      onDone()
    } catch (e) {
      if (uploaded) void removeWeddingFile('image', uploaded).catch(() => undefined)
      setError(e instanceof Error ? e.message : 'Enregistrement impossible.')
    }
  })
  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {error && <Alert>{error}</Alert>}
      <TextField label="Nom du cadeau" error={errors.name?.message} {...register('name')} />
      <TextAreaField label="Description (facultatif)" rows={3} error={errors.description?.message} {...register('description')} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Montant suggéré (facultatif)" type="number" step="0.01" min={0} error={errors.suggested_amount?.message} {...register('suggested_amount')} />
        <TextField label="Devise" maxLength={3} error={errors.currency?.message} {...register('currency')} />
      </div>
      <TextField label="Lien externe (facultatif)" type="url" hint="Boutique, cagnotte… Doit commencer par https://" error={errors.external_url?.message} {...register('external_url')} />
      <SelectField label="Statut" {...register('status')}>
        {Object.entries(STATUS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </SelectField>
      <div>
        <label htmlFor="gift-img" className="block text-sm font-medium text-ink">Photo (facultatif)</label>
        <input id="gift-img" type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mt-1.5 block w-full text-sm" />
      </div>
      <Button type="submit" loading={isSubmitting}>Enregistrer</Button>
    </form>
  )
}

export default function GiftsPage() {
  const { wedding } = useWedding()
  useEffect(() => { document.title = 'Cadeaux — MariamCM' }, [])
  const [version, setVersion] = useState(0)
  const state = useAsync(() => listGifts(wedding.id), [wedding.id, version])
  const [editing, setEditing] = useState<GiftRow | 'new' | null>(null)
  const [deleting, setDeleting] = useState<GiftRow | null>(null)
  const [error, setError] = useState<string | null>(null)
  const list = state.status === 'success' ? state.data : []
  const nextOrder = list.reduce((m, g) => Math.max(m, g.sort_order), 0) + 1

  return (
    <>
      <PageHeader title="Liste de cadeaux" description="MariamCM n’encaisse aucun paiement : chaque cadeau peut renvoyer vers un lien externe de votre choix."
        actions={<Button onClick={() => setEditing('new')}><Plus className="size-4" aria-hidden />Ajouter un cadeau</Button>} />
      {error && <Alert className="mb-4">{error}</Alert>}
      {state.status === 'loading' && <Spinner />}
      {state.status === 'error' && <Alert>{state.error.message}</Alert>}
      {state.status === 'success' && (list.length === 0
        ? <EmptyState title="Aucun cadeau" description="Ajoutez des idées de cadeaux pour vos invités." />
        : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {list.map((g) => (
              <li key={g.id} className="flex gap-4 rounded-2xl border border-forest/10 bg-white p-4">
                {g.image_path ? <img src={publicUrl('image', g.image_path) ?? undefined} alt="" className="size-20 shrink-0 rounded-xl object-cover" /> : <div className="grid size-20 shrink-0 place-items-center rounded-xl bg-ivory-200 text-sage"><GiftIcon className="size-7" aria-hidden /></div>}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">{g.name}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-soft"><Badge tone={g.status === 'available' ? 'success' : g.status === 'reserved' ? 'warning' : 'neutral'}>{STATUS[g.status]}</Badge>{g.suggested_amount !== null && `${g.suggested_amount} ${g.currency}`}</p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setEditing(g)}><Pencil className="size-4" aria-hidden /><span className="sr-only">Modifier {g.name}</span></Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleting(g)}><Trash2 className="size-4" aria-hidden /><span className="sr-only">Supprimer {g.name}</span></Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ))}
      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'Ajouter un cadeau' : 'Modifier le cadeau'}>
        {editing && <GiftForm weddingId={wedding.id} gift={editing === 'new' ? null : editing} nextOrder={nextOrder} onDone={() => { setEditing(null); setVersion((n) => n + 1) }} />}
      </Modal>
      <ConfirmDialog open={deleting !== null} title="Supprimer le cadeau" danger confirmLabel="Supprimer" message={`Supprimer « ${deleting?.name ?? ''} » ?`}
        onCancel={() => setDeleting(null)}
        onConfirm={() => deleting && void deleteGift(deleting.id).then(() => { if (deleting.image_path) void removeWeddingFile('image', deleting.image_path).catch(() => undefined); setVersion((n) => n + 1) }).catch((e: Error) => setError(e.message)).finally(() => setDeleting(null))} />
    </>
  )
}
