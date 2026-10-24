import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { ArrowLeft, Camera, ChevronDown, Gem, Laugh, Route, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/* ================================================================
   STYLES RÉUTILISABLES (mêmes dégradés blancs que l'accueil)
   ================================================================ */
const whiteText =
  'bg-[linear-gradient(180deg,#ffffff_0%,#f2f2f2_40%,#b5b5b5_100%)] bg-clip-text text-transparent'
const whiteBg = 'bg-[linear-gradient(135deg,#ffffff_0%,#e6e6e6_45%,#a0a0a0_100%)]'

const ROMAN = ['I', 'II', 'III', 'IV']

const vars = (o: Record<string, string>) => o as CSSProperties

/* ================================================================
   CONTENU : modifiez ici textes, légendes et photos
   Photos attendues dans /public/LoicIngride/ :
   rencontre-1.jpg … decision-3.jpg
   ================================================================ */
type Shape = 'arch' | 'circle' | 'oval' | 'chamfer' | 'diamond' | 'polaroid'
type Slot = {
  shape: Shape
  left: number // % de la largeur du bloc
  top: number // % de la hauteur du bloc
  w: number // % de la largeur du bloc
  ratio: number // largeur / hauteur
  rot: number // rotation en degrés
  z: number
  from: 'left' | 'right' | 'top' | 'bottom' // direction d'apparition
}
type PhotoData = { src: string; alt: string; caption: string }
type OrnamentType = 'tophat' | 'horseshoe' | 'fascinator' | 'crown'
type Chapter = {
  id: string
  title: string
  hook: string
  icon: LucideIcon
  paragraphs: string[]
  photos: PhotoData[]
  layout: Slot[]
  ornament: OrnamentType
}

const photo = (chapter: string, n: number, caption: string): PhotoData => ({
  src: `/LoicIngride/${chapter}-${n}.jpg`,
  alt: `Loïc et Ingrid : ${caption}`,
  caption,
})

const layoutA: Slot[] = [
  { shape: 'arch', left: 4, top: 0, w: 58, ratio: 3 / 4, rot: -2, z: 2, from: 'left' },
  { shape: 'circle', left: 52, top: 36, w: 44, ratio: 1, rot: 0, z: 3, from: 'right' },
  { shape: 'polaroid', left: 12, top: 58, w: 40, ratio: 5 / 6, rot: -5, z: 4, from: 'bottom' },
]
const layoutB: Slot[] = [
  { shape: 'oval', left: 36, top: 0, w: 58, ratio: 4 / 5, rot: 2, z: 2, from: 'top' },
  { shape: 'chamfer', left: 0, top: 30, w: 44, ratio: 1, rot: 0, z: 3, from: 'left' },
  { shape: 'diamond', left: 30, top: 62, w: 46, ratio: 1, rot: 0, z: 4, from: 'bottom' },
]
const layoutC: Slot[] = [
  { shape: 'circle', left: 0, top: 2, w: 46, ratio: 1, rot: 0, z: 3, from: 'left' },
  { shape: 'arch', left: 44, top: 14, w: 54, ratio: 3 / 4, rot: 3, z: 2, from: 'right' },
  { shape: 'polaroid', left: 10, top: 58, w: 42, ratio: 5 / 6, rot: 5, z: 4, from: 'bottom' },
]
const layoutD: Slot[] = [
  { shape: 'chamfer', left: 18, top: 0, w: 60, ratio: 1, rot: 0, z: 2, from: 'top' },
  { shape: 'arch', left: 0, top: 44, w: 40, ratio: 3 / 4, rot: -3, z: 3, from: 'left' },
  { shape: 'circle', left: 52, top: 52, w: 46, ratio: 1, rot: 0, z: 4, from: 'right' },
]

const chapters: Chapter[] = [
  {
    id: 'rencontre',
    title: 'La rencontre',
    hook: 'Un regard, et plus rien n’a été pareil.',
    icon: Sparkles,
    paragraphs: [
      'Il y a des jours ordinaires qui se mettent soudain à compter. Celui-là ressemblait à tous les autres, jusqu’à ce que nos regards se croisent et que le reste s’efface.',
      'Une première conversation, un premier rire, l’envie d’en dire plus. Sans le savoir, nous venions de poser la première pierre de tout ce qui allait suivre.',
    ],
    photos: [
      photo('rencontre', 1, 'Le premier regard'),
      photo('rencontre', 2, 'Le premier fou rire'),
      photo('rencontre', 3, 'Déjà complices'),
    ],
    layout: layoutA,
    ornament: 'tophat',
  },
  {
    id: 'deroulement',
    title: 'Le déroulement',
    hook: 'Pas à pas, côte à côte.',
    icon: Route,
    paragraphs: [
      'Les rendez-vous se sont enchaînés, puis les week-ends, puis les projets. Nous avons appris à nous connaître au fil des voyages, des repas qui s’éternisent et des silences qui n’ont jamais pesé.',
      'Il y a eu des moments faciles et d’autres plus exigeants. Chacun nous a rapprochés et nous a rappelé pourquoi nous avancions ensemble.',
    ],
    photos: [
      photo('deroulement', 1, 'Nos premières escapades'),
      photo('deroulement', 2, 'Les belles tablées'),
      photo('deroulement', 3, 'Chaque étape à deux'),
    ],
    layout: layoutB,
    ornament: 'horseshoe',
  },
  {
    id: 'anecdote',
    title: 'L’anecdote',
    hook: 'Celle qu’on raconte à chaque dîner.',
    icon: Laugh,
    paragraphs: [
      'Chaque couple a la sienne : cette histoire que l’on rejoue en riant, chacun défendant sa version. La nôtre commence par un petit grain de sable et finit en fou rire mémorable.',
      'Aujourd’hui encore, il suffit d’un mot pour que nos regards se cherchent et que l’un de nous reprenne le récit. Venez nous la faire raconter le jour J.',
    ],
    photos: [
      photo('anecdote', 1, 'Le fameux jour'),
      photo('anecdote', 2, 'La version de Loïc'),
      photo('anecdote', 3, 'La version d’Ingrid'),
    ],
    layout: layoutC,
    ornament: 'fascinator',
  },
  {
    id: 'decision',
    title: 'La décision',
    hook: 'Le oui qui ne laissait aucun doute.',
    icon: Gem,
    paragraphs: [
      'À force de partager les journées, une évidence s’est installée : plus rien ne se concevait l’un sans l’autre. Il n’y a pas eu de grand calcul, seulement une certitude tranquille.',
      'La demande a été faite, la réponse est venue sans hésiter. Il ne restait plus qu’à vous le dire, et à vous inviter à écrire la suite avec nous.',
    ],
    photos: [
      photo('decision', 1, 'La question'),
      photo('decision', 2, 'La réponse'),
      photo('decision', 3, 'Le début du grand jour'),
    ],
    layout: layoutD,
    ornament: 'crown',
  },
]

/* ================================================================
   STYLES & ANIMATIONS (apparition, mots masqués, trait, zoom photo)
   ================================================================ */
const css = `
html{scroll-behavior:smooth}

/* Apparition générique : flou + glissement + rotation */
.rv{
  opacity:0;
  filter:blur(10px);
  transform:translate3d(var(--x,0px),var(--y,36px),0) rotate(var(--r0,var(--r,0deg))) scale(.94);
  transition:
    opacity 1s ease var(--d,0s),
    filter 1.1s ease var(--d,0s),
    transform 1.4s cubic-bezier(.16,1,.3,1) var(--d,0s);
  will-change:transform,opacity,filter;
}
[data-in="true"] .rv{
  opacity:1;
  filter:blur(0);
  transform:translate3d(0,0,0) rotate(var(--r,0deg)) scale(1);
}

/* Mots révélés par un masque, un par un */
.wm{display:inline-block;overflow:hidden;vertical-align:bottom;padding-bottom:.14em;margin-bottom:-.14em}
.wm>span{
  display:inline-block;
  transform:translateY(112%) rotate(4deg);
  transition:transform 1.15s cubic-bezier(.16,1,.3,1) var(--d,0s);
}
[data-in="true"] .wm>span{transform:translateY(0) rotate(0)}

/* Filet qui se dessine */
.rule{transform:scaleX(0);transform-origin:left;transition:transform 1.5s cubic-bezier(.16,1,.3,1) var(--d,0s)}
[data-in="true"] .rule{transform:scaleX(1)}

/* Zoom arrière lent sur les photos */
.zoom{transform:scale(1.28);transition:transform 2.4s cubic-bezier(.16,1,.3,1) var(--d,0s)}
[data-in="true"] .zoom{transform:scale(1)}

/* Légère flottaison des ornements */
@keyframes bob{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-9px) rotate(3deg)}}
.bob{animation:bob 7s ease-in-out infinite}

@media (prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  .rv,.wm>span,.rule,.zoom{transition:none!important;opacity:1;filter:none;transform:none}
  .rv{transform:rotate(var(--r,0deg))}
  .bob{animation:none}
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
      { threshold, rootMargin: '0px 0px -8% 0px' },
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
  step = 0.08,
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
   ORNEMENTS ROYAL ASCOT (haut-de-forme, fer à cheval, fascinator, couronne, damier)
   ================================================================ */
function GradientDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" className="absolute">
      <defs>
        <linearGradient id="wg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#e6e6e6" />
          <stop offset="100%" stopColor="#a0a0a0" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function TopHat({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 72 72" className={className} aria-hidden="true" fill="none" stroke="url(#wg)" strokeWidth="2" strokeLinejoin="round">
      <path d="M22,46 L24,16 Q36,11 48,16 L50,46" />
      <ellipse cx="36" cy="47" rx="28" ry="6" />
      <rect x="23.2" y="36" width="25.6" height="7" fill="url(#wg)" stroke="none" />
    </svg>
  )
}

function Horseshoe({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 72 72" className={className} aria-hidden="true" fill="none">
      <path d="M16,62 L16,34 A20,20 0 0 1 56,34 L56,62" stroke="url(#wg)" strokeWidth="7" strokeLinecap="round" />
      <path d="M16,60 L16,34 A20,20 0 0 1 56,34 L56,60" stroke="#0b0b0b" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="0.1 7" />
    </svg>
  )
}

function Fascinator({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 72 72" className={className} aria-hidden="true" fill="none" stroke="url(#wg)" strokeWidth="2" strokeLinecap="round">
      <ellipse cx="34" cy="50" rx="22" ry="7" transform="rotate(-12 34 50)" />
      <path d="M38,45 C60,34 62,14 46,8 C50,22 44,32 30,40" />
      <path d="M46,8 C42,24 38,34 36,44" strokeWidth="1" />
    </svg>
  )
}

function Crown({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 72 72" className={className} aria-hidden="true" fill="none" stroke="url(#wg)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
      <path d="M12,54 L16,24 L29,38 L36,18 L43,38 L56,24 L60,54 Z" />
      <path d="M12,60 H60" />
      <circle cx="16" cy="21" r="2.5" fill="url(#wg)" stroke="none" />
      <circle cx="36" cy="14.5" r="2.5" fill="url(#wg)" stroke="none" />
      <circle cx="56" cy="21" r="2.5" fill="url(#wg)" stroke="none" />
    </svg>
  )
}

function Ornament({ type, className = '' }: { type: OrnamentType; className?: string }) {
  if (type === 'tophat') return <TopHat className={className} />
  if (type === 'horseshoe') return <Horseshoe className={className} />
  if (type === 'fascinator') return <Fascinator className={className} />
  return <Crown className={className} />
}

function Checker({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`h-3 w-full bg-[conic-gradient(#ffffff_25%,#0b0b0b_0_50%,#ffffff_0_75%,#0b0b0b_0)] bg-[length:12px_12px] sm:h-4 sm:bg-[length:16px_16px] ${className}`}
    />
  )
}

/* ================================================================
   PHOTO + CADRES EXCENTRIQUES
   ================================================================ */
function Photo({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false)
  const ref = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const el = ref.current
    if (el && el.complete && el.naturalWidth === 0) setFailed(true)
  }, [])

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#161616]">
      <div className="zoom h-full w-full">
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
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.10),transparent_65%)] text-white/50">
          <Camera size={20} aria-hidden="true" />
          <span className="px-2 text-center text-[10px] uppercase tracking-[0.2em]">Photo à ajouter</span>
        </div>
      )}
    </div>
  )
}

