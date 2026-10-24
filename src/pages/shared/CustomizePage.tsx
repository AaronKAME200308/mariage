import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, ImageUp, Music, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/DashboardLayout'
import { Button, buttonStyles } from '@/components/ui/Button'
import { Alert, Spinner } from '@/components/ui/Feedback'
import { SelectField, TextAreaField, TextField, ToggleField } from '@/components/ui/Field'
import { SiteView } from '@/features/site/SiteView'
import { useWedding } from '@/features/weddings/WeddingContext'
import { useAsync } from '@/hooks/useAsync'
import {
  CONTENT_MAX, FONT_OPTIONS, SECTION_LABELS, parseContent, parseSettings, parseTheme, serializeSettings,
  type FontKey, type SectionKey, type SiteContent, type SiteSettings, type SiteTheme,
} from '@/lib/siteConfig'
import { publicUrl, removeWeddingFile, uploadWeddingFile, validateFile } from '@/lib/storage'
import { isoToLocalInput, localInputToIso } from '@/lib/time'
import { listEvents, listGallery, listMilestones } from '@/services/siteContent'
import { updateWeddingSite } from '@/services/weddings'
import type { PublicWedding } from '@/types/domain'

const COLOR_FIELDS: Array<[keyof Omit<SiteTheme, 'headingFont'>, string]> = [
  ['primary', 'Couleur principale'], ['secondary', 'Couleur secondaire'], ['background', 'Fond'],
  ['accent', 'Couleur d’accent'], ['text', 'Texte'],
]
const TEXT_FIELDS: Array<[keyof SiteContent, string, boolean]> = [
  ['heroTagline', 'Accroche du haut de page', false], ['heroMessage', 'Message d’accueil', true],
  ['envelopeMessage', 'Texte de l’enveloppe d’ouverture', false], ['storyTitle', 'Titre « Histoire »', false],
  ['storyText', 'Texte de notre histoire', true], ['eventsTitle', 'Titre « Programme »', false],
  ['galleryTitle', 'Titre « Galerie »', false], ['rsvpTitle', 'Titre « Confirmation »', false],
  ['rsvpIntro', 'Introduction de la confirmation', true], ['guestbookTitle', 'Titre « Livre d’or »', false],
  ['giftsTitle', 'Titre « Cadeaux »', false], ['giftsIntro', 'Introduction des cadeaux', true],
]

function Group({ title, children, open }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group rounded-2xl border border-forest/10 bg-white">
      <summary className="cursor-pointer list-none rounded-2xl px-5 py-4 text-lg font-semibold text-forest marker:hidden [&::-webkit-details-marker]:hidden">
        {title}
      </summary>
      <div className="space-y-5 border-t border-forest/10 px-5 py-5">{children}</div>
    </details>
  )
}

