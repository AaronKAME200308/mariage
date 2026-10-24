/**
 * Page d'ouverture : une enveloppe noire en 3D qui s'ouvre sur une carte ivoire, puis révèle le site.
 * Animation d'introduction du site uniquement (aucun faire-part : la carte ne se télécharge ni ne s'envoie).
 *
 * Utilisation, dans src/weddings/<slug>/index.tsx :
 *   import Ouverture from '../_ouverture'
 *   <Ouverture config={{ initiales: ['A', 'J'] }} />      // à la place de <Intro />
 * Voir README.md pour toutes les options.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useAnimate, useReducedMotion } from 'motion/react'
import { formatTime, useSite } from '../_kit'
import Carte, { type ContenuCarte } from './Carte'
import { CONFIG_PAR_DEFAUT, type OuvertureConfig } from './config'
import Calque from './decor/Calque'
import Dos from './decor/Dos'
import { grain } from './decor/grain'
import Gypsophile from './decor/Gypsophile'
import Poche from './decor/Poche'
import Rabat from './decor/Rabat'
import Sceau from './decor/Sceau'

type Etat = 'ferme' | 'ouverture' | 'carte' | 'sortie' | 'fini'
const attendre = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

function heureLisible(iso: string, tz: string): string {
  const [h, m] = formatTime(iso, tz).split(':')
  return `${Number(h)} h ${m}`
}

export default function Ouverture({ config, onOpened }: { config?: Partial<OuvertureConfig>; onOpened?: () => void }) {
  const cfg: OuvertureConfig = { ...CONFIG_PAR_DEFAUT, ...config, couleurs: { ...CONFIG_PAR_DEFAUT.couleurs, ...config?.couleurs } }
  const col = cfg.couleurs
  const { wedding, data, settings } = useSite()
  const reduire = useReducedMotion()
  const [scope, animate] = useAnimate<HTMLDivElement>()
  const [etat, setEtat] = useState<Etat>('ferme')
  const [rabatDessous, setRabatDessous] = useState(false)
  const [carteDevant, setCarteDevant] = useState(false)
  const vivant = useRef(true)
  useEffect(() => { vivant.current = true; return () => { vivant.current = false } }, [])

  // Pas de défilement derrière l'ouverture.
  const actif = etat !== 'fini' && (!cfg.suivreReglageAdmin || settings.envelopeEnabled)
  useEffect(() => {
    if (!actif) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [actif])

  const terminer = useCallback(async () => {
    if (!vivant.current) return
    setEtat('sortie')
    if (scope.current && !reduire) await animate(scope.current, { opacity: 0 }, { duration: 0.7 })
    if (!vivant.current) return
    setEtat('fini')
    onOpened?.()
  }, [animate, onOpened, reduire, scope])

  const ouvrir = useCallback(async () => {
    if (etat !== 'ferme') return
    if (reduire) { void terminer(); return }
    setEtat('ouverture')
    try {
      // 1. Le sceau se fend et tombe.
      await animate('[data-p=sceau]', { scale: 0.93 }, { duration: 0.18 })
      void animate('[data-p=indice]', { opacity: 0 }, { duration: 0.3 })
      await Promise.all([
        animate('[data-p=sceau-g]', { x: -22, y: 150, rotate: -24, opacity: 0 }, { duration: 0.9, ease: [0.45, 0, 0.95, 0.6] }),
        animate('[data-p=sceau-d]', { x: 22, y: 170, rotate: 20, opacity: 0 }, { duration: 0.95, ease: [0.45, 0, 0.95, 0.6] }),
      ])
      // 2. Le papier calque glisse.
      void animate('[data-p=calque]', { x: '118%', rotate: 7, opacity: 0 }, { duration: 1.1, ease: [0.5, 0, 0.2, 1] })
      await attendre(450)
      // 3. Le rabat se retourne (il passe derrière la carte après 90°).
      await animate('[data-p=rabat]', { rotateX: 92 }, { duration: 0.55, ease: 'easeIn' })
      setRabatDessous(true)
      await animate('[data-p=rabat]', { rotateX: 180 }, { duration: 0.5, ease: 'easeOut' })
      // 4. La carte monte hors de l'enveloppe.
      await animate('[data-p=carte]', { y: '-60%' }, { duration: 0.95, ease: [0.3, 0.7, 0.2, 1] })
      // 5. La carte passe devant, s'agrandit et se centre ; l'enveloppe s'efface vers le bas.
      setCarteDevant(true)
      const carte = scope.current?.querySelector<HTMLElement>('[data-p=carte]')
      if (carte) {
        const r = carte.getBoundingClientRect()
        const s = Math.min((window.innerHeight * 0.8) / r.height, (window.innerWidth * 0.92) / r.width, 2.4)
        const dx = window.innerWidth / 2 - (r.left + r.width / 2)
        const dy = window.innerHeight * 0.45 - (r.top + r.height / 2)
        void animate('[data-piece]', { opacity: 0, y: 90 }, { duration: 0.9 })
        await animate('[data-p=carte]', { x: dx, y: -0.6 * carte.offsetHeight + dy, scale: s }, { duration: 1.1, ease: [0.3, 0.7, 0.2, 1] })
      }
      if (vivant.current) setEtat('carte')
    } catch {
      // Animation interrompue (démontage) : on ne fait rien.
    }
  }, [animate, etat, reduire, scope, terminer])

  // Contenu de la carte : noms, date, heure et lieu viennent du mariage (base de données), sauf surcharge.
  const d = wedding.wedding_date ? new Date(wedding.wedding_date) : null
  const part = (o: Intl.DateTimeFormatOptions) => (d ? new Intl.DateTimeFormat('fr-FR', { timeZone: wedding.timezone, ...o }).format(d) : '')
  const premier = data.events.find((e) => e.starts_at)
  const contenu: ContenuCarte = {
    formule: cfg.formule,
    noms: [wedding.partner_one_name, wedding.partner_two_name],
    invitation: cfg.invitation,
    mois: part({ month: 'long' }),
    jour: part({ day: 'numeric' }),
    annee: part({ year: 'numeric' }),
    filigrane: cfg.filigrane && d ? [part({ day: '2-digit' }), part({ month: '2-digit' }), part({ year: '2-digit' })] : null,
    heure: cfg.heure ?? (premier?.starts_at ? heureLisible(premier.starts_at, wedding.timezone) : ''),
    lieu: cfg.lieu ?? premier?.venue_name ?? '',
    ville: cfg.ville ?? '',
  }
  const initiales: [string, string] = cfg.initiales ?? [wedding.partner_one_name.trim().charAt(0).toUpperCase(), wedding.partner_two_name.trim().charAt(0).toUpperCase()]

  if (!actif) return null
  return (
    <div
      ref={scope}
      role="dialog"
      aria-modal="true"
      aria-label="Ouverture du site"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: `${grain('clair', 0.06)}, radial-gradient(ellipse at 50% 38%, #2b2b2d 0%, ${col.fond} 72%)`, backgroundSize: '240px, 100% 100%' }}
    >
      <button
        type="button"
        onClick={() => void terminer()}
        className="absolute top-4 right-4 z-20 rounded-full border border-white/30 px-4 py-2 text-xs tracking-widest text-white/80 uppercase transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        {cfg.boutonPasser}
      </button>

      {/* Boîte de l'enveloppe : portrait, ratio d'une enveloppe A7 (hauteur limitée à 62 % de l'écran). */}
      <div
        data-p="boite"
        className="relative"
        style={{ width: 'min(78vw, 24rem, calc(62dvh * 0.7246))', aspectRatio: '100 / 138', perspective: '1600px' }}
      >
        {/* Ombre au sol */}
        <div data-piece aria-hidden className="absolute -bottom-[6%] left-[8%] h-[8%] w-[84%] rounded-[50%] bg-black/70 blur-xl" />

        <Dos couleur={col.enveloppe} clair={col.enveloppeClair} />
        <Carte c={contenu} carte={col.carte} encre={col.encre} devant={carteDevant} />
        <Poche couleur={col.enveloppe} clair={col.enveloppeClair} />

        {/* Brins de gypsophile posés sur la poche */}
        <div data-piece aria-hidden className="pointer-events-none absolute bottom-[2%] left-[2%] z-[5] w-[26%] text-white/90" style={{ transform: 'rotate(-8deg)' }}>
          <Gypsophile graine={3} className="w-full" />
        </div>
        <div data-piece aria-hidden className="pointer-events-none absolute right-[1%] bottom-[0%] z-[5] w-[22%] text-white/85" style={{ transform: 'rotate(10deg) scaleX(-1)' }}>
          <Gypsophile graine={11} className="w-full" />
        </div>

        <Rabat couleur={col.enveloppe} clair={col.enveloppeClair} doublureClair={col.doublureClair} doublureSombre={col.doublureSombre} dessous={rabatDessous} />

        {/* Sceau (bouton d'ouverture) */}
        <button
          type="button"
          data-p="sceau"
          data-piece
          onClick={() => void ouvrir()}
          disabled={etat !== 'ferme'}
          aria-label="Ouvrir l’enveloppe"
          className="absolute top-[56.5%] left-1/2 z-[6] aspect-square w-[27%] -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          style={{ filter: 'drop-shadow(0 4px 5px rgb(0 0 0 / .55))' }}
        >
          <span data-p="sceau-g" className="absolute inset-0 block"><Sceau initiales={initiales} couleurs={col} moitie="g" /></span>
          <span data-p="sceau-d" className="absolute inset-0 block"><Sceau initiales={initiales} couleurs={col} moitie="d" /></span>
        </button>

        <Calque />
      </div>

      <p data-p="indice" aria-hidden className="mt-10 text-xs tracking-[0.3em] text-white/60 uppercase motion-safe:animate-pulse">{cfg.indice}</p>

      {etat === 'carte' && (
        <button
          type="button"
          autoFocus
          onClick={() => void terminer()}
          className="absolute bottom-[6dvh] z-20 rounded-full px-10 py-3 text-sm tracking-[0.25em] uppercase shadow-lg transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          style={{ background: col.encre, color: col.carte, border: `1px solid ${col.carte}55` }}
        >
          {cfg.boutonEntrer}
        </button>
      )}
    </div>
  )
}