const OCTAGON = 'polygon(14% 0,86% 0,100% 14%,100% 86%,86% 100%,14% 100%,0 86%,0 14%)'
const DIAMOND = 'polygon(50% 0,100% 50%,50% 100%,0 50%)'

function Frame({ slot, data, index }: { slot: Slot; data: PhotoData; index: number }) {
  const offsets = {
    left: ['-70px', '24px'],
    right: ['70px', '24px'],
    top: ['0px', '-60px'],
    bottom: ['0px', '80px'],
  } as const
  const [ox, oy] = offsets[slot.from]

  const box: CSSProperties = {
    left: `${slot.left}%`,
    top: `${slot.top}%`,
    width: `${slot.w}%`,
    aspectRatio: String(slot.ratio),
    zIndex: slot.z,
    filter: 'drop-shadow(0 18px 28px rgba(0,0,0,0.55))',
  }
  const rv = vars({
    '--x': ox,
    '--y': oy,
    '--r': `${slot.rot}deg`,
    '--r0': `${slot.rot + (index % 2 ? 9 : -9)}deg`,
    '--d': `${0.2 + index * 0.25}s`,
  })

  let content: ReactNode

  if (slot.shape === 'arch') {
    content = (
      <>
        <div aria-hidden="true" className="absolute -inset-3 rounded-b-lg rounded-t-[999px] border border-white/25" />
        <div className={`h-full w-full rounded-b-md rounded-t-[999px] p-[2px] ${whiteBg}`}>
          <div className="h-full w-full overflow-hidden rounded-b-[4px] rounded-t-[999px]">
            <Photo src={data.src} alt={data.alt} />
          </div>
        </div>
      </>
    )
  } else if (slot.shape === 'circle') {
    content = (
      <>
        <div aria-hidden="true" className="absolute -inset-3 rounded-full border border-dashed border-white/30" />
        <div className={`h-full w-full rounded-full p-[2px] ${whiteBg}`}>
          <div className="h-full w-full overflow-hidden rounded-full">
            <Photo src={data.src} alt={data.alt} />
          </div>
        </div>
      </>
    )
  } else if (slot.shape === 'oval') {
    content = (
      <>
        <div aria-hidden="true" className="absolute -inset-3 rotate-[8deg] rounded-[50%] border border-white/25" />
        <div className={`h-full w-full rounded-[50%] p-[2px] ${whiteBg}`}>
          <div className="h-full w-full overflow-hidden rounded-[50%]">
            <Photo src={data.src} alt={data.alt} />
          </div>
        </div>
      </>
    )
  } else if (slot.shape === 'chamfer' || slot.shape === 'diamond') {
    const clip = slot.shape === 'chamfer' ? OCTAGON : DIAMOND
    content = (
      <>
        <div className={`absolute inset-0 ${whiteBg}`} style={{ clipPath: clip }} />
        <div className="absolute inset-[3px]" style={{ clipPath: clip }}>
          <Photo src={data.src} alt={data.alt} />
        </div>
      </>
    )
  } else {
    // polaroid
    content = (
      <div className="relative h-full w-full bg-[#f4f0e8] p-[6%] pb-[21%]">
        <Photo src={data.src} alt={data.alt} />
        <span className="absolute inset-x-0 bottom-[6%] px-2 text-center font-serif text-xs italic text-[#111111] sm:text-sm">
          {data.caption}
        </span>
        <span
          aria-hidden="true"
          className="absolute -top-3 left-1/2 h-5 w-14 -translate-x-1/2 -rotate-[4deg] bg-white/35 backdrop-blur-sm"
        />
      </div>
    )
  }

  return (
    <div className="group absolute" style={box}>
      <div className="rv relative h-full w-full" style={rv}>
        {content}
      </div>
    </div>
  )
}

