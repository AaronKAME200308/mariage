/**
 * EXEMPLE : mariage fictif d'Awa & Jean (aucune vraie personne).
 * Toutes les sections sont sur UNE seule page qui défile ; chaque section vit dans son fichier.
 * Voir cette page : http://localhost:5173/exemples/mariage
 */
import { Intro, Musique } from '../_kit'
import './style.css'
import Hero from './sections/Hero'
import Histoire from './sections/Histoire'
import Programme from './sections/Programme'
import InfosPratiques from './sections/InfosPratiques'
import Galerie from './sections/Galerie'
import Rsvp from './sections/Rsvp'
import Cadeaux from './sections/Cadeaux'
import LivreOr from './sections/LivreOr'
import Pied from './sections/Pied'
import Menu from './sections/Menu'

export default function Page() {
  return (
    <>
      <Intro />
      <Menu />
      <Hero />
      <Histoire />
      <Programme />
      <InfosPratiques />
      <Galerie />
      <Rsvp />
      <Cadeaux />
      <LivreOr />
      <Pied />
      <Musique />
    </>
  )
}
