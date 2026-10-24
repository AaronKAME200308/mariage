/**
 * MODÈLE de page de mariage. Ne pas modifier ce dossier : copiez-le avec
 *   npm run nouveau-mariage -- <slug>
 * puis éditez src/weddings/<slug>/. Chaque section est un fichier dans sections/ :
 * réordonnez, supprimez ou ajoutez des sections simplement ici.
 */
import { Intro, Musique } from '../_kit'
import Hero from './sections/Hero'
import Histoire from './sections/Histoire'
import Programme from './sections/Programme'
import Galerie from './sections/Galerie'
import Rsvp from './sections/Rsvp'
import Cadeaux from './sections/Cadeaux'
import LivreOr from './sections/LivreOr'
import Pied from './sections/Pied'

export default function Page() {
  return (
    <>
      <Intro />
      <Hero />
      <Histoire />
      <Programme />
      <Galerie />
      <Rsvp />
      <Cadeaux />
      <LivreOr />
      <Pied />
      <Musique />
    </>
  )
}
