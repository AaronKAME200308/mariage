import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Camera, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { imageUrl, useSite } from '../../_kit'

/* ================================================================
   DONNÉES : Supabase
   ----------------------------------------------------------------
   Les photos et leurs légendes viennent de la base (espace admin/couple →
   « Galerie », fichiers dans le bucket d'images). Rien à placer dans le code.
   Seuls les « porte-bonheur » restent sur l'appareil du visiteur (confort).
   ================================================================ */
type Item = { id: string; index: number; src: string; caption: string }

/* ================================================================
   STYLES RÉUTILISABLES
   ================================================================ */
const inkText =
  'bg-[linear-gradient(180deg,#111111_0%,#2b2b2b_55%,#6b6b6b_100%)] bg-clip-text text-transparent'
const whiteBg = 'bg-[linear-gradient(135deg,#ffffff_0%,#e6e6e6_45%,#a0a0a0_100%)]'

const vars = (o: Record<string, string>) => o as CSSProperties
const pad = (n: number) => String(n).padStart(2, '0')

type Variant = 'classic' | 'arch' | 'oval' | 'chamfer'
const pattern: { variant: Variant; ratio: number }[] = [
  { variant: 'classic', ratio: 4 / 5 },
  { variant: 'arch', ratio: 3 / 4 },
  { variant: 'oval', ratio: 4 / 5 },
  { variant: 'classic', ratio: 1 },
  { variant: 'chamfer', ratio: 1 },
  { variant: 'classic', ratio: 5 / 4 },
  { variant: 'arch', ratio: 3 / 4 },
  { variant: 'oval', ratio: 5 / 4 },
]

const OCTAGON = 'polygon(10% 0,90% 0,100% 10%,100% 90%,90% 100%,10% 100%,0 90%,0 10%)'

/* ================================================================
   ANIMATIONS
   ================================================================ */
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
.hang[data-in="true"]{opacity:1;transform:none}

/* Apparition douce (textes d'introduction) */
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

/* Zoom arrière lent sur les photos à l'apparition */
.zoomin{transform:scale(1.22);transition:transform 2.2s cubic-bezier(.16,1,.3,1) var(--d,0s)}
[data-in="true"] .zoomin{transform:scale(1)}

/* Flottaison des ornements */
@keyframes bob{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-9px) rotate(3deg)}}
.bob{animation:bob 7s ease-in-out infinite}

/* Fer à cheval porte-bonheur : petit « clinc » */
@keyframes clink{
  0%{transform:rotate(0) scale(1)}
  30%{transform:rotate(-24deg) scale(1.3)}
  60%{transform:rotate(14deg) scale(1.1)}
  100%{transform:rotate(0) scale(1)}
}
.clink{animation:clink .7s cubic-bezier(.34,1.56,.64,1)}

/* Visionneuse */
@keyframes lbFade{from{opacity:0}to{opacity:1}}
.lb-fade{animation:lbFade .4s ease both}
@keyframes lbNext{from{opacity:0;transform:translateX(48px) rotate(2deg) scale(.96)}to{opacity:1;transform:none}}
@keyframes lbPrev{from{opacity:0;transform:translateX(-48px) rotate(-2deg) scale(.96)}to{opacity:1;transform:none}}
.lb-next{animation:lbNext .7s cubic-bezier(.16,1,.3,1) both}
.lb-prev{animation:lbPrev .7s cubic-bezier(.16,1,.3,1) both}

@media (prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  .hang,.rv,.wm>span,.zoomin{transition:none!important;opacity:1;filter:none;transform:none}
  .bob,.clink,.lb-fade,.lb-next,.lb-prev{animation:none}
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

function HorseshoeIcon({ filled, className = '' }: { filled: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 72 72" className={className} aria-hidden="true">
      <path
        d="M14,62 L14,34 A22,22 0 0 1 58,34 L58,62 L46,62 L46,34 A10,10 0 0 0 26,34 L26,62 Z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {filled && (
        <path
          d="M20,58 L20,34 M52,58 L52,34"
          stroke="#ffffff"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeDasharray="0.1 6"
        />
      )}
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
   PHOTO + CADRES
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
          <span className="px-2 text-center text-[10px] uppercase tracking-[0.2em]">Photo à ajouter</span>
        </div>
      )}
    </div>
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

