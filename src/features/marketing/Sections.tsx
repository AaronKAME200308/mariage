import { motion, useReducedMotion } from 'motion/react'
import { MapPin, CalendarDays } from 'lucide-react'
import { DEMO_WEDDINGS, FEATURES, STEPS } from './content'

function SectionHeading({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-champagne-700">{eyebrow}</p>
      <h2 className="mt-3 text-4xl font-semibold text-forest sm:text-5xl">{title}</h2>
      {intro && <p className="mt-4 text-ink-soft">{intro}</p>}
    </div>
  )
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const reduce = useReducedMotion()
  if (reduce) return <>{children}</>
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  )
}

export function Features() {
  return (
    <section id="fonctionnalites" className="scroll-mt-20 px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Fonctionnalités"
          title="Tout pour un mariage serein"
          intro="Une seule plateforme pour présenter votre mariage, organiser vos invités et accueillir chacun le jour J."
        />
        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }, i) => (
            <li key={title}>
              <Reveal delay={(i % 3) * 0.06}>
                <article className="h-full rounded-2xl border border-forest/10 bg-white p-6 shadow-soft">
                  <span className="grid size-11 place-items-center rounded-full bg-sage-100 text-forest">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-2xl font-semibold text-forest">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{description}</p>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function HowItWorks() {
  return (
    <section id="comment-ca-marche" className="scroll-mt-20 bg-sage-100 px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="Comment ça marche" title="Trois étapes, de la préparation au jour J" />
        <ol className="mt-14 grid gap-8 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title}>
              <Reveal delay={i * 0.1}>
                <div className="relative h-full rounded-2xl bg-ivory p-8 shadow-soft">
                  <span className="font-serif text-6xl font-semibold text-champagne" aria-hidden>
                    {i + 1}
                  </span>
                  <h3 className="mt-2 text-2xl font-semibold text-forest">
                    <span className="sr-only">Étape {i + 1} : </span>
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft">{step.description}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export function Examples() {
  return (
    <section id="exemples" className="scroll-mt-20 px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Exemples de mariages"
          title="Chaque mariage a son identité"
          intro="Aperçus de démonstration avec des données fictives, pour illustrer la diversité des univers possibles."
        />
        <ul className="mt-14 grid gap-6 md:grid-cols-3">
          {DEMO_WEDDINGS.map((w, i) => (
            <li key={w.couple}>
              <Reveal delay={i * 0.08}>
                <article className="overflow-hidden rounded-2xl border border-forest/10 bg-white shadow-soft">
                  <div
                    className="relative grid h-44 place-items-center text-center"
                    style={{ background: `linear-gradient(135deg, ${w.palette[0]}, ${w.palette[1]})` }}
                  >
                    <span className="absolute top-3 right-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-forest">
                      Démonstration
                    </span>
                    <p className="font-serif text-3xl font-semibold text-white drop-shadow">{w.couple}</p>
                  </div>
                  <div className="space-y-2 p-5 text-sm text-ink-soft">
                    <p className="flex items-center gap-2"><CalendarDays className="size-4 text-champagne-700" aria-hidden />{w.date}</p>
                    <p className="flex items-center gap-2"><MapPin className="size-4 text-champagne-700" aria-hidden />{w.place}</p>
                  </div>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
