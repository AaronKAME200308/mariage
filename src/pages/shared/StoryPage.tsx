import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Alert, EmptyState, Spinner } from '@/components/ui/Feedback'
import { TextAreaField, TextField } from '@/components/ui/Field'
import { ConfirmDialog, Modal } from '@/components/ui/Modal'
import { useWedding } from '@/features/weddings/WeddingContext'
import { useAsync } from '@/hooks/useAsync'
import { publicUrl, removeWeddingFile, uploadWeddingFile, validateFile } from '@/lib/storage'
import { formatDate } from '@/lib/utils'
import { deleteMilestone, listMilestones, saveMilestone } from '@/services/siteContent'
import type { StoryMilestone } from '@/types/domain'

const schema = z.object({
  title: z.string().trim().min(1, 'Indiquez un titre.').max(120),
  happened_on: z.string().optional(),
  description: z.string().trim().max(2000, '2 000 caractères maximum.').optional(),
})
type Values = z.infer<typeof schema>

function MilestoneForm({ weddingId, item, onDone }: { weddingId: string; item: StoryMilestone | null; onDone: () => void }) {
  const [imagePath, setImagePath] = useState<string | null>(item?.image_path ?? null)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { title: item?.title ?? '', happened_on: item?.happened_on ?? '', description: item?.description ?? '' },
  })

  async function pick(file: File | undefined) {
    if (!file) return
    const problem = validateFile(file, 'image')
    if (problem) { setError(problem); return }
    setUploading(true); setError(null)
    try { setImagePath(await uploadWeddingFile(weddingId, 'story', file, 'image')) }
    catch (e) { setError(e instanceof Error ? e.message : 'Envoi impossible.') }
    finally { setUploading(false) }
  }

  const submit = handleSubmit(async (v) => {
    setError(null)
    try {
      await saveMilestone(weddingId, { title: v.title, happened_on: v.happened_on || null, description: v.description || null, image_path: imagePath }, item?.id)
      if (item?.image_path && item.image_path !== imagePath) await removeWeddingFile('image', item.image_path)
      onDone()
    } catch (e) { setError(e instanceof Error ? e.message : 'Enregistrement impossible.') }
  })

  const img = publicUrl('image', imagePath)
  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {error && <Alert>{error}</Alert>}
      <TextField label="Titre" error={errors.title?.message} {...register('title')} />
      <TextField label="Date (facultatif)" type="date" {...register('happened_on')} />
      <TextAreaField label="Description" error={errors.description?.message} {...register('description')} />
      <div>
        <p className="mb-1.5 text-sm font-medium">Photo (facultatif)</p>
        {img && <img src={img} alt="Photo de l’étape" className="mb-2 h-32 rounded-xl object-cover" />}
        <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={uploading} onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = '' }} className="text-sm" />
        {img && <Button variant="ghost" size="sm" className="mt-1" onClick={() => setImagePath(null)}>Retirer la photo</Button>}
      </div>
      <Button type="submit" loading={isSubmitting || uploading} className="w-full">Enregistrer</Button>
    </form>
  )
}

export default function StoryPage() {
  const { wedding } = useWedding()
  useEffect(() => { document.title = 'Notre histoire — MariamCM' }, [])
  const [version, setVersion] = useState(0)
  const state = useAsync(() => listMilestones(wedding.id), [wedding.id, version])
  const [editing, setEditing] = useState<StoryMilestone | 'new' | null>(null)
  const [deleting, setDeleting] = useState<StoryMilestone | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function remove(m: StoryMilestone) {
    setBusy(true); setError(null)
    try {
      await deleteMilestone(m.id)
      await removeWeddingFile('image', m.image_path)
      setVersion((n) => n + 1)
    } catch (e) { setError(e instanceof Error ? e.message : 'Suppression impossible.') }
    finally { setBusy(false); setDeleting(null) }
  }

  return (
    <>
      <PageHeader title="Notre histoire" description="Les moments importants de votre histoire, affichés sous forme de chronologie. Le texte d’introduction se modifie dans « Personnalisation »."
        actions={<Button onClick={() => setEditing('new')}><Plus className="size-4" aria-hidden />Ajouter une étape</Button>} />
      {error && <Alert className="mb-6">{error}</Alert>}
      {state.status === 'loading' && <Spinner />}
      {state.status === 'error' && <Alert>{state.error.message}</Alert>}
      {state.status === 'success' && (state.data.length === 0
        ? <EmptyState title="Aucune étape" description="Ajoutez votre rencontre, vos fiançailles… ces moments qui vous ressemblent." action={<Button onClick={() => setEditing('new')}>Ajouter une étape</Button>} />
        : (
          <ul className="space-y-3">
            {state.data.map((m) => (
              <li key={m.id} className="flex items-start justify-between gap-4 rounded-2xl border border-forest/10 bg-white p-4">
                <div className="flex min-w-0 gap-4">
                  {m.image_path && <img src={publicUrl('image', m.image_path) ?? ''} alt="" className="size-16 shrink-0 rounded-xl object-cover" />}
                  <div className="min-w-0">
                    <p className="font-medium text-forest">{m.title}</p>
                    {m.happened_on && <p className="text-xs text-ink-soft">{formatDate(m.happened_on + 'T12:00:00Z', 'UTC')}</p>}
                    {m.description && <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{m.description}</p>}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(m)} aria-label={`Modifier ${m.title}`}><Pencil className="size-4" aria-hidden /></Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleting(m)} aria-label={`Supprimer ${m.title}`}><Trash2 className="size-4" aria-hidden /></Button>
                </div>
              </li>
            ))}
          </ul>
        ))}
      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'Nouvelle étape' : 'Modifier l’étape'} wide>
        {editing !== null && <MilestoneForm weddingId={wedding.id} item={editing === 'new' ? null : editing} onDone={() => { setEditing(null); setVersion((n) => n + 1) }} />}
      </Modal>
      <ConfirmDialog open={deleting !== null} danger busy={busy} title="Supprimer l’étape" confirmLabel="Supprimer"
        message={`Supprimer « ${deleting?.title ?? ''} » ? Cette action est irréversible.`} onCancel={() => setDeleting(null)} onConfirm={() => deleting && void remove(deleting)} />
    </>
  )
}
