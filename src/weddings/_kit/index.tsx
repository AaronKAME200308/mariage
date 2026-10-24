/**
 * Boîte à outils pour écrire la page d'un mariage à la main.
 * Importez depuis '../_kit' (ou '../../_kit' dans sections/).
 * Les blocs « vivants » (RSVP, livre d'or) envoient les données à la base comme sur les sites
 * générés : toute la sécurité (limitation, validation, modération) reste côté base.
 */
import { useState } from 'react'
import { useCountdown } from '@/features/site/Hero'
import { Envelope } from '@/features/site/Envelope'
import { GallerySection } from '@/features/site/GallerySection'
import { GiftsSection, GuestbookSection, RsvpSection } from '@/features/site/InteractiveSections'
import { MusicPlayer } from '@/features/site/MusicPlayer'
import { SiteSection } from '@/features/site/SiteSection'
import { publicUrl } from '@/lib/storage'
import { useSite } from './context'

export { useSite } from './context'
export { SiteSection as Section } from '@/features/site/SiteSection'
export { formatDate } from '@/lib/utils'
export { formatTime } from '@/lib/time'

/** URL d'une image du bucket (hero_image_path, image d'un cadeau, etc.). */
export const imageUrl = (path: string | null | undefined) => publicUrl('image', path)

/** Animation d'enveloppe du site (introduction). À placer tout en haut ; masquée si désactivée dans Personnalisation. */
export function Intro() {
  const { names, content, settings } = useSite()
  const [done, setDone] = useState(!settings.envelopeEnabled)
  return done ? null : <Envelope names={names} message={content.envelopeMessage} onOpened={() => setDone(true)} />
}

/** Lecteur de musique (si une musique est enregistrée et activée). Aucune lecture automatique. */
export function Musique() {
  const { wedding, settings } = useSite()
  const src = publicUrl('audio', wedding.music_path)
  return settings.musicEnabled && src ? <MusicPlayer src={src} /> : null
}

/** Compte à rebours calculé sur la vraie date. `children` reçoit les valeurs pour un rendu libre. */
export function Countdown({ children }: { children?: (v: { days: number; hours: number; minutes: number; seconds: number }) => React.ReactNode }) {
  const { wedding } = useSite()
  const c = useCountdown(wedding.wedding_date)
  if (!c || c.done) return null
  const values = { days: c.days, hours: c.hours, minutes: c.minutes, seconds: c.seconds }
  if (children) return <>{children(values)}</>
  return (
    <p role="timer" className="font-(family-name:--w-heading) text-3xl">
      {values.days} j {String(values.hours).padStart(2, '0')} h {String(values.minutes).padStart(2, '0')} min {String(values.seconds).padStart(2, '0')} s
    </p>
  )
}

/** Formulaire de confirmation de présence (réglages : Personnalisation → RSVP). */
export function RsvpForm({ title = 'Confirmation de présence', intro = '' }: { title?: string; intro?: string }) {
  const { wedding, settings, preview } = useSite()
  return <RsvpSection slug={wedding.slug} title={title} intro={intro} settings={settings.rsvp} preview={preview} />
}

/** Livre d'or : messages approuvés + formulaire. */
export function GuestbookBlock({ title = 'Livre d’or' }: { title?: string }) {
  const { wedding, data, settings, preview } = useSite()
  return <GuestbookSection slug={wedding.slug} title={title} entries={data.guestbook} settings={settings.guestbook} preview={preview} />
}

/** Galerie avec visionneuse (photos gérées dans l'espace Galerie). */
export function GalleryBlock({ title = 'Galerie' }: { title?: string }) {
  const { data } = useSite()
  return data.gallery.length > 0 ? <GallerySection title={title} images={data.gallery} /> : null
}

/** Liste de cadeaux (gérée dans l'espace Cadeaux). */
export function GiftsBlock({ title = 'Liste de cadeaux', intro = '' }: { title?: string; intro?: string }) {
  const { data } = useSite()
  return data.gifts.length > 0 ? <GiftsSection title={title} intro={intro} gifts={data.gifts} /> : null
}

export { SiteSection }
