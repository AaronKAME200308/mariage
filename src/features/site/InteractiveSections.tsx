import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ExternalLink } from 'lucide-react'
import { Alert } from '@/components/ui/Feedback'
import { publicUrl } from '@/lib/storage'
import type { SiteSettings } from '@/lib/siteConfig'
import { RSVP_MESSAGES, submitGuestbookMessage, submitRsvp } from '@/services/publicActions'
import type { Gift, GuestbookEntry } from '@/types/domain'
import { SiteSection } from './SiteSection'

const fieldCls = 'w-full rounded-xl border border-(--w-primary)/25 bg-white px-4 py-3 text-sm text-ink focus:border-(--w-primary) focus:ring-2 focus:ring-(--w-primary)/20 focus:outline-none'
const btnCls = 'rounded-full bg-(--w-primary) px-8 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50'

function Label({ htmlFor, children, error }: { htmlFor: string; children: React.ReactNode; error?: string }) {
  return (
    <div className="mb-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-(--w-text)">{children}</label>
      {error && <p role="alert" className="mt-1 text-xs font-medium text-red-700">{error}</p>}
    </div>
  )
}

// ---------------- RSVP ----------------
const rsvpSchema = z.object({
  fullName: z.string().trim().min(2, 'Indiquez votre nom complet.').max(120),
  status: z.enum(['confirmed', 'declined']),
  companions: z.number('Indiquez un nombre.').int().min(0, 'Minimum 0.').max(20, 'Maximum 20.'),
  phone: z.string().trim().max(30).optional(),
  email: z.union([z.literal(''), z.email('Adresse e-mail invalide.')]).optional(),
  message: z.string().trim().max(1000, 'Message trop long.').optional(),
})
type RsvpValues = z.infer<typeof rsvpSchema>

export function RsvpSection({
  slug, title, intro, settings, preview,
}: { slug: string; title: string; intro: string; settings: SiteSettings['rsvp']; preview: boolean }) {
  const [done, setDone] = useState<null | 'confirmed' | 'declined'>(null)
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<RsvpValues>({
    resolver: zodResolver(rsvpSchema),
    defaultValues: { status: 'confirmed', companions: 0 },
  })
  const status = watch('status')
  const closed = !settings.enabled || (settings.deadline && new Date(settings.deadline).getTime() < Date.now())

  const onSubmit = handleSubmit(async (v) => {
    setError(null)
    try {
      const res = await submitRsvp({ slug, fullName: v.fullName, status: v.status, companions: v.companions, phone: v.phone, email: v.email, message: v.message })
      if (res.ok) setDone(v.status)
      else setError(RSVP_MESSAGES[res.code] ?? 'Votre réponse n’a pas pu être enregistrée.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inattendue.')
    }
  })

  return (
    <SiteSection id="rsvp" title={title} intro={intro} tinted>
      <div className="mx-auto max-w-xl rounded-3xl bg-(--w-bg) p-6 shadow-sm ring-1 ring-(--w-primary)/10 sm:p-8">
        {closed ? (
          <Alert tone="info">Les réponses ne sont plus acceptées. Contactez directement les mariés.</Alert>
        ) : done ? (
          <Alert tone="success">
            {done === 'confirmed' ? 'Merci ! Votre présence est bien enregistrée. À très bientôt !' : 'Merci de nous avoir prévenus. Vous nous manquerez !'}
          </Alert>
        ) : (
          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            {preview && <Alert tone="info">Aperçu : l’envoi est désactivé.</Alert>}
            {error && <Alert>{error}</Alert>}
            <div>
              <Label htmlFor="rsvp-name" error={errors.fullName?.message}>Nom complet</Label>
              <input id="rsvp-name" autoComplete="name" className={fieldCls} {...register('fullName')} />
            </div>
            <fieldset>
              <legend className="mb-1.5 text-sm font-medium text-(--w-text)">Serez-vous présent(e) ?</legend>
              <div className="flex flex-wrap gap-5 text-sm">
                <label className="flex items-center gap-2"><input type="radio" value="confirmed" className="accent-(--w-primary)" {...register('status')} /> Oui, avec joie</label>
                <label className="flex items-center gap-2"><input type="radio" value="declined" className="accent-(--w-primary)" {...register('status')} /> Je ne pourrai pas venir</label>
              </div>
            </fieldset>
            {status === 'confirmed' && (
              <div>
                <Label htmlFor="rsvp-companions" error={errors.companions?.message}>Nombre d’accompagnants (en plus de vous)</Label>
                <input id="rsvp-companions" type="number" min={0} max={20} inputMode="numeric" className={fieldCls} {...register('companions', { valueAsNumber: true })} />
                <p className="mt-1 text-xs text-(--w-text)/60">Ce nombre ne peut pas dépasser celui prévu pour votre invitation.</p>
              </div>
            )}
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="rsvp-email" error={errors.email?.message}>E-mail (facultatif)</Label>
                <input id="rsvp-email" type="email" autoComplete="email" className={fieldCls} {...register('email')} />
              </div>
              <div>
                <Label htmlFor="rsvp-phone" error={errors.phone?.message}>Téléphone (facultatif)</Label>
                <input id="rsvp-phone" type="tel" autoComplete="tel" className={fieldCls} {...register('phone')} />
              </div>
            </div>
            <div>
              <Label htmlFor="rsvp-message" error={errors.message?.message}>Un mot pour les mariés (facultatif)</Label>
              <textarea id="rsvp-message" rows={3} className={fieldCls} {...register('message')} />
            </div>
            <button type="submit" className={btnCls} disabled={isSubmitting || preview}>
              {isSubmitting ? 'Envoi…' : 'Envoyer ma réponse'}
            </button>
          </form>
        )}
      </div>
    </SiteSection>
  )
}

