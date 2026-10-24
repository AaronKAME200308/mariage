/**
 * Page de Steve & Julienne. Une seule page qui défile, une section par fichier (sections/),
 * les éléments décoratifs réutilisables sont dans decor/. Palette et polices : style.css.
 * Aperçu sans base de données : http://localhost:5173/exemples/steve-et-julienne
 */
import { Intro, Musique } from '../_kit'
import './style.css'
import Hero from './sections/Hero'
import Histoire from './sections/Histoire'
import Programme from './sections/Programme'
import Details from './sections/Details'
import Galerie from './sections/Galerie'
import Rsvp from './sections/Rsvp'
import Cadeaux from './sections/Cadeaux'
import LivreOr from './sections/LivreOr'
import Pied from './sections/Pied'

export default function Page() {
  return (
    <div className="steve-julienne min-h-dvh">
      <Intro />
      <div className="sj-colonne">
        <Hero />
        <Histoire />
        <Programme />
        <Details />
        <Galerie />
        <Rsvp />
        <Cadeaux />
        <LivreOr />
        <Pied />
      </div>
      <Musique />
    </div>
  )
}
