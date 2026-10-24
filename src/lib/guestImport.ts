import { parseCsv } from '@/lib/csv'

export interface ImportRow {
  line: number
  full_name: string
  phone: string | null
  email: string | null
  allowed_companions: number
  notes: string | null
  status: 'ok' | 'error' | 'duplicate'
  message?: string
}

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/[^a-z]/g, '')
export const normalizeName = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase()

const ALIASES: Record<string, string[]> = {
  name: ['nom', 'nomcomplet', 'name', 'fullname', 'invite'],
  phone: ['telephone', 'tel', 'phone', 'mobile'],
  email: ['email', 'mail', 'courriel', 'adresseemail'],
  companions: ['accompagnants', 'accompagnantsautorises', 'companions', 'allowedcompanions', 'nbaccompagnants'],
  notes: ['notes', 'note', 'commentaire', 'remarque'],
}

export const MAX_IMPORT_ROWS = 2000
export const MAX_IMPORT_BYTES = 1024 * 1024

export class ImportFormatError extends Error {}

/** Valide un CSV d'invités et repère les doublons (dans le fichier et avec les invités existants). */
export function analyzeGuestCsv(text: string, existingNames: Set<string>): ImportRow[] {
  const table = parseCsv(text)
  if (table.length < 2) throw new ImportFormatError('Le fichier doit contenir une ligne d’en-têtes et au moins un invité.')
  if (table.length - 1 > MAX_IMPORT_ROWS) throw new ImportFormatError(`Maximum ${MAX_IMPORT_ROWS} invités par import.`)

  const headers = table[0].map(norm)
  const col = (key: keyof typeof ALIASES) => headers.findIndex((h) => ALIASES[key].includes(h))
  const idx = { name: col('name'), phone: col('phone'), email: col('email'), companions: col('companions'), notes: col('notes') }
  if (idx.name < 0) throw new ImportFormatError('Colonne « Nom » introuvable. Utilisez les en-têtes : Nom, Téléphone, Email, Accompagnants, Notes.')

  const seen = new Set<string>()
  return table.slice(1).map((cells, i): ImportRow => {
    const get = (j: number) => (j >= 0 ? (cells[j] ?? '').trim() : '')
    const base = { line: i + 2, full_name: get(idx.name).replace(/\s+/g, ' '), phone: get(idx.phone) || null, email: get(idx.email).toLowerCase() || null, notes: get(idx.notes) || null }
    const rawCompanions = get(idx.companions)
    const companions = rawCompanions === '' ? 0 : Number(rawCompanions)
    const fail = (message: string): ImportRow => ({ ...base, allowed_companions: 0, status: 'error', message })

    if (!base.full_name) return fail('Nom manquant.')
    if (base.full_name.length > 120) return fail('Nom trop long (120 caractères maximum).')
    if (base.email && (base.email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(base.email))) return fail('Adresse e-mail invalide.')
    if (base.phone && base.phone.length > 30) return fail('Téléphone trop long.')
    if (base.notes && base.notes.length > 1000) return fail('Notes trop longues.')
    if (!Number.isInteger(companions) || companions < 0 || companions > 20) return fail('Accompagnants : entier entre 0 et 20.')

    const key = normalizeName(base.full_name)
    if (existingNames.has(key)) return { ...base, allowed_companions: companions, status: 'duplicate', message: 'Existe déjà dans la liste.' }
    if (seen.has(key)) return { ...base, allowed_companions: companions, status: 'duplicate', message: 'Doublon dans le fichier.' }
    seen.add(key)
    return { ...base, allowed_companions: companions, status: 'ok' }
  })
}
