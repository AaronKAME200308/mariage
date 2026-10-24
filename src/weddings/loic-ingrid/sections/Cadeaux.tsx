import { Fragment, useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Check, Copy, Gift, Landmark, Smartphone, Wallet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/* ================================================================
   CONTENU : modifiez ici le message et les moyens de participer
   ----------------------------------------------------------------
   • Supprimez un bloc de `methods` si vous ne le proposez pas.
   • Chaque ligne de `details` avec copy: true affiche un bouton
     « copier » pratique pour les numéros et les références.
   • Remplacez tous les textes « à renseigner » par vos informations.
   ================================================================ */
const message = {
  title: 'Votre présence est notre plus beau cadeau.',
  paragraphs: [
    'Nous sommes touchés de vous compter parmi nos invités. Votre venue, vos sourires et votre joie suffisent à faire de cette journée un souvenir inoubliable.',
    'Si toutefois vous souhaitez nous témoigner votre affection, nous vous proposons, avec toute la simplicité du monde, de privilégier une participation en argent plutôt qu’un cadeau. Elle nous aidera à bien démarrer notre vie à deux.',
    'Aucune obligation, bien sûr : chacun donne selon son cœur et ses envies. Merci, du fond du cœur.',
  ],
  signature: 'Loïc & Ingrid',
}

type Detail = { label: string; value: string; copy?: boolean }
type Method = {
  id: string
  icon: LucideIcon
  title: string
  text: string
  details: Detail[]
  note?: string
}

const methods: Method[] = [
  {
    id: 'mobile',
    icon: Smartphone,
    title: 'Mobile Money',
    text: 'Envoyez votre participation depuis votre téléphone, en quelques secondes.',
    details: [
      { label: 'Orange Money', value: 'Numéro à renseigner', copy: true },
      { label: 'MTN Mobile Money', value: 'Numéro à renseigner', copy: true },
      { label: 'Au nom de', value: 'Nom du bénéficiaire à renseigner' },
    ],
  },
  {
    id: 'virement',
    icon: Landmark,
    title: 'Virement bancaire',
    text: 'Pour celles et ceux qui préfèrent passer par leur banque.',
    details: [
      { label: 'Titulaire', value: 'Nom du titulaire à renseigner' },
      { label: 'Banque', value: 'Nom de la banque à renseigner' },
      { label: 'Références du compte', value: 'À renseigner', copy: true },
    ],
  },
  {
    id: 'urne',
    icon: Wallet,
    title: 'Le jour J',
    text: 'Vous préférez remettre votre participation en main propre ? Une urne vous attendra à la réception.',
    details: [{ label: 'Où', value: 'À la réception' }],
    note: 'Une enveloppe suffit, avec ou sans petit mot.',
  },
]

/* ================================================================
   STYLES RÉUTILISABLES
   ================================================================ */
const inkText =
  'bg-[linear-gradient(180deg,#111111_0%,#2b2b2b_55%,#6b6b6b_100%)] bg-clip-text text-transparent'

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

/* Filet qui se dessine */
.rule{transform:scaleX(0);transform-origin:left;transition:transform 1.5s cubic-bezier(.16,1,.3,1) var(--d,0s)}
[data-in="true"] .rule{transform:scaleX(1)}

/* Enveloppe : le rabat s'ouvre, le petit mot en sort */
.env-flap{
  transform-box:fill-box;
  transform-origin:50% 0%;
  transform:scaleY(1);
  transition:transform .9s cubic-bezier(.5,0,.2,1) .3s;
}
[data-in="true"] .env-flap{transform:scaleY(-1)}
.env-note{
  opacity:0;
  transform:translateY(0);
  transition:opacity .3s ease .75s, transform 1s cubic-bezier(.34,1.56,.64,1) .85s;
}
[data-in="true"] .env-note{opacity:1;transform:translateY(-34px)}

@keyframes bob{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-9px) rotate(3deg)}}
.bob{animation:bob 7s ease-in-out infinite}

@keyframes twinkle{
  0%,100%{opacity:.2;transform:scale(.75) rotate(0deg)}
  50%{opacity:1;transform:scale(1.1) rotate(25deg)}
}
.twinkle{animation:twinkle 3.8s ease-in-out var(--d,0s) infinite}

@keyframes spinSlow{to{transform:rotate(360deg)}}
.spin-slow{animation:spinSlow 50s linear infinite}

/* Petit battement de cœur */
@keyframes beat{0%,100%{transform:scale(1)}15%{transform:scale(1.18)}30%{transform:scale(1)}45%{transform:scale(1.12)}60%{transform:scale(1)}}
.beat{animation:beat 3.2s ease-in-out infinite}