/* ================================================================
   CHAPITRE
   ================================================================ */
function ChapterSection({ chapter, index }: { chapter: Chapter; index: number }) {
  const [ref, inView] = useInView<HTMLElement>(0.12)
  const flip = index % 2 === 1
  const Icon = chapter.icon

  return (
    <section
      ref={ref}
      id={chapter.id}
      data-in={inView ? 'true' : 'false'}
      className="relative z-10 flex min-h-screen items-center px-5 py-24 sm:px-10 lg:px-24 lg:py-32"
    >
      <div className="mx-auto grid w-full max-w-6xl items-center gap-16 lg:grid-cols-2 lg:gap-24">
        {/* Texte */}
        <div className={flip ? 'lg:order-2' : ''}>
          <div className="rv flex items-end gap-5" style={vars({ '--y': '24px' })}>
            <span
              aria-hidden="true"
              className="font-serif text-[clamp(4.5rem,13vw,8rem)] leading-[0.85] text-transparent"
              style={{ WebkitTextStroke: '1px rgba(255,255,255,0.5)' }}
            >
              {ROMAN[index]}
            </span>
            <span className={`mb-2 grid h-12 w-12 place-items-center rounded-full p-px ${whiteBg}`}>
              <span className="grid h-full w-full place-items-center rounded-full bg-[#0b0b0b]">
                <Icon size={20} className="text-white" aria-hidden="true" />
              </span>
            </span>
          </div>

          <h2 className="mt-5 font-serif text-[clamp(2.4rem,7vw,4.6rem)] leading-[1.05]">
            <Words text={chapter.title} className={whiteText} start={0.15} />
          </h2>

          <p
            className="rv mt-4 font-serif text-lg italic text-white/90 sm:text-xl"
            style={vars({ '--d': '0.55s', '--y': '20px' })}
          >
            {chapter.hook}
          </p>

          <span
            aria-hidden="true"
            className={`rule mt-7 block h-px w-36 ${whiteBg}`}
            style={vars({ '--d': '0.75s' })}
          />

          <div className="mt-7 max-w-xl space-y-5 text-sm leading-7 text-white/75 sm:text-base sm:leading-8">
            {chapter.paragraphs.map((p, i) => (
              <p key={i} className="rv" style={vars({ '--d': `${0.9 + i * 0.2}s`, '--y': '24px' })}>
                {p}
              </p>
            ))}
          </div>
        </div>

        {/* Cadres excentriques */}
        <div className={`relative mx-auto aspect-[5/6] w-full max-w-[32rem] ${flip ? 'lg:order-1' : ''}`}>
          {chapter.layout.map((slot, i) => (
            <Frame key={i} slot={slot} data={chapter.photos[i]} index={i} />
          ))}
          <div
            className={`rv pointer-events-none absolute z-10 ${flip ? '-left-3 -top-8' : '-right-3 -top-8'}`}
            style={vars({ '--d': '1.1s', '--y': '-20px' })}
          >
            <Ornament type={chapter.ornament} className="bob h-16 w-16 sm:h-20 sm:w-20" />
          </div>
        </div>
      </div>
    </section>
  )
}

