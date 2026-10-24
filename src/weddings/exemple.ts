import type { PublicWedding } from '@/types/domain'

/** Données FICTIVES pour visualiser l'exemple sans base de données (route /exemples/mariage). */
export const EXAMPLE_SLUG = 'exemple-awa-et-jean'

const inMonths = (n: number) => { const d = new Date(); d.setMonth(d.getMonth() + n); d.setHours(10, 0, 0, 0); return d }
const at = (base: Date, h: number, m = 0) => { const d = new Date(base); d.setHours(h, m, 0, 0); return d.toISOString() }

export function exampleData(): PublicWedding {
  const day = inMonths(3)
  return {
    wedding: {
      id: 'exemple', slug: EXAMPLE_SLUG, partner_one_name: 'Awa', partner_two_name: 'Jean', wedding_date: at(day, 11),
      timezone: 'Africa/Douala', status: 'published',
      theme: { primary: '#5B2A3C', secondary: '#E8CFC4', background: '#FBF6F2', accent: '#B8863B', text: '#2B2326', headingFont: 'playfair' },
      content: {}, settings: { envelope: { enabled: false } }, hero_image_path: null, music_path: null,
    },
    milestones: [
      { id: 'm1', title: 'La rencontre', description: 'Un amphi, une erreur de salle, un premier fou rire.', happened_on: '2015-10-05', image_path: null },
      { id: 'm2', title: 'Le premier voyage', description: 'Kribi, une tente et beaucoup trop de pluie.', happened_on: '2019-08-12', image_path: null },
      { id: 'm3', title: 'La demande', description: 'Sur la terrasse de ses parents, avec toute la famille cachée derrière.', happened_on: '2025-12-24', image_path: null },
    ],
    events: [
      { id: 'e1', kind: 'civil_ceremony', title: 'Mariage civil', starts_at: at(day, 11), ends_at: null, venue_name: 'Mairie de Douala 1er', address: 'Bonanjo, Douala', description: null, map_url: null, dress_code: 'Élégant' },
      { id: 'e2', kind: 'religious_ceremony', title: 'Cérémonie religieuse', starts_at: at(day, 14), ends_at: null, venue_name: 'Cathédrale Saints-Pierre-et-Paul', address: 'Bonanjo, Douala', description: null, map_url: null, dress_code: 'Couleurs chaudes' },
      { id: 'e3', kind: 'reception', title: 'Réception', starts_at: at(day, 17), ends_at: null, venue_name: 'Salle Les Jardins', address: 'Bonapriso, Douala', description: 'Dîner et soirée dansante.', map_url: null, dress_code: null },
    ],
    gallery: [],
    gifts: [
      { id: 'g1', name: 'Voyage de noces', description: 'Une semaine à Zanzibar.', image_path: null, suggested_amount: null, currency: 'XAF', external_url: null, status: 'available' },
      { id: 'g2', name: 'Service à café', description: null, image_path: null, suggested_amount: 45000, currency: 'XAF', external_url: null, status: 'available' },
    ],
    guestbook: [
      { id: 'b1', author_name: 'Tante Marie', message: 'Tous mes vœux de bonheur, mes chéris !', created_at: new Date().toISOString() },
    ],
  }
}
