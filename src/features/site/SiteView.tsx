import { useState, type CSSProperties } from 'react'
import { FONT_OPTIONS, parseContent, parseSettings, parseTheme, type SiteSettings } from '@/lib/siteConfig'
import { publicUrl } from '@/lib/storage'
import type { PublicWedding } from '@/types/domain'
import { Envelope } from './Envelope'
import { SiteHero } from './Hero'
import { GallerySection } from './GallerySection'
import { GiftsSection, GuestbookSection, RsvpSection } from './InteractiveSections'
import { MusicPlayer } from './MusicPlayer'
import { EventsSection, StorySection } from './StoryEventsSections'

export interface SiteViewProps {
  data: PublicWedding
  /** Aperçu : pas d'envoi de formulaires, pas de lecteur de musique. */
  preview?: boolean
  /** Intégré dans un tableau de bord : pas d'enveloppe, hauteur réduite. */
  embedded?: boolean
}

export function SiteView({ data, preview = false, embedded = false }: SiteViewProps) {
  const { wedding } = data
  const theme = parseTheme(wedding.theme)
  const content = parseContent(wedding.content)
  const settings: SiteSettings = parseSettings(wedding.settings)
  const [introDone, setIntroDone] = useState(embedded || !settings.envelopeEnabled)
  const names = `${wedding.partner_one_name} & ${wedding.partner_two_name}`
  const font = FONT_OPTIONS.find((f) => f.key === theme.headingFont)!.css
  const musicUrl = publicUrl('audio', wedding.music_path)

  const style = {
    '--w-primary': theme.primary, '--w-secondary': theme.secondary, '--w-bg': theme.background,
    '--w-accent': theme.accent, '--w-text': theme.text, '--w-heading': font,
  } as CSSProperties

  const s = settings.sections
  const showStory = s.story && (content.storyText.trim() !== '' || data.milestones.length > 0)
  const showEvents = s.events && data.events.length > 0
  const showGallery = s.gallery && data.gallery.length > 0
  const showGifts = s.gifts && data.gifts.length > 0

  return (
    <div className="site-root" style={style}>
      {!introDone && (
        <Envelope names={names} message={content.envelopeMessage} onOpened={() => setIntroDone(true)} />
      )}
      <SiteHero wedding={wedding} content={content} embedded={embedded} />
      {showStory && <StorySection title={content.storyTitle} text={content.storyText} milestones={data.milestones} />}
      {showEvents && <EventsSection title={content.eventsTitle} events={data.events} timeZone={wedding.timezone} />}
      {showGallery && <GallerySection title={content.galleryTitle} images={data.gallery} />}
      {s.rsvp && (
        <RsvpSection slug={wedding.slug} title={content.rsvpTitle} intro={content.rsvpIntro} settings={settings.rsvp} preview={preview || embedded} />
      )}
      {showGifts && <GiftsSection title={content.giftsTitle} intro={content.giftsIntro} gifts={data.gifts} />}
      {s.guestbook && (
        <GuestbookSection slug={wedding.slug} title={content.guestbookTitle} entries={data.guestbook} settings={settings.guestbook} preview={preview || embedded} />
      )}
      <footer className="px-6 py-10 text-center text-sm text-(--w-text)/60">
        <p className="font-(family-name:--w-heading) text-2xl text-(--w-primary)">{names}</p>
        <p className="mt-2">Site créé avec MariamCM</p>
      </footer>
      {settings.musicEnabled && musicUrl && !embedded && introDone && <MusicPlayer src={musicUrl} />}
    </div>
  )
}
