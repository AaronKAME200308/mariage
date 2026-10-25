import { Fragment, useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Camera, Check, Clock, Copy, ExternalLink, MapPin, Navigation, PartyPopper } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/* ================================================================
   CONTENU : renseignez ici vos lieux
   ----------------------------------------------------------------
   • Gardez un seul lieu si la célébration et la réception sont au
     même endroit (supprimez l'autre bloc), ou gardez les deux.
   • image : à placer dans /public/LoicIngride/lieu/
   • mapQuery : l'adresse telle que vous la taperiez dans Google Maps
     (ex. « Nom du lieu, rue, ville »). La carte apparaît dès qu'elle
     est renseignée.
   • embedUrl (facultatif) : l'adresse du lien « Intégrer une carte »
     de Google Maps (Partager > Intégrer une carte, ne gardez que
     l'URL qui se trouve dans src="…").
   ================================================================ */
type Place = {
  id: string
  label: string
  icon: LucideIcon
  name: string
  address: string
  image: string
  imageAlt: string
  description: string[]
  time: string
  timeNote: string
  mapQuery: string
  embedUrl?: string
}

const places: Place[] = [
  {
    id: 'reception',
    label: 'La réception',
    icon: PartyPopper,
    name: 'Vallée verte',
    address: 'WH69+RH Soa, Entrée Saplait, après le petit marché Fougerolle, Yaoundé, Cameroun (sur la route de Soa)',
    image: '/LoicIngride/lieu/reception.jpeg',
    imageAlt: 'L’espace de réception',
    description: [
      'Décrivez ici l’espace de réception : l’ambiance, la décoration, les jardins ou les salons où se déroulera la soirée.',
      'C’est ici que le cocktail puis la soirée prendront place, dans l’élégance du noir et blanc.',
    ],
    time: '18h30',
    timeNote: 'Installation et début de la soirée',
    // Sert aux boutons « Itinéraire » et « Ouvrir dans Google Maps »
    mapQuery: 'Vallée Verte (Salle et Espaces de Mariages), Soa, Yaoundé, Cameroun',
    // Sert à l'affichage de la carte
    embedUrl:
      'https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d127379.79148184888!2d11.5222549!3d3.8916575!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x108bc67e0a36f57f%3A0x30d136b9103dacca!2sVall%C3%A9e%20Verte%20(Salle%20et%20Espaces%20de%20Mariages)!5e0!3m2!1sfr!2scm!4v1792840579575!5m2!1sfr!2scm',
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

const ROMAN = ['I', 'II', 'III', 'IV']
const vars = (o: Record<string, string>) => o as CSSProperties

const css = `
html{scroll-behavior:smooth}

/* Le cadre « s'accroche » : tombe de haut, se balance, se stabilise */
.hang{
  opacity:0;
  transform-origin:50% 0;
  transform:translateY(-46px) rotate(var(--tilt,-3deg));
  transition:
    opacity .7s ease var(--d,0s),
    transform 1.5s cubic-bezier(.34,1.56,.64,1) var(--d,0s);
}
[data-in="true"] .hang,.hang[data-in="true"]{opacity:1;transform:none}

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

/* La carte de texte se dévoile comme un rideau qui se lève */
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

/* Filet qui se dessine */
.rule{transform:scaleX(0);transform-origin:left;transition:transform 1.5s cubic-bezier(.16,1,.3,1) var(--d,0s)}
[data-in="true"] .rule{transform:scaleX(1)}

/* Zoom arrière lent sur la photo */
.zoomin{transform:scale(1.22);transition:transform 2.2s cubic-bezier(.16,1,.3,1) var(--d,0s)}
[data-in="true"] .zoomin{transform:scale(1)}

@keyframes bob{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-9px) rotate(3deg)}}
.bob{animation:bob 7s ease-in-out infinite}

@keyframes twinkle{
  0%,100%{opacity:.2;transform:scale(.75) rotate(0deg)}
  50%{opacity:1;transform:scale(1.1) rotate(25deg)}
}
.twinkle{animation:twinkle 3.8s ease-in-out var(--d,0s) infinite}

@keyframes spinSlow{to{transform:rotate(360deg)}}
.spin-slow{animation:spinSlow 50s linear infinite}

/* Épingle qui rebondit sur la carte */
@keyframes drop{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
.drop{animation:drop 2.4s ease-in-out infinite}

@media (prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  .hang,.rv,.wm>span,.rise,.rule,.zoomin{transition:none!important;opacity:1;filter:none;transform:none;clip-path:none}
  .bob,.twinkle,.spin-slow,.drop{animation:none}
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

function goTo(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
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

const mapsOpen = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
const mapsRoute = (q: string) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`
const mapsEmbed = (q: string) => `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`

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
          <path id="lieu-ring" d="M100,100 m-80,0 a80,80 0 1,1 160,0 a80,80 0 1,1 -160,0" />
        </defs>
        <text fill="currentColor" fontSize="11.5" letterSpacing="3" className="font-serif uppercase">
          <textPath href="#lieu-ring">Loïc &amp; Ingrid · 19 juin 2027 · Royal Ascot ·</textPath>
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

/* ================================================================
   PHOTO ET CADRES
   ================================================================ */
function Photo({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false)
  const ref = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const el = ref.current
    if (el && el.complete && el.naturalWidth === 0) setFailed(true)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#ebe8e1]">
      <div className="zoomin h-full w-full">
        {!failed && (
          <img
            ref={ref}
            src={src}
            alt={alt}
            loading="lazy"
            onError={() => setFailed(true)}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        )}
      </div>
      {failed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[#111]/45">
          <Camera size={22} aria-hidden="true" />
          <span className="px-2 text-center text-[10px] uppercase tracking-[0.2em]">Photo du lieu à ajouter</span>
        </div>
      )}
    </div>
  )
}

const checkerStrip =
  'pointer-events-none absolute inset-x-0 bottom-0 h-3 translate-y-full bg-[conic-gradient(#ffffff_25%,#111111_0_50%,#ffffff_0_75%,#111111_0)] bg-[length:12px_12px] transition-transform duration-500 ease-out group-hover:translate-y-0 sm:h-4 sm:bg-[length:16px_16px]'

/* Reflet qui balaie + ligne d'arrivée en damier */
function Window({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(105deg,transparent_35%,rgba(255,255,255,0.55)_50%,transparent_65%)] transition-transform duration-1000 ease-out group-hover:translate-x-full"
      />
      <span aria-hidden="true" className={checkerStrip} />
    </>
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

function Frame({ arch, ratio, children }: { arch: boolean; ratio: number; children: ReactNode }) {
  if (arch) {
    return (
      <div className="rounded-b-sm rounded-t-[999px] bg-[#111] p-2 sm:p-2.5">
        <div className="rounded-b-[2px] rounded-t-[999px] bg-white p-3 sm:p-4">
          <div className="relative overflow-hidden rounded-t-[999px] ring-1 ring-black/25" style={{ aspectRatio: ratio }}>
            <Window>{children}</Window>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="bg-[#111] p-2 ring-1 ring-inset ring-white/20 sm:p-2.5">
      <div className="relative bg-white p-3 sm:p-4">
        <Corners />
        <div className="relative overflow-hidden ring-1 ring-black/25" style={{ aspectRatio: ratio }}>
          <Window>{children}</Window>
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   CARTE GOOGLE MAPS : en noir et blanc, retrouve ses couleurs au survol
   ================================================================ */
function MapBlock({ place }: { place: Place }) {
  const [ref, inView] = useInView<HTMLDivElement>(0.12)
  const [copied, setCopied] = useState(false)
  const q = place.mapQuery.trim()
  const src = place.embedUrl || (q ? mapsEmbed(q) : '')

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(place.address)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* presse-papiers indisponible : rien à faire */
    }
  }

  const pill =
    'flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111]'

  return (
    <div ref={ref} data-in={inView ? 'true' : 'false'} className="mt-14">
      <div className="hang group mx-auto max-w-5xl" style={vars({ '--tilt': '-2deg' })}>
        <div className="bg-[#111] p-2 ring-1 ring-inset ring-white/20 [filter:drop-shadow(0_14px_16px_rgba(0,0,0,0.18))] sm:p-2.5">
          <div className="relative bg-white p-3 sm:p-4">
            <Corners />
            <div className="relative aspect-[4/3] overflow-hidden bg-[#ebe8e1] ring-1 ring-black/25 sm:aspect-[16/9]">
              {src ? (
                <iframe
                  title={`Carte Google Maps : ${place.name}`}
                  src={src}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full border-0 transition-[filter] duration-700 [@media(hover:hover)]:grayscale [@media(hover:hover)]:group-hover:grayscale-0 group-focus-within:grayscale-0"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-[#111]/60">
                  <MapPin size={30} className="drop" aria-hidden="true" />
                  <p className="font-serif text-lg italic">La carte apparaîtra ici</p>
                  <p className="max-w-sm text-xs leading-6">
                    Renseignez <code className="rounded bg-black/5 px-1">mapQuery</code> (l’adresse du lieu) dans la
                    liste <code className="rounded bg-black/5 px-1">places</code> en haut du fichier.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="rv mx-auto mt-8 flex max-w-5xl flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center" style={vars({ '--d': '0.5s' })}>
        {q ? (
          <>
            <a
              href={mapsRoute(q)}
              target="_blank"
              rel="noopener noreferrer"
              className={`${pill} bg-[#111] text-white hover:bg-[#2b2b2b]`}
            >
              <Navigation size={15} aria-hidden="true" /> Itinéraire
            </a>
            <a
              href={mapsOpen(q)}
              target="_blank"
              rel="noopener noreferrer"
              className={`${pill} border border-[#111]/40 text-[#111] hover:border-[#111]`}
            >
              <ExternalLink size={15} aria-hidden="true" /> Ouvrir dans Google Maps
            </a>
          </>
        ) : null}
        <button
          type="button"
          onClick={copy}
          className={`${pill} border border-[#111]/25 text-[#111]/80 hover:border-[#111] hover:text-[#111]`}
        >
          {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
          <span aria-live="polite">{copied ? 'Adresse copiée' : 'Copier l’adresse'}</span>
        </button>
      </div>
    </div>
  )
}

/* ================================================================
   UN LIEU : image + description + carte
   ================================================================ */
function PlaceSection({ place, index }: { place: Place; index: number }) {
  const [ref, inView] = useInView<HTMLElement>(0.1)
  const flip = index % 2 === 1
  const Icon = place.icon
  const corner = 'pointer-events-none absolute h-1.5 w-1.5 rotate-45 bg-[#111]'

  return (
    <section
      ref={ref}
      id={place.id}
      data-in={inView ? 'true' : 'false'}
      className="relative px-5 py-20 sm:px-10 lg:px-16"
    >
      <div className="mx-auto max-w-6xl">
        {/* Titre de la section */}
        <div className="rv mb-12 flex items-end gap-5">
          <span
            aria-hidden="true"
            className="font-serif text-[clamp(4rem,11vw,6.5rem)] leading-[0.85] text-transparent"
            style={{ WebkitTextStroke: '1px rgba(17,17,17,0.45)' }}
          >
            {ROMAN[index]}
          </span>
          <div className="mb-1 flex-1">
            <p className="font-serif text-sm italic text-[#111]/60">{place.label}</p>
            <RuleDiamond className="mt-2 max-w-xs text-[#111]" />
          </div>
        </div>

        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          {/* Image du lieu */}
          <div
            className={`hang group relative mx-auto w-full max-w-md ${flip ? 'lg:order-2' : ''}`}
            style={vars({ '--tilt': flip ? '3deg' : '-3deg', '--d': '0.1s' })}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-0 z-0 h-11 w-11 -translate-x-1/2 text-[#111] opacity-0 transition-all duration-500 ease-[cubic-bezier(.34,1.56,.64,1)] group-hover:-translate-y-[88%] group-hover:-rotate-12 group-hover:opacity-100"
            >
              <TopHat className="h-full w-full" />
            </span>
            <div className="relative z-10 transition-[filter,transform] duration-500 [filter:drop-shadow(0_12px_14px_rgba(0,0,0,0.18))] group-hover:-translate-y-1.5 group-hover:[filter:drop-shadow(0_24px_24px_rgba(0,0,0,0.28))]">
              <Frame arch={index % 2 === 0} ratio={index % 2 === 0 ? 3 / 4 : 4 / 5}>
                <Photo src={place.image} alt={place.imageAlt} />
              </Frame>
            </div>
          </div>

          {/* Description */}
          <div className={`rise group relative ${flip ? 'lg:order-1' : ''}`} style={vars({ '--d': '0.25s' })}>
            <div className="relative overflow-hidden bg-white p-6 ring-1 ring-[#111] transition-[transform,box-shadow] duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_22px_36px_-22px_rgba(0,0,0,0.5)] sm:p-9">
              <span aria-hidden="true" className="pointer-events-none absolute inset-1.5 border border-[#111]/20" />
              <span aria-hidden="true" className={`${corner} left-[3px] top-[3px]`} />
              <span aria-hidden="true" className={`${corner} right-[3px] top-[3px]`} />
              <span aria-hidden="true" className={`${corner} bottom-[3px] left-[3px]`} />
              <span aria-hidden="true" className={`${corner} bottom-[3px] right-[3px]`} />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-2 -top-6 select-none font-serif text-[8rem] leading-none text-transparent sm:text-[10rem]"
                style={{ WebkitTextStroke: '1px rgba(17,17,17,0.10)' }}
              >
                {ROMAN[index]}
              </span>

              <div className="relative">
                <span className="grid h-12 w-12 place-items-center rounded-full border border-[#111] text-[#111]">
                  <Icon size={20} aria-hidden="true" />
                </span>

                <h2 className="mt-5 font-serif text-[clamp(1.8rem,4vw,2.8rem)] leading-[1.1]">
                  <Words text={place.name} className={inkText} start={0.2} />
                </h2>

                <p className="mt-4 flex items-start gap-2 text-sm leading-6 text-[#111]/75 sm:text-base">
                  <MapPin size={18} className="mt-0.5 shrink-0 text-[#111]" aria-hidden="true" />
                  {place.address}
                </p>

                <span aria-hidden="true" className="rule mt-6 block h-px w-32 bg-[#111]/60" style={vars({ '--d': '0.6s' })} />

                <div className="mt-6 max-w-xl space-y-4 text-sm leading-7 text-[#111]/70 sm:text-base sm:leading-8">
                  {place.description.map((p, i) => (
                    <p key={i} className="rv" style={vars({ '--d': `${0.7 + i * 0.2}s`, '--y': '20px' })}>
                      {p}
                    </p>
                  ))}
                </div>

                <div
                  className="rv mt-7 inline-flex items-center gap-3 border border-[#111]/25 px-4 py-2.5"
                  style={vars({ '--d': '1.1s', '--y': '16px' })}
                >
                  <Clock size={16} className="text-[#111]" aria-hidden="true" />
                  <span className={`font-serif text-xl leading-none ${inkText}`}>{place.time}</span>
                  <span className="text-xs text-[#111]/65">{place.timeNote}</span>
                </div>
              </div>

              <span aria-hidden="true" className={checkerStrip} />
            </div>
          </div>
        </div>

        <MapBlock place={place} />
      </div>
    </section>
  )
}

/* ================================================================
   PAGE
   ================================================================ */
export default function Lieu() {
  const [introRef, introIn] = useInView<HTMLElement>(0.1)
  const [endRef, endIn] = useInView<HTMLElement>(0.2)
  const many = places.length > 1

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

        <Sparkle className="absolute left-[12%] top-[26%] h-4 w-4 text-[#111]/70" delay="0s" />
        <Sparkle className="absolute right-[14%] top-[32%] h-5 w-5 text-[#111]/60" delay="1.2s" />
        <Sparkle className="absolute bottom-[26%] left-[18%] hidden h-3 w-3 text-[#111]/60 sm:block" delay="2.1s" />
        <Sparkle className="absolute bottom-[22%] right-[20%] h-4 w-4 text-[#111]/70" delay="0.7s" />

        <div className="rv" style={vars({ '--y': '-24px' })}>
          <Medallion className="h-28 w-28 text-[#111] sm:h-36 sm:w-36">
            <MapPin className="drop h-full w-full" strokeWidth={1.6} aria-hidden="true" />
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
        <h1 className="mt-3 font-serif text-[clamp(3rem,13vw,9rem)] leading-[0.95] tracking-[0.02em]">
          <Words text={many ? 'Les lieux' : 'Le lieu'} className={inkText} start={0.35} step={0.18} />
        </h1>
        <p
          className="rv mt-6 max-w-md text-sm leading-7 text-[#111]/70 sm:text-base sm:leading-8"
          style={vars({ '--d': '0.95s' })}
        >
          Où nous retrouver pour le plus beau jour de notre histoire : les adresses, les photos et les itinéraires.
        </p>

        {many && (
          <div className="rv mt-9 flex flex-wrap items-center justify-center gap-2.5" style={vars({ '--d': '1.15s' })}>
            {places.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => goTo(p.id)}
                className="rounded-full border border-[#111]/30 px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] text-[#111] transition-colors hover:border-[#111] hover:bg-[#111] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111]"
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </section>

      <Checker />

      {/* Les lieux : rayures façon Ascot */}
      <div className="relative bg-[linear-gradient(90deg,rgba(17,17,17,0.035)_1px,transparent_1px)] bg-[length:44px_100%] pb-10 pt-6">
        {places.map((place, i) => (
          <PlaceSection key={place.id} place={place} index={i} />
        ))}
      </div>

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
          <p
            className={`rv mt-6 font-serif text-[clamp(1.8rem,5vw,3rem)] leading-tight ${whiteText}`}
            style={vars({ '--d': '0.2s' })}
          >
            On vous y attend.
          </p>
          <p className="rv mt-4 max-w-md text-sm leading-7 text-white/70 sm:text-base" style={vars({ '--d': '0.4s' })}>
            Confirmez votre venue pour que nous puissions préparer cette journée avec vous.
          </p>
          <div className="rv mt-9" style={vars({ '--d': '0.6s' })}>
            <a
              href="/#rsvp"
              className={`inline-block rounded-full px-9 py-3.5 font-serif text-sm font-semibold uppercase tracking-[0.22em] text-[#111111] transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white ${whiteBg}`}
            >
              Confirmer ma présence
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}