export default function CustomizePage() {
  const { wedding, reload, isAdminScope } = useWedding()
  useEffect(() => { document.title = 'Personnalisation — MariamCM' }, [])

  const [theme, setTheme] = useState<SiteTheme>(() => parseTheme(wedding.theme))
  const [content, setContent] = useState<SiteContent>(() => parseContent(wedding.content))
  const [settings, setSettings] = useState<SiteSettings>(() => parseSettings(wedding.settings))
  const [heroPath, setHeroPath] = useState<string | null>(wedding.hero_image_path)
  const [musicPath, setMusicPath] = useState<string | null>(wedding.music_path)
  const [rights, setRights] = useState(false)
  const [busy, setBusy] = useState<null | 'save' | 'hero' | 'music'>(null)
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  const extras = useAsync(async () => {
    const [events, milestones, gallery] = await Promise.all([listEvents(wedding.id), listMilestones(wedding.id), listGallery(wedding.id)])
    return { events, milestones, gallery }
  }, [wedding.id])

  const previewData: PublicWedding | null = useMemo(() => {
    if (extras.status !== 'success') return null
    return {
      wedding: {
        id: wedding.id, slug: wedding.slug, partner_one_name: wedding.partner_one_name, partner_two_name: wedding.partner_two_name,
        wedding_date: wedding.wedding_date, timezone: wedding.timezone, status: wedding.status,
        theme: theme as unknown as Record<string, unknown>, content: content as unknown as Record<string, unknown>,
        settings: serializeSettings(settings), hero_image_path: heroPath, music_path: musicPath,
      },
      events: extras.data.events, milestones: extras.data.milestones, gallery: extras.data.gallery, gifts: [], guestbook: [],
    }
  }, [extras, wedding, theme, content, settings, heroPath, musicPath])

  async function upload(e: ChangeEvent<HTMLInputElement>, kind: 'image' | 'audio') {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const problem = validateFile(file, kind)
    if (problem) { setNotice({ tone: 'error', text: problem }); return }
    setBusy(kind === 'image' ? 'hero' : 'music'); setNotice(null)
    try {
      const path = await uploadWeddingFile(wedding.id, kind === 'image' ? 'hero' : 'music', file, kind)
      if (kind === 'image') setHeroPath(path); else setMusicPath(path)
      setNotice({ tone: 'success', text: 'Fichier envoyé. Pensez à enregistrer vos modifications.' })
    } catch (err) {
      setNotice({ tone: 'error', text: err instanceof Error ? err.message : 'Envoi impossible.' })
    } finally { setBusy(null) }
  }

  async function save() {
    setBusy('save'); setNotice(null)
    try {
      await updateWeddingSite(wedding.id, {
        theme: theme as unknown as Record<string, unknown>,
        content: content as unknown as Record<string, unknown>,
        settings: serializeSettings(settings),
        hero_image_path: heroPath, music_path: musicPath,
      })
      // Nettoyage « au mieux » des fichiers remplacés ou retirés.
      if (wedding.hero_image_path && wedding.hero_image_path !== heroPath) await removeWeddingFile('image', wedding.hero_image_path)
      if (wedding.music_path && wedding.music_path !== musicPath) await removeWeddingFile('audio', wedding.music_path)
      reload()
      setNotice({ tone: 'success', text: 'Modifications enregistrées. Elles apparaissent sur le site public.' })
    } catch (err) {
      setNotice({ tone: 'error', text: err instanceof Error ? err.message : 'Enregistrement impossible.' })
    } finally { setBusy(null) }
  }

  const setSection = (k: SectionKey, v: boolean) => setSettings((s) => ({ ...s, sections: { ...s.sections, [k]: v } }))
  const heroUrl = publicUrl('image', heroPath)
  const musicUrl = publicUrl('audio', musicPath)

  return (
    <>
      <PageHeader
        title="Personnalisation"
        description="Couleurs, textes, photos, musique et sections de votre site. L’aperçu se met à jour en direct."
        actions={
          <>
            <Link to={`/${wedding.slug}?apercu=1`} target="_blank" className={buttonStyles('secondary', 'sm')}>Ouvrir l’aperçu complet <ExternalLink className="size-4" aria-hidden /></Link>
            <Button onClick={() => void save()} loading={busy === 'save'}>Enregistrer</Button>
          </>
        }
      />
      {notice && <Alert tone={notice.tone} className="mb-6">{notice.text}</Alert>}
      {isAdminScope && <Alert tone="info" className="mb-6">Vous modifiez ce site en tant qu’administrateur.</Alert>}

      <div className="grid gap-8 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Group title="Couleurs et police" open>
            <div className="grid grid-cols-2 gap-4">
              {COLOR_FIELDS.map(([key, label]) => (
                <div key={key}>
                  <label htmlFor={`c-${key}`} className="mb-1.5 block text-sm font-medium">{label}</label>
                  <div className="flex items-center gap-2">
                    <input id={`c-${key}`} type="color" value={theme[key]} onChange={(e) => setTheme((t) => ({ ...t, [key]: e.target.value.toUpperCase() }))}
                      className="h-11 w-14 cursor-pointer rounded-lg border border-forest/20 bg-white p-1" />
                    <code className="text-xs text-ink-soft">{theme[key]}</code>
                  </div>
                </div>
              ))}
            </div>
            <SelectField label="Police des titres" value={theme.headingFont} onChange={(e) => setTheme((t) => ({ ...t, headingFont: e.target.value as FontKey }))}>
              {FONT_OPTIONS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
            </SelectField>
          </Group>

          <Group title="Photo principale">
            {heroUrl && <img src={heroUrl} alt="Photo principale actuelle" className="h-40 w-full rounded-xl object-cover" />}
            <div className="flex flex-wrap gap-3">
              <label className={`${buttonStyles('secondary', 'sm')} cursor-pointer`}>
                <ImageUp className="size-4" aria-hidden />{busy === 'hero' ? 'Envoi…' : heroUrl ? 'Remplacer' : 'Choisir une photo'}
                <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" disabled={busy !== null} onChange={(e) => void upload(e, 'image')} />
              </label>
              {heroUrl && <Button variant="ghost" size="sm" onClick={() => setHeroPath(null)}><Trash2 className="size-4" aria-hidden />Retirer</Button>}
            </div>
            <p className="text-xs text-ink-soft">JPEG, PNG, WebP ou AVIF — 5 Mo maximum.</p>
          </Group>

          <Group title="Musique de fond">
            <ToggleField label="Afficher le lecteur de musique" checked={settings.musicEnabled} onChange={(v) => setSettings((s) => ({ ...s, musicEnabled: v }))}
              hint="La musique ne démarre jamais seule : le visiteur doit appuyer sur lecture." />
            {musicUrl && <audio controls src={musicUrl} className="w-full" />}
            <ToggleField label="Je confirme disposer des droits d’utilisation de cette musique" checked={rights} onChange={setRights} />
            <div className="flex flex-wrap gap-3">
              <label className={`${buttonStyles('secondary', 'sm')} ${!rights ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}>
                <Music className="size-4" aria-hidden />{busy === 'music' ? 'Envoi…' : musicUrl ? 'Remplacer' : 'Choisir un fichier audio'}
                <input type="file" accept="audio/mpeg,audio/mp4,audio/ogg,audio/wav" className="sr-only" disabled={!rights || busy !== null} onChange={(e) => void upload(e, 'audio')} />
              </label>
              {musicUrl && <Button variant="ghost" size="sm" onClick={() => setMusicPath(null)}><Trash2 className="size-4" aria-hidden />Retirer</Button>}
            </div>
            <p className="text-xs text-ink-soft">MP3, M4A, OGG ou WAV — 15 Mo maximum.</p>
          </Group>

          <Group title="Titres et textes">
            {TEXT_FIELDS.map(([key, label, multi]) => multi
              ? <TextAreaField key={key} label={label} className="min-h-24" maxLength={CONTENT_MAX[key]} value={content[key]} onChange={(e) => setContent((c) => ({ ...c, [key]: e.target.value }))} />
              : <TextField key={key} label={label} maxLength={CONTENT_MAX[key]} value={content[key]} onChange={(e) => setContent((c) => ({ ...c, [key]: e.target.value }))} />)}
          </Group>

          <Group title="Sections visibles">
            <ToggleField label="Enveloppe d’ouverture animée" checked={settings.envelopeEnabled} onChange={(v) => setSettings((s) => ({ ...s, envelopeEnabled: v }))} />
            {(Object.keys(SECTION_LABELS) as SectionKey[]).map((k) => (
              <ToggleField key={k} label={SECTION_LABELS[k]} checked={settings.sections[k]} onChange={(v) => setSection(k, v)}
                hint={k === 'story' || k === 'events' || k === 'gallery' || k === 'gifts' ? 'Affichée seulement si elle contient quelque chose.' : undefined} />
            ))}
          </Group>

          <Group title="Confirmation de présence (RSVP)">
            <ToggleField label="Accepter les réponses" checked={settings.rsvp.enabled} onChange={(v) => setSettings((s) => ({ ...s, rsvp: { ...s.rsvp, enabled: v } }))} />
            <TextField label="Date limite de réponse (facultatif)" type="datetime-local"
              hint={`Heure locale (${wedding.timezone})`}
              value={isoToLocalInput(settings.rsvp.deadline || null, wedding.timezone)}
              onChange={(e) => setSettings((s) => ({ ...s, rsvp: { ...s.rsvp, deadline: localInputToIso(e.target.value, wedding.timezone) ?? '' } }))} />
            <ToggleField label="Accepter des personnes absentes de ma liste d’invités" checked={settings.rsvp.allowUnlisted}
              hint="Désactivé par défaut : seules les personnes de votre liste peuvent répondre."
              onChange={(v) => setSettings((s) => ({ ...s, rsvp: { ...s.rsvp, allowUnlisted: v } }))} />
            {settings.rsvp.allowUnlisted && (
              <TextField label="Accompagnants maximum pour ces personnes" type="number" min={0} max={20} value={settings.rsvp.maxCompanionsUnlisted}
                onChange={(e) => setSettings((s) => ({ ...s, rsvp: { ...s.rsvp, maxCompanionsUnlisted: Math.min(20, Math.max(0, Number(e.target.value) || 0)) } }))} />
            )}
          </Group>

          <Group title="Livre d’or">
            <ToggleField label="Autoriser les messages" checked={settings.guestbook.enabled} onChange={(v) => setSettings((s) => ({ ...s, guestbook: { ...s.guestbook, enabled: v } }))} />
            <ToggleField label="Publier les messages sans modération" checked={settings.guestbook.autoApprove}
              hint="Déconseillé : par défaut, chaque message doit être approuvé avant d’apparaître."
              onChange={(v) => setSettings((s) => ({ ...s, guestbook: { ...s.guestbook, autoApprove: v } }))} />
          </Group>
        </div>

        <div className="min-w-0">
          <h2 className="mb-3 text-lg font-semibold text-forest">Aperçu en direct</h2>
          <div className="sticky top-4 max-h-[calc(100dvh-3rem)] overflow-y-auto rounded-2xl border border-forest/15 shadow-soft">
            {!previewData ? <Spinner /> : <SiteView data={previewData} embedded />}
          </div>
        </div>
      </div>
    </>
  )
}
