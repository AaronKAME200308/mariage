import { grain } from './decor/grain'

export interface ContenuCarte {
  formule: string
  noms: [string, string]
  invitation: string
  mois: string
  jour: string
  annee: string
  filigrane: [string, string, string] | null
  heure: string
  lieu: string
  ville: string
}

/**
 * Carte ivoire qui sort de l'enveloppe. Les tailles sont en `cqw` (unités du conteneur) : le texte
 * suit exactement la largeur de la carte, qu'elle soit petite dans l'enveloppe ou agrandie plein écran.
 * C'est une animation d'entrée du site : rien ici ne se télécharge, ne se partage et ne s'envoie.
 */
export default function Carte({ c, carte, encre, devant }: { c: ContenuCarte; carte: string; encre: string; devant: boolean }) {
  const serif = "'Playfair Display', Georgia, serif"
  const script = "'Cormorant Garamond', Georgia, serif"
  const sans = "'Montserrat', system-ui, sans-serif"
  const petit = { fontFamily: sans, fontSize: '2.7cqw', letterSpacing: '0.2em', textTransform: 'uppercase' as const }
  return (
    <div
      data-p="carte"
      className="absolute top-[4%] left-[5%] h-[92%] w-[90%] overflow-hidden"
      style={{
        containerType: 'inline-size', zIndex: devant ? 8 : 2, backgroundColor: carte, color: encre,
        backgroundImage: `${grain('sombre', 0.35)}, radial-gradient(ellipse at 30% 20%, rgb(255 255 255 / .7), transparent 60%)`,
        backgroundSize: '240px, 100% 100%',
        boxShadow: '0 1px 2px rgb(0 0 0 / .25), 0 8px 20px rgb(0 0 0 / .25)',
        borderRadius: '1px',
      }}
    >
      {c.filigrane && (
        <div aria-hidden className="absolute top-[3%] right-[7%] text-right" style={{ fontFamily: serif, fontSize: '30cqw', lineHeight: 0.92, color: 'rgb(20 20 20 / .06)' }}>
          {c.filigrane.map((n, i) => <div key={i}>{n}</div>)}
        </div>
      )}
      <div aria-hidden className="absolute top-[40%] right-[6%] h-[34%] w-px" style={{ background: 'rgb(20 20 20 / .25)' }} />

      <div className="absolute inset-x-0 top-[17%] px-[10%] text-center">
        <p style={{ ...petit, fontSize: '2.5cqw', lineHeight: 1.7 }}>{c.formule}</p>
        <p className="mt-[6cqw]" style={{ fontFamily: serif, fontSize: '11.5cqw', lineHeight: 1.05, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{c.noms[0]}</p>
        <p style={{ fontFamily: script, fontStyle: 'italic', fontSize: '7cqw', lineHeight: 1.1, margin: '0.8cqw 0' }}>et</p>
        <p style={{ fontFamily: serif, fontSize: '11.5cqw', lineHeight: 1.05, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{c.noms[1]}</p>
        <p className="mt-[6cqw]" style={{ ...petit, fontSize: '2.5cqw', lineHeight: 1.7 }}>{c.invitation}</p>

        <p className="mt-[6cqw]" style={{ ...petit, fontSize: '3cqw' }}>{c.mois}</p>
        <p style={{ fontFamily: serif, fontSize: '17cqw', lineHeight: 1, margin: '1cqw 0' }}>{c.jour}</p>
        <p style={{ ...petit, fontSize: '3cqw' }}>{c.annee}</p>

        {(c.heure || c.lieu) && (
          <p className="mt-[5cqw]" style={{ ...petit, fontSize: '2.4cqw', lineHeight: 1.9 }}>
            {c.heure}
            {c.lieu && <><br />{c.lieu}</>}
            {c.ville && <><br />{c.ville}</>}
          </p>
        )}
      </div>
    </div>
  )
}
