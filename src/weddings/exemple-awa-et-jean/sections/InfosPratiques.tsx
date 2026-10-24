import { Section } from '../../_kit'

/** Section 100 % propre à ce mariage : n'existe pas dans le modèle. */
const INFOS = [
  ['Hébergement', 'Une sélection d’hôtels à Bonanjo est disponible : demandez-nous la liste.'],
  ['Transport', 'Une navette partira de l’hôtel à 15 h 00 vers la salle de réception.'],
  ['Enfants', 'Les enfants sont les bienvenus : une garderie sera sur place.'],
] as const

export default function InfosPratiques() {
  return (
    <Section id="infos" title="Infos pratiques">
      <dl className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-3">
        {INFOS.map(([t, d]) => (
          <div key={t} className="text-center">
            <dt className="text-2xl text-(--w-primary)">{t}</dt>
            <dd className="mt-2 text-sm text-(--w-text)/80">{d}</dd>
          </div>
        ))}
      </dl>
    </Section>
  )
}
