import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Heart } from 'lucide-react'

/**
 * Animation d'introduction du SITE WEB : une enveloppe aux noms du couple qui s'ouvre
 * avant d'afficher le site. Ce n'est pas un faire-part : aucun contenu à éditer,
 * exporter ou envoyer.
 */
export function Envelope({ names, message, onOpened }: { names: string; message: string; onOpened: () => void }) {
  const reduce = useReducedMotion()
  const [phase, setPhase] = useState<'closed' | 'opening' | 'leaving'>('closed')
  const [flapBehind, setFlapBehind] = useState(false)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  function open() {
    if (phase !== 'closed') return
    if (reduce) { onOpened(); return }
    setPhase('opening')
    window.setTimeout(() => setFlapBehind(true), 350)
    window.setTimeout(() => setPhase('leaving'), 1700)
    window.setTimeout(onOpened, 2300)
  }

  const opening = phase !== 'closed'
  return (
    <AnimatePresence>
      {phase !== 'leaving' ? (
        <motion.div
          key="envelope"
          role="dialog"
          aria-label="Introduction du site"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-(--w-bg) px-6"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="max-w-xs text-center text-sm tracking-wide text-(--w-text)/70">{message}</p>
          <button
            type="button"
            onClick={open}
            aria-label={`Ouvrir l’enveloppe de ${names} pour découvrir leur site de mariage`}
            className="relative aspect-3/2 w-[min(88vw,26rem)] cursor-pointer rounded-md [perspective:1200px] focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-(--w-accent)"
          >
            <span className="absolute inset-0 rounded-md bg-(--w-secondary) shadow-xl" />
            <motion.span
              className="absolute inset-x-[7%] top-[6%] bottom-[10%] z-10 flex items-start justify-center rounded-sm bg-white pt-[10%] shadow"
              animate={{ y: opening ? '-42%' : '0%' }}
              transition={{ duration: 0.9, delay: 0.55, ease: 'easeInOut' }}
            >
              <span className="font-(family-name:--w-heading) text-lg text-(--w-primary)">{names}</span>
            </motion.span>
            <span
              className="absolute inset-0 z-20 rounded-md bg-(--w-secondary) brightness-95"
              style={{ clipPath: 'polygon(0 0, 50% 56%, 100% 0, 100% 100%, 0 100%)' }}
            />
            <span className="absolute inset-x-0 bottom-[9%] z-30 text-center font-(family-name:--w-heading) text-2xl font-semibold text-(--w-primary)">
              {names}
            </span>
            <motion.span
              className={`absolute inset-x-0 top-0 h-[56%] origin-top bg-(--w-secondary) brightness-110 ${flapBehind ? 'z-5' : 'z-30'}`}
              style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}
              animate={{ rotateX: opening ? 180 : 0 }}
              transition={{ duration: 0.7, ease: 'easeInOut' }}
            />
            <motion.span
              className="absolute top-[56%] left-1/2 z-40 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-(--w-accent) text-white shadow-md"
              animate={{ opacity: opening ? 0 : 1, scale: opening ? 0.6 : 1 }}
              transition={{ duration: 0.3 }}
            >
              <Heart className="size-5 fill-current" aria-hidden />
            </motion.span>
          </button>
          <button
            type="button"
            onClick={onOpened}
            className="rounded-full px-4 py-2 text-sm text-(--w-text)/70 underline underline-offset-4 hover:text-(--w-text)"
          >
            Passer l’animation
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
