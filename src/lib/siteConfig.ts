// Lecture tolérante et valeurs par défaut de la configuration d'un site de mariage
// (colonnes JSON theme / content / settings de la table weddings).

export const FONT_OPTIONS = [
  { key: 'cormorant', label: 'Cormorant Garamond (romantique)', css: '"Cormorant Garamond", Georgia, serif' },
  { key: 'playfair', label: 'Playfair Display (classique)', css: '"Playfair Display", Georgia, serif' },
  { key: 'lora', label: 'Lora (lisible)', css: '"Lora", Georgia, serif' },
  { key: 'inter', label: 'Inter (moderne)', css: '"Inter", system-ui, sans-serif' },
] as const
export type FontKey = (typeof FONT_OPTIONS)[number]['key']

export interface SiteTheme {
  primary: string
  secondary: string
  background: string
  accent: string
  text: string
  headingFont: FontKey
}

export const DEFAULT_THEME: SiteTheme = {
  primary: '#183D32',
  secondary: '#A7B9A3',
  background: '#FAF7F0',
  accent: '#C8A96B',
  text: '#242820',
  headingFont: 'cormorant',
}

const HEX = /^#[0-9a-fA-F]{6}$/
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const str = (v: unknown, max: number, fallback = ''): string => (typeof v === 'string' ? v.slice(0, max) : fallback)
const bool = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback)

export function parseTheme(raw: unknown): SiteTheme {
  const o = isObj(raw) ? raw : {}
  const color = (k: keyof SiteTheme) => (typeof o[k] === 'string' && HEX.test(o[k] as string) ? (o[k] as string) : (DEFAULT_THEME[k] as string))
  const font = FONT_OPTIONS.find((f) => f.key === o.headingFont)?.key ?? DEFAULT_THEME.headingFont
  return { primary: color('primary'), secondary: color('secondary'), background: color('background'), accent: color('accent'), text: color('text'), headingFont: font }
}

export interface SiteContent {
  heroTagline: string
  heroMessage: string
  envelopeMessage: string
  storyTitle: string
  storyText: string
  eventsTitle: string
  galleryTitle: string
  rsvpTitle: string
  rsvpIntro: string
  guestbookTitle: string
  giftsTitle: string
  giftsIntro: string
}

export const DEFAULT_CONTENT: SiteContent = {
  heroTagline: 'Nous nous marions',
  heroMessage: 'Nous serions heureux de partager ce moment unique avec vous.',
  envelopeMessage: 'Vous êtes invités à découvrir notre mariage',
  storyTitle: 'Notre histoire',
  storyText: '',
  eventsTitle: 'Programme',
  galleryTitle: 'Galerie',
  rsvpTitle: 'Confirmer votre présence',
  rsvpIntro: 'Merci de nous indiquer si vous pourrez être des nôtres.',
  guestbookTitle: 'Livre d’or',
  giftsTitle: 'Liste de cadeaux',
  giftsIntro: 'Votre présence est notre plus beau cadeau. Si vous souhaitez nous gâter, voici quelques idées.',
}

const CONTENT_LIMITS: Record<keyof SiteContent, number> = {
  heroTagline: 80, heroMessage: 400, envelopeMessage: 120, storyTitle: 80, storyText: 3000, eventsTitle: 80,
  galleryTitle: 80, rsvpTitle: 80, rsvpIntro: 400, guestbookTitle: 80, giftsTitle: 80, giftsIntro: 500,
}

export function parseContent(raw: unknown): SiteContent {
  const o = isObj(raw) ? raw : {}
  const out = { ...DEFAULT_CONTENT }
  for (const key of Object.keys(DEFAULT_CONTENT) as Array<keyof SiteContent>) {
    if (typeof o[key] === 'string') out[key] = (o[key] as string).slice(0, CONTENT_LIMITS[key])
  }
  return out
}
export const CONTENT_MAX = CONTENT_LIMITS

export type SectionKey = 'story' | 'events' | 'gallery' | 'rsvp' | 'guestbook' | 'gifts'
export const SECTION_LABELS: Record<SectionKey, string> = {
  story: 'Notre histoire', events: 'Programme', gallery: 'Galerie', rsvp: 'Confirmation de présence',
  guestbook: 'Livre d’or', gifts: 'Liste de cadeaux',
}

export interface SiteSettings {
  sections: Record<SectionKey, boolean>
  envelopeEnabled: boolean
  musicEnabled: boolean
  rsvp: { enabled: boolean; deadline: string; allowUnlisted: boolean; maxCompanionsUnlisted: number }
  guestbook: { enabled: boolean; autoApprove: boolean }
}

export const DEFAULT_SETTINGS: SiteSettings = {
  sections: { story: true, events: true, gallery: true, rsvp: true, guestbook: true, gifts: true },
  envelopeEnabled: true,
  musicEnabled: true,
  rsvp: { enabled: true, deadline: '', allowUnlisted: false, maxCompanionsUnlisted: 0 },
  guestbook: { enabled: true, autoApprove: false },
}

export function parseSettings(raw: unknown): SiteSettings {
  const o = isObj(raw) ? raw : {}
  const sections = isObj(o.sections) ? o.sections : {}
  const rsvp = isObj(o.rsvp) ? o.rsvp : {}
  const gb = isObj(o.guestbook) ? o.guestbook : {}
  const envelope = isObj(o.envelope) ? o.envelope : {}
  const music = isObj(o.music) ? o.music : {}
  const max = typeof rsvp.max_companions_unlisted === 'number' ? Math.min(20, Math.max(0, Math.floor(rsvp.max_companions_unlisted))) : 0
  return {
    sections: {
      story: bool(sections.story, true), events: bool(sections.events, true), gallery: bool(sections.gallery, true),
      rsvp: bool(sections.rsvp, true), guestbook: bool(sections.guestbook, true), gifts: bool(sections.gifts, true),
    },
    envelopeEnabled: bool(envelope.enabled, true),
    musicEnabled: bool(music.enabled, true),
    rsvp: { enabled: bool(rsvp.enabled, true), deadline: str(rsvp.deadline, 40), allowUnlisted: bool(rsvp.allow_unlisted, false), maxCompanionsUnlisted: max },
    guestbook: { enabled: bool(gb.enabled, true), autoApprove: bool(gb.auto_approve, false) },
  }
}

/** Format JSON stocké en base — les clés rsvp/guestbook sont lues par les RPC SQL. */
export function serializeSettings(s: SiteSettings): Record<string, unknown> {
  return {
    sections: s.sections,
    envelope: { enabled: s.envelopeEnabled },
    music: { enabled: s.musicEnabled },
    rsvp: {
      enabled: s.rsvp.enabled,
      deadline: s.rsvp.deadline || null,
      allow_unlisted: s.rsvp.allowUnlisted,
      max_companions_unlisted: s.rsvp.maxCompanionsUnlisted,
    },
    guestbook: { enabled: s.guestbook.enabled, auto_approve: s.guestbook.autoApprove },
  }
}
