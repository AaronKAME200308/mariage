import { formatDate, imageUrl, useSite } from '../../_kit'
import Monogramme from '../decor/Monogramme'

function partiesDate(iso: string, timeZone: string) {
  const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('fr-FR', { timeZone, ...o }).format(new Date(iso))
  return { mois: f({ month: 'long' }).toUpperCase(), jour: f({ day: 'numeric' }), annee: f({ year: 'numeric' }) }
}

export default function Hero() {
  const { wedding } = useSite()
  const photo = imageUrl(wedding.hero_image_path)
  const d = wedding.wedding_date ? partiesDate(wedding.wedding_date, wedding.timezone) : null
  return (
    <header id="haut" className="pb-10 text-center">
      <p className="sj-titre pt-8 text-xl">Le mariage de</p>
      <div className="relative mx-3 mt-4 aspect-[4/4.6] overflow-hidden bg-(--sj-sky)">
        {photo
          ? <img src={photo} alt="" className="absolute inset-0 size-full object-cover" />
          : <div aria-hidden className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 25% 25%, rgb(255 255 255 / .5), transparent 45%), linear-gradient(180deg, #3f78c0, #78a8e2)' }} />}
        <h1 className="sj-noms absolute inset-x-0 top-6 text-3xl text-white">
          {wedding.partner_one_name}
          <span className="sj-script my-1 block text-3xl italic" aria-hidden>et</span>
          <span className="sr-only"> et </span>
          {wedding.partner_two_name}
        </h1>
      </div>
      <Monogramme className="relative z-10 -mt-14" />
      {d && (
        <p className="mt-4 flex items-center justify-center gap-3 text-lg">
          <span className="sj-titre border-y-2 border-(--sj-blue) px-3 py-1 text-base">{d.mois}</span>
          <span className="sj-titre text-3xl">{d.jour}</span>
          <span className="sj-titre border-y-2 border-(--sj-blue) px-3 py-1 text-base">{d.annee}</span>
          <span className="sr-only">{formatDate(wedding.wedding_date, wedding.timezone)}</span>
        </p>
      )}
      <p className="sj-corps mx-auto mt-6 max-w-xs px-6 text-(--sj-blue)">
        « Il y a un temps pour tout, un temps pour toute chose sous les cieux. »
        <span className="block font-semibold">Ecclésiaste 3 : 1</span>
      </p>
    </header>
  )
}
