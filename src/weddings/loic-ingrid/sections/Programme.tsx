import { Fragment, useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { CalendarPlus, Camera, Church, PartyPopper, Users, Wine } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/* ================================================================
   CONTENU : le programme du 19 juin 2027
   ----------------------------------------------------------------
   Incohérence corrigée : l'arrivée des convives et le début de la
   célébration étaient tous deux à 15h00. L'arrivée est donc avancée
   à 14h00 (modifiez `time` et `start` ci-dessous si vous préférez
   une autre heure).
   ================================================================ */
type Parallel = { icon: LucideIcon; title: string; text: string }
type Step = {
  id: string
  time: string // affichage
  start: string // heure de début (UTC) pour l'agenda, format AAAAMMJJTHHMMSSZ
  end?: string
  title: string
  text: string
  icon: LucideIcon
  parallel?: Parallel[]
}

// 19 juin 2027, heure d'été d'Europe centrale (UTC+2) : 14h00 = 12h00 UTC
const steps: Step[] = [
  {
    id: 'arrivee',
    time: '14h00',
    start: '20270619T120000Z',
    end: '20270619T130000Z',
    title: 'Arrivée des convives',
    text: 'Accueil des invités et installation avant la célébration. Prévoyez d’arriver un peu en avance : elle commence à l’heure.',
    icon: Users,
  },
  {
    id: 'ceremonie',
    time: '15h00',
    start: '20270619T130000Z',
    end: '20270619T143000Z',
    title: 'Célébration religieuse',
    text: 'Loïc et Ingrid échangent leurs vœux, entourés de leurs proches. Le grand moment de la journée.',
    icon: Church,
  },
  {
    id: 'cocktail',
    time: '16h30',
    start: '20270619T143000Z',
    end: '20270619T163000Z',
    title: 'Séance photos et cocktail',
    text: 'Deux moments en parallèle : pendant que les mariés posent pour les photos, les convives profitent du cocktail.',
    icon: Camera,
    parallel: [
      {
        icon: Camera,
        title: 'La séance photos',
        text: 'Les mariés posent avec leurs proches pour les souvenirs de la journée.',
      },
      {
        icon: Wine,
        title: 'Le cocktail',
        text: 'Les convives se retrouvent, trinquent et patientent en douceur avant la soirée.',
      },
    ],
  },
  {
    id: 'soiree',
    time: '18h30',
    start: '20270619T163000Z',
    title: 'Installation et début de la soirée',
    text: 'Les convives s’installent dans l’espace réception, et la soirée commence : place à la fête.',
    icon: PartyPopper,
  },
]

/* ================================================================
   STYLES RÉUTILISABLES
   ================================================================ */
const inkText =
  'bg-[linear-gradient(180deg,#111111_0%,#2b2b2b_55%,#6b6b6b_100%)] bg-clip-text text-transparent'
const whiteText =
  'bg-[linear-gradient(180deg,#ffffff_0%,#f2f2f2_40%,#b5b5b5_100%)] bg-clip-text text-transparent'
const whiteBg = 'bg-[linear-gradient(135deg,#ffffff_0%,#e6e6e6_45%,#a0a0a0_100%)]'

const vars = (o: Record<string, string>) => o as CSSProperties

const css = `
html{scroll-behavior:smooth}

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

/* La carte se dévoile comme un rideau qui se lève */
.rise{
  opacity:0;
  transform:translateY(26px);
  clip-path:inset(0 0 100% 0);
  transition:
    opacity .8s ease var(--d,0s),
    transform 1.2s cubic-bezier(.16,1,.3,1) var(--d,0s),
    clip-path 1.2s cubic-bezier(.16,1,.3,1) var(--d,0s);
}
[data-in="true"] .rise{opacity:1;transform:none;clip-path:inset(-4rem -1rem -1rem -1rem)}

/* Le repère de l'étape fait son entrée avec un petit rebond */
.pop{
  opacity:0;
  transform:scale(.4);
  transition:
    opacity .5s ease var(--d,0s),
    transform .9s cubic-bezier(.34,1.56,.64,1) var(--d,0s);
}
[data-in="true"] .pop{opacity:1;transform:none}

@keyframes bob{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-9px) rotate(3deg)}}
.bob{animation:bob 7s ease-in-out infinite}

/* Étincelles discrètes */
@keyframes twinkle{
  0%,100%{opacity:.2;transform:scale(.75) rotate(0deg)}
  50%{opacity:1;transform:scale(1.1) rotate(25deg)}
}
.twinkle{animation:twinkle 3.8s ease-in-out var(--d,0s) infinite}

/* Médaillon qui tourne très lentement */
@keyframes spinSlow{to{transform:rotate(360deg)}}
.spin-slow{animation:spinSlow 50s linear infinite}

/* Étape en cours : anneau qui pulse */
@keyframes ringPulse{
  0%{box-shadow:0 0 0 0 rgba(17,17,17,.28)}
  100%{box-shadow:0 0 0 14px rgba(17,17,17,0)}
}
.pulse{animation:ringPulse 2.2s ease-out infinite}

@media (prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  .rv,.wm>span,.rise,.pop{transition:none!important;opacity:1;filter:none;transform:none;clip-path:none}
  .bob,.twinkle,.spin-slow,.pulse{animation:none}
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

function goTo(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' })
}

function Words({
  text,
  className = '',
  start = 0,
  step = 0.12,
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

/* Fichier .ics : le programme s'ajoute à l'agenda du visiteur */
function downloadIcs() {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const events = steps.map((s, i) =>
    [
      'BEGIN:VEVENT',
      `UID:programme-${i + 1}@mariage-loic-ingrid`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${s.start}`,
      s.end ? `DTEND:${s.end}` : '',
      `SUMMARY:Mariage Loïc & Ingrid : ${s.title}`,
      `DESCRIPTION:${s.text}`,
      'END:VEVENT',
    ]
      .filter(Boolean)
      .join('\r\n'),
  )
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mariage Loic et Ingrid//FR',
    'CALSCALE:GREGORIAN',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')

  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 'programme-mariage-loic-ingrid.ics'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
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

