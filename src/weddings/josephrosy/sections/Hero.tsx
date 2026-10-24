import { Countdown, formatDate, imageUrl, useSite } from '../../_kit'

export default function Hero() {
  const { wedding, names, content } = useSite()
  const photo = imageUrl(wedding.hero_image_path)
  return (
    <header className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden bg-(--w-primary) px-6 py-24 text-center text-white">
      {photo && <img src={photo} alt="" className="absolute inset-0 -z-20 size-full object-cover" />}
      <div className="absolute inset-0 -z-10 bg-black/45" />
      <div className="max-w-3xl">
        {/* Écrivez ici votre propre texte à la place de content.heroTagline si vous le souhaitez */}
        <p className="text-sm tracking-[0.35em] uppercase text-(--w-accent)">{content.heroTagline}</p>
        <h1 className="mt-6 text-6xl font-semibold sm:text-8xl">{names}</h1>
        {wedding.wedding_date && <p className="mt-6 text-xl">{formatDate(wedding.wedding_date, wedding.timezone)}</p>}
        <div className="mt-10"><Countdown /></div>
      </div>
    </header>
  )
}
