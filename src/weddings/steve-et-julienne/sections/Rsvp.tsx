import { formatDate, formatTime, RsvpForm, useSite } from '../../_kit'
import Bande from '../decor/Bande'

export default function Rsvp() {
  const { data, wedding, settings } = useSite()
  const ceremonie = data.events[0]
  const limite = settings.rsvp.deadline ? formatDate(settings.rsvp.deadline, wedding.timezone) : ''
  const phrase = ceremonie?.starts_at
    ? `Nous échangerons nos vœux le ${formatDate(ceremonie.starts_at, wedding.timezone)} à ${formatTime(ceremonie.starts_at, wedding.timezone)}${ceremonie.venue_name ? `, ${ceremonie.venue_name}` : ''}.`
    : ''
  return (
    <section id="rsvp" className="pb-6">
      <Bande titre="R.S.V.P" graine={9} hauteur="h-48" />
      <p className="sj-corps mx-auto mt-4 max-w-xs px-6 text-center">
        {phrase} {limite ? `Merci de nous répondre avant le ${limite} afin de réserver votre place.` : 'Merci de nous répondre afin de réserver votre place.'}
      </p>
      <RsvpForm title="Répondre" intro="" />
    </section>
  )
}
