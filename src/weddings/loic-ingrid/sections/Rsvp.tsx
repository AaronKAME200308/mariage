import { Fragment, useEffect, useRef, useState } from 'react'
import type { CSSProperties, FormEvent, ReactNode } from 'react'
import { AlertCircle, Heart, HeartCrack, Loader2, Minus, Plus, Send } from 'lucide-react'
import { RSVP_MESSAGES, submitRsvp } from '@/services/publicActions'
import { useSite } from '../../_kit'

/* ================================================================
   DONNÉES : Supabase
   ----------------------------------------------------------------
   Chaque réponse passe par submit_rsvp : validation, limitation de débit,
   invité retrouvé par son nom (+ téléphone ou e-mail), nombre d'accompagnants
   prévu et capacité des tables contrôlés côté base. Rien n'est simulé : si la
   base refuse, son message s'affiche. Les réponses se lisent dans l'espace
   couple/admin → « RSVP » et « Invités ».
   La date limite et l'ouverture des réponses se règlent dans Personnalisation.
   ================================================================ */
const CONFIG = {
  maxGuests: 4, // plafond du sélecteur (vous compris) ; la base applique le nombre réel prévu par invitation
}

type Attending = '' | 'yes' | 'no'
type FormState = {
  name: string
  phone: string
  email: string
  attending: Attending
  count: number
  companions: string[]
  diet: string
  message: string
  website: string // piège à robots : doit rester vide
}

const empty: FormState = {
  name: '',
  phone: '',
  email: '',
  attending: '',
  count: 1,
  companions: [],
  diet: '',
  message: '',
  website: '',
}

/** La base n'a pas de colonne pour les accompagnants ni le régime : ils sont écrits en tête du message (visible côté mariés). */
function buildMessage(f: FormState) {
  const lines: string[] = []
  if (f.attending === 'yes') {
    const names = f.companions.map((s) => s.trim()).filter(Boolean)
    if (names.length) lines.push(`Accompagné(e) de : ${names.join(', ')}`)
    if (f.diet.trim()) lines.push(`Régime ou allergies : ${f.diet.trim()}`)
  }
  if (f.message.trim()) lines.push(f.message.trim())
  return lines.join('\n')
}

/* ================================================================
   STYLES RÉUTILISABLES
   ================================================================ */
const inkText =
  'bg-[linear-gradient(180deg,#111111_0%,#2b2b2b_55%,#6b6b6b_100%)] bg-clip-text text-transparent'

const vars = (o: Record<string, string>) => o as CSSProperties

