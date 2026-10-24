import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, ImagePlus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { Button, buttonStyles } from '@/components/ui/Button'
import { Alert, EmptyState, Spinner } from '@/components/ui/Feedback'
import { ConfirmDialog } from '@/components/ui/Modal'
import { useWedding } from '@/features/weddings/WeddingContext'
import { useAsync } from '@/hooks/useAsync'
import { publicUrl, readImageSize, removeWeddingFile, uploadWeddingFile, validateFile } from '@/lib/storage'
import { addGalleryImage, deleteGalleryImage, listGallery, swapGalleryOrder, updateGalleryCaption } from '@/services/siteContent'
import type { GalleryImage } from '@/types/domain'

const MAX_IMAGES = 80

function CaptionInput({ image, onError }: { image: GalleryImage; onError: (m: string) => void }) {
  const [value, setValue] = useState(image.caption ?? '')
  return (
    <input
      aria-label="Légende de la photo" placeholder="Légende (facultatif)" maxLength={200} value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        if (value === (image.caption ?? '')) return
        updateGalleryCaption(image.id, value.trim() || null).catch((e: Error) => onError(e.message))
      }}
      className="w-full rounded-lg border border-forest/20 px-3 py-2 text-sm focus:border-forest focus:ring-2 focus:ring-forest/20 focus:outline-none"
    />
  )
}

export default function GalleryPage() {
  const { wedding } = useWedding()
  useEffect(() => { document.title = 'Galerie — MariamCM' }, [])
  const [version, setVersion] = useState(0)
  const state = useAsync(() => listGallery(wedding.id), [wedding.id, version])
  const [busy, setBusy] = useState(false)
  const [messages, setMessages] = useState<string[]>([])
  const [deleting, setDeleting] = useState<GalleryImage | null>(null)

  async function addFiles(files: FileList | null, current: GalleryImage[]) {
    if (!files || files.length === 0) return
    setBusy(true); setMessages([])
    const errors: string[] = []
    let order = current.reduce((m, i) => Math.max(m, i.sort_order ?? 0), 0)
    const list = Array.from(files).slice(0, Math.max(0, MAX_IMAGES - current.length))
    if (files.length > list.length) errors.push(`Limite de ${MAX_IMAGES} photos : certaines n’ont pas été ajoutées.`)
    for (const file of list) {
      const problem = validateFile(file, 'image')
      if (problem) { errors.push(`${file.name} : ${problem}`); continue }
      try {
        const size = await readImageSize(file)
        const path = await uploadWeddingFile(wedding.id, 'gallery', file, 'image')
        try { await addGalleryImage(wedding.id, path, size, ++order) }
        catch (e) { await removeWeddingFile('image', path); throw e }
      } catch (e) { errors.push(`${file.name} : ${e instanceof Error ? e.message : 'échec'}`) }
    }
    setMessages(errors); setBusy(false); setVersion((n) => n + 1)
  }

  async function move(list: GalleryImage[], index: number, delta: number) {
    const other = list[index + delta]
    if (!other) return
    try { await swapGalleryOrder(list[index], other); setVersion((n) => n + 1) }
    catch (e) { setMessages([e instanceof Error ? e.message : 'Déplacement impossible.']) }
  }

  async function remove(img: GalleryImage) {
    setBusy(true)
    try { await deleteGalleryImage(img.id); await removeWeddingFile('image', img.storage_path); setVersion((n) => n + 1) }
    catch (e) { setMessages([e instanceof Error ? e.message : 'Suppression impossible.']) }
    finally { setBusy(false); setDeleting(null) }
  }

  const images = state.status === 'success' ? state.data : []
  return (
    <>
      <PageHeader title="Galerie" description="Ajoutez vos photos (JPEG, PNG, WebP ou AVIF, 5 Mo maximum chacune). Elles s’affichent avec un agrandissement sur votre site."
        actions={
          <label className={`${buttonStyles('primary')} cursor-pointer ${busy ? 'pointer-events-none opacity-60' : ''}`}>
            <ImagePlus className="size-4" aria-hidden />{busy ? 'Traitement…' : 'Ajouter des photos'}
            <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" disabled={busy}
              onChange={(e) => { void addFiles(e.target.files, images); e.target.value = '' }} />
          </label>
        } />
      {messages.length > 0 && <Alert className="mb-6"><ul className="list-disc pl-4">{messages.map((m) => <li key={m}>{m}</li>)}</ul></Alert>}
      {state.status === 'loading' && <Spinner />}
      {state.status === 'error' && <Alert>{state.error.message}</Alert>}
      {state.status === 'success' && (images.length === 0
        ? <EmptyState title="Aucune photo" description="Ajoutez vos plus belles photos pour illustrer votre site." />
        : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {images.map((img, i) => (
              <li key={img.id} className="overflow-hidden rounded-2xl border border-forest/10 bg-white">
                <img src={publicUrl('image', img.storage_path) ?? ''} alt={img.caption ?? `Photo ${i + 1}`} loading="lazy" className="h-48 w-full object-cover" />
                <div className="space-y-3 p-3">
                  <CaptionInput image={img} onError={(m) => setMessages([m])} />
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" disabled={i === 0} onClick={() => void move(images, i, -1)} aria-label="Déplacer avant"><ArrowUp className="size-4" aria-hidden /></Button>
                      <Button variant="ghost" size="sm" disabled={i === images.length - 1} onClick={() => void move(images, i, 1)} aria-label="Déplacer après"><ArrowDown className="size-4" aria-hidden /></Button>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setDeleting(img)} aria-label="Supprimer la photo"><Trash2 className="size-4" aria-hidden /></Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ))}
      <ConfirmDialog open={deleting !== null} danger busy={busy} title="Supprimer la photo" confirmLabel="Supprimer"
        message="Cette photo sera retirée de la galerie et supprimée définitivement." onCancel={() => setDeleting(null)} onConfirm={() => deleting && void remove(deleting)} />
    </>
  )
}
