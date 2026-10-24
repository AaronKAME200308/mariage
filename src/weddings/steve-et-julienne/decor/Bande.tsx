import type { ReactNode } from 'react'
import { imageUrl } from '../../_kit'
import Dechirure from './Dechirure'

/**
 * Bande photo aux bords déchirés avec un titre en script. Sans photo, un ciel bleu
 * dégradé sert de fond : ajoutez votre propre photo via `image` (chemin Storage) ou `src`.
 */
export default function Bande({ titre, image, src, hauteur = 'h-60', graine = 1, children }: {
  titre: string; image?: string | null; src?: string; hauteur?: string; graine?: number; children?: ReactNode
}) {
  const url = src ?? imageUrl(image)
  return (
    <div className={`relative ${hauteur} overflow-hidden`}>
      {url
        ? <img src={url} alt="" className="absolute inset-0 size-full object-cover" />
        : <div aria-hidden className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 20% 30%, rgb(255 255 255 / .55), transparent 45%), radial-gradient(ellipse at 80% 60%, rgb(255 255 255 / .35), transparent 40%), linear-gradient(180deg, #3f78c0, #6fa0dd)' }} />}
      <Dechirure position="haut" graine={graine} />
      <Dechirure position="bas" graine={graine + 3} />
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center text-white">
        <h2 className="sj-script text-6xl drop-shadow">{titre}</h2>
        {children}
      </div>
    </div>
  )
}