function Crown({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 72 72" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
      <path d="M12,54 L16,24 L29,38 L36,18 L43,38 L56,24 L60,54 Z" />
      <path d="M12,60 H60" />
      <circle cx="16" cy="21" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="36" cy="14.5" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="56" cy="21" r="2.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function Diamond({ className = '' }: { className?: string }) {
  return <span aria-hidden="true" className={`inline-block h-1.5 w-1.5 rotate-45 bg-current ${className}`} />
}

/* Filet orné : trait, losange, trait */
function RuleDiamond({ className = '' }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`flex items-center gap-2 ${className}`}>
      <span className="h-px flex-1 bg-current opacity-40" />
      <Diamond />
      <span className="h-px flex-1 bg-current opacity-40" />
    </span>
  )
}

/* Petite étoile à 4 branches qui scintille */
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

/* Branche de laurier au trait */
function Laurel({ className = '', flip = false }: { className?: string; flip?: boolean }) {
  const leaves: [number, number, number][] = [
    [26, 165, -55], [26, 165, 55],
    [23, 135, -55], [23, 135, 55],
    [22, 105, -55], [22, 105, 55],
    [24, 75, -55], [24, 75, 55],
    [30, 45, -50], [30, 45, 50],
    [40, 12, 0],
  ]
  return (
    <svg
      viewBox="0 0 80 200"
      className={`${className} ${flip ? '-scale-x-100' : ''}`}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M30,192 C20,140 22,70 40,10" />
      {leaves.map(([x, y, r], i) => (
        <path
          key={i}
          d="M0,0 C7,-10 7,-26 0,-40 C-7,-26 -7,-10 0,0 Z"
          transform={`translate(${x} ${y}) rotate(${r})`}
        />
      ))}
    </svg>
  )
}