const css = `
html{scroll-behavior:smooth}

/* Le cadre « s'accroche » : tombe de haut, se balance, se stabilise */
.hang{
  opacity:0;
  transform-origin:50% 0;
  transform:translateY(-46px) rotate(var(--tilt,-2deg));
  transition:
    opacity .7s ease var(--d,0s),
    transform 1.5s cubic-bezier(.34,1.56,.64,1) var(--d,0s);
}
.hang[data-in="true"]{opacity:1;transform:none}

/* Apparition douce */
.rv{
  opacity:0;
  filter:blur(8px);
  transform:translateY(var(--y,28px));
  transition:
    opacity 1s ease var(--d,0s),
    filter 1s ease var(--d,0s),
    transform 1.3s cubic-bezier(.16,1,.3,1) var(--d,0s);
}
[data-in="true"] .rv{opacity:1;filter:blur(0);transform:none}

/* Mots révélés par un masque */
.wm{display:inline-block;overflow:hidden;vertical-align:bottom;padding-bottom:.14em;margin-bottom:-.14em}
.wm>span{
  display:inline-block;
  transform:translateY(112%) rotate(4deg);
  transition:transform 1.15s cubic-bezier(.16,1,.3,1) var(--d,0s);
}
[data-in="true"] .wm>span{transform:none}

@keyframes bob{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-9px) rotate(3deg)}}
.bob{animation:bob 7s ease-in-out infinite}

@keyframes twinkle{
  0%,100%{opacity:.2;transform:scale(.75) rotate(0deg)}
  50%{opacity:1;transform:scale(1.1) rotate(25deg)}
}
.twinkle{animation:twinkle 3.8s ease-in-out var(--d,0s) infinite}

@keyframes spinSlow{to{transform:rotate(360deg)}}
.spin-slow{animation:spinSlow 50s linear infinite}

@keyframes beat{0%,100%{transform:scale(1)}15%{transform:scale(1.18)}30%{transform:scale(1)}45%{transform:scale(1.12)}60%{transform:scale(1)}}
.beat{animation:beat 3.2s ease-in-out infinite}

/* Confirmation : tout arrive en douceur, la coche se dessine */
@keyframes fxUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
.fx-up{animation:fxUp .9s cubic-bezier(.16,1,.3,1) both;animation-delay:var(--d,0s)}
@keyframes draw{to{stroke-dashoffset:0}}
.draw{stroke-dasharray:32;stroke-dashoffset:32;animation:draw .8s ease .35s forwards}
@keyframes ringOut{from{transform:scale(.6);opacity:.7}to{transform:scale(1.9);opacity:0}}
.ring-out{animation:ringOut 1.6s ease-out .2s both}

@media (prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  .hang,.rv,.wm>span{transition:none!important;opacity:1;filter:none;transform:none}
  .bob,.twinkle,.spin-slow,.beat,.fx-up,.ring-out{animation:none}
  .draw{animation:none;stroke-dashoffset:0}
}
`

/* ================================================================
   OUTILS
   ================================================================ */
function useInView<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold, rootMargin: '0px 0px -6% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])

  return [ref, inView] as const
}

function Words({
  text,
  className = '',
  start = 0,
  step = 0.1,
}: {
  text: string
  className?: string
  start?: number
  step?: number
}) {
  return (
    <>
      {text.split(' ').map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          <span className="wm">
            <span className={className} style={vars({ '--d': `${start + i * step}s` })}>
              {word}
            </span>
          </span>{' '}
        </Fragment>
      ))}
    </>
  )
}

/* ================================================================
   ORNEMENTS ROYAL ASCOT (la couleur suit le texte : currentColor)
   ================================================================ */
function TopHat({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 72 72" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
      <path d="M22,46 L24,16 Q36,11 48,16 L50,46" />
      <ellipse cx="36" cy="47" rx="28" ry="6" />
      <rect x="23.2" y="36" width="25.6" height="7" fill="currentColor" stroke="none" />
    </svg>
  )
}

function Diamond({ className = '' }: { className?: string }) {
  return <span aria-hidden="true" className={`inline-block h-1.5 w-1.5 rotate-45 bg-current ${className}`} />
}

function RuleDiamond({ className = '' }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`flex items-center gap-2 ${className}`}>
      <span className="h-px flex-1 bg-current opacity-40" />
      <Diamond />
      <span className="h-px flex-1 bg-current opacity-40" />
    </span>
  )
}

function Sparkle({ className = '', delay = '0s' }: { className?: string; delay?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`twinkle ${className}`}
      style={vars({ '--d': delay })}
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M12,0 C13,8 16,11 24,12 C16,13 13,16 12,24 C11,16 8,13 0,12 C8,11 11,8 12,0 Z" />
    </svg>
  )
}

function Medallion({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`relative ${className}`} role="img" aria-label="Loïc et Ingrid, 19 juin 2027">
      <svg viewBox="0 0 200 200" className="spin-slow absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <path id="rsvp-ring" d="M100,100 m-80,0 a80,80 0 1,1 160,0 a80,80 0 1,1 -160,0" />
        </defs>
        <text fill="currentColor" fontSize="11.5" letterSpacing="3" className="font-serif uppercase">
          <textPath href="#rsvp-ring">Loïc &amp; Ingrid · 19 juin 2027 · Royal Ascot ·</textPath>
        </text>
      </svg>
      <span aria-hidden="true" className="absolute inset-[22%] rounded-full border border-[#111]/25" />
      <span className="absolute inset-0 m-auto grid h-[36%] w-[36%] place-items-center">{children}</span>
    </div>
  )
}

