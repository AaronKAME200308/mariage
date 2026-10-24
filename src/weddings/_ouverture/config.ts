export interface OuvertureConfig {
  /** Deux initiales du monogramme du sceau. Par défaut : initiales des prénoms du mariage. */
  initiales: [string, string] | null
  /** Petite ligne au-dessus des noms. */
  formule: string
  /** Ligne sous les noms. */
  invitation: string
  /** Heure affichée sur la carte (ex. « Quatre heures de l’après-midi »). Par défaut : heure du premier événement. */
  heure: string | null
  /** Lieu affiché sur la carte. Par défaut : lieu du premier événement. */
  lieu: string | null
  /** Ville / complément affiché sous le lieu. */
  ville: string | null
  /** Grands chiffres pâles JJ MM AA en filigrane sur la carte. */
  filigrane: boolean
  indice: string
  boutonEntrer: string
  boutonPasser: string
  /** Si true, l'ouverture suit le réglage « enveloppe d'introduction » de Personnalisation. */
  suivreReglageAdmin: boolean
  couleurs: {
    fond: string
    enveloppe: string
    enveloppeClair: string
    carte: string
    encre: string
    cire: string
    cireClair: string
    cireOmbre: string
    doublureClair: string
    doublureSombre: string
  }
}

/** Thème Royal Ascot : enveloppe noire, carte ivoire, cire blanc nacré, doublure pied-de-poule. */
export const CONFIG_PAR_DEFAUT: OuvertureConfig = {
  initiales: null,
  formule: 'Ensemble avec leurs familles',
  invitation: 'vous invitent à leur mariage',
  heure: null,
  lieu: null,
  ville: null,
  filigrane: true,
  indice: 'Touchez le sceau',
  boutonEntrer: 'Entrer',
  boutonPasser: 'Passer',
  suivreReglageAdmin: false,
  couleurs: {
    fond: '#0b0b0c',
    enveloppe: '#141414',
    enveloppeClair: '#222222',
    carte: '#f6f2ea',
    encre: '#141414',
    cire: '#d9d4c8',
    cireClair: '#ffffff',
    cireOmbre: '#9a9488',
    doublureClair: '#f4f1ea',
    doublureSombre: '#141414',
  },
}