/* Médaillon : texte circulaire qui tourne autour d'un haut-de-forme */
function Medallion({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`} role="img" aria-label="Loïc et Ingrid, 19 juin 2027">
      <svg viewBox="0 0 200 200" className="spin-slow absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <path id="prog-ring" d="M100,100 m-80,0 a80,80 0 1,1 160,0 a80,80 0 1,1 -160,0" />
        </defs>
        <text fill="currentColor" fontSize="11.5" letterSpacing="3" className="font-serif uppercase">
          <textPath href="#prog-ring">Loïc &amp; Ingrid · 19 juin 2027 · Royal Ascot ·</textPath>
        </text>
      </svg>
      <span aria-hidden="true" className="absolute inset-[22%] rounded-full border border-[#111]/25" />
      <TopHat className="absolute inset-0 m-auto h-[36%] w-[36%]" />
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

/* ================================================================
   CARTE D'UNE ÉTAPE
   ================================================================ */
const checkerStrip =
  'pointer-events-none absolute inset-x-0 bottom-0 h-2.5 translate-y-full bg-[conic-gradient(#ffffff_25%,#111111_0_50%,#ffffff_0_75%,#111111_0)] bg-[length:10px_10px] transition-transform duration-500 ease-out group-hover:translate-y-0'

function Card({ children, delay, mark }: { children: ReactNode; delay: string; mark: string }) {
  const corner = 'pointer-events-none absolute h-1.5 w-1.5 rotate-45 bg-[#111]'
  return (
    <div className="rise group relative" style={vars({ '--d': delay })}>
      {/* Le haut-de-forme qui se soulève au survol */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-8 top-0 z-0 h-10 w-10 text-[#111] opacity-0 transition-all duration-500 ease-[cubic-bezier(.34,1.56,.64,1)] group-hover:-translate-y-[88%] group-hover:rotate-12 group-hover:opacity-100"
      >
        <TopHat className="h-full w-full" />
      </span>

      <div className="relative z-10 overflow-hidden bg-white p-6 ring-1 ring-[#111] transition-[transform,box-shadow] duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_22px_36px_-22px_rgba(0,0,0,0.5)] sm:p-8">
        {/* Double filet et losanges aux angles */}
        <span aria-hidden="true" className="pointer-events-none absolute inset-1.5 border border-[#111]/20" />
        <span aria-hidden="true" className={`${corner} left-[3px] top-[3px]`} />
        <span aria-hidden="true" className={`${corner} right-[3px] top-[3px]`} />
        <span aria-hidden="true" className={`${corner} bottom-[3px] left-[3px]`} />
        <span aria-hidden="true" className={`${corner} bottom-[3px] right-[3px]`} />

        {/* Grande heure en filigrane */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-3 -top-5 select-none font-serif text-[7.5rem] leading-none text-transparent sm:text-[9rem]"
          style={{ WebkitTextStroke: '1px rgba(17,17,17,0.12)' }}
        >
          {mark}
        </span>

        <div className="relative">{children}</div>
        <span aria-hidden="true" className={checkerStrip} />
      </div>
    </div>
  )
}

function StepRow({
  step,
  index,
  reached,
  current,
}: {
  step: Step
  index: number
  reached: boolean
  current: boolean
}) {
  const [ref, inView] = useInView<HTMLLIElement>(0.2)
  const Icon = step.icon

  return (
    <li
      ref={ref}
      id={step.id}
      data-in={inView ? 'true' : 'false'}
      className="relative grid grid-cols-[2.5rem_1fr] gap-x-4 pb-16 last:pb-0 md:grid-cols-[8rem_3rem_1fr] md:gap-x-6"
    >
      {/* Heure (grands écrans) */}
      <div className="hidden pt-1 text-right md:block">
        <span className="wm">
          <span className={`font-serif text-4xl leading-none ${inkText}`} style={vars({ '--d': '0.1s' })}>
            {step.time}
          </span>
        </span>
        <span aria-hidden="true" className="mt-3 flex items-center justify-end gap-2 text-[#111]">
          <span className="h-px w-8 bg-current opacity-35" />
          <Diamond />
        </span>
      </div>

      {/* Repère sur le parcours */}
      <div className="relative z-10 flex justify-center">
        <span className="pop" style={vars({ '--d': '0.05s' })}>
          <span
            data-node
            className={`grid h-10 w-10 place-items-center rounded-full border border-[#111] transition-colors duration-500 md:h-12 md:w-12 ${
              reached ? 'bg-[#111] text-white' : 'bg-white text-[#111]'
            } ${current ? 'pulse' : ''}`}
          >
            <Icon size={18} aria-hidden="true" />
          </span>
        </span>
      </div>

      {/* Contenu */}
      <Card delay={`${0.15 + index * 0.02}s`} mark={step.time.slice(0, 2)}>
        <p className={`font-serif text-3xl leading-none md:hidden ${inkText}`}>{step.time}</p>
        <h2 className="mt-3 font-serif text-2xl leading-tight text-[#111] sm:text-3xl md:mt-0">{step.title}</h2>
        <RuleDiamond className="mt-4 w-24 text-[#111]" />
        <p className="mt-4 max-w-xl text-sm leading-7 text-[#111]/70 sm:text-base sm:leading-8">{step.text}</p>

        {step.parallel && (
          <div className="mt-6">
            <p className="font-serif text-sm italic text-[#111]/60">En simultané</p>
            <div className="mt-3 grid items-stretch gap-3 sm:grid-cols-[1fr_auto_1fr] sm:gap-4">
              {step.parallel.map((p, i) => {
                const PIcon = p.icon
                return (
                  <Fragment key={p.title}>
                    {i === 1 && (
                      <span
                        aria-hidden="true"
                        className="grid place-items-center font-serif text-2xl italic text-[#111]/50"
                      >
                        &amp;
                      </span>
                    )}
                    <div className="relative border border-[#111]/25 bg-[#fbfaf6] p-4 transition-colors duration-500 hover:border-[#111]">
                      <span aria-hidden="true" className="absolute -left-px -top-px h-2.5 w-2.5 border-l border-t border-[#111]" />
                      <span aria-hidden="true" className="absolute -bottom-px -right-px h-2.5 w-2.5 border-b border-r border-[#111]" />
                      <PIcon size={20} className="text-[#111]" aria-hidden="true" />
                      <h3 className="mt-3 font-serif text-lg text-[#111]">{p.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-[#111]/65">{p.text}</p>
                    </div>
                  </Fragment>
                )
              })}
            </div>
          </div>
        )}
      </Card>
    </li>
  )
}

/* ================================================================
   PAGE
   ================================================================ */
export default function Programme() {
  const [introRef, introIn] = useInView<HTMLElement>(0.1)
  const [endRef, endIn] = useInView<HTMLElement>(0.2)
  const listRef = useRef<HTMLOListElement>(null)
  const [track, setTrack] = useState({ top: 0, h: 0, fill: 0, reached: -1 })

  // Le parcours se remplit au fil du défilement, le haut-de-forme avance dessus
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const list = listRef.current
      if (!list) return
      const nodes = list.querySelectorAll<HTMLElement>('[data-node]')
      if (nodes.length === 0) return

      const rect = list.getBoundingClientRect()
      const center = (el: HTMLElement) => {
        const r = el.getBoundingClientRect()
        return r.top + r.height / 2 - rect.top
      }
      const top = center(nodes[0])
      const h = Math.max(center(nodes[nodes.length - 1]) - top, 0)
      const y = window.innerHeight * 0.55 - rect.top
      const fill = Math.min(Math.max(y - top, 0), h)

      let reached = -1
      nodes.forEach((n, i) => {
        if (center(n) <= y + 1) reached = i
      })

      setTrack((prev) =>
        Math.abs(prev.top - top) < 1 &&
        Math.abs(prev.h - h) < 1 &&
        Math.abs(prev.fill - fill) < 1 &&
        prev.reached === reached
          ? prev
          : { top, h, fill, reached },
      )
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    const ro = new ResizeObserver(onScroll)
    if (listRef.current) ro.observe(listRef.current)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      ro.disconnect()
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  const lineX = 'left-5 md:left-[11rem]'

  return (
    <main className="relative min-h-screen bg-[#fbfaf6] text-[#111]">
      <style>{css}</style>

      {/* Introduction */}
      <section
        ref={introRef}
        data-in={introIn ? 'true' : 'false'}
        className="relative flex min-h-[78svh] flex-col items-center justify-center overflow-hidden px-5 pb-16 pt-32 text-center"
      >
        {/* Cadre façon faire-part */}
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

        {/* Étincelles */}
        <Sparkle className="absolute left-[12%] top-[26%] h-4 w-4 text-[#111]/70" delay="0s" />
        <Sparkle className="absolute right-[14%] top-[32%] h-5 w-5 text-[#111]/60" delay="1.2s" />
        <Sparkle className="absolute bottom-[26%] left-[18%] hidden h-3 w-3 text-[#111]/60 sm:block" delay="2.1s" />
        <Sparkle className="absolute bottom-[22%] right-[20%] h-4 w-4 text-[#111]/70" delay="0.7s" />

        <div className="rv" style={vars({ '--y': '-24px' })}>
          <Medallion className="h-28 w-28 text-[#111] sm:h-36 sm:w-36" />
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
        <h1 className="mt-3 font-serif text-[clamp(3rem,13vw,9rem)] leading-[0.95] tracking-[0.02em]">
          <Words text="Le programme" className={inkText} start={0.35} step={0.18} />
        </h1>
        <p
          className="rv mt-6 max-w-md text-sm leading-7 text-[#111]/70 sm:text-base sm:leading-8"
          style={vars({ '--d': '0.95s' })}
        >
          Le déroulé de la journée, heure par heure, pour ne rien manquer du plus beau jour de notre histoire.
        </p>

        {/* Aperçu : un clic mène à l'étape */}
        <div className="rv mt-9 flex flex-wrap items-center justify-center gap-2.5" style={vars({ '--d': '1.15s' })}>
          {steps.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goTo(s.id)}
              className="rounded-full border border-[#111]/30 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-[#111] transition-colors hover:border-[#111] hover:bg-[#111] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111]"
            >
              {s.time}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={downloadIcs}
          className="rv group mt-5 flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[#111]/80 underline-offset-8 transition-colors hover:text-[#111] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#111]"
          style={vars({ '--d': '1.3s' })}
        >
          <CalendarPlus size={16} aria-hidden="true" className="transition-transform duration-500 group-hover:-rotate-12" />
          Ajouter à mon agenda
        </button>
      </section>

      <Checker />

      {/* Le parcours : rayures tennis façon Ascot */}
      <section className="relative bg-[linear-gradient(90deg,rgba(17,17,17,0.035)_1px,transparent_1px)] bg-[length:44px_100%] px-5 pb-24 pt-20 sm:px-10 lg:px-16">
        {/* Décorations sur les côtés (grands écrans) */}
        <Laurel className="pointer-events-none absolute left-8 top-24 hidden h-64 w-auto text-[#111]/25 xl:block" />
        <Laurel flip className="pointer-events-none absolute bottom-24 right-8 hidden h-64 w-auto text-[#111]/25 xl:block" />
        <Sparkle className="absolute left-[7%] top-[48%] hidden h-4 w-4 text-[#111]/50 xl:block" delay="0.4s" />
        <Sparkle className="absolute right-[8%] top-[30%] hidden h-5 w-5 text-[#111]/45 xl:block" delay="1.6s" />
        <Sparkle className="absolute bottom-[14%] left-[10%] hidden h-3 w-3 text-[#111]/50 xl:block" delay="2.4s" />

        <ol ref={listRef} className="relative mx-auto max-w-4xl">
          {track.h > 0 && (
            <>
              <span
                aria-hidden="true"
                className={`absolute ${lineX} z-0 w-px -translate-x-1/2 bg-[repeating-linear-gradient(180deg,rgba(17,17,17,0.35)_0,rgba(17,17,17,0.35)_4px,transparent_4px,transparent_10px)]`}
                style={{ top: track.top, height: track.h }}
              />
              <span
                aria-hidden="true"
                className={`absolute ${lineX} z-0 w-[2px] -translate-x-1/2 bg-[#111]`}
                style={{ top: track.top, height: track.fill }}
              />
              <span
                aria-hidden="true"
                className={`pointer-events-none absolute ${lineX} z-20 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#111] text-white ring-2 ring-[#fbfaf6]`}
                style={{ top: track.top + track.fill }}
              >
                <TopHat className="h-5 w-5" />
              </span>
            </>
          )}

          {steps.map((step, i) => (
            <StepRow key={step.id} step={step} index={i} reached={track.reached >= i} current={track.reached === i} />
          ))}
        </ol>
      </section>

      {/* Pied de page : la seule grande touche noire */}
      <footer
        ref={endRef}
        data-in={endIn ? 'true' : 'false'}
        className="relative bg-[#0b0b0b] bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:44px_100%] text-[#f4f0e8]"
      >
        <Checker />
        <div className="flex flex-col items-center px-5 py-20 text-center">
          <div className="rv flex items-center gap-5" style={vars({ '--y': '-20px' })}>
            <Sparkle className="h-3 w-3 text-white/60" delay="0.3s" />
            <Crown className="bob h-14 w-14 text-white sm:h-16 sm:w-16" />
            <Sparkle className="h-3 w-3 text-white/60" delay="1.4s" />
          </div>
          <div className="rv mt-5 w-32 text-white" style={vars({ '--d': '0.1s' })}>
            <RuleDiamond className="w-full" />
          </div>
          <p className={`rv mt-6 font-serif text-[clamp(1.8rem,5vw,3rem)] leading-tight ${whiteText}`} style={vars({ '--d': '0.2s' })}>
            On compte sur votre présence.
          </p>
          <p className="rv mt-4 max-w-md text-sm leading-7 text-white/70 sm:text-base" style={vars({ '--d': '0.4s' })}>
            Confirmez votre venue pour que nous puissions préparer cette journée avec vous.
          </p>
          <div className="rv mt-9 flex flex-col items-center gap-4 sm:flex-row" style={vars({ '--d': '0.6s' })}>
            <a
              href="/#rsvp"
              className={`rounded-full px-9 py-3.5 font-serif text-sm font-semibold uppercase tracking-[0.22em] text-[#111111] transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white ${whiteBg}`}
            >
              Confirmer ma présence
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}