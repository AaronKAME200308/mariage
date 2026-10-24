import { useEffect, useState } from 'react'
import { publicUrl } from '@/lib/storage'
import { formatDate } from '@/lib/utils'
import type { SiteContent } from '@/lib/siteConfig'
import type { PublicWedding } from '@/types/domain'

export function useCountdown(targetIso: string | null) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!targetIso) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [targetIso])
  if (!targetIso) return null
  const diff = new Date(targetIso).getTime() - now
  if (Number.isNaN(diff)) return null
  if (diff <= 0) return { done: true as const }
  const s = Math.floor(diff / 1000)
  return {
    done: false as const,
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  }
}

export function SiteHero({ wedding, content, embedded }: { wedding: PublicWedding['wedding']; content: SiteContent; embedded?: boolean }) {
  const countdown = useCountdown(wedding.wedding_date)
  const photo = publicUrl('image', wedding.hero_image_path)
  const units: Array<[string, number]> = countdown && !countdown.done
    ? [['jours', countdown.days], ['heures', countdown.hours], ['minutes', countdown.minutes], ['secondes', countdown.seconds]]
    : []

  return (
    <header className={`relative isolate flex items-center justify-center overflow-hidden bg-(--w-primary) px-6 text-center text-white ${embedded ? 'min-h-[30rem] py-16' : 'min-h-dvh py-24'}`}>
      {photo && <img src={photo} alt="" className="absolute inset-0 -z-20 size-full object-cover" />}
      <div className="absolute inset-0 -z-10 bg-black/45" />
      <div className="max-w-3xl">
        <p className="text-sm tracking-[0.35em] uppercase text-(--w-accent)">{content.heroTagline}</p>
        <h1 className="mt-6 text-6xl leading-none font-semibold sm:text-8xl">
          {wedding.partner_one_name}
          <span className="mx-3 text-(--w-accent)" aria-hidden>&amp;</span>
          <span className="sr-only"> et </span>
          {wedding.partner_two_name}
        </h1>
        {wedding.wedding_date && (
          <p className="mt-6 text-xl">{formatDate(wedding.wedding_date, wedding.timezone)}</p>
        )}
        {content.heroMessage && <p className="mx-auto mt-4 max-w-xl text-white/85">{content.heroMessage}</p>}

        {countdown && !countdown.done && (
          <dl role="timer" aria-label="Compte à rebours avant le mariage" className="mt-10 grid grid-cols-4 gap-3 sm:gap-6">
            {units.map(([label, value]) => (
              <div key={label} className="flex flex-col rounded-2xl bg-white/10 px-2 py-4 backdrop-blur-sm">
                <dt className="order-2 text-xs tracking-wider uppercase text-white/75">{label}</dt>
                <dd className="font-(family-name:--w-heading) text-4xl font-semibold sm:text-5xl">{String(value).padStart(2, '0')}</dd>
              </div>
            ))}
          </dl>
        )}
        {countdown?.done && (
          <p className="mt-10 font-(family-name:--w-heading) text-3xl">Merci d’avoir partagé ce jour avec nous.</p>
        )}
      </div>
    </header>
  )
}