/* Le contenu de la fenêtre photo : photo, reflet qui balaie, ligne d'arrivée en damier */
function Window({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(105deg,transparent_35%,rgba(255,255,255,0.55)_50%,transparent_65%)] transition-transform duration-1000 ease-out group-hover:translate-x-full"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-3 translate-y-full bg-[conic-gradient(#ffffff_25%,#111111_0_50%,#ffffff_0_75%,#111111_0)] bg-[length:12px_12px] transition-transform duration-500 ease-out group-hover:translate-y-0 sm:h-4 sm:bg-[length:16px_16px]"
      />
    </>
  )
}

function Frame({ variant, ratio, children }: { variant: Variant; ratio: number; children: ReactNode }) {
  if (variant === 'arch') {
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

  if (variant === 'oval') {
    return (
      <div className="rounded-[50%] bg-[#111] p-2 sm:p-2.5">
        <div className="rounded-[50%] bg-white p-3 sm:p-4">
          <div className="relative overflow-hidden rounded-[50%] ring-1 ring-black/25" style={{ aspectRatio: ratio }}>
            <Window>{children}</Window>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'chamfer') {
    return (
      <div className="bg-[#111] p-2 sm:p-2.5" style={{ clipPath: OCTAGON }}>
        <div className="bg-white p-3 sm:p-4" style={{ clipPath: OCTAGON }}>
          <div className="relative overflow-hidden" style={{ aspectRatio: ratio, clipPath: OCTAGON }}>
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
   UN CADRE DU MUR
   ================================================================ */
function GalleryItem({
  item,
  order,
  fav,
  onFav,
  onOpen,
}: {
  item: Item
  order: number
  fav: boolean
  onFav: (id: string) => void
  onOpen: (id: string) => void
}) {
  const [ref, inView] = useInView<HTMLElement>(0.1)
  const cfg = pattern[item.index % pattern.length]

  return (
    <figure
      ref={ref}
      data-in={inView ? 'true' : 'false'}
      className="hang mb-14 break-inside-avoid"
      style={vars({ '--tilt': order % 2 ? '3deg' : '-3deg', '--d': `${(order % 3) * 0.14}s` })}
    >
      <div className="group relative">
        {/* Le haut-de-forme qui se soulève au survol */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 z-0 h-11 w-11 -translate-x-1/2 text-[#111] opacity-0 transition-all duration-500 ease-[cubic-bezier(.34,1.56,.64,1)] group-focus-within:-translate-y-[88%] group-focus-within:-rotate-12 group-focus-within:opacity-100 group-hover:-translate-y-[88%] group-hover:-rotate-12 group-hover:opacity-100"
        >
          <TopHat className="h-full w-full" />
        </span>

        <button
          type="button"
          onClick={() => onOpen(item.id)}
          aria-label={`Agrandir : ${item.caption}`}
          className="relative z-10 block w-full cursor-zoom-in text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#111]"
        >
          <div className="transition-[filter,transform] duration-500 [filter:drop-shadow(0_10px_12px_rgba(0,0,0,0.18))] group-hover:-translate-y-1.5 group-hover:[filter:drop-shadow(0_22px_22px_rgba(0,0,0,0.28))]">
            <Frame variant={cfg.variant} ratio={cfg.ratio}>
              <Photo src={item.src} alt={`Loïc et Ingrid : ${item.caption}`} />
            </Frame>
          </div>
        </button>
      </div>

      {/* Cartel façon musée */}
      <figcaption className="mt-5 flex items-start justify-between gap-4 border-t border-[#111]/15 pt-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#111]/50">N° {pad(item.index + 1)}</p>
          <p className="mt-1 font-serif text-base italic text-[#111]">{item.caption}</p>
        </div>
        <button
          type="button"
          onClick={() => onFav(item.id)}
          aria-pressed={fav}
          aria-label={fav ? 'Retirer des porte-bonheur' : 'Ajouter aux porte-bonheur'}
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111] ${
            fav ? 'border-[#111] bg-white text-[#111]' : 'border-[#111]/25 text-[#111]/60 hover:border-[#111] hover:text-[#111]'
          }`}
        >
          <span key={fav ? 'on' : 'off'} className={fav ? 'clink block' : 'block'}>
            <HorseshoeIcon filled={fav} className="h-5 w-5" />
          </span>
        </button>
      </figcaption>
    </figure>
  )
}

/* ================================================================
   VISIONNEUSE PLEIN ÉCRAN
   ================================================================ */
function Lightbox({
  items,
  start,
  favs,
  onFav,
  onClose,
}: {
  items: Item[]
  start: number
  favs: Set<string>
  onFav: (id: string) => void
  onClose: () => void
}) {
  const [i, setI] = useState(start)
  const [dir, setDir] = useState<'next' | 'prev'>('next')
  const [failed, setFailed] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)
  const touchX = useRef<number | null>(null)
  const n = items.length

  const go = useCallback(
    (d: 1 | -1) => {
      setDir(d === 1 ? 'next' : 'prev')
      setFailed(false)
      setI((v) => (v + d + n) % n)
    },
    [n],
  )

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)

    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previous?.focus?.()
    }
  }, [go, onClose])

  const cur = items[i]
  const isFav = favs.has(cur.id)

  const navBtn =
    'absolute top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/40 bg-[#0b0b0b]/60 text-white transition-colors hover:bg-white hover:text-[#111] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Visionneuse de la galerie"
      className="lb-fade fixed inset-0 z-[100] flex flex-col bg-[#0b0b0b]/95 text-[#f4f0e8] backdrop-blur-sm"
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX
      }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return
        const dx = e.changedTouches[0].clientX - touchX.current
        touchX.current = null
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
      }}
    >
      <Checker />

      <div className="flex items-center justify-between px-5 py-4 sm:px-8">
        <p className="font-serif text-sm tracking-[0.25em] text-white/80">
          {pad(i + 1)} / {pad(n)}
        </p>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Fermer la visionneuse"
          className="grid h-10 w-10 place-items-center rounded-full border border-white/40 text-white transition-colors hover:bg-white hover:text-[#111] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-24"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        {n > 1 && (
          <button type="button" onClick={() => go(-1)} aria-label="Photo précédente" className={`${navBtn} left-3 sm:left-8`}>
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
        )}

        <div key={cur.id} className={`${dir === 'next' ? 'lb-next' : 'lb-prev'} ${whiteBg} p-[2px]`}>
          <div className="bg-white p-2 sm:p-4">
            {failed ? (
              <div className="flex h-[40vh] w-[min(70vw,22rem)] flex-col items-center justify-center gap-2 bg-[#ebe8e1] text-[#111]/45">
                <Camera size={24} aria-hidden="true" />
                <span className="text-[10px] uppercase tracking-[0.2em]">Photo à ajouter</span>
              </div>
            ) : (
              <img
                src={cur.src}
                alt={`Loïc et Ingrid : ${cur.caption}`}
                onError={() => setFailed(true)}
                className="block max-h-[60vh] max-w-[80vw] object-contain sm:max-h-[66vh]"
              />
            )}
          </div>
        </div>

        {n > 1 && (
          <button type="button" onClick={() => go(1)} aria-label="Photo suivante" className={`${navBtn} right-3 sm:right-8`}>
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="flex flex-col items-center gap-3 px-5 pb-6 pt-4 text-center">
        <p className="font-serif text-lg italic text-white/90">{cur.caption}</p>
        <button
          type="button"
          onClick={() => onFav(cur.id)}
          aria-pressed={isFav}
          className="flex items-center gap-2 rounded-full border border-white/40 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-white hover:text-[#111] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <span key={isFav ? 'on' : 'off'} className={isFav ? 'clink block' : 'block'}>
            <HorseshoeIcon filled={isFav} className="h-4 w-4" />
          </span>
          {isFav ? 'Porte-bonheur' : 'Porter chance'}
        </button>
      </div>

      <Checker />
    </div>
  )
}

/* ================================================================
   PAGE
   ================================================================ */
export default function Galerie() {
  const [filter, setFilter] = useState<'all' | 'favs'>('all')
  const { data, settings } = useSite()
  const [favs, setFavs] = useState<Set<string>>(new Set())
  const [lb, setLb] = useState<{ items: Item[]; index: number } | null>(null)
  const [introRef, introIn] = useInView<HTMLElement>(0.1)

  const photos: Item[] = useMemo(
    () =>
      data.gallery
        .map((g, index) => ({ id: g.id, index, src: imageUrl(g.storage_path) ?? '', caption: g.caption?.trim() || `Souvenir ${index + 1}` }))
        .filter((p) => p.src),
    [data.gallery],
  )

  // Porte-bonheur conservés sur l'appareil du visiteur
  useEffect(() => {
    try {
      const raw = localStorage.getItem('loic-ingrid:galerie-porte-bonheur')
      if (raw) setFavs(new Set<string>(JSON.parse(raw)))
    } catch {
      /* stockage indisponible : on continue sans */
    }
  }, [])

  const toggleFav = useCallback((id: string) => {
    setFavs((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      try {
        localStorage.setItem('loic-ingrid:galerie-porte-bonheur', JSON.stringify(Array.from(next)))
      } catch {
        /* ignoré */
      }
      return next
    })
  }, [])

  const visible = useMemo(
    () => photos.filter((p) => filter === 'all' || favs.has(p.id)),
    [photos, filter, favs],
  )

  const close = useCallback(() => setLb(null), [])

  const open = (id: string) => {
    const index = visible.findIndex((p) => p.id === id)
    if (index >= 0) setLb({ items: visible, index })
  }

  const pill = (active: boolean) =>
    `flex items-center gap-2 rounded-full border px-5 py-2.5 text-[11px] uppercase tracking-[0.2em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111] ${
      active ? 'border-[#111] bg-[#111] text-white' : 'border-[#111]/30 text-[#111] hover:border-[#111]'
    }`

  if (!settings.sections.gallery) return null

  return (
    <div id="galerie" className="relative scroll-mt-4 bg-[#fbfaf6] text-[#111]">
      <style>{css}</style>

      {/* Introduction */}
      <section
        ref={introRef}
        data-in={introIn ? 'true' : 'false'}
        className="relative flex min-h-[72svh] flex-col items-center justify-center px-5 pb-10 pt-28 text-center"
      >
        <div className="rv" style={vars({ '--y': '-24px' })}>
          <TopHat className="bob h-16 w-16 text-[#111] sm:h-20 sm:w-20" />
        </div>
        <p
          className={`rv mt-6 font-serif text-xs uppercase tracking-[0.4em] sm:text-sm ${inkText}`}
          style={vars({ '--d': '0.2s' })}
        >
          Loïc &amp; Ingrid
        </p>
        <h2 className="mt-3 font-serif text-[clamp(3rem,13vw,9rem)] leading-[0.95] tracking-[0.02em]">
          <Words text="La galerie" className={inkText} start={0.35} step={0.18} />
        </h2>
        <p
          className="rv mt-6 max-w-md text-sm leading-7 text-[#111]/70 sm:text-base sm:leading-8"
          style={vars({ '--d': '0.95s' })}
        >
          Nos plus beaux souvenirs, accrochés comme dans une galerie. Touchez un cadre pour l’agrandir, et
          posez un fer à cheval sur ceux qui vous portent chance.
        </p>

        <div className="rv mt-9 flex flex-wrap items-center justify-center gap-3" style={vars({ '--d': '1.15s' })}>
          <button type="button" aria-pressed={filter === 'all'} onClick={() => setFilter('all')} className={pill(filter === 'all')}>
            Tous les souvenirs
            <span className="opacity-60">{photos.length}</span>
          </button>
          <button type="button" aria-pressed={filter === 'favs'} onClick={() => setFilter('favs')} className={pill(filter === 'favs')}>
            <HorseshoeIcon filled={filter === 'favs'} className="h-4 w-4" />
            Porte-bonheur
            <span className="opacity-60">{photos.filter((p) => favs.has(p.id)).length}</span>
          </button>
        </div>
      </section>

      <Checker />

      {/* Le mur : rayures tennis façon Ascot */}
      <section
        aria-label="Photos"
        className="relative bg-[linear-gradient(90deg,rgba(17,17,17,0.035)_1px,transparent_1px)] bg-[length:44px_100%] px-5 pb-12 pt-20 sm:px-10 lg:px-16"
      >
        {photos.length === 0 ? (
          <div className="mx-auto flex max-w-md flex-col items-center py-24 text-center">
            <Camera size={32} className="text-[#111]/40" aria-hidden="true" />
            <p className="mt-5 font-serif text-xl italic">Les photos arrivent bientôt.</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="mx-auto flex max-w-md flex-col items-center py-24 text-center">
            <HorseshoeIcon filled={false} className="h-14 w-14 text-[#111]/40" />
            <p className="mt-5 font-serif text-xl italic">Aucun porte-bonheur pour l’instant.</p>
            <p className="mt-2 text-sm leading-7 text-[#111]/65">
              Touchez le fer à cheval sous une photo pour la garder ici.
            </p>
            <button type="button" onClick={() => setFilter('all')} className={`${pill(true)} mt-6`}>
              Revoir tous les souvenirs
            </button>
          </div>
        ) : (
          <div className="mx-auto max-w-6xl columns-1 gap-x-12 sm:columns-2 lg:columns-3">
            {visible.map((item, order) => (
              <GalleryItem
                key={item.id}
                item={item}
                order={order}
                fav={favs.has(item.id)}
                onFav={toggleFav}
                onOpen={open}
              />
            ))}
          </div>
        )}
      </section>

      {lb && <Lightbox items={lb.items} start={lb.index} favs={favs} onFav={toggleFav} onClose={close} />}
    </div>
  )
}