function Checker({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`h-3 w-full bg-[conic-gradient(#ffffff_25%,#111111_0_50%,#ffffff_0_75%,#111111_0)] bg-[length:12px_12px] sm:h-4 sm:bg-[length:16px_16px] ${className}`}
    />
  )
}

function Corners() {
  const base = 'absolute h-2.5 w-2.5 border-[#111]'
  return (
    <>
      <span aria-hidden="true" className={`${base} left-1.5 top-1.5 border-l border-t`} />
      <span aria-hidden="true" className={`${base} right-1.5 top-1.5 border-r border-t`} />
      <span aria-hidden="true" className={`${base} bottom-1.5 left-1.5 border-b border-l`} />
      <span aria-hidden="true" className={`${base} bottom-1.5 right-1.5 border-b border-r`} />
    </>
  )
}

/* ================================================================
   CHAMPS DU FORMULAIRE
   ================================================================ */
const labelCls = 'block text-[10px] uppercase tracking-[0.25em] text-[#111]/60'
const lineInput =
  'mt-2 block w-full rounded-none border-0 border-b border-[#111]/35 bg-transparent px-0 py-2.5 font-serif text-lg text-[#111] placeholder:text-[#111]/30 transition-colors focus:border-[#111] focus:outline-none focus:ring-0'
const boxInput =
  'mt-2 block w-full resize-none rounded-none border border-[#111]/35 bg-transparent p-3 font-serif text-base text-[#111] placeholder:text-[#111]/30 transition-colors focus:border-[#111] focus:outline-none focus:ring-0'

