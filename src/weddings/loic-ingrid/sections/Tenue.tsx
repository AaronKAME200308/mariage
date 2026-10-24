'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'

/* ================================================================
   CONTENU : modifiez ici le code vestimentaire
   ----------------------------------------------------------------
   • outfits   : les pièces conseillées pour elle et pour lui
   • palette   : les couleurs du thème
   • avoid     : ce qu'il vaut mieux éviter
   • PHOTO_COUNT : nombre de photos d'inspiration (3, 6, 12…)
     Fichiers attendus dans /public/LoicIngride/tenue/ :
     tenue-1.jpg, tenue-2.jpg … tenue-PHOTO_COUNT.jpg
   • photoCaptions : légendes (facultatif)
   ================================================================ */
type Sex = 'femme' | 'homme'

const outfits: Record<Sex, { title: string; intro: string; pieces: string[] }> = {
  femme: {
    title: 'Elle',
    intro: 'Une élégance de courses hippiques : de l’allure, du mouvement et un chapeau.',
    pieces: [
      'Une robe midi ou longue, noire, blanche ou jouant sur les deux',
      'Un chapeau ou un fascinator, la signature de Royal Ascot',
      'Des escarpins ou des sandales élégantes',
      'Une pochette discrète et quelques bijoux fins',
    ],
  },
  homme: {
    title: 'Lui',
    intro: 'Le costume de l’hippodrome : net, structuré, sans fausse note.',
    pieces: [
      'Un costume noir ou gris anthracite',
      'Une chemise blanche, bien repassée',
      'Un nœud papillon ou une cravate sobre',
      'Une pochette blanche et des chaussures cirées',
      'Un haut-de-forme, pour les audacieux',
    ],
  },
}

const palette = [
  { name: 'Noir', color: '#111111' },
  { name: 'Blanc', color: '#ffffff' },
  { name: 'Gris anthracite', color: '#3a3a3a' },
  { name: 'Gris perle', color: '#d9d9d9' },
]

const avoid = ['Les couleurs vives et les motifs voyants', 'Les tenues trop décontractées : jean, baskets, short']

const PHOTO_COUNT = 3
const photoCaptions: string[] = ['Noir et blanc, tout simplement', 'Le chapeau fait la tenue', 'Élégance de l’hippodrome']

type Size = { label: string; k: number }
const sizes: Size[] = [
  { label: 'S', k: 0.84 },
  { label: 'M', k: 1 },
  { label: 'L', k: 1.14 },
  { label: 'XL', k: 1.28 },
  { label: 'XXL', k: 1.42 },
]

/* ================================================================
   STYLES (préfixe tn- pour ne rien mélanger avec le reste du site)
   ================================================================ */
const inkText =
  'bg-[linear-gradient(180deg,#111111_0%,#2b2b2b_55%,#6b6b6b_100%)] bg-clip-text text-transparent'

const vars = (o: Record<string, string>) => o as CSSProperties
const heading: CSSProperties = { fontFamily: 'var(--w-heading, ui-serif, Georgia, serif)' }

