'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { useSite } from '../../_kit'

/* ================================================================
   CONTENU : adaptez les liens à votre site
   (ancres de la page d'accueil par défaut ; remplacez par /histoire,
   /galerie… si vous utilisez des pages séparées)
   ================================================================ */
const links = [
  { href: '#histoire', label: 'Notre histoire' },
  { href: '#galerie', label: 'Galerie' },
  { href: '#programme', label: 'Programme' },
  { href: '#jour-j', label: 'Le jour J' },
  { href: '#cadeaux', label: 'Cadeaux' },
  { href: '#livredor', label: 'Livre d’or' },
  { href: '#rsvp', label: 'RSVP' },
]

const WEDDING = new Date('2027-06-19T15:00:00+02:00').getTime()
const DAY = 1000 * 60 * 60 * 24

/* ================================================================
   STYLES (préfixe pd- pour ne rien mélanger avec le reste du site)
   ================================================================ */
const whiteText =
  'bg-[linear-gradient(180deg,#ffffff_0%,#f2f2f2_40%,#b5b5b5_100%)] bg-clip-text text-transparent'
const whiteBg = 'bg-[linear-gradient(135deg,#ffffff_0%,#e6e6e6_45%,#a0a0a0_100%)]'

const vars = (o: Record<string, string>) => o as CSSProperties
const heading: CSSProperties = { fontFamily: 'var(--w-heading, ui-serif, Georgia, serif)' }

const css = `
/* Apparition douce */
.pd-rv{
  opacity:0;
  filter:blur(8px);
  transform:translateY(var(--y,26px));
  transition:
    opacity 1s ease var(--d,0s),
    filter 1s ease var(--d,0s),
    transform 1.3s cubic-bezier(.16,1,.3,1) var(--d,0s);
}
[data-pd="true"] .pd-rv{opacity:1;filter:blur(0);transform:none}

/* Mots révélés par un masque */
.pd-wm{display:inline-block;overflow:hidden;vertical-align:bottom;padding-bottom:.16em;margin-bottom:-.16em}
.pd-wm>span{
  display:inline-block;
  transform:translateY(112%) rotate(4deg);
  transition:transform 1.2s cubic-bezier(.16,1,.3,1) var(--d,0s);
}
[data-pd="true"] .pd-wm>span{transform:none}

/* Filet qui se dessine depuis le centre */
.pd-rule{transform:scaleX(0);transition:transform 1.6s cubic-bezier(.16,1,.3,1) var(--d,0s)}
[data-pd="true"] .pd-rule{transform:scaleX(1)}

/* Bandeau défilant */
@keyframes pd-marquee{to{transform:translateX(-50%)}}
.pd-marquee{animation:pd-marquee 45s linear infinite}
.pd-marquee-wrap:hover .pd-marquee{animation-play-state:paused}

@keyframes pd-bob{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-9px) rotate(3deg)}}
.pd-bob{animation:pd-bob 7s ease-in-out infinite}

@keyframes pd-twinkle{
  0%,100%{opacity:.2;transform:scale(.75) rotate(0deg)}
  50%{opacity:1;transform:scale(1.1) rotate(25deg)}
}
.pd-twinkle{animation:pd-twinkle 3.8s ease-in-out var(--d,0s) infinite}

@keyframes pd-spin{to{transform:rotate(360deg)}}
.pd-spin{animation:pd-spin 50s linear infinite}

@keyframes pd-beat{0%,100%{transform:scale(1)}15%{transform:scale(1.25)}30%{transform:scale(1)}45%{transform:scale(1.15)}60%{transform:scale(1)}}
.pd-beat{animation:pd-beat 2.8s ease-in-out infinite}

@media (prefers-reduced-motion:reduce){
  .pd-rv,.pd-wm>span,.pd-rule{transition:none!important;opacity:1;filter:none;transform:none}
  .pd-marquee,.pd-bob,.pd-twinkle,.pd-spin,.pd-beat{animation:none}
}
`

/* ================================================================
   OUTILS
   ================================================================ */
function useInView<T extends HTMLElement>(threshold = 0.1) {
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
      { threshold },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])

  return [ref, inView] as const
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

function RuleDiamond({ className = '', draw = false }: { className?: string; draw?: boolean }) {
  return (
    <span aria-hidden="true" className={`flex items-center gap-2 ${className}`}>
      <span className={`h-px flex-1 bg-current opacity-40 ${draw ? 'pd-rule origin-right' : ''}`} />
      <Diamond />
      <span className={`h-px flex-1 bg-current opacity-40 ${draw ? 'pd-rule origin-left' : ''}`} />
    </span>
  )
}

function Sparkle({ className = '', delay = '0s' }: { className?: string; delay?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`pd-twinkle ${className}`}
      style={vars({ '--d': delay })}
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M12,0 C13,8 16,11 24,12 C16,13 13,16 12,24 C11,16 8,13 0,12 C8,11 11,8 12,0 Z" />
    </svg>
  )
}

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

