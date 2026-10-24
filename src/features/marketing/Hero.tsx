import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { buttonStyles } from '@/components/ui/Button'

/**
 * La photographie du hero se place dans public/hero.jpg (image libre de droits
 * ou dont vous détenez les droits). Sans fichier, un fond dégradé élégant s'affiche.
 */
export function Hero() {
  const reduce = useReducedMotion()
  const [imageOk, setImageOk] = useState(true)
  const rise = (delay: number) =>
    reduce ? {} : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, delay, ease: 'easeOut' as const } }

  return (
    <section className="relative isolate overflow-hidden bg-forest text-ivory">
      {imageOk && (
        <img
          src="/hero.jpg"
          alt=""
          aria-hidden
          onError={() => setImageOk(false)}
          className="absolute inset-0 -z-20 size-full object-cover opacity-60"
        />
      )}
      <div className="absolute inset-0 -z-10 bg-linear-to-b from-forest-900/70 via-forest/60 to-forest-900/90" />
      <div className="mx-auto flex min-h-[78dvh] max-w-6xl flex-col justify-center px-4 py-24 sm:px-6">
        <motion.p {...rise(0)} className="text-sm font-medium uppercase tracking-[0.25em] text-champagne">
          Sites de mariage &amp; gestion des invités
        </motion.p>
        <motion.h1 {...rise(0.1)} className="mt-5 max-w-3xl text-5xl leading-[1.05] font-semibold sm:text-6xl lg:text-7xl">
          Votre histoire d’amour mérite un site unique.
        </motion.h1>
        <motion.p {...rise(0.2)} className="mt-6 max-w-2xl text-lg text-ivory/85">
          Créez un site de mariage à votre image, partagez les informations de votre événement et gérez sereinement
          vos invités grâce à MariamCM.
        </motion.p>
        <motion.div {...rise(0.3)} className="mt-10 flex flex-wrap gap-4">
          <Link to="/#fonctionnalites" className={buttonStyles('primary', 'lg') + ' bg-champagne text-forest-900 hover:bg-champagne/90'}>
            Découvrir les fonctionnalités
          </Link>
          <Link to="/#exemples" className={buttonStyles('secondary', 'lg') + ' border-ivory/40 bg-transparent text-ivory hover:bg-ivory/10 hover:text-ivory'}>
            Voir un exemple de site
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
