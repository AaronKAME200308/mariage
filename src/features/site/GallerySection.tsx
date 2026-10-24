import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { publicUrl } from '@/lib/storage'
import type { GalleryImage } from '@/types/domain'
import { SiteSection } from './SiteSection'

export function GallerySection({ title, images }: { title: string; images: GalleryImage[] }) {
  const [index, setIndex] = useState<number | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)

  const close = useCallback(() => {
    setIndex(null)
    openerRef.current?.focus()
  }, [])
  const step = useCallback((delta: number) => {
    setIndex((i) => (i === null ? i : (i + delta + images.length) % images.length))
  }, [images.length])

  useEffect(() => {
    if (index === null) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [index, close, step])

  const current = index === null ? null : images[index]

  return (
    <SiteSection id="galerie" title={title}>
      <ul className="columns-2 gap-3 sm:columns-3 [&>li]:mb-3">
        {images.map((img, i) => (
          <li key={img.id} className="break-inside-avoid">
            <button
              type="button"
              onClick={(e) => { openerRef.current = e.currentTarget; setIndex(i) }}
              className="group block w-full overflow-hidden rounded-xl"
              aria-label={img.caption ? `Agrandir la photo : ${img.caption}` : `Agrandir la photo ${i + 1}`}
            >
              <img
                src={publicUrl('image', img.storage_path) ?? ''}
                alt={img.caption ?? ''}
                width={img.width ?? undefined}
                height={img.height ?? undefined}
                loading="lazy"
                decoding="async"
                className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </button>
          </li>
        ))}
      </ul>

      {current && (
        <div role="dialog" aria-modal="true" aria-label="Galerie photos" className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <button ref={closeRef} type="button" onClick={close} aria-label="Fermer" className="absolute top-4 right-4 grid size-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
            <X className="size-6" aria-hidden />
          </button>
          {images.length > 1 && (
            <>
              <button type="button" onClick={() => step(-1)} aria-label="Photo précédente" className="absolute left-3 grid size-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
                <ChevronLeft className="size-6" aria-hidden />
              </button>
              <button type="button" onClick={() => step(1)} aria-label="Photo suivante" className="absolute right-3 grid size-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
                <ChevronRight className="size-6" aria-hidden />
              </button>
            </>
          )}
          <figure className="max-h-full max-w-5xl">
            <img src={publicUrl('image', current.storage_path) ?? ''} alt={current.caption ?? ''} className="max-h-[80dvh] w-auto max-w-full rounded-lg object-contain" />
            {current.caption && <figcaption className="mt-3 text-center text-sm text-white/85">{current.caption}</figcaption>}
            <p className="mt-1 text-center text-xs text-white/60" aria-live="polite">{(index ?? 0) + 1} / {images.length}</p>
          </figure>
        </div>
      )}
    </SiteSection>
  )
}