function Checker({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`h-3 w-full bg-[conic-gradient(#ffffff_25%,#111111_0_50%,#ffffff_0_75%,#111111_0)] bg-[length:12px_12px] sm:h-4 sm:bg-[length:16px_16px] ${className}`}
    />
  )
}

/* ================================================================
   COMPTE À REBOURS EN JOURS
   ================================================================ */
function DaysLeft() {
  const [days, setDays] = useState<number | null>(null)

  useEffect(() => {
    const update = () => setDays(Math.ceil((WEDDING - Date.now()) / DAY))
    update()
    const id = window.setInterval(update, 60 * 1000)
    return () => window.clearInterval(id)
  }, [])

  if (days === null) return <div className="h-[5.5rem]" aria-hidden="true" />

  if (days < -1) {
    return (
      <p className="font-serif text-lg italic text-white/80 sm:text-xl" style={heading}>
        Merci d’avoir partagé ce jour avec nous.
      </p>
    )
  }

  if (days <= 0) {
    return (
      <p className={`font-serif text-3xl italic sm:text-4xl ${whiteText}`} style={heading}>
        C’est aujourd’hui !
      </p>
    )
  }

  return (
    <div className="inline-flex items-center gap-4 border border-white/40 px-6 py-3.5 sm:gap-5 sm:px-8">
      <Diamond className="text-white/70" />
      <span className="text-[10px] uppercase tracking-[0.3em] text-white/60">Plus que</span>
      <span className={`font-serif text-4xl leading-none tabular-nums sm:text-5xl ${whiteText}`} style={heading}>
        {days}
      </span>
      <span className="text-[10px] uppercase tracking-[0.3em] text-white/60">{days > 1 ? 'jours' : 'jour'}</span>
      <Diamond className="text-white/70" />
    </div>
  )
}

/* ================================================================
   PIED DE PAGE
   ================================================================ */
