import { Countdown, formatDate, useSite } from '../../_kit'

export default function Hero() {
  const { wedding } = useSite()
  return (
    <header id="haut" className="flex min-h-[85dvh] flex-col items-center justify-center bg-(--w-primary) px-6 py-20 text-center text-white">
      <p className="text-sm tracking-[0.4em] uppercase text-(--w-accent)">Nous nous marions</p>
      <h1 className="mt-8 text-7xl leading-none font-semibold sm:text-9xl">Awa</h1>
      <p className="my-2 font-(family-name:--w-heading) text-4xl italic text-(--w-accent)">et</p>
      <h1 className="text-7xl leading-none font-semibold sm:text-9xl" aria-hidden>Jean</h1>
      {wedding.wedding_date && <p className="mt-10 text-xl">{formatDate(wedding.wedding_date, wedding.timezone)} · Douala</p>}
      <div className="mt-10">
        <Countdown>{(v) => (
          <p role="timer" aria-label="Compte à rebours" className="font-(family-name:--w-heading) text-4xl">
            J−{v.days}
          </p>
        )}</Countdown>
      </div>
    </header>
  )
}
