import { imageUrl, useSite } from '../../_kit'
import Bande from '../decor/Bande'

/** Grille de vignettes encadrées. En aperçu (brouillon), des emplacements bleus guident la mise en page. */
export default function Galerie() {
  const { data, preview } = useSite()
  const photos = data.gallery.slice(0, 6)
  const emplacements = photos.length === 0 && preview ? Array.from({ length: 6 }, (_, i) => i) : []
  if (photos.length === 0 && emplacements.length === 0) return null
  return (
    <section id="galerie" className="pb-14">
      <Bande titre="La galerie" graine={7} hauteur="h-48" />
      <ul className="mx-auto mt-6 grid max-w-xs grid-cols-3 gap-2 px-2">
        {photos.map((p) => {
          const url = imageUrl(p.storage_path)
          return (
            <li key={p.id} className="aspect-square overflow-hidden border-2 border-(--sj-blue) bg-white">
              {url && (
                <a href={url} target="_blank" rel="noreferrer" aria-label={p.caption ?? 'Agrandir la photo'}>
                  <img src={url} alt={p.caption ?? ''} loading="lazy" className="size-full object-cover" />
                </a>
              )}
            </li>
          )
        })}
        {emplacements.map((i) => (
          <li key={i} aria-hidden className="aspect-square border-2 border-(--sj-blue)" style={{ background: 'linear-gradient(160deg, #78a8e2, #3f78c0)' }} />
        ))}
      </ul>
    </section>
  )
}