export default function Pied() {
  const { names } = useSite()
  const [ref, inView] = useInView<HTMLElement>(0.1)

  const label = String(names)
  const ring = `${label} · 19 juin 2027 · Royal Ascot ·`
  const ringSize = Math.min(13, Math.max(8, (470 / ring.length - 2.6) / 0.72))
  const year = new Date().getFullYear()

  return (
    <footer
      ref={ref}
      data-pd={inView ? 'true' : 'false'}
      className="relative isolate overflow-hidden bg-[#0b0b0b] text-[#f4f0e8]"
    >
      <style>{css}</style>

      {/* Fond : rayures et halo */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:44px_100%]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,0.14),transparent_60%)]"
      />

      <Checker />

      {/* Bandeau défilant, avec le bouton « haut de page » à cheval dessus */}
      <div className="relative">
        <div aria-hidden="true" className="pd-marquee-wrap overflow-hidden bg-white py-3 text-[#111]">
          <div className="pd-marquee flex w-max">
            {[0, 1].map((g) => (
              <div key={g} className="flex shrink-0 items-center">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Fragment key={i}>
                    <span className="px-6 font-serif text-sm uppercase tracking-[0.35em]" style={heading}>
                      {label}
                    </span>
                    <Diamond className="text-[#111]" />
                    <span className="px-6 font-serif text-sm uppercase tracking-[0.35em]" style={heading}>
                      19 · 06 · 2027
                    </span>
                    <Diamond className="text-[#111]" />
                    <span className="px-6 font-serif text-sm italic uppercase tracking-[0.35em] text-[#111]/60" style={heading}>
                      Royal Ascot
                    </span>
                    <Diamond className="text-[#111]" />
                  </Fragment>
                ))}
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          aria-label="Revenir en haut de la page"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="group absolute left-1/2 top-full z-20 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-[#111] ring-4 ring-[#0b0b0b] transition-transform duration-500 hover:-translate-y-[60%] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          <TopHat className="h-8 w-8 transition-transform duration-500 ease-[cubic-bezier(.34,1.56,.64,1)] group-hover:-translate-y-1 group-hover:-rotate-12" />
        </button>
      </div>

      {/* Contenu */}
      <div className="relative px-6 pb-6 pt-24 sm:pt-28">
        {/* Cadre façon faire-part */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-3 bottom-4 top-12 border border-white/25 sm:inset-x-6"
        >
          <span className="absolute inset-1.5 border border-white/10" />
          <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 rotate-45 bg-white" />
          <span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 rotate-45 bg-white" />
          <span className="absolute -bottom-[3px] -left-[3px] h-1.5 w-1.5 rotate-45 bg-white" />
          <span className="absolute -bottom-[3px] -right-[3px] h-1.5 w-1.5 rotate-45 bg-white" />
        </div>

        {/* Lauriers et étoiles sur les côtés */}
        <Laurel className="pointer-events-none absolute left-10 top-24 hidden h-56 w-auto text-white/20 lg:block xl:left-20" />
        <Laurel flip className="pointer-events-none absolute right-10 top-24 hidden h-56 w-auto text-white/20 lg:block xl:right-20" />
        <Sparkle className="absolute left-[12%] top-[30%] h-4 w-4 text-white/60" delay="0s" />
        <Sparkle className="absolute right-[14%] top-[36%] h-5 w-5 text-white/50" delay="1.2s" />
        <Sparkle className="absolute bottom-[34%] left-[20%] hidden h-3 w-3 text-white/50 sm:block" delay="2.1s" />
        <Sparkle className="absolute bottom-[40%] right-[22%] h-4 w-4 text-white/60" delay="0.7s" />

        <div className="relative mx-auto flex max-w-4xl flex-col items-center text-center">
          {/* Médaillon : texte circulaire autour d'une couronne */}
          <div className="pd-rv relative h-28 w-28 text-white sm:h-36 sm:w-36" style={vars({ '--y': '-24px' })}>
            <svg viewBox="0 0 200 200" className="pd-spin absolute inset-0 h-full w-full" aria-hidden="true">
              <defs>
                <path id="pd-ring" d="M100,100 m-80,0 a80,80 0 1,1 160,0 a80,80 0 1,1 -160,0" />
              </defs>
              <text
                fill="currentColor"
                fontSize={ringSize}
                letterSpacing="2.6"
                className="uppercase"
                style={heading}
              >
                <textPath href="#pd-ring">{ring}</textPath>
              </text>
            </svg>
            <span aria-hidden="true" className="absolute inset-[22%] rounded-full border border-white/25" />
            <Crown className="pd-bob absolute inset-0 m-auto h-[40%] w-[40%]" />
          </div>

          {/* Les prénoms */}
          <p className="pd-rv mt-8 text-[10px] uppercase tracking-[0.45em] text-white/55" style={vars({ '--d': '0.15s' })}>
            Avec tout notre amour
          </p>
          <h2
            className="mt-3 text-[clamp(2.8rem,10vw,7rem)] leading-[1] tracking-[0.02em]"
            style={heading}
          >
            {label.split(' ').map((word, i) => (
              <Fragment key={`${word}-${i}`}>
                <span className="pd-wm">
                  <span
                    className={word === '&' ? 'italic text-white/55' : whiteText}
                    style={vars({ '--d': `${0.25 + i * 0.16}s` })}
                  >
                    {word}
                  </span>
                </span>{' '}
              </Fragment>
            ))}
          </h2>

          <div className="mt-6 w-48 text-white sm:w-64">
            <RuleDiamond draw className="w-full" />
          </div>

          <p
            className="pd-rv mt-6 text-xs uppercase tracking-[0.4em] text-white/80 sm:text-sm"
            style={vars({ '--d': '0.7s' })}
          >
            Samedi 19 juin 2027
          </p>
          <p
            className="pd-rv mt-4 max-w-md text-sm leading-7 text-white/60 sm:text-base sm:leading-8"
            style={vars({ '--d': '0.85s' })}
          >
            Merci de faire partie de notre histoire et de partager avec nous le plus beau jour de notre vie.
          </p>

          <div className="pd-rv mt-9" style={vars({ '--d': '1s' })}>
            <DaysLeft />
          </div>

          {/* Navigation */}
          <nav
            aria-label="Pied de page"
            className="pd-rv mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-4"
            style={vars({ '--d': '1.15s' })}
          >
            {links.map((l, i) => (
              <Fragment key={l.href}>
                {i > 0 && <Diamond className="hidden text-white/30 sm:inline-block" />}
                <a
                  href={l.href}
                  className="relative text-[11px] uppercase tracking-[0.25em] text-white/70 transition-colors duration-300 after:absolute after:inset-x-0 after:-bottom-1.5 after:h-px after:origin-left after:scale-x-0 after:bg-white after:transition-transform after:duration-500 hover:text-white hover:after:scale-x-100 focus-visible:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-white"
                >
                  {l.label}
                </a>
              </Fragment>
            ))}
          </nav>

          {/* Bouton principal */}
          <div className="pd-rv mt-10" style={vars({ '--d': '1.3s' })}>
            <a
              href="#rsvp"
              className={`inline-block rounded-full px-9 py-3.5 text-sm font-semibold uppercase tracking-[0.22em] text-[#111111] shadow-[0_0_40px_-12px_#ffffff] transition-[filter,transform] duration-300 hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white ${whiteBg}`}
              style={heading}
            >
              Confirmer ma présence
            </a>
          </div>

          {/* Ligne du bas */}
          <div className="mt-14 w-full text-white">
            <RuleDiamond className="mx-auto w-full max-w-md" />
          </div>
          <div className="mt-6 flex w-full flex-col items-center justify-between gap-3 pb-6 text-[11px] uppercase tracking-[0.22em] text-white/45 sm:flex-row">
            <span>
              © {year} {label}
            </span>
            <span className="flex items-center gap-2">
              Fait avec
              <svg viewBox="0 0 24 24" className="pd-beat h-3.5 w-3.5 text-white" fill="currentColor" aria-label="amour" role="img">
                <path d="M12 21s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z" />
              </svg>
            </span>
            <span>Royal Ascot · Noir &amp; blanc</span>
          </div>
        </div>
      </div>

      <Checker />
    </footer>
  )
}