function Choice({
  selected,
  onSelect,
  icon,
  title,
  text,
}: {
  selected: boolean
  onSelect: () => void
  icon: ReactNode
  title: string
  text: string
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`group relative flex flex-col items-center gap-2 overflow-hidden border p-5 text-center transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111] sm:p-6 ${
        selected
          ? 'border-[#111] bg-[#111] text-white'
          : 'border-[#111]/30 bg-white text-[#111] hover:border-[#111]'
      }`}
    >
      <span className={`transition-transform duration-500 ease-[cubic-bezier(.34,1.56,.64,1)] ${selected ? 'scale-110' : ''}`}>
        {icon}
      </span>
      <span className="font-serif text-lg leading-tight">{title}</span>
      <span className={`text-xs leading-5 ${selected ? 'text-white/70' : 'text-[#111]/55'}`}>{text}</span>
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 bottom-0 h-2.5 bg-[conic-gradient(#ffffff_25%,#111111_0_50%,#ffffff_0_75%,#111111_0)] bg-[length:10px_10px] transition-transform duration-500 ease-out ${
          selected ? 'translate-y-0' : 'translate-y-full'
        }`}
      />
    </button>
  )
}

/* ================================================================
   PAGE
   ================================================================ */
export default function Rsvp() {
  const [introRef, introIn] = useInView<HTMLElement>(0.1)
  const [formRef, formIn] = useInView<HTMLDivElement>(0.08)

  const [form, setForm] = useState<FormState>(empty)
  const [errors, setErrors] = useState<{ name?: string; attending?: string }>({})
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const { wedding, settings, preview } = useSite()
  const [notice, setNotice] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const setCount = (n: number) =>
    setForm((f) => {
      const count = Math.min(Math.max(n, 1), CONFIG.maxGuests)
      const companions = Array.from({ length: count - 1 }, (_, i) => f.companions[i] ?? '')
      return { ...f, count, companions }
    })

  const setCompanion = (i: number, value: string) =>
    setForm((f) => ({ ...f, companions: f.companions.map((c, idx) => (idx === i ? value : c)) }))

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (form.website || preview) return // robot détecté, ou aperçu d'un brouillon

    const next: { name?: string; attending?: string } = {}
    if (!form.name.trim()) next.name = 'Dites-nous qui vous êtes.'
    if (!form.attending) next.attending = 'Merci d’indiquer si vous serez des nôtres.'
    setErrors(next)
    if (next.name) {
      nameRef.current?.focus()
      return
    }
    if (next.attending) return

    const present = form.attending === 'yes'
    const message = buildMessage(form)
    if (message.length > 1000) {
      setNotice('Votre message est un peu long : raccourcissez-le ou les informations des accompagnants.')
      return
    }

    setStatus('sending')
    setNotice('')
    try {
      const res = await submitRsvp({
        slug: wedding.slug,
        fullName: form.name.trim(),
        status: present ? 'confirmed' : 'declined',
        companions: present ? form.count - 1 : 0,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        message: message || undefined,
      })
      if (res.ok) {
        setStatus('done')
      } else {
        const permis = typeof res.allowed_companions === 'number' ? ` Votre invitation en prévoit ${res.allowed_companions} au maximum.` : ''
        setNotice((RSVP_MESSAGES[res.code] ?? 'Votre réponse n’a pas pu être enregistrée.') + (res.code === 'companions_exceeded' ? permis : ''))
        setStatus('error')
      }
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'L’envoi a échoué. Vérifiez votre connexion et réessayez.')
      setStatus('error')
    }
  }

  if (!settings.sections.rsvp) return null

  const echeance = settings.rsvp.deadline ? new Date(settings.rsvp.deadline) : null
  const echeanceValide = echeance && !Number.isNaN(echeance.getTime()) ? echeance : null
  const closed = !settings.rsvp.enabled || (echeanceValide !== null && echeanceValide.getTime() < Date.now())
  const deadlineText = echeanceValide
    ? echeanceValide.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  const firstName = form.name.trim().split(' ')[0]
  const yes = form.attending === 'yes'

  return (
    <div className="relative scroll-mt-4 bg-[#fbfaf6] text-[#111]">
      <style>{css}</style>

      {/* Introduction */}
      <section
        id="rsvp"
        ref={introRef}
        data-in={introIn ? 'true' : 'false'}
        className="relative flex min-h-[70svh] flex-col items-center justify-center overflow-hidden px-5 pb-16 pt-32 text-center"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-3 bottom-4 top-16 border border-[#111]/70 sm:inset-x-5"
        >
          <span className="absolute inset-1.5 border border-[#111]/20" />
          <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 rotate-45 bg-[#111]" />
          <span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 rotate-45 bg-[#111]" />
          <span className="absolute -bottom-[3px] -left-[3px] h-1.5 w-1.5 rotate-45 bg-[#111]" />
          <span className="absolute -bottom-[3px] -right-[3px] h-1.5 w-1.5 rotate-45 bg-[#111]" />
        </div>

        <Sparkle className="absolute left-[12%] top-[26%] h-4 w-4 text-[#111]/70" delay="0s" />
        <Sparkle className="absolute right-[14%] top-[32%] h-5 w-5 text-[#111]/60" delay="1.2s" />
        <Sparkle className="absolute bottom-[26%] left-[18%] hidden h-3 w-3 text-[#111]/60 sm:block" delay="2.1s" />
        <Sparkle className="absolute bottom-[22%] right-[20%] h-4 w-4 text-[#111]/70" delay="0.7s" />

        <div className="rv" style={vars({ '--y': '-24px' })}>
          <Medallion className="h-28 w-28 text-[#111] sm:h-36 sm:w-36">
            <Heart className="beat h-full w-full" strokeWidth={1.6} aria-hidden="true" />
          </Medallion>
        </div>

        <p
          className={`rv mt-6 font-serif text-xs uppercase tracking-[0.4em] sm:text-sm ${inkText}`}
          style={vars({ '--d': '0.2s' })}
        >
          Samedi 19 juin 2027
        </p>
        <div className="rv mt-4 w-40 text-[#111]" style={vars({ '--d': '0.3s' })}>
          <RuleDiamond className="w-full" />
        </div>
        <h2 className="mt-3 font-serif text-[clamp(2.6rem,10vw,7rem)] leading-[0.95] tracking-[0.02em]">
          <Words text="Serez-vous des nôtres ?" className={inkText} start={0.35} step={0.14} />
        </h2>
        <p
          className="rv mt-6 max-w-md text-sm leading-7 text-[#111]/70 sm:text-base sm:leading-8"
          style={vars({ '--d': '1.1s' })}
        >
          Quelques secondes pour nous répondre, et nous pourrons préparer cette journée avec vous.
        </p>
        {deadlineText && !closed && (
          <p className="rv mt-3 font-serif text-sm italic text-[#111]/60" style={vars({ '--d': '1.25s' })}>
            Merci de répondre avant le {deadlineText}.
          </p>
        )}
      </section>

      <Checker />

      {/* Formulaire */}
      <div className="relative bg-[linear-gradient(90deg,rgba(17,17,17,0.035)_1px,transparent_1px)] bg-[length:44px_100%] px-5 pb-24 pt-20 sm:px-10">
        <div
          ref={formRef}
          data-in={formIn ? 'true' : 'false'}
          className="hang mx-auto max-w-2xl"
          style={vars({ '--tilt': '-2deg' })}
        >
          <div className="bg-[#111] p-2 ring-1 ring-inset ring-white/20 [filter:drop-shadow(0_16px_18px_rgba(0,0,0,0.18))] sm:p-2.5">
            <div className="relative bg-white p-6 sm:p-12">
              <Corners />

              {closed ? (
                <div className="text-center" role="status">
                  <TopHat className="bob mx-auto h-12 w-12 text-[#111]" />
                  <h2 className="mt-3 font-serif text-3xl leading-tight text-[#111] sm:text-4xl">Les réponses sont closes</h2>
                  <RuleDiamond className="mx-auto mt-4 w-28 text-[#111]" />
                  <p className="mt-6 text-sm leading-7 text-[#111]/70 sm:text-base">
                    Les réponses ne sont plus acceptées. Contactez directement les mariés.
                  </p>
                </div>
              ) : status === 'done' ? (
                /* ---------- Confirmation ---------- */
                <div className="flex flex-col items-center text-center" aria-live="polite">
                  <div className="relative grid h-24 w-24 place-items-center">
                    <span aria-hidden="true" className="ring-out absolute inset-0 rounded-full border border-[#111]" />
                    <span className="grid h-24 w-24 place-items-center rounded-full bg-[#111] text-white">
                      <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path className="draw" d="M5 12.5l4.5 4.5L19 7.5" />
                      </svg>
                    </span>
                    <Sparkle className="absolute -left-4 top-1 h-4 w-4 text-[#111]" delay="0.4s" />
                    <Sparkle className="absolute -right-5 bottom-2 h-5 w-5 text-[#111]" delay="1.1s" />
                  </div>

                  <h2 className={`fx-up mt-8 font-serif text-[clamp(1.9rem,5vw,2.8rem)] leading-tight ${inkText}`} style={vars({ '--d': '0.3s' })}>
                    {yes ? `Merci ${firstName}, à très bientôt !` : `Merci ${firstName}, vous nous manquerez.`}
                  </h2>
                  <RuleDiamond className="fx-up mt-5 w-32 text-[#111]" />
                  <p className="fx-up mt-5 max-w-md text-sm leading-7 text-[#111]/70 sm:text-base sm:leading-8" style={vars({ '--d': '0.5s' })}>
                    {yes
                      ? 'Votre réponse est bien notée. Nous avons hâte de partager cette journée avec vous, le 19 juin.'
                      : 'Merci de nous avoir prévenus. Nous penserons à vous, et nous serons heureux de vous retrouver très vite.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setStatus('idle')}
                    className="fx-up mt-8 text-[11px] uppercase tracking-[0.22em] text-[#111]/70 underline underline-offset-8 transition-colors hover:text-[#111] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#111]"
                    style={vars({ '--d': '0.9s' })}
                  >
                    Modifier ma réponse
                  </button>
                </div>
              ) : (
                /* ---------- Formulaire ---------- */
                <form onSubmit={onSubmit} noValidate>
                  <div className="text-center">
                    <TopHat className="bob mx-auto h-12 w-12 text-[#111]" />
                    <h2 className="mt-3 font-serif text-3xl leading-tight text-[#111] sm:text-4xl">Votre réponse</h2>
                    <RuleDiamond className="mx-auto mt-4 w-28 text-[#111]" />
                  </div>

                  {/* Piège à robots, invisible pour les humains */}
                  <div aria-hidden="true" className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden">
                    <label>
                      Ne pas remplir
                      <input
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                        value={form.website}
                        onChange={(e) => set('website', e.target.value)}
                      />
                    </label>
                  </div>

                  <div className="mt-10">
                    <label htmlFor="rsvp-name" className={labelCls}>
                      Nom et prénom
                    </label>
                    <input
                      ref={nameRef}
                      id="rsvp-name"
                      type="text"
                      autoComplete="name"
                      value={form.name}
                      onChange={(e) => set('name', e.target.value)}
                      aria-invalid={!!errors.name}
                      aria-describedby={errors.name ? 'rsvp-name-err' : undefined}
                      placeholder="Comment vous appelez-vous ?"
                      className={lineInput}
                    />
                    {errors.name && (
                      <p id="rsvp-name-err" className="mt-2 flex items-center gap-1.5 text-xs text-[#111]">
                        <AlertCircle size={14} aria-hidden="true" /> {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Présence */}
                  <div className="mt-10">
                    <p id="rsvp-att" className={labelCls}>
                      Votre présence
                    </p>
                    <div role="radiogroup" aria-labelledby="rsvp-att" className="mt-3 grid gap-3 sm:grid-cols-2">
                      <Choice
                        selected={form.attending === 'yes'}
                        onSelect={() => {
                          set('attending', 'yes')
                          setErrors((er) => ({ ...er, attending: undefined }))
                        }}
                        icon={<Heart size={26} aria-hidden="true" />}
                        title="Avec joie, je serai là"
                        text="Nous comptons sur vous."
                      />
                      <Choice
                        selected={form.attending === 'no'}
                        onSelect={() => {
                          set('attending', 'no')
                          setErrors((er) => ({ ...er, attending: undefined }))
                        }}
                        icon={<HeartCrack size={26} aria-hidden="true" />}
                        title="Hélas, je ne pourrai pas"
                        text="Merci de nous prévenir."
                      />
                    </div>
                    {errors.attending && (
                      <p className="mt-3 flex items-center gap-1.5 text-xs text-[#111]">
                        <AlertCircle size={14} aria-hidden="true" /> {errors.attending}
                      </p>
                    )}
                  </div>

                  {/* Détails si présent */}
                  {yes && (
                    <div className="fx-up mt-10 space-y-10">
                      <div>
                        <p className={labelCls}>Nombre de personnes, vous compris</p>
                        <div className="mt-3 flex items-center gap-5">
                          <button
                            type="button"
                            onClick={() => setCount(form.count - 1)}
                            disabled={form.count <= 1}
                            aria-label="Une personne de moins"
                            className="grid h-11 w-11 place-items-center rounded-full border border-[#111]/40 text-[#111] transition-colors hover:border-[#111] hover:bg-[#111] hover:text-white disabled:pointer-events-none disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111]"
                          >
                            <Minus size={18} aria-hidden="true" />
                          </button>
                          <span className="w-10 text-center font-serif text-4xl leading-none text-[#111]" aria-live="polite">
                            {form.count}
                          </span>
                          <button
                            type="button"
                            onClick={() => setCount(form.count + 1)}
                            disabled={form.count >= CONFIG.maxGuests}
                            aria-label="Une personne de plus"
                            className="grid h-11 w-11 place-items-center rounded-full border border-[#111]/40 text-[#111] transition-colors hover:border-[#111] hover:bg-[#111] hover:text-white disabled:pointer-events-none disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111]"
                          >
                            <Plus size={18} aria-hidden="true" />
                          </button>
                        </div>

                        {form.companions.map((c, i) => (
                          <div key={i} className="mt-5">
                            <label htmlFor={`rsvp-comp-${i}`} className={labelCls}>
                              Nom de la personne {i + 2}
                            </label>
                            <input
                              id={`rsvp-comp-${i}`}
                              type="text"
                              value={c}
                              onChange={(e) => setCompanion(i, e.target.value)}
                              placeholder="Nom et prénom"
                              className={lineInput}
                            />
                          </div>
                        ))}
                      </div>

                      <div>
                        <label htmlFor="rsvp-diet" className={labelCls}>
                          Régime alimentaire ou allergies <span className="normal-case tracking-normal">(facultatif)</span>
                        </label>
                        <input
                          id="rsvp-diet"
                          type="text"
                          value={form.diet}
                          onChange={(e) => set('diet', e.target.value)}
                          placeholder="Végétarien, sans gluten…"
                          className={lineInput}
                        />
                      </div>
                    </div>
                  )}

                  {/* Coordonnées */}
                  <div className="mt-10 grid gap-8 sm:grid-cols-2">
                    <div>
                      <label htmlFor="rsvp-phone" className={labelCls}>
                        Téléphone <span className="normal-case tracking-normal">(facultatif)</span>
                      </label>
                      <input
                        id="rsvp-phone"
                        type="tel"
                        autoComplete="tel"
                        value={form.phone}
                        onChange={(e) => set('phone', e.target.value)}
                        placeholder="+237 …"
                        className={lineInput}
                      />
                    </div>
                    <div>
                      <label htmlFor="rsvp-email" className={labelCls}>
                        E-mail <span className="normal-case tracking-normal">(facultatif)</span>
                      </label>
                      <input
                        id="rsvp-email"
                        type="email"
                        autoComplete="email"
                        value={form.email}
                        onChange={(e) => set('email', e.target.value)}
                        placeholder="vous@exemple.com"
                        className={lineInput}
                      />
                    </div>
                  </div>

                  <div className="mt-10">
                    <label htmlFor="rsvp-msg" className={labelCls}>
                      Un petit mot pour nous <span className="normal-case tracking-normal">(facultatif)</span>
                    </label>
                    <textarea
                      id="rsvp-msg"
                      rows={4}
                      maxLength={500}
                      value={form.message}
                      onChange={(e) => set('message', e.target.value)}
                      placeholder="Un mot doux, une question…"
                      className={boxInput}
                    />
                  </div>

                  {preview && (
                    <p className="mt-8 text-center font-serif text-xs italic text-[#111]/50">Aperçu : l’envoi est désactivé.</p>
                  )}

                  {notice && (
                    <p role="alert" className="mt-8 flex items-start gap-2 border border-[#111] p-3 text-sm text-[#111]">
                      <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                      {notice}
                    </p>
                  )}

                  <div className="mt-10 flex justify-center">
                    <button
                      type="submit"
                      disabled={status === 'sending' || preview}
                      className="group relative flex items-center gap-3 overflow-hidden rounded-full bg-[#111] px-10 py-4 font-serif text-sm font-semibold uppercase tracking-[0.22em] text-white transition-colors hover:bg-[#2b2b2b] disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#111]"
                    >
                      {status === 'sending' ? (
                        <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                      ) : (
                        <Send size={18} className="transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-1" aria-hidden="true" />
                      )}
                      {status === 'sending' ? 'Envoi en cours…' : 'Envoyer ma réponse'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}