const css = `
/* Apparition douce */
.tn-rv{
  opacity:0;
  filter:blur(8px);
  transform:translateY(var(--y,28px));
  transition:
    opacity 1s ease var(--d,0s),
    filter 1s ease var(--d,0s),
    transform 1.3s cubic-bezier(.16,1,.3,1) var(--d,0s);
}
[data-tn="true"] .tn-rv{opacity:1;filter:blur(0);transform:none}

/* Mots révélés par un masque */
.tn-wm{display:inline-block;overflow:hidden;vertical-align:bottom;padding-bottom:.14em;margin-bottom:-.14em}
.tn-wm>span{
  display:inline-block;
  transform:translateY(112%) rotate(4deg);
  transition:transform 1.15s cubic-bezier(.16,1,.3,1) var(--d,0s);
}
[data-tn="true"] .tn-wm>span{transform:none}

/* La cabine se dévoile comme un rideau qui se lève */
.tn-rise{
  opacity:0;
  transform:translateY(26px);
  clip-path:inset(0 0 100% 0);
  transition:
    opacity .8s ease var(--d,0s),
    transform 1.2s cubic-bezier(.16,1,.3,1) var(--d,0s),
    clip-path 1.2s cubic-bezier(.16,1,.3,1) var(--d,0s);
}
[data-tn="true"] .tn-rise{opacity:1;transform:none;clip-path:inset(-4rem -1rem -1rem -1rem)}

/* Les cadres s'accrochent : ils tombent, se balancent, se stabilisent */
.tn-hang{
  opacity:0;
  transform-origin:50% 0;
  transform:translateY(-46px) rotate(var(--tilt,-3deg));
  transition:
    opacity .7s ease var(--d,0s),
    transform 1.5s cubic-bezier(.34,1.56,.64,1) var(--d,0s);
}
.tn-hang[data-tn="true"]{opacity:1;transform:none}

.tn-zoomin{transform:scale(1.22);transition:transform 2.2s cubic-bezier(.16,1,.3,1) var(--d,0s)}
[data-tn="true"] .tn-zoomin{transform:scale(1)}

/* Silhouette : le corps s'adapte à la taille avec un petit rebond */
.tn-body{
  transform-box:fill-box;
  transform-origin:50% 50%;
  transition:transform .8s cubic-bezier(.34,1.56,.64,1);
}

/* Les pièces de la tenue arrivent l'une après l'autre */
@keyframes tn-item{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:none}}
.tn-item{animation:tn-item .7s cubic-bezier(.16,1,.3,1) both;animation-delay:var(--d,0s)}

@keyframes tn-bob{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-9px) rotate(3deg)}}
.tn-bob{animation:tn-bob 7s ease-in-out infinite}

@keyframes tn-twinkle{
  0%,100%{opacity:.2;transform:scale(.75) rotate(0deg)}
  50%{opacity:1;transform:scale(1.1) rotate(25deg)}
}
.tn-twinkle{animation:tn-twinkle 3.8s ease-in-out var(--d,0s) infinite}

@media (prefers-reduced-motion:reduce){
  .tn-rv,.tn-wm>span,.tn-rise,.tn-hang,.tn-zoomin{transition:none!important;opacity:1;filter:none;transform:none;clip-path:none}
  .tn-body{transition:none}
  .tn-item,.tn-bob,.tn-twinkle{animation:none}
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
          <span className="tn-wm">
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
      className={`tn-twinkle ${className}`}
      style={vars({ '--d': delay })}
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M12,0 C13,8 16,11 24,12 C16,13 13,16 12,24 C11,16 8,13 0,12 C8,11 11,8 12,0 Z" />
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

const checkerStrip =
  'pointer-events-none absolute inset-x-0 bottom-0 h-3 translate-y-full bg-[conic-gradient(#ffffff_25%,#111111_0_50%,#ffffff_0_75%,#111111_0)] bg-[length:12px_12px] transition-transform duration-500 ease-out group-hover:translate-y-0 sm:h-4 sm:bg-[length:16px_16px]'

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
   SILHOUETTES (le corps s'élargit ou s'affine selon la taille)
   ================================================================ */
const SKIN = '#f4f0e8'

function ManSilhouette({ k }: { k: number }) {
  return (
    <svg viewBox="0 0 200 430" className="h-full w-full" role="img" aria-label="Silhouette d’homme en costume noir, chemise blanche et nœud papillon">
      {/* Haut-de-forme, tête, cou (fixes) */}
      <ellipse cx="100" cy="47" rx="32" ry="5.5" fill="#111" />
      <path d="M79,47 L81,10 Q100,4 119,10 L121,47 Z" fill="#111" />
      <rect x="80.2" y="36" width="39.6" height="7" fill="#fff" />
      <rect x="93" y="80" width="14" height="16" fill={SKIN} stroke="#111" strokeWidth="1.4" />
      <circle cx="100" cy="66" r="17" fill={SKIN} stroke="#111" strokeWidth="1.5" />

      {/* Corps (adapté à la taille) */}
      <g className="tn-body" style={{ transform: `scaleX(${k})` }}>
        {/* Pantalon et chaussures */}
        <path d="M56,244 L144,244 L138,404 L106,404 L100,272 L94,404 L62,404 Z" fill="#111" />
        <path d="M60,404 L98,404 L100,418 L52,418 Q52,408 60,404 Z" fill="#000" />
        <path d="M102,404 L140,404 Q148,408 148,418 L100,418 Z" fill="#000" />

        {/* Veste et manches */}
        <path d="M62,98 Q100,86 138,98 L150,246 L50,246 Z" fill="#111" />
        <path d="M62,98 L46,248 L62,252 L76,130 Z" fill="#1c1c1c" stroke="rgba(255,255,255,0.2)" strokeWidth=".8" />
        <path d="M138,98 L154,248 L138,252 L124,130 Z" fill="#1c1c1c" stroke="rgba(255,255,255,0.2)" strokeWidth=".8" />

        {/* Chemise, revers, nœud papillon */}
        <path d="M88,92 L112,92 L100,176 Z" fill="#fff" />
        <path d="M88,92 L100,176 L80,150 L74,104 Z" fill="#111" stroke="rgba(255,255,255,0.35)" strokeWidth=".8" />
        <path d="M112,92 L100,176 L120,150 L126,104 Z" fill="#111" stroke="rgba(255,255,255,0.35)" strokeWidth=".8" />
        <path d="M100,104 L86,97 L86,111 Z M100,104 L114,97 L114,111 Z" fill="#111" />
        <rect x="97" y="100" width="6" height="8" rx="2" fill="#111" />
        <circle cx="100" cy="192" r="2" fill="#fff" />
        <circle cx="100" cy="212" r="2" fill="#fff" />

        {/* Pochette blanche */}
        <path d="M76,140 L90,136 L90,146 L78,146 Z" fill="#fff" />

        {/* Mains */}
        <circle cx="54" cy="260" r="7" fill={SKIN} stroke="#111" strokeWidth="1.2" />
        <circle cx="146" cy="260" r="7" fill={SKIN} stroke="#111" strokeWidth="1.2" />
      </g>
    </svg>
  )
}

function WomanSilhouette({ k }: { k: number }) {
  return (
    <svg viewBox="0 0 200 430" className="h-full w-full" role="img" aria-label="Silhouette de femme en robe longue noire avec un grand chapeau blanc">
      {/* Chapeau, tête, cou (fixes) */}
      <rect x="94" y="82" width="12" height="16" fill={SKIN} stroke="#111" strokeWidth="1.4" />
      <circle cx="100" cy="68" r="16" fill={SKIN} stroke="#111" strokeWidth="1.5" />
      <ellipse cx="100" cy="46" rx="50" ry="9" fill="#fff" stroke="#111" strokeWidth="1.5" />
      <path d="M74,44 Q76,20 100,18 Q124,20 126,44 Z" fill="#fff" stroke="#111" strokeWidth="1.5" />
      <path d="M75,40 Q100,46 125,40 L126,44 Q100,50 74,44 Z" fill="#111" />
      <path d="M124,30 C138,20 146,6 132,2 C134,14 128,22 120,28" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />

      {/* Corps (adapté à la taille) */}
      <g className="tn-body" style={{ transform: `scaleX(${k})` }}>
        {/* Jupe */}
        <path d="M81,174 Q100,182 119,174 L168,408 Q100,422 32,408 Z" fill="#111" />
        <path
          d="M92,182 L70,410 M100,184 L100,416 M108,182 L130,410"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="1"
          fill="none"
        />

        {/* Bras, mains et décolleté */}
        <path d="M76,100 L60,206 L68,210 L84,120 Z" fill={SKIN} stroke="#111" strokeWidth="1.2" />
        <path d="M124,100 L140,206 L132,210 L116,120 Z" fill={SKIN} stroke="#111" strokeWidth="1.2" />
        <circle cx="64" cy="212" r="5" fill={SKIN} stroke="#111" strokeWidth="1.2" />
        <circle cx="136" cy="212" r="5" fill={SKIN} stroke="#111" strokeWidth="1.2" />
        <path d="M84,96 Q100,106 116,96 L122,112 Q100,104 78,112 Z" fill={SKIN} stroke="#111" strokeWidth="1.2" />

        {/* Corsage, bretelles, ceinture blanche */}
        <path d="M78,110 Q100,102 122,110 L119,172 L81,172 Z" fill="#111" />
        <path d="M84,96 L86,110 M116,96 L114,110" stroke="#111" strokeWidth="3" strokeLinecap="round" />
        <rect x="80" y="168" width="40" height="7" fill="#fff" />
      </g>
    </svg>
  )
}

/* ================================================================
   CABINE D'ESSAYAGE
   ================================================================ */
function FittingRoom() {
  const [ref, inView] = useInView<HTMLDivElement>(0.12)
  const [sex, setSex] = useState<Sex>('femme')
  const [sizeIdx, setSizeIdx] = useState(1)
  const size = sizes[sizeIdx]
  const outfit = outfits[sex]
  const n = sizes.length

  const seg = (active: boolean) =>
    `flex-1 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111] ${
      active ? 'bg-[#111] text-white' : 'bg-white text-[#111] hover:bg-[#111]/5'
    }`

  return (
    <div ref={ref} data-tn={inView ? 'true' : 'false'} className="mx-auto mt-14 max-w-5xl">
      <div className="tn-rise" style={vars({ '--d': '0.1s' })}>
        <div className="bg-[#111] p-2 ring-1 ring-inset ring-white/20 [filter:drop-shadow(0_16px_18px_rgba(0,0,0,0.18))] sm:p-2.5">
          <div className="relative bg-white p-5 sm:p-8">
            <Corners />

            <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-14">
              {/* Scène */}
              <div className="relative mx-auto aspect-[200/430] w-full max-w-[17rem] sm:max-w-[19rem]">
                <div
                  aria-hidden="true"
                  className="absolute -inset-x-6 -top-4 bottom-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(17,17,17,0.09),transparent_68%)]"
                />
                <div
                  aria-hidden="true"
                  className="absolute -bottom-1 left-1/2 h-5 w-[78%] -translate-x-1/2 rounded-[50%] bg-black/25 blur-md"
                />
                <Sparkle className="absolute -left-4 top-[18%] h-4 w-4 text-[#111]/60" delay="0s" />
                <Sparkle className="absolute -right-3 top-[40%] h-3 w-3 text-[#111]/50" delay="1.3s" />
                <Sparkle className="absolute -left-2 bottom-[22%] h-3 w-3 text-[#111]/50" delay="2.2s" />

                {(['femme', 'homme'] as Sex[]).map((s) => (
                  <div
                    key={s}
                    aria-hidden={sex !== s}
                    className={`absolute inset-0 transition-all duration-700 ease-[cubic-bezier(.16,1,.3,1)] ${
                      sex === s
                        ? 'translate-x-0 scale-100 opacity-100'
                        : `pointer-events-none scale-95 opacity-0 ${s === 'femme' ? '-translate-x-8' : 'translate-x-8'}`
                    }`}
                  >
                    {s === 'femme' ? <WomanSilhouette k={size.k} /> : <ManSilhouette k={size.k} />}
                  </div>
                ))}
              </div>

              {/* Commandes et description */}
              <div>
                <p className="font-serif text-sm italic text-[#111]/60" style={heading}>
                  Essayez la tenue
                </p>

                <div role="radiogroup" aria-label="Silhouette" className="mt-3 flex overflow-hidden border border-[#111]">
                  {(['femme', 'homme'] as Sex[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      role="radio"
                      aria-checked={sex === s}
                      onClick={() => setSex(s)}
                      className={seg(sex === s)}
                    >
                      {outfits[s].title}
                    </button>
                  ))}
                </div>

                {/* Tailles : le haut-de-forme glisse sur la taille choisie */}
                <p id="tn-size" className="mt-7 text-[10px] uppercase tracking-[0.25em] text-[#111]/60">
                  Votre taille
                </p>
                <div className="relative mt-2 pt-9">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute top-0 -ml-4 h-8 w-8 text-[#111] transition-[left] duration-500 ease-[cubic-bezier(.34,1.56,.64,1)]"
                    style={{ left: `${((sizeIdx + 0.5) / n) * 100}%` }}
                  >
                    <TopHat className="h-full w-full" />
                  </span>
                  <div role="radiogroup" aria-labelledby="tn-size" className="flex border-t border-[#111]/40">
                    {sizes.map((s, i) => (
                      <button
                        key={s.label}
                        type="button"
                        role="radio"
                        aria-checked={sizeIdx === i}
                        onClick={() => setSizeIdx(i)}
                        className="group relative flex-1 pb-1 pt-3 text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111]"
                      >
                        <span aria-hidden="true" className={`absolute left-1/2 top-0 w-px -translate-x-1/2 bg-[#111] transition-all duration-300 ${sizeIdx === i ? 'h-3' : 'h-1.5 group-hover:h-2.5'}`} />
                        <span
                          className={`font-serif text-xl transition-colors duration-300 sm:text-2xl ${
                            sizeIdx === i ? 'text-[#111]' : 'text-[#111]/40 group-hover:text-[#111]/70'
                          }`}
                          style={heading}
                        >
                          {s.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* La tenue */}
                <div key={sex} className="mt-8">
                  <h3 className={`tn-item text-3xl leading-tight sm:text-4xl ${inkText}`} style={{ ...heading, ...vars({ '--d': '0s' }) }}>
                    {sex === 'femme' ? 'La tenue pour elle' : 'La tenue pour lui'}
                  </h3>
                  <RuleDiamond className="tn-item mt-4 w-24 text-[#111]" />
                  <p className="tn-item mt-4 text-sm leading-7 text-[#111]/70 sm:text-base" style={vars({ '--d': '0.1s' })}>
                    {outfit.intro}
                  </p>
                  <ul className="mt-5 space-y-3">
                    {outfit.pieces.map((p, i) => (
                      <li
                        key={p}
                        className="tn-item flex items-start gap-3 text-sm leading-6 text-[#111] sm:text-base"
                        style={vars({ '--d': `${0.2 + i * 0.09}s` })}
                      >
                        <Diamond className="mt-2 shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="mt-7 font-serif text-xs italic text-[#111]/50" style={heading}>
                  Silhouettes à titre indicatif : choisissez la coupe dans laquelle vous vous sentez le mieux.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   PALETTE ET « À ÉVITER »
   ================================================================ */
function PaletteBlock() {
  const [ref, inView] = useInView<HTMLDivElement>(0.15)
  const corner = 'pointer-events-none absolute h-1.5 w-1.5 rotate-45 bg-[#111]'

  return (
    <div ref={ref} data-tn={inView ? 'true' : 'false'} className="mx-auto mt-16 grid max-w-5xl gap-8 lg:grid-cols-2">
      {/* Palette */}
      <div className="tn-rise group relative" style={vars({ '--d': '0.05s' })}>
        <div className="relative h-full overflow-hidden bg-white p-6 ring-1 ring-[#111] transition-[transform,box-shadow] duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_22px_36px_-22px_rgba(0,0,0,0.5)] sm:p-8">
          <span aria-hidden="true" className="pointer-events-none absolute inset-1.5 border border-[#111]/20" />
          <span aria-hidden="true" className={`${corner} left-[3px] top-[3px]`} />
          <span aria-hidden="true" className={`${corner} right-[3px] top-[3px]`} />
          <span aria-hidden="true" className={`${corner} bottom-[3px] left-[3px]`} />
          <span aria-hidden="true" className={`${corner} bottom-[3px] right-[3px]`} />
          <div className="relative">
            <h3 className="text-2xl leading-tight text-[#111] sm:text-3xl" style={heading}>
              Notre palette
            </h3>
            <RuleDiamond className="mt-3 w-20 text-[#111]" />
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-5">
              {palette.map((c, i) => (
                <li key={c.name} className="tn-rv group/sw flex flex-col items-center gap-2" style={vars({ '--d': `${0.3 + i * 0.12}s`, '--y': '16px' })}>
                  <span
                    className="block h-14 w-14 rounded-full ring-1 ring-[#111]/70 ring-offset-2 ring-offset-white transition-transform duration-500 ease-[cubic-bezier(.34,1.56,.64,1)] group-hover/sw:-translate-y-1.5 group-hover/sw:scale-110 sm:h-16 sm:w-16"
                    style={{ background: c.color }}
                  />
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[#111]/65">{c.name}</span>
                </li>
              ))}
            </ul>
          </div>
          <span aria-hidden="true" className={checkerStrip} />
        </div>
      </div>

      {/* À éviter */}
      <div className="tn-rise group relative" style={vars({ '--d': '0.2s' })}>
        <div className="relative h-full overflow-hidden bg-white p-6 ring-1 ring-[#111] transition-[transform,box-shadow] duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_22px_36px_-22px_rgba(0,0,0,0.5)] sm:p-8">
          <span aria-hidden="true" className="pointer-events-none absolute inset-1.5 border border-[#111]/20" />
          <span aria-hidden="true" className={`${corner} left-[3px] top-[3px]`} />
          <span aria-hidden="true" className={`${corner} right-[3px] top-[3px]`} />
          <span aria-hidden="true" className={`${corner} bottom-[3px] left-[3px]`} />
          <span aria-hidden="true" className={`${corner} bottom-[3px] right-[3px]`} />
          <div className="relative">
            <h3 className="text-2xl leading-tight text-[#111] sm:text-3xl" style={heading}>
              À éviter
            </h3>
            <RuleDiamond className="mt-3 w-20 text-[#111]" />
            <ul className="mt-6 space-y-4">
              {avoid.map((a, i) => (
                <li
                  key={a}
                  className="tn-rv flex items-start gap-3 text-sm leading-6 text-[#111]/80 sm:text-base"
                  style={vars({ '--d': `${0.3 + i * 0.15}s`, '--y': '14px' })}
                >
                  <svg viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0 text-[#111]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M8.5 8.5l7 7M15.5 8.5l-7 7" />
                  </svg>
                  {a}
                </li>
              ))}
            </ul>
          </div>
          <span aria-hidden="true" className={checkerStrip} />
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   GALERIE D'INSPIRATIONS
   ================================================================ */
type Variant = 'classic' | 'arch' | 'oval' | 'chamfer'
const pattern: { variant: Variant; ratio: number }[] = [
  { variant: 'arch', ratio: 3 / 4 },
  { variant: 'classic', ratio: 4 / 5 },
  { variant: 'oval', ratio: 4 / 5 },
  { variant: 'chamfer', ratio: 1 },
  { variant: 'classic', ratio: 1 },
  { variant: 'arch', ratio: 3 / 4 },
  { variant: 'oval', ratio: 5 / 4 },
  { variant: 'classic', ratio: 5 / 4 },
]
const OCTAGON = 'polygon(10% 0,90% 0,100% 10%,100% 90%,90% 100%,10% 100%,0 90%,0 10%)'

function Photo({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false)
  const ref = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const el = ref.current
    if (el && el.complete && el.naturalWidth === 0) setFailed(true)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#ebe8e1]">
      <div className="tn-zoomin h-full w-full">
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
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
            <circle cx="12" cy="13" r="3.5" />
          </svg>
          <span className="px-2 text-center text-[10px] uppercase tracking-[0.2em]">Photo à ajouter</span>
        </div>
      )}
    </div>
  )
}

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

function InspirationItem({ index, className = '' }: { index: number; className?: string }) {
  const [ref, inView] = useInView<HTMLElement>(0.1)
  const cfg = pattern[index % pattern.length]
  const caption = photoCaptions[index] ?? `Inspiration ${index + 1}`

  return (
    <figure
      ref={ref}
      data-tn={inView ? 'true' : 'false'}
      className={`tn-hang ${className}`}
      style={vars({ '--tilt': index % 2 ? '3deg' : '-3deg', '--d': `${(index % 3) * 0.14}s` })}
    >
      <div className="group relative">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 z-0 h-11 w-11 -translate-x-1/2 text-[#111] opacity-0 transition-all duration-500 ease-[cubic-bezier(.34,1.56,.64,1)] group-hover:-translate-y-[88%] group-hover:-rotate-12 group-hover:opacity-100"
        >
          <TopHat className="h-full w-full" />
        </span>
        <div className="relative z-10 transition-[filter,transform] duration-500 [filter:drop-shadow(0_10px_12px_rgba(0,0,0,0.18))] group-hover:-translate-y-1.5 group-hover:[filter:drop-shadow(0_22px_22px_rgba(0,0,0,0.28))]">
          <Frame variant={cfg.variant} ratio={cfg.ratio}>
            <Photo src={`/LoicIngride/tenue/tenue-${index + 1}.jpg`} alt={`Inspiration de tenue : ${caption}`} />
          </Frame>
        </div>
      </div>
      <figcaption className="mt-5 border-t border-[#111]/15 pt-3 text-center font-serif text-base italic text-[#111]" style={heading}>
        {caption}
      </figcaption>
    </figure>
  )
}

/* ================================================================
   SECTION
   ================================================================ */
export default function Tenue() {
  const [headRef, headIn] = useInView<HTMLDivElement>(0.1)
  const [galRef, galIn] = useInView<HTMLDivElement>(0.05)
  const few = PHOTO_COUNT <= 3

  return (
    <section
      id="tenue"
      className="relative overflow-hidden bg-[#fbfaf6] bg-[linear-gradient(90deg,rgba(17,17,17,0.035)_1px,transparent_1px)] bg-[length:44px_100%] text-[#111]"
    >
      <style>{css}</style>
      <Checker />

      <div className="px-5 pb-24 pt-20 sm:px-10 lg:px-16">
        {/* Titre */}
        <div ref={headRef} data-tn={headIn ? 'true' : 'false'} className="relative mx-auto max-w-3xl text-center">
          <Sparkle className="absolute -left-2 top-2 h-4 w-4 text-[#111]/60 sm:left-6" delay="0s" />
          <Sparkle className="absolute -right-2 top-10 h-5 w-5 text-[#111]/50 sm:right-6" delay="1.2s" />
          <div className="tn-rv" style={vars({ '--y': '-20px' })}>
            <TopHat className="tn-bob mx-auto h-14 w-14 text-[#111] sm:h-16 sm:w-16" />
          </div>
          <p className="tn-rv mt-5 font-serif text-sm italic text-[#111]/60" style={{ ...heading, ...vars({ '--d': '0.15s' }) }}>
            Code vestimentaire
          </p>
          <h2 className="mt-2 text-[clamp(2.4rem,7vw,5rem)] leading-[1.02]" style={heading}>
            <Words text="Élégance façon Royal Ascot" className={inkText} start={0.25} step={0.13} />
          </h2>
          <div className="tn-rv mx-auto mt-6 w-40 text-[#111]" style={vars({ '--d': '0.9s' })}>
            <RuleDiamond className="w-full" />
          </div>
          <p className="tn-rv mx-auto mt-6 max-w-xl text-sm leading-7 text-[#111]/70 sm:text-base sm:leading-8" style={vars({ '--d': '1s' })}>
            Pour le plus beau jour de notre histoire, nous vous invitons à jouer le noir, le blanc et leurs nuances.
            Choisissez votre silhouette et votre taille pour voir la tenue.
          </p>
        </div>

        <FittingRoom />
        <PaletteBlock />

        {/* Galerie d'inspirations */}
        <div ref={galRef} data-tn={galIn ? 'true' : 'false'} className="mx-auto mt-24 max-w-6xl">
          <div className="text-center">
            <p className="tn-rv font-serif text-sm italic text-[#111]/60" style={heading}>
              Pour vous donner des idées
            </p>
            <h3 className="mt-2 text-[clamp(2rem,5vw,3.5rem)] leading-[1.05]" style={heading}>
              <Words text="Quelques inspirations" className={inkText} start={0.15} step={0.14} />
            </h3>
            <div className="tn-rv mx-auto mt-5 w-32 text-[#111]" style={vars({ '--d': '0.5s' })}>
              <RuleDiamond className="w-full" />
            </div>
          </div>

          {few ? (
            <div className="mt-16 grid items-start gap-14 sm:grid-cols-3 sm:gap-8 lg:gap-12">
              {Array.from({ length: PHOTO_COUNT }, (_, i) => (
                <InspirationItem key={i} index={i} className={i === 1 ? 'sm:mt-14' : ''} />
              ))}
            </div>
          ) : (
            <div className="mt-16 columns-1 gap-x-10 sm:columns-2 lg:columns-3">
              {Array.from({ length: PHOTO_COUNT }, (_, i) => (
                <InspirationItem key={i} index={i} className="mb-14 break-inside-avoid" />
              ))}
            </div>
          )}
        </div>
      </div>

      <Checker />
    </section>
  )
}