@media (prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  .rv,.wm>span,.rise,.rule{transition:none!important;opacity:1;filter:none;transform:none;clip-path:none}
  .env-flap{transition:none;transform:scaleY(-1)}
  .env-note{transition:none;opacity:1;transform:translateY(-34px)}
  .bob,.twinkle,.spin-slow,.beat{animation:none}
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
          <path id="cadeaux-ring" d="M100,100 m-80,0 a80,80 0 1,1 160,0 a80,80 0 1,1 -160,0" />
        </defs>
        <text fill="currentColor" fontSize="11.5" letterSpacing="3" className="font-serif uppercase">
          <textPath href="#cadeaux-ring">Loïc &amp; Ingrid · 19 juin 2027 · Royal Ascot ·</textPath>
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

const checkerStrip =
  'pointer-events-none absolute inset-x-0 bottom-0 h-3 translate-y-full bg-[conic-gradient(#ffffff_25%,#111111_0_50%,#ffffff_0_75%,#111111_0)] bg-[length:12px_12px] transition-transform duration-500 ease-out group-hover:translate-y-0 sm:h-4 sm:bg-[length:16px_16px]'

/* Enveloppe qui s'ouvre quand on arrive sur la page */
function Envelope({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 -40 200 180"
      className={`${className} [filter:drop-shadow(0_10px_12px_rgba(0,0,0,0.15))]`}
      aria-hidden="true"
      fill="none"
      stroke="#111"
      strokeWidth="1.6"
      strokeLinejoin="round"
    >
      <rect x="10" y="30" width="180" height="100" fill="#ffffff" />
      <g className="env-flap">
        <path d="M10,30 L100,85 L190,30 Z" fill="#ffffff" />
        <circle cx="100" cy="74" r="9" fill="#111" stroke="none" />
        <path
          d="M12 21s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z"
          fill="#ffffff"
          stroke="none"
          transform="translate(94 68) scale(0.5)"
        />
      </g>
      <g className="env-note">
        <rect x="30" y="40" width="140" height="70" fill="#ffffff" />
        <text
          x="100"
          y="72"
          textAnchor="middle"
          fill="#111"
          stroke="none"
          fontSize="20"
          fontStyle="italic"
          className="font-serif"
        >
          Merci
        </text>
      </g>
      <path d="M10,30 L100,85 L190,30 L190,130 L10,130 Z" fill="#ffffff" />
    </svg>
  )
}

/* ================================================================
   LIGNE DE DÉTAIL AVEC BOUTON « COPIER »
   ================================================================ */
function DetailRow({ detail }: { detail: Detail }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(detail.value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* presse-papiers indisponible : rien à faire */
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 border-t border-[#111]/15 pt-3">
      <div className="min-w-0">
        <dt className="text-[10px] uppercase tracking-[0.22em] text-[#111]/50">{detail.label}</dt>
        <dd className="mt-1 break-words font-serif text-base text-[#111]">{detail.value}</dd>
      </div>
      {detail.copy && (
        <button
          type="button"
          onClick={copy}
          aria-label={`Copier : ${detail.label}`}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#111]/25 text-[#111]/70 transition-colors hover:border-[#111] hover:text-[#111] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111]"
        >
          {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
          <span className="sr-only" aria-live="polite">
            {copied ? 'Copié' : ''}
          </span>
        </button>
      )}
    </div>
  )
}

/* ================================================================
   CARTE D'UN MOYEN DE PARTICIPER
   ================================================================ */
function MethodCard({ method, index }: { method: Method; index: number }) {
  const Icon = method.icon
  const corner = 'pointer-events-none absolute h-1.5 w-1.5 rotate-45 bg-[#111]'

  return (
    <div className="rise group relative h-full" style={vars({ '--d': `${0.15 + index * 0.15}s` })}>
      {/* Le haut-de-forme qui se soulève au survol */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-8 top-0 z-0 h-10 w-10 text-[#111] opacity-0 transition-all duration-500 ease-[cubic-bezier(.34,1.56,.64,1)] group-hover:-translate-y-[88%] group-hover:rotate-12 group-hover:opacity-100"
      >
        <TopHat className="h-full w-full" />
      </span>

      <div className="relative z-10 flex h-full flex-col overflow-hidden bg-white p-6 ring-1 ring-[#111] transition-[transform,box-shadow] duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_22px_36px_-22px_rgba(0,0,0,0.5)] sm:p-7">
        <span aria-hidden="true" className="pointer-events-none absolute inset-1.5 border border-[#111]/20" />
        <span aria-hidden="true" className={`${corner} left-[3px] top-[3px]`} />
        <span aria-hidden="true" className={`${corner} right-[3px] top-[3px]`} />
        <span aria-hidden="true" className={`${corner} bottom-[3px] left-[3px]`} />
        <span aria-hidden="true" className={`${corner} bottom-[3px] right-[3px]`} />

        <div className="relative flex flex-1 flex-col">
          <span className="grid h-12 w-12 place-items-center rounded-full border border-[#111] text-[#111]">
            <Icon size={20} aria-hidden="true" />
          </span>
          <h3 className="mt-5 font-serif text-2xl leading-tight text-[#111] sm:text-[1.7rem]">{method.title}</h3>
          <RuleDiamond className="mt-3 w-20 text-[#111]" />
          <p className="mt-4 text-sm leading-7 text-[#111]/70">{method.text}</p>

          <dl className="mt-6 space-y-3">
            {method.details.map((d) => (
              <DetailRow key={d.label} detail={d} />
            ))}
          </dl>

          {method.note && <p className="mt-5 font-serif text-sm italic text-[#111]/60">{method.note}</p>}
        </div>

        <span aria-hidden="true" className={checkerStrip} />
      </div>
    </div>
  )
}

/* ================================================================
   PAGE
   ================================================================ */
const gridClass: Record<number, string> = {
  1: 'max-w-md',
  2: 'max-w-3xl lg:grid-cols-2',
  3: 'lg:grid-cols-3',
}

export default function Cadeaux() {
  const [introRef, introIn] = useInView<HTMLElement>(0.1)
  const [noteRef, noteIn] = useInView<HTMLElement>(0.12)
  const [waysRef, waysIn] = useInView<HTMLElement>(0.1)
  const corner = 'pointer-events-none absolute h-1.5 w-1.5 rotate-45 bg-[#111]'

  return (
    <div id="cadeaux" className="relative scroll-mt-4 bg-[#fbfaf6] text-[#111]">
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
            <Gift className="beat h-full w-full" strokeWidth={1.6} aria-hidden="true" />
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
        <h2 className="mt-3 font-serif text-[clamp(3rem,13vw,9rem)] leading-[0.95] tracking-[0.02em]">
          <Words text="Les cadeaux" className={inkText} start={0.35} step={0.18} />
        </h2>
        <p
          className="rv mt-6 max-w-md text-sm leading-7 text-[#111]/70 sm:text-base sm:leading-8"
          style={vars({ '--d': '0.95s' })}
        >
          Un petit mot pour vous dire, en toute simplicité, ce qui nous ferait le plus plaisir.
        </p>
      </section>

      <Checker />

      <div className="relative bg-[linear-gradient(90deg,rgba(17,17,17,0.035)_1px,transparent_1px)] bg-[length:44px_100%]">
        {/* Le mot des mariés */}
        <section
          ref={noteRef}
          data-in={noteIn ? 'true' : 'false'}
          className="relative px-5 pb-10 pt-24 sm:px-10"
        >
          <div className="mx-auto max-w-2xl">
            <Envelope className="mx-auto mb-2 h-auto w-52 sm:w-64" />

            <div className="rise group relative" style={vars({ '--d': '1.1s' })}>
              <div className="relative overflow-hidden bg-white p-7 text-center ring-1 ring-[#111] sm:p-12">
                <span aria-hidden="true" className="pointer-events-none absolute inset-1.5 border border-[#111]/20" />
                <span aria-hidden="true" className={`${corner} left-[3px] top-[3px]`} />
                <span aria-hidden="true" className={`${corner} right-[3px] top-[3px]`} />
                <span aria-hidden="true" className={`${corner} bottom-[3px] left-[3px]`} />
                <span aria-hidden="true" className={`${corner} bottom-[3px] right-[3px]`} />

                <div className="relative">
                  <h2 className="font-serif text-[clamp(1.8rem,4.5vw,2.8rem)] leading-[1.15]">
                    <Words text={message.title} className={inkText} start={1.3} step={0.09} />
                  </h2>
                  <RuleDiamond className="mx-auto mt-6 w-32 text-[#111]" />

                  <div className="mt-7 space-y-5 text-sm leading-7 text-[#111]/75 sm:text-base sm:leading-8">
                    {message.paragraphs.map((p, i) => (
                      <p key={i} className="rv" style={vars({ '--d': `${1.9 + i * 0.25}s`, '--y': '20px' })}>
                        {p}
                      </p>
                    ))}
                  </div>

                  <p
                    className={`rv mt-9 font-serif text-3xl italic ${inkText}`}
                    style={vars({ '--d': '2.8s', '--y': '16px' })}
                  >
                    {message.signature}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Comment participer */}
        <section
          ref={waysRef}
          data-in={waysIn ? 'true' : 'false'}
          className="relative px-5 pb-24 pt-20 sm:px-10 lg:px-16"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <p className="rv font-serif text-sm italic text-[#111]/60">Si vous le souhaitez</p>
              <h2 className="mt-2 font-serif text-[clamp(2.2rem,6vw,4rem)] leading-[1.05]">
                <Words text="Comment participer" className={inkText} start={0.15} step={0.14} />
              </h2>
              <div className="rv mx-auto mt-5 w-40 text-[#111]" style={vars({ '--d': '0.5s' })}>
                <RuleDiamond className="w-full" />
              </div>
              <p className="rv mx-auto mt-5 max-w-md text-sm leading-7 text-[#111]/70 sm:text-base" style={vars({ '--d': '0.6s' })}>
                Choisissez la façon qui vous est la plus simple.
              </p>
            </div>

            <div className={`mx-auto grid gap-8 ${gridClass[methods.length] ?? 'lg:grid-cols-3'}`}>
              {methods.map((m, i) => (
                <MethodCard key={m.id} method={m} index={i} />
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}