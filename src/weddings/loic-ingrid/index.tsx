/**
 * MODÈLE de page de mariage. Ne pas modifier ce dossier : copiez-le avec
 *   npm run nouveau-mariage -- <slug>
 * puis éditez src/weddings/<slug>/. Chaque section est un fichier dans sections/ :
 * réordonnez, supprimez ou ajoutez des sections simplement ici.
 */
import { Intro, Musique, useSite } from '../_kit'
import Hero from './sections/Hero'
import Histoire from './sections/Histoire'
import Programme from './sections/Programme'
import Galerie from './sections/Galerie'
import Rsvp from './sections/Rsvp'
import Cadeaux from './sections/Cadeaux'
import LivreOr from './sections/LivreOr'
import Pied from './sections/Pied'
import Lieu from './sections/Lieux';
import Tenue from './sections/Tenue';

export default function Page() {
  const { wedding, names } = useSite()
  return (
    <div className="loic-ingrid">
      <Intro />
      <Hero wedding={wedding} names={names} />
      <Histoire />
      <Programme />
      <Lieu />
      <Galerie />
      <Tenue />
      <Rsvp />
      <Cadeaux />
      <LivreOr />
      <Pied />
      <Musique />
    </div>
  )
}