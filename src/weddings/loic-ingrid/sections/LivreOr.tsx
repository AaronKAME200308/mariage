import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties, FormEvent, ReactNode } from 'react'
import { AlertCircle, Check, Loader2, PenLine } from 'lucide-react'
import { fetchPublicWedding } from '@/services/publicWedding'
import { GUESTBOOK_MESSAGES, submitGuestbookMessage } from '@/services/publicActions'
import type { GuestbookEntry } from '@/types/domain'
import { useSite } from '../../_kit'

/* ================================================================
   DONNÉES : Supabase
   ----------------------------------------------------------------
   • Lecture  : les messages APPROUVÉS (get_public_wedding → guestbook).
   • Écriture : submit_guestbook_message (validation, limitation de débit,
     modération côté base). Les messages se valident dans l'espace
     couple/admin → « Livre d'or ».
   ================================================================ */
type Message = { id: string; name: string; message: string; date: string }

const PAGE_SIZE = 9
const MAX_MESSAGE = 1000

const versMessages = (list: GuestbookEntry[]): Message[] =>
  list.map((m) => ({ id: m.id, name: m.author_name, message: m.message, date: m.created_at }))

const sortNewest = (list: Message[]) =>
  [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

const formatDate = (iso: string) => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

/* ================================================================
   STYLES RÉUTILISABLES
   ================================================================ */
const whiteText =
  'bg-[linear-gradient(180deg,#ffffff_0%,#f2f2f2_40%,#b5b5b5_100%)] bg-clip-text text-transparent'
const whiteBg = 'bg-[linear-gradient(135deg,#ffffff_0%,#e6e6e6_45%,#a0a0a0_100%)]'

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

/* La plume écrit */
@keyframes write{0%,100%{transform:translate(0,0) rotate(0)}30%{transform:translate(3px,-3px) rotate(8deg)}60%{transform:translate(-2px,2px) rotate(-6deg)}}
.write{animation:write 3.6s ease-in-out infinite}

/* Nouveau message : il se pose comme un tampon */
@keyframes stamp{
  0%{opacity:0;transform:scale(1.3) rotate(-4deg)}
  60%{opacity:1;transform:scale(.97) rotate(1deg)}
  100%{opacity:1;transform:none}
}
.stamp{animation:stamp .9s cubic-bezier(.16,1,.3,1) both}

@keyframes fxUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.fx-up{animation:fxUp .8s cubic-bezier(.16,1,.3,1) both}

@media (prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  .hang,.rv,.wm>span{transition:none!important;opacity:1;filter:none;transform:none}
  .bob,.twinkle,.spin-slow,.write,.stamp,.fx-up{animation:none}
}
`

/* ================================================================
   OUTILS
   ================================================================ */
function useInView<T extends HTMLElement>(threshold = 0.12) {
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
          <path id="livre-ring" d="M100,100 m-80,0 a80,80 0 1,1 160,0 a80,80 0 1,1 -160,0" />
        </defs>
        <text fill="currentColor" fontSize="11.5" letterSpacing="3" className="font-serif uppercase">
          <textPath href="#livre-ring">Loïc &amp; Ingrid · 19 juin 2027 · Royal Ascot ·</textPath>
        </text>
      </svg>
      <span aria-hidden="true" className="absolute inset-[22%] rounded-full border border-white/25" />
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

const checkerStrip =
  'pointer-events-none absolute inset-x-0 bottom-0 h-2.5 translate-y-full bg-[conic-gradient(#ffffff_25%,#111111_0_50%,#ffffff_0_75%,#111111_0)] bg-[length:10px_10px] transition-transform duration-500 ease-out group-hover:translate-y-0'

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
   CARTE D'UN MESSAGE (noire, filet blanc)
   ================================================================ */
function MessageCard({ item, index, fresh }: { item: Message; index: number; fresh: boolean }) {
  const [ref, inView] = useInView<HTMLElement>(0.08)
  const corner = 'pointer-events-none absolute h-1.5 w-1.5 rotate-45 bg-white'
  const tilts = ['-2deg', '2deg', '-1.5deg', '1.5deg']

  return (
    <figure
      ref={ref}
      data-in={inView ? 'true' : 'false'}
      className="hang mb-10 break-inside-avoid"
      style={vars({ '--tilt': tilts[index % tilts.length], '--d': `${(index % 3) * 0.12}s` })}
    >
      <div className={`group relative ${fresh ? 'stamp' : ''}`}>
        {/* Le haut-de-forme qui se soulève au survol */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-8 top-0 z-0 h-10 w-10 text-white opacity-0 transition-all duration-500 ease-[cubic-bezier(.34,1.56,.64,1)] group-hover:-translate-y-[88%] group-hover:rotate-12 group-hover:opacity-100"
        >
          <TopHat className="h-full w-full" />
        </span>

        <div className="relative z-10 overflow-hidden bg-[#0b0b0b] p-6 ring-1 ring-white/70 transition-[transform,box-shadow] duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_22px_40px_-24px_rgba(255,255,255,0.35)] sm:p-7">
          <span aria-hidden="true" className="pointer-events-none absolute inset-1.5 border border-white/15" />
          <span aria-hidden="true" className={`${corner} left-[3px] top-[3px]`} />
          <span aria-hidden="true" className={`${corner} right-[3px] top-[3px]`} />
          <span aria-hidden="true" className={`${corner} bottom-[3px] left-[3px]`} />
          <span aria-hidden="true" className={`${corner} bottom-[3px] right-[3px]`} />

          {/* Grand guillemet en filigrane */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -left-1 -top-6 select-none font-serif text-[8rem] leading-none text-transparent"
            style={{ WebkitTextStroke: '1px rgba(255,255,255,0.14)' }}
          >
            “
          </span>

          {fresh && (
            <span className="absolute right-4 top-4 z-10 rounded-full bg-white px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#111]">
              Nouveau
            </span>
          )}

          <blockquote className="relative whitespace-pre-line break-words font-serif text-lg italic leading-8 text-white/90">
            {item.message}
          </blockquote>
          <RuleDiamond className="relative mt-5 w-16 text-white" />
          <figcaption className="relative mt-4">
            <p className={`font-serif text-xl ${whiteText}`}>{item.name}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-white/50">{formatDate(item.date)}</p>
          </figcaption>

          <span aria-hidden="true" className={checkerStrip} />
        </div>
      </div>
    </figure>
  )
}

/* ================================================================
   PAGE
   ================================================================ */
const labelCls = 'block text-[10px] uppercase tracking-[0.25em] text-[#111]/60'
const lineInput =
  'mt-2 block w-full rounded-none border-0 border-b border-[#111]/35 bg-transparent px-0 py-2.5 font-serif text-lg text-[#111] placeholder:text-[#111]/30 transition-colors focus:border-[#111] focus:outline-none focus:ring-0'
const boxInput =
  'mt-2 block w-full resize-none rounded-none border border-[#111]/35 bg-transparent p-3 font-serif text-base leading-7 text-[#111] placeholder:text-[#111]/30 transition-colors focus:border-[#111] focus:outline-none focus:ring-0'

export default function LivreDor() {
  const [introRef, introIn] = useInView<HTMLElement>(0.1)
  const [formRef, formIn] = useInView<HTMLDivElement>(0.08)
  const [listRef, listIn] = useInView<HTMLElement>(0.05)

  const { wedding, data, settings, preview } = useSite()
  const [remote, setRemote] = useState<Message[]>(() => versMessages(data.guestbook))
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [shown, setShown] = useState(PAGE_SIZE)

  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const [website, setWebsite] = useState('') // piège à robots
  const [errors, setErrors] = useState<{ name?: string; text?: string }>({})
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null)
  const [freshId, setFreshId] = useState<string | null>(null)
  const lastSent = useRef(0)
  const nameRef = useRef<HTMLInputElement>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)

  // Relit les messages approuvés dans la base (aucun ajout simulé côté navigateur).
  const refresh = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const frais = await fetchPublicWedding(wedding.slug)
      if (frais) setRemote(versMessages(frais.guestbook))
      return frais ? versMessages(frais.guestbook) : []
    } catch {
      setLoadError(true)
      return null
    } finally {
      setLoading(false)
    }
  }, [wedding.slug])

  if (!settings.sections.guestbook) return null

  const all = sortNewest(remote)
  const visible = all.slice(0, shown)
  const ouvert = settings.guestbook.enabled

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (website || preview) return // robot détecté, ou aperçu d'un brouillon

    const next: { name?: string; text?: string } = {}
    if (name.trim().length < 2) next.name = 'Dites-nous votre nom.'
    if (text.trim().length < 5) next.text = 'Écrivez-nous au moins quelques mots.'
    setErrors(next)
    if (next.name) return nameRef.current?.focus()
    if (next.text) return textRef.current?.focus()

    if (Date.now() - lastSent.current < 15000) {
      setFeedback({ ok: false, text: 'Un instant avant d’écrire un nouveau message.' })
      return
    }

    const author = name.trim()
    const message = text.trim()
    setSending(true)
    setFeedback(null)
    try {
      const res = await submitGuestbookMessage(wedding.slug, author, message)
      if (!res.ok) {
        setFeedback({ ok: false, text: GUESTBOOK_MESSAGES[res.code] ?? 'Votre message n’a pas pu être envoyé.' })
        return
      }
      lastSent.current = Date.now()
      setName('')
      setText('')
      setErrors({})
      if (settings.guestbook.autoApprove) {
        const liste = await refresh()
        setFreshId(liste?.find((m) => m.name === author && m.message === message)?.id ?? null)
        setFeedback({ ok: true, text: 'Merci ! Votre message a été ajouté au livre d’or.' })
        window.setTimeout(() => {
          document.getElementById('messages')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 700)
      } else {
        setFeedback({ ok: true, text: 'Merci ! Votre message sera visible dès que les mariés l’auront validé.' })
      }
    } catch (err) {
      setFeedback({ ok: false, text: err instanceof Error ? err.message : 'L’envoi a échoué. Vérifiez votre connexion et réessayez.' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div id="livre-d-or" className="relative scroll-mt-4 bg-[#0b0b0b] text-[#f4f0e8]">
      <style>{css}</style>

      {/* Introduction */}
      <section
        ref={introRef}
        data-in={introIn ? 'true' : 'false'}
        className="relative flex min-h-[72svh] flex-col items-center justify-center overflow-hidden px-5 pb-16 pt-32 text-center"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-3 bottom-4 top-16 border border-white/70 sm:inset-x-5"
        >
          <span className="absolute inset-1.5 border border-white/20" />
          <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 rotate-45 bg-white" />
          <span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 rotate-45 bg-white" />
          <span className="absolute -bottom-[3px] -left-[3px] h-1.5 w-1.5 rotate-45 bg-white" />
          <span className="absolute -bottom-[3px] -right-[3px] h-1.5 w-1.5 rotate-45 bg-white" />
        </div>

        <Sparkle className="absolute left-[12%] top-[26%] h-4 w-4 text-white/70" delay="0s" />
        <Sparkle className="absolute right-[14%] top-[32%] h-5 w-5 text-white/60" delay="1.2s" />
        <Sparkle className="absolute bottom-[26%] left-[18%] hidden h-3 w-3 text-white/60 sm:block" delay="2.1s" />
        <Sparkle className="absolute bottom-[22%] right-[20%] h-4 w-4 text-white/70" delay="0.7s" />

        <div className="rv" style={vars({ '--y': '-24px' })}>
          <Medallion className="h-28 w-28 text-white sm:h-36 sm:w-36">
            <PenLine className="write h-full w-full" strokeWidth={1.6} aria-hidden="true" />
          </Medallion>
        </div>

        <p
          className={`rv mt-6 font-serif text-xs uppercase tracking-[0.4em] sm:text-sm ${whiteText}`}
          style={vars({ '--d': '0.2s' })}
        >
          Loïc &amp; Ingrid
        </p>
        <div className="rv mt-4 w-40 text-white" style={vars({ '--d': '0.3s' })}>
          <RuleDiamond className="w-full" />
        </div>
        <h2 className="mt-3 font-serif text-[clamp(2.8rem,11vw,8rem)] leading-[0.95] tracking-[0.02em]">
          <Words text="Le livre d’or" className={whiteText} start={0.35} step={0.16} />
        </h2>
        <p
          className="rv mt-6 max-w-md text-sm leading-7 text-white/70 sm:text-base sm:leading-8"
          style={vars({ '--d': '1s' })}
        >
          Un mot, un souvenir, un vœu : laissez-nous quelques lignes, nous les relirons toute notre vie.
        </p>
        {ouvert && (
        <button
          type="button"
          onClick={() => document.getElementById('signer')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          className={`rv mt-9 rounded-full p-px transition-shadow hover:shadow-[0_0_32px_-6px_#e6e6e6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white ${whiteBg}`}
          style={vars({ '--d': '1.2s' })}
        >
          <span className="flex items-center gap-2 rounded-full bg-[#0b0b0b] px-8 py-3.5">
            <PenLine size={16} className="text-white" aria-hidden="true" />
            <span className={`font-serif text-sm font-semibold uppercase tracking-[0.22em] ${whiteText}`}>
              Signer le livre
            </span>
          </span>
        </button>
        )}
      </section>

      <Checker />

      <div className="relative bg-[linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[length:44px_100%]">
        {/* Formulaire : une feuille blanche sur fond noir */}
        {ouvert && (
        <section id="signer" className="relative px-5 pb-10 pt-24 sm:px-10">
          <div
            ref={formRef}
            data-in={formIn ? 'true' : 'false'}
            className="hang mx-auto max-w-2xl"
            style={vars({ '--tilt': '-2deg' })}
          >
            <div className={`p-[3px] [filter:drop-shadow(0_0_46px_rgba(255,255,255,0.10))] ${whiteBg}`}>
              <div className="relative bg-white p-6 text-[#111] sm:p-12">
                <Corners />

                <div className="text-center">
                  <PenLine className="write mx-auto h-9 w-9 text-[#111]" strokeWidth={1.5} aria-hidden="true" />
                  <h2 className="mt-3 font-serif text-3xl leading-tight sm:text-4xl">Laissez-nous un mot</h2>
                  <RuleDiamond className="mx-auto mt-4 w-28 text-[#111]" />
                </div>

                <form onSubmit={onSubmit} noValidate className="mt-10">
                  {/* Piège à robots, invisible pour les humains */}
                  <div aria-hidden="true" className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden">
                    <label>
                      Ne pas remplir
                      <input
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                      />
                    </label>
                  </div>

                  <div>
                    <label htmlFor="lo-name" className={labelCls}>
                      Votre nom
                    </label>
                    <input
                      ref={nameRef}
                      id="lo-name"
                      type="text"
                      autoComplete="name"
                      maxLength={60}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      aria-invalid={!!errors.name}
                      aria-describedby={errors.name ? 'lo-name-err' : undefined}
                      placeholder="Comment vous appelez-vous ?"
                      className={lineInput}
                    />
                    {errors.name && (
                      <p id="lo-name-err" className="mt-2 flex items-center gap-1.5 text-xs">
                        <AlertCircle size={14} aria-hidden="true" /> {errors.name}
                      </p>
                    )}
                  </div>

                  <div className="mt-9">
                    <label htmlFor="lo-text" className={labelCls}>
                      Votre message
                    </label>
                    <textarea
                      ref={textRef}
                      id="lo-text"
                      rows={5}
                      maxLength={MAX_MESSAGE}
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      aria-invalid={!!errors.text}
                      aria-describedby={errors.text ? 'lo-text-err' : undefined}
                      placeholder="Un souvenir, un conseil, un vœu pour les mariés…"
                      className={boxInput}
                    />
                    <div className="mt-2 flex items-start justify-between gap-3">
                      {errors.text ? (
                        <p id="lo-text-err" className="flex items-center gap-1.5 text-xs">
                          <AlertCircle size={14} aria-hidden="true" /> {errors.text}
                        </p>
                      ) : (
                        <span />
                      )}
                      <span className="text-[11px] tabular-nums text-[#111]/50">
                        {text.length} / {MAX_MESSAGE}
                      </span>
                    </div>
                  </div>

                  {feedback && (
                    <p
                      role={feedback.ok ? 'status' : 'alert'}
                      className="fx-up mt-7 flex items-start gap-2 border border-[#111] p-3 text-sm"
                    >
                      {feedback.ok ? (
                        <Check size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                      ) : (
                        <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                      )}
                      {feedback.text}
                    </p>
                  )}

                  <div className="mt-9 flex justify-center">
                    <button
                      type="submit"
                      disabled={sending || preview}
                      className="group flex items-center gap-3 rounded-full bg-[#111] px-10 py-4 font-serif text-sm font-semibold uppercase tracking-[0.22em] text-white transition-colors hover:bg-[#2b2b2b] disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#111]"
                    >
                      {sending ? (
                        <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                      ) : (
                        <PenLine size={18} className="transition-transform duration-500 group-hover:-rotate-12" aria-hidden="true" />
                      )}
                      {sending ? 'Envoi en cours…' : 'Signer le livre d’or'}
                    </button>
                  </div>

                  {preview && (
                    <p className="mt-6 text-center font-serif text-xs italic text-[#111]/50">
                      Aperçu : l’envoi est désactivé.
                    </p>
                  )}
                </form>
              </div>
            </div>
          </div>
        </section>
        )}

        {/* Les messages */}
        <section
          id="messages"
          ref={listRef}
          data-in={listIn ? 'true' : 'false'}
          className="relative px-5 pb-24 pt-20 sm:px-10 lg:px-16"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mb-14 text-center">
              <p className="rv font-serif text-sm italic text-white/60">
                {all.length > 0 ? `${all.length} ${all.length > 1 ? 'messages' : 'message'}` : 'Les mots de nos invités'}
              </p>
              <h2 className="mt-2 font-serif text-[clamp(2.2rem,6vw,4rem)] leading-[1.05]">
                <Words text="Vos mots doux" className={whiteText} start={0.15} step={0.16} />
              </h2>
              <div className="rv mx-auto mt-5 w-40 text-white" style={vars({ '--d': '0.5s' })}>
                <RuleDiamond className="w-full" />
              </div>
            </div>

            {loading ? (
              <p className="flex items-center justify-center gap-3 py-16 font-serif text-lg italic text-white/60">
                <Loader2 size={20} className="animate-spin" aria-hidden="true" /> Chargement des messages…
              </p>
            ) : loadError ? (
              <div className="mx-auto max-w-md py-12 text-center">
                <p className="font-serif text-lg italic text-white/80">Impossible de charger les messages pour le moment.</p>
                <button
                  type="button"
                  onClick={refresh}
                  className="mt-5 rounded-full border border-white/50 px-7 py-2.5 text-[11px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-white hover:text-[#111] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Réessayer
                </button>
              </div>
            ) : all.length === 0 ? (
              <div className="mx-auto flex max-w-md flex-col items-center py-12 text-center">
                <TopHat className="bob h-16 w-16 text-white/80" />
                <p className="mt-5 font-serif text-2xl italic">Le livre est encore vierge.</p>
                <p className="mt-3 text-sm leading-7 text-white/60">Soyez le premier à y laisser un mot.</p>
              </div>
            ) : (
              <>
                <div className="columns-1 gap-x-10 sm:columns-2 lg:columns-3">
                  {visible.map((m, i) => (
                    <MessageCard key={m.id} item={m} index={i} fresh={m.id === freshId} />
                  ))}
                </div>

                {all.length > shown && (
                  <div className="mt-6 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setShown((n) => n + PAGE_SIZE)}
                      className="rounded-full border border-white/50 px-9 py-3 text-[11px] uppercase tracking-[0.22em] text-white transition-colors hover:bg-white hover:text-[#111] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                    >
                      Lire la suite
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}