// ---------------- Livre d'or ----------------
const guestbookSchema = z.object({
  author: z.string().trim().min(1, 'Indiquez votre nom.').max(80),
  message: z.string().trim().min(1, 'Écrivez votre message.').max(1000, 'Message trop long (1 000 caractères maximum).'),
})
type GuestbookValues = z.infer<typeof guestbookSchema>

const GB_MESSAGES: Record<string, string> = {
  guestbook_closed: 'Le livre d’or est fermé.',
  invalid_input: 'Vérifiez votre nom et votre message.',
  rate_limited: 'Trop de messages en peu de temps. Réessayez dans une minute.',
  wedding_not_found: 'Ce site n’est plus disponible.',
}

export function GuestbookSection({
  slug, title, entries, settings, preview,
}: { slug: string; title: string; entries: GuestbookEntry[]; settings: SiteSettings['guestbook']; preview: boolean }) {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<GuestbookValues>({ resolver: zodResolver(guestbookSchema) })

  const onSubmit = handleSubmit(async (v) => {
    setError(null)
    try {
      const res = await submitGuestbookMessage(slug, v.author, v.message)
      if (res.ok) { setSent(true); reset() }
      else setError(GB_MESSAGES[res.code] ?? 'Votre message n’a pas pu être envoyé.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inattendue.')
    }
  })

  return (
    <SiteSection id="livre-dor" title={title}>
      {entries.length > 0 && (
        <ul className="mb-12 grid gap-4 sm:grid-cols-2">
          {entries.map((m) => (
            <li key={m.id} className="rounded-2xl bg-(--w-secondary)/20 p-5">
              <p className="whitespace-pre-line text-(--w-text)">{m.message}</p>
              <p className="mt-3 text-sm font-medium text-(--w-primary)">— {m.author_name}</p>
            </li>
          ))}
        </ul>
      )}
      {settings.enabled && (
        <div className="mx-auto max-w-xl">
          {sent ? (
            <Alert tone="success">
              {settings.autoApprove ? 'Merci pour votre message !' : 'Merci ! Votre message sera visible après validation par les mariés.'}
            </Alert>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5" noValidate>
              {preview && <Alert tone="info">Aperçu : l’envoi est désactivé.</Alert>}
              {error && <Alert>{error}</Alert>}
              <div>
                <Label htmlFor="gb-author" error={errors.author?.message}>Votre nom</Label>
                <input id="gb-author" className={fieldCls} {...register('author')} />
              </div>
              <div>
                <Label htmlFor="gb-message" error={errors.message?.message}>Votre message</Label>
                <textarea id="gb-message" rows={4} className={fieldCls} {...register('message')} />
              </div>
              <button type="submit" className={btnCls} disabled={isSubmitting || preview}>{isSubmitting ? 'Envoi…' : 'Laisser un message'}</button>
            </form>
          )}
        </div>
      )}
    </SiteSection>
  )
}

// ---------------- Cadeaux ----------------
const GIFT_STATUS = { available: 'Disponible', reserved: 'Réservé', unavailable: 'Indisponible' } as const

export function GiftsSection({ title, intro, gifts }: { title: string; intro: string; gifts: Gift[] }) {
  return (
    <SiteSection id="cadeaux" title={title} intro={intro} tinted>
      <ul className="grid gap-6 sm:grid-cols-2">
        {gifts.map((g) => {
          const img = publicUrl('image', g.image_path)
          return (
            <li key={g.id} className={`overflow-hidden rounded-3xl bg-(--w-bg) shadow-sm ring-1 ring-(--w-primary)/10 ${g.status === 'unavailable' ? 'opacity-60' : ''}`}>
              {img && <img src={img} alt="" loading="lazy" className="h-48 w-full object-cover" />}
              <div className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-2xl font-semibold text-(--w-primary)">{g.name}</h3>
                  <span className="shrink-0 rounded-full bg-(--w-secondary)/40 px-2.5 py-0.5 text-xs">{GIFT_STATUS[g.status]}</span>
                </div>
                {g.description && <p className="mt-2 text-sm text-(--w-text)/85">{g.description}</p>}
                {g.suggested_amount != null && (
                  <p className="mt-3 text-sm font-medium">
                    Montant suggéré : {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: g.currency, maximumFractionDigits: 0 }).format(g.suggested_amount)}
                  </p>
                )}
                {g.external_url && g.status !== 'unavailable' && (
                  <a href={g.external_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-(--w-primary) underline underline-offset-4">
                    Voir le cadeau <ExternalLink className="size-4" aria-hidden />
                    <span className="sr-only">(s’ouvre dans un nouvel onglet)</span>
                  </a>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </SiteSection>
  )
}