/* ================================================================
   LE VOYAGE : trait qui se dessine + cavalier-repère + navigation
   ================================================================ */
function Journey() {
  const n = chapters.length
  const [s, setS] = useState({ active: 0, pos: 0, p: 0, show: false })
  const [size, setSize] = useState({ w: 0, h: 0 })
  const pathRef = useRef<SVGPathElement>(null)
  const markerRef = useRef<SVGGElement>(null)

  useEffect(() => {
    const wrap = document.getElementById('voyage')
    if (!wrap) return
    const measure = () => setSize({ w: wrap.clientWidth, h: wrap.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const wrap = document.getElementById('voyage')
      if (!wrap) return
      const y = window.scrollY + window.innerHeight * 0.45
      const wTop = wrap.getBoundingClientRect().top + window.scrollY
      const wH = wrap.offsetHeight

      let active = 0
      let t = 0
      chapters.forEach((c, i) => {
        const el = document.getElementById(c.id)
        if (!el) return
        const top = el.getBoundingClientRect().top + window.scrollY
        if (y >= top) {
          active = i
          t = Math.min(Math.max((y - top) / el.offsetHeight, 0), 1)
        }
      })

      const pos = Math.min((active + t) / (n - 1), 1)
      const p = Math.min(Math.max((y - wTop) / wH, 0), 1)
      const show = window.scrollY + window.innerHeight * 0.5 > wTop && y < wTop + wH + window.innerHeight * 0.1

      setS((prev) =>
        Math.abs(prev.pos - pos) < 0.002 && Math.abs(prev.p - p) < 0.002 && prev.active === active && prev.show === show
          ? prev
          : { active, pos, p, show },
      )
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [n])

  // Tracé sinueux, calculé selon la taille réelle de la page
  const d = useMemo(() => {
    const { w, h } = size
    if (!w || !h) return ''
    const segments = 8
    let px = w * 0.5
    let py = 0
    let path = `M ${px} ${py}`
    for (let k = 1; k <= segments; k++) {
      const x = (k % 2 === 1 ? 0.12 : 0.88) * w
      const y = (k / segments) * h
      const dy = y - py
      path += ` C ${px} ${py + dy * 0.55} ${x} ${y - dy * 0.55} ${x} ${y}`
      px = x
      py = y
    }
    return path
  }, [size])

  // Le repère voyage le long du trait
  useEffect(() => {
    const path = pathRef.current
    const marker = markerRef.current
    if (!path || !marker || !d) return
    const len = path.getTotalLength()
    const pt = path.getPointAtLength(len * s.p)
    marker.setAttribute('transform', `translate(${pt.x} ${pt.y})`)
  }, [s.p, d])

  return (
    <>
      {/* Trait du voyage, derrière les chapitres */}
      {d && (
        <svg
          aria-hidden="true"
          width={size.w}
          height={size.h}
          viewBox={`0 0 ${size.w} ${size.h}`}
          className="pointer-events-none absolute inset-0 z-0 opacity-60 sm:opacity-100"
        >
          <path d={d} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1" strokeDasharray="2 9" strokeLinecap="round" />
          <path
            ref={pathRef}
            d={d}
            fill="none"
            stroke="rgba(255,255,255,0.75)"
            strokeWidth="1.5"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - s.p}
          />
          <g ref={markerRef}>
            <circle r="13" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.35)" />
            <circle r="4" fill="#ffffff" />
          </g>
        </svg>
      )}

      {/* Navigation verticale (grands écrans) */}
      <nav
        aria-label="Étapes de notre histoire"
        className={`fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 transition-opacity duration-500 lg:block ${
          s.show ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div className="relative h-[min(56vh,26rem)] w-5">
          <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/20" />
          <span
            className="absolute left-1/2 top-0 w-px -translate-x-1/2 bg-[linear-gradient(180deg,#ffffff,#a0a0a0)]"
            style={{ height: `${s.pos * 100}%` }}
          />
          {chapters.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onClick={() => goTo(c.id)}
              aria-label={`Aller à : ${c.title}`}
              aria-current={s.active === i ? 'step' : undefined}
              className="group absolute left-1/2 -translate-x-1/2 -translate-y-1/2 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-white"
              style={{ top: `${(i / (n - 1)) * 100}%` }}
            >
              <span
                className={`block h-3.5 w-3.5 rounded-full border transition-all duration-500 ${
                  i <= s.active
                    ? 'border-white bg-white shadow-[0_0_14px_rgba(255,255,255,0.7)]'
                    : 'border-white/50 bg-[#0b0b0b]'
                }`}
              />
              <span
                className={`absolute right-8 top-1/2 -translate-y-1/2 whitespace-nowrap font-serif text-sm transition-all duration-500 ${
                  s.active === i
                    ? 'translate-x-0 text-white opacity-100'
                    : 'translate-x-2 text-white/70 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100'
                }`}
              >
                {ROMAN[i]} · {c.title}
              </span>
            </button>
          ))}
          {/* Le haut-de-forme qui voyage */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/40 bg-[#0b0b0b]"
            style={{ top: `${s.pos * 100}%` }}
          >
            <TopHat className="h-5 w-5" />
          </span>
        </div>
      </nav>

      {/* Navigation horizontale (mobile et tablette) */}
      <nav
        aria-label="Étapes de notre histoire"
        className={`fixed inset-x-3 bottom-3 z-40 rounded-full border border-white/20 bg-[#0b0b0b]/85 px-7 pb-3 pt-4 backdrop-blur transition-all duration-500 lg:hidden ${
          s.show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-6 opacity-0'
        }`}
      >
        <div className="relative h-5">
          <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-white/20" />
          <span
            className="absolute left-0 top-1/2 h-px -translate-y-1/2 bg-[linear-gradient(90deg,#a0a0a0,#ffffff)]"
            style={{ width: `${s.pos * 100}%` }}
          />
          {chapters.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onClick={() => goTo(c.id)}
              aria-label={`Aller à : ${c.title}`}
              aria-current={s.active === i ? 'step' : undefined}
              className="absolute top-1/2 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center"
              style={{ left: `${(i / (n - 1)) * 100}%` }}
            >
              <span
                className={`block h-3 w-3 rounded-full border transition-all duration-500 ${
                  i <= s.active ? 'border-white bg-white' : 'border-white/50 bg-[#0b0b0b]'
                }`}
              />
            </button>
          ))}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/40 bg-[#0b0b0b]"
            style={{ left: `${s.pos * 100}%` }}
          >
            <TopHat className="h-4 w-4" />
          </span>
        </div>
        <p className="mt-2 text-center font-serif text-xs text-white/85">
          {ROMAN[s.active]} · {chapters[s.active].title}
        </p>
      </nav>
    </>
  )
}

/* ================================================================
   PAGE
   ================================================================ */
export default function HistoirePage() {
  const [introRef, introIn] = useInView<HTMLElement>(0.1)
  const [endRef, endIn] = useInView<HTMLElement>(0.2)

  return (
    <main className="relative bg-[#0b0b0b] pb-24 text-[#f4f0e8] lg:pb-0">
      <style>{css}</style>
      <GradientDefs />

      {/* Barre du haut */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex items-center justify-between bg-gradient-to-b from-[#0b0b0b] to-transparent px-5 py-4 sm:px-10">
        <a
          href="/"
          className="pointer-events-auto flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/80 transition-colors hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          <ArrowLeft size={14} aria-hidden="true" /> Accueil
        </a>
        <span className={`font-serif text-lg tracking-[0.2em] ${whiteText}`}>L &amp; I</span>
      </header>

      {/* Introduction */}
      <section
        ref={introRef}
        data-in={introIn ? 'true' : 'false'}
        className="relative isolate flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-5 text-center"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.10),transparent_55%)]"
        />
        <div className="rv" style={vars({ '--y': '-24px' })}>
          <TopHat className="bob h-16 w-16 sm:h-20 sm:w-20" />
        </div>
        <p
          className={`rv mt-6 font-serif text-xs uppercase tracking-[0.4em] sm:text-sm ${whiteText}`}
          style={vars({ '--d': '0.2s' })}
        >
          Loïc &amp; Ingrid
        </p>
        <h1 className="mt-3 font-serif text-[clamp(3rem,13vw,9rem)] leading-[0.95] tracking-[0.02em]">
          <Words text="Notre histoire" className={whiteText} start={0.35} step={0.15} />
        </h1>
        <p
          className="rv mt-6 max-w-md text-sm leading-7 text-white/75 sm:text-base sm:leading-8"
          style={vars({ '--d': '0.9s' })}
        >
          Quatre étapes, un seul voyage. Suivez la route jusqu’au grand jour.
        </p>
        <button
          type="button"
          onClick={() => goTo('rencontre')}
          className={`rv mt-10 rounded-full p-px transition-shadow hover:shadow-[0_0_32px_-6px_#e6e6e6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white ${whiteBg}`}
          style={vars({ '--d': '1.1s' })}
        >
          <span className="flex items-center rounded-full bg-[#0b0b0b] px-9 py-3.5">
            <span className={`font-serif text-sm font-semibold uppercase tracking-[0.22em] ${whiteText}`}>
              Prendre la route
            </span>
          </span>
        </button>
        <ChevronDown
          size={20}
          aria-hidden="true"
          className="absolute bottom-16 animate-bounce text-white/70 motion-reduce:animate-none"
        />
        <Checker className="absolute inset-x-0 bottom-0" />
      </section>

      {/* Les 4 chapitres */}
      <div id="voyage" className="relative">
        <Journey />
        {chapters.map((chapter, i) => (
          <ChapterSection key={chapter.id} chapter={chapter} index={i} />
        ))}
      </div>

      {/* Final */}
      <section
        ref={endRef}
        data-in={endIn ? 'true' : 'false'}
        className="relative z-10 flex min-h-[70vh] flex-col items-center justify-center px-5 pb-24 pt-28 text-center"
      >
        <Checker className="absolute inset-x-0 top-0" />
        <div className="rv" style={vars({ '--y': '-20px' })}>
          <Crown className="bob h-16 w-16 sm:h-20 sm:w-20" />
        </div>
        <h2 className="mt-6 font-serif text-[clamp(2.2rem,6vw,4.2rem)] leading-[1.08]">
          <Words text="Rendez-vous le 19 juin 2027" className={whiteText} start={0.2} />
        </h2>
        <p
          className="rv mt-5 max-w-md text-sm leading-7 text-white/75 sm:text-base sm:leading-8"
          style={vars({ '--d': '0.9s' })}
        >
          Le voyage ne s’arrête pas ici. Il vous attend le jour J, et nous serions heureux de le poursuivre avec vous.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <a
            href="/#rsvp"
            className={`rv rounded-full px-9 py-3.5 font-serif text-sm font-semibold uppercase tracking-[0.22em] text-[#111111] transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white ${whiteBg}`}
            style={vars({ '--d': '1.1s' })}
          >
            Confirmer ma présence
          </a>
          <a
            href="/"
            className={`rv group rounded-full p-px transition-shadow hover:shadow-[0_0_32px_-6px_#e6e6e6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white ${whiteBg}`}
            style={vars({ '--d': '1.25s' })}
          >
            <span className="flex items-center rounded-full bg-[#0b0b0b] px-9 py-3.5">
              <span className={`font-serif text-sm font-semibold uppercase tracking-[0.22em] ${whiteText}`}>
                Retour à l’accueil
              </span>
            </span>
          </a>
        </div>
      </section>
    </main>
  )
}