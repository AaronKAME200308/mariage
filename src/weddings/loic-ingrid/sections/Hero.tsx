'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, Menu, X } from 'lucide-react'

const weddingDate = new Date('2027-06-19T15:00:00+02:00').getTime()

/* ---------- Styles blancs (dégradés) réutilisables ---------- */
const whiteText =
  'bg-[linear-gradient(180deg,#ffffff_0%,#f2f2f2_40%,#b5b5b5_100%)] bg-clip-text text-transparent'
const whiteBg = 'bg-[linear-gradient(135deg,#ffffff_0%,#e6e6e6_45%,#a0a0a0_100%)]'

function getTimeLeft() {
  const difference = Math.max(weddingDate - Date.now(), 0)

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  }
}

function Countdown() {
  // Valeurs à zéro au premier rendu pour éviter l'erreur d'hydratation
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    setTimeLeft(getTimeLeft())
    const interval = window.setInterval(() => setTimeLeft(getTimeLeft()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  const units = [
    ['Jours', timeLeft.days],
    ['Heures', timeLeft.hours],
    ['Minutes', timeLeft.minutes],
    ['Secondes', timeLeft.seconds],
  ] as const

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4" aria-label="Compte à rebours avant le mariage">
      {units.map(([label, value], index) => (
        <div key={label} className="flex items-center gap-2 sm:gap-4">
          <div className={`rounded-sm p-px ${whiteBg}`}>
            <div className="min-w-[3.6rem] bg-[#111111]/90 px-2 py-3 text-center backdrop-blur-sm sm:min-w-[5rem] sm:py-4">
              <div className={`font-serif text-2xl leading-none sm:text-4xl ${whiteText}`}>
                {String(value).padStart(2, '0')}
              </div>
              <div className="mt-2 text-[8px] uppercase tracking-[0.2em] text-white/70 sm:text-[9px] sm:tracking-[0.25em]">
                {label}
              </div>
            </div>
          </div>
          {index < units.length - 1 && <span className="hidden text-lg text-[#e6e6e6]/60 sm:block">:</span>}
        </div>
      ))}
    </div>
  )
}

/* ---------- Médaillon circulaire (comme le logo W.A de la maquette) ---------- */
function Medallion({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label="Loïc et Ingrid, 19 juin 2027">
      <defs>
        <linearGradient id="white-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#e6e6e6" />
          <stop offset="100%" stopColor="#a0a0a0" />
        </linearGradient>
        <path id="ring-path" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
      </defs>
      <text fill="url(#white-ring)" fontSize="13" letterSpacing="4.2" className="font-serif uppercase">
        <textPath href="#ring-path" startOffset="0">
          Loïc &amp; Ingrid · 19 juin 2027 · Royal Ascot ·
        </textPath>
      </text>
      <text
        x="100"
        y="116"
        textAnchor="middle"
        fill="url(#white-ring)"
        fontSize="46"
        letterSpacing="2"
        className="font-serif"
      >
        L&amp;I
      </text>
    </svg>
  )
}

/* ---------- Feuillage blanc ---------- */
// function Leaf({ x, y, r, s = 1 }: { x: number; y: number; r: number; s?: number }) {
//   return (
//     <path
//       d="M0,0 C10,-18 10,-46 0,-70 C-10,-46 -10,-18 0,0 Z"
//       fill="url(#leaf-white)"
//       transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}
//     />
//   )
// }

function Foliage({ flip = false, className = '' }: { flip?: boolean; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 220 360"
      className={`pointer-events-none absolute bottom-0 ${flip ? 'right-0 -scale-x-100' : 'left-0'} ${className}`}
    >
      <defs>
        <linearGradient id={`leaf-white${flip ? '-r' : ''}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#e6e6e6" />
          <stop offset="100%" stopColor="#8c8c8c" />
        </linearGradient>
      </defs>
      <g style={{ ['--g' as string]: 'url(#leaf-white)' }}>
        <path d="M60,360 C70,260 90,170 120,60" stroke="#e6e6e6" strokeWidth="1.5" fill="none" />
        <g fill={`url(#leaf-white${flip ? '-r' : ''})`}>
          <path d="M0,0 C10,-18 10,-46 0,-70 C-10,-46 -10,-18 0,0 Z" transform="translate(112 100) rotate(18) scale(1.1)" />
          <path d="M0,0 C10,-18 10,-46 0,-70 C-10,-46 -10,-18 0,0 Z" transform="translate(98 150) rotate(-38) scale(1.2)" />
          <path d="M0,0 C10,-18 10,-46 0,-70 C-10,-46 -10,-18 0,0 Z" transform="translate(92 190) rotate(40) scale(1.3)" />
          <path d="M0,0 C10,-18 10,-46 0,-70 C-10,-46 -10,-18 0,0 Z" transform="translate(80 240) rotate(-42) scale(1.3)" />
          <path d="M0,0 C10,-18 10,-46 0,-70 C-10,-46 -10,-18 0,0 Z" transform="translate(74 285) rotate(38) scale(1.2)" />
          <path d="M0,0 C10,-18 10,-46 0,-70 C-10,-46 -10,-18 0,0 Z" transform="translate(120 62) rotate(4) scale(0.9)" />
          <path d="M0,0 C10,-18 10,-46 0,-70 C-10,-46 -10,-18 0,0 Z" transform="translate(150 360) rotate(24) scale(1.6)" />
          <path d="M0,0 C10,-18 10,-46 0,-70 C-10,-46 -10,-18 0,0 Z" transform="translate(30 360) rotate(-22) scale(1.3)" />
        </g>
      </g>
    </svg>
  )
}

const navLinks = [
  { href: '#accueil', label: 'Accueil' },
  { href: '#histoire', label: 'Notre histoire' },
  {href :'#galerie', label: 'Galerie'},
  { href: '#programme', label: 'Programme' },
  { href: '#livredor', label: 'Livre d\'or' },
  { href: '#cadeaux', label: 'Cadeaux' },
  { href: '#jour-j', label: 'Le jour J' },
  { href: '#rsvp', label: 'RSVP' },
]

export default function Page() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <main className="min-h-screen bg-[#111111] text-[#f4f0e8]">
      {/* Cadre blanc en dégradé */}
      <div className={`p-[8px] sm:p-[12px] ${whiteBg}`}>
        <section className="relative isolate flex min-h-[calc(100svh-16px)] flex-col overflow-hidden bg-[#0b0b0b] sm:min-h-[calc(100svh-24px)]">
          {/* Photo des mariés en noir et blanc : déposez votre image dans /public/hero-mariage.jpg */}
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-20 bg-cover bg-center opacity-90"
            style={{ backgroundImage: "url('/LoicIngride/loic-ingride.png')" }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.10),transparent_50%),linear-gradient(180deg,rgba(11,11,11,0.55)_0%,rgba(11,11,11,0.75)_100%)]"
          />

          {/* ---------- En-tête ---------- */}
          <header className="relative z-30 flex items-center justify-between px-5 py-5 sm:px-10 sm:py-7 lg:px-16">
            <a href="#accueil" className={`font-serif text-xl tracking-[0.2em] ${whiteText}`}>
              L &amp; I
            </a>

            <nav
              className={`${menuOpen ? 'flex' : 'hidden'} absolute left-0 right-0 top-full flex-col gap-6 border-y border-white/10 bg-[#0b0b0b]/95 px-6 py-7 text-center text-[11px] uppercase tracking-[0.25em] backdrop-blur md:static md:flex md:flex-row md:items-center md:gap-9 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none lg:gap-14`}
            >
              {navLinks.map((link, i) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="group relative text-white/90 transition-colors hover:text-[#f2f2f2] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#e6e6e6]"
                >
                  {link.label}
                  {i === 0 && (
                    <span className="mx-auto mt-2 hidden w-full flex-col gap-[3px] md:flex" aria-hidden="true">
                      <span className="h-px w-full bg-[#e6e6e6]" />
                      <span className="h-px w-full bg-[#e6e6e6]" />
                    </span>
                  )}
                </a>
              ))}
              <a
                href="#rsvp"
                onClick={() => setMenuOpen(false)}
                className={`rounded-full px-6 py-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#111111] transition-[filter] hover:brightness-110 md:hidden ${whiteBg}`}
              >
                Confirmer ma présence
              </a>
            </nav>

            <a
              href="#rsvp"
              className={`hidden rounded-full px-6 py-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#111111] shadow-[0_0_30px_-8px_#e6e6e6] transition-[filter] hover:brightness-110 md:inline-block ${whiteBg}`}
            >
              Je serai là
            </a>

            <button
              type="button"
              aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-[#f2f2f2] md:hidden"
            >
              {menuOpen ? <X /> : <Menu />}
            </button>
          </header>

          {/* Rail latéral (grands écrans) */}
          <div className="absolute left-6 top-1/2 z-10 hidden -translate-y-1/2 xl:block" aria-hidden="true">
            <div className="flex flex-col items-center gap-4 rounded-full border border-[#e6e6e6]/50 bg-[#0b0b0b]/60 px-3 py-6 backdrop-blur-sm">
              <span className="h-10 w-px bg-[#e6e6e6]/60" />
              <span className={`font-serif text-xs tracking-[0.35em] [writing-mode:vertical-rl] ${whiteText}`}>
                19 · 06 · 2027
              </span>
              <span className="h-10 w-px bg-[#e6e6e6]/60" />
            </div>
          </div>

          {/* ---------- Contenu ---------- */}
          <div
            id="accueil"
            className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 pb-28 pt-4 text-center sm:pb-32"
          >
            <Medallion className="mb-5 h-24 w-24 sm:h-28 sm:w-28 lg:absolute lg:left-24 lg:top-[14%] lg:mb-0 lg:h-44 lg:w-44 xl:left-28 xl:h-52 xl:w-52" />

            <p className={`font-serif text-xs uppercase tracking-[0.35em] sm:text-sm sm:tracking-[0.5em] ${whiteText}`}>
              Loïc &amp; Ingrid vous invitent à leur
            </p>

            <h1
              className={`mt-3 font-serif text-[clamp(3.1rem,15vw,10rem)] font-medium uppercase leading-[0.95] tracking-[0.04em] drop-shadow-[0_8px_24px_rgba(0,0,0,0.55)] ${whiteText}`}
            >
              Mariage
            </h1>

            <p className="mt-2 font-serif text-lg italic text-white/90 sm:text-2xl">
              le 19 juin 2027, en noir et blanc
            </p>

            <p className="mt-6 max-w-xl text-sm leading-7 text-white/75 sm:text-base sm:leading-8">
              Deux chemins, une évidence. Venez élégants, venez heureux : nous voulons vivre avec vous le plus beau jour de notre histoire.
            </p>

            <div className="mt-9 w-full sm:mt-10">
              <Countdown />
            </div>

            <div className="mt-10 flex flex-col items-center gap-4 sm:mt-12 sm:flex-row">
              {/* Bouton contour dégradé */}
              <a
                href="#histoire"
                className={`group rounded-full p-px transition-shadow hover:shadow-[0_0_32px_-6px_#e6e6e6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e6e6e6] ${whiteBg}`}
              >
                <span className="flex items-center justify-center rounded-full bg-[#0b0b0b] px-9 py-3.5 transition-colors group-hover:bg-[#0b0b0b]/70">
                  <span className={`font-serif text-sm font-semibold uppercase tracking-[0.22em] ${whiteText}`}>
                    Notre histoire
                  </span>
                </span>
              </a>

              {/* Bouton plein dégradé */}
              <a
                href="#rsvp"
                className={`rounded-full px-9 py-3.5 font-serif text-sm font-semibold uppercase tracking-[0.22em] text-[#111111] transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e6e6e6] ${whiteBg}`}
              >
                Confirmer ma présence
              </a>
            </div>
          </div>

          {/* Invitation à continuer */}
          <a
            href="#histoire"
            aria-label="Continuer à parcourir la page"
            className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-1 text-[10px] uppercase tracking-[0.3em] text-white/70 transition-colors hover:text-[#f2f2f2] sm:bottom-7"
          >
            Découvrez la suite
            <ChevronDown size={18} className="animate-bounce text-[#e6e6e6] motion-reduce:animate-none" />
          </a>

          <Foliage className="h-48 w-auto opacity-90 sm:h-72 lg:h-[26rem]" />
          <Foliage flip className="h-44 w-auto opacity-90 sm:h-64 lg:h-[24rem]" />
        </section>
      </div>

      <section
        id="histoire"
        className="flex min-h-[45vh] items-center justify-center bg-[#f4f0e8] px-6 py-24 text-center text-[#111111]"
      >
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#6b6b6b]">À suivre</p>
          <h2 className="mt-4 font-serif text-4xl sm:text-6xl">Notre histoire commence ici.</h2>
        </div>
      </section>
    </main